const express = require("express");
const controller = require("../controllers/auth.controller");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const { authLimiter, registerLimiter, passwordResetLimiter } = require("../middlewares/rateLimiters");

const router = express.Router();

router.post("/register", auth, role("ADMIN"), controller.register);
router.post("/register/hukukcu",  registerLimiter, controller.registerHukukcu);
router.post("/register/temsilci", registerLimiter, controller.registerTemsilci);
router.post("/register/customer", registerLimiter, controller.registerCustomer);
router.post("/register/send-otp", authLimiter,     controller.sendRegistrationOtp);
router.post("/create-customer",         auth, role("ADMIN", "SALES", "REPRESENTATIVE"), controller.createCustomer);
router.post("/customer/send-setup-link", auth, role("ADMIN", "SALES", "REPRESENTATIVE"), controller.sendCustomerSetupLink);
router.post("/customer/setup-password",  controller.setupCustomerPassword);
router.post("/login",             authLimiter,          controller.login);
router.post("/forgot-password",   passwordResetLimiter, controller.forgotPassword);
router.post("/reset-password",    passwordResetLimiter, controller.resetPassword);

router.post("/accept-terms", auth, controller.acceptTerms);
router.get("/users", auth, role("ADMIN"), controller.listUsers);
router.get("/lawyers", auth, role("ADMIN", "SALES", "REPRESENTATIVE"), controller.listLawyers);

// 2FA
router.post("/setup-2fa",       auth, controller.setup2fa);
router.post("/verify-2fa",      auth, controller.verify2fa);
router.post("/disable-2fa",     auth, controller.disable2fa);
router.post("/login-2fa",       controller.loginVerify2fa);
router.post("/login-backup-code", controller.verifyBackupCode); // TUR #72.6
// TUR #74 — SMS + Email 2FA (NetGSM + Nodemailer mevcut)
router.post("/setup-2fa-sms",     auth, controller.setup2faSms);
router.post("/verify-2fa-sms",    auth, controller.verify2faSms);
router.post("/setup-2fa-email",   auth, controller.setup2faEmail);
router.post("/verify-2fa-email",  auth, controller.verify2faEmail);
router.post("/login-send-otp",    controller.loginSendOtp);
router.post("/login-verify-otp",  controller.loginVerify2faOtp);
// TUR #76 R6 — ADMIN 2FA kanal saglik testi (CEO Konsol icin)
router.post("/test-2fa-channel",  auth, role("ADMIN"), controller.adminTest2faChannel);

// Admin Onay Yonetimi
router.get ("/pending-approvals",      auth, role("ADMIN"), controller.listPendingApprovals);
router.post("/approve/:userId",        auth, role("ADMIN"), controller.approveUser);
router.post("/reject/:userId",         auth, role("ADMIN"), controller.rejectUser);
router.post("/admin-create-user",      auth, role("ADMIN"), controller.adminCreateUser);

// Email Dogrulama
router.post("/send-email-verification", auth, controller.sendEmailVerification);
router.post("/verify-email",            controller.verifyEmail);

// TUR #99 Q5 — Kendi izinleri (RBAC me/permissions)
router.get("/me/permissions", auth, require("../controllers/rolePermissions.controller").myPermissions);

