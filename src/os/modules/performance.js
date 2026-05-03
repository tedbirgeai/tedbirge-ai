/**
 * src/os/modules/performance.js
 *
 * Tedbirge OS — Modul 11: Performans Metrikleri (Performance)
 *
 * AMAC:
 *   HTTP endpoint latency, DB sorgu suresi, AI cagrisi latency gibi performans
 *   metriklerini toplayip p50/p95/p99 percentile ve throughput (requests/sec)
 *   hesaplamak. Observability katmaninin temeli - metrics.js, traces.js ve
 *   dashboard bu modulun verilerini okur.
 *
 * MIMARI:
 *   - recordLatency(category, ms) - request middleware / AI facade cagrilir
 *   - recordThroughput(category) - her istegin basinda cagrilir
 *   - Sliding window 5 dakika (in-memory)
 *   - Percentile hesabi: sort + index lookup (O(n log n))
 *   - setInterval 1dk tick: pruneWindow + threshold kontrol
 *   - Threshold: p95 > 5sn -> 'perf:slow-response-detected' event
 *   - reconciler registerPolicyHandler('performance') - SLO drift
 *
 * KAPSAM (Sprint 2 THIN):
 *   - recordLatency(category, ms) API
 *   - recordThroughput(category) counter
 *   - Percentile hesabi (p50, p95, p99) per category
 *   - Requests per second hesabi
 *   - Slow response threshold event
 *   - getStatus() read API
 *   - start() / stop() idempotent
 *   - Reconciler policy handler
 *
 * KAPSAM DIŞI (Sprint 3+):
 *   - HDR histogram (sabit memory, daha dogru percentile)
 *   - DB persist (metrics tablosu)
 *   - Category auto-discovery (regex tabanli route matching)
 *   - Apdex score hesabi
 *   - Error rate tracking (5xx / 4xx ratio)
 *   - Time-series export (Prometheus format)
 *   - Sampling (her 10. istek) - yuksek throughput durumunda
 *
 * EVENT TYPES (string literal):
 *   - 'perf:slow-response-detected'
 *   - 'perf:throughput-spike'
 *
 * CATEGORIES (ornek, runtime'da recordLatency cagrisiyla belirleniyor):
 *   - 'http:GET:/api/leads'
 *   - 'http:POST:/api/leads'
 *   - 'db:lead.findMany'
 *   - 'ai:complete'
 *   - 'storage:upload'
 *
 * DATA CONTRACT (sample):
 *   { at: number, category: string, latencyMs: number }
 *
 * BAGIMLILIK:
 *   - ./eventBus — bus
 *   - ./reconciler — registerPolicyHandler
 *
 * KULLANIM:
 *   const perf = require('./modules/performance');
 *   perf.start();
 *
 *   // Request middleware:
 *   const start = Date.now();
 *   ... handle ...
 *   perf.recordLatency('http:GET:/api/leads', Date.now() - start);
 *
 *   // AI cagrisi:
 *   perf.recordLatency('ai:complete', latencyMs);
 */

"use strict";

const { bus } = require("../eventBus");

// ============================================================================
// SECTION 1 — CONSTANTS
// ============================================================================

const MODULE_NAME = "performance";

const TICK_INTERVAL_MS = 60 * 1000;          // 1 dakika
const WINDOW_MS = 5 * 60 * 1000;              // 5 dakika sliding window
const MAX_SAMPLES_PER_CATEGORY = 5000;        // memory koruma

const SLOW_RESPONSE_P95_MS = 5000;            // p95 > 5sn -> slow
const THROUGHPUT_SPIKE_MULTIPLIER = 5;        // son dk avg x5 -> spike

const EVENT_SLOW_RESPONSE = "perf:slow-response-detected";
const EVENT_THROUGHPUT_SPIKE = "perf:throughput-spike";

const COOLDOWN_MS = 5 * 60 * 1000;

// ============================================================================
// SECTION 2 — INTERNAL STATE
// ============================================================================

/** latencySamples: Map<category, Array<{at, latencyMs}>> */
const latencySamples = new Map();

/** throughputCounter: Map<category, Array<{at}>> */
const throughputSamples = new Map();

/** Cooldown for event emit (spam koruma) */
const cooldowns = new Map();

let tickTimer = null;
let isRunning = false;
let totalTicks = 0;
let totalLatencySamples = 0;
let totalThroughputSamples = 0;
let alertsEmitted = 0;

// ============================================================================
// SECTION 3 — RECORDING API
// ============================================================================

function recordLatency(category, latencyMs) {
  if (!category || typeof latencyMs !== "number" || latencyMs < 0) return;

  if (!latencySamples.has(category)) {
    latencySamples.set(category, []);
  }
  const buf = latencySamples.get(category);
  buf.push({ at: Date.now(), latencyMs });

  if (buf.length > MAX_SAMPLES_PER_CATEGORY) {
    buf.shift();
  }
  totalLatencySamples++;
}

