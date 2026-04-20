/**
 * Tazminat Kalem Hesapları — Yargıtay İçtihadına Dayalı Aktüer Formüller
 *
 * ═══════════════════════════════════════════════════════════════════
 *  KAYNAKLAR VE İÇTİHAT DOĞRULAMASI
 * ═══════════════════════════════════════════════════════════════════
 *
 * 1) PROGRESİF RANT FORMÜLÜ
 *    - Yargıtay Hukuk Genel Kurulu 1989/4-586, 1990/199
 *    - AYM Kararı 17.07.2020 (E.2019/40, K.2020/40): %1.8 teknik faiz İPTAL
 *    - Yargıtay 17. HD 2019/3292, 2021/1848 (AYM kararı uygulaması)
 *    - Formül: Her yıl için gelir %10 ARTIRILIR, %10 İSKONTO edilir.
 *      Her yıl ayrı ayrı hesaplanır, toplanır. ORTALAMA ALINMAZ.
 *
 * 2) EMEKLİLİK YAŞI
 *    - Erkek: 60 | Kadın: 58 (Yargıtay 10. HD, 21. HD yerleşik içtihadı)
 *    - Aktif dönem: gelirin gerçek tutarı
 *    - Pasif dönem: NET ASGARİ ÜCRET (yaşamsal faaliyetler karşılığı)
 *      "Asgari geçim indirimsiz net asgari ücret" — Yargıtay 10. HD yerleşik
 *
 * 3) DESTEKTEN YOKSUN KALMA PAY SİSTEMİ (Yargıtay 17. HD yerleşik)
 *    - Desteğe 2 pay (kendi tüketimi)
 *    - Eşe 2 pay
 *    - Her çocuğa 1 pay
 *    - Anne ve babaya 1'er pay
 *    - Örnek: Eş + 3 çocuk + anne + baba = 2+2+3+1+1 = 9 pay
 *      1 pay = 100/9 = %11.11
 *    - Çocuksuz durumda: Destek ve Eş yarı yarıya (2+2=4, her biri %50)
 *
 * 4) EŞİN YENİDEN EVLENME İHTİMALİ — AYİM TABLOSU
 *    (Yargıtay HGK tarafından kabul, 17-20 yaş %52 → 51-55 yaş %1)
 *    - Tazminattan bu oran kadar İNDİRİLİR
 *    - Her 18 yaş altı çocuk için %5 indirim (maximum kadar azaltır)
 *
 * 5) BAKICI GİDERİ
 *    - Eşik: %70 maluliyet (Yargıtay yerleşik) veya ATK "bakıma muhtaç"
 *    - Formül: Brüt asgari ücret × 12 × kalan bakiye ömür × progressive rant
 *    - Yargıtay 4. HD 2021/18351, 2022/15412: "Brüt asgari ücretin tamamı"
 *
 * 6) MANEVİ TAZMİNAT
 *    - TBK m.56 — Hakim takdiri. Yargıtay formül vermez.
 *    - Bu motor sadece emsal karar aralığı önerir, kesin rakam değil.
 *    - Avukat somut olay özellikleriyle belirler.
 *
 * ═══════════════════════════════════════════════════════════════════
 *  DOĞRULAMA TARİHİ: 20 Nisan 2026
 *  ÖNEMLİ: AYM 2020 kararından sonra %1.8 teknik faiz KULLANILMAMALIDIR.
 *  Sadece progressive rant (%10 artış + %10 iskonto).
 * ═══════════════════════════════════════════════════════════════════
 */

const { hesaplaDonemler } = require("./aktif-pasif-donem");

// ═══════════════════════════════════════════════════════════════════
// SABİTLER
// ═══════════════════════════════════════════════════════════════════

const ARTIS_ORANI = 0.10;    // Progressive rant: her yıl %10 artış
const ISKONTO_ORANI = 0.10;  // Progressive rant: her yıl %10 iskonto

