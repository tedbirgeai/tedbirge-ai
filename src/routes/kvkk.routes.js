// TUR #52 — KVKK Hak Yonetimi Routes (m.7 + m.11)
// TUR #132 M1 — KVKK m.6 Acik Riza ek endpoint (Madde 30.91 yeni)

const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const kvkkService = require("../services/kvkk.service");
const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

// ─── TUR #132 M1 — Acik Riza: Belge Yukleme (KVKK m.6 — Madde 30.91) ────────
// Ozel nitelikli kisisel veri (saglik epikriz/SGK rapor) icin acik riza zorunlu.
// Audit zinciri Madde 30.75 — ip + UA + ActivityLog.
router.post(
  "/acik-riza-document-upload",
  auth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const ip = req.ip || req.headers["x-forwarded-for"] || null;
    const ua = (req.headers["user-agent"] || "").slice(0, 200);

    await prisma.user.update({
      where: { id: userId },
      data: {
        kvkkM6ConsentAt: new Date(),
        kvkkM6ConsentIp: ip ? String(ip).slice(0, 64) : null,
        kvkkM6ConsentUA: ua || null,
      },
    });

    // Madde 30.75 KVKK m.10 audit
    await prisma.activityLog
      .create({
        data: {
          action: "KVKK_M6_CONSENT_GIVEN",
          detail: `userId:${userId} ip:${ip || "n/a"} ua:${ua.slice(0, 100)}`,
        },
      })
      .catch(() => {});

    res.json({
      success: true,
      consentAt: new Date().toISOString(),
    });
  })
);

// ─── Admin ─────────────────────────────────────────────────────
router.get("/kvkk-requests", auth, role("ADMIN"), async (req, res) => {
  try {
    const data = await kvkkService.listRequests(req.query);
    res.json(data);
  } catch (e) {
    console.error("[KVKK] list:", e);
    res.status(500).json({ error: "Listeleme hatasi" });
  }
});

router.get("/kvkk-requests/:id", auth, role("ADMIN"), async (req, res) => {
  try {
    const r = await kvkkService.getRequest(req.params.id);
    if (!r) return res.status(404).json({ error: "Bulunamadi" });
    res.json(r);
  } catch (e) {
    console.error("[KVKK] get:", e);
    res.status(500).json({ error: "Okuma hatasi" });
  }
});

router.patch("/kvkk-requests/:id/respond", auth, role("ADMIN"), async (req, res) => {
  try {
    const updated = await kvkkService.respondToRequest(req.params.id, {
      status: req.body.status,
      responseNote: req.body.responseNote,
      handlerId: req.user.id,
    });
    res.json(updated);
  } catch (e) {
    console.error("[KVKK] respond:", e);
    res.status(500).json({ error: e.message || "Cevap hatasi" });
  }
});

router.post("/kvkk-requests/:id/execute-deletion", auth, role("ADMIN"), async (req, res) => {
  try {
    const updated = await kvkkService.executeKvkkDeletion(req.params.id, req.user.id);
    res.json(updated);
  } catch (e) {
    console.error("[KVKK] delete-exec:", e);
    res.status(500).json({ error: e.message || "Silme hatasi" });
  }
});

module.exports = router;
