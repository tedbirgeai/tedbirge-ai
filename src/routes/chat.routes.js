const express = require("express");
const controller = require("../controllers/chat.controller");

const router = express.Router();

router.post("/send", controller.sendMessage);
router.get("/:sessionKey", controller.getMessages);

module.exports = router;
