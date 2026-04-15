const prisma = require("../config/db");
const analysisConfig = require("../config/analysis.config");
const Anthropic = require("@anthropic-ai/sdk");

const MODEL = "claude-sonnet-4-6";

async function listBilirkisi(leadId) {
  return prisma.bilirkisi.findMany({
    where: { leadId },
    orderBy: { createdAt: "desc" },
  });
}

async function createBilirkisi(leadId, data) {
  return prisma.bilirkisi.create({
    data: {
      leadId,
      atamaTarihi: data.atamaTarihi ? new Date(data.atamaTarihi) : null,
      teslimTarihi: data.teslimTarihi ? new Date(data.teslimTarihi) : null,
      raporGeldiMi: data.raporGeldiMi ?? false,
      raporTarihi: data.raporTarihi ? new Date(data.raporTarihi) : null,
      raporIcerigi: data.raporIcerigi || null,
      itirazEdildi: data.itirazEdildi ?? false,
      itirazTarihi: data.itirazTarihi ? new Date(data.itirazTarihi) : null,
      itirazIcerigi: data.itirazIcerigi || null,
    },
  });
}

async function updateBilirkisi(bilirkisiId, data) {
  return prisma.bilirkisi.update({
    where: { id: bilirkisiId },
    data: {
      atamaTarihi: data.atamaTarihi ? new Date(data.atamaTarihi) : undefined,
      teslimTarihi: data.teslimTarihi ? new Date(data.teslimTarihi) : undefined,
      raporGeldiMi: data.raporGeldiMi,
      raporTarihi: data.raporTarihi ? new Date(data.raporTarihi) : undefined,
      raporIcerigi: data.raporIcerigi,
      itirazEdildi: data.itirazEdildi,
      itirazTarihi: data.itirazTarihi ? new Date(data.itirazTarihi) : undefined,
      itirazIcerigi: data.itirazIcerigi,
    },
  });
}

async function analyzeBilirkisiRapor(bilirkisiId) {
  const bilirkisi = await prisma.bilirkisi.findUnique({ where: { id: bilirkisiId } });
  if (!bilirkisi) throw new Error("Bilirkişi kaydı bulunamadı.");
  if (!bilirkisi.raporIcerigi) throw new Error("Rapor içeriği girilmemiş.");

  let aiAnalizi;

  if (analysisConfig.analysisMode === "mock") {
    aiAnalizi =
      "[MOCK] Bilirkişi raporu analizi: Rapor içeriği incelendi. Maluliyet oranı ve kusur tespiti standart değerlere yakın görünmektedir. Avukat tarafından detaylı inceleme önerilir.";
  } else {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY gerekli.");
    const client = new Anthropic.default({ apiKey });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Aşağıdaki bilirkişi raporu metnini Türk hukuku açısından analiz et. Maluliyet oranı, kusur dağılımı, tazminat miktarı ve itiraz gerekip gerekmediği konularında kısa ve net bir değerlendirme yap (Türkçe, maks 300 kelime):\n\n${bilirkisi.raporIcerigi}`,
        },
      ],
    });
    aiAnalizi = response.content?.[0]?.text || "Analiz alınamadı.";
  }

  return prisma.bilirkisi.update({
    where: { id: bilirkisiId },
    data: { aiAnalizi },
  });
}

module.exports = { listBilirkisi, createBilirkisi, updateBilirkisi, analyzeBilirkisiRapor };
