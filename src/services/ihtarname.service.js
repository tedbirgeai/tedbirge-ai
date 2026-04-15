const prisma = require("../config/db");
const { sendSms } = require("./sms.service");
const { sendWhatsAppMessage } = require("./whatsapp.service");
const { sendToUser } = require("./pushNotification.service");

async function listIhtarnameler(leadId) {
  return prisma.ihtarnameTakip.findMany({
    where: { leadId },
    orderBy: { createdAt: "desc" },
  });
}

async function createIhtarname(leadId, data) {
  return prisma.ihtarnameTakip.create({
    data: {
      leadId,
      karsiTaraf: data.karsiTaraf || null,
      tur: data.tur || "SIGORTA",
      durum: data.durum || "HAZIRLANIYOR",
      gonderimTarihi: data.gonderimTarihi ? new Date(data.gonderimTarihi) : null,
      notlar: data.notlar || null,
    },
  });
}

async function updateIhtarname(ihtarnameId, data) {
  const updated = await prisma.ihtarnameTakip.update({
    where: { id: ihtarnameId },
    data: {
      karsiTaraf:    data.karsiTaraf,
      tur:           data.tur,
      durum:         data.durum,
      gonderimTarihi: data.gonderimTarihi ? new Date(data.gonderimTarihi) : undefined,
      cevapTarihi:    data.cevapTarihi    ? new Date(data.cevapTarihi)    : undefined,
      cevapIcerigi:   data.cevapIcerigi,
      teklifTutari:   data.teklifTutari != null ? parseFloat(data.teklifTutari) : undefined,
      teklifTarihi:   data.teklifTarihi   ? new Date(data.teklifTarihi)   : undefined,
      sonrakiAdim:    data.sonrakiAdim,
      notlar:         data.notlar,
    },
  });

  // ── Teklif bildirim akışı ───────────────────────────────────────────────────
  const isTeklifDurumu = ["TEKLIF_ALINDI", "CEVAP_GELDI"].includes(data.durum);
  if (isTeklifDurumu && data.teklifTutari) {
    // Lead'i bul
    const lead = await prisma.lead.findFirst({
      where: { ihtarnameler: { some: { id: ihtarnameId } } },
      select: { id: true, customerName: true, customerPhone: true, leadCode: true, ownerId: true },
    }).catch(() => null);

    if (lead?.customerPhone) {
      const tutarStr = Number(data.teklifTutari).toLocaleString("tr-TR") + " TL";
      const msg = `Sayin ${(lead.customerName || "").split(" ")[0]}, sigorta sirketinden ${tutarStr} teklif geldi. Avukatiniz degerlendirmektedir. Dosya: ${lead.leadCode}`;

      sendSms(lead.customerPhone, msg).catch((e) =>
        console.error("[SMS] Teklif bildirim hatası:", e.message)
      );
      sendWhatsAppMessage(
        lead.customerPhone,
        `Sayın ${lead.customerName}, sigorta teklifiniz geldi: ${tutarStr}.\nAvukatınız değerlendirmektedir.\nDosya: ${lead.leadCode}`
      ).catch((e) => console.error("[WA] Teklif bildirim hatası:", e.message));

      if (lead.ownerId) {
        sendToUser(lead.ownerId, {
          title: "Tedbirge — Teklif Geldi",
          body: `Sigorta teklifiniz geldi: ${tutarStr}`,
          url: "/musteri",
          tag: `teklif-${ihtarnameId}`,
        }).catch(() => {});
      }

      await prisma.activityLog.create({
        data: {
          leadId: lead.id,
          action: "BILDIRIM_GONDERILDI",
          detail: `Teklif bildirimi gönderildi (SMS + WhatsApp). Tutar: ${tutarStr}`,
        },
      }).catch(() => {});
    }
  }

  return updated;
}

module.exports = { listIhtarnameler, createIhtarname, updateIhtarname };
