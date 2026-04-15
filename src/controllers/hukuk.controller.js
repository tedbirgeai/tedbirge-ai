/**
 * Hukuki süreç controller'ı:
 * İhtarname, DavaSurec, Duruşma, Bilirkişi, Masraf
 */
const asyncHandler = require("../utils/asyncHandler");
const { listIhtarnameler, createIhtarname, updateIhtarname } = require("../services/ihtarname.service");
const { getDavaSurec, upsertDavaSurec, updateAsama } = require("../services/davaSurec.service");
const { listDurusmalar, createDurusma, deleteDurusma } = require("../services/durusma.service");
const { listBilirkisi, createBilirkisi, updateBilirkisi, analyzeBilirkisiRapor } = require("../services/bilirkisi.service");
const { listMasraflar, createMasraf } = require("../services/masraf.service");

// ─── İHTARNAME ───────────────────────────────────────────────────────────────

exports.getIhtarnameler = asyncHandler(async (req, res) => {
  const data = await listIhtarnameler(req.params.id);
  res.json({ success: true, data });
});

exports.createIhtarname = asyncHandler(async (req, res) => {
  const data = await createIhtarname(req.params.id, req.body);
  res.status(201).json({ success: true, data });
});

exports.updateIhtarname = asyncHandler(async (req, res) => {
  const data = await updateIhtarname(req.params.ihtarnameId, req.body);
  res.json({ success: true, data });
});

// ─── DAVA SÜREÇ ──────────────────────────────────────────────────────────────

exports.getDavaSurec = asyncHandler(async (req, res) => {
  const data = await getDavaSurec(req.params.id);
  res.json({ success: true, data });
});

exports.upsertDavaSurec = asyncHandler(async (req, res) => {
  const data = await upsertDavaSurec(req.params.id, req.body);
  res.json({ success: true, data });
});

exports.updateDavaAsama = asyncHandler(async (req, res) => {
  const { asama } = req.body;
  if (!asama) return res.status(400).json({ success: false, message: "asama alanı gerekli." });
  const data = await updateAsama(req.params.id, asama);
  res.json({ success: true, data });
});

// ─── DURUŞMA ─────────────────────────────────────────────────────────────────

exports.getDurusmalar = asyncHandler(async (req, res) => {
  const data = await listDurusmalar(req.params.id);
  res.json({ success: true, data });
});

exports.createDurusma = asyncHandler(async (req, res) => {
  if (!req.body.tarih) {
    return res.status(400).json({ success: false, message: "tarih alanı gerekli." });
  }
  const data = await createDurusma(req.params.id, req.body);
  res.status(201).json({ success: true, data });
});

exports.deleteDurusma = asyncHandler(async (req, res) => {
  await deleteDurusma(req.params.durusmaId);
  res.json({ success: true, message: "Duruşma silindi." });
});

// ─── BİLİRKİŞİ ───────────────────────────────────────────────────────────────

exports.getBilirkisi = asyncHandler(async (req, res) => {
  const data = await listBilirkisi(req.params.id);
  res.json({ success: true, data });
});

exports.createBilirkisi = asyncHandler(async (req, res) => {
  const data = await createBilirkisi(req.params.id, req.body);
  res.status(201).json({ success: true, data });
});

exports.updateBilirkisi = asyncHandler(async (req, res) => {
  const data = await updateBilirkisi(req.params.bilirkisiId, req.body);
  res.json({ success: true, data });
});

exports.analyzeBilirkisi = asyncHandler(async (req, res) => {
  const data = await analyzeBilirkisiRapor(req.params.bilirkisiId);
  res.json({ success: true, data });
});

// ─── MASRAF ──────────────────────────────────────────────────────────────────

exports.getMasraflar = asyncHandler(async (req, res) => {
  const data = await listMasraflar(req.params.id);
  res.json({ success: true, data });
});

exports.createMasraf = asyncHandler(async (req, res) => {
  if (!req.body.tur || req.body.tutar === undefined) {
    return res.status(400).json({ success: false, message: "tur ve tutar alanları gerekli." });
  }
  const data = await createMasraf(req.params.id, req.body);
  res.status(201).json({ success: true, data });
});
