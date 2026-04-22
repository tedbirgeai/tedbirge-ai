const express = require("express");
const controller = require("../controllers/upload.controller");
const auth = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const { supabaseUploadMiddleware } = require("../middlewares/uploadMiddleware");
const { uploadRateLimit } = require("../middlewares/rateLimiter");

const router = express.Router();

router.post("/:leadId", auth, uploadRateLimit, upload.array("files", 10), supabaseUploadMiddleware, controller.uploadLeadDocument);

module.exports = router;
