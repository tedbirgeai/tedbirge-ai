/**
 * src/os/modules/costGuard.js
 *
 * Tedbirge OS — Modul 4: Maliyet Bekcisi (CostGuard)
 *
 * AMAC:
 *   Anthropic API token kullanimi + Supabase Storage MB + diger adapter
 *   maliyetlerini anlik izlemek, butce asimi ve anomali tespit edip event
 *   emit etmek. Sprint 2 THIN: in-memory counter + threshold check; gercek
 *   cost API entegrasyonu Sprint 3.
 *
 * MIMARI:
 *   - recordUsage(category, amount) - modul disindan API cagrilir
 *   - Kategori: 'anthropic-tokens', 'supabase-storage-mb', 'vercel-bandwidth-gb'
 *   - Gunluk + aylik cumulative counter
 *   - Threshold: gunluk + aylik budget (env var'dan, default'lar icinde)
 *   - setInterval 1 saatlik tick: threshold check + anomaly check
 *   - Anomaly: son 1 saat > son 24 saat ortalamasi x 3
 *   - Event emit: COST_BUDGET_EXCEEDED + COST_ANOMALY_DETECTED
 *   - reconciler registerPolicyHandler('cost-guard') - budget drift
 *
 * KAPSAM (Sprint 2 THIN):
 *   - recordUsage API (dis moduller cagirir: AI servisi, storage upload vs)
 *   - Gunluk + aylik aggregation (reset at midnight / month start)
 *   - Threshold checks + event emit
 *   - Anomaly detection (son saat vs 24h average)
 *   - getStatus() read API
 *   - Reconciler policy (kullanim < budget kontrolu)
 *
 * KAPSAM DIŞI (Sprint 3+):
 *   - Anthropic Usage API entegrasyonu (x-ratelimit header parse)
 *   - Supabase PostgREST storage.objects SUM(size) sorgusu
 *   - Vercel bandwidth API
 *   - DB persist (daily rollup tablosu)
 *   - Admin alert chain (email + SMS eskalasyon)
 *   - Auto-throttle (budget %80 -> rate limit uygulat)
 *
 * EVENT TYPES (eventBus EVENT_TYPES icinden):
 *   - COST_BUDGET_EXCEEDED  ('cost:budget-exceeded')
 *   - COST_ANOMALY_DETECTED ('cost:anomaly-detected')
 *
 * ENV:
 *   - COST_BUDGET_ANTHROPIC_DAILY_USD     (default 5)
 *   - COST_BUDGET_ANTHROPIC_MONTHLY_USD   (default 100)
 *   - COST_BUDGET_STORAGE_MONTHLY_GB      (default 50)
 *   - COST_CHECK_INTERVAL_MS              (default 1 saat)
 *
 * BAGIMLILIK:
 *   - ./eventBus — bus, EVENT_TYPES
 *   - ./reconciler — registerPolicyHandler
 *
 * KULLANIM:
 *   const costGuard = require('./modules/costGuard');
 *   costGuard.start();
 *
 *   // AI servisi response sonrasi:
 *   costGuard.recordUsage('anthropic-tokens', 1500); // 1500 token
 *
 *   // Storage upload sonrasi:
 *   costGuard.recordUsage('supabase-storage-mb', 2.5);
 */

"use strict";

const { bus, EVENT_TYPES } = require("../eventBus");
const { registerPolicyHandler } = require("../reconciler");

// ============================================================================
// SECTION 1 — CONSTANTS
// ============================================================================

const MODULE_NAME = "cost-guard";

const CHECK_INTERVAL_MS = parseInt(process.env.COST_CHECK_INTERVAL_MS, 10) || 60 * 60 * 1000; // 1 saat
const HOURLY_HISTORY_SIZE = 24; // son 24 saat, anomaly detection icin

const CATEGORIES = Object.freeze({
  ANTHROPIC_TOKENS: "anthropic-tokens",
  SUPABASE_STORAGE_MB: "supabase-storage-mb",
  VERCEL_BANDWIDTH_GB: "vercel-bandwidth-gb",
});

