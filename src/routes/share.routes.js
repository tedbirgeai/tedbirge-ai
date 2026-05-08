// TUR #100.9 P9 — Web Share URL üretici (Madde 34.4 + Madde 24.14 — Sıfır API Maliyeti)
// Madde 25.3 R1 — LAWYER reklam/broşür paylaşımı YASAK + LinkedIn/X/FB elenir

"use strict";

const express = require("express");
const auth = require("../middlewares/authMiddleware");
const { requirePermission } = require("../middlewares/requirePermission");
const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/db");
const { loadBrand } = require("./brand.routes");

const router = express.Router();

router.post(
  "/urls",
  auth,
  requirePermission("paylasim", "execute"),
  asyncHandler(async (req, res) => {
    const { type, contentUrl, customText } = req.body;
    const validTypes = ["kartvizit", "brosur", "reklam", "website", "custom"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Geçersiz type: ${type}. Kabul edilen: ${validTypes.join(", ")}`,
      });
    }

    const brand = loadBrand();
    const role = req.user.role;

    // Madde 25.3 R1 — LAWYER için reklam/broşür yasak
    if (role === "LAWYER" && (type === "reklam" || type === "brosur")) {
      return res.status(403).json({
        success: false,
        code: "TBB_REKLAM_YASAGI",
        message:
          "Avukatlık K. m.55 ve TBB Reklam Yasağı gereği avukatlar reklam veya broşür paylaşımı yapamaz. Sadece kartvizit paylaşımı izinlidir.",
      });
    }

    // İçerik hazırla
    const userName = req.user.fullName || req.user.adSoyad || req.user.name || "";
    const messages = {
      kartvizit: customText || `${userName} - ${brand.displayName} iletişim kartım`,
      brosur: customText || `${brand.displayName} - ${brand.shortTagline}`,
      reklam: customText || `${brand.displayName} - ${brand.shortTagline}`,
      website: customText || brand.tagline,
      custom: customText || "",
    };

    const text = messages[type] || messages.custom || "";
    const url = contentUrl || brand.website.primary;
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);
    const encodedFull = encodeURIComponent(`${text} ${url}`);

    // Web Share URL'leri (hepsi sıfır maliyet — Madde 24.14)
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodedFull}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      email: `mailto:?subject=${encodeURIComponent(brand.displayName)}&body=${encodedFull}`,
      sms: `sms:?body=${encodedFull}`,
    };

    // Madde 25.3 R1 — LAWYER için kişisel reklam riski olan kanallar elenir
    if (role === "LAWYER") {
      delete shareUrls.linkedin;
      delete shareUrls.facebook;
      delete shareUrls.twitter;
    }

    const nativeShare = { title: brand.displayName, text, url };

    // ActivityLog (KVKK m.10 izlenebilirlik)
    try {
      await prisma.activityLog.create({
        data: {
          action: "SHARE_URL_GENERATED",
          detail: `userId:${req.user.id} role:${role} type:${type} channels:${Object.keys(shareUrls).join(",")}`,
        },
      });
    } catch (_) {
      // ActivityLog kritik değil
    }

    res.json({
      success: true,
      data: {
        nativeShare,
        urls: shareUrls,
        copyText: `${text} ${url}`,
      },
    });
  })
);

module.exports = router;
