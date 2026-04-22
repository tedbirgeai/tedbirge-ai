// src/controllers/muhatapAI.controller.js
// W1-M3.5 — AI muhatap öneri + onay

const prisma = require("../config/db");
const { muhatapOner } = require("../services/muhatapAI.service");

// POST /api/leads/:id/muhatap-ai
// Salt okunur: AI'ye sor, sonucu döndür, DB'ye yazma. Hukukçu "Onayla" derse /onay çağrılır.
async function oneriAl(req, res) {
  try {
    const { id } = req.params;
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return res.status(404).json({ error: "Lead bulunamadi" });

    const oneri = await muhatapOner(lead);
    return res.json({
      ok: true,
      oneri,
      leadId: id,
      mevcutMuhatapTipi: lead.muhatapTipi || null,
      mevcutKaynak: lead.muhatapTespitKaynagi || null,
    });
  } catch (err) {
    console.error("[muhatapAI.oneriAl] HATA:", err);
    return res.status(500).json({ error: err.message || "AI hatasi" });
  }
}

// POST /api/leads/:id/muhatap-ai/onay
// Body: { muhatapTipi, muhatapAdi, guvenSkoru, gerekce }
async function oneriOnayla(req, res) {
  try {
    const { id } = req.params;
    const { muhatapTipi, muhatapAdi, guvenSkoru, gerekce } = req.body;

    if (!muhatapTipi) return res.status(400).json({ error: "muhatapTipi zorunlu" });

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        muhatapTipi,
        muhatapAdi: muhatapAdi || null,
        muhatapTespitKaynagi: "AI",
        muhatapGuvenSkoru: typeof guvenSkoru === "number" ? guvenSkoru : null,
        muhatapGerekce: gerekce || null,
      },
    });

    return res.json({ ok: true, lead: updated });
  } catch (err) {
    console.error("[muhatapAI.oneriOnayla] HATA:", err);
    return res.status(500).json({ error: err.message || "Onay hatasi" });
  }
}

module.exports = { oneriAl, oneriOnayla };
