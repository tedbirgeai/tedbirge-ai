const prisma = require("../config/db");
const { calculateQualificationScore } = require("./analyzer.service");
const { runWorkflow } = require("./workflow.service");
const { buildDocumentDraftTexts } = require("./document-template.service");
const ApiError = require("../utils/ApiError");
const { assertLeadAccess, leadWhereByRole } = require("../utils/leadAccess");
const { generateLeadCode } = require("../utils/generateCode");
const { calculateCompensation } = require("../utils/calculateCompensation");
const { sendStatusChangeSms, sendSms } = require("./sms.service");
const { sendApplicationReceivedEmail } = require("./email.service");
const { sendNewLeadNotification } = require("./whatsapp.service");
const { sendToUser, sendToRole } = require("./pushNotification.service");

async function createLead(data, ownerId = null, createdById = null) {
  if (!data.customerName || !data.customerPhone) {
    throw new ApiError(400, "customerName ve customerPhone zorunludur");
  }

  const compensation = calculateCompensation(data.compensationInput || {});

  const lead = await prisma.lead.create({
    data: {
      leadCode: generateLeadCode(),
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || null,
      city: data.city || null,
      accidentSummary: data.accidentSummary || null,
      injurySeverity: data.injurySeverity || null,
      accidentDate: data.accidentDate ? new Date(data.accidentDate) : null,
      accidentType: data.accidentType || null,
      estimatedCompensation: compensation.netEstimate,
      kvkkConsentAt: data.kvkkConsentAt || null,
      healthDataConsentAt: data.healthDataConsentAt || null,
      qualificationScore: data.qualificationScore ?? 0,
      status: data.status || "NEW",
      source: data.source || null,
      utmSource: data.utmSource || null,
      utmMedium: data.utmMedium || null,
      utmCampaign: data.utmCampaign || null,
      ownerId,
      createdById: createdById || ownerId   // Oluşturan kullanıcı (SALES/REP); yoksa ownerId fallback
    }
  });

  await prisma.activityLog.create({
    data: {
      leadId: lead.id,
      action: "LEAD_CREATED",
      detail: `Lead olusturuldu. Tahmini tazminat: ${compensation.netEstimate}`
    }
  });

  // ── Başvuru bildirimleri ──────────────────────────────────────────────────
  const basvuruMsg = `Sayin ${lead.customerName}, Tedbirge'ye basvurunuz alindi. Takip kodunuz: ${lead.leadCode}. Sorgula: tedbirge.ai/basvuru-sorgula`;

  // SMS
  sendSms(lead.customerPhone, basvuruMsg).catch((err) =>
    console.error("[SMS] Başvuru SMS gönderilemedi:", err.message)
  );
  // E-posta
  sendApplicationReceivedEmail(lead).catch((err) =>
    console.error("[EMAIL] Başvuru e-postası gönderilemedi:", err.message)
  );
  // WhatsApp
  sendNewLeadNotification(lead).catch((err) =>
    console.error("[WhatsApp] Yeni başvuru bildirimi gönderilemedi:", err.message)
  );

  // ActivityLog — bildirim gönderildi
  await prisma.activityLog.create({
    data: { leadId: lead.id, action: "BILDIRIM_GONDERILDI", detail: `Başvuru alındı bildirimi gönderildi (SMS + WhatsApp + e-posta). Takip: ${lead.leadCode}` },
  }).catch(() => {});

  // Nitelendirme skoru — async, bloke etmez
  calculateQualificationScore(lead.id).catch((err) =>
    console.error("[QUALIFY] Skor tetiklenemedi:", err.message)
  );

  return lead;
}

// REPRESENTATIVE hukukcu bilgilerini hic gormemeli — explicit whitelist
function sanitizeLawyerForRepresentative(assignments) {
  return (assignments || []).map((a) => ({
    id: a.id,
    leadId: a.leadId,
    status: a.status,
    createdAt: a.createdAt,
    // note ve lawyerId intentionally omitted
    lawyer: null,
  }));
}

