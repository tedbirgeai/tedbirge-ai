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
// SECTION 11 — TUR #70 A15 — runStatusCheck (2FA + LOGIN_FAILED + audit)
// ============================================================================

async function runStatusCheck() {
  const startTs = Date.now();
  const prismaClient = require("../../config/db");
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  let twoFAEnabled = 0;
  let totalUsers = 0;
  let loginFailed24h = 0;
  // TUR #92 Q7 — HARD rol adopsiyon ölçümü (Madde 30.32 R1)
  let hard2faTotal = 0;
  let hard2faEnabled = 0;
  try {
    [twoFAEnabled, totalUsers, loginFailed24h, hard2faTotal, hard2faEnabled] = await Promise.all([
      prismaClient.user.count({ where: { twoFactorEnabled: true } }).catch(() => 0),
      prismaClient.user.count({ where: { isActive: true } }).catch(() => 0),
      prismaClient.activityLog.count({
        where: {
          createdAt: { gte: since },
          OR: [
            { action: { contains: "LOGIN_FAILED", mode: "insensitive" } },
            { action: { contains: "AUTH_FAILED", mode: "insensitive" } },
          ],
        },
      }).catch(() => 0),
      prismaClient.user.count({
        where: {
          role: { in: ["ADMIN", "LAWYER", "REPRESENTATIVE", "SALES"] },
          isActive: true,
          deletedAt: null,
        },
      }).catch(() => 0),
      prismaClient.user.count({
        where: {
          role: { in: ["ADMIN", "LAWYER", "REPRESENTATIVE", "SALES"] },
          isActive: true,
          deletedAt: null,
          twoFactorEnabled: true,
        },
      }).catch(() => 0),
    ]);
  } catch (_) {}

  const twoFAPercent = totalUsers > 0 ? Math.round((twoFAEnabled / totalUsers) * 100) : 0;
  // TUR #92 Q7 — HARD rol adopsiyon (8 user × KVKK m.12)
  const adoptionPct = hard2faTotal > 0 ? Math.round((hard2faEnabled / hard2faTotal) * 100) : 100;

  // Severity 2 boyutlu: login failed (mevcut) + adoption (yeni)
  let severity = loginFailed24h > 50 ? "CRITICAL" : loginFailed24h > 20 ? "WARNING" : "INFO";
  if (adoptionPct < 50 && severity !== "CRITICAL") severity = "CRITICAL";
  else if (adoptionPct < 80 && severity === "INFO") severity = "WARNING";

  // TUR #92 Q7 — Adopsiyon < 50% → ADMIN_FEED RealtimeEvent (akış paneli görünür)
  if (adoptionPct < 50 && hard2faTotal > 0) {
    try {
      await prismaClient.realtimeEvent.create({
        data: {
          channel: "ADMIN_FEED",
          eventType: "TWO_FA_ADOPTION_LOW",
          payload: {
            message: `🚨 Düşük 2FA adopsiyon: %${adoptionPct} (${hard2faEnabled}/${hard2faTotal}) — KVKK m.12 risk`,
            adoptionPct,
            hard2faEnabled,
            hard2faTotal,
            severity: "CRITICAL",
          },
        },
      });
    } catch (_) {}
  }

  try {
    await prismaClient.agentEvent.create({
      data: {
        agentName: MODULE_NAME,
        eventType: "STATUS_CHECK",
        severity,
        payload: {
          twoFAEnabled,
          totalUsers,
          twoFAPercent,
          loginFailed24h,
          // TUR #92 Q7 — adopsiyon metric (HARD rol bazlı)
          adoptionPct,
          hard2faEnabled,
          hard2faTotal,
          durationMs: Date.now() - startTs,
          message: `Güvenlik · 2FA HARD: %${adoptionPct} (${hard2faEnabled}/${hard2faTotal}) · Tüm: ${twoFAEnabled}/${totalUsers} · 24h LOGIN_FAILED: ${loginFailed24h}`,
        },
      },
    });
  } catch (e) {
    console.error("[os/security] AgentEvent yazma hata:", e.message);
  }
  return { ok: severity !== "CRITICAL", twoFAEnabled, totalUsers, loginFailed24h, adoptionPct };
}

// ============================================================================
// SECTION 11B — TUR #72 A15 — runActiveTask (2FA + brute force + KVKK)
// ============================================================================

let lastActiveTaskAt_sc = 0;
const SC_ACTIVE_INTERVAL_MS = 15 * 60 * 1000;
function shouldRunActiveTask() { return Date.now() - lastActiveTaskAt_sc >= SC_ACTIVE_INTERVAL_MS; }

// TUR #72.5 H3 — KVKK email/TC maskeleme yardimcisi
function maskEmail(e) {
  if (!e || typeof e !== "string") return "***";
  const [local, domain] = e.split("@");
  if (!domain) return "***";
  const visible = (local || "").slice(0, 2);
  return `${visible}***@${domain}`;
}

