// TUR #52 — CommissionLog Servisi (Madde 24.3 — gelir modeli)

const prisma = require("../config/db");

/**
 * Tedbirge komisyon dağılımı:
 * - Direkt müvekkil: Tahsilat × %20 → Tedbirge tamamı
 * - Temsilci aracılığıyla: Tahsilat × %20 → Tedbirge %50 + Temsilci %50 (yani brüt %10 her biri)
 */
function hesaplaKomisyon({ tahsilatBrut, oran = 20, temsilciVarMi = false }) {
  const brut = Number(tahsilatBrut) || 0;
  const tedbirgeBrutToplam = (brut * Number(oran)) / 100;
  if (!temsilciVarMi) {
    return { tedbirgeNet: tedbirgeBrutToplam, temsilciNet: null };
  }
  return {
    tedbirgeNet: tedbirgeBrutToplam / 2,
    temsilciNet: tedbirgeBrutToplam / 2,
  };
}

async function listLogs({ durum, leadId, temsilciId, limit = 50, offset = 0 } = {}) {
  const where = {};
  if (durum) where.durum = durum;
  if (leadId) where.leadId = leadId;
  if (temsilciId) where.temsilciId = temsilciId;

  const [logs, total] = await Promise.all([
    prisma.commissionLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(parseInt(limit) || 50, 100),
      skip: Math.max(parseInt(offset) || 0, 0),
      include: {
        lead: { select: { id: true, leadCode: true, customerName: true, status: true, gercekTazminat: true } },
        temsilci: { select: { id: true, fullName: true, email: true } },
      },
    }),
    prisma.commissionLog.count({ where }),
  ]);
  return { logs, total };
}

async function createLog({ leadId, tahsilatBrut, tedbirgeOrani, temsilciId, notes }) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, createdById: true, komisyonOrani: true },
  });
  if (!lead) throw new Error("Lead bulunamadi");

  const oran = tedbirgeOrani ?? lead.komisyonOrani ?? 20;
  const tempId = temsilciId ?? lead.createdById ?? null;
  const temsilciVarMi = !!tempId;
  const { tedbirgeNet, temsilciNet } = hesaplaKomisyon({
    tahsilatBrut,
    oran,
    temsilciVarMi,
  });

  const log = await prisma.commissionLog.create({
    data: {
      leadId,
      tahsilatBrut,
      tedbirgeOrani: oran,
      tedbirgeNet,
      temsilciId: tempId,
      temsilciNet,
      durum: "BEKLIYOR",
      notes: notes ? String(notes).slice(0, 2000) : null,
    },
  });

  try {
    await prisma.activityLog.create({
      data: {
        leadId,
        action: "COMMISSION_LOG_CREATED",
        detail: `id:${log.id} brut:${tahsilatBrut} tedbirge:${tedbirgeNet} temsilci:${temsilciNet || 0}`,
      },
    });
  } catch (e) {}

  return log;
}

async function updateStatus(id, { durum, havaleAt, havaleReferans, notes }) {
  const valid = ["BEKLIYOR", "HESAPLANDI", "HAVALE_EDILDI", "IPTAL"];
  if (!valid.includes(durum)) throw new Error("Gecersiz durum");

  const data = { durum };
  if (durum === "HAVALE_EDILDI") {
    data.havaleAt = havaleAt ? new Date(havaleAt) : new Date();
    if (havaleReferans) data.havaleReferans = String(havaleReferans).slice(0, 200);
  }
  if (notes) data.notes = String(notes).slice(0, 2000);

  const log = await prisma.commissionLog.update({ where: { id }, data });

  try {
    await prisma.activityLog.create({
      data: {
        leadId: log.leadId,
        action: "COMMISSION_LOG_STATUS_UPDATE",
        detail: `id:${id} durum:${durum} havale:${havaleReferans || "—"}`,
      },
    });
  } catch (e) {}

  return log;
}

/**
 * Belirli bir temsilcinin komisyon ozeti (kendi sayfasinda gosterim).
 */
async function getTemsilciOzet(temsilciId) {
  const logs = await prisma.commissionLog.findMany({
    where: { temsilciId },
    select: { durum: true, temsilciNet: true },
  });
  const summary = { BEKLIYOR: 0, HESAPLANDI: 0, HAVALE_EDILDI: 0, IPTAL: 0, TOPLAM: 0 };
  let toplam = 0;
  for (const l of logs) {
    const net = Number(l.temsilciNet || 0);
    summary[l.durum] = (summary[l.durum] || 0) + net;
    toplam += net;
  }
  summary.TOPLAM = toplam;
  return summary;
}

/**
 * TUR #55 A21 — Lead.gercekTazminat doldurulduğunda otomatik CommissionLog oluştur.
 * Idempotent: aynı leadId için zaten BEKLIYOR/HESAPLANDI kayıt varsa güncellenmez (yeni oluşturulmaz).
 * Lead.createdById REPRESENTATIVE ise temsilci payı otomatik hesaplanır.
 */
async function createFromLead(leadId, opts = {}) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      gercekTazminat: true,
      komisyonOrani: true,
      createdById: true,
      createdBy: { select: { id: true, role: true, fullName: true } },
    },
  });
  if (!lead) return null;
  if (!lead.gercekTazminat || Number(lead.gercekTazminat) <= 0) return null;

  // Aynı lead için aktif kayıt var mı?
  const existing = await prisma.commissionLog.findFirst({
    where: { leadId, durum: { in: ["BEKLIYOR", "HESAPLANDI"] } },
  });
  if (existing && !opts.force) return existing;

  const tempId = lead.createdBy?.role === "REPRESENTATIVE" ? lead.createdById : null;
  const log = await createLog({
    leadId,
    tahsilatBrut: lead.gercekTazminat,
    tedbirgeOrani: lead.komisyonOrani ?? 20,
    temsilciId: tempId,
    notes: opts.notes || "Otomatik (Lead.gercekTazminat trigger)",
  });

  // Real-time event ADMIN feed
  try {
    await prisma.realtimeEvent.create({
      data: {
        channel: "ADMIN_FEED",
        eventType: "COMMISSION_LOG_AUTO_CREATED",
        payload: { leadId, logId: log.id, tahsilatBrut: String(lead.gercekTazminat) },
      },
    });
  } catch (e) {}

  // TUR #56 A1.4 — L-B1 KRITIK: avukata tahsilat kaydedildi bildirimi
  try {
    const lawyerNotif = require("./lawyerNotifications.service");
    await lawyerNotif.notifyCommissionLogCreated(leadId, log);
  } catch (notifErr) {
    console.warn("[LAWYER NOTIF] notifyCommissionLogCreated fail:", notifErr.message);
  }

  return log;
}

module.exports = {
  hesaplaKomisyon,
  listLogs,
  createLog,
  updateStatus,
  getTemsilciOzet,
  createFromLead,
};
