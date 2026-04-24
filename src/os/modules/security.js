/**
 * src/os/modules/security.js
 *
 * Tedbirge OS — Modul 6: Guvenlik Monitoru (Security Monitor)
 *
 * AMAC:
 *   Supheli giris denemelerini, rate limit asimlarini, yetkisiz erisimleri ve
 *   olagandisi aktiviteyi izleyip event emit etmek. Tedbirge hassas hukuki
 *   veri (saglik, mali, adli sabika) tutuyor - guvenlik gozcu opsiyonel degil.
 *
 *   21 Nisan 2026'da avukat bilgisi sizintisi yasandi (ticari bir isim
 *   degiskeninin yanlis role aktarilmasi). Bu modul gelecekte boyle olaylari
 *   erken tespit eder: brute force, rate limit ihlali, supheli IP, yetkisiz
 *   kayit erisimi.
 *
 * MIMARI:
 *   - recordLoginAttempt(outcome) - auth middleware cagrilir
 *   - recordRateLimit(identifier, endpoint) - rate limit middleware cagrilir
 *   - recordAccessAnomaly(userId, resource, reason) - diger moduller
 *   - In-memory counter + sliding window (15 dakika)
 *   - Threshold: 5 basarisiz login/15dk -> supheli, 10 rate limit/15dk -> alert
 *   - Event emit: SECURITY_SUSPICIOUS_LOGIN + SECURITY_RATE_LIMIT_HIT
 *   - setInterval 5dk tick: sliding window temizligi + threshold kontrol
 *   - reconciler registerPolicyHandler('security')
 *
 * KAPSAM (Sprint 2 THIN):
 *   - recordLoginAttempt API (auth layer'dan cagrilir)
 *   - recordRateLimit API (rate-limit middleware'dan cagrilir)
 *   - recordAccessAnomaly API (herhangi bir modul cagirir)
 *   - Sliding window counter (15dk IP + 15dk identifier bazinda)
 *   - Threshold detection + event emit
 *   - getStatus() read API
 *   - start() / stop() idempotent
 *
 * KAPSAM DIŞI (Sprint 3+):
 *   - GeoIP lookup (aniden farkli ulkeden giris)
 *   - User-Agent fingerprint (cihaz degisikligi)
 *   - IP blacklist / auto-block integration (Cloudflare WAF)
 *   - SecurityEvent tablosuna persist (simdilik SystemEvent yeterli)
 *   - Escalation chain (suspicious -> admin alert -> SMS)
 *   - ActivityLog'tan pattern detection (JOIN analizi)
 *   - Honeypot endpoint izleme
 *
 * EVENT TYPES (eventBus EVENT_TYPES icinden):
 *   - SECURITY_SUSPICIOUS_LOGIN  ('security:suspicious-login')
 *   - SECURITY_RATE_LIMIT_HIT    ('security:rate-limit-hit')
 *
 * DATA CONTRACTS:
 *   recordLoginAttempt({ identifier, ip, success, userAgent? })
 *   recordRateLimit({ identifier, endpoint, ip })
 *   recordAccessAnomaly({ userId, resource, reason })
 *
 * BAGIMLILIK:
 *   - ./eventBus — bus, EVENT_TYPES
 *   - ./reconciler — registerPolicyHandler
 *
 * KULLANIM:
 *   const security = require('./modules/security');
 *   security.start();
 *
 *   // Auth middleware:
 *   security.recordLoginAttempt({ identifier: 'tedbirge42@gmail.com', ip: '1.2.3.4', success: false });
 *
 *   // Rate limit middleware:
 *   security.recordRateLimit({ identifier: 'user-123', endpoint: '/api/leads', ip: '1.2.3.4' });
 */

"use strict";

const { bus, EVENT_TYPES } = require("../eventBus");
const { registerPolicyHandler } = require("../reconciler");

// ============================================================================
// SECTION 1 — CONSTANTS
// ============================================================================

const MODULE_NAME = "security";

const TICK_INTERVAL_MS = 5 * 60 * 1000;          // 5 dakika (pulse ile ayni)
const WINDOW_MS = 15 * 60 * 1000;                 // 15 dakika sliding window

const SUSPICIOUS_LOGIN_THRESHOLD = 5;             // 5 fail/15dk -> supheli
const RATE_LIMIT_ALERT_THRESHOLD = 10;            // 10 hit/15dk -> alert
const ANOMALY_THRESHOLD = 3;                      // 3 anomaly/15dk -> alert

const EVENT_KINDS = Object.freeze({
  LOGIN_SUCCESS: "login-success",
  LOGIN_FAIL: "login-fail",
  RATE_LIMIT: "rate-limit",
  ACCESS_ANOMALY: "access-anomaly",
});

// ============================================================================
// SECTION 2 — INTERNAL STATE
// ============================================================================

/**
 * Sliding window event log.
 * Array<{ at: number, kind: string, identifier: string, ip?: string, ...meta }>
 * 15 dakikadan eski kayitlar tick'te silinir.
 */
const eventLog = [];

