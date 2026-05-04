const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/auth.service");
const prisma = require("../config/db");
const crypto = require("crypto");
const { sendEmail } = require("../services/email.service");
const { sendOtpSms } = require("../services/sms.service");

exports.register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body);
  res.status(201).json({ success: true, data: { user, token } });
});


exports.createCustomer = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone, leadId } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "fullName, email ve password zorunludur"
    });
  }

  if (leadId) {
    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!existingLead) {
      return res.status(404).json({
        success: false,
        message: "Lead bulunamadi"
      });
    }
  }

  const { user } = await authService.register({
    fullName,
    email,
    password,
    phone: phone || null,
    role: "CUSTOMER"
  });

  if (leadId) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { ownerId: user.id }
    });

    await prisma.activityLog.create({
      data: {
        leadId,
        action: "LEAD_OWNER_ASSIGNED",
        detail: "Customer hesabi olusturuldu ve lead baglandi: " + (user.email || user.id)
      }
    });
  }

  res.status(201).json({
    success: true,
    data: user
  });
});
// POST /auth/customer/send-setup-link
// ADMIN/SALES/REPRESENTATIVE tarafindan cagrilir
// Yeni CUSTOMER kullanicisina sifre belirleme linki SMS+Email gonderir
exports.sendCustomerSetupLink = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ success: false, error: "userId required" });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ success: false, error: "User not found" });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat

  await prisma.user.update({
    where: { id: userId },
    data: { resetToken: token, resetTokenExpires: expires },
  });

  const setupUrl = `${process.env.PANEL_URL || "https://www.tedbirge.ai"}/sifre-belirle?token=${token}`;
  const { sendSms } = require("../services/sms.service");

  Promise.allSettled([
    user.phone ? sendSms(user.phone, `Tedbirge hesabiniz olusturuldu. Sifrenizi belirleyin: ${setupUrl}`).catch(() => null) : Promise.resolve(),
    sendEmail({
      to: user.email,
      subject: "Tedbirge Hesap Aktivasyonu",
      html: `<p>Sayin ${user.fullName},</p><p>Avukatiniz sizin icin Tedbirge hesabi olusturdu. Sifrenizi belirlemek icin asagidaki linke tiklayin (24 saat gecerli):</p><p><a href="${setupUrl}">${setupUrl}</a></p><p>Iyi calismalar.<br>Tedbirge</p>`,
    }).catch(() => null),
  ]);

  return res.json({ success: true, sent: true });
});

// POST /auth/customer/setup-password
// Token + yeni sifre, expires kontrol, sifre set + auto-login token
exports.setupCustomerPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ success: false, error: "token and password required" });
  if (password.length < 6) return res.status(400).json({ success: false, error: "password too short" });

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpires: { gt: new Date() },
    },
  });

  if (!user) return res.status(400).json({ success: false, error: "invalid or expired token" });

  const bcrypt = require("bcryptjs");
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpires: null },
  });

  const jwt = require("jsonwebtoken");
  const env = require("../config/env");
  const authToken = jwt.sign(
    { userId: user.id, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  return res.json({
    success: true,
    token: authToken,
    user: { id: user.id, role: user.role, fullName: user.fullName, email: user.email },
  });
});

