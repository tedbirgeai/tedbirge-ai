// TUR #100.9 P3 — Brand Tek-Kaynak (Madde 34) — public auth-free endpoint
// brand.json'dan okur, 5 dk cache. Footer + login + email base her sayfada gösterilir.

"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const BRAND_FILE_CANDIDATES = [
  path.join(__dirname, "..", "..", "tedbirge-os", "brand.json"),  // mono-repo
  path.join(__dirname, "..", "..", "..", "tedbirge-os", "brand.json"), // sibling
  path.join(__dirname, "..", "..", "brand.json"),                 // root fallback
];

const FALLBACK = {
  displayName: "Tedbirge.ai",
  legalName: "Tedbirge Bilgi Teknolojileri",
  tagline: "Türkiye'nin AI Destekli Hukuk Asistanı",
  shortTagline: "Hakkınızı Almak İçin Beklemeyin",
  brand: {
    primaryColor: "#1E1E8E",
    primaryColorHover: "#18187a",
    accentColor: "#22C55E",
    darkColor: "#0A1628",
    lightColor: "#F8FAFC",
    logoLight: "/logo.png",
    logoDark: "/logo-dark.png",
    favicon: "/favicon.ico",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  contact: {
    callCenter: "0850 303 3 724",
    directLine: "0541 203 16 09",
    whatsapp: "+905412031609",
    emails: { general: "bilgi@tedbirge.ai" },
  },
  address: { fullAddress: "Yunus Emre Mahallesi Gülşah Sokak No:20/A Meram/Konya" },
  social: {},
  marketing: { shortDescription: "", valueProps: [], ctaPrimary: "Ücretsiz Başvur" },
  compliance: { kvkk: "KVKK Uyumlu", iso27001: "ISO 27001 Hazırlığında", tbbReklamYasagi: "" },
  website: { primary: "https://www.tedbirge.ai", shortLink: "tedbirge.ai" },
};

let cached = null;
let lastReadTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

function loadBrand() {
  const now = Date.now();
  if (cached && now - lastReadTime < CACHE_TTL) return cached;

  for (const filePath of BRAND_FILE_CANDIDATES) {
    try {
      if (fs.existsSync(filePath)) {
        cached = JSON.parse(fs.readFileSync(filePath, "utf8"));
        lastReadTime = now;
        return cached;
      }
    } catch (err) {
      // sonraki adayı dene
    }
  }

  cached = FALLBACK;
  lastReadTime = now;
  return cached;
}

router.get("/", (req, res) => {
  res.json({ success: true, data: loadBrand() });
});

module.exports = router;
module.exports.loadBrand = loadBrand;
