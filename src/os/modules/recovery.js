/**
 * src/os/modules/recovery.js
 *
 * Tedbirge OS — Modul 3: Kurtarma (Recovery)
 *
 * AMAC:
 *   Pulse modulunun yaydigi system:health-changed event'lerini dinleyip,
 *   adapter degradation durumunda kurtarma aksiyonlari tetiklemek. Sprint 2
 *   THIN mode: tespit + log + notify; gercek restart/failover Sprint 3.
 *
 * MIMARI:
 *   - Event-driven (pulse'in emit ettigi EVENT_TYPES.SYSTEM_HEALTH_CHANGED)
 *   - Idempotent: ayni adapter icin ayni state gecisinde tek aksiyon
 *   - Cooldown: ayni adapter 5dk icinde tekrar degraded olsa aksiyon tekrarlanmaz
 *   - Sprint 2'de action tipi: 'notify' (log + event emit)
 *   - Sprint 3'te eklenecek action tipleri: 'restart', 'failover', 'escalate'
 *
 * KAPSAM (Sprint 2 THIN):
 *   - Event listener register (pulse SYSTEM_HEALTH_CHANGED)
 *   - Aksiyon karari: degraded ise notify, healthy'e donuste recovery log
 *   - Cooldown map (anti-spam)
 *   - start() / stop() idempotent
 *   - getStatus() read API
 *   - recordAction() ring buffer (son 50 aksiyon)
 *
 * KAPSAM DIŞI (Sprint 3+):
 *   - Gercek adapter.redeploy() tetikleme (supervisor araciligiyla)
 *   - Escalation chain (1. log -> 2. admin email -> 3. SMS)
 *   - Auto-failover (Render degraded -> Oracle'a switch)
 *   - Rollback otomasyonu (Vercel son basarili deployment'a don)
 *
 * EVENT TYPES:
 *   Dinlenen: EVENT_TYPES.SYSTEM_HEALTH_CHANGED (pulse'tan)
 *   Yayilan:  'system:recovery-action' (yeni, kendi namespace'inde)
 *
 * BAGIMLILIK:
 *   - ./eventBus — bus, EVENT_TYPES
 *   - ./adapters/base — getAdapter (aksiyon icin)
 *
 * KULLANIM:
 *   const recovery = require('./modules/recovery');
 *   recovery.start();  // listener kaydolur
 *
 *   // shutdown:
 *   recovery.stop();
 */

"use strict";

const { bus, EVENT_TYPES } = require("../eventBus");
const { getAdapter } = require("../adapters/base");

// ============================================================================
// SECTION 1 — CONSTANTS
// ============================================================================

const MODULE_NAME = "recovery";

const COOLDOWN_MS = 5 * 60 * 1000;         // 5 dakika (pulse interval ile ayni)
const ACTION_HISTORY_SIZE = 50;             // son 50 aksiyon ring buffer
const RECOVERY_EVENT_TYPE = "system:recovery-action";

const ACTION_TYPES = Object.freeze({
  NOTIFY: "notify",         // Sprint 2: sadece log + event
  RESTART: "restart",       // Sprint 3: adapter.redeploy()
  FAILOVER: "failover",     // Sprint 3: alternatif adapter'a switch
  ESCALATE: "escalate",     // Sprint 3: admin'e alert zinciri
});

// ============================================================================
// SECTION 2 — INTERNAL STATE
// ============================================================================

/**
 * Cooldown map: Map<adapterKey, timestamp>
 * Ayni adapter icin COOLDOWN_MS icinde ikinci aksiyon tetiklenmez.
 */
const cooldowns = new Map();

/**
 * Aksiyon history ring buffer:
 *   { at, adapterKey, adapterName, trigger, action, result }
 */
const actionHistory = [];

let isRunning = false;
let unsubscribe = null;
let totalActions = 0;
let skippedByCooldown = 0;

// ============================================================================
// SECTION 3 — COOLDOWN + IDEMPOTENCY
// ============================================================================

/**
 * Son aksiyondan beri COOLDOWN_MS gecti mi?
 */
function isInCooldown(adapterKey) {
  const last = cooldowns.get(adapterKey);
  if (!last) return false;
  return Date.now() - last < COOLDOWN_MS;
}

function markCooldown(adapterKey) {
  cooldowns.set(adapterKey, Date.now());
}

// ============================================================================
// SECTION 4 — ACTION RECORDING
// ============================================================================

function recordAction(record) {
  actionHistory.push(record);
  if (actionHistory.length > ACTION_HISTORY_SIZE) {
    actionHistory.shift();
  }
  totalActions++;
}

// ============================================================================
// SECTION 5 — ACTION DECISION
// ============================================================================

/**
 * Event payload'una gore aksiyon karari.
 * Sprint 2: tum degraded gecisler 'notify'. Sprint 3'te escalation eklenecek.
 */
