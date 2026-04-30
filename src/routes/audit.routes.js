// TUR #52 — Audit Log (ActivityLog) Routes

const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const auditService = require("../services/audit.service");

router.get("/activity-logs", auth, role("ADMIN"), async (req, res) => {
  try {
    res.json(await auditService.listLogs(req.query));
  } catch (e) {
    console.error("[AUDIT] list:", e);
    res.status(500).json({ error: "Listeleme hatasi" });
  }
});

router.get("/activity-logs/action-types", auth, role("ADMIN"), async (req, res) => {
  try {
    res.json(await auditService.getActionTypes());
  } catch (e) {
    console.error("[AUDIT] types:", e);
    res.status(500).json({ error: "Tip listesi hatasi" });
  }
});

module.exports = router;
