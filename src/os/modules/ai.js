/**
 * src/os/modules/ai.js
 *
 * Tedbirge OS — Modul 8: AI Servis Facade
 *
 * AMAC:
 *   AnthropicAdapter'i sararak LexScan, dilekce motoru, muhatap analizi ve
 *   diger AI servisleri icin TEK GIRIS NOKTASI saglamak. Her cagri:
 *     1. Adapter'a route eder (Anthropic -> Sprint 3'te OpenAI/Gemini)
 *     2. costGuard'a kullanim kaydeder (token sayisi)
 *     3. Mock mode fallback yapar (API key yoksa keyword-based cevap)
 *     4. Latency + token history tutar (in-memory ring buffer)
 *     5. Timeout / retry politikasi uygular
 *
 * MIMARI:
 *   - HAL uzerinden getAdapter('ai') cagrisi (registry key)
 *   - costGuard.recordUsage('anthropic-tokens', N) otomatik
 *   - Mock mode: keyword-based fallback (LexScan tarzi)
 *   - Request history ring buffer (son 100 cagri)
 *   - Circuit breaker pattern (5 ardisik fail -> 30sn mute)
 *   - Event emit: 'ai:request-completed' + 'ai:request-failed' + 'ai:circuit-open'
 *   - reconciler registerPolicyHandler('ai') - error rate drift
 *
 * KAPSAM (Sprint 2 THIN):
 *   - complete(messages, opts) - adapter.complete + cost kayit + mock fallback
 *   - Request history + latency + token tracking
 *   - Circuit breaker (consecutive fail threshold)
 *   - Mock fallback (keyword tabanli, KVKK/dilekce/muhatap icin basit cevap)
 *   - getStatus() read API
 *   - Timeout koruma (30sn default)
 *
 * KAPSAM DIŞI (Sprint 3+):
 *   - Multi-provider routing (primary Anthropic, fallback OpenAI)
 *   - Prompt caching (identical input -> cache hit, cost 0)
 *   - Streaming support (SSE)
 *   - Tool use / function calling
 *   - Pricing adapter (Sonnet vs Opus vs Haiku farkli fiyat)
 *   - Retry with exponential backoff
 *
 * EVENT TYPES (string literal, EVENT_TYPES'ta yok - Sprint 3'te eklenecek):
 *   - 'ai:request-completed'
 *   - 'ai:request-failed'
 *   - 'ai:circuit-open'
 *
 * BAGIMLILIK:
 *   - ./adapters/base — getAdapter
 *   - ./eventBus — bus
 *   - ./modules/costGuard — recordUsage (runtime require, circular koruma)
 *
 * KULLANIM:
 *   const ai = require('./modules/ai');
 *
 *   // LexScan cagrisi:
 *   const result = await ai.complete([
 *     { role: 'user', content: 'Bu sozlesme KVKK uyumlu mu?' }
 *   ]);
 *   console.log(result.content);
 *
 *   // Dilekce motoru:
 *   const plea = await ai.complete(messages, { maxTokens: 8000, system: 'Sen hukukcu asistanisin' });
 */

"use strict";

const { getAdapter } = require("../adapters/base");
const { bus } = require("../eventBus");

// ============================================================================
// SECTION 1 — CONSTANTS
// ============================================================================

const MODULE_NAME = "ai";
const AI_ADAPTER_KEY = "ai";

const DEFAULT_TIMEOUT_MS = 30_000;
const HISTORY_SIZE = 100;
const CIRCUIT_FAIL_THRESHOLD = 5;
const CIRCUIT_OPEN_MS = 30_000;

const EVENT_COMPLETED = "ai:request-completed";
const EVENT_FAILED = "ai:request-failed";
const EVENT_CIRCUIT_OPEN = "ai:circuit-open";