// Varsayilan token basi fiyat (USD) — Sprint 3'te pricing adapter'dan gelir
const TOKEN_COST_USD = 0.000003; // Anthropic Sonnet ~$3/M input, ort.
const STORAGE_COST_USD_PER_GB_MONTH = 0.021; // Supabase

// Budget defaults (env override)
const BUDGET_ANTHROPIC_DAILY_USD =
  parseFloat(process.env.COST_BUDGET_ANTHROPIC_DAILY_USD) || 5;
const BUDGET_ANTHROPIC_MONTHLY_USD =
  parseFloat(process.env.COST_BUDGET_ANTHROPIC_MONTHLY_USD) || 100;
const BUDGET_STORAGE_MONTHLY_GB =
  parseFloat(process.env.COST_BUDGET_STORAGE_MONTHLY_GB) || 50;

const ANOMALY_MULTIPLIER = 3; // son 1 saat > 24h_avg x 3 ise anomali

// ============================================================================
// SECTION 2 — INTERNAL STATE
// ============================================================================

/**
 * Counter yapisi:
 *   daily:   Map<category, amount> - gun sifirlanir
 *   monthly: Map<category, amount> - ay sifirlanir
 *   hourly:  Map<category, Array<{hour, amount}>> - ring buffer 24 saat
 */
const dailyUsage = new Map();
const monthlyUsage = new Map();
const hourlyUsage = new Map();

let currentDay = new Date().toISOString().slice(0, 10);   // 'YYYY-MM-DD'
let currentMonth = new Date().toISOString().slice(0, 7);  // 'YYYY-MM'
let currentHour = new Date().toISOString().slice(0, 13);  // 'YYYY-MM-DDTHH'

let checkTimer = null;
let isRunning = false;
let totalChecks = 0;
let alertsEmitted = 0;

// Budget exceed cooldown (ayni kategori icin saatte 1 alert)
const budgetCooldown = new Map();

// ============================================================================
// SECTION 3 — USAGE RECORDING
// ============================================================================

/**
 * Dis moduller bu fonksiyonu cagirir.
 * @param {string} category - CATEGORIES icinden
 * @param {number} amount - kullanim miktari (token sayisi, MB, GB)
 */
function recordUsage(category, amount) {
  if (!amount || amount <= 0) return;

  rotateIfNeeded();

  // Daily
  dailyUsage.set(category, (dailyUsage.get(category) || 0) + amount);

  // Monthly
  monthlyUsage.set(category, (monthlyUsage.get(category) || 0) + amount);

  // Hourly (anomaly detection icin)
  if (!hourlyUsage.has(category)) {
    hourlyUsage.set(category, []);
  }
  const buf = hourlyUsage.get(category);
  const last = buf[buf.length - 1];
  if (last && last.hour === currentHour) {
    last.amount += amount;
  } else {
    buf.push({ hour: currentHour, amount });
    if (buf.length > HOURLY_HISTORY_SIZE) {
      buf.shift();
    }
  }
}

/**
 * Day/month/hour degistiyse counter'lari sifirla.
 * Hour'u hourlyUsage push'ta zaten isliyoruz, burada day ve month.
 */
function rotateIfNeeded() {
  const nowDay = new Date().toISOString().slice(0, 10);
  const nowMonth = new Date().toISOString().slice(0, 7);
  const nowHour = new Date().toISOString().slice(0, 13);

  if (nowDay !== currentDay) {
    dailyUsage.clear();
    currentDay = nowDay;
  }
  if (nowMonth !== currentMonth) {
    monthlyUsage.clear();
    currentMonth = nowMonth;
  }
  if (nowHour !== currentHour) {
    currentHour = nowHour;
  }
}

// ============================================================================
// SECTION 4 — COST CALCULATION
// ============================================================================

function anthropicDailyUsd() {
  const tokens = dailyUsage.get(CATEGORIES.ANTHROPIC_TOKENS) || 0;
  return tokens * TOKEN_COST_USD;
}

