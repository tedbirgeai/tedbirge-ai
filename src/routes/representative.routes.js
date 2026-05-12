// TUR #57 A2 — REPRESENTATIVE Pipeline aşama geçişi (Kanban drag-drop backend)
// TUR #113 — Temsilci sozlesme SMS OTP imzalama (Madde 30.67 + 25.3 KVKK + 17.2 R1)

const express = require("express");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/db");
const { sendOtpSms } = require("../services/sms.service");

const router = express.Router();

// Pipeline slug → Lead.status mapping
const SLUG_TO_STATUS = {
  yeni: "NEW",
  dosya: "DOCS_PENDING",
  sozlesme: "CONTRACT_PENDING",
  tahsilat: "ASSIGNED_TO_LAWYER",
  komisyon: "WON",
};

// State machine: hangi pipeline geçişine izin var
const ASAMA_GECISI = {
  yeni: ["dosya"],
  dosya: ["sozlesme", "yeni"], // geri dönüş
  sozlesme: ["tahsilat", "dosya"],
  tahsilat: ["komisyon", "sozlesme"],
  komisyon: [], // final, geri dönüş yok
};

// POST /api/representative/leads/:id/asama
router.post(
  "/representative/leads/:id/asama",
  auth,
  role("REPRESENTATIVE", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { fromStage, toStage } = req.body || {};

    if (!fromStage || !toStage) {
      return res.status(400).json({ success: false, message: "fromStage ve toStage zorunlu" });
    }
    if (!SLUG_TO_STATUS[fromStage] || !SLUG_TO_STATUS[toStage]) {
      return res.status(400).json({ success: false, message: "Bilinmeyen pipeline asamasi" });
    }

    // Geçerli geçiş mi?
    const allowed = ASAMA_GECISI[fromStage] || [];
    if (!allowed.includes(toStage)) {
      return res.status(409).json({ success: false, message: `${fromStage} -> ${toStage} gecisi yasakli` });
    }

    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { id: true, createdById: true, ownerId: true, status: true },
    });
    if (!lead) return res.status(404).json({ success: false, message: "Lead bulunamadi" });

    // REPRESENTATIVE sadece kendi lead'leri (createdBy ile)
    if (req.user.role === "REPRESENTATIVE" && lead.createdById !== req.user.id) {
      return res.status(403).json({ success: false, message: "Bu lead size atanmamis" });
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: { status: SLUG_TO_STATUS[toStage] },
    });

    // AgentEvent log (Madde 30)
    try {
      await prisma.agentEvent.create({
        data: {
          agentName: "system",
          eventType: "LEAD_ASAMA_GUNCELLENDI",
          severity: "INFO",
          payload: { leadId: id, fromStage, toStage, userId: req.user.id },
        },
      });
    } catch (e) {
      // AgentEvent yazılamazsa ana akış kesilmesin
    }

    res.json({ success: true, lead: updated });
  })
);

// ─── TUR #113 — Temsilci Sozlesme SMS OTP (Madde 30.67) ───────────────
// Frontend: tedbirge-panel/app/(panel)/temsilci/sozlesme/page.tsx
// Endpoint stub'lari: /representative/sozlesme/sms-otp + /representative/sozlesme/imzala

