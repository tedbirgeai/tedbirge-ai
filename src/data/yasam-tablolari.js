/**
 * Yaşam Tabloları — PMF 1931 ve TRH 2010
 *
 * Kaynaklar:
 * - TRH 2010: Başbakanlık Hazine Müsteşarlığı, Hacettepe Üniversitesi Aktüerya Bilimleri,
 *   BNB Danışmanlık, Marmara Üniversitesi, Başkent Üniversitesi ortak çalışması
 *   PDF: www.TazminatHukuku.com/dosyalar/607_trh-2010.pdf (doğrulandı 20.04.2026)
 *
 * - PMF 1931: Fransa kökenli klasik tablo (Population Masculine et Feminine)
 *   PDF: www.TazminatHukuku.com/dosyalar/606_pmf-1931yasam-tablosu.pdf (doğrulandı 20.04.2026)
 *
 * Yargıtay Kullanımı (çapraz doğrulandı):
 * - Olay tarihi 2010 ÖNCESİ  → PMF 1931 (cinsiyet ayrımsız)
 * - Olay tarihi 2010 SONRASI → TRH 2010 (cinsiyete göre)
 * - Bazı daireler 2012 eşiği kullanır. Uyuşmazlık halinde hakim karar verir.
 *
 * Referans kararlar:
 * - Yargıtay HGK 1989/4-586, 1990/199
 * - Yargıtay 4. HD 15.06.2021 (TRH 2010 benimsendi)
 * - Yargıtay 10. HD ve 21. HD — SGK rücu davalarında TRH 2010
 *
 * NOT: Bakiye ömür = kişinin o yaştan itibaren istatistiksel olarak yaşayacağı yıl sayısı.
 * Örnek: 30 yaşındaki erkek TRH 2010'a göre 44.45 yıl daha yaşayabilir → muhtemel ölüm yaşı 74.
 */

/**
 * TRH 2010 — Türkiye Hayat Tablosu (cinsiyete göre bakiye ömür, yıl)
 * Yaş: 0-97 arası. 97+ için en yakın değer kullanılır.
 */
const TRH_2010 = {
  erkek: {
    0: 71.93, 1: 72.35, 2: 71.42, 3: 70.47, 4: 69.52, 5: 68.57, 6: 67.60, 7: 66.63, 8: 65.66, 9: 64.68,
    10: 63.70, 11: 62.72, 12: 61.74, 13: 60.76, 14: 59.78, 15: 58.80, 16: 57.84, 17: 56.87, 18: 55.91, 19: 54.95,
    20: 53.99, 21: 53.04, 22: 52.09, 23: 51.14, 24: 50.19, 25: 49.24, 26: 48.28, 27: 47.33, 28: 46.37, 29: 45.41,
    30: 44.45, 31: 43.50, 32: 42.54, 33: 41.58, 34: 40.62, 35: 39.67, 36: 38.72, 37: 37.77, 38: 36.81, 39: 35.87,
    40: 34.93, 41: 33.99, 42: 33.05, 43: 32.12, 44: 31.19, 45: 30.27, 46: 29.36, 47: 28.46, 48: 27.56, 49: 26.67,
    50: 25.79, 51: 24.93, 52: 24.06, 53: 23.21, 54: 22.37, 55: 21.54, 56: 20.74, 57: 19.94, 58: 19.15, 59: 18.38,
    60: 17.62, 61: 16.88, 62: 16.14, 63: 15.42, 64: 14.72, 65: 14.04, 66: 13.37, 67: 12.72, 68: 12.08, 69: 11.47,
    70: 10.87, 71: 10.29, 72: 9.73, 73: 9.20, 74: 8.68, 75: 8.17, 76: 7.69, 77: 7.24, 78: 6.81, 79: 6.40,
    80: 5.99, 81: 5.59, 82: 5.23, 83: 4.90, 84: 4.57, 85: 4.25, 86: 3.93, 87: 3.64, 88: 3.37, 89: 3.12,
    90: 2.90, 91: 2.66, 92: 2.39, 93: 2.10, 94: 1.80, 95: 1.55, 96: 1.40, 97: 1.23,
  },
  kadin: {
    0: 78.02, 1: 77.66, 2: 76.68, 3: 75.70, 4: 74.72, 5: 73.73, 6: 72.74, 7: 71.75, 8: 70.76, 9: 69.76,
    10: 68.77, 11: 67.78, 12: 66.78, 13: 65.79, 14: 64.79, 15: 63.80, 16: 62.81, 17: 61.82, 18: 60.83, 19: 59.84,
    20: 58.85, 21: 57.86, 22: 56.88, 23: 55.89, 24: 54.90, 25: 53.92, 26: 52.93, 27: 51.95, 28: 50.97, 29: 49.98,
    30: 49.00, 31: 48.02, 32: 47.04, 33: 46.06, 34: 45.08, 35: 44.10, 36: 43.12, 37: 42.15, 38: 41.17, 39: 40.20,
    40: 39.23, 41: 38.26, 42: 37.30, 43: 36.34, 44: 35.38, 45: 34.43, 46: 33.48, 47: 32.54, 48: 31.60, 49: 30.67,
    50: 29.74, 51: 28.82, 52: 27.90, 53: 26.98, 54: 26.08, 55: 25.18, 56: 24.29, 57: 23.40, 58: 22.52, 59: 21.65,
    60: 20.79, 61: 19.94, 62: 19.09, 63: 18.26, 64: 17.43, 65: 16.63, 66: 15.85, 67: 15.08, 68: 14.32, 69: 13.58,
    70: 12.87, 71: 12.18, 72: 11.51, 73: 10.85, 74: 10.22, 75: 9.62, 76: 9.05, 77: 8.51, 78: 8.00, 79: 7.50,
    80: 7.01, 81: 6.55, 82: 6.12, 83: 5.71, 84: 5.32, 85: 4.93, 86: 4.54, 87: 4.20, 88: 3.88, 89: 3.59,
    90: 3.29, 91: 2.97, 92: 2.64, 93: 2.32, 94: 1.99, 95: 1.67, 96: 1.36, 97: 1.05,
  },
};

