/**
 * src/os/modules/analyzer.js
 *
 * Tedbirge OS — Modul 9: Belge Analiz Kuyrugu (Document Analyzer)
 *
 * AMAC:
 *   Upload edilmis belgeleri (PDF, DOCX, image) analiz icin kuyruga alip
 *   sirayla isleyen asynchron job processor. Her belge icin:
 *     1. Dosya tipi tespiti (mimeType)
 *     2. Text extraction (pdf-parse / mammoth / OCR) - THIN'de stub
 *     3. AI siniflandirma (ai.complete ile) - sozlesme/fatura/rapor/dilekce
 *     4. Document.status -> ANALYZED, aiAnalysis doldur (Sprint 3 DB)
 *
 * MIMARI:
 *   - In-memory FIFO queue (Sprint 3'te DB tablosu / Supabase pg-boss)
 *   - 1 worker ile sirayla process (Sprint 3'te concurrency 3)
 *   - setInterval 10sn tick (idle worker ise queue'dan al)
 *   - Queue depth threshold: >20 -> ANALYZER_QUEUE_HIGH event
 *   - Event emit: ANALYZER_QUEUE_HIGH + ANALYZER_JOB_COMPLETED
 *   - reconciler registerPolicyHandler('analyzer') - queue backlog drift
 *
 * KAPSAM (Sprint 2 THIN):
 *   - enqueue(document) - Document objesi kuyruga
 *   - Sequential worker (1 at a time)
 *   - Mock AI analysis: ai.complete('bu belge nedir?')
 *   - Job history ring buffer (son 50)
 *   - Queue threshold event emit
 *   - start() / stop() idempotent
 *   - getStatus() + getQueue() + getJobHistory()
 *
 * KAPSAM DIŞI (Sprint 3+):
 *   - Gercek text extraction: pdf-parse (PDF), mammoth (DOCX), tesseract (OCR)
 *   - DB persist: Document.status UPLOADED -> PARSED -> ANALYZED gecis
 *   - Supabase Storage'dan dosya indir (getSignedUrl + fetch)
 *   - Concurrent worker pool (3+ paralel)
 *   - Retry policy (3 deneme + exp backoff)
 *   - AI siniflandirma prompt template (category detection)
 *   - Zoom/crop fotograf (hasar gorseli analizi)
 *
 * EVENT TYPES (eventBus EVENT_TYPES icinden):
 *   - ANALYZER_QUEUE_HIGH     ('analyzer:queue-depth-high')
 *   - ANALYZER_JOB_COMPLETED  ('analyzer:job-completed')
 *   (Not: 'analyzer:job-failed' EVENT_TYPES'ta yok - string literal kullaniyoruz)
 *
 * DATA CONTRACT (queue job):
 *   {
 *     id: 'job-xxx',
 *     documentId: Document.id (cmoXXX),
 *     originalName: 'sozlesme.pdf',
 *     mimeType: 'application/pdf',
 *     path: 'leads/xxx/123-sozlesme.pdf',
 *     enqueuedAt: ISO,
 *     status: 'queued' | 'processing' | 'completed' | 'failed',
 *     startedAt, completedAt, aiCategory, aiSummary, error
 *   }
 *
 * BAGIMLILIK:
 *   - ./eventBus — bus, EVENT_TYPES
 *   - ./reconciler — registerPolicyHandler
 *   - ./modules/ai — complete (runtime require, circular koruma)
 *
 * KULLANIM:
 *   const analyzer = require('./modules/analyzer');
 *   analyzer.start();
 *
 *   // Upload.controller.completeUpload sonunda:
 *   analyzer.enqueue({
 *     documentId: doc.id,
 *     originalName: doc.originalName,
 *     mimeType: doc.mimeType,
 *     path: doc.path,
 *   });
 */

"use strict";

const { bus, EVENT_TYPES } = require("../eventBus");

// ============================================================================
// SECTION 1 — CONSTANTS
// ============================================================================

const MODULE_NAME = "analyzer";

const TICK_INTERVAL_MS = 10 * 1000;         // 10 saniye
const HISTORY_SIZE = 50;
const QUEUE_HIGH_THRESHOLD = 20;
const JOB_TIMEOUT_MS = 60_000;              // 60sn (AI cagrisi dahil)

const EVENT_JOB_FAILED = "analyzer:job-failed";

const JOB_STATUS = Object.freeze({
  QUEUED: "queued",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
});

