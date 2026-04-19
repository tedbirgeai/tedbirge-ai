/**
 * SMS Servisi — Netgsm entegrasyonu
 *
 * Gerekli .env değişkenleri:
 *   NETGSM_USERNAME   — Netgsm kullanıcı adı (müşteri kodu)
 *   NETGSM_PASSWORD   — Netgsm şifresi
 *   NETGSM_HEADER     — Gönderici başlığı, maks 11 karakter (örn. TEDBIRGE)
 *
 * Opsiyonel:
 *   NETGSM_ENCODING   — "TR" | "EN" (varsayılan: "TR" — Türkçe karakter desteği)
 *
 * Eksik kimlik bilgilerinde mock moda düşer.
 *
 * Encoding notu:
 *   Netgsm dil=TR olduğunda Türkçe karakterleri (ğ,ş,ç,ı,ö,ü vb.) otomatik işler.
 *   Türkçe karakter içeren SMS = UCS-2 = 70 karakter/segment (standart 160 yerine).
 *   Uzun mesajlar otomatik bölünür; Netgsm birden fazla SMS ücreti alır.
 */

const https = require("https");

// ─── Netgsm hata kodları ──────────────────────────────────────────────────────

const NETGSM_ERROR_CODES = {
  "20":  "Mesaj metni boş ya da hatalı karakter içeriyor",
  "30":  "Geçersiz kullanıcı adı, şifre veya API erişimi kapalı",
  "40":  "Mesaj başlığı (header) hesaba tanımlı değil",
  "50":  "Aboneliğiniz bulunmuyor",
  "51":  "Aktif bir paketiniz bulunmuyor",
  "70":  "Geçersiz istek — hatalı parametre",
  "80":  "Saat dilimi hatası veya zamanlanmış gönderim hatası",
  "85":  "Kara listede olan numara",
};

function parseNetgsmResponse(raw) {
  const text = raw.trim();
  // Başarı: "00 ..." veya "01 ..."
  if (/^0[01]/.test(text)) {
    const parts = text.split(" ");
    return { success: true, bulkId: parts[1] ?? null };
  }
  const desc = NETGSM_ERROR_CODES[text] ?? `Netgsm hata kodu: ${text}`;
  return { success: false, error: desc, code: text };
}

// ─── Telefon normalize ────────────────────────────────────────────────────────

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return digits;
  if (digits.startsWith("0")  && digits.length === 11) return "9" + digits;
  if (digits.length === 10)                             return "90" + digits;
  return null; // Tanımsız format
}

// ─── Türkçe karakter içeriyor mu? ─────────────────────────────────────────────

function hasTurkishChars(text) {
  return /[çğıöşüÇĞİÖŞÜ]/.test(text);
}

/**
 * Bir SMS'in kaç segmente bölüneceğini hesapla.
 * Türkçe karakter varsa UCS-2 (70 char/seg), yoksa GSM-7 (160 char/seg).
 */
function countSegments(text) {
  const len = text.length;
  if (hasTurkishChars(text)) {
    // UCS-2: tek segment ≤70, çok segment ≤67 her biri
    if (len <= 70)  return 1;
    return Math.ceil(len / 67);
  }
  if (len <= 160) return 1;
  return Math.ceil(len / 153);
}

// ─── Mock mod ─────────────────────────────────────────────────────────────────

function isMockMode() {
  return !process.env.NETGSM_USERNAME || !process.env.NETGSM_PASSWORD;
}

// ─── Gerçek gönderim — Netgsm HTTP GET API ────────────────────────────────────

async function sendSmsReal(to, message) {
  const phone = normalizePhone(to);
  if (!phone) throw new Error(`Geçersiz telefon numarası: ${to}`);

  const segments = countSegments(message);
  if (segments > 3) {
    console.warn(`[SMS] Uyarı: ${segments} segment uzunluğunda mesaj (${message.length} karakter)`);
  }

  const params = new URLSearchParams({
    usercode:  process.env.NETGSM_USERNAME,
    password:  process.env.NETGSM_PASSWORD,
    gsmno:     phone,
    message,
    msgheader: (process.env.NETGSM_HEADER || "TEDBIRGE").slice(0, 11),
    dil:       process.env.NETGSM_ENCODING || "TR",
  });

  const url = `https://api.netgsm.com.tr/sms/send/get?${params.toString()}`;

  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 10000 }, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        const result = parseNetgsmResponse(raw);
        if (result.success) {
          resolve(result);
        } else {
          reject(new Error(result.error));
        }
      });
    }).on("error", reject).on("timeout", () => {
      reject(new Error("Netgsm bağlantı zaman aşımı"));
    });
  });
}

