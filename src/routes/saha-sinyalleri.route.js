// src/routes/saha-sinyalleri.route.js
//
// "7/24 Dijital Bekçi" — sadece ADMIN'in görebileceği, salt-okunur sinyal listesi.
// Otomatik temas YOK; bkz. src/jobs/sahaSinyalleri.job.js üstündeki not.

"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();
const CACHE_PATH = path.resolve(__dirname, "../../tedbirge-os/data/saha-sinyalleri.json");

router.get("/", authMiddleware, roleMiddleware("ADMIN"), (req, res) => {
  try {
    const raw = fs.readFileSync(CACHE_PATH, "utf-8");
    const data = JSON.parse(raw);
    return res.json({ success: true, data });
  } catch (err) {
    return res.json({
      success: true,
      data: { generatedAt: null, not: null, sinyaller: [] },
    });
  }
});

module.exports = router;
