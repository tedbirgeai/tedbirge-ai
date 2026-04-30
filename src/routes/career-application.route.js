const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

let sendCareerApplicationNotification;
try {
  ({ sendCareerApplicationNotification } = require("../services/email.service"));
} catch (e) {
  console.warn("[CAREER] Email service import hatasi:", e.message);
  sendCareerApplicationNotification = null;
}

// ─── POST /api/public-career-application ──────────────────────
router.post("/public-career-application", async (req, res) => {
  try {
    const {
      fullName, email, phone, position, cvLink, message,
      cvHavuzuOnay, aydinlatmaOnayTimestamp, acikRizaOnayTimestamp,
    } = req.body;

    if (!fullName || !email || !position) {
      return res.status(400).json({ error: "Ad, e-posta ve pozisyon zorunlu alanlardir" });
    }
    if (!aydinlatmaOnayTimestamp || !acikRizaOnayTimestamp) {
      return res.status(400).json({ error: "KVKK aydinlatma ve acik riza onayi zorunludur" });
    }

    const ipAddress = req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
      || req.headers["x-real-ip"]
      || req.socket?.remoteAddress
      || null;
    const userAgent = req.headers["user-agent"]?.slice(0, 500) || null;

    const application = await prisma.careerApplication.create({
      data: {
        fullName: fullName.trim().slice(0, 200),
        email: email.trim().toLowerCase().slice(0, 200),
        phone: phone ? phone.trim().slice(0, 50) : null,
        position: position.trim().slice(0, 200),
        cvLink: cvLink ? cvLink.trim().slice(0, 1000) : null,
        message: message ? message.trim().slice(0, 5000) : null,
        aydinlatmaOnayTimestamp: new Date(aydinlatmaOnayTimestamp),
        acikRizaOnayTimestamp: new Date(acikRizaOnayTimestamp),
        cvHavuzuOnay: !!cvHavuzuOnay,
        ipAddress,
        userAgent,
        status: "NEW",
      },
    });

    if (sendCareerApplicationNotification) {
      sendCareerApplicationNotification(application).catch((err) => {
        console.error("[CAREER] E-posta bildirimi gonderilemedi:", err.message);
      });
    }

    try {
      await prisma.activityLog.create({
        data: {
          action: "CAREER_APPLICATION_CREATED",
          detail: `Position: ${position} | Email: ${email}`,
        },
      });
    } catch (logErr) {
      console.warn("[CAREER] ActivityLog yazilamadi:", logErr.message);
    }

    return res.status(201).json({ success: true, applicationId: application.id });
  } catch (error) {
    console.error("[CAREER] Public POST hatasi:", error);
    return res.status(500).json({ error: "Basvuru kayit edilirken hata olustu" });
  }
});

module.exports = router;
