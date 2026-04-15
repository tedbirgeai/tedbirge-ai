const prisma = require("../config/db");
const { calculateCompensation } = require("../utils/calculateCompensation");

async function getOrCreateSession(sessionKey, leadId = null, userId = null) {
  let session = await prisma.chatSession.findUnique({ where: { sessionKey } });

  if (!session) {
    session = await prisma.chatSession.create({
      data: {
        sessionKey,
        leadId,
        userId
      }
    });
  }

  return session;
}

async function addMessage({ sessionKey, leadId = null, userId = null, sender, message, metadata = null }) {
  const session = await getOrCreateSession(sessionKey, leadId, userId);

  return prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      leadId,
      sender,
      message,
      metadataJson: metadata ? JSON.stringify(metadata) : null
    }
  });
}

async function getMessages(sessionKey) {
  const session = await prisma.chatSession.findUnique({
    where: { sessionKey },
    include: { messages: { orderBy: { createdAt: "asc" } } }
  });

  if (!session) return [];
  return session.messages;
}

async function buildAutoReply(text) {
  const lower = (text || "").toLowerCase();

  if (lower.includes("tazminat") || lower.includes("ne kadar")) {
    const result = calculateCompensation({ injurySeverity: "medium" });
    return `On incelemeye gore tahmini tazminat araliginiz yaklasik ${result.netEstimate.toLocaleString("tr-TR")} TL civarinda olabilir. Kesin hesap icin evrak analizi gerekir.`;
  }

  if (lower.includes("evrak") || lower.includes("belge")) {
    return "Daha dogru analiz icin kaza tespit tutanagi, hastane raporu, epikriz, kimlik ve varsa sigorta evraklarini yukleyebilirsiniz.";
  }

  return "Gecmis olsun. Kaza tarihi, yaralanma durumu ve mevcut evraklarinizi paylasabilirsiniz.";
}

module.exports = {
  getOrCreateSession,
  addMessage,
  getMessages,
  buildAutoReply
};
