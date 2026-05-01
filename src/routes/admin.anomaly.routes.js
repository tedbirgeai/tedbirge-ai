// TUR #57 A2 — CEO Komuta Köprüsü anomali endpoint

const express = require("express");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const { detectAnomalies } = require("../services/anomaly.service");

const router = express.Router();

// GET /api/admin/anomalies (ADMIN)
router.get(
  "/admin/anomalies",
  auth,
  role("ADMIN"),
  asyncHandler(async (req, res) => {
    const anomalies = await detectAnomalies();
    res.json({ success: true, anomalies });
  })
);

module.exports = router;
