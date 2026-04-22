const fs = require("fs");
const path = require("path");
const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");
// saveAiSummary import bypass edildi; lead update dogrudan prisma ile yapiliyor
const { analyzeUploadedDocument } = require("./uploadAnalysis.bridge");

function inferDocumentType(originalName) {
  const lower = String(originalName || "").toLowerCase();

  if (lower.includes("tutanak")) return "ACCIDENT_REPORT";
  if (lower.includes("epikriz") || lower.includes("rapor") || lower.includes("hastane")) return "HOSPITAL_REPORT";
  if (lower.includes("kimlik")) return "IDENTITY";
  if (lower.includes("sigorta") || lower.includes("police")) return "INSURANCE";
  return "OTHER";
}

async function uploadDocument({ leadId, file, uploadedById = null }) {
  if (!file) {
    throw new ApiError(400, "Dosya yüklenemedi");
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    throw new ApiError(404, "Lead bulunamadı");
  }

  const document = await prisma.document.create({
    data: {
      leadId,
      uploadedById,
      type: inferDocumentType(file.originalname),
      originalName: file.originalname,
      storedName: path.basename(file.path),
      mimeType: file.mimetype,
      sizeBytes: file.size,
      path: file.path,
      status: "UPLOADED"
    }
  });

  let parsedText = "";
  let aiAnalysis = null;

  try {
    const result = await analyzeUploadedDocument({
      lead,
      file
    });

    parsedText = typeof result.parsedText === "string" ? result.parsedText : "";

    if (!parsedText.trim()) {
      throw new ApiError(
        422,
        "Belgeden anlamlı metin çıkarılamadı. OCR sonucu boş veya sadece whitespace döndü."
      );
    }

    aiAnalysis = JSON.stringify({
      ...result.analysis,
      extractionMethod: result.extractionMethod
    });

    await prisma.document.update({
      where: { id: document.id },
      data: {
        parsedText,
        aiAnalysis,
        extractedJson: aiAnalysis,
        status: "ANALYZED"
      }
    });

    const safeSummary =
      (result.analysis?.summary || result.analysis?.aiSummary || "Analiz tamamlandi.") +
      "\nEksik Evraklar: " +
      ((Array.isArray(result.analysis?.missingDocuments) ? result.analysis.missingDocuments : []).join(", ") || "Yok");

    const safeQualificationScore =
      Number.isInteger(result.analysis?.qualificationScore)
        ? result.analysis.qualificationScore
        : (Number.isInteger(result.analysis?.score) ? result.analysis.score : 0);

    await prisma.lead.update({
        where: { id: leadId },
        data: {
          aiSummary: safeSummary,
          qualificationScore: safeQualificationScore
        }
      });

    await prisma.activityLog.create({
      data: {
        leadId,
        action: "DOCUMENT_ANALYZED",
        detail: file.originalname + " analiz edildi (" + result.extractionMethod + ")"
      }
    });
  } catch (error) {
    console.error("[UPLOAD_DOCUMENT_ERROR]", error);
    await prisma.document.update({
      where: { id: document.id },
      data: {
        parsedText,
        status: "FAILED",
        aiAnalysis: JSON.stringify({ error: error.message || "Analiz hatası", failedAt: new Date().toISOString() })
      }
    });
    // throw error; KALDIRILDI — belge storage'da, DB'de kaldı, HTTP 201 dönsün
  }

  return prisma.document.findUnique({ where: { id: document.id } });
}

module.exports = { uploadDocument };





