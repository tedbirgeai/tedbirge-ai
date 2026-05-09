"use strict";

// TUR #104 — UYAP Manuel Veri + Duruşma Endpoint'leri (Madde 39)
// KIRMIZI ÇİZGİ: TCK m.243 koruma — sadece manuel veri girişi, hiçbir UYAP API çağrısı yok.

const express = require("express");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const { requirePermission } = require("../middlewares/requirePermission");
const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/db");
const uyapService = require("../services/uyap.service");

const router = express.Router();

// ─── UYAP Referans Bilgileri (dropdown listeleri için) ───────────────────────
router.get(
  "/uyap/reference",
  auth,
  asyncHandler(async (_req, res) => {
    res.json({
      success: true,
      data: {
        dosyaTurleri: uyapService.getDosyaTurleri(),
        dosyaDurumlari: uyapService.getDosyaDurumlari(),
        durusmaTurleri: uyapService.getDurusmaTurleri(),
        vatandasUrl: uyapService.buildVatandasUrl(),
        avukatUrl: uyapService.buildAvukatUrl(),
      },
    });
  })
);

// ─── Lead UYAP Bilgisi Güncelle (LAWYER atanan + ADMIN) ──────────────────────
router.patch(
  "/leads/:leadId/uyap",
  auth,
  requirePermission("uyap", "write"),
  asyncHandler(async (req, res) => {
    const { leadId } = req.params;
    const { uyapDosyaNo, uyapMahkeme, uyapDosyaTuru, uyapDurum, uyapNotlar } = req.body || {};

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { assignments: true },
    });
    if (!lead) {
      return res.status(404).json({ success: false, error: "LEAD_NOT_FOUND" });
    }

    // Yetki: ADMIN her zaman OK, LAWYER sadece kendi atanan dava
    if (req.user.role !== "ADMIN") {
      const isAssigned = lead.assignments?.some(
        (a) => a.lawyerId === req.user.id && a.status === "ACTIVE"
      );
      if (!isAssigned) {
        return res.status(403).json({ success: false, error: "NOT_ASSIGNED" });
      }
    }

    if (uyapDosyaNo) {
      const v = uyapService.validateEsasNo(uyapDosyaNo);
      if (!v.valid) {
        return res.status(400).json({
          success: false,
          error: v.reason,
          hint: v.hint,
        });
      }
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        uyapDosyaNo: uyapDosyaNo ?? lead.uyapDosyaNo,
        uyapMahkeme: uyapMahkeme ?? lead.uyapMahkeme,
        uyapDosyaTuru: uyapDosyaTuru ?? lead.uyapDosyaTuru,
        uyapDurum: uyapDurum ?? lead.uyapDurum,
        uyapNotlar: uyapNotlar ?? lead.uyapNotlar,
        uyapSonGuncelleme: new Date(),
      },
      select: {
        id: true,
        uyapDosyaNo: true,
        uyapMahkeme: true,
        uyapDosyaTuru: true,
        uyapDurum: true,
        uyapNotlar: true,
        uyapSonGuncelleme: true,
      },
    });

    // KVKK m.10 audit
    try {
      await prisma.activityLog.create({
        data: {
          leadId,
          action: "UYAP_MANUAL_UPDATED",
          detail: `Esas: ${updated.uyapDosyaNo || "—"} | Mahkeme: ${updated.uyapMahkeme || "—"} | Durum: ${updated.uyapDurum || "—"} (kullanıcı: ${req.user.id})`,
        },
      });
    } catch (_) {}

    res.json({ success: true, data: updated });
  })
);

// NOT: Duruşma takibi mevcut "Durusma" modeli + /api/leads/:id/durusmalar endpoint'leri
// (hukuk.routes.js) ile yapılır. Madde 14.3 — duplikat yasak, Hearing modeli eklenmez.

module.exports = router;
