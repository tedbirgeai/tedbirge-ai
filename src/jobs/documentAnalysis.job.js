const prisma = require("../config/db");
const { analyzeDocument } = require("../services/ai.service");
const { sendSms } = require("../services/sms.service");
const { sendWhatsAppMessage } = require("../services/whatsapp.service");
const { sendToUser } = require("../services/pushNotification.service");

async function rerunAnalysis(documentId) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { lead: true }
  });

  if (!document || !document.parsedText) {
    throw new Error("Belge veya parse edilmis icerik bulunamadi");
  }

  const result = await analyzeDocument(document.parsedText, document.lead);

  await prisma.document.update({
    where: { id: documentId },
    data: {
      aiAnalysis: JSON.stringify(result),
      extractedJson: JSON.stringify(result),
      status: "ANALYZED"
    }
  });

  // ── AI analizi tamamlandı bildirimleri ──────────────────────────────────────
  const lead = document.lead;
  if (lead?.customerPhone) {
    const msg = `Sayin ${(lead.customerName || "").split(" ")[0]}, belgelerinizin AI analizi tamamlandi. Dosya: ${lead.leadCode} | tedbirge.ai/basvuru-sorgula`;

    sendSms(lead.customerPhone, msg).catch((e) =>
      console.error("[SMS] AI analiz bildirim hatası:", e.message)
    );
    sendWhatsAppMessage(
      lead.customerPhone,
      `Sayın ${lead.customerName}, belgeleriniz analiz edildi.\nDosya: ${lead.leadCode}\nTakip: tedbirge.ai/basvuru-sorgula`
    ).catch((e) => console.error("[WA] AI analiz bildirim hatası:", e.message));

    // Push notification
    if (lead.ownerId) {
      sendToUser(lead.ownerId, {
        title: "Tedbirge — Analiz Tamamlandı",
        body: "Belgelerinizin AI analizi tamamlandı.",
        url: "/musteri",
        tag: `doc-analyzed-${documentId}`,
      }).catch(() => {});
    }

    // ActivityLog
    await prisma.activityLog.create({
      data: {
        leadId: lead.id,
        action: "BILDIRIM_GONDERILDI",
        detail: `AI analizi tamamlandı bildirimi gönderildi (SMS + WhatsApp). Belge: ${document.originalName || documentId}`,
      },
    }).catch(() => {});
  }

  return result;
}

module.exports = { rerunAnalysis };
