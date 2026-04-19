const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const ds = require("../services/decision-support.service");
const asyncHandler = require("../utils/asyncHandler");

// POST /api/decision-support/zamanasimi
router.post("/zamanasimi", auth, asyncHandler(async (req, res) => {
  const { accidentType, accidentDate } = req.body;
  const sonuc = ds.calculateZamanasimiRiski(accidentType, accidentDate);
  res.json({ success: true, data: sonuc });
}));

// POST /api/decision-support/validate-tc
router.post("/validate-tc", auth, asyncHandler(async (req, res) => {
  const { tc } = req.body;
  const sonuc = ds.validateTcKimlik(tc);
  res.json({ success: true, data: sonuc });
}));

// POST /api/decision-support/il-uyumu
router.post("/il-uyumu", auth, asyncHandler(async (req, res) => {
  const { il } = req.body;
  const sonuc = await ds.ilAvukatUyumu(il);
  res.json({ success: true, data: sonuc });
}));

// POST /api/decision-support/tazminat
router.post("/tazminat", auth, asyncHandler(async (req, res) => {
  const { lead = {}, documentText = "" } = req.body;
  const sonuc = ds.estimateTazminat(lead, documentText);
  res.json({ success: true, data: sonuc });
}));

module.exports = router;
