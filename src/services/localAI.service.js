// src/services/localAI.service.js
//
// YEREL MUHAKEME KATMANI — Ollama + açık ağırlıklı model (Qwen2.5 vb.)
// Madde 24.14 R1 — $0 maliyet, dış servise bağımlılık yok, veri hiç dışarı çıkmaz.
//
// MİMARİ (Piksel ve Umut projesindeki /api/ollama köprüsüyle BİREBİR AYNI —
// aynı ekip aynı desenle iki üründe de kanıtlamış): kural motoru ($0, anlık)
// çoğu soruyu karşılar. Motor "FALLBACK" derse (anlamadıysa), bu servis
// devreye girer — ama ASLA serbestçe "uydurmaz": yalnızca kendisine
// verilen GERÇEK bağlamdan (güncel ZMSS limitleri, süre/zamanaşımı kuralları)
// yanıt üretir. Bağlamda olmayan bir konuda emin değilse, kullanıcıyı
// avukata/başvuru formuna yönlendirir — hukuki hata riski almaz.
//
// DONANIM NOTU: Mevcut sunucunuzda GPU yoksa yanıt gecikmeli gelir (10-30sn)
// ama YİNE DE ÜCRETSİZDİR. Donanım (GPU'lu sunucu) eklendiğinde aynı kod
// hiçbir değişiklik gerekmeden çok daha hızlı çalışır ("tam gaz" modu).
//
// ENV:
//   OLLAMA_HOST   — varsayılan http://127.0.0.1:11434
//   OLLAMA_MODEL  — varsayılan qwen2.5:7b (yoksa qwen2.5:3b önerilir — daha hafif)
//   LOCAL_AI_TIMEOUT_MS — varsayılan 25000 (zayıf donanımda modelin cevap süresi)

"use strict";

const { getZMSSLimitsByDate } = require("../data/zmss-limits");
const { SURE_KURALLARI } = require("../data/sureKurallari");
const bedesten = require("./bedesten.service");

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b";
const TIMEOUT_MS = parseInt(process.env.LOCAL_AI_TIMEOUT_MS, 10) || 25000;

// Gerçek Yargıtay/Danıştay emsal kararı (bakanlığın resmi Bedesten kaynağından)
// arar ve bağlama ekler. Ulaşılamazsa (hız limiti/geçici kesinti) sessizce
// atlanır — sahte veri asla üretilmez, sadece o bölüm bağlamdan eksik kalır.
async function fetchEmsalContext(message) {
  try {
    const kararlar = await bedesten.searchEmsalKararlar({ phrase: message, pageSize: 2 });
    if (!kararlar.length) return "";
    const satirlar = kararlar
      .map((k) => `- ${k.birimAdi || "Yargıtay"}, Esas ${k.esasNo || "?"} / Karar ${k.kararNo || "?"} (${k.tarih || "tarih yok"})`)
      .join("\n");
    return `\n\nGERÇEK EMSAL KARARLAR (bedesten.adalet.gov.tr, resmi kaynak — sadece künye, tam metin istenirse ayrıca getirilir):\n${satirlar}`;
  } catch (err) {
    console.log(`[localAI] emsal karar araması atlandı: ${err.message}`);
    return "";
  }
}

// Modelin uydurmaması için verdiğimiz TEK gerçek kaynak seti.
async function buildGroundingContext(message) {
  const zmss = getZMSSLimitsByDate(new Date());
  const sureSatirlari = SURE_KURALLARI.map(
    (s) => `- ${s.etiket} (${s.yasalDayanak}): ${s.sureGun ? s.sureGun + " gün" : "hesaplama gerektirir"}`
  ).join("\n");

  const emsalContext = message ? await fetchEmsalContext(message) : "";

  return (
    `GÜNCEL ZMSS LİMİTLERİ (${zmss.yil}, kaynak: ${zmss.kaynak}):\n` +
    `- Kişi başı bedeni: ${zmss.bedeni_kisi.toLocaleString("tr-TR")} TL\n` +
    `- Kaza başı bedeni: ${zmss.bedeni_kaza.toLocaleString("tr-TR")} TL\n` +
    `- Araç başı maddi: ${zmss.maddi_arac.toLocaleString("tr-TR")} TL\n\n` +
    `SÜRE/ZAMANAŞIMI KURALLARI:\n${sureSatirlari}${emsalContext}`
  );
}

const SYSTEM_PROMPT = `Sen Tedbirge AI Asistanı'sın — Türkiye'de trafik ve iş kazası tazminatı konusunda bilgilendirme yapan bir hukuk-teknolojisi asistanısın.

KESİN KURALLAR:
1) SADECE sana verilen "GERÇEK KAYNAK" bölümündeki bilgileri kullan. Orada olmayan bir kanun maddesi, rakam veya emsal karar UYDURMA.
2) Emin olmadığın veya bağlamda yeri olmayan sorularda dürüstçe söyle: "Bu konuda net bilgi veremem, ücretsiz ön değerlendirme için avukatımızla görüşün: tedbirge.ai/basvuru"
3) Asla kesin hukuki sonuç/vaat verme ("kesinlikle kazanırsınız" gibi) — bu bir ön bilgilendirmedir, nihai karar mahkemeye/avukata aittir.
4) Türkçe, sıcak ama profesyonel bir dille, kısa ve anlaşılır cevap ver.
5) Cevabının sonuna şunu ekle: "(Bu ön değerlendirmedir, nihai değerlendirme için avukat onayı gerekir.)"`;

/**
 * Kural motorunun cevaplayamadığı bir soruyu, yerel açık-model ile
 * SADECE gerçek verilere dayanarak yanıtlamaya çalışır.
 *
 * @param {string} message - kullanıcının mesajı
 * @returns {Promise<{text:string, model:string, latencyMs:number}>}
 * @throws modelin ulaşılamaz/yapılandırılmamış/zaman aşımı olması durumunda
 */
async function reason(message) {
  const context = await buildGroundingContext(message);
  const prompt = `${SYSTEM_PROMPT}\n\nGERÇEK KAYNAK:\n${context}\n\nKULLANICI SORUSU: ${message}\n\nCEVABIN:`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();

  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, prompt, stream: false }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      if (res.status === 404 || /not found|no such model/i.test(errText)) {
        throw new Error(`Model "${MODEL}" bulunamadı. Sunucuda: ollama pull ${MODEL}`);
      }
      throw new Error(`Yerel YZ yanıt vermedi (${res.status}).`);
    }

    const data = await res.json();
    const text = (data?.response || "").trim();
    if (!text) throw new Error("Yerel YZ boş yanıt döndü.");

    return { text, model: MODEL, latencyMs: Date.now() - start };
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(
        `Yerel YZ zaman aşımına uğradı (${TIMEOUT_MS}ms) — donanım yetersiz olabilir, bu beklenen bir durumdur.`
      );
    }
    throw new Error(
      `Yerel YZ motoruna ulaşılamadı (${OLLAMA_HOST}). Ollama kurulu ve çalışıyor mu?`
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Admin panelde durum göstergesi için sağlık kontrolü. */
async function checkHealth() {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
    const data = await res.json();
    const models = (data?.models || []).map((m) => m.name);
    const modelReady = models.some((m) => m === MODEL || m.startsWith(MODEL.split(":")[0]));
    return { ok: true, host: OLLAMA_HOST, model: MODEL, modelReady, availableModels: models };
  } catch (err) {
    return { ok: false, reason: err.message, host: OLLAMA_HOST };
  }
}

module.exports = { reason, checkHealth, buildGroundingContext };