/** Cooldown: ayni identifier icin 15dk icinde 1 alert (spam koruma) */
const alertCooldown = new Map();

let tickTimer = null;
let isRunning = false;
let totalTicks = 0;
let totalEvents = 0;
let alertsEmitted = 0;

// ============================================================================
// SECTION 3 — RECORDING API
// ============================================================================

/**
 * Login denemesi kayit. Auth middleware cagiracak.
 * @param {object} p - { identifier, ip, success, userAgent? }
 */
function recordLoginAttempt(p) {
  if (!p?.identifier) return;
  eventLog.push({
    at: Date.now(),
    kind: p.success ? EVENT_KINDS.LOGIN_SUCCESS : EVENT_KINDS.LOGIN_FAIL,
    identifier: p.identifier,
    ip: p.ip || null,
    userAgent: p.userAgent || null,
  });
  totalEvents++;
}

/**
 * Rate limit tetiklenmesi. rate-limit middleware cagiracak.
 * @param {object} p - { identifier, endpoint, ip }
 */
function recordRateLimit(p) {
  if (!p?.identifier) return;
  eventLog.push({
    at: Date.now(),
    kind: EVENT_KINDS.RATE_LIMIT,
    identifier: p.identifier,
    endpoint: p.endpoint || null,
    ip: p.ip || null,
  });
  totalEvents++;
}

/**
 * Erisim anomalisi (diger moduller cagirir).
 * Ornek: REPRESENTATIVE baska lead'e bakmaya calisti, LAWYER yetkisi disinda endpoint.
 * @param {object} p - { userId, resource, reason }
 */
function recordAccessAnomaly(p) {
  if (!p?.userId) return;
  eventLog.push({
    at: Date.now(),
    kind: EVENT_KINDS.ACCESS_ANOMALY,
    identifier: p.userId,
    resource: p.resource || null,
    reason: p.reason || null,
  });
  totalEvents++;
}

// ============================================================================
// SECTION 4 — WINDOW CLEANUP
// ============================================================================

/** 15 dakikadan eski kayitlari sil. In-place: eventLog ref degismez. */
function pruneWindow() {
  const cutoff = Date.now() - WINDOW_MS;
  while (eventLog.length > 0 && eventLog[0].at < cutoff) {
    eventLog.shift();
  }
}

// ============================================================================
// SECTION 5 — AGGREGATION
// ============================================================================

/** Son 15dk icinde belirli identifier icin belirli kind sayisi. */
function countByIdentifierAndKind(identifier, kind) {
  const cutoff = Date.now() - WINDOW_MS;
  return eventLog.filter(
    (e) => e.at >= cutoff && e.identifier === identifier && e.kind === kind
  ).length;
}

/** Tum benzersiz identifier'lari cikar (window icindeki). */
function uniqueIdentifiers() {
  const set = new Set();
  for (const e of eventLog) set.add(e.identifier);
  return Array.from(set);
}

// ============================================================================
// SECTION 6 — THRESHOLD DETECTION
// ============================================================================

function isInCooldown(key) {
  const last = alertCooldown.get(key);
  if (!last) return false;
  return Date.now() - last < WINDOW_MS;
}

function markCooldown(key) {
  alertCooldown.set(key, Date.now());
}

async function checkSuspiciousLogins() {
  for (const id of uniqueIdentifiers()) {
    const failCount = countByIdentifierAndKind(id, EVENT_KINDS.LOGIN_FAIL);
    if (failCount >= SUSPICIOUS_LOGIN_THRESHOLD) {
      const cooldownKey = `login-${id}`;
      if (isInCooldown(cooldownKey)) continue;
      markCooldown(cooldownKey);
      alertsEmitted++;

      const lastFail = [...eventLog]
        .reverse()
        .find((e) => e.identifier === id && e.kind === EVENT_KINDS.LOGIN_FAIL);

      await bus.emitOS(EVENT_TYPES.SECURITY_SUSPICIOUS_LOGIN, {
        severity: failCount >= 10 ? "error" : "warning",
        module: MODULE_NAME,
        payload: {
          identifier: id,
          failCount,
          windowMs: WINDOW_MS,
          lastIp: lastFail?.ip || null,
          lastUserAgent: lastFail?.userAgent || null,
          threshold: SUSPICIOUS_LOGIN_THRESHOLD,
        },
      });
    }
  }
}

async function checkRateLimits() {
  for (const id of uniqueIdentifiers()) {
    const count = countByIdentifierAndKind(id, EVENT_KINDS.RATE_LIMIT);
    if (count >= RATE_LIMIT_ALERT_THRESHOLD) {
      const cooldownKey = `ratelimit-${id}`;
      if (isInCooldown(cooldownKey)) continue;
      markCooldown(cooldownKey);
      alertsEmitted++;

      const lastHit = [...eventLog]
        .reverse()
        .find((e) => e.identifier === id && e.kind === EVENT_KINDS.RATE_LIMIT);

      await bus.emitOS(EVENT_TYPES.SECURITY_RATE_LIMIT_HIT, {
        severity: "warning",
        module: MODULE_NAME,
        payload: {
          identifier: id,
          hitCount: count,
          windowMs: WINDOW_MS,
          lastEndpoint: lastHit?.endpoint || null,
          lastIp: lastHit?.ip || null,
          threshold: RATE_LIMIT_ALERT_THRESHOLD,
        },
      });
    }
  }
}