const MOCK_KEYWORDS = Object.freeze({
  kvkk: "KVKK degerlendirmesi: ilgili sozlesme incelendi. Mock mode - gercek AI analizi icin ANTHROPIC_API_KEY gerekli.",
  dilekce: "Dilekce sablonu: [Mock mode - gercek icerik icin AI aktif olmali]",
  muhatap: "Muhatap analizi: belirlenen taraf sigorta sirketi olabilir. Mock mode.",
  tazminat: "Tazminat hesabi mock degeri: X TL. Gercek hesap icin AI aktif olmali.",
});

// ============================================================================
// SECTION 2 — INTERNAL STATE
// ============================================================================

/** Request history ring buffer. */
const requestHistory = [];

let consecutiveFails = 0;
let circuitOpenUntil = 0;

let totalRequests = 0;
let totalTokens = 0;
let totalFailures = 0;
let totalMockFallbacks = 0;

// ============================================================================
// SECTION 3 — CIRCUIT BREAKER
// ============================================================================

function isCircuitOpen() {
  return Date.now() < circuitOpenUntil;
}

async function openCircuit() {
  circuitOpenUntil = Date.now() + CIRCUIT_OPEN_MS;
  await bus.emitOS(EVENT_CIRCUIT_OPEN, {
    severity: "error",
    module: MODULE_NAME,
    payload: {
      openedAt: new Date().toISOString(),
      openUntil: new Date(circuitOpenUntil).toISOString(),
      consecutiveFails,
    },
  });
}

function resetCircuit() {
  consecutiveFails = 0;
  circuitOpenUntil = 0;
}

// ============================================================================
// SECTION 4 — HISTORY
// ============================================================================

function recordRequest(record) {
  requestHistory.push(record);
  if (requestHistory.length > HISTORY_SIZE) {
    requestHistory.shift();
  }
  totalRequests++;
  if (record.tokens) totalTokens += record.tokens;
  if (!record.ok) totalFailures++;
  if (record.mock) totalMockFallbacks++;
}

// ============================================================================
// SECTION 5 — MOCK FALLBACK
// ============================================================================

function buildMockResponse(messages) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const text = (lastUser?.content || "").toLowerCase();
  for (const [keyword, reply] of Object.entries(MOCK_KEYWORDS)) {
    if (text.includes(keyword)) {
      return reply;
    }
  }
  return "Mock yanit: ANTHROPIC_API_KEY yapilandirilmadi. Gercek AI analizi icin adapter config gerekli.";
}

// ============================================================================
// SECTION 6 — COST TRACKING INTEGRATION
// ============================================================================

/** runtime require ile circular dep korumasi */
function trackCost(tokens) {
  try {
    const costGuard = require("./costGuard");
    if (typeof costGuard.recordUsage === "function") {
      costGuard.recordUsage("anthropic-tokens", tokens);
    }
  } catch (_) {
    // costGuard henuz yuklenmemis veya circular - sessiz gec
  }
}

// ============================================================================
// SECTION 7 — MAIN API: complete()
// ============================================================================

/**
 * Tek giris noktasi. Sarar AnthropicAdapter.complete().
 * @param {Array<{role:string, content:string}>} messages
 * @param {object} [opts] - { model, maxTokens, system, timeoutMs }
 * @returns {Promise<{content: string, tokens: number, latencyMs: number, mock: boolean}>}
 */
