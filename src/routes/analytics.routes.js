const express = require("express");
const controller = require("../controllers/analytics.controller");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

const router = express.Router();

router.get("/funnel",      auth, role("ADMIN", "SALES", "REPRESENTATIVE"), controller.getFunnel);
router.get("/conversion",  auth, role("ADMIN", "SALES", "REPRESENTATIVE"), controller.getConversionRate);
router.get("/revenue",     auth, role("ADMIN", "SALES", "REPRESENTATIVE"), controller.getRevenueEstimate);
router.get("/by-source",         auth, role("ADMIN", "SALES", "REPRESENTATIVE"), controller.getLeadsBySource);
router.get("/lawyer-performance", auth, role("ADMIN", "SALES", "REPRESENTATIVE"), controller.getLawyerPerformance);
router.get("/monthly-trend",      auth, role("ADMIN", "SALES", "REPRESENTATIVE"), controller.getMonthlyTrend);
router.get("/calendar",           auth, controller.getCalendarData);
router.get("/komisyon",           auth, role("ADMIN", "SALES", "REPRESENTATIVE"), controller.getKomisyonSummary);
router.get("/bilirkisi-summary",  auth, controller.getBilirkisiSummary);
router.get("/iletisim-ozet",      auth, controller.getIletisimOzet);

module.exports = router;