async function listLeads(filters = {}, user = null) {
  // Rol bazlı temel filtre — tüm roller için merkezi kontrolden geçer
  const where = leadWhereByRole(user);

  if (filters.status) where.status = filters.status;
  // ownerId filtresi: sadece ADMIN/SALES kullanabilir (diğer roller zaten kısıtlı)
  if (filters.ownerId && ["ADMIN", "SALES"].includes(user?.role)) {
    where.ownerId = filters.ownerId;
  }

  // Soft delete / arsiv filtresi — varsayilan olarak gizli
  if (!filters.includeDeleted) where.deletedAt = null;
  if (!filters.includeArchived) where.archivedAt = null;

  if (filters.q) {
    where.OR = [
      { customerName: { contains: filters.q } },
      { customerPhone: { contains: filters.q } },
      { customerEmail: { contains: filters.q } },
      { leadCode: { contains: filters.q } }
    ];
  }

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      owner: true,
      assignments: { include: { lawyer: { select: { id: true, fullName: true, email: true, phone: true, baroSicilNo: true, uzmanlik: true } } } },
      documents: true
    }
  });
  if (user?.role === "REPRESENTATIVE") {
    return leads.map((l) => ({
      ...l,
      assignments: sanitizeLawyerForRepresentative(l.assignments),
    }));
  }
  return leads;
}

async function getLeadById(id, user = null) {
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      owner: true,
      messages: { orderBy: { createdAt: "asc" } },
      documents: { orderBy: { createdAt: "desc" } },
      assignments: { include: { lawyer: { select: { id: true, fullName: true, email: true, phone: true, baroSicilNo: true, uzmanlik: true } } } },
      contracts: true,
      activities: { orderBy: { createdAt: "desc" } }
    }
  });

  if (!lead) throw new ApiError(404, "Lead bulunamadi");

  // Tüm roller için merkezi erişim kontrolü
  await assertLeadAccess(user, lead);

  if (user?.role === "REPRESENTATIVE") {
    lead.assignments = sanitizeLawyerForRepresentative(lead.assignments);
  }

  return lead;
}

async function updateLeadStatus(id, status, note, user = null) {
  // Erişim kontrolü: CUSTOMER durum güncelleyemez; diğer roller kendi lead'lerini güncelleyebilir
  if (user?.role === "CUSTOMER") throw new ApiError(403, "Durum güncelleme yetkiniz yok");
  if (user) {
    const existing = await prisma.lead.findUnique({ where: { id }, include: { assignments: true } });
    if (!existing) throw new ApiError(404, "Lead bulunamadı");
    await assertLeadAccess(user, existing);
  }

  const lead = await prisma.lead.update({
    where: { id },
    data: { status }
  });

  await prisma.activityLog.create({
    data: {
      leadId: id,
      action: "LEAD_STATUS_UPDATED",
      detail: note ? `${status} - ${note}` : status
    }
  });

  // SMS bildirimi — hata olursa sessizce geç
  sendStatusChangeSms(lead, status).catch((err) =>
    console.error("[SMS] Durum SMS gönderilemedi:", err.message)
  );

  // Push notification — müvekkile durum güncelleme bildirimi
  if (lead.ownerId) {
    const statusLabels = {
      ANALYZED: "Dosyanız analiz edildi",
      ASSIGNED_TO_LAWYER: "Avukatınız atandı",
      CONTRACT_PENDING: "Sözleşmeniz hazırlanıyor",
      WON: "Davanız başarıyla tamamlandı 🎉",
    };
    const title = statusLabels[status];
    if (title) {
      sendToUser(lead.ownerId, {
        title: "Tedbirge — Dosya Güncellendi",
        body: title,
        url: "/musteri",
        tag: `lead-status-${id}`,
      }).catch(() => {});
    }
  }

  return lead;
}

async function assignLeadOwner(id, ownerId) {
  const user = await prisma.user.findUnique({
    where: { id: ownerId }
  });

  if (!user) throw new ApiError(404, "Kullanici bulunamadi");
  if (user.role !== "CUSTOMER") throw new ApiError(400, "Owner olarak sadece CUSTOMER atanabilir");

  const lead = await prisma.lead.update({
    where: { id },
    data: { ownerId }
  });

  return lead;
}

function safeParseSalesNote(value) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return { rawNote: value };
  }
}

