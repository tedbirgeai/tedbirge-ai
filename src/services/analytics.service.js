const prisma = require("../config/db");
const { hesaplaSureler } = require("./sureMotoru.service");

async function getLeadFunnel() {
  const statuses = [
    "NEW","CONTACTED","DOCS_PENDING","DOCS_RECEIVED","ANALYZED",
    "OFFER_SENT","CONTRACT_PENDING","ASSIGNED_TO_LAWYER","WON","LOST"
  ];

  // Tek sorgu — 10 paralel count yerine 1 GROUP BY
  const grouped = await prisma.lead.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const countMap = Object.fromEntries(grouped.map((r) => [r.status, r._count.id]));
  return statuses.map((status) => ({ status, count: countMap[status] ?? 0 }));
}

/**
 * Toplam lead → WON dönüşüm oranını ve aşama bazlı düşüş oranlarını döner.
 */
async function getConversionRate() {
  // Tek GROUP BY sorgusu — 5 paralel count yerine 1 sorgu
  const grouped = await prisma.lead.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const countMap = Object.fromEntries(grouped.map((r) => [r.status, r._count.id]));
  const total    = grouped.reduce((s, r) => s + r._count.id, 0);
  const won      = countMap["WON"]       ?? 0;
  const lost     = countMap["LOST"]      ?? 0;
  const analyzed = countMap["ANALYZED"]  ?? 0;
  const offerSent = countMap["OFFER_SENT"] ?? 0;
  const active   = total - won - lost;

  const pct = (n) => total > 0 ? parseFloat(((n / total) * 100).toFixed(2)) : 0;

  return {
    total, won, lost, active, analyzed, offerSent,
    wonRatePct:      pct(won),
    lostRatePct:     pct(lost),
    analyzedRatePct: pct(analyzed),
    offerSentRatePct: pct(offerSent),
  };
}

/**
 * Kazanılan (WON) leadlerin tahmini tazminat toplamı ve ortalamasını döner.
 */
async function getRevenueEstimate() {
  const wonLeads = await prisma.lead.findMany({
    where: { status: "WON" },
    select: { estimatedCompensation: true }
  });

  const allLeads = await prisma.lead.findMany({
    where: { estimatedCompensation: { gt: 0 } },
    select: { estimatedCompensation: true }
  });

  const wonTotal = wonLeads.reduce((sum, l) => sum + (l.estimatedCompensation || 0), 0);
  const wonAvg = wonLeads.length > 0 ? wonTotal / wonLeads.length : 0;

  const allTotal = allLeads.reduce((sum, l) => sum + (l.estimatedCompensation || 0), 0);
  const allAvg = allLeads.length > 0 ? allTotal / allLeads.length : 0;

  return {
    wonLeadsCount: wonLeads.length,
    wonTotalEstimatedTL: Math.round(wonTotal),
    wonAverageEstimatedTL: Math.round(wonAvg),
    allLeadsWithEstimateCount: allLeads.length,
    allTotalEstimatedTL: Math.round(allTotal),
    allAverageEstimatedTL: Math.round(allAvg)
  };
}

/**
 * Lead dağılımını kaza türüne (accidentType) ve şehre (city) göre gruplar.
 * Schema'da kaynak alanı olmadığından bu iki alan proxy olarak kullanılır.
 */
async function getLeadsBySource() {
  const byAccidentType = await prisma.lead.groupBy({
    by: ["accidentType"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } }
  });

  const byCity = await prisma.lead.groupBy({
    by: ["city"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10
  });

  // Public form üzerinden gelenler ActivityLog'dan sayılır
  const publicLeadCount = await prisma.activityLog.count({
    where: { action: "PUBLIC_LEAD_CREATED" }
  });

  const totalLeads = await prisma.lead.count();
  const adminCreatedCount = Math.max(0, totalLeads - publicLeadCount);

  return {
    byAccidentType: byAccidentType.map((r) => ({
      accidentType: r.accidentType || "belirtilmemiş",
      count: r._count.id
    })),
    byCity: byCity.map((r) => ({
      city: r.city || "belirtilmemiş",
      count: r._count.id
    })),
    byEntryChannel: [
      { channel: "public_form", count: publicLeadCount },
      { channel: "admin_panel", count: adminCreatedCount }
    ]
  };
}

/**
 * Avukat bazlı performans: atanan dava, kazanma oranı, ort. tazminat
 * Assignment tablosu üzerinden sorgular — User modelinde assignments ilişkisi gerekmez.
 */
