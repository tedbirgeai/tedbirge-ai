// TUR #132.4 — Admin AI Egitimi API
// Madde 24.14 R1 + 30.61 (Single Source of Truth, FAQ tek dosya)
// Mevcut ChatSession + ChatMessage tablolari reuse (Madde 4.6 KALIN)

"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");
const prisma = require("../config/db");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();
const FAQ_PATH = path.resolve(__dirname, "../../tedbirge-os/data/faq-tr-v1.json");

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
