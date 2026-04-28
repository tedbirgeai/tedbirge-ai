/**
 * ═══════════════════════════════════════════════════════════════
 *  MİMAR UYARISI — DIRECT-TO-SUPABASE MİMARİ
 * ═══════════════════════════════════════════════════════════════
 *
 * Bu controller Supabase Storage signed URL redirect modeli kullanır.
 * Dosya Render RAM'inden GEÇMEZ — doğrudan Supabase'den kullanıcıya akar.
 *
 * YASAKLANANLAR:
 *   - fs / path / mime-types import etmek
 *   - fs.createReadStream, fs.existsSync kullanmak
 *   - res.download() veya res.sendFile() kullanmak
 *   - Dosya buffer'ını res.send() ile döndürmek
 *
 * ZORUNLULAR:
 *   - doc.path → createSignedDownloadUrl() → res.redirect() akışı
 *   - assertLeadAccess() ile yetki kontrolü
 *
 * Bu mimari 27 Nisan 2026'da kuruldu (commit 44832b9).
 * Değişiklik için: tedbirge-os/docs/OTURUM_24_04_2026_HANDOFF.md Madde 15
 *
 * ═══════════════════════════════════════════════════════════════
 */
const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/db");
const { assertLeadAccess } = require("../utils/leadAccess");
const { createSignedDownloadUrl } = require("../services/storage.service");

// ─── SOFT DELETE ─────────────────────────────────────────────────────────────
exports.softDeleteDocument = asyncHandler(async (req, res) => {
  const { id: leadId, documentId } = req.params;

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, leadId: true, deletedAt: true, originalName: true }
  });

  if (!doc) return res.status(404).json({ success: false, message: "Belge bulunamadi." });
  if (doc.leadId !== leadId) return res.status(403).json({ success: false, message: "Bu belge bu lead'e ait degil." });
  if (doc.deletedAt) return res.status(409).json({ success: false, message: "Belge zaten silinmis." });

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return res.status(404).json({ success: false, message: "Lead bulunamadi." });
  await assertLeadAccess(req.user, lead);

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: { deletedAt: new Date() }
  });

  prisma.activityLog.create({
    data: { leadId, action: "BELGE_SILINDI", detail: `Belge silindi: ${doc.originalName || documentId}` }
  }).catch(() => {});

  return res.json({ success: true, data: { id: updated.id, deletedAt: updated.deletedAt } });
});

// ─── RETRY ANALİZ ────────────────────────────────────────────────────────────
exports.retryDocumentAnalysis = asyncHandler(async (req, res) => {
  const { id: leadId, documentId } = req.params;

  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc || doc.leadId !== leadId || doc.deletedAt) {
    return res.status(404).json({ success: false, message: "Belge bulunamadi." });
  }

  const MAX_VISION_BYTES = 20 * 1024 * 1024; // uploadAnalysis.bridge.js:91 ile eslesir
  if (doc.sizeBytes && doc.sizeBytes > MAX_VISION_BYTES) {
    return res.status(400).json({
      success: false,
      message: `Dosya boyutu ${(doc.sizeBytes / 1024 / 1024).toFixed(1)} MB — Vision limiti 20 MB. Sikistirilmis halde yeniden yukleyin.`
    });
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return res.status(404).json({ success: false, message: "Lead bulunamadi." });
  await assertLeadAccess(req.user, lead);

  await prisma.document.update({
    where: { id: documentId },
    data: { status: "UPLOADED", aiAnalysis: null }
  });

  const { rerunAnalysis } = require("../jobs/documentAnalysis.job");
  setImmediate(() =>
    rerunAnalysis(documentId).catch(async (err) => {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: "FAILED", aiAnalysis: JSON.stringify({ error: err.message, failedAt: new Date().toISOString() }) }
      }).catch(() => {});
    })
  );

  return res.json({ success: true, message: "Analiz yeniden baslatildi." });
});

// ─── BULK SOFT DELETE ─────────────────────────────────────────────────────────
exports.bulkDeleteDocuments = asyncHandler(async (req, res) => {
  const { id: leadId } = req.params;
  const { documentIds } = req.body;

  if (!Array.isArray(documentIds) || documentIds.length === 0) {
    return res.status(400).json({ success: false, message: "Belge ID listesi gerekli." });
  }
  if (documentIds.length > 50) {
    return res.status(400).json({ success: false, message: "Tek seferde maksimum 50 belge silinebilir." });
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return res.status(404).json({ success: false, message: "Lead bulunamadi." });
  await assertLeadAccess(req.user, lead);

  const docs = await prisma.document.findMany({
    where: { id: { in: documentIds }, leadId, deletedAt: null },
    select: { id: true, originalName: true }
  });

  if (docs.length === 0) {
    return res.status(404).json({ success: false, message: "Silinecek belge bulunamadi." });
  }

  const result = await prisma.document.updateMany({
    where: { id: { in: docs.map(d => d.id) }, leadId },
    data: { deletedAt: new Date() }
  });

  prisma.activityLog.create({
    data: {
      leadId,
      action: "BELGE_TOPLU_SILINDI",
      detail: `${result.count} belge silindi: ${docs.map(d => d.originalName || d.id).join(", ")}`
    }
  }).catch(() => {});

  return res.json({ success: true, data: { deletedCount: result.count, requested: documentIds.length } });
});

// ─── DOWNLOAD ─────────────────────────────────────────────────────────────────
exports.downloadDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) {
    return res.status(404).json({ success: false, message: "Belge bulunamadi." });
  }

  const lead = await prisma.lead.findUnique({ where: { id: doc.leadId } });
  if (!lead) {
    return res.status(404).json({ success: false, message: "Lead bulunamadi." });
  }

  await assertLeadAccess(req.user, lead);

  // KVKK log — belge indirme kaniti
  try {
    const tedbirgeOS = require("../os");
    if (tedbirgeOS.modules?.kvkk?.logDataExport) {
      await tedbirgeOS.modules.kvkk.logDataExport(req.user?.id, "document", 1);
    }
  } catch (_) {}

  const signedUrl = await createSignedDownloadUrl(doc.path, 3600);
  return res.redirect(signedUrl);
});
