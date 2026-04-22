const asyncHandler = require("../utils/asyncHandler");
const { uploadDocument } = require("../services/upload.service");

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
