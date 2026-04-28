const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const controller = require("../controllers/sigortaBasvuru.controller");
const pdfController = require("../controllers/sigortaBasvuru.pdf.controller");

router.use(authMiddleware);

router.post("/lead/:leadId", roleMiddleware("ADMIN", "SALES", "LAWYER", "REPRESENTATIVE"), controller.create);
router.get("/lead/:leadId", roleMiddleware("ADMIN", "SALES", "LAWYER", "REPRESENTATIVE"), controller.listByLead);
router.get("/:id", roleMiddleware("ADMIN", "SALES", "LAWYER", "REPRESENTATIVE"), controller.getOne);
router.patch("/:id/status", roleMiddleware("ADMIN", "SALES", "LAWYER", "REPRESENTATIVE"), controller.changeStatus);
router.get("/:id/pdf", roleMiddleware("ADMIN", "SALES", "LAWYER", "REPRESENTATIVE"), pdfController.generatePdf);

module.exports = router;
