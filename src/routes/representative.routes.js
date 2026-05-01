// TUR #57 A2 — REPRESENTATIVE Pipeline aşama geçişi (Kanban drag-drop backend)

const express = require("express");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/db");

const router = express.Router();

// Pipeline slug → Lead.status mapping
const SLUG_TO_STATUS = {
  yeni: "NEW",
  dosya: "DOCS_PENDING",
  sozlesme: "CONTRACT_PENDING",
  tahsilat: "ASSIGNED_TO_LAWYER",
  komisyon: "WON",
};

// State machine: hangi pipeline geçişine izin var
const ASAMA_GECISI = {
  yeni: ["dosya"],
  dosya: ["sozlesme", "yeni"], // geri dönüş
  sozlesme: ["tahsilat", "dosya"],
  tahsilat: ["komisyon", "sozlesme"],
  komisyon: [], // final, geri dönüş yok
};

// POST /api/representative/leads/:id/asama
router.post(
  "/representative/leads/:id/asama",
  auth,
  role("REPRESENTATIVE", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { fromStage, toStage } = req.body || {};

    if (!fromStage || !toStage) {
      return res.status(400).json({ success: false, message: "fromStage ve toStage zorunlu" });
    }
    if (!SLUG_TO_STATUS[fromStage] || !SLUG_TO_STATUS[toStage]) {
      return res.status(400).json({ success: false, message: "Bilinmeyen pipeline asamasi" });
    }

    // Geçerli geçiş mi?
    const allowed = ASAMA_GECISI[fromStage] || [];
    if (!allowed.includes(toStage)) {
      return res.status(409).json({ success: false, message: `${fromStage} -> ${toStage} gecisi yasakli` });
    }

    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { id: true, createdById: true, ownerId: true, status: true },
    });
    if (!lead) return res.status(404).json({ success: false, message: "Lead bulunamadi" });

    // REPRESENTATIVE sadece kendi lead'leri (createdBy ile)
    if (req.user.role === "REPRESENTATIVE" && lead.createdById !== req.user.id) {
      return res.status(403).json({ success: false, message: "Bu lead size atanmamis" });
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: { status: SLUG_TO_STATUS[toStage] },
    });

    // AgentEvent log (Madde 30)
    try {
      await prisma.agentEvent.create({
        data: {
          agentName: "system",
          eventType: "LEAD_ASAMA_GUNCELLENDI",
          severity: "INFO",
          payload: { leadId: id, fromStage, toStage, userId: req.user.id },
        },
      });
    } catch (e) {
      // AgentEvent yazılamazsa ana akış kesilmesin
    }

    res.json({ success: true, lead: updated });
  })
);

module.exports = router;
