/**
 * src/os/adapters/supabase.js
 *
 * Supabase Storage Adapter — THIN mode (Sprint 2 iskelet)
 *
 * AMAC:
 *   Supabase Storage bucket uzerindeki belge upload/download/list/sign
 *   operasyonlarini HAL uzerinden tek tip arayuze acmak. Yarin R2 veya
 *   Oracle Object Storage'a gecilirse sadece bu adapter degisir.
 *
 * KAPSAM (THIN):
 *   - BaseAdapter extend (name="Supabase", type="StorageAdapter")
 *   - isConfigured() override: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   - getHealth() override: bucket list ping (auth'lu)
 *   - 5 StorageAdapter metodu:
 *       * getSignedUrl(path, ttl)  — gercek (direct-to-supabase icin kritik)
 *       * upload(path, buf, mime)  — gercek (fallback yolu)
 *       * delete(path)             — gercek
 *       * list(prefix)             — gercek (health'te de kullanilir)
 *       * getUsage()               — THIN stub (Supabase API'de direkt yok)
 *
 * ENV:
 *   - SUPABASE_URL                  (required)
 *   - SUPABASE_SERVICE_ROLE_KEY     (required, Sprint 2 uyarisi: fallback)
 *   - SUPABASE_STORAGE_BUCKET       (default: tedbirge-documents)
 *
 * BAGIMLILIK:
 *   @supabase/supabase-js v2 — zaten package.json'da (v2.103.3, 23 Nisan eklendi)
 *
 * REGISTRY:
 *   Bu modul sadece class export eder. addAdapter cagrisini boot.js yapar
 *   (key: "storage").
 *
 * NOT:
 *   getUsage() Supabase Storage API'sinde direkt yok — PostgREST uzerinden
 *   storage.objects tablosu sorgusu gerekir (Sprint 3 pulse.js dolduracak).
 */

"use strict";

const {
  BaseAdapter,
  NotImplementedError,
} = require("./base");

// ============================================================================
// SECTION 1 — CONSTANTS
// ============================================================================

const ADAPTER_NAME = "Supabase";
const ADAPTER_TYPE = "StorageAdapter";
const DEFAULT_BUCKET = "tedbirge-documents";
const DEFAULT_SIGNED_URL_TTL = 3600; // 1 saat
const HEALTH_TIMEOUT_MS = 5000;

const STORAGE_ADAPTER_METHODS = [
  "upload",
  "getSignedUrl",
  "delete",
  "list",
  "getUsage",
];

// ============================================================================
// SECTION 2 — SupabaseAdapter
// ============================================================================

class SupabaseAdapter extends BaseAdapter {
  constructor() {
    super(ADAPTER_NAME, ADAPTER_TYPE);

    this.url = process.env.SUPABASE_URL || null;
    this.serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || null;
    this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET;

    this._client = null;
    this._lastHealthAt = null;
    this._lastLatencyMs = null;
  }

  // --------------------------------------------------------------------------
  // Internal client (lazy init)
  // --------------------------------------------------------------------------

  _getClient() {
    if (!this.isConfigured()) {
      return null;
    }
    if (!this._client) {
      const { createClient } = require("@supabase/supabase-js");
      this._client = createClient(this.url, this.serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    return this._client;
  }

  // --------------------------------------------------------------------------
  // BaseAdapter overrides
  // --------------------------------------------------------------------------

  isConfigured() {
    return Boolean(this.url && this.serviceKey);
  }

  async getHealth() {
    const start = Date.now();
    try {
      if (!this.isConfigured()) {
        return {
          ok: false,
          error: "not configured: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing",
        };
      }
      const client = this._getClient();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
      const { data, error } = await client.storage
        .from(this.bucketName)
        .list("", { limit: 1 });
      clearTimeout(timer);
      const latencyMs = Date.now() - start;
      this._lastHealthAt = new Date().toISOString();
      this._lastLatencyMs = latencyMs;
      if (error) {
        return { ok: false, latencyMs, error: error.message };
      }
      return {
        ok: true,
        latencyMs,
        bucket: this.bucketName,
        sampleCount: Array.isArray(data) ? data.length : 0,
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
  // StorageAdapter interface
  // --------------------------------------------------------------------------

  async upload(path, buffer, mimeType) {
    if (!this.isConfigured()) {
      throw new NotImplementedError("upload", this.adapterName);
    }
    const client = this._getClient();
    const { data, error } = await client.storage
      .from(this.bucketName)
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: false,
      });
    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }
    return data.path;
  }

  async getSignedUrl(path, ttlSec = DEFAULT_SIGNED_URL_TTL) {
    if (!this.isConfigured()) {
      throw new NotImplementedError("getSignedUrl", this.adapterName);
    }
    const client = this._getClient();
    const { data, error } = await client.storage
      .from(this.bucketName)
      .createSignedUrl(path, ttlSec);
    if (error) {
      throw new Error(`Supabase signed URL failed: ${error.message}`);
    }
    return data.signedUrl;
  }

  async delete(path) {
    if (!this.isConfigured()) {
      throw new NotImplementedError("delete", this.adapterName);
    }
    const client = this._getClient();
    const { error } = await client.storage
      .from(this.bucketName)
      .remove([path]);
    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
  }

  async list(prefix = "") {
    if (!this.isConfigured()) {
      throw new NotImplementedError("list", this.adapterName);
    }
    const client = this._getClient();
    const { data, error } = await client.storage
      .from(this.bucketName)
      .list(prefix);
    if (error) {
      throw new Error(`Supabase list failed: ${error.message}`);
    }
    return (data || []).map((f) => ({
      name: f.name,
      size: f.metadata?.size || 0,
    }));
  }

  async getUsage() {
    this._notImplemented("getUsage");
  }
}

// ============================================================================
// SECTION 3 — EXPORTS
// ============================================================================

module.exports = {
  SupabaseAdapter,
  ADAPTER_NAME,
  ADAPTER_TYPE,
  STORAGE_ADAPTER_METHODS,
};
