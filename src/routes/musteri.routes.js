const express = require("express");
const ctrl = require("../controllers/musteri.controller");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

const router = express.Router();

// Tüm route'lar CUSTOMER rolüne açık
router.get("/dashboard",                      auth, role("CUSTOMER"), ctrl.getDashboard);
router.get("/mesajlar",                       auth, role("CUSTOMER"), ctrl.getMessages);
router.post("/mesaj",                         auth, role("CUSTOMER"), ctrl.sendMessage);
router.post("/onay-baslat/:contractId",       auth, role("CUSTOMER"), ctrl.startApproval);
router.post("/onay-dogrula/:contractId",      auth, role("CUSTOMER"), ctrl.verifyApproval);
// TUR #94 M1 — Bildirim merkezi (Madde 31.9 R1 + TUR #93 RealtimeEvent zinciri)
router.get("/bildirimler",                    auth, role("CUSTOMER"), ctrl.getNotifications);

module.exports = router;