function decideAction(payload) {
  const { currentStatus, previousStatus } = payload;
  if (currentStatus === "degraded") {
    return { type: ACTION_TYPES.NOTIFY, reason: "degradation-detected" };
  }
  if (currentStatus === "healthy" && previousStatus === "degraded") {
    return { type: ACTION_TYPES.NOTIFY, reason: "recovery-observed" };
  }
  return { type: null, reason: "no-action-needed" };
}

// ============================================================================
// SECTION 6 — ACTION EXECUTION
// ============================================================================

/**
 * Sprint 2 THIN: notify action sadece log + event emit.
 * Sprint 3'te action type'a gore gercek adapter.redeploy() vs cagrilacak.
 */
async function executeNotify(payload, action) {
  const msg = `[RECOVERY] ${payload.adapterKey} (${payload.adapterName}): ${payload.previousStatus} -> ${payload.currentStatus} | uptime24h=${payload.uptime24h}% streak=${payload.consecutiveFails}`;

  if (action.reason === "degradation-detected") {
    console.warn(msg);
  } else {
    console.log(msg);
  }

  return {
    ok: true,
    executedAt: new Date().toISOString(),
    details: {
      type: action.type,
      reason: action.reason,
    },
  };
}

/**
 * Aksiyonu uygula + history'e kaydet + downstream event emit.
 */
async function applyAction(payload, action) {
  let result;
  try {
    switch (action.type) {
      case ACTION_TYPES.NOTIFY:
        result = await executeNotify(payload, action);
        break;
      case ACTION_TYPES.RESTART:
      case ACTION_TYPES.FAILOVER:
      case ACTION_TYPES.ESCALATE:
        result = {
          ok: false,
          executedAt: new Date().toISOString(),
          details: { error: `${action.type} not implemented in Sprint 2` },
        };
        break;
      default:
        result = {
          ok: false,
          executedAt: new Date().toISOString(),
          details: { error: "unknown action type" },
        };
    }
  } catch (err) {
    result = {
      ok: false,
      executedAt: new Date().toISOString(),
      details: { error: err.message },
    };
  }

  recordAction({
    at: new Date().toISOString(),
    adapterKey: payload.adapterKey,
    adapterName: payload.adapterName,
    trigger: `${payload.previousStatus} -> ${payload.currentStatus}`,
    action: action.type,
    reason: action.reason,
    result,
  });

  // Downstream event (dashboard/audit icin)
  await bus.emitOS(RECOVERY_EVENT_TYPE, {
    severity: result.ok ? "info" : "error",
    module: MODULE_NAME,
    payload: {
      adapterKey: payload.adapterKey,
      adapterName: payload.adapterName,
      actionType: action.type,
      actionReason: action.reason,
      result,
      originalTrigger: payload,
    },
  });

  markCooldown(payload.adapterKey);
  return result;
}

// ============================================================================
// SECTION 7 — EVENT HANDLER
// ============================================================================

/**
 * Pulse'tan gelen SYSTEM_HEALTH_CHANGED event'ini isle.
 */
async function handleHealthChange(event) {
  const payload = event.payload || {};
  const key = payload.adapterKey;

  if (!key) {
    console.warn("[RECOVERY] event without adapterKey, skipped");
    return;
  }

  const action = decideAction(payload);
  if (!action.type) {
    return; // no-action-needed
  }

  if (isInCooldown(key)) {
    skippedByCooldown++;
    console.log(`[RECOVERY] ${key} in cooldown, action skipped (${action.type})`);
    return;
  }

  await applyAction(payload, action);
}

// ============================================================================
// SECTION 8 — LIFECYCLE
// ============================================================================

function start() {
  if (isRunning) {
    console.warn("[RECOVERY] zaten calisiyor, start cagrisi gormezden gelindi");
    return;
  }
  isRunning = true;
  unsubscribe = bus.onOS(EVENT_TYPES.SYSTEM_HEALTH_CHANGED, handleHealthChange);
  console.log(`[RECOVERY] started: listening ${EVENT_TYPES.SYSTEM_HEALTH_CHANGED}, cooldown ${COOLDOWN_MS / 60000}dk`);
}

function stop() {
  if (!isRunning) return;
  if (typeof unsubscribe === "function") {
    unsubscribe();
    unsubscribe = null;
  }
  isRunning = false;
  console.log("[RECOVERY] stopped");
}

// ============================================================================
// SECTION 9 — READ API
// ============================================================================

function getStatus() {
  return {
    isRunning,
    totalActions,
    skippedByCooldown,
    cooldownCount: cooldowns.size,
    historySize: actionHistory.length,
    recentActions: actionHistory.slice(-10),
  };
}

function getHistory() {
  return [...actionHistory];
}

/**
 * Test ve debug icin reset.
 */
