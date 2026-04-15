const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/db");
const path = require("path");
const fs = require("fs");

exports.downloadDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) {
    return res.status(404).json({ success: false, message: "Belge bulunamadı." });
  }

  // LAWYER rolü sadece atandığı lead'e ait belgeye erişebilir
  if (req.user?.role === "LAWYER") {
    const assignment = await prisma.assignment.findFirst({
      where: { leadId: doc.leadId, lawyerId: req.user.id, status: "ACTIVE" },
    });
    if (!assignment) {
      return res.status(403).json({ success: false, message: "Bu belgeye erişim yetkiniz yok." });
    }
  }

  // Dosya yolu: doc.path (kaydedildiği mutlak yol) veya uploads/ relatif yol
  let filePath = doc.path;
  if (!path.isAbsolute(filePath)) {
    filePath = path.join(process.cwd(), filePath);
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "Dosya sunucuda bulunamadı." });
  }

  res.setHeader("Content-Type", doc.mimeType || "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(doc.originalName || doc.storedName)}"`
  );

  const stream = fs.createReadStream(filePath);
  stream.on("error", () => {
    res.status(500).json({ success: false, message: "Dosya okunurken hata oluştu." });
  });
  stream.pipe(res);
});
