const express = require("express");
const ctrl = require("../controllers/hukuk.controller");
const docCtrl = require("../controllers/document.controller");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

const router = express.Router({ mergeParams: true });

// ─── İHTARNAME ───────────────────────────────────────────────────────────────
router.get("/:id/ihtarname", auth, ctrl.getIhtarnameler);
router.post("/:id/ihtarname", auth, role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER"), ctrl.createIhtarname);
router.patch("/:id/ihtarname/:ihtarnameId", auth, role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER"), ctrl.updateIhtarname);

// ─── DAVA SÜREÇ ──────────────────────────────────────────────────────────────
router.get("/:id/dava-surec", auth, ctrl.getDavaSurec);
router.post("/:id/dava-surec", auth, role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER"), ctrl.upsertDavaSurec);
router.patch("/:id/dava-surec/asama", auth, role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER"), ctrl.updateDavaAsama);

// ─── DURUŞMA ─────────────────────────────────────────────────────────────────
router.get("/:id/durusmalar", auth, ctrl.getDurusmalar);
router.post("/:id/durusmalar", auth, role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER"), ctrl.createDurusma);
router.delete("/:id/durusmalar/:durusmaId", auth, role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER"), ctrl.deleteDurusma);

// ─── BİLİRKİŞİ ───────────────────────────────────────────────────────────────
router.get("/:id/bilirkisi", auth, ctrl.getBilirkisi);
router.post("/:id/bilirkisi", auth, role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER"), ctrl.createBilirkisi);
router.patch("/:id/bilirkisi/:bilirkisiId", auth, role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER"), ctrl.updateBilirkisi);
router.post("/:id/bilirkisi/:bilirkisiId/analiz", auth, role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER"), ctrl.analyzeBilirkisi);

// ─── MASRAF ──────────────────────────────────────────────────────────────────
router.get("/:id/masraflar", auth, ctrl.getMasraflar);
router.post("/:id/masraflar", auth, role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER"), ctrl.createMasraf);

// ─── BELGE YÖNETİMİ ──────────────────────────────────────────────────────────
router.delete("/:id/documents/:documentId", auth, role("ADMIN", "SALES", "LAWYER"), docCtrl.softDeleteDocument);
router.post("/:id/documents/:documentId/retry-analysis", auth, role("ADMIN", "SALES", "LAWYER"), docCtrl.retryDocumentAnalysis);
router.post("/:id/documents/bulk-delete", auth, role("ADMIN", "SALES", "LAWYER"), docCtrl.bulkDeleteDocuments);

module.exports = router;
