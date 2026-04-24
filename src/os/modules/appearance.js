/**
 * src/os/modules/appearance.js
 * Tedbirge OS — Modul 16: UI Preference Metadata
 *
 * Panel UI tercihleri: tema, font, yogunluk, locale, renk.
 * Per-user in-memory (Sprint 3 DB persist User.preferences JSONB).
 */

"use strict";

const { bus } = require("../eventBus");

const MODULE_NAME = "appearance";

const THEMES = Object.freeze({
  LIGHT: "light",
  DARK: "dark",
  AUTO: "auto",
});

const DENSITY = Object.freeze({
  COMPACT: "compact",
  COMFORTABLE: "comfortable",
});

const DEFAULT_PREFS = Object.freeze({
  theme: THEMES.LIGHT,
  density: DENSITY.COMFORTABLE,
  fontScale: 1.0,
  locale: "tr-TR",
  primaryColor: "#1a365d",
});

const EVENT_CHANGED = "appearance:pref-changed";

const prefsByUser = new Map();
let isRunning = false;
let totalChanges = 0;

function getPreferences(userId) {
  if (!userId) throw new Error("getPreferences: userId zorunlu");
  return { ...DEFAULT_PREFS, ...(prefsByUser.get(userId) || {}) };
}

async function setPreferences(userId, patch) {
  if (!userId) throw new Error("setPreferences: userId zorunlu");
  if (!patch || typeof patch !== "object") throw new Error("setPreferences: patch object zorunlu");
  if (patch.theme && !Object.values(THEMES).includes(patch.theme)) {
    throw new Error(`setPreferences: gecersiz theme ${patch.theme}`);
  }
  if (patch.density && !Object.values(DENSITY).includes(patch.density)) {
    throw new Error(`setPreferences: gecersiz density ${patch.density}`);
  }
  if (patch.fontScale !== undefined && (typeof patch.fontScale !== "number" || patch.fontScale < 0.5 || patch.fontScale > 2.0)) {
    throw new Error("setPreferences: fontScale 0.5-2.0 arasinda olmali");
  }
  const current = prefsByUser.get(userId) || {};
  const next = { ...current, ...patch };
  prefsByUser.set(userId, next);
  totalChanges++;
  await bus.emitOS(EVENT_CHANGED, {
    severity: "info",
    module: MODULE_NAME,
    actorId: userId,
    payload: { userId, patch, current: next },
  });
  return { ...DEFAULT_PREFS, ...next };
}

function resetPreferences(userId) {
  if (!userId) throw new Error("resetPreferences: userId zorunlu");
  prefsByUser.delete(userId);
}

function listUsers() {
  return Array.from(prefsByUser.keys());
}

function listThemes() { return Object.values(THEMES); }
function listDensities() { return Object.values(DENSITY); }

function start() {
  if (isRunning) {
    console.warn("[APPEARANCE] zaten calisiyor");
    return;
  }
  isRunning = true;
  console.log(`[APPEARANCE] started: ${Object.values(THEMES).length} themes, default=${DEFAULT_PREFS.theme}, locale=${DEFAULT_PREFS.locale}`);
}

function stop() {
  if (!isRunning) return;
  isRunning = false;
  console.log("[APPEARANCE] stopped");
}

function getStatus() {
  return {
    isRunning,
    totalUsers: prefsByUser.size,
    totalChanges,
    themes: Object.values(THEMES),
    densities: Object.values(DENSITY),
    defaultPrefs: DEFAULT_PREFS,
  };
}

function resetState() {
  prefsByUser.clear();
  totalChanges = 0;
}

module.exports = {
  start, stop,
  getPreferences, setPreferences, resetPreferences,
  listUsers, listThemes, listDensities,
  getStatus, resetState,
  MODULE_NAME, THEMES, DENSITY, DEFAULT_PREFS,
  EVENT_CHANGED,
};
