/**
 * src/os/modules/uyapControl.js
 *
 * Tedbirge OS — Modul 13: UYAP Kontrol Orchestrator
 *
 * AMAC:
 *   UYAP (Adalet Bakanligi Ulusal Yargi Agi) entegrasyonunun kontrol katmani.
 *   Tebligat polling, dosya durumu senkron, session yonetimi, deadline
 *   (tebligat + 2 hafta itiraz suresi) takibi. UYAP adapter stub modda
 *   (anlasma bekleniyor) - bu modul de ayni sekilde "contract pending"
 *   durumda calisir ama mimari iskelet Sprint 4'te anlasma bitince hazir.
 *
 *   Neden simdi yaziyoruz:
 *   - Mehmet Bey vizyonu: "UYAP olmazsa olmazimiz"
 *   - Ramazan Abi (canli avukat) UYAP entegrasyon talep etti (21 Nisan)
 *   - Anlasma Sprint 4'te bitecek, modul hazir olsun ki adapter swap'i yeter
 *   - Mimari bos durmayalim - tum event/policy topografyasi bugun netlesir
 *
 * MIMARI:
 *   - UYAPAdapter uzerinden isConfigured kontrolu
 *   - Tick 30dk: tebligat polling (UYAP rate limit dostu)
 *   - pollTebligat() -> adapter.subscribeTebligat veya getCaseStatus
 *   - detectNewTebligat() -> yeni tebligat ID'leri karsilastir
 *   - calculateDeadline() -> tebligat + 2 hafta itiraz suresi
 *   - Deadline approaching threshold: 3 gun kaldiysa warning event
 *   - Event emit: UYAP_TEBLIGAT_RECEIVED (EVENT_TYPES'ta var) +
 *                  UYAP_DOSYA_SYNCED (var) + UYAP_SESSION_EXPIRED (var) +
 *                  'uyap:deadline-approaching' (yeni, string literal)
 *   - Session cache: adapter.authenticate()'den donen token, TTL 8 saat
 *   - reconciler registerPolicyHandler('uyap-control')
 *
 * KAPSAM (Sprint 2 STUB):
 *   - pollTebligat() - adapter.isConfigured false ise "pending" kayit
 *   - Tebligat queue + deadline map (in-memory)
 *   - checkDeadlines() - yaklasan suresi icin event
 *   - Session state tracking (authenticate stub cagrisi)
 *   - Event emit: deadline + session expire (adapter gercek olunca tebligat eklenir)
 *   - start() / stop() idempotent
 *   - getStatus() read API
 *
 * KAPSAM DIŞI (Sprint 4+):
 *   - Gercek UYAP API entegrasyonu (adapter implementation)
 *   - E-imza ile session acma akisi (eimza adapter)
 *   - Bulk dosya sorgu (getDosyalarBatch)
 *   - Tebligat metin extraction (PDF parse + OCR)
 *   - Duruşma takvimi senkron
 *   - Bilirkişi rapor izleme
 *   - Karar yazi ornegi cek
 *
 * EVENT TYPES (EVENT_TYPES'tan):
 *   - UYAP_TEBLIGAT_RECEIVED ('uyap:tebligat-received')
 *   - UYAP_DOSYA_SYNCED      ('uyap:dosya-synced')
 *   - UYAP_SESSION_EXPIRED   ('uyap:session-expired')
 *
 * EVENT TYPES (string literal, EVENT_TYPES'ta yok):
 *   - 'uyap:deadline-approaching'
 *   - 'uyap:control-skipped'
 *
 * DATA CONTRACT (tebligat):
 *   {
 *     id: 'teb-xxx',           // UYAP tebligat ID
 *     dosyaNo: '2024/123',
 *     receivedAt: ISO,
 *     deadline: ISO,           // +14 gun itiraz
 *     type: 'karar'|'dilekce'|'ihtarname'|'other',
 *     status: 'pending'|'reviewed'|'objected'|'expired'
 *   }
 *
 * DATA CONTRACT (session):
 *   {
 *     avukatId: 'av-xxx',
 *     token: 'session-abc',
 *     expiresAt: ISO,           // +8 saat
 *     activatedAt: ISO
 *   }
 *
 * BAGIMLILIK:
 *   - ./adapters/base — getAdapter
 *   - ./eventBus — bus, EVENT_TYPES
 *   - ./reconciler — registerPolicyHandler
 *
 * KULLANIM:
 *   const uyap = require('./modules/uyapControl');
 *   uyap.start();
 *
 *   // Manuel session ac (e-imza ile):
 *   const session = await uyap.openSession('av-ramazan', 'eimza-token');
 *
 *   // Manuel tebligat polling (test):
 *   const result = await uyap.pollTebligat();
 */

