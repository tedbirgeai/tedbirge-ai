/**
 * src/os/modules/navigation.js
 * Tedbirge OS — Modul 15: Navigation Route Health
 *
 * Panel'in kritik route'lari 200 dondurur mu kontrolu.
 * Vercel uzerinden panel 404/500 erken tespiti.
 */

"use strict";

const { bus } = require("../eventBus");

const MODULE_NAME = "navigation";
const TICK_INTERVAL_MS = 10 * 60 * 1000; // 10 dakika
const FETCH_TIMEOUT_MS = 8000;
const HISTORY_SIZE = 100;
const COOLDOWN_MS = 30 * 60 * 1000;

const CRITICAL_ROUTES = Object.freeze([
  "/",
  "/giris",
  "/basvuru-sorgula",
  "/kvkk",
  "/hakkimizda",
]);

const EVENT_ROUTE_DOWN = "navigation:route-down";
const EVENT_ROUTE_UP = "navigation:route-up";

const PANEL_URL = process.env.PANEL_URL || "https://www.tedbirge.ai";

const routeStatus = new Map(); // routePath -> { lastStatus, lastCheck, consecutiveFails }
const cooldowns = new Map();
const checkHistory = [];

let tickTimer = null;
let isRunning = false;
let totalChecks = 0;
let totalDown = 0;

function recordCheck(rec) {
  checkHistory.push({ at: new Date().toISOString(), ...rec });
  if (checkHistory.length > HISTORY_SIZE) checkHistory.shift();
}

function isInCooldown(key) {
  const last = cooldowns.get(key);
  if (!last) return false;
  return Date.now() - last < COOLDOWN_MS;
}

function markCooldown(key) {
  cooldowns.set(key, Date.now());
}

async function checkRoute(routePath, baseUrl) {
  const url = (baseUrl || PANEL_URL).replace(/\/$/, "") + routePath;
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "manual",
    });
    clearTimeout(to);
    const latencyMs = Date.now() - startedAt;
    const ok = res.status >= 200 && res.status < 400;
    return { ok, status: res.status, latencyMs };
  } catch (err) {
    clearTimeout(to);
    return { ok: false, status: 0, latencyMs: Date.now() - startedAt, error: err.message };
  }
}

async function checkAllRoutes(baseUrl) {
  const results = [];
  for (const route of CRITICAL_ROUTES) {
    totalChecks++;
    const check = await checkRoute(route, baseUrl);
    const prev = routeStatus.get(route) || { consecutiveFails: 0 };
    const newFails = check.ok ? 0 : prev.consecutiveFails + 1;

    const wasDown = prev.lastStatus !== undefined && !(prev.lastStatus >= 200 && prev.lastStatus < 400);
    const isDown = !check.ok;

    routeStatus.set(route, {
      lastStatus: check.status,
      lastCheck: new Date().toISOString(),
      lastLatencyMs: check.latencyMs,
      consecutiveFails: newFails,
    });

    recordCheck({ route, status: check.status, ok: check.ok, latencyMs: check.latencyMs, error: check.error });
    results.push({ route, ...check, consecutiveFails: newFails });

    // Transition events
    if (isDown && newFails >= 2 && !isInCooldown(`down-${route}`)) {
      markCooldown(`down-${route}`);
      totalDown++;
      await bus.emitOS(EVENT_ROUTE_DOWN, {
        severity: newFails >= 5 ? "error" : "warning",
        module: MODULE_NAME,
        payload: { route, status: check.status, consecutiveFails: newFails, error: check.error },
      });
    } else if (!isDown && wasDown) {
      await bus.emitOS(EVENT_ROUTE_UP, {
        severity: "info",
        module: MODULE_NAME,
        payload: { route, status: check.status, latencyMs: check.latencyMs },
      });
    }
  }
  return results;
}

async function runTick() {
  try {
    await checkAllRoutes();
  } catch (err) {
    console.error("[NAVIGATION] tick error:", err.message);
  }
  const downCount = Array.from(routeStatus.values()).filter(s => !(s.lastStatus >= 200 && s.lastStatus < 400)).length;
  console.log(`[NAVIGATION] tick checks=${totalChecks} routes=${CRITICAL_ROUTES.length} down=${downCount} totalDown=${totalDown}`);
}

