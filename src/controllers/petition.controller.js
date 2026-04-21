"use strict";

const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/db");
const { generatePetition } = require("../services/ai.service");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const { assertLeadAccess } = require("../utils/leadAccess");

// Sayfa düzeni için sabit
const FONT_PATH_ARIAL = "C:/Windows/Fonts/arial.ttf";

/**
 * POST /api/leads/:leadId/petitions
 * Lead belgelerini çek, AI ile dilekçe oluştur, DB'ye kaydet
 */
exports.createPetition = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const { tur, muhatap, notlar } = req.body;

  if (!tur) {
    return res.status(400).json({ success: false, message: "Dilekçe türü (tur) zorunludur." });
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      documents: { where: { status: { in: ["PARSED", "ANALYZED"] } } },
      assignments: { include: { lawyer: { select: { id: true, fullName: true, email: true } } } },
    },
  });

  if (!lead) {
    return res.status(404).json({ success: false, message: "Lead bulunamadı." });
  }

  // Lead erişim kontrolü
  await assertLeadAccess(req.user, lead);

  // Belgelerden parsedText listesini al
  const documents = lead.documents || [];

  // AI ile dilekçe oluştur
  const icerik = await generatePetition(lead, tur, documents);

  // DB'ye kaydet
  const petition = await prisma.petition.create({
    data: {
      leadId,
      createdById: req.user?.id || null,
      tur,
      icerik,
      muhatap: muhatap || null,
      notlar: notlar || null,
      durum: "TASLAK",
    },
  });

  res.status(201).json({ success: true, data: petition });
});

/**
 * GET /api/leads/:leadId/petitions
 * Lead'e ait tüm dilekçeleri listele
 */
exports.listPetitions = asyncHandler(async (req, res) => {
  const { leadId } = req.params;

  const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { assignments: true } });
  await assertLeadAccess(req.user, lead);

  const petitions = await prisma.petition.findMany({
    where: { leadId },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: petitions });
});

/**
 * GET /api/petitions/:id/pdf
 * Dilekçeyi PDF olarak indir
 */
