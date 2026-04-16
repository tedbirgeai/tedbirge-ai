const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/db");
const { createPayment, verifyCallback, refundPayment } = require("../services/payment.service");

// ─── Ödeme başlat (iFrame token) ─────────────────────────────────────────────

exports.initiatePayment = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const { amount, description } = req.body;

  if (!leadId || !amount) {
    return res.status(400).json({ success: false, message: "leadId ve amount zorunludur." });
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return res.status(404).json({ success: false, message: "Lead bulunamadı." });

  const userIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
  const paymentAmountKurus = Math.round(Number(amount) * 100); // TL → kuruş

  const result = await createPayment({
    merchantOid:   lead.leadCode,
    paymentAmount: paymentAmountKurus,
    email:         lead.customerEmail || "musteri@tedbirge.ai",
    userIp:        userIp.replace("::ffff:", ""),
    userName:      lead.customerName,
    userAddress:   lead.city || "Türkiye",
    userPhone:     lead.customerPhone || "5000000000",
    basketItems:   [[description || "Hukuki Danışmanlık Hizmeti", paymentAmountKurus, 1]],
  });

  // DB'ye ödeme başlatıldı kaydı
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      odemeDetay: JSON.stringify({
        merchantOid:   lead.leadCode,
        paymentAmount: paymentAmountKurus,
        status:        "PENDING",
        initiatedAt:   new Date().toISOString(),
      }),
    },
  });

  res.json({ success: true, data: result });
});

// ─── PayTR Callback (POST — PayTR sunucusundan) ───────────────────────────────

exports.paymentCallback = asyncHandler(async (req, res) => {
  const result = verifyCallback(req.body);

  if (!result.valid) {
    return res.status(400).send("PAYTR_INVALID");
  }

  const lead = await prisma.lead.findUnique({ where: { leadCode: result.merchantOid } });
  if (!lead) return res.status(404).send("LEAD_NOT_FOUND");

  const existingDetail = lead.odemeDetay ? JSON.parse(lead.odemeDetay) : {};
  await prisma.lead.update({
    where: { leadCode: result.merchantOid },
    data: {
      odemeDetay: JSON.stringify({
        ...existingDetail,
        status:      result.status === "success" ? "PAID" : "FAILED",
        totalAmount: result.totalAmount,
        paidAt:      result.status === "success" ? new Date().toISOString() : null,
      }),
    },
  });

  await prisma.activityLog.create({
    data: {
      leadId: lead.id,
      action: result.status === "success" ? "ODEME_BASARILI" : "ODEME_BASARISIZ",
      detail: `PayTR ödeme — ${result.merchantOid} — tutar: ${result.totalAmount}`,
    },
  });

  res.send("OK"); // PayTR "OK" cevabı bekler
});

// ─── Ödeme durumu sorgula ─────────────────────────────────────────────────────

exports.getPaymentStatus = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { odemeDetay: true } });
  if (!lead) return res.status(404).json({ success: false, message: "Lead bulunamadı." });

  const detail = lead.odemeDetay ? JSON.parse(lead.odemeDetay) : null;
  res.json({ success: true, data: detail });
});

// ─── İade ────────────────────────────────────────────────────────────────────

exports.refund = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const { amount } = req.body;

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return res.status(404).json({ success: false, message: "Lead bulunamadı." });

  const detail = lead.odemeDetay ? JSON.parse(lead.odemeDetay) : {};
  if (detail.status !== "PAID") {
    return res.status(400).json({ success: false, message: "Ödenmiş işlem bulunamadı." });
  }

  const returnAmountKurus = amount ? Math.round(Number(amount) * 100) : Number(detail.totalAmount || 0);
  const result = await refundPayment(lead.leadCode, returnAmountKurus);

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      odemeDetay: JSON.stringify({ ...detail, status: "REFUNDED", refundedAt: new Date().toISOString() }),
    },
  });

  await prisma.activityLog.create({
    data: { leadId: lead.id, action: "ODEME_IADE", detail: `PayTR iade — tutar: ${returnAmountKurus}` },
  });

  res.json({ success: true, data: result });
});