function start() {
  if (isRunning) return;
  isRunning = true;
  tickTimer = setInterval(() => runTick().catch(() => {}), TICK_INTERVAL_MS);
  console.log(`[NAVIGATION] started: tick ${TICK_INTERVAL_MS / 60000}dk, routes=${CRITICAL_ROUTES.length}, panel=${PANEL_URL}`);
}

function stop() {
  if (!isRunning) return;
  if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
  isRunning = false;
  console.log("[NAVIGATION] stopped");
}

function getStatus() {
  const routes = {};
  for (const [path, s] of routeStatus.entries()) routes[path] = s;
  return {
    isRunning,
    totalChecks,
    totalDown,
    panelUrl: PANEL_URL,
    criticalRoutes: CRITICAL_ROUTES,
    routeCount: CRITICAL_ROUTES.length,
    routes,
    historySize: checkHistory.length,
    tickIntervalMs: TICK_INTERVAL_MS,
  };
}

function getCheckHistory() {
  return [...checkHistory];
}

function resetState() {
  routeStatus.clear();
  cooldowns.clear();
  checkHistory.length = 0;
  totalChecks = 0;
  totalDown = 0;
}

try {
  const { registerPolicyHandler } = require("../reconciler");
  registerPolicyHandler(MODULE_NAME, async (policy) => {
    const key = policy?.key;
    if (key === "routes-down") {
      const downCount = Array.from(routeStatus.values()).filter(s => !(s.lastStatus >= 200 && s.lastStatus < 400)).length;
      const threshold = parseInt(policy.value, 10) || 1;
      return { drift: downCount >= threshold, action: downCount >= threshold ? "routes-degraded" : null, details: { downCount, threshold } };
    }
    return { drift: false, action: null };
  });
} catch (_) {}

