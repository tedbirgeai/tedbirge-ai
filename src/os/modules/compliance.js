/**
 * src/os/modules/compliance.js
 *
 * Tedbirge OS — Modul 5: Uyum Bekcisi (Compliance Guard)
 *
 * AMAC:
 *   KVKK + GDPR uyumunun otomatik denetleyicisi. Veri sozlesmelerinin
 *   (SCC - Standard Contractual Clauses) suresinin dolmasi, veri sahibi
 *   talepleri (erisim/silme/tasima), audit log yasam suresi gibi hukuki
 *   yukumlulukleri takip eder.
 *
 *   Tedbirge hassas hukuki veri tutar: saglik raporu, mali durum, adli
 *   sabika, kaza fotograflari. KVKK m.6 (ozel nitelikli veri) + m.9
 *   (yurt disi aktarim) zorunluluklari var. Bu modul onlari OTOMATIK
 *   izler - insan unutursa sistem hatirlatir.
 *
 * MIMARI:
 *   - setInterval gunluk tick (hukuki sureler dakikalik degil)
 *   - 3 ayri kontrol: SCC expiry, data subject request SLA, audit log retention
 *   - In-memory SCC registry (Sprint 3'te DB tablosu)
 *   - In-memory DSR (Data Subject Request) queue (Sprint 3'te DB)
 *   - Event emit: KVKK_SCC_EXPIRING + KVKK_DATA_SUBJECT_REQUEST
 *   - reconciler registerPolicyHandler('compliance')
 *
 * KAPSAM (Sprint 2 THIN):
 *   - SCC registry: addScc / removeScc / listSccs
 *   - SCC expiry check: <30 gun kaldiysa event emit
 *   - DSR queue: addRequest / completeRequest / listPending
 *   - DSR SLA check: 30 gun KVKK yasal sure, >25 gun ise uyari
 *   - Audit log retention placeholder (Sprint 3 gercek DB silme)
 *   - getStatus() read API
 *   - start() / stop() idempotent
 *
 * KAPSAM DIŞI (Sprint 3+):
 *   - SCC metadata DB tablosu (kalici)
 *   - DSR workflow UI (admin onay ekranı)
 *   - Otomatik ActivityLog silme (retention policy)
 *   - VERBIS register senkron
 *   - DPIA (Data Protection Impact Assessment) template
 *   - GDPR Article 33 ihlal bildirimi (72 saat saati)
 *
 * EVENT TYPES (eventBus EVENT_TYPES icinden):
 *   - KVKK_SCC_EXPIRING         ('kvkk:scc-expiring')
 *   - KVKK_DATA_SUBJECT_REQUEST ('kvkk:data-subject-request')
 *
 * DATA CONTRACT (SCC ornegi):
 *   {
 *     id: 'scc-supabase-2025',
 *     processor: 'Supabase Inc.',
 *     signedAt: '2025-04-01T00:00:00Z',
 *     validUntil: '2026-10-01T00:00:00Z',
 *     jurisdiction: 'US',
 *     dataCategory: 'belge + lead metadata',
 *   }
 *
 * DATA CONTRACT (DSR ornegi):
 *   {
 *     id: 'dsr-001',
 *     type: 'access' | 'erasure' | 'portability' | 'rectification',
 *     requesterId: 'Lead.id veya User.id',
 *     requestedAt: '2026-04-20T10:30:00Z',
 *     dueBy: '2026-05-20T10:30:00Z',     // +30 gun
 *     status: 'pending' | 'in_progress' | 'completed' | 'rejected',
 *     completedAt: null,
 *   }
 *
 * BAGIMLILIK:
 *   - ./eventBus — bus, EVENT_TYPES
 *   - ./reconciler — registerPolicyHandler
 *
 * KULLANIM:
 *   const compliance = require('./modules/compliance');
 *   compliance.start();
 *
 *   // Yeni veri isleyen sozlesmesi:
 *   compliance.addScc({ id: 'scc-1', processor: 'Anthropic', validUntil: '2026-12-31' });
 *
 *   // Muvekkil silme talebi:
 *   compliance.addRequest({ type: 'erasure', requesterId: 'lead-123' });
 */

