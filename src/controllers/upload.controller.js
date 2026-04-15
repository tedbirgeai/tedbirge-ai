const asyncHandler = require("../utils/asyncHandler");
const { uploadDocument } = require("../services/upload.service");

exports.uploadLeadDocument = asyncHandler(async (req, res) => {
  const document = await uploadDocument({
    leadId: req.params.leadId,
    file: req.file,
    uploadedById: req.user?.id || null
  });

  res.status(201).json({ success: true, data: document });
});
