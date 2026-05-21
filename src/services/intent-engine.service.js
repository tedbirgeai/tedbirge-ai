// TUR #132.4 + #132.6 — Intent Engine (rule-based + keyword matching)
// Madde 24.14 R1 KALIN — Tedbirge mulkiyeti, $0, KVKK lokal
// Chatbot servisinin niyet tespit motoru.
// v2: 30 intent (FAQ v2 ile uyumlu) + Turkce karakter normalize

"use strict";

const INTENTS = {
  GREETING: {
    keywords: ["merhaba", "selam", "iyi gunler", "iyi günler", "gunaydin", "günaydın", "iyi aksamlar", "iyi akşamlar", "hello", "hi"],
    weight: 1.0,
  },
  THANKS: {
    keywords: ["tesekkur", "teşekkür", "tesekkurler", "teşekkürler", "sagolun", "sağolun", "thank you"],
    weight: 1.0,
  },
  TRAFFIC_ACCIDENT: {
    keywords: ["trafik kaza", "arac kaza", "araç kaza", "motor kaza", "carpisma", "çarpışma", "arabali kaza", "arabalı kaza", "yolda kaza"],
    weight: 1.2,
  },
  WORK_ACCIDENT: {
    keywords: ["is kaza", "iş kaza", "isyerinde kaza", "işyerinde kaza", "mesai kaza", "calisirken", "çalışırken", "isveren", "işveren"],
    weight: 1.2,
  },
  MOTORCYCLE_ACCIDENT: {
    keywords: ["motor kaza", "motosiklet kaza", "motorum", "motorla kaza"],
    weight: 1.3,
  },
  PEDESTRIAN_ACCIDENT: {
    keywords: ["yaya kaza", "yaya carp", "yaya çarp", "yururken carp", "yürürken çarp"],
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
    keywords: ["tazminat ne kadar", "ne kadar alabilirim", "tutar", "miktar", "hesap"],
    weight: 1.0,
  },
  LAWYER_REFERRAL: {
    keywords: ["avukat", "temsil", "hukukcu", "hukukçu", "yasal temsil"],
    weight: 1.0,
  },
  AVUKAT_UCRETI: {
    keywords: ["vekalet ucreti", "vekalet ücreti", "avukat parasi", "avukat parası", "avukat odemesi", "avukat ödemesi", "ne kadar odeyecegim", "ne kadar ödeyeceğim", "avukat ucreti", "avukat ücreti"],
    weight: 1.2,
  },
  TEDBIRGE_UCRET: {
    keywords: ["tedbirge ucret", "tedbirge ücret", "tedbirge para", "platform ucret", "platform ücret", "size ne odeyecegim", "size ne ödeyeceğim"],
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
  const norm = normalize(message);
  const scores = {};

  for (const [intent, config] of Object.entries(INTENTS)) {
    scores[intent] = 0;
    for (const kw of config.keywords) {
      if (norm.includes(normalize(kw))) {
        scores[intent] += config.weight;
      }
    }
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