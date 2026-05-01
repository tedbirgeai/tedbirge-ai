// TUR #52 — KVKK Hak Yonetimi Servisi (m.7 + m.11)
// Mevcut DataSubjectRequest modeli kullanir (TUR #51 keşif sonrasi)

const prisma = require("../config/db");

/**
 * KVKK m.11 ilgili kisi haklari listesi (referans)
 */
const REQUEST_TYPES = [
  "ERISIM",            // m.11/a-d (bilgi talebi)
  "DUZELTME",          // m.11/e
  "SILME",             // m.7 + m.11/f
  "AKTARIM_BILGISI",   // m.11/g
  "ITIRAZ",            // m.11/h
  "ZARAR_TAZMIN",      // m.11/i
];

const STATUSES = ["PENDING", "IN_REVIEW", "APPROVED", "REJECTED", "COMPLETED"];

async function listRequests({ status, limit = 50, offset = 0 } = {}) {
  const where = status ? { status } : {};
  const [requests, total] = await Promise.all([
    prisma.dataSubjectRequest.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      take: Math.min(parseInt(limit) || 50, 100),
      skip: Math.max(parseInt(offset) || 0, 0),
      include: { handler: { select: { id: true, fullName: true, email: true } } },
    }),
    prisma.dataSubjectRequest.count({ where }),
  ]);
  return { requests, total };
}

async function getRequest(id) {
  return prisma.dataSubjectRequest.findUnique({
    where: { id },
    include: { handler: { select: { id: true, fullName: true, email: true } } },
  });
}

async function createPublicRequest({ requesterTC, requestType, description }) {
  if (!requesterTC || !requestType || !description) {
    throw new Error("requesterTC, requestType ve description zorunlu");
  }
  if (!REQUEST_TYPES.includes(requestType)) {
    throw new Error("Gecersiz requestType");
  }
  const request = await prisma.dataSubjectRequest.create({
    data: {
      requesterTC: String(requesterTC).trim().slice(0, 11),
      requestType,
      description: String(description).slice(0, 5000),
      status: "PENDING",
    },
  });

  // TUR #56 A1.5 — L-B1 KRITIK: SILME talebi ise atanmis avukat(lar)a bildirim
  if (requestType === "SILME") {
    try {
      const user = await prisma.user.findFirst({
        where: { OR: [{ email: { contains: request.requesterTC } }] },
        select: { id: true },
      });
      if (user) {
        const userLeads = await prisma.lead.findMany({
          where: { ownerId: user.id },
          select: { id: true },
        });
        const lawyerNotif = require("./lawyerNotifications.service");
        for (const lead of userLeads) {
          await lawyerNotif.notifyKvkkDeletionRequest(lead.id, request).catch((e) =>
            console.warn("[LAWYER NOTIF] notifyKvkkDeletionRequest fail:", e.message)
          );
        }
      }
    } catch (err) {
      console.warn("[KVKK] SILME notif zinciri hata:", err.message);
    }
  }

  return request;
}

async function respondToRequest(id, { status, responseNote, handlerId }) {
  if (!STATUSES.includes(status)) throw new Error("Gecersiz status");
  return prisma.dataSubjectRequest.update({
    where: { id },
    data: {
      status,
      responseNote: responseNote ? String(responseNote).slice(0, 5000) : undefined,
      handlerId,
      respondedAt: new Date(),
    },
  });
}

/**
 * KVKK m.7 - SILME talebi onaylandiginda User soft-delete + kisisel veri anonimlestirme.
 */
async function executeKvkkDeletion(requestId, handlerId) {
  const request = await prisma.dataSubjectRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Talep bulunamadi");
  if (request.requestType !== "SILME") throw new Error("Bu talep silme tipi degil");

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { contains: request.requesterTC } },
      ],
    },
  });

  let userResult = null;
  if (user) {
    userResult = await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: "[SILINDI]",
        email: `[SILINDI-${user.id}]@anonim.local`,
        phone: null,
        passwordHash: "[SILINDI]",
        isActive: false,
      },
    });
  }

  await prisma.activityLog.create({
    data: {
      action: "KVKK_DELETION_EXECUTED",
      detail: `request:${requestId} userId:${user?.id || "—"} handler:${handlerId}`,
    },
  });

  return await prisma.dataSubjectRequest.update({
    where: { id: requestId },
    data: {
      status: "COMPLETED",
      handlerId,
      respondedAt: new Date(),
      responseNote: `Silme islemi tamamlandi. User ${user?.id ? "anonimlestirildi" : "bulunamadi"}.`,
    },
  });
}

module.exports = {
  REQUEST_TYPES,
  STATUSES,
  listRequests,
  getRequest,
  createPublicRequest,
  respondToRequest,
  executeKvkkDeletion,
};