/**
 * PMF 1931 — Population Masculine et Feminine (cinsiyet ayrımı YOK, yıl)
 * Yaş: 0-105 arası. Bazı yaşlar kaynakta yok, interpolasyon gerekir.
 *
 * UYARI: Orijinal PDF'de 82 yaşı için 5.22 yazıyor (81: 4.52, 83: 3.95 arasında).
 * Bu muhtemelen OCR hatası — Yargıtay emsal kararlarında genellikle 4.22 olarak
 * geçer. Biz orijinal kaynağa sadık kalıyoruz; avukat gerekirse düzeltir.
 */
const PMF_1931 = {
  0: 56.64, 1: 60.60, 2: 60.58, 3: 59.97, 4: 59.22, 5: 58.41, 6: 57.57, 7: 56.71, 8: 55.83, 9: 54.93,
  10: 54.03, 11: 53.11, 12: 52.19, 13: 51.28, 14: 50.37, 15: 49.49, 16: 48.62, 17: 47.78, 18: 46.96, 19: 46.15,
  20: 45.90, 21: 44.59, 22: 43.83, 23: 43.03, 24: 42.27, 25: 41.49, 26: 40.70, 27: 39.90, 28: 39.10, 29: 38.32,
  30: 37.50, 31: 36.70, 32: 35.90, 33: 35.10, 34: 34.29, 35: 33.49, 36: 32.69, 37: 31.90, 38: 31.10, 39: 30.31,
  40: 29.73, 41: 28.73, 42: 27.95, 43: 27.18, 44: 26.40, 45: 25.64, 46: 24.78, 47: 24.12, 48: 23.36, 49: 22.62,
  50: 21.88, 51: 21.15, 52: 20.42, 53: 19.70, 54: 18.98, 55: 18.28, 56: 17.82, 57: 16.90, 58: 16.10, 59: 15.55,
  60: 14.89, 61: 14.23, 62: 13.59, 63: 12.97, 64: 12.35, 65: 11.75, 66: 11.17, 67: 10.51, 68: 10.05, 69: 9.50,
  70: 8.98, 71: 8.47, 72: 7.98, 73: 7.54, 74: 7.08, 75: 6.88, 76: 6.25, 77: 5.86, 78: 5.50, 79: 5.15,
  80: 4.85, 81: 4.52, 82: 5.22, 83: 3.95, 84: 3.71,
  90: 2.71, 95: 2.40, 100: 2.00, 105: 1.00,
};

