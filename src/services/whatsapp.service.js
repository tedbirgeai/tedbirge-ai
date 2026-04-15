/**
 * WhatsApp Business Cloud API Servisi
 *
 * Gerekli .env değişkenleri:
 *   WHATSAPP_TOKEN      — Meta Graph API erişim tokeni (System User Token önerilir)
 *   WHATSAPP_PHONE_ID   — WhatsApp Business telefon numarası kimliği
 *   WHATSAPP_API_VERSION — API versiyonu (varsayılan: v19.0)
 *   WHATSAPP_APP_SECRET  — Webhook imza doğrulama için app secret (opsiyonel)
 *
 * Eksik değişkenlerde otomatik olarak mock moda düşer.
 *
 * Önemli WhatsApp Business API Kuralları:
 *   - 24 saatlik müşteri hizmet penceresi içinde serbest metin gönderilebilir.
 *   - Pencere dışında SADECE onaylı şablon mesajları (template) gönderilebilir.
 *   - Şablon yoksa veya şablon adı belirtilmemişse metin mesajı denenir (pencere içini varsayar).
 */

const crypto = require("crypto");
const env    = require("../config/env");
const prisma = require("../config/db");

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

function isMockMode() {
  return !env.whatsappToken || !env.whatsappPhoneId;
}

/** Telefon numarasını E.164'e normalize et (başında +90 veya 90 → 90XXXXXXXXXX) */
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return digits;
  if (digits.startsWith("0")  && digits.length === 11) return "9" + digits;
  if (digits.length === 10)                             return "90" + digits;
  return digits;
}

/** Meta Graph API hata yanıtını insanca okunur mesaja çevirir */
function parseMetaError(body) {
  try {
    const parsed = typeof body === "string" ? JSON.parse(body) : body;
    const err = parsed?.error;
    if (!err) return String(body);
    return `[${err.code}/${err.error_subcode ?? "—"}] ${err.message}` +
           (err.error_user_msg ? ` (Kullanıcı: ${err.error_user_msg})` : "");
  } catch {
    return String(body);
  }
}

/** Basit exponential-backoff retry */
async function withRetry(fn, maxAttempts = 2, baseDelayMs = 500) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, baseDelayMs * attempt));
    }
  }
}

// ─── Çekirdek gönderim ────────────────────────────────────────────────────────

/**
 * Serbest metin mesajı gönder.
 * Yalnızca 24 saatlik hizmet penceresi içinde çalışır.
 *
 * @returns {{ success: boolean, messageId?: string, mock?: boolean }}
 */
