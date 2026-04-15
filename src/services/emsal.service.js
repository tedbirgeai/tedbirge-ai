/**
 * Emsal Yargıtay Kararları Servisi
 * Mock veri — ileride gerçek Yargıtay/Emsal API ile değiştirilebilir
 */

const EMSAL_TRAFIK = [
  {
    esasNo: "2023/14872",
    kararNo: "2024/3219",
    daire: "Yargıtay 17. Hukuk Dairesi",
    tarih: "2024-03-12",
    konu: "Trafik kazası — bedensel zarar tazminatı",
    ozet:
      "Trafik kazasında %100 kusurlu araç sürücüsünün müvekkilini yaralaması sonucu doğan maddi ve manevi zararın tazminine hükmedilmiştir. Aktif dönem hesabında PMF tablosu esas alınmış; maluliyet oranı hastane raporu ile sabit kabul edilmiştir.",
    sonuc: "Maddi: 312.500 TL, Manevi: 75.000 TL",
    ilgiliMaddeler: ["KTK m.85", "BK m.49", "BK m.56"],
  },
  {
    esasNo: "2022/9341",
    kararNo: "2023/11804",
    daire: "Yargıtay 17. Hukuk Dairesi",
    tarih: "2023-09-07",
    konu: "Araç değer kaybı tazminatı",
    ozet:
      "Kusurlu aracın hasara yol açtığı kaza sonrası araçta meydana gelen değer kaybının tazmin edilmesi gerektiğine hükmedilmiştir. Değer kaybı tespitinde bilirkişi raporu ve TRAMER kayıtları esas alınmıştır.",
    sonuc: "Değer kaybı: 48.200 TL",
    ilgiliMaddeler: ["KTK m.85", "BK m.51", "TTK m.1483"],
  },
  {
    esasNo: "2023/5621",
    kararNo: "2024/1087",
    daire: "Yargıtay 4. Hukuk Dairesi",
    tarih: "2024-01-22",
    konu: "Destekten yoksun kalma tazminatı — trafik ölüm",
    ozet:
      "Trafik kazasında hayatını kaybeden desteğin eşi ve çocukları lehine destekten yoksun kalma tazminatına hükmedilmiştir. Destek paylaşım oranları Yargıtay içtihadına göre belirlenmiştir.",
    sonuc: "Toplam tazminat: 1.250.000 TL",
    ilgiliMaddeler: ["KTK m.85", "BK m.45", "PMF tablosu"],
  },
  {
    esasNo: "2021/18433",
    kararNo: "2022/7654",
    daire: "Yargıtay 17. Hukuk Dairesi",
    tarih: "2022-06-14",
    konu: "Sigorta şirketi rücu davası — kusur tespiti",
    ozet:
      "Sigortalı araç sürücüsünün tam kusurlu olduğu kaza sonrası sigorta şirketinin poliçe limitini aşan zararı karşılamak zorunda olmadığına, ZMSS limitinin DASK güvencesiyle birlikte değerlendirileceğine hükmedilmiştir.",
    sonuc: "ZMSS limiti uygulandı: 924.000 TL",
    ilgiliMaddeler: ["KTK m.91", "KTK m.95", "ZMSS Tarifeleri"],
  },
  {
    esasNo: "2024/2103",
    kararNo: "2024/8821",
    daire: "Yargıtay 4. Hukuk Dairesi",
    tarih: "2024-11-03",
    konu: "Manevi tazminat miktarının tespiti",
    ozet:
      "Ağır yaralanma (kalıcı sakatlik) nedeniyle talep edilen manevi tazminatın belirlenmesinde ekonomik ve sosyal durum, olayın ağırlığı, kusurun derecesi birlikte değerlendirilmiştir. Mahkemenin düşük manevi tazminata hükmetmesi bozulmuştur.",
    sonuc: "Manevi tazminat: 150.000 TL",
    ilgiliMaddeler: ["BK m.56", "BK m.49", "AİHM içtihadı"],
  },
];

