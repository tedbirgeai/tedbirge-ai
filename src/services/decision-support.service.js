/**
 * Decision Support Service — Temsilci karar destek fonksiyonları
 * AI entegrasyonu: 2026-04-19
 */

const prisma = require("../config/db");
const { calculateCompensationEngine } = require("./compensation.engine");

// ─── Zamanaşımı limitleri (gün) ──────────────────────────────────────────────
const ZAMANASIMI = {
  TRAFIK:           730,   // KTK m.109 — 2 yıl
  IS_KAZASI:        3650,  // SGK 5510 / BK m.146 — 10 yıl
  MESLEKI_HASTALIK: 3650,  // BK m.146 — 10 yıl (öğrenmeden itibaren)
};

/**
 * Zamanaşımı riski hesapla.
 * @param {string} accidentType - TRAFIK | IS_KAZASI | MESLEKI_HASTALIK
 * @param {string|Date} accidentDate - Kaza / olay tarihi
 * @returns {{ risk: string, kalanGun: number, mesaj: string }}
 */
function calculateZamanasimiRiski(accidentType, accidentDate) {
  const limitGun = ZAMANASIMI[accidentType] || ZAMANASIMI.TRAFIK;
  const baslangic = new Date(accidentDate);
  const bugun = new Date();

  if (isNaN(baslangic.getTime())) {
    return { risk: "GUVENLI", kalanGun: limitGun, mesaj: "Kaza tarihi geçersiz, lütfen kontrol edin." };
  }

  const gecenGun = Math.floor((bugun - baslangic) / (1000 * 60 * 60 * 24));
  const kalanGun = limitGun - gecenGun;

  if (kalanGun <= 0) {
    return {
      risk: "ASILDI",
      kalanGun: 0,
      mesaj: "Zamanaşımı süresi geçmiş. Dava açılamayabilir, avukat değerlendirmesi zorunludur.",
    };
  }
  if (kalanGun <= 30) {
    return {
      risk: "RISK",
      kalanGun,
      mesaj: `Acil: ${kalanGun} gün kaldı. Hızlı hareket gerekli, hemen avukata yönlendirin.`,
    };
  }
  if (kalanGun <= 90) {
    return {
      risk: "UYARI",
      kalanGun,
      mesaj: `Zamanaşımı yaklaşıyor: ${kalanGun} gün kaldı. Süreç başlatılmalı.`,
    };
  }
  return {
    risk: "GUVENLI",
    kalanGun,
    mesaj: `Zamanaşımı güvenli, ${kalanGun} gün kaldı.`,
  };
}

/**
 * TC Kimlik No doğrula (Türk algoritması).
 * @param {string} tc
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateTcKimlik(tc) {
  const s = String(tc || "").trim();

  if (s.length !== 11)    return { valid: false, reason: "TC 11 haneli olmalıdır." };
  if (!/^\d+$/.test(s))  return { valid: false, reason: "TC yalnızca rakam içermelidir." };
  if (s[0] === "0")       return { valid: false, reason: "TC ilk hanesi 0 olamaz." };

  const d = s.split("").map(Number);

  // 10. hane: (tek index toplamı × 7 - çift index toplamı) mod 10
  // Double modulo: JS'de negatif mod negatif kalır, +10 ile her zaman 0-9 garantilenir
  const tekToplam  = d[0] + d[2] + d[4] + d[6] + d[8];
  const ciftToplam = d[1] + d[3] + d[5] + d[7];
  const onuncuHane = (((tekToplam * 7) - ciftToplam) % 10 + 10) % 10;

  if (onuncuHane !== d[9]) {
    return { valid: false, reason: "TC geçersiz (10. hane doğrulaması başarısız)." };
  }

  // 11. hane: ilk 10 hanenin toplamının birler basamağı
  const toplamBirler = d.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
  if (toplamBirler !== d[10]) {
    return { valid: false, reason: "TC geçersiz (11. hane doğrulaması başarısız)." };
  }

  return { valid: true };
}

// Test TC'leri:
//   10000000146 — resmi test kimlik, geçerli olmalı
//   12345678901 — geçersiz
//   11111111111 — geçersiz (algoritma bozuk)

/**
 * Tahmini tazminat hesapla — compensation.engine.js ile entegre.
 * @param {{ age?, monthlyIncome?, gender?, maluliyetOrani? }} leadData
 * @param {string} [documentText]
 * @returns {{ min: number, max: number, guven: string, not: string, detail: object }}
 */
function estimateTazminat(leadData, documentText = "") {
  const result = calculateCompensationEngine({ lead: leadData, text: documentText });
  return {
    min: result.compensation.estimatedCompensationRange.min,
    max: result.compensation.estimatedCompensationRange.max,
    guven: result.legalRisk.fileStrengthLevel,
    not: result.professionalSummary,
    detail: result.compensation,
  };
}

/**
 * İl bazlı avukat uyumu sorgula.
 * AI entegrasyonu: il-bolge eşleşmesi ve mesafe hesabı sonraki aşamada.
 * Şimdilik bolge alanı substring kontrolüyle çalışıyor.
 * @param {string} il
 * @returns {Promise<{ uyumlu: boolean, uzmanSayisi: number, enYakinIl?: string, not: string }>}
 */
async function ilAvukatUyumu(il) {
  try {
    const uzmanSayisi = await prisma.user.count({
      where: {
        role: "LAWYER",
        baroOnayDurumu: "ONAYLANDI",
        bolge: { contains: il, mode: "insensitive" },
      },
    });

    if (uzmanSayisi > 0) {
      return {
        uyumlu: true,
        uzmanSayisi,
        not: `Bu bölgede ${uzmanSayisi} onaylı avukatımız bulunmaktadır.`,
      };
    }

    return {
      uyumlu: false,
      uzmanSayisi: 0,
      enYakinIl: "Konya",
      not: "Bu bölgede şu an onaylı avukatımız bulunmuyor. En yakın: Konya.",
    };
  } catch {
    return {
      uyumlu: false,
      uzmanSayisi: 0,
      not: "Avukat uyumu sorgulanamadı.",
    };
  }
}

module.exports = {
  calculateZamanasimiRiski,
  validateTcKimlik,
  estimateTazminat,
  ilAvukatUyumu,
};
