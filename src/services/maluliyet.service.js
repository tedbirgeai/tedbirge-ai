/**
 * Maluliyet Hesaplama Servisi
 *
 * AMA (American Medical Association) Kılavuzu 6. Baskı + Türk SGK uygulaması
 * temel alınarak hazırlanmıştır.
 *
 * Not: Bu tablo Türk mahkemelerinde kabul gören tipik oranları yansıtır.
 * Kesin oran için Adli Tıp veya SGK bilirkişi raporu gerekir.
 */

// ─── AMA Yaralanma Tablosu ────────────────────────────────────────────────────

const AMA_TABLO = [
  // Baş / Beyin
  { tur: "hafif_bth",              ad: "Hafif Beyin Travması",               minOran: 0.05, maxOran: 0.15, aciklama: "Hafif TBI, GCS 14-15, geçici bilinç kaybı" },
  { tur: "orta_bth",               ad: "Orta Beyin Travması",                minOran: 0.20, maxOran: 0.40, aciklama: "Orta TBI, uzun süreli bilinç kaybı" },
  { tur: "agir_bth",               ad: "Ağır Beyin Travması",                minOran: 0.50, maxOran: 0.85, aciklama: "Ağır TBI, kalıcı nörolojik hasar" },

  // Omurga
  { tur: "boyun_hafif",            ad: "Hafif Servikal Yaralanma",           minOran: 0.03, maxOran: 0.10, aciklama: "Whiplash, kas-bağ doku yaralanması" },
  { tur: "boyun_orta",             ad: "Orta Servikal Hasar",                minOran: 0.15, maxOran: 0.25, aciklama: "Disk hernisi, orta radikülpati" },
  { tur: "boyun_agir",             ad: "Ağır Servikal Hasar",                minOran: 0.30, maxOran: 0.60, aciklama: "Medulla spinalis yaralanması, quadripleji riski" },
  { tur: "bel_hafif",              ad: "Hafif Lumbar Yaralanma",             minOran: 0.05, maxOran: 0.12, aciklama: "L4-L5 disk, hafif motor kayıp" },
  { tur: "bel_orta",               ad: "Orta Lumbar Hasar",                  minOran: 0.15, maxOran: 0.28, aciklama: "L5-S1 çöküş, orta fonksiyon kaybı" },
  { tur: "parapleji",              ad: "Parapleji",                          minOran: 0.60, maxOran: 0.90, aciklama: "Alt ekstremite paralizisi" },

  // Üst ekstremite
  { tur: "el_bilek_hafif",         ad: "El / Bilek Hafif Hasar",             minOran: 0.03, maxOran: 0.08, aciklama: "Kırık, tendon yaralanması" },
  { tur: "el_bilek_orta",          ad: "El / Bilek Orta Hasar",              minOran: 0.10, maxOran: 0.20, aciklama: "Kalıcı hareket kısıtlılığı" },
  { tur: "kol_ampute_tek",         ad: "Tek Kol Amputasyonu",                minOran: 0.45, maxOran: 0.60, aciklama: "Bileğin üzerinden ampütasyon" },
  { tur: "kol_ampute_iki",         ad: "Çift Kol Amputasyonu",               minOran: 0.80, maxOran: 0.95, aciklama: "Her iki kolun kaybı" },
  { tur: "omuz_hafif",             ad: "Omuz Hafif Hasar",                   minOran: 0.04, maxOran: 0.10, aciklama: "Rotator cuff, AC eklem" },
  { tur: "omuz_agir",              ad: "Omuz Ağır Hasar",                    minOran: 0.15, maxOran: 0.30, aciklama: "Kalıcı omuz instabilitesi" },

  // Alt ekstremite
  { tur: "ayak_hafif",             ad: "Ayak / Ayak Bileği Hafif",           minOran: 0.03, maxOran: 0.08, aciklama: "Kırık, hafif ligament hasarı" },
  { tur: "diz_orta",               ad: "Diz Orta Hasar",                     minOran: 0.08, maxOran: 0.18, aciklama: "ACL/menisküs, kalıcı instabilite" },
  { tur: "diz_agir",               ad: "Diz Ağır Hasar",                     minOran: 0.20, maxOran: 0.35, aciklama: "Kalıcı diz deformitesi" },
  { tur: "bacak_ampute_tek",       ad: "Tek Bacak Amputasyonu",              minOran: 0.45, maxOran: 0.60, aciklama: "Dizaltı / dizüstü ampütasyon" },
  { tur: "bacak_ampute_iki",       ad: "Çift Bacak Amputasyonu",             minOran: 0.75, maxOran: 0.90, aciklama: "Her iki bacağın kaybı" },

  // Göz
  { tur: "goz_hafif",              ad: "Görme Kaybı Hafif",                  minOran: 0.05, maxOran: 0.15, aciklama: "Tek gözde %50 görme kaybı" },
  { tur: "goz_tek_korf",           ad: "Tek Göz Körleşme",                   minOran: 0.20, maxOran: 0.30, aciklama: "Tek gözde tam görme kaybı" },
  { tur: "goz_iki_korf",           ad: "Tam Körlük",                         minOran: 0.80, maxOran: 0.95, aciklama: "Her iki gözde tam görme kaybı" },

  // İç organlar
  { tur: "akciger_hafif",          ad: "Akciğer Hafif Hasar",                minOran: 0.05, maxOran: 0.15, aciklama: "Pneumotoraks, hafif solunum fonksiyon kaybı" },
  { tur: "akciger_agir",           ad: "Akciğer Ağır Hasar",                 minOran: 0.25, maxOran: 0.50, aciklama: "Kronik solunum yetmezliği" },
  { tur: "karin_organ_hafif",      ad: "Karın Organı Hafif Yaralanma",       minOran: 0.05, maxOran: 0.12, aciklama: "Dalak/böbrek yaralanması, cerrahi" },
  { tur: "karin_organ_agir",       ad: "Karın Organı Ağır Yaralanma",        minOran: 0.20, maxOran: 0.45, aciklama: "Kalıcı sindirim sistemi hasarı" },

  // Yanık
  { tur: "yanik_hafif",            ad: "Yanık Hafif (%10-20 BSA)",           minOran: 0.05, maxOran: 0.15, aciklama: "Yüzeysel yanık, skar dokusu" },
  { tur: "yanik_agir",             ad: "Yanık Ağır (>%30 BSA)",              minOran: 0.30, maxOran: 0.70, aciklama: "Derin yanık, kalıcı deformite" },

  // Psikiyatrik
  { tur: "travma_sonrasi_hafif",   ad: "PTSD Hafif",                         minOran: 0.05, maxOran: 0.15, aciklama: "Travma sonrası hafif stres bozukluğu" },
  { tur: "travma_sonrasi_agir",    ad: "PTSD Ağır",                          minOran: 0.20, maxOran: 0.40, aciklama: "Kalıcı psikiyatrik işlev kaybı" },

  // Ölüm
  { tur: "olum",                   ad: "Ölüm",                               minOran: 1.0,  maxOran: 1.0,  aciklama: "Destekten yoksun kalma tazminatı" },
];

