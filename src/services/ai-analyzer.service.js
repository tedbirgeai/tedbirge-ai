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
const prisma = require("../config/db");

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

/**
 * TUR #132.1 — AI cikti Lead'e merge (M2 erken cikis, Madde 30.90 saha vaadi).
 *
 * Madde 4.6 HIBRIT KORUMA:
 * - Mevcut Lead alanlari avukat tarafindan elle duzenlenmisse DOKUNULMAZ.
 * - Sadece null/bos alanlar AI'dan doldurulur.
 * - Idempotent: ayni belge tekrar tetiklenirse double-update yapmaz (aiMergedAt guard).
 * - leadId olmayan Document'lar (vekaletname admin upload vb.) etkilenmez.
 *
 * @param {string} documentId
 * @param {object} aiResult — analyzeDocument.raw (documentType + extractedData + overallConfidence)
 * @returns {Promise<{merged: boolean, reason?: string, fields?: string[], confidence?: number}>}
 */
async function mergeAiResultToLead(documentId, aiResult) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, leadId: true },
  });

  if (!doc?.leadId) {
    return { merged: false, reason: "no_lead" };
  }

  // IDEMPOTENT GUARD — Lead zaten merge edilmisse atla
  const existing = await prisma.lead.findUnique({
    where: { id: doc.leadId },
    select: {
      aiMergedAt: true, aiMergeConfidence: true,
      accidentDate: true, accidentType: true,
      kazaTuru: true, kazaYeri: true,
      insuranceCompanyId: true, policeNo: true,
      maluliyetOrani: true, hasInjury: true, icdCode: true,
      vefatVar: true, aracDegerKaybi: true,
      faultRate: true, kusurOrani: true,
      injurySeverity: true,
    },
  });

  if (!existing) return { merged: false, reason: "lead_not_found" };
  if (existing.aiMergedAt) {
    return { merged: false, reason: "already_merged", at: existing.aiMergedAt };
  }

  const extracted = aiResult?.extractedData || {};
  const overallConfidence = Number(aiResult?.overallConfidence) || 0;

  // Madde 30.91 — dusuk confidence Lead'e yazma (sadece Document'ta sakla)
  if (overallConfidence < 0.85) {
    return { merged: false, reason: "low_confidence", confidence: overallConfidence };
  }

  // Sigorta sirketi adi → InsuranceCompany.id resolve (Madde 30.92)
  let insuranceCompanyId = null;
  if (extracted.sigortaSirketi && Number(extracted.sigortaSirketiConfidence) >= 0.7) {
    try {
      const matched = await prisma.insuranceCompany.findFirst({
        where: {
          OR: [
            { name: { equals: extracted.sigortaSirketi, mode: "insensitive" } },
            { shortName: { equals: extracted.sigortaSirketi, mode: "insensitive" } },
            { name: { contains: extracted.sigortaSirketi, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      });
      if (matched) insuranceCompanyId = matched.id;
    } catch (err) {
      console.warn(`[ai-merge] InsuranceCompany resolve fail: ${err.message}`);
    }
  }

  const updateData = {};

  // Mevcut accidentDate null + AI guven yeterli → doldur (Madde 4.6, kazaTarihi duplicate ekleme)
  if (!existing.accidentDate && extracted.kazaTarihi && Number(extracted.kazaTarihiConfidence) >= 0.7) {
    const d = new Date(extracted.kazaTarihi);
    if (!isNaN(d.getTime())) updateData.accidentDate = d;
  }

  // Mevcut accidentType (String) korunur — yeni kazaTuru (enum) ek typed alan
  if (!existing.kazaTuru && extracted.kazaTuru && ["TRAFFIC", "WORK", "OTHER"].includes(extracted.kazaTuru) && Number(extracted.kazaTuruConfidence) >= 0.7) {
    updateData.kazaTuru = extracted.kazaTuru;
  }

  if (!existing.kazaYeri && extracted.kazaYeri) {
    updateData.kazaYeri = String(extracted.kazaYeri).slice(0, 200);
  }

  if (!existing.insuranceCompanyId && insuranceCompanyId) {
    updateData.insuranceCompanyId = insuranceCompanyId;
  }

  if (!existing.policeNo && extracted.policeNo && Number(extracted.policeNoConfidence) >= 0.7) {
    updateData.policeNo = String(extracted.policeNo).slice(0, 80);
  }

  // maluliyetOrani mevcut alan (Madde 4.6) — null ise doldur
  if (existing.maluliyetOrani == null && extracted.maluliyetOrani != null && Number(extracted.maluliyetOraniConfidence) >= 0.7) {
    const v = Number(extracted.maluliyetOrani);
    if (Number.isFinite(v) && v >= 0 && v <= 100) updateData.maluliyetOrani = v;
  }

  if (extracted.yaralanmaVar === true || extracted.yaralanmaVar === false) {
    updateData.hasInjury = extracted.yaralanmaVar;
  }

  if (!existing.icdCode && extracted.icdCode && Number(extracted.icdCodeConfidence) >= 0.7) {
    updateData.icdCode = String(extracted.icdCode).slice(0, 20);
  }

  if (extracted.vefatVar === true || extracted.vefatVar === false) {
    updateData.vefatVar = extracted.vefatVar;
  }

  if (existing.aracDegerKaybi == null && extracted.aracDegerKaybi != null) {
    const v = Number(extracted.aracDegerKaybi);
    if (Number.isFinite(v) && v >= 0) updateData.aracDegerKaybi = v;
  }

  // Kusur orani — mevcut faultRate ve kusurOrani (Madde 4.6 duplicate korundu, TUR #133 DEFER)
  // Her ikisi de null ise kanonik kusurOrani (Turkce — TUR #115 emsali) doldur
  if (existing.kusurOrani == null && existing.faultRate == null
      && extracted.kusurOrani != null && Number(extracted.kusurOraniConfidence) >= 0.7) {
    const v = Number(extracted.kusurOrani);
    if (Number.isFinite(v) && v >= 0 && v <= 100) updateData.kusurOrani = v;
  }

  // AI merge metadata her zaman set edilir (idempotent guard icin)
  updateData.aiMergedAt = new Date();
  updateData.aiMergeConfidence = overallConfidence;

  const dataFields = Object.keys(updateData).filter(k => !k.startsWith("aiMerge"));

  if (dataFields.length === 0) {
    // Sadece metadata yaz — guard tekrar tetiklemeyi durdurur
    await prisma.lead.update({
      where: { id: doc.leadId },
      data: { aiMergedAt: updateData.aiMergedAt, aiMergeConfidence: updateData.aiMergeConfidence },
    });
    return { merged: false, reason: "no_new_data", confidence: overallConfidence };
  }

  await prisma.lead.update({
    where: { id: doc.leadId },
    data: updateData,
  });

  // KVKK m.10 audit (Madde 30.75)
  await prisma.activityLog.create({
    data: {
      leadId: doc.leadId,
      action: "LEAD_AI_MERGE",
      detail: `documentId:${documentId} fields:${dataFields.join(",")} confidence:${overallConfidence.toFixed(2)}`,
    },
  }).catch(() => {});

  // Tahmin yeniden hesapla (Madde 30.90 saha vaadi)
  try {
    const { recalculateEstimation } = require("./lead-estimation.service");
    await recalculateEstimation(doc.leadId);
  } catch (err) {
    console.warn(`[ai-merge] recalculateEstimation fail: ${err.message}`);
  }

  return { merged: true, fields: dataFields, confidence: overallConfidence };
}

module.exports = {
  analyzeDocument,
  mergeAiResultToLead,
  CURRENT_MODEL,
};
