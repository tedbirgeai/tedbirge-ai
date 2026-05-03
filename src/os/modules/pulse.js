/**
 * src/os/modules/pulse.js
 *
 * Tedbirge OS — Modul 1: Nabiz (Pulse)
 *
 * AMAC:
 *   Kayitli tum adapter'larin saglik durumunu duzenli aralikla (5dk) olcmek,
 *   24-saat rolling uptime yuzdesi hesaplamak, degradation tespit edip
 *   event bus'a bildirmek.
 *
 * MIMARI:
 *   - In-memory ring buffer: her adapter icin 288 sample (24h x 12 per hour)
 *   - setInterval tabanli (reconciler ile tutarli pattern)
 *   - 9 adapter paralel getHealth (Promise.allSettled — bir adapter patlasa
 *     digerleri etkilenmez)
 *   - Degradation threshold: uptime < 95% veya ardisik 3 fail
 *   - Event emit: system:health-changed (EVENT_TYPES zaten var)
 *   - reconciler registerPolicyHandler('pulse', handler) ile entegrasyon
 *
 * KAPSAM (Sprint 2):
 *   - start() / stop() idempotent
 *   - checkAllAdapters() — paralel health ping
 *   - recordSample() — ring buffer ekle
 *   - calculateUptime() — son N dakika / son 24h rolling %
 *   - detectDegradation() — threshold kontrol + event emit
 *   - getStatus() — API read (observability/dashboard icin)
 *   - reconcilePolicy handler — desired uptime vs actual drift
 *
 * KAPSAM DIŞI (Sprint 3+):
 *   - Persist to DB (os_health_history tablosu) — simdilik in-memory
 *   - SLA raporu (post-mortem analiz)
 *   - ML-based anomaly detection
 *   - Auto-recovery action (modules/recovery.js sorumlulugu)
 *
 * EVENT TYPES (eventBus EVENT_TYPES icinden):
 *   - SYSTEM_HEALTH_CHANGED ('system:health-changed') — degradation/recovery
 *
 * BAGIMLILIK:
 *   - ./adapters/base — getAdapter, listAdapters
 *   - ./eventBus — bus, EVENT_TYPES
 *   - ./reconciler — registerPolicyHandler
 *
 * KULLANIM (boot.js):
 *   const pulse = require('./modules/pulse');
 *   pulse.start();  // 5dk interval baslar
 *
 *   // Graceful shutdown:
 *   pulse.stop();
 */

"use strict";

const { listAdapters, getAdapter } = require("../adapters/base");
const { bus, EVENT_TYPES } = require("../eventBus");
const { registerPolicyHandler } = require("../reconciler");

// ============================================================================
// SECTION 1 — CONSTANTS
// ============================================================================

const MODULE_NAME = "pulse";

const PULSE_INTERVAL_MS = 5 * 60 * 1000;  // 5 dakika
const HISTORY_SIZE = 288;                  // 24h * 12 sample/h (5dk interval)
const DEGRADED_UPTIME_THRESHOLD = 95;      // 24h uptime < 95% -> degraded
const CONSECUTIVE_FAIL_THRESHOLD = 3;      // 3 ardisik fail -> degraded
const HEALTH_CHECK_TIMEOUT_MS = 10_000;    // adapter getHealth timeout

// ============================================================================
// SECTION 2 — INTERNAL STATE
// ============================================================================

/**
 * Ring buffer: Map<adapterKey, Array<Sample>>
 * Sample: { at: ISO string, ok: boolean, latencyMs: number, error?: string }
 */
const healthHistory = new Map();

/**
 * Last-known status cache: Map<adapterKey, 'healthy' | 'degraded' | 'unknown'>
 * Event emit'i sadece state DEGISIRSE yapilir (noise azaltma).
 */
const lastStatus = new Map();

let pulseTimer = null;
let isRunning = false;
let lastTickAt = null;
let totalTicks = 0;

// ============================================================================
// SECTION 3 — SAMPLING
// ============================================================================

/**
 * Tek bir adapter icin health check. Timeout koruması var.
 * @param {string} key - registry key
 * @param {BaseAdapter} adapter
 * @returns {Promise<Sample>}
 */
