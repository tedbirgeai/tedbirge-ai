const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/db");
const {
  getLeadFunnel,
  getConversionRate,
  getRevenueEstimate,
  getLeadsBySource,
  getLawyerPerformance,
  getMonthlyTrend,
  getCalendarData,
  getKomisyonSummary,
  getBilirkisiSummary,
  getIletisimOzet,
  getKritikSureler,
} = require("../services/analytics.service");

exports.getFunnel = asyncHandler(async (req, res) => {
  const data = await getLeadFunnel();
  res.json({ success: true, data });
});

exports.getConversionRate = asyncHandler(async (req, res) => {
  const data = await getConversionRate();
  res.json({ success: true, data });
});

exports.getRevenueEstimate = asyncHandler(async (req, res) => {
  const data = await getRevenueEstimate();
  res.json({ success: true, data });
});

exports.getLeadsBySource = asyncHandler(async (req, res) => {
  const data = await getLeadsBySource();
  res.json({ success: true, data });
});

exports.getLawyerPerformance = asyncHandler(async (req, res) => {
  const data = await getLawyerPerformance();
  res.json({ success: true, data });
});

exports.getMonthlyTrend = asyncHandler(async (req, res) => {
  const months = parseInt(req.query.months) || 6;
  const data = await getMonthlyTrend(Math.min(12, Math.max(3, months)));
  res.json({ success: true, data });
});

exports.getCalendarData = asyncHandler(async (req, res) => {
  const now   = new Date();
  const year  = parseInt(req.query.year)  || now.getFullYear();
  const month = parseInt(req.query.month) || now.getMonth() + 1;
  const data  = await getCalendarData(year, month);
  res.json({ success: true, data });
});

exports.getKomisyonSummary = asyncHandler(async (req, res) => {
  const data = await getKomisyonSummary();
  res.json({ success: true, data });
});

exports.getBilirkisiSummary = asyncHandler(async (req, res) => {
  const data = await getBilirkisiSummary(req.user.id, req.user.role);
  res.json({ success: true, data });
});

exports.getIletisimOzet = asyncHandler(async (req, res) => {
  const data = await getIletisimOzet(req.user.id, req.user.role);
  res.json({ success: true, data });
});

exports.getKritikSureler = asyncHandler(async (req, res) => {
  const data = await getKritikSureler(req.user);
  res.json({ success: true, data });
});

exports.getMarketingMetrics = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate   = to   ? new Date(to)   : new Date();

  const [leadsBySource, leadsByUtmSource, leadsByUtmCampaign, leadsByStatus, allLeads, dailyLeads] =
    await Promise.all([
      prisma.lead.groupBy({
        by: ["source"],
        where: { createdAt: { gte: fromDate, lte: toDate } },
        _count: { id: true },
      }),
      prisma.lead.groupBy({
        by: ["utmSource"],
        where: { createdAt: { gte: fromDate, lte: toDate }, utmSource: { not: null } },
        _count: { id: true },
      }),
      prisma.lead.groupBy({
        by: ["utmCampaign"],
        where: { createdAt: { gte: fromDate, lte: toDate }, utmCampaign: { not: null } },
        _count: { id: true },
      }),
      prisma.lead.groupBy({
        by: ["status"],
        where: { createdAt: { gte: fromDate, lte: toDate } },
        _count: { id: true },
      }),
      prisma.lead.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate } },
        select: { qualificationScore: true },
      }),
      prisma.$queryRaw`
        SELECT DATE("createdAt") as date, COUNT(*)::int as count
        FROM "Lead"
        WHERE "createdAt" >= ${fromDate} AND "createdAt" <= ${toDate}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
    ]);

  const totalLeads = allLeads.length;
  const scoreDistribution = {
    yuksek:       allLeads.filter(l => (l.qualificationScore ?? 0) >= 70).length,
    orta:         allLeads.filter(l => (l.qualificationScore ?? 0) >= 40 && (l.qualificationScore ?? 0) < 70).length,
    dusuk:        allLeads.filter(l => (l.qualificationScore ?? 0) > 0  && (l.qualificationScore ?? 0) < 40).length,
    hesaplanmadi: allLeads.filter(l => !l.qualificationScore).length,
  };

  res.json({
    success: true,
    period: { from: fromDate.toISOString(), to: toDate.toISOString() },
    totalLeads,
    leadsBySource:      leadsBySource.map(s => ({ source: s.source || "(belirtilmemis)", count: s._count.id })),
    leadsByUtmSource:   leadsByUtmSource.map(s => ({ utmSource: s.utmSource, count: s._count.id })),
    leadsByUtmCampaign: leadsByUtmCampaign.map(s => ({ utmCampaign: s.utmCampaign, count: s._count.id })),
    conversionFunnel:   leadsByStatus.map(s => ({ status: s.status, count: s._count.id })),
    scoreDistribution,
    dailyLeads,
  });
});
