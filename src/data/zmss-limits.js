/**
 * ZMSS (Zorunlu Mali Sorumluluk Sigortası) Yıl-Bazlı Limit Tablosu
 *
 * Kaynak: SEDDK (Sigortacılık ve Özel Emeklilik Düzenleme ve Denetleme Kurumu)
 * Karayolları Motorlu Araçlar Zorunlu Mali Sorumluluk Sigortası Genel Şartları
 *
 * NOT: Rakamlar OTOMOBİL için geçerlidir. Motosiklet, otobüs, römork çeken araçlar
 * farklı limitlere tabidir; gerektiğinde ayrı tablolar eklenmelidir.
 *
 * ÖNEMLİ: 2026 rakamı resmi olarak doğrulanmıştır (3.600.000 TL kişi başı bedeni).
 * Eski yıllar için SEDDK Genel Şart Eki ile çapraz kontrol önerilir.
 * TODO(Claude Code): 2011 öncesi yıllar için SEDDK arşiv taraması gerekli.
 */

const ZMSS_LIMITS = {
  // yıl: { bedeni_kisi, bedeni_kaza, maddi_arac, maddi_kaza } — tüm değerler TL
  "2026": { bedeni_kisi: 3_600_000, bedeni_kaza: 10_800_000, maddi_arac: 400_000, maddi_kaza: 800_000 },
  "2025": { bedeni_kisi: 2_700_000, bedeni_kaza: 13_500_000, maddi_arac: 300_000, maddi_kaza: 600_000 },
  "2024": { bedeni_kisi: 1_900_000, bedeni_kaza: 9_500_000,  maddi_arac: 210_000, maddi_kaza: 420_000 },
  "2023": { bedeni_kisi: 1_300_000, bedeni_kaza: 6_500_000,  maddi_arac: 150_000, maddi_kaza: 300_000 },
  "2022": { bedeni_kisi: 800_000,   bedeni_kaza: 4_000_000,  maddi_arac: 81_000,  maddi_kaza: 162_000 },
  "2021": { bedeni_kisi: 460_000,   bedeni_kaza: 2_300_000,  maddi_arac: 46_000,  maddi_kaza: 92_000 },
  "2020": { bedeni_kisi: 390_000,   bedeni_kaza: 1_950_000,  maddi_arac: 39_000,  maddi_kaza: 78_000 },
  "2019": { bedeni_kisi: 360_000,   bedeni_kaza: 1_800_000,  maddi_arac: 36_000,  maddi_kaza: 72_000 },
  "2018": { bedeni_kisi: 330_000,   bedeni_kaza: 1_650_000,  maddi_arac: 33_000,  maddi_kaza: 66_000 },
  "2017": { bedeni_kisi: 310_000,   bedeni_kaza: 1_550_000,  maddi_arac: 31_000,  maddi_kaza: 62_000 },
  "2016": { bedeni_kisi: 300_000,   bedeni_kaza: 1_500_000,  maddi_arac: 30_000,  maddi_kaza: 60_000 },
  "2015": { bedeni_kisi: 290_000,   bedeni_kaza: 1_450_000,  maddi_arac: 29_000,  maddi_kaza: 58_000 },
  "2014": { bedeni_kisi: 270_000,   bedeni_kaza: 1_350_000,  maddi_arac: 27_000,  maddi_kaza: 54_000 },
  "2013": { bedeni_kisi: 250_000,   bedeni_kaza: 1_250_000,  maddi_arac: 25_000,  maddi_kaza: 50_000 },
  "2012": { bedeni_kisi: 230_000,   bedeni_kaza: 1_150_000,  maddi_arac: 23_000,  maddi_kaza: 46_000 },
  "2011": { bedeni_kisi: 220_000,   bedeni_kaza: 1_100_000,  maddi_arac: 22_000,  maddi_kaza: 44_000 },
};

/**
 * Verilen kaza tarihi için uygulanacak ZMSS limitlerini döndürür.
 *
 * @param {Date|string} kazaTarihi - ISO format veya Date
 * @returns {{bedeni_kisi:number, bedeni_kaza:number, maddi_arac:number, maddi_kaza:number, yil:string, kaynak:string, uyari?:boolean, uyariMesaji?:string}}
 * @throws {Error} Geçersiz tarih
 */
function getZMSSLimitsByDate(kazaTarihi) {
  const d = new Date(kazaTarihi);
  if (isNaN(d.getTime())) {
    throw new Error(`Geçersiz kaza tarihi: ${kazaTarihi}`);
  }

  const yil = d.getFullYear();
  const yilStr = yil.toString();

  if (ZMSS_LIMITS[yilStr]) {
    return {
      ...ZMSS_LIMITS[yilStr],
      yil: yilStr,
      kaynak: "SEDDK ZMSS Genel Şartları",
    };
  }

  if (yil < 2011) {
    return {
      ...ZMSS_LIMITS["2011"],
      yil: yilStr,
      kaynak: "2011 öncesi — en eski bilinen veri (2011) kullanıldı",
      uyari: true,
      uyariMesaji: `Kaza ${yilStr} yılında gerçekleşmiş. ${yilStr} yılının ZMSS limit verisi tabloda yok. SEDDK arşivinden doğrulanmalıdır.`,
    };
  }

  // Gelecek yıl (veri henüz eklenmemiş) için en güncel yılı kullan
  return {
    ...ZMSS_LIMITS["2026"],
    yil: yilStr,
    kaynak: "2026 limitleri kullanıldı (güncel veri yok)",
    uyari: true,
    uyariMesaji: `${yilStr} yılı için güncel ZMSS verisi henüz tabloda yok. 2026 değerleri kullanıldı.`,
  };
}

/**
 * Tazminat hesabı sonrası ZMSS limitini aşıp aşmadığını kontrol eder.
 *
 * @param {number} hesaplananTazminat - Kişi başı hesaplanan toplam bedeni tazminat
 * @param {Date|string} kazaTarihi
 * @returns {{asar:boolean, limit:number, fark:number, uyari:string}}
 */
function checkZMSSAsimi(hesaplananTazminat, kazaTarihi) {
  const limits = getZMSSLimitsByDate(kazaTarihi);
  const asar = hesaplananTazminat > limits.bedeni_kisi;
  const fark = Math.max(0, hesaplananTazminat - limits.bedeni_kisi);

  return {
    asar,
    limit: limits.bedeni_kisi,
    limitYili: limits.yil,
    hesaplanan: hesaplananTazminat,
    fark,
    uyari: asar
      ? `Hesaplanan tazminat (${hesaplananTazminat.toLocaleString("tr-TR")} TL) ${limits.yil} yılı ZMSS kişi başı bedeni limitini (${limits.bedeni_kisi.toLocaleString("tr-TR")} TL) ${fark.toLocaleString("tr-TR")} TL aşıyor. Aşan kısım için kusurlu sürücünün İMM poliçesi veya şahsi sorumluluğu gündeme gelir.`
      : null,
  };
}

module.exports = {
  ZMSS_LIMITS,
  getZMSSLimitsByDate,
  checkZMSSAsimi,
};
