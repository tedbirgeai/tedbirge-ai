"use strict";

const asyncHandler = require("../utils/asyncHandler");
const chatbot = require("../services/chatbot.service");
const prisma = require("../config/db");
const {
  sendProspectWelcomeEmail,
  sendProspectFollowUpEmail,
  sendProspectCampaignEmail,
} = require("../services/email.service");

/**
 * Bir e-postanın daha önce "abonelikten çıktım" dediğini kontrol eder.
 * Mevcut unsubscribe.routes.js'in yazdığı MARKETING_UNSUBSCRIBE ActivityLog
 * kayıtlarını okur (yeni tablo YOK — 0 hata ilkesi). detail alanı JSON
 * string olarak { email, channel, ... } tutar.
 */
async function isEmailUnsubscribed(email) {
  const clean = String(email || "").trim().toLowerCase();
  if (!clean) return false;
  const logs = await prisma.activityLog.findMany({
    where: { action: "MARKETING_UNSUBSCRIBE" },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });
  return logs.some((l) => {
    try {
      const d = JSON.parse(l.detail || "{}");
      return (d.email || "").trim().toLowerCase() === clean;
    } catch {
      return false;
    }
  });
}

/**
 * Bu e-postaya DAHA ÖNCE karşılama e-postası gönderilmiş mi?
 * (0 hata ilkesi: yeni tablo yok — WELCOME_EMAIL_SENT ActivityLog'unu okur.)
 */
async function hasWelcomeAlreadySent(email) {
  const clean = String(email || "").trim().toLowerCase();
  if (!clean) return false;
  const logs = await prisma.activityLog.findMany({
    where: { action: "WELCOME_EMAIL_SENT" },
    take: 5000,
  });
  return logs.some((l) => String(l.detail || "").trim().toLowerCase() === `email:${clean}`);
}

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

  // Admin'in göreceği yer: Dashboard → Müvekkil Adayları (bkz. listProspects)
  await prisma.activityLog.create({
    data: {
      action: "HERO_ASSISTANT_EMAIL_CAPTURED",
      detail: `sessionKey:${sessionKey} email:${cleanEmail}`,
    },
  });

  // YENİ — Karşılama e-postası, TEK SEFERLİK.
  //
  // BUG DÜZELTMESİ (kullanıcı raporuyla tespit edildi): Bu uç, kullanıcı
  // e-posta kutusuna her tıkladığında (ör. test amaçlı, ya da sayfa
  // yeniden yüklenip formu tekrar gönderdiğinde) çağrılabiliyordu ve HİÇBİR
  // "bu e-postaya daha önce hoş geldin maili gitti mi?" kontrolü yoktu —
  // bu yüzden AYNI kişiye 3 ayrı karşılama e-postası gitti. Artık önce
  // WELCOME_EMAIL_SENT kaydı kontrol ediliyor; daha önce gönderildiyse
  // ikinci bir karşılama maili ASLA gitmiyor (ActivityLog kaydı hâlâ
  // "e-posta bırakıldı" olarak her seferinde düşer — Müvekkil Adayları
  // listesi zaten en güncel kaydı gösterdiği için buna dokunulmadı).
  const alreadyWelcomed = await hasWelcomeAlreadySent(cleanEmail);
  if (!alreadyWelcomed) {
    sendProspectWelcomeEmail(cleanEmail)
      .then(() =>
        prisma.activityLog.create({
          data: { action: "WELCOME_EMAIL_SENT", detail: `email:${cleanEmail}` },
        })
      )
      .catch((e) => console.error("[lexscan] karşılama e-postası hatası:", e.message));
  }

  res.json({ success: true, data: { saved: true } });
});

/**
 * YENİ — Admin'in seçtiği müvekkil adaylarına toplu "özel gün / kampanya"
 * e-postası gönderir. Abonelikten çıkmış adresler otomatik atlanır.
 */
exports.sendCampaign = asyncHandler(async (req, res) => {
  const { emails, subject, message } = req.body || {};
  if (!Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ success: false, message: "En az bir e-posta seçin." });
  }
  if (!subject || !message) {
    return res.status(400).json({ success: false, message: "Konu ve mesaj zorunludur." });
  }

  const results = [];
  for (const email of emails) {
    const clean = String(email).trim().toLowerCase();
    const blocked = await isEmailUnsubscribed(clean);
    if (blocked) {
      results.push({ email: clean, sent: false, reason: "unsubscribed" });
      continue;
    }
    const r = await sendProspectCampaignEmail(clean, subject, message).catch((e) => ({
      success: false,
      error: e.message,
    }));
    results.push({ email: clean, sent: !!r?.success, mock: !!r?.mock });
    if (r?.success) {
      await prisma.activityLog.create({
        data: { action: "PROSPECT_CAMPAIGN_SENT", detail: `email:${clean} subject:${subject}` },
      });
    }
  }

  res.json({ success: true, data: { results } });
});

