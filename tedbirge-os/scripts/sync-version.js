#!/usr/bin/env node
"use strict";

/**
 * TUR #100.8 P5 — Sürüm Tek-Kaynak Senkron (Madde 22.8)
 *
 * tedbirge-os/version.json TEK KAYNAĞINDAN tüm package.json'ları senkronize eder.
 * Anayasa bump'ında manuel çalıştırılır:
 *   node tedbirge-os/scripts/sync-version.js
 */

const fs = require("fs");
const path = require("path");

const VERSION_FILE = path.join(__dirname, "..", "version.json");

// Mono-repo setup: tedbirge.ai/{tedbirge-os, tedbirge-panel, package.json (root)}
const TARGETS = [
  {
    file: path.join(__dirname, "..", "..", "package.json"), // root tedbirge-ai backend
    versionKey: "backend",
    label: "tedbirge-ai (backend)",
  },
  {
    file: path.join(__dirname, "..", "..", "tedbirge-panel", "package.json"),
    versionKey: "panel",
    label: "tedbirge-panel",
  },
];

function syncVersions() {
  if (!fs.existsSync(VERSION_FILE)) {
    console.error(`❌ version.json bulunamadı: ${VERSION_FILE}`);
    process.exit(1);
  }

  const versionData = JSON.parse(fs.readFileSync(VERSION_FILE, "utf8"));
  console.log(`📦 version.json yüklendi:`);
  console.log(`   anayasa: ${versionData.anayasa}`);
  console.log(`   backend: ${versionData.backend}`);
  console.log(`   panel:   ${versionData.panel}`);
  console.log("");

  let changed = 0;
  let synced = 0;

  for (const target of TARGETS) {
    if (!fs.existsSync(target.file)) {
      console.warn(`⚠️  Bulunamadı (skip): ${target.label}`);
      continue;
    }

    const pkg = JSON.parse(fs.readFileSync(target.file, "utf8"));
    const oldVersion = pkg.version;
    const newVersion = versionData[target.versionKey];

    if (oldVersion === newVersion) {
      console.log(`✅ ${target.label}: ${oldVersion} (zaten senkron)`);
      synced++;
      continue;
    }

    pkg.version = newVersion;
    fs.writeFileSync(target.file, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`🔄 ${target.label}: ${oldVersion} → ${newVersion}`);
    changed++;
  }

  console.log("");
  console.log(`🎉 Sürüm senkronu tamam: ${changed} güncellendi, ${synced} zaten senkron`);
}

if (require.main === module) {
  try {
    syncVersions();
  } catch (err) {
    console.error("❌ Senkron hatası:", err);
    process.exit(1);
  }
}

module.exports = { syncVersions };
