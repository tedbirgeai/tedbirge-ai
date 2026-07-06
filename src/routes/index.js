const publicRoutes = require("./public.route");
const express = require("express");
const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const leadRoutes = require("./lead.routes");
const chatRoutes = require("./chat.routes");
const crmRoutes = require("./crm.routes");
const lawyerRoutes = require("./lawyer.routes");
const assignmentRoutes = require("./assignment.routes");
const contractRoutes = require("./contract.routes");
const analyticsRoutes = require("./analytics.routes");
const documentRoutes = require("./document.routes");
const documentsUploadRoutes = require("./documents.upload.routes");
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
const decisionSupportRoutes = require("./decision-support.routes");
const sigortaBasvuruRoutes = require("./sigortaBasvuru.routes");
const muhatapAIRoutes = require("./muhatapAI.routes");
const adminOsRoutes = require("./admin.os.routes");
const { router: unsubscribeRouter } = require("./unsubscribe.routes");
const careerApplicationRoutes = require("./career-application.route");
const kvkkRoutes = require("./kvkk.routes");
const commissionRoutes = require("./commission.routes");
const auditRoutes = require("./audit.routes");
const settingRoutes = require("./setting.routes");
const realtimeRoutes = require("./realtime.routes");
const agentRoutes = require("./agent.routes");
// TUR #57 A2
const adminAnomalyRoutes = require("./admin.anomaly.routes");
const representativeRoutes = require("./representative.routes");
// TUR #114 — Admin sozlesme gorunurluk (Emine CELIK saha bulgusu)
const adminSozlesmelerRoutes = require("./admin-sozlesmeler.routes");
// TUR #104 — UYAP manuel veri (Madde 39 — TCK m.243 koruma)
const uyapRoutes = require("./uyap.routes");
// TUR #110 C1 — JudicialResponse veri toplama (KIRMIZI — Madde 28)
const judicialRoutes = require("./judicial.routes");
// TUR #132.4 — Admin AI Egitimi (Tedbirge AI Asistani FAQ + fallback + conversations)
const adminAiTrainingRoutes = require("./admin.ai-training.routes");
// "7/24 Dijital Bekçi" — Saha Sinyalleri (kamuya açık haber taraması, otomatik temas YOK)
const sahaSinyalleriRoutes = require("./saha-sinyalleri.route");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", require("./users.routes")); // TUR #84 T2 — Kullanıcı CRUD (Madde 30.37)
router.use("/leads", leadRoutes);
router.use("/chat", chatRoutes);
router.use("/crm", crmRoutes);
router.use("/lawyers", lawyerRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/contracts", contractRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/documents", documentRoutes);
// TUR #63 — Hibrit upload (init-upload + finalize-upload, 10 context)
router.use("/documents", documentsUploadRoutes);
router.use("/leads", hukukRoutes);
router.use("/leads/:leadId/petitions", petitionRoutes);
router.use("/petitions", petitionStandaloneRoutes);

router.use("/musteri",   musteriRoutes);
router.use("/push",      pushRoutes);
router.use("/whatsapp",  whatsappRoutes);
router.use("/lexscan",    lexscanRoutes);
router.use("/maluliyet",  maluliyetRoutes);
router.use("/payments",   paymentRoutes);
router.use("/onay",             onayRoutes);
router.use("/test",             testRoutes);
router.use("/decision-support", decisionSupportRoutes);
router.use("/sigorta-basvuru", sigortaBasvuruRoutes);
router.use("/leads", muhatapAIRoutes);
router.use("/os", adminOsRoutes);
router.use("/os", require("./os.events.routes"));
router.use("/os/healer", require("./os.healer.routes"));
router.use("/", unsubscribeRouter);
router.use('/', publicRoutes);
router.use('/', careerApplicationRoutes);
router.use('/', kvkkRoutes);
router.use('/', commissionRoutes);
router.use('/', auditRoutes);
router.use('/', settingRoutes);
router.use('/', realtimeRoutes);
router.use('/', agentRoutes);
// TUR #57 A2 — anomaly + representative pipeline
router.use('/', adminAnomalyRoutes);
router.use('/', representativeRoutes);
// TUR #114 — Admin sozlesme gorunurluk
router.use('/', adminSozlesmelerRoutes);
// TUR #104 — UYAP manuel veri (Madde 39)
router.use('/', uyapRoutes);
// TUR #110 C1 — JudicialResponse (Madde 28 + KIRMIZI nokta)
router.use('/', judicialRoutes);
// TUR #132.4 — Admin AI Egitimi
router.use('/admin/ai-training', adminAiTrainingRoutes);
router.use('/admin/saha-sinyalleri', sahaSinyalleriRoutes);

module.exports = router;

