const prisma = require("../config/db");

const EVENT_META = {
  LEAD_CREATED:       { icon: "📋", color: "#3b82f6", colorBg: "#dbeafe" },
  LEAD_ASSIGNED:      { icon: "👤", color: "#7c3aed", colorBg: "#ede9fe" },
  DOCUMENT_UPLOADED:  { icon: "📎", color: "#059669", colorBg: "#d1fae5" },
  DOCUMENT_ANALYZED:  { icon: "🔍", color: "#059669", colorBg: "#d1fae5" },
  NOTICE_SENT:        { icon: "📨", color: "#d97706", colorBg: "#fef3c7" },
  NOTICE_REPLIED:     { icon: "📬", color: "#d97706", colorBg: "#fef3c7" },
  LAWSUIT_FILED:      { icon: "🏛️", color: "#dc2626", colorBg: "#fee2e2" },
  VERDICT_REACHED:    { icon: "⚖️", color: "#dc2626", colorBg: "#fee2e2" },
  HEARING_SCHEDULED:  { icon: "📅", color: "#7c3aed", colorBg: "#ede9fe" },
  HEARING_OCCURRED:   { icon: "⚖️", color: "#7c3aed", colorBg: "#ede9fe" },
  EXPERT_ASSIGNED:    { icon: "👨‍🔬", color: "#475569", colorBg: "#f1f5f9" },
  EXPERT_REPORT:      { icon: "📊", color: "#475569", colorBg: "#f1f5f9" },
  CONTRACT_CREATED:   { icon: "📜", color: "#4f46e5", colorBg: "#e0e7ff" },
  PETITION_FILED:     { icon: "📝", color: "#4f46e5", colorBg: "#e0e7ff" },
  ACTIVITY:           { icon: "🔔", color: "#1E1E8E", colorBg: "#dbeafe" },
};

const ACTIVITY_ACTION_MAP = {
  PUBLIC_LEAD_CREATED:       { title: "Web başvurusu alındı",     type: "LEAD_CREATED" },
  LAWYER_ASSIGNED:           { title: "Avukat atandı",           type: "LEAD_ASSIGNED" },
  CONTRACT_GENERATED:        { title: "Sözleşme oluşturuldu",    type: "CONTRACT_CREATED" },
  DOCUMENT_ANALYZED:         { title: "Belge analiz edildi",     type: "DOCUMENT_ANALYZED" },
  RERUN_ANALYSIS:            { title: "Analiz yenilendi",        type: "DOCUMENT_ANALYZED" },
  STATUS_CHANGED:            { title: "Durum güncellendi",       type: "ACTIVITY" },
  BULK_STATUS_CHANGED:       { title: "Toplu durum değişikliği", type: "ACTIVITY" },
  BULK_LAWYER_ASSIGNED:      { title: "Toplu avukat atama",      type: "LEAD_ASSIGNED" },
  GDPR_DELETE:               { title: "KVKK veri silme talebi",  type: "ACTIVITY" },
  BILDIRIM_GONDERILDI:       { title: "Bildirim gönderildi",     type: "ACTIVITY" },
  PUBLIC_DOCUMENT_UPLOADED:  { title: "Belge yüklendi (web)",    type: "DOCUMENT_UPLOADED" },
};

function makeEvent(type, timestamp, title, description, metadata = {}) {
  if (!timestamp) return null;
  const meta = EVENT_META[type] || EVENT_META.ACTIVITY;
  return {
    type,
    timestamp: new Date(timestamp).toISOString(),
    title,
    description: description || null,
    icon: meta.icon,
    color: meta.color,
    colorBg: meta.colorBg,
    ...metadata,
  };
}