// 2026 net asgari ücret (pasif dönem için)
// NOT: Bu değer her yıl güncellenmelidir. TODO: ZMSS_LIMITS benzeri yıl-bazlı tablo.
const ASGARI_UCRET_NET_2026 = 26_005;
const ASGARI_UCRET_BRUT_2026 = 33_830; // Bakıcı gideri için

// Bakıcı eşiği
const BAKICI_ESIGI_MALULIYET = 0.70; // %70

// AYİM Tablosu (dul kadın evlenme ihtimali)
const AYIM_TABLOSU_EVLENME = [
  { minYas: 17, maxYas: 20, oran: 0.52 },
  { minYas: 21, maxYas: 25, oran: 0.40 },
  { minYas: 26, maxYas: 30, oran: 0.27 },
  { minYas: 31, maxYas: 35, oran: 0.17 },
  { minYas: 36, maxYas: 40, oran: 0.09 },
  { minYas: 41, maxYas: 50, oran: 0.02 },
  { minYas: 51, maxYas: 55, oran: 0.01 },
  { minYas: 56, maxYas: 150, oran: 0.00 }, // 55+ evlenme şansı yok
];

// Destek payları (Yargıtay 17. HD)
const DESTEK_PAYLARI = {
  destek: 2,
  es: 2,
  cocuk: 1,
  anneBaba: 1,
};

// ═══════════════════════════════════════════════════════════════════
// TEMEL FORMÜLLER
// ═══════════════════════════════════════════════════════════════════

/**
 * Progressive Rant Formülü (Yargıtay yerleşik)
 *
 * Her yıl için gelir %10 artırılır, %10 iskonto edilir, toplanır.
 * Matematiksel gerçek: (1.10 / 1.10)^n = 1 → net etki yok, toplam = yıl × yıllık gelir.
 * AMA Yargıtay bunu "usulen" ister, bazı dairelerde hafif farklılıklar olabilir.
 *
 * @param {number} yillikGelir - Başlangıç yıllık gelir (TL)
 * @param {number} yilSayisi - Hesaplanacak yıl sayısı
 * @returns {number} Toplam peşin değer
 */
function progresifRant(yillikGelir, yilSayisi) {
  if (yillikGelir < 0 || yilSayisi < 0) return 0;

  let toplam = 0;
  let t = yillikGelir;

  for (let i = 0; i < yilSayisi; i++) {
    toplam += t;
    // Her yıl için %10 artırıp %10 iskonto → aynı değer (Yargıtay usulü)
    t = (t * (1 + ARTIS_ORANI)) / (1 + ISKONTO_ORANI);
  }

  // Son yıl kesir ise orantılı ekle
  const kesir = yilSayisi - Math.floor(yilSayisi);
  if (kesir > 0) {
    toplam += t * kesir;
  }

  return Math.round(toplam);
}

// ═══════════════════════════════════════════════════════════════════
// KALEM 1 — TEDAVİ GİDERİ (TBK m.54)
// ═══════════════════════════════════════════════════════════════════

/**
 * Tedavi gideri — belgeli fiili gider. Aktüer hesap yok.
 * @param {number} sagGideri - Fatura/belge toplamı
 * @returns {{toplam:number, formul:string, kaynak:string}}
 */
function tedaviGideri(sagGideri = 0) {
  return {
    toplam: Math.round(sagGideri),
    formul: `Belgeli tedavi giderleri = ${sagGideri.toLocaleString("tr-TR")} TL`,
    kaynak: "TBK m.54/1 — Tedavi giderleri",
  };
}

// ═══════════════════════════════════════════════════════════════════
// KALEM 2 — GEÇİCİ İŞ GÖREMEZLİK
// ═══════════════════════════════════════════════════════════════════

/**
 * Geçici iş göremezlik = Tedavi süresi × günlük gelir
 * Bu dönemde kişi hiç çalışamaz, tüm gelirini kaybeder.
 * @param {number} tedaviSuresiGun
 * @param {number} aylikGelir
 * @returns {{toplam, formul, kaynak}}
 */
