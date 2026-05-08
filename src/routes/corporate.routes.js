// TUR #100.9 P8 — Kurumsal Üretim route'ları (Madde 34) — RBAC bağlı

"use strict";

const express = require("express");
const auth = require("../middlewares/authMiddleware");
const { requirePermission } = require("../middlewares/requirePermission");
const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/db");
const corporateService = require("../services/corporate.service");
const { loadBrand } = require("./brand.routes");

const router = express.Router();

function pngUnavailable(res) {
  return res.status(503).json({
    success: false,
    code: "PNG_UNAVAILABLE",
    message: "PNG dönüşümü şu anda kullanılamıyor (sharp paketi yok). SVG'yi indirin.",
  });
}

// ─── Kartvizit ───────────────────────────────────────────────────────
router.get(
  "/kartvizit/svg",
  auth,
  requirePermission("kartvizit", "execute"),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const svg = await corporateService.generateKartvizitSVG(user);
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Content-Disposition", `inline; filename="kartvizit-${user.id}.svg"`);
    res.send(svg);
  })
);

router.get(
  "/kartvizit/png",
  auth,
  requirePermission("kartvizit", "execute"),
  asyncHandler(async (req, res) => {
    if (!corporateService.hasPng) return pngUnavailable(res);
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const svg = await corporateService.generateKartvizitSVG(user);
    const png = await corporateService.svgToPng(svg);
    res.setHeader("Content-Type", "image/png");
    res.send(png);
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
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.vcf"`);
    res.send(vcard);
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
