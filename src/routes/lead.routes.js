const express = require("express");
const controller = require("../controllers/lead.controller");
const compCtrl      = require("../controllers/lead.compensation.controller");
const caseDataCtrl  = require("../controllers/lead.caseData.controller");
const timelineCtrl  = require("../controllers/timeline.controller");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

const router = express.Router();

router.post("/", auth, controller.createLead);
router.post("/bulk-update", auth, role("ADMIN", "SALES", "REPRESENTATIVE"), controller.bulkUpdate);
router.get("/", auth, controller.listLeads);
router.get("/:id", auth, controller.getLead);
router.patch("/:id/status",       auth, role("ADMIN","SALES","REPRESENTATIVE","LAWYER"), controller.updateStatus);
router.patch("/:id/compensation", auth, role("ADMIN","SALES","REPRESENTATIVE","LAWYER"), compCtrl.updateEstimatedCompensation);
router.patch("/:id/case-data",    auth, role("ADMIN","SALES","LAWYER","REPRESENTATIVE"), caseDataCtrl.updateCaseData);
router.patch("/:id/owner",        auth, role("ADMIN","SALES","REPRESENTATIVE"), controller.assignOwner);
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
// TUR #55 A11 — REPRESENTATIVE archive yetkisi kaldırıldı (Madde 24.4 — sadece ADMIN+SALES+LAWYER)
router.patch("/:id/archive",   auth, role("ADMIN", "SALES", "LAWYER"), controller.archiveLead);
router.patch("/:id/unarchive", auth, role("ADMIN", "SALES", "LAWYER"), controller.unarchiveLead);
router.patch("/:id/restore",   auth, role("ADMIN"), controller.restoreLead);
router.delete("/:id",          auth, role("ADMIN"), controller.softDeleteLead);
router.delete("/:id/gdpr-delete", auth, controller.gdprDelete);
router.get("/:id/gdpr-export",   auth, role("ADMIN"), controller.gdprExport);
router.get("/:id/emsal", auth, role("ADMIN","SALES","LAWYER"), controller.getEmsalKararlar);
router.get("/:id/kaza-raporu", auth, role("ADMIN","SALES","LAWYER"), controller.getKazaRaporu);
router.get("/:id/generate-petition", auth, role("ADMIN","SALES","LAWYER"), controller.generateLeadPetition);
router.get("/:id/activity", auth, controller.getActivityLogs);
router.post("/:id/activity", auth, role("ADMIN","SALES","LAWYER"), controller.addActivityNote);
router.get("/:id/timeline", auth, timelineCtrl.getTimeline);

// TUR #56 A2 — Madde 24.11: AI analiz onay endpoint (LAWYER + ADMIN + SALES)
router.post("/:id/ai-analiz-onayla", auth, role("ADMIN", "SALES", "LAWYER"), controller.aiAnalizOnay);

module.exports = router;








