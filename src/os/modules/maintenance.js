/**
 * src/os/modules/maintenance.js
 *
 * Tedbirge OS — Modul 7: Bakim (Maintenance)
 *
 * AMAC:
 *   Periyodik sistem bakim gorevlerini zamanli olarak planlayip calistirmak:
 *   DB vacuum/analyze, indeks saglik kontrolu, expired session temizligi,
 *   gecici dosya temizligi, metrik agregasyonu. Sprint 2 THIN: iskele +
 *   schedule + metadata kayit; gercek DB komutlari Sprint 3.
 *
 * MIMARI (backup.js kardesi):
 *   - setInterval tabanli dual-schedule: gunluk + haftalik
 *   - Iki ayri job: daily (vacuum + session cleanup) + weekly (reindex + metric rollup)
 *   - Maintenance job history ring buffer (son 30 kayit)
 *   - Event emit: 'maintenance:started' + 'maintenance:completed' + 'maintenance:failed'
 *     (Not: EVENT_TYPES'ta maintenance icin dedicated sabit yok - string literal
 *      kullaniyoruz, Sprint 3'te EVENT_TYPES'a eklenecek)
 *   - reconciler registerPolicyHandler('maintenance')
 *
 * KAPSAM (Sprint 2 THIN):
 *   - start() / stop() idempotent
 *   - runDailyMaintenance() - placeholder (vacuum, analyze, session cleanup)
 *   - runWeeklyMaintenance() - placeholder (reindex, metric rollup)
 *   - Metadata kayit + event emit
 *   - getStatus() + getMaintenanceHistory()
 *
 * KAPSAM DIŞI (Sprint 3+):
 *   - Gercek prisma.$executeRawUnsafe('VACUUM ANALYZE ...')
 *   - Session table cleanup (expiredAt < now)
 *   - Prisma indeks saglik kontrolu (pg_stat_user_indexes)
 *   - /tmp gecici dosya temizligi
 *   - Metric rollup tablosu (daily aggregates)
 *   - EVENT_TYPES'a MAINTENANCE_STARTED/COMPLETED/FAILED ekleme
 *
 * EVENT TYPES (string literal, EVENT_TYPES'ta yok):
 *   - 'maintenance:started'
 *   - 'maintenance:completed'
 *   - 'maintenance:failed'
 *
 * BAGIMLILIK:
 *   - ./eventBus — bus
 *   - ./reconciler — registerPolicyHandler
 *
 * KULLANIM (boot.js):
 *   const maintenance = require('./modules/maintenance');
 *   maintenance.start();
 *
 *   // Manuel tetikleme (admin action, test):
 *   await maintenance.runDailyMaintenance();
 */

"use strict";

const { bus } = require("../eventBus");
const { registerPolicyHandler } = require("../reconciler");

// ============================================================================
// SECTION 1 — CONSTANTS
// ============================================================================

const MODULE_NAME = "maintenance";

const DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000;      // 24 saat
const WEEKLY_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 gun
const HISTORY_SIZE = 30;

const JOB_TYPES = Object.freeze({
  DAILY: "daily",
  WEEKLY: "weekly",
  MANUAL: "manual",
});

const JOB_STATUS = Object.freeze({
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  SKIPPED: "skipped",
});

const EVENT_STARTED = "maintenance:started";
const EVENT_COMPLETED = "maintenance:completed";
const EVENT_FAILED = "maintenance:failed";

const DAILY_TASKS = ["db-vacuum-analyze", "session-cleanup", "temp-file-cleanup"];
const WEEKLY_TASKS = ["db-reindex", "metric-rollup", "index-health-report"];

// ============================================================================
// SECTION 2 — INTERNAL STATE
// ============================================================================

const jobHistory = [];

let dailyTimer = null;
let weeklyTimer = null;
let isRunning = false;
let totalJobs = 0;
let totalFailures = 0;

// ============================================================================
// SECTION 3 — HISTORY
// ============================================================================

function recordJob(record) {
  jobHistory.push(record);
  if (jobHistory.length > HISTORY_SIZE) {
    jobHistory.shift();
  }
  totalJobs++;
  if (record.status === JOB_STATUS.FAILED) {
    totalFailures++;
  }
}

