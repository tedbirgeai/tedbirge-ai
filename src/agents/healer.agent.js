// TUR #55 A24 — Healer: otomatik küçük düzeltmeler (her 10 dk)

const BaseAgent = require("./base.agent");
const prisma = require("../config/db");

class HealerAgent extends BaseAgent {
  constructor() {
    super("Healer", { intervalMs: 10 * 60_000 });
  }

  async run() {
    const fixes = [];

    // 1. Eksik CommissionLog otomatik üret (gercekTazminat var ama log yok)
    const wonNoLog = await prisma.lead.findMany({
      where: {
        status: "WON",
        gercekTazminat: { not: null },
        commissionLogs: { none: {} },
      },
      select: { id: true, gercekTazminat: true },
      take: 20,
    });
    for (const lead of wonNoLog) {
      try {
        const commissionService = require("../services/commission.service");
        await commissionService.createFromLead(lead.id);
        fixes.push({ key: "AUTO_COMMISSION_LOG", leadId: lead.id });
      } catch (e) {}
    }

    // 2. Aciliyet otomatik tetikle: zamanaşımı yaklaşan trafik kazaları (2 yıl, 60 günden az kalan)
    const trafikYaklasan = await prisma.lead.findMany({
      where: {
        accidentType: "TRAFIK",
        accidentDate: {
          gte: new Date(Date.now() - (2 * 365 - 60) * 86_400_000),
          lt: new Date(Date.now() - (2 * 365 - 60) * 86_400_000 + 86_400_000),
        },
        aciliyet: { not: "KRITIK" },
      },
      select: { id: true },
      take: 10,
    });
    for (const lead of trafikYaklasan) {
      await prisma.lead.update({ where: { id: lead.id }, data: { aciliyet: "KRITIK" } });
      fixes.push({ key: "ACILIYET_KRITIK_AUTO", leadId: lead.id });
    }

    // 3. Eski tüketilmeyen RealtimeEvent temizle (7 gün)
    const purgeResult = await prisma.realtimeEvent.deleteMany({
      where: { consumed: true, createdAt: { lt: new Date(Date.now() - 7 * 86_400_000) } },
    });
    if (purgeResult.count > 0) fixes.push({ key: "REALTIME_PURGE", count: purgeResult.count });

    // 4. Eski AgentEvent temizle (30 gün, INFO sadece)
    const oldInfo = await prisma.agentEvent.deleteMany({
      where: { severity: "INFO", createdAt: { lt: new Date(Date.now() - 30 * 86_400_000) } },
    });
    if (oldInfo.count > 0) fixes.push({ key: "AGENT_LOG_PURGE", count: oldInfo.count });

    if (fixes.length === 0) {
      await this.log("HEAL_NOTHING_TO_DO", "INFO");
    } else {
      await this.log("HEAL_APPLIED", "INFO", { fixes });
    }
  }
}

module.exports = HealerAgent;
