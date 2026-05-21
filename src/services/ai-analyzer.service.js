// TUR #132 M1 — AI Cekirdek (TAC) Belge Ayristirici
// Madde 30.90 (Saha Vaadi) + 30.91 (KVKK m.6 Ozel Nitelikli Veri) + 30.78 (Framework Major Version)
//
// TUR #132.4 (21 May 2026) — Madde 24.14 R1 KALIN: Anthropic SDK kaldirildi.
// pattern-engine.service.js (Tedbirge mulkiyeti, rule-based, $0, KVKK lokal) kullanilir.
// mergeAiResultToLead aynen korunur (Madde 4.6 KALIN).
//
// Mevcut `ai.service.js` korunur (Madde 4.6 — petition + qualify flow, hala Anthropic kullanir).
// Bu servis OZGUNDUR: yuklenen belgeden YAPISAL JSON cikartir (14 alan).
//   - documentType (epikriz / police / kaza-tutanagi / sgk-raporu / ...)
//   - extractedData (kazaTarihi / kazaTuru / sigortaSirketi / policeNo / icdCode /
//                    maluliyetOrani / kusurOrani / vefatVar / aracDegerKaybi / yaralanmaVar / kazaYeri)
//   - confidence skorlari (alan basina)
//   - overallConfidence (toplam 0.0-1.0)
//
// KVKK m.6 disiplini (Madde 30.91):
//   - PII Tedbirge'den cikmaz (yurt disi transfer 0 — KALDIRILDI)
//   - Pattern engine lokal calisir, AI bagimsiz
//   - Manuel review tetigi: saglik verisi VE/VEYA confidence <0.85

"use strict";

const crypto = require("crypto");
const prisma = require("../config/db");
const patternEngine = require("./pattern-engine.service");

// TUR #132.4 — Tedbirge pattern engine v1 (Anthropic SDK kaldirildi)
const CURRENT_MODEL = "tedbirge-pattern-engine-v1";

function hashUserId(userId) {
  if (!userId) return null;
  return crypto.createHash("sha256").update(String(userId)).digest("hex").slice(0, 16);
}

/**
 * Belge metnini analiz edip yapisal JSON cikartir.
 *
 * TUR #132.4 — Pattern-engine.service.js (rule-based, lokal, $0)
 * Anthropic SDK kaldirildi (Madde 24.14 R1 KALIN). Cikti semasi mevcut yapiyla UYUMLU
 * (mergeAiResultToLead aynen calismaya devam eder — Madde 4.6 KALIN).
 *
 * @param {string} extractedText - OCR/Vision ile cikarilmis ham metin
 * @param {object} ctx - { userId, leadId, fileName, mimeType }
 * @returns {Promise<{ raw: object, modelVersion: string, promptTokens: number, completionTokens: number }>}
 */
async function analyzeDocument(extractedText, ctx = {}) {
  const text = String(extractedText || "").trim();
  if (text.length < 20) {
    throw new Error("Analiz icin yeterli metin yok (min 20 karakter)");
  }

  // Tedbirge pattern engine — lokal, ucretsiz, KVKK-uyumlu
  const result = await patternEngine.analyzeText(text);

  // PII metadata audit (Madde 30.91 — bilgi, tahmin disi)
  if (ctx.userId) {
    result.userIdHash = hashUserId(ctx.userId);
  }

  return result;
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
