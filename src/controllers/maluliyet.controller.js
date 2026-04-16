const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/db");
const { hesaplaTazminat, AMA_TABLO } = require("../services/maluliyet.service");
const { assertLeadAccess } = require("../utils/leadAccess");

// AMA yaralanma türleri listesi
exports.getYaralanmaTurleri = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: AMA_TABLO });
});

// Lead için tazminat hesapla (verileri geçici — kaydetmez)
exports.hesapla = asyncHandler(async (req, res) => {
  const { yas, aylikGelir, maluliyetOrani, kusurOrani, yaralanmaTuru, olumDavasi } = req.body;

  const sonuc = hesaplaTazminat({
    yas:             Number(yas) || 35,
    aylikGelir:      Number(aylikGelir) || 22104,
    maluliyetOrani:  Number(maluliyetOrani) || 0,
    kusurOrani:      Number(kusurOrani) || 0,
    yaralanmaTuru:   yaralanmaTuru || null,
    olumDavasi:      Boolean(olumDavasi),
  });

  res.json({ success: true, data: sonuc });
});

// Lead'in maluliyet/kusur/tazminat değerlerini güncelle + kaydet
exports.updateLeadMaluliyet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { maluliyetOrani, kusurOrani, yaralanmaTuru, gercekTazminat } = req.body;

  const lead = await prisma.lead.findUnique({ where: { id }, include: { assignments: true } });
  if (!lead) return res.status(404).json({ success: false, message: "Lead bulunamadı." });

  await assertLeadAccess(req.user, lead);

  // Eğer tutar girilmemişse otomatik hesapla
  let tazminat = gercekTazminat ? Number(gercekTazminat) : null;
  if (!tazminat && maluliyetOrani != null) {
    const sonuc = hesaplaTazminat({
      yas:            lead.age || 35,
      aylikGelir:     lead.monthlyIncome || 22104,
      maluliyetOrani: Number(maluliyetOrani),
      kusurOrani:     Number(kusurOrani) || 0,
      yaralanmaTuru:  yaralanmaTuru || lead.yaralanmaTuru,
      olumDavasi:     lead.accidentType === "olum",
    });
    tazminat = sonuc.netTazminat;
  }

  const updated = await prisma.lead.update({
    where: { id },
    data: {
      ...(maluliyetOrani != null && { maluliyetOrani: Number(maluliyetOrani), maluliyetRate: Number(maluliyetOrani) }),
      ...(kusurOrani     != null && { kusurOrani: Number(kusurOrani), faultRate: Number(kusurOrani) }),
      ...(yaralanmaTuru  && { yaralanmaTuru }),
      ...(tazminat       && { gercekTazminat: tazminat, estimatedCompensation: tazminat }),
    },
    select: { id: true, maluliyetOrani: true, kusurOrani: true, yaralanmaTuru: true, gercekTazminat: true, estimatedCompensation: true },
  });

  await prisma.activityLog.create({
    data: {
      leadId: id,
      action: "MALULIYET_GUNCELLENDI",
      detail: `Maluliyet: %${Math.round((Number(maluliyetOrani) || 0) * 100)}, Kusur: %${Math.round((Number(kusurOrani) || 0) * 100)}, Tazminat: ${tazminat?.toLocaleString("tr-TR")} TL`,
    },
  });

  res.json({ success: true, data: updated });
});
