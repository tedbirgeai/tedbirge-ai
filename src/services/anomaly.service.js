// TUR #57 A2 — CEO komuta köprüsü için canlı anomali tespiti

const prisma = require("../config/db");

/**
 * 3 ana anomaliyi tespit eder. UI üst sınır 3 kayıt (Bölüm B §2.1).
 * Sıra: kritik > warning > info.
 */
async function detectAnomalies() {
  const anomalies = [];

  // 1. AI onay bekleyen lead'ler (Madde 24.11)
  try {
    const aiPending = await prisma.lead.count({
      where: { aiAnalizOnay: "BEKLIYOR" },
    });
    if (aiPending > 0) {
      anomalies.push({
        id: "ai-pending",
        severity: "critical",
        title: `AI <0.7 onay bekleyen ${aiPending} lead`,
        count: aiPending,
        href: "/dashboard/leads?filter=ai-pending",
      });
    }
  } catch (e) {
    console.warn("[ANOMALY] aiPending fail:", e.message);
  }

  // 2. KVKK 30 gün dolmak üzere (DataSubjectRequest, status PENDING/IN_REVIEW, 27-33 gün arası)
  try {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const kvkkOverdue = await prisma.dataSubjectRequest.count({
      where: {
        status: { in: ["PENDING", "IN_REVIEW"] },
        receivedAt: {
          gte: new Date(now - 33 * day),
          lt: new Date(now - 27 * day),
        },
      },
    });
    if (kvkkOverdue > 0) {
      anomalies.push({
        id: "kvkk-overdue",
        severity: "warning",
        title: `KVKK 30 gun dolmak uzere (${kvkkOverdue})`,
        count: kvkkOverdue,
        href: "/dashboard/kvkk-talepler",
      });
    }
  } catch (e) {
    console.warn("[ANOMALY] kvkkOverdue fail:", e.message);
  }

  // 3. Komisyon havalesi 7+ gün ödenmemiş (durum BEKLIYOR/HESAPLANDI + createdAt 7 gün+ önce)
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const komisyonOdenmemis = await prisma.commissionLog.count({
      where: {
        durum: { in: ["BEKLIYOR", "HESAPLANDI"] },
        createdAt: { lt: sevenDaysAgo },
      },
    });
    if (komisyonOdenmemis > 0) {
      anomalies.push({
        id: "komisyon-bekleyen",
        severity: "warning",
        title: `7+ gun odenmemis komisyon: ${komisyonOdenmemis}`,
        count: komisyonOdenmemis,
        href: "/dashboard/komisyon-log",
      });
    }
  } catch (e) {
    console.warn("[ANOMALY] komisyon fail:", e.message);
  }

  return anomalies.slice(0, 3);
}

module.exports = { detectAnomalies };
