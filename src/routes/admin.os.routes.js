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
