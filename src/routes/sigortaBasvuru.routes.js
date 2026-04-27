const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const controller = require("../controllers/sigortaBasvuru.controller");
const pdfController = require("../controllers/sigortaBasvuru.pdf.controller");

router.use(authMiddleware);

router.post("/lead/:leadId", roleMiddleware("ADMIN", "SALES", "LAWYER", "REPRESENTATIVE"), controller.create);
router.get("/lead/:leadId", controller.listByLead);
router.get("/:id", controller.getOne);
router.patch("/:id/status", roleMiddleware("ADMIN", "SALES", "LAWYER", "REPRESENTATIVE"), controller.changeStatus);
router.get("/:id/pdf", pdfController.generatePdf);

module.exports = router;
