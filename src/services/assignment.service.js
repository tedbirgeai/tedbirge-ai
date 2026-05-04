const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");
const { sendLawyerAssignedSms } = require("./sms.service");
const { sendLawyerAssignedEmail } = require("./email.service");
const { sendLawyerAssignedNotification } = require("./whatsapp.service");

async function assignLeadToLawyer({ leadId, lawyerId, note, caller = null }) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new ApiError(404, "Lead bulunamadi");

  // REPRESENTATIVE sadece kendi oluşturduğu lead'lere avukat atayabilir
  if (caller?.role === "REPRESENTATIVE" && lead.createdById !== caller.id) {
    throw new ApiError(403, "Bu dosyaya atama yapma yetkiniz yok");
  }

  const lawyer = await prisma.user.findUnique({ where: { id: lawyerId } });
  if (!lawyer || lawyer.role !== "LAWYER") {
    throw new ApiError(400, "Gecerli bir avukat secilmedi");
  }

  const assignment = await prisma.assignment.create({
    data: {
      leadId,
      lawyerId,
      note,
      status: "ACTIVE"
    },
    include: {
      lawyer: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          baroSicilNo: true,
          uzmanlik: true
        }
      },
      lead: true
    }
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { status: "ASSIGNED_TO_LAWYER" }
  });

  await prisma.activityLog.create({
    data: {
      leadId,
      action: "LAWYER_ASSIGNED",
      detail: `${lawyer.fullName} adlı avukata atandı`
    }
  });

  // SMS + e-posta bildirimi — hata olursa sessizce geç
  sendLawyerAssignedSms(lead, lawyer.fullName).catch((err) =>
    console.error("[SMS] Avukat atama SMS gönderilemedi:", err.message)
  );
  sendLawyerAssignedEmail(lead, lawyer).catch((err) =>
    console.error("[EMAIL] Avukat atama e-postası gönderilemedi:", err.message)
  );
  sendLawyerAssignedNotification(lead, lawyer.fullName).catch((err) =>
    console.error("[WhatsApp] Avukat atama bildirimi gönderilemedi:", err.message)
  );

  // ActivityLog — bildirim kaydı
  await prisma.activityLog.create({
    data: {
      leadId,
      action: "BILDIRIM_GONDERILDI",
      detail: `Avukat atama bildirimi gönderildi (SMS + WhatsApp + e-posta). Avukat: ${lawyer.fullName}`,
    },
  }).catch(() => {});

  return assignment;
}

// TUR #72.5 H5 — Otomatik atama: kazaTuru -> uzmanlik eslesmesi + en az yuk
async function autoAssignLead(leadId) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { ok: false, reason: "lead_not_found" };

  // Mevcut atama varsa skip
  const existing = await prisma.assignment.count({
    where: { leadId, status: "ACTIVE" },
  });
  if (existing > 0) return { ok: false, reason: "already_assigned" };

  // Aktif avukatlar + ACTIVE assignment sayisi
  const lawyers = await prisma.user.findMany({
    where: { role: "LAWYER", isActive: true },
    select: {
      id: true,
      fullName: true,
      uzmanlik: true,
      _count: { select: { assignments: { where: { status: "ACTIVE" } } } },
    },
  });
  if (lawyers.length === 0) return { ok: false, reason: "no_active_lawyer" };

  // Uzmanlik eslesmesi (kazaTuru -> string match)
  const kazaTipi = (lead.kazaTuru || "").toLowerCase();
  const matched = lawyers.filter((l) => {
    const uz = Array.isArray(l.uzmanlik) ? l.uzmanlik.join(" ").toLowerCase() : "";
    if (!uz) return false;
    if (kazaTipi.includes("trafik") && uz.includes("trafik")) return true;
    if (kazaTipi.includes("is") && uz.includes("is")) return true;
    return false;
  });

  // Eslesme yoksa: tum aktif avukatlar arasindan en az yuklu
  const candidates = matched.length > 0 ? matched : lawyers;
  candidates.sort((a, b) => a._count.assignments - b._count.assignments);
  const chosen = candidates[0];

  if (!chosen) return { ok: false, reason: "no_candidate" };

  try {
    await assignLeadToLawyer({
      leadId,
      lawyerId: chosen.id,
      note: "Otomatik atama (TUR #72.5 navigation)",
      caller: null,
    });
    return { ok: true, lawyerId: chosen.id, lawyerName: chosen.fullName, matchType: matched.length > 0 ? "uzmanlik" : "yuk_dengesi" };
  } catch (err) {
    return { ok: false, reason: err.message?.slice(0, 80) };
  }
}

module.exports = { assignLeadToLawyer, autoAssignLead };
