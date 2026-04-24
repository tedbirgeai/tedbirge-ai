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

module.exports = {
  start, stop, runTick,
  queryPolice, queryKTT, requestEksper,
  getStatus, getQueryHistory, resetState,
  MODULE_NAME, TICK_INTERVAL_MS, HISTORY_SIZE,
  QUERY_TYPES, QUERY_STATUS,
  EVENT_QUERIED, EVENT_SKIPPED, EVENT_FAILED,
  ADAPTER_KEY,
};
