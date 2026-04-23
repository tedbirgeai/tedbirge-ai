const prisma = require("../config/db");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { extractTextWithOcr, extractTextWithVision } = require("./ocr.service");
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
      // Claude Vision direkt PDF okuma — Render'da binary yok, pdf-parse de kullanilmiyor
      if (!file.buffer) {
        throw new Error("PDF analiz icin buffer gerekli");
      }
      const visionText = await extractTextWithVision(file.buffer, "application/pdf");
      return { text: visionText, extractionMethod: "claude-vision-pdf" };
    }

    // Gorsel (JPG/PNG/WEBP) — direkt Claude Vision
    if (!file.buffer) {
      throw new Error("Gorsel analiz icin buffer gerekli");
    }
    const visionText = await extractTextWithVision(file.buffer, mimeType);
    return { text: visionText, extractionMethod: "claude-vision-image" };
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

/**
 * Direct-to-Supabase akışı için yeni giriş kapısı.
 * Document ID üzerinden çalışır — dosyayı Supabase'den indirir,
 * mevcut analyzeUploadedDocument pipeline'ına yönlendirir.
 *
 * Bu fonksiyon completeUpload controller'ında fire-and-forget olarak çağrılır.
 */
async function analyzeDocumentById(documentId) {
  const prisma = require("../config/db");
  const { downloadFile } = require("./storage.service");

  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) {
    throw new Error(`Document bulunamadi: ${documentId}`);
  }

  const lead = await prisma.lead.findUnique({ where: { id: doc.leadId } });
  if (!lead) {
    throw new Error(`Lead bulunamadi: ${doc.leadId}`);
  }

  // Supabase'den buffer indir
  const { buffer, contentType } = await downloadFile(doc.path);

  // file objesi simüle et — mevcut bridge pipeline'ı ile uyumlu
  const fileProxy = {
    buffer,
    originalname: doc.originalName,
    mimetype: contentType || doc.mimeType,
    size: doc.sizeBytes,
  };

  return await analyzeUploadedDocument({ lead, file: fileProxy });
}

module.exports = { resolveDocumentText, analyzeUploadedDocument, analyzeDocumentById };