async function checkAdapter(key, adapter) {
  const start = Date.now();
  try {
    // Timeout sarmalayici — adapter.getHealth kendi timeout'u olabilir ama
    // pulse kendi sinirini uyguluyor (10sn).
    const health = await Promise.race([
      adapter.getHealth(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("pulse timeout")), HEALTH_CHECK_TIMEOUT_MS)
      ),
    ]);
    return {
      at: new Date().toISOString(),
      ok: Boolean(health.ok),
      latencyMs: health.latencyMs ?? (Date.now() - start),
      error: health.error || null,
    };
  } catch (err) {
    return {
      at: new Date().toISOString(),
      ok: false,
      latencyMs: Date.now() - start,
      error: err.message,
    };
  }
}

/**
 * Ring buffer'a sample ekle. HISTORY_SIZE'i asarsa en eskiyi dusur.
 */
function recordSample(key, sample) {
  if (!healthHistory.has(key)) {
    healthHistory.set(key, []);
  }
  const buf = healthHistory.get(key);
  buf.push(sample);
  if (buf.length > HISTORY_SIZE) {
    buf.shift();
  }
}

// ============================================================================
// SECTION 4 — ANALYSIS
// ============================================================================

/**
 * Son N sample'da uptime yuzdesi.
 * @param {string} key
 * @param {number} [lastN] - varsayilan tum buffer (24h)
 * @returns {number} 0-100
 */
function calculateUptime(key, lastN) {
  const buf = healthHistory.get(key) || [];
  if (buf.length === 0) return 100; // veri yok = varsayim saglikli
  const samples = lastN ? buf.slice(-lastN) : buf;
  const okCount = samples.filter((s) => s.ok).length;
  return Math.round((okCount / samples.length) * 10000) / 100; // 2 decimal
}

/**
 * Son ardisik fail sayisi (streak).
 */
function consecutiveFails(key) {
  const buf = healthHistory.get(key) || [];
  let count = 0;
  for (let i = buf.length - 1; i >= 0; i--) {
    if (buf[i].ok) break;
    count++;
  }
  return count;
}

/**
 * Adapter saglikli mi degraded mi? 2 kriter:
 *   - 24h uptime < 95%
 *   - Ardisik 3+ fail
 */
function classifyAdapter(key) {
  const uptime24h = calculateUptime(key);
  const streak = consecutiveFails(key);
  if (uptime24h < DEGRADED_UPTIME_THRESHOLD || streak >= CONSECUTIVE_FAIL_THRESHOLD) {
    return { status: "degraded", uptime24h, streak };
  }
  return { status: "healthy", uptime24h, streak };
}

// ============================================================================
// SECTION 5 — DEGRADATION DETECTION + EVENT EMIT
// ============================================================================

/**
 * State degisirse event emit. Ayni state'te spam yok.
 */
async function detectAndEmit(key, adapter) {
  const { status, uptime24h, streak } = classifyAdapter(key);
  const previous = lastStatus.get(key) || "unknown";

  if (status === previous) return; // degisim yoksa sessiz kal

  lastStatus.set(key, status);

  const severity = status === "degraded" ? "warning" : "info";
  await bus.emitOS(EVENT_TYPES.SYSTEM_HEALTH_CHANGED, {
    severity,
    module: MODULE_NAME,
    payload: {
      adapterKey: key,
      adapterName: adapter.adapterName,
      adapterType: adapter.adapterType,
      previousStatus: previous,
      currentStatus: status,
      uptime24h,
      consecutiveFails: streak,
    },
  });
}

// ============================================================================
// SECTION 6 — TICK
// ============================================================================

/**
 * Bir tick: tum kayitli adapter'lari paralel sorgula, buffer'a yaz,
 * degradation tespit et, event emit et.
 *
 * Promise.allSettled — bir adapter timeout olsa digerleri devam.
 */
async function runTick() {
  const tickStart = Date.now();
  const registry = listAdapters();

  if (registry.length === 0) {
    console.log("[PULSE] tick skipped — no adapters registered");
    return;
  }

  const results = await Promise.allSettled(
    registry.map(async (entry) => {
      const adapter = getAdapter(entry.key);
      if (!adapter) return null;
      const sample = await checkAdapter(entry.key, adapter);
      recordSample(entry.key, sample);
      await detectAndEmit(entry.key, adapter);
      return { key: entry.key, name: entry.name, ok: sample.ok, latencyMs: sample.latencyMs };
    })
  );

  const durationMs = Date.now() - tickStart;
  const summary = results
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => r.value);
  const okCount = summary.filter((s) => s.ok).length;
  const failCount = summary.length - okCount;

  lastTickAt = new Date().toISOString();
  totalTicks++;

  console.log(
    `[PULSE] tick=${summary.length} ok=${okCount} fail=${failCount} ${durationMs}ms`
  );
}

