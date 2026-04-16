const express = require("express");
const controller = require("../controllers/onay.controller");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

const router = express.Router();

// Hukukçu onay
router.get("/hukukcu",           auth, role("ADMIN"), controller.listHukukcuOnay);
router.patch("/hukukcu/:id/onayla", auth, role("ADMIN"), controller.onaylaHukukcu);
router.patch("/hukukcu/:id/reddet", auth, role("ADMIN"), controller.reddetHukukcu);

// Temsilci onay
router.get("/temsilci",           auth, role("ADMIN"), controller.listTemsilciOnay);
router.patch("/temsilci/:id/onayla", auth, role("ADMIN"), controller.onaylaTemsilci);
router.patch("/temsilci/:id/reddet", auth, role("ADMIN"), controller.reddetTemsilci);

module.exports = router;