async function getLawyerPerformance() {
  // 1) Tüm atamalar + ilgili lead + avukat bilgisi
  const assignments = await prisma.assignment.findMany({
    select: {
      lawyerId: true,
      lead: {
        select: {
          id: true,
          status: true,
          estimatedCompensation: true,
        }
      },
      lawyer: {
        select: {
          id: true,
          fullName: true,
          email: true,
        }
      }
    }
  });

  // 2) lawyerId bazında grupla
  const byLawyer = new Map();
  for (const a of assignments) {
    if (!a.lawyer) continue;
    const key = a.lawyerId;
    if (!byLawyer.has(key)) {
      byLawyer.set(key, { lawyer: a.lawyer, leads: [] });
    }
    if (a.lead) byLawyer.get(key).leads.push(a.lead);
  }

  // 3) İstatistik hesapla
  const results = Array.from(byLawyer.values()).map(({ lawyer, leads }) => {
    const total = leads.length;
    const won   = leads.filter((l) => l.status === "WON").length;
    const comps = leads
      .filter((l) => typeof l.estimatedCompensation === "number")
      .map((l) => l.estimatedCompensation);
    const avgCompensation = comps.length
      ? Math.round(comps.reduce((s, v) => s + v, 0) / comps.length)
      : null;

    return {
      id:             lawyer.id,
      fullName:       lawyer.fullName,
      email:          lawyer.email,
      totalCases:     total,
      wonCases:       won,
      wonRatePct:     total > 0 ? Math.round((won / total) * 100) : 0,
      avgCompensation,
    };
  });

  return results.sort((a, b) => b.totalCases - a.totalCases);
}

/**
 * Son N ay için aylık lead oluşturma ve WON sayısı trendi döner.
 */
async function getMonthlyTrend(months = 6) {
  const now = new Date();
  const results = [];

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    // Sequential — paralel count yerine sıralı 2 sorgu (pool güvenli)
    const total = await prisma.lead.count({ where: { createdAt: { gte: start, lt: end } } });
    const won   = await prisma.lead.count({ where: { createdAt: { gte: start, lt: end }, status: "WON" } });

    results.push({
      month: start.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" }),
      total,
      won,
    });
  }

  return results;
}

/**
 * Belirtilen ay için takvim verisi döner.
 * Her gün: o güne ait duruşmalar + zamanaşımı uyarısı (son 30 gün) olan lead'ler.
 */
async function getCalendarData(year, month) {
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 1);

  // O aydaki tüm duruşmalar
  const durusmalar = await prisma.durusma.findMany({
    where: { tarih: { gte: start, lt: end } },
    include: {
      lead: { select: { id: true, leadCode: true, customerName: true, accidentType: true } }
    },
    orderBy: { tarih: "asc" },
  });

  // Zamanaşımı bu ay dolacak ya da kritik olan lead'ler (90 gün içinde)
  const activeLeads = await prisma.lead.findMany({
    where: {
      status: { notIn: ["WON", "LOST"] },
      accidentDate: { not: null },
    },
    select: { id: true, leadCode: true, customerName: true, accidentDate: true, accidentType: true },
  });

  const kritikler = [];
  for (const l of activeLeads) {
    if (!l.accidentDate) continue;
    const limitDays = l.accidentType === "WORK_ACCIDENT" ? 3650 : 730;
    const deadline  = new Date(l.accidentDate.getTime() + limitDays * 86400000);
    const rem       = Math.ceil((deadline.getTime() - Date.now()) / 86400000);
    if (rem >= 0 && rem <= 90 &&
        deadline.getFullYear() === year && deadline.getMonth() === month - 1) {
      kritikler.push({
        leadId:       l.id,
        leadCode:     l.leadCode,
        customerName: l.customerName,
        deadline:     deadline.toISOString(),
        remDays:      rem,
      });
    }
  }

  // Gün bazında grupla
  const byDay = {};
  for (const d of durusmalar) {
    const day = new Date(d.tarih).getDate();
    if (!byDay[day]) byDay[day] = { durusmalar: [], kritikler: [] };
    byDay[day].durusmalar.push({
      id:           d.id,
      leadId:       d.lead.id,
      leadCode:     d.lead.leadCode,
      customerName: d.lead.customerName,
      tarih:        d.tarih,
      mahkeme:      d.mahkeme,
      aciklama:     d.aciklama,
      tur:          d.tur,
    });
  }
  for (const k of kritikler) {
    const day = new Date(k.deadline).getDate();
    if (!byDay[day]) byDay[day] = { durusmalar: [], kritikler: [] };
    byDay[day].kritikler.push(k);
  }

  return { year, month, byDay };
}

/**
 * Kazanılan davalar için komisyon tahmini.
 * Her lead için: komisyonOrani (default %20) × estimatedCompensation
 */
async function getKomisyonSummary() {
  const wonLeads = await prisma.lead.findMany({
    where: { status: "WON", estimatedCompensation: { gt: 0 } },
    select: { id: true, estimatedCompensation: true, komisyonOrani: true, customerName: true, leadCode: true },
  });

  let totalKomisyon = 0;
  const details = wonLeads.map((l) => {
    const oran = l.komisyonOrani ?? 20;
    const komisyon = Math.round(((l.estimatedCompensation ?? 0) * oran) / 100);
    totalKomisyon += komisyon;
    return { id: l.id, leadCode: l.leadCode, customerName: l.customerName, estimatedCompensation: l.estimatedCompensation, komisyonOrani: oran, komisyon };
  });

  return {
    count: wonLeads.length,
    totalKomisyon,
    avgKomisyon: wonLeads.length > 0 ? Math.round(totalKomisyon / wonLeads.length) : 0,
    details,
  };
}

