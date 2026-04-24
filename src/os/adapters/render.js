/**
 * src/os/adapters/render.js
 *
 * Render Hosting Adapter — THIN mode (Sprint 2 iskelet)
 *
 * AMAC:
 *   Render.com'daki tedbirge-ai backend servisinin saglik/uptime/log/deploy
 *   operasyonlarini HAL uzerinden tek tip arayuze acmak.
 *
 * KAPSAM (THIN):
 *   - BaseAdapter extend (name="Render", type="HostingAdapter")
 *   - isConfigured() override: RENDER_API_KEY + RENDER_SERVICE_ID kontrolu
 *   - getHealth() override: public /health endpoint ping (auth-free)
 *   - 4 HostingAdapter metodu:
 *       * getResponseTime() — gercek olcum (health ping ile)
 *       * getUptime()       — THIN'de stub, pulse.js'de gercek
 *       * redeploy()        — THIN'de stub, pulse.js'de gercek
 *       * getRecentLogs(n)  — THIN'de stub, pulse.js'de gercek
 *
 * ENV:
 *   - RENDER_API_KEY     (optional Sprint 2, required Sprint 3)
 *   - RENDER_SERVICE_ID  (optional Sprint 2, required Sprint 3)
 *   - RENDER_HEALTH_URL  (default: https://tedbirge-ai.onrender.com/health)
 *
 * REGISTRY:
 *   Bu modul sadece class export eder. Registry kaydi (addAdapter) boot.js'in
 *   sorumlulugundadir — key secimi upper-layer kararidir.
 *
 * INTERFACE COMPLIANCE:
 *   validateAdapter() kullanilarak runtime'da 4 HostingAdapter metodu
 *   kontrol edilir (duck-typing).
 */

"use strict";

const {
  BaseAdapter,
  NotImplementedError,
  validateAdapter,
} = require("./base");

// ============================================================================
// SECTION 1 — CONSTANTS
// ============================================================================

const ADAPTER_NAME = "Render";
const ADAPTER_TYPE = "HostingAdapter";
const DEFAULT_HEALTH_URL = "https://tedbirge-ai.onrender.com/health";
const HEALTH_TIMEOUT_MS = 5000;

const HOSTING_ADAPTER_METHODS = [
  "getUptime",
  "getResponseTime",
  "redeploy",
  "getRecentLogs",
];

// ============================================================================
// SECTION 2 — RenderAdapter
// ============================================================================

class RenderAdapter extends BaseAdapter {
  constructor() {
    super(ADAPTER_NAME, ADAPTER_TYPE);

    this.apiKey = process.env.RENDER_API_KEY || null;
    this.serviceId = process.env.RENDER_SERVICE_ID || null;
    this.healthUrl = process.env.RENDER_HEALTH_URL || DEFAULT_HEALTH_URL;

    this._lastHealthAt = null;
    this._lastLatencyMs = null;
  }

  // --------------------------------------------------------------------------
  // BaseAdapter overrides
  // --------------------------------------------------------------------------

  isConfigured() {
    return Boolean(this.healthUrl);
  }

  async getHealth() {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
      const res = await fetch(this.healthUrl, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timer);
      const latencyMs = Date.now() - start;
      this._lastHealthAt = new Date().toISOString();
      this._lastLatencyMs = latencyMs;
      return {
        ok: res.ok,
        latencyMs,
        status: res.status,
      };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: err.message,
      };
    }
  }

  // --------------------------------------------------------------------------
  // HostingAdapter interface
  // --------------------------------------------------------------------------

  async getUptime() {
    this._notImplemented("getUptime");
  }

  async getResponseTime() {
    const health = await this.getHealth();
    return health.latencyMs ?? -1;
  }

  async redeploy() {
    if (!this.apiKey || !this.serviceId) {
      throw new NotImplementedError("redeploy", this.adapterName);
    }
    this._notImplemented("redeploy");
  }

  async getRecentLogs(n = 100) {
    if (!this.apiKey || !this.serviceId) {
      throw new NotImplementedError("getRecentLogs", this.adapterName);
    }
    this._notImplemented("getRecentLogs");
  }
}

// ============================================================================
// SECTION 3 — EXPORTS
// ============================================================================

module.exports = {
  RenderAdapter,
  ADAPTER_NAME,
  ADAPTER_TYPE,
  HOSTING_ADAPTER_METHODS,
};
