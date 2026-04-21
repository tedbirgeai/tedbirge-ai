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

module.exports = { assignLeadToLawyer };