"use strict";

const { getAdapter } = require("../adapters/base");
const { bus, EVENT_TYPES } = require("../eventBus");

// ============================================================================
// SECTION 1 — CONSTANTS
// ============================================================================

const MODULE_NAME = "uyap-control";

const TICK_INTERVAL_MS = 30 * 60 * 1000;          // 30 dakika (UYAP rate limit nazik)
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;         // 8 saat
const OBJECTION_PERIOD_DAYS = 14;                   // Tebligat + 2 hafta
const DEADLINE_WARN_DAYS = 3;                       // 3 gun kala alert
const HISTORY_SIZE = 100;

const EVENT_DEADLINE = "uyap:deadline-approaching";
const EVENT_SKIPPED = "uyap:control-skipped";

const TEBLIGAT_TYPES = Object.freeze({
  KARAR: "karar",
  DILEKCE: "dilekce",
  IHTARNAME: "ihtarname",
  OTHER: "other",
});

const TEBLIGAT_STATUS = Object.freeze({
  PENDING: "pending",         // Avukat henuz gormedi
  REVIEWED: "reviewed",       // Avukat okudu
  OBJECTED: "objected",       // Itiraz yazildi
  EXPIRED: "expired",          // Sure gecti, itiraz edilmedi
});

const ADAPTER_KEY = "uyap";

// ============================================================================
// SECTION 2 — INTERNAL STATE
// ============================================================================

/**
 * Tebligat registry: Map<tebligatId, record>
 */
const tebligatRegistry = new Map();

/**
 * Session cache: Map<avukatId, sessionRecord>
 */
const sessionCache = new Map();

/**
 * Deadline warning cooldown: Map<tebligatId, timestamp>
 */
const deadlineCooldown = new Map();

/**
 * Job history ring buffer (polling + sync results)
 */
const jobHistory = [];

let tickTimer = null;
let isRunning = false;
let totalTicks = 0;
let totalTebligat = 0;
let totalDeadlineAlerts = 0;
let totalSessionExpires = 0;
let lastSkipAt = null;

// ============================================================================
// SECTION 3 — HISTORY
// ============================================================================

function recordJob(record) {
  jobHistory.push({ at: new Date().toISOString(), ...record });
  if (jobHistory.length > HISTORY_SIZE) {
    jobHistory.shift();
  }
}

// ============================================================================
// SECTION 4 — SESSION MANAGEMENT
// ============================================================================

/**
 * UYAP session ac. Adapter authenticate stub calisirken NotImplementedError
 * firlar - biz bunu yakalar "contract pending" dondurur.
 * @returns {Promise<{ok: boolean, session?: object, reason?: string}>}
 */
async function openSession(avukatId, token) {
  if (!avukatId || !token) {
    throw new Error("openSession: avukatId + token zorunlu");
  }

  const adapter = getAdapter(ADAPTER_KEY);
  if (!adapter || !adapter.isConfigured?.()) {
    return {
      ok: false,
      reason: "adapter-not-configured",
      note: "UYAP adapter stub modda - anlasma bekleniyor (Sprint 4)",
    };
  }

  try {
    const sessionData = await adapter.authenticate(avukatId, token);
    const session = {
      avukatId,
      token: sessionData?.token || null,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
      activatedAt: new Date().toISOString(),
      raw: sessionData,
    };
    sessionCache.set(avukatId, session);
    return { ok: true, session };
  } catch (err) {
    return { ok: false, reason: err.message, errorCode: err.code || null };
  }
}

function getSession(avukatId) {
  const session = sessionCache.get(avukatId);
  if (!session) return null;
  if (Date.parse(session.expiresAt) < Date.now()) {
    return { expired: true, session };
  }
  return { expired: false, session };
}

async function checkSessionExpirations() {
  for (const [avukatId, session] of sessionCache.entries()) {
    if (Date.parse(session.expiresAt) < Date.now()) {
      sessionCache.delete(avukatId);
      totalSessionExpires++;
      await bus.emitOS(EVENT_TYPES.UYAP_SESSION_EXPIRED, {
        severity: "info",
        module: MODULE_NAME,
        payload: {
          avukatId,
          expiredAt: session.expiresAt,
          activatedAt: session.activatedAt,
        },
      });
    }
  }
}

