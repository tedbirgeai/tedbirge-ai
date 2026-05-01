// TUR #55 A24 — Reporter: günlük özet (her 24 saatte bir, 09:00 simulated)

const BaseAgent = require("./base.agent");
const prisma = require("../config/db");

class ReporterAgent extends BaseAgent {
  constructor() {
    super("Reporter", { intervalMs: 60 * 60_000 }); // 1 saatte bir kontrol — günde 1 kez yazıyor
    this.lastReportDate = null;
  }

  async run() {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const hour = now.getHours();

    // Sadece saat 9'da ve aynı gün içinde rapor üretmediyse
    if (hour < 9 || this.lastReportDate === today) {
      return;
    }

    const last24h = new Date(Date.now() - 24 * 3600_000);

    const [
      yeniLead,
      tahsilatToplam,
      kvkkYeni,
      kariyerYeni,
      auditorBulgu,
    ] = await Promise.all([
      prisma.lead.count({ where: { createdAt: { gte: last24h } } }),
      prisma.commissionLog.aggregate({
        where: { createdAt: { gte: last24h } },
        _sum: { tahsilatBrut: true },
      }),
      prisma.dataSubjectRequest.count({ where: { receivedAt: { gte: last24h } } }),
      prisma.careerApplication.count({ where: { createdAt: { gte: last24h } } }).catch(() => 0),
      prisma.agentEvent.count({
        where: {
          agentName: "Auditor",
          severity: { in: ["WARNING", "CRITICAL"] },
          createdAt: { gte: last24h },
        },
      }),
    ]);

    const summary = {
      gun: today,
      yeniLead,
      tahsilatToplam: tahsilatToplam._sum?.tahsilatBrut?.toString() || "0",
      kvkkYeni,
      kariyerYeni,
      auditorBulgu,
    };

    await this.log("DAILY_REPORT", "INFO", summary);

    // ADMIN feed
    try {
      await prisma.realtimeEvent.create({
        data: {
          channel: "ADMIN_FEED",
          eventType: "DAILY_REPORT",
          payload: summary,
        },
      });
    } catch (e) {}

    this.lastReportDate = today;
  }
}

module.exports = ReporterAgent;
