/**
 * src/os/observability/logs.js
 * Tedbirge OS — Observability: Structured Log Stream
 *
 * Bus event'lerini ve manuel log cagrilarini ring buffer'a yazar.
 * Sprint 3: DB persist (Log tablosu) + CloudWatch/Datadog export.
 */

"use strict";

const { bus, EVENT_TYPES } = require("../eventBus");

const MODULE_NAME = "logs";
const BUFFER_SIZE = 500;

const LEVELS = Object.freeze({
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
  CRITICAL: 50,
});

const logBuffer = [];
let isRunning = false;
let unsubscribers = [];
let totalWritten = 0;

function write(level, message, meta = {}) {
  const levelUpper = (level || "INFO").toUpperCase();
  const entry = {
    at: new Date().toISOString(),
    level: levelUpper,
    levelNum: LEVELS[levelUpper] || LEVELS.INFO,
    message: String(message || ""),
    meta: meta || {},
  };
  logBuffer.push(entry);
  if (logBuffer.length > BUFFER_SIZE) logBuffer.shift();
  totalWritten++;
  return entry;
}

function debug(m, meta) { return write("DEBUG", m, meta); }
function info(m, meta) { return write("INFO", m, meta); }
function warn(m, meta) { return write("WARN", m, meta); }
function error(m, meta) { return write("ERROR", m, meta); }
function critical(m, meta) { return write("CRITICAL", m, meta); }

function severityToLevel(severity) {
  if (severity === "critical") return "CRITICAL";
  if (severity === "error") return "ERROR";
  if (severity === "warning") return "WARN";
  return "INFO";
}

function query({ level, since, limit = 100 } = {}) {
  let results = logBuffer;
  if (level) {
    const min = LEVELS[level.toUpperCase()] || 0;
    results = results.filter((e) => e.levelNum >= min);
  }
  if (since) {
    const cutoff = typeof since === "string" ? Date.parse(since) : since;
    results = results.filter((e) => Date.parse(e.at) >= cutoff);
  }
  return results.slice(-limit);
}

function start() {
  if (isRunning) {
    console.warn("[LOGS] zaten calisiyor");
    return;
  }
  isRunning = true;
  // Tüm EVENT_TYPES'a listener ekle (wildcard yok, her birini kendi ekliyoruz)
  for (const eventType of Object.values(EVENT_TYPES)) {
    const unsub = bus.onOS(eventType, (event) => {
      write(severityToLevel(event.severity), `[BUS] ${event.type}`, {
        module: event.module,
        actorId: event.actorId,
        payload: event.payload,
      });
    });
    if (typeof unsub === "function") unsubscribers.push(unsub);
  }
  console.log(`[LOGS] started: buffer ${BUFFER_SIZE}, ${unsubscribers.length} bus listener(s)`);
}

function stop() {
  if (!isRunning) return;
  for (const u of unsubscribers) {
    if (typeof u === "function") u();
  }
  unsubscribers = [];
  isRunning = false;
  console.log("[LOGS] stopped");
}

function getStatus() {
  return {
    isRunning,
    totalWritten,
    bufferSize: logBuffer.length,
    maxSize: BUFFER_SIZE,
    listeners: unsubscribers.length,
    levels: LEVELS,
  };
}

function resetState() {
  logBuffer.length = 0;
  totalWritten = 0;
}

module.exports = {
  start, stop,
  debug, info, warn, error, critical, write, query,
  getStatus, resetState,
  MODULE_NAME, BUFFER_SIZE, LEVELS,
};
