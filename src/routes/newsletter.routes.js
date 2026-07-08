// src/routes/newsletter.routes.js
//
// "Bültenimize Kaydol" — Halka açık bülten aboneliği.
//
// 0 hata ilkesi: yeni tablo/migration YOK (career-application'ın aksine, bu
// prospect/unsubscribe akışıyla aynı desende — ActivityLog + imzalı token
// üzerinden çalışıyor, mevcut UNSUBSCRIBE_SECRET yeniden kullanılıyor).
// Çift onay (double opt-in): kayıt olan e-posta önce "beklemede" sayılır,
// e-postadaki linke tıklayınca "onaylandı" olur — spam şikayetlerini ve
// sahte adresleri engelleyen dünya standardı uygulama.
//
// TBB uyumu: bülten içeriği sadece "Basın Bültenlerimiz" arşivinden
// (lib/basin-bultenleri.ts, panel tarafı) gönderilir — bilgilendirici,
// vaat/başarı istatistiği İÇERMEZ.

"use strict";

const express = require("express");
const crypto = require("crypto");
const prisma = require("../config/db");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

const router = express.Router();
const SECRET = process.env.UNSUBSCRIBE_SECRET || "change-me-in-production";

function generateConfirmToken(email) {
  const payload = Buffer.from(JSON.stringify({ email, purpose: "newsletter_confirm" })).toString("base64");
  const signature = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

function verifyConfirmToken(token) {
  try {
    const [payload, signature] = token.split(".");
    const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    if (signature !== expected) return null;
    const data = JSON.parse(Buffer.from(payload, "base64").toString());
    if (data.purpose !== "newsletter_confirm" || !data.email) return null;
    return data;
  } catch {
    return null;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── POST /public-newsletter-subscribe ─────────────────────────
router.post("/public-newsletter-subscribe", async (req, res) => {
  try {
    const { email, kvkkOnay } = req.body;
    const clean = String(email || "").trim().toLowerCase();

    if (!clean || !EMAIL_RE.test(clean)) {
      return res.status(400).json({ error: "Geçerli bir e-posta adresi giriniz." });
    }
    if (!kvkkOnay) {
      return res.status(400).json({ error: "KVKK aydınlatma metnini onaylamanız gerekir." });
    }

    // Zaten abonelikten çıkmışsa (newsletter kanalından) tekrar tekrar
    // kayıt/onay e-postası ile rahatsız etmeyelim — nazikçe kabul et.
    const alreadyUnsub = await prisma.activityLog.findFirst({
      where: { action: "MARKETING_UNSUBSCRIBE" },
      orderBy: { createdAt: "desc" },
    }).catch(() => null);

    let unsubscribed = false;
    if (alreadyUnsub) {
      try {
        const detail = JSON.parse(alreadyUnsub.detail || "{}");
        if (detail.channel === "newsletter" && detail.email?.toLowerCase() === clean) unsubscribed = true;
      } catch { /* ignore */ }
    }

    await prisma.activityLog.create({
      data: { action: "NEWSLETTER_SUBSCRIBE_REQUESTED", detail: JSON.stringify({ email: clean, requestedAt: new Date().toISOString() }) },
    }).catch((e) => console.warn("[NEWSLETTER] ActivityLog yazilamadi:", e.message));

    if (!unsubscribed) {
      let sendNewsletterConfirmationEmail;
      try {
        ({ sendNewsletterConfirmationEmail } = require("../services/email.service"));
      } catch { /* mock mod, sorun degil */ }

      if (sendNewsletterConfirmationEmail) {
        const base = process.env.PUBLIC_BASE_URL || "https://www.tedbirge.ai";
        const confirmUrl = `${base}/api/newsletter-confirm?token=${encodeURIComponent(generateConfirmToken(clean))}`;
        sendNewsletterConfirmationEmail(clean, confirmUrl).catch((e) =>
          console.error("[NEWSLETTER] Onay e-postasi gonderilemedi:", e.message)
        );
      }
    }

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error("[NEWSLETTER] Subscribe hatasi:", error);
    return res.status(500).json({ error: "Kayıt sırasında hata oluştu." });
  }
});

// ─── GET /newsletter-confirm?token=... (e-postadaki linkten açılır) ────
router.get("/newsletter-confirm", async (req, res) => {
  const { token } = req.query;
  const data = token && verifyConfirmToken(token);

  if (!data) {
    return res.status(400).send(renderPage("Bağlantı Geçersiz", "Bu onay bağlantısı geçerli değil veya süresi dolmuş.", false));
  }

  try {
    await prisma.activityLog.create({
      data: { action: "NEWSLETTER_CONFIRMED", detail: JSON.stringify({ email: data.email, confirmedAt: new Date().toISOString() }) },
    });
  } catch (err) {
    console.error("[NEWSLETTER] Confirm ActivityLog FAILED:", err.message);
  }

  return res.send(renderPage("Aboneliğiniz Onaylandı", "Tedbirge AI bültenine hoş geldiniz — yeni makale ve gelişmelerden ilk siz haberdar olacaksınız.", true));
});

function renderPage(title, message, success) {
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:Arial,sans-serif;max-width:520px;margin:80px auto;text-align:center;color:#1e293b;">
  <div style="font-size:48px;margin-bottom:16px;">${success ? "✅" : "⚠️"}</div>
  <h1 style="color:#1E1E8E;font-size:22px;">${title}</h1>
  <p style="color:#475569;line-height:1.6;">${message}</p>
  <p style="margin-top:24px;"><a href="https://www.tedbirge.ai" style="color:#1E1E8E;font-weight:700;text-decoration:none;">Anasayfaya dön →</a></p>
</body>
</html>`;
}

// ─── GET /newsletter-subscribers (ADMIN) — abone listesi ───────
router.get("/newsletter-subscribers", auth, role("ADMIN"), async (req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { action: { in: ["NEWSLETTER_SUBSCRIBE_REQUESTED", "NEWSLETTER_CONFIRMED"] } },
      orderBy: { createdAt: "asc" },
      take: 5000,
    });
    const unsubLogs = await prisma.activityLog.findMany({
      where: { action: "MARKETING_UNSUBSCRIBE" },
      take: 5000,
    });

    const unsubEmails = new Set();
    for (const l of unsubLogs) {
      try {
        const d = JSON.parse(l.detail || "{}");
        if (d.channel === "newsletter" && d.email) unsubEmails.add(d.email.toLowerCase());
      } catch { /* ignore */ }
    }

    const byEmail = new Map();
    for (const log of logs) {
      let detail = {};
      try { detail = JSON.parse(log.detail || "{}"); } catch { /* ignore */ }
      if (!detail.email) continue;
      const key = detail.email.toLowerCase();
      const existing = byEmail.get(key) || { email: detail.email, requestedAt: null, confirmedAt: null };
      if (log.action === "NEWSLETTER_SUBSCRIBE_REQUESTED") existing.requestedAt = log.createdAt;
      if (log.action === "NEWSLETTER_CONFIRMED") existing.confirmedAt = log.createdAt;
      byEmail.set(key, existing);
    }

    const subscribers = Array.from(byEmail.entries()).map(([key, v]) => ({
      ...v,
      unsubscribed: unsubEmails.has(key),
    })).sort((a, b) => new Date(b.requestedAt || 0).getTime() - new Date(a.requestedAt || 0).getTime());

    const confirmedActive = subscribers.filter((s) => s.confirmedAt && !s.unsubscribed).length;

    return res.json({
      subscribers,
      summary: { total: subscribers.length, confirmedActive, unsubscribed: unsubEmails.size },
    });
  } catch (error) {
    console.error("[NEWSLETTER] Admin GET hatasi:", error);
    return res.status(500).json({ error: "Veriler yüklenirken hata oluştu." });
  }
});

// ─── POST /newsletter-send (ADMIN) — bir bülteni onaylı abonelere gönder ──
router.post("/newsletter-send", auth, role("ADMIN"), async (req, res) => {
  try {
    const { bulletinNo, subject, htmlBody } = req.body;
    if (!subject || !htmlBody) {
      return res.status(400).json({ error: "subject ve htmlBody zorunludur." });
    }

    const logs = await prisma.activityLog.findMany({
      where: { action: { in: ["NEWSLETTER_SUBSCRIBE_REQUESTED", "NEWSLETTER_CONFIRMED"] } },
      take: 5000,
    });
    const unsubLogs = await prisma.activityLog.findMany({
      where: { action: "MARKETING_UNSUBSCRIBE" },
      take: 5000,
    });
    const unsubEmails = new Set();
    for (const l of unsubLogs) {
      try {
        const d = JSON.parse(l.detail || "{}");
        if (d.channel === "newsletter" && d.email) unsubEmails.add(d.email.toLowerCase());
      } catch { /* ignore */ }
    }
    const confirmedEmails = new Set();
    for (const l of logs) {
      if (l.action !== "NEWSLETTER_CONFIRMED") continue;
      try {
        const d = JSON.parse(l.detail || "{}");
        if (d.email && !unsubEmails.has(d.email.toLowerCase())) confirmedEmails.add(d.email);
      } catch { /* ignore */ }
    }

    let sendNewsletterBulletinEmail;
    try {
      ({ sendNewsletterBulletinEmail } = require("../services/email.service"));
    } catch {
      return res.status(500).json({ error: "E-posta servisi kullanılamıyor." });
    }

    const recipients = Array.from(confirmedEmails);
    let sent = 0;
    // Sıralı gönderim — SMTP hız limitini (5 msg/sn) aşmamak için (Madde 24.14).
    for (const email of recipients) {
      try {
        await sendNewsletterBulletinEmail(email, subject, htmlBody);
        sent += 1;
      } catch (e) {
        console.warn(`[NEWSLETTER] Gönderilemedi (${email}):`, e.message);
      }
    }

    await prisma.activityLog.create({
      data: { action: "NEWSLETTER_SENT", detail: JSON.stringify({ bulletinNo: bulletinNo || null, subject, recipientCount: recipients.length, sent, sentAt: new Date().toISOString() }) },
    }).catch(() => {});

    return res.json({ success: true, recipientCount: recipients.length, sent });
  } catch (error) {
    console.error("[NEWSLETTER] Send hatasi:", error);
    return res.status(500).json({ error: "Gönderim sırasında hata oluştu." });
  }
});

module.exports = router;