// ─── Ana gönderim fonksiyonu ──────────────────────────────────────────────────

async function sendSms(to, message) {
  if (!to) return;

  if (isMockMode()) {
    const seg = countSegments(message);
    console.log(`[SMS MOCK] → ${to} (${seg} segment, ${message.length} karakter)`);
    console.log(`[SMS MOCK] ${message}`);
    return { success: true, mock: true };
  }

  try {
    const result = await sendSmsReal(to, message);
    console.log(`[SMS] Gönderildi → ${to}, bulkId: ${result.bulkId}`);
    return result;
  } catch (err) {
    console.error(`[SMS ERROR] → ${to}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * OTP SMS — kısa, net, sadece rakam içerir.
 * Yanlışlıkla uzun mesaj gönderimini engeller.
 */
async function sendOtpSms(to, code, purpose = "onay") {
  const message = `Tedbirge ${purpose} kodunuz: ${code}. 10 dakika gecerlidir. Kodu kimseyle paylasmayin.`;
  return sendSms(to, message);
}

// ─── SMS şablonları ───────────────────────────────────────────────────────────

const STATUS_LABEL_TR = {
  NEW:                "Basvuru alindi",
  CONTACTED:          "Iletisime gecildi",
  DOCS_PENDING:       "Belge bekleniyor",
  DOCS_RECEIVED:      "Belgeler alindi",
  ANALYZED:           "Degerlendirme tamamlandi",
  OFFER_SENT:         "Teklif gonderildi",
  CONTRACT_PENDING:   "Sozlesme hazirlanıyor",
  ASSIGNED_TO_LAWYER: "Avukat atandi",
  WON:                "Surec tamamlandi",
  LOST:               "Dosya kapandi",
};

async function sendStatusChangeSms(lead, newStatus) {
  if (!lead?.customerPhone) return;
  const label = STATUS_LABEL_TR[newStatus] || newStatus;
  const name  = (lead.customerName || "").split(" ")[0] || "Musterimiz";
  // Türkçe karakter kullanma — SMS segmentini küçük tut
  const msg = `Sayin ${name}, basvurunuz "${label}" asamasina gecti. ` +
              `Detay: tedbirge.ai/basvuru-sorgula | Dosya: ${lead.leadCode || ""}`;
  return sendSms(lead.customerPhone, msg);
}

async function sendLawyerAssignedSms(lead, lawyerName) {
  if (!lead?.customerPhone) return;
  const name = (lead.customerName || "").split(" ")[0] || "Musterimiz";
  const msg  = `Sayin ${name}, dosyaniz Av. ${lawyerName || "avukatimiza"} atandi. ` +
               `En kisa surede iletisime gecilecektir. Dosya: ${lead.leadCode || ""}`;
  return sendSms(lead.customerPhone, msg);
}

async function sendContractCreatedSms(lead, contractType) {
  if (!lead?.customerPhone) return;
  const name  = (lead.customerName || "").split(" ")[0] || "Musterimiz";
  const label = contractType === "POWER_OF_ATTORNEY" ? "vekaletnameniz" : "avukatlik sozlesmeniz";
  const msg   = `Sayin ${name}, ${label} hazirlanmistir. ` +
                `Incelemek icin: tedbirge.ai/basvuru-sorgula | Dosya: ${lead.leadCode || ""}`;
  return sendSms(lead.customerPhone, msg);
}

async function sendStatuteLimitWarningSms(lead, daysRemaining, overrideMessage) {
  if (!lead?.customerPhone) return;
  if (overrideMessage) return sendSms(lead.customerPhone, overrideMessage);
  const name = (lead.customerName || "").split(" ")[0] || "Musterimiz";
  const msg  = `UYARI: Sayin ${name}, dosyanizin zamanasimi suresi ${daysRemaining} gun icinde dolacak. ` +
               `Lutfen avukatinizla iletisime gecin. Dosya: ${lead.leadCode || ""}`;
  return sendSms(lead.customerPhone, msg);
}

async function sendOnayBildirim(phone, type) {
  // type: 'temsilci' | 'avukat' (ileride genisleyebilir)
  const mesaj = "Tedbirge temsilci basvurunuz onaylandi. Artik panele giris yapabilirsiniz: https://tedbirge.ai";
  return sendSms(phone, mesaj);
}

module.exports = {
  sendSms,
  sendOtpSms,
  normalizePhone,
  countSegments,
  isMockMode,
  sendStatusChangeSms,
  sendLawyerAssignedSms,
  sendContractCreatedSms,
  sendStatuteLimitWarningSms,
  sendOnayBildirim,
};
