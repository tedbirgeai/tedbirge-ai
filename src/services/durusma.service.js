const prisma = require("../config/db");

async function listDurusmalar(leadId) {
  return prisma.durusma.findMany({
    where: { leadId },
    orderBy: { tarih: "asc" },
  });
}

async function createDurusma(leadId, data) {
  return prisma.durusma.create({
    data: {
      leadId,
      tarih: new Date(data.tarih),
      mahkeme: data.mahkeme || null,
      saat: data.saat || null,
      tur: data.tur || "DURUSMA",
      aciklama: data.aciklama || null,
    },
  });
}

async function deleteDurusma(durusmaId) {
  return prisma.durusma.delete({ where: { id: durusmaId } });
}

// 3 gün içindeki duruşmaları getir (cron job için)
async function getUpcomingDurusmalar(withinDays = 3) {
  const now = new Date();
  const until = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
  return prisma.durusma.findMany({
    where: {
      tarih: { gte: now, lte: until },
      hatirlatildi: false,
    },
    include: {
      lead: {
        include: {
          assignments: {
            include: { lawyer: true },
            where: { status: "ACTIVE" },
            take: 1,
          },
        },
      },
    },
  });
}

async function markHatirlatildi(durusmaId) {
  return prisma.durusma.update({
    where: { id: durusmaId },
    data: { hatirlatildi: true },
  });
}

module.exports = { listDurusmalar, createDurusma, deleteDurusma, getUpcomingDurusmalar, markHatirlatildi };