exports.downloadPetition = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const petition = await prisma.petition.findUnique({
    where: { id },
    include: { lead: { include: { assignments: true } } },
  });

  if (!petition) {
    return res.status(404).json({ success: false, message: "Dilekçe bulunamadı." });
  }

  // Lead erişim kontrolü
  await assertLeadAccess(req.user, petition.lead);

  const doc = new PDFDocument({ size: "A4", margin: 50, lang: "tr" });

  // Türkçe font
  const fontPath = fs.existsSync(FONT_PATH_ARIAL) ? FONT_PATH_ARIAL : null;
  if (fontPath) {
    doc.registerFont("TR", fontPath);
    doc.font("TR");
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="dilekce-${petition.tur}-${id.slice(0, 8)}.pdf"`
  );
  doc.pipe(res);

  // ── Header ────────────────────────────────────────────────────────────────
  const logoPath = path.join(__dirname, "../../tedbirge-panel/public/logo.png");
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 40, { height: 36 });
  }
  doc
    .fontSize(9)
    .fillColor("#64748b")
    .text("Tedbirge.ai | Hukuk Teknoloji Platformu", 0, 50, { align: "right" });

  doc.moveTo(50, 85).lineTo(545, 85).lineWidth(0.5).strokeColor("#1E1E8E").stroke();

  // ── Başlık ────────────────────────────────────────────────────────────────
  const PETITION_TYPE_TR = {
    DEMAND_LETTER: "TALEP / İHTARNAME",
    COURT_PETITION: "DAVA DİLEKÇESİ",
    INSURANCE_CLAIM: "SİGORTA TAZMİNAT BAŞVURUSU",
    INJURY_CLAIM: "BEDENSEL ZARAR TAZMİNAT TALEBİ",
    DEATH_CLAIM: "DESTEKTEN YOKSUN KALMA TAZMİNATI",
    VEHICLE_CLAIM: "ARAÇ HASAR TAZMİNATI",
    INSURANCE_OBJECTION: "SİGORTA RET KARARINA İTİRAZ",
    CIVIL_COURT: "MADDİ-MANEVİ TAZMİNAT DAVA DİLEKÇESİ",
    LABOR_COURT: "İŞ KAZASI TAZMİNAT DAVA DİLEKÇESİ",
    SGK_OBJECTION: "SGK RÜCU TALEBİNE İTİRAZ",
    SIGORTA_IHTARNAME: "SİGORTA ŞİRKETİNE İHTARNAME",
    SIGORTA_ITIRAZ: "SİGORTA RET KARARINA İTİRAZ",
    ASLIYE_HUKUK: "ASLİYE HUKUK DAVA DİLEKÇESİ",
    IS_MAHKEMESI: "İŞ MAHKEMESİ DAVA DİLEKÇESİ",
    BILIRKISI_ITIRAZ: "BİLİRKİŞİ RAPORUNA İTİRAZ",
  };

  doc
    .moveDown(2)
    .fontSize(14)
    .fillColor("#1E1E8E")
    .text(PETITION_TYPE_TR[petition.tur] || petition.tur, { align: "center", underline: true });

  doc.moveDown(0.5).fontSize(9).fillColor("#64748b").text(
    `Müvekkil: ${petition.lead?.customerName || "—"}  |  Tarih: ${new Date(petition.createdAt).toLocaleDateString("tr-TR")}`,
    { align: "center" }
  );

  doc.moveTo(50, doc.y + 8).lineTo(545, doc.y + 8).lineWidth(0.3).strokeColor("#e2e8f0").stroke();

  // ── İçerik ────────────────────────────────────────────────────────────────
  doc.moveDown(1.5).fontSize(11).fillColor("#0f172a").text(petition.icerik, {
    width: 495,
    align: "justify",
    lineGap: 4,
  });

  // ── İmza Alanı ────────────────────────────────────────────────────────────
  doc.moveDown(3)
    .fontSize(9)
    .fillColor("#64748b")
    .text("Avukat İmzası ve Kaşesi:", 350)
    .moveDown(0.5)
    .moveTo(350, doc.y).lineTo(545, doc.y).lineWidth(0.5).strokeColor("#94a3b8").stroke()
    .moveDown(1.5)
    .text("Ad Soyad:", 350)
    .moveDown(0.5)
    .moveTo(350, doc.y).lineTo(545, doc.y).lineWidth(0.5).strokeColor("#94a3b8").stroke();

  // ── Hukuki Uyarı ──────────────────────────────────────────────────────────
  doc.moveDown(2)
    .fontSize(7.5)
    .fillColor("#94a3b8")
    .text(
      "⚠ Bu belge Tedbirge.ai tarafından Avukatlık Kanunu m.35 uyarınca taslak niteliğinde hazırlanmıştır. " +
      "Sorumlu avukat tarafından incelenmeden kullanılamaz. Üretim tarihi: " +
      new Date().toLocaleDateString("tr-TR"),
      { align: "center" }
    );

  // ── Sayfa Numarası ────────────────────────────────────────────────────────
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(pages.start + i);
    doc.fontSize(8).fillColor("#94a3b8").text(
      `Sayfa ${i + 1} / ${pages.count}  |  Tedbirge.ai`,
      50, doc.page.height - 30, { align: "center", width: doc.page.width - 100 }
    );
  }

  doc.end();
});

/**
 * PATCH /api/petitions/:id
 * Dilekçe içeriğini güncelle
 */
exports.updatePetition = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { icerik, durum, muhatap, notlar } = req.body;

  // Erişim kontrolü — güncelleme öncesi lead'e erişim doğrula
  const existing = await prisma.petition.findUnique({
    where: { id },
    include: { lead: { include: { assignments: true } } },
  });
  if (!existing) return res.status(404).json({ success: false, message: "Dilekçe bulunamadı." });
  await assertLeadAccess(req.user, existing.lead);

  const petition = await prisma.petition.update({
    where: { id },
    data: {
      ...(icerik !== undefined && { icerik }),
      ...(durum !== undefined && { durum }),
      ...(muhatap !== undefined && { muhatap }),
      ...(notlar !== undefined && { notlar }),
    },
  });

  res.json({ success: true, data: petition });
});

/**
 * PATCH /api/petitions/:id/send
 * Dilekçeyi gönderildi olarak işaretle
 */
exports.sendPetition = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Erişim kontrolü
  const existing = await prisma.petition.findUnique({
    where: { id },
    include: { lead: { include: { assignments: true } } },
  });
  if (!existing) return res.status(404).json({ success: false, message: "Dilekçe bulunamadı." });
  await assertLeadAccess(req.user, existing.lead);

  const petition = await prisma.petition.update({
    where: { id },
    data: {
      gonderildi: true,
      gonderimTarihi: new Date(),
      durum: "GONDERILDI",
    },
  });

  res.json({ success: true, data: petition });
});
