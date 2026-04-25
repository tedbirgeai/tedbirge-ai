/**
 * src/os/modules/auditor.js
 *
 * Tedbirge OS — Modul 17: Auditor (Akıllı Bekçi)
 *
 * AMAC:
 *   Sistem genelinde drift, tutarsızlık, anomali tespit eden tarayıcı.
 *   6 kategori: schema_drift, env_inconsistency, prisma_violation,
 *   performance_drift, security_anomaly, cost_spike.
 *
 * MIMARI:
 *   - Bulgular SystemEvent tablosuna yazılır (yeni tablo YOK).
 *   - eventBus emit ('auditor:finding', ...) → Healer dinler.
 *   - Reconciler entegrasyonu (drift threshold tracking).
 *
 * KAPSAM (Sprint 2):
 *   - 6 tarama fonksiyonu
 *   - Saatlik / günlük / haftalık tarama programı
 *   - In-memory state (son tarama zamanı, sayıları)
 *   - getStatus() read API
 */

"use strict";

const { bus } = require("../eventBus");
const prisma = require("../../config/db");

const MODULE_NAME = "auditor";
const TICK_INTERVAL_MS = 60 * 60 * 1000; // 1 saat
const HISTORY_SIZE = 100;

// Tarama programı
const SCAN_SCHEDULE = {
  schema_drift:       { interval: 7 * 24 * 60 * 60 * 1000, lastRun: null }, // haftalık
  env_inconsistency:  { interval: 60 * 60 * 1000,           lastRun: null }, // saatlik
  prisma_violation:   { interval: 24 * 60 * 60 * 1000,      lastRun: null }, // günlük
  performance_drift:  { interval: 7 * 24 * 60 * 60 * 1000,  lastRun: null }, // haftalık
  security_anomaly:   { interval: 60 * 60 * 1000,           lastRun: null }, // saatlik
  cost_spike:         { interval: 60 * 60 * 1000,           lastRun: null }, // saatlik
};

let state = {
  started: false,
  tickInterval: null,
  totalFindings: 0,
  lastTickAt: null,
  history: [], // son 100 finding
};

const EVENT_FINDING = "auditor:finding";

// SECTION 1 — START / STOP
function start() {
  if (state.started) return;
  state.started = true;
  state.tickInterval = setInterval(runTick, TICK_INTERVAL_MS);
  // İlk tick — hemen
  setImmediate(runTick);
  bus.emit("auditor:started", { at: new Date().toISOString() });
}

function stop() {
  if (state.tickInterval) {
    clearInterval(state.tickInterval);
    state.tickInterval = null;
  }
  state.started = false;
  bus.emit("auditor:stopped", { at: new Date().toISOString() });
}

// SECTION 2 — TICK
async function runTick() {
  state.lastTickAt = new Date().toISOString();
  const now = Date.now();

  for (const [category, schedule] of Object.entries(SCAN_SCHEDULE)) {
    if (schedule.lastRun && now - schedule.lastRun < schedule.interval) continue;
    try {
      await runScan(category);
      schedule.lastRun = now;
    } catch (err) {
      console.error(`[auditor] ${category} scan failed:`, err.message);
    }
  }
}

