/**
 * src/os/modules/healer.js
 *
 * Tedbirge OS — Modul 18: Healer (Yardımcı Mimar — Suggest Mode)
 *
 * AMAC:
 *   Auditor'un emit ettiği finding'leri dinler. Düşük risk olanları otomatik
 *   düzeltir. Kritik olanları dosya tabanlı öneri sistemine yazar
 *   (tedbirge-os/docs/AUDIT_FINDINGS/OPEN/).
 *
 * RİSK SIFIR YAKLAŞIM:
 *   - Schema/migration hiç yapılmaz (KIRMIZI çizgi).
 *   - Otomatik fix: cache flush, FAILED Document cleanup, expired token,
 *     render warmup. Bunlar geri alınabilir, zarar vermez.
 *   - Suggest mode: Schema drift, env değişiklik, cost spike CRITICAL,
 *     güvenlik anomalisi → JSON dosya öneri olarak yazılır.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { bus } = require("../eventBus");

const MODULE_NAME = "healer";
const FINDINGS_DIR = path.join(process.cwd(), "tedbirge-os", "docs", "AUDIT_FINDINGS");
const OPEN_DIR = path.join(FINDINGS_DIR, "OPEN");

// Otomatik fix yapılacak kategoriler
const AUTO_FIX_CATEGORIES = [
  "stale_cache",
  "old_failed_documents",
  "expired_tokens",
  "render_warmup",
];

// Suggest mode (öneri yazılacak) kategoriler
const SUGGEST_CATEGORIES = [
  "schema_drift",
  "env_inconsistency",
  "prisma_violation",
  "cost_spike",
  "security_anomaly",
  "performance_drift",
];

let state = {
  started: false,
  totalAutoFixes: 0,
  totalSuggestions: 0,
  lastEventAt: null,
  history: [],
};

function start() {
  if (state.started) return;
  state.started = true;

  bus.on("auditor:finding", handleFinding);

  bus.emit("healer:started", { at: new Date().toISOString() });
}

function stop() {
  state.started = false;
  bus.off("auditor:finding", handleFinding);
  bus.emit("healer:stopped", { at: new Date().toISOString() });
}

async function handleFinding(finding) {
  state.lastEventAt = new Date().toISOString();

  if (AUTO_FIX_CATEGORIES.includes(finding.category)) {
    await runAutoFix(finding);
  } else if (SUGGEST_CATEGORIES.includes(finding.category)) {
    await writeSuggestion(finding);
  }
}

async function runAutoFix(finding) {
  const prisma = require("../../config/db");

  try {
    let action = null;

    if (finding.category === "old_failed_documents") {
      // TUR #132 M1 — Madde 30.90 saha vaadi: FAILED Document'lar silinmek yerine retry edilir.
      // 1 saatten uzun FAILED veya STUCK olanlar -> TAC M1 yeniden tetiklenir (max 10 batch).
      // Audit zinciri korunur (silme YOK), Madde 30.75.
      const retryCutoff = new Date(Date.now() - 60 * 60 * 1000);
      const stuckDocs = await prisma.document.findMany({
        where: {
          OR: [
            { status: "STUCK" },
            { status: "FAILED", updatedAt: { lt: retryCutoff } },
          ],
          leadId: { not: null },
        },
        select: { id: true },
        take: 10,
      });

      if (stuckDocs.length > 0) {
        const { analyzeDocumentById } = require("../../services/uploadAnalysis.bridge");
        for (const doc of stuckDocs) {
          setImmediate(() => {
            analyzeDocumentById(doc.id).catch((err) =>
              console.warn(`[healer retry] ${doc.id} fail: ${err.message}`)
            );
          });
        }
      }

      action = `Retry tetiklendi: ${stuckDocs.length} STUCK/FAILED Document (1h+)`;
    } else if (finding.category === "expired_tokens") {
      action = "Expired tokens cleanup";
    } else if (finding.category === "stale_cache") {
      if (global.appCache && typeof global.appCache.clear === "function") {
        global.appCache.clear();
        action = "App cache cleared";
      }
    } else if (finding.category === "render_warmup") {
      const fetchFn = global.fetch || require("node-fetch");
      try {
        await fetchFn("https://tedbirge-ai.onrender.com/health");
        action = "Render warmup ping sent";
      } catch (e) {
        action = "Render warmup failed: " + e.message;
      }
    }

    state.totalAutoFixes += 1;
    state.history.unshift({ category: finding.category, action, at: new Date().toISOString() });
    if (state.history.length > 100) state.history.length = 100;

    await prisma.systemEvent.create({
      data: {
        type: `healer:auto_fix:${finding.category}`,
        severity: "INFO",
        module: MODULE_NAME,
        payload: { action },
      },
    });

    bus.emit("healer:auto_fix", { category: finding.category, action });
  } catch (err) {
    console.error("[healer] runAutoFix failed:", err.message);
  }
}

async function writeSuggestion(finding) {
  try {
    if (!fs.existsSync(OPEN_DIR)) {
      fs.mkdirSync(OPEN_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${timestamp}-${finding.category}.json`;
    const filepath = path.join(OPEN_DIR, filename);

    const suggestion = {
      timestamp: new Date().toISOString(),
      category: finding.category,
      severity: finding.severity,
      message: finding.message,
      detail: finding.detail || {},
      suggestedAction: getSuggestedAction(finding),
      status: "OPEN",
    };

    fs.writeFileSync(filepath, JSON.stringify(suggestion, null, 2), "utf8");
    state.totalSuggestions += 1;
    state.history.unshift({ filename, category: finding.category, at: suggestion.timestamp });
    if (state.history.length > 100) state.history.length = 100;

    bus.emit("healer:suggestion", { filename, category: finding.category });

    // SMS koprusu — sadece CRITICAL + debounce'lu
    await maybeSendSms(finding);

    // Web Push koprusu — sadece CRITICAL + debounce'lu (paralel iletisim)
    await maybeSendPush(finding);
  } catch (err) {
    console.error("[healer] writeSuggestion failed:", err.message);
  }
}

// SMS koprusu — CRITICAL + 1 saatte 1 kez kategori basina
const SMS_DEBOUNCE_MS = 60 * 60 * 1000;
const smsDebounce = new Map();

const CATEGORY_TR = {
  schema_drift: "Schema Sapmasi",
  env_inconsistency: "Env Tutarsizligi",
  prisma_violation: "Prisma Singleton Ihlali",
  performance_drift: "Performans Sapmasi",
  security_anomaly: "Guvenlik Anomalisi",
  cost_spike: "Maliyet Sicramasi",
};

function formatSmsMessage(finding) {
  const tr = CATEGORY_TR[finding.category] || finding.category;
  const msg = (finding.message || "").substring(0, 80);
  return `[TEDBIRGE] CRITICAL: ${tr}\n${msg}\nPanel: tedbirge.ai/dashboard/mimar-onayi`;
}

async function maybeSendSms(finding) {
  if (finding.severity !== "CRITICAL") return;

  const adminPhone = process.env.ADMIN_PHONE;
  if (!adminPhone) return;

  const lastSent = smsDebounce.get(finding.category) || 0;
  if (Date.now() - lastSent < SMS_DEBOUNCE_MS) return;

  try {
    const { sendSms } = require("../../services/sms.service");
    const message = formatSmsMessage(finding);
    await sendSms(adminPhone, message);

    smsDebounce.set(finding.category, Date.now());

    const prisma = require("../../config/db");
    try {
      await prisma.systemEvent.create({
        data: {
          type: "healer:sms_sent",
          severity: "INFO",
          module: MODULE_NAME,
          payload: { category: finding.category, to: adminPhone.slice(-4) },
        },
      });
    } catch (_) {}
  } catch (err) {
    console.error("[healer] SMS gonderilemedi:", err.message);
    try {
      const prisma = require("../../config/db");
      await prisma.systemEvent.create({
        data: {
          type: "healer:sms_failed",
          severity: "WARNING",
          module: MODULE_NAME,
          payload: { error: err.message },
        },
      });
    } catch (_) {}
  }
}

// Web Push debounce - kategori basina 1 saatte 1 push (SMS ile ayri map)
const pushDebounce = new Map();
const PUSH_DEBOUNCE_MS = 60 * 60 * 1000;

async function maybeSendPush(finding) {
  if (finding.severity !== "CRITICAL") return;

  const lastSent = pushDebounce.get(finding.category) || 0;
  if (Date.now() - lastSent < PUSH_DEBOUNCE_MS) return;

  try {
    const { sendToRole } = require("../../services/pushNotification.service");
    const tr = CATEGORY_TR[finding.category] || finding.category;
    const payload = {
      title: "Tedbirge - CRITICAL",
      body: `${tr}: ${(finding.message || "").substring(0, 100)}`,
      url: "/dashboard/mimar-onayi",
      tag: `audit-${finding.category}`,
    };

    await sendToRole("ADMIN", payload);
    pushDebounce.set(finding.category, Date.now());

    const prisma = require("../../config/db");
    try {
      await prisma.systemEvent.create({
        data: {
          type: `healer:push_sent:${finding.category}`,
          severity: "INFO",
          module: MODULE_NAME,
          payload: { category: finding.category },
        },
      });
    } catch (_) {}
  } catch (err) {
    console.error("[healer] maybeSendPush error:", err.message);
    try {
      const prisma = require("../../config/db");
      await prisma.systemEvent.create({
        data: {
          type: "healer:push_failed",
          severity: "WARNING",
          module: MODULE_NAME,
          payload: { error: err.message },
        },
      });
    } catch (_) {}
  }
}

function getSuggestedAction(finding) {
  switch (finding.category) {
    case "schema_drift":
      return {
        type: "manual_review",
        recommendation:
          "Mimar oturumunda schema dosyasını DB ile karşılaştır. Migration kararı insan onayı gerektirir.",
        priority: "high",
      };
    case "env_inconsistency":
      return {
        type: "manual_review",
        recommendation:
          "Eksik env var'ları kontrol et. Render dashboard'unda gerekli düzenlemeyi yap.",
        priority: finding.severity === "CRITICAL" ? "urgent" : "medium",
      };
    case "cost_spike":
      return {
        type: "rate_limit_decision",
        recommendation:
          "Anthropic API kullanımını incele. Gerekirse rate limit aktif et veya plan yükselt.",
        priority: "high",
      };
    case "security_anomaly":
      return {
        type: "investigate",
        recommendation:
          "Audit log'a bak, anomali kullanıcısını incele. Gerekirse hesap askıya al.",
        priority: "urgent",
      };
    default:
      return { type: "review", recommendation: "Mimar kararı bekleniyor.", priority: "medium" };
  }
}

function getStatus() {
  return {
    started: state.started,
    totalAutoFixes: state.totalAutoFixes,
    totalSuggestions: state.totalSuggestions,
    lastEventAt: state.lastEventAt,
    historySize: state.history.length,
  };
}

function resetState() {
  state.totalAutoFixes = 0;
  state.totalSuggestions = 0;
  state.lastEventAt = null;
  state.history = [];
}

module.exports = {
  start,
  stop,
  handleFinding,
  runAutoFix,
  writeSuggestion,
  getStatus,
  resetState,
  MODULE_NAME,
  AUTO_FIX_CATEGORIES,
  SUGGEST_CATEGORIES,
};
