const asyncHandler = require("../utils/asyncHandler");
const chatService = require("../services/chat.service");

exports.sendMessage = asyncHandler(async (req, res) => {
  const { sessionKey, leadId, message } = req.body;

  const userMessage = await chatService.addMessage({
    sessionKey,
    leadId,
    userId: req.user?.id || null,
    sender: "user",
    message
  });

  const autoReply = await chatService.buildAutoReply(message);

  const botMessage = await chatService.addMessage({
    sessionKey,
    leadId,
    userId: req.user?.id || null,
    sender: "assistant",
    message: autoReply
  });

  res.json({
    success: true,
    data: {
      userMessage,
      botMessage
    }
  });
});

exports.getMessages = asyncHandler(async (req, res) => {
  const messages = await chatService.getMessages(req.params.sessionKey);
  res.json({ success: true, data: messages });
});
