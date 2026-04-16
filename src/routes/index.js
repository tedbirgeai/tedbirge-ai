const publicRoutes = require("./public.route");
const express = require("express");
const authRoutes = require("./auth.routes");
const leadRoutes = require("./lead.routes");
const chatRoutes = require("./chat.routes");
const uploadRoutes = require("./upload.routes");
const crmRoutes = require("./crm.routes");
const lawyerRoutes = require("./lawyer.routes");
const assignmentRoutes = require("./assignment.routes");
const contractRoutes = require("./contract.routes");
const analyticsRoutes = require("./analytics.routes");
const documentRoutes = require("./document.routes");
const hukukRoutes = require("./hukuk.routes");
const petitionRoutes = require("./petition.routes");
const petitionStandaloneRoutes = require("./petition.standalone.routes");
const musteriRoutes = require("./musteri.routes");
const pushRoutes      = require("./push.routes");
const whatsappRoutes  = require("./whatsapp.routes");
const lexscanRoutes    = require("./lexscan.routes");
const maluliyetRoutes  = require("./maluliyet.routes");
const paymentRoutes    = require("./payment.routes");
const onayRoutes       = require("./onay.routes");
const testRoutes       = require("./test.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/leads", leadRoutes);
router.use("/chat", chatRoutes);
router.use("/uploads", uploadRoutes);
router.use("/crm", crmRoutes);
router.use("/lawyers", lawyerRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/contracts", contractRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/documents", documentRoutes);
router.use("/leads", hukukRoutes);
router.use("/leads/:leadId/petitions", petitionRoutes);
router.use("/petitions", petitionStandaloneRoutes);

router.use("/musteri",   musteriRoutes);
router.use("/push",      pushRoutes);
router.use("/whatsapp",  whatsappRoutes);
router.use("/lexscan",    lexscanRoutes);
router.use("/maluliyet",  maluliyetRoutes);
router.use("/payments",   paymentRoutes);
router.use("/onay",       onayRoutes);
router.use("/test",       testRoutes);
router.use('/', publicRoutes);

module.exports = router;

