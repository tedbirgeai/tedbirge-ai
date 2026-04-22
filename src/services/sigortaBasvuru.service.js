/**
 * SİGORTA BAŞVURU SERVİSİ — W1-M5
 *
 * IhtarnameTakip tablosunu kullanır, tur="SIGORTA_BASVURU" ile ayrıştırılır.
 * Schema değişikliği yok.
 *
 * Alan mapping:
 *   karsiTaraf   → muhatapAdi
 *   teklifTutari → talepTutari (talep edilen tutar)
 *   notlar       → JSON { muhatapTipi, muhatapKepAdres, muhatapEmail, muhatapAdres, talepAciklama }
 */

const prisma = require("../config/db");

const TUR = "SIGORTA_BASVURU";

function parseNotlar(notlar) {
  if (!notlar) return {};
  try {
    return JSON.parse(notlar);
  } catch {
    return { talepAciklama: notlar };
  }
}

function buildNotlar(data) {
  return JSON.stringify({
    muhatapTipi: data.muhatapTipi || null,
    muhatapKepAdres: data.muhatapKepAdres || null,
    muhatapEmail: data.muhatapEmail || null,
    muhatapAdres: data.muhatapAdres || null,
    talepAciklama: data.talepAciklama || "",
  });
}

function toView(record) {
  if (!record) return null;
  const extra = parseNotlar(record.notlar);
  return {
    id: record.id,
    leadId: record.leadId,
    lead: record.lead || undefined,
    muhatapAdi: record.karsiTaraf || "",
    muhatapTipi: extra.muhatapTipi || null,
    muhatapKepAdres: extra.muhatapKepAdres || null,
    muhatapEmail: extra.muhatapEmail || null,
    muhatapAdres: extra.muhatapAdres || null,
    talepAciklama: extra.talepAciklama || "",
    talepTutari: record.teklifTutari || null,
    durum: record.durum,
    gonderimTarihi: record.gonderimTarihi,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function createBasvuru({ leadId, data }) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead bulunamadı");

  const record = await prisma.ihtarnameTakip.create({
    data: {
      leadId,
      tur: TUR,
      karsiTaraf: data.muhatapAdi || lead.muhatapAdi || "",
      durum: "HAZIRLANIYOR",
      teklifTutari: data.talepTutari ? parseFloat(data.talepTutari) : null,
      notlar: buildNotlar({
        muhatapTipi: data.muhatapTipi || (lead.muhatapTipi ? String(lead.muhatapTipi) : null),
        muhatapKepAdres: data.muhatapKepAdres,
        muhatapEmail: data.muhatapEmail,
        muhatapAdres: data.muhatapAdres,
        talepAciklama: data.talepAciklama,
      }),
    },
  });

  return toView(record);
}

async function getBasvurularByLeadId(leadId) {
  const records = await prisma.ihtarnameTakip.findMany({
    where: { leadId, tur: TUR },
    orderBy: { createdAt: "desc" },
  });
  return records.map(toView);
}

async function getBasvuru(id) {
  const record = await prisma.ihtarnameTakip.findUnique({
    where: { id },
    include: {
      lead: { select: { id: true, leadCode: true, customerName: true } },
    },
  });
  if (!record || record.tur !== TUR) return null;
  return toView(record);
}

async function updateStatus(id, { durum, teklifTutari, teklifTarihi }) {
  const data = { durum };
  if (teklifTutari !== undefined) data.teklifTutari = parseFloat(teklifTutari);
  if (teklifTarihi !== undefined) data.teklifTarihi = new Date(teklifTarihi);

  const record = await prisma.ihtarnameTakip.update({ where: { id }, data });
  return toView(record);
}

module.exports = {
  createBasvuru,
  getBasvurularByLeadId,
  getBasvuru,
  updateStatus,
};
