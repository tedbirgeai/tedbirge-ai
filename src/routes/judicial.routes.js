"use strict";

// TUR #110 C1 — JudicialResponse Endpoint'leri (KIRMIZI nokta — Madde 18.3 + 30.25 CEO sessiz onay)
// Modul YOK (Madde 28 — gelecek 50+ dava kayitlandiginda eklenir, kanit-bazli).
// Sadece veri toplama altyapisi: ilk dava kapanisi -> hâkim karari -> AI tahmin sapma kaydi.
// Yetki: LAWYER atanmis dava + ADMIN. Lead.judicialResponse 1:1 unique iliski.

const express = require("express");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/db");

const router = express.Router();

// ─── Yetki yardimcisi: ADMIN her zaman, LAWYER sadece ACTIVE atanmis dava ─
async function assertJudicialAccess(user, leadId) {
  if (user.role === "ADMIN") return true;
  if (user.role !== "LAWYER") return false;
  const a = await prisma.assignment.findFirst({
    where: { leadId, lawyerId: user.id, status: "ACTIVE" },
    select: { id: true },
  });
  return !!a;
}

// ─── POST /api/leads/:leadId/judicial-response ───────────────────────────────
// Mahkeme karari sonrasi LAWYER (veya ADMIN) bu endpoint'i cagirir. Idempotent upsert.
router.post(
  "/leads/:leadId/judicial-response",
  auth,
  role(["ADMIN", "LAWYER"]),
  asyncHandler(async (req, res) => {
    const { leadId } = req.params;
    const ok = await assertJudicialAccess(req.user, leadId);
    if (!ok) {
      return res.status(403).json({ success: false, error: "NOT_ASSIGNED_OR_FORBIDDEN" });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, leadCode: true, estimatedCompensation: true },
    });
    if (!lead) {
      return res.status(404).json({ success: false, error: "LEAD_NOT_FOUND" });
    }

    const {
      finalAmount,
      tedbirgeAITahmin,
      judgeNotes,
      decisionDate,
    } = req.body || {};

    if (!decisionDate) {
      return res.status(400).json({ success: false, error: "DECISION_DATE_REQUIRED" });
    }

    // tedbirgeAITahmin yoksa Lead.estimatedCompensation fallback
    const aiTahmin = (tedbirgeAITahmin != null && Number.isFinite(Number(tedbirgeAITahmin)))
      ? Number(tedbirgeAITahmin)
      : lead.estimatedCompensation;

    // deviationPct hesabi: 100 * (final - tahmin) / tahmin
    let deviationPct = null;
    const fa = Number(finalAmount);
    const ta = Number(aiTahmin);
    if (Number.isFinite(fa) && Number.isFinite(ta) && ta > 0) {
      deviationPct = Number((((fa - ta) / ta) * 100).toFixed(2));
    }

    const data = {
      leadId,
      finalAmount: Number.isFinite(fa) ? fa : null,
      tedbirgeAITahmin: Number.isFinite(ta) ? ta : null,
      deviationPct,
      judgeNotes: typeof judgeNotes === "string" ? judgeNotes.slice(0, 4000) : null,
      decisionDate: new Date(decisionDate),
      createdById: req.user.id,
    };

    // Upsert — Lead basina 1 mahkeme sonucu (unique)
    const result = await prisma.judicialResponse.upsert({
      where: { leadId },
      create: { ...data },
      update: {
        finalAmount: data.finalAmount,
        tedbirgeAITahmin: data.tedbirgeAITahmin,
        deviationPct: data.deviationPct,
        judgeNotes: data.judgeNotes,
        decisionDate: data.decisionDate,
      },
    });

    // KVKK m.10 audit
    try {
      await prisma.activityLog.create({
        data: {
          leadId,
          action: "JUDICIAL_RESPONSE_RECORDED",
          detail: `Final: ${data.finalAmount ?? "—"} TL · AI tahmin: ${data.tedbirgeAITahmin ?? "—"} TL · Sapma: ${data.deviationPct ?? "—"}% · Karar: ${data.decisionDate.toISOString().slice(0, 10)} (kullanici: ${req.user.id})`,
        },
      });
    } catch (_) {}

    // ADMIN_FEED bildirim — ileride judicialResponse modulu icin sinyal kaynagi
    try {
      await prisma.realtimeEvent.create({
        data: {
          channel: "ADMIN_FEED",
          eventType: "JUDICIAL_RESPONSE_RECORDED",
          payload: {
            title: "Mahkeme sonucu kaydedildi",
            body: `${lead.leadCode}: ${data.finalAmount ?? "—"} TL (sapma %${data.deviationPct ?? "—"})`,
            leadId,
            leadCode: lead.leadCode,
            finalAmount: data.finalAmount,
            deviationPct: data.deviationPct,
          },
        },
      });
    } catch (_) {}

    res.json({ success: true, data: result });
  })
);

// ─── GET /api/leads/:leadId/judicial-response ────────────────────────────────
router.get(
  "/leads/:leadId/judicial-response",
  auth,
  role(["ADMIN", "LAWYER"]),
  asyncHandler(async (req, res) => {
    const { leadId } = req.params;
    const ok = await assertJudicialAccess(req.user, leadId);
    if (!ok) {
      return res.status(403).json({ success: false, error: "NOT_ASSIGNED_OR_FORBIDDEN" });
    }
    const result = await prisma.judicialResponse.findUnique({ where: { leadId } });
    res.json({ success: true, data: result });
  })
);

// ─── GET /api/judicial-responses (ADMIN list — gelecek judicialResponse modulu icin envanter) ───
router.get(
  "/judicial-responses",
  auth,
  role(["ADMIN"]),
  asyncHandler(async (_req, res) => {
    const [items, total] = await Promise.all([
      prisma.judicialResponse.findMany({
        orderBy: { decisionDate: "desc" },
        take: 100,
        include: {
          Lead: { select: { id: true, leadCode: true, customerName: true, status: true } },
        },
      }),
      prisma.judicialResponse.count(),
    ]);
    res.json({ success: true, data: { items, total } });
  })
);

module.exports = router;