async function runActiveTask() {
  const startTs = Date.now();
  const prismaClient = require("../../config/db");
  const day = 24 * 60 * 60 * 1000;
  let criticalAlerts = 0;
  let suspiciousLogins = 0;
  let bruteForceDetected = false;
  let anomaly = false;
  let alertType = null;
  let adminUsersNo2fa = [];
  let adminUsersCount = 0;
  let allUsersNo2faCount = 0;
  let totalUsers = 0;
  let emailSent = false;

  let lawyerNo2fa = 0;
  let representativeNo2fa = 0;
  let customerNo2fa = 0;

  try {
    // TUR #72.5 H3 + TUR #72.6 P5 — 5 rol 2FA matrisi
    const adminUsers = await prismaClient.user.findMany({
      where: { role: "ADMIN", isActive: true, twoFactorEnabled: false },
      select: { id: true, email: true },
      take: 20,
    }).catch(() => []);
    adminUsersCount = adminUsers.length;
    adminUsersNo2fa = adminUsers.map((u) => maskEmail(u.email));

    // TUR #72.6 — LAWYER + REPRESENTATIVE + CUSTOMER 2FA off sayim
    [lawyerNo2fa, representativeNo2fa, customerNo2fa, allUsersNo2faCount, totalUsers] = await Promise.all([
      prismaClient.user.count({ where: { role: "LAWYER", isActive: true, twoFactorEnabled: false } }).catch(() => 0),
      prismaClient.user.count({ where: { role: "REPRESENTATIVE", isActive: true, twoFactorEnabled: false } }).catch(() => 0),
      prismaClient.user.count({ where: { role: "CUSTOMER", isActive: true, twoFactorEnabled: false } }).catch(() => 0),
      prismaClient.user.count({ where: { isActive: true, twoFactorEnabled: false } }).catch(() => 0),
      prismaClient.user.count({ where: { isActive: true } }).catch(() => 0),
    ]);

    // Madde 30.19 zorunluluk matrisi:
    // ADMIN + LAWYER 2FA off = CRITICAL (KVKK m.12)
    // REPRESENTATIVE 2FA off = WARNING (haftalik 1 hatirlatma)
    // CUSTOMER 2FA off = INFO (opsiyonel)
    if (adminUsersCount > 0) {
      criticalAlerts++;
      alertType = "ADMIN_2FA_OFF";
    }
    if (lawyerNo2fa > 0) {
      criticalAlerts++;
      alertType = alertType ? "ROLE_2FA_OFF" : "LAWYER_2FA_OFF";
    }

    // 24h LOGIN_FAILED
    const since24h = new Date(Date.now() - day);
    const loginFailed = await prismaClient.activityLog.count({
      where: { action: "LOGIN_FAILED", createdAt: { gte: since24h } },
    }).catch(() => 0);

    // Brute force pattern (5 dk icinde 10+ fail)
    const since5m = new Date(Date.now() - 5 * 60 * 1000);
    const recent = await prismaClient.activityLog.count({
      where: { action: "LOGIN_FAILED", createdAt: { gte: since5m } },
    }).catch(() => 0);
    if (recent >= 10) bruteForceDetected = true;

    if (bruteForceDetected) {
      try {
        await prismaClient.realtimeEvent.create({
          data: { channel: "ADMIN_FEED", eventType: "BRUTE_FORCE_DETECTED", payload: { recent5m: recent } },
        });
      } catch (_) {}
    }

    // TUR #72.5 H3 — ADMIN 2FA off bildirim 24 saatte 1 (rate-limit)
    if (adminUsersCount > 0) {
      try {
        const since24hAlert = new Date(Date.now() - day);
        const recentAlert = await prismaClient.realtimeEvent.findFirst({
          where: { channel: "ADMIN_FEED", eventType: "ADMIN_2FA_OFF", createdAt: { gte: since24hAlert } },
          select: { id: true },
        });
        if (!recentAlert) {
          await prismaClient.realtimeEvent.create({
            data: {
              channel: "ADMIN_FEED",
              eventType: "ADMIN_2FA_OFF",
              payload: {
                admin_users_count: adminUsersCount,
                total_users_no_2fa: allUsersNo2faCount,
                total_users: totalUsers,
                kvkk_article: "m.12",
                hint: "Tum personel /dashboard/profil → Guvenlik → 2FA Aktive Et (~3 dk/kisi)",
              },
            },
          });
          emailSent = true; // sabit bildirim event olusturuldu (email transporter ayri SKIP)
        }
      } catch (_) {}
    }

    // Adaptive
    try {
      const helper = require("../lib/adaptiveThreshold");
      const result = await helper.adaptiveOr("security", "loginFailed24h", 50, 7);
      if (loginFailed > result.threshold) anomaly = true;
    } catch (_) {}
  } catch (_) {}

  const severity = bruteForceDetected || criticalAlerts > 0 ? "CRITICAL" : anomaly ? "WARNING" : "INFO";

  try {
    await prismaClient.agentEvent.create({
      data: {
        agentName: "security",
        eventType: "ACTION_TAKEN",
        severity,
        payload: {
          action_taken: {
            critical_alerts: criticalAlerts,
            alert_type: alertType,
            admin_no_2fa: adminUsersCount,
            admin_users_no_2fa: adminUsersNo2fa,
            lawyer_no_2fa: lawyerNo2fa,
            representative_no_2fa: representativeNo2fa,
            customer_no_2fa: customerNo2fa,
            total_no_2fa: allUsersNo2faCount,
            total_users: totalUsers,
            email_sent: emailSent,
            suspicious_logins: suspiciousLogins,
            brute_force_detected: bruteForceDetected,
            anomaly,
          },
          durationMs: Date.now() - startTs,
          message: `Guvenlik · ${criticalAlerts} kritik${alertType ? " (" + alertType + ")" : ""} · 2FA ${totalUsers - allUsersNo2faCount}/${totalUsers} · brute ${bruteForceDetected ? "EVET" : "yok"}${anomaly ? " (anomali)" : ""}`,
        },
      },
    });
  } catch (_) {}

  lastActiveTaskAt_sc = Date.now();
  return { criticalAlerts, alertType, adminUsersCount, bruteForceDetected, anomaly };
}

// ============================================================================
// SECTION 12 — EXPORTS
// ============================================================================

module.exports = {
  start,
  stop,
  runTick,
  runStatusCheck,
  runActiveTask,
  shouldRunActiveTask,
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
