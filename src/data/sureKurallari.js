// src/data/sureKurallari.js
// -----------------------------------------------------------------------------
// Hukuki sure kurallari tablosu. Veri odakli — yeni sure eklemek icin kod
// degistirmeye gerek yok, buraya satir ekle, sureMotoru.service.js otomatik alir.
//
// Alan isimleri: sureMotoru.service.js icindeki normalizeLead() ile
// DB alan adlarindan (accidentDate, injurySeverity vb.) kanoniklere cevrilir.
//   olayTarihi    <- accidentDate
//   basvuruTarihi <- ihtarnameler[0].gonderimTarihi (veya null)
//   kazaSonucu    <- injurySeverity'den turetilir
//
// Her kural:
//   tip:            Unique tanimlayici (UPPER_SNAKE)
//   etiket:         Hukukcu ekraninda gorunecek kisa ad
//   yasalDayanak:   Kanun maddesi atifi
//   sureGun:        Takvim gunu (null ise handler fonksiyon kullaniliyor)
//   baslangicAlani: normalizeLead sonrasi lead uzerindeki alan adi
//   tetikleyici:    Hangi sartlarda devreye girer (muhatapTipi filtresi, vb)
//   aksiyon:        Sure dolunca onerilen aksiyon (demo metni)
//   esik:           { yesil, sari, kirmizi } gun cinsinden — renklendirme icin
//   handler:        Ozel hesap gerekiyorsa fonksiyon adi, genelde null
// -----------------------------------------------------------------------------

const SURE_KURALLARI = [
  {
    tip: "SIGORTA_CEVAP",
    etiket: "Sigorta cevap suresi",
    yasalDayanak: "KTK m.99",
    sureGun: 15,
    baslangicAlani: "basvuruTarihi",
    tetikleyici: {
      muhatapTipi: ["TRAFIK_SIGORTASI", "KASKO"],
      gerekliAlan: "basvuruTarihi",
    },
    aksiyon: "Cevap yoksa STK basvurusu veya dava acilabilir",
    esik: { yesil: 7, sari: 3, kirmizi: 1 },
    handler: null,
  },
  {
    tip: "ISVEREN_BILDIRIM",
    etiket: "Isveren is kazasi bildirim suresi",
    yasalDayanak: "ISG Kanunu m.14",
    sureGun: 3,
    baslangicAlani: "olayTarihi",
    tetikleyici: {
      muhatapTipi: ["ISVEREN"],
      gerekliAlan: "olayTarihi",
    },
    aksiyon: "Is kazasi SGK'ya bildirilmeli, gecikirse idari para cezasi",
    esik: { yesil: 2, sari: 1, kirmizi: 0 },
    handler: null,
  },
  {
    tip: "SGK_RUCU_ZAMANASIMI",
    etiket: "SGK rucu zamanasimi",
    yasalDayanak: "5510 SK m.21",
    sureGun: 3650,
    baslangicAlani: "olayTarihi",
    tetikleyici: {
      muhatapTipi: ["SGK"],
      gerekliAlan: "olayTarihi",
    },
    aksiyon: "SGK rucu hakkini kullanabilir, musavvil takip",
    esik: { yesil: 365, sari: 180, kirmizi: 90 },
    handler: null,
  },
  {
    tip: "TBK_ZAMANASIMI",
    etiket: "Tazminat zamanasimi",
    yasalDayanak: "TBK m.72",
    sureGun: null,
    baslangicAlani: "olayTarihi",
    tetikleyici: {
      muhatapTipi: null, // Tum davalarda gecerli
      gerekliAlan: "olayTarihi",
    },
    aksiyon: "Zamanasimi dolmadan dava acilmali",
    esik: { yesil: 365, sari: 180, kirmizi: 30 },
    handler: "hesaplaTBKZamanasimi",
  },
];

module.exports = { SURE_KURALLARI };