function generateJobId(type) {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================================
// SECTION 4 — JOB EXECUTION (THIN stubs)
// ============================================================================

async function runDailyMaintenance() {
  const id = generateJobId(JOB_TYPES.DAILY);
  const startedAt = new Date().toISOString();
  const tickStart = Date.now();

  await bus.emitOS(EVENT_STARTED, {
    severity: "info",
    module: MODULE_NAME,
    payload: { id, type: JOB_TYPES.DAILY, tasks: DAILY_TASKS, startedAt },
  });

  let record;

  try {
    // Sprint 3 placeholder:
    // await prisma.$executeRawUnsafe('VACUUM ANALYZE');
    // await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    // await fs.rm('/tmp/tedbirge-uploads', { recursive: true, force: true });

    const durationMs = Date.now() - tickStart;
    record = {
      id,
      type: JOB_TYPES.DAILY,
      status: JOB_STATUS.SKIPPED,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs,
      error: null,
      details: {
        tasks: DAILY_TASKS,
        note: "THIN mode: gercek DB vacuum/session cleanup Sprint 3",
      },
    };

    await bus.emitOS(EVENT_COMPLETED, {
      severity: "info",
      module: MODULE_NAME,
      payload: record,
    });
  } catch (err) {
    const durationMs = Date.now() - tickStart;
    record = {
      id,
      type: JOB_TYPES.DAILY,
      status: JOB_STATUS.FAILED,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs,
      error: err.message,
      details: { tasks: DAILY_TASKS },
    };
    await bus.emitOS(EVENT_FAILED, {
      severity: "error",
      module: MODULE_NAME,
      payload: record,
    });
  }

  recordJob(record);
  return record;
}

async function runWeeklyMaintenance() {
  const id = generateJobId(JOB_TYPES.WEEKLY);
  const startedAt = new Date().toISOString();
  const tickStart = Date.now();

  await bus.emitOS(EVENT_STARTED, {
    severity: "info",
    module: MODULE_NAME,
    payload: { id, type: JOB_TYPES.WEEKLY, tasks: WEEKLY_TASKS, startedAt },
  });

  let record;

  try {
    // Sprint 3 placeholder:
    // await prisma.$executeRawUnsafe('REINDEX DATABASE tedbirge');
    // await rollupDailyMetrics();
    // await generateIndexHealthReport();

    const durationMs = Date.now() - tickStart;
    record = {
      id,
      type: JOB_TYPES.WEEKLY,
      status: JOB_STATUS.SKIPPED,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs,
      error: null,
      details: {
        tasks: WEEKLY_TASKS,
        note: "THIN mode: gercek DB reindex + metric rollup Sprint 3",
      },
    };

    await bus.emitOS(EVENT_COMPLETED, {
      severity: "info",
      module: MODULE_NAME,
      payload: record,
    });
  } catch (err) {
    const durationMs = Date.now() - tickStart;
    record = {
      id,
      type: JOB_TYPES.WEEKLY,
      status: JOB_STATUS.FAILED,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs,
      error: err.message,
      details: { tasks: WEEKLY_TASKS },
    };
    await bus.emitOS(EVENT_FAILED, {
      severity: "error",
      module: MODULE_NAME,
      payload: record,
    });
  }

  recordJob(record);
  return record;
}

// ============================================================================
// SECTION 5 — LIFECYCLE
// ============================================================================

function start() {
  if (isRunning) {
    console.warn("[MAINTENANCE] zaten calisiyor, start cagrisi gormezden gelindi");
    return;
  }
  isRunning = true;

  dailyTimer = setInterval(() => {
    runDailyMaintenance().catch((err) => {
      console.error("[MAINTENANCE] daily unhandled error:", err.message);
    });
  }, DAILY_INTERVAL_MS);

  weeklyTimer = setInterval(() => {
    runWeeklyMaintenance().catch((err) => {
      console.error("[MAINTENANCE] weekly unhandled error:", err.message);
    });
  }, WEEKLY_INTERVAL_MS);

  console.log(
    `[MAINTENANCE] started: daily ${DAILY_INTERVAL_MS / 3600000}h, weekly ${WEEKLY_INTERVAL_MS / 3600000}h, history ${HISTORY_SIZE}`
  );
}

function stop() {
  if (!isRunning) return;
  if (dailyTimer) {
    clearInterval(dailyTimer);
    dailyTimer = null;
  }
  if (weeklyTimer) {
    clearInterval(weeklyTimer);
    weeklyTimer = null;
  }
  isRunning = false;
  console.log("[MAINTENANCE] stopped");
}

// ============================================================================
// SECTION 6 — READ API
// ============================================================================

function getStatus() {
  const lastDaily = [...jobHistory].reverse().find((r) => r.type === JOB_TYPES.DAILY);
  const lastWeekly = [...jobHistory].reverse().find((r) => r.type === JOB_TYPES.WEEKLY);

  return {
    isRunning,
    totalJobs,
    totalFailures,
    historySize: jobHistory.length,
    lastDailyJob: lastDaily || null,
    lastWeeklyJob: lastWeekly || null,
    dailyIntervalMs: DAILY_INTERVAL_MS,
    weeklyIntervalMs: WEEKLY_INTERVAL_MS,
  };
}

function getMaintenanceHistory() {
  return [...jobHistory];
}

function resetState() {
  jobHistory.length = 0;
  totalJobs = 0;
  totalFailures = 0;
}

// ============================================================================
// SECTION 7 — RECONCILER POLICY HANDLER
// ============================================================================

async function policyHandler(policy, _prisma) {
  const jobType = policy?.key;
  if (!jobType) {
    return { drift: false, action: null, details: { reason: "missing policy.key" } };
  }

  const maxAgeMs =
    jobType === JOB_TYPES.DAILY
      ? DAILY_INTERVAL_MS + 60 * 60 * 1000
      : WEEKLY_INTERVAL_MS + 24 * 60 * 60 * 1000;

  const lastSuccess = [...jobHistory]
    .reverse()
    .find(
      (r) =>
        r.type === jobType &&
        (r.status === JOB_STATUS.COMPLETED || r.status === JOB_STATUS.SKIPPED)
    );

  if (!lastSuccess) {
    return {
      drift: true,
      action: "initial-maintenance-needed",
      details: { jobType, reason: "no-history" },
    };
  }

  const lastMs = Date.parse(lastSuccess.completedAt);
  const ageMs = Date.now() - lastMs;
  const drift = ageMs > maxAgeMs;

  return {
    drift,
    action: drift ? "overdue" : null,
    details: { jobType, lastCompletedAt: lastSuccess.completedAt, ageMs, maxAgeMs },
  };
}

registerPolicyHandler(MODULE_NAME, policyHandler);

// ============================================================================
// SECTION 8 — TUR #70 A9 — runStatusCheck (eski log + cache metrics)
// ============================================================================

async function runStatusCheck() {
  const startTs = Date.now();
  const prismaClient = require("../../config/db");
  const day = 24 * 60 * 60 * 1000;
  const since30d = new Date(Date.now() - 30 * day);
  const since7d = new Date(Date.now() - 7 * day);

  let oldInfoEvents = 0;
  let oldConsumedRealtime = 0;
  try {
    [oldInfoEvents, oldConsumedRealtime] = await Promise.all([
      prismaClient.agentEvent.count({
        where: { severity: "INFO", createdAt: { lt: since30d } },
      }).catch(() => 0),
      prismaClient.realtimeEvent.count({
        where: { consumed: true, createdAt: { lt: since7d } },
      }).catch(() => 0),
    ]);
  } catch (_) {}

  const severity = oldInfoEvents > 10000 ? "WARNING" : "INFO";

  try {
    await prismaClient.agentEvent.create({
      data: {
        agentName: MODULE_NAME,
        eventType: "STATUS_CHECK",
        severity,
        payload: {
          oldInfoEvents30d: oldInfoEvents,
          oldConsumedRealtime7d: oldConsumedRealtime,
          durationMs: Date.now() - startTs,
          message: `Bakım · 30g+ INFO event: ${oldInfoEvents} · 7g+ tüketilmiş realtime: ${oldConsumedRealtime}${oldInfoEvents > 10000 ? " (purge önerilir)" : ""}`,
        },
      },
    });
  } catch (e) {
    console.error("[os/maintenance] AgentEvent yazma hata:", e.message);
  }
  return { ok: true, oldInfoEvents, oldConsumedRealtime };
}

// ============================================================================
// SECTION 8B — TUR #72 A9 — runActiveTask (GERCEK TEMIZLIK + Healer pattern migrate)
// ============================================================================

let lastActiveTaskAt = 0;
const ACTIVE_TASK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 saat

function shouldRunActiveTask() {
  return Date.now() - lastActiveTaskAt >= ACTIVE_TASK_INTERVAL_MS;
}

async function runActiveTask() {
  const startTs = Date.now();
  const prismaClient = require("../../config/db");
  const day = 24 * 60 * 60 * 1000;
  const since30d = new Date(Date.now() - 30 * day);
  const since7d = new Date(Date.now() - 7 * day);
  const since90d = new Date(Date.now() - 90 * day);

  let agentEventPurged = 0;
  let realtimePurged = 0;
  let stuckDocPurged = 0;
  let sessionPurged = 0;

  // 1. 30 gun+ INFO AgentEvent purge (max 1000)
  try {
    const ids = await prismaClient.agentEvent.findMany({
      where: { severity: "INFO", createdAt: { lt: since30d } },
      select: { id: true },
      take: 1000,
    });
    if (ids.length > 0) {
      const r = await prismaClient.agentEvent.deleteMany({
        where: { id: { in: ids.map((x) => x.id) } },
      });
      agentEventPurged = r.count;
    }
  } catch (_) {}

  // 2. 7 gun+ consumed RealtimeEvent purge (max 1000)
  try {
    const ids = await prismaClient.realtimeEvent.findMany({
      where: { consumed: true, createdAt: { lt: since7d } },
      select: { id: true },
      take: 1000,
    });
    if (ids.length > 0) {
      const r = await prismaClient.realtimeEvent.deleteMany({
        where: { id: { in: ids.map((x) => x.id) } },
      });
      realtimePurged = r.count;
    }
  } catch (_) {}

  // 3. 90 gun+ stuck PENDING_UPLOAD Document soft-delete (status DELETED, file korunur)
  try {
    const r = await prismaClient.document.updateMany({
      where: { status: "PENDING_UPLOAD", createdAt: { lt: since90d } },
      data: { status: "DELETED" },
    });
    stuckDocPurged = r.count;
  } catch (_) {}

  // 4. Adaptive threshold: anomalik artis WARNING
  let anomaly = false;
  try {
    const helper = require("../lib/adaptiveThreshold");
    const totalPurged = agentEventPurged + realtimePurged + stuckDocPurged;
    const result = await helper.adaptiveOr(MODULE_NAME, "totalPurged", 5000, 7);
    if (totalPurged > result.threshold) anomaly = true;
  } catch (_) {}

  const severity = anomaly ? "WARNING" : "INFO";
  const total = agentEventPurged + realtimePurged + stuckDocPurged + sessionPurged;

  try {
    await prismaClient.agentEvent.create({
      data: {
        agentName: MODULE_NAME,
        eventType: "ACTION_TAKEN",
        severity,
        payload: {
          action_taken: {
            agentEvent_purged: agentEventPurged,
            realtime_purged: realtimePurged,
            stuck_doc_purged: stuckDocPurged,
            sessions_purged: sessionPurged,
            totalPurged: total,
          },
          anomaly,
          durationMs: Date.now() - startTs,
          message: `Bakim GERCEK temizlik · ${agentEventPurged} AgentEvent · ${realtimePurged} RealtimeEvent · ${stuckDocPurged} stuck Document${anomaly ? " (anomali)" : ""}`,
        },
      },
    });
  } catch (_) {}

  lastActiveTaskAt = Date.now();
  return { agentEventPurged, realtimePurged, stuckDocPurged, anomaly };
}

// ============================================================================
// SECTION 9 — EXPORTS
// ============================================================================

module.exports = {
  start,
  stop,
  runDailyMaintenance,
  runWeeklyMaintenance,
  runStatusCheck,
  runActiveTask,
  shouldRunActiveTask,
  getStatus,
  getMaintenanceHistory,
  resetState,
  MODULE_NAME,
  DAILY_INTERVAL_MS,
  WEEKLY_INTERVAL_MS,
  HISTORY_SIZE,
  JOB_TYPES,
  JOB_STATUS,
  DAILY_TASKS,
  WEEKLY_TASKS,
  EVENT_STARTED,
  EVENT_COMPLETED,
  EVENT_FAILED,
};