function geciciIsGoremezlik(tedaviSuresiGun = 0, aylikGelir = 0) {
  if (tedaviSuresiGun <= 0 || aylikGelir <= 0) {
    return {
      toplam: 0,
      formul: "Tedavi süresi veya gelir 0 → hesap yok",
      kaynak: "TBK m.54/2",
    };
  }

  const gunlukGelir = aylikGelir / 30;
  const toplam = Math.round(tedaviSuresiGun * gunlukGelir);

  return {
    toplam,
    formul: `${tedaviSuresiGun} gün × (${aylikGelir.toLocaleString("tr-TR")} / 30) = ${toplam.toLocaleString("tr-TR")} TL`,
    kaynak: "TBK m.54/2 — Geçici iş göremezlik",
  };
}

// ═══════════════════════════════════════════════════════════════════
// KALEM 3 — SÜREKLİ MALULİYET TAZMİNATI
// ═══════════════════════════════════════════════════════════════════

/**
 * Sürekli (kalıcı) maluliyet tazminatı — aktüer hesap
 *
 * Yöntem: Aktif dönem + Pasif dönem ayrı hesap, her iki dönem progressive rant.
 * - Aktif: gerçek gelir × maluliyet × aktif yıl (progressive rant)
 * - Pasif: NET asgari ücret × maluliyet × pasif yıl (progressive rant)
 *
 * @param {Object} params
 * @param {Date|string} params.kazaTarihi
 * @param {number} params.yas - Kaza anı yaşı
 * @param {"E"|"K"} params.cinsiyet
 * @param {number} params.maluliyetOrani - 0-100 arası yüzde
 * @param {number} params.aylikGelir - Gerçek aylık gelir (net)
 * @param {Object} [params.donemOverride] - hesaplaDonemler çıktısını override
 * @returns {{toplam, aktifDonem, pasifDonem, formul, kaynak, notlar}}
 */
function surekliMaluliyet(params) {
  const { kazaTarihi, yas, cinsiyet, maluliyetOrani = 0, aylikGelir = 0 } = params;

  if (maluliyetOrani <= 0) {
    return {
      toplam: 0,
      aktifDonem: 0,
      pasifDonem: 0,
      formul: "Maluliyet oranı 0 → hesap yok. AI uydurma yapmaz.",
      kaynak: "TBK m.54 — Sürekli maluliyet (maluliyet yok)",
      notlar: [],
    };
  }

  const donem = params.donemOverride || hesaplaDonemler(kazaTarihi, yas, cinsiyet);
  const maluliyet = maluliyetOrani / 100;

  // Aktif dönem: gerçek gelir × maluliyet
  const aktifYillikGelir = aylikGelir * 12 * maluliyet;
  const aktifToplam = progresifRant(aktifYillikGelir, donem.aktifYil);

  // Pasif dönem: net asgari ücret × maluliyet
  const pasifYillikGelir = ASGARI_UCRET_NET_2026 * 12 * maluliyet;
  const pasifToplam = progresifRant(pasifYillikGelir, donem.pasifYil);

  const toplam = aktifToplam + pasifToplam;

  return {
    toplam,
    aktifDonem: aktifToplam,
    pasifDonem: pasifToplam,
    aktifYil: donem.aktifYil,
    pasifYil: donem.pasifYil,
    emeklilikYasi: donem.emeklilikYasi,
    olumYasi: donem.olumYasi,
    kullanilanTablo: donem.kullanilanTablo,
    formul: `Aktif (${donem.aktifYil}yıl × ${aylikGelir.toLocaleString("tr-TR")}/ay × %${maluliyetOrani}) + Pasif (${donem.pasifYil}yıl × ${ASGARI_UCRET_NET_2026.toLocaleString("tr-TR")} asgari ücret × %${maluliyetOrani}) — progressive rant`,
    kaynak: "TBK m.54 — Sürekli iş göremezlik / Yargıtay 10. HD, 21. HD içtihadı",
    notlar: donem.notlar || [],
  };
}

