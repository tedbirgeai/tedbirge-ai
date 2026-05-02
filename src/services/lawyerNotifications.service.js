// TUR #52 — LAWYER 6 yeni bildirim tipi (TUR #51 L1+L4 bulgu)
// Mevcut sendEmail + sendToUser (push) yardimcilarini kullanir

const prisma = require("../config/db");
const { sendEmail } = require("./email.service");
let sendToUser;
try {
  ({ sendToUser } = require("./pushNotification.service"));
} catch (e) {
  sendToUser = null;
}

async function getLawyersForLead(leadId) {
  const assignments = await prisma.assignment.findMany({
    where: { leadId, status: "ACTIVE" },
    include: { lawyer: { select: { id: true, fullName: true, email: true } } },
  });
  return assignments.map((a) => a.lawyer).filter(Boolean);
}

async function sendCombo({ lawyer, subject, body, pushPayload }) {
  const tasks = [];
  if (lawyer?.email) {
    tasks.push(sendEmail({ to: lawyer.email, subject, html: body }).catch((e) => {
      console.warn("[LAWYER NOTIF] email hata:", e.message);
    }));
  }
  if (sendToUser && lawyer?.id) {
    tasks.push(sendToUser(lawyer.id, pushPayload).catch((e) => {
      console.warn("[LAWYER NOTIF] push hata:", e.message);
    }));
  }
  if (tasks.length) await Promise.allSettled(tasks);
}

async function notifyDocumentUploaded(leadId, document) {
  const lawyers = await getLawyersForLead(leadId);
  for (const lawyer of lawyers) {
    await sendCombo({
      lawyer,
      subject: `Yeni belge yuklendi - Dosya ${leadId}`,
      body: `<p>Sayin Av. ${lawyer.fullName || ""},</p><p>Atanmis dosyaniza yeni bir belge yuklendi: <strong>${document?.fileName || "Belge"}</strong></p><p>Panelden inceleyebilirsiniz.</p>`,
      pushPayload: { title: "Yeni belge yuklendi", body: document?.fileName || "Belge incelenmeyi bekliyor", url: `/leads/${leadId}` },
    });
  }
}

async function notifyAiAnalysisCompleted(leadId, summary, requiresReview = false) {
  const lawyers = await getLawyersForLead(leadId);
  const reviewMark = requiresReview ? " [ONAY GEREKLI - Madde 24.11]" : "";
  for (const lawyer of lawyers) {
    await sendCombo({
      lawyer,
      subject: `AI muhatap analizi tamamlandi - Dosya ${leadId}${reviewMark}`,
      body: `<p>Sayin Av. ${lawyer.fullName || ""},</p><p>AI muhatap analizi tamamlandi.${requiresReview ? " <strong>Guven skoru esik altinda - manuel onay zorunlu (Madde 24.11).</strong>" : ""}</p><p>Ozet: ${summary || ""}</p>`,
      pushPayload: {
        title: requiresReview ? "AI analizi - ONAY BEKLIYOR" : "AI analizi hazir",
        body: requiresReview ? "Dusuk guven, manuel onay gerek (Madde 24.11)" : "Muhatap analizi inceleyin",
        url: `/leads/${leadId}/360`
      },
    });
  }
}

async function notifyContractSigned(leadId, contractInfo) {
  const lawyers = await getLawyersForLead(leadId);
  for (const lawyer of lawyers) {
    await sendCombo({
      lawyer,
      subject: `Sozlesme imzalandi - Dosya ${leadId}`,
      body: `<p>Sayin Av. ${lawyer.fullName || ""},</p><p>Mukvekkil sozlesmesi imzalandi: <strong>${contractInfo?.title || "Vekalet"}</strong></p>`,
      pushPayload: { title: "Sozlesme imzalandi", body: contractInfo?.title || "Vekalet aktif", url: `/leads/${leadId}/contracts` },
    });
  }
}

async function notifyCommissionLogCreated(leadId, commissionLog) {
  const lawyers = await getLawyersForLead(leadId);
  const tutar = commissionLog?.tahsilatBrut ? `${commissionLog.tahsilatBrut} TL` : "—";
  for (const lawyer of lawyers) {
    await sendCombo({
      lawyer,
      subject: `Tahsilat kaydedildi - Dosya ${leadId}`,
      body: `<p>Sayin Av. ${lawyer.fullName || ""},</p><p>Atanmis dosyaniza tahsilat kaydedildi: ${tutar}</p>`,
      pushPayload: { title: "Tahsilat kaydedildi", body: tutar, url: `/leads/${leadId}` },
    });
  }
}

async function notifyKvkkDeletionRequest(leadId, request) {
  const lawyers = await getLawyersForLead(leadId);
  for (const lawyer of lawyers) {
    await sendCombo({
      lawyer,
      subject: `KVKK silme talebi - Dosya ${leadId}`,
      body: `<p>Sayin Av. ${lawyer.fullName || ""},</p><p>Atanmis dosyanizla iliskili KVKK m.7 silme talebi alindi. Lutfen panelden inceleyin.</p>`,
      pushPayload: { title: "KVKK silme talebi", body: "Atanmis dosya icin", url: `/dashboard/kvkk-talepler/${request?.id}` },
    });
  }
}

async function notifyDavaAsamaIlerleme(leadId, asama) {
  const lawyers = await getLawyersForLead(leadId);
  for (const lawyer of lawyers) {
    await sendCombo({
      lawyer,
      subject: `Dava asamasi ilerledi - Dosya ${leadId}`,
      body: `<p>Sayin Av. ${lawyer.fullName || ""},</p><p>Dava asamasi guncellendi: <strong>${asama || ""}</strong></p>`,
      pushPayload: { title: "Dava asamasi", body: asama || "Asama ilerledi", url: `/leads/${leadId}/360` },
    });
  }
}

// TUR #66 v2 A4 — ADMIN AI HATA bildirim hook (Madde 32.10)
async function notifyAiAnalysisFailed(documentId, leadId, errorMessage) {
  const safeError = String(errorMessage || "Bilinmeyen hata").slice(0, 200);
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true, fullName: true, email: true },
  });

  for (const admin of admins) {
    await sendCombo({
      lawyer: admin,
      subject: `AI Analiz Hatasi - Belge ${documentId}`,
      body: `<p>Sayin ${admin.fullName || "Admin"},</p><p>Belge AI analizi basarisiz oldu.</p><p><strong>Document ID:</strong> ${documentId}</p><p><strong>Lead ID:</strong> ${leadId || "-"}</p><p><strong>Hata:</strong> ${safeError}</p><p>Panel ADMIN sayfasindan retry tetikleyebilirsiniz.</p>`,
      pushPayload: {
        title: "AI Analiz Hatasi",
        body: `Belge ${documentId.slice(0, 8)}... hata: ${safeError.slice(0, 80)}`,
        url: leadId ? `/leads/${leadId}` : "/dashboard/sistem-durumu",
      },
    });
  }

  try {
    await prisma.activityLog.create({
      data: {
        leadId: leadId || null,
        action: "AI_ANALYSIS_FAILED",
        detail: `documentId:${documentId} hata:${safeError}`,
      },
    });
  } catch (logErr) {
    console.warn("[LAWYER NOTIF] AI_ANALYSIS_FAILED activityLog hata:", logErr.message);
  }
}

module.exports = {
  notifyDocumentUploaded,
  notifyAiAnalysisCompleted,
  notifyAiAnalysisFailed,
  notifyContractSigned,
  notifyCommissionLogCreated,
  notifyKvkkDeletionRequest,
  notifyDavaAsamaIlerleme,
};
