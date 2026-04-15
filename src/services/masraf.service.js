const prisma = require("../config/db");

async function listMasraflar(leadId) {
  return prisma.masraf.findMany({
    where: { leadId },
    orderBy: { tarih: "desc" },
  });
}

async function createMasraf(leadId, data) {
  return prisma.masraf.create({
    data: {
      leadId,
      tur: data.tur,
      tutar: parseFloat(data.tutar),
      tarih: data.tarih ? new Date(data.tarih) : new Date(),
      aciklama: data.aciklama || null,
      odendi: data.odendi ?? false,
    },
  });
}

module.exports = { listMasraflar, createMasraf };
