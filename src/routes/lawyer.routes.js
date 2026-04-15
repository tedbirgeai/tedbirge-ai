const express = require("express");
const controller = require("../controllers/lawyer.controller");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

const router = express.Router();

router.get("/", auth, role("ADMIN", "SALES", "REPRESENTATIVE"), controller.listLawyers);
router.post("/", auth, role("ADMIN"), controller.createLawyer);

module.exports = router;
