const webpush = require("web-push");
const prisma = require("../config/db");

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT     || "mailto:info@tedbirge.ai";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

/**
 * Kullanıcının push aboneliğini kaydet (veya güncelle).
 */
async function saveSubscription(userId, subscriptionData) {
  const { endpoint, keys } = subscriptionData;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error("Geçersiz push subscription verisi.");
  }

  return prisma.pushSubscription.upsert({
    where:  { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId },
    create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });
}

/**
 * Kullanıcının tüm push aboneliklerini sil.
 */
async function removeSubscription(userId, endpoint) {
  return prisma.pushSubscription.deleteMany({
    where: endpoint ? { userId, endpoint } : { userId },
  });
}

/**
 * Tek bir kullanıcıya push bildirimi gönder.
 */
async function sendToUser(userId, payload) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.log("[PUSH MOCK]", userId, JSON.stringify(payload));
    return;
  }

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
        { TTL: 60 * 60 * 24 } // 24 saat
      ).catch(async (err) => {
        // 410 Gone → subscription expire olmuş, sil
        if (err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { endpoint: s.endpoint } }).catch(() => {});
        }
        throw err;
      })
    )
  );

  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed) console.warn(`[PUSH] ${failed}/${subs.length} bildirim gönderilemedi`);
}

/**
 * Belirli role sahip tüm kullanıcılara push bildirimi gönder.
 */
async function sendToRole(role, payload) {
  const users = await prisma.user.findMany({
    where: { role, isActive: true },
    select: { id: true },
  });
  await Promise.allSettled(users.map((u) => sendToUser(u.id, payload)));
}

module.exports = { saveSubscription, removeSubscription, sendToUser, sendToRole, VAPID_PUBLIC };
