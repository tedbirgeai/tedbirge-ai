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

// TUR #69 A3 — Görünüm modülü gerçek görev (basit metrik + AgentEvent)
async function runStatusCheck() {
  const start = Date.now();
  const prismaClient = require("../../config/db");

  let totalUsersWithPrefs = 0;
  let themeStats = { light: 0, dark: 0, auto: 0, default: 0 };

  try {
    // User.preferences JSON alanı — TUR #55 KIRMIZI nokta paketi'nde eklendi
    const users = await prismaClient.user.findMany({
      where: { preferences: { not: null } },
      select: { preferences: true },
      take: 500,
    });
    totalUsersWithPrefs = users.length;
    for (const u of users) {
      const theme = u.preferences?.theme || "default";
      if (themeStats[theme] !== undefined) themeStats[theme]++;
      else themeStats.default++;
    }
  } catch (dbErr) {
    // User.preferences yoksa veya hata — sessiz geç
    console.warn("[os/appearance] User.preferences sorgu hata:", dbErr.message);
  }

  const duration = Date.now() - start;

  try {
    await prismaClient.agentEvent.create({
      data: {
        agentName: MODULE_NAME, // "appearance"
        eventType: "STATUS_CHECK",
        severity: "INFO",
        payload: {
          inMemoryUsers: prefsByUser.size,
          totalChangesSession: totalChanges,
          dbUsersWithPrefs: totalUsersWithPrefs,
          themeStats,
          themes: Object.values(THEMES),
          durationMs: duration,
          message: `Görünüm · ${totalUsersWithPrefs} kullanıcı tema set etti · ${prefsByUser.size} session aktif`,
        },
      },
    });
  } catch (evtErr) {
    console.error("[os/appearance] AgentEvent yazma hata:", evtErr.message);
  }

  return {
    ok: true,
    inMemoryUsers: prefsByUser.size,
    dbUsersWithPrefs: totalUsersWithPrefs,
    themeStats,
    durationMs: duration,
  };
}

// TUR #72 A3 — runActiveTask: invalid preferences reset + theme stats
let lastActiveTaskAt_ap = 0;
const AP_ACTIVE_INTERVAL_MS = 60 * 60 * 1000;

function shouldRunActiveTask() {
  return Date.now() - lastActiveTaskAt_ap >= AP_ACTIVE_INTERVAL_MS;
}

async function runActiveTask() {
  const startTs = Date.now();
  const prismaClient = require("../../config/db");
  let resets = 0;
  let mismatches = 0;
  let darkCount = 0;
  let lightCount = 0;

  try {
    const users = await prismaClient.user.findMany({
      where: { preferences: { not: null } },
      select: { id: true, preferences: true },
      take: 200,
    });
    for (const u of users) {
      const p = u.preferences;
      if (!p || typeof p !== "object") {
        mismatches++;
        if (resets < 50) {
          try {
            await prismaClient.user.update({ where: { id: u.id }, data: { preferences: {} } });
            resets++;
          } catch (_) {}
        }
        continue;
      }
      if (p.theme === "dark") darkCount++;
      else if (p.theme === "light") lightCount++;
    }
  } catch (_) {}

  try {
    await prismaClient.agentEvent.create({
      data: {
        agentName: "appearance",
        eventType: "ACTION_TAKEN",
        severity: mismatches > 10 ? "WARNING" : "INFO",
        payload: {
          action_taken: { resets, mismatches, dark_count: darkCount, light_count: lightCount },
          durationMs: Date.now() - startTs,
          message: `Gorunum · ${resets} reset · ${mismatches} mismatch · dark/light ${darkCount}/${lightCount}`,
        },
      },
    });
  } catch (_) {}

  lastActiveTaskAt_ap = Date.now();
  return { resets, mismatches, darkCount, lightCount };
}

module.exports = {
  start, stop,
  getPreferences, setPreferences, resetPreferences,
  listUsers, listThemes, listDensities,
  getStatus, runStatusCheck, resetState,
  runActiveTask, shouldRunActiveTask,
  MODULE_NAME, THEMES, DENSITY, DEFAULT_PREFS,
  EVENT_CHANGED,
};