// ============================================================================
// SECTION 5 — TEBLIGAT MANAGEMENT
// ============================================================================

function calculateDeadline(receivedAtIso) {
  const received = new Date(receivedAtIso).getTime();
  const deadline = received + OBJECTION_PERIOD_DAYS * 24 * 60 * 60 * 1000;
  return new Date(deadline).toISOString();
}

/**
 * Yeni tebligat kaydet (gercek hayatta adapter callback'inden gelir).
 * Sprint 2'de manuel test icin expose ediliyor.
 */
async function recordTebligat(data) {
  if (!data?.id || !data?.dosyaNo) {
    throw new Error("recordTebligat: id + dosyaNo zorunlu");
  }
  const receivedAt = data.receivedAt || new Date().toISOString();
  const record = {
    id: data.id,
    dosyaNo: data.dosyaNo,
    receivedAt,
    deadline: calculateDeadline(receivedAt),
    type: data.type || TEBLIGAT_TYPES.OTHER,
    status: TEBLIGAT_STATUS.PENDING,
  };
  tebligatRegistry.set(data.id, record);
  totalTebligat++;

  await bus.emitOS(EVENT_TYPES.UYAP_TEBLIGAT_RECEIVED, {
    severity: "warning",
    module: MODULE_NAME,
    payload: record,
  });

  return record;
}

function updateTebligatStatus(id, status) {
  const record = tebligatRegistry.get(id);
  if (!record) return null;
  if (!Object.values(TEBLIGAT_STATUS).includes(status)) {
    throw new Error(`updateTebligatStatus: gecersiz status ${status}`);
  }
  record.status = status;
  record.updatedAt = new Date().toISOString();
  return record;
}

function listTebligat() {
  return Array.from(tebligatRegistry.values());
}

function listPendingTebligat() {
  return listTebligat().filter((t) => t.status === TEBLIGAT_STATUS.PENDING);
}