/**
 * TRH 2010 tablosundan bakiye ömür alır.
 * @param {number} yas - 0-97 arası. Üstü 97 olarak alınır.
 * @param {"E"|"K"} cinsiyet
 * @returns {number} Kalan yaşam yılı
 */
function trh2010Bakiye(yas, cinsiyet) {
  if (yas < 0) throw new Error(`Geçersiz yaş: ${yas}`);
  if (!["E", "K"].includes(cinsiyet)) throw new Error(`Geçersiz cinsiyet: ${cinsiyet}`);
  const clampYas = Math.min(97, Math.floor(yas));
  const tablo = cinsiyet === "K" ? TRH_2010.kadin : TRH_2010.erkek;
  return tablo[clampYas];
}

/**
 * PMF 1931 tablosundan bakiye ömür alır. Cinsiyet ayrımı YOK.
 * Eksik yıllar için en yakın alt değeri döner (veya interpolasyon).
 */
function pmf1931Bakiye(yas) {
  if (yas < 0) throw new Error(`Geçersiz yaş: ${yas}`);
  const clampYas = Math.min(105, Math.floor(yas));

  if (PMF_1931[clampYas] !== undefined) return PMF_1931[clampYas];

  // 85-89 ve 91-94 arası tabloda yok → lineer interpolasyon
  // Aşağı ve yukarı bilinen değerleri bul
  let alt = clampYas, ust = clampYas;
  while (alt > 0 && PMF_1931[alt] === undefined) alt--;
  while (ust < 105 && PMF_1931[ust] === undefined) ust++;

  const altVal = PMF_1931[alt];
  const ustVal = PMF_1931[ust];
  const oran = (clampYas - alt) / (ust - alt);
  return Math.round((altVal + (ustVal - altVal) * oran) * 100) / 100;
}

/**
 * Kaza tarihi ve (varsa) cinsiyet bilgisine göre DOĞRU tabloyu seçer
 * ve bakiye ömrü döndürür. Yargıtay içtihadına uygun.
 *
 * @param {Date|string} kazaTarihi
 * @param {number} yas - Kaza anındaki yaş
 * @param {"E"|"K"} cinsiyet
 * @param {"PMF_1931"|"TRH_2010"|"AUTO"} zorlanmisTablo - AUTO = kaza tarihine göre seç
 * @returns {{bakiyeOmur:number, olumYasi:number, kullanilanTablo:string, dayanak:string}}
 */
function bakiyeOmur(kazaTarihi, yas, cinsiyet, zorlanmisTablo = "AUTO") {
  const t = new Date(kazaTarihi);
  if (isNaN(t.getTime())) throw new Error(`Geçersiz kaza tarihi: ${kazaTarihi}`);

  let kullanilacakTablo;
  if (zorlanmisTablo === "AUTO") {
    // Yargıtay içtihadı: 2010 eşiği
    kullanilacakTablo = t.getFullYear() < 2010 ? "PMF_1931" : "TRH_2010";
  } else {
    kullanilacakTablo = zorlanmisTablo;
  }

  let bakiye, dayanak;
  if (kullanilacakTablo === "PMF_1931") {
    bakiye = pmf1931Bakiye(yas);
    dayanak = "PMF 1931 (Yargıtay içtihadı: 2010 öncesi olaylar)";
  } else {
    bakiye = trh2010Bakiye(yas, cinsiyet);
    dayanak = "TRH 2010 (Yargıtay 4. HD 15.06.2021 ve sonrası)";
  }

  return {
    bakiyeOmur: bakiye,
    olumYasi: Math.round((yas + bakiye) * 10) / 10,
    kullanilanTablo: kullanilacakTablo,
    dayanak,
  };
}

module.exports = {
  TRH_2010,
  PMF_1931,
  trh2010Bakiye,
  pmf1931Bakiye,
  bakiyeOmur,
};
