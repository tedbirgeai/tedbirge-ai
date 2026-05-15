// TUR #132.1 — Lead Tahmin Hesabi Yeniden Hesaplama (Madde 30.90 Saha Vaadi)
//
// AI merge sonrasi Lead.estimatedCompensation yeniden hesaplanir.
// Madde 30.82 — Senaryo Analizi motor reuse (frontend yaralanmaHesap.ts emsali).
// Veri yetersizse Madde 30.90 — gercek deger yoksa null yaz, defaultValue 221.240 YASAK.

"use strict";

const prisma = require("../config/db");

// Asgari ucret 2026 brut (Madde 30.92 master data adayi — ayri dosya gelecek TUR)
const ASGARI_UCRET_BRUT_2026 = 26005;

/**
 * Basit aktuer hesabi — TRH-2010 PMF emsali (kisa versiyon).
 * Tam motor frontend'de var (tedbirge-panel/lib/yaralanmaHesap.ts).
 * Madde 30.61 birlestirme TUR #133+ DEFER.
 *
 * @param {object} input - { yas, aylikGelir, maluliyet, kusur }
 * @returns {object|null} - { base, min, max, inputs } veya null (veri eksik)
 */
function hesaplaYaralanmaTazminati({ yas, aylikGelir, maluliyet, kusur = 0 }) {
  if (!yas || !maluliyet) return null;

  const gelir = aylikGelir || ASGARI_UCRET_BRUT_2026;
  const calismaYili = Math.max(0, 65 - Number(yas));
  const maluliyetOrani = Math.min(100, Math.max(0, Number(maluliyet))) / 100;
  const kusurOrani = Math.min(100, Math.max(0, Number(kusur))) / 100;

  const yillikGelir = gelir * 12;
  const toplamGelir = yillikGelir * calismaYili;
  const bedenselTazminat = toplamGelir * maluliyetOrani * (1 - kusurOrani);

  return {
    base: Math.round(bedenselTazminat),
    min: Math.round(bedenselTazminat * 0.85),
    max: Math.round(bedenselTazminat * 1.15),
    inputs: { yas, gelir, maluliyet, kusur, calismaYili },
  };
}

/**
 * Lead'in estimatedCompensation alani AI verisinden yeniden hesaplanir.
 * Madde 30.90: yas + maluliyet eksikse null yaz (sabit defaultValue YASAK).
 */
async function recalculateEstimation(leadId) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      age: true,
      monthlyIncome: true,
      maluliyetRate: true,
      maluliyetOrani: true,
      faultRate: true,
      kusurOrani: true,
      estimatedCompensation: true,
    },
  });

  if (!lead) return null;

  const yas = lead.age;
  // maluliyet 0-1 (Float) veya 0-100 (Int) olabilir — normalize
  let maluliyet = null;
  if (lead.maluliyetOrani != null) {
    maluliyet = Number(lead.maluliyetOrani);
    // Eger 0-1 araliginda gelirse 100 ile carpilir
    if (maluliyet > 0 && maluliyet <= 1) maluliyet = maluliyet * 100;
  } else if (lead.maluliyetRate != null) {
    maluliyet = Number(lead.maluliyetRate);
    if (maluliyet > 0 && maluliyet <= 1) maluliyet = maluliyet * 100;
  }

  // Veri yetersiz → null (Madde 30.90 defaultValue YASAK)
  if (!yas || !maluliyet) {
    if (lead.estimatedCompensation != null) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { estimatedCompensation: null },
      });
    }
    return null;
  }

  const aylikGelir = lead.monthlyIncome || ASGARI_UCRET_BRUT_2026;
  let kusur = 0;
  if (lead.kusurOrani != null) {
    kusur = Number(lead.kusurOrani);
    if (kusur > 0 && kusur <= 1) kusur = kusur * 100;
  } else if (lead.faultRate != null) {
    kusur = Number(lead.faultRate);
    if (kusur > 0 && kusur <= 1) kusur = kusur * 100;
  }

  const result = hesaplaYaralanmaTazminati({ yas, aylikGelir, maluliyet, kusur });

  if (!result) {
    return null;
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: { estimatedCompensation: result.base },
  });

  await prisma.activityLog.create({
    data: {
      leadId,
      action: "LEAD_ESTIMATION_RECALCULATED",
      detail: `base:${result.base} maluliyet:${maluliyet} kusur:${kusur} yas:${yas}`,
    },
  }).catch(() => {});

  return result;
}

module.exports = { recalculateEstimation, hesaplaYaralanmaTazminati };