async function runScan(category) {
  if (category === "schema_drift") {
    const { exec } = require("child_process");
    const { promisify } = require("util");
    const execAsync = promisify(exec);

    try {
      const result = await execAsync(
        "npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script",
        { timeout: 30000, cwd: process.cwd() }
      ).catch((e) => ({ stdout: "", stderr: e.message }));

      const hasDrift =
        result.stdout &&
        result.stdout.trim().length > 0 &&
        !result.stdout.includes("-- This is an empty migration");

      if (hasDrift) {
        await recordFinding({
          category: "schema_drift",
          severity: "WARNING",
          message: "Schema and database out of sync",
          detail: { sample: result.stdout.substring(0, 500) },
        });
      }
    } catch (err) {
      await recordFinding({
        category: "schema_drift",
        severity: "INFO",
        message: "Schema drift check failed",
        detail: { error: err.message },
      });
    }
    return;
  }

  if (category === "env_inconsistency") {
    const required = [
      "DATABASE_URL",
      "JWT_SECRET",
      "SUPABASE_URL",
      "SUPABASE_SERVICE_KEY",
      "SUPABASE_STORAGE_BUCKET",
      "ANTHROPIC_API_KEY",
    ];
    const missing = required.filter((k) => !process.env[k] || process.env[k].length < 10);

    if (missing.length > 0) {
      await recordFinding({
        category: "env_inconsistency",
        severity:
          missing.includes("DATABASE_URL") || missing.includes("JWT_SECRET")
            ? "CRITICAL"
            : "WARNING",
        message: `Missing or invalid env vars: ${missing.join(", ")}`,
        detail: { missing },
      });
    }
    return;
  }

  if (category === "prisma_violation") {
    const { exec } = require("child_process");
    const { promisify } = require("util");
    const execAsync = promisify(exec);

    try {
      const isWin = process.platform === "win32";
      const cmd = isWin
        ? "powershell.exe -Command \"Get-ChildItem -Path src -Recurse -Filter *.js | Select-String -Pattern 'new PrismaClient\\(' | Where-Object { $_.Path -notlike '*config\\db.js*' } | Measure-Object | Select-Object -ExpandProperty Count\""
        : "grep -rn \"new PrismaClient(\" src/ --include=\"*.js\" | grep -v \"src/config/db.js\" | wc -l";

      const { stdout } = await execAsync(cmd, { cwd: process.cwd(), timeout: 10000 });
      const violations = parseInt(stdout.trim(), 10);

      if (violations > 0) {
        await recordFinding({
          category: "prisma_violation",
          severity: "WARNING",
          message: `${violations} files using new PrismaClient() instead of singleton`,
          detail: { count: violations },
        });
      }
    } catch (err) {
      // Sessiz geç, scan failure kritik değil
    }
    return;
  }

  if (category === "cost_spike") {
    try {
      const costGuard = require("./costGuard");
      const status = costGuard.getStatus ? costGuard.getStatus() : null;
      if (!status) return;

      const usagePercent = status.dailyUsagePercent || 0;

      if (usagePercent >= 90) {
        await recordFinding({
          category: "cost_spike",
          severity: "CRITICAL",
          message: `Anthropic API günlük kullanım %${usagePercent.toFixed(1)} — kritik eşik`,
          detail: { usagePercent, threshold: 90 },
        });
      } else if (usagePercent >= 75) {
        await recordFinding({
          category: "cost_spike",
          severity: "WARNING",
          message: `Anthropic API günlük kullanım %${usagePercent.toFixed(1)}`,
          detail: { usagePercent, threshold: 75 },
        });
      }
    } catch (err) {
      // costGuard yoksa veya hata varsa — sessiz geç
    }
    return;
  }

  if (category === "performance_drift") {
    try {
      const performance = require("./performance");
      const status = performance.getStatus ? performance.getStatus() : null;
      if (!status) return;

      const recentP95 = status.recentP95Ms || 0;
      const baselineP95 = status.baselineP95Ms || 200;

      if (recentP95 > baselineP95 * 1.5) {
        await recordFinding({
          category: "performance_drift",
          severity: "WARNING",
          message: `Response time drift detected: ${recentP95}ms vs baseline ${baselineP95}ms`,
          detail: {
            recentP95,
            baselineP95,
            drift: (((recentP95 - baselineP95) / baselineP95) * 100).toFixed(1),
          },
        });
      }
    } catch (err) {
      // sessiz geç
    }
    return;
  }

  if (category === "security_anomaly") {
    try {
      const security = require("./security");
      const status = security.getStatus ? security.getStatus() : null;
      if (!status) return;

      const anomalies = status.recentAnomalies || [];
      const criticalAnomalies = anomalies.filter((a) => a.severity === "high");

      if (criticalAnomalies.length > 0) {
        await recordFinding({
          category: "security_anomaly",
          severity: "CRITICAL",
          message: `${criticalAnomalies.length} kritik güvenlik anomalisi tespit edildi`,
          detail: { anomalies: criticalAnomalies.slice(0, 5) },
        });
      } else if (anomalies.length > 10) {
        await recordFinding({
          category: "security_anomaly",
          severity: "WARNING",
          message: `${anomalies.length} güvenlik anomalisi son saatte`,
          detail: { count: anomalies.length },
        });
      }
    } catch (err) {
      // sessiz geç
    }
    return;
  }

  return null;
}

// SECTION 3 — FINDING KAYDETME
async function recordFinding({ category, severity, message, detail }) {
  try {
    const event = await prisma.systemEvent.create({
      data: {
        type: `audit:${category}`,
        severity,
        module: MODULE_NAME,
        payload: { message, detail: detail || {} },
      },
    });
    state.totalFindings += 1;
    state.history.unshift({
      id: event.id,
      category,
      severity,
      message,
      at: new Date().toISOString(),
    });
    if (state.history.length > HISTORY_SIZE) state.history.length = HISTORY_SIZE;
    bus.emit(EVENT_FINDING, { id: event.id, category, severity, message, detail });
  } catch (err) {
    console.error("[auditor] recordFinding failed:", err.message);
  }
}

// SECTION 4 — STATUS
function getStatus() {
  return {
    started: state.started,
    totalFindings: state.totalFindings,
    lastTickAt: state.lastTickAt,
    historySize: state.history.length,
    schedule: Object.fromEntries(
      Object.entries(SCAN_SCHEDULE).map(([k, v]) => [
        k,
        { lastRun: v.lastRun ? new Date(v.lastRun).toISOString() : null },
      ])
    ),
  };
}

function resetState() {
  state.totalFindings = 0;
  state.lastTickAt = null;
  state.history = [];
  Object.values(SCAN_SCHEDULE).forEach((s) => (s.lastRun = null));
}

// SECTION 5 — EXPORTS
module.exports = {
  start,
  stop,
  runTick,
  runScan,
  recordFinding,
  getStatus,
  resetState,
  MODULE_NAME,
  TICK_INTERVAL_MS,
  EVENT_FINDING,
};
