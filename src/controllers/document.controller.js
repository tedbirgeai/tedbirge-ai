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

  const signedUrl = await createSignedDownloadUrl(doc.path, 3600);
  return res.redirect(signedUrl);
});