function recordThroughput(category) {
  if (!category) return;

  if (!throughputSamples.has(category)) {
    throughputSamples.set(category, []);
  }
  const buf = throughputSamples.get(category);
  buf.push({ at: Date.now() });

  if (buf.length > MAX_SAMPLES_PER_CATEGORY) {
    buf.shift();
  }
  totalThroughputSamples++;
}

// ============================================================================
// SECTION 4 — WINDOW PRUNE
// ============================================================================

function pruneWindow() {
  const cutoff = Date.now() - WINDOW_MS;

  for (const [cat, buf] of latencySamples.entries()) {
    while (buf.length > 0 && buf[0].at < cutoff) {
      buf.shift();
    }
    if (buf.length === 0) latencySamples.delete(cat);
  }

  for (const [cat, buf] of throughputSamples.entries()) {
    while (buf.length > 0 && buf[0].at < cutoff) {
      buf.shift();
    }
    if (buf.length === 0) throughputSamples.delete(cat);
  }
}

// ============================================================================
// SECTION 5 — PERCENTILE + THROUGHPUT
// ============================================================================

/** Verilen sayi dizisinde percentile hesabi (0-100). */
function percentile(sortedAsc, p) {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sortedAsc.length) - 1;
  return sortedAsc[Math.max(0, Math.min(idx, sortedAsc.length - 1))];
}

function categoryStats(category) {
  const buf = latencySamples.get(category) || [];
  if (buf.length === 0) {
    return { count: 0, p50: 0, p95: 0, p99: 0, min: 0, max: 0, avg: 0 };
  }
  const sorted = buf.map((s) => s.latencyMs).sort((a, b) => a - b);
  const sum = sorted.reduce((acc, x) => acc + x, 0);
  return {
    count: sorted.length,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: Math.round(sum / sorted.length),
  };
}

/** Son 1dk icinde istek sayisi - requests per minute. */
function categoryThroughput(category) {
  const buf = throughputSamples.get(category) || [];
  const cutoff60s = Date.now() - 60_000;
  const last1min = buf.filter((s) => s.at >= cutoff60s).length;
  const last5min = buf.length;
  return {
    last1min,
    last5min,
    avg1minPer5min: Math.round(last5min / 5),
  };
}

function listCategories() {
  const set = new Set();
  for (const k of latencySamples.keys()) set.add(k);
  for (const k of throughputSamples.keys()) set.add(k);
  return Array.from(set);
}

// ============================================================================
// SECTION 6 — THRESHOLD DETECTION
// ============================================================================

function isInCooldown(key) {
  const last = cooldowns.get(key);
  if (!last) return false;
  return Date.now() - last < COOLDOWN_MS;
}

function markCooldown(key) {
  cooldowns.set(key, Date.now());
}

async function checkSlowResponses() {
  for (const category of listCategories()) {
    const stats = categoryStats(category);
    if (stats.count < 10) continue;
    if (stats.p95 > SLOW_RESPONSE_P95_MS) {
      const cooldownKey = `slow-${category}`;
      if (isInCooldown(cooldownKey)) continue;
      markCooldown(cooldownKey);
      alertsEmitted++;
      await bus.emitOS(EVENT_SLOW_RESPONSE, {
        severity: stats.p95 > SLOW_RESPONSE_P95_MS * 2 ? "error" : "warning",
        module: MODULE_NAME,
        payload: {
          category,
          p50: stats.p50,
          p95: stats.p95,
          p99: stats.p99,
          count: stats.count,
          threshold: SLOW_RESPONSE_P95_MS,
        },
      });
    }
  }
}

