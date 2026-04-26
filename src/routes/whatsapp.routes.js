/**
 * WhatsApp Business Cloud API — Webhook Routes
 *
 * Meta Developer portalında webhook URL olarak şunu gir:
 *   https://api.tedbirge.ai/api/whatsapp/webhook
 * Verify Token: WHATSAPP_WEBHOOK_VERIFY_TOKEN env değişkeni
 *
 * İki endpoint:
 *  GET  /webhook — Meta'nın doğrulama握手 (challenge)
 *  POST /webhook — Gelen mesaj / delivery status bildirimleri
 */

const express = require("express");
const router = express.Router();
const { verifyWebhookSignature } = require("../services/whatsapp.service");
const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/db");

// ─── GET /webhook — Meta doğrulama handshake ─────────────────────────────────

router.get("/webhook", (req, res) => {
  const mode      = req.query["hub.mode"];
  const token     = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const expected = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "";

  if (mode === "subscribe" && token === expected) {
    console.log("[WhatsApp] Webhook doğrulandı");
    return res.status(200).send(challenge);
  }

  console.warn("[WhatsApp] Webhook doğrulama başarısız — token uyuşmadı");
  res.sendStatus(403);
});

// ─── POST /webhook — Gelen event'ler ────────────────────────────────────────

router.post(
  "/webhook",
  verifyWebhookSignature, // WHATSAPP_APP_SECRET ile imza doğrular; eksikse atlar
  asyncHandler(async (req, res) => {
    const body = req.body;

    // Meta her zaman 200 bekler; aksi halde tekrar gönderir
    res.sendStatus(200);

    if (body.object !== "whatsapp_business_account") return;

    const entries = body.entry ?? [];

    for (const entry of entries) {
      const changes = entry.changes ?? [];

      for (const change of changes) {
        const value = change.value ?? {};

        // ── Gelen mesaj ──────────────────────────────────────────────────────
        const messages = value.messages ?? [];
        for (const msg of messages) {
          await handleIncomingMessage(msg, value.metadata).catch((err) => {
            console.error("[WhatsApp] Gelen mesaj işleme hatası:", err.message);
          });
        }

        // ── Durum güncelleme (sent/delivered/read/failed) ────────────────────
        const statuses = value.statuses ?? [];
        for (const status of statuses) {
          await handleStatusUpdate(status).catch((err) => {
            console.error("[WhatsApp] Durum güncelleme hatası:", err.message);
          });
        }
      }
    }
  })
);

// ─── Gelen mesaj işle ─────────────────────────────────────────────────────────

async function handleIncomingMessage(msg, metadata) {
  const from    = msg.from;    // E.164 format (905XXXXXXXXX)
  const type    = msg.type;    // text | image | document | ...
  const waId    = msg.id;

  let text = "";
  if (type === "text")     text = msg.text?.body || "";
  if (type === "button")   text = msg.button?.text || "";
  if (type === "interactive") {
    text = msg.interactive?.button_reply?.title
      || msg.interactive?.list_reply?.title
      || "";
  }

  console.log(`[WhatsApp] Gelen (${type}) → ${from}: ${text.slice(0, 80)}`);

  // Müşteri numarasıyla lead bul
  let lead = await prisma.lead.findFirst({
    where: { customerPhone: { contains: from.slice(-10) } },
    select: { id: true, ownerId: true },
  });

  // BUG #7 FIX: Bilinmeyen numara icin otomatik Lead olustur
  if (!lead) {
    // Spam koruma: ayni no son 1 saatte 5'ten fazla mesaj attiysa atla
    const recentCount = await prisma.activityLog.count({
      where: {
        action: "WHATSAPP_INCOMING_NEW",
        detail: { contains: from },
        createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (recentCount >= 5) {
      console.log(`[WhatsApp] Spam koruma tetiklendi: ${from} (${recentCount} mesaj/saat)`);
      return;
    }

    const leadService = require("../services/lead.service");
    lead = await leadService.createLead({
      customerName: from,
      customerPhone: from,
      customerEmail: null,
      accidentSummary: text ? `WhatsApp ilk mesaj: ${text.substring(0, 200)}` : "WhatsApp inbound",
      kvkkConsentAt: null,
      source: "whatsapp",
    }, null, null);

    await prisma.activityLog.create({
      data: { leadId: lead.id, action: "WHATSAPP_INCOMING_NEW", detail: from },
    });

    const { sendWhatsAppMessage } = require("../services/whatsapp.service");
    sendWhatsAppMessage(from,
      "Mesajiniz alindi. Tedbirge avukatlari en kisa surede donus yapacak. Basvuru icin: tedbirge.ai/basvuru"
    ).catch(() => null);
  }

  // ChatSession bul veya oluştur
  const sessionKey = `wa-${lead.id}`;
  let session = await prisma.chatSession.findUnique({ where: { sessionKey } });
  if (!session) {
    session = await prisma.chatSession.create({
      data: { sessionKey, leadId: lead.id, userId: lead.ownerId ?? "system" },
    });
  }

  // Mesajı kaydet
  if (text) {
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        leadId:    lead.id,
        sender:    "user",
        message:   `[WhatsApp] ${text}`,
      },
    });

    // ActivityLog
    await prisma.activityLog.create({
      data: {
        leadId: lead.id,
        action: "WHATSAPP_MESAJ_ALINDI",
        detail: `WhatsApp mesajı alındı: ${text.slice(0, 100)}`,
      },
    });
  }
}

// ─── Delivery status güncelle ─────────────────────────────────────────────────

async function handleStatusUpdate(status) {
  // status.id     — mesaj id
  // status.status — sent | delivered | read | failed
  // status.recipient_id — alıcı numarası
  if (process.env.NODE_ENV !== "production") {
    console.log(`[WhatsApp] Durum: ${status.id} → ${status.status}`);
  }
  // İleride: mesaj tablosuna delivery durumu yaz
}

module.exports = router;
