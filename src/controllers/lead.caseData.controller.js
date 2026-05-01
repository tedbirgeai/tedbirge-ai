"use strict";

const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { assertLeadAccess } = require("../utils/leadAccess");

// Rol bazli izinli alanlar
const MUHATAP_FIELDS = ["muhatapTipi","muhatapAdi","muhatapTespitKaynagi","muhatapGuvenSkoru","muhatapGerekce"];

const FIELDS_BY_ROLE = {
  ADMIN:          ["accidentDate","age","monthlyIncome","maluliyetRate","faultRate","maluliyetOrani","kusurOrani","gercekTazminat","yaralanmaTuru",...MUHATAP_FIELDS],
  SALES:          ["accidentDate","age","monthlyIncome","maluliyetRate","faultRate","maluliyetOrani","kusurOrani","gercekTazminat","yaralanmaTuru",...MUHATAP_FIELDS],
  LAWYER:         ["accidentDate","age","monthlyIncome","maluliyetRate","faultRate","maluliyetOrani","kusurOrani","gercekTazminat","yaralanmaTuru",...MUHATAP_FIELDS],
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
  if (field === "yaralanmaTuru" || field === "muhatapAdi" || field === "muhatapTespitKaynagi" || field === "muhatapGerekce") {
    if (typeof value !== "string") return { ok: false, reason: "must be string" };
    return { ok: true, value: value };
  }
  if (field === "muhatapTipi") {
    const valid = ["TRAFIK_SIGORTASI","KASKO","FERDI_KAZA_KOLTUK","TMTB","GUVENCE_HESABI","ISVEREN","SGK","HASTANE","TARSIM","DASK","SORUMLU_UCUNCU_KISI","KAMU_KURUMU","DIGER"];
    if (!valid.includes(value)) return { ok: false, reason: "invalid MuhatapTipi" };
    return { ok: true, value: value };
  }
  if (field === "muhatapGuvenSkoru") {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > 1) return { ok: false, reason: "must be 0-1" };
    return { ok: true, value: n };
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

  // TUR #55 A21 — gercekTazminat doldurulduysa otomatik CommissionLog tetikle
  if (data.gercekTazminat && Number(data.gercekTazminat) > 0) {
    try {
      const commissionService = require("../services/commission.service");
      commissionService.createFromLead(id).catch((err) =>
        console.warn("[COMMISSION_AUTO_TRIGGER]", err.message)
      );
    } catch (e) {
      console.warn("[COMMISSION_AUTO_TRIGGER] import:", e.message);
    }
  }

  return res.json({ success: true, lead: updated });
});
