/**
 * Zamanaşımı Kontrol Cron Job
 *
 * Her gün saat 08:00'de çalışır.
 * Tüm aktif lead'leri tarar ve zamanaşımı yaklaşanlar için
 * avukata e-posta + SMS, 7 gün kalanda müvekkile de SMS gönderir.
 *
 * Zamanaşımı kuralları:
 *   - Trafik kazası (KTK m.109): 2 yıl = 730 gün
 *   - İş kazası     (BK m.146) : 10 yıl = 3650 gün
 */

const cron = require("node-cron");
const prisma = require("../config/db");
const logger = require("../config/logger");
const { sendStatuteLimitWarningEmail } = require("../services/email.service");
const { sendStatuteLimitWarningSms }   = require("../services/sms.service");
const { sendStatuteOfLimitationsWarning } = require("../services/whatsapp.service");
const { getUpcomingDurusmalar, markHatirlatildi } = require("../services/durusma.service");
const { sendToUser } = require("../services/pushNotification.service");

// Kaza türüne göre zamanaşımı süresi (gün)
const LIMITATION_DAYS = {
  TRAFIK_KAZASI: 730,
  IS_KAZASI:     3650,
};

const DEFAULT_LIMITATION = 730;

// Aktif sayılan statüler
const ACTIVE_STATUSES = [
  "NEW", "CONTACTED", "DOCS_PENDING", "DOCS_RECEIVED",
  "ANALYZED", "OFFER_SENT", "CONTRACT_PENDING", "ASSIGNED_TO_LAWYER",
];

/**
 * Kaza tarihinden kalan gün sayısını hesapla.
 * @param {Date} accidentDate
 * @param {string} accidentType
 * @returns {number} kalan gün (negatif = aşıldı)
 */
function calcRemainingDays(accidentDate, accidentType) {
  const limitDays = LIMITATION_DAYS[accidentType] ?? DEFAULT_LIMITATION;
  const deadlineMs = new Date(accidentDate).getTime() + limitDays * 24 * 60 * 60 * 1000;
  const nowMs = Date.now();
  return Math.ceil((deadlineMs - nowMs) / (24 * 60 * 60 * 1000));
}

async function runDeadlineCheck() {
  logger.info("[DeadlineChecker] Zamanaşımı kontrolü başladı");

  try {
    // Kaza tarihi olan aktif lead'leri çek + atanmış avukatı dahil et
    const leads = await prisma.lead.findMany({
      where: {
        status: { in: ACTIVE_STATUSES },
        accidentDate: { not: null },
      },
      include: {
        assignments: {
          include: { lawyer: true },
          orderBy: { assignedAt: "desc" },
          take: 1,
        },
      },
    });

    let warned30 = 0;
    let warned7  = 0;

    for (const lead of leads) {
      const remaining = calcRemainingDays(lead.accidentDate, lead.accidentType);

      const lawyer = lead.assignments?.[0]?.lawyer ?? null;

      // 30 gün kalan: avukata e-posta + SMS + WhatsApp
      if (remaining <= 30 && remaining > 7) {
        try {
          await Promise.allSettled([
            sendStatuteLimitWarningEmail(lead, lawyer, remaining),
            lawyer?.phone
              ? sendStatuteOfLimitationsWarning(lead, lawyer.phone, lawyer.fullName, remaining)
              : Promise.resolve(),
          ]);
          warned30++;
          logger.info(
            `[DeadlineChecker] 30 gün uyarısı gönderildi — lead: ${lead.leadCode}, kalan: ${remaining} gün`
          );
        } catch (e) {
          logger.error(`[DeadlineChecker] Uyarı gönderme hatası (${lead.leadCode}): ${e.message}`);
        }
      }

      // 7 gün kalan: hem avukata hem müvekkile SMS
      if (remaining <= 7 && remaining > 0) {
        try {
          await Promise.allSettled([
            sendStatuteLimitWarningEmail(lead, lawyer, remaining),
            lawyer?.phone
              ? sendStatuteOfLimitationsWarning(lead, lawyer.phone, lawyer.fullName, remaining)
              : Promise.resolve(),
            lead.customerPhone
              ? sendStatuteLimitWarningSms(lead, remaining)
              : Promise.resolve(),
          ]);
          warned7++;
          logger.info(
            `[DeadlineChecker] 7 gün kritik uyarısı gönderildi — lead: ${lead.leadCode}, kalan: ${remaining} gün`
          );
        } catch (e) {
          logger.error(`[DeadlineChecker] Kritik uyarı hatası (${lead.leadCode}): ${e.message}`);
        }
      }
    }

    logger.info(
      `[DeadlineChecker] Tamamlandı — toplam: ${leads.length}, 30-gün uyarı: ${warned30}, 7-gün uyarı: ${warned7}`
    );
  } catch (err) {
    logger.error(`[DeadlineChecker] Kritik hata: ${err.message}`);
  }
}

