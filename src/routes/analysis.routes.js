const express = require("express");
const router = express.Router();
const { testAnalyze } = require("../controllers/analysis.controller");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

router.post("/test", auth, role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER"), testAnalyze);

module.exports = router;
