// TUR #132.4 — Intent Engine (rule-based + keyword matching)
// Madde 24.14 R1 KALIN — Tedbirge mulkiyeti, $0, KVKK lokal
// Chatbot servisinin niyet tespit motoru.

"use strict";

const INTENTS = {
  GREETING: {
    keywords: ["merhaba", "selam", "iyi gunler", "gunaydin", "iyi aksamlar", "hello", "hi"],
    weight: 1.0,
  },
  TRAFFIC_ACCIDENT: {
    keywords: [
      "trafik kaza",
      "arac kaza",
      "motor kaza",
      "carpisma",
      "kazadan dolayi",
      "trafikte",
      "arabali kaza",
    ],
    weight: 1.2,
  },
  WORK_ACCIDENT: {
    keywords: [
      "is kaza",
      "isyerinde kaza",
      "mesai kaza",
      "calisirken",
      "isveren",
      "sgk kaza",
    ],
    weight: 1.2,
  },
  COMPENSATION_ESTIMATE: {
    keywords: [
      "tazminat",
      "ne kadar alabilirim",
      "hesap",
      "tahmin",
      "deger",
      "tutar",
      "miktar",
    ],
    weight: 1.0,
  },
  LAWYER_REFERRAL: {
    keywords: ["avukat", "temsil", "dava", "mahkeme", "hukukcu", "yasal surec"],
    weight: 1.0,
  },
  APPLICATION_HOW: {
    keywords: [
      "nasil basvur",
      "basvuru nasil",
      "kayit",
      "uye olmak",
      "form",
      "doldurmak",
    ],
    weight: 1.0,
  },
  DOCUMENTS: {
    keywords: [
      "belge",
      "evrak",
      "dokuman",
      "pdf",
      "hangi belgeler",
      "gerekli belge",
      "epikriz",
      "tutanak",
    ],
    weight: 1.0,
  },
  INSURANCE: {
    keywords: [
      "sigorta",
      "police",
      "zorunlu",
      "kasko",
      "sigorta reddetti",
      "sigorta odeme",
    ],
    weight: 1.0,
  },
  PRICE_FEE: {
    keywords: ["ucret", "maliyet", "para", "fiyat", "kac para", "ne kadara", "odeme"],
    weight: 1.0,
  },
  KVKK_PRIVACY: {
    keywords: ["kvkk", "verilerim", "gizlilik", "guvenli", "silinir mi", "paylasir mi"],
    weight: 1.0,
  },
  ABOUT_TEDBIRGE: {
    keywords: [
      "tedbirge nedir",
      "hakkinda",
      "siz kimsiniz",
      "sirket",
      "firma",
      "ekip",
    ],
    weight: 1.0,
  },
  TIMEOUT_LIMITATION: {
    keywords: ["zamanasimi", "sure", "ne zamana kadar", "kac yil"],
    weight: 1.0,
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
