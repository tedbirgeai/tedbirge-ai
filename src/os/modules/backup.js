/**
 * src/os/modules/backup.js
 *
 * Tedbirge OS — Modul 2: Yedekleme (Backup)
 *
 * AMAC:
 *   DB ve Storage yedeklerini zamanli olarak planlamak, calistirmak, dogrulamak.
 *   Sprint 2 THIN: iskele + schedule + metadata kayit; gercek pg_dump + bucket
 *   rotation Sprint 3'te pulse patterninde tam implementasyon.
 *
 * MIMARI:
 *   - setInterval tabanli (reconciler + pulse ile tutarli pattern)
 *   - Iki ayri job: DB gunluk, Storage haftalik
 *   - Backup metadata ring buffer (son 30 yedek kaydi, in-memory)
 *   - Event emit: BACKUP_STARTED / BACKUP_COMPLETED / BACKUP_FAILED
 *   - reconciler registerPolicyHandler('backup') - retention policy drift
 *
 * KAPSAM (Sprint 2 THIN):
 *   - start() / stop() idempotent
 *   - runDatabaseBackup() - placeholder (gercek dump Sprint 3)
 *   - runStorageBackup() - placeholder (gercek tarama Sprint 3)
 *   - scheduleDaily() / scheduleWeekly() - setInterval helper
 *   - recordBackup() / getBackupHistory() - in-memory metadata
 *   - Event emit: started/completed/failed
 *   - Reconciler policy: retention >= desired drift
 *
 * KAPSAM DIŞI (Sprint 3+):
 *   - Gercek pg_dump child_process spawn (Render ortam degiskenleriyle)
 *   - Supabase bucket copy (A bucket -> B bucket rotation)
 *   - Cloudflare R2 offsite replikasyon
 *   - Restore drill otomasyonu (haftalik test restore)
 *   - Retention cleanup (30 gunden eski yedekleri sil)
 *   - Incremental backup (WAL shipping)
 *
 * EVENT TYPES (eventBus EVENT_TYPES icinden):
 *   - BACKUP_STARTED   ('backup:started')
 *   - BACKUP_COMPLETED ('backup:completed')
 *   - BACKUP_FAILED    ('backup:failed')
 *
 * BAGIMLILIK:
 *   - ./eventBus — bus, EVENT_TYPES
 *   - ./reconciler — registerPolicyHandler
 *
 * KULLANIM (boot.js):
 *   const backup = require('./modules/backup');
 *   backup.start();  // daily + weekly interval baslar
 *
 *   // Manuel tetikleme (test, admin action):
 *   await backup.runDatabaseBackup();
 */

"use strict";

const { bus, EVENT_TYPES } = require("../eventBus");
const { registerPolicyHandler } = require("../reconciler");

// ============================================================================
// SECTION 1 — CONSTANTS
// ============================================================================

const MODULE_NAME = "backup";

const DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000;   // 24 saat
const WEEKLY_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 gun
const HISTORY_SIZE = 30;                           // son 30 yedek metadata

const BACKUP_TYPES = Object.freeze({
  DATABASE_DAILY: "database-daily",
  STORAGE_WEEKLY: "storage-weekly",
  MANUAL: "manual",
});

const BACKUP_STATUS = Object.freeze({
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  SKIPPED: "skipped",
});

// Sprint 2 retention defaults (reconciler policy override edebilir)
const DEFAULT_DB_RETENTION_DAYS = 7;
const DEFAULT_STORAGE_RETENTION_DAYS = 30;

// ============================================================================
// SECTION 2 — INTERNAL STATE
// ============================================================================

/**
 * Backup history ring buffer.
 * Kayit: { id, type, status, startedAt, completedAt, durationMs, error, details }
 */
const backupHistory = [];

let dailyTimer = null;
let weeklyTimer = null;
let isRunning = false;
let totalBackups = 0;
let totalFailures = 0;

// ============================================================================
// SECTION 3 — HISTORY
// ============================================================================

function recordBackup(record) {
  backupHistory.push(record);
  if (backupHistory.length > HISTORY_SIZE) {
    backupHistory.shift();
  }
  totalBackups++;
  if (record.status === BACKUP_STATUS.FAILED) {
    totalFailures++;
  }
}