// POST /api/representative/sozlesme/sms-otp
// Body: { kvkk1, kvkk2, kvkk3 } - 3 KVKK onayi zorunlu
router.post(
  "/representative/sozlesme/sms-otp",
  auth,
  role("REPRESENTATIVE", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { kvkk1, kvkk2, kvkk3 } = req.body || {};
    if (!kvkk1 || !kvkk2 || !kvkk3) {
      return res.status(400).json({
        success: false,
        code: "KVKK_REDDEDILDI",
        message: "3 KVKK acik riza onayi (sozlesme + m.5/2 + SCC m.9) zorunludur",
      });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, message: "Kullanici bulunamadi" });
    if (!user.phone) {
      return res.status(400).json({
        success: false,
        code: "PHONE_MISSING",
        message: "Telefon numaraniz profilde tanimli degil. Once profile telefon ekleyin.",
      });
    }

    // Eski OTP'leri temizle (PhoneOtp model — Madde 25.3 KVKK m.7 silme)
    await prisma.phoneOtp.deleteMany({
      where: { phone: user.phone, purpose: "REPRESENTATIVE_CONTRACT" },
    });

    // Yeni 6 haneli OTP (10 dakika gecerli)
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.phoneOtp.create({
      data: { phone: user.phone, code, purpose: "REPRESENTATIVE_CONTRACT", expiresAt },
    });

    // SMS gonder (Netgsm ENV yoksa mock modda console.log)
    let smsResult = { success: true };
    try {
      smsResult = await sendOtpSms(user.phone, code, "temsilci sozlesme");
    } catch (err) {
      console.error("[REP_CONTRACT_SMS_ERROR]", err.message);
      smsResult = { success: false, error: err.message };
    }

    // Audit (KVKK m.10 izlenebilirlik)
    try {
      await prisma.activityLog.create({
        data: {
          action: "REPRESENTATIVE_CONTRACT_OTP_SENT",
          detail: `userId:${req.user.id} phone:${user.phone.slice(0, 4)}***${user.phone.slice(-2)} mock:${!!smsResult?.mock} success:${!!smsResult?.success}`,
        },
      });
    } catch (_) { /* audit basarisizliği akisi kesmesin */ }

    res.json({
      success: true,
      expiresIn: 600,
      mock: !!smsResult?.mock,
    });
  })
);

// POST /api/representative/sozlesme/imzala
// Body: { kod } - 6 haneli OTP
router.post(
  "/representative/sozlesme/imzala",
  auth,
  role("REPRESENTATIVE", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { kod } = req.body || {};
    if (!kod || !/^\d{6}$/.test(String(kod).trim())) {
      return res.status(400).json({
        success: false,
        code: "OTP_INVALID",
        message: "6 haneli sayisal kod girin",
      });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, message: "Kullanici bulunamadi" });
    if (!user.phone) {
      return res.status(400).json({ success: false, code: "PHONE_MISSING", message: "Telefon yok" });
    }

    // OTP kontrolu (PhoneOtp model — Madde 25.3)
    const otp = await prisma.phoneOtp.findFirst({
      where: {
        phone: user.phone,
        code: String(kod).trim(),
        purpose: "REPRESENTATIVE_CONTRACT",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return res.status(400).json({
        success: false,
        code: "OTP_MISMATCH",
        message: "Kod hatali veya suresi doldu. Yeniden kod isteyin.",
      });
    }

    // Imzala (mevcut User alanlarini guncelle — schema degisikligi YOK)
    const now = new Date();
    const ip = (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim()
            || req.ip
            || req.socket?.remoteAddress
            || null;

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        platformAgreementAcceptedAt: now,
        platformAgreementVersion: "v1.0-temsilci",
        kvkkAcceptedAt: now,
        kvkkVersion: "v1.0",
        sozlesmeKabulTarihi: now,
        sozlesmeKabulIp: ip || undefined,
        sozlesmeVersiyonu: "v1.0-temsilci",
      },
    });

    // OTP kullanildi, sil (idempotent — Madde 25.3 KVKK m.7)
    await prisma.phoneOtp.delete({ where: { id: otp.id } }).catch(() => {});

    // Audit (KVKK m.10 izlenebilirlik)
    try {
      await prisma.activityLog.create({
        data: {
          action: "REPRESENTATIVE_CONTRACT_SIGNED",
          detail: `userId:${req.user.id} role:REPRESENTATIVE version:v1.0-temsilci ip:${ip || "?"} kvkk:1`,
        },
      });
    } catch (_) {}

    res.json({
      success: true,
      signedAt: now.toISOString(),
      version: "v1.0-temsilci",
    });
  })
);

module.exports = router;
