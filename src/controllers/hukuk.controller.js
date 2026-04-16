/**
 * Hukuki süreç controller'ı:
 * İhtarname, DavaSurec, Duruşma, Bilirkişi, Masraf
 *
 * Her handler, işlem yapmadan önce assertLeadAccess ile lead erişimini doğrular.
 */
const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/db");
const { assertLeadAccess } = require("../utils/leadAccess");
const { listIhtarnameler, createIhtarname, updateIhtarname } = require("../services/ihtarname.service");
const { getDavaSurec, upsertDavaSurec, updateAsama } = require("../services/davaSurec.service");
const { listDurusmalar, createDurusma, deleteDurusma } = require("../services/durusma.service");
const { listBilirkisi, createBilirkisi, updateBilirkisi, analyzeBilirkisiRapor } = require("../services/bilirkisi.service");
const { listMasraflar, createMasraf } = require("../services/masraf.service");

/**
 * Ortak yardımcı: req.params.id üzerinden lead'i çeker ve erişim doğrular.
 * Erişim yoksa hata fırlatır; varsa lead nesnesini döner.
 */
async function requireLeadAccess(req) {
  const lead = await prisma.lead.findUnique({
    where: { id: req.params.id },
    include: { assignments: true },
  });
  await assertLeadAccess(req.user, lead);
  return lead;
}

// ─── İHTARNAME ───────────────────────────────────────────────────────────────

exports.getIhtarnameler = asyncHandler(async (req, res) => {
  await requireLeadAccess(req);
  const data = await listIhtarnameler(req.params.id);
  res.json({ success: true, data });
});

exports.createIhtarname = asyncHandler(async (req, res) => {
  await requireLeadAccess(req);
  const data = await createIhtarname(req.params.id, req.body);
  res.status(201).json({ success: true, data });
});

exports.updateIhtarname = asyncHandler(async (req, res) => {
  // İhtarname kendi leadId'sini taşır — önce lead'i bul
  const ihtarname = await prisma.ihtarnameTakip.findUnique({ where: { id: req.params.ihtarnameId } });
  if (ihtarname) {
    const lead = await prisma.lead.findUnique({ where: { id: ihtarname.leadId }, include: { assignments: true } });
    await assertLeadAccess(req.user, lead);
  }
  const data = await updateIhtarname(req.params.ihtarnameId, req.body);
  res.json({ success: true, data });
});

// ─── DAVA SÜREÇ ──────────────────────────────────────────────────────────────

exports.getDavaSurec = asyncHandler(async (req, res) => {
  await requireLeadAccess(req);
  const data = await getDavaSurec(req.params.id);
  res.json({ success: true, data });
});

exports.upsertDavaSurec = asyncHandler(async (req, res) => {
  await requireLeadAccess(req);
  const data = await upsertDavaSurec(req.params.id, req.body);
  res.json({ success: true, data });
});

exports.updateDavaAsama = asyncHandler(async (req, res) => {
  const { asama } = req.body;
  if (!asama) return res.status(400).json({ success: false, message: "asama alanı gerekli." });
  await requireLeadAccess(req);
  const data = await updateAsama(req.params.id, asama);
  res.json({ success: true, data });
});

// ─── DURUŞMA ─────────────────────────────────────────────────────────────────

exports.getDurusmalar = asyncHandler(async (req, res) => {
  await requireLeadAccess(req);
  const data = await listDurusmalar(req.params.id);
  res.json({ success: true, data });
});

exports.createDurusma = asyncHandler(async (req, res) => {
  if (!req.body.tarih) {
    return res.status(400).json({ success: false, message: "tarih alanı gerekli." });
  }
  await requireLeadAccess(req);
  const data = await createDurusma(req.params.id, req.body);
  res.status(201).json({ success: true, data });
});

exports.deleteDurusma = asyncHandler(async (req, res) => {
  // Duruşma kendi leadId'sini taşır
  const durusma = await prisma.durusma.findUnique({ where: { id: req.params.durusmaId } });
  if (durusma) {
    const lead = await prisma.lead.findUnique({ where: { id: durusma.leadId }, include: { assignments: true } });
    await assertLeadAccess(req.user, lead);
  }
  await deleteDurusma(req.params.durusmaId);
  res.json({ success: true, message: "Duruşma silindi." });
});

// ─── BİLİRKİŞİ ───────────────────────────────────────────────────────────────

exports.getBilirkisi = asyncHandler(async (req, res) => {
  await requireLeadAccess(req);
  const data = await listBilirkisi(req.params.id);
  res.json({ success: true, data });
});

exports.createBilirkisi = asyncHandler(async (req, res) => {
  await requireLeadAccess(req);
  const data = await createBilirkisi(req.params.id, req.body);
  res.status(201).json({ success: true, data });
});

exports.updateBilirkisi = asyncHandler(async (req, res) => {
  const bilirkisi = await prisma.bilirkisi.findUnique({ where: { id: req.params.bilirkisiId } });
  if (bilirkisi) {
    const lead = await prisma.lead.findUnique({ where: { id: bilirkisi.leadId }, include: { assignments: true } });
    await assertLeadAccess(req.user, lead);
  }
  const data = await updateBilirkisi(req.params.bilirkisiId, req.body);
  res.json({ success: true, data });
});

exports.analyzeBilirkisi = asyncHandler(async (req, res) => {
  const bilirkisi = await prisma.bilirkisi.findUnique({ where: { id: req.params.bilirkisiId } });
  if (bilirkisi) {
    const lead = await prisma.lead.findUnique({ where: { id: bilirkisi.leadId }, include: { assignments: true } });
    await assertLeadAccess(req.user, lead);
  }
  const data = await analyzeBilirkisiRapor(req.params.bilirkisiId);
  res.json({ success: true, data });
});

// ─── MASRAF ──────────────────────────────────────────────────────────────────

exports.getMasraflar = asyncHandler(async (req, res) => {
  await requireLeadAccess(req);
  const data = await listMasraflar(req.params.id);
  res.json({ success: true, data });
});

exports.createMasraf = asyncHandler(async (req, res) => {
  if (!req.body.tur || req.body.tutar === undefined) {
    return res.status(400).json({ success: false, message: "tur ve tutar alanları gerekli." });
  }
  await requireLeadAccess(req);
  const data = await createMasraf(req.params.id, req.body);
  res.status(201).json({ success: true, data });
});
