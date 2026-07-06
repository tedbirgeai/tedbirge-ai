// TUR #132.4 — Admin AI Egitimi API
// Madde 24.14 R1 + 30.61 (Single Source of Truth, FAQ tek dosya)
// Mevcut ChatSession + ChatMessage tablolari reuse (Madde 4.6 KALIN)
//
// TUR YENİ — Otonom Öğrenme ($0 maliyet):
// "clusters" ucu, cevaplanamayan (FALLBACK) sorulari yerel kelime-örtüşümü
// ile gruplar (hiçbir ücretli LLM/embeddings çağrısı yok — sadece
// intentEngine.tokenize + Jaccard benzerliği). En çok tekrar eden soru
// grubu en üstte çıkar, motor otomatik anahtar kelime önerir. Admin sadece
// hukuki cevabı yazıp onaylar ("promote") — yeni intent + FAQ, kod
// deploy'u beklemeden, aynı anda canlıya alınır (hot-reload).

"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");
const prisma = require("../config/db");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const intentEngine = require("../services/intent-engine.service");
const chatbotService = require("../services/chatbot.service");

const router = express.Router();
const FAQ_PATH = path.resolve(__dirname, "../../tedbirge-os/data/faq-tr-v1.json");
const CUSTOM_INTENTS_PATH = path.resolve(
  __dirname,
  "../../tedbirge-os/data/custom-intents-v1.json"
);

router.use(authMiddleware);
router.use(roleMiddleware("ADMIN"));

// FAQ listesi (read-only, dosyadan okur)
router.get(
  "/faq",
  asyncHandler(async (req, res) => {
    try {
      const data = JSON.parse(fs.readFileSync(FAQ_PATH, "utf-8"));
      res.json({ success: true, data: { faqs: data.faqs || [], version: data.version } });
    } catch (err) {
      res.status(500).json({ success: false, message: "FAQ okuma hatasi", error: err.message });
    }
  })
);

// Fallback sorular (ActivityLog'tan)
router.get(
  "/fallback",
  asyncHandler(async (req, res) => {
    const fallbacks = await prisma.activityLog.findMany({
      where: { action: "CHATBOT_FALLBACK" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const parsed = fallbacks.map((f) => {
      const match = f.detail?.match(/message:(.+)$/);
      return {
        id: f.id,
        message: match ? match[1] : f.detail,
        createdAt: f.createdAt,
      };
    });

    res.json({ success: true, data: { fallbacks: parsed } });
  })
);

// Konusma loglari (ChatSession + ChatMessage)
router.get(
  "/conversations",
  asyncHandler(async (req, res) => {
    const sessions = await prisma.chatSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 20,
          select: {
            id: true,
            sender: true,
            message: true,
            metadataJson: true,
            createdAt: true,
          },
        },
        User: { select: { id: true, fullName: true, role: true } },
      },
    });

    const data = sessions.map((s) => ({
      id: s.id,
      sessionKey: s.sessionKey,
      userId: s.userId,
      user: s.User,
      leadId: s.leadId,
      createdAt: s.createdAt,
      messageCount: s.messages.length,
      messages: s.messages.map((m) => {
        let meta = null;
        try {
          meta = m.metadataJson ? JSON.parse(m.metadataJson) : null;
        } catch (_) {}
        return {
          id: m.id,
          sender: m.sender,
          message: m.message,
          intent: meta?.intent || null,
          confidence: meta?.confidence || null,
          createdAt: m.createdAt,
        };
      }),
    }));

    res.json({ success: true, data: { sessions: data } });
  })
);

module.exports = router;

// ─── OTONOM ÖĞRENME ($0) ────────────────────────────────────────────────────

const STOPWORDS = new Set([
  "bir", "bu", "su", "şu", "ben", "sen", "biz", "siz", "onlar", "ne", "gibi",
  "cok", "çok", "de", "da", "ile", "icin", "için", "var", "yok", "mi", "mı",
  "mu", "mü", "ve", "ya", "veya", "ki", "olan", "olarak", "diye",
]);

