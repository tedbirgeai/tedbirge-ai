/**
 * src/os/modules/deploy.js
 *
 * Tedbirge OS — Modul 12: Deployment Orchestrator (Deploy)
 *
 * AMAC:
 *   Vercel (panel) + Render (backend) deployment'larini koordineli takip
 *   etmek. Git push -> iki platform paralel deploy eder. Bu modul:
 *     1. Son deployment'lari listeler (iki adapter'dan paralel)
 *     2. Deploy sonrasi health check tetikler (pulse yardimiyla)
 *     3. Basarisiz deploy tespitinde rollback onerisi
 *     4. Deploy metrikleri: surelik, basari/hata rate, lead time
 *     5. Event emit: 'deploy:detected', 'deploy:health-check', 'deploy:failed'
 *
 *   HAL'in gercek guc gosterisi: hem Vercel hem Render DeploymentAdapter/
 *   HostingAdapter arayuzleri uzerinden konusuluyor. Yarin Netlify'a
 *   gecsek bu modul hic degismez - sadece adapter.
 *
 * MIMARI:
 *   - setInterval 2dk tick (deployment listesi kisa cache)
 *   - getAdapter('deployment') + getAdapter('hosting') paralel sorgu
 *   - Son deployment hash/id in-memory (yeni deploy tespiti icin)
 *   - Deployment history ring buffer (son 50)
 *   - Post-deploy health check: deploy detect -> 60sn bekle -> ping
 *   - reconciler registerPolicyHandler('deploy') - deploy freshness drift
 *
 * KAPSAM (Sprint 2 THIN):
 *   - pollDeployments() - adapter.listDeployments() paralel
 *   - detectNewDeployment() - son ID ile karsilastir, yeni ise kayit
 *   - triggerPostDeployHealthCheck() - 60sn sonra adapter.getHealth
 *   - Deploy metrics: count, success rate, avg lead time
 *   - Event emit: deploy:detected + deploy:health-check + deploy:failed
 *   - getStatus() + getDeployHistory()
 *   - start() / stop() idempotent
 *
 * KAPSAM DIŞI (Sprint 3+):
 *   - Gercek rollback trigger (Vercel promote deployment API)
 *   - Pre-deploy DB migration coordination
 *   - Blue-green deploy pattern
 *   - Canary deployment (% traffic shift)
 *   - Deploy approval workflow (admin onay)
 *   - DORA metrics (deploy freq, MTTR, change failure rate, lead time)
 *
 * EVENT TYPES (string literal):
 *   - 'deploy:detected'
 *   - 'deploy:health-check'
 *   - 'deploy:failed'
 *
 * DATA CONTRACT (deployment kayit):
 *   {
 *     id, platform (vercel|render|oracle), deploymentId,
 *     status (queued|building|ready|error),
 *     detectedAt, healthCheckedAt?, healthOk?,
 *     raw (adapter response)
 *   }
 *
 * BAGIMLILIK:
 *   - ./adapters/base — getAdapter
 *   - ./eventBus — bus
 *   - ./reconciler — registerPolicyHandler
 *
 * KULLANIM:
 *   const deploy = require('./modules/deploy');
 *   deploy.start();
 *
 *   // Manuel polling (test/admin):
 *   const result = await deploy.pollDeployments();
 */

"use strict";

const { getAdapter } = require("../adapters/base");
const { bus } = require("../eventBus");

// ============================================================================
// SECTION 1 — CONSTANTS
// ============================================================================

const MODULE_NAME = "deploy";

const TICK_INTERVAL_MS = 2 * 60 * 1000;        // 2 dakika
const HEALTH_CHECK_DELAY_MS = 60 * 1000;        // deploy tespitinden 60sn sonra
const HISTORY_SIZE = 50;
const POLL_TIMEOUT_MS = 10_000;

const PLATFORMS = Object.freeze({
  VERCEL: "vercel",
  RENDER: "render",
  ORACLE: "oracle",
});