async function checkAnomalies() {
  for (const id of uniqueIdentifiers()) {
    const count = countByIdentifierAndKind(id, EVENT_KINDS.ACCESS_ANOMALY);
    if (count >= ANOMALY_THRESHOLD) {
      const cooldownKey = `anomaly-${id}`;
      if (isInCooldown(cooldownKey)) continue;
      markCooldown(cooldownKey);
      alertsEmitted++;

      await bus.emitOS(EVENT_TYPES.SECURITY_SUSPICIOUS_LOGIN, {
        severity: "warning",
        module: MODULE_NAME,
        payload: {
          identifier: id,
          anomalyCount: count,
          windowMs: WINDOW_MS,
          threshold: ANOMALY_THRESHOLD,
          subtype: "access-anomaly",
        },
      });
    }
  }
}

// ============================================================================
// SECTION 7 — TICK
// ============================================================================

async function runTick() {
  totalTicks++;
  pruneWindow();
  try {
    await checkSuspiciousLogins();
    await checkRateLimits();
    await checkAnomalies();
  } catch (err) {
    console.error("[SECURITY] tick error:", err.message);
  }
  console.log(
    `[SECURITY] tick=${totalTicks} events=${eventLog.length} unique=${uniqueIdentifiers().length} alerts=${alertsEmitted}`
  );
}

// ============================================================================
// SECTION 8 — LIFECYCLE
// ============================================================================

function start() {
  if (isRunning) {
    console.warn("[SECURITY] zaten calisiyor, start cagrisi gormezden gelindi");
    return;
  }
  isRunning = true;
  tickTimer = setInterval(() => {
    runTick().catch((err) => {
      console.error("[SECURITY] unhandled tick error:", err.message);
    });
  }, TICK_INTERVAL_MS);
  console.log(
    `[SECURITY] started: interval ${TICK_INTERVAL_MS / 60000}dk, window ${WINDOW_MS / 60000}dk, fail=${SUSPICIOUS_LOGIN_THRESHOLD}, rl=${RATE_LIMIT_ALERT_THRESHOLD}`
  );
}

function stop() {
  if (!isRunning) return;
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  isRunning = false;
  console.log("[SECURITY] stopped");
}

// ============================================================================
// SECTION 9 — READ API
// ============================================================================

function getStatus() {
  pruneWindow();
  const kindCounts = {};
  for (const k of Object.values(EVENT_KINDS)) {
    kindCounts[k] = eventLog.filter((e) => e.kind === k).length;
  }
  return {
    isRunning,
    totalTicks,
    totalEvents,
    alertsEmitted,
    windowSize: eventLog.length,
    uniqueIdentifiers: uniqueIdentifiers().length,
    kindCounts,
    windowMs: WINDOW_MS,
    tickIntervalMs: TICK_INTERVAL_MS,
  };
}

function resetState() {
  eventLog.length = 0;
  alertCooldown.clear();
  totalTicks = 0;
  totalEvents = 0;
  alertsEmitted = 0;
}

// ============================================================================
// SECTION 10 — RECONCILER POLICY HANDLER
// ============================================================================

async function policyHandler(policy, _prisma) {
  const key = policy?.key;
  if (!key) return { drift: false, action: null };

  switch (key) {
    case "suspicious-login-rate": {
      const count = eventLog.filter((e) => e.kind === EVENT_KINDS.LOGIN_FAIL).length;
      const threshold = parseInt(policy.value, 10) || SUSPICIOUS_LOGIN_THRESHOLD * 3;
      return {
        drift: count >= threshold,
        action: count >= threshold ? "investigate-login-failures" : null,
        details: { windowFailCount: count, threshold },
      };
    }
    case "rate-limit-spam": {
      const count = eventLog.filter((e) => e.kind === EVENT_KINDS.RATE_LIMIT).length;
      const threshold = parseInt(policy.value, 10) || RATE_LIMIT_ALERT_THRESHOLD * 3;
      return {
        drift: count >= threshold,
        action: count >= threshold ? "investigate-rate-limits" : null,
        details: { windowRateLimitCount: count, threshold },
      };
    }
    default:
      return { drift: false, action: null, details: { reason: "unknown key" } };
  }
}

registerPolicyHandler(MODULE_NAME, policyHandler);

// ============================================================================
// SECTION 11 — EXPORTS
// ============================================================================

module.exports = {
  start,
  stop,
  runTick,
  recordLoginAttempt,
  recordRateLimit,
  recordAccessAnomaly,
  getStatus,
  resetState,
  MODULE_NAME,
  TICK_INTERVAL_MS,
  WINDOW_MS,
  SUSPICIOUS_LOGIN_THRESHOLD,
  RATE_LIMIT_ALERT_THRESHOLD,
  ANOMALY_THRESHOLD,
  EVENT_KINDS,
};