// ═══════════════════════════════════════════════════════════════════
// KALEM 4 — DESTEKTEN YOKSUN KALMA (Ölüm Davası)
// ═══════════════════════════════════════════════════════════════════

/**
 * Destekten yoksun kalma tazminatı — Yargıtay 17. HD pay sistemi
 *
 * @param {Object} params
 * @param {Date|string} params.kazaTarihi
 * @param {number} params.yas - Ölenin yaşı
 * @param {"E"|"K"} params.cinsiyet - Ölenin cinsiyeti
 * @param {number} params.aylikGelir - Ölenin aylık geliri
 * @param {Object} params.aile
 * @param {Object} [params.aile.es] - { yas, cinsiyet } - null/undefined ise yok
 * @param {Object[]} [params.aile.cocuklar] - [{ yas }]
 * @param {boolean} [params.aile.anneVarMi]
 * @param {boolean} [params.aile.babaVarMi]
 * @returns {{toplam, paylar, esEvlenmeIndirimi, formul, notlar}}
 */
function destektenYoksunKalma(params) {
  const { kazaTarihi, yas, cinsiyet, aylikGelir = 0, aile = {} } = params;
  const { es, cocuklar = [], anneVarMi = false, babaVarMi = false } = aile;

  if (aylikGelir <= 0) {
    return {
      toplam: 0,
      paylar: {},
      formul: "Gelir 0 → hesap yok",
      kaynak: "TBK m.53",
      notlar: [],
    };
  }

  // 1. Pay hesabı — Yargıtay 17. HD sistemi
  let toplamPay = DESTEK_PAYLARI.destek; // Ölen için 2 pay
  const bilesenler = { destek: DESTEK_PAYLARI.destek };

  if (es) {
    toplamPay += DESTEK_PAYLARI.es;
    bilesenler.es = DESTEK_PAYLARI.es;
  }
  if (cocuklar.length > 0) {
    toplamPay += cocuklar.length * DESTEK_PAYLARI.cocuk;
    bilesenler.cocuklar = cocuklar.length * DESTEK_PAYLARI.cocuk;
  }
  if (anneVarMi) {
    toplamPay += DESTEK_PAYLARI.anneBaba;
    bilesenler.anne = DESTEK_PAYLARI.anneBaba;
  }
  if (babaVarMi) {
    toplamPay += DESTEK_PAYLARI.anneBaba;
    bilesenler.baba = DESTEK_PAYLARI.anneBaba;
  }

  // Özel durum: çocuksuz ve eşsiz ise hesaplama anlamsız
  if (toplamPay === DESTEK_PAYLARI.destek) {
    return {
      toplam: 0,
      paylar: {},
      formul: "Destek görecek kimse yok (eş/çocuk/anne/baba belirtilmemiş)",
      kaynak: "TBK m.53",
      notlar: ["Aile bilgisi eksik. Destekten yoksun kalma için en az bir hak sahibi gerekli."],
    };
  }

  // 2. Ölenin aktif+pasif dönemi üzerinden tazminat
  const donem = hesaplaDonemler(kazaTarihi, yas, cinsiyet);
  const aktifYillikGelir = aylikGelir * 12;
  const pasifYillikGelir = ASGARI_UCRET_NET_2026 * 12;

  const aktifToplam = progresifRant(aktifYillikGelir, donem.aktifYil);
  const pasifToplam = progresifRant(pasifYillikGelir, donem.pasifYil);
  const brutToplamGelir = aktifToplam + pasifToplam;

  // 3. Hak sahiplerinin payı = (toplam pay - destek payı) / toplam pay
  const destekOrani = (toplamPay - DESTEK_PAYLARI.destek) / toplamPay;
  let toplamTazminat = brutToplamGelir * destekOrani;

  // 4. Pay bazlı dağılım
  const birPay = toplamTazminat / (toplamPay - DESTEK_PAYLARI.destek);
  const paylar = {};
  if (es) paylar.es = Math.round(birPay * DESTEK_PAYLARI.es);
  if (cocuklar.length > 0) {
    paylar.cocuklar = cocuklar.map(() => Math.round(birPay * DESTEK_PAYLARI.cocuk));
  }
  if (anneVarMi) paylar.anne = Math.round(birPay * DESTEK_PAYLARI.anneBaba);
  if (babaVarMi) paylar.baba = Math.round(birPay * DESTEK_PAYLARI.anneBaba);

  // 5. Eşin yeniden evlenme indirimi (AYİM tablosu)
  let esEvlenmeIndirimi = null;
  if (es && paylar.es) {
    esEvlenmeIndirimi = evlenmeIhtimaliIndirimi(es.yas, cocuklar);
    const indirimTutari = paylar.es * esEvlenmeIndirimi.oran;
    paylar.es = Math.round(paylar.es - indirimTutari);
    esEvlenmeIndirimi.indirimTutari = Math.round(indirimTutari);
  }

  // 6. Toplam yeniden hesapla (evlenme indirimi sonrası)
  let finalToplam = 0;
  if (paylar.es) finalToplam += paylar.es;
  if (paylar.cocuklar) finalToplam += paylar.cocuklar.reduce((a, b) => a + b, 0);
  if (paylar.anne) finalToplam += paylar.anne;
  if (paylar.baba) finalToplam += paylar.baba;

  return {
    toplam: Math.round(finalToplam),
    paylar,
    toplamPay,
    birPayOrani: Math.round((100 / toplamPay) * 100) / 100,
    esEvlenmeIndirimi,
    aktifDonem: aktifToplam,
    pasifDonem: pasifToplam,
    donem,
    formul: `${toplamPay} pay üzerinden dağılım (Yargıtay 17. HD). Brüt ${brutToplamGelir.toLocaleString("tr-TR")} × hak sahipleri oranı (%${Math.round(destekOrani * 100)}) = ${Math.round(brutToplamGelir * destekOrani).toLocaleString("tr-TR")}${esEvlenmeIndirimi ? `; eş evlenme indirimi %${esEvlenmeIndirimi.oran * 100}` : ""}`,
    kaynak: "TBK m.53/1-3 — Destekten yoksun kalma / Yargıtay 17. HD pay sistemi",
    notlar: ["Progressive rant: her yıl %10 artış + %10 iskonto", "Pasif dönem net asgari ücret üzerinden"],
  };
}

