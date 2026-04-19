/**
 * Maluliyet Yönetmeliği Seçici
 *
 * Yargıtay içtihadına göre: Kaza tarihinde yürürlükte olan yönetmelik esas alınır.
 * Kaza tarihi 2010'da, rapor 2019 yönetmeliğine göre yazılırsa → Yargıtay'ca bozma.
 *
 * Referanslar:
 * - Yargıtay 21. Hukuk Dairesi (iş kazaları), 17. Hukuk Dairesi (trafik)
 * - Sağlık Bakanlığı Engelli ve Yaşlı Hizmetleri Genel Müdürlüğü
 */

const YONETMELIKLER = [
  {
    id: "SSIT",
    ad: "Sosyal Sigorta Sağlık İşlemleri Tüzüğü",
    kisaAd: "SSİT",
    baslangic: null, // 1972 yürürlük
    bitis: "2008-10-10",
    resmiGazete: null,
    not: "2008 öncesi işlenen fiiller için.",
  },
  {
    id: "CGM_2008",
    ad: "Çalışma Gücü ve Meslekte Kazanma Gücü Kaybı Oranı Tespit İşlemleri Yönetmeliği",
    kisaAd: "ÇGM Yönetmeliği",
    baslangic: "2008-10-11",
    bitis: "2013-08-31",
    resmiGazete: "27021 / 11.10.2008",
    not: null,
  },
  {
    id: "MALULIYET_2013",
    ad: "Maluliyet Tespiti İşlemleri Yönetmeliği",
    kisaAd: "Maluliyet Yönetmeliği 2013",
    baslangic: "2013-09-01",
    bitis: "2015-05-31",
    resmiGazete: "28730 / 03.08.2013",
    not: null,
  },
  {
    id: "OZURLULUK_2015",
    ad: "Özürlülük Ölçütü, Sınıflandırması ve Özürlülere Verilecek Sağlık Kurulu Raporları Hakkında Yönetmelik",
    kisaAd: "Özürlülük Yönetmeliği",
    baslangic: "2015-06-01",
    bitis: "2019-02-19",
    resmiGazete: "28603 / 30.03.2013 (yürürlük 01.06.2015)",
    not: null,
  },
  {
    id: "ENGELLILIK_2019",
    ad: "Erişkinler İçin Engellilik Değerlendirmesi Hakkında Yönetmelik",
    kisaAd: "Engellilik Yönetmeliği 2019",
    baslangic: "2019-02-20",
    bitis: null,
    resmiGazete: "30692 / 20.02.2019",
    not: "18 yaş altı için: Çocuklar İçin Özel Gereksinim Değerlendirmesi Hakkında Yönetmelik (ÇÖZGER).",
    balthazardFormuluUygulanir: true,
  },
];

/**
 * Kaza tarihine göre uygulanacak yönetmeliği döndürür.
 *
 * @param {Date|string} kazaTarihi
 * @returns {{id:string, ad:string, kisaAd:string, resmiGazete:string, baslangic:string|null, bitis:string|null, not:string|null}}
 * @throws {Error} Geçersiz tarih
 */
function selectYonetmelik(kazaTarihi) {
  const t = new Date(kazaTarihi);
  if (isNaN(t.getTime())) {
    throw new Error(`Geçersiz kaza tarihi: ${kazaTarihi}`);
  }

  for (const y of YONETMELIKLER) {
    const bas = y.baslangic ? new Date(y.baslangic) : new Date("1900-01-01");
    const bit = y.bitis ? new Date(y.bitis + "T23:59:59") : new Date("2999-12-31");
    if (t >= bas && t <= bit) {
      return { ...y };
    }
  }

  throw new Error(`Kaza tarihi için yönetmelik bulunamadı: ${kazaTarihi}`);
}

/**
 * Bir maluliyet raporunun hangi yönetmeliğe göre yazıldığını, kaza tarihindeki
 * yönetmelikle karşılaştırır. Uyumsuzluk Yargıtay bozma nedeni olabilir.
 *
 * @param {Date|string} kazaTarihi
 * @param {string} raporYonetmelikId - Raporun dayandığı yönetmelik ID'si
 * @returns {{uyumlu:boolean, dogruYonetmelik:object, raporYonetmelikId:string, uyari:string|null, oneri:string|null}}
 */
function validateRaporYonetmelik(kazaTarihi, raporYonetmelikId) {
  const dogru = selectYonetmelik(kazaTarihi);
  if (dogru.id === raporYonetmelikId) {
    return {
      uyumlu: true,
      dogruYonetmelik: dogru,
      raporYonetmelikId,
      uyari: null,
      oneri: null,
    };
  }

  const raporY = YONETMELIKLER.find((y) => y.id === raporYonetmelikId);
  return {
    uyumlu: false,
    dogruYonetmelik: dogru,
    raporYonetmelik: raporY || null,
    raporYonetmelikId,
    uyari: `YARGI RİSKİ: Kaza ${new Date(kazaTarihi).toLocaleDateString("tr-TR")} tarihinde "${dogru.kisaAd}" yürürlükteydi. Rapor "${raporY?.kisaAd || raporYonetmelikId}" yönetmeliğine göre yazılmış. Yargıtay içtihadına göre kaza tarihindeki yönetmelik esas alınır; yanlış yönetmelik bozma nedenidir.`,
    oneri: `Sağlık Bakanlığı yetkili hastanelerinden "${dogru.ad}" hükümlerine göre yeni bir Sağlık Kurulu Raporu alınması değerlendirilmelidir.`,
  };
}

/**
 * Balthazard Formülü — Birden fazla engel varsa uygulanır.
 * Yönetmelik: Erişkinler İçin Engellilik Değerlendirmesi, Madde 3/a.
 *
 * Formül: Kalan sağlam vücut üzerinden sonraki engeller hesaplanır.
 * Örnek: %40 + %20 → 40 + (100 - 40) × 0.20 = 40 + 12 = %52  (düz toplam %60 DEĞİL)
 *
 * @param {number[]} engeller - Her biri 0-100 arası yüzde
 * @returns {{toplam:number, adimlar:Array, formul:string}}
 */
function balthazardFormulu(engeller) {
  if (!Array.isArray(engeller) || engeller.length === 0) {
    return { toplam: 0, adimlar: [], formul: "Engel girişi yok" };
  }

  // Büyükten küçüğe sırala (yönetmelik gereği)
  const sirali = [...engeller].sort((a, b) => b - a);
  const adimlar = [];
  let toplam = 0;

  for (const engel of sirali) {
    if (engel < 0 || engel > 100) {
      throw new Error(`Geçersiz engel oranı: ${engel}. 0-100 arası olmalı.`);
    }
    const kalan = 100 - toplam;
    const ekle = (kalan * engel) / 100;
    adimlar.push({
      engel,
      oncekiToplam: toplam,
      kalanSaglam: kalan,
      eklenen: Math.round(ekle * 100) / 100,
      yeniToplam: Math.round((toplam + ekle) * 100) / 100,
    });
    toplam += ekle;
  }

  return {
    toplam: Math.round(toplam * 100) / 100,
    adimlar,
    formul: `Balthazard (büyükten küçüğe): ${sirali.join("% + %")}% → ${Math.round(toplam * 100) / 100}%`,
  };
}

module.exports = {
  YONETMELIKLER,
  selectYonetmelik,
  validateRaporYonetmelik,
  balthazardFormulu,
};
