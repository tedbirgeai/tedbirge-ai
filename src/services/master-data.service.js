// TUR #132.1 — Master Data Boot Seed (Madde 30.92 yeni)
//
// Sabit referans veri (sigorta sirketi listesi) tedbirge-os/data/*.json'da commit'li,
// boot sirasinda DB'ye senkronize edilir (idempotent upsert).
//
// Madde 30.61 — Tek kaynak (master data + DB tek senkron).
// Madde 4.6 — Mevcut kayitlar UPDATE (dataVersion farkliysa), yenisi CREATE.

"use strict";

const path = require("path");
const fs = require("fs");
const prisma = require("../config/db");

async function seedInsuranceCompanies() {
  const filePath = path.resolve(__dirname, "../../tedbirge-os/data/insurance-companies-v1.json");

  if (!fs.existsSync(filePath)) {
    console.warn("[master-data] insurance-companies-v1.json bulunamadi, seed atlandi:", filePath);
    return { seeded: 0, updated: 0, skipped: true };
  }

  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    console.warn("[master-data] JSON parse hatasi, seed atlandi:", err.message);
    return { seeded: 0, updated: 0, skipped: true, error: err.message };
  }

  const version = payload.version || "v1-2026";
  const companies = Array.isArray(payload.companies) ? payload.companies : [];

  let seeded = 0;
  let updated = 0;

  for (const c of companies) {
    if (!c?.name) continue;
    try {
      const existing = await prisma.insuranceCompany.findUnique({
        where: { name: c.name },
      });

      if (existing) {
        if (existing.dataVersion !== version) {
          await prisma.insuranceCompany.update({
            where: { id: existing.id },
            data: {
              shortName: c.shortName || null,
              kepAddress: c.kepAddress || null,
              email: c.email || null,
              phone: c.phone || null,
              address: c.address || null,
              policyPrefix: Array.isArray(c.policyPrefix) ? c.policyPrefix : [],
              dataVersion: version,
            },
          });
          updated++;
        }
      } else {
        await prisma.insuranceCompany.create({
          data: {
            name: c.name,
            shortName: c.shortName || null,
            kepAddress: c.kepAddress || null,
            email: c.email || null,
            phone: c.phone || null,
            address: c.address || null,
            policyPrefix: Array.isArray(c.policyPrefix) ? c.policyPrefix : [],
            dataVersion: version,
          },
        });
        seeded++;
      }
    } catch (err) {
      console.warn(`[master-data] ${c.name} seed hata: ${err.message}`);
    }
  }

  console.log(`[master-data] InsuranceCompany seed: +${seeded} yeni, ~${updated} guncellendi, version=${version}`);
  return { seeded, updated, version };
}

module.exports = { seedInsuranceCompanies };
