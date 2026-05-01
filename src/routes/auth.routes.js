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
router.post("/setup-2fa",    auth, controller.setup2fa);
router.post("/verify-2fa",   auth, controller.verify2fa);
router.post("/disable-2fa",  auth, controller.disable2fa);
router.post("/login-2fa",    controller.loginVerify2fa);

// Admin Onay Yonetimi
router.get ("/pending-approvals",      auth, role("ADMIN"), controller.listPendingApprovals);
router.post("/approve/:userId",        auth, role("ADMIN"), controller.approveUser);
router.post("/reject/:userId",         auth, role("ADMIN"), controller.rejectUser);
router.post("/admin-create-user",      auth, role("ADMIN"), controller.adminCreateUser);

// Email Dogrulama
router.post("/send-email-verification", auth, controller.sendEmailVerification);
router.post("/verify-email",            controller.verifyEmail);

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
    const allowed = ["phone", "bolge", "iban", "vergiKimlikNo", "vergiDairesi", "preferences"];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    if (data.iban) data.iban = String(data.iban).replace(/\s+/g, "").toUpperCase().slice(0, 32);
    if (data.vergiKimlikNo) data.vergiKimlikNo = String(data.vergiKimlikNo).slice(0, 11);

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, iban: true, vergiKimlikNo: true, vergiDairesi: true, phone: true, bolge: true },
    });
    res.json({ user: updated });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;



