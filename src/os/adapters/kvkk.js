/**
 * src/os/adapters/kvkk.js
 *
 * Tedbirge OS — KVKK Adapter (Sprint 1 minimum)
 *
 * AMAC:
 *   KVKK uyum kanıtı toplama. Hukuki yorumu mimar/avukat yapar.
 *   Adapter sadece logging — yeni tablo YOK, schema değişikliği YOK.
 *
 * 4 İŞLEV:
 *   1. logDataAccess(userId, dataType, action) → veri görüntüleme kaydı
 *   2. logDataExport(userId, exportType, recordCount) → toplu/tekil veri çekimi
 *   3. recordConsent(userId, consentType, granted) → rıza kaydı
 *   4. getAccessLog(userId, fromDate, toDate) → KVKK m.11 erişim hakkı
 *
 * SAKLAMA:
 *   Tüm kayıtlar SystemEvent tablosuna `type='kvkk:*'` prefix ile.
 */

"use strict";

const prisma = require("../../config/db");

const MODULE_NAME = "kvkk";

let state = {
  started: false,
  totalAccess: 0,
  totalExport: 0,
  totalConsent: 0,
  lastEventAt: null,
};

function start() {
  if (state.started) return;
  state.started = true;
}

function stop() {
  state.started = false;
}

async function logDataAccess(userId, dataType, action) {
  try {
    await prisma.systemEvent.create({
      data: {
        type: `kvkk:access:${dataType}:${action}`,
        severity: "INFO",
        module: MODULE_NAME,
        actorId: userId || null,
        payload: { userId, dataType, action },
      },
    });
    state.totalAccess += 1;
    state.lastEventAt = new Date().toISOString();
  } catch (err) {
    console.error("[kvkk] logDataAccess failed:", err.message);
  }
}

async function logDataExport(userId, exportType, recordCount) {
  try {
    await prisma.systemEvent.create({
      data: {
        type: `kvkk:export:${exportType}`,
        severity: recordCount > 100 ? "WARNING" : "INFO",
        module: MODULE_NAME,
        actorId: userId || null,
        payload: { userId, exportType, recordCount },
      },
    });
    state.totalExport += 1;
    state.lastEventAt = new Date().toISOString();
  } catch (err) {
    console.error("[kvkk] logDataExport failed:", err.message);
  }
}

async function recordConsent(userId, consentType, granted) {
  try {
    await prisma.systemEvent.create({
      data: {
        type: `kvkk:consent:${consentType}:${granted ? "granted" : "revoked"}`,
        severity: "INFO",
        module: MODULE_NAME,
        actorId: userId || null,
        payload: { userId, consentType, granted },
      },
    });
    state.totalConsent += 1;
    state.lastEventAt = new Date().toISOString();
  } catch (err) {
    console.error("[kvkk] recordConsent failed:", err.message);
  }
}

async function getAccessLog(userId, fromDate, toDate) {
  try {
    const where = {
      type: { startsWith: "kvkk:" },
      module: MODULE_NAME,
    };
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }
    if (userId) where.actorId = userId;

    const events = await prisma.systemEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return events;
  } catch (err) {
    console.error("[kvkk] getAccessLog failed:", err.message);
    return [];
  }
}

function getStatus() {
  return {
    started: state.started,
    totalAccess: state.totalAccess,
    totalExport: state.totalExport,
    totalConsent: state.totalConsent,
    lastEventAt: state.lastEventAt,
  };
}

function resetState() {
  state.totalAccess = 0;
  state.totalExport = 0;
  state.totalConsent = 0;
  state.lastEventAt = null;
}

module.exports = {
  start,
  stop,
  logDataAccess,
  logDataExport,
  recordConsent,
  getAccessLog,
  getStatus,
  resetState,
  MODULE_NAME,
};