exports.login = asyncHandler(async (req, res) => {
  // TUR #72.10 X3 — requestedRole rol mismatch kontrolü için body'den okunur
  const { email, password, requestedRole } = req.body;
  try {
    const result = await authService.login(email, password, requestedRole);

    // 2FA etkinse: gerçek JWT yerine kısa ömürlü temp token döndür
    if (result.user?.twoFactorEnabled) {
      const jwt = require("jsonwebtoken");
      const tempToken = jwt.sign(
        { id: result.user.id, type: "2fa_pending" },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
      );
      return res.json({ success: true, data: { requires2fa: true, tempToken } });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    // TUR #72.10 X3 — correctRole hint'i frontend'e ilet
    if (err.statusCode === 403 && err.correctRole) {
      return res.status(403).json({ success: false, message: err.message, correctRole: err.correctRole });
    }
    throw err;
  }
});

exports.listUsers = asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      phone: true,
      isActive: true,
      temsilciOnayDurumu: true,
      baroOnayDurumu: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({ success: true, data: users });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "E-posta adresi zorunludur." });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Kullanıcı yoksa bile başarı döndür (güvenlik)
  if (!user) {
    return res.json({ success: true, message: "E-posta gönderildi (varsa)." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 saat

  await prisma.user.update({
    where: { email },
    data: { resetToken: token, resetTokenExpires: expires },
  });

  const resetUrl = `${process.env.PANEL_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Tedbirge.ai — Şifre Sıfırlama",
    html: `
      <p>Merhaba ${user.fullName},</p>
      <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın (1 saat geçerli):</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Bu isteği siz yapmadıysanız bu e-postayı dikkate almayın.</p>
    `,
  });

  res.json({ success: true, message: "Şifre sıfırlama e-postası gönderildi." });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ success: false, message: "Token ve yeni şifre zorunludur." });
  }

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return res.status(400).json({ success: false, message: "Geçersiz veya süresi dolmuş token." });
  }

  const bcrypt = require("bcryptjs");
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpires: null },
  });

  res.json({ success: true, message: "Şifre başarıyla güncellendi." });
});

// ─── Email Dogrulama — Link Gonder ────────────────────────────────────────────

exports.sendEmailVerification = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Kimlik dogrulama gerekli." });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ success: false, message: "Kullanici bulunamadi." });

  // Eski token'lari temizle
  await prisma.verificationToken.deleteMany({ where: { email: user.email } }).catch(() => {});

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat

  await prisma.verificationToken.create({
    data: { email: user.email, token, expiresAt },
  });

  const verifyUrl = `${process.env.PANEL_URL || "https://www.tedbirge.ai"}/verify-email?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: "Tedbirge -- E-posta Dogrulama",
    html: `
      <p>Merhaba ${user.fullName},</p>
      <p>E-posta adresinizi dogrulamak icin asagidaki baglantiya tiklayin (24 saat gecerli):</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>Bu istegi siz yapmadiysaniz bu e-postayi dikkate almayin.</p>
    `,
  });

  res.json({ success: true, message: "Dogrulama e-postasi gonderildi." });
});

// ─── Email Dogrulama — Link Tiklama ───────────────────────────────────────────

exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, message: "Token zorunlu." });

  const vt = await prisma.verificationToken.findFirst({
    where: { token, expiresAt: { gt: new Date() } },
  });

  if (!vt) return res.status(400).json({ success: false, message: "Gecersiz veya suresi dolmus token." });

  const user = await prisma.user.findUnique({ where: { email: vt.email } });
  if (!user) return res.status(404).json({ success: false, message: "Kullanici bulunamadi." });

  // Token'i sil (tek kullanimlik)
  await prisma.verificationToken.delete({ where: { token } }).catch(() => {});

  // Audit log
  await prisma.activityLog.create({
    data: {
      action: "EMAIL_VERIFIED",
      detail: `E-posta dogrulandi: ${user.email}`,
    },
  }).catch(() => {});

  res.json({ success: true, message: "E-posta dogrulandi." });
});

exports.acceptTerms = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Kimlik doğrulama gerekli." });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { sozlesmeKabulTarihi: new Date() },
  });

  res.json({ success: true, message: "Sözleşme kabul edildi." });
});

// ─── Kayıt OTP Gönder ────────────────────────────────────────────────────────

exports.sendRegistrationOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: "Telefon numarası zorunludur." });

  // Temizle: aynı telefon için bekleyen OTP sil
  await prisma.phoneOtp.deleteMany({ where: { phone } });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 dk

  await prisma.phoneOtp.create({ data: { phone, code, purpose: "kayit", expiresAt } });
  await sendOtpSms(phone, code, "kayit");

  res.json({ success: true, message: "OTP gönderildi." });
});

// ─── Muvekkil (CUSTOMER) Web Kaydi — OTP dogrulamali ──────────────────────────

