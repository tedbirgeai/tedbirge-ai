// TUR #52 — KVKK Hak Yonetimi Routes (m.7 + m.11)

const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const kvkkService = require("../services/kvkk.service");

// ─── Admin ─────────────────────────────────────────────────────
router.get("/kvkk-requests", auth, role("ADMIN"), async (req, res) => {
  try {
    const data = await kvkkService.listRequests(req.query);
    res.json(data);
  } catch (e) {
    console.error("[KVKK] list:", e);
    res.status(500).json({ error: "Listeleme hatasi" });
  }
});

router.get("/kvkk-requests/:id", auth, role("ADMIN"), async (req, res) => {
  try {
    const r = await kvkkService.getRequest(req.params.id);
    if (!r) return res.status(404).json({ error: "Bulunamadi" });
    res.json(r);
  } catch (e) {
    console.error("[KVKK] get:", e);
    res.status(500).json({ error: "Okuma hatasi" });
  }
});

router.patch("/kvkk-requests/:id/respond", auth, role("ADMIN"), async (req, res) => {
  try {
    const updated = await kvkkService.respondToRequest(req.params.id, {
      status: req.body.status,
      responseNote: req.body.responseNote,
      handlerId: req.user.id,
    });
    res.json(updated);
  } catch (e) {
    console.error("[KVKK] respond:", e);
    res.status(500).json({ error: e.message || "Cevap hatasi" });
  }
});

router.post("/kvkk-requests/:id/execute-deletion", auth, role("ADMIN"), async (req, res) => {
  try {
    const updated = await kvkkService.executeKvkkDeletion(req.params.id, req.user.id);
    res.json(updated);
  } catch (e) {
    console.error("[KVKK] delete-exec:", e);
    res.status(500).json({ error: e.message || "Silme hatasi" });
  }
});

module.exports = router;
