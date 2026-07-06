// TUR #132.4 — Tedbirge AI Asistani (LexScan AI rename)
// Madde 24.14 R1 KALIN — AI Bagimsizlik (Tedbirge mulkiyeti, $0, KVKK lokal)
// Madde 4.6 KALIN — Mevcut ChatSession + ChatMessage tablolari reuse (KIRMIZI 5 dürüst SKIP)
// Madde 30.75 — KVKK m.10 audit
//
// Intent engine + FAQ JSON dosyasi ile rule-based yanit uretir.
// Anthropic SDK kullanmaz. Tum konusmalar ChatSession + ChatMessage tablolarinda saklanir
// (intent + confidence metadataJson alanina yazilir).

"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const prisma = require("../config/db");
const intentEngine = require("./intent-engine.service");
const localAI = require("./localAI.service");
const bedesten = require("./bedesten.service");

// Kullanıcı a\u00e7\u0131k\u00e7a emsal karar/Yarg\u0131tay iste\u011fi belirtti mi? Kural motoru
// ba\u015fka bir intent'e (\u00f6r. "sigorta itiraz") y\u00fcksek g\u00fcvenle e\u015fle\u015fse bile,
// bu durumda ger\u00e7ek karar arama sonucunu CEVABA EKLE\u0130YORUZ \u2014 aksi halde
// kullan\u0131c\u0131n\u0131n asl\u0131nda sordu\u011fu \u015fey (\"emsal karar var m\u0131?\") hi\u00e7 yan\u0131tlanmadan
// genel bir prosed\u00fcr metniyle ge\u00e7i\u015ftirilmi\u015f olurdu.
const EMSAL_ISTEK_DESENI = /emsal|yargıtay karar|içtihat|yargı kararı/i;

async function emsalEkiUret(text) {
  try {
    const kararlar = await bedesten.searchEmsalKararlar({ phrase: text, pageSize: 2 });
    if (!kararlar.length) {
      return "\n\n📌 Sorduğunuz konuyla ilgili şu an güncel bir emsal karar bulunamadı. Belgelerinizi yüklerseniz durumunuzu daha net değerlendirebiliriz.";
    }
    const satirlar = kararlar
      .map((k) => `• ${k.birimAdi || "Yargıtay"}, Esas ${k.esasNo || "?"} / Karar ${k.kararNo || "?"} (${k.tarih || "tarih yok"})`)
      .join("\n");
    return `\n\n📌 İlgili gerçek emsal kararlar (T.C. Adalet Bakanlığı resmi kaynağı):\n${satirlar}`;
  } catch (err) {
    console.log(`[chatbot] emsal eki atlandı: ${err.message}`);
    return "";
  }
}

const FAQ_PATH = path.resolve(__dirname, "../../tedbirge-os/data/faq-tr-v1.json");
let faqs = [];

function loadFAQs() {
  try {
    const data = JSON.parse(fs.readFileSync(FAQ_PATH, "utf-8"));
    faqs = Array.isArray(data.faqs) ? data.faqs : [];
    console.log(`[chatbot] FAQ yuklendi: ${faqs.length} kayit (v1-2026)`);
  } catch (err) {
    console.error("[chatbot] FAQ yukleme hatasi:", err.message);
    faqs = [];
  }
}
loadFAQs();

function hashIP(ip) {
  return crypto
    .createHash("sha256")
    .update(String(ip || "") + "tedbirge-salt")
    .digest("hex")
    .slice(0, 16);
}

function findResponse(intent) {
  const matches = faqs.filter((f) => f.intent === intent);
  if (matches.length === 0) {
    const fb = faqs.find((f) => f.intent === "FALLBACK");
    return (
      fb?.response ||
      "Size yardimci olamadim, lutfen basvuru formu ile devam edin: https://tedbirge.ai/basvuru"
    );
  }
  return matches[Math.floor(Math.random() * matches.length)].response;
}

