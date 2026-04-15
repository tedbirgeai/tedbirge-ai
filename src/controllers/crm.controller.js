const asyncHandler = require("../utils/asyncHandler");
const { getDashboardStats } = require("../services/crm.service");

exports.getDashboard = asyncHandler(async (req, res) => {
  const stats = await getDashboardStats();
  res.json({ success: true, data: stats });
});
