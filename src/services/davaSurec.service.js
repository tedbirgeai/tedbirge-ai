const prisma = require("../config/db");

async function getDavaSurec(leadId) {
  return prisma.davaSurec.findUnique({ where: { leadId } });
}

async function upsertDavaSurec(leadId, data) {
  return prisma.davaSurec.upsert({
    where: { leadId },
    create: {
      leadId,
      asama: data.asama || "HAZIRLIK",
      mahkeme: data.mahkeme || null,
      dosyaNo: data.dosyaNo || null,
      davaTarihi: data.davaTarihi ? new Date(data.davaTarihi) : null,
      davaTuru: data.davaTuru || null,
      karsiTaraf: data.karsiTaraf || null,
      bilirkisiVar: data.bilirkisiVar ?? false,
      uzlasmaDenemesi: data.uzlasmaDenemesi ?? 0,
      uzlasmaTeklif: data.uzlasmaTeklif ?? null,
      karar: data.karar || null,
      kararTarihi: data.kararTarihi ? new Date(data.kararTarihi) : null,
      istinafVar: data.istinafVar ?? false,
      yargitayVar: data.yargitayVar ?? false,
      icraTakibi: data.icraTakibi ?? false,
      tahsilatTutar: data.tahsilatTutar ?? null,
      notlar: data.notlar || null,
    },
    update: {
      asama: data.asama,
      mahkeme: data.mahkeme,
      dosyaNo: data.dosyaNo,
      davaTarihi: data.davaTarihi ? new Date(data.davaTarihi) : undefined,
      davaTuru: data.davaTuru,
      karsiTaraf: data.karsiTaraf,
      bilirkisiVar: data.bilirkisiVar,
      uzlasmaDenemesi: data.uzlasmaDenemesi,
      uzlasmaTeklif: data.uzlasmaTeklif,
      karar: data.karar,
      kararTarihi: data.kararTarihi ? new Date(data.kararTarihi) : undefined,
      istinafVar: data.istinafVar,
      yargitayVar: data.yargitayVar,
      icraTakibi: data.icraTakibi,
      tahsilatTutar: data.tahsilatTutar,
      notlar: data.notlar,
    },
  });
}

async function updateAsama(leadId, asama) {
  return prisma.davaSurec.upsert({
    where: { leadId },
    create: { leadId, asama },
    update: { asama },
  });
}

module.exports = { getDavaSurec, upsertDavaSurec, updateAsama };