exports.registerCustomer = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone, otpKod, leadId } = req.body;

  if (!fullName || !email || !password || !phone || !otpKod) {
    return res.status(400).json({ success: false, message: "Tum zorunlu alanlari doldurun." });
  }

  // OTP dogrula
  const otp = await prisma.phoneOtp.findFirst({ where: { phone, code: String(otpKod), purpose: "kayit" } });
  if (!otp) return res.status(400).json({ success: false, message: "OTP kodu hatali." });
  if (new Date(otp.expiresAt) < new Date()) return res.status(400).json({ success: false, message: "OTP suresi dolmus." });
  await prisma.phoneOtp.delete({ where: { id: otp.id } });

  // Varolan lead bagla (opsiyonel)
  if (leadId) {
    const existingLead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!existingLead) {
      return res.status(404).json({ success: false, message: "Lead bulunamadi" });
    }
  }

  const { user, token } = await authService.register({
    fullName, email, password, phone, role: "CUSTOMER",
  });

  if (leadId) {
    await prisma.lead.update({ where: { id: leadId }, data: { ownerId: user.id } });
    await prisma.activityLog.create({
      data: {
        leadId,
        action: "LEAD_OWNER_ASSIGNED",
        detail: `Muvekkil kendi kayit oldu ve lead'e baglandi: ${user.email}`,
      },
    }).catch(() => {});
  }

  // Kayit sonrasi email dogrulama maili tetikle (best-effort)
  try {
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.verificationToken.create({
      data: { email, token: verifyToken, expiresAt },
    });
    const verifyUrl = `${process.env.PANEL_URL || "https://www.tedbirge.ai"}/verify-email?token=${verifyToken}`;
    await sendEmail({
      to: email,
      subject: "Tedbirge -- Hos geldiniz, e-postanizi dogrulayin",
      html: `<p>Sayin ${fullName},</p>
             <p>Tedbirge'ye hos geldiniz. E-posta adresinizi dogrulamak icin tiklayin (24 saat):</p>
             <p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });
  } catch (e) { console.error("[registerCustomer verify mail]", e.message); }

  res.status(201).json({ success: true, data: { user, token }, message: "Kayit basarili. E-postanizi dogrulayin." });
});

// ─── Hukukçu Kaydı ────────────────────────────────────────────────────────────

exports.registerHukukcu = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone, baroSicilNo, uzmanlik, hukukcuKomisyon, otpKod, kvkkAccepted, kvkkVersion, platformAgreementAccepted, platformAgreementVersion } = req.body;

  if (!fullName || !email || !password || !phone || !baroSicilNo || !otpKod) {
    return res.status(400).json({ success: false, message: "Tüm zorunlu alanları doldurun." });
  }

  // TUR #72.7 — KVKK + Platform Agreement onay zorunlu
  if (kvkkAccepted !== true || platformAgreementAccepted !== true) {
    return res.status(400).json({ success: false, message: "KVKK Aydınlatma Metni ve Platform Sözleşmesi onayı zorunludur." });
  }

  // OTP doğrula
  const otp = await prisma.phoneOtp.findFirst({ where: { phone, code: String(otpKod), purpose: "kayit" } });
  if (!otp) return res.status(400).json({ success: false, message: "OTP kodu hatalı." });
  if (new Date(otp.expiresAt) < new Date()) return res.status(400).json({ success: false, message: "OTP süresi dolmuş." });
  await prisma.phoneOtp.delete({ where: { id: otp.id } });

  const now = new Date();
  const { user, token } = await authService.register({
    fullName, email, password, phone, role: "LAWYER",
    baroSicilNo, uzmanlik: uzmanlik || null, hukukcuKomisyon: Number(hukukcuKomisyon) || 20,
    kvkkAcceptedAt: now,
    kvkkVersion: kvkkVersion || "v1.0",
    platformAgreementAcceptedAt: now,
    platformAgreementVersion: platformAgreementVersion || "v1.0-lawyer",
  });

  // TUR #72.7 — ADMIN bildirim (RealtimeEvent + AgentEvent)
  try {
    await prisma.realtimeEvent.create({
      data: { channel: "ADMIN_FEED", eventType: "LAWYER_REGISTRATION_PENDING", payload: { userId: user.id, email: user.email, fullName: user.fullName } },
    });
    await prisma.agentEvent.create({
      data: { agentName: "auth", eventType: "LAWYER_REGISTRATION_PENDING", severity: "INFO", payload: { userId: user.id, email: user.email } },
    });
  } catch (_) {}

  res.status(201).json({ success: true, data: { user, token }, message: "Hukukçu kaydı oluşturuldu. Yönetici onayı bekleniyor (24-48 saat). Email ile bilgilendirileceksiniz." });
});

// ─── Temsilci Kaydı ───────────────────────────────────────────────────────────

exports.registerTemsilci = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone, bolge, otpKod, sozlesmeVersiyonu, sozlesmeMetniHash, kvkkAccepted, kvkkVersion } = req.body;

  if (!fullName || !email || !password || !phone || !otpKod) {
    return res.status(400).json({ success: false, message: "Tüm zorunlu alanları doldurun." });
  }

  if (!sozlesmeVersiyonu || !sozlesmeMetniHash) {
    return res.status(400).json({
      success: false,
      message: "Sözleşme bilgisi eksik. Lütfen sayfayı yenileyip tekrar deneyin."
    });
  }

  // TUR #72.7 — KVKK onay zorunlu (sözleşme onayı zaten sozlesmeVersiyonu ile geliyor)
  if (kvkkAccepted !== true) {
    return res.status(400).json({ success: false, message: "KVKK Aydınlatma Metni onayı zorunludur." });
  }

  const sozlesmeKabulIp = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null;

  // OTP doğrula
  const otp = await prisma.phoneOtp.findFirst({ where: { phone, code: String(otpKod), purpose: "kayit" } });
  if (!otp) return res.status(400).json({ success: false, message: "OTP kodu hatalı." });
  if (new Date(otp.expiresAt) < new Date()) return res.status(400).json({ success: false, message: "OTP süresi dolmuş." });
  await prisma.phoneOtp.delete({ where: { id: otp.id } });

  const now = new Date();
  const { user, token } = await authService.register({
    fullName, email, password, phone, role: "REPRESENTATIVE",
    primOrani: 50,
    bolge: bolge || null,
    sozlesmeVersiyonu,
    sozlesmeMetniHash,
    sozlesmeKabulIp,
    kvkkAcceptedAt: now,
    kvkkVersion: kvkkVersion || "v1.0",
    platformAgreementAcceptedAt: now,
    platformAgreementVersion: sozlesmeVersiyonu,
  });

  // TUR #72.7 — ADMIN bildirim
  try {
    await prisma.realtimeEvent.create({
      data: { channel: "ADMIN_FEED", eventType: "REPRESENTATIVE_REGISTRATION_PENDING", payload: { userId: user.id, email: user.email, fullName: user.fullName, bolge: user.bolge } },
    });
    await prisma.agentEvent.create({
      data: { agentName: "auth", eventType: "REPRESENTATIVE_REGISTRATION_PENDING", severity: "INFO", payload: { userId: user.id, email: user.email } },
    });
  } catch (_) {}

  res.status(201).json({ success: true, data: { user, token }, message: "Temsilci kaydı oluşturuldu. Yönetici onayı bekleniyor (24-48 saat). Email ile bilgilendirileceksiniz." });
});

// ─── 2FA Setup ────────────────────────────────────────────────────────────────

exports.setup2fa = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Kimlik doğrulama gerekli." });

  const speakeasy = require("speakeasy");
  const qrcode = require("qrcode");

  const secret = speakeasy.generateSecret({
    name: `Tedbirge.ai (${req.user.email})`,
    length: 20,
  });

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret.base32, twoFactorEnabled: false },
  });

  const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);
  res.json({ success: true, data: { secret: secret.base32, qrCode: qrDataUrl, otpauthUrl: secret.otpauth_url } });
});

// TUR #74 W4+W5 — SMS + Email 2FA endpoints (NetGSM + Nodemailer mevcut)
const twoFactorOtp = require("../services/twoFactorOtp.service");

// TUR #76 R6 — ADMIN 2FA Kanal Saglik Testi (CEO Konsol icin)
exports.adminTest2faChannel = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Kimlik gerekli." });
  if (req.user?.role !== "ADMIN") return res.status(403).json({ success: false, message: "ADMIN yetkisi gerekli." });

  const { method, phone, email } = req.body;
  if (!method || !["TOTP", "SMS", "EMAIL"].includes(method)) {
    return res.status(400).json({ success: false, message: "method TOTP/SMS/EMAIL zorunlu." });
  }

  const startMs = Date.now();
  try {
    if (method === "TOTP") {
      const speakeasy = require("speakeasy");
      const secret = speakeasy.generateSecret({ name: "Tedbirge Test", length: 20 });
      return res.json({
        success: true,
        method: "TOTP",
        ms: Date.now() - startMs,
        sample: { hasSecret: !!secret.base32, otpauthUrl: secret.otpauth_url },
        deliveryHint: "QR kod uretildi (gercek setup degil, test).",
      });
    }
    if (method === "SMS") {
      const targetPhone = phone || req.user?.phone || "05412031609";
      const { sendSms } = require("../services/sms.service");
      const result = await sendSms(targetPhone, "Tedbirge 2FA TEST: 123456 (yok sayin, kanal saglik testidir)");
      return res.json({
        success: result?.success !== false,
        method: "SMS",
        ms: Date.now() - startMs,
        providerCode: result?.bulkId ? "00" : (result?.error ? "ERR" : "?"),
        providerMessage: result?.success === false ? result.error : "Basarili (NetGSM bulkId: " + (result?.bulkId || "mock") + ")",
        mock: result?.mock || false,
        deliveryHint: result?.mock
          ? "Mock mod (NETGSM_USERNAME ENV yok). Lokal log'a bakin."
          : "Telefonun spam klasorunu kontrol et. 1-2 dk bekleyin.",
      });
    }
    if (method === "EMAIL") {
      const targetEmail = email || req.user?.email || "tedbirge42@gmail.com";
      const { sendEmail } = require("../services/email.service");
      const result = await sendEmail({
        to: targetEmail,
        subject: "[Tedbirge.ai] 2FA Kanal Saglik Testi",
        html: `<p>Bu bir <strong>kanal saglik testi</strong> e-postasidir. <br/>2FA TEST kodu: <strong>123456</strong> (yok sayin).<br/>Bu mesaj tedbirge.ai sistem kontrolu icin gonderildi.</p>`,
      });
      return res.json({
        success: true,
        method: "EMAIL",
        ms: Date.now() - startMs,
        messageId: result?.messageId || null,
        deliveryHint: "Spam klasoru de kontrol edin. 5-10 saniye icinde gelmeli.",
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      method,
      ms: Date.now() - startMs,
      error: err.message,
      deliveryHint: method === "SMS"
        ? "NetGSM hesabini kontrol et: panel.netgsm.com.tr -> bakiye / baslik onayi / IP whitelist"
        : "SMTP/Resend ENV kontrol et.",
    });
  }
});

exports.setup2faSms = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Kimlik doğrulama gerekli." });
  try {
    const r = await twoFactorOtp.sendSmsOtp(userId);
    res.json({ success: true, message: "SMS gönderildi.", data: { phoneMask: r.phoneMask, expiresAt: r.expiresAt, mock: r.mock } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

exports.verify2faSms = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { code } = req.body;
  if (!userId) return res.status(401).json({ success: false, message: "Kimlik doğrulama gerekli." });
  if (!code) return res.status(400).json({ success: false, message: "Kod zorunlu." });
  try {
    await twoFactorOtp.verifySmsOtp(userId, code);
    const bcrypt = require("bcryptjs");
    const plainCodes = generateBackupCodes(10);
    const hashedCodes = await Promise.all(plainCodes.map((c) => bcrypt.hash(c, 10)));
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true, twoFactorEnabledAt: new Date(), twoFactorMethod: "SMS", twoFactorBackupCodes: hashedCodes },
    });
    res.json({ success: true, message: "SMS 2FA etkinleştirildi.", data: { backupCodes: plainCodes } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

exports.setup2faEmail = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Kimlik doğrulama gerekli." });
  try {
    const r = await twoFactorOtp.sendEmailOtp(userId);
    res.json({ success: true, message: "Doğrulama e-postası gönderildi.", data: { emailMask: r.emailMask, expiresAt: r.expiresAt } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

exports.verify2faEmail = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { code } = req.body;
  if (!userId) return res.status(401).json({ success: false, message: "Kimlik doğrulama gerekli." });
  if (!code) return res.status(400).json({ success: false, message: "Kod zorunlu." });
  try {
    await twoFactorOtp.verifyEmailOtp(userId, code);
    const bcrypt = require("bcryptjs");
    const plainCodes = generateBackupCodes(10);
    const hashedCodes = await Promise.all(plainCodes.map((c) => bcrypt.hash(c, 10)));
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true, twoFactorEnabledAt: new Date(), twoFactorMethod: "EMAIL", twoFactorBackupCodes: hashedCodes },
    });
    res.json({ success: true, message: "E-posta 2FA etkinleştirildi.", data: { backupCodes: plainCodes } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// TUR #74 — Login akisi: SMS/Email yontemli kullanici icin login sirasi OTP gonder
exports.loginSendOtp = asyncHandler(async (req, res) => {
  // TUR #79 Y4 — body'e opsiyonel `method` parametresi (kullanici 3 yontem secebilir, Madde 30.33)
  const { tempToken, method: requestedMethod } = req.body;
  if (!tempToken) return res.status(400).json({ success: false, message: "tempToken gerekli." });
  const jwt = require("jsonwebtoken");
  let payload;
  try {
    payload = jwt.verify(tempToken, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: "Geçersiz veya süresi dolmuş temp token." });
  }
  if (payload.type !== "2fa_pending") return res.status(400).json({ success: false, message: "Geçersiz token tipi." });
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, twoFactorMethod: true, phone: true, email: true },
  });
  if (!user) return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı." });

  // TUR #79 Y4 — Kullanici tab degistirmis ise requestedMethod oncelik (Madde 30.33)
  const effectiveMethod = requestedMethod || user.twoFactorMethod;

  try {
    if (effectiveMethod === "SMS") {
      if (!user.phone) {
        return res.status(400).json({ success: false, message: "SMS kanalı için telefon kayıtlı değil. /profil → telefon ekleyin." });
      }
      const r = await twoFactorOtp.sendSmsOtp(user.id);
      return res.json({ success: true, method: "SMS", phoneMask: r.phoneMask, expiresAt: r.expiresAt, mock: r.mock });
    }
    if (effectiveMethod === "EMAIL") {
      if (!user.email) {
        return res.status(400).json({ success: false, message: "E-posta kayıtlı değil." });
      }
      const r = await twoFactorOtp.sendEmailOtp(user.id);
      return res.json({ success: true, method: "EMAIL", emailMask: r.emailMask, expiresAt: r.expiresAt });
    }
    return res.status(400).json({ success: false, message: "TOTP authenticator app'iniz kullanır, kod gönderme gerek yok." });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// TUR #74 — Login verify: SMS/Email kodlu giriş tamamla (TOTP icin login-2fa endpointi mevcut)
exports.loginVerify2faOtp = asyncHandler(async (req, res) => {
  const { tempToken, otpToken, method } = req.body;
  if (!tempToken || !otpToken || !method) {
    return res.status(400).json({ success: false, message: "tempToken, otpToken, method zorunludur." });
  }
  const jwt = require("jsonwebtoken");
  let payload;
  try {
    payload = jwt.verify(tempToken, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: "Geçersiz veya süresi dolmuş temp token." });
  }
  if (payload.type !== "2fa_pending") return res.status(400).json({ success: false, message: "Geçersiz token tipi." });

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, role: true, fullName: true, twoFactorMethod: true },
  });
  if (!user) return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı." });

  try {
    if (method === "SMS") await twoFactorOtp.verifySmsOtp(user.id, otpToken);
    else if (method === "EMAIL") await twoFactorOtp.verifyEmailOtp(user.id, otpToken);
    else return res.status(400).json({ success: false, message: "Geçersiz yöntem." });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }

  const finalToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "24h" });
  res.json({
    success: true,
    data: {
      token: finalToken,
      user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
    },
  });
});

// TUR #72.6 — Backup codes generate (10 × 8-haneli, bcrypt hash)
function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    let code = "";
    for (let j = 0; j < 8; j++) code += Math.floor(Math.random() * 10).toString();
    codes.push(code);
  }
  return codes;
}

// ─── 2FA Verify & Activate ────────────────────────────────────────────────────

exports.verify2fa = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { token } = req.body;
  if (!userId) return res.status(401).json({ success: false, message: "Kimlik doğrulama gerekli." });
  if (!token) return res.status(400).json({ success: false, message: "OTP token zorunludur." });

  const speakeasy = require("speakeasy");
  const user = await prisma.user.findUnique({ where: { id: userId }, omit: { twoFactorSecret: false } });
  if (!user?.twoFactorSecret) {
    return res.status(400).json({ success: false, message: "Önce /setup-2fa çağrısı yapın." });
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token: String(token),
    window: 1,
  });

  if (!verified) return res.status(400).json({ success: false, message: "Geçersiz OTP kodu." });

  // TUR #72.6 — Backup codes uretim + bcrypt hash
  const bcrypt = require("bcryptjs");
  const plainCodes = generateBackupCodes(10);
  const hashedCodes = await Promise.all(plainCodes.map((c) => bcrypt.hash(c, 10)));

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorEnabledAt: new Date(),
      twoFactorBackupCodes: hashedCodes,
    },
  });
  res.json({ success: true, message: "2FA etkinleştirildi.", data: { backupCodes: plainCodes } });
});

// TUR #72.6 — Login verify ek: backup code alternatifi
exports.verifyBackupCode = asyncHandler(async (req, res) => {
  const { tempToken, backupCode } = req.body;
  if (!tempToken || !backupCode) {
    return res.status(400).json({ success: false, message: "tempToken ve backupCode zorunludur." });
  }
  const jwt = require("jsonwebtoken");
  let payload;
  try {
    payload = jwt.verify(tempToken, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: "Geçersiz veya süresi dolmuş temp token." });
  }
  if (payload.type !== "2fa_pending") {
    return res.status(400).json({ success: false, message: "Geçersiz token tipi." });
  }
  const bcrypt = require("bcryptjs");
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, role: true, fullName: true, twoFactorBackupCodes: true },
  });
  if (!user) return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı." });

  const codes = Array.isArray(user.twoFactorBackupCodes) ? user.twoFactorBackupCodes : [];
  if (codes.length === 0) {
    return res.status(400).json({ success: false, message: "Backup kod kullanılamaz." });
  }

  let matchIdx = -1;
  for (let i = 0; i < codes.length; i++) {
    if (await bcrypt.compare(String(backupCode), codes[i])) { matchIdx = i; break; }
  }
  if (matchIdx === -1) {
    return res.status(400).json({ success: false, message: "Geçersiz backup kod." });
  }
  // Kullanılan kodu sil (tek kullanım)
  const remaining = [...codes.slice(0, matchIdx), ...codes.slice(matchIdx + 1)];
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorBackupCodes: remaining } });

  const finalToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
  res.json({
    success: true,
    data: {
      token: finalToken,
      user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
      remainingBackupCodes: remaining.length,
    },
  });
});

// ─── 2FA Disable ─────────────────────────────────────────────────────────────

exports.disable2fa = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { token } = req.body;
  if (!userId) return res.status(401).json({ success: false, message: "Kimlik doğrulama gerekli." });

  const speakeasy = require("speakeasy");
  const user = await prisma.user.findUnique({ where: { id: userId }, omit: { twoFactorSecret: false } });

  if (user?.twoFactorEnabled) {
    if (!token) return res.status(400).json({ success: false, message: "OTP token zorunludur." });
    const ok = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: "base32", token: String(token), window: 1 });
    if (!ok) return res.status(400).json({ success: false, message: "Geçersiz OTP kodu." });
  }

  await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
  res.json({ success: true, message: "2FA devre dışı bırakıldı." });
});

// ─── 2FA Login Verify ─────────────────────────────────────────────────────────
// Login ikinci adımı: email+password sonrası 2FA token doğrulama

exports.loginVerify2fa = asyncHandler(async (req, res) => {
  const { tempToken, otpToken } = req.body;
  if (!tempToken || !otpToken) {
    return res.status(400).json({ success: false, message: "tempToken ve otpToken zorunludur." });
  }

  const jwt = require("jsonwebtoken");
  let payload;
  try {
    payload = jwt.verify(tempToken, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: "Geçersiz veya süresi dolmuş temp token." });
  }

  if (payload.type !== "2fa_pending") {
    return res.status(400).json({ success: false, message: "Geçersiz token tipi." });
  }

  const speakeasy = require("speakeasy");
  const user = await prisma.user.findUnique({ where: { id: payload.id }, omit: { twoFactorSecret: false } });
  if (!user) return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı." });

  const ok = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: "base32", token: String(otpToken), window: 1 });
  if (!ok) return res.status(400).json({ success: false, message: "Geçersiz OTP kodu." });

  const finalToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.json({ success: true, data: { token: finalToken, user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName } } });
});

exports.listLawyers = asyncHandler(async (_req, res) => {
  const prisma = require("../config/db");

  const lawyers = await prisma.user.findMany({
    where: {
      role: "LAWYER",
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  res.json({ success: true, data: lawyers });
});

// ─── Admin: Bekleyen Onaylari Listele ─────────────────────────────────────────

exports.listPendingApprovals = asyncHandler(async (req, res) => {
  const { role } = req.query; // "LAWYER" | "REPRESENTATIVE"

  if (!role || !["LAWYER", "REPRESENTATIVE"].includes(role)) {
    return res.status(400).json({ success: false, message: "role parametresi gerekli (LAWYER veya REPRESENTATIVE)" });
  }

  const whereClause = role === "LAWYER"
    ? { role: "LAWYER", baroOnayDurumu: "BEKLEMEDE" }
    : { role: "REPRESENTATIVE", temsilciOnayDurumu: "BEKLEMEDE" };

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      baroSicilNo: true,
      uzmanlik: true,
      bolge: true,
      hukukcuKomisyon: true,
      primOrani: true,
      baroOnayDurumu: true,
      temsilciOnayDurumu: true,
      sozlesmeKabulTarihi: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: users });
});

// ─── Admin: Kullaniciyi Onayla ────────────────────────────────────────────────

exports.approveUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId gerekli" });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ success: false, message: "Kullanici bulunamadi" });
  }

  if (!["LAWYER", "REPRESENTATIVE"].includes(user.role)) {
    return res.status(400).json({ success: false, message: "Sadece LAWYER veya REPRESENTATIVE onaylanabilir" });
  }

  const updateData = user.role === "LAWYER"
    ? { baroOnayDurumu: "ONAYLANDI", isActive: true }
    : { temsilciOnayDurumu: "ONAYLANDI", isActive: true };

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, email: true, fullName: true, phone: true, role: true },
  });

  await prisma.activityLog.create({
    data: {
      action: "USER_APPROVED",
      detail: `${updated.role} onaylandi: ${updated.email} (admin: ${req.user.email})`,
    },
  }).catch(() => {});

  try {
    const { sendEmail } = require("../services/email.service");
    await sendEmail({
      to: updated.email,
      subject: "Tedbirge -- Hesabiniz Onaylandi",
      html: `<p>Sayin ${updated.fullName},</p>
             <p>Tedbirge hesabiniz yonetici tarafindan onaylanmistir. Artik panele giris yapabilirsiniz.</p>
             <p><a href="${process.env.PANEL_URL || "https://www.tedbirge.ai"}/login">Panele Giris</a></p>`,
    });
  } catch (e) { console.error("[approveUser email]", e.message); }

  if (updated.phone) {
    try {
      const { sendSms } = require("../services/sms.service");
      await sendSms(updated.phone, `Tedbirge hesabiniz onaylandi. Giris: tedbirge.ai/login`);
    } catch (e) { console.error("[approveUser sms]", e.message); }
  }

  res.json({ success: true, message: "Kullanici onaylandi", data: updated });
});