async function complete(messages, opts = {}) {
  const start = Date.now();
  const timeoutMs = opts.timeoutMs || DEFAULT_TIMEOUT_MS;

  // 1. Circuit check
  if (isCircuitOpen()) {
    const err = new Error("AI circuit open - too many consecutive failures");
    err.code = "CIRCUIT_OPEN";
    await bus.emitOS(EVENT_FAILED, {
      severity: "error",
      module: MODULE_NAME,
      payload: { error: err.message, circuitOpenUntil: new Date(circuitOpenUntil).toISOString() },
    });
    throw err;
  }

  // 2. Adapter resolve
  const adapter = getAdapter(AI_ADAPTER_KEY);

  // 3. Mock fallback: adapter yok VEYA isConfigured false
  if (!adapter || !adapter.isConfigured?.()) {
    const mockContent = buildMockResponse(messages);
    const latencyMs = Date.now() - start;
    recordRequest({
      at: new Date().toISOString(),
      ok: true,
      latencyMs,
      tokens: 0,
      model: "mock",
      messagesCount: messages.length,
      mock: true,
    });
    return { content: mockContent, tokens: 0, latencyMs, mock: true };
  }

  // 4. Timeout ile gercek adapter cagrisi
  try {
    const result = await Promise.race([
      adapter.complete(messages, opts),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI timeout")), timeoutMs)
      ),
    ]);
    const latencyMs = Date.now() - start;
    const tokens = result?.tokens || 0;

    if (tokens > 0) trackCost(tokens);

    recordRequest({
      at: new Date().toISOString(),
      ok: true,
      latencyMs,
      tokens,
      model: adapter.getModelName?.() || "unknown",
      messagesCount: messages.length,
      mock: false,
    });

    resetCircuit();

    await bus.emitOS(EVENT_COMPLETED, {
      severity: "info",
      module: MODULE_NAME,
      payload: { latencyMs, tokens, model: adapter.getModelName?.() || "unknown", mock: false },
    });

    return { content: result.content, tokens, latencyMs, mock: false };
  } catch (err) {
    const latencyMs = Date.now() - start;
    consecutiveFails++;

    recordRequest({
      at: new Date().toISOString(),
      ok: false,
      latencyMs,
      tokens: 0,
      model: adapter.getModelName?.() || "unknown",
      messagesCount: messages.length,
      mock: false,
      error: err.message,
    });

    await bus.emitOS(EVENT_FAILED, {
      severity: "warning",
      module: MODULE_NAME,
      payload: { error: err.message, latencyMs, consecutiveFails },
    });

    if (consecutiveFails >= CIRCUIT_FAIL_THRESHOLD) {
      await openCircuit();
    }

    throw err;
  }
}

// ============================================================================
// SECTION 8 — READ API
// ============================================================================

function getStatus() {
  const successful = requestHistory.filter((r) => r.ok && !r.mock).length;
  const failed = requestHistory.filter((r) => !r.ok).length;
  const mocked = requestHistory.filter((r) => r.mock).length;
  const windowSize = requestHistory.length;
  const avgLatencyMs =
    windowSize > 0
      ? Math.round(requestHistory.reduce((acc, r) => acc + r.latencyMs, 0) / windowSize)
      : 0;
  const errorRatePercent =
    windowSize > 0 ? Math.round((failed / windowSize) * 100) : 0;

  return {
    totalRequests,
    totalTokens,
    totalFailures,
    totalMockFallbacks,
    consecutiveFails,
    circuitOpen: isCircuitOpen(),
    circuitOpenUntil: circuitOpenUntil > 0 ? new Date(circuitOpenUntil).toISOString() : null,
    window: { size: windowSize, successful, failed, mocked, avgLatencyMs, errorRatePercent },
    adapterRegistered: !!getAdapter(AI_ADAPTER_KEY),
    adapterConfigured: getAdapter(AI_ADAPTER_KEY)?.isConfigured?.() || false,
  };
}

function getRequestHistory() {
  return [...requestHistory];
}

function resetState() {
  requestHistory.length = 0;
  resetCircuit();
  totalRequests = 0;
  totalTokens = 0;
  totalFailures = 0;
  totalMockFallbacks = 0;
}

// ============================================================================
// SECTION 9 — RECONCILER POLICY HANDLER
// ============================================================================