function resetState() {
  cooldowns.clear();
  actionHistory.length = 0;
  totalActions = 0;
  skippedByCooldown = 0;
}

// ============================================================================
// SECTION 10 — TUR #70 A14 — runStatusCheck (FAILED Document + stuck lead recovery)
// ============================================================================

async function runStatusCheck() {
  const startTs = Date.now();
  const prismaClient = require("../../config/db");
  const day = 24 * 60 * 60 * 1000;
  const since7d = new Date(Date.now() - 7 * day);
  const since24h = new Date(Date.now() - day);

  let oldFailedDocs = 0;
  let stuckPendingLeads = 0;
  try {
    [oldFailedDocs, stuckPendingLeads] = await Promise.all([
      prismaClient.document.count({
        where: { status: "FAILED", updatedAt: { lt: since24h } },
      }).catch(() => 0),
      prismaClient.lead.count({
        where: {
          status: { in: ["NEW", "DOCS_PENDING", "CONTACTED"] },
          updatedAt: { lt: since7d },
        },
      }).catch(() => 0),
    ]);
  } catch (_) {}

  const severity = oldFailedDocs > 20 || stuckPendingLeads > 50 ? "WARNING" : "INFO";

  try {
    await prismaClient.agentEvent.create({
      data: {
        agentName: MODULE_NAME,
        eventType: "STATUS_CHECK",
        severity,
        payload: {
          oldFailedDocs24h: oldFailedDocs,
          stuckPendingLeads7d: stuckPendingLeads,
          durationMs: Date.now() - startTs,
          message: `Kurtarma · ${oldFailedDocs} eski FAILED Document (24h+) · ${stuckPendingLeads} sıkışmış PENDING lead (7d+)`,
        },
      },
    });
  } catch (e) {
    console.error("[os/recovery] AgentEvent yazma hata:", e.message);
  }
  return { ok: true, oldFailedDocs, stuckPendingLeads };
}

// ============================================================================
// SECTION 10B — TUR #72 A14 — runActiveTask (FAILED Document retry max 5)
// ============================================================================

let lastActiveTaskAt_rc = 0;
const RC_ACTIVE_INTERVAL_MS = 30 * 60 * 1000;
function shouldRunActiveTask() { return Date.now() - lastActiveTaskAt_rc >= RC_ACTIVE_INTERVAL_MS; }

async function runActiveTask() {
  const startTs = Date.now();
  const prismaClient = require("../../config/db");
  const day = 24 * 60 * 60 * 1000;
  let recovered = 0;
  let stuckAlerted = 0;
  let cronRestarted = 0;

  try {
    const failed = await prismaClient.document.findMany({
      where: { status: "FAILED", leadId: { not: null } },
      select: { id: true },
      take: 5,
    });
    if (failed.length > 0) {
      try {
        const { analyzeDocumentById } = require("../../services/uploadAnalysis.bridge");
        for (const doc of failed) {
          try { await analyzeDocumentById(doc.id); recovered++; } catch (_) {}
        }
      } catch (_) {}
    }

    // Stuck Lead PENDING 7 gun+
    const since7d = new Date(Date.now() - 7 * day);
    const stuck = await prismaClient.lead.count({
      where: { status: { in: ["NEW", "CONTACTED", "DOCS_PENDING"] }, updatedAt: { lt: since7d } },
    });
    if (stuck > 0) {
      try {
        await prismaClient.realtimeEvent.create({
          data: { channel: "ADMIN_FEED", eventType: "LEAD_STUCK_7D", payload: { count: stuck } },
        });
        stuckAlerted = stuck;
      } catch (_) {}
    }
  } catch (_) {}

  const severity = recovered > 0 || stuckAlerted > 0 ? "WARNING" : "INFO";

  try {
    await prismaClient.agentEvent.create({
      data: {
        agentName: "recovery",
        eventType: "ACTION_TAKEN",
        severity,
        payload: {
          action_taken: { recovered, stuck_alerted: stuckAlerted, cron_restarted: cronRestarted },
          durationMs: Date.now() - startTs,
          message: `Kurtarma · ${recovered} Document recover · ${stuckAlerted} Lead stuck alert`,
        },
      },
    });
  } catch (_) {}

  lastActiveTaskAt_rc = Date.now();
  return { recovered, stuckAlerted, cronRestarted };
}

// ============================================================================
// SECTION 11 — EXPORTS
// ============================================================================

module.exports = {
  start,
  stop,
  handleHealthChange,
  decideAction,
  runStatusCheck,
  runActiveTask,
  shouldRunActiveTask,
  getStatus,
  getHistory,
  resetState,
  MODULE_NAME,
  COOLDOWN_MS,
  ACTION_HISTORY_SIZE,
  ACTION_TYPES,
  RECOVERY_EVENT_TYPE,
};