// ─── PMF (Present-Market-Finance) yaşam tablosu ───────────────────────────────

const PMF_TABLO = [
  { yas: 20, pmf: 36 },
  { yas: 25, pmf: 34 },
  { yas: 30, pmf: 31 },
  { yas: 35, pmf: 28 },
  { yas: 40, pmf: 25 },
  { yas: 45, pmf: 22 },
  { yas: 50, pmf: 18 },
  { yas: 55, pmf: 15 },
  { yas: 60, pmf: 11 },
  { yas: 65, pmf: 8 },
  { yas: 70, pmf: 5 },
];

function getPmf(yas) {
  const yas_ = Math.max(20, Math.min(70, Number(yas) || 35));
  for (let i = PMF_TABLO.length - 1; i >= 0; i--) {
    if (yas_ >= PMF_TABLO[i].yas) return PMF_TABLO[i].pmf;
  }
  return 28;
}

// ─── AMA tablosundan yaralanma türü bul ──────────────────────────────────────

function getYaralanmaInfo(tur) {
  return AMA_TABLO.find((r) => r.tur === tur) || null;
}

// ─── Tazminat hesabı ──────────────────────────────────────────────────────────

/**
 * Gerçek tazminat hesabı (AMA kılavuzu formülü)
 *
 * Formül (Yargıtay standart):
 *   Tazminat = AsgariÜcret × 12 × PMF × maluliyetOrani × (1 - kusurOrani)
 *
 * Ölüm davası:
 *   Destekten Yoksun = Gelir × 12 × PMF × destekPayı × (1 - kusurOrani)
 *   destekPayı = 0.70 (70% — eş + çocuklar için tipik)
 *
 * @param {object} params
 * @param {number} params.yas               — Mağdur yaşı
 * @param {number} params.aylikGelir        — Aylık net gelir (TL)
 * @param {number} params.maluliyetOrani    — 0–1 arası (örn. 0.20 = %20)
 * @param {number} params.kusurOrani        — 0–1 arası davacı kusur oranı
 * @param {string} [params.yaralanmaTuru]   — AMA tablosundaki tür kodu
 * @param {boolean} [params.olumDavasi]     — Destekten yoksun kalma mı?
 * @returns {object} hesaplama detayları
 */
