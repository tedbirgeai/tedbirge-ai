const express = require("express");
const controller = require("../controllers/payment.controller");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

const router = express.Router();

// PayTR callback — public (PayTR sunucusundan gelir)
router.post("/callback", controller.paymentCallback);

// Ödeme başlat
router.post("/leads/:leadId/initiate", auth, role("ADMIN", "SALES", "LAWYER", "REPRESENTATIVE"), controller.initiatePayment);

// Durum sorgula
router.get("/leads/:leadId/status", auth, controller.getPaymentStatus);

// İade
router.post("/leads/:leadId/refund", auth, role("ADMIN"), controller.refund);

module.exports = router;