const AI_CATEGORIES = Object.freeze({
  SOZLESME: "sozlesme",
  FATURA: "fatura",
  RAPOR: "rapor",
  DILEKCE: "dilekce",
  KIMLIK: "kimlik",
  FOTOGRAF: "fotograf",
  DIGER: "diger",
});

// ============================================================================
// SECTION 2 — INTERNAL STATE
// ============================================================================

/** FIFO queue: Array<Job> */
const queue = [];

/** Tamamlanan job'larin ring buffer'i. */
const jobHistory = [];

/** Queue-high cooldown (spam koruma: 10 dakikada 1 alert max) */
let lastQueueHighAlert = 0;
const QUEUE_HIGH_COOLDOWN_MS = 10 * 60 * 1000;

let tickTimer = null;
let isRunning = false;
let isProcessing = false;

let totalEnqueued = 0;
let totalProcessed = 0;
let totalFailed = 0;

// ============================================================================
// SECTION 3 — QUEUE API
// ============================================================================

function generateJobId() {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Belgeyi kuyruga ekle.
 * @param {object} document - { documentId, originalName?, mimeType?, path? }
 */
function enqueue(document) {
  if (!document?.documentId) {
    throw new Error("enqueue: documentId zorunlu");
  }
  const job = {
    id: generateJobId(),
    documentId: document.documentId,
    originalName: document.originalName || null,
    mimeType: document.mimeType || null,
    path: document.path || null,
    enqueuedAt: new Date().toISOString(),
    status: JOB_STATUS.QUEUED,
    startedAt: null,
    completedAt: null,
    aiCategory: null,
    aiSummary: null,
    error: null,
  };
  queue.push(job);
  totalEnqueued++;
  return job;
}

function dequeue() {
  return queue.shift() || null;
}

function getQueue() {
  return [...queue];
}

function getQueueDepth() {
  return queue.length;
}

// ============================================================================
// SECTION 4 — HISTORY
// ============================================================================

function recordJob(job) {
  jobHistory.push(job);
  if (jobHistory.length > HISTORY_SIZE) {
    jobHistory.shift();
  }
}

function getJobHistory() {
  return [...jobHistory];
}

// ============================================================================
// SECTION 5 — AI ANALYSIS (runtime require, circular koruma)
// ============================================================================

/** ai.js'e delege eder. ai yuklu degilse mock cevap. */
async function callAi(job) {
  try {
    const ai = require("./ai");
    const prompt = `Bu belge nedir? Kategori olarak tek kelime don: sozlesme, fatura, rapor, dilekce, kimlik, fotograf, diger. Dosya adi: ${job.originalName || "bilinmiyor"}, tip: ${job.mimeType || "bilinmiyor"}.`;
    const result = await ai.complete(
      [{ role: "user", content: prompt }],
      { maxTokens: 50, timeoutMs: JOB_TIMEOUT_MS }
    );
    const text = (result.content || "").toLowerCase();
    let category = AI_CATEGORIES.DIGER;
    for (const [, v] of Object.entries(AI_CATEGORIES)) {
      if (text.includes(v)) {
        category = v;
        break;
      }
    }
    return {
      category,
      summary: result.content.slice(0, 200),
      mock: result.mock || false,
      tokens: result.tokens || 0,
    };
  } catch (err) {
    throw new Error(`ai analysis failed: ${err.message}`);
  }
}

// ============================================================================
// SECTION 6 — WORKER (single-threaded FIFO)
// ============================================================================

async function processOne(job) {
  job.status = JOB_STATUS.PROCESSING;
  job.startedAt = new Date().toISOString();

  try {
    // Sprint 3: text extraction (pdf-parse / mammoth / OCR)
    const aiResult = await callAi(job);

    job.aiCategory = aiResult.category;
    job.aiSummary = aiResult.summary;
    job.status = JOB_STATUS.COMPLETED;
    job.completedAt = new Date().toISOString();

    totalProcessed++;
    recordJob(job);

    await bus.emitOS(EVENT_TYPES.ANALYZER_JOB_COMPLETED, {
      severity: "info",
      module: MODULE_NAME,
      payload: {
        jobId: job.id,
        documentId: job.documentId,
        category: job.aiCategory,
        mock: aiResult.mock,
        tokens: aiResult.tokens,
        durationMs: Date.parse(job.completedAt) - Date.parse(job.startedAt),
      },
    });

    return job;
  } catch (err) {
    job.status = JOB_STATUS.FAILED;
    job.completedAt = new Date().toISOString();
    job.error = err.message;

    totalFailed++;
    recordJob(job);

    await bus.emitOS(EVENT_JOB_FAILED, {
      severity: "warning",
      module: MODULE_NAME,
      payload: {
        jobId: job.id,
        documentId: job.documentId,
        error: err.message,
      },
    });

    return job;
  }
}

async function runWorker() {
  if (isProcessing) return;
  isProcessing = true;
  try {
    while (queue.length > 0) {
      const job = dequeue();
      if (!job) break;
      await processOne(job);
    }
  } finally {
    isProcessing = false;
  }
}

// ============================================================================
// SECTION 7 — QUEUE DEPTH MONITORING
// ============================================================================

async function checkQueueHealth() {
  const depth = queue.length;
  if (depth >= QUEUE_HIGH_THRESHOLD) {
    if (Date.now() - lastQueueHighAlert < QUEUE_HIGH_COOLDOWN_MS) return;
    lastQueueHighAlert = Date.now();
    await bus.emitOS(EVENT_TYPES.ANALYZER_QUEUE_HIGH, {
      severity: depth >= QUEUE_HIGH_THRESHOLD * 2 ? "error" : "warning",
      module: MODULE_NAME,
      payload: { depth, threshold: QUEUE_HIGH_THRESHOLD, isProcessing },
    });
  }
}

// ============================================================================
// SECTION 8 — TICK
// ============================================================================

async function runTick() {
  try {
    await checkQueueHealth();
    if (!isProcessing && queue.length > 0) {
      runWorker().catch((err) => {
        console.error("[ANALYZER] worker unhandled:", err.message);
      });
    }
  } catch (err) {
    console.error("[ANALYZER] tick error:", err.message);
  }
}

// ============================================================================
// SECTION 9 — LIFECYCLE
// ============================================================================

function start() {
  if (isRunning) {
    console.warn("[ANALYZER] zaten calisiyor, start cagrisi gormezden gelindi");
    return;
  }
  isRunning = true;
  tickTimer = setInterval(() => {
    runTick().catch((err) => {
      console.error("[ANALYZER] unhandled tick error:", err.message);
    });
  }, TICK_INTERVAL_MS);
  console.log(
    `[ANALYZER] started: tick ${TICK_INTERVAL_MS / 1000}sn, queue threshold ${QUEUE_HIGH_THRESHOLD}, history ${HISTORY_SIZE}`
  );
}

function stop() {
  if (!isRunning) return;
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  isRunning = false;
  console.log("[ANALYZER] stopped");
}

// ============================================================================
// SECTION 10 — READ API
// ============================================================================

function getStatus() {
  return {
    isRunning,
    isProcessing,
    queueDepth: queue.length,
    queueHighThreshold: QUEUE_HIGH_THRESHOLD,
    totalEnqueued,
    totalProcessed,
    totalFailed,
    historySize: jobHistory.length,
    tickIntervalMs: TICK_INTERVAL_MS,
    jobTimeoutMs: JOB_TIMEOUT_MS,
  };
}

function resetState() {
  queue.length = 0;
  jobHistory.length = 0;
  totalEnqueued = 0;
  totalProcessed = 0;
  totalFailed = 0;
  lastQueueHighAlert = 0;
}

// ============================================================================
// SECTION 11 — RECONCILER POLICY HANDLER
// ============================================================================

async function policyHandler(policy, _prisma) {
  const key = policy?.key;
  if (!key) return { drift: false, action: null };

  if (key === "queue-backlog") {
    const threshold = parseInt(policy.value, 10) || QUEUE_HIGH_THRESHOLD;
    const depth = queue.length;
    return {
      drift: depth >= threshold,
      action: depth >= threshold ? "analyzer-backlog" : null,
      details: { depth, threshold },
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
// SECTION 12 — EXPORTS
// ============================================================================

module.exports = {
  start,
  stop,
  enqueue,
  runTick,
  runWorker,
  getStatus,
  getQueue,
  getQueueDepth,
  getJobHistory,
  resetState,
  MODULE_NAME,
  TICK_INTERVAL_MS,
  HISTORY_SIZE,
  QUEUE_HIGH_THRESHOLD,
  JOB_TIMEOUT_MS,
  JOB_STATUS,
  AI_CATEGORIES,
  EVENT_JOB_FAILED,
};