function hesaplaTazminat(params) {
  const {
    yas = 35,
    aylikGelir = 22104, // 2026 asgari ücret (net)
    maluliyetOrani = 0,
    kusurOrani = 0,
    yaralanmaTuru = null,
    olumDavasi = false,
  } = params;

  const pmf = getPmf(yas);
  const yillikGelir = aylikGelir * 12;
  const yaralanmaInfo = yaralanmaTuru ? getYaralanmaInfo(yaralanmaTuru) : null;

  // Maluliyet oranı — verilen değer yoksa AMA tablosunun ortasını kullan
  const effectiveMaluliyet = Number(maluliyetOrani) > 0
    ? Number(maluliyetOrani)
    : yaralanmaInfo
      ? (yaralanmaInfo.minOran + yaralanmaInfo.maxOran) / 2
      : 0;

  const effectiveKusur = Math.min(1, Math.max(0, Number(kusurOrani) || 0));

  let brut, net, minTazminat, maxTazminat;

  if (olumDavasi) {
    const destekPayi = 0.70;
    brut = yillikGelir * pmf * destekPayi;
    net = brut * (1 - effectiveKusur);
    minTazminat = net * 0.85;
    maxTazminat = net * 1.20;
  } else {
    brut = yillikGelir * pmf * effectiveMaluliyet;
    net = brut * (1 - effectiveKusur);
    // Manevi tazminat tahmini (%30 ek — Yargıtay standart)
    const manevi = net * 0.30;
    minTazminat = net * 0.85;
    maxTazminat = (net + manevi) * 1.15;
  }

  // 2026 ZMSS limitleri
  const ZMSS_LIMIT = olumDavasi ? 1_540_000 : 924_000;
  const zmssUyari = net > ZMSS_LIMIT;

  return {
    pmf,
    yillikGelir: Math.round(yillikGelir),
    effectiveMaluliyet: Math.round(effectiveMaluliyet * 1000) / 1000,
    effectiveKusur: Math.round(effectiveKusur * 1000) / 1000,
    brutTazminat: Math.round(brut),
    netTazminat: Math.round(net),
    minTazminat: Math.round(minTazminat),
    maxTazminat: Math.round(maxTazminat),
    zmssLimit: ZMSS_LIMIT,
    zmssUyari,
    yaralanmaInfo: yaralanmaInfo || null,
    hesaplamaFormul: `${Math.round(aylikGelir).toLocaleString("tr-TR")} TL × 12 × PMF(${pmf}) × ${Math.round(effectiveMaluliyet * 100)}% maluliyet × (1 - ${Math.round(effectiveKusur * 100)}% kusur)`,
  };
}

module.exports = {
  AMA_TABLO,
  PMF_TABLO,
  getPmf,
  getYaralanmaInfo,
  hesaplaTazminat,
};
