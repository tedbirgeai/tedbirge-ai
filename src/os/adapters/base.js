/**
 * Tedbirge OS — HAL (Hardware Abstraction Layer) Taban Siniflar
 *
 * Bu dosya 9 adapter interface'ini ve ortak BaseAdapter abstract class'ini tanimlar.
 * Gercek implementation'lar kardeş dosyalarda (render.js, supabase.js, ...).
 *
 * Mimari:
 *   - JavaScript'te gercek "interface" yok — JSDoc @typedef ile kontrat belgesi
 *   - BaseAdapter: her adapter'in miras aldigi sinif (isConfigured, getHealth, adapterName)
 *   - Registry: runtime'da adapter eklemek/getirmek icin (addAdapter, getAdapter, listAdapters)
 *   - Validator: bir instance'in beklenen metodlara sahip oldugunu kontrol eder
 *
 * Neden HAL kritik:
 *   Yarin Render'dan Fly.io'ya gecersek, sadece RenderAdapter'i FlyioAdapter ile degistiririz.
 *   Ust katman (modules, reconciler, boot) hic degismez.
 *
 * 9 Interface:
 *   1. HostingAdapter         — Render, Oracle, Fly.io vb.
 *   2. StorageAdapter         — Supabase Storage, S3, R2, Oracle Object Storage
 *   3. AIAdapter              — Anthropic, OpenAI, Gemini
 *   4. DeploymentAdapter      — Vercel, Netlify, Cloudflare Pages
 *   5. DataProtectionAdapter  — KVKK, GDPR (uluslararasi geçiş icin)
 *   6. LegalAdapter           — Hukuki is istasyonu generic (yerli/yabanci yargi sistemleri)
 *   7. UYAPAdapter            — Turkiye'ye ozel: Adalet Bakanligi (v3 Sprint 4)
 *   8. SBMAdapter             — Turkiye'ye ozel: Sigorta Bilgi Merkezi (v3 Sprint 4)
 *   9. EIMZAAdapter           — Turkiye'ye ozel: E-imza (mobil/USB/e-Devlet)
 *
 * Referans: TEDBIRGE_OS_FIZIBILITE_v2 Prensip 10 (HAL), v3 Bolum 2.1 (3 yeni adapter)
 */

// ─── Interface Tanimları (JSDoc @typedef) ───────────────────────────────────

/**
 * @typedef {Object} HostingAdapter
 * @property {() => Promise<number>} getUptime - Son 24 saat uptime yuzde (0-100)
 * @property {() => Promise<number>} getResponseTime - p95 response time (ms)
 * @property {() => Promise<void>} redeploy - Son commit ile yeniden deploy
 * @property {(n: number) => Promise<string[]>} getRecentLogs - Son N log satiri
 */

/**
 * @typedef {Object} StorageAdapter
 * @property {(path: string, buffer: Buffer, mimeType: string) => Promise<string>} upload - Dosya yukle, storage path dondur
 * @property {(path: string, ttlSec?: number) => Promise<string>} getSignedUrl - Zaman-sinirli indirme URL
 * @property {(path: string) => Promise<void>} delete - Dosyayi sil
 * @property {(prefix: string) => Promise<Array<{name: string, size: number}>>} list - Klasor icerigi
 * @property {() => Promise<{used: number, total: number}>} getUsage - Kullanim/kapasite (bytes)
 */

/**
 * @typedef {Object} AIAdapter
 * @property {(messages: Array, opts?: object) => Promise<{content: string, tokens: number}>} complete - Sohbet completion
 * @property {() => Promise<number>} getRemainingQuota - Kalan kota (token veya request)
 * @property {() => Promise<string>} getModelName - Aktif model adi
 */

/**
 * @typedef {Object} DeploymentAdapter
 * @property {(branch?: string) => Promise<{deploymentId: string, url: string}>} deploy - Yeni deployment tetikle
 * @property {() => Promise<Array<{id: string, status: string, createdAt: Date}>>} listDeployments - Son deployment'lar
 * @property {(deploymentId: string) => Promise<void>} rollback - Belirli deployment'a geri don
 */

/**
 * @typedef {Object} DataProtectionAdapter
 * @property {() => Promise<{registered: boolean, verbisNo?: string}>} getComplianceStatus - VERBIS veya GDPR kayit durumu
 * @property {(leadId: string) => Promise<Buffer>} exportUserData - Kisisel veri paketi (KVKK/GDPR ihlali)
 * @property {(leadId: string, reason: string) => Promise<void>} anonymize - Tum veriyi anonimlestir
 * @property {(event: object) => Promise<void>} logAccess - Audit log kaydi (kim ne gordu ne zaman)
 */

/**
 * @typedef {Object} LegalAdapter
 * @property {(caseNo: string) => Promise<object>} getCaseStatus - Dosya durumu
 * @property {(caseNo: string) => Promise<Array>} getCaseDocuments - Dosya evraklari
 * @property {(caseNo: string, document: object) => Promise<string>} submitDocument - Evrak gonder, receipt dondur
 * @property {() => string} getJurisdiction - Ulke/yargi kodu (TR, DE, US, ...)
 */

