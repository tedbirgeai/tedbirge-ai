const asyncHandler = require("../utils/asyncHandler");
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
