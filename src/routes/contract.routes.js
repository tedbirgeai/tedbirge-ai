const express = require("express");
const controller = require("../controllers/contract.controller");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

const router = express.Router();

// By lead ID
router.get("/:leadId", auth, role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER", "CUSTOMER"), controller.listByLead);
router.post("/:leadId/generate", auth, role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER"), controller.generate);

// By contract ID — must come after /:leadId/generate to avoid prefix conflicts
router.get("/:id/pdf", auth, role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER", "CUSTOMER"), controller.getPdf);
router.patch("/:id", auth, role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER"), controller.update);

module.exports = router;