function anthropicMonthlyUsd() {
  const tokens = monthlyUsage.get(CATEGORIES.ANTHROPIC_TOKENS) || 0;
  return tokens * TOKEN_COST_USD;
}

function storageMonthlyGb() {
  const mb = monthlyUsage.get(CATEGORIES.SUPABASE_STORAGE_MB) || 0;
  return mb / 1024;
}

// ============================================================================
// SECTION 5 — THRESHOLD + ANOMALY
// ============================================================================

function isInCooldown(key) {
  const last = budgetCooldown.get(key);
  if (!last) return false;
  return Date.now() - last < CHECK_INTERVAL_MS;
}

function markCooldown(key) {
  budgetCooldown.set(key, Date.now());
}

async function checkBudgets() {
  const checks = [
    {
      key: "anthropic-daily",
      category: CATEGORIES.ANTHROPIC_TOKENS,
      current: anthropicDailyUsd(),
      limit: BUDGET_ANTHROPIC_DAILY_USD,
      unit: "USD",
    },
    {
      key: "anthropic-monthly",
      category: CATEGORIES.ANTHROPIC_TOKENS,
      current: anthropicMonthlyUsd(),
      limit: BUDGET_ANTHROPIC_MONTHLY_USD,
      unit: "USD",
    },
    {
      key: "storage-monthly",
      category: CATEGORIES.SUPABASE_STORAGE_MB,
      current: storageMonthlyGb(),
      limit: BUDGET_STORAGE_MONTHLY_GB,
      unit: "GB",
    },
  ];

  for (const c of checks) {
    if (c.current >= c.limit && !isInCooldown(c.key)) {
      markCooldown(c.key);
      alertsEmitted++;
      await bus.emitOS(EVENT_TYPES.COST_BUDGET_EXCEEDED, {
        severity: "warning",
        module: MODULE_NAME,
        payload: {
          budgetKey: c.key,
          category: c.category,
          current: c.current,
          limit: c.limit,
          unit: c.unit,
          overagePercent: Math.round(((c.current - c.limit) / c.limit) * 100),
        },
      });
    }
  }
}

async function checkAnomalies() {
  for (const [category, buf] of hourlyUsage.entries()) {
    if (buf.length < 2) continue;

    const last = buf[buf.length - 1];
    const others = buf.slice(0, -1);
    const sum = others.reduce((acc, x) => acc + x.amount, 0);
    const avg = sum / others.length;

    if (avg > 0 && last.amount > avg * ANOMALY_MULTIPLIER) {
      const cooldownKey = `anomaly-${category}`;
      if (isInCooldown(cooldownKey)) continue;
      markCooldown(cooldownKey);
      alertsEmitted++;
      await bus.emitOS(EVENT_TYPES.COST_ANOMALY_DETECTED, {
        severity: "warning",
        module: MODULE_NAME,
        payload: {
          category,
          hour: last.hour,
          hourlyAmount: last.amount,
          avg24h: avg,
          multiplier: last.amount / avg,
        },
      });
    }
  }
}

async function runCheck() {
  rotateIfNeeded();
  totalChecks++;
  try {
    await checkBudgets();
    await checkAnomalies();
  } catch (err) {
    console.error("[COST-GUARD] check error:", err.message);
  }
}

// ============================================================================
// SECTION 6 — LIFECYCLE
// ============================================================================

function start() {
  if (isRunning) {
    console.warn("[COST-GUARD] zaten calisiyor, start cagrisi gormezden gelindi");
    return;
  }
  isRunning = true;
  checkTimer = setInterval(() => {
    runCheck().catch((err) => {
      console.error("[COST-GUARD] unhandled tick error:", err.message);
    });
  }, CHECK_INTERVAL_MS);
  console.log(
    `[COST-GUARD] started: interval ${CHECK_INTERVAL_MS / 60000}dk, daily USD=${BUDGET_ANTHROPIC_DAILY_USD}, monthly USD=${BUDGET_ANTHROPIC_MONTHLY_USD}, storage GB=${BUDGET_STORAGE_MONTHLY_GB}`
  );
}

