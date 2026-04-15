const express = require("express");
const controller = require("../controllers/document.controller");
const auth = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/:id/download", auth, controller.downloadDocument);

module.exports = router;
