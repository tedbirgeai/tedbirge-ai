const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/maluliyet.controller");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

// AMA tablosu — tüm roller görebilir
router.get("/yaralanma-turleri", auth, ctrl.getYaralanmaTurleri);

// Geçici hesaplama (kaydetmez)
router.post("/hesapla", auth, ctrl.hesapla);

// Lead üzerinde güncelle
router.patch("/leads/:id/maluliyet", auth, role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER"), ctrl.updateLeadMaluliyet);

module.exports = router;
