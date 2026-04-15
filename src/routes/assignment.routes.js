const express = require("express");
const controller = require("../controllers/assignment.controller");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

const router = express.Router();

router.post("/:leadId", auth, role("ADMIN", "SALES", "REPRESENTATIVE"), controller.assignLead);

module.exports = router;
