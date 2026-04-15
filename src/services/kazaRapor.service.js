/**
 * Kaza Rekreasyon Raporu Servisi
 * Lead verisinden yapılandırılmış hukuki ön rapor üretir.
 */

// 2026 ZMSS Limitleri
const ZMSS_2026 = {
  olum: 1_540_000,
  sakatlik: 924_000,
  malVarligi: 462_000,
};

// SGK 2026 prime esas kazanç tavanı
const SGK_2026_TAVAN = 270_300;

const KAZA_TURU_LABEL = {
  TRAFIK: "Trafik Kazası",
  IS_KAZASI: "İş Kazası",
  DIGER: "Diğer",
};

const INJURY_LABEL = {
  NONE: "Yaralanma yok",
  MINOR: "Hafif yaralanma",
  MODERATE: "Orta düzey yaralanma",
  SEVERE: "Ağır yaralanma",
  DEATH: "Ölüm",
};

function formatDate(d) {
  if (!d) return "Belirtilmemiş";
  return new Date(d).toLocaleDateString("tr-TR");
}

function formatTL(n) {
  if (n == null) return "Bilinmiyor";
  return n.toLocaleString("tr-TR") + " TL";
}

/**
 * Eksik belge listesini döner.
 */
function getEksikBelgeler(lead) {
  const eksik = [];
  if (!lead.accidentDate) eksik.push("Kaza tarihi");
  if (!lead.city) eksik.push("Kaza yeri / şehir");
  if (!lead.injurySeverity || lead.injurySeverity === "NONE") eksik.push("Yaralanma belgesi (sağlık raporu)");
  if (!lead.monthlyIncome) eksik.push("Gelir belgesi (bordro / SGK dökümü)");
  if (!lead.maluliyetRate) eksik.push("Maluliyet raporu (sağlık kurulu)");

  const accidentType = (lead.accidentType || "").toUpperCase();
  if (accidentType.includes("TRAFIK") || !accidentType.includes("IS")) {
    eksik.push("Kaza tespit tutanağı (veya trafik polis tutanağı)");
    eksik.push("TRAMER kayıt dökümü");
  }
  if (accidentType.includes("IS") || accidentType.includes("İŞ")) {
    eksik.push("İş kazası bildirge belgesi (SGK)");
    eksik.push("İşyeri kaza tutanağı");
    eksik.push("İSG iç soruşturma raporu");
  }
  return eksik;
}

/**
 * Tahmini dava süresini döner.
 */
function getTahminiDavaSuresi(lead) {
  const tip = (lead.accidentType || "").toUpperCase();
  if (tip.includes("IS") || tip.includes("İŞ")) {
    return {
      ilkDerece: "12–24 ay",
      istinaf: "6–12 ay",
      temyiz: "12–18 ay",
      toplam: "~2–4 yıl",
      aciklama: "İş mahkemesi davaları zorunlu arabuluculuk aşamasıyla başlar (ortalama 3 ay).",
    };
  }
  return {
    ilkDerece: "18–30 ay",
    istinaf: "6–12 ay",
    temyiz: "12–24 ay",
    toplam: "~3–5 yıl",
    aciklama: "Trafik kazası davalarında bilirkişi incelemesi süreyi uzatabilir.",
  };
}

/**
 * Kusur analizi ve hukuki dayanakları döner.
 */
