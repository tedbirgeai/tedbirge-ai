// TUR #132 M1 — AI Cekirdek (TAC) Belge Ayristirici
// Madde 30.90 (Saha Vaadi) + 30.91 (KVKK m.6 Ozel Nitelikli Veri) + 30.78 (Framework Major Version)
//
// Mevcut `ai.service.js` korunur (Madde 4.6 — petition + qualify flow).
// Bu servis OZGUNDUR: yuklenen belgeden YAPISAL JSON cikartir (14 alan).
//   - documentType (epikriz / police / kaza-tutanagi / sgk-raporu / ...)
//   - extractedData (kazaTarihi / kazaTuru / sigortaSirketi / policeNo / icdCode /
//                    maluliyetOrani / kusurOrani / vefatVar / aracDegerKaybi / yaralanmaVar / kazaYeri)
//   - confidence skorlari (alan basina)
//   - overallConfidence (toplam 0.0-1.0)
//
// KVKK m.6 disiplini (Madde 30.91):
//   - PII hash'lenir (user_id metadata)
//   - Anthropic Standard tier (Zero Data Retention orta vadeli teknik borc, Enterprise tier TUR #150+)
//   - Manuel review tetigi: saglik verisi (epikriz / SGK rapor / maluliyet alani dolu) VE/VEYA confidence <0.85

"use strict";

const Anthropic = require("@anthropic-ai/sdk");
const crypto = require("crypto");

// Madde 30.78 Framework Major Version Disiplini — guncel model constant.
// Yeni model cikinca burayi guncelle, otomatik prod'a yansir.
const CURRENT_MODEL = "claude-opus-4-7";

const SYSTEM_PROMPT = `Sen bir Turk hukuk sigorta belge analiz uzmanisin. Tedbirge.ai LegalTech sisteminin AI Cekirdek (TAC) modulusun.

GOREVIN: Yuklenen belge metninden asagidaki bilgileri JSON formatinda cikar.

ZORUNLU KURALLAR:
1. UYDURMA YASAK — bulamadigin alanlara null yaz
2. Her alan icin confidence (0.0-1.0) belirt
3. Turkce tarihler YYYY-MM-DD formatina cevir
4. Para birimi sadece TL — baska birim varsa null
5. ICD-10 kodu cikartirken kesin emin olmadikca null
6. Maluliyet/kusur oranlari yuzde olarak (0-100) — emin degilsen null
7. Sigorta sirketi adini TAM yaz (ornek: "Anadolu Sigorta", "Turkiye Sigorta")

CIKTI SEMASI (kesin uy):
{
  "documentType": "epikriz" | "police" | "kaza-tutanagi" | "sgk-raporu" | "vekaletname" | "kimlik" | "tedavi-faturasi" | "diger",
  "documentTypeConfidence": 0.0-1.0,
  "extractedData": {
    "kazaTarihi": "YYYY-MM-DD" | null,
    "kazaTarihiConfidence": 0.0-1.0,
    "kazaTuru": "TRAFFIC" | "WORK" | "OTHER" | null,
    "kazaTuruConfidence": 0.0-1.0,
    "kazaYeri": string | null,
    "sigortaSirketi": string | null,
    "sigortaSirketiConfidence": 0.0-1.0,
    "policeNo": string | null,
    "policeNoConfidence": 0.0-1.0,
    "yaralanmaVar": boolean,
    "icdCode": string | null,
    "icdCodeConfidence": 0.0-1.0,
    "maluliyetOrani": 0.0-100.0 | null,
    "maluliyetOraniConfidence": 0.0-1.0,
    "kusurOrani": 0.0-100.0 | null,
    "kusurOraniConfidence": 0.0-1.0,
    "vefatVar": boolean,
    "aracDegerKaybi": number | null
  },
  "warnings": [string],
  "overallConfidence": 0.0-1.0
}

YASAK:
- Yargitay ictihat referansi uydurmak (sen sadece veri cikarirsin)
- Tibbi yorum yapmak (sadece kod oku, yorum YOK)
- Hukuki degerlendirme yapmak (sadece veri cikarimi)
- Belge disi kaynaktan veri eklemek
- JSON disinda ek metin (sadece JSON don)`;

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Madde 24.14 + 30.91 — env eksikse net hata, ADMIN_FEED bildirim ust seviyede.
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }
  // Anthropic SDK CJS uyumu (mevcut analyzer.service.js + ai.service.js pattern)
  // ATOM 16 — Madde 30.91 dokumante: Standard tier kullanim, Enterprise ZDR TUR #150+ teknik borc.
  return new Anthropic.default({
    apiKey,
    defaultHeaders: {
      // Backend-only kullanim (browser access yasak — Madde 30.91 PII koruma)
      "anthropic-dangerous-direct-browser-access": "false",
    },
  });
}

function hashUserId(userId) {
  if (!userId) return null;
  return crypto.createHash("sha256").update(String(userId)).digest("hex").slice(0, 16);
}

/**
 * Belge metnini analiz edip yapisal JSON cikartir.
 * @param {string} extractedText - OCR/Vision ile cikarilmis ham metin
 * @param {object} ctx - { userId, leadId, fileName, mimeType }
 * @returns {Promise<{ raw: object, modelVersion: string, promptTokens: number, completionTokens: number }>}
 */
async function analyzeDocument(extractedText, ctx = {}) {
  const text = String(extractedText || "").trim();
  if (text.length < 20) {
    throw new Error("Analiz icin yeterli metin yok (min 20 karakter)");
  }

  const client = getClient();

  const userPrompt = [
    `Belge adi: ${ctx.fileName || "bilinmiyor"}`,
    `MIME tipi: ${ctx.mimeType || "bilinmiyor"}`,
    "",
    "Belge metni (ilk 8000 karakter):",
    text.slice(0, 8000),
    "",
    "Yukaridaki belgeyi analiz et ve sadece JSON cikti ver. Bulamadigin alanlara null yaz, UYDURMA.",
  ].join("\n");

  const message = await client.messages.create({
    model: CURRENT_MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
    metadata: ctx.userId ? { user_id: hashUserId(ctx.userId) } : undefined,
  });

  const rawText = (message.content?.[0]?.text || "").trim();
  let parsed;
  try {
    // ```json kod blogu varsa temizle
    const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*$/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON blok bulunamadi");
    parsed = JSON.parse(jsonMatch[0]);
  } catch (err) {
    throw new Error(
      `AI yaniti JSON parse basarisiz: ${err.message}\nIlk 200 char: ${rawText.slice(0, 200)}`
    );
  }

  return {
    raw: parsed,
    modelVersion: CURRENT_MODEL,
    promptTokens: message.usage?.input_tokens || 0,
    completionTokens: message.usage?.output_tokens || 0,
  };
}

module.exports = {
  analyzeDocument,
  CURRENT_MODEL,
};
