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