"use strict";

const { bus, EVENT_TYPES } = require("../eventBus");
const { registerPolicyHandler } = require("../reconciler");
const prisma = require("../../config/db");

// ============================================================================
// SECTION 1 — CONSTANTS
// ============================================================================

const MODULE_NAME = "compliance";

const TICK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 saat
const SCC_EXPIRY_WARN_DAYS = 30;               // 30 gun kaldiysa uyari
const DSR_SLA_DAYS = 30;                        // KVKK m.13 - 30 gunluk sure
const DSR_WARN_DAYS = 25;                       // 25 gun gectiyse acil uyari
const AUDIT_LOG_RETENTION_DAYS = 365 * 2;       // 2 yil default (KVKK onerisi)

const DSR_TYPES = Object.freeze({
  ACCESS: "access",
  ERASURE: "erasure",
  PORTABILITY: "portability",
  RECTIFICATION: "rectification",
});

const DSR_STATUS = Object.freeze({
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  REJECTED: "rejected",
});

// ============================================================================
// SECTION 2 — INTERNAL STATE
// ============================================================================

/** SCC (Standard Contractual Clauses) registry. Map<id, SccRecord> */
const sccRegistry = new Map();

/** Data Subject Request queue. Map<id, DsrRecord> */
const dsrQueue = new Map();

/** Cooldown: ayni SCC/DSR icin gunde 1 alert */
const sccCooldown = new Map();
const dsrCooldown = new Map();

let tickTimer = null;
let isRunning = false;
let totalTicks = 0;
let alertsEmitted = 0;

// ============================================================================
// SECTION 3 — SCC (Sozlesme) Management
// ============================================================================

/**
 * Yeni veri isleyen sozlesmesi ekle — in-memory + DB upsert.
 * @param {object} scc - { id, processor, signedAt, validUntil, jurisdiction, dataCategory }
 */
async function addScc(scc) {
  if (!scc?.id || !scc?.processor || !scc?.validUntil) {
    throw new Error("addScc: id, processor, validUntil zorunlu");
  }
  const record = {
    ...scc,
    addedAt: new Date().toISOString(),
  };
  sccRegistry.set(scc.id, record);

  try {
    await prisma.kVKKSCC.upsert({
      where: { id: scc.id },
      update: {
        dataProcessor: scc.processor,
        country: scc.jurisdiction || "UNKNOWN",
        sccSignedAt: scc.signedAt ? new Date(scc.signedAt) : new Date(),
        expiresAt: scc.validUntil ? new Date(scc.validUntil) : null,
        status: "ACTIVE",
        notlar: scc.dataCategory || null,
      },
      create: {
        id: scc.id,
        dataProcessor: scc.processor,
        country: scc.jurisdiction || "UNKNOWN",
        sccSignedAt: scc.signedAt ? new Date(scc.signedAt) : new Date(),
        expiresAt: scc.validUntil ? new Date(scc.validUntil) : null,
        status: "ACTIVE",
        notlar: scc.dataCategory || null,
      },
    });
  } catch (err) {
    console.error("[COMPLIANCE] addScc DB upsert hatasi:", err.message);
  }

  return record;
}

function removeScc(id) {
  return sccRegistry.delete(id);
}

function listSccs() {
  return Array.from(sccRegistry.values());
}

function daysUntil(isoDate) {
  const target = Date.parse(isoDate);
  if (Number.isNaN(target)) return null;
  return Math.floor((target - Date.now()) / (24 * 60 * 60 * 1000));
}

