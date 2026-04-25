/**
 * src/os/modules/reporter.js
 *
 * Tedbirge OS — Modul 19: Reporter (SSE Bridge)
 *
 * AMAC:
 *   eventBus event'lerini Server-Sent Events (SSE) clientlerine yayınlar.
 *   Panel'de Sistem Durumu / Canlı Feed sayfası bu modüle bağlanır.
 */

"use strict";

const { bus } = require("../eventBus");

const MODULE_NAME = "reporter";
const RELAY_EVENTS = [
  "auditor:finding",
  "auditor:started",
  "auditor:stopped",
  "healer:suggestion",
  "healer:auto_fix",
  "healer:started",
  "system:boot",
  "system:health_change",
];

let state = {
  started: false,
  clients: new Set(), // SSE response objeleri
  totalEventsSent: 0,
  lastEventAt: null,
};

function start() {
  if (state.started) return;
  state.started = true;

  RELAY_EVENTS.forEach((eventName) => {
    bus.on(eventName, (data) => relayEvent(eventName, data));
  });
}

function stop() {
  state.started = false;
  state.clients.forEach((res) => {
    try {
      res.end();
    } catch (_) {}
  });
  state.clients.clear();
}

function addClient(res) {
  state.clients.add(res);
  res.write(`event: connected\ndata: {"at":"${new Date().toISOString()}"}\n\n`);

  res.on("close", () => {
    state.clients.delete(res);
  });
}

function relayEvent(eventName, data) {
  state.lastEventAt = new Date().toISOString();
  state.totalEventsSent += 1;

  const payload = JSON.stringify({ event: eventName, data, at: state.lastEventAt });
  const sseMsg = `event: ${eventName}\ndata: ${payload}\n\n`;

  state.clients.forEach((res) => {
    try {
      res.write(sseMsg);
    } catch (_) {
      state.clients.delete(res);
    }
  });
}

function getStatus() {
  return {
    started: state.started,
    activeClients: state.clients.size,
    totalEventsSent: state.totalEventsSent,
    lastEventAt: state.lastEventAt,
    relayEvents: RELAY_EVENTS,
  };
}

function resetState() {
  state.totalEventsSent = 0;
  state.lastEventAt = null;
}

module.exports = {
  start,
  stop,
  addClient,
  relayEvent,
  getStatus,
  resetState,
  MODULE_NAME,
  RELAY_EVENTS,
};
