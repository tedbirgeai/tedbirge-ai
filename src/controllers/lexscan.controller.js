/**
 * Tedbirge AI Asistani — Herkese acik chat endpoint'i
 * TUR #132.4 (21 May 2026) — Anthropic SDK kaldirildi (Madde 24.14 R1 KALIN)
 *
 * Eski: claude-sonnet-4-6 (Anthropic, ucretli, KVKK yurt disi transferi)
 * Yeni: chatbot.service.js (Tedbirge rule-based intent engine + FAQ, $0, KVKK lokal)
 *
 * Route adi "lexscan" geriye uyumluluk icin korunur (Madde 4.6) — frontend cagrisi
 * `/api/lexscan/chat` URL'i degismez. Marka "Tedbirge AI Asistani" olarak gosterilir.
 */

"use strict";

const asyncHandler = require("../utils/asyncHandler");
const chatbot = require("../services/chatbot.service");

exports.chat = asyncHandler(async (req, res) => {
  const { messages, sessionId, sessionKey, leadId } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Mesaj listesi bos olamaz." });
  }

  // Son kullanici mesajini al
  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m && m.role === "user");

  if (!lastUserMessage || !lastUserMessage.content) {
    return res
      .status(400)
      .json({ success: false, message: "Kullanici mesaji bulunamadi." });
  }

  const reply = await chatbot.processMessage({
    message: String(lastUserMessage.content).slice(0, 2000),
    sessionKey: sessionKey || sessionId || null,
    userId: req.user?.id || null,
    leadId: leadId || null,
    ipHash: chatbot.hashIP(req.ip),
  });

  res.json({
    success: true,
    data: {
      role: "assistant",
      content: reply.text,
      intent: reply.intent,
      confidence: reply.confidence,
      sessionKey: reply.sessionKey,
    },
  });
});