/**
 * AYİM tablosuna göre dul eşin yeniden evlenme ihtimali ve indirimi
 * @param {number} esYasi
 * @param {Array} cocuklar - 18 yaş altı çocuklar için indirim
 */
function evlenmeIhtimaliIndirimi(esYasi, cocuklar = []) {
  const satir = AYIM_TABLOSU_EVLENME.find((r) => esYasi >= r.minYas && esYasi <= r.maxYas);
  if (!satir) return { oran: 0, kaynak: "AYİM tablosu — yaş dışında" };

  let oran = satir.oran;
  const kucukCocukSayisi = cocuklar.filter((c) => c.yas < 18).length;
  const cocukIndirim = kucukCocukSayisi * 0.05; // her 18 yaş altı çocuk için %5
  oran = Math.max(0, oran - cocukIndirim);

  return {
    oran,
    tabloOrani: satir.oran,
    cocukIndirim,
    kucukCocukSayisi,
    kaynak: `AYİM Tablosu (Yargıtay HGK kabul) — ${satir.minYas}-${satir.maxYas} yaş %${satir.oran * 100}${kucukCocukSayisi > 0 ? `, ${kucukCocukSayisi} küçük çocuk için -%${cocukIndirim * 100}` : ""}`,
  };
}

// ═══════════════════════════════════════════════════════════════════
// KALEM 5 — BAKICI GİDERİ
// ═══════════════════════════════════════════════════════════════════

