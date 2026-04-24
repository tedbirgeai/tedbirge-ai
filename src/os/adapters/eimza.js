/**
 * src/os/adapters/eimza.js
 *
 * E-IMZA Adapter — STUB mode (provider sozlesmesi bekleniyor)
 *
 * AMAC:
 *   Mobil imza (GSM) + USB token + e-Devlet imza entegrasyonu icin iskelet.
 *   Gercek implementasyon icin GSM operatoru (TELEKOM, VODAFONE, TURKCELL)
 *   veya e-Devlet imza provider'i (TurkKep, E-Guven vb.) sozlesmesi gerekli.
 *
 * KAPSAM (STUB):
 *   - BaseAdapter extend (name="EIMZA", type="EIMZAAdapter")
 *   - isConfigured() her zaman false
 *   - getHealth() her zaman {ok: false, error: "contract pending"}
 *   - 4 EIMZAAdapter metodu hepsi NotImplementedError
 *
 * INTERFACE (base.js JSDoc):
 *   startMobileSign, startUSBSign, startEDevletSign, verifySignature
 *
 * ENV (gelecekte):
 *   - EIMZA_PROVIDER            (mobile_telekom, mobile_vodafone, mobile_turkcell, edevlet)
 *   - EIMZA_API_ENDPOINT
 *   - EIMZA_API_KEY
 *   - EIMZA_CERT_PATH
 *
 * NOT:
 *   UYAP dilekce gonderimi icin e-imza zorunlu - bu adapter UYAP adapter ile
 *   birlikte Sprint 4'te aktif edilecek.
 */

"use strict";

const {
  BaseAdapter,
  NotImplementedError,
} = require("./base");

const ADAPTER_NAME = "EIMZA";
const ADAPTER_TYPE = "EIMZAAdapter";

const EIMZA_ADAPTER_METHODS = [
  "startMobileSign",
  "startUSBSign",
  "startEDevletSign",
  "verifySignature",
];

class EIMZAAdapter extends BaseAdapter {
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
      error: "contract pending: GSM operatoru veya e-Devlet imza provider sozlesmesi gerekli",
    };
  }

  async startMobileSign(phone, document) {
    this._notImplemented("startMobileSign");
  }

  async startUSBSign(document) {
    this._notImplemented("startUSBSign");
  }

  async startEDevletSign(tc, document) {
    this._notImplemented("startEDevletSign");
  }

  async verifySignature(document, signature) {
    this._notImplemented("verifySignature");
  }
}

module.exports = {
  EIMZAAdapter,
  ADAPTER_NAME,
  ADAPTER_TYPE,
  EIMZA_ADAPTER_METHODS,
};
