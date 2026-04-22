const prisma = require("../config/db");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { extractTextWithOcr } = require("./ocr.service");
const { analyzeExtractedText } = require("./analyzer.service");
async function saveAiSummary(leadId, analysisResult, parsedText) {
  const result = analysisResult || {};

  const aiSummary =
    result.aiSummary ||
    result.summary ||
    "Analiz tamamlanamadi, manuel kontrol onerilir.";

  const qualificationScore =
    typeof result.qualificationScore === "number"
      ? result.qualificationScore
      : (typeof result.score === "number" ? result.score : null);

  const updateData = {
    aiSummary,
    qualificationScore
  };

  if (parsedText !== undefined) {
    updateData.parsedText = parsedText;
  }

  return prisma.lead.update({
    where: { id: leadId },
    data: updateData
  });
}

function hasMeaningfulText(value) {
  return String(value || "").replace(/\s+/g, "").length > 20;
}

function unwrapOcrResult(res) {
  return typeof res === "string"
    ? res
    : (res?.parsedText || res?.text || "");
}

async function resolveDocumentText(file) {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const mimeType = (file.mimetype || "").toLowerCase();

  // Supabase/memoryStorage modunda file.buffer var ama file.path lokal disk'te yok.
  // buffer'ı geçici diske yaz; OCR/readFileSync için localPath kullan.
  let localPath = file.path;
  let tempCreated = false;

  if (file.buffer && (!localPath || !fs.existsSync(localPath))) {
    const tempDir = path.join(os.tmpdir(), "tedbirge-uploads");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const tempName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext || ".bin"}`;
    localPath = path.join(tempDir, tempName);
    fs.writeFileSync(localPath, file.buffer);
    tempCreated = true;
  }

  const workFile = { ...file, path: localPath };

  try {
    if (mimeType === "text/plain" || ext === ".txt") {
      const text = fs.readFileSync(localPath, "utf8");
      return { text, extractionMethod: "text-file" };
    }

    if (mimeType === "application/pdf" || ext === ".pdf") {
      const parsed = await extractTextWithOcr(localPath);
      const parsedText = parsed?.text || "";

      if (hasMeaningfulText(parsedText)) {
        return { text: parsedText, extractionMethod: "pdf-parse" };
      }

      const ocrResult = await extractTextWithOcr(workFile);
      const ocrText = unwrapOcrResult(ocrResult);
      return { text: ocrText, extractionMethod: "ocr-fallback-multipage-pdf" };
    }

    const ocrResult = await extractTextWithOcr(workFile);
    const ocrText = unwrapOcrResult(ocrResult);
    return { text: ocrText, extractionMethod: "ocr-image" };
  } finally {
    if (tempCreated && fs.existsSync(localPath)) {
      try { fs.unlinkSync(localPath); } catch (_) {}
    }
  }
}

async function analyzeUploadedDocument({ lead, file }) {
  const { text, extractionMethod } = await resolveDocumentText(file);

  let analysis;
try {
  analysis = await analyzeExtractedText({
    lead,
    text,
    sourceType: extractionMethod
  });
} catch (analysisError) {
  console.error("[ANALYSIS_SOFT_FAIL_GUARD]", analysisError);
  analysis = {
    aiSummary: "Analiz gecici olarak tamamlanamadi. OCR metni kaydedildi; manuel kontrol onerilir.",
    qualificationScore: null,
    qualificationReason: "AI analiz hatasi nedeniyle fallback kullanildi",
    summary: "Analiz gecici olarak tamamlanamadi. OCR metni kaydedildi; manuel kontrol onerilir.",
    score: null,
    raw: null,
    metadata: {
      softFailed: true
    }
  };
}

  return {
    parsedText: text,
    extractionMethod,
    analysis
  };
}

module.exports = {
  resolveDocumentText,
  analyzeUploadedDocument
};