/**
 * Bakıcı gideri — ağır maluliyette (%70+)
 * Brüt asgari ücret × 12 × bakiye ömür, progressive rant
 *
 * @param {Object} params
 * @param {Date|string} params.kazaTarihi
 * @param {number} params.yas
 * @param {"E"|"K"} params.cinsiyet
 * @param {number} params.maluliyetOrani - 0-100
 * @param {boolean} [params.atkBakicaMuhtac] - ATK raporunda "bakıma muhtaç" ise eşiği atla
 * @returns {{toplam, formul, kaynak, notlar}}
 */
function bakiciGideri(params) {
  const { kazaTarihi, yas, cinsiyet, maluliyetOrani = 0, atkBakicaMuhtac = false } = params;
  const maluliyet = maluliyetOrani / 100;

  // Eşik kontrolü
  if (maluliyet < BAKICI_ESIGI_MALULIYET && !atkBakicaMuhtac) {
    return {
      toplam: 0,
      tetiklendi: false,
      formul: `Maluliyet %${maluliyetOrani} < eşik %${BAKICI_ESIGI_MALULIYET * 100}, ATK "bakıma muhtaç" yok → bakıcı gideri yok`,
      kaynak: "Yargıtay 4. HD yerleşik içtihadı",
      notlar: [],
    };
  }

  const donem = hesaplaDonemler(kazaTarihi, yas, cinsiyet);
  const toplamYil = donem.aktifYil + donem.pasifYil; // Bakıcı ömür boyu gerekli
  const yillikBakiciGideri = ASGARI_UCRET_BRUT_2026 * 12;
  const toplam = progresifRant(yillikBakiciGideri, toplamYil);

  return {
    toplam,
    tetiklendi: true,
    yillikGider: yillikBakiciGideri,
    bakiyeOmur: toplamYil,
    formul: `${ASGARI_UCRET_BRUT_2026.toLocaleString("tr-TR")} brüt asgari × 12 × ${toplamYil} yıl (progressive rant)`,
    kaynak: "Yargıtay 4. HD 2021/18351, 2022/15412 — brüt asgari ücret tamamı",
    notlar: [
      maluliyet >= BAKICI_ESIGI_MALULIYET
        ? `Maluliyet %${maluliyetOrani} ≥ %${BAKICI_ESIGI_MALULIYET * 100} eşik → bakıcı gideri tetiklendi`
        : `ATK "bakıma muhtaç" raporu → bakıcı gideri tetiklendi`,
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════
// KALEM 6 — MANEVİ TAZMİNAT
// ═══════════════════════════════════════════════════════════════════

/**
 * Manevi tazminat — TBK m.56.
 * Hakim takdiri. Bu motor SADECE emsal karar bazında tahmini aralık verir.
 *
 * @param {Object} params
 * @param {"yaralanma"|"maluliyet"|"olum"} params.durum
 * @param {number} [params.maluliyetOrani]
 * @returns {{tahmini, aralık, formul, kaynak, notlar}}
 */
function maneviTazminat(params) {
  const { durum, maluliyetOrani = 0 } = params;

  // Emsal Yargıtay kararlarından derlenmiş 2024-2026 tipik aralıklar
  // TODO: Güncel emsal karar veri tabanı ile değiştirilecek
  let aralıkMin, aralıkMax, tahmini;

  if (durum === "olum") {
    aralıkMin = 150_000;
    aralıkMax = 500_000;
    tahmini = 300_000; // Orta
  } else if (durum === "maluliyet") {
    // Maluliyet oranıyla orantılı
    aralıkMin = Math.round(100_000 + maluliyetOrani * 3_000);
    aralıkMax = Math.round(200_000 + maluliyetOrani * 8_000);
    tahmini = Math.round((aralıkMin + aralıkMax) / 2);
  } else {
    // yaralanma (maluliyet yok)
    aralıkMin = 30_000;
    aralıkMax = 100_000;
    tahmini = 60_000;
  }

  return {
    tahmini,
    aralık: { min: aralıkMin, max: aralıkMax },
    formul: `Emsal Yargıtay kararı aralığı (takdiri, bağlayıcı değil)`,
    kaynak: "TBK m.56 — Manevi tazminat (hakim takdiri)",
    notlar: [
      "Manevi tazminat aktüer hesap DEĞİLDİR. Hakim takdir eder.",
      "Bu rakam yalnızca avukat için ön-değerlendirme önerisidir.",
      "Somut olay özellikleri (acı-elem şiddeti, yaş, sosyal durum) rakamı yukarı/aşağı etkileyebilir.",
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════
// ANA FONKSİYON — 6 kalemin tümünü bir kerede hesaplar
// ═══════════════════════════════════════════════════════════════════

/**
 * Tüm tazminat kalemlerini hesaplar ve toplam üretir.
 * compensation.engine.v2.js'in çağıracağı ana fonksiyondur.
 *
 * @param {Object} input - Standart Tedbirge input şeması
 * @returns {{kalemler, toplam, meta}}
 */
function hesaplaTumKalemler(input) {
  const {
    kaza = {},
    magdur = {},
    sonuc = {},
    aile = {},
  } = input;

  const aylikGelir = magdur.gelir?.tutar || ASGARI_UCRET_NET_2026;
  const yas = hesaplaYas(magdur.dogumTarihi, kaza.tarihi);
  const cinsiyet = magdur.cinsiyet || "E";
  const maluliyetOrani = sonuc.maluliyetOrani?.deger || 0;
  const durum = sonuc.durum || "yaralanma";

  const kalemler = {
    tedaviGideri: tedaviGideri(sonuc.sagGideri),
    geciciIsGoremezlik: geciciIsGoremezlik(sonuc.tedaviSuresiGun, aylikGelir),
    surekliMaluliyetTazminati: surekliMaluliyet({
      kazaTarihi: kaza.tarihi, yas, cinsiyet, maluliyetOrani, aylikGelir,
    }),
    destektenYoksunKalma:
      durum === "olum"
        ? destektenYoksunKalma({ kazaTarihi: kaza.tarihi, yas, cinsiyet, aylikGelir, aile })
        : { toplam: 0, formul: "Ölümlü değil — hesap yok", kaynak: "TBK m.53" },
    bakiciGideri: bakiciGideri({
      kazaTarihi: kaza.tarihi, yas, cinsiyet, maluliyetOrani,
      atkBakicaMuhtac: sonuc.atkBakicaMuhtac,
    }),
    manevi: maneviTazminat({ durum, maluliyetOrani }),
  };

  // Toplam (manevi için tahmini kullan)
  const toplam =
    kalemler.tedaviGideri.toplam +
    kalemler.geciciIsGoremezlik.toplam +
    kalemler.surekliMaluliyetTazminati.toplam +
    kalemler.destektenYoksunKalma.toplam +
    kalemler.bakiciGideri.toplam +
    kalemler.manevi.tahmini;

  return {
    kalemler,
    toplam,
    meta: {
      yas,
      cinsiyet,
      aylikGelir,
      durum,
      maluliyetOrani,
      kazaTarihi: kaza.tarihi,
      asgariUcretNet: ASGARI_UCRET_NET_2026,
      asgariUcretBrut: ASGARI_UCRET_BRUT_2026,
    },
  };
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
  // Sabitler
  ARTIS_ORANI,
  ISKONTO_ORANI,
  ASGARI_UCRET_NET_2026,
  ASGARI_UCRET_BRUT_2026,
  BAKICI_ESIGI_MALULIYET,
  AYIM_TABLOSU_EVLENME,
  DESTEK_PAYLARI,

  // Yardımcı
  progresifRant,
  evlenmeIhtimaliIndirimi,

  // Kalemler
  tedaviGideri,
  geciciIsGoremezlik,
  surekliMaluliyet,
  destektenYoksunKalma,
  bakiciGideri,
  maneviTazminat,

  // Ana fonksiyon
  hesaplaTumKalemler,
};
