/**
 * src/os/adapters/anthropic.js
 *
 * Anthropic AI Adapter — THIN mode (Sprint 2 iskelet)
 *
 * AMAC:
 *   Anthropic Claude API uzerindeki sohbet completion + kota + model bilgisi
 *   islemlerini HAL uzerinden tek tip arayuze acmak. Yarin OpenAI veya
 *   Gemini'ye gecilirse sadece bu adapter degisir, LexScan/dilekce motoru
 *   hic degismez.
 *
 * KAPSAM (THIN):
 *   - BaseAdapter extend (name="Anthropic", type="AIAdapter")
 *   - isConfigured() override: ANTHROPIC_API_KEY varligi
 *   - getHealth() override: minimal completion ping (1 token, hafif model)
 *   - 3 AIAdapter metodu:
 *       * complete(messages, opts)  — gercek (sohbet completion)
 *       * getModelName()            — gercek (aktif model string)
 *       * getRemainingQuota()       — THIN stub (Anthropic quota API direkt yok)
 *
 * ENV:
 *   - ANTHROPIC_API_KEY          (required)
 *   - ANTHROPIC_MODEL            (default: claude-sonnet-4-6)
 *   - ANTHROPIC_MAX_TOKENS       (default: 4096)
 *
 * BAGIMLILIK:
 *   @anthropic-ai/sdk — zaten package.json'da (LexScan kullaniyor)
 *
 * REGISTRY:
 *   Bu modul sadece class export eder. addAdapter cagrisini boot.js yapar
 *   (key: "ai").
 *
 * NOT:
 *   getRemainingQuota() Anthropic console disinda sorgulanamaz — Sprint 3'te
 *   ya Usage API (henuz beta) ya da header'dan okunacak (x-ratelimit-*).
 *
 * MOCK MODE:
 *   ANTHROPIC_API_KEY yoksa complete() NotImplementedError firlatir. Ust
 *   katmandaki LexScan/dilekce motorunun kendi fallback'i zaten var.
 */

"use strict";

const {
  BaseAdapter,
  NotImplementedError,
} = require("./base");

// ============================================================================
// SECTION 1 — CONSTANTS
// ============================================================================

const ADAPTER_NAME = "Anthropic";
const ADAPTER_TYPE = "AIAdapter";
const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 4096;
const HEALTH_MAX_TOKENS = 1;
const HEALTH_TIMEOUT_MS = 8000;

const AI_ADAPTER_METHODS = [
  "complete",
  "getRemainingQuota",
  "getModelName",
];

// ============================================================================
// SECTION 2 — AnthropicAdapter
// ============================================================================

class AnthropicAdapter extends BaseAdapter {
  constructor() {
    super(ADAPTER_NAME, ADAPTER_TYPE);

    this.apiKey = process.env.ANTHROPIC_API_KEY || null;
    this.model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
    this.maxTokens = parseInt(process.env.ANTHROPIC_MAX_TOKENS, 10) || DEFAULT_MAX_TOKENS;

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
      const Anthropic = require("@anthropic-ai/sdk");
      this._client = new Anthropic({ apiKey: this.apiKey });
    }
    return this._client;
  }

  // --------------------------------------------------------------------------
  // BaseAdapter overrides
  // --------------------------------------------------------------------------

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async getHealth() {
    const start = Date.now();
    try {
      if (!this.isConfigured()) {
        return {
          ok: false,
          error: "not configured: ANTHROPIC_API_KEY missing",
        };
      }
      const client = this._getClient();
      const response = await client.messages.create({
        model: this.model,
        max_tokens: HEALTH_MAX_TOKENS,
        messages: [{ role: "user", content: "ping" }],
      });
      const latencyMs = Date.now() - start;
      this._lastHealthAt = new Date().toISOString();
      this._lastLatencyMs = latencyMs;
      return {
        ok: true,
        latencyMs,
        model: this.model,
        stopReason: response.stop_reason,
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
  // AIAdapter interface
  // --------------------------------------------------------------------------

  /**
   * Sohbet completion.
   * @param {Array<{role: string, content: string}>} messages
   * @param {object} [opts] - { model, maxTokens, system }
   * @returns {Promise<{content: string, tokens: number}>}
   */
  async complete(messages, opts = {}) {
    if (!this.isConfigured()) {
      throw new NotImplementedError("complete", this.adapterName);
    }
    const client = this._getClient();
    const params = {
      model: opts.model || this.model,
      max_tokens: opts.maxTokens || this.maxTokens,
      messages,
    };
    if (opts.system) {
      params.system = opts.system;
    }
    const response = await client.messages.create(params);
    const textBlocks = (response.content || []).filter((b) => b.type === "text");
    const content = textBlocks.map((b) => b.text).join("");
    const tokens = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
    return { content, tokens };
  }

  /**
   * THIN: Anthropic quota API public degil. Sprint 3'te x-ratelimit-* header
   * okuyarak veya Usage API (beta) ile doldurulacak.
   */
  async getRemainingQuota() {
    this._notImplemented("getRemainingQuota");
  }

  /**
   * Aktif model adi.
   * @returns {string}
   */
  getModelName() {
    return this.model;
  }
}

// ============================================================================
// SECTION 3 — EXPORTS
// ============================================================================

module.exports = {
  AnthropicAdapter,
  ADAPTER_NAME,
  ADAPTER_TYPE,
  AI_ADAPTER_METHODS,
  DEFAULT_MODEL,
};
