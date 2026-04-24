/**
 * src/os/adapters/sbm.js
 *
 * SBM Adapter — STUB mode (API erisimi bekleniyor)
 *
 * AMAC:
 *   Sigorta Bilgi Merkezi entegrasyonu icin iskelet. Gercek implementasyon
 *   icin SBM ile kurumsal anlasma + API erisim anahtari gerekli. Sprint 4+.
 *
 * KAPSAM (STUB):
 *   - BaseAdapter extend (name="SBM", type="SBMAdapter")
 *   - isConfigured() her zaman false
 *   - getHealth() her zaman {ok: false, error: "contract pending"}
 *   - 5 SBMAdapter metodu hepsi NotImplementedError
 *   - getMode() "manual" doner (meta-bilgi, anlasma gerekmez)
 *
 * INTERFACE (base.js JSDoc):
 *   getPoliceBilgi, getKTT, requestEksperAtama, getHasarGecmisi, getMode
 *
 * ENV (gelecekte):
 *   - SBM_API_ENDPOINT
 *   - SBM_API_KEY
 *   - SBM_KURUM_KODU
 *
 * NOT:
 *   Simdilik avukatlar SBM verilerini manuel topluyor. Bu adapter sadece
 *   ust katmanin "SBM entegrasyonu var mi" sorusuna cevap vermesi icin.
 */

"use strict";

const {
  BaseAdapter,
  NotImplementedError,
} = require("./base");

const ADAPTER_NAME = "SBM";
const ADAPTER_TYPE = "SBMAdapter";
const CURRENT_MODE = "manual";

const SBM_ADAPTER_METHODS = [
  "getPoliceBilgi",
  "getKTT",
  "requestEksperAtama",
  "getHasarGecmisi",
  "getMode",
];

class SBMAdapter extends BaseAdapter {
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
      error: "contract pending: SBM kurumsal anlasma ve API erisim anahtari gerekli",
      mode: CURRENT_MODE,
    };
  }

  async getPoliceBilgi(plaka, tc) {
    this._notImplemented("getPoliceBilgi");
  }

  async getKTT(kttNo) {
    this._notImplemented("getKTT");
  }

  async requestEksperAtama(basvuru) {
    this._notImplemented("requestEksperAtama");
  }

  async getHasarGecmisi(plaka) {
    this._notImplemented("getHasarGecmisi");
  }

  getMode() {
    return CURRENT_MODE;
  }
}

module.exports = {
  SBMAdapter,
  ADAPTER_NAME,
  ADAPTER_TYPE,
  SBM_ADAPTER_METHODS,
  CURRENT_MODE,
};
