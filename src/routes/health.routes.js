const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/db");

// GET /api/health — liveness check (no auth)
router.get("/", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "unknown",
  });
});

// GET /api/health/db — Prisma connectivity probe (no auth)
router.get(
  "/db",
  asyncHandler(async (req, res) => {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - start;
      res.json({
        status: "ok",
        db: "connected",
        timestamp: new Date().toISOString(),
        latencyMs,
      });
    } catch (err) {
      console.error("[health/db] DB probe failed:", err);
      res.status(503).json({
        status: "error",
        db: "disconnected",
        timestamp: new Date().toISOString(),
      });
    }
  })
);

module.exports = router;
