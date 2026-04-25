/**
 * src/routes/os.healer.routes.js
 *
 * Tedbirge OS — Healer öneri yönetim endpoint'leri
 *
 * GET  /pending           → AUDIT_FINDINGS/OPEN/ klasöründeki öneriler
 * GET  /history           → RESOLVED/REJECTED tarihçesi
 * POST /decide/:filename  → Öneri kararı (approve/reject)
 * POST /test-sms          → SMS akışı testi (admin manuel)
 *
 * Auth: ADMIN
 * Mimari karar: dosya tabanlı, schema değişikliği yok.
 */

"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/db");

const FINDINGS_DIR = path.join(process.cwd(), "tedbirge-os", "docs", "AUDIT_FINDINGS");
const OPEN_DIR = path.join(FINDINGS_DIR, "OPEN");
const RESOLVED_DIR = path.join(FINDINGS_DIR, "RESOLVED");
const REJECTED_DIR = path.join(FINDINGS_DIR, "REJECTED");

// Admin guard
function adminOnly(req, res, next) {
  if (req.user && req.user.role === "ADMIN") return next();
  return res.status(403).json({ success: false, error: "ADMIN required" });
}

// Klasor guvenli okuma
function safeReadDir(dir) {
  try {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  } catch (err) {
    return [];
  }
}

function safeReadJson(filepath) {
  try {
    const raw = fs.readFileSync(filepath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return { _parseError: err.message, _filename: path.basename(filepath) };
  }
}

// GET /api/os/healer/pending
router.get(
  "/pending",
  auth,
  adminOnly,
  asyncHandler(async (req, res) => {
    const files = safeReadDir(OPEN_DIR);
    const items = files.map((f) => {
      const data = safeReadJson(path.join(OPEN_DIR, f));
      return { filename: f, ...data };
    });
    items.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
    res.json({ success: true, count: items.length, items });
  })
);

// GET /api/os/healer/history?status=RESOLVED|REJECTED&limit=50
router.get(
  "/history",
  auth,
  adminOnly,
  asyncHandler(async (req, res) => {
    const status = (req.query.status || "RESOLVED").toUpperCase();
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const dir = status === "REJECTED" ? REJECTED_DIR : RESOLVED_DIR;
    const files = safeReadDir(dir);
    const items = files.map((f) => {
      const data = safeReadJson(path.join(dir, f));
      return { filename: f, ...data };
    });
    items.sort((a, b) =>
      (b.decidedAt || b.timestamp || "").localeCompare(a.decidedAt || a.timestamp || "")
    );
    res.json({ success: true, count: items.length, items: items.slice(0, limit) });
  })
);

// POST /api/os/healer/decide/:filename
router.post(
  "/decide/:filename",
  auth,
  adminOnly,
  asyncHandler(async (req, res) => {
    const filename = req.params.filename;
    const { decision, note } = req.body || {};

    // Guvenlik: filename traversal korumasi
    if (
      !filename ||
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return res.status(400).json({ success: false, error: "Invalid filename" });
    }
    if (!filename.endsWith(".json")) {
      return res.status(400).json({ success: false, error: "Filename must end with .json" });
    }
    if (!["approve", "reject"].includes(decision)) {
      return res
        .status(400)
        .json({ success: false, error: "decision must be 'approve' or 'reject'" });
    }

    const sourcePath = path.join(OPEN_DIR, filename);
    if (!fs.existsSync(sourcePath)) {
      return res.status(404).json({ success: false, error: "Suggestion not found in OPEN/" });
    }

    const targetDir = decision === "approve" ? RESOLVED_DIR : REJECTED_DIR;
    const targetPath = path.join(targetDir, filename);

    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const data = safeReadJson(sourcePath);
    data.status = decision === "approve" ? "RESOLVED" : "REJECTED";
    data.decidedAt = new Date().toISOString();
    data.decidedBy = req.user.email || req.user.id || "ADMIN";
    if (note) data.decisionNote = note;

    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), "utf8");
    fs.unlinkSync(sourcePath);

    try {
      await prisma.systemEvent.create({
        data: {
          type: `healer:decision_${decision}`,
          severity: "INFO",
          module: "healer",
          payload: { filename, decidedBy: data.decidedBy },
        },
      });
    } catch (_e) {}

    return res.json({
      success: true,
      decision,
      filename,
      movedTo: decision === "approve" ? "RESOLVED" : "REJECTED",
    });
  })
);

// POST /api/os/healer/test-sms — manuel SMS testi
router.post(
  "/test-sms",
  auth,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { message } = req.body || {};
    const adminPhone = process.env.ADMIN_PHONE;

    if (!adminPhone) {
      return res.status(400).json({ success: false, error: "ADMIN_PHONE env tanımlı değil" });
    }

    try {
      const { sendSms } = require("../services/sms.service");
      const text = `[TEDBIRGE TEST] ${message || "SMS akisi test mesaji"}`;
      const result = await sendSms(adminPhone, text);
      return res.json({
        success: true,
        sent: true,
        to: adminPhone.replace(/\d(?=\d{4})/g, "*"),
        result,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  })
);

module.exports = router;
