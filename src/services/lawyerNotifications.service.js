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

async function notifyAiAnalysisCompleted(leadId, summary) {
  const lawyers = await getLawyersForLead(leadId);
  for (const lawyer of lawyers) {
    await sendCombo({
      lawyer,
      subject: `AI muhatap analizi tamamlandi - Dosya ${leadId}`,
      body: `<p>Sayin Av. ${lawyer.fullName || ""},</p><p>AI muhatap analizi tamamlandi.</p><p>Ozet: ${summary || ""}</p>`,
      pushPayload: { title: "AI analizi hazir", body: "Muhatap analizi inceleyin", url: `/leads/${leadId}/360` },
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

module.exports = {
  notifyDocumentUploaded,
  notifyAiAnalysisCompleted,
  notifyContractSigned,
  notifyCommissionLogCreated,
  notifyKvkkDeletionRequest,
  notifyDavaAsamaIlerleme,
};
