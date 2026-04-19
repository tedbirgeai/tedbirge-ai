/**
 * Tazminat Motoru v2 — İskelet (Skeleton)
 *
 * Bu dosya, mevcut compensation.engine.js'i değiştirmez. Yeni bir dosya olarak gelir,
 * zaman içinde migration ile eskisinin yerini alır.
 *
 * BAĞIMLILIKLAR (hazır):
 * - src/data/zmss-limits.js              ✓ Yazıldı
 * - src/services/maluliyet.yonetmelik.selector.js  ✓ Yazıldı
 * - src/services/zamanasimi.service.js   ✓ Yazıldı
 * - src/constants/disclaimers.js         ✓ Yazıldı
 *
 * EKSİKLER (Claude Code'un yarın tamamlayacağı):
 * - src/data/yasam-tablolari.js (PMF 1931 + TRH 2010)  ⏳
 * - src/services/aktif-pasif-donem.js                  ⏳
 * - src/services/kalem-hesaplari.js (6 tazminat kalemi) ⏳
 * - src/services/senaryo-uretici.js (iyimser/gerçekçi/kötümser) ⏳
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

/**
 * Ana tazminat hesaplama fonksiyonu.
 *
 * @param {Object} input
 * @param {Object} input.kaza - { tarihi, yeri, tipi: "trafik"|"is"|"malpraktis" }
 * @param {Object} input.magdur - { dogumTarihi, cinsiyet: "K"|"E", medeniHal, meslek, gelir: {tutar, belgeli}, bakmaklaYukumluler: [] }
 * @param {Object} input.sonuc - { durum: "yaralanma"|"olum"|"maluliyet", maluliyetOrani: {deger, mod: "A"|"B"}, tedaviSuresiGun, sagGideri }
 * @param {Object} input.kusur - { magdurKusuru: 0-100, karsiTarafKusuru: 0-100, kaynak: "tutanak"|"bilirkisi"|"ai_oneri" }
 * @param {Object} input.sigorta - { mevcutOdeme }
 *
 * @returns {Object} Tam hesap sonucu + uyarılar + disclaimer
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
  // NOT: "maluliyet" durumu zamanaşımı açısından "yaralanma" gibi işler (TCK m.89)
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

  // 5. KALEM HESAPLARI (iskelet — tam implementasyon yarın)
  const kalemler = hesaplaKalemler(input, yas, cinsiyet);

  // 6. MÜTERAFİK KUSUR İNDİRİMİ (TBK m.52)
  const brutToplam =
    kalemler.tedaviGideri +
    kalemler.geciciIsGoremezlik +
    kalemler.surekliMaluliyetTazminati +
    kalemler.destektenYoksunKalma +
    kalemler.manevi +
    kalemler.bakiciGideri;

  const muterafikOran = input.kusur?.magdurKusuru || 0;
  const muterafikIndirim = brutToplam * (muterafikOran / 100);
  const netToplam = brutToplam - muterafikIndirim;

  // 7. MEVCUT ÖDEME DÜŞÜMÜ
  const finalToplam = Math.max(0, netToplam - (input.sigorta?.mevcutOdeme || 0));

  // 8. ZMSS ASIM KONTROLÜ
  const zmssKontrol = checkZMSSAsimi(finalToplam, input.kaza.tarihi);
  if (zmssKontrol.asar) {
    uyarilar.push({ tip: "ZMSS_ASIM", seviye: "DIKKAT", mesaj: zmssKontrol.uyari });
  }

  // 9. SENARYOLAR (iskelet — tam implementasyon yarın)
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
      toplam: Math.round(finalToplam * 0.7),
      varsayimlar: ["Müterafik kusur artabilir", "Maluliyet tartışılır", "Manevi düşük takdir"],
      olasılık: "%15-25",
    },
  };

  return {
    // Girdi özeti
    input: {
      yas,
      cinsiyet,
      kazaTarihi: input.kaza.tarihi,
    },

    // Mevzuat tespitleri
    mevzuat: {
      zmssLimitYili: zmss.yil,
      zmssBedeniKisi: zmss.bedeni_kisi,
      maluliyetYonetmeligi: yonetmelik,
      zamanasimi,
    },

    // Kalem bazlı döküm
    kalemler,

    // Toplam hesap zinciri
    hesap: {
      brutToplam,
      muterafikKusurOrani: muterafikOran,
      muterafikIndirim,
      netToplamKusurSonrasi: netToplam,
      mevcutOdemeDusumu: input.sigorta?.mevcutOdeme || 0,
      finalToplam,
      formul: `${brutToplam} - (${brutToplam} × ${muterafikOran}/100) - ${input.sigorta?.mevcutOdeme || 0} = ${finalToplam}`,
    },

    // Senaryolar
    senaryolar,

    // Kontroller
    zmssKontrol,

    // Uyarılar
    uyarilar,

    // Zorunlu disclaimer
    disclaimer: TAZMINAT_DISCLAIMER,
    bilirkisiYerineGecmez: BILIRKISI_YERINE_GECMEZ,

    // Meta
    hesaplanmaTarihi: new Date().toISOString(),
    motorVersiyonu: "v2-skeleton",
  };
}

// ═══════════════════════════════════════════════════════════════
// YARDIMCI FONKSİYONLAR
// ═══════════════════════════════════════════════════════════════

function validateInput(input) {
  if (!input.kaza?.tarihi) throw new Error("kaza.tarihi zorunlu");
  if (!input.magdur?.dogumTarihi) throw new Error("magdur.dogumTarihi zorunlu");
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

/**
 * Kalem hesapları — İSKELET
 *
 * TODO(Claude Code yarın): Aşağıdaki 6 kalemi tam aktüer formülleriyle yaz.
 * Şu an sadece yer tutucu değerler dönüyor.
 */