function getKusurAnalizi(lead) {
  const tip = (lead.accidentType || "").toUpperCase();
  const faultRate = lead.faultRate ?? null;
  const isTrafik = !tip.includes("IS") && !tip.includes("İŞ");

  if (isTrafik) {
    return {
      baslik: "Trafik Kazası Kusur Analizi (KTK)",
      yasal: ["KTK m.84 — Sürücünün trafiğe katılma koşulları", "KTK m.85 — İşleten sorumluluğu (kusursuz sorumluluk)", "BK m.51 — Tazminattan indirim (müterafik kusur)"],
      musterKusurOrani: faultRate != null ? `%${(faultRate * 100).toFixed(0)}` : "Tespit edilmedi",
      aciklama:
        faultRate === 0
          ? "Müvekkil kusursuz görünmektedir. Karşı tarafın tam kusurlu olması halinde tazminatta indirim uygulanmaz."
          : faultRate != null
          ? `Müvekkile %${(faultRate * 100).toFixed(0)} oranında kusur atfedilmektedir. Bu oran tazminattan düşülür (BK m.51).`
          : "Kusur oranı belgelerle henüz teyit edilmemiştir. Kaza tutanağı temin edilmelidir.",
    };
  }

  return {
    baslik: "İş Kazası Kusur Analizi (İSK / BK)",
    yasal: ["İSK m.77 — İşverenin iş sağlığı ve güvenliği yükümlülüğü", "BK m.332 — İşverenin sözleşmeden doğan koruma borcu", "SGK 5510 m.21 — Sigortalının ölümünde/sakatlığında işveren tazminası"],
    musterKusurOrani: faultRate != null ? `İşçi kusuru %${(faultRate * 100).toFixed(0)}` : "Tespit edilmedi",
    aciklama:
      "Türk iş hukukunda karine işveren aleyhine; işverenin tüm İSG önlemlerini aldığını ispat yükümlülüğü işverene aittir (BK m.332).",
  };
}

/**
 * Lead verisinden kaza rekreasyon raporu oluşturur.
 * @param {object} lead
 * @returns {object} Yapılandırılmış rapor
 */
function generateKazaRaporu(lead) {
  const tip = (lead.accidentType || "TRAFIK").toUpperCase();
  const isTrafik = !tip.includes("IS") && !tip.includes("İŞ");

  const zamAnasimi = isTrafik
    ? { sure: "2 yıl", kanun: "TBK m.72 / KTK m.109", tarih: lead.accidentDate ? new Date(new Date(lead.accidentDate).getTime() + 2 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString("tr-TR") : "Bilinmiyor" }
    : { sure: "10 yıl", kanun: "BK m.146", tarih: lead.accidentDate ? new Date(new Date(lead.accidentDate).getTime() + 10 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString("tr-TR") : "Bilinmiyor" };

  return {
    olusturmaTarihi: new Date().toLocaleDateString("tr-TR"),
    kazaBilgisi: {
      tur: KAZA_TURU_LABEL[tip] || tip,
      tarih: formatDate(lead.accidentDate),
      sehir: lead.city || "Belirtilmemiş",
      yaralanmaSiddeti: INJURY_LABEL[lead.injurySeverity] || lead.injurySeverity || "Belirtilmemiş",
      ozet: lead.accidentSummary || "Kaza özeti henüz eklenmemiş.",
    },
    taraflar: {
      musteri: lead.customerName || "Belirtilmemiş",
      telefon: lead.customerPhone || "-",
      yas: lead.age ?? "Bilinmiyor",
      aylikGelir: formatTL(lead.monthlyIncome),
      maluliyetOrani: lead.maluliyetRate != null ? `%${(lead.maluliyetRate * 100).toFixed(0)}` : "Tespit edilmedi",
    },
    kusurAnalizi: getKusurAnalizi(lead),
    eksikBelgeler: getEksikBelgeler(lead),
    zamAnasimi,
    tahminiDavaSuresi: getTahminiDavaSuresi(lead),
    zmss2026: {
      olumTazminati: formatTL(ZMSS_2026.olum),
      sakatlikTazminati: formatTL(ZMSS_2026.sakatlik),
      malVarligi: formatTL(ZMSS_2026.malVarligi),
      aciklama: "2026 yılı ZMSS (Zorunlu Mali Sorumluluk Sigortası) tazminat limitleri.",
    },
    sgk2026: {
      primeEsasKazancTavan: formatTL(SGK_2026_TAVAN),
      aciklama: "2026 SGK prime esas kazanç tavanı — iş kazası hesaplamalarında baz alınır.",
    },
    tahminiTazminat: {
      min: lead.estimatedCompensation ? Math.round(lead.estimatedCompensation * 0.85) : null,
      max: lead.estimatedCompensation ? Math.round(lead.estimatedCompensation * 1.15) : null,
      label: lead.estimatedCompensation ? `${formatTL(Math.round(lead.estimatedCompensation * 0.85))} – ${formatTL(Math.round(lead.estimatedCompensation * 1.15))}` : "Hesaplanmadı",
    },
  };
}

module.exports = { generateKazaRaporu };
