const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const controller = require("../controllers/sigortaBasvuru.controller");
const pdfController = require("../controllers/sigortaBasvuru.pdf.controller");

router.use(authMiddleware);

router.post("/lead/:leadId", controller.create);
router.get("/lead/:leadId", controller.listByLead);
router.get("/:id", controller.getOne);
router.patch("/:id/status", controller.changeStatus);
router.get("/:id/pdf", pdfController.generatePdf);

module.exports = router;