// TUR #55 A13 — Kendi profili (me)
router.get("/me", auth, async (req, res) => {
  try {
    const prisma = require("../config/db");
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, fullName: true, email: true, phone: true, role: true, bolge: true,
        baroSicilNo: true, uzmanlik: true, isActive: true,
        iban: true, vergiKimlikNo: true, vergiDairesi: true, preferences: true,
        twoFactorEnabled: true, twoFactorEnabledAt: true, twoFactorMethod: true,
        // TUR #116 — adres alanlari (Madde 30.71)
        address: true, city: true, district: true, postalCode: true,
        // TUR #117 — country (Madde 30.73 Almanya pilot hazirlik)
        country: true,
      },
    });
    if (!user) return res.status(404).json({ error: "Kullanici bulunamadi" });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/me", auth, async (req, res) => {
  try {
    const prisma = require("../config/db");
    // TUR #116 — address/city/district/postalCode eklendi (Madde 30.71 KIRMIZI gecisi, CEO yazili onay)
    // TUR #117 — country eklendi (Madde 30.73 Almanya pilot 2028+ hazirlik)
    // TUR #118 — fullName + email + phone profil edit (Madde 30.75 Kritik Veri Audit)
    const allowed = [
      "phone", "bolge", "iban", "vergiKimlikNo", "vergiDairesi", "preferences",
      "address", "city", "district", "postalCode", "country",
      "fullName", "email",
    ];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    if (data.iban) data.iban = String(data.iban).replace(/\s+/g, "").toUpperCase().slice(0, 32);
    if (data.vergiKimlikNo) data.vergiKimlikNo = String(data.vergiKimlikNo).slice(0, 11);
    // TUR #116 — adres alanlari validation (max length + bos string -> null)
    if (data.address !== undefined) data.address = data.address ? String(data.address).slice(0, 200) : null;
    if (data.city !== undefined) data.city = data.city ? String(data.city).slice(0, 60) : null;
    if (data.district !== undefined) data.district = data.district ? String(data.district).slice(0, 60) : null;
    if (data.postalCode !== undefined) {
      // Posta kodu: rakam + opsiyonel tire, max 10 char
      const pc = data.postalCode ? String(data.postalCode).replace(/[^0-9-]/g, "").slice(0, 10) : null;
      data.postalCode = pc || null;
    }
    // TUR #117 — country validation (max 60 char, default Türkiye)
    if (data.country !== undefined) {
      data.country = data.country ? String(data.country).slice(0, 60) : "Türkiye";
    }

    // TUR #118 — fullName / email / phone validation + unique check (Madde 30.75)
    // Eski degerleri once cek (audit + duplicate check icin)
    const current = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { fullName: true, email: true, phone: true },
    });
    if (!current) return res.status(404).json({ error: "Kullanici bulunamadi" });

    const auditChanges = [];

    if (data.fullName !== undefined) {
      const trimmed = String(data.fullName).trim().slice(0, 100);
      if (trimmed.length < 2) {
        return res.status(400).json({ error: "Ad Soyad en az 2 karakter olmali" });
      }
      data.fullName = trimmed;
      if (trimmed !== current.fullName) {
        auditChanges.push({ field: "fullName", old: current.fullName, new: trimmed });
      }
    }

    if (data.email !== undefined) {
      const trimmed = String(data.email).trim().toLowerCase().slice(0, 100);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        return res.status(400).json({ error: "Gecersiz email formati" });
      }
      data.email = trimmed;
      if (trimmed !== current.email) {
        // Unique check (DB-level unique constraint var ama explicit kontrol daha temiz hata mesaji)
        const existing = await prisma.user.findUnique({ where: { email: trimmed }, select: { id: true } });
        if (existing && existing.id !== req.user.id) {
          return res.status(409).json({ error: "Bu email zaten kayitli" });
        }
        auditChanges.push({ field: "email", old: current.email, new: trimmed });
      }
    }

    if (data.phone !== undefined) {
      // Telefon: rakam + boslara/tire/plus izinli, max 20 char
      const trimmed = data.phone ? String(data.phone).slice(0, 20) : null;
      // Normalize (sadece rakam) + Turkiye 10/11 digit check
      if (trimmed) {
        const digits = trimmed.replace(/\D/g, "");
        if (digits.length < 10 || digits.length > 12) {
          return res.status(400).json({ error: "Telefon 10-12 haneli olmali (orn: 5454903395 veya +905454903395)" });
        }
        if (trimmed !== current.phone) {
          // Unique check (DB'de unique constraint phone'da yok ama denetim icin)
          const existing = await prisma.user.findFirst({
            where: { phone: trimmed, id: { not: req.user.id } },
            select: { id: true },
          });
          if (existing) {
            return res.status(409).json({ error: "Bu telefon numarasi baska bir kullanicida kayitli" });
          }
          auditChanges.push({ field: "phone", old: current.phone, new: trimmed });
        }
      }
      data.phone = trimmed || null;
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true, fullName: true, email: true, phone: true,
        iban: true, vergiKimlikNo: true, vergiDairesi: true, bolge: true,
        address: true, city: true, district: true, postalCode: true, country: true,
      },
    });

    // KVKK m.10 audit (adres alanlari guncellendiginde)
    const addressKeys = ["address", "city", "district", "postalCode"];
    const addressChanged = addressKeys.some((k) => data[k] !== undefined);
    if (addressChanged) {
      try {
        await prisma.activityLog.create({
          data: {
            action: "PROFILE_ADDRESS_UPDATE",
            detail: `userId:${req.user.id} fields:${addressKeys.filter((k) => data[k] !== undefined).join(",")}`,
          },
        });
      } catch (_) {}
    }

    // TUR #118 — Kritik veri audit (Madde 30.75): fullName/email/phone degisikligi
    for (const ch of auditChanges) {
      try {
        await prisma.activityLog.create({
          data: {
            action: `PROFILE_${ch.field.toUpperCase()}_UPDATE`,
            detail: `userId:${req.user.id} old:${ch.old || "-"} new:${ch.new}`,
          },
        });
      } catch (_) {}
    }

    res.json({ user: updated });
  } catch (e) {
    // Prisma unique constraint hatasi (P2002) ozel mesaj
    if (e && e.code === "P2002") {
      return res.status(409).json({ error: "Bu email veya alan zaten kayitli (unique kisit)" });
    }
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;



