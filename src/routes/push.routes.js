const express = require("express");
const ctrl  = require("../controllers/push.controller");
const auth  = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/vapid-key",   ctrl.getVapidKey);          // Public — VAPID public key
router.post("/subscribe",  auth, ctrl.subscribe);       // Kayıt
router.post("/unsubscribe",auth, ctrl.unsubscribe);     // İptal

module.exports = router;