// ============================================================================
// SECTION 7 — LIFECYCLE
// ============================================================================

/**
 * Pulse'i baslat. Idempotent.
 * Ilk tick hemen calistirilmaz — boot sequence'e zaman tanir.
 */
function start() {
  if (isRunning) {
    console.warn("[PULSE] zaten calisiyor, start cagrisi gormezden gelindi");
    return;
  }
  isRunning = true;
  pulseTimer = setInterval(() => {
    runTick().catch((err) => {
      console.error("[PULSE] unhandled tick error:", err.message);
    });
  }, PULSE_INTERVAL_MS);

  console.log(`[PULSE] started: interval ${PULSE_INTERVAL_MS / 60000}dk, history ${HISTORY_SIZE} samples`);
}

/**
 * Pulse'i durdur. Idempotent.
 */
function stop() {
  if (!isRunning) return;
  if (pulseTimer) {
    clearInterval(pulseTimer);
    pulseTimer = null;
  }
  isRunning = false;
  console.log("[PULSE] stopped");
}

// ============================================================================
// SECTION 8 — READ API (observability/dashboard icin)
// ============================================================================

/**
 * Tum adapter'larin anlik durum ozeti.
 */
function getStatus() {
  const registry = listAdapters();
  const adapters = registry.map((entry) => {
    const { status, uptime24h, streak } = classifyAdapter(entry.key);
    const buf = healthHistory.get(entry.key) || [];
    const lastSample = buf[buf.length - 1] || null;
    return {
      key: entry.key,
      name: entry.name,
      type: entry.type,
      configured: entry.configured,
      status,
      uptime24h,
      consecutiveFails: streak,
      samples: buf.length,
      lastSample,
    };
  });
  return {
    isRunning,
    lastTickAt,
    totalTicks,
    intervalMs: PULSE_INTERVAL_MS,
    historySize: HISTORY_SIZE,
    adapters,
  };
}

/**
 * Test ve debug icin: ring buffer'i temizle.
 */
function resetHistory() {
  healthHistory.clear();
  lastStatus.clear();
}

// ============================================================================
// SECTION 9 — RECONCILER POLICY HANDLER
// ============================================================================

/**
 * reconciler her 5dk bu handler'i cagirir (OSPolicy.module === 'pulse').
 * Desired: uptime >= threshold (policy.value'dan alinir, default 95)
 * Actual: calculateUptime(key)
 * Drift: actual < desired
 *
 * Sprint 2'de drift tespit sadece bildirir, action yok (recovery.js Sprint 3).
 */
async function policyHandler(policy, _prisma) {
  const desiredUptime = parseFloat(policy?.value) || DEGRADED_UPTIME_THRESHOLD;
  const adapterKey = policy?.key;
  if (!adapterKey) {
    return { drift: false, action: null, details: { reason: "missing policy.key" } };
  }
  const actualUptime = calculateUptime(adapterKey);
  const drift = actualUptime < desiredUptime;
  return {
    drift,
    action: drift ? "notify" : null,
    details: { desiredUptime, actualUptime, adapterKey },
  };
}

// Reconciler'a kaydol (modul yuklendiginde otomatik)
registerPolicyHandler(MODULE_NAME, policyHandler);

// ============================================================================
// SECTION 10 — TUR #71 A18 — weeklyRunner (Pazar 23:59 Pulse snapshot)
// ============================================================================