/**
 * Kullanicinin mesajini isler, intent tespit eder, FAQ yanitini uretir.
 *
 * Mevcut ChatSession + ChatMessage tablolarini reuse eder (Madde 4.6 KALIN):
 * - sessionId (UUID-like, frontend tutar)
 * - leadId (varsa)
 * - sender: "user" veya "assistant"
 * - metadataJson: JSON string ({ intent, confidence })
 *
 * @param {object} input
 * @param {string} input.message
 * @param {string} [input.sessionKey]
 * @param {string} [input.userId]
 * @param {string} [input.leadId]
 * @param {string} [input.ipHash]
 * @returns {Promise<{text: string, intent: string, confidence: number, sessionKey: string}>}
 */
async function processMessage({ message, sessionKey, userId, leadId, ipHash }) {
  const text = String(message || "").trim();
  if (!text) {
    return {
      text: "Mesajiniz bos. Lutfen bir soru yaziniz.",
      intent: "FALLBACK",
      confidence: 0,
      sessionKey: sessionKey || null,
    };
  }

  // Intent tespit (Tedbirge rule-based engine, $0)
  const { intent, confidence } = intentEngine.detectIntent(text);
  let responseText = findResponse(intent);
  let engineUsed = "tedbirge-intent-engine-v1";

  // Kural motoru anlayamadıysa (FALLBACK), yerel açık-model muhakeme
  // katmanına devret — SADECE gerçek verilerle (ZMSS limitleri, süre
  // kuralları) yanıt üretir, uydurmaz. Yapılandırılmamışsa veya donanım
  // yetersizse (zaman aşımı) sessizce eski davranışa (FAQ fallback metni)
  // döner — kullanıcı asla hata görmez, "0 hata" ilkesi korunur.
  if (intent === "FALLBACK") {
    try {
      const local = await localAI.reason(text);
      responseText = local.text;
      engineUsed = `tedbirge-local-ai (${local.model}, ${local.latencyMs}ms)`;
    } catch (err) {
      console.log(`[chatbot] yerel AI devreye girmedi, FAQ fallback kullanildi: ${err.message}`);
    }
  } else if (EMSAL_ISTEK_DESENI.test(text)) {
    // Kural motoru ba\u015fka bir intent'e e\u015fle\u015fti ama kullan\u0131c\u0131 a\u00e7\u0131k\u00e7a
    // emsal/Yarg\u0131tay karar\u0131 istedi \u2014 asl\u0131nda sorulan\u0131 yan\u0131ts\u0131z b\u0131rakmamak
    // i\u00e7in ger\u00e7ek karar sonucunu cevaba ekliyoruz.
    responseText += await emsalEkiUret(text);
    engineUsed += "+bedesten-emsal";
  }

  // Audit + konusma history (mevcut ChatSession + ChatMessage tablolari)
  let session = null;
  try {
    if (sessionKey) {
      session = await prisma.chatSession.findUnique({ where: { sessionKey } });
    }
    if (!session) {
      const newKey = sessionKey || crypto.randomBytes(16).toString("hex");
      session = await prisma.chatSession.create({
        data: {
          sessionKey: newKey,
          userId: userId || null,
          leadId: leadId || null,
        },
      });
    }

    // User mesaji
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        leadId: leadId || null,
        sender: "user",
        message: text.slice(0, 1000),
        metadataJson: JSON.stringify({ ipHash: ipHash || null }),
      },
    });

    // Assistant yaniti
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        leadId: leadId || null,
        sender: "assistant",
        message: responseText.slice(0, 2000),
        metadataJson: JSON.stringify({
          intent,
          confidence,
          engine: engineUsed,
        }),
      },
    });
  } catch (err) {
    console.error("[chatbot] log hatasi:", err.message);
  }

  // FALLBACK audit (yerel AI de cevap veremediyse, admin sonradan FAQ ekler)
  if (intent === "FALLBACK" && engineUsed === "tedbirge-intent-engine-v1") {
    try {
      await prisma.activityLog.create({
        data: {
          action: "CHATBOT_FALLBACK",
          detail: `sessionId:${session?.id || "?"} message:${text.slice(0, 200)}`,
        },
      });
    } catch (_) {}
  }

  return {
    text: responseText,
    intent,
    confidence,
    sessionKey: session?.sessionKey || null,
  };
}

module.exports = { processMessage, hashIP, loadFAQs };