/**
 * YENİ — Admin'in bir müvekkil adayını manuel "iletişime geçildi / yanıtladı"
 * olarak işaretlemesi.
 *
 * DÜRÜSTLÜK NOTU: E-postanın gerçekten okunduğunu teknik olarak güvenilir
 * şekilde tespit etmek MÜMKÜN DEĞİLDİR (okundu-bilgisi / pixel-tracking
 * tutarsızdır, çoğu istemci engeller) — bu yüzden sahte bir "okundu" rozeti
 * eklemedik. Bunun yerine gerçek bir CRM pratiği kullanıyoruz: admin,
 * telefonla/e-postayla görüştükten sonra durumu ELLE işaretler. Yeni tablo
 * yok (0 hata ilkesi) — ActivityLog'a PROSPECT_CONTACT_STATUS olarak yazılır.
 */
exports.setProspectStatus = asyncHandler(async (req, res) => {
  const { email, status } = req.body || {};
  const clean = String(email || "").trim().toLowerCase();
  const allowed = ["NEW", "CONTACTED", "REPLIED"];
  if (!clean || !allowed.includes(status)) {
    return res.status(400).json({ success: false, message: "Geçersiz e-posta veya durum." });
  }
  await prisma.activityLog.create({
    data: { action: "PROSPECT_CONTACT_STATUS", detail: `email:${clean} status:${status}` },
  });
  res.json({ success: true, data: { email: clean, status } });
});

/**
 * YENİ — Müvekkil Adayları listesi (ADMIN-only, panel'de ayrı ekran).
 *
 * Yeni Prisma modeli/migration İSTEMEZ (0 hata ilkesi): ActivityLog'daki
 * HERO_ASSISTANT_EMAIL_CAPTURED kayıtlarını okuyup "sessionKey:X email:Y"
 * formatındaki detail alanını ayrıştırır. Aynı e-posta birden fazla kez
 * bırakmışsa (aynı sohbete tekrar döndüyse) SADECE en güncel kaydı tutar —
 * liste kalabalıklaşmaz.
 */
exports.listProspects = asyncHandler(async (req, res) => {
  const logs = await prisma.activityLog.findMany({
    where: { action: "HERO_ASSISTANT_EMAIL_CAPTURED" },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const byEmail = new Map();
  for (const log of logs) {
    const detail = String(log.detail || "");
    const emailMatch = detail.match(/email:(\S+)/);
    const sessionMatch = detail.match(/sessionKey:(\S+)/);
    const email = emailMatch?.[1] || null;
    if (!email) continue;
    if (byEmail.has(email)) continue; // en güncel (ilk gelen, DESC sıralı) kalır
    byEmail.set(email, {
      email,
      sessionKey: sessionMatch?.[1] || null,
      capturedAt: log.createdAt,
    });
  }

  const prospects = Array.from(byEmail.values());

  // Her adayın abonelikten çıkıp çıkmadığını işaretle (panelde soluk/etiketli gösterilir)
  const unsubLogs = await prisma.activityLog.findMany({
    where: { action: "MARKETING_UNSUBSCRIBE" },
    take: 2000,
  });
  const unsubEmails = new Set(
    unsubLogs
      .map((l) => {
        try {
          return (JSON.parse(l.detail || "{}").email || "").trim().toLowerCase();
        } catch {
          return null;
        }
      })
      .filter(Boolean)
  );
  for (const p of prospects) {
    p.unsubscribed = unsubEmails.has(p.email.trim().toLowerCase());
  }

  // Her adayın en güncel iletişim durumunu (Yeni/Arandı-Yazıldı/Yanıtlandı) ekle
  const statusLogs = await prisma.activityLog.findMany({
    where: { action: "PROSPECT_CONTACT_STATUS" },
    orderBy: { createdAt: "desc" },
    take: 3000,
  });
  const statusByEmail = new Map();
  for (const log of statusLogs) {
    const detail = String(log.detail || "");
    const email = detail.match(/email:(\S+)/)?.[1];
    const status = detail.match(/status:(\S+)/)?.[1];
    if (email && status && !statusByEmail.has(email)) {
      statusByEmail.set(email, status); // DESC sıralı, ilk gelen en güncel
    }
  }
  for (const p of prospects) {
    p.contactStatus = statusByEmail.get(p.email.trim().toLowerCase()) || "NEW";
  }

  // Her aday için o oturumdaki ilk kullanıcı mesajını (kaza özeti) ekle —
  // panelde "ne hakkında yazmış" görülebilsin diye.
  for (const p of prospects) {
    if (!p.sessionKey) {
      p.firstMessage = null;
      continue;
    }
    const session = await prisma.chatSession.findUnique({ where: { sessionKey: p.sessionKey } });
    if (!session) {
      p.firstMessage = null;
      continue;
    }
    const firstMsg = await prisma.chatMessage.findFirst({
      where: { sessionId: session.id, sender: "user" },
      orderBy: { createdAt: "asc" },
    });
    p.firstMessage = firstMsg?.message?.slice(0, 200) || null;
  }

  res.json({ success: true, data: { prospects, total: prospects.length } });
});
