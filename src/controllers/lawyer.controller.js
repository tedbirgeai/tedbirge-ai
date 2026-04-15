const asyncHandler = require("../utils/asyncHandler");
const { listLawyers, createLawyer } = require("../services/lawyer.service");

exports.listLawyers = asyncHandler(async (req, res) => {
  const lawyers = await listLawyers();
  res.json({ success: true, data: lawyers });
});

exports.createLawyer = asyncHandler(async (req, res) => {
  const lawyer = await createLawyer({
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone || null
  });
  res.status(201).json({ success: true, data: lawyer });
});