// TUR #70 A10 — Yönlendirme modülü gerçek görev (atanmamış lead + avukat yük dengesi)
async function runStatusCheck() {
  const startTs = Date.now();
  const prismaClient = require("../../config/db");
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  let unassigned24h = 0;
  let lawyerLoadDelta = 0;
  try {
    unassigned24h = await prismaClient.lead.count({
      where: {
        createdAt: { lt: since24h },
        status: { in: ["NEW", "CONTACTED", "DOCS_PENDING", "ANALYZED"] },
        assignments: { none: {} },
      },
    }).catch(() => 0);

    const loads = await prismaClient.assignment.groupBy({
      by: ["lawyerId"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
    }).catch(() => []);
    if (loads.length > 0) {
      const counts = loads.map((l) => l._count._all);
      lawyerLoadDelta = Math.max(...counts) - Math.min(...counts);
    }
  } catch (_) {}

  const severity = unassigned24h > 10 || lawyerLoadDelta > 5 ? "WARNING" : "INFO";

  try {
    await prismaClient.agentEvent.create({
      data: {
        agentName: MODULE_NAME,
        eventType: "STATUS_CHECK",
        severity,
        payload: {
          unassigned24h,
          lawyerLoadDelta,
          durationMs: Date.now() - startTs,
          message: `Yönlendirme · ${unassigned24h} atanmamış (24h+) · avukat yük farkı: ${lawyerLoadDelta}`,
        },
      },
    });
  } catch (e) {
    console.error("[os/navigation] AgentEvent yazma hata:", e.message);
  }
  return { ok: true, unassigned24h, lawyerLoadDelta };
}

// TUR #72 A10 — runActiveTask: 24h+ atanmamis lead alert + lawyer load delta
let lastActiveTaskAt_nv = 0;
const NV_ACTIVE_INTERVAL_MS = 60 * 60 * 1000;
function shouldRunActiveTask() { return Date.now() - lastActiveTaskAt_nv >= NV_ACTIVE_INTERVAL_MS; }

async function runActiveTask() {
  const startTs = Date.now();
  const prismaClient = require("../../config/db");
  const day = 24 * 60 * 60 * 1000;
  let autoAssigned = 0;
  let candidatesAvailable = 0;
  let rebalanceSuggestions = 0;
  let mismatchAlerts = 0;
  const errors = [];

  try {
    const since24h = new Date(Date.now() - day);

    // TUR #72.5 H5 — gercek auto-assign trigger (max 5/tick)
    const unassignedLeads = await prismaClient.lead.findMany({
      where: {
        status: { in: ["NEW", "CONTACTED", "DOCS_PENDING", "ANALYZED"] },
        assignments: { none: {} },
        createdAt: { lt: since24h },
      },
      select: { id: true, kazaTuru: true },
      orderBy: { createdAt: "asc" },
      take: 5,
    });
    candidatesAvailable = unassignedLeads.length;

    if (unassignedLeads.length > 0) {
      let autoAssignFn;
      try {
        const svc = require("../../services/assignment.service");
        autoAssignFn = svc.autoAssignLead;
      } catch (e) {
        errors.push(`service load: ${e.message?.slice(0, 60)}`);
      }
      if (typeof autoAssignFn === "function") {
        for (const lead of unassignedLeads) {
          try {
            const r = await autoAssignFn(lead.id);
            if (r?.ok) autoAssigned++;
            else if (r?.reason && r.reason !== "already_assigned") errors.push(r.reason.slice(0, 60));
          } catch (assignErr) {
            errors.push(`lead ${lead.id.slice(0, 8)}: ${assignErr.message?.slice(0, 60)}`);
          }
        }
      }
    }

    // ADMIN_FEED bildirim (en az 1 unassigned varsa)
    if (candidatesAvailable > 0) {
      try {
        await prismaClient.realtimeEvent.create({
          data: {
            channel: "ADMIN_FEED",
            eventType: "NAV_UNASSIGNED_24H",
            payload: { count: candidatesAvailable, auto_assigned: autoAssigned },
          },
        });
      } catch (_) {}
    }

    // Lawyer load delta — REBALANCE ONERI (gercek atama YOK, ADMIN_FEED öneri)
    const lawyers = await prismaClient.user.findMany({
      where: { role: "LAWYER", isActive: true },
      select: { id: true, _count: { select: { assignments: { where: { status: "ACTIVE" } } } } },
    });
    if (lawyers.length > 1) {
      const counts = lawyers.map((l) => l._count.assignments);
      const max = Math.max(...counts);
      const min = Math.min(...counts);
      if (max - min > 5) {
        rebalanceSuggestions = 1;
        try {
          await prismaClient.realtimeEvent.create({
            data: {
              channel: "ADMIN_FEED",
              eventType: "NAV_REBALANCE_SUGGESTION",
              payload: { delta: max - min, max, min },
            },
          });
        } catch (_) {}
      }
    }
  } catch (outerErr) {
    errors.push(`outer: ${outerErr.message?.slice(0, 60)}`);
  }

  const severity = rebalanceSuggestions > 0 || mismatchAlerts > 0 || errors.length > 0 ? "WARNING" : "INFO";

  try {
    await prismaClient.agentEvent.create({
      data: {
        agentName: "navigation",
        eventType: "ACTION_TAKEN",
        severity,
        payload: {
          action_taken: {
            auto_assigned: autoAssigned,
            candidates_available: candidatesAvailable,
            rebalance_suggestions: rebalanceSuggestions,
            mismatch_alerts: mismatchAlerts,
          },
          errors: errors.slice(0, 3),
          durationMs: Date.now() - startTs,
          message: `Yonlendirme · ${autoAssigned}/${candidatesAvailable} otomatik atama · ${rebalanceSuggestions} rebalance oneri${errors.length > 0 ? ` · ${errors.length} hata` : ""}`,
        },
      },
    });
  } catch (_) {}

  lastActiveTaskAt_nv = Date.now();
  return { autoAssigned, candidatesAvailable, rebalanceSuggestions, mismatchAlerts, errors };
}

module.exports = {
  start, stop, runTick, runStatusCheck,
  runActiveTask, shouldRunActiveTask,
  checkRoute, checkAllRoutes,
  getStatus, getCheckHistory, resetState,
  MODULE_NAME, TICK_INTERVAL_MS, FETCH_TIMEOUT_MS, HISTORY_SIZE, COOLDOWN_MS,
  CRITICAL_ROUTES, PANEL_URL,
  EVENT_ROUTE_DOWN, EVENT_ROUTE_UP,
};