async function checkSccExpirations() {
  for (const scc of sccRegistry.values()) {
    const days = daysUntil(scc.validUntil);
    if (days === null) continue;
    if (days <= SCC_EXPIRY_WARN_DAYS) {
      const cooldownKey = `scc-${scc.id}`;
      const last = sccCooldown.get(cooldownKey);
      if (last && Date.now() - last < TICK_INTERVAL_MS) continue;
      sccCooldown.set(cooldownKey, Date.now());
      alertsEmitted++;
      await bus.emitOS(EVENT_TYPES.KVKK_SCC_EXPIRING, {
        severity: days < 7 ? "error" : "warning",
        module: MODULE_NAME,
        payload: {
          sccId: scc.id,
          processor: scc.processor,
          validUntil: scc.validUntil,
          daysRemaining: days,
          jurisdiction: scc.jurisdiction || null,
          dataCategory: scc.dataCategory || null,
        },
      });
    }
  }
}

// ============================================================================
// SECTION 4 — Data Subject Request (DSR) Queue
// ============================================================================

/**
 * Veri sahibi talebi ekle (erisim, silme, tasima, duzeltme) — in-memory + DB create.
 * @param {object} req - { type, requesterId, payload? }
 */
async function addRequest(req) {
  if (!req?.type || !req?.requesterId) {
    throw new Error("addRequest: type + requesterId zorunlu");
  }
  if (!Object.values(DSR_TYPES).includes(req.type)) {
    throw new Error(`addRequest: gecersiz type ${req.type}`);
  }

  const id = req.id || `dsr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const requestedAt = new Date().toISOString();
  const dueBy = new Date(Date.now() + DSR_SLA_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const record = {
    id,
    type: req.type,
    requesterId: req.requesterId,
    payload: req.payload || null,
    requestedAt,
    dueBy,
    status: DSR_STATUS.PENDING,
    completedAt: null,
  };

  dsrQueue.set(id, record);

  try {
    await prisma.dataSubjectRequest.create({
      data: {
        id,
        requesterTC: String(req.requesterId),
        requestType: req.type,
        description: req.payload ? JSON.stringify(req.payload) : req.type,
        status: DSR_STATUS.PENDING,
      },
    });
  } catch (err) {
    console.error("[COMPLIANCE] addRequest DB create hatasi:", err.message);
  }

  return record;
}

function updateRequestStatus(id, status) {
  const record = dsrQueue.get(id);
  if (!record) return null;
  if (!Object.values(DSR_STATUS).includes(status)) {
    throw new Error(`updateRequestStatus: gecersiz status ${status}`);
  }
  record.status = status;
  if (status === DSR_STATUS.COMPLETED || status === DSR_STATUS.REJECTED) {
    record.completedAt = new Date().toISOString();
  }
  return record;
}

function listPendingRequests() {
  return Array.from(dsrQueue.values()).filter(
    (r) => r.status === DSR_STATUS.PENDING || r.status === DSR_STATUS.IN_PROGRESS
  );
}

async function checkDsrSla() {
  for (const dsr of listPendingRequests()) {
    const daysElapsed = Math.floor(
      (Date.now() - Date.parse(dsr.requestedAt)) / (24 * 60 * 60 * 1000)
    );
    if (daysElapsed >= DSR_WARN_DAYS) {
      const cooldownKey = `dsr-${dsr.id}`;
      const last = dsrCooldown.get(cooldownKey);
      if (last && Date.now() - last < TICK_INTERVAL_MS) continue;
      dsrCooldown.set(cooldownKey, Date.now());
      alertsEmitted++;
      await bus.emitOS(EVENT_TYPES.KVKK_DATA_SUBJECT_REQUEST, {
        severity: daysElapsed >= DSR_SLA_DAYS ? "error" : "warning",
        module: MODULE_NAME,
        payload: {
          dsrId: dsr.id,
          type: dsr.type,
          requesterId: dsr.requesterId,
          requestedAt: dsr.requestedAt,
          dueBy: dsr.dueBy,
          daysElapsed,
          slaDays: DSR_SLA_DAYS,
          overdue: daysElapsed >= DSR_SLA_DAYS,
        },
      });
    }
  }
}

// ============================================================================
// SECTION 5 — Audit Log Retention (Sprint 3 placeholder)
// ============================================================================

async function checkAuditLogRetention() {
  // Sprint 3: prisma.activityLog.deleteMany({ where: { createdAt: { lt: cutoff } } })
  return {
    retentionDays: AUDIT_LOG_RETENTION_DAYS,
    note: "Sprint 3: ActivityLog cutoff cleanup eklenecek",
  };
}

// ============================================================================
// SECTION 6 — TICK
// ============================================================================

async function runTick() {
  totalTicks++;
  try {
    await checkSccExpirations();
    await checkDsrSla();
    await checkAuditLogRetention();
  } catch (err) {
    console.error("[COMPLIANCE] tick error:", err.message);
  }
  console.log(
    `[COMPLIANCE] tick=${totalTicks} scc=${sccRegistry.size} dsrPending=${listPendingRequests().length} alerts=${alertsEmitted}`
  );
}

// ============================================================================
// SECTION 7 — LIFECYCLE
// ============================================================================

/**
 * Boot sirasinda DB'den SCC kayitlarini belleye yukle.
 * runBoot() icinde DB adiminden sonra cagirilir.
 */
async function init() {
  try {
    const records = await prisma.kVKKSCC.findMany({ where: { status: "ACTIVE" } });
    for (const r of records) {
      sccRegistry.set(r.id, {
        id: r.id,
        processor: r.dataProcessor,
        signedAt: r.sccSignedAt?.toISOString() || null,
        validUntil: r.expiresAt?.toISOString() || null,
        jurisdiction: r.country,
        dataCategory: r.notlar || null,
        addedAt: r.createdAt?.toISOString() || new Date().toISOString(),
      });
    }
    console.log(`[COMPLIANCE] init: ${records.length} SCC kaydi DB'den yuklendi`);
  } catch (err) {
    console.error("[COMPLIANCE] init SCC hatasi:", err.message);
  }

  // DSR seed — bekleyen talepler
  try {
    const dsrRecords = await prisma.dataSubjectRequest.findMany({
      where: { status: { in: [DSR_STATUS.PENDING, DSR_STATUS.IN_PROGRESS] } },
    });
    for (const r of dsrRecords) {
      if (!dsrQueue.has(r.id)) {
        dsrQueue.set(r.id, {
          id: r.id,
          type: r.requestType,
          requesterId: r.requesterTC,
          payload: null,
          requestedAt: r.receivedAt?.toISOString() || new Date().toISOString(),
          dueBy: new Date(
            (r.receivedAt?.getTime() || Date.now()) + DSR_SLA_DAYS * 24 * 60 * 60 * 1000
          ).toISOString(),
          status: r.status,
          completedAt: r.respondedAt?.toISOString() || null,
        });
      }
    }
    console.log(`[COMPLIANCE] init: ${dsrRecords.length} DSR kaydi DB'den yuklendi`);
  } catch (err) {
    console.error("[COMPLIANCE] init DSR hatasi:", err.message);
  }
}

