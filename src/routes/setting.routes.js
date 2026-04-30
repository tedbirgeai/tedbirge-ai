// TUR #52 — SystemSetting Routes (ADMIN UI)

const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const settingService = require("../services/setting.service");

router.get("/settings", auth, role("ADMIN"), async (req, res) => {
  try {
    res.json(await settingService.listSettings(req.query));
  } catch (e) {
    console.error("[SETTING] list:", e);
    res.status(500).json({ error: "Listeleme hatasi" });
  }
});

router.get("/settings/:key", auth, role("ADMIN"), async (req, res) => {
  try {
    const s = await settingService.getSetting(req.params.key);
    if (!s) return res.status(404).json({ error: "Bulunamadi" });
    res.json(s);
  } catch (e) {
    console.error("[SETTING] get:", e);
    res.status(500).json({ error: "Okuma hatasi" });
  }
});

router.patch("/settings/:key", auth, role("ADMIN"), async (req, res) => {
  try {
    const updated = await settingService.upsertSetting(req.params.key, {
      ...req.body,
      updatedBy: req.user.id,
    });
    res.json(updated);
  } catch (e) {
    console.error("[SETTING] update:", e);
    res.status(400).json({ error: e.message || "Guncelleme hatasi" });
  }
});

router.post("/settings/ensure-defaults", auth, role("ADMIN"), async (req, res) => {
  try {
    await settingService.ensureDefaults();
    res.json({ success: true });
  } catch (e) {
    console.error("[SETTING] defaults:", e);
    res.status(500).json({ error: "Default seed hatasi" });
  }
});

module.exports = router;
