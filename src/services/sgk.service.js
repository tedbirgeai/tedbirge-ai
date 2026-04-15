const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");

/**
 * SGK (Sosyal Güvenlik Kurumu) entegrasyonu — MOCK
 *
 * Gerçek SGK e-Bildirge API entegrasyonu hazır olduğunda bu fonksiyonlar
 * gerçek API çağrılarıyla değiştirilecek.
 */

const MOCK_ISVERENLER = [
  "ABC Lojistik A.Ş.",
  "Yıldız İnşaat Ltd. Şti.",
  "Metro Taşımacılık A.Ş.",
  "Anadolu Gıda San. ve Tic. A.Ş.",
  "Karadeniz Madencilik Ltd. Şti.",
  "Güneş Tekstil A.Ş.",
  "Marmara Demir Çelik San. A.Ş.",
  "Koç Holding A.Ş.",
];

const MOCK_MESLEKLER = [
  "Şoför",
  "İnşaat İşçisi",
  "Fabrika Operatörü",
  "Depo Görevlisi",
  "Maden İşçisi",
  "Tekstil Operatörü",
  "Çelik Fabrikası İşçisi",
  "Yönetici",
];

function deterministicIndex(str, arrayLen) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash % arrayLen;
}

function generateMockSgkData(lead) {
  const seed = lead.id;

  const isverenIdx = deterministicIndex(seed + "isv", MOCK_ISVERENLER.length);
  const meslekIdx  = deterministicIndex(seed + "mes", MOCK_MESLEKLER.length);

  const sonIsveren = MOCK_ISVERENLER[isverenIdx];
  const meslek     = MOCK_MESLEKLER[meslekIdx];

  // Sigortalılık başlangıç tarihi: kazadan 2-8 yıl önce
  const kazaTarihi = lead.accidentDate ? new Date(lead.accidentDate) : new Date();
  const yilOffset  = 2 + deterministicIndex(seed + "yil", 6);
  const sigortaBaslangic = new Date(kazaTarihi);
  sigortaBaslangic.setFullYear(sigortaBaslangic.getFullYear() - yilOffset);

  // Prim gün sayısı
  const primGunSayisi = 365 * yilOffset + deterministicIndex(seed + "gun", 365);

  // Aylık net ücret (5.000 - 35.000 TL arası)
  const ucretBase = 5000;
  const ucretRange = 30000;
  const maasKatsayi = deterministicIndex(seed + "maas", 1000) / 1000;
  const aylikMaas   = Math.round((ucretBase + ucretRange * maasKatsayi) / 100) * 100;

  // Günlük kazanç (SGK hesaplamasında kullanılan)
  const gunlukKazanc = Math.round(aylikMaas / 30);

  // Maluliyet oranı (iş kazası dosyaları için)
  const maluliyetOrani = lead.accidentType === "IS_KAZASI"
    ? deterministicIndex(seed + "mal", 40) + 10  // %10 - %49
    : null;

  return {
    sigortalilikBaslangic: sigortaBaslangic.toISOString(),
    sonIsveren,
    meslek,
    aylikMaas,
    gunlukKazanc,
    primGunSayisi,
    maluliyetOrani,
    sgkSicilNo: `${34 + deterministicIndex(seed + "sgk", 66)}-${String(deterministicIndex(seed + "no", 9999999)).padStart(7, "0")}`,
    kaynak: "SGK Mock (Gerçek e-Bildirge API entegre edilmedi)",
    sorguTarihi: new Date().toISOString(),
  };
}

async function getSgkData(leadId) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      customerName: true,
      accidentType: true,
      accidentDate: true,
      status: true,
    },
  });

  if (!lead) throw new ApiError(404, "Lead bulunamadı");

  return generateMockSgkData(lead);
}

module.exports = { getSgkData };
