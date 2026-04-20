/**
 * Tazminat Motoru v2.1 — Gerçek Aktüer Formüller
 *
 * Bu dosya, mevcut compensation.engine.js'i değiştirmez. Paralel çalışır,
 * zaman içinde migration ile eskisinin yerini alır.
 *
 * BAĞIMLILIKLAR (tamamı hazır):
 * - src/data/zmss-limits.js                        ✓
 * - src/services/maluliyet.yonetmelik.selector.js  ✓
 * - src/services/zamanasimi.service.js              ✓
 * - src/constants/disclaimers.js                   ✓
 * - src/data/yasam-tablolari.js                    ✓
 * - src/services/aktif-pasif-donem.js              ✓
 * - src/services/kalem-hesaplari.js                ✓ (104 test PASS)
 *
 * TODO Faz 2: Senaryolar için ayrı input varyantları ile 3 hesap çalıştır
 * (şu an basit çarpan yaklaşımı: ×1.25 / ×1.00 / ×0.70)
 */

const { getZMSSLimitsByDate, checkZMSSAsimi } = require("../data/zmss-limits");
const {
  selectYonetmelik,
  validateRaporYonetmelik,
  balthazardFormulu,
} = require("./maluliyet.yonetmelik.selector");
const { hesaplaZamanasimi } = require("./zamanasimi.service");
const {
  TAZMINAT_DISCLAIMER,
  BILIRKISI_YERINE_GECMEZ,
  MULUYET_AI_TAHMIN_UYARISI,
  KUSUR_AI_TAHMIN_UYARISI,
} = require("../constants/disclaimers");
const { hesaplaTumKalemler } = require("./kalem-hesaplari");

/**
 * Ana tazminat hesaplama fonksiyonu.
 *
 * @param {Object} input
 * @param {Object} input.kaza    - { tarihi, yeri, tipi: "trafik"|"is"|"malpraktis" }
 * @param {Object} input.magdur  - { dogumTarihi, cinsiyet: "K"|"E", gelir: {tutar, belgeli} }
 * @param {Object} input.sonuc   - { durum: "yaralanma"|"olum"|"maluliyet", maluliyetOrani: {deger, mod}, tedaviSuresiGun, sagGideri, atkBakicaMuhtac }
 * @param {Object} input.kusur   - { magdurKusuru: 0-100, karsiTarafKusuru: 0-100, kaynak }
 * @param {Object} input.sigorta - { mevcutOdeme }
 * @param {Object} [input.aile]  - { es, cocuklar, anneVarMi, babaVarMi } (ölümlü davalar)
 *
 * @returns {Object} Tam hesap sonucu + kalem döküm + uyarılar + disclaimer
 */
