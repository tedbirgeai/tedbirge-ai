const express = require("express");
const controller = require("../controllers/admin.os.controller");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/status",        auth, role("ADMIN"), controller.getStatus);
router.get("/boot-records",  auth, role("ADMIN"), controller.getBootRecords);
router.get("/events",        auth, role("ADMIN"), controller.getEvents);

// TUR #66 v2 A5 — Gecmis FAILED Document AI retry endpoint'leri (Madde 32.10)
router.post(
  "/ai-retry/all",
  auth,
  role("ADMIN"),
  asyncHandler(async (req, res) => {
    const failedDocs = await prisma.document.findMany({
      where: { status: "FAILED", leadId: { not: null } },
      select: { id: true, leadId: true, originalName: true },
      take: 500, // Madde 4 — bulk islem performans siniri
    });

    const total = failedDocs.length;
    if (total === 0) {
      return res.json({ triggered: 0, total: 0, message: "FAILED durumda Document yok" });
    }

    if (total >= 500) {
      console.warn(`[ai-retry/all] 500+ FAILED Document tespit edildi, ilk 500 isleniyor`);
    }

    const { analyzeDocumentById } = require("../services/uploadAnalysis.bridge");
    const lawyerNotif = require("../services/lawyerNotifications.service");

    let triggered = 0;
    for (const doc of failedDocs) {
      setImmediate(async () => {
        try {
          const result = await analyzeDocumentById(doc.id);

          const safeSummary =
            result?.analysis?.aiSummary ||
            result?.analysis?.summary ||
            "Analiz tamamlandi.";
          const safeScore = Number.isInteger(result?.analysis?.qualificationScore)
            ? result.analysis.qualificationScore
            : (Number.isInteger(result?.analysis?.score) ? result.analysis.score : null);

          await prisma.document.update({
            where: { id: doc.id },
            data: {
              status: "ANALYZED",
              parsedText: result?.parsedText || null,
              aiAnalysis: JSON.stringify({
                ...(result?.analysis || {}),
                extractionMethod: result?.extractionMethod,
                retriedAt: new Date().toISOString(),
              }),
              extractedJson: JSON.stringify(result?.analysis || {}),
            },
          });

          await prisma.lead.update({
            where: { id: doc.leadId },
            data: {
              aiSummary: safeSummary,
              ...(safeScore !== null && { qualificationScore: safeScore }),
            },
          }).catch(() => {});

          console.log(`[ai-retry] ${doc.id} ANALYZED — ${doc.originalName}`);
        } catch (err) {
          console.error(`[ai-retry] ${doc.id} hala hata:`, err.message);
          try {
            await prisma.document.update({
              where: { id: doc.id },
              data: {
                aiAnalysis: JSON.stringify({
                  error: err.message || "AI retry hatasi",
                  failedAt: new Date().toISOString(),
                  retryAttempted: true,
                }),
              },
            });
          } catch (_) {}
          try {
            await lawyerNotif.notifyAiAnalysisFailed(doc.id, doc.leadId, err.message);
          } catch (_) {}
        }
      });
      triggered++;
    }

    res.json({ triggered, total, message: `${triggered}/${total} Document arka planda yeniden isleniyor` });
  })
);

