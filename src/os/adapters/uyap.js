/**
 * src/os/adapters/uyap.js
 *
 * UYAP Adapter — STUB mode (anlasma bekleniyor)
 *
 * AMAC:
 *   Adalet Bakanligi UYAP Avukat Portali entegrasyonu icin iskelet.
 *   Gercek implementasyon icin Adalet Bakanligi ile resmi anlasma + baro
 *   uzerinden yetki sertifikasi gerekli. Sprint 4+ hedefi.
 *
 * KAPSAM (STUB):
 *   - BaseAdapter extend (name="UYAP", type="UYAPAdapter")
 *   - isConfigured() her zaman false (anlasma yok)
 *   - getHealth() her zaman {ok: false, error: "contract pending"}
 *   - 4 UYAPAdapter metodu hepsi NotImplementedError
 *   - 4 LegalAdapter metodu hepsi NotImplementedError (UYAP extends Legal)
 *
 * INTERFACE (base.js JSDoc):
 *   LegalAdapter: getCaseStatus, getCaseDocuments, submitDocument, getJurisdiction
 *   UYAPAdapter:  authenticate, getDosyalarBatch, subscribeTebligat, getRateLimits
 *
 * ENV (gelecekte):
 *   - UYAP_WS_ENDPOINT
 *   - UYAP_KURUM_KODU
 *   - UYAP_EIMZA_PROVIDER
 *
 * NOT:
 *   getJurisdiction() sabit "TR" doner - bu bilgiyi vermek icin anlasma
 *   gerekmez, HAL seviyesinde meta-bilgi.
 */

"use strict";

const {
  BaseAdapter,
  NotImplementedError,
} = require("./base");

const ADAPTER_NAME = "UYAP";
const ADAPTER_TYPE = "UYAPAdapter";
const JURISDICTION = "TR";

const UYAP_ADAPTER_METHODS = [
  "getCaseStatus",
  "getCaseDocuments",
  "submitDocument",
  "getJurisdiction",
  "authenticate",
  "getDosyalarBatch",
  "subscribeTebligat",
  "getRateLimits",
];

class UYAPAdapter extends BaseAdapter {
  constructor() {
    super(ADAPTER_NAME, ADAPTER_TYPE);
    this.contractPending = true;
  }

  isConfigured() {
    return false;
  }

  async getHealth() {
    return {
      ok: false,
      error: "contract pending: Adalet Bakanligi UYAP anlasmasi ve baro yetki sertifikasi gerekli",
      jurisdiction: JURISDICTION,
    };
  }

  // LegalAdapter interface
  async getCaseStatus(caseNo) {
    this._notImplemented("getCaseStatus");
  }

  async getCaseDocuments(caseNo) {
    this._notImplemented("getCaseDocuments");
  }

  async submitDocument(caseNo, document) {
    this._notImplemented("submitDocument");
  }

  getJurisdiction() {
    return JURISDICTION;
  }

  // UYAPAdapter interface
  async authenticate(avukatId, token) {
    this._notImplemented("authenticate");
  }

  async getDosyalarBatch(dosyaNoList, session) {
    this._notImplemented("getDosyalarBatch");
  }

  subscribeTebligat(avukatId, callback) {
    throw new NotImplementedError("subscribeTebligat", this.adapterName);
  }

  async getRateLimits() {
    this._notImplemented("getRateLimits");
  }
}

module.exports = {
  UYAPAdapter,
  ADAPTER_NAME,
  ADAPTER_TYPE,
  UYAP_ADAPTER_METHODS,
  JURISDICTION,
};
