/**
 * test.routes.js
 * Sistem sağlık ve bileşen testleri — sadece development ortamında aktif.
 * Tüm endpoint'ler: GET /api/test/<isim>
 */

const express = require("express");
const router = express.Router();

const auth  = require("../middlewares/authMiddleware");
const role  = require("../middlewares/roleMiddleware");
const env   = require("../config/env");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Sadece development'ta çalışır
function devOnly(req, res, next) {
  if (env.nodeEnv === "production") {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  next();
}

// ─── 1. Genel Sağlık ────────────────────────────────────────────────────────
router.get("/health", devOnly, (req, res) => {
  res.json({
    success: true,
    service: "tedbirge-ai",
    env: env.nodeEnv,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + "s",
    node: process.version,
  });
});

// ─── 2. Veritabanı Bağlantısı ────────────────────────────────────────────────
router.get("/db", devOnly, async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.lead.count(),
      prisma.document.count(),
      prisma.contract.count(),
    ]);
    res.json({
      success: true,
      message: "Veritabanı bağlantısı başarılı",
      counts: {
        users: counts[0],
        leads: counts[1],
        documents: counts[2],
        contracts: counts[3],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 3. JWT / Auth Testi ─────────────────────────────────────────────────────
router.get("/auth", devOnly, auth, (req, res) => {
  res.json({
    success: true,
    message: "JWT doğrulandı",
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// ─── 4. Rol Testi ─────────────────────────────────────────────────────────────
router.get(
  "/role/admin",
  devOnly,
  auth,
  role("ADMIN"),
  (req, res) => res.json({ success: true, message: "ADMIN rolü doğrulandı" })
);

router.get(
  "/role/sales",
  devOnly,
  auth,
  role("ADMIN", "SALES"),
  (req, res) => res.json({ success: true, message: "ADMIN/SALES rolü doğrulandı" })
);

router.get(
  "/role/lawyer",
  devOnly,
  auth,
  role("ADMIN", "SALES", "LAWYER", "REPRESENTATIVE"),
  (req, res) => res.json({ success: true, message: "LAWYER/REPRESENTATIVE rolü doğrulandı" })
);

// ─── 5. AI Servisi Testi ──────────────────────────────────────────────────────
router.get("/ai", devOnly, auth, role("ADMIN"), async (req, res) => {
  try {
    const { interpretResponse } = require("../services/ai.service");
    const result = await interpretResponse(
      "Trafik kazasında karşı araç tam kusurlu. Yaralı 35 yaşında, aylık 15.000 TL maaşı var."
    );
    res.json({ success: true, message: "AI servisi çalışıyor", result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 6. SMS Testi (mock) ──────────────────────────────────────────────────────
router.post("/sms", devOnly, auth, role("ADMIN"), async (req, res) => {
  try {
    const { sendSms } = require("../services/sms.service");
    const to      = req.body.phone   || env.whatsappDefaultNumber;
    const message = req.body.message || "[TEST] Tedbirge.ai SMS test mesajı — " + new Date().toISOString();
    await sendSms(to, message);
    res.json({
      success: true,
      message: "SMS gönderildi (veya mock modda konsola yazıldı)",
      to,
      mock: !process.env.NETGSM_USERNAME,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 7. E-posta Testi (mock) ──────────────────────────────────────────────────
router.post("/email", devOnly, auth, role("ADMIN"), async (req, res) => {
  try {
    const { sendEmail } = require("../services/email.service");
    const to      = req.body.to      || process.env.SMTP_USER || "test@tedbirge.ai";
    const subject = req.body.subject || "[TEST] Tedbirge.ai E-posta Testi";
    const html    = req.body.html    || "<p>Bu bir test e-postasıdır. Tarih: <b>" + new Date().toLocaleString("tr-TR") + "</b></p>";
    await sendEmail({ to, subject, html });
    res.json({
      success: true,
      message: "E-posta gönderildi (veya mock modda konsola yazıldı)",
      to,
      mock: !process.env.SMTP_PASS,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 8. WhatsApp Testi (mock) ─────────────────────────────────────────────────
router.post("/whatsapp", devOnly, auth, role("ADMIN"), async (req, res) => {
  try {
    const { sendWhatsAppMessage } = require("../services/whatsapp.service");
    const to      = req.body.phone   || env.whatsappDefaultNumber;
    const message = req.body.message || "[TEST] Tedbirge.ai WhatsApp test mesajı — " + new Date().toISOString();
    await sendWhatsAppMessage({ to, message });
    res.json({
      success: true,
      message: "WhatsApp mesajı gönderildi (veya mock modda konsola yazıldı)",
      to,
      mock: !process.env.WHATSAPP_TOKEN,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 9. OCR Servisi Testi ─────────────────────────────────────────────────────
router.get("/ocr", devOnly, auth, role("ADMIN"), async (req, res) => {
  try {
    const { execSync } = require("child_process");
    const tesseractPath = process.env.TESSERACT_PATH || "tesseract";
    const version = execSync(`"${tesseractPath}" --version 2>&1`).toString().split("\n")[0];
    res.json({
      success: true,
      message: "Tesseract kurulu",
      version,
      path: tesseractPath,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Tesseract bulunamadı: " + err.message,
    });
  }
});

// ─── 10. Tazminat Motoru Testi ────────────────────────────────────────────────
router.get("/compensation", devOnly, async (req, res) => {
  try {
    const { calculateCompensation } = require("../services/compensation.engine");
    const result = calculateCompensation({
      age: 35,
      monthlyIncome: 15000,
      maluliyetRate: 30,
      faultRate: 25,
      accidentType: "TRAFFIC",
    });
    res.json({ success: true, message: "Tazminat motoru çalışıyor", result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 11. Maluliyet Servisi Testi ──────────────────────────────────────────────
router.get("/maluliyet", devOnly, async (req, res) => {
  try {
    const { hesaplaTazminat, getYaralanmaTurleri } = require("../services/maluliyet.service");
    const turler = getYaralanmaTurleri();
    const hesap = hesaplaTazminat({
      yas: 35,
      aylikGelir: 15000,
      maluliyetOrani: 30,
      kusurOrani: 25,
      olumDavasi: false,
    });
    res.json({
      success: true,
      message: "Maluliyet servisi çalışıyor",
      yaralanmaTuruSayisi: turler.length,
      ornekHesap: hesap,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 12. Storage Servisi Testi ────────────────────────────────────────────────
router.get("/storage", devOnly, auth, role("ADMIN"), async (req, res) => {
  try {
    const storage = require("../services/storage.service");
    const mode = process.env.SUPABASE_STORAGE_BUCKET ? "supabase" : "local";
    // Test: küçük bir buffer yükle ve sil
    const testBuffer = Buffer.from("tedbirge-storage-test-" + Date.now());
    const filename = `test/ping-${Date.now()}.txt`;
    const uploadPath = await storage.uploadFile(testBuffer, filename, "text/plain");
    await storage.deleteFile(uploadPath);
    res.json({
      success: true,
      message: "Storage servisi çalışıyor",
      mode,
      bucket: process.env.SUPABASE_STORAGE_BUCKET || "(lokal uploads/)",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 13. PayTR Testi ──────────────────────────────────────────────────────────
router.get("/paytr", devOnly, auth, role("ADMIN"), (req, res) => {
  const mock = !process.env.PAYTR_MERCHANT_ID;
  res.json({
    success: true,
    mode: mock ? "mock" : "live",
    message: mock
      ? "PayTR mock mod — PAYTR_MERCHANT_ID env boş"
      : "PayTR canlı mod — credentials tanımlı",
    credentials: {
      merchantId: mock ? "(boş)" : "***" + process.env.PAYTR_MERCHANT_ID.slice(-4),
      merchantKey: mock ? "(boş)" : "***",
      merchantSalt: mock ? "(boş)" : "***",
    },
  });
});

// ─── 14. 2FA Testi ────────────────────────────────────────────────────────────
router.get("/2fa", devOnly, auth, role("ADMIN"), async (req, res) => {
  try {
    const speakeasy = require("speakeasy");
    const secret = speakeasy.generateSecret({ name: "Tedbirge-Test" });
    const token = speakeasy.totp({ secret: secret.base32, encoding: "base32" });
    const verified = speakeasy.totp.verify({
      secret: secret.base32,
      encoding: "base32",
      token,
      window: 1,
    });
    res.json({
      success: true,
      message: "2FA (speakeasy) çalışıyor",
      tokenGenerated: token,
      verified,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 15. Tüm Test Özeti ───────────────────────────────────────────────────────
router.get("/summary", devOnly, async (req, res) => {
  const checks = [];

  // DB
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.push({ name: "Veritabanı", status: "ok" });
  } catch {
    checks.push({ name: "Veritabanı", status: "hata" });
  }

  // AI key
  checks.push({
    name: "Anthropic API",
    status: process.env.ANTHROPIC_API_KEY ? "ok" : "eksik",
  });

  // SMS
  checks.push({
    name: "SMS (Netgsm)",
    status: process.env.NETGSM_USERNAME ? "ok" : "mock",
  });

  // Email
  checks.push({
    name: "E-posta (SMTP)",
    status: process.env.SMTP_PASS ? "ok" : "mock",
  });

  // WhatsApp
  checks.push({
    name: "WhatsApp",
    status: process.env.WHATSAPP_TOKEN ? "ok" : "mock",
  });

  // PayTR
  checks.push({
    name: "PayTR",
    status: process.env.PAYTR_MERCHANT_ID ? "ok" : "mock",
  });

  // Storage
  checks.push({
    name: "Supabase Storage",
    status: process.env.SUPABASE_STORAGE_BUCKET ? "ok" : "lokal",
  });

  // Tesseract
  try {
    const { execSync } = require("child_process");
    const t = process.env.TESSERACT_PATH || "tesseract";
    execSync(`"${t}" --version 2>&1`);
    checks.push({ name: "Tesseract OCR", status: "ok" });
  } catch {
    checks.push({ name: "Tesseract OCR", status: "bulunamadı" });
  }

  const allOk = checks.every((c) => c.status === "ok");

  res.json({
    success: true,
    allOk,
    checks,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
