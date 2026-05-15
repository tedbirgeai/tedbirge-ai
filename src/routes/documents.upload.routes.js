// Madde 32 — Hibrit Belge Disiplini (TUR #63)
// Tum rol icin ortak hibrit upload endpoint'leri
// Akis: init-upload (signed URL) -> direkt Supabase PUT -> finalize-upload

const express = require("express");
const router = express.Router();
const { z } = require("zod");
const { createClient } = require("@supabase/supabase-js");

const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const authMiddleware = require("../middlewares/authMiddleware");
const { assertLeadAccess } = require("../utils/leadAccess");

// Optional auth: token varsa kullaniciyi req.user'a koy, yoksa devam et (public-lead icin)
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const tokenFromHeader = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const token = tokenFromHeader || null;
    if (!token) {
      req.user = null;
      return next();
    }
    const jwt = require("jsonwebtoken");
    const env = require("../config/env");
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    req.user = user && user.isActive ? user : null;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "tedbirge-documents";

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY env eksik");
  }
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

const ContextSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("lead"), leadId: z.string().min(8), category: z.string().optional() }),
  z.object({ kind: z.literal("public-lead"), leadDraftToken: z.string().min(8), category: z.string().optional() }),
  z.object({ kind: z.literal("career"), applicationId: z.string().min(8) }),
  z.object({ kind: z.literal("kvkk-request"), requestId: z.string().min(8) }),
  z.object({ kind: z.literal("tahsilat"), leadId: z.string().min(8) }),
  z.object({ kind: z.literal("bilirkisi"), bilirkisiId: z.string().min(8) }),
  z.object({ kind: z.literal("dava"), davaSurecId: z.string().min(8) }),
  z.object({ kind: z.literal("ihtarname"), ihtarnameTakipId: z.string().min(8) }),
  z.object({ kind: z.literal("sozlesme"), leadId: z.string().min(8) }),
  z.object({
    kind: z.literal("general"),
    entityType: z.string(),
    entityId: z.string().min(8),
    category: z.string().optional(),
  }),
]);

const InitSchema = z.object({
  context: ContextSchema,
  originalName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive().max(50 * 1024 * 1024),
});

// Yetki kontrolu (TUR #63 — assertLeadAccess pattern + context bazli)
async function checkPermission(context, user) {
  if (context.kind === "public-lead") {
    // TUR #64 — leadDraftToken = lead.id pattern (Yol E)
    // Anonim public-lead upload: lead public_form kaynaklı + 30 dk pencere
    const lead = await prisma.lead.findUnique({
      where: { id: context.leadDraftToken },
      select: { id: true, createdAt: true, source: true },
    });
    if (!lead) return { allowed: false };
    if (lead.source !== "public_form") return { allowed: false };
    const ageMs = Date.now() - new Date(lead.createdAt).getTime();
    if (ageMs > 30 * 60 * 1000) return { allowed: false };
    return { allowed: true, leadId: lead.id };
  }
  if (!user) return { allowed: false };

  if (context.kind === "career") {
    const app = await prisma.careerApplication.findUnique({
      where: { id: context.applicationId },
      select: { email: true },
    });
    if (!app) return { allowed: false };
    if (user.role === "ADMIN") return { allowed: true, leadId: null };
    if (app.email === user.email) return { allowed: true, leadId: null };
    return { allowed: false };
  }

  if (context.kind === "kvkk-request") {
    const r = await prisma.dataSubjectRequest.findUnique({
      where: { id: context.requestId },
      select: { handlerId: true, requesterTC: true },
    });
    if (!r) return { allowed: false };
    if (user.role === "ADMIN") return { allowed: true, leadId: null };
    if (r.handlerId === user.id) return { allowed: true, leadId: null };
    return { allowed: false };
  }

  if (context.kind === "general") {
    return user.role === "ADMIN" ? { allowed: true, leadId: null } : { allowed: false };
  }

  // Lead-bagli context'ler
  let leadId = null;
  if (context.kind === "lead" || context.kind === "tahsilat" || context.kind === "sozlesme") {
    leadId = context.leadId;
  } else if (context.kind === "bilirkisi") {
    const b = await prisma.bilirkisi.findUnique({
      where: { id: context.bilirkisiId },
      select: { leadId: true },
    });
    leadId = b?.leadId;
  } else if (context.kind === "dava") {
    const ds = await prisma.davaSurec.findUnique({
      where: { id: context.davaSurecId },
      select: { leadId: true },
    });
    leadId = ds?.leadId;
  } else if (context.kind === "ihtarname") {
    const ih = await prisma.ihtarnameTakip.findUnique({
      where: { id: context.ihtarnameTakipId },
      select: { leadId: true },
    });
    leadId = ih?.leadId;
  }

  if (!leadId) return { allowed: false };

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { assignments: true },
  });
  if (!lead) return { allowed: false };

  // ADMIN superuser bypass — her lead'e erisim (Madde 9.5 + ADMIN superuser)
  if (user.role === "ADMIN") return { allowed: true, leadId };

  // assertLeadAccess pattern (utils/leadAccess.js — Madde 9.5)
  try {
    await assertLeadAccess(user, lead);
    return { allowed: true, leadId };
  } catch (err) {
    return { allowed: false };
  }
}

