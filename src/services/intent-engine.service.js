// TUR #132.4 + #132.6 — Intent Engine (rule-based + keyword matching)
// Madde 24.14 R1 KALIN — Tedbirge mulkiyeti, $0, KVKK lokal
// Chatbot servisinin niyet tespit motoru.
// v3: 45 intent (FAQ v3 ile uyumlu) + Turkce karakter normalize
//
// DÜRÜSTLÜK NOTU: "Binlerce cevap" tek bir dosyada elle yazılamaz — bu
// dürüst değildir. Bunun yerine v2'deki 30 intent üzerine, trafik/iş
// kazası sürecinde GERÇEKTEN sorulan 15 yeni konu eklendi (45 toplam) +
// birçok mevcut intent'e konuşma dilindeki varyasyonlar/yazım hataları
// eklendi. Motor hâlâ kural-tabanlıdır (LLM değil), ama artık günlük
// dildeki soruların çok daha fazlasını doğru intent'e eşler.

"use strict";

function normalize(text) {
  return String(text || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/i̇/g, "i")
    .replace(/I/g, "i")
    .replace(/[.,!?;:()"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Türkçe'de en sık eklenen çekim ekleri — kaba ama etkili bir "gövdeleme"
// (stemming). "çarptı" / "çarpması" / "çarpan" gibi varyasyonların hepsi
// aynı kökle eşleşsin diye kelimenin sonundaki bu ekleri kırpar.
const SUFFIXES = [
  "lerinden", "larından", "lerinde", "larında", "lerini", "larını",
  "diğim", "diğin", "dığı", "diği", "dığım",
  "yordu", "yorum", "yorsun",
  "acağım", "eceğim", "acaktı", "ecekti",
  "mıştı", "mişti", "muştu", "müştü",
  "ması", "mesi", "manın", "menin",
  "dan", "den", "tan", "ten",
  "nın", "nin", "nun", "nün",
  "ları", "leri", "lar", "ler",
  "dım", "dim", "dum", "düm", "tım", "tim", "tum", "tüm",
  "dı", "di", "du", "dü", "tı", "ti", "tu", "tü",
  "ım", "im", "um", "üm",
  "ın", "in", "un", "ün",
  "a", "e", "ı", "i", "u", "ü", "o", "ö",
];

function stem(word) {
  let w = word;
  // en uzun ekten başlayarak TEK bir ek kırp (agresif çoklu kırpma yanlış
  // pozitif üretir, tek seferlik kırpma yeterli iyileştirme sağlar)
  for (const suf of SUFFIXES) {
    if (w.length - suf.length >= 3 && w.endsWith(suf)) {
      w = w.slice(0, -suf.length);
      break;
    }
  }
  return w;
}

function tokenize(text) {
  return normalize(text)
    .split(" ")
    .filter((w) => w.length >= 2)
    .map(stem);
}

/**
 * ESKİ ALGORİTMA HATASI (kullanıcı raporuyla tespit edildi):
 * "kavşaktan karşıya geçerken bir araba çarptı bana" cümlesi, kayıtlı
 * "bana çarptı" kalıbıyla SIRA FARKLI olduğu için (mesajda "çarptı bana")
 * hiç eşleşmedi — çünkü eski motor birebir alt-dizi (substring) arıyordu.
 * Konuşma dili kelime sırasını asla garanti etmez.
 *
 * YENİ ALGORİTMA: kelime sırasından bağımsız, gövdelenmiş kelime örtüşmesi.
 * Her anahtar kelime öbeği kendi kelimelerine bölünür; mesajda o kelimelerin
 * kaçı (sırası önemsiz, hafif çekim farklarına toleranslı) geçiyorsa o
 * oranda puan verilir. "çarptı bana" ile "bana çarptı" artık AYNI skoru
 * üretir. Bu, motoru gerçek konuşma diline çok daha dayanıklı yapar.
 */
function scorePhraseOverlap(phraseTokens, messageTokenSet) {
  if (phraseTokens.length === 0) return 0;
  let hits = 0;
  for (const t of phraseTokens) {
    if (messageTokenSet.has(t)) hits++;
  }
  return hits / phraseTokens.length; // 0..1
}

  GREETING: {
    keywords: ["merhaba", "selam", "iyi gunler", "iyi günler", "gunaydin", "günaydın", "iyi aksamlar", "iyi akşamlar", "hello", "hi"],
    weight: 1.0,
  },
  THANKS: {
    keywords: ["tesekkur", "teşekkür", "tesekkurler", "teşekkürler", "sagolun", "sağolun", "thank you"],
    weight: 1.0,
  },
  TRAFFIC_ACCIDENT: {
    keywords: ["trafik kaza", "arac kaza", "araç kaza", "motor kaza", "carpisma", "çarpışma", "arabali kaza", "arabalı kaza", "yolda kaza", "kaza yaptim", "kaza yaptım", "bana carpti", "bana çarptı", "carpti bana", "çarptı bana", "arkadan carpildim", "arkadan çarpıldım", "araba carpti", "araba çarptı", "kavsakta kaza", "kavşakta kaza", "kavsaktan", "kavşaktan"],
    weight: 1.2,
  },
  WORK_ACCIDENT: {
    keywords: ["is kaza", "iş kaza", "isyerinde kaza", "işyerinde kaza", "mesai kaza", "calisirken", "çalışırken", "isveren", "işveren", "santiyede", "şantiyede", "fabrikada kaza", "makinede kaza", "is yerinde yaralandim", "iş yerinde yaralandım"],
    weight: 1.2,
  },
  MOTORCYCLE_ACCIDENT: {
    keywords: ["motor kaza", "motosiklet kaza", "motorum", "motorla kaza", "kaskom", "motokurye"],
    weight: 1.3,
  },
  PEDESTRIAN_ACCIDENT: {
    keywords: ["yaya kaza", "yaya carp", "yaya çarp", "yururken carp", "yürürken çarp", "kaldirimda", "kaldırımda", "yaya gecidinde", "yaya geçidinde", "karsiya gecerken", "karşıya geçerken", "yolun karsisina gecerken", "yolun karşısına geçerken"],
    weight: 1.3,
  },
  ZAMANASIMI: {
    keywords: ["tazminat suresi", "tazminat süresi", "ne kadar sure", "ne kadar süre", "zamanasimi", "zamanaşımı", "sure var mi", "süre var mı", "sure dolar mi", "süre dolar mı", "kac yil icinde", "kaç yıl içinde", "ne zamana kadar"],
    weight: 1.2,
  },
  DAVA_SURESI: {
    keywords: ["dava ne kadar surer", "dava ne kadar sürer", "ne kadar surede sonuclanir", "ne kadar sürede sonuçlanır", "kac ay surer", "kaç ay sürer", "surec ne kadar", "süreç ne kadar"],
    weight: 1.0,
  },
  TAZMINAT_TUTARI: {
    keywords: ["tazminat ne kadar", "ne kadar alabilirim", "tutar", "miktar", "hesap", "ortalama tazminat", "kac lira", "kaç lira", "ne kadar para"],
    weight: 1.0,
  },
  LAWYER_REFERRAL: {
    keywords: ["avukat", "temsil", "hukukcu", "hukukçu", "yasal temsil", "avukat bulmak", "avukat onerisi", "avukat önerisi"],
    weight: 1.0,
  },
  AVUKAT_UCRETI: {
    keywords: ["vekalet ucreti", "vekalet ücreti", "avukat parasi", "avukat parası", "avukat odemesi", "avukat ödemesi", "ne kadar odeyecegim", "ne kadar ödeyeceğim", "avukat ucreti", "avukat ücreti"],
    weight: 1.2,
  },
  TEDBIRGE_UCRET: {
    keywords: ["tedbirge ucret", "tedbirge ücret", "tedbirge para", "platform ucret", "platform ücret", "size ne odeyecegim", "size ne ödeyeceğim", "ucretsiz mi", "ücretsiz mi"],
    weight: 1.2,
  },
  APPLICATION_HOW: {
    keywords: ["nasil basvur", "nasıl başvur", "basvuru nasil", "başvuru nasıl", "kayit", "kayıt", "form", "uye olmak", "üye olmak", "nereden baslarim", "nereden başlarım"],
    weight: 1.0,
  },
  DOCUMENTS: {
    keywords: ["hangi belgeler", "gerekli evrak", "ne yuklemeliyim", "ne yüklemeliyim", "dokuman", "doküman", "belge listesi", "evrak"],
    weight: 1.0,
  },
  SIGORTA_ITIRAZ: {
    keywords: ["sigorta itiraz", "itiraz hakk", "tahkim", "sigorta reddetti", "yetersiz tazminat", "sigorta az odedi", "sigorta az ödedi"],
    weight: 1.2,
  },
  SIGORTA_TAHKIM: {
    keywords: ["tahkim komisyonu", "sigorta tahkim", "tahkim nedir"],
    weight: 1.2,
  },
  SIGORTASIZ_ARAC: {
    keywords: ["karsi taraf sigortasiz", "karşı taraf sigortasız", "sigortasiz arac", "sigortasız araç", "kacan surucu", "kaçan sürücü", "guvence hesabi", "güvence hesabı", "sigortasi yok", "sigortası yok"],
    weight: 1.2,
  },
  EHLIYET_DURUMU: {
    keywords: ["ehliyetim yok", "ehliyetsiz", "surucu belgesi yok", "sürücü belgesi yok", "ehliyetsiz arac", "ehliyetsiz araç"],
    weight: 1.3,
  },
  ALKOLLU_SURUS: {
    keywords: ["alkollu", "alkollü", "promil", "ickili", "içkili", "sarhos kaza", "sarhoş kaza"],
    weight: 1.3,
  },
  MAHKEME_ZORUNLU: {
    keywords: ["mahkemeye gitmek", "mahkeme zorunlu", "dava acmak", "dava açmak", "sulh", "uzlasma", "uzlaşma"],
    weight: 1.0,
  },
  YARGITAY: {
    keywords: ["yargitay", "yargıtay", "temyiz", "temiz", "ust mahkeme", "üst mahkeme"],
    weight: 1.2,
  },
  ARABULUCULUK: {
    keywords: ["arabuluculuk", "arabulucu", "tahkim oncesi", "tahkim öncesi"],
    weight: 1.2,
  },
  KUSUR_ORANI: {
    keywords: ["kusur", "suclu kim", "suçlu kim", "kusur orani", "kusur oranı", "kim hakli", "kim haklı", "kim kusurlu"],
    weight: 1.0,
  },
  MALULIYET: {
    keywords: ["maluliyet", "is goremezlik", "iş göremezlik", "sakat", "engellilik", "maluliyet orani", "maluliyet oranı"],
    weight: 1.2,
  },
  MANEVI_TAZMINAT: {
    keywords: ["manevi tazminat", "manevi", "aci", "acı", "uzuntu", "üzüntü"],
    weight: 1.2,
  },
  VEFAT_TAZMINAT: {
    keywords: ["oldu", "öldü", "vefat", "destekten yoksun", "olum tazminati", "ölüm tazminatı", "esim oldu", "eşim öldü", "yakinim oldu", "yakınım öldü"],
    weight: 1.2,
  },
  CENAZE_GIDERLERI: {
    keywords: ["cenaze masraf", "defin gideri", "cenaze gideri"],
    weight: 1.2,
  },
  COCUK_KAZA: {
    keywords: ["cocugum yaralandi", "çocuğum yaralandı", "cocuk kaza", "çocuk kaza", "kucuk yasta", "küçük yaşta", "vasi", "cocuk tazminat", "çocuk tazminat"],
    weight: 1.2,
  },
  HAMILE_KAZA: {
    keywords: ["hamile", "gebe", "bebek dusugu", "bebek düşüğü", "anne karninda", "anne karnında"],
    weight: 1.3,
  },
  SGK_IS_KAZASI: {
    keywords: ["sgk", "is kazasi bildirim", "iş kazası bildirim", "sigorta primi", "surekli is goremezlik", "sürekli iş göremezlik"],
    weight: 1.2,
  },
  ISVEREN_SORUMLULUK: {
    keywords: ["isveren odesin", "işveren ödesin", "isveren sorumlu", "işveren sorumlu", "is guvenligi", "iş güvenliği"],
    weight: 1.2,
  },
  RUCU_HAKKI: {
    keywords: ["rucu", "rücu", "geri odeme", "geri ödeme", "sigorta geri talep"],
    weight: 1.2,
  },
  ZMSS_LIMIT: {
    keywords: ["zmss", "zorunlu sigorta", "trafik sigortasi", "trafik sigortası", "sigorta limiti"],
    weight: 1.2,
  },
  KASKO: {
    keywords: ["kasko", "ihtiyari sigorta", "kasko odemesi", "kasko ödemesi"],
    weight: 1.2,
  },
  PLAKA_OKUNMUYOR: {
    keywords: ["plaka", "arac bulunamadi", "araç bulunamadı", "plakayi goremedim", "plakayı göremedim", "kacan arac", "kaçan araç"],
    weight: 1.2,
  },
  TEDAVI_FATURA: {
    keywords: ["tedavi fatura", "ilac parasi", "ilaç parası", "ameliyat ucreti", "ameliyat ücreti", "doktor"],
    weight: 1.2,
  },
  KVKK_PRIVACY: {
    keywords: ["kvkk", "verilerim", "gizlilik", "guvenli", "güvenli", "silinir mi", "paylasir mi", "paylaşır mı"],
    weight: 1.0,
  },
  VERI_SILME: {
    keywords: ["verilerimi sil", "kayit silme", "kayıt silme", "hesap kapatma", "veri silmek"],
    weight: 1.2,
  },
  ABOUT_TEDBIRGE: {
    keywords: ["tedbirge nedir", "hakkinizda", "hakkınızda", "siz kimsiniz", "sirket", "şirket", "firma", "ekip"],
    weight: 1.0,
  },
  AI_ASISTAN_NEDIR: {
    keywords: ["ai asistani", "ai asistanı", "yapay zeka", "robot mu", "chatbot"],
    weight: 1.0,
  },
  ADRES_ILETISIM: {
    keywords: ["adresi", "ofis", "nereden ulas", "nereden ulaş", "telefon", "iletisim", "iletişim"],
    weight: 1.0,
  },
  HIZMET_BOLGESI: {
    keywords: ["nerede hizmet", "hangi sehirler", "hangi şehirler", "il", "sehir", "şehir", "turkiye geneli mi", "türkiye geneli mi"],
    weight: 1.0,
  },
  ESKI_DOSYAM_VAR: {
    keywords: ["eski davam var", "actigim dava", "açtığım dava", "basvurum vardi", "başvurum vardı", "onceki dosyam", "önceki dosyam"],
    weight: 1.2,
  },
  TANIK: {
    keywords: ["tanik", "tanık", "sahit", "şahit", "sahitligi", "şahitliği", "kimse gormedi", "kimse görmedi"],
    weight: 1.2,
  },
  KAMERA_KAYIT: {
    keywords: ["kamera", "kayit", "kayıt", "mobese", "guvenlik kamerasi", "güvenlik kamerası"],
    weight: 1.2,
  },
  BILIRKISI: {
    keywords: ["bilirkisi", "bilirkişi", "ekspertiz", "rapor", "bilirkisi raporu", "bilirkişi raporu"],
    weight: 1.2,
  },
  EPIKRIZ: {
    keywords: ["epikriz", "hastane raporu", "tibbi rapor", "tıbbi rapor", "tedavi belgesi"],
    weight: 1.2,
  },
  FAIZ_TAZMINAT: {
    keywords: ["faiz", "yasal faiz", "ek faiz"],
    weight: 1.2,
  },
  ORTAK_KAZA: {
    keywords: ["iki tarafli kusur", "iki taraflı kusur", "ikimiz de kusurlu", "ortak kusur"],
    weight: 1.2,
  },
  GECIKMIS_BASVURU: {
    keywords: ["gec basvuru", "geç başvuru", "sure gecti mi", "süre geçti mi", "gecikti", "uzun zaman oldu"],
    weight: 1.2,
  },
  YOLCU_TAZMINAT: {
    keywords: ["yolcuydum", "yolcu", "ben kullanmiyordum", "ben kullanmıyordum", "arka koltukta"],
    weight: 1.2,
  },
  POLICE_NUMARASI: {
    keywords: ["police numarasi", "poliçe numarası", "police no", "poliçe no", "sigorta no"],
    weight: 1.2,
  },
  SUREC_NASIL: {
    keywords: ["nasil bir surec", "nasıl bir süreç", "ne olacak", "surec adimlari", "süreç adımları"],
    weight: 1.0,
  },
  ARAC_DEGER_KAYBI: {
    keywords: ["deger kaybi", "değer kaybı", "arac deger", "araç değer", "ikinci el", "arac hasar", "araç hasar"],
    weight: 1.2,
  },

  // ================= v3 — YENİ 15 İNTENT =================
  ILK_ADIMLAR: {
    keywords: ["kaza az once oldu", "kaza az önce oldu", "simdi ne yapmaliyim", "şimdi ne yapmalıyım", "ilk once ne yapmaliyim", "ilk önce ne yapmalıyım", "kaza yeni oldu", "az once carpistim", "az önce çarpıştım"],
    weight: 1.3,
  },
  KAZA_TUTANAGI_ITIRAZ: {
    keywords: ["tutanaga itiraz", "tutanağa itiraz", "tutanak yanlis", "tutanak yanlış", "tutanak imzalamadim", "tutanak imzalamadım", "kaza tespit tutanagi", "kaza tespit tutanağı"],
    weight: 1.3,
  },
  KIRMIZI_ISIK: {
    keywords: ["kirmizi isik", "kırmızı ışık", "kirmizida gecti", "kırmızıda geçti", "isik ihlali", "ışık ihlali"],
    weight: 1.3,
  },
  HIZ_IHLALI: {
    keywords: ["hiz siniri", "hız sınırı", "asiri hiz", "aşırı hız", "hiz kaydi", "hız kaydı", "radar"],
    weight: 1.2,
  },
  OTOPARK_KAZA: {
    keywords: ["otoparkta carpti", "otoparkta çarptı", "park halindeyken", "parkta cizik", "parkta çizik", "park halinde arac", "park halinde araç"],
    weight: 1.2,
  },
  STAJYER_KAZA: {
    keywords: ["stajyer kaza", "cirak kaza", "çırak kaza", "stajyerken yaralandim", "stajyerken yaralandım", "stajyer is kazasi", "stajyer iş kazası"],
    weight: 1.3,
  },
  MESLEK_HASTALIGI: {
    keywords: ["meslek hastaligi", "meslek hastalığı", "islitme kaybi", "işitme kaybı", "bel fitigi is", "bel fıtığı iş", "tozdan hastalik", "tozdan hastalık"],
    weight: 1.3,
  },
  POLIS_CAGIRMADAN: {
    keywords: ["polis cagirmadan", "polis çağırmadan", "tutanaksiz anlastik", "tutanaksız anlaştık", "kaza sonrasi anlasma", "kaza sonrası anlaşma", "sozlu anlasma", "sözlü anlaşma"],
    weight: 1.3,
  },
  KIRALIK_ARAC: {
    keywords: ["kiralik arac", "kiralık araç", "rent a car kaza", "kiralik araba kaza", "kiralık araba kaza"],
    weight: 1.2,
  },
  YURTDISI_KAZA: {
    keywords: ["yurtdisinda kaza", "yurtdışında kaza", "yurt disi kaza", "yurt dışı kaza", "yabanci ulkede kaza", "yabancı ülkede kaza"],
    weight: 1.2,
  },
  MALULLUK_AYLIGI: {
    keywords: ["malullik ayligi", "malullük aylığı", "emeklilik maluliyet", "sgk malullük", "sgk malullik"],
    weight: 1.2,
  },
  DOSYA_TAKIP: {
    keywords: ["basvurumu nasil takip ederim", "başvurumu nasıl takip ederim", "dosyam ne durumda", "basvuru durumu", "başvuru durumu", "dosya sorgulama"],
    weight: 1.2,
  },
  BISIKLET_KAZA: {
    keywords: ["bisiklet kaza", "bisikletle carpisma", "bisikletle çarpışma", "bisiklet surucu", "bisiklet sürücü"],
    weight: 1.3,
  },
  SERVIS_ARACI_KAZA: {
    keywords: ["servis araci kaza", "servis aracı kaza", "okul servisi kaza", "personel servisi kaza"],
    weight: 1.3,
  },
  TAKSI_UBER_KAZA: {
    keywords: ["taksi kaza", "uber kaza", "yolcu tasima kaza", "yolcu taşıma kaza", "ticari tasit kaza", "ticari taşıt kaza"],
    weight: 1.2,
  },

  FALLBACK: {
    keywords: [],
    weight: 0,
  },
};

function normalize(text) {
  return String(text || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/i̇/g, "i")
    .replace(/I/g, "i");
}

function detectIntent(message) {
  const messageTokens = tokenize(message);
  const messageTokenSet = new Set(messageTokens);
  const scores = {};

  for (const [intent, config] of Object.entries(INTENTS)) {
    let total = 0;
    for (const kw of config.keywords) {
      const phraseTokens = tokenize(kw);
      const overlap = scorePhraseOverlap(phraseTokens, messageTokenSet);
      // Tam eşleşme (1.0 örtüşme) tam ağırlık alır; kısmi örtüşme
      // (ör. 2 kelimeden 1'i) orantılı ama daha düşük puan alır — bu
      // sayede "araba çarptı bana" gibi karışık sıralı cümleler de
      // yeterli sinyal biriktirip doğru intent'i tetikleyebiliyor.
      if (overlap >= 0.5) {
        total += config.weight * overlap;
      }
    }
    scores[intent] = total;
  }

  const sorted = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    return { intent: "FALLBACK", confidence: 0 };
  }

  return {
    intent: sorted[0][0],
    confidence: Math.min(1, sorted[0][1] / 2),
  };
}

module.exports = { detectIntent, INTENTS };