async function weeklyRunner() {
  const prismaClient = require("../../config/db");
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const weekStart = new Date(now.getTime() - now.getDay() * dayMs);
  weekStart.setUTCHours(0, 0, 0, 0);

  const since = new Date(now.getTime() - 7 * dayMs);

  let leadCount = 0;
  let docCount = 0;
  let revenueSum = 0;
  let aiCallCount = 0;
  let failedDocCount = 0;
  let criticalEvents = 0;

  try {
    [leadCount, docCount, aiCallCount, failedDocCount, criticalEvents] = await Promise.all([
      prismaClient.lead.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
      prismaClient.document.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
      prismaClient.document.count({
        where: { aiAnalysis: { not: null }, updatedAt: { gte: since } },
      }).catch(() => 0),
      prismaClient.document.count({
        where: { status: "FAILED", updatedAt: { gte: since } },
      }).catch(() => 0),
      prismaClient.agentEvent.count({
        where: { severity: "CRITICAL", createdAt: { gte: since } },
      }).catch(() => 0),
    ]);

    const tahsilat = await prismaClient.commissionLog.aggregate({
      where: { createdAt: { gte: since } },
      _sum: { tahsilatBrut: true },
    }).catch(() => ({ _sum: { tahsilatBrut: 0 } }));
    revenueSum = Number(tahsilat._sum?.tahsilatBrut || 0);
  } catch (_) {}

  const metrics = {
    weekStart: weekStart.toISOString(),
    leadCount,
    docCount,
    aiCallCount,
    failedDocCount,
    criticalEvents,
    revenueSum,
  };

  try {
    await prismaClient.pulse.upsert({
      where: { weekStart },
      create: { weekStart, metrics, trendType: "WEEKLY" },
      update: { metrics },
    });
  } catch (err) {
    console.error("[os/pulse] weeklyRunner Pulse.upsert hata:", err.message);
  }

  // 12 haftadan eski olanları temizle (3 ay tutar)
  try {
    const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * dayMs);
    await prismaClient.pulse.deleteMany({
      where: { weekStart: { lt: twelveWeeksAgo } },
    });
  } catch (_) {}

  // AgentEvent
  try {
    await prismaClient.agentEvent.create({
      data: {
        agentName: "pulse",
        eventType: "WEEKLY_SNAPSHOT",
        severity: "INFO",
        payload: { ...metrics, message: `Pulse haftalık snapshot · ${leadCount} lead · ${docCount} belge · ${revenueSum} TL` },
      },
    });
  } catch (_) {}

  return { ok: true, metrics };
}

// ============================================================================
// SECTION 11 — TUR #70 A13 — runStatusCheck (24h adapter uptime + AgentEvent)
// ============================================================================

async function runStatusCheck() {
  const startTs = Date.now();
  const prismaClient = require("../../config/db");

  // pulse.js'in mevcut in-memory state'inden adapter uptime metrics
  const status = typeof getStatus === "function" ? getStatus() : { adapters: [] };
  const adapters = Array.isArray(status.adapters) ? status.adapters : [];

  let degradedCount = 0;
  let avgUptime = 0;
  if (adapters.length > 0) {
    degradedCount = adapters.filter((a) => a.status === "degraded").length;
    avgUptime = Math.round(
      (adapters.reduce((sum, a) => sum + (a.uptime24h || 100), 0) / adapters.length) * 10,
    ) / 10;
  } else {
    avgUptime = 100; // henüz veri yok
  }

  const severity = degradedCount > 0 ? "WARNING" : "INFO";

  try {
    await prismaClient.agentEvent.create({
      data: {
        agentName: MODULE_NAME, // "pulse"
        eventType: "STATUS_CHECK",
        severity,
        payload: {
          adapterCount: adapters.length,
          degradedCount,
          avgUptime24hPercent: avgUptime,
          totalTicks: status.totalTicks || 0,
          isRunning: !!status.isRunning,
          durationMs: Date.now() - startTs,
          message: `Nabız · ${adapters.length} adapter, ${degradedCount} degraded, ortalama uptime %${avgUptime}`,
        },
      },
    });
  } catch (e) {
    console.error("[os/pulse] AgentEvent yazma hata:", e.message);
  }
  return { ok: true, adapterCount: adapters.length, degradedCount, avgUptime };
}

// ============================================================================
// SECTION 11 — EXPORTS
// ============================================================================

module.exports = {
  start,
  stop,
  runTick,
  runStatusCheck,
  weeklyRunner,
  getStatus,
  calculateUptime,
  classifyAdapter,
  resetHistory,
  MODULE_NAME,
  PULSE_INTERVAL_MS,
  HISTORY_SIZE,
  DEGRADED_UPTIME_THRESHOLD,
};
