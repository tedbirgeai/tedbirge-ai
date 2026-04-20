const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { assertLeadAccess } = require("../utils/leadAccess");

exports.updateEstimatedCompensation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { estimatedCompensation } = req.body;

  if (typeof estimatedCompensation !== "number" || estimatedCompensation < 0) {
    return res.status(400).json({
      success: false,
      message: "estimatedCompensation must be a non-negative number",
    });
  }

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { assignments: true },
  });
  if (!lead) return res.status(404).json({ success: false, message: "Lead bulunamadi" });

  await assertLeadAccess(req.user, lead);

  const updated = await prisma.lead.update({
    where: { id },
    data: { estimatedCompensation },
    select: { id: true, estimatedCompensation: true },
  });

  return res.json({ success: true, estimatedCompensation: updated.estimatedCompensation });
});