function stop() {
  if (!isRunning) return;
  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
  }
  isRunning = false;
  console.log("[COST-GUARD] stopped");
}

// ============================================================================
// SECTION 7 — READ API
// ============================================================================

function getStatus() {
  return {
    isRunning,
    totalChecks,
    alertsEmitted,
    currentDay,
    currentMonth,
    currentHour,
    daily: {
      anthropicTokens: dailyUsage.get(CATEGORIES.ANTHROPIC_TOKENS) || 0,
      anthropicUsd: anthropicDailyUsd(),
      anthropicBudgetUsd: BUDGET_ANTHROPIC_DAILY_USD,
    },
    monthly: {
      anthropicTokens: monthlyUsage.get(CATEGORIES.ANTHROPIC_TOKENS) || 0,
      anthropicUsd: anthropicMonthlyUsd(),
      anthropicBudgetUsd: BUDGET_ANTHROPIC_MONTHLY_USD,
      storageMb: monthlyUsage.get(CATEGORIES.SUPABASE_STORAGE_MB) || 0,
      storageGb: storageMonthlyGb(),
      storageBudgetGb: BUDGET_STORAGE_MONTHLY_GB,
    },
    hourlyHistorySize: Array.from(hourlyUsage.values()).reduce(
      (acc, buf) => acc + buf.length,
      0
    ),
    checkIntervalMs: CHECK_INTERVAL_MS,
  };
}

function resetState() {
  dailyUsage.clear();
  monthlyUsage.clear();
  hourlyUsage.clear();
  budgetCooldown.clear();
  totalChecks = 0;
  alertsEmitted = 0;
  currentDay = new Date().toISOString().slice(0, 10);
  currentMonth = new Date().toISOString().slice(0, 7);
  currentHour = new Date().toISOString().slice(0, 13);
}

// ============================================================================
// SECTION 8 — RECONCILER POLICY HANDLER
// ============================================================================

/**
 * Policy handler: budget drift kontrolu.
 * policy.key: 'anthropic-monthly', 'storage-monthly' vb.
 * policy.value: USD veya GB olarak custom budget.
 */
async function policyHandler(policy, _prisma) {
  const key = policy?.key;
  if (!key) {
    return { drift: false, action: null, details: { reason: "missing policy.key" } };
  }

  let current;
  let limit;
  let unit;

  switch (key) {
    case "anthropic-monthly":
      current = anthropicMonthlyUsd();
      limit = parseFloat(policy.value) || BUDGET_ANTHROPIC_MONTHLY_USD;
      unit = "USD";
      break;
    case "anthropic-daily":
      current = anthropicDailyUsd();
      limit = parseFloat(policy.value) || BUDGET_ANTHROPIC_DAILY_USD;
      unit = "USD";
      break;
    case "storage-monthly":
      current = storageMonthlyGb();
      limit = parseFloat(policy.value) || BUDGET_STORAGE_MONTHLY_GB;
      unit = "GB";
      break;
    default:
      return {
        drift: false,
        action: null,
        details: { reason: "unknown policy.key", key },
      };
  }

  const drift = current >= limit;
  return {
    drift,
    action: drift ? "budget-exceeded" : null,
    details: { key, current, limit, unit },
  };
}

// Reconciler'a kaydol
registerPolicyHandler(MODULE_NAME, policyHandler);

// ============================================================================
// SECTION 9 — EXPORTS
// ============================================================================

module.exports = {
  start,
  stop,
  recordUsage,
  runCheck,
  getStatus,
  resetState,
  MODULE_NAME,
  CATEGORIES,
  CHECK_INTERVAL_MS,
  TOKEN_COST_USD,
  BUDGET_ANTHROPIC_DAILY_USD,
  BUDGET_ANTHROPIC_MONTHLY_USD,
  BUDGET_STORAGE_MONTHLY_GB,
  ANOMALY_MULTIPLIER,
};
