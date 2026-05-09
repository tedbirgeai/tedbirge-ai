const express = require("express");
const controller = require("../controllers/onay.controller");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const ebaroService = require("../services/ebaro.service");
const prisma = require("../config/db");

const router = express.Router();

// Hukukçu onay
router.get("/hukukcu",           auth, role("ADMIN"), controller.listHukukcuOnay);
router.patch("/hukukcu/:id/onayla", auth, role("ADMIN"), controller.onaylaHukukcu);
router.patch("/hukukcu/:id/reddet", auth, role("ADMIN"), controller.reddetHukukcu);

// Temsilci onay
router.get("/temsilci",           auth, role("ADMIN"), controller.listTemsilciOnay);
router.patch("/temsilci/:id/onayla", auth, role("ADMIN"), controller.onaylaTemsilci);
router.patch("/temsilci/:id/reddet", auth, role("ADMIN"), controller.reddetTemsilci);

// TUR #103 — e-baro Manuel Doğrulama (Madde 38)
router.post(
  "/ebaro/verify",
  auth,
  role("ADMIN"),
  asyncHandler(async (req, res) => {
    const { userId, notes } = req.body || {};
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId zorunlu" });
    }
    const result = await ebaroService.manualVerify(userId, req.user.id, notes);
    // KVKK m.10 audit log (mevcut ActivityLog pattern)
    try {
      await prisma.activityLog.create({
        data: {
          action: "EBARO_VERIFIED",
          detail: `Avukat ${userId} e-baro manuel doğrulandı (admin: ${req.user.id}). Not: ${notes || "—"}`,
        },
      });
    } catch (_) {}
    res.json({ success: true, data: result });
  })
);

router.post(
  "/ebaro/revoke",
  auth,
  role("ADMIN"),
  asyncHandler(async (req, res) => {
    const { userId, reason } = req.body || {};
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId zorunlu" });
    }
    const result = await ebaroService.revokeVerification(userId, req.user.id, reason);
    try {
      await prisma.activityLog.create({
        data: {
          action: "EBARO_REVOKED",
          detail: `Avukat ${userId} e-baro doğrulaması iptal (admin: ${req.user.id}). Sebep: ${reason || "—"}`,
        },
      });
    } catch (_) {}
    res.json({ success: true, data: result });
  })
);

router.get(
  "/ebaro/lookup-url",
  auth,
  role("ADMIN"),
  asyncHandler(async (req, res) => {
    const { sicilNo, baroId } = req.query || {};
    const validation = ebaroService.validateSicilFormat(sicilNo);
    res.json({
      success: true,
      data: {
        url: ebaroService.buildLookupUrl(sicilNo, baroId),
        validation,
      },
    });
  })
);

module.exports = router;
