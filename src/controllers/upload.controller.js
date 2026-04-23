const asyncHandler = require("../utils/asyncHandler");
const { uploadDocument } = require("../services/upload.service");
const prisma = require("../config/db");
const { analyzeDocumentById } = require("../services/uploadAnalysis.bridge");

exports.uploadLeadDocument = asyncHandler(async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({ success: false, error: "Dosya gönderilmedi" });
  }

  const uploaded = [];
  const failed = [];

  for (const file of files) {
    try {
      const document = await uploadDocument({
        leadId: req.params.leadId,
        file,
        uploadedById: req.user?.id || null,
      });
      uploaded.push(document);
    } catch (fileErr) {
      console.error(`[uploadLeadDocument] ${file.originalname} hata:`, fileErr.message);
      failed.push({
        filename: file.originalname,
        error: fileErr.message || "İşleme hatası",
      });
    }
  }

  return res.status(201).json({
    success: true,
    uploaded,
    failed,
    summary: `${uploaded.length}/${files.length} dosya yüklendi`,
  });
});

async function requestUploadUrl(req, res) {
  try {
    const { leadId } = req.params;
    const { fileName, fileSize, mimeType } = req.body;
    if (!fileName || !fileSize || !mimeType)
      return res.status(400).json({ error: "Eksik alan" });
    if (fileSize > 50 * 1024 * 1024)
      return res.status(413).json({ error: "50 MB ustu kabul edilmiyor" });
    const ALLOWED = [
      "application/pdf",
      "image/jpeg", "image/png", "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    if (!ALLOWED.includes(mimeType))
      return res.status(415).json({ error: "Desteklenmeyen tip" });

    const prisma = require("../config/db");
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return res.status(404).json({ error: "Lead bulunamadi" });

    const { assertLeadAccess } = require("../utils/leadAccess");
    await assertLeadAccess(req.user, lead);

    const { createSignedUploadUrl } = require("../services/storage.service");
    const result = await createSignedUploadUrl(leadId, fileName);
    return res.json(result);
  } catch (err) {
    console.error("[requestUploadUrl]", err.message);
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function completeUpload(req, res) {
  try {
    const { leadId } = req.params;
    const { path: storagePath, fileName, fileSize, mimeType } = req.body;
    if (!storagePath || !fileName)
      return res.status(400).json({ error: "Eksik alan" });

    const prisma = require("../config/db");
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return res.status(404).json({ error: "Lead bulunamadi" });

    const { assertLeadAccess } = require("../utils/leadAccess");
    await assertLeadAccess(req.user, lead);

    const { verifyUpload } = require("../services/storage.service");
    const verified = await verifyUpload(storagePath);

    const storedName = storagePath.substring(storagePath.lastIndexOf("/") + 1);

    const document = await prisma.document.create({
      data: {
        leadId,
        uploadedById: req.user.id,
        originalName: fileName,
        storedName,
        path: storagePath,
        sizeBytes: verified.size || fileSize,
        mimeType: verified.mimeType || mimeType,
        status: "UPLOADED",
      },
    });

    // AI Analyzer fire-and-forget — kullanıcı yanıtı beklemez, analiz arka planda çalışır
    setImmediate(async () => {
      try {
        const result = await analyzeDocumentById(document.id);
        await prisma.document.update({
          where: { id: document.id },
          data: {
            status: "ANALYZED",
            aiAnalysis: JSON.stringify(result.analysis || {}),
          },
        });
        console.log(`[AI Analyzer] ${document.id} — ANALYZED (${document.originalName})`);
      } catch (err) {
        console.error(`[AI Analyzer] ${document.id} hatasi:`, err.message);
        try {
          await prisma.document.update({
            where: { id: document.id },
            data: {
              status: "FAILED",
              aiAnalysis: JSON.stringify({
                error: err.message,
                failedAt: new Date().toISOString(),
              }),
            },
          });
        } catch (updateErr) {
          console.error(`[AI Analyzer] status update de basarisiz: ${updateErr.message}`);
        }
      }
    });

    return res.status(201).json({ document });
  } catch (err) {
    console.error("[completeUpload]", err.message);
    return res.status(err.status || 500).json({ error: err.message });
  }
}

exports.requestUploadUrl = requestUploadUrl;
exports.completeUpload = completeUpload;
