/**
 * src/os/adapters/vercel.js
 *
 * Vercel Deployment Adapter — THIN mode (Sprint 2 iskelet)
 *
 * AMAC:
 *   Vercel uzerindeki tedbirge-panel deployment'larinin tetikleme/listeleme/
 *   rollback operasyonlarini HAL uzerinden tek tip arayuze acmak. Yarin
 *   Netlify veya Cloudflare Pages'e gecilirse sadece bu adapter degisir.
 *
 * KAPSAM (THIN):
 *   - BaseAdapter extend (name="Vercel", type="DeploymentAdapter")
 *   - isConfigured() override: VERCEL_API_TOKEN + VERCEL_PROJECT_ID
 *   - getHealth() override: GET /v9/projects/:id ping (auth'lu)
 *   - 3 DeploymentAdapter metodu:
 *       * deploy(branch)          — THIN stub (Git hook otomatik, manuel nadir)
 *       * listDeployments()       — gercek (GET /v6/deployments)
 *       * rollback(deploymentId)  — THIN stub (Vercel promote API)
 *
 * ENV:
 *   - VERCEL_API_TOKEN           (required, Bearer token)
 *   - VERCEL_PROJECT_ID          (required, prj_xxx)
 *   - VERCEL_TEAM_ID             (optional, team scope icin)
 *
 * REGISTRY:
 *   Bu modul sadece class export eder. addAdapter cagrisini boot.js yapar
 *   (key: "deployment").
 *
 * NOT:
 *   Tedbirge'de Vercel deployment'lari Git push ile otomatik tetiklenir
 *   (master branch -> production). deploy() manuel build icin iskelet,
 *   Sprint 3'te pulse.js'de gercek API cagrisi eklenecek. rollback() icin
 *   Vercel "promote deployment" endpoint kullanilacak.
 */

"use strict";

const {
  BaseAdapter,
  NotImplementedError,
} = require("./base");

// ============================================================================
// SECTION 1 — CONSTANTS
// ============================================================================

const ADAPTER_NAME = "Vercel";
const ADAPTER_TYPE = "DeploymentAdapter";
const VERCEL_API_BASE = "https://api.vercel.com";
const HEALTH_TIMEOUT_MS = 5000;
const LIST_DEFAULT_LIMIT = 20;

const DEPLOYMENT_ADAPTER_METHODS = [
  "deploy",
  "listDeployments",
  "rollback",
];

// ============================================================================
// SECTION 2 — VercelAdapter
// ============================================================================

class VercelAdapter extends BaseAdapter {
  constructor() {
    super(ADAPTER_NAME, ADAPTER_TYPE);

    this.apiToken = process.env.VERCEL_API_TOKEN || null;
    this.projectId = process.env.VERCEL_PROJECT_ID || null;
    this.teamId = process.env.VERCEL_TEAM_ID || null;

    this._lastHealthAt = null;
    this._lastLatencyMs = null;
  }

  // --------------------------------------------------------------------------
  // BaseAdapter overrides
  // --------------------------------------------------------------------------

  isConfigured() {
    return Boolean(this.apiToken && this.projectId);
  }

  async getHealth() {
    const start = Date.now();
    try {
      if (!this.isConfigured()) {
        return {
          ok: false,
          error: "not configured: VERCEL_API_TOKEN or VERCEL_PROJECT_ID missing",
        };
      }
      const url = this._buildUrl(`/v9/projects/${this.projectId}`);
      const res = await this._fetch(url, { method: "GET" });
      const latencyMs = Date.now() - start;
      this._lastHealthAt = new Date().toISOString();
      this._lastLatencyMs = latencyMs;
      if (!res.ok) {
        return { ok: false, latencyMs, status: res.status };
      }
      const body = await res.json();
      return {
        ok: true,
        latencyMs,
        status: res.status,
        projectName: body.name,
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
  // DeploymentAdapter interface
  // --------------------------------------------------------------------------

  /**
   * THIN: Manuel deploy tetikleme (Vercel v13 POST /deployments).
   * Tedbirge'de Git push otomatik deploy ettigi icin bu stub. Sprint 3.
   */
  async deploy(branch) {
    if (!this.isConfigured()) {
      throw new NotImplementedError("deploy", this.adapterName);
    }
    this._notImplemented("deploy");
  }

  /**
   * Son deployment'lari listele.
   * @returns {Promise<Array<{id, status, createdAt}>>}
   */
  async listDeployments() {
    if (!this.isConfigured()) {
      throw new NotImplementedError("listDeployments", this.adapterName);
    }
    const url = this._buildUrl(
      `/v6/deployments?projectId=${this.projectId}&limit=${LIST_DEFAULT_LIMIT}`
    );
    const res = await this._fetch(url, { method: "GET" });
    if (!res.ok) {
      throw new Error(`Vercel listDeployments failed: HTTP ${res.status}`);
    }
    const body = await res.json();
    return (body.deployments || []).map((d) => ({
      id: d.uid || d.id,
      status: d.state || d.readyState,
      createdAt: new Date(d.created || d.createdAt),
    }));
  }

  /**
   * THIN: Belirli deployment'i production'a al (promote).
   * Vercel v13 POST /projects/:id/promote/:deploymentId. Sprint 3.
   */
  async rollback(deploymentId) {
    if (!this.isConfigured()) {
      throw new NotImplementedError("rollback", this.adapterName);
    }
    this._notImplemented("rollback");
  }

  // --------------------------------------------------------------------------
  // Internal helpers
  // --------------------------------------------------------------------------

  _buildUrl(path) {
    const url = new URL(path, VERCEL_API_BASE);
    if (this.teamId) {
      url.searchParams.set("teamId", this.teamId);
    }
    return url.toString();
  }

  async _fetch(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        signal: controller.signal,
      });
      return res;
    } finally {
      clearTimeout(timer);
    }
  }
}

// ============================================================================
// SECTION 3 — EXPORTS
// ============================================================================

module.exports = {
  VercelAdapter,
  ADAPTER_NAME,
  ADAPTER_TYPE,
  DEPLOYMENT_ADAPTER_METHODS,
};