async function sendWhatsAppMessage(toPhone, message) {
  if (isMockMode()) {
    console.log(`[WhatsApp MOCK] → ${toPhone}: ${message.slice(0, 80)}...`);
    return { success: true, mock: true };
  }

  const to = normalizePhone(toPhone);
  if (!to) {
    console.error("[WhatsApp] Geçersiz telefon:", toPhone);
    return { success: false, error: "Geçersiz telefon" };
  }

  const url = `https://graph.facebook.com/${env.whatsappApiVersion}/${env.whatsappPhoneId}/messages`;

  return withRetry(async () => {
    const res = await fetch(url, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        Authorization:   `Bearer ${env.whatsappToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type:  "text",
        text:  { body: message, preview_url: false },
      }),
    });

    const raw = await res.text();

    if (!res.ok) {
      const msg = parseMetaError(raw);
      console.error(`[WhatsApp] HTTP ${res.status}: ${msg}`);
      throw new Error(msg);
    }

    let data;
    try { data = JSON.parse(raw); } catch { data = {}; }

    const messageId = data?.messages?.[0]?.id ?? null;
    return { success: true, messageId };
  }, 2).catch((err) => {
    console.error("[WhatsApp] Gönderim başarısız:", err.message);
    return { success: false, error: err.message };
  });
}

/**
 * Onaylı şablon mesajı gönder.
 * 24 saatlik pencere dışında yalnızca şablon mesajları çalışır.
 *
 * @param {string} toPhone
 * @param {string} templateName  — Meta'da onaylanan şablon adı (örn. "yeni_basvuru")
 * @param {string} languageCode  — "tr" veya "en_US"
 * @param {Array}  components    — Şablon parametreleri (boş dizi = parametresiz şablon)
 */
async function sendWhatsAppTemplate(toPhone, templateName, languageCode = "tr", components = []) {
  if (isMockMode()) {
    console.log(`[WhatsApp MOCK TEMPLATE] → ${toPhone}, şablon: ${templateName}`);
    return { success: true, mock: true };
  }

  const to = normalizePhone(toPhone);
  if (!to) return { success: false, error: "Geçersiz telefon" };

  const url = `https://graph.facebook.com/${env.whatsappApiVersion}/${env.whatsappPhoneId}/messages`;

  const body = {
    messaging_product: "whatsapp",
    to,
    type:     "template",
    template: {
      name:     templateName,
      language: { code: languageCode },
      ...(components.length > 0 && { components }),
    },
  };

  return withRetry(async () => {
    const res = await fetch(url, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${env.whatsappToken}`,
      },
      body: JSON.stringify(body),
    });

    const raw = await res.text();
    if (!res.ok) throw new Error(parseMetaError(raw));

    const data = JSON.parse(raw);
    return { success: true, messageId: data?.messages?.[0]?.id ?? null };
  }, 2).catch((err) => {
    console.error(`[WhatsApp] Şablon gönderimi başarısız (${templateName}):`, err.message);
    return { success: false, error: err.message };
  });
}

/**
 * Webhook imzasını doğrula (Meta güvenlik zorunluluğu).
 * Express middleware olarak kullanılır.
 */
function verifyWebhookSignature(req, res, next) {
  const secret = env.whatsappAppSecret;
  if (!secret) return next(); // App secret yoksa atla

  const sig = req.headers["x-hub-signature-256"] || "";
  const expected = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(req.rawBody || "")
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return res.status(403).json({ error: "Geçersiz webhook imzası" });
  }
  next();
}

// ─── WhatsApp Redirect (mevcut) ───────────────────────────────────────────────

function createWhatsappRedirect(lead) {
  const phone = env.whatsappDefaultNumber;
  const message = encodeURIComponent(
    `Merhaba, ${lead.customerName} icin ${lead.leadCode} kodlu trafik kazasi dosyasi on analizi hazir. Tahmini tazminat: ${lead.estimatedCompensation || 0} TL.`
  );
  return `https://wa.me/${phone}?text=${message}`;
}

async function markRedirected(leadId) {
  return prisma.lead.update({
    where: { id: leadId },
    data:  { whatsappRedirected: true },
  });
}

// ─── Otomatik Mesaj Şablonları ─────────────────────────────────────────────────

/**
 * Yeni başvuru — müvekkile bildirim.
 * Şablon varsa şablon kullan, yoksa serbest metin (pencere içi varsayımı).
 */
async function sendNewLeadNotification(lead) {
  if (!lead?.customerPhone) return;

  // Meta'da "yeni_basvuru" adlı şablon onaylanmışsa şablon kullan
  if (!isMockMode() && process.env.WA_TEMPLATE_YENI_BASVURU) {
    return sendWhatsAppTemplate(
      lead.customerPhone,
      process.env.WA_TEMPLATE_YENI_BASVURU,
      "tr",
      [
        {
          type:       "body",
          parameters: [
            { type: "text", text: lead.customerName },
            { type: "text", text: lead.leadCode },
          ],
        },
      ]
    );
  }

  const message =
    `Sayın ${lead.customerName}, Tedbirge Hukuk'a başvurunuz alındı.\n` +
    `Dosya No: ${lead.leadCode}\n` +
    `Başvurunuzu takip etmek için: tedbirge.ai/basvuru-sorgula`;

  return sendWhatsAppMessage(lead.customerPhone, message);
}

/** Avukat atandığında müvekkile bildirim */
async function sendLawyerAssignedNotification(lead, lawyerName) {
  if (!lead?.customerPhone) return;

  if (!isMockMode() && process.env.WA_TEMPLATE_AVUKAT_ATAMA) {
    return sendWhatsAppTemplate(
      lead.customerPhone,
      process.env.WA_TEMPLATE_AVUKAT_ATAMA,
      "tr",
      [
        {
          type:       "body",
          parameters: [
            { type: "text", text: lead.customerName },
            { type: "text", text: lead.leadCode },
            { type: "text", text: lawyerName },
          ],
        },
      ]
    );
  }

  const message =
    `Sayın ${lead.customerName}, dosyanız (${lead.leadCode}) Av. ${lawyerName} tarafından üstlenildi.\n` +
    `Avukatınız en kısa sürede sizinle iletişime geçecektir.\n` +
    `Dosya takip: tedbirge.ai/basvuru-sorgula`;

  return sendWhatsAppMessage(lead.customerPhone, message);
}

/** Zamanaşımı uyarısı — avukata */
async function sendStatuteOfLimitationsWarning(lead, lawyerPhone, lawyerName, remainingDays) {
  if (!lawyerPhone) return;

  const urgency = remainingDays <= 7 ? "🚨 ACİL" : "⚠ UYARI";
  const message =
    `${urgency} — Sayın ${lawyerName},\n` +
    `${lead.customerName} müvekkilinizin ${lead.leadCode} no'lu dosyasında ` +
    `zamanaşımı süresine ${remainingDays} gün kaldı.\n` +
    `Kaza: ${lead.accidentDate ? new Date(lead.accidentDate).toLocaleDateString("tr-TR") : "—"}\n` +
    `Lütfen acil işlem alın.`;

  return sendWhatsAppMessage(lawyerPhone, message);
}

module.exports = {
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
  verifyWebhookSignature,
  createWhatsappRedirect,
  markRedirected,
  sendNewLeadNotification,
  sendLawyerAssignedNotification,
  sendStatuteOfLimitationsWarning,
  isMockMode,
};