/**
 * 3 gün içindeki duruşmalar için avukatlara SMS + e-posta gönder.
 */
async function runDurusmaCheck() {
  logger.info("[DurusmaChecker] Duruşma hatırlatma kontrolü başladı");
  try {
    const yaklaşan = await getUpcomingDurusmalar(3);
    let sent = 0;

    for (const durusma of yaklaşan) {
      const lead = durusma.lead;
      const lawyer = lead?.assignments?.[0]?.lawyer ?? null;
      const tarihStr = new Date(durusma.tarih).toLocaleDateString("tr-TR");
      const saatStr = durusma.saat || "";

      if (lawyer?.phone) {
        try {
          await sendStatuteLimitWarningSms(
            lead,
            0, // daysRemaining alanı kötüye kullanılmasın; mesaj override ediliyor
            `[DURUŞMA HATIRLATMA] ${lead.leadCode} - ${tarihStr} ${saatStr} - ${durusma.mahkeme || ""}`
          );
        } catch (e) {
          logger.error(`[DurusmaChecker] SMS hatası (${lead.leadCode}): ${e.message}`);
        }
      }

      if (lawyer?.email) {
        try {
          await sendStatuteLimitWarningEmail(
            { ...lead, _durusmaOverride: { tarih: tarihStr, saat: saatStr, mahkeme: durusma.mahkeme } },
            lawyer,
            0
          );
        } catch (e) {
          logger.error(`[DurusmaChecker] E-posta hatası (${lead.leadCode}): ${e.message}`);
        }
      }

      // Push notification — avukata duruşma hatırlatma
      if (lawyer?.id) {
        sendToUser(lawyer.id, {
          title: "Yaklaşan Duruşma",
          body: `${lead.leadCode} · ${tarihStr} ${saatStr} ${durusma.mahkeme ? `— ${durusma.mahkeme}` : ""}`.trim(),
          url: `/leads/${lead.id}`,
          tag: `durusma-${durusma.id}`,
        }).catch(() => {});
      }

      await markHatirlatildi(durusma.id).catch(() => {});
      sent++;
      logger.info(`[DurusmaChecker] Hatırlatma gönderildi — lead: ${lead.leadCode}, tarih: ${tarihStr}`);
    }

    logger.info(`[DurusmaChecker] Tamamlandı — toplam: ${yaklaşan.length}, gönderilen: ${sent}`);
  } catch (err) {
    logger.error(`[DurusmaChecker] Kritik hata: ${err.message}`);
  }
}

/**
 * Cron job'u başlat.
 * Schedule: Her gün saat 08:00 (sunucu yerel saati)
 */
function startDeadlineChecker() {
  // "0 8 * * *" = dakika:0, saat:8, her gün
  cron.schedule("0 8 * * *", () => {
    runDeadlineCheck().catch((err) =>
      logger.error(`[DeadlineChecker] Beklenmeyen hata: ${err.message}`)
    );
    runDurusmaCheck().catch((err) =>
      logger.error(`[DurusmaChecker] Beklenmeyen hata: ${err.message}`)
    );
  });

  logger.info("[DeadlineChecker] Zamanaşımı + duruşma kontrol cron job başlatıldı (her gün 08:00)");
}

module.exports = { startDeadlineChecker, runDeadlineCheck };
