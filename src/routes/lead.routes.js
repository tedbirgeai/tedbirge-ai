const express = require("express");
const controller = require("../controllers/lead.controller");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

const router = express.Router();

router.post("/", auth, controller.createLead);
router.post("/bulk-update", auth, role("ADMIN", "SALES", "REPRESENTATIVE"), controller.bulkUpdate);
router.get("/", auth, controller.listLeads);
router.get("/:id", auth, controller.getLead);
router.patch("/:id/status", auth, role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER"), controller.updateStatus);
router.patch("/:id/owner", auth, role("ADMIN", "SALES", "REPRESENTATIVE"), controller.assignOwner);
router.get("/:id/whatsapp-redirect", auth, controller.getWhatsappRedirect);

router.post("/:id/continue-process", auth, controller.continueProcess);
router.post("/:id/approve-process", auth, role("ADMIN","SALES"), controller.approveProcess);
router.post("/:id/operation-approve", auth, role("ADMIN","SALES"), controller.operationApproveLead);
router.post("/:id/workflow/run", auth, role("ADMIN","SALES","LAWYER"), controller.runLeadWorkflow);
router.get("/:id/uyap-status", auth, controller.getUyapStatus);
router.patch("/:id/uyap", auth, role("ADMIN", "SALES", "REPRESENTATIVE"), controller.saveUyapData);
router.get("/:id/sgk-data", auth, controller.getSgkData);
router.get("/verify/:id", controller.verifyLead);
router.get("/:id/document-draft", auth, controller.getDocumentDraft);
router.get("/:id/document-draft/contract-pdf", controller.downloadContractPdf);
router.get("/:id/document-draft/power-of-attorney-pdf", controller.downloadPowerOfAttorneyPdf);
router.delete("/:id/gdpr-delete", auth, controller.gdprDelete);
router.get("/:id/emsal", auth, role("ADMIN","SALES","LAWYER"), controller.getEmsalKararlar);
router.get("/:id/kaza-raporu", auth, role("ADMIN","SALES","LAWYER"), controller.getKazaRaporu);
router.get("/:id/generate-petition", auth, role("ADMIN","SALES","LAWYER"), controller.generateLeadPetition);
router.get("/:id/activity", auth, controller.getActivityLogs);
router.post("/:id/activity", auth, role("ADMIN","SALES","LAWYER"), controller.addActivityNote);

module.exports = router;








