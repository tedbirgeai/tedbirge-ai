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
// SECTION 8 — TUR #69 A4 — runStatusCheck (Supabase backup yaşı + AgentEvent)
// ============================================================================

/**
 * Yedekleme modülü gerçek görev:
 *  - Supabase Management API ile son snapshot listele
 *  - Son snapshot yaşı: <24h INFO, 24-26h WARNING, >26h CRITICAL
 *  - SUPABASE_SERVICE_ROLE_KEY yoksa SKIP mode + WARNING
 */
// TUR #72.5 H2 — shouldLogError: ayni hata saatte 1 kez WARNING (flood kes)
async function shouldLogBackupError() {
  try {
    const prismaClient = require("../../config/db");
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await prismaClient.agentEvent.findFirst({
      where: { agentName: "backup", severity: "WARNING", createdAt: { gte: oneHourAgo } },
      select: { id: true },
    });
    return !recent;
  } catch (_) {
    return true;
  }
}

async function runStatusCheck() {
  const startTs = Date.now();
  const prismaClient = require("../../config/db");
  // TUR #72.5 H2 — Management API DOGRU auth: SUPABASE_ACCESS_TOKEN (SERVICE_ROLE_KEY DEGIL)
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const apiKey = accessToken || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || "";

  let severity = "INFO";
  let payload = {};
  let envStatus = accessToken ? "OK" : (apiKey ? "INVALID" : "MISSING");

  if (!apiKey || !supabaseUrl) {
    // TUR #72.5 H2 — env eksik: rate-limit, saatte 1 WARNING
    const shouldLog = await shouldLogBackupError();
    severity = shouldLog ? "WARNING" : "INFO";
    payload = {
      mode: "SKIP",
      env_status: "MISSING",
      reason: "SUPABASE_ACCESS_TOKEN eksik (Render dashboard → Environment ekle)",
      alert_throttled: !shouldLog,
      message: shouldLog
        ? "Yedekleme · ENV eksik (SUPABASE_ACCESS_TOKEN), CEO manuel yapılandıracak"
        : "Yedekleme · ENV eksik (rate-limit aktif, sessiz)",
      durationMs: Date.now() - startTs,
    };
  } else {
    // Project ref URL'den çıkar: https://abcd.supabase.co → abcd
    const projectRef = supabaseUrl.replace(/^https?:\/\//, "").split(".")[0];
    let snapshots = [];
    let apiError = null;
    let httpStatus = null;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(
        `https://api.supabase.com/v1/projects/${projectRef}/database/backups`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "content-type": "application/json",
          },
          signal: controller.signal,
        },
      );
      clearTimeout(timer);
      httpStatus = res.status;
      if (res.ok) {
        const data = await res.json();
        snapshots = Array.isArray(data?.backups) ? data.backups : Array.isArray(data) ? data : [];
      } else {
        apiError = `HTTP ${res.status}`;
      }
    } catch (err) {
      apiError = err.message || "fetch error";
    }

    if (apiError) {
      // TUR #72.5 H2 — 401/403 = env yanlis yapilandirilmis (SERVICE_ROLE yerine ACCESS_TOKEN)
      if (httpStatus === 401 || httpStatus === 403) {
        envStatus = "INVALID";
        const shouldLog = await shouldLogBackupError();
        severity = shouldLog ? "WARNING" : "INFO";
        payload = {
          mode: "AUTH_ERROR",
          env_status: "INVALID",
          httpStatus,
          alert_throttled: !shouldLog,
          message: shouldLog
            ? `Yedekleme · Supabase Management API ${httpStatus} — token yanlis (ACCESS_TOKEN gerekli, SERVICE_ROLE_KEY degil)`
            : `Yedekleme · ${httpStatus} (rate-limit aktif, sessiz)`,
          durationMs: Date.now() - startTs,
        };
        if (shouldLog) {
          try {
            await prismaClient.realtimeEvent.create({
              data: {
                channel: "ADMIN_FEED",
                eventType: "BACKUP_AUTH_INVALID",
                payload: { httpStatus, hint: "Render Environment → SUPABASE_ACCESS_TOKEN ekle" },
              },
            });
          } catch (_) {}
        }
      } else {
        const shouldLog = await shouldLogBackupError();
        severity = shouldLog ? "WARNING" : "INFO";
        payload = {
          mode: "API_ERROR",
          apiError,
          httpStatus,
          alert_throttled: !shouldLog,
          message: `Yedekleme · Supabase API erişim hatası: ${apiError}`,
          durationMs: Date.now() - startTs,
        };
      }
    } else {
      // Son snapshot yaşı
      const sortedTimes = snapshots
        .map((s) => new Date(s.inserted_at || s.created_at || s.timestamp || s.completed_at).getTime())
        .filter((t) => Number.isFinite(t))
        .sort((a, b) => b - a);
      const latestTime = sortedTimes[0] || null;
      const ageHours = latestTime ? (Date.now() - latestTime) / (60 * 60 * 1000) : null;

      // TUR #75 V9 — snapshot 0 ise WARNING (CRITICAL degil): API basarili ama backup henuz yok
      // (Supabase free plan = backup yok; Pro plan = ilk backup beklemede; Render PG manuel)
      if (snapshots.length === 0) {
        const shouldLog = await shouldLogBackupError();
        severity = shouldLog ? "WARNING" : "INFO";
        payload = {
          mode: "NO_BACKUP",
          snapshotCount: 0,
          alert_throttled: !shouldLog,
          message: "Yedekleme · Supabase Management API'da snapshot yok (Pro plan veya manuel pg_dump gerek)",
          hint: "Supabase Dashboard → Project Settings → Backups · veya Render PG manual scheduled backup",
          durationMs: Date.now() - startTs,
        };
      } else if (ageHours === null) {
        // Snapshot var ama tarih parse hatasi (alan ismi farkli olabilir)
        const shouldLog = await shouldLogBackupError();
        severity = shouldLog ? "WARNING" : "INFO";
        payload = {
          mode: "DATE_PARSE_ERROR",
          snapshotCount: snapshots.length,
          alert_throttled: !shouldLog,
          message: `Yedekleme · ${snapshots.length} snapshot var ama tarih parse edilemedi (alan ismi degismis olabilir)`,
          hint: "Manuel kontrol: Supabase Dashboard → Backups",
          durationMs: Date.now() - startTs,
        };
      } else if (ageHours > 26) {
        severity = "CRITICAL";
        payload = {
          snapshotCount: snapshots.length,
          latestSnapshot: new Date(latestTime).toISOString(),
          ageHours: Math.round(ageHours * 10) / 10,
          message: `Yedekleme · Son snapshot ${Math.round(ageHours)}h önce — KRITIK gecikme`,
          durationMs: Date.now() - startTs,
        };
      } else if (ageHours >= 24) {
        severity = "WARNING";
        payload = {
          snapshotCount: snapshots.length,
          latestSnapshot: new Date(latestTime).toISOString(),
          ageHours: Math.round(ageHours * 10) / 10,
          message: `Yedekleme · Son snapshot ${Math.round(ageHours)}h önce — sınır`,
          durationMs: Date.now() - startTs,
        };
      } else {
        severity = "INFO";
        payload = {
          snapshotCount: snapshots.length,
          latestSnapshot: new Date(latestTime).toISOString(),
          ageHours: Math.round(ageHours * 10) / 10,
          message: `Yedekleme · ${snapshots.length} snapshot, son ${Math.round(ageHours)}h önce`,
          durationMs: Date.now() - startTs,
        };
      }
    }
  }

  try {
    await prismaClient.agentEvent.create({
      data: {
        agentName: MODULE_NAME, // "backup"
        eventType: "STATUS_CHECK",
        severity,
        payload,
      },
    });
  } catch (evtErr) {
    console.error("[os/backup] AgentEvent yazma hata:", evtErr.message);
  }

  if (severity === "CRITICAL") {
    try {
      await prismaClient.realtimeEvent.create({
        data: {
          channel: "ADMIN_FEED",
          eventType: "BACKUP_STALE",
          payload,
        },
      });
    } catch (_) {}
  }

  return { ok: severity !== "CRITICAL", severity, ...payload };
}

