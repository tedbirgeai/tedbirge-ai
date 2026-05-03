/**
 * src/os/modules/insurance.js
 * Tedbirge OS — Modul 14: Sigorta Orchestrator (STUB)
 *
 * SBM adapter uzerinden police + KTT + eksper talep orchestrasyonu.
 * Sprint 4 anlasma bitince adapter gerceklesir, modul degismez.
 */

"use strict";

const { getAdapter } = require("../adapters/base");
const { bus } = require("../eventBus");

const MODULE_NAME = "insurance";
const TICK_INTERVAL_MS = 60 * 60 * 1000; // 1 saat
const HISTORY_SIZE = 50;
const ADAPTER_KEY = "sbm";

const QUERY_TYPES = Object.freeze({
  POLICE: "police-bilgi",
  KTT: "ktt",
  EKSPER: "eksper-atama",
  HASAR_GECMISI: "hasar-gecmisi",
});

const QUERY_STATUS = Object.freeze({
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  SKIPPED: "skipped",
});

const EVENT_QUERIED = "insurance:query-completed";
const EVENT_SKIPPED = "insurance:query-skipped";
const EVENT_FAILED = "insurance:query-failed";

const queryHistory = [];
let tickTimer = null;
let isRunning = false;
let totalQueries = 0;
let totalSkipped = 0;
let totalFailed = 0;

function recordQuery(rec) {
  queryHistory.push({ at: new Date().toISOString(), ...rec });
  if (queryHistory.length > HISTORY_SIZE) queryHistory.shift();
}

function adapterReady() {
  const a = getAdapter(ADAPTER_KEY);
  return a && a.isConfigured?.();
}

async function queryPolice(plaka, tc) {
  const a = getAdapter(ADAPTER_KEY);
  if (!adapterReady()) {
    totalSkipped++;
    const rec = { type: QUERY_TYPES.POLICE, status: QUERY_STATUS.SKIPPED, plaka, reason: "adapter-not-configured" };
    recordQuery(rec);
    await bus.emitOS(EVENT_SKIPPED, { severity: "info", module: MODULE_NAME, payload: rec });
    return { skipped: true, reason: "adapter-not-configured" };
  }
  try {
    const data = await a.getPoliceBilgi(plaka, tc);
    totalQueries++;
    const rec = { type: QUERY_TYPES.POLICE, status: QUERY_STATUS.COMPLETED, plaka, data };
    recordQuery(rec);
    await bus.emitOS(EVENT_QUERIED, { severity: "info", module: MODULE_NAME, payload: rec });
    return { ok: true, data };
  } catch (err) {
    totalFailed++;
    const rec = { type: QUERY_TYPES.POLICE, status: QUERY_STATUS.FAILED, plaka, error: err.message };
    recordQuery(rec);
    await bus.emitOS(EVENT_FAILED, { severity: "warning", module: MODULE_NAME, payload: rec });
    return { ok: false, error: err.message };
  }
}

async function queryKTT(kttNo) {
  const a = getAdapter(ADAPTER_KEY);
  if (!adapterReady()) {
    totalSkipped++;
    const rec = { type: QUERY_TYPES.KTT, status: QUERY_STATUS.SKIPPED, kttNo, reason: "adapter-not-configured" };
    recordQuery(rec);
    await bus.emitOS(EVENT_SKIPPED, { severity: "info", module: MODULE_NAME, payload: rec });
    return { skipped: true };
  }
  try {
    const data = await a.getKTT(kttNo);
    totalQueries++;
    const rec = { type: QUERY_TYPES.KTT, status: QUERY_STATUS.COMPLETED, kttNo, data };
    recordQuery(rec);
    await bus.emitOS(EVENT_QUERIED, { severity: "info", module: MODULE_NAME, payload: rec });
    return { ok: true, data };
  } catch (err) {
    totalFailed++;
    const rec = { type: QUERY_TYPES.KTT, status: QUERY_STATUS.FAILED, kttNo, error: err.message };
    recordQuery(rec);
    return { ok: false, error: err.message };
  }
}

async function requestEksper(basvuru) {
  const a = getAdapter(ADAPTER_KEY);
  if (!adapterReady()) {
    totalSkipped++;
    return { skipped: true, reason: "adapter-not-configured" };
  }
  try {
    const data = await a.requestEksperAtama(basvuru);
    totalQueries++;
    return { ok: true, data };
  } catch (err) {
    totalFailed++;
    return { ok: false, error: err.message };
  }
}

async function runTick() {
  const mode = adapterReady() ? (getAdapter(ADAPTER_KEY).getMode?.() || "unknown") : "skipped";
  console.log(`[INSURANCE] tick mode=${mode} queries=${totalQueries} skipped=${totalSkipped} failed=${totalFailed}`);
}

function start() {
  if (isRunning) return;
  isRunning = true;
  tickTimer = setInterval(() => runTick().catch(() => {}), TICK_INTERVAL_MS);
  console.log(`[INSURANCE] started: tick ${TICK_INTERVAL_MS / 3600000}h, adapter=${ADAPTER_KEY}`);
}

function stop() {
  if (!isRunning) return;
  if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
  isRunning = false;
  console.log("[INSURANCE] stopped");
}

