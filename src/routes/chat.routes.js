const express = require("express");
const controller = require("../controllers/chat.controller");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/send", controller.sendMessage);
router.get("/:sessionKey", controller.getMessages);

module.exports = router;