const DEPLOY_STATUS = Object.freeze({
  QUEUED: "queued",
  BUILDING: "building",
  READY: "ready",
  ERROR: "error",
  UNKNOWN: "unknown",
});

const EVENT_DETECTED = "deploy:detected";
const EVENT_HEALTH_CHECK = "deploy:health-check";
const EVENT_FAILED = "deploy:failed";

// Adapter registry keys (boot.js'te kaydedildi varsayiliyor)
const ADAPTER_KEYS = Object.freeze({
  DEPLOYMENT: "deployment",  // Vercel
  HOSTING: "hosting",        // Render
});

// ============================================================================
// SECTION 2 — INTERNAL STATE
// ============================================================================

/**
 * Deployment history ring buffer.
 */
const deployHistory = [];

/**
 * Son gorulen deployment ID'leri - yeni tespit icin.
 * Map<platform, lastDeploymentId>
 */
const lastSeenIds = new Map();

let tickTimer = null;
let isRunning = false;
let totalTicks = 0;
let totalDetected = 0;
let totalHealthChecks = 0;
let totalFailures = 0;

// ============================================================================
// SECTION 3 — HISTORY
// ============================================================================

function recordDeploy(record) {
  deployHistory.push(record);
  if (deployHistory.length > HISTORY_SIZE) {
    deployHistory.shift();
  }
}

function normalizeStatus(raw) {
  const s = (raw || "").toString().toLowerCase();
  if (s.includes("ready") || s === "succeeded" || s === "live") return DEPLOY_STATUS.READY;
  if (s.includes("build") || s === "deploying") return DEPLOY_STATUS.BUILDING;
  if (s.includes("queue")) return DEPLOY_STATUS.QUEUED;
  if (s.includes("error") || s === "failed" || s === "canceled") return DEPLOY_STATUS.ERROR;
  return DEPLOY_STATUS.UNKNOWN;
}

// ============================================================================
// SECTION 4 — POLLING
// ============================================================================

/**
 * Vercel DeploymentAdapter.listDeployments() cagrisi.
 * Hata durumunda bos array + error flag.
 */
async function pollVercel() {
  const adapter = getAdapter(ADAPTER_KEYS.DEPLOYMENT);
  if (!adapter || !adapter.isConfigured?.()) {
    return { platform: PLATFORMS.VERCEL, deployments: [], skipped: true, reason: "not-configured" };
  }
  try {
    const list = await Promise.race([
      adapter.listDeployments(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("poll timeout")), POLL_TIMEOUT_MS)),
    ]);
    const deployments = (list || []).map((d) => ({
      deploymentId: d.id,
      status: normalizeStatus(d.status),
      rawStatus: d.status,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : null,
    }));
    return { platform: PLATFORMS.VERCEL, deployments };
  } catch (err) {
    return { platform: PLATFORMS.VERCEL, deployments: [], error: err.message };
  }
}

/**
 * Render HostingAdapter - listDeployments yok, getHealth ile olcum.
 * Sprint 3'te Render API /v1/services/:id/deploys eklenince gercek liste.
 */
async function pollRender() {
  const adapter = getAdapter(ADAPTER_KEYS.HOSTING);
  if (!adapter || !adapter.isConfigured?.()) {
    return { platform: PLATFORMS.RENDER, deployments: [], skipped: true, reason: "not-configured" };
  }
  try {
    // THIN: sadece health ping al - listeleme Sprint 3'te
    const health = await adapter.getHealth();
    return {
      platform: PLATFORMS.RENDER,
      deployments: health.ok
        ? [{
            deploymentId: `render-current-${Date.now().toString(36)}`,
            status: DEPLOY_STATUS.READY,
            rawStatus: `health ${health.status || 200}`,
            createdAt: health.at || new Date().toISOString(),
          }]
        : [],
      healthCheck: health,
    };
  } catch (err) {
    return { platform: PLATFORMS.RENDER, deployments: [], error: err.message };
  }
}

