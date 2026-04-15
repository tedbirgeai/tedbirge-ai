"use strict";

const express = require("express");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const ctrl = require("../controllers/petition.controller");

const router = express.Router();

// GET /api/petitions/:id/pdf
router.get("/:id/pdf", auth, role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER"), ctrl.downloadPetition);

// PATCH /api/petitions/:id
router.patch("/:id", auth, role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER"), ctrl.updatePetition);

// PATCH /api/petitions/:id/send
router.patch("/:id/send", auth, role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER"), ctrl.sendPetition);

module.exports = router;
