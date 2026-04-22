// src/services/sureMotoru.service.js
// -----------------------------------------------------------------------------
// W1-M4 Sure Motoru — hukuki sureleri lead uzerinden hesaplar.
//
// Pure function: (lead) => SureUyarisi[]
//
// Alan ismi adaptasyonu (DB -> kanik):
//   accidentDate        -> olayTarihi
//   injurySeverity      -> kazaSonucu ("olum" | "yaralanma" | "maddi")
//   basvuruTarihi       -> ihtarnameler[0].gonderimTarihi (varsa)
//
// - zamanasimi.service.js'i import eder (DRY, 4 baska servis kullaniyor)
// - sureKurallari.js tablosundan kurallari okur
// - HMK m.93 son gun kontrolu: son gun Pazar/Cumartesi ise ilk is gunune kaydir
// - Tam resmi tatil listesi Sprint 2'de gelecek
//
// Sprint 3-4'te Ajan 5 (Sure ve Tebligat Ajani) bu fonksiyonu cekirdek olarak
// kullanacak. Bu servis atilacak degil, Ajan 5'in beyin katmani olarak kalacak.
// -----------------------------------------------------------------------------

const { hesaplaZamanasimi } = require("./zamanasimi.service");
const { SURE_KURALLARI } = require("../data/sureKurallari");

const GUN_MS = 24 * 60 * 60 * 1000;

// -----------------------------------------------------------------------------
// Alan normalizasyonu — DB alan adlarindan kanoniklere
// -----------------------------------------------------------------------------
function normalizeLead(raw) {
  // accidentDate -> olayTarihi
  const olayTarihi = raw.accidentDate || raw.olayTarihi || null;

  // basvuruTarihi: ilk ihtarname gonderim tarihi (Lead.ihtarnameler include edilmisse)
  const ihtarnameler = raw.ihtarnameler || [];
  const ilkGonderilen = ihtarnameler
    .filter((i) => i.gonderimTarihi)
    .sort((a, b) => new Date(a.gonderimTarihi) - new Date(b.gonderimTarihi))[0];
  const basvuruTarihi =
    raw.basvuruTarihi || (ilkGonderilen ? ilkGonderilen.gonderimTarihi : null);

  // kazaSonucu: injurySeverity'den turet ("olum" | "yaralanma" | "maddi")
  let kazaSonucu = raw.kazaSonucu || null;
  if (!kazaSonucu && raw.injurySeverity) {
    const s = raw.injurySeverity.toUpperCase();
    if (s.includes("OLUM") || s === "FATAL" || s === "DEATH") {
      kazaSonucu = "olum";
    } else {
      kazaSonucu = "yaralanma";
    }
  }
  if (!kazaSonucu) kazaSonucu = "yaralanma"; // varsayilan

  return { ...raw, olayTarihi, basvuruTarihi, kazaSonucu };
}

// -----------------------------------------------------------------------------
// HMK m.93: Son gun Cumartesi/Pazar ise ilk is gunune kaydir.
// Tam resmi tatil listesi Sprint 2'de eklenecek.
// -----------------------------------------------------------------------------
function kaydirSonGun(tarih) {
  const d = new Date(tarih);
  const gun = d.getDay(); // 0=Pazar, 6=Cumartesi
  if (gun === 0) d.setDate(d.getDate() + 1); // Pazar -> Pazartesi
  if (gun === 6) d.setDate(d.getDate() + 2); // Cumartesi -> Pazartesi
  return d;
}

// Takvim gunu farki. Pozitif: gelecek. Negatif: gecmis.
function kalanGun(bitisTarihi) {
  const simdi = new Date();
  simdi.setHours(0, 0, 0, 0);
  const bitis = new Date(bitisTarihi);
  bitis.setHours(0, 0, 0, 0);
  return Math.round((bitis - simdi) / GUN_MS);
}

function durumBelirle(kalan, esik) {
  if (kalan < 0) return "GECTI";
  if (kalan <= esik.kirmizi) return "KIRMIZI";
  if (kalan <= esik.sari) return "SARI";
  return "YESIL";
}

// -----------------------------------------------------------------------------
// Handler: TBK m.72 zamanasimi — mevcut zamanasimi.service.js'e delege eder
// -----------------------------------------------------------------------------
function hesaplaTBKZamanasimi(lead) {
  if (!lead.olayTarihi || !lead.kazaSonucu) return null;
  try {
    const sonuc = hesaplaZamanasimi(
      lead.olayTarihi,
      lead.kazaSonucu,
      lead.maluliyetKesinlesme || null
    );
    // zamanasimi.service.js ciktisi: { bitisTarihi, kalanGun, uyariSeviyesi, ... }
    if (!sonuc || !sonuc.bitisTarihi) return null;
    return {
      bitisTarihi: new Date(sonuc.bitisTarihi),
      kaynak: sonuc,
    };
  } catch (e) {
    console.error("[sureMotoru] TBK zamanasimi hesap hatasi:", e.message);
    return null;
  }
}

const HANDLERS = { hesaplaTBKZamanasimi };

// -----------------------------------------------------------------------------
// Tek kural icin hesaplama
// -----------------------------------------------------------------------------
function kuralIcinHesapla(lead, kural) {
  // muhatap filtresi
  if (kural.tetikleyici.muhatapTipi !== null) {
    if (!kural.tetikleyici.muhatapTipi.includes(lead.muhatapTipi)) {
      return null;
    }
  }

  // gerekli alan bos ise kural devreye girmez
  if (!lead[kural.tetikleyici.gerekliAlan]) {
    return null;
  }

  let bitisTarihi;

  if (kural.handler && HANDLERS[kural.handler]) {
    const handlerSonuc = HANDLERS[kural.handler](lead);
    if (!handlerSonuc) return null;
    bitisTarihi = handlerSonuc.bitisTarihi;
  } else {
    const baslangic = new Date(lead[kural.baslangicAlani]);
    bitisTarihi = new Date(baslangic.getTime() + kural.sureGun * GUN_MS);
  }

  bitisTarihi = kaydirSonGun(bitisTarihi);

  const kalan = kalanGun(bitisTarihi);
  const durum = durumBelirle(kalan, kural.esik);

  return {
    tip: kural.tip,
    etiket: kural.etiket,
    yasalDayanak: kural.yasalDayanak,
    baslangicTarihi: lead[kural.baslangicAlani],
    bitisTarihi: bitisTarihi.toISOString(),
    kalanGun: kalan,
    durum,
    aksiyon: kural.aksiyon,
  };
}

// -----------------------------------------------------------------------------
// ANA API
// @param {Object} rawLead - Prisma Lead objesi (accidentDate, injurySeverity, muhatapTipi, ihtarnameler?)
// @returns {Array} SureUyarisi[] — sirali: GECTI > KIRMIZI > SARI > YESIL
// -----------------------------------------------------------------------------
function hesaplaSureler(rawLead) {
  if (!rawLead) return [];

  const lead = normalizeLead(rawLead);
  const sonuclar = [];

  for (const kural of SURE_KURALLARI) {
    const sonuc = kuralIcinHesapla(lead, kural);
    if (sonuc) sonuclar.push(sonuc);
  }

  const oncelik = { GECTI: 0, KIRMIZI: 1, SARI: 2, YESIL: 3 };
  sonuclar.sort((a, b) => {
    const fark = oncelik[a.durum] - oncelik[b.durum];
    if (fark !== 0) return fark;
    return a.kalanGun - b.kalanGun;
  });

  return sonuclar;
}

module.exports = { hesaplaSureler };