async function operationApproveLead(id, payload = {}) {
  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      salesNote: true,
      status: true,
    },
  });

  if (!lead) {
    throw new ApiError(404, "Lead bulunamadı");
  }

  const mergedNote = {
    ...safeParseSalesNote(lead.salesNote),
    operationApproved: true,
    operationApprovedAt: new Date().toISOString(),
    caseType: payload.caseType || null,
    signerType: payload.signerType || null,
    lawyerId: payload.lawyerId || null,
    processType: payload.processType || null,
  };

  return prisma.lead.update({
    where: { id },
    data: {
      salesNote: JSON.stringify(mergedNote),
      status: "CONTRACT_PENDING",
    },
  });
}

/**
 * Toplu lead güncelleme: durum değiştirme veya avukat atama
 * action: "status" | "assign"
 */
async function bulkUpdateLeads({ ids, action, value, actorId, actorRole }) {
  if (!Array.isArray(ids) || ids.length === 0) throw new ApiError(400, "En az bir lead seçilmeli");
  if (!["status", "assign"].includes(action)) throw new ApiError(400, "Geçersiz bulk action");

  const results = { success: [], failed: [] };

  for (const id of ids) {
    try {
      // REPRESENTATIVE yalnızca kendi oluşturduğu lead'leri güncelleyebilir
      if (actorRole === "REPRESENTATIVE" && actorId) {
        const check = await prisma.lead.findUnique({ where: { id }, select: { createdById: true } });
        if (!check || check.createdById !== actorId) {
          results.failed.push({ id, error: "Bu dosyaya erişim yetkiniz yok" });
          continue;
        }
      }

      if (action === "status") {
        await prisma.lead.update({ where: { id }, data: { status: value } });
        await prisma.activityLog.create({
          data: { leadId: id, action: "BULK_STATUS_CHANGED", detail: value, userId: actorId || null }
        });
      } else if (action === "assign") {
        // value = lawyerId
        const lawyer = await prisma.user.findUnique({ where: { id: value }, select: { id: true, role: true } });
        if (!lawyer || lawyer.role !== "LAWYER") throw new Error("Geçersiz avukat");

        // Mevcut aktif atamayı kapat
        await prisma.assignment.updateMany({
          where: { leadId: id, isActive: true },
          data: { isActive: false }
        });
        await prisma.assignment.create({ data: { leadId: id, lawyerId: value, isActive: true } });
        await prisma.lead.update({ where: { id }, data: { status: "ASSIGNED_TO_LAWYER" } });
        await prisma.activityLog.create({
          data: { leadId: id, action: "BULK_LAWYER_ASSIGNED", detail: value, userId: actorId || null }
        });
      }
      results.success.push(id);
    } catch (err) {
      results.failed.push({ id, error: err.message });
    }
  }

  return results;
}

async function archiveLead(leadId) {
  return prisma.lead.update({ where: { id: leadId }, data: { archivedAt: new Date() } });
}

async function unarchiveLead(leadId) {
  return prisma.lead.update({ where: { id: leadId }, data: { archivedAt: null } });
}

async function softDeleteLead(leadId) {
  return prisma.lead.update({ where: { id: leadId }, data: { deletedAt: new Date() } });
}

async function restoreLead(leadId) {
  return prisma.lead.update({ where: { id: leadId }, data: { deletedAt: null } });
}

module.exports = {
  createLead,
  listLeads,
  getLeadById,
  updateLeadStatus,
  assignLeadOwner,
  operationApproveLead,
  generateDocumentDraft,
  bulkUpdateLeads,
  archiveLead,
  unarchiveLead,
  softDeleteLead,
  restoreLead,
};


async function generateDocumentDraft(leadId) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId }
  });

  if (!lead) {
    throw new Error("Lead not found");
  }

  let salesNote = {};
  try {
    salesNote = lead.salesNote ? JSON.parse(lead.salesNote) : {};
  } catch (error) {
    salesNote = {};
  }

  const lawyerId = salesNote.lawyerId || null;
  let lawyer = {};

  if (lawyerId) {
    lawyer = (await prisma.user.findUnique({
      where: { id: lawyerId }
    })) || {};
  }

  const result = buildDocumentDraftTexts({
    lead,
    salesNote,
    lawyer
  });

  return {
    contractText: result.contractText,
    powerOfAttorneyText: result.powerOfAttorneyText
  };
}

module.exports.__test = { sanitizeLawyerForRepresentative };