function generateBackupId(type) {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================================
// SECTION 4 — BACKUP EXECUTION (THIN stubs)
// ============================================================================

/**
 * DB yedeginin Sprint 2 THIN implementasyonu.
 * Gercek pg_dump Sprint 3. Simdilik metadata kayit + event emit.
 */
async function runDatabaseBackup() {
  const id = generateBackupId(BACKUP_TYPES.DATABASE_DAILY);
  const startedAt = new Date().toISOString();
  const tickStart = Date.now();

  await bus.emitOS(EVENT_TYPES.BACKUP_STARTED, {
    severity: "info",
    module: MODULE_NAME,
    payload: { id, type: BACKUP_TYPES.DATABASE_DAILY, startedAt },
  });

  let record;

  try {
    // Sprint 3 placeholder:
    // const { spawn } = require('child_process');
    // const dump = spawn('pg_dump', [process.env.DATABASE_URL, '-F', 'c']);
    // ... upload to Supabase Storage bucket 'backups/'

    const durationMs = Date.now() - tickStart;
    record = {
      id,
      type: BACKUP_TYPES.DATABASE_DAILY,
      status: BACKUP_STATUS.SKIPPED,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs,
      error: null,
      details: {
        note: "THIN mode: gercek pg_dump Sprint 3, metadata-only kayit",
        retentionDays: DEFAULT_DB_RETENTION_DAYS,
      },
    };

    await bus.emitOS(EVENT_TYPES.BACKUP_COMPLETED, {
      severity: "info",
      module: MODULE_NAME,
      payload: record,
    });
  } catch (err) {
    const durationMs = Date.now() - tickStart;
    record = {
      id,
      type: BACKUP_TYPES.DATABASE_DAILY,
      status: BACKUP_STATUS.FAILED,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs,
      error: err.message,
      details: null,
    };
    await bus.emitOS(EVENT_TYPES.BACKUP_FAILED, {
      severity: "error",
      module: MODULE_NAME,
      payload: record,
    });
  }

  recordBackup(record);
  return record;
}

/**
 * Storage yedeginin Sprint 2 THIN implementasyonu.
 * Gercek bucket tarama Sprint 3.
 */
async function runStorageBackup() {
  const id = generateBackupId(BACKUP_TYPES.STORAGE_WEEKLY);
  const startedAt = new Date().toISOString();
  const tickStart = Date.now();

  await bus.emitOS(EVENT_TYPES.BACKUP_STARTED, {
    severity: "info",
    module: MODULE_NAME,
    payload: { id, type: BACKUP_TYPES.STORAGE_WEEKLY, startedAt },
  });

  let record;

  try {
    // Sprint 3 placeholder:
    // const supabase = getAdapter('storage');
    // const files = await supabase.list('');
    // ... calculate checksums, copy critical to backup bucket

    const durationMs = Date.now() - tickStart;
    record = {
      id,
      type: BACKUP_TYPES.STORAGE_WEEKLY,
      status: BACKUP_STATUS.SKIPPED,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs,
      error: null,
      details: {
        note: "THIN mode: bucket tarama Sprint 3, metadata-only kayit",
        retentionDays: DEFAULT_STORAGE_RETENTION_DAYS,
      },
    };

    await bus.emitOS(EVENT_TYPES.BACKUP_COMPLETED, {
      severity: "info",
      module: MODULE_NAME,
      payload: record,
    });
  } catch (err) {
    const durationMs = Date.now() - tickStart;
    record = {
      id,
      type: BACKUP_TYPES.STORAGE_WEEKLY,
      status: BACKUP_STATUS.FAILED,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs,
      error: err.message,
      details: null,
    };
    await bus.emitOS(EVENT_TYPES.BACKUP_FAILED, {
      severity: "error",
      module: MODULE_NAME,
      payload: record,
    });
  }

  recordBackup(record);
  return record;
}

// ============================================================================
// SECTION 5 — LIFECYCLE
// ============================================================================

function start() {
  if (isRunning) {
    console.warn("[BACKUP] zaten calisiyor, start cagrisi gormezden gelindi");
    return;
  }
  isRunning = true;

  dailyTimer = setInterval(() => {
    runDatabaseBackup().catch((err) => {
      console.error("[BACKUP] daily unhandled error:", err.message);
    });
  }, DAILY_INTERVAL_MS);

  weeklyTimer = setInterval(() => {
    runStorageBackup().catch((err) => {
      console.error("[BACKUP] weekly unhandled error:", err.message);
    });
  }, WEEKLY_INTERVAL_MS);

  console.log(
    `[BACKUP] started: daily ${DAILY_INTERVAL_MS / 3600000}h, weekly ${WEEKLY_INTERVAL_MS / 3600000}h, history ${HISTORY_SIZE}`
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
  console.log("[BACKUP] stopped");
}

// ============================================================================
// SECTION 6 — READ API
// ============================================================================

function getStatus() {
  const lastDb = [...backupHistory].reverse().find((r) => r.type === BACKUP_TYPES.DATABASE_DAILY);
  const lastStorage = [...backupHistory].reverse().find((r) => r.type === BACKUP_TYPES.STORAGE_WEEKLY);

  return {
    isRunning,
    totalBackups,
    totalFailures,
    historySize: backupHistory.length,
    lastDatabaseBackup: lastDb || null,
    lastStorageBackup: lastStorage || null,
    dailyIntervalMs: DAILY_INTERVAL_MS,
    weeklyIntervalMs: WEEKLY_INTERVAL_MS,
  };
}

function getBackupHistory() {
  return [...backupHistory];
}

function resetState() {
  backupHistory.length = 0;
  totalBackups = 0;
  totalFailures = 0;
}

// ============================================================================
// SECTION 7 — RECONCILER POLICY HANDLER
// ============================================================================

/**
 * reconciler 5dk tick'te bu handler'i cagirir.
 * Desired: son basarili yedek 24h/7d icinde olmali.
 * Actual: backupHistory'deki en son kayit zamani.
 * Drift: gecikme varsa.
 */
async function policyHandler(policy, _prisma) {
  const backupType = policy?.key; // 'database-daily' veya 'storage-weekly'
  if (!backupType) {
    return { drift: false, action: null, details: { reason: "missing policy.key" } };
  }

  const maxAgeMs =
    backupType === BACKUP_TYPES.DATABASE_DAILY
      ? DAILY_INTERVAL_MS + 60 * 60 * 1000 // daily + 1h grace
      : WEEKLY_INTERVAL_MS + 24 * 60 * 60 * 1000; // weekly + 1 gun grace

  const lastSuccess = [...backupHistory]
    .reverse()
    .find(
      (r) =>
        r.type === backupType &&
        (r.status === BACKUP_STATUS.COMPLETED || r.status === BACKUP_STATUS.SKIPPED)
    );

  if (!lastSuccess) {
    return {
      drift: true,
      action: "initial-backup-needed",
      details: { backupType, reason: "no-history" },
    };
  }

  const lastMs = Date.parse(lastSuccess.completedAt);
  const ageMs = Date.now() - lastMs;
  const drift = ageMs > maxAgeMs;

  return {
    drift,
    action: drift ? "overdue" : null,
    details: {
      backupType,
      lastCompletedAt: lastSuccess.completedAt,
      ageMs,
      maxAgeMs,
    },
  };
}

// Reconciler'a kaydol
registerPolicyHandler(MODULE_NAME, policyHandler);

// ============================================================================
// SECTION 8 — EXPORTS
// ============================================================================

module.exports = {
  start,
  stop,
  runDatabaseBackup,
  runStorageBackup,
  getStatus,
  getBackupHistory,
  resetState,
  MODULE_NAME,
  DAILY_INTERVAL_MS,
  WEEKLY_INTERVAL_MS,
  HISTORY_SIZE,
  BACKUP_TYPES,
  BACKUP_STATUS,
  DEFAULT_DB_RETENTION_DAYS,
  DEFAULT_STORAGE_RETENTION_DAYS,
};