function getStatus() {
  const a = getAdapter(ADAPTER_KEY);
  return {
    isRunning,
    totalQueries,
    totalSkipped,
    totalFailed,
    historySize: queryHistory.length,
    adapterRegistered: !!a,
    adapterConfigured: a?.isConfigured?.() || false,
    adapterMode: a?.getMode?.() || null,
    tickIntervalMs: TICK_INTERVAL_MS,
  };
}

function getQueryHistory() {
  return [...queryHistory];
}

function resetState() {
  queryHistory.length = 0;
  totalQueries = 0;
  totalSkipped = 0;
  totalFailed = 0;
}

try {
  const { registerPolicyHandler } = require("../reconciler");
  registerPolicyHandler(MODULE_NAME, async (policy) => {
    const key = policy?.key;
    if (key === "failure-rate") {
      const total = totalQueries + totalFailed;
      const rate = total > 0 ? (totalFailed / total) * 100 : 0;
      const threshold = parseFloat(policy.value) || 20;
      return { drift: rate > threshold, action: rate > threshold ? "investigate-failures" : null, details: { rate, threshold } };
    }
    return { drift: false, action: null };
  });
} catch (_) {}

// TUR #70 A8 — Sigorta modülü gerçek görev (SBM/sigorta lead metrics)
async function runStatusCheck() {
  const startTs = Date.now();
  const prismaClient = require("../../config/db");
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  let trafikLeads24h = 0;
  let activeSigorta = 0;
  try {
    [trafikLeads24h, activeSigorta] = await Promise.all([
      prismaClient.lead.count({
        where: { accidentType: { contains: "trafik", mode: "insensitive" }, createdAt: { gte: since } },
      }).catch(() => 0),
      prismaClient.lead.count({
        where: { status: { in: ["DOCS_PENDING", "ANALYZED", "OFFER_SENT", "ASSIGNED_TO_LAWYER"] } },
      }).catch(() => 0),
    ]);
  } catch (_) {}

  const inMem = typeof getStatus === "function" ? getStatus() : {};

  try {
    await prismaClient.agentEvent.create({
      data: {
        agentName: MODULE_NAME,
        eventType: "STATUS_CHECK",
        severity: "INFO",
        payload: {
          trafikLeads24h,
          activeSigorta,
          adapterConfigured: !!inMem.adapterConfigured,
          durationMs: Date.now() - startTs,
          message: `Sigorta · 24h ${trafikLeads24h} trafik lead, ${activeSigorta} aktif dosya · SBM entegrasyon: ${inMem.adapterConfigured ? "aktif" : "YOK (skip)"}`,
        },
      },
    });
  } catch (e) {
    console.error("[os/insurance] AgentEvent yazma hata:", e.message);
  }
  return { ok: true, trafikLeads24h, activeSigorta };
}

// TUR #72 A8 — runActiveTask
let lastActiveTaskAt_in = 0;
const IN_ACTIVE_INTERVAL_MS = 60 * 60 * 1000;
function shouldRunActiveTask() { return Date.now() - lastActiveTaskAt_in >= IN_ACTIVE_INTERVAL_MS; }

async function runActiveTask() {
  const startTs = Date.now();
  const prismaClient = require("../../config/db");
  const day = 24 * 60 * 60 * 1000;
  let autoAssigned = 0;
  let retried = 0;
  let criticalAlerts = 0;

  // 24h atanmamis trafik lead — sayim (gerçek auto-assign service yok, ADMIN_FEED öneri)
  try {
    const since24h = new Date(Date.now() - day);
    const unassigned = await prismaClient.lead.count({
      where: {
        kazaTuru: "TRAFIK",
        status: { in: ["NEW", "CONTACTED"] },
        assignments: { none: {} },
        createdAt: { lt: since24h },
      },
    });
    if (unassigned > 0) {
      try {
        await prismaClient.realtimeEvent.create({
          data: { channel: "ADMIN_FEED", eventType: "INSURANCE_UNASSIGNED", payload: { count: unassigned } },
        });
        criticalAlerts = unassigned > 5 ? 1 : 0;
      } catch (_) {}
    }
  } catch (_) {}

  const severity = criticalAlerts > 0 ? "CRITICAL" : "INFO";

  try {
    await prismaClient.agentEvent.create({
      data: {
        agentName: "insurance",
        eventType: "ACTION_TAKEN",
        severity,
        payload: {
          action_taken: { auto_assigned: autoAssigned, retried, critical_alerts: criticalAlerts },
          durationMs: Date.now() - startTs,
          message: `Sigorta · ${autoAssigned} auto-assign · ${criticalAlerts} kritik alert`,
        },
      },
    });
  } catch (_) {}

  lastActiveTaskAt_in = Date.now();
  return { autoAssigned, retried, criticalAlerts };
}

module.exports = {
  start, stop, runTick, runStatusCheck,
  runActiveTask, shouldRunActiveTask,
  queryPolice, queryKTT, requestEksper,
  getStatus, getQueryHistory, resetState,
  MODULE_NAME, TICK_INTERVAL_MS, HISTORY_SIZE,
  QUERY_TYPES, QUERY_STATUS,
  EVENT_QUERIED, EVENT_SKIPPED, EVENT_FAILED,
  ADAPTER_KEY,
};