async function getLeadTimeline(leadId) {
  const [
    lead,
    assignments,
    documents,
    activities,
    durusmalar,
    ihtarnameler,
    davaSurec,
    bilirkisiList,
    contracts,
    petitions,
  ] = await Promise.all([
    prisma.lead.findUnique({ where: { id: leadId }, select: { createdAt: true, customerName: true, accidentType: true } }),
    prisma.assignment.findMany({ where: { leadId }, include: { lawyer: { select: { fullName: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.document.findMany({ where: { leadId, deletedAt: null }, orderBy: { createdAt: "asc" } }),
    prisma.activityLog.findMany({ where: { leadId }, orderBy: { createdAt: "asc" } }),
    prisma.durusma.findMany({ where: { leadId }, orderBy: { tarih: "asc" } }),
    prisma.ihtarnameTakip.findMany({ where: { leadId }, orderBy: { createdAt: "asc" } }),
    prisma.davaSurec.findUnique({ where: { leadId } }),
    prisma.bilirkisi.findMany({ where: { leadId }, orderBy: { createdAt: "asc" } }),
    prisma.contract.findMany({ where: { leadId }, orderBy: { createdAt: "asc" } }),
    prisma.petition.findMany({ where: { leadId }, orderBy: { createdAt: "asc" } }),
  ]);

  const events = [];

  // Lead oluşturma
  if (lead) {
    events.push(makeEvent("LEAD_CREATED", lead.createdAt, "Başvuru alındı",
      `${lead.customerName} adlı müvekkil başvurusu sisteme eklendi.`));
  }

  // Atamalar — ActivityLog LAWYER_ASSIGNED önceliklidir; Assignment tablosu event üretmez (Option A)

  // Belgeler — ActivityLog PUBLIC_DOCUMENT_UPLOADED ile çakışmayı önle
  const actLogDocNames = new Set();
  for (const a of activities) {
    if (a.action === "PUBLIC_DOCUMENT_UPLOADED" && a.detail) {
      const colon = a.detail.lastIndexOf(":");
      const name = colon >= 0 ? a.detail.slice(colon + 1).trim() : a.detail.trim();
      actLogDocNames.add(name);
    }
  }

  for (const d of documents) {
    if (!actLogDocNames.has(d.originalName)) {
      events.push(makeEvent("DOCUMENT_UPLOADED", d.createdAt, "Belge yüklendi", d.originalName));
    }
    if (d.status === "ANALYZED" && d.updatedAt && d.updatedAt.getTime() !== d.createdAt.getTime()) {
      events.push(makeEvent("DOCUMENT_ANALYZED", d.updatedAt, "Belge analiz edildi", d.originalName));
    }
  }

  // ActivityLog
  for (const a of activities) {
    const mapped = ACTIVITY_ACTION_MAP[a.action];
    const type = mapped?.type || "ACTIVITY";
    const title = mapped?.title || a.action;
    events.push(makeEvent(type, a.createdAt, title, a.detail || null));
  }

  // Duruşmalar
  const now = new Date();
  for (const d of durusmalar) {
    events.push(makeEvent("HEARING_SCHEDULED", d.createdAt, "Duruşma planlandı",
      `${d.mahkeme || "Mahkeme"} — ${new Date(d.tarih).toLocaleDateString("tr-TR")}`));
    if (new Date(d.tarih) < now) {
      events.push(makeEvent("HEARING_OCCURRED", d.tarih, "Duruşma gerçekleşti",
        `${d.mahkeme || "Mahkeme"} — ${d.aciklama || ""}`));
    }
  }

  // İhtarnameler
  for (const ih of ihtarnameler) {
    if (ih.gonderimTarihi) {
      events.push(makeEvent("NOTICE_SENT", ih.gonderimTarihi, "İhtarname gönderildi",
        ih.karsiTaraf ? `Muhatap: ${ih.karsiTaraf}` : null));
    }
    if (ih.cevapTarihi) {
      events.push(makeEvent("NOTICE_REPLIED", ih.cevapTarihi, "İhtarnameye cevap geldi",
        ih.cevapIcerigi ? ih.cevapIcerigi.slice(0, 120) : null));
    }
  }

  // Dava süreci
  if (davaSurec) {
    if (davaSurec.davaTarihi) {
      events.push(makeEvent("LAWSUIT_FILED", davaSurec.davaTarihi, "Dava açıldı",
        davaSurec.mahkeme ? `${davaSurec.mahkeme} — ${davaSurec.dosyaNo || ""}` : null));
    }
    if (davaSurec.kararTarihi) {
      events.push(makeEvent("VERDICT_REACHED", davaSurec.kararTarihi, "Karar verildi",
        davaSurec.karar ? davaSurec.karar.slice(0, 120) : null));
    }
  }

  // Bilirkişi
  for (const b of bilirkisiList) {
    if (b.atamaTarihi) {
      events.push(makeEvent("EXPERT_ASSIGNED", b.atamaTarihi, "Bilirkişi atandı", null));
    }
    if (b.raporTarihi) {
      events.push(makeEvent("EXPERT_REPORT", b.raporTarihi, "Bilirkişi raporu geldi",
        b.raporIcerigi ? b.raporIcerigi.slice(0, 120) : null));
    }
  }

  // Sözleşmeler
  for (const c of contracts) {
    events.push(makeEvent("CONTRACT_CREATED", c.createdAt, "Sözleşme oluşturuldu",
      c.type === "POWER_OF_ATTORNEY" ? "Vekaletname" : "Avukatlık Sözleşmesi"));
  }

  // Dilekçeler
  for (const p of petitions) {
    events.push(makeEvent("PETITION_FILED", p.createdAt, "Dilekçe hazırlandı",
      p.tur || null));
    if (p.gonderildi && p.gonderimTarihi) {
      events.push(makeEvent("PETITION_FILED", p.gonderimTarihi, "Dilekçe gönderildi",
        p.muhatap ? `Muhatap: ${p.muhatap}` : null));
    }
  }

  // Sırala: en yeni üstte, null timestamp'leri filtrele
  const sorted = events
    .filter(Boolean)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return sorted;
}

module.exports = { getLeadTimeline };
