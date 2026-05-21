// TUR #132.4 — Tedbirge AI Asistani (LexScan AI rename)
// Madde 24.14 R1 KALIN — AI Bagimsizlik (Tedbirge mulkiyeti, $0, KVKK lokal)
// Madde 4.6 KALIN — Mevcut ChatSession + ChatMessage tablolari reuse (KIRMIZI 5 dürüst SKIP)
// Madde 30.75 — KVKK m.10 audit
//
// Intent engine + FAQ JSON dosyasi ile rule-based yanit uretir.
// Anthropic SDK kullanmaz. Tum konusmalar ChatSession + ChatMessage tablolarinda saklanir
// (intent + confidence metadataJson alanina yazilir).

"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const prisma = require("../config/db");
const intentEngine = require("./intent-engine.service");

const FAQ_PATH = path.resolve(__dirname, "../../tedbirge-os/data/faq-tr-v1.json");
let faqs = [];

function loadFAQs() {
  try {
    const data = JSON.parse(fs.readFileSync(FAQ_PATH, "utf-8"));
    faqs = Array.isArray(data.faqs) ? data.faqs : [];
    console.log(`[chatbot] FAQ yuklendi: ${faqs.length} kayit (v1-2026)`);
  } catch (err) {
    console.error("[chatbot] FAQ yukleme hatasi:", err.message);
    faqs = [];
  }
}
loadFAQs();

function hashIP(ip) {
  return crypto
    .createHash("sha256")
    .update(String(ip || "") + "tedbirge-salt")
    .digest("hex")
    .slice(0, 16);
}

function findResponse(intent) {
  const matches = faqs.filter((f) => f.intent === intent);
  if (matches.length === 0) {
    const fb = faqs.find((f) => f.intent === "FALLBACK");
    return (
      fb?.response ||
      "Size yardimci olamadim, lutfen basvuru formu ile devam edin: https://tedbirge.ai/basvuru"
    );
  }
  return matches[Math.floor(Math.random() * matches.length)].response;
}

/**
 * Kullanicinin mesajini isler, intent tespit eder, FAQ yanitini uretir.
 *
 * Mevcut ChatSession + ChatMessage tablolarini reuse eder (Madde 4.6 KALIN):
 * - sessionId (UUID-like, frontend tutar)
 * - leadId (varsa)
 * - sender: "user" veya "assistant"
 * - metadataJson: JSON string ({ intent, confidence })
 *
 * @param {object} input
 * @param {string} input.message
 * @param {string} [input.sessionKey]
 * @param {string} [input.userId]
 * @param {string} [input.leadId]
 * @param {string} [input.ipHash]
 * @returns {Promise<{text: string, intent: string, confidence: number, sessionKey: string}>}
 */
async function processMessage({ message, sessionKey, userId, leadId, ipHash }) {
  const text = String(message || "").trim();
  if (!text) {
    return {
      text: "Mesajiniz bos. Lutfen bir soru yaziniz.",
      intent: "FALLBACK",
      confidence: 0,
      sessionKey: sessionKey || null,
    };
  }

  // Intent tespit (Tedbirge rule-based engine, $0)
  const { intent, confidence } = intentEngine.detectIntent(text);
  const responseText = findResponse(intent);

  // Audit + konusma history (mevcut ChatSession + ChatMessage tablolari)
  let session = null;
  try {
    if (sessionKey) {
      session = await prisma.chatSession.findUnique({ where: { sessionKey } });
    }
    if (!session) {
      const newKey = sessionKey || crypto.randomBytes(16).toString("hex");
      session = await prisma.chatSession.create({
        data: {
          sessionKey: newKey,
          userId: userId || null,
          leadId: leadId || null,
        },
      });
    }

    // User mesaji
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        leadId: leadId || null,
        sender: "user",
        message: text.slice(0, 1000),
        metadataJson: JSON.stringify({ ipHash: ipHash || null }),
      },
    });

    // Assistant yaniti
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        leadId: leadId || null,
        sender: "assistant",
        message: responseText.slice(0, 2000),
        metadataJson: JSON.stringify({
          intent,
          confidence,
          engine: "tedbirge-intent-engine-v1",
        }),
      },
    });
  } catch (err) {
    console.error("[chatbot] log hatasi:", err.message);
  }

  // FALLBACK audit (admin sonradan FAQ ekler)
  if (intent === "FALLBACK") {
    try {
      await prisma.activityLog.create({
        data: {
          action: "CHATBOT_FALLBACK",
          detail: `sessionId:${session?.id || "?"} message:${text.slice(0, 200)}`,
        },
      });
    } catch (_) {}
  }

  return {
    text: responseText,
    intent,
    confidence,
    sessionKey: session?.sessionKey || null,
  };
}

module.exports = { processMessage, hashIP, loadFAQs };
