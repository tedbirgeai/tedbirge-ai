/**
 * Aktif/Pasif Dönem Hesaplama Servisi
 *
 * Yargıtay yerleşik içtihadı (10. HD, 21. HD, 4. HD):
 * - Aktif dönem: Kişinin gelir elde ettiği yıllar
 *   - Başlangıç: 18 yaş (çalışma yaşı) — somut veri varsa gerçek iş başlangıcı
 *   - Bitiş: Emeklilik yaşı (Erkek 60, Kadın 58)
 * - Pasif dönem: Emeklilik yaşından ÖLÜM yaşına kadar (bakiye ömre göre)
 *   - Bu dönemde gelir = asgari ücret (emekli dahi olsa ev/çarşı-pazar işleri için)
 *
 * Emeklilik yaşı kaynağı:
 * - SSK (506 sayılı Kanun) sonrası: Erkek 60, Kadın 55 (eski kararlar)
 * - Güncel Yargıtay içtihadı: Kadın 58, Erkek 60
 * - 5510 sayılı Kanun reformu sonrası resmi emeklilik yaşları daha yüksek
 *   (kademeli olarak 65'e) ama tazminat hesabında Yargıtay istisnai olarak
 *   60/58 kullanmaya devam ediyor (sigortalının lehine)
 *
 * Referans kararlar:
 * - Yargıtay 21. HD — iş kazası pasif dönem hesabı
 * - Yargıtay 10. HD — SGK rücu davalarında aktif/pasif dönem
 * - Yargıtay HGK — pasif dönem zorunlu hesap
 *
 * Bu dosya src/data/yasam-tablolari.js'e bağımlıdır (bakiyeOmur fonksiyonu için).
 */

const { bakiyeOmur } = require("../data/yasam-tablolari");

const EMEKLILIK_YASI = {
  E: 60, // Erkek
  K: 58, // Kadın
};

const CALISMA_BASLANGIC_YASI = 18;

/**
 * Aktif ve pasif dönem yıllarını hesaplar.
 *
 * @param {Date|string} kazaTarihi - Yaşam tablosu seçimi için
 * @param {number} yas - Kaza anındaki yaş (tam sayı)
 * @param {"E"|"K"} cinsiyet
 * @param {Object} opts
 * @param {number} [opts.emeklilikYasiOverride] - Kişi özel emeklilik yaşı (ör. erken emeklilik)
 * @param {boolean} [opts.zatenEmekliMi] - Kişi kaza anında zaten emekliyse aktif=0
 * @returns {{
 *   yas: number,
 *   cinsiyet: "E"|"K",
 *   emeklilikYasi: number,
 *   bakiyeOmur: number,
 *   olumYasi: number,
 *   aktifYil: number,
 *   pasifYil: number,
 *   toplamYil: number,
 *   kullanilanTablo: string,
 *   notlar: string[]
 * }}
 */
function hesaplaDonemler(kazaTarihi, yas, cinsiyet, opts = {}) {
  if (typeof yas !== "number" || yas < 0 || yas > 100) {
    throw new Error(`Geçersiz yaş: ${yas}. 0-100 arası olmalı.`);
  }
  if (!["E", "K"].includes(cinsiyet)) {
    throw new Error(`Geçersiz cinsiyet: ${cinsiyet}. "E" veya "K" olmalı.`);
  }

  const emeklilikYasi = opts.emeklilikYasiOverride ?? EMEKLILIK_YASI[cinsiyet];
  const bakiye = bakiyeOmur(kazaTarihi, yas, cinsiyet);
  const olumYasi = bakiye.olumYasi;

  const notlar = [];

  // Aktif dönem hesabı
  let aktifYil;
  if (opts.zatenEmekliMi) {
    aktifYil = 0;
    notlar.push("Mağdur zaten emekli → aktif dönem yok, pasif dönem tüm bakiye ömür");
  } else if (yas >= emeklilikYasi) {
    aktifYil = 0;
    notlar.push(`Mağdur kaza tarihinde ${yas} yaşında, emeklilik yaşı ${emeklilikYasi}. Aktif dönem yok.`);
  } else {
    aktifYil = emeklilikYasi - yas;
  }

  // Pasif dönem: emeklilik yaşından ölüm yaşına kadar
  const pasifBaslangic = Math.max(yas, emeklilikYasi);
  let pasifYil;
  if (opts.zatenEmekliMi) {
    pasifYil = bakiye.bakiyeOmur;
  } else {
    pasifYil = Math.max(0, olumYasi - pasifBaslangic);
  }

  // Notlar
  if (cinsiyet === "K" && !opts.emeklilikYasiOverride) {
    notlar.push(`Kadın emeklilik yaşı ${EMEKLILIK_YASI.K} kullanıldı (Yargıtay içtihadı).`);
  }
  if (yas < CALISMA_BASLANGIC_YASI) {
    notlar.push(
      `Mağdur kaza tarihinde ${yas} yaşında (< ${CALISMA_BASLANGIC_YASI}). Çalışma yaşına kadar olan dönem ayrı değerlendirilmeli (Yargıtay içtihadı). Şu an aktif dönem ${aktifYil} yıl alındı.`
    );
  }

  return {
    yas,
    cinsiyet,
    emeklilikYasi,
    bakiyeOmur: bakiye.bakiyeOmur,
    olumYasi: Math.round(olumYasi * 10) / 10,
    aktifYil: Math.round(aktifYil * 10) / 10,
    pasifYil: Math.round(pasifYil * 10) / 10,
    toplamYil: Math.round((aktifYil + pasifYil) * 10) / 10,
    kullanilanTablo: bakiye.kullanilanTablo,
    notlar,
  };
}

module.exports = {
  EMEKLILIK_YASI,
  CALISMA_BASLANGIC_YASI,
  hesaplaDonemler,
};
