const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/lexscan.controller");

// Public — API key yoksa mock mod
router.post("/chat", ctrl.chat);

// YENİ — hero asistanının 0-sürtünme e-posta yakalama ucu (bkz. controller yorumu)
router.post("/capture-email", ctrl.captureEmail);

module.exports = router;
