const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

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

// ─── GET /api/career-applications (ADMIN) ──────────────────────
router.get("/career-applications", auth, role("ADMIN"), async (req, res) => {
  try {
    const { status, limit = "50", offset = "0" } = req.query;
    const where = {};
    if (status === "DELETED") {
      where.status = "DELETED";
    } else if (status) {
      where.status = status;
      where.deletedAt = null;
    } else {
      where.deletedAt = null;
    }

    const [applications, total] = await Promise.all([
      prisma.careerApplication.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: Math.min(parseInt(limit) || 50, 100),
        skip: Math.max(parseInt(offset) || 0, 0),
      }),
      prisma.careerApplication.count({ where }),
    ]);

    return res.json({ applications, total });
  } catch (error) {
    console.error("[CAREER] Admin GET hatasi:", error);
    return res.status(500).json({ error: "Veriler yuklenirken hata olustu" });
  }
});

// ─── GET /api/career-applications/:id (ADMIN) ──────────────────
router.get("/career-applications/:id", auth, role("ADMIN"), async (req, res) => {
  try {
    const application = await prisma.careerApplication.findUnique({
      where: { id: req.params.id },
    });
    if (!application) {
      return res.status(404).json({ error: "Basvuru bulunamadi" });
    }
    return res.json(application);
  } catch (error) {
    console.error("[CAREER] Admin detay hatasi:", error);
    return res.status(500).json({ error: "Detay yuklenirken hata olustu" });
  }
});

// ─── PATCH /api/career-applications/:id/status (ADMIN) ─────────
router.patch("/career-applications/:id/status", auth, role("ADMIN"), async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    const validStatuses = ["NEW", "REVIEWED", "CONTACTED", "HIRED", "REJECTED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Gecersiz durum" });
    }

    const application = await prisma.careerApplication.update({
      where: { id: req.params.id },
      data: {
        status,
        reviewNote: reviewNote ? reviewNote.slice(0, 2000) : undefined,
        reviewedAt: new Date(),
      },
    });

    try {
      await prisma.activityLog.create({
        data: {
          action: "CAREER_APPLICATION_STATUS_UPDATE",
          detail: `${application.id} -> ${status}`,
        },
      });
    } catch (e) {}

    return res.json(application);
  } catch (error) {
    console.error("[CAREER] Status update hatasi:", error);
    return res.status(500).json({ error: "Guncelleme hatasi" });
  }
});

// ─── DELETE /api/career-applications/:id (ADMIN - KVKK m.7) ────
router.delete("/career-applications/:id", auth, role("ADMIN"), async (req, res) => {
  try {
    const application = await prisma.careerApplication.update({
      where: { id: req.params.id },
      data: {
        status: "DELETED",
        deletedAt: new Date(),
        deletionRequestedAt: new Date(),
        // KVKK anonimlestirme (audit izi korunur)
        fullName: "[SILINDI]",
        email: "[SILINDI]",
        phone: null,
        cvLink: null,
        message: null,
        ipAddress: null,
        userAgent: null,
      },
    });

    try {
      await prisma.activityLog.create({
        data: {
          action: "CAREER_APPLICATION_DELETED_KVKK",
          detail: `${application.id} silindi (KVKK m.7)`,
        },
      });
    } catch (e) {}

    return res.json({ success: true, deletedAt: application.deletedAt });
  } catch (error) {
    console.error("[CAREER] DELETE hatasi:", error);
    return res.status(500).json({ error: "Silme hatasi" });
  }
});

module.exports = router;
