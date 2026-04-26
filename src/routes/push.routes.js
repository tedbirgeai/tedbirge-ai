const express = require("express");
const ctrl        = require("../controllers/push.controller");
const auth        = require("../middlewares/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/vapid-key",   ctrl.getVapidKey);          // Public — VAPID public key
router.post("/subscribe",  auth, ctrl.subscribe);       // Kayıt
router.post("/unsubscribe",auth, ctrl.unsubscribe);     // İptal

// POST /api/push/test - ADMIN manuel push tetikleme (TUR #6)
// Subscribe akisinin canli dogrulamasi icin kullanilir.
// KVKK uyum: payload muvekkil verisi icermez, sadece test mesaji.
router.post("/test", auth, asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ success: false, error: "ADMIN required" });
  }

  const { title, body, url } = req.body || {};

  const pushService = require("../services/pushNotification.service");

  const payload = {
    title: title || "Tedbirge — Test Bildirimi",
    body:  body  || "Push notification altyapisi calisiyor. Bu test mesajidir.",
    url:   url   || "/dashboard/bildirimler",
    tag:   "test-" + Date.now(),
  };

  try {
    await pushService.sendToUser(req.user.id, payload);
    return res.json({
      success: true,
      sent: true,
      to:      { userId: req.user.id, role: req.user.role },
      payload,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      hint: "VAPID env'leri eksikse mock modda calisir, gercek push gitmez.",
    });
  }
}));

module.exports = router;