function buildPath(context, originalName) {
  const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const ts = Date.now();
  if (context.kind === "lead" || context.kind === "tahsilat" || context.kind === "sozlesme") {
    return `leads/${context.leadId}/${context.kind}/${ts}-${safe}`;
  }
  if (context.kind === "public-lead") {
    return `public-drafts/${context.leadDraftToken}/${ts}-${safe}`;
  }
  if (context.kind === "career") return `career/${context.applicationId}/${ts}-${safe}`;
  if (context.kind === "kvkk-request") return `kvkk/${context.requestId}/${ts}-${safe}`;
  if (context.kind === "bilirkisi") return `bilirkisi/${context.bilirkisiId}/${ts}-${safe}`;
  if (context.kind === "dava") return `dava/${context.davaSurecId}/${ts}-${safe}`;
  if (context.kind === "ihtarname") return `ihtarname/${context.ihtarnameTakipId}/${ts}-${safe}`;
  if (context.kind === "general") return `${context.entityType}/${context.entityId}/${ts}-${safe}`;
  return `misc/${ts}-${safe}`;
}

// POST /api/documents/init-upload
router.post(
  "/init-upload",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const parsed = InitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Gecersiz veri", details: parsed.error.errors });
    }
    const { context, originalName, mimeType, sizeBytes } = parsed.data;

    const perm = await checkPermission(context, req.user);
    if (!perm.allowed) return res.status(403).json({ error: "Yetkiniz yok" });

    const path = buildPath(context, originalName);
    const storedName = path.substring(path.lastIndexOf("/") + 1);

    const doc = await prisma.document.create({
      data: {
        leadId: perm.leadId,
        originalName,
        storedName,
        mimeType,
        sizeBytes,
        path,
        type: "OTHER",
        category: context.category || context.kind.toUpperCase(),
        uploadedById: req.user?.id || null,
        status: "PENDING_UPLOAD",
        metadata: { context: { kind: context.kind } },
      },
    });

    let signed;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUploadUrl(path);
      if (error) throw error;
      signed = data;
    } catch (err) {
      await prisma.document.delete({ where: { id: doc.id } }).catch(() => {});
      return res.status(500).json({ error: "Upload URL uretilemedi", details: err.message });
    }

    if (req.user) {
      await prisma.activityLog.create({
        data: {
          leadId: perm.leadId,
          action: "DOCUMENT_UPLOAD_INITIATED",
          detail: `${context.kind} — ${originalName} (${sizeBytes} bytes) — user:${req.user.id}`,
        },
      }).catch(() => {});
    }

    res.json({
      uploadUrl: signed.signedUrl,
      storagePath: path,
      documentId: doc.id,
      token: signed.token,
    });
  })
);

const FinalizeSchema = z.object({
  documentId: z.string().min(8),
  storagePath: z.string(),
  actualSize: z.number().int().positive(),
  originalSize: z.number().int().positive(),
  compressionRatio: z.number().min(0).max(1),
});

