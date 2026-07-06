// src/services/bedesten.service.js
//
// GERÇEK, RESMİ EMSAL KARAR KAYNAĞI — bedesten.adalet.gov.tr (T.C. Adalet
// Bakanlığı'nın gerçek, resmi arka uç servisi). Mock/uydurma veri DEĞİL.
//
// Şema, açık kaynak (MIT lisanslı) "yargi-mcp" projesinin Python istemcisi
// incelenerek birebir çıkarılmıştır (bedesten_mcp_module/client.py + models.py,
// github.com/saidsurucu/yargi-mcp). Aynı istek/cevap alanları burada JS'e
// taşındı — üçüncü parti bir kütüphane/servis eklenmedi, doğrudan resmi
// bakanlık uç noktasına konuşuyoruz.
//
// Madde 24.14 R1 — $0 maliyet, dış ücretli servise bağımlılık yok.
//
// DÜRÜSTLÜK NOTU: Bu resmi ama YAYINLANMAMIŞ (üçüncü parti tarafından
// gözlemlenerek belgelenmiş) bir uç nokta — bakanlık formatı haber vermeden
// değiştirebilir. Bu yüzden her hata sessizce yutulur, üst katman (localAI,
// chatbot) her zaman eski/mevcut davranışına geri döner — kullanıcı asla
// hata görmez.

"use strict";

const BASE_URL = "https://bedesten.adalet.gov.tr";
const SEARCH_ENDPOINT = `${BASE_URL}/emsal-karar/searchDocuments`;
const DOCUMENT_ENDPOINT = `${BASE_URL}/emsal-karar/getDocumentContent`;

const HEADERS = {
  Accept: "*/*",
  "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
  AdaletApplicationName: "UyapMevzuat",
  "Content-Type": "application/json; charset=utf-8",
  Origin: "https://mevzuat.adalet.gov.tr",
  Referer: "https://mevzuat.adalet.gov.tr/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};

// ── Ölçülmüş resmi hız limiti: IP başına 30sn'de 10 istek (yargi-mcp
// projesinin kaynak kodundaki yorumdan) — biz güvenlik payı için
// 1 istek / 3.5sn kotasıyla (token bucket) çalışıyoruz, aşımda 429 alıp
// bakanlık sunucusunu yormamak için.
let tokens = 1;
const CAPACITY = 1;
const REFILL_MS = 3500;
let lastRefill = Date.now();

async function acquireToken(maxWaitMs = 8000) {
  const deadline = Date.now() + maxWaitMs;
  for (;;) {
    const now = Date.now();
    const elapsed = now - lastRefill;
    if (elapsed >= REFILL_MS) {
      tokens = CAPACITY;
      lastRefill = now;
    }
    if (tokens >= 1) {
      tokens -= 1;
      return;
    }
    if (Date.now() >= deadline) {
      throw new Error("Bedesten hız limiti — yerel kota dolu, tekrar deneyin.");
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}

/**
 * Gerçek Yargıtay/Danıştay emsal kararlarını arar (bakanlığın resmi kaynağından).
 *
 * @param {object} opts
 * @param {string} opts.phrase - arama ifadesi (ör. "trafik kazası tazminat")
 * @param {"YARGITAYKARARI"|"DANISTAYKARAR"} [opts.itemType] - varsayılan YARGITAYKARARI
 * @param {number} [opts.pageSize] - varsayılan 3 (fazla istemiyoruz, hız limiti dar)
 * @returns {Promise<Array<{documentId, birimAdi, esasNo, kararNo, tarih, sourceUrl}>>}
 */
async function searchEmsalKararlar({ phrase, itemType = "YARGITAYKARARI", pageSize = 3 }) {
  if (!phrase || !phrase.trim()) throw new Error("Arama ifadesi (phrase) gerekli.");

  await acquireToken();

  const body = {
    data: {
      pageSize,
      pageNumber: 1,
      itemTypeList: [itemType],
      phrase: phrase.trim(),
      birimAdi: "ALL",
      sortFields: ["KARAR_TARIHI"],
      sortDirection: "desc",
    },
    applicationName: "UyapMevzuat",
    paging: true,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(SEARCH_ENDPOINT, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Bedesten arama hatası (${res.status})`);
    const json = await res.json();
    const list = json?.data?.emsalKararList || [];

    return list.map((k) => ({
      documentId: k.documentId,
      birimAdi: k.birimAdi || null,
      esasNo: k.esasNoYil && k.esasNoSira ? `${k.esasNoYil}/${k.esasNoSira}` : k.esasNo || null,
      kararNo: k.kararNoYil && k.kararNoSira ? `${k.kararNoYil}/${k.kararNoSira}` : k.kararNo || null,
      tarih: k.kararTarihiStr || null,
      kararTuru: k.kararTuru || null,
      // Bedesten kararlar için tek tıklanabilir kaynak sayfası sunmuyor —
      // documentId ile getKararMetni() çağrılarak tam metin alınabilir.
      sourceNote: "Tam metin için documentId ile getKararMetni() kullanın.",
    }));
  } finally {
    clearTimeout(timer);
  }
}

/** Basit HTML→düz metin (ağır bir kütüphane eklemeden, "0 bağımlılık" ilkesiyle). */
function htmlToPlainText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Bir kararın tam metnini getirir (documentId ile).
 * @returns {Promise<{text:string, mimeType:string, sourceUrl:string}>}
 */
async function getKararMetni(documentId) {
  if (!documentId) throw new Error("documentId gerekli.");
  await acquireToken();

  const body = { data: { documentId }, applicationName: "UyapMevzuat" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(DOCUMENT_ENDPOINT, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Bedesten belge hatası (${res.status})`);
    const json = await res.json();
    const { content, mimeType } = json?.data || {};
    if (!content || !mimeType) throw new Error("Belge içeriği boş döndü.");

    const buf = Buffer.from(content, "base64");
    const sourceUrl = `https://mevzuat.adalet.gov.tr/ictihat/${documentId}`;

    if (mimeType === "text/html") {
      return { text: htmlToPlainText(buf.toString("utf-8")), mimeType, sourceUrl };
    }
    // PDF: ağır bir PDF-parse bağımlılığı eklemek yerine dürüstçe köprü veriyoruz —
    // 0 bağımlılık ilkesi + "0 hata" (çökme yerine net bir mesaj).
    return {
      text: `Bu karar PDF formatında yayınlanmış. Tam metin için: ${sourceUrl}`,
      mimeType,
      sourceUrl,
    };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { searchEmsalKararlar, getKararMetni };
