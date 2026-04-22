const { getLeadTimeline } = require("../services/timeline.service");
const { assertLeadAccess } = require("../utils/leadAccess");
const { PrismaClient } = require("@prisma/client");
const asyncHandler = require("../utils/asyncHandler");

const prisma = new PrismaClient();

const getTimeline = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return res.status(404).json({ message: "Lead bulunamadı" });

  assertLeadAccess(req.user, lead);

  const events = await getLeadTimeline(id);
  res.json({ events, total: events.length });
});

module.exports = { getTimeline };