// İki mesajın gövdelenmiş kelime kümeleri arasındaki Jaccard benzerliği.
// Ücretli hiçbir servis çağrılmaz — tamamen yerel, anlık hesaplanır.
function jaccard(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter++;
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

// Cevaplanamayan mesajları benzerliklerine göre kümeler (basit ama etkili
// tek-geçişli greedy clustering — N küçük olduğu için (<=300) yeterli).
function clusterFallbacks(items, threshold = 0.35) {
  const withTokens = items.map((it) => ({
    ...it,
    tokenSet: new Set(intentEngine.tokenize(it.message)),
  }));

  const clusters = [];
  for (const item of withTokens) {
    if (item.tokenSet.size === 0) continue;
    let best = null;
    let bestScore = 0;
    for (const c of clusters) {
      const score = jaccard(item.tokenSet, c.centroidTokens);
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    if (best && bestScore >= threshold) {
      best.items.push(item);
      for (const t of item.tokenSet) best.centroidTokens.add(t);
    } else {
      clusters.push({ items: [item], centroidTokens: new Set(item.tokenSet) });
    }
  }

  return clusters
    .map((c) => {
      const freq = {};
      for (const it of c.items) {
        for (const t of it.tokenSet) {
          if (STOPWORDS.has(t) || t.length < 3) continue;
          freq[t] = (freq[t] || 0) + 1;
        }
      }
      const suggestedKeywords = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([t]) => t);

      return {
        size: c.items.length,
        sampleMessages: c.items.slice(0, 5).map((it) => it.message),
        suggestedKeywords,
        activityLogIds: c.items.map((it) => it.id),
      };
    })
    .filter((c) => c.size >= 2)
    .sort((a, b) => b.size - a.size);
}

// GET /clusters — cevaplanamayan sorulari otomatik kumeler (0 maliyet)
router.get(
  "/clusters",
  asyncHandler(async (req, res) => {
    const fallbacks = await prisma.activityLog.findMany({
      where: { action: "CHATBOT_FALLBACK" },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    const items = fallbacks
      .map((f) => {
        const match = f.detail?.match(/message:(.+)$/);
        return { id: f.id, message: (match ? match[1] : f.detail || "").trim() };
      })
      .filter((it) => it.message.length >= 4);

    const clusters = clusterFallbacks(items);
    res.json({ success: true, data: { clusters, totalFallbacks: items.length } });
  })
);

// POST /promote — kümeyi onaylayıp yeni intent + FAQ olarak canlıya al.
// Hukuki cevap İNSAN tarafından yazılır/onaylanır — bu bilinçli bir tasarım:
// motor soru gruplamasını otomatikleştirir, ama bir tazminat/hukuk
// platformunda nihai cevap metnini asla botun kendi başına üretip
// yayınlamasına izin vermeyiz.
router.post(
  "/promote",
  asyncHandler(async (req, res) => {
    const { intentName, keywords, answer, weight } = req.body || {};

    if (!intentName || !/^[A-Z][A-Z0-9_]{2,40}$/.test(intentName)) {
      return res.status(400).json({
        success: false,
        message: "intentName BUYUK_HARF_ALTCIZGI formatinda olmali (ör. KAZA_SIGORTA_GECIKME)",
      });
    }
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ success: false, message: "en az 1 anahtar kelime gerekli" });
    }
    if (!answer || String(answer).trim().length < 10) {
      return res.status(400).json({ success: false, message: "hukuki cevap metni cok kisa" });
    }

    let customData = { intents: {} };
    try {
      customData = JSON.parse(fs.readFileSync(CUSTOM_INTENTS_PATH, "utf-8"));
    } catch (_) {}
    customData.intents = customData.intents || {};
    customData.intents[intentName] = {
      keywords: keywords.map((k) => String(k).trim()).filter(Boolean),
      weight: typeof weight === "number" ? weight : 1.2,
      addedAt: new Date().toISOString(),
      addedBy: req.user?.id || "admin",
    };
    fs.writeFileSync(CUSTOM_INTENTS_PATH, JSON.stringify(customData, null, 2), "utf-8");

    let faqData = { faqs: [] };
    try {
      faqData = JSON.parse(fs.readFileSync(FAQ_PATH, "utf-8"));
    } catch (_) {}
    faqData.faqs = faqData.faqs || [];
    faqData.faqs.push({
      id: `custom-${intentName.toLowerCase().replace(/_/g, "-")}-01`,
      intent: intentName,
      patterns: keywords,
      response: String(answer).trim(),
    });
    fs.writeFileSync(FAQ_PATH, JSON.stringify(faqData, null, 2), "utf-8");

    intentEngine.reload();
    chatbotService.loadFAQs();

    await prisma.activityLog.create({
      data: {
        action: "AI_TRAINING_INTENT_PROMOTED",
        detail: `intent:${intentName} keywords:${keywords.length} by:${req.user?.id || "admin"}`,
      },
    });

    res.json({
      success: true,
      data: { intentName, message: "Yeni intent canliya alindi (hot-reload, deploy gerekmedi)" },
    });
  })
);

module.exports = router;