// ============================================================================
// SECTION 8B — TUR #72 A4 — runActiveTask (snapshot age + integrity)
// ============================================================================

let lastActiveTaskAt_bk = 0;
const BK_ACTIVE_INTERVAL_MS = 6 * 60 * 60 * 1000;

function shouldRunActiveTask() {
  return Date.now() - lastActiveTaskAt_bk >= BK_ACTIVE_INTERVAL_MS;
}

async function runActiveTask() {
  const startTs = Date.now();
  const prismaClient = require("../../config/db");
  let lastAgeHours = null;
  let triggered = false;
  let sizeMb = null;
  let anomaly = false;

  // TUR #72.5 H2 — env status raporu
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const fallbackKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  let envStatus = "OK";
  if (!accessToken && !fallbackKey) envStatus = "MISSING";
  else if (!accessToken && fallbackKey) envStatus = "INVALID"; // SERVICE_ROLE Management API ile calismaz

  // Backup history dahili — getStatus'tan oku
  try {
    const status = getStatus();
    if (status?.lastDatabaseBackup?.completedAt) {
      const ageMs = Date.now() - Date.parse(status.lastDatabaseBackup.completedAt);
      lastAgeHours = Math.round(ageMs / 3600000);
    }
  } catch (_) {}

  // Adaptive: backup_size_p95 -50% → CRITICAL
  try {
    const helper = require("../lib/adaptiveThreshold");
    const result = await helper.adaptiveOr("backup", "sizeMb", 0, 30);
    if (sizeMb && result.adaptive && sizeMb < result.adaptive * 0.5) anomaly = true;
  } catch (_) {}

  // TUR #72.5 H2 — env eksik/yanlissa CRITICAL degil INFO (rate-limit zaten runStatusCheck'te)
  let severity;
  if (envStatus !== "OK") {
    severity = "INFO";
  } else if ((lastAgeHours != null && lastAgeHours > 26) || anomaly) {
    severity = "CRITICAL";
  } else {
    severity = "INFO";
  }

  // Alert throttled flag — runStatusCheck'te shouldLogError gormus mu?
  let alertThrottled = false;
  if (envStatus !== "OK") {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recent = await prismaClient.agentEvent.findFirst({
        where: { agentName: "backup", severity: "WARNING", createdAt: { gte: oneHourAgo } },
        select: { id: true },
      });
      alertThrottled = !!recent;
    } catch (_) {}
  }

  try {
    await prismaClient.agentEvent.create({
      data: {
        agentName: "backup",
        eventType: "ACTION_TAKEN",
        severity,
        payload: {
          action_taken: {
            snapshot_age_hours: lastAgeHours,
            env_status: envStatus,
            alert_throttled: alertThrottled,
            triggered,
            size_mb: sizeMb,
            anomaly,
          },
          durationMs: Date.now() - startTs,
          message:
            envStatus !== "OK"
              ? `Yedekleme · ENV ${envStatus} (CEO yapilandiracak)${alertThrottled ? " · throttled" : ""}`
              : `Yedekleme · son ${lastAgeHours ?? "?"}h · ${triggered ? "trigger" : "bekleniyor"}${anomaly ? " (kucuk yedek anomali)" : ""}`,
        },
      },
    });
  } catch (_) {}

  if (severity === "CRITICAL") {
    try {
      await prismaClient.realtimeEvent.create({
        data: { channel: "ADMIN_FEED", eventType: "BACKUP_OVERDUE", payload: { lastAgeHours, anomaly } },
      });
    } catch (_) {}
  }

  lastActiveTaskAt_bk = Date.now();
  return { lastAgeHours, triggered, sizeMb, anomaly, envStatus };
}

// ============================================================================
// SECTION 9 — EXPORTS
// ============================================================================

module.exports = {
  start,
  stop,
  runDatabaseBackup,
  runStorageBackup,
  runStatusCheck,
  runActiveTask,
  shouldRunActiveTask,
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