async function policyHandler(policy, _prisma) {
  const key = policy?.key;
  if (!key) return { drift: false, action: null };

  if (key === "error-rate") {
    const threshold = parseFloat(policy.value) || 25;
    const windowSize = requestHistory.length;
    if (windowSize < 10) {
      return { drift: false, action: null, details: { reason: "insufficient-data", windowSize } };
    }
    const failed = requestHistory.filter((r) => !r.ok).length;
    const actual = (failed / windowSize) * 100;
    return {
      drift: actual > threshold,
      action: actual > threshold ? "investigate-ai-errors" : null,
      details: { actualRate: actual, threshold, windowSize },
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
// SECTION 10 — TUR #69 A1 — runStatusCheck (gerçek görev + AgentEvent persistence)
// ============================================================================

/**
 * Auditor/manuel tick tarafından çağrılır.
 * Anthropic API health + 24h AI metrics + AgentEvent kaydı.
 */
async function runStatusCheck() {
  const start = Date.now();
  const prisma = require("../../config/db");
  const apiKey = process.env.ANTHROPIC_API_KEY;

  let claudeOK = false;
  let claudeError = null;

  // 1. Anthropic health (lightweight ping — claude-haiku, max_tokens=10)
  if (apiKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 10,
          messages: [{ role: "user", content: "ping" }],
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      claudeOK = res.ok;
      if (!res.ok) claudeError = `HTTP ${res.status}`;
    } catch (err) {
      claudeError = err.message || "fetch error";
    }
  } else {
    claudeError = "ANTHROPIC_API_KEY missing";
  }

  // 2-4. DB metrics (24h pencere)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let aiRequests24h = 0;
  let failed24h = 0;
  let lastDocAt = null;

  try {
    [aiRequests24h, failed24h, lastDocAt] = await Promise.all([
      prisma.document.count({
        where: { aiAnalysis: { not: null }, updatedAt: { gte: since } },
      }),
      prisma.document.count({
        where: { status: "FAILED", updatedAt: { gte: since } },
      }),
      prisma.document
        .findFirst({
          where: { aiAnalysis: { not: null } },
          orderBy: { updatedAt: "desc" },
          select: { updatedAt: true },
        })
        .then((d) => d?.updatedAt || null),
    ]);
  } catch (dbErr) {
    console.error("[os/ai] runStatusCheck DB hata:", dbErr.message);
  }

  const duration = Date.now() - start;

  // 5. In-memory ring buffer'dan circuit ve mock istatistikleri
  const circuitOpen = isCircuitOpen();
  const mockFallbacks = totalMockFallbacks;

  // 6. AgentEvent yaz (agentName="ai" — sistem-durumu UI MODULES key eşleşmesi)
  const severity = !claudeOK || circuitOpen ? "WARNING" : "INFO";
  try {
    await prisma.agentEvent.create({
      data: {
        agentName: MODULE_NAME, // "ai"
        eventType: "STATUS_CHECK",
        severity,
        payload: {
          claudeOK,
          claudeError,
          aiRequests24h,
          failed24h,
          lastDocAt: lastDocAt?.toISOString() || null,
          circuitOpen,
          mockFallbacks,
          durationMs: duration,
          message: claudeOK
            ? `Yapay Zeka health OK · ${aiRequests24h} AI/24h · ${failed24h} FAILED`
            : `Anthropic erişim hatası: ${claudeError}`,
        },
      },
    });
  } catch (evtErr) {
    console.error("[os/ai] AgentEvent yazma hata:", evtErr.message);
  }

  // 7. KRITIK durumda RealtimeEvent ADMIN_FEED
  if (severity === "WARNING" && (failed24h > 5 || circuitOpen)) {
    try {
      await prisma.realtimeEvent.create({
        data: {
          channel: "ADMIN_FEED",
          eventType: "AI_HEALTH_DEGRADED",
          payload: { failed24h, circuitOpen, claudeError },
        },
      });
    } catch (_) {}
  }

  return {
    ok: claudeOK,
    aiRequests24h,
    failed24h,
    lastDocAt,
    circuitOpen,
    mockFallbacks,
    durationMs: duration,
  };
}

// ============================================================================
// SECTION 11 — EXPORTS
// ============================================================================

module.exports = {
  complete,
  getStatus,
  runStatusCheck,
  getRequestHistory,
  resetState,
  MODULE_NAME,
  AI_ADAPTER_KEY,
  DEFAULT_TIMEOUT_MS,
  HISTORY_SIZE,
  CIRCUIT_FAIL_THRESHOLD,
  CIRCUIT_OPEN_MS,
  EVENT_COMPLETED,
  EVENT_FAILED,
  EVENT_CIRCUIT_OPEN,
  MOCK_KEYWORDS,
};
