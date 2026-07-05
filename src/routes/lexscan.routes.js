const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/lexscan.controller");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

// Public — API key yoksa mock mod
router.post("/chat", ctrl.chat);

// YENİ — hero asistanının 0-sürtünme e-posta yakalama ucu (bkz. controller yorumu)
router.post("/capture-email", ctrl.captureEmail);

// YENİ — Müvekkil Adayları listesi, SADECE ADMIN (panel: /dashboard/muvekkil-adaylari)
router.get("/prospects", auth, role("ADMIN"), ctrl.listProspects);

module.exports = router;
