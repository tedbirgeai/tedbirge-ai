"use strict";

const asyncHandler = require("../utils/asyncHandler");
const chatbot = require("../services/chatbot.service");
const prisma = require("../config/db");

/**
 * Tedbirge AI Asistani — Herkese acik chat endpoint'i
 * (Degismedi — mevcut $0 rule-based motor, chatbot.service.js)
 */
exports.chat = asyncHandler(async (req, res) => {
  const { messages, sessionId, sessionKey, leadId } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Mesaj listesi bos olamaz." });
  }

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

/**
 * YENİ — Ana sayfa hero asistanındaki "0 sürtünme" e-posta yakalama.
 *
 * Kasıtlı olarak YENİ bir Prisma modeli/migration İSTEMEZ (0 hata ilkesi):
 * mevcut ChatSession + ChatMessage + ActivityLog tablolarını, chatbot.service.js
 * ile aynı desende yeniden kullanır. Kayıt, "AI Eğitimi" / Audit Log
 * ekranlarınızdan zaten görülebilir; ayrı bir CRM alanı gerekirse (Lead'e
 * otomatik dönüştürme) bu, ayrı ve bilinçli bir sonraki adımdır.
 */
exports.captureEmail = asyncHandler(async (req, res) => {
  const { sessionKey, email } = req.body || {};

  const cleanEmail = String(email || "").trim().toLowerCase();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
  if (!emailOk) {
    return res
      .status(400)
      .json({ success: false, message: "Geçerli bir e-posta girin." });
  }
  if (!sessionKey) {
    return res
      .status(400)
      .json({ success: false, message: "Oturum bulunamadı, sohbeti yeniden başlatın." });
  }

  const session = await prisma.chatSession.findUnique({ where: { sessionKey } });

  if (session) {
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        sender: "lead_capture",
        message: cleanEmail,
        metadataJson: JSON.stringify({ type: "email_capture" }),
      },
    });
  }

  // Admin'in göreceği yer: Dashboard → Audit Log (mevcut ekran, yeni sayfa yok)
  await prisma.activityLog.create({
    data: {
      action: "HERO_ASSISTANT_EMAIL_CAPTURED",
      detail: `sessionKey:${sessionKey} email:${cleanEmail}`,
    },
  });

  res.json({ success: true, data: { saved: true } });
});
