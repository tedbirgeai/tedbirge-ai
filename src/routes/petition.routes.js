"use strict";

const express = require("express");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const ctrl = require("../controllers/petition.controller");

const router = express.Router({ mergeParams: true });

// POST /api/leads/:leadId/petitions
router.post("/", auth, role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER"), ctrl.createPetition);

// GET /api/leads/:leadId/petitions
router.get("/", auth, role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER"), ctrl.listPetitions);

module.exports = router;