async function pollDeployments() {
  const [vercel, render] = await Promise.allSettled([pollVercel(), pollRender()]);
  const results = [];
  if (vercel.status === "fulfilled") results.push(vercel.value);
  if (render.status === "fulfilled") results.push(render.value);
  return results;
}

// ============================================================================
// SECTION 5 — DETECTION
// ============================================================================

/**
 * Son gorulen ID ile karsilastir, yeni deployment ise event emit + history.
 */
async function detectNewDeployments(pollResults) {
  const detected = [];
  for (const platformResult of pollResults) {
    const { platform, deployments } = platformResult;
    if (!deployments || deployments.length === 0) continue;

    const newest = deployments[0]; // adapter sorted desc
    const lastId = lastSeenIds.get(platform);

    if (!lastId) {
      // Ilk tick - sadece kaydet, event emit YOK
      lastSeenIds.set(platform, newest.deploymentId);
      continue;
    }

    if (newest.deploymentId !== lastId) {
      // Yeni deployment!
      lastSeenIds.set(platform, newest.deploymentId);
      const record = {
        id: `deploy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        platform,
        deploymentId: newest.deploymentId,
        status: newest.status,
        detectedAt: new Date().toISOString(),
        healthCheckedAt: null,
        healthOk: null,
        raw: newest,
      };
      recordDeploy(record);
      totalDetected++;
      detected.push(record);

      await bus.emitOS(EVENT_DETECTED, {
        severity: "info",
        module: MODULE_NAME,
        payload: {
          platform,
          deploymentId: newest.deploymentId,
          status: newest.status,
        },
      });

      // Post-deploy health check schedule
      setTimeout(() => {
        runPostDeployHealthCheck(record).catch((err) => {
          console.error("[DEPLOY] post-deploy health check error:", err.message);
        });
      }, HEALTH_CHECK_DELAY_MS);
    }
  }
  return detected;
}

// ============================================================================
// SECTION 6 — POST-DEPLOY HEALTH CHECK
// ============================================================================

async function runPostDeployHealthCheck(record) {
  totalHealthChecks++;

  let healthOk = false;
  let healthDetails = null;

  try {
    const adapterKey = record.platform === PLATFORMS.RENDER
      ? ADAPTER_KEYS.HOSTING
      : ADAPTER_KEYS.DEPLOYMENT;
    const adapter = getAdapter(adapterKey);
    if (adapter && adapter.getHealth) {
      const h = await adapter.getHealth();
      healthOk = Boolean(h.ok);
      healthDetails = h;
    }
  } catch (err) {
    healthDetails = { error: err.message };
  }

  // History kaydini guncelle
  const idx = deployHistory.findIndex((r) => r.id === record.id);
  if (idx !== -1) {
    deployHistory[idx].healthCheckedAt = new Date().toISOString();
    deployHistory[idx].healthOk = healthOk;
  }

  if (!healthOk) {
    totalFailures++;
    await bus.emitOS(EVENT_FAILED, {
      severity: "error",
      module: MODULE_NAME,
      payload: {
        platform: record.platform,
        deploymentId: record.deploymentId,
        healthDetails,
      },
    });
  } else {
    await bus.emitOS(EVENT_HEALTH_CHECK, {
      severity: "info",
      module: MODULE_NAME,
      payload: {
        platform: record.platform,
        deploymentId: record.deploymentId,
        healthOk,
        healthDetails,
      },
    });
  }

  return { record, healthOk, healthDetails };
}

// ============================================================================
// SECTION 7 — TICK
// ============================================================================

async function runTick() {
  totalTicks++;
  try {
    const results = await pollDeployments();
    await detectNewDeployments(results);
  } catch (err) {
    console.error("[DEPLOY] tick error:", err.message);
  }
  console.log(
    `[DEPLOY] tick=${totalTicks} detected=${totalDetected} healthChecks=${totalHealthChecks} failures=${totalFailures}`
  );
}

// ============================================================================
// SECTION 8 — LIFECYCLE
// ============================================================================

function start() {
  if (isRunning) {
    console.warn("[DEPLOY] zaten calisiyor, start cagrisi gormezden gelindi");
    return;
  }
  isRunning = true;
  tickTimer = setInterval(() => {
    runTick().catch((err) => {
      console.error("[DEPLOY] unhandled tick error:", err.message);
    });
  }, TICK_INTERVAL_MS);
  console.log(
    `[DEPLOY] started: tick ${TICK_INTERVAL_MS / 60000}dk, health check delay ${HEALTH_CHECK_DELAY_MS / 1000}sn, history ${HISTORY_SIZE}`
  );
}

function stop() {
  if (!isRunning) return;
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  isRunning = false;
  console.log("[DEPLOY] stopped");
}

// ============================================================================
// SECTION 9 — READ API
// ============================================================================

function getStatus() {
  const successful = deployHistory.filter((r) => r.healthOk === true).length;
  const failed = deployHistory.filter((r) => r.healthOk === false).length;
  const pending = deployHistory.filter((r) => r.healthOk === null).length;
  return {
    isRunning,
    totalTicks,
    totalDetected,
    totalHealthChecks,
    totalFailures,
    historySize: deployHistory.length,
    deploySummary: { successful, failed, pending },
    lastSeenIds: Object.fromEntries(lastSeenIds),
    tickIntervalMs: TICK_INTERVAL_MS,
  };
}

function getDeployHistory() {
  return [...deployHistory];
}

function resetState() {
  deployHistory.length = 0;
  lastSeenIds.clear();
  totalTicks = 0;
  totalDetected = 0;
  totalHealthChecks = 0;
  totalFailures = 0;
}

// ============================================================================
// SECTION 10 — RECONCILER POLICY HANDLER
// ============================================================================

/**
 * Policy: deploy-freshness - son basarili deploy > maxAge ise drift
 */
async function policyHandler(policy, _prisma) {
  const key = policy?.key;
  if (!key) return { drift: false, action: null };

  if (key === "deploy-freshness") {
    const maxAgeDays = parseFloat(policy.value) || 7;
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    const lastSuccessful = [...deployHistory]
      .reverse()
      .find((r) => r.healthOk === true);
    if (!lastSuccessful) {
      return {
        drift: false,
        action: null,
        details: { reason: "no-successful-deploy-in-history" },
      };
    }
    const ageMs = Date.now() - Date.parse(lastSuccessful.detectedAt);
    return {
      drift: ageMs > maxAgeMs,
      action: ageMs > maxAgeMs ? "stale-deployment" : null,
      details: { ageMs, maxAgeMs, lastDetectedAt: lastSuccessful.detectedAt },
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
// SECTION 11 — TUR #69 A7 — runStatusCheck (Vercel + Render last deployment)
// ============================================================================

/**
 * Yayın Sistemi modülü gerçek görev:
 *  - VERCEL_API_TOKEN + RENDER_API_KEY env kontrolü
 *  - İkisi varsa son deployment status sorgula
 *  - Boş ise SKIP mode + INFO "yayın sistemi disabled"
 */
async function runStatusCheck() {
  const startTs = Date.now();
  const prismaClient = require("../../config/db");

  const vercelToken = process.env.VERCEL_API_TOKEN;
  const vercelProject = process.env.VERCEL_PROJECT_ID;
  const renderKey = process.env.RENDER_API_KEY;
  const renderService = process.env.RENDER_SERVICE_ID;

  const hasVercel = !!(vercelToken && vercelProject);
  const hasRender = !!(renderKey && renderService);

  let severity = "INFO";
  let payload = {};

  if (!hasVercel && !hasRender) {
    payload = {
      mode: "SKIP",
      hasVercel: false,
      hasRender: false,
      message: "Yayın Sistemi · ENV (VERCEL_API_TOKEN/RENDER_API_KEY) eksik, SKIP mode",
      durationMs: Date.now() - startTs,
    };
  } else {
    let vercel = null;
    let render = null;

    if (hasVercel) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10_000);
        const teamSuffix = process.env.VERCEL_TEAM_ID ? `&teamId=${process.env.VERCEL_TEAM_ID}` : "";
        const res = await fetch(
          `https://api.vercel.com/v6/deployments?projectId=${vercelProject}&limit=1${teamSuffix}`,
          { headers: { Authorization: `Bearer ${vercelToken}` }, signal: controller.signal },
        );
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          const d = data?.deployments?.[0];
          if (d) {
            vercel = {
              state: d.state,
              created: d.created,
              ageMinutes: Math.round((Date.now() - d.created) / 60000),
              url: d.url,
            };
          }
        } else {
          vercel = { error: `HTTP ${res.status}` };
        }
      } catch (err) {
        vercel = { error: err.message || "fetch error" };
      }
    }

    if (hasRender) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10_000);
        const res = await fetch(
          `https://api.render.com/v1/services/${renderService}/deploys?limit=1`,
          { headers: { Authorization: `Bearer ${renderKey}` }, signal: controller.signal },
        );
        clearTimeout(timer);
        if (res.ok) {
          const arr = await res.json();
          const d = Array.isArray(arr) ? arr[0]?.deploy : null;
          if (d) {
            const created = new Date(d.createdAt || d.created_at).getTime();
            render = {
              status: d.status,
              created: d.createdAt || d.created_at,
              ageMinutes: Math.round((Date.now() - created) / 60000),
              commit: d.commit?.id?.slice(0, 7) || null,
            };
          }
        } else {
          render = { error: `HTTP ${res.status}` };
        }
      } catch (err) {
        render = { error: err.message || "fetch error" };
      }
    }

    // Severity belirle
    const vercelFailed = vercel?.state && /ERROR|FAILED|CANCELED/i.test(vercel.state);
    const renderFailed = render?.status && /failed|deactivated/i.test(render.status);
    const apiError = vercel?.error || render?.error;

    if (vercelFailed || renderFailed) {
      severity = "CRITICAL";
    } else if (apiError) {
      severity = "WARNING";
    } else {
      severity = "INFO";
    }

    payload = {
      mode: "ACTIVE",
      hasVercel,
      hasRender,
      vercel,
      render,
      durationMs: Date.now() - startTs,
      message: vercelFailed || renderFailed
        ? `Yayın · DEPLOY HATASI · vercel=${vercel?.state || '-'} render=${render?.status || '-'}`
        : `Yayın · vercel=${vercel?.state || 'skip'} render=${render?.status || 'skip'}`,
    };
  }

  try {
    await prismaClient.agentEvent.create({
      data: {
        agentName: MODULE_NAME, // "deploy"
        eventType: "STATUS_CHECK",
        severity,
        payload,
      },
    });
  } catch (evtErr) {
    console.error("[os/deploy] AgentEvent yazma hata:", evtErr.message);
  }

  if (severity === "CRITICAL") {
    try {
      await prismaClient.realtimeEvent.create({
        data: {
          channel: "ADMIN_FEED",
          eventType: "DEPLOY_FAILED",
          payload,
        },
      });
    } catch (_) {}
  }

  return { ok: severity !== "CRITICAL", severity, ...payload };
}

// ============================================================================
// SECTION 12 — EXPORTS
// ============================================================================

module.exports = {
  start,
  stop,
  pollDeployments,
  runTick,
  runStatusCheck,
  runPostDeployHealthCheck,
  getStatus,
  getDeployHistory,
  resetState,
  MODULE_NAME,
  TICK_INTERVAL_MS,
  HEALTH_CHECK_DELAY_MS,
  HISTORY_SIZE,
  POLL_TIMEOUT_MS,
  PLATFORMS,
  DEPLOY_STATUS,
  EVENT_DETECTED,
  EVENT_HEALTH_CHECK,
  EVENT_FAILED,
  ADAPTER_KEYS,
};