router.post(
  "/ai-retry/:documentId",
  auth,
  role("ADMIN"),
  asyncHandler(async (req, res) => {
    const { documentId } = req.params;
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) return res.status(404).json({ error: "Document bulunamadi" });
    if (!doc.leadId) return res.status(400).json({ error: "Lead'e bagli olmayan Document analiz edilemez" });

    const { analyzeDocumentById } = require("../services/uploadAnalysis.bridge");
    const lawyerNotif = require("../services/lawyerNotifications.service");

    setImmediate(async () => {
      try {
        const result = await analyzeDocumentById(documentId);
        const safeSummary =
          result?.analysis?.aiSummary || result?.analysis?.summary || "Analiz tamamlandi.";
        const safeScore = Number.isInteger(result?.analysis?.qualificationScore)
          ? result.analysis.qualificationScore
          : (Number.isInteger(result?.analysis?.score) ? result.analysis.score : null);

        await prisma.document.update({
          where: { id: documentId },
          data: {
            status: "ANALYZED",
            parsedText: result?.parsedText || null,
            aiAnalysis: JSON.stringify({
              ...(result?.analysis || {}),
              extractionMethod: result?.extractionMethod,
              retriedAt: new Date().toISOString(),
            }),
            extractedJson: JSON.stringify(result?.analysis || {}),
          },
        });

        await prisma.lead.update({
          where: { id: doc.leadId },
          data: {
            aiSummary: safeSummary,
            ...(safeScore !== null && { qualificationScore: safeScore }),
          },
        }).catch(() => {});

        console.log(`[ai-retry tekil] ${documentId} ANALYZED`);
      } catch (err) {
        console.error(`[ai-retry tekil] ${documentId} hata:`, err.message);
        try {
          await prisma.document.update({
            where: { id: documentId },
            data: {
              aiAnalysis: JSON.stringify({
                error: err.message || "AI retry hatasi",
                failedAt: new Date().toISOString(),
                retryAttempted: true,
              }),
            },
          });
        } catch (_) {}
        try {
          await lawyerNotif.notifyAiAnalysisFailed(documentId, doc.leadId, err.message);
        } catch (_) {}
      }
    });

    res.json({ queued: true, documentId });
  })
);

// TUR #71 A22 — Akış paneli: tek modül için son N AgentEvent (modül kartı expand)
router.get(
  "/modules/:agentName/events",
  auth,
  role("ADMIN"),
  asyncHandler(async (req, res) => {
    const { agentName } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const events = await prisma.agentEvent.findMany({
      where: { agentName },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, eventType: true, severity: true, payload: true, createdAt: true },
    });
    res.json({ success: true, events, agentName });
  }),
);

// TUR #71 A24 — Global olay akışı (tüm modüller, son 50 AgentEvent)
router.get(
  "/events-feed",
  auth,
  role("ADMIN"),
  asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const events = await prisma.agentEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, agentName: true, eventType: true, severity: true, payload: true, createdAt: true },
    });
    res.json({ success: true, events });
  }),
);

// TUR #71 A19 — LLM Router CEO komut çubuğu (Anthropic Tool Use, SELECT-only)
router.post(
  "/command",
  auth,
  role("ADMIN"),
  asyncHandler(async (req, res) => {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ success: false, error: "query string zorunlu" });
    }
    try {
      const llmRouter = require("../services/llmRouter.service");
      const result = await llmRouter.routeCommand(query);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }),
);

// TUR #69.5 C3 — UI endpoint: 16 modül son durum (lastRunAt + eventCountLast1h + severity)
router.get(
  "/modules/status",
  auth,
  role("ADMIN"),
  asyncHandler(async (req, res) => {
    const moduleNames = [
      "ai", "analyzer", "appearance", "backup", "compliance",
      "costGuard", "deploy", "insurance", "maintenance", "navigation",
      "notifications", "performance", "pulse", "recovery", "security", "uyapControl",
    ];

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const modules = await Promise.all(
      moduleNames.map(async (name) => {
        const [last, count] = await Promise.all([
          prisma.agentEvent.findFirst({
            where: { agentName: name },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true, severity: true, payload: true },
          }),
          prisma.agentEvent.count({
            where: { agentName: name, createdAt: { gte: oneHourAgo } },
          }),
        ]);
        return {
          agentName: name,
          lastRunAt: last?.createdAt || null,
          lastSeverity: last?.severity || null,
          lastMessage: last?.payload?.message || null,
          eventCountLast1h: count,
        };
      }),
    );

    res.json({ success: true, modules, generatedAt: new Date().toISOString() });
  }),
);

router.get(
  "/ai-failed-count",
  auth,
  role("ADMIN"),
  asyncHandler(async (req, res) => {
    const count = await prisma.document.count({
      where: { status: "FAILED", leadId: { not: null } },
    });
    res.json({ count });
  })
);

module.exports = router;
