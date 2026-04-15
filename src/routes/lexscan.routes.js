const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/lexscan.controller");

// Public — API key yoksa mock mod
router.post("/chat", ctrl.chat);

module.exports = router;
