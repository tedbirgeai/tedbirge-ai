/**
 * src/os/observability/metrics.js
 * Tedbirge OS — Observability: Metrics Aggregator
 *
 * Performance modulunden p50/p95/p99 ceker, Prometheus-style format donusur.
 * Sprint 3: /api/metrics endpoint + Grafana dashboard.
 */

"use strict";

const MODULE_NAME = "metrics";

function getSummary() {
  try {
    const perf = require("../modules/performance");
    const status = perf.getStatus();
    return {
      timestamp: new Date().toISOString(),
      available: true,
      categories: status.categories,
      totalLatencySamples: status.totalLatencySamples,
      totalThroughputSamples: status.totalThroughputSamples,
      alertsEmitted: status.alertsEmitted,
      byCategory: status.byCategory || {},
    };
  } catch (err) {
    return { timestamp: new Date().toISOString(), available: false, error: err.message };
  }
}

function toPrometheus() {
  const summary = getSummary();
  if (!summary.available || !summary.byCategory) {
    return "# HELP tedbirge performance module unavailable\n";
  }
  const lines = [
    "# HELP tedbirge_latency_p95_ms Latency p95 per category",
    "# TYPE tedbirge_latency_p95_ms gauge",
  ];
  for (const [cat, stats] of Object.entries(summary.byCategory)) {
    const safeCat = cat.replace(/[^a-zA-Z0-9_]/g, "_");
    lines.push(`tedbirge_latency_p95_ms{category="${safeCat}"} ${stats.latency?.p95 || 0}`);
    lines.push(`tedbirge_latency_p50_ms{category="${safeCat}"} ${stats.latency?.p50 || 0}`);
    lines.push(`tedbirge_latency_p99_ms{category="${safeCat}"} ${stats.latency?.p99 || 0}`);
    lines.push(`tedbirge_request_count{category="${safeCat}"} ${stats.latency?.count || 0}`);
  }
  return lines.join("\n") + "\n";
}

function getStatus() {
  const summary = getSummary();
  return {
    available: summary.available,
    categoryCount: summary.available ? summary.categories : 0,
    lastSummary: summary.timestamp,
  };
}

module.exports = { getSummary, toPrometheus, getStatus, MODULE_NAME };