const EMSAL_IS_KAZASI = [
  {
    esasNo: "2023/7812",
    kararNo: "2024/4431",
    daire: "Yargıtay 21. Hukuk Dairesi",
    tarih: "2024-02-19",
    konu: "İş kazası — sürekli iş göremezlik tazminatı",
    ozet:
      "İşyerinde alınması gereken güvenlik önlemlerinin alınmaması sonucu meydana gelen iş kazasında işverenin %80 oranında kusurlu olduğuna hükmedilmiştir. SGK tarafından karşılanmayan kısım işverenden tahsil edilmiştir.",
    sonuc: "İşveren tazminatı: 890.000 TL",
    ilgiliMaddeler: ["İSK m.77", "BK m.332", "SGK 5510 m.21"],
  },
  {
    esasNo: "2022/14501",
    kararNo: "2023/9203",
    daire: "Yargıtay 21. Hukuk Dairesi",
    tarih: "2023-07-31",
    konu: "İş kazası ölümü — destekten yoksun kalma",
    ozet:
      "İnşaat alanında düşme sonucu hayatını kaybeden işçinin eşi ve iki çocuğu için destekten yoksun kalma tazminatına hükmedilmiştir. SGK ölüm aylığı mahsup edilmiştir.",
    sonuc: "Net tazminat: 1.420.000 TL (SGK mahsubu sonrası)",
    ilgiliMaddeler: ["BK m.45", "İSK m.77", "SGK 5510 m.16"],
  },
  {
    esasNo: "2023/3301",
    kararNo: "2023/18921",
    daire: "Yargıtay 9. Hukuk Dairesi",
    tarih: "2023-12-05",
    konu: "İş kazası — kısmi maluliyet + tedavi giderleri",
    ozet:
      "Fabrikada parmak kesilmesi sonucu %15 maluliyet tespit edilmiş; işverenin gerekli İSG önlemlerini almadığı saptanarak tam sorumluluğuna hükmedilmiştir.",
    sonuc: "Maddi: 185.000 TL, Manevi: 45.000 TL",
    ilgiliMaddeler: ["İSK m.77", "BK m.49", "İSG Kanunu m.4"],
  },
  {
    esasNo: "2021/22104",
    kararNo: "2022/13450",
    daire: "Yargıtay 21. Hukuk Dairesi",
    tarih: "2022-10-18",
    konu: "SGK rücu davası — işveren karşı dava",
    ozet:
      "SGK'nın iş kazası nedeniyle yaptığı ödemeler için işverene açtığı rücu davasında mahkeme, müterafik kusur indiriminden sonra işverenin SGK'ya ödemesi gereken tutara hükmetmiştir.",
    sonuc: "Rücu tazminatı: 320.000 TL",
    ilgiliMaddeler: ["SGK 5510 m.21", "SGK 5510 m.76", "BK m.332"],
  },
  {
    esasNo: "2024/1002",
    kararNo: "2024/6677",
    daire: "Yargıtay 9. Hukuk Dairesi",
    tarih: "2024-08-29",
    konu: "Meslek hastalığı — geç bildirim cezası",
    ozet:
      "Meslek hastalığının işverence zamanında SGK'ya bildirilmediği saptanmış; gecikme cezası ve tazminatın faizi ile birlikte işverenden tahsiline karar verilmiştir.",
    sonuc: "Ceza + tazminat: 97.500 TL",
    ilgiliMaddeler: ["SGK 5510 m.14", "SGK 5510 m.21", "İSG m.14"],
  },
];

/**
 * Kaza türüne göre emsal Yargıtay kararlarını döner.
 * @param {string} accidentType - "TRAFIK" | "IS_KAZASI" veya herhangi bir string
 * @returns {Array} Emsal kararlar listesi
 */
function getEmsalKararlar(accidentType) {
  const tip = (accidentType || "").toUpperCase();
  if (tip.includes("IS") || tip.includes("İŞ") || tip.includes("WORK") || tip.includes("MESLEK")) {
    return EMSAL_IS_KAZASI;
  }
  // Varsayılan: trafik
  return EMSAL_TRAFIK;
}

module.exports = { getEmsalKararlar };
