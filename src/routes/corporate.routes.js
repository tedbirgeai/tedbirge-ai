// TUR #100.9 P8 — Kurumsal Üretim route'ları (Madde 34) — RBAC bağlı

"use strict";

const express = require("express");
const auth = require("../middlewares/authMiddleware");
const { requirePermission } = require("../middlewares/requirePermission");
const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/db");
const corporateService = require("../services/corporate.service");
const marketingTemplates = require("../services/marketingTemplates.service");
const { loadBrand } = require("./brand.routes");

const router = express.Router();

function pngUnavailable(res) {
  return res.status(503).json({
    success: false,
    code: "PNG_UNAVAILABLE",
    message: "PNG dönüşümü şu anda kullanılamıyor (sharp paketi yok). SVG'yi indirin.",
  });
}

function pdfUnavailable(res) {
  return res.status(503).json({
    success: false,
    code: "PDF_UNAVAILABLE",
    message: "PDF üretimi şu anda kullanılamıyor (pdfkit yok).",
  });
}

// TUR #112 — RFC 5987 filename encoding (Turkce karakter destegi)
function utf8Disposition(disposition, filename) {
  const ascii = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const encoded = encodeURIComponent(filename);
  return `${disposition}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

// ─── Kartvizit ON YUZ SVG (TUR #112 premium — Madde 30.65) ───────────
router.get(
  "/kartvizit/svg",
  auth,
  requirePermission("kartvizit", "execute"),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const svg = await corporateService.generateKartvizitSVG(user);
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Content-Disposition", utf8Disposition("inline", `kartvizit-${user.id}.svg`));
    res.send(Buffer.from(svg, "utf8"));
  })
);

// ─── Kartvizit ARKA YUZ SVG (TUR #111-112 — Madde 30.64 + 30.65) ─────
// LAWYER icin 403 (Madde 25.3 R1 backend enforcement)
router.get(
  "/kartvizit/back-svg",
  auth,
  requirePermission("kartvizit", "execute"),
  asyncHandler(async (req, res) => {
    if (req.user.role === "LAWYER") {
      return res.status(403).json({
        success: false,
        code: "TBB_REKLAM_YASAGI",
        message: "Avukatlik K. m.55 ve TBB Reklam Yasagi geregi avukatlar kartvizit arka yuzunde reklam metni kullanamaz.",
      });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const rawAd = (req.query.adContent || "").toString().slice(0, 200);
    const svg = await corporateService.generateKartvizitBackSVG(user, rawAd);
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Content-Disposition", utf8Disposition("inline", `kartvizit-back-${user.id}.svg`));
    res.send(Buffer.from(svg, "utf8"));
  })
);

// ─── Kartvizit PNG — TUR #112: SVG dondurur, frontend canvas cevirir ─
// sharp yok pattern (Madde 30.65 — frontend canvas conversion stratejisi)
router.get(
  "/kartvizit/png",
  auth,
  requirePermission("kartvizit", "execute"),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const svg = await corporateService.generateKartvizitSVG(user);
    // sharp varsa gercek PNG, yoksa SVG (frontend canvas cevirir)
    if (corporateService.hasPng) {
      const png = await corporateService.svgToPng(svg);
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", utf8Disposition("inline", `kartvizit-${user.id}.png`));
      return res.send(png);
    }
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Content-Disposition", utf8Disposition("inline", `kartvizit-${user.id}.svg`));
    res.send(Buffer.from(svg, "utf8"));
  })
);

router.get(
  "/kartvizit/vcard",
  auth,
  requirePermission("kartvizit", "execute"),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const vcard = corporateService.generateVCard(user, loadBrand());
    const filename = (user.fullName || "kartvizit").replace(/[^a-zA-Z0-9_-]/g, "_");
    res.setHeader("Content-Type", "text/vcard; charset=utf-8");
    res.setHeader("Content-Disposition", utf8Disposition("attachment", `${filename}.vcf`));
    res.send(Buffer.from(vcard, "utf8"));
  })
);

// ─── Kartvizit MATBAA PDF (TUR #112 — Madde 30.65) ───────────────────
// 92x62mm, 2 sayfa, font embed, trim marks
// LAWYER icin print yetkisi default false (ROLE_DEFAULTS — Madde 25.3 + 30.65)
router.get(
  "/kartvizit/print-pdf",
  auth,
  requirePermission("kartvizit", "print"),
  asyncHandler(async (req, res) => {
    if (!corporateService.hasPDF) return pdfUnavailable(res);
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isLawyer = user.role === "LAWYER";
    const rawAd = isLawyer ? "" : (req.query.adContent || "").toString().slice(0, 200);
    const pdf = await corporateService.generateKartvizitMatbaaPDF(user, rawAd);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", utf8Disposition("attachment", `kartvizit-matbaa-${user.id}.pdf`));
    res.send(pdf);
  })
);

// ─── Kartvizit DIJITAL PAYLASIM PDF (TUR #112 — Madde 30.65) ─────────
// 85x55mm (LAWYER) veya 170x55mm (on+arka), bleed YOK, compress aktif
router.get(
  "/kartvizit/share-pdf",
  auth,
  requirePermission("kartvizit", "execute"),
  asyncHandler(async (req, res) => {
    if (!corporateService.hasPDF) return pdfUnavailable(res);
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isLawyer = user.role === "LAWYER";
    const rawAd = isLawyer ? "" : (req.query.adContent || "").toString().slice(0, 200);
    const pdf = await corporateService.generateKartvizitDigitalPDF(user, rawAd);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", utf8Disposition("attachment", `kartvizit-paylas-${user.id}.pdf`));
    res.send(pdf);
  })
);

// ─── Broşür (Tedbirge marka) ─────────────────────────────────────────
router.get(
  "/brosur/svg",
  auth,
  requirePermission("brosur", "read"),
  asyncHandler(async (req, res) => {
    const svg = await corporateService.generateBrosurSVG();
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Content-Disposition", `inline; filename="tedbirge-brosur.svg"`);
    res.send(svg);
  })
);

router.get(
  "/brosur/png",
  auth,
  requirePermission("brosur", "read"),
  asyncHandler(async (req, res) => {
    if (!corporateService.hasPng) return pngUnavailable(res);
    const svg = await corporateService.generateBrosurSVG();
    const png = await corporateService.svgToPng(svg);
    res.setHeader("Content-Type", "image/png");
    res.send(png);
  })
);

// ─── Reklam görseli (3 boyut) ─────────────────────────────────────────
router.get(
  "/reklam/svg",
  auth,
  requirePermission("reklamGorseli", "read"),
  asyncHandler(async (req, res) => {
    const format = req.query.format || "square";
    const text = req.query.text || null;
    const svg = await corporateService.generateReklamGorseliSVG(format, text);
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Content-Disposition", `inline; filename="reklam-${format}.svg"`);
    res.send(svg);
  })
);

router.get(
  "/reklam/png",
  auth,
  requirePermission("reklamGorseli", "read"),
  asyncHandler(async (req, res) => {
    if (!corporateService.hasPng) return pngUnavailable(res);
    const format = req.query.format || "square";
    const text = req.query.text || null;
    const svg = await corporateService.generateReklamGorseliSVG(format, text);
    const png = await corporateService.svgToPng(svg);
    res.setHeader("Content-Type", "image/png");
    res.send(png);
  })
);

// ─── Reklam Metni (TUR #101 — hazir sablon kutuphanesi) ──────────────
// Madde 24.14 sifir maliyet + Madde 25.3 R1 LAWYER kisitli

router.get(
  "/marketing-text/random",
  auth,
  requirePermission("reklamGorseli", "read"),
  asyncHandler(async (req, res) => {
    if (req.user.role === "LAWYER") {
      return res.status(403).json({
        success: false,
        error: "TBB_REKLAM_YASAGI",
        message: "Avukatlar pazarlama metni uretemez (Avukatlik K. m.55 + TBB Reklam Yasagi).",
      });
    }

    const channel = (req.query.channel || "whatsapp").toString();
    const excludeIds = (req.query.excludeIds || "").toString();
    const excludeArr = excludeIds ? excludeIds.split(",").filter(Boolean) : [];

    const template = marketingTemplates.getRandomTemplate(channel, excludeArr);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: "NO_TEMPLATE",
        message: `'${channel}' kanali icin sablon bulunamadi.`,
      });
    }

    const filled = marketingTemplates.fillTemplate(template, {
      "Ad Soyad": req.user.fullName || req.user.adSoyad || req.user.name || "",
      "Sender Name": req.user.fullName || req.user.adSoyad || req.user.name || "",
    });

    res.json({
      success: true,
      data: filled,
      meta: {
        channel,
        totalAvailable: marketingTemplates.getTemplatesByChannel(channel).length,
        seenCount: excludeArr.length,
      },
    });
  })
);

router.get(
  "/marketing-text/channels",
  auth,
  requirePermission("reklamGorseli", "read"),
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: marketingTemplates.getChannels(),
    });
  })
);

// ─── Email imzası ────────────────────────────────────────────────────
router.get(
  "/email-imzasi",
  auth,
  requirePermission("emailImzasi", "execute"),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const html = await corporateService.generateEmailImzasi(user);
    res.json({ success: true, data: { html } });
  })
);

module.exports = router;
