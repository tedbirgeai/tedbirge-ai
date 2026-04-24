/**
 * src/os/observability/traces.js
 * Tedbirge OS — Observability: Event Trace Recorder
 *
 * Event bus akisini ring buffer'da tutar, son N event akisi dondurur.
 * Sprint 3: Distributed tracing (traceId propagation), OpenTelemetry export.
 */

"use strict";

const { bus, EVENT_TYPES } = require("../eventBus");

const MODULE_NAME = "traces";
const TRACE_BUFFER_SIZE = 200;

const traceBuffer = [];
let isRunning = false;
let unsubscribers = [];
let totalRecorded = 0;

function record(event) {
  traceBuffer.push({
    at: new Date().toISOString(),
    type: event.type,
    severity: event.severity || "info",
    module: event.module || null,
    actorId: event.actorId || null,
    payloadKeys: event.payload ? Object.keys(event.payload).slice(0, 10) : [],
  });
  if (traceBuffer.length > TRACE_BUFFER_SIZE) traceBuffer.shift();
  totalRecorded++;
}

function start() {
  if (isRunning) {
    console.warn("[TRACES] zaten calisiyor");
    return;
  }
  isRunning = true;
  for (const eventType of Object.values(EVENT_TYPES)) {
    const unsub = bus.onOS(eventType, record);
    if (typeof unsub === "function") unsubscribers.push(unsub);
  }
  console.log(`[TRACES] started: buffer ${TRACE_BUFFER_SIZE}, ${unsubscribers.length} listener(s)`);
}

function stop() {
  if (!isRunning) return;
  for (const u of unsubscribers) {
    if (typeof u === "function") u();
  }
  unsubscribers = [];
  isRunning = false;
  console.log("[TRACES] stopped");
}

function getTraces(limit = 50) {
  return traceBuffer.slice(-limit);
}

function filterTraces({ module, severity, since } = {}) {
  let results = traceBuffer;
  if (module) results = results.filter((t) => t.module === module);
  if (severity) results = results.filter((t) => t.severity === severity);
  if (since) {
    const cutoff = typeof since === "string" ? Date.parse(since) : since;
    results = results.filter((t) => Date.parse(t.at) >= cutoff);
  }
  return results;
}

function getStatus() {
  return {
    isRunning,
    bufferSize: traceBuffer.length,
    maxSize: TRACE_BUFFER_SIZE,
    totalRecorded,
    listeners: unsubscribers.length,
  };
}

function resetState() {
  traceBuffer.length = 0;
  totalRecorded = 0;
}

module.exports = {
  start, stop, record,
  getTraces, filterTraces,
  getStatus, resetState,
  MODULE_NAME, TRACE_BUFFER_SIZE,
};
