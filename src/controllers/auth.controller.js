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
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json({ success: true, data: result });
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

// ─── Hukukçu Kaydı ────────────────────────────────────────────────────────────

exports.registerHukukcu = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone, baroSicilNo, uzmanlik, hukukcuKomisyon, otpKod } = req.body;

  if (!fullName || !email || !password || !phone || !baroSicilNo || !otpKod) {
    return res.status(400).json({ success: false, message: "Tüm zorunlu alanları doldurun." });
  }

  // OTP doğrula
  const otp = await prisma.phoneOtp.findFirst({ where: { phone, code: String(otpKod), purpose: "kayit" } });
  if (!otp) return res.status(400).json({ success: false, message: "OTP kodu hatalı." });
  if (new Date(otp.expiresAt) < new Date()) return res.status(400).json({ success: false, message: "OTP süresi dolmuş." });
  await prisma.phoneOtp.delete({ where: { id: otp.id } });

  const { user, token } = await authService.register({
    fullName, email, password, phone, role: "LAWYER",
    baroSicilNo, uzmanlik: uzmanlik || null, hukukcuKomisyon: Number(hukukcuKomisyon) || 20,
  });

  res.status(201).json({ success: true, data: { user, token }, message: "Hukukçu kaydı oluşturuldu. Yönetici onayı bekleniyor." });
});

// ─── Temsilci Kaydı ───────────────────────────────────────────────────────────

exports.registerTemsilci = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone, primOrani, bolge, otpKod } = req.body;

  if (!fullName || !email || !password || !phone || !otpKod) {
    return res.status(400).json({ success: false, message: "Tüm zorunlu alanları doldurun." });
  }

  // OTP doğrula
  const otp = await prisma.phoneOtp.findFirst({ where: { phone, code: String(otpKod), purpose: "kayit" } });
  if (!otp) return res.status(400).json({ success: false, message: "OTP kodu hatalı." });
  if (new Date(otp.expiresAt) < new Date()) return res.status(400).json({ success: false, message: "OTP süresi dolmuş." });
  await prisma.phoneOtp.delete({ where: { id: otp.id } });

  const { user, token } = await authService.register({
    fullName, email, password, phone, role: "REPRESENTATIVE",
    primOrani: Number(primOrani) || 5, bolge: bolge || null,
  });

  res.status(201).json({ success: true, data: { user, token }, message: "Temsilci kaydı oluşturuldu. Yönetici onayı bekleniyor." });
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

