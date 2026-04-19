/**
 * Tazminat Zamanaşımı Hesaplama Servisi
 *
 * Yasal Dayanak:
 * - TBK m.72: Haksız fiilde 2 yıl (öğrenme) / 10 yıl (her halde)
 * - KTK m.109: Trafik kazası için 2 yıl / 10 yıl
 * - TBK m.72/I: Fiil suç teşkil ediyorsa ceza zamanaşımı uygulanır (uzamış)
 * - TCK m.85: Taksirle öldürme → 15 yıl
 * - TCK m.89: Taksirle yaralama → 8 yıl
 *
 * Yargıtay İçtihadı: Yaralanma sonucu maluliyet kesinleşirse, zamanaşımı
 * maluliyet kesinleşme tarihinden başlar (sürenin lehinde yorum).
 */

const ZAMANASIMI_SURELERI = {
  maddi: {
    yil: 2,
    dayanak: "TBK m.72 / KTK m.109 — sadece maddi hasar",
  },
  maddi_her_halde: {
    yil: 10,
    dayanak: "TBK m.72 — her halde süresi",
  },
  yaralanma: {
    yil: 8,
    dayanak: "TCK m.89 (taksirle yaralama) uzamış ceza zamanaşımı",
  },
  olum: {
    yil: 15,
    dayanak: "TCK m.85 (taksirle öldürme) uzamış ceza zamanaşımı",
  },
};

/**
 * Zamanaşımı durumunu hesaplar.
 *
 * @param {Date|string} kazaTarihi
 * @param {"maddi"|"yaralanma"|"olum"} kazaSonucu
 * @param {Date|string|null} maluliyetKesinlesme - Maluliyet raporunun kesinleştiği tarih (opsiyonel)
 * @returns {{kazaTarihi:string, kazaSonucu:string, zamanasimiSuresi:number, dayanak:string, baslangicTarihi:string, bitisTarihi:string, kalanYil:number, kalanGun:number, dolmusMu:boolean, uyariSeviyesi:"YOK"|"DIKKAT"|"KRITIK"|"DOLMUS", uyari:string|null}}
 */
function hesaplaZamanasimi(kazaTarihi, kazaSonucu, maluliyetKesinlesme = null) {
  const kaza = new Date(kazaTarihi);
  if (isNaN(kaza.getTime())) {
    throw new Error(`Geçersiz kaza tarihi: ${kazaTarihi}`);
  }

  if (!["maddi", "yaralanma", "olum"].includes(kazaSonucu)) {
    throw new Error(`Geçersiz kaza sonucu: ${kazaSonucu}. "maddi", "yaralanma" veya "olum" olmalı.`);
  }

  const bugun = new Date();
  const ilgili = ZAMANASIMI_SURELERI[kazaSonucu];

  // Yaralanma + maluliyet kesinleşmiş ise, başlangıç kesinleşme tarihi (lehine)
  const baslangic = maluliyetKesinlesme ? new Date(maluliyetKesinlesme) : kaza;

  // Bitiş tarihi
  const bitis = new Date(baslangic);
  bitis.setFullYear(bitis.getFullYear() + ilgili.yil);

  const msKalan = bitis.getTime() - bugun.getTime();
  const kalanGun = Math.round(msKalan / (1000 * 60 * 60 * 24));
  const kalanYil = Math.round((kalanGun / 365.25) * 10) / 10;

  const dolmusMu = msKalan <= 0;

  let uyariSeviyesi = "YOK";
  let uyari = null;

  if (dolmusMu) {
    uyariSeviyesi = "DOLMUS";
    uyari = `ZAMANAŞIMI DOLMUŞ: Son başvuru tarihi ${bitis.toLocaleDateString("tr-TR")} geçmiş. ${Math.abs(kalanGun)} gün önce. Ceza davası süreci veya zamanaşımı kesme sebepleri değerlendirilmelidir.`;
  } else if (kalanYil <= 0.5) {
    uyariSeviyesi = "KRITIK";
    uyari = `KRİTİK: Zamanaşımına ${kalanGun} gün kaldı (son: ${bitis.toLocaleDateString("tr-TR")}). DERHAL dava açın veya zamanaşımını kesici işlem yapın.`;
  } else if (kalanYil <= 1) {
    uyariSeviyesi = "DIKKAT";
    uyari = `DİKKAT: Zamanaşımına ${kalanYil} yıl kaldı. Dava hazırlıklarına hız verilmeli.`;
  }

  return {
    kazaTarihi: kaza.toISOString().split("T")[0],
    kazaSonucu,
    zamanasimiSuresi: ilgili.yil,
    dayanak: ilgili.dayanak,
    baslangicTarihi: baslangic.toISOString().split("T")[0],
    baslangicNedeni: maluliyetKesinlesme
      ? "Maluliyet kesinleşme tarihi (Yargıtay içtihadı)"
      : "Kaza tarihi",
    bitisTarihi: bitis.toISOString().split("T")[0],
    kalanYil,
    kalanGun,
    dolmusMu,
    uyariSeviyesi,
    uyari,
    // İkinci görüş: her halde 10 yıl kuralı da kontrol edilmeli
    herHalde10Yil: kontrol10YilKurali(kaza, bugun),
  };
}

function kontrol10YilKurali(kaza, bugun) {
  const bitis = new Date(kaza);
  bitis.setFullYear(bitis.getFullYear() + 10);
  const msKalan = bitis.getTime() - bugun.getTime();
  const kalanYil = Math.round((msKalan / (1000 * 60 * 60 * 24 * 365.25)) * 10) / 10;

  return {
    bitis: bitis.toISOString().split("T")[0],
    kalanYil,
    dolmusMu: msKalan <= 0,
    not: "TBK m.72 her halde süresi. Uzamış ceza zamanaşımı devrede ise bu süre aşılabilir (Yargıtay içtihadı).",
  };
}

module.exports = {
  ZAMANASIMI_SURELERI,
  hesaplaZamanasimi,
};
