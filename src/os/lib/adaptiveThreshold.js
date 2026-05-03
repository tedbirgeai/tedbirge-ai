// TUR #72 A0 — Adaptive Threshold helper
// Madde 30.18 — modül eşikleri statik default + p95+2σ kombinasyonu (max strategy)
// Cold start safe: 7 gün veri < 100 sample → null döner, çağıran static_default kullanır

"use strict";

const prisma = require("../../config/db");

function quantile(sorted, q) {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

function standardDeviation(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sq = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(sq.reduce((a, b) => a + b, 0) / (values.length - 1));
}

/**
 * Son `days` gün AgentEvent payload[metricName] değerlerinin p95 + 2σ eşiğini döner.
 * Veri < 100 sample → null (cold start, çağıran static default kullanmalı).
 */
async function calculateThreshold(agentName, metricName, days = 7) {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const events = await prisma.agentEvent.findMany({
      where: { agentName, createdAt: { gte: since } },
      select: { payload: true },
      take: 5000,
    });
    const values = events
      .map((e) => {
        const v = e?.payload?.[metricName];
        return typeof v === "number" && Number.isFinite(v) ? v : null;
      })
      .filter((v) => v !== null);

    if (values.length < 100) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const p95 = quantile(sorted, 0.95);
    const stddev = standardDeviation(values);
    return p95 + 2 * stddev;
  } catch (err) {
    return null;
  }
}

/**
 * Max strategy: rule_threshold = max(static_default, statistical_p95+2σ)
 * Adaptive eşik kuralın YERİNE değil ÜSTÜNE çalışır (Madde 30.18).
 */
async function adaptiveOr(agentName, metricName, staticDefault, days = 7) {
  const adaptive = await calculateThreshold(agentName, metricName, days);
  if (adaptive == null) {
    return { threshold: staticDefault, source: "static", coldStart: true };
  }
  return {
    threshold: Math.max(staticDefault, adaptive),
    source: adaptive > staticDefault ? "adaptive" : "static",
    coldStart: false,
    adaptive,
    staticDefault,
  };
}

module.exports = { calculateThreshold, adaptiveOr };