function start() {
  if (isRunning) {
    console.warn("[COMPLIANCE] zaten calisiyor, start cagrisi gormezden gelindi");
    return;
  }
  isRunning = true;
  tickTimer = setInterval(() => {
    runTick().catch((err) => {
      console.error("[COMPLIANCE] unhandled tick error:", err.message);
    });
  }, TICK_INTERVAL_MS);
  console.log(
    `[COMPLIANCE] started: interval ${TICK_INTERVAL_MS / 3600000}h, scc warn ${SCC_EXPIRY_WARN_DAYS}d, dsr sla ${DSR_SLA_DAYS}d`
  );
}

function stop() {
  if (!isRunning) return;
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  isRunning = false;
  console.log("[COMPLIANCE] stopped");
}

// ============================================================================
// SECTION 8 — READ API
// ============================================================================

function getStatus() {
  return {
    isRunning,
    totalTicks,
    alertsEmitted,
    sccCount: sccRegistry.size,
    dsrTotal: dsrQueue.size,
    dsrPending: listPendingRequests().length,
    sccExpiringWithin30Days: listSccs().filter((s) => {
      const d = daysUntil(s.validUntil);
      return d !== null && d <= SCC_EXPIRY_WARN_DAYS;
    }).length,
    dsrOverdueCount: listPendingRequests().filter((r) => {
      const days = Math.floor(
        (Date.now() - Date.parse(r.requestedAt)) / (24 * 60 * 60 * 1000)
      );
      return days >= DSR_SLA_DAYS;
    }).length,
    tickIntervalMs: TICK_INTERVAL_MS,
  };
}