function daysUntilDeadline(deadlineIso) {
  const diff = Date.parse(deadlineIso) - Date.now();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

async function checkDeadlines() {
  for (const tebligat of listPendingTebligat()) {
    const days = daysUntilDeadline(tebligat.deadline);
    if (days <= DEADLINE_WARN_DAYS) {
      const cooldownKey = tebligat.id;
      const last = deadlineCooldown.get(cooldownKey);
      if (last && Date.now() - last < TICK_INTERVAL_MS) continue;
      deadlineCooldown.set(cooldownKey, Date.now());
      totalDeadlineAlerts++;

      // Kritik severity eskalasyonu
      let severity = "warning";
      if (days <= 0) severity = "critical";
      else if (days <= 1) severity = "error";

      await bus.emitOS(EVENT_DEADLINE, {
        severity,
        module: MODULE_NAME,
        payload: {
          tebligatId: tebligat.id,
          dosyaNo: tebligat.dosyaNo,
          type: tebligat.type,
          deadline: tebligat.deadline,
          daysRemaining: days,
          status: tebligat.status,
        },
      });
    }
  }
}

// ============================================================================
// SECTION 6 — POLLING (stub Sprint 2, real Sprint 4)
// ============================================================================

async function pollTebligat() {
  const adapter = getAdapter(ADAPTER_KEY);
  if (!adapter || !adapter.isConfigured?.()) {
    lastSkipAt = new Date().toISOString();
    await bus.emitOS(EVENT_SKIPPED, {
      severity: "info",
      module: MODULE_NAME,
      payload: {
        reason: "adapter-not-configured",
        note: "UYAP contract pending, poll atlandi",
      },
    });
    recordJob({ action: "poll", status: "skipped", reason: "not-configured" });
    return { skipped: true, reason: "not-configured" };
  }

  // Sprint 4: adapter.subscribeTebligat veya adapter.getDosyalarBatch
  // Simdilik sadece placeholder - adapter stub zaten NotImplementedError firlar
  try {
    const rates = await adapter.getRateLimits();
    recordJob({ action: "poll", status: "completed", rates });
    return { skipped: false, rates };
  } catch (err) {
    recordJob({ action: "poll", status: "failed", error: err.message });
    return { skipped: false, error: err.message, errorCode: err.code };
  }
}

// ============================================================================
// SECTION 7 — TICK
// ============================================================================

async function runTick() {
  totalTicks++;
  try {
    await pollTebligat();
    await checkDeadlines();
    await checkSessionExpirations();
  } catch (err) {
    console.error("[UYAP-CONTROL] tick error:", err.message);
  }
  console.log(
    `[UYAP-CONTROL] tick=${totalTicks} tebligat=${tebligatRegistry.size} pending=${listPendingTebligat().length} sessions=${sessionCache.size} alerts=${totalDeadlineAlerts}`
  );
}

// ============================================================================
// SECTION 8 — LIFECYCLE
// ============================================================================

function start() {
  if (isRunning) {
    console.warn("[UYAP-CONTROL] zaten calisiyor, start cagrisi gormezden gelindi");
    return;
  }
  isRunning = true;
  tickTimer = setInterval(() => {
    runTick().catch((err) => {
      console.error("[UYAP-CONTROL] unhandled tick error:", err.message);
    });
  }, TICK_INTERVAL_MS);
  console.log(
    `[UYAP-CONTROL] started: tick ${TICK_INTERVAL_MS / 60000}dk, session TTL ${SESSION_TTL_MS / 3600000}h, objection period ${OBJECTION_PERIOD_DAYS} gun`
  );
}

function stop() {
  if (!isRunning) return;
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  isRunning = false;
  console.log("[UYAP-CONTROL] stopped");
}

// ============================================================================
// SECTION 9 — READ API
// ============================================================================

function getStatus() {
  const adapter = getAdapter(ADAPTER_KEY);
  return {
    isRunning,
    totalTicks,
    totalTebligat,
    totalDeadlineAlerts,
    totalSessionExpires,
    lastSkipAt,
    tebligatCount: tebligatRegistry.size,
    pendingTebligatCount: listPendingTebligat().length,
    activeSessionCount: sessionCache.size,
    historySize: jobHistory.length,
    adapterRegistered: !!adapter,
    adapterConfigured: adapter?.isConfigured?.() || false,
    tickIntervalMs: TICK_INTERVAL_MS,
    objectionPeriodDays: OBJECTION_PERIOD_DAYS,
  };
}

function getJobHistory() {
  return [...jobHistory];
}

function resetState() {
  tebligatRegistry.clear();
  sessionCache.clear();
  deadlineCooldown.clear();
  jobHistory.length = 0;
  totalTicks = 0;
  totalTebligat = 0;
  totalDeadlineAlerts = 0;
  totalSessionExpires = 0;
  lastSkipAt = null;
}

// ============================================================================
// SECTION 10 — RECONCILER POLICY HANDLER
// ============================================================================

async function policyHandler(policy, _prisma) {
  const key = policy?.key;
  if (!key) return { drift: false, action: null };

  if (key === "pending-tebligat") {
    const threshold = parseInt(policy.value, 10) || 10;
    const pending = listPendingTebligat().length;
    return {
      drift: pending >= threshold,
      action: pending >= threshold ? "tebligat-backlog" : null,
      details: { pending, threshold },
    };
  }
  if (key === "overdue-tebligat") {
    const overdue = listPendingTebligat().filter(
      (t) => daysUntilDeadline(t.deadline) < 0
    );
    return {
      drift: overdue.length > 0,
      action: overdue.length > 0 ? "tebligat-overdue" : null,
      details: { overdueCount: overdue.length },
    };
  }
  return { drift: false, action: null, details: { reason: "unknown key", key } };
}

try {
  const { registerPolicyHandler } = require("../reconciler");
  registerPolicyHandler(MODULE_NAME, policyHandler);
} catch (_) {
  // reconciler yoksa sessiz gec
}

// ============================================================================
// SECTION 11 — EXPORTS
// ============================================================================

module.exports = {
  start,
  stop,
  pollTebligat,
  runTick,
  openSession,
  getSession,
  recordTebligat,
  updateTebligatStatus,
  listTebligat,
  listPendingTebligat,
  getStatus,
  getJobHistory,
  resetState,
  MODULE_NAME,
  TICK_INTERVAL_MS,
  SESSION_TTL_MS,
  OBJECTION_PERIOD_DAYS,
  DEADLINE_WARN_DAYS,
  HISTORY_SIZE,
  TEBLIGAT_TYPES,
  TEBLIGAT_STATUS,
  EVENT_DEADLINE,
  EVENT_SKIPPED,
  ADAPTER_KEY,
};
