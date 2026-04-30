// TUR #52 — CommissionLog Routes (Madde 24.3)

const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const commissionService = require("../services/commission.service");

// ─── Admin (tum komisyonlar) ─────────────────────────────────
router.get("/commission-logs", auth, role("ADMIN"), async (req, res) => {
  try {
    res.json(await commissionService.listLogs(req.query));
  } catch (e) {
    console.error("[COMMISSION] list:", e);
    res.status(500).json({ error: "Listeleme hatasi" });
  }
});

router.post("/commission-logs", auth, role("ADMIN", "LAWYER"), async (req, res) => {
  try {
    const log = await commissionService.createLog(req.body);
    res.status(201).json(log);
  } catch (e) {
    console.error("[COMMISSION] create:", e);
    res.status(400).json({ error: e.message || "Kayit hatasi" });
  }
});

router.patch("/commission-logs/:id/status", auth, role("ADMIN"), async (req, res) => {
  try {
    res.json(await commissionService.updateStatus(req.params.id, req.body));
  } catch (e) {
    console.error("[COMMISSION] update:", e);
    res.status(400).json({ error: e.message || "Guncelleme hatasi" });
  }
});

// ─── Temsilci kendi komisyon ozeti ─────────────────────────────
router.get("/commission-logs/me", auth, role("REPRESENTATIVE", "ADMIN"), async (req, res) => {
  try {
    const tempId = req.user.role === "REPRESENTATIVE" ? req.user.id : req.query.temsilciId;
    const ozet = await commissionService.getTemsilciOzet(tempId);
    const data = await commissionService.listLogs({
      temsilciId: tempId,
      limit: req.query.limit,
      offset: req.query.offset,
    });
    res.json({ ...data, ozet });
  } catch (e) {
    console.error("[COMMISSION] me:", e);
    res.status(500).json({ error: "Ozet hatasi" });
  }
});

module.exports = router;
