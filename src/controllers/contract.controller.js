const asyncHandler = require("../utils/asyncHandler");
const { generateContract } = require("../services/contract.service");
const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");
const fs = require("fs");
const path = require("path");

const TYPE_LABELS = {
  SERVICE_AGREEMENT: "Hizmet Sozlesmesi",
  POWER_OF_ATTORNEY: "Vekaletname",
};

exports.generate = asyncHandler(async (req, res) => {
  const contract = await generateContract({
    leadId: req.params.leadId,
    type: req.body.type,
    createdById: req.user?.id || null
  });

  res.status(201).json({ success: true, data: contract });
});

exports.listByLead = asyncHandler(async (req, res) => {
  const contracts = await prisma.contract.findMany({
    where: { leadId: req.params.leadId },
    orderBy: { createdAt: "desc" }
  });
  res.json({ success: true, data: contracts });
});

exports.update = asyncHandler(async (req, res) => {
  const { content, status } = req.body;

  const existing = await prisma.contract.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, "Sözleşme bulunamadı");

  const updated = await prisma.contract.update({
    where: { id: req.params.id },
    data: {
      ...(content !== undefined && { content }),
      ...(status !== undefined && { status }),
    }
  });

  await prisma.activityLog.create({
    data: {
      leadId: updated.leadId,
      action: "CONTRACT_UPDATED",
      detail: `Sözleşme düzenlendi: ${updated.type}`
    }
  });

  res.json({ success: true, data: updated });
});

exports.getPdf = asyncHandler(async (req, res) => {
  const contract = await prisma.contract.findUnique({
    where: { id: req.params.id },
    include: { lead: true }
  });
  if (!contract) throw new ApiError(404, "Sözleşme bulunamadı");

  const PDFDocument = require("pdfkit");

  // bufferPages: page count'u footer için kullanacağız
  const doc = new PDFDocument({ margin: 60, size: "A4", bufferPages: true });

  const safeTitle = (TYPE_LABELS[contract.type] || contract.title || "Sozlesme")
    .replace(/[^\w\s\-]/g, "");
  const fileName = `sozlesme-${safeTitle}-${contract.id.slice(-6)}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${fileName}"`
  );

  doc.pipe(res);

  // ─── Font: Windows Arial (Turkish chars), fallback Helvetica ──────────────
  const arialPath = "C:/Windows/Fonts/arial.ttf";
  const arialBoldPath = "C:/Windows/Fonts/arialbd.ttf";
  const hasArial = fs.existsSync(arialPath);

  function useFont(bold = false) {
    if (hasArial) {
      const p = bold && fs.existsSync(arialBoldPath) ? arialBoldPath : arialPath;
      doc.font(p);
    } else {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica");
    }
  }

  // ─── Header ───────────────────────────────────────────────────────────────
  useFont(true);
  doc.fontSize(9).fillColor("#185FA5").text("TEDBIRGE AI", 60, 40, { align: "left" });
  doc.fontSize(9).fillColor("#94a3b8").text(
    new Date().toLocaleDateString("tr-TR"),
    0, 40,
    { align: "right", width: doc.page.width - 120 }
  );

  // Divider
  doc.moveTo(60, 58).lineTo(doc.page.width - 60, 58).lineWidth(1).strokeColor("#e2e8f0").stroke();

  // ─── Title ────────────────────────────────────────────────────────────────
  doc.moveDown(1.5);
  useFont(true);
  doc.fontSize(16).fillColor("#0A1628")
    .text(
      TYPE_LABELS[contract.type] || contract.title || "Sozlesme",
      { align: "center" }
    );

  if (contract.lead?.customerName) {
    doc.moveDown(0.3);
    useFont(false);
    doc.fontSize(10).fillColor("#185FA5")
      .text(contract.lead.customerName, { align: "center" });
  }

  doc.moveDown(0.5);
  doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y)
    .lineWidth(0.5).strokeColor("#cbd5e1").stroke();
  doc.moveDown(1);

  // ─── Content ──────────────────────────────────────────────────────────────
  useFont(false);
  const lines = (contract.content || "").split("\n");

  for (const line of lines) {
    const trimmed = line.trimEnd();

    // Section headers (all caps / ━ lines)
    if (/^━+$/.test(trimmed)) {
      doc.moveDown(0.2);
      doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y)
        .lineWidth(0.5).strokeColor("#e2e8f0").stroke();
      doc.moveDown(0.2);
      continue;
    }

    // Bold numbered sections like "1. TARAFLAR"
    const isSectionHeader = /^\d+\.\s+[A-ZÇĞİÖŞÜ]/.test(trimmed) ||
      /^[A-ZÇĞİÖŞÜ\s]{4,}$/.test(trimmed.replace(/[^A-ZÇĞİÖŞÜa-zçğışöüA\s]/g, "").trim());

    if (isSectionHeader && trimmed.length > 3 && trimmed.length < 60) {
      useFont(true);
      doc.fontSize(10).fillColor("#0A1628").text(trimmed, { lineGap: 2 });
      useFont(false);
    } else if (trimmed === "") {
      doc.moveDown(0.4);
    } else {
      doc.fontSize(9.5).fillColor("#1e293b").text(trimmed, { lineGap: 3 });
    }
  }

  // ─── Page footers ─────────────────────────────────────────────────────────
  const range = doc.bufferedPageRange();
  const totalPages = range.count;

  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(range.start + i);

    const footerY = doc.page.height - 40;
    doc.moveTo(60, footerY - 8)
      .lineTo(doc.page.width - 60, footerY - 8)
      .lineWidth(0.5).strokeColor("#e2e8f0").stroke();

    useFont(false);
    doc.fontSize(8).fillColor("#94a3b8")
      .text(
        `Sayfa ${i + 1} / ${totalPages}   \u2022   Tedbirge AI   \u2022   ${new Date().toLocaleDateString("tr-TR")}`,
        60,
        footerY,
        { align: "center", width: doc.page.width - 120 }
      );
  }

  doc.end();
});
