const asyncHandler = require("../utils/asyncHandler");
const { assignLeadToLawyer } = require("../services/assignment.service");

exports.assignLead = asyncHandler(async (req, res) => {
  const result = await assignLeadToLawyer({
    leadId: req.params.leadId,
    lawyerId: req.body.lawyerId,
    note: req.body.note
  });

  res.json({ success: true, data: result });
});