function hesaplaKalemler(input, yas, cinsiyet) {
  const aylikGelir = input.magdur.gelir?.tutar || 26_005; // 2026 asgari ücret net
  const maluliyet = (input.sonuc.maluliyetOrani?.deger || 0) / 100;
  const tedaviGun = input.sonuc.tedaviSuresiGun || 0;

  return {
    // TBK m.54 - Tedavi giderleri (belgeli)
    tedaviGideri: input.sonuc.sagGideri || 0,

    // Geçici iş göremezlik (tedavi süresi × günlük gelir)
    geciciIsGoremezlik: Math.round(tedaviGun * (aylikGelir / 30)),

    // Sürekli maluliyet tazminatı — TAM FORMÜL YARIN
    // Basit iskelet: maluliyet × yıllık gelir × kalan çalışma yılı (30 yıl kabulü)
    // GERÇEK: Aktif/pasif dönem + yaşam tablosu + diskonto gerekli
    surekliMaluliyetTazminati:
      input.sonuc.durum === "maluliyet" || input.sonuc.durum === "yaralanma"
        ? Math.round(maluliyet * aylikGelir * 12 * Math.max(0, 65 - yas))
        : 0,

    // Destekten yoksun kalma (ölümlü) — TAM FORMÜL YARIN
    // Basit iskelet: eş %50, çocuk %15, anne/baba %10 dağılımı
    destektenYoksunKalma:
      input.sonuc.durum === "olum"
        ? Math.round(aylikGelir * 12 * Math.max(0, 65 - yas) * 0.8) // %80 toplam destek payı
        : 0,

    // Manevi tazminat (TBK m.56) — hakim takdiri
    // Basit iskelet: yaralanma ~50K, maluliyet %×500K, ölüm 300K-500K
    manevi:
      input.sonuc.durum === "olum"
        ? 400_000
        : input.sonuc.durum === "maluliyet"
        ? Math.round(maluliyet * 500_000)
        : 50_000,

    // Bakıcı gideri (ağır maluliyette — %60+)
    bakiciGideri: maluliyet >= 0.6 ? Math.round(20_000 * 12 * 10) : 0,
  };
}

module.exports = {
  calculateCompensationV2,
  hesaplaYas,
};
