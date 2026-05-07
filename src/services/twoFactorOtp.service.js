// TUR #74 W4+W5 — 2FA SMS + Email OTP service
// Mevcut PhoneOtp tablosu kullanir (purpose: '2fa-sms' / '2fa-email')
// Mevcut sms.service.js (NetGSM) + email.service.js (Nodemailer) entegrasyonu

const crypto = require("crypto");
const prisma = require("../config/db");
const { sendSms } = require("./sms.service");
const { sendEmail } = require("./email.service");

const SMS_TTL_MS = 5 * 60 * 1000; // 5 dk
const EMAIL_TTL_MS = 10 * 60 * 1000; // 10 dk
const SMS_RATE_LIMIT_MS = 60 * 1000; // 1 dk
const EMAIL_RATE_LIMIT_MS = 2 * 60 * 1000; // 2 dk

function generateOTP() {
  return String(crypto.randomInt(100000, 1000000));
}

function maskPhone(phone) {
  if (!phone) return "***";
  const tail = phone.slice(-2);
  return `5XX-***-**${tail}`;
}

function maskEmail(email) {
  if (!email) return "***";
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${(local || "").slice(0, 2)}***@${domain}`;
}

// ─── SMS 2FA ────────────────────────────────────────────────────────────────

async function sendSmsOtp(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, phone: true, fullName: true },
  });
  if (!user?.phone) {
    throw new Error("Telefon numarası kayıtlı değil. Önce profilinize telefon ekleyin.");
  }

  // Rate limit (mevcut PhoneOtp'da son 1 dk içinde 2fa-sms purpose var mı?)
  const recent = await prisma.phoneOtp.findFirst({
    where: { phone: user.phone, purpose: "2fa-sms", createdAt: { gte: new Date(Date.now() - SMS_RATE_LIMIT_MS) } },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    throw new Error("Çok hızlı tekrar deneme. 1 dk bekleyin.");
  }

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + SMS_TTL_MS);

  // PhoneOtp kaydı (raw kod — TUR #74 OTP kısa süreli, hash gerek yok TUR #15 emsali)
  await prisma.phoneOtp.create({
    data: { phone: user.phone, code, purpose: "2fa-sms", expiresAt },
  });

  // SMS gönder (NetGSM mevcut)
  const message = `Tedbirge 2FA dogrulama kodunuz: ${code}\nGecerlilik: 5 dk\nKodu kimseyle paylasmayin.`;
  const result = await sendSms(user.phone, message);

  // TUR #76 R2 — Provider response kodu kontrolu (Madde 30.30)
  // sms.service.js sendSms() {success:false} donerse silent failure - throw ZORUNLU
  if (!result || result.success === false) {
    const errMsg = result?.error || "SMS gonderilemedi (NetGSM yanit yok)";
    // KVKK ActivityLog: hata kanit
    try {
      await prisma.activityLog.create({
        data: {
          action: "SMS_OTP_FAILED",
          detail: `2FA SMS OTP gonderilemedi: ${maskPhone(user.phone)} · ${errMsg.slice(0, 200)}`,
        },
      });
    } catch (_) {}
    // PhoneOtp kaydı silinsin (kullaniciya kod gitmedi, DB temizlik)
    try {
      await prisma.phoneOtp.deleteMany({ where: { phone: user.phone, code, purpose: "2fa-sms" } });
    } catch (_) {}
    throw new Error(`SMS gönderilemedi: ${errMsg}`);
  }

  // KVKK ActivityLog: basari kanit (provider onayli)
  try {
    await prisma.activityLog.create({
      data: {
        action: "SMS_OTP_SENT",
        detail: `2FA SMS OTP gönderildi (NetGSM bulkId: ${result?.bulkId || "?"}): ${maskPhone(user.phone)}`,
      },
    });
  } catch (_) {}

  return { ok: true, phoneMask: maskPhone(user.phone), expiresAt, mock: result?.mock || false, bulkId: result?.bulkId };
}

async function verifySmsOtp(userId, code) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, phone: true },
  });
  if (!user?.phone) throw new Error("Telefon kayıtlı değil.");

  const otp = await prisma.phoneOtp.findFirst({
    where: { phone: user.phone, code: String(code), purpose: "2fa-sms" },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) throw new Error("Geçersiz veya bulunamadı.");
  if (new Date(otp.expiresAt) < new Date()) {
    await prisma.phoneOtp.delete({ where: { id: otp.id } }).catch(() => {});
    throw new Error("Kod süresi doldu.");
  }
  await prisma.phoneOtp.delete({ where: { id: otp.id } });
  return { ok: true };
}

// ─── EMAIL 2FA ──────────────────────────────────────────────────────────────

async function sendEmailOtp(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true },
  });
  if (!user?.email) throw new Error("E-posta kayıtlı değil.");

  // Rate limit (mevcut: son 2 dk içinde tek istek)
  const recent = await prisma.phoneOtp.findFirst({
    where: { phone: user.email, purpose: "2fa-email", createdAt: { gte: new Date(Date.now() - EMAIL_RATE_LIMIT_MS) } },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    throw new Error("Çok hızlı tekrar deneme. 2 dk bekleyin.");
  }

  // TUR #92 Q6 — Sertleşme: 5 dk içinde max 3 OTP isteği (Madde 30.32 R1)
  // PhoneOtp tablosundan sayım (ActivityLog'da userId field yok, schema dokunma yasak Madde 3.1)
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentRequests = await prisma.phoneOtp.count({
    where: {
      phone: user.email,
      purpose: "2fa-email",
      createdAt: { gte: fiveMinAgo },
    },
  }).catch(() => 0);
  if (recentRequests >= 3) {
    throw new Error("Çok fazla deneme. Lütfen 15 dakika sonra tekrar deneyin.");
  }

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + EMAIL_TTL_MS);

  // PhoneOtp tablosu phone field'ında email saklanır (purpose 2fa-email)
  await prisma.phoneOtp.create({
    data: { phone: user.email, code, purpose: "2fa-email", expiresAt },
  });

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f6f7f9;color:#222;">
      <div style="background:#fff;border-radius:14px;padding:28px;box-shadow:0 2px 12px rgba(0,0,0,.06);">
        <div style="border-bottom:2px solid #1e1e8e;padding-bottom:14px;margin-bottom:20px;">
          <div style="font-size:11px;color:#666;letter-spacing:1px;">TEDBIRGE.AI</div>
          <h1 style="margin:6px 0 0;color:#1e1e8e;font-size:22px;">2FA Doğrulama Kodu</h1>
        </div>
        <p>Sayın ${user.fullName || ""},</p>
        <p>Tedbirge.ai hesabınız için 2FA doğrulama kodunuz:</p>
        <div style="background:#1e1e8e;color:#fff;font-size:32px;letter-spacing:8px;text-align:center;padding:20px;border-radius:10px;margin:20px 0;font-family:monospace;">
          ${code}
        </div>
        <p style="font-size:13px;color:#666;">
          • Geçerlilik: <strong>10 dakika</strong><br/>
          • Bu kodu kimseyle paylaşmayın<br/>
          • Bu işlemi siz yapmadıysanız hesap güvenliğiniz risk altında olabilir
        </p>
        <p style="font-size:11px;color:#999;margin-top:24px;">Tedbirge.ai · Hukuk Yönetim Sistemi</p>
      </div>
    </div>
  `;

  // TUR #76 R5 — Defensive Email response kontrolu (Madde 30.30)
  let emailResult;
  try {
    emailResult = await sendEmail({
      to: user.email,
      subject: `[Tedbirge.ai] 2FA Doğrulama Kodu: ${code}`,
      html,
    });
  } catch (sendErr) {
    // Hata olursa ActivityLog _FAILED + PhoneOtp temizle + throw
    try {
      await prisma.activityLog.create({
        data: {
          action: "EMAIL_OTP_FAILED",
          detail: `2FA Email OTP gonderilemedi: ${maskEmail(user.email)} · ${sendErr.message?.slice(0, 200)}`,
        },
      });
      await prisma.phoneOtp.deleteMany({ where: { phone: user.email, code, purpose: "2fa-email" } });
    } catch (_) {}
    throw new Error(`E-posta gönderilemedi: ${sendErr.message}`);
  }

  // KVKK ActivityLog (provider onayli)
  try {
    await prisma.activityLog.create({
      data: {
        action: "EMAIL_OTP_SENT",
        detail: `2FA Email OTP gönderildi: ${maskEmail(user.email)}`,
      },
    });
  } catch (_) {}

  return { ok: true, emailMask: maskEmail(user.email), expiresAt, messageId: emailResult?.messageId };
}

async function verifyEmailOtp(userId, code) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!user?.email) throw new Error("E-posta kayıtlı değil.");

  const otp = await prisma.phoneOtp.findFirst({
    where: { phone: user.email, code: String(code), purpose: "2fa-email" },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) throw new Error("Geçersiz veya bulunamadı.");
  if (new Date(otp.expiresAt) < new Date()) {
    await prisma.phoneOtp.delete({ where: { id: otp.id } }).catch(() => {});
    throw new Error("Kod süresi doldu.");
  }
  await prisma.phoneOtp.delete({ where: { id: otp.id } });
  return { ok: true };
}

module.exports = {
  sendSmsOtp,
  verifySmsOtp,
  sendEmailOtp,
  verifyEmailOtp,
  maskPhone,
  maskEmail,
  generateOTP,
};
