/**
 * src/os/adapters/oracle.js
 *
 * Oracle Cloud Hosting Adapter — THIN mode (Sprint 2 iskelet)
 *
 * AMAC:
 *   Oracle Cloud Compute Instance (Always Free: 2x AMD VM veya 4x Ampere A1)
 *   uzerindeki backend servisinin saglik/uptime/log/deploy operasyonlarini
 *   HAL uzerinden tek tip arayuze acmak. Render'dan farkli olarak SSH uzerinden
 *   yonetilir — REST API yok.
 *
 * NEDEN ORACLE:
 *   - Always Free tier: 2 AMD VM + 4 Ampere A1 (24 GB RAM!) sinirsiz sure
 *   - Render free tier 512 MB RAM ve 15dk idle sleep disavantajlarina karsi
 *   - Migration senaryosu: 10+ avukat olunca Render Pro ($7/ay) vs Oracle Free
 *   - HAL sayesinde ust katman (modules, reconciler) hic degismez
 *
 * KAPSAM (THIN):
 *   - BaseAdapter extend (name="Oracle", type="HostingAdapter")
 *   - isConfigured() override: ORACLE_SSH_HOST + ORACLE_SSH_USER + ORACLE_SSH_KEY_PATH
 *   - getHealth() override: SSH ile `uptime` komutu cikiyor
 *   - 4 HostingAdapter metodu:
 *       * getUptime()       — gercek (SSH `uptime` komutu)
 *       * getResponseTime() — gercek (app health endpoint HTTP ping)
 *       * redeploy()        — THIN stub (SSH `pm2 restart` veya `systemctl`)
 *       * getRecentLogs(n)  — THIN stub (SSH `journalctl -n` veya `pm2 logs`)
 *
 * ENV:
 *   - ORACLE_SSH_HOST          (required, ornek: 150.230.22.5)
 *   - ORACLE_SSH_USER          (required, ornek: ubuntu veya opc)
 *   - ORACLE_SSH_KEY_PATH      (required, ornek: /etc/secrets/oracle_key.pem)
 *   - ORACLE_SSH_PORT          (default: 22)
 *   - ORACLE_APP_HEALTH_URL    (optional, http://150.230.22.5:3000/health)
 *   - ORACLE_APP_SERVICE_NAME  (default: tedbirge-api, pm2/systemd icin)
 *
 * BAGIMLILIK:
 *   ssh2 paketi — Sprint 3'te npm install. THIN'de lazy require, kullanilmiyor.
 *
 * REGISTRY:
 *   Bu modul sadece class export eder. addAdapter boot.js sorumlulugu.
 *   Dikkat: Render ve Oracle ayni HostingAdapter interface'i karsilar — boot.js
 *   aktif olanin kaydini yapar (env varligina gore).
 *
 * NOT:
 *   THIN'de ssh2 paketi require EDILMEZ — lazy load, Sprint 3 pulse.js dolduracak.
 *   Bu sayede npm install ssh2 Sprint 2 icin gereksiz.
 */

"use strict";

const {
  BaseAdapter,
  NotImplementedError,
} = require("./base");

// ============================================================================
// SECTION 1 — CONSTANTS
// ============================================================================

const ADAPTER_NAME = "Oracle";
const ADAPTER_TYPE = "HostingAdapter";
const DEFAULT_SSH_PORT = 22;
const DEFAULT_SERVICE_NAME = "tedbirge-api";
const HEALTH_TIMEOUT_MS = 5000;

const HOSTING_ADAPTER_METHODS = [
  "getUptime",
  "getResponseTime",
  "redeploy",
  "getRecentLogs",
];

// ============================================================================
// SECTION 2 — OracleAdapter
// ============================================================================

class OracleAdapter extends BaseAdapter {
  constructor() {
    super(ADAPTER_NAME, ADAPTER_TYPE);

    this.sshHost = process.env.ORACLE_SSH_HOST || null;
    this.sshUser = process.env.ORACLE_SSH_USER || null;
    this.sshKeyPath = process.env.ORACLE_SSH_KEY_PATH || null;
    this.sshPort = parseInt(process.env.ORACLE_SSH_PORT, 10) || DEFAULT_SSH_PORT;
    this.appHealthUrl = process.env.ORACLE_APP_HEALTH_URL || null;
    this.appServiceName = process.env.ORACLE_APP_SERVICE_NAME || DEFAULT_SERVICE_NAME;

    this._sshClient = null;
    this._lastHealthAt = null;
    this._lastLatencyMs = null;
  }

  // --------------------------------------------------------------------------
  // BaseAdapter overrides
  // --------------------------------------------------------------------------

  isConfigured() {
    return Boolean(this.sshHost && this.sshUser && this.sshKeyPath);
  }

  /**
   * THIN: appHealthUrl varsa HTTP ping, yoksa SSH baglanti testi stub.
   * Sprint 3'te ssh2 paketi ile gercek SSH session acilir.
   */
  async getHealth() {
    const start = Date.now();
    try {
      if (!this.isConfigured()) {
        return {
          ok: false,
          error: "not configured: ORACLE_SSH_HOST + USER + KEY_PATH required",
        };
      }
      // THIN path: appHealthUrl varsa HTTP ping (SSH paketsiz test)
      if (this.appHealthUrl) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
        const res = await fetch(this.appHealthUrl, {
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
          mode: "http",
        };
      }
      // SSH mode: Sprint 3 ssh2 ile gercek baglanti
      return {
        ok: false,
        error: "SSH mode not implemented in THIN — install ssh2 package and implement in Sprint 3",
        mode: "ssh-pending",
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

  /**
   * THIN: SSH ile `uptime` komutu cagrilir. Sprint 3 pulse.js ssh2 kullanir.
   */
  async getUptime() {
    if (!this.isConfigured()) {
      throw new NotImplementedError("getUptime", this.adapterName);
    }
    this._notImplemented("getUptime");
  }

  /**
   * Gercek olcum: appHealthUrl'e HTTP ping.
   * SSH gerekmez, network latency olculur.
   */
  async getResponseTime() {
    if (!this.appHealthUrl) {
      throw new NotImplementedError("getResponseTime", this.adapterName);
    }
    const health = await this.getHealth();
    return health.latencyMs ?? -1;
  }

  /**
   * THIN: SSH ile `pm2 restart :service` veya `systemctl restart :service`.
   * Sprint 3 pulse.js dolduracak.
   */
  async redeploy() {
    if (!this.isConfigured()) {
      throw new NotImplementedError("redeploy", this.adapterName);
    }
    this._notImplemented("redeploy");
  }

  /**
   * THIN: SSH ile `pm2 logs :service --lines N` veya `journalctl -u :service -n N`.
   * Sprint 3 pulse.js dolduracak.
   */
  async getRecentLogs(n = 100) {
    if (!this.isConfigured()) {
      throw new NotImplementedError("getRecentLogs", this.adapterName);
    }
    this._notImplemented("getRecentLogs");
  }
}

// ============================================================================
// SECTION 3 — EXPORTS
// ============================================================================

module.exports = {
  OracleAdapter,
  ADAPTER_NAME,
  ADAPTER_TYPE,
  HOSTING_ADAPTER_METHODS,
};