// POST /api/documents/finalize-upload
router.post(
  "/finalize-upload",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const parsed = FinalizeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Gecersiz veri", details: parsed.error.errors });
    }
    const { documentId, actualSize, originalSize, compressionRatio } = parsed.data;

    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) return res.status(404).json({ error: "Document bulunamadi" });

    if (doc.uploadedById && req.user && doc.uploadedById !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Bu yukleme size ait degil" });
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "UPLOADED",
        sizeBytes: actualSize,
        compressionRatio,
        originalSize,
        metadata: {
          ...(doc.metadata || {}),
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    if (req.user) {
      await prisma.activityLog.create({
        data: {
          leadId: doc.leadId,
          action: "DOCUMENT_UPLOAD_COMPLETED",
          detail: `${updated.originalName} — ${actualSize}/${originalSize} bytes (${(compressionRatio * 100).toFixed(0)}% sıkıştırma)`,
        },
      }).catch(() => {});
    }

    // TUR #66 — AI Analiz arka plan tetikleyici (Madde 32.10)
    // Lead'e bağlı belgeler (lead/public-lead/sozlesme/tahsilat/bilirkisi/dava/ihtarname) için
    // setImmediate ile fire-and-forget — finalize response'u bekletmez (kullanıcı hızlı görür).
    // TUR #132 M1 (Madde 30.90 + 30.91): AI Cekirdek TAC yapisal JSON cikarimi MERGE edildi.
    if (doc.leadId) {
      setImmediate(async () => {
        try {
          const { analyzeDocumentById } = require("../services/uploadAnalysis.bridge");
          const result = await analyzeDocumentById(documentId);

          const safeSummary =
            result?.analysis?.aiSummary ||
            result?.analysis?.summary ||
            "Analiz tamamlandi.";
          const safeScore = Number.isInteger(result?.analysis?.qualificationScore)
            ? result.analysis.qualificationScore
            : (Number.isInteger(result?.analysis?.score) ? result.analysis.score : null);

          // TUR #132 M1 — AI Cekirdek (TAC) yapisal JSON cikarim
          // Madde 30.90 saha vaadi: kaza turu / sigorta sirketi / maluliyet / kusur otomatik tespit
          // Madde 30.91 KVKK m.6: saglik verisi VEYA dusuk confidence → needsManualReview
          let m1Fields = {
            aiAnalysisJson: null,
            aiConfidence: null,
            aiAnalyzedAt: null,
            aiModelVersion: null,
            needsManualReview: false,
            manualReviewReason: null,
          };
          try {
            const { analyzeDocument: tacAnalyze, CURRENT_MODEL } = require("../services/ai-analyzer.service");
            const { logAiCost } = require("../services/ai-cost-tracker.service");

            const parsedText = result?.parsedText || "";
            if (parsedText.trim().length >= 20) {
              const tac = await tacAnalyze(parsedText, {
                userId: doc.uploadedById || null,
                leadId: doc.leadId,
                fileName: updated.originalName,
                mimeType: updated.mimeType,
              });

              const conf = Number(tac.raw?.overallConfidence) || 0;
              const docType = tac.raw?.documentType || null;
              const maluliyet = tac.raw?.extractedData?.maluliyetOrani;
              const isSaglikVeri =
                docType === "epikriz" || docType === "sgk-raporu" || maluliyet != null;
              const needsManualReview = conf < 0.85 || isSaglikVeri;
              const manualReviewReason = !needsManualReview
                ? null
                : conf < 0.85
                ? `Guven skoru dusuk (${conf.toFixed(2)})`
                : "Saglik verisi — KVKK m.6 avukat manuel onayi";

              m1Fields = {
                aiAnalysisJson: tac.raw,
                aiConfidence: conf,
                aiAnalyzedAt: new Date(),
                aiModelVersion: tac.modelVersion,
                needsManualReview,
                manualReviewReason,
              };

              // Madde 24.14 — maliyet izleme (aylik $100 limit ADMIN_FEED)
              logAiCost({
                documentId,
                leadId: doc.leadId,
                modelVersion: tac.modelVersion,
                promptTokens: tac.promptTokens,
                completionTokens: tac.completionTokens,
              }).catch((e) => console.warn("[TAC M1] logAiCost fail:", e.message));
            }
          } catch (m1Err) {
            console.warn(`[TAC M1] ${documentId} TAC analiz fail: ${m1Err.message}`);
            // M1 fail mevcut analiz akisini bozmaz (Madde 4.6 geriye uyumluluk)
          }

          await prisma.document.update({
            where: { id: documentId },
            data: {
              status: "ANALYZED",
              parsedText: result?.parsedText || null,
              aiAnalysis: JSON.stringify({
                ...(result?.analysis || {}),
                extractionMethod: result?.extractionMethod,
              }),
              extractedJson: JSON.stringify(result?.analysis || {}),
              ...m1Fields,
            },
          });

          // TUR #132.1 ATOM 6 — AI cikti Lead'e merge (Madde 30.90 saha vaadi)
          // Madde 4.6 hibrit koruma: idempotent guard, avukat elle yazdiklari dokunulmaz
          if (m1Fields.aiAnalysisJson && doc.leadId) {
            try {
              const { mergeAiResultToLead } = require("../services/ai-analyzer.service");
              const mergeResult = await mergeAiResultToLead(documentId, m1Fields.aiAnalysisJson);
              if (mergeResult?.merged) {
                console.log(`[finalize AI] Lead ${doc.leadId} merge: ${mergeResult.fields?.length} alan, confidence ${mergeResult.confidence?.toFixed(2)}`);
              } else {
                console.log(`[finalize AI] Lead ${doc.leadId} merge skip: ${mergeResult?.reason}`);
              }
            } catch (mergeErr) {
              console.warn(`[finalize AI] Lead merge fail: ${mergeErr.message}`);
            }
          }

          // Madde 30.75 KVKK m.10 audit zinciri — TAC M1 cikti detayi
          if (m1Fields.aiAnalysisJson) {
            await prisma.activityLog
              .create({
                data: {
                  leadId: doc.leadId,
                  action: "DOCUMENT_AI_ANALYZED",
                  detail: `documentId:${documentId} confidence:${(m1Fields.aiConfidence || 0).toFixed(2)} type:${m1Fields.aiAnalysisJson?.documentType || "n/a"} needsReview:${m1Fields.needsManualReview}`,
                },
              })
              .catch(() => {});

            // Madde 24.11 — needsManualReview true ise ADMIN_FEED bildirim
            if (m1Fields.needsManualReview) {
              await prisma.realtimeEvent
                .create({
                  data: {
                    channel: "ADMIN_FEED",
                    eventType: "AI_REVIEW_REQUIRED",
                    payload: {
                      documentId,
                      leadId: doc.leadId,
                      fileName: updated.originalName,
                      reason: m1Fields.manualReviewReason,
                      confidence: m1Fields.aiConfidence,
                    },
                  },
                })
                .catch((e) => console.warn("[TAC M1] ADMIN_FEED fail:", e.message));
            }
          }

          await prisma.lead.update({
            where: { id: doc.leadId },
            data: {
              aiSummary: safeSummary,
              ...(safeScore !== null && { qualificationScore: safeScore }),
            },
          });

          await prisma.activityLog.create({
            data: {
              leadId: doc.leadId,
              action: "DOCUMENT_ANALYZED",
              detail: `${updated.originalName} analiz edildi (${result?.extractionMethod || "unknown"})`,
            },
          }).catch(() => {});

          // TUR #56 A1.2 — avukata belge yuklendi bildirimi
          try {
            const lawyerNotif = require("../services/lawyerNotifications.service");
            await lawyerNotif.notifyDocumentUploaded(doc.leadId, updated);
          } catch (notifErr) {
            console.warn("[LAWYER NOTIF] notifyDocumentUploaded fail:", notifErr.message);
          }

          // TUR #56 A1.2 — AI analiz tamamlandi + Madde 24.11 guven skoru kontrolu
          try {
            const lawyerNotif = require("../services/lawyerNotifications.service");
            const guvenSkoru = Number(
              result?.analysis?.guvenSkoru ?? result?.analysis?.confidence ?? 1
            );
            const requiresReview = Number.isFinite(guvenSkoru) && guvenSkoru < 0.7;
            await lawyerNotif.notifyAiAnalysisCompleted(doc.leadId, safeSummary, requiresReview);
          } catch (notifErr) {
            console.warn("[LAWYER NOTIF] notifyAiAnalysisCompleted fail:", notifErr.message);
          }

          console.log(`[finalize AI] ${documentId} ANALYZED — ${updated.originalName}`);
        } catch (err) {
          console.error(`[finalize AI] ${documentId} hata:`, err.message);
          try {
            await prisma.document.update({
              where: { id: documentId },
              data: {
                status: "FAILED",
                aiAnalysis: JSON.stringify({
                  error: err.message || "AI analiz hatasi",
                  failedAt: new Date().toISOString(),
                }),
              },
            });
          } catch (updateErr) {
            console.error(`[finalize AI] FAILED update fail: ${updateErr.message}`);
          }

          // TUR #66 v2 A4 — ADMIN AI HATA bildirim (Madde 32.10)
          try {
            const lawyerNotif = require("../services/lawyerNotifications.service");
            await lawyerNotif.notifyAiAnalysisFailed(documentId, doc.leadId, err.message);
          } catch (notifErr) {
            console.warn("[LAWYER NOTIF] notifyAiAnalysisFailed fail:", notifErr.message);
          }
        }
      });
    }

    res.json({
      ok: true,
      document: {
        id: updated.id,
        originalName: updated.originalName,
        sizeBytes: updated.sizeBytes,
        status: updated.status,
      },
      aiAnalysisQueued: !!doc.leadId,
    });
  })
);

module.exports = router;