function resetState() {
  sccRegistry.clear();
  dsrQueue.clear();
  sccCooldown.clear();
  dsrCooldown.clear();
  totalTicks = 0;
  alertsEmitted = 0;
}

// ============================================================================
// SECTION 9 — RECONCILER POLICY HANDLER
// ============================================================================

async function policyHandler(policy, _prisma) {
  const key = policy?.key;
  if (!key) return { drift: false, action: null };

  switch (key) {
    case "scc-expiry": {
      const expiring = listSccs().filter((s) => {
        const d = daysUntil(s.validUntil);
        return d !== null && d <= SCC_EXPIRY_WARN_DAYS;
      });
      return {
        drift: expiring.length > 0,
        action: expiring.length > 0 ? "scc-renewal-needed" : null,
        details: { expiringCount: expiring.length, threshold: SCC_EXPIRY_WARN_DAYS },
      };
    }
    case "dsr-sla": {
      const overdue = listPendingRequests().filter((r) => {
        const days = Math.floor(
          (Date.now() - Date.parse(r.requestedAt)) / (24 * 60 * 60 * 1000)
        );
        return days >= DSR_SLA_DAYS;
      });
      return {
        drift: overdue.length > 0,
        action: overdue.length > 0 ? "dsr-overdue" : null,
        details: { overdueCount: overdue.length, slaDays: DSR_SLA_DAYS },
      };
    }
    default:
      return { drift: false, action: null, details: { reason: "unknown key" } };
  }
}

registerPolicyHandler(MODULE_NAME, policyHandler);

// ============================================================================
// SECTION 10 — TUR #69 A5 — runStatusCheck (KVKK 30 gün countdown + AgentEvent)
// ============================================================================

/**
 * KVKK Uyum modülü gerçek görev:
 *  - prisma.dataSubjectRequest PENDING + receivedAt yaşı
 *  - 30 gün aşan = CRITICAL (KVKK m.13 ihlali)
 *  - 25-30 gün arası = WARNING (yaklaşan ihlal)
 *  - <25 gün = INFO
 */
async function runStatusCheck() {
  const startTs = Date.now();
  const prismaClient = require("../../config/db");

  let pendingTotal = 0;
  let asanCount = 0; // 30+ gün
  let yaklasanCount = 0; // 25-30 gün
  let saglikliCount = 0; // <25 gün
  let kvkkscCount = 0;

  try {
    const pendingRequests = await prismaClient.dataSubjectRequest.findMany({
      where: { status: "PENDING" },
      select: { id: true, receivedAt: true, requestType: true, requesterTC: true },
      take: 200,
    });
    pendingTotal = pendingRequests.length;

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    for (const r of pendingRequests) {
      if (!r.receivedAt) continue;
      const age = (now - new Date(r.receivedAt).getTime()) / day;
      if (age > 30) asanCount++;
      else if (age >= 25) yaklasanCount++;
      else saglikliCount++;
    }

    // KVKKSCC tablosu varsa say (yurt dışı aktarım dokümantasyonu)
    try {
      kvkkscCount = await prismaClient.kVKKSCC.count();
    } catch (_) {
      kvkkscCount = -1; // model yoksa skip
    }
  } catch (dbErr) {
    console.error("[os/compliance] runStatusCheck DB hata:", dbErr.message);
  }

  const severity = asanCount > 0 ? "CRITICAL" : yaklasanCount > 0 ? "WARNING" : "INFO";

  const payload = {
    pendingTotal,
    asanCount, // 30 günü aşan (KVKK m.13 ihlali)
    yaklasanCount, // 25-30 gün arası
    saglikliCount, // <25 gün
    kvkkSccCount: kvkkscCount,
    durationMs: Date.now() - startTs,
    message:
      asanCount > 0
        ? `KVKK · ${asanCount} başvuru 30 GÜN AŞTI (KRITIK m.13 ihlali)`
        : yaklasanCount > 0
        ? `KVKK · ${yaklasanCount} başvuru 25-30 gün arası (yaklaşan ihlal)`
        : `KVKK · ${pendingTotal} PENDING başvuru, hepsi <25 gün`,
  };

  try {
    await prismaClient.agentEvent.create({
      data: {
        agentName: MODULE_NAME, // "compliance"
        eventType: "STATUS_CHECK",
        severity,
        payload,
      },
    });
  } catch (evtErr) {
    console.error("[os/compliance] AgentEvent yazma hata:", evtErr.message);
  }

  // CRITICAL aşan KVKK başvurusu varsa ADMIN bildirim
  if (severity === "CRITICAL") {
    try {
      await prismaClient.realtimeEvent.create({
        data: {
          channel: "ADMIN_FEED",
          eventType: "KVKK_30GUN_IHLALI",
          payload: { asanCount, pendingTotal },
        },
      });
    } catch (_) {}
  }

  return { ok: severity !== "CRITICAL", severity, ...payload };
}