async function checkThroughputSpikes() {
  for (const category of listCategories()) {
    const t = categoryThroughput(category);
    if (t.last5min < 10) continue;
    if (t.last1min > t.avg1minPer5min * THROUGHPUT_SPIKE_MULTIPLIER) {
      const cooldownKey = `spike-${category}`;
      if (isInCooldown(cooldownKey)) continue;
      markCooldown(cooldownKey);
      alertsEmitted++;
      await bus.emitOS(EVENT_THROUGHPUT_SPIKE, {
        severity: "warning",
        module: MODULE_NAME,
        payload: {
          category,
          last1min: t.last1min,
          avg1min: t.avg1minPer5min,
          multiplier: t.avg1minPer5min > 0 ? (t.last1min / t.avg1minPer5min) : 0,
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
    await checkSlowResponses();
    await checkThroughputSpikes();
  } catch (err) {
    console.error("[PERFORMANCE] tick error:", err.message);
  }
  console.log(
    `[PERFORMANCE] tick=${totalTicks} categories=${listCategories().length} latencySamples=${totalLatencySamples} alerts=${alertsEmitted}`
  );
}

// ============================================================================
// SECTION 8 — LIFECYCLE
// ============================================================================

function start() {
  if (isRunning) {
    console.warn("[PERFORMANCE] zaten calisiyor, start cagrisi gormezden gelindi");
    return;
  }
  isRunning = true;
  tickTimer = setInterval(() => {
    runTick().catch((err) => {
      console.error("[PERFORMANCE] unhandled tick error:", err.message);
    });
  }, TICK_INTERVAL_MS);
  console.log(
    `[PERFORMANCE] started: tick ${TICK_INTERVAL_MS / 1000}sn, window ${WINDOW_MS / 60000}dk, slow p95 threshold ${SLOW_RESPONSE_P95_MS}ms`
  );
}

function stop() {
  if (!isRunning) return;
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  isRunning = false;
  console.log("[PERFORMANCE] stopped");
}

// ============================================================================
// SECTION 9 — READ API
// ============================================================================

function getStatus() {
  pruneWindow();
  const cats = listCategories();
  const byCategory = {};
  for (const c of cats) {
    byCategory[c] = {
      latency: categoryStats(c),
      throughput: categoryThroughput(c),
    };
  }
  return {
    isRunning,
    totalTicks,
    totalLatencySamples,
    totalThroughputSamples,
    alertsEmitted,
    categories: cats.length,
    byCategory,
    windowMs: WINDOW_MS,
    tickIntervalMs: TICK_INTERVAL_MS,
    slowResponseThresholdMs: SLOW_RESPONSE_P95_MS,
  };
}

function getCategoryStats(category) {
  return {
    latency: categoryStats(category),
    throughput: categoryThroughput(category),
  };
}

function resetState() {
  latencySamples.clear();
  throughputSamples.clear();
  cooldowns.clear();
  totalTicks = 0;
  totalLatencySamples = 0;
  totalThroughputSamples = 0;
  alertsEmitted = 0;
}

// ============================================================================
// SECTION 10 — RECONCILER POLICY HANDLER
// ============================================================================

async function policyHandler(policy, _prisma) {
  const key = policy?.key;
  if (!key) return { drift: false, action: null };

  if (key === "p95-threshold") {
    const threshold = parseFloat(policy.value) || SLOW_RESPONSE_P95_MS;
    const offenders = [];
    for (const cat of listCategories()) {
      const stats = categoryStats(cat);
      if (stats.count >= 10 && stats.p95 > threshold) {
        offenders.push({ category: cat, p95: stats.p95 });
      }
    }
    return {
      drift: offenders.length > 0,
      action: offenders.length > 0 ? "performance-degradation" : null,
      details: { offenders, threshold },
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
// SECTION 11 — TUR #70 A12 — runStatusCheck (in-memory latency + AgentEvent durations)
// ============================================================================

async function runStatusCheck() {
  const startTs = Date.now();
  const prismaClient = require("../../config/db");
  const since = new Date(Date.now() - 60 * 60 * 1000);

  let avgModuleDurationMs = 0;
  let slowModuleEvents = 0;
  try {
    const recentEvents = await prismaClient.agentEvent.findMany({
      where: {
        createdAt: { gte: since },
        eventType: "STATUS_CHECK",
      },
      select: { payload: true },
      take: 200,
    });
    const durations = recentEvents
      .map((e) => Number(e.payload?.durationMs))
      .filter((d) => Number.isFinite(d) && d > 0);
    if (durations.length > 0) {
      avgModuleDurationMs = Math.round(
        durations.reduce((a, b) => a + b, 0) / durations.length,
      );
      slowModuleEvents = durations.filter((d) => d > 5000).length;
    }
  } catch (_) {}

  const inMem = typeof getStatus === "function" ? getStatus() : {};

  const severity = avgModuleDurationMs > 3000 || slowModuleEvents > 5 ? "WARNING" : "INFO";

  try {
    await prismaClient.agentEvent.create({
      data: {
        agentName: MODULE_NAME,
        eventType: "STATUS_CHECK",
        severity,
        payload: {
          avgModuleDurationMs,
          slowModuleEvents,
          windowMinutes: 60,
          inMemoryLatencyP95: inMem.p95Ms || null,
          durationMs: Date.now() - startTs,
          message: `Performans · son 1h ortalama modül süresi ${avgModuleDurationMs}ms · ${slowModuleEvents} yavaş tick (>5s)`,
        },
      },
    });
  } catch (e) {
    console.error("[os/performance] AgentEvent yazma hata:", e.message);
  }
  return { ok: true, avgModuleDurationMs, slowModuleEvents };
}

// ============================================================================
// SECTION 12 — EXPORTS
// ============================================================================

module.exports = {
  start,
  stop,
  recordLatency,
  recordThroughput,
  runTick,
  runStatusCheck,
  getStatus,
  getCategoryStats,
  listCategories,
  resetState,
  MODULE_NAME,
  TICK_INTERVAL_MS,
  WINDOW_MS,
  MAX_SAMPLES_PER_CATEGORY,
  SLOW_RESPONSE_P95_MS,
  THROUGHPUT_SPIKE_MULTIPLIER,
  EVENT_SLOW_RESPONSE,
  EVENT_THROUGHPUT_SPIKE,
};
