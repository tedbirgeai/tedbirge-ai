"use strict";

const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { assertLeadAccess } = require("../utils/leadAccess");

// Rol bazli izinli alanlar
const FIELDS_BY_ROLE = {
  ADMIN:          ["accidentDate","age","monthlyIncome","maluliyetRate","faultRate","maluliyetOrani","kusurOrani","gercekTazminat","yaralanmaTuru"],
  SALES:          ["accidentDate","age","monthlyIncome","maluliyetRate","faultRate","maluliyetOrani","kusurOrani","gercekTazminat","yaralanmaTuru"],
  LAWYER:         ["accidentDate","age","monthlyIncome","maluliyetRate","faultRate","maluliyetOrani","kusurOrani","gercekTazminat","yaralanmaTuru"],
  REPRESENTATIVE: ["accidentDate"],
};

// Tip validasyonu
function validateValue(field, value) {
  if (value === null) return { ok: true, value: null };

  if (field === "accidentDate") {
    const d = new Date(value);
    if (isNaN(d.getTime())) return { ok: false, reason: "invalid date" };
    return { ok: true, value: d };
  }
  if (field === "age") {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0 || n > 120) return { ok: false, reason: "invalid age" };
    return { ok: true, value: n };
  }
  if (field === "yaralanmaTuru") {
    if (typeof value !== "string") return { ok: false, reason: "must be string" };
    return { ok: true, value: value };
  }
  // monthlyIncome, maluliyet*, faultRate, kusurOrani, gercekTazminat -> Float
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return { ok: false, reason: "invalid number" };
  return { ok: true, value: n };
}

exports.updateCaseData = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  const role = req.user?.role;

  const allowedFields = FIELDS_BY_ROLE[role];
  if (!allowedFields) {
    return res.status(403).json({ success: false, message: "Bu role izin verilmiyor" });
  }

  const requestedFields = Object.keys(body);
  if (requestedFields.length === 0) {
    return res.status(400).json({ success: false, message: "Guncellenecek alan yok" });
  }

  const disallowed = requestedFields.filter(f => !allowedFields.includes(f));
  if (disallowed.length > 0) {
    return res.status(403).json({
      success: false,
      message: `Bu alanlari guncelleme yetkiniz yok: ${disallowed.join(", ")}`
    });
  }

  // Her alani validate et
  const data = {};
  for (const field of requestedFields) {
    const v = validateValue(field, body[field]);
    if (!v.ok) {
      return res.status(400).json({ success: false, message: `${field}: ${v.reason}` });
    }
    data[field] = v.value;
  }

  // Lead'i bul + erisim kontrolu
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { assignments: true },
  });
  if (!lead) {
    return res.status(404).json({ success: false, message: "Lead bulunamadi" });
  }
  await assertLeadAccess(req.user, lead);

  // Guncelle
  const updated = await prisma.lead.update({
    where: { id },
    data,
    select: {
      id: true,
      ...Object.fromEntries(requestedFields.map(f => [f, true])),
    },
  });

  return res.json({ success: true, lead: updated });
});
