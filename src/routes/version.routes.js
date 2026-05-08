// TUR #100.8 P4 — Sürüm Tek-Kaynak (Madde 22.8) — public auth-free endpoint
// version.json'dan okur, 1 dk cache. Footer her sayfada gösterilir, auth gerek yok.

"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// version.json yolu — mono-repo: tedbirge.ai/tedbirge-os/version.json
const VERSION_FILE_CANDIDATES = [
  path.join(__dirname, "..", "..", "tedbirge-os", "version.json"),  // mono-repo (bizim setup)
  path.join(__dirname, "..", "..", "..", "tedbirge-os", "version.json"), // sibling repo
  path.join(__dirname, "..", "..", "version.json"),                 // root fallback
];

const FALLBACK = {
  anayasa: "unknown",
  backend: process.env.npm_package_version || "1.0.0",
  panel: "unknown",
  schema: "unknown",
  buildDate: new Date().toISOString().slice(0, 10),
  compliance: [
    { label: "KVKK Uyumlu", url: "/kvkk-aydinlatma", status: "active" },
    { label: "ISO 27001 Hazırlığında", url: null, status: "in-progress" },
  ],
  displayName: "Tedbirge OS",
  company: "Tedbirge.ai",
  copyright: "© 2026 Tedbirge.ai · Tüm hakları saklıdır",
  tagline: "Bağımsız + Ücretsiz + Profesyonel",
};

let cachedVersion = null;
let lastReadTime = 0;
const CACHE_TTL = 60 * 1000; // 1 dk

function loadVersion() {
  const now = Date.now();
  if (cachedVersion && now - lastReadTime < CACHE_TTL) {
    return cachedVersion;
  }

  for (const filePath of VERSION_FILE_CANDIDATES) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        cachedVersion = JSON.parse(content);
        lastReadTime = now;
        return cachedVersion;
      }
    } catch (err) {
      // sonraki adayı dene
    }
  }

  cachedVersion = FALLBACK;
  lastReadTime = now;
  return cachedVersion;
}

// Public endpoint — auth gerek yok (footer her sayfada gösterilir)
router.get("/", (req, res) => {
  const version = loadVersion();
  res.json({
    success: true,
    data: version,
  });
});

// Backend modüllerinin doğrudan erişimi için export
module.exports = router;
module.exports.loadVersion = loadVersion;
