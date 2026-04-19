const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/db");
const { sendOnayBildirim } = require("../services/sms.service");

// ─── Hukukçu Onay Listesi ─────────────────────────────────────────────────────

exports.listHukukcuOnay = asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { role: "LAWYER" },
    select: {
      id: true, fullName: true, email: true, phone: true,
      baroSicilNo: true, uzmanlik: true, hukukcuKomisyon: true,
      baroOnayDurumu: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({ success: true, data: users });
});

// ─── Hukukçu Onayla ───────────────────────────────────────────────────────────

exports.onaylaHukukcu = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.update({
    where: { id },
    data: { baroOnayDurumu: "ONAYLANDI" },
    select: { id: true, fullName: true, baroOnayDurumu: true },
  });
  await prisma.activityLog.create({
    data: { action: "HUKUKCU_ONAYLANDI", detail: `${user.fullName} (${id}) yönetici tarafından onaylandı.` },
  });
  res.json({ success: true, data: user });
});

// ─── Hukukçu Reddet ───────────────────────────────────────────────────────────

exports.reddetHukukcu = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sebep } = req.body;
  const user = await prisma.user.update({
    where: { id },
    data: { baroOnayDurumu: "REDDEDILDI" },
    select: { id: true, fullName: true, baroOnayDurumu: true },
  });
  await prisma.activityLog.create({
    data: { action: "HUKUKCU_REDDEDILDI", detail: `${user.fullName} (${id}) reddedildi. Sebep: ${sebep || "—"}` },
  });
  res.json({ success: true, data: user });
});

// ─── Temsilci Onay Listesi ────────────────────────────────────────────────────

exports.listTemsilciOnay = asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { role: "REPRESENTATIVE" },
    select: {
      id: true, fullName: true, email: true, phone: true,
      bolge: true, primOrani: true,
      temsilciOnayDurumu: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({ success: true, data: users });
});

// ─── Temsilci Onayla ──────────────────────────────────────────────────────────

exports.onaylaTemsilci = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.update({
    where: { id },
    data: { temsilciOnayDurumu: "ONAYLANDI" },
    select: { id: true, fullName: true, phone: true, temsilciOnayDurumu: true },
  });
  // SMS bildirim — başarısız olsa bile onay akışını bozma (fail-silent)
  if (user.phone) {
    try {
      await sendOnayBildirim(user.phone, "temsilci");
    } catch (smsError) {
      console.error("[SMS] Onay bildirimi gonderilemedi:", smsError?.message);
      // Akışa devam, onay geçerli
    }
  }
  await prisma.activityLog.create({
    data: { action: "TEMSILCI_ONAYLANDI", detail: `${user.fullName} (${id}) yönetici tarafından onaylandı.` },
  });
  res.json({ success: true, data: user });
});

// ─── Temsilci Reddet ──────────────────────────────────────────────────────────

exports.reddetTemsilci = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sebep } = req.body;
  const user = await prisma.user.update({
    where: { id },
    data: { temsilciOnayDurumu: "REDDEDILDI" },
    select: { id: true, fullName: true, temsilciOnayDurumu: true },
  });
  await prisma.activityLog.create({
    data: { action: "TEMSILCI_REDDEDILDI", detail: `${user.fullName} (${id}) reddedildi. Sebep: ${sebep || "—"}` },
  });
  res.json({ success: true, data: user });
});
