/**
 * YENİ — Müvekkil Adayı Takip Cron Job'u
 *
 * Her saat başı çalışır. Tedbirge AI Asistanı'na e-posta bırakıp 24-48 saat
 * içinde tam başvuru yapmamış adaylara BİR KEZ takip e-postası gönderir.
 *
 * 0 hata ilkesi: yeni tablo/migration yok — mevcut ActivityLog üzerinden
 * hem kaynak veriyi (HERO_ASSISTANT_EMAIL_CAPTURED) hem "zaten gönderildi"
 * bilgisini (PROSPECT_FOLLOWUP_SENT) okur/yazar. Abonelikten çıkmış
 * adresler (MARKETING_UNSUBSCRIBE) otomatik atlanır.
 */

const cron = require("node-cron");
const prisma = require("../config/db");
const logger = require("../config/logger");
const { sendProspectFollowUpEmail } = require("../services/email.service");

async function runProspectFollowUp() {
  logger.info("[ProspectFollowUp] Kontrol başladı");
  try {
    const [captured, alreadySent, unsubscribed] = await Promise.all([
      prisma.activityLog.findMany({ where: { action: "HERO_ASSISTANT_EMAIL_CAPTURED" }, take: 2000 }),
      prisma.activityLog.findMany({ where: { action: "PROSPECT_FOLLOWUP_SENT" }, take: 2000 }),
      prisma.activityLog.findMany({ where: { action: "MARKETING_UNSUBSCRIBE" }, take: 2000 }),
    ]);

    const sentEmails = new Set(
      alreadySent.map((l) => (String(l.detail || "").match(/email:(\S+)/) || [])[1]).filter(Boolean)
    );
    const unsubEmails = new Set(
      unsubscribed
        .map((l) => {
          try {
            return (JSON.parse(l.detail || "{}").email || "").trim().toLowerCase();
          } catch {
            return null;
          }
        })
        .filter(Boolean)
    );

    const now = Date.now();
    const MIN_H = 24 * 60 * 60 * 1000;
    const MAX_H = 48 * 60 * 60 * 1000; // pencere: 24-48 saat arası (job saatlik çalışsa da tek kez yakalar)

    let sent = 0;
    const seenThisRun = new Set();

    for (const log of captured) {
      const email = (String(log.detail || "").match(/email:(\S+)/) || [])[1];
      if (!email) continue;
      const clean = email.trim().toLowerCase();
      if (seenThisRun.has(clean)) continue; // aynı emailin en güncel yakalamasını kullan
      seenThisRun.add(clean);

      if (sentEmails.has(email) || unsubEmails.has(clean)) continue;

      const age = now - new Date(log.createdAt).getTime();
      if (age < MIN_H || age > MAX_H) continue;

      try {
        const r = await sendProspectFollowUpEmail(email);
        await prisma.activityLog.create({
          data: { action: "PROSPECT_FOLLOWUP_SENT", detail: `email:${email}` },
        });
        if (r?.success) sent++;
      } catch (e) {
        logger.error(`[ProspectFollowUp] Gönderim hatası (${email}): ${e.message}`);
      }
    }

    logger.info(`[ProspectFollowUp] Tamamlandı — gönderilen: ${sent}`);
  } catch (err) {
    logger.error(`[ProspectFollowUp] Kritik hata: ${err.message}`);
  }
}

function startProspectFollowUp() {
  // Her saat başı
  cron.schedule("0 * * * *", () => {
    runProspectFollowUp().catch((err) =>
      logger.error(`[ProspectFollowUp] Beklenmeyen hata: ${err.message}`)
    );
  });
  logger.info("[ProspectFollowUp] Müvekkil adayı takip cron job başlatıldı (saatlik)");
}

module.exports = { startProspectFollowUp, runProspectFollowUp };