/**
 * @typedef {Object} UYAPAdapter
 * @extends LegalAdapter
 * @property {(avukatId: string, token: string) => Promise<object>} authenticate - E-imza ile session ac
 * @property {(dosyaNoList: string[], session: object) => Promise<Array>} getDosyalarBatch - Toplu dosya sorgu
 * @property {(avukatId: string, callback: Function) => void} subscribeTebligat - Tebligat bildirim dinle
 * @property {() => Promise<object>} getRateLimits - Bakanlik rate limit bilgisi
 */

/**
 * @typedef {Object} SBMAdapter
 * @property {(plaka: string, tc: string) => Promise<object | null>} getPoliceBilgi - Trafik sigortasi poliçe
 * @property {(kttNo: string) => Promise<object | null>} getKTT - Kaza Tespit Tutanagi
 * @property {(basvuru: object) => Promise<object>} requestEksperAtama - Eksper talebi
 * @property {(plaka: string) => Promise<Array>} getHasarGecmisi - Hasar gecmisi
 * @property {() => 'manual' | 'api'} getMode - Simdilik manual, gelecekte api
 */

/**
 * @typedef {Object} EIMZAAdapter
 * @property {(phone: string, document: string) => Promise<object>} startMobileSign - Mobil imza baslat (GSM operatoru)
 * @property {(document: string) => Promise<object>} startUSBSign - USB token ile imza (browser)
 * @property {(tc: string, document: string) => Promise<object>} startEDevletSign - e-Devlet imza
 * @property {(document: string, signature: string) => Promise<boolean>} verifySignature - Imza dogrula
 */

// ─── Hata tipleri ───────────────────────────────────────────────────────────

class NotImplementedError extends Error {
  constructor(methodName, adapterName) {
    super(`${adapterName}.${methodName}() is not implemented`);
    this.name = 'NotImplementedError';
    this.adapterName = adapterName;
    this.methodName = methodName;
  }
}

class AdapterConfigError extends Error {
  constructor(adapterName, reason) {
    super(`${adapterName} misconfigured: ${reason}`);
    this.name = 'AdapterConfigError';
    this.adapterName = adapterName;
  }
}

// ─── BaseAdapter — her adapter'in miras aldigi abstract class ───────────────

class BaseAdapter {
  /**
   * @param {string} adapterName - ornegin "Render", "Supabase", "UYAP"
   * @param {string} adapterType - interface adi: "HostingAdapter", "StorageAdapter", ...
   */
  constructor(adapterName, adapterType) {
    if (this.constructor === BaseAdapter) {
      throw new Error('BaseAdapter dogrudan instantiate edilemez — alt sinif yazin');
    }
    this.adapterName = adapterName;
    this.adapterType = adapterType;
  }

  /**
   * Adapter'in kullanima hazir olup olmadigini kontrol et.
   * Tipik olarak env var kontrolu.
   * @returns {boolean}
   */
  isConfigured() {
    return true; // alt sinif override etmeli
  }

  /**
   * Hizli health check — bir API ping veya benzeri.
   * @returns {Promise<{ok: boolean, latencyMs?: number, error?: string}>}
   */
  async getHealth() {
    const start = Date.now();
    try {
      if (!this.isConfigured()) {
        return { ok: false, error: 'not configured' };
      }
      // Alt siniflar override etmeli — varsayilan: config varsa OK
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  /**
   * Bir metodun gerceklenmedigi durumda alt sinif cagirabilir.
   * @param {string} methodName
   * @throws {NotImplementedError}
   */
  _notImplemented(methodName) {
    throw new NotImplementedError(methodName, this.adapterName);
  }
}

// ─── Registry — runtime adapter kayit ─────────────────────────────────────────

const adapters = new Map();

/**
 * Bir adapter'i kaydet. Tipik olarak server boot'unda cagrilir.
 * @param {string} key - "hosting", "storage", "ai", "deployment", "uyap", ...
 * @param {BaseAdapter} instance
 */
function addAdapter(key, instance) {
  if (!(instance instanceof BaseAdapter)) {
    throw new AdapterConfigError(
      instance?.adapterName || 'unknown',
      'BaseAdapter subclass degil'
    );
  }
  adapters.set(key, instance);
}

/**
 * Kayitli adapter'i getir.
 * @param {string} key
 * @returns {BaseAdapter | undefined}
 */
function getAdapter(key) {
  return adapters.get(key);
}

/**
 * Tum kayitli adapter'leri listele.
 * @returns {Array<{key: string, name: string, type: string, configured: boolean}>}
 */
function listAdapters() {
  return Array.from(adapters.entries()).map(([key, instance]) => ({
    key,
    name: instance.adapterName,
    type: instance.adapterType,
    configured: instance.isConfigured(),
  }));
}

/**
 * Bir instance'in beklenen metodlara sahip olup olmadigini kontrol et.
 * Duck-typing validation — JSDoc interface'inde tanimli metodlar gercek var mi?
 *
 * @param {object} instance - test edilecek adapter instance
 * @param {string[]} requiredMethods - olmasi gereken metod isimleri
 * @returns {{valid: boolean, missing: string[]}}
 */
function validateAdapter(instance, requiredMethods) {
  const missing = requiredMethods.filter(m => typeof instance[m] !== 'function');
  return { valid: missing.length === 0, missing };
}

// ─── Export ──────────────────────────────────────────────────────────────────

module.exports = {
  BaseAdapter,
  NotImplementedError,
  AdapterConfigError,
  addAdapter,
  getAdapter,
  listAdapters,
  validateAdapter,
};