function calculateCompensationV2(input) {
  validateInput(input);

  const yas = hesaplaYas(input.magdur.dogumTarihi, input.kaza.tarihi);
  const cinsiyet = input.magdur.cinsiyet;

  // 1. ZMSS LİMİTLERİ
  const zmss = getZMSSLimitsByDate(input.kaza.tarihi);

  // 2. MALULİYET YÖNETMELİĞİ
  const yonetmelik = selectYonetmelik(input.kaza.tarihi);

  // 3. ZAMANAŞIMI
  const zamanasimiDurum =
    input.sonuc.durum === "maluliyet" ? "yaralanma" : input.sonuc.durum;
  const zamanasimi = hesaplaZamanasimi(
    input.kaza.tarihi,
    zamanasimiDurum,
    input.sonuc.maluliyetKesinlesme || null
  );

  // 4. UYARILAR
  const uyarilar = [];

  if (zamanasimi.uyari) {
    uyarilar.push({ tip: "ZAMANASIMI", seviye: zamanasimi.uyariSeviyesi, mesaj: zamanasimi.uyari });
  }
  if (input.sonuc.maluliyetOrani?.mod === "B") {
    uyarilar.push({ tip: "MALULIYET_AI", seviye: "KRITIK", mesaj: MULUYET_AI_TAHMIN_UYARISI });
  }
  if (input.kusur?.kaynak === "ai_oneri") {
    uyarilar.push({ tip: "KUSUR_AI", seviye: "DIKKAT", mesaj: KUSUR_AI_TAHMIN_UYARISI });
  }

  // 5. KALEM HESAPLARI — gerçek aktüer formüller (kalem-hesaplari.js)
  const kalemSonuc = hesaplaKalemlerAdapter(input, yas, cinsiyet);
  const kalemler   = kalemSonuc.kalemler;
  const brutToplam = kalemSonuc.toplam;

  // 6. MÜTERAFİK KUSUR İNDİRİMİ (TBK m.52)
  const muterafikOran   = input.kusur?.magdurKusuru || 0;
  const muterafikIndirim = brutToplam * (muterafikOran / 100);
  const netToplam        = brutToplam - muterafikIndirim;

  // 7. MEVCUT ÖDEME DÜŞÜMÜ
  const finalToplam = Math.max(0, netToplam - (input.sigorta?.mevcutOdeme || 0));

  // 8. ZMSS AŞIM KONTROLÜ
  const zmssKontrol = checkZMSSAsimi(finalToplam, input.kaza.tarihi);
  if (zmssKontrol.asar) {
    uyarilar.push({ tip: "ZMSS_ASIM", seviye: "DIKKAT", mesaj: zmssKontrol.uyari });
  }

  // 9. SENARYOLAR — basit çarpan (Faz 1)
  // TODO Faz 2: Her senaryo için ayrı input varyantı ile 3 bağımsız hesap çalıştır
  const senaryolar = {
    iyimser: {
      toplam: Math.round(finalToplam * 1.25),
      varsayimlar: ["Karşı taraf %100 kusurlu", "Maluliyet üst sınır", "Gelir tam belgeli"],
      olasılık: "%20-30",
    },
    gercekci: {
      toplam: Math.round(finalToplam),
      varsayimlar: ["Mevcut veriye göre ortalama tahmin"],
      olasılık: "%50-60",
    },
    kotumser: {
      toplam: Math.round(finalToplam * 0.70),
      varsayimlar: ["Müterafik kusur %20-30", "Maluliyet tartışılır", "Manevi düşük takdir"],
      olasılık: "%15-25",
    },
  };

  return {
    input: {
      yas,
      cinsiyet,
      kazaTarihi: input.kaza.tarihi,
    },

    mevzuat: {
      zmssLimitYili: zmss.yil,
      zmssBedeniKisi: zmss.bedeni_kisi,
      maluliyetYonetmeligi: yonetmelik,
      zamanasimi,
    },

    // Nesne bazlı kalem döküm — formül + kaynak atıfı dahil
    kalemler,

    hesap: {
      brutToplam,
      muterafikKusurOrani: muterafikOran,
      muterafikIndirim,
      netToplamKusurSonrasi: netToplam,
      mevcutOdemeDusumu: input.sigorta?.mevcutOdeme || 0,
      finalToplam,
      formul: `${brutToplam} - (${brutToplam} × ${muterafikOran}/100) - ${input.sigorta?.mevcutOdeme || 0} = ${finalToplam}`,
    },

    senaryolar,
    zmssKontrol,
    uyarilar,
    disclaimer: TAZMINAT_DISCLAIMER,
    bilirkisiYerineGecmez: BILIRKISI_YERINE_GECMEZ,
    hesaplanmaTarihi: new Date().toISOString(),
    motorVersiyonu: "v2.1",
  };
}

// ═══════════════════════════════════════════════════════════════
// ADAPTER — v2 input şemasını kalem-hesaplari.js formatına çevirir
// ═══════════════════════════════════════════════════════════════

function hesaplaKalemlerAdapter(input, yas, cinsiyet) {
  // dogumTarihi'yi yas'tan türet — v2 de aynı yöntemi kullanıyor, tutarlı
  const dogumTarihi = new Date(input.kaza.tarihi);
  dogumTarihi.setFullYear(dogumTarihi.getFullYear() - yas);

  const adaptedInput = {
    kaza: {
      tarihi: input.kaza.tarihi,
      tipi:   input.kaza.tipi,
    },
    magdur: {
      dogumTarihi: dogumTarihi.toISOString(),
      cinsiyet,
      gelir: input.magdur.gelir,
    },
    sonuc: {
      durum:           input.sonuc.durum,
      maluliyetOrani:  input.sonuc.maluliyetOrani,
      tedaviSuresiGun: input.sonuc.tedaviSuresiGun,
      sagGideri:       input.sonuc.sagGideri,
      atkBakicaMuhtac: input.sonuc.atkBakicaMuhtac,
    },
    aile: input.aile || {},
  };

  return hesaplaTumKalemler(adaptedInput);
}

// ═══════════════════════════════════════════════════════════════
// YARDIMCI FONKSİYONLAR
// ═══════════════════════════════════════════════════════════════

function validateInput(input) {
  if (!input.kaza?.tarihi)          throw new Error("kaza.tarihi zorunlu");
  if (!input.magdur?.dogumTarihi)   throw new Error("magdur.dogumTarihi zorunlu");
  if (!["K", "E"].includes(input.magdur.cinsiyet))
    throw new Error("magdur.cinsiyet 'K' veya 'E' olmalı");
  if (!["yaralanma", "olum", "maluliyet", "maddi"].includes(input.sonuc?.durum))
    throw new Error("sonuc.durum geçersiz");
}

function hesaplaYas(dogumTarihi, referansTarihi) {
  const d = new Date(dogumTarihi);
  const r = new Date(referansTarihi);
  let yas = r.getFullYear() - d.getFullYear();
  const m = r.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && r.getDate() < d.getDate())) yas--;
  return yas;
}

module.exports = {
  calculateCompensationV2,
  hesaplaYas,
};