/**
 * Tüm bilirkişi işlemlerini özet olarak döner.
 * LAWYER rolü ise sadece atandığı davalara ait bilirkişi kayıtları.
 */
async function getBilirkisiSummary(userId, userRole) {
  let leadIds = null;

  if (userRole === "LAWYER") {
    const assignments = await prisma.assignment.findMany({
      where: { lawyerId: userId, isActive: true },
      select: { leadId: true },
    });
    leadIds = assignments.map((a) => a.leadId);
  }

  const where = leadIds ? { leadId: { in: leadIds } } : {};

  const records = await prisma.bilirkisi.findMany({
    where,
    include: {
      lead: {
        select: {
          id: true, leadCode: true, customerName: true,
          accidentType: true, status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const gecikmiş = records.filter(
    (r) => !r.raporGeldiMi && r.teslimTarihi && new Date(r.teslimTarihi) < now
  ).length;

  return {
    total: records.length,
    raporBekleyen: records.filter((r) => !r.raporGeldiMi).length,
    raporGeldi: records.filter((r) => r.raporGeldiMi && !r.itirazEdildi).length,
    itirazEdildi: records.filter((r) => r.itirazEdildi).length,
    gecikmiş,
    records,
  };
}

/**
 * İletişim merkezinde gösterilecek lead listesi + son aktivite logları.
 * LAWYER ise sadece atanmış davalar.
 */
async function getIletisimOzet(userId, userRole) {
  const where = { status: { notIn: ["LOST"] } };

  if (userRole === "LAWYER") {
    const assignments = await prisma.assignment.findMany({
      where: { lawyerId: userId, isActive: true },
      select: { leadId: true },
    });
    where.id = { in: assignments.map((a) => a.leadId) };
  }

  const leads = await prisma.lead.findMany({
    where,
    select: {
      id: true,
      leadCode: true,
      customerName: true,
      customerPhone: true,
      customerEmail: true,
      status: true,
      accidentType: true,
      accidentDate: true,
      city: true,
      updatedAt: true,
      activities: {
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, action: true, detail: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 150,
  });

  return leads.map((l) => ({
    ...l,
    lastContact: l.activities[0]?.createdAt ?? null,
    recentLogs: l.activities,
  }));
}

/**
 * Kritik sureleri olan lead'leri role-aware olarak listeler.
 * LAWYER: sadece atandigi lead'ler. ADMIN/diger: tum aktif lead'ler.
 * Donus: [{ lead, sure }] — GECTI > KIRMIZI > SARI, kalan gun artan.
 */
async function getKritikSureler(user) {
  const where = {
    status: { notIn: ["WON", "LOST"] },
  };

  if (user && user.role === "LAWYER") {
    const assignments = await prisma.assignment.findMany({
      where: { lawyerId: user.id, isActive: true },
      select: { leadId: true },
    });
    where.id = { in: assignments.map((a) => a.leadId) };
  }

  const leadler = await prisma.lead.findMany({
    where,
    select: {
      id: true,
      leadCode: true,
      customerName: true,
      accidentDate: true,
      injurySeverity: true,
      muhatapTipi: true,
      muhatapAdi: true,
      status: true,
      ihtarnameler: {
        select: { gonderimTarihi: true },
        orderBy: { gonderimTarihi: "asc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const kritikler = [];
  for (const lead of leadler) {
    const sureler = hesaplaSureler(lead);
    const kritikSureler = sureler.filter(
      (s) => s.durum === "SARI" || s.durum === "KIRMIZI" || s.durum === "GECTI"
    );
    for (const sure of kritikSureler) {
      kritikler.push({
        lead: {
          id: lead.id,
          leadCode: lead.leadCode,
          musterAdi: lead.customerName || "",
          muhatapTipi: lead.muhatapTipi,
          muhatapAdi: lead.muhatapAdi,
        },
        sure,
      });
    }
  }

  const oncelik = { GECTI: 0, KIRMIZI: 1, SARI: 2 };
  kritikler.sort((a, b) => {
    const fark = oncelik[a.sure.durum] - oncelik[b.sure.durum];
    if (fark !== 0) return fark;
    return a.sure.kalanGun - b.sure.kalanGun;
  });

  return kritikler;
}

module.exports = { getLeadFunnel, getConversionRate, getRevenueEstimate, getLeadsBySource, getLawyerPerformance, getMonthlyTrend, getCalendarData, getKomisyonSummary, getBilirkisiSummary, getIletisimOzet, getKritikSureler };
