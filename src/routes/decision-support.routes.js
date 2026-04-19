const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const ds = require("../services/decision-support.service");
const asyncHandler = require("../utils/asyncHandler");

// POST /api/decision-support/zamanasimi
router.post("/zamanasimi", auth, asyncHandler(async (req, res) => {
  const { accidentType, accidentDate } = req.body;
  const sonuc = ds.calculateZamanasimiRiski(accidentType, accidentDate);
  res.json({ success: true, data: sonuc });
}));

// POST /api/decision-support/validate-tc
router.post("/validate-tc", auth, asyncHandler(async (req, res) => {
  const { tc } = req.body;
  const sonuc = ds.validateTcKimlik(tc);
  res.json({ success: true, data: sonuc });
}));

// POST /api/decision-support/il-uyumu
router.post("/il-uyumu", auth, asyncHandler(async (req, res) => {
  const { il } = req.body;
  const sonuc = await ds.ilAvukatUyumu(il);
  res.json({ success: true, data: sonuc });
}));

// POST /api/decision-support/tazminat
router.post("/tazminat", auth, asyncHandler(async (req, res) => {
  const { lead = {}, documentText = "" } = req.body;
  const sonuc = ds.estimateTazminat(lead, documentText);
  res.json({ success: true, data: sonuc });
}));

// POST /api/decision-support/tazminat-v2
router.post("/tazminat-v2", auth, asyncHandler(async (req, res) => {
  const { calculateCompensationV2 } = require("../services/compensation.engine.v2");
  const { lead = {} } = req.body;

  if (!lead.accidentDate) {
    return res.status(400).json({ success: false, error: "accidentDate zorunlu" });
  }

  const uyarilar = [];

  // dogumTarihi türet
  let dogumTarihi;
  if (lead.age) {
    dogumTarihi = new Date(lead.accidentDate);
    dogumTarihi.setFullYear(dogumTarihi.getFullYear() - lead.age);
  } else {
    dogumTarihi = new Date(lead.accidentDate);
    dogumTarihi.setFullYear(dogumTarihi.getFullYear() - 35);
    uyarilar.push({ tip: "EKSIK_VERİ", seviye: "DIKKAT", mesaj: "Yaş bilgisi yok, 35 varsayıldı." });
  }

  // cinsiyet
  uyarilar.push({ tip: "EKSIK_VERİ", seviye: "BILGI", mesaj: "Cinsiyet bilgisi yok, erkek varsayıldı. Kadınsa emeklilik yaşı 60 olmalı." });

  const input = {
    kaza: {
      tarihi: lead.accidentDate,
      tipi: lead.accidentType === "IS_KAZASI" ? "is" : "trafik",
    },
    magdur: {
      dogumTarihi: dogumTarihi.toISOString(),
      cinsiyet: "E",
      gelir: {
        tutar: lead.monthlyIncome || 26005,
        belgeli: !!lead.monthlyIncome,
      },
    },
    sonuc: {
      durum: "yaralanma",
      maluliyetOrani: { deger: 0, mod: "B" },
      tedaviSuresiGun: 0,
      sagGideri: 0,
    },
    kusur: { magdurKusuru: 0, karsiTarafKusuru: 100, kaynak: "ai_oneri" },
    sigorta: { mevcutOdeme: 0 },
  };

  if (!lead.monthlyIncome) {
    uyarilar.push({ tip: "EKSIK_VERİ", seviye: "DIKKAT", mesaj: `Gelir bilgisi yok, 2026 asgari ücret (${(26005).toLocaleString("tr-TR")} TL) varsayıldı.` });
  }

  const sonuc = calculateCompensationV2(input);
  sonuc.uyarilar = [...uyarilar, ...(sonuc.uyarilar || [])];

  res.json({ success: true, data: sonuc });
}));

module.exports = router;
