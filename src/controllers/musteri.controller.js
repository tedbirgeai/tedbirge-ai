const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/db");
const { sendOtpSms } = require("../services/sms.service");

// ─── Dashboard ─────────────────────────────────────────────────────────────

exports.getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Müvekkile ait lead (ownerId ile bağlı)
  const lead = await prisma.lead.findFirst({
    where: { ownerId: userId },
    include: {
      documents: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true, originalName: true, status: true,
          createdAt: true, aiAnalysis: true,
        },
      },
      contracts: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true, type: true, status: true, title: true,
          createdAt: true, musteriOnayladi: true, musteriOnayTarihi: true,
        },
      },
      assignments: {
        where: { isActive: true },
        include: {
          lawyer: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
        },
      },
      masraflar: {
        orderBy: { tarih: "desc" },
        select: { id: true, tur: true, tutar: true, tarih: true, aciklama: true, odendi: true },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { id: true, action: true, detail: true, createdAt: true },
      },
    },
  });

  if (!lead) {
    return res.json({ success: true, data: null });
  }

  res.json({ success: true, data: lead });
});

// ─── Mesajlar ──────────────────────────────────────────────────────────────

exports.getMessages = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const lead = await prisma.lead.findFirst({ where: { ownerId: userId }, select: { id: true } });
  if (!lead) return res.json({ success: true, data: [] });

  // lead'e bağlı tüm mesajları getir (avukat-müvekkil)
  const messages = await prisma.chatMessage.findMany({
    where: { leadId: lead.id },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      id: true, sender: true, message: true, createdAt: true, leadId: true,
    },
  });

  res.json({ success: true, data: messages });
});

exports.sendMessage = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ success: false, message: "Mesaj boş olamaz." });

  const lead = await prisma.lead.findFirst({ where: { ownerId: userId }, select: { id: true } });
  if (!lead) return res.status(404).json({ success: false, message: "Dosyanız bulunamadı." });

  // Oturum anahtarı: lead'e bağlı sabit
  const sessionKey = `muvekkil-${lead.id}`;
  let session = await prisma.chatSession.findUnique({ where: { sessionKey } });
  if (!session) {
    session = await prisma.chatSession.create({
      data: { sessionKey, leadId: lead.id, userId },
    });
  }

  const msg = await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      leadId: lead.id,
      sender: "user",
      message: message.trim(),
    },
  });

  // ActivityLog
  await prisma.activityLog.create({
    data: {
      leadId: lead.id,
      action: "MUVEKKIL_MESAJ",
      detail: `Müvekkil mesaj gönderdi: ${message.trim().slice(0, 100)}`,
    },
  });

  res.status(201).json({ success: true, data: msg });
});

// ─── Dijital SMS Onay ─────────────────────────────────────────────────────

exports.startApproval = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { contractId } = req.params;

  // Sözleşmenin bu müvekkile ait olduğunu doğrula
  const lead = await prisma.lead.findFirst({ where: { ownerId: userId }, select: { id: true, customerPhone: true } });
  if (!lead) return res.status(404).json({ success: false, message: "Dosyanız bulunamadı." });

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, leadId: lead.id },
  });
  if (!contract) return res.status(404).json({ success: false, message: "Sözleşme bulunamadı." });
  if (contract.musteriOnayladi) return res.status(400).json({ success: false, message: "Sözleşme zaten onaylandı." });

  // 6 haneli OTP üret
  const kod = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika

  await prisma.contract.update({
    where: { id: contractId },
    data: { onayKodu: kod, onayKoduExpires: expires },
  });

  // OTP SMS gönder (mock modda konsola yazar)
  await sendOtpSms(lead.customerPhone, kod, "sozlesme onay");

  res.json({ success: true, message: `Onay kodu ${lead.customerPhone} numarasına gönderildi.` });
});

exports.verifyApproval = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { contractId } = req.params;
  const { kod } = req.body;

  if (!kod) return res.status(400).json({ success: false, message: "Onay kodu gerekli." });

  const lead = await prisma.lead.findFirst({ where: { ownerId: userId }, select: { id: true } });
  if (!lead) return res.status(404).json({ success: false, message: "Dosyanız bulunamadı." });

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, leadId: lead.id },
  });
  if (!contract) return res.status(404).json({ success: false, message: "Sözleşme bulunamadı." });
  if (contract.musteriOnayladi) return res.status(400).json({ success: false, message: "Sözleşme zaten onaylandı." });
  if (!contract.onayKodu || contract.onayKodu !== String(kod).trim()) {
    return res.status(400).json({ success: false, message: "Onay kodu hatalı." });
  }
  if (contract.onayKoduExpires && new Date(contract.onayKoduExpires) < new Date()) {
    return res.status(400).json({ success: false, message: "Onay kodunun süresi dolmuş. Yeni kod isteyin." });
  }

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: {
      musteriOnayladi: true,
      musteriOnayTarihi: new Date(),
      onayKodu: null,
      onayKoduExpires: null,
      status: "SIGNED",
    },
  });

  await prisma.activityLog.create({
    data: {
      leadId: lead.id,
      action: "SOZLESME_MUVEKKIL_ONAY",
      detail: `Müvekkil ${contract.title} sözleşmesini dijital olarak onayladı.`,
    },
  });

  res.json({ success: true, data: updated, message: "Sözleşme başarıyla onaylandı." });
});