// ─── Admin: Kullaniciyi Reddet ────────────────────────────────────────────────

exports.rejectUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: "userId gerekli" });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ success: false, message: "Kullanici bulunamadi" });
  }

  if (!["LAWYER", "REPRESENTATIVE"].includes(user.role)) {
    return res.status(400).json({ success: false, message: "Sadece LAWYER veya REPRESENTATIVE reddedilebilir" });
  }

  const updateData = user.role === "LAWYER"
    ? { baroOnayDurumu: "REDDEDILDI", isActive: false }
    : { temsilciOnayDurumu: "REDDEDILDI", isActive: false };

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, email: true, fullName: true, role: true },
  });

  await prisma.activityLog.create({
    data: {
      action: "USER_REJECTED",
      detail: `${updated.role} reddedildi: ${updated.email} (admin: ${req.user.email}) reason: ${reason || "-"}`,
    },
  }).catch(() => {});

  res.json({ success: true, message: "Kullanici reddedildi", data: updated });
});

// ─── Admin: Manuel Hukukcu/Temsilci Ekleme ────────────────────────────────────

exports.adminCreateUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone, role, baroSicilNo, uzmanlik, hukukcuKomisyon, primOrani, bolge } = req.body;

  if (!fullName || !email || !password || !role) {
    return res.status(400).json({ success: false, message: "fullName, email, password, role zorunludur" });
  }

  if (!["LAWYER", "REPRESENTATIVE", "CUSTOMER", "SALES"].includes(role)) {
    return res.status(400).json({ success: false, message: "Gecersiz rol" });
  }

  if (role === "LAWYER" && !baroSicilNo) {
    return res.status(400).json({ success: false, message: "Hukukcu icin baroSicilNo zorunlu" });
  }

  const extraData = {};
  if (role === "LAWYER") {
    extraData.baroSicilNo = baroSicilNo;
    extraData.uzmanlik = uzmanlik || null;
    extraData.hukukcuKomisyon = Number(hukukcuKomisyon) || 20;
    extraData.baroOnayDurumu = "ONAYLANDI";
  }
  if (role === "REPRESENTATIVE") {
    extraData.bolge = bolge || null;
    extraData.primOrani = Number(primOrani) || 50;
    extraData.temsilciOnayDurumu = "ONAYLANDI";
  }

  const { user } = await authService.register({
    fullName, email, password, phone: phone || null, role, ...extraData,
  });

  await prisma.activityLog.create({
    data: {
      action: "ADMIN_USER_CREATED",
      detail: `Admin tarafindan ${role} olusturuldu: ${email} (admin: ${req.user.email})`,
    },
  }).catch(() => {});

  res.status(201).json({ success: true, data: user, message: "Kullanici olusturuldu ve onaylandi" });
});