// ============================================================================
// SECTION 10B — TUR #72 A5 — runActiveTask (KVKK 25/30 gun alert + opt-in)
// ============================================================================

let lastActiveTaskAt_cm = 0;
const CM_ACTIVE_INTERVAL_MS = 60 * 60 * 1000;

function shouldRunActiveTask() {
  return Date.now() - lastActiveTaskAt_cm >= CM_ACTIVE_INTERVAL_MS;
}

async function runActiveTask() {
  const startTs = Date.now();
  const prismaClient = require("../../config/db");
  const day = 24 * 60 * 60 * 1000;
  const since25d = new Date(Date.now() - 25 * day);
  const since30d = new Date(Date.now() - 30 * day);

  let alertsSent = 0;
  let overdue = 0;
  let optInMissing = 0;

  try {
    overdue = await prismaClient.dataSubjectRequest.count({
      where: { status: "PENDING", receivedAt: { lt: since30d } },
    });
    const overdue25 = await prismaClient.dataSubjectRequest.count({
      where: { status: "PENDING", receivedAt: { lt: since25d, gte: since30d } },
    });
    if (overdue + overdue25 > 0) {
      try {
        await prismaClient.realtimeEvent.create({
          data: {
            channel: "ADMIN_FEED",
            eventType: "KVKK_OVERDUE",
            payload: { overdue30: overdue, overdue25 },
          },
        });
        alertsSent = 1;
      } catch (_) {}
    }
  } catch (_) {}

  const severity = overdue > 0 ? "CRITICAL" : alertsSent > 0 ? "WARNING" : "INFO";

  try {
    await prismaClient.agentEvent.create({
      data: {
        agentName: "compliance",
        eventType: "ACTION_TAKEN",
        severity,
        payload: {
          action_taken: { alerts_sent: alertsSent, overdue, opt_in_missing: optInMissing },
          durationMs: Date.now() - startTs,
          message: `KVKK Uyum · ${overdue} 30g+ overdue · ${alertsSent} alert${overdue > 0 ? " (CRITICAL)" : ""}`,
        },
      },
    });
  } catch (_) {}

  lastActiveTaskAt_cm = Date.now();
  return { alertsSent, overdue, optInMissing };
}

// ============================================================================
// SECTION 11 — EXPORTS
// ============================================================================

module.exports = {
  init,
  start,
  stop,
  runTick,
  runStatusCheck,
  runActiveTask,
  shouldRunActiveTask,
  addScc,
  removeScc,
  listSccs,
  addRequest,
  updateRequestStatus,
  listPendingRequests,
  getStatus,
  resetState,
  MODULE_NAME,
  TICK_INTERVAL_MS,
  SCC_EXPIRY_WARN_DAYS,
  DSR_SLA_DAYS,
  DSR_WARN_DAYS,
  AUDIT_LOG_RETENTION_DAYS,
  DSR_TYPES,
  DSR_STATUS,
};
