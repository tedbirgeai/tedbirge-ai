// TUR #92 Q4 — 2FA Onboarding Hatırlatma Email Servisi (Madde 30.32 R1)
// Otonom: HARD 2FA rolüne sahip + 7 gün+ 2FA aktive etmemiş user'lara
// gece 09:00 cron + 3 gün debounce + ActivityLog kanıt + AgentEvent metric.
//
// Schema dokunma yasak (Madde 3.1 KIRMIZI) — last reminder timestamp
// User'a yeni alan ile değil, ActivityLog türetilerek hesaplanır.

const prisma = require("../config/db");
const { sendEmail } = require("./email.service");

const HARD_2FA_ROLES = ["ADMIN", "LAWYER", "REPRESENTATIVE", "SALES"];
const DEBOUNCE_DAYS = 3; // Aynı user'a 3 gün içinde 2. email YASAK
const ONBOARDING_DELAY_DAYS = 7; // User created 7 gün+ ise hatırlatma başla

function buildOnboardingHtml(user) {
  const greet = user.fullName || "Değerli Kullanıcı";
  return `<!DOCTYPE html><html><body style="font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;padding:20px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;">
  <h2 style="color:#1e293b;margin:0 0 16px;">Merhaba ${greet},</h2>
  <p style="color:#475569;line-height:1.6;">
    Tedbirge.ai paneline tek tıkla erişim için hesap güvenliğinizi (2 adımlı doğrulama)
    henüz tamamlamadınız.
  </p>
  <p style="color:#475569;line-height:1.6;">
    <strong>Aktivasyon en kolay yöntemle 30 saniye sürer:</strong>
  </p>
  <div style="text-align:center;margin:24px 0;">
    <a href="https://www.tedbirge.ai/login"
       style="display:inline-block;background:#1e1e8e;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
      Hesap Güvenliğini Aktive Et
    </a>
  </div>
  <ol style="color:#475569;line-height:1.8;">
    <li>E-posta + şifrenizle giriş yapın</li>
    <li>Açılan ekranda <strong>"E-posta"</strong> yöntemini seçin (önerilen)</li>
    <li>Size gelen 6 haneli kodu girin</li>
    <li>Tamamlandı — panele erişiminiz aktiftir</li>
  </ol>
  <p style="color:#94a3b8;font-size:12px;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:16px;">
    Sorularınız için: <a href="mailto:destek@tedbirge.ai" style="color:#1e1e8e;">destek@tedbirge.ai</a><br>
    KVKK m.12 gereği hesap güvenliğinizin aktivasyonu zorunludur.
  </p>
  <p style="color:#94a3b8;font-size:11px;margin-top:8px;">
    Tedbirge.ai · Hukuk Teknolojileri · 2026
  </p>
</div></body></html>`;
}

/**
 * Tek user için onboarding email gönderir + ActivityLog yazar.
 * ADMIN dashboard "manuel hatırlat" butonu da bu fonksiyonu çağırır.
 */
async function sendOnboardingReminder(user) {
  if (!user || !user.email) return { sent: false, reason: "no_email" };
  if (user.twoFactorEnabled) return { sent: false, reason: "already_enabled" };

  try {
    await sendEmail({
      to: user.email,
      subject: "Tedbirge.ai — Hesap güvenliğinizi tamamlayın (30 saniye)",
      html: buildOnboardingHtml(user),
    });
    // Madde 3.1 KIRMIZI — schema'da ActivityLog.userId YOK, detail field kullan
    const masked = user.email.replace(/(.{2}).*(@.*)/, "$1***$2");
    await prisma.activityLog.create({
      data: {
        action: "TWO_FACTOR_ONBOARDING_REMINDER_SENT",
        detail: `userId:${user.id} · role:${user.role} · email:${masked}`,
      },
    });
    return { sent: true, userId: user.id };
  } catch (err) {
    console.error(`[OnboardingReminder] ${user.email} email gönderilemedi:`, err.message);
    return { sent: false, reason: "email_error", error: err.message };
  }
}

/**
 * Cron tetik (Reporter agent 09:00) — HARD rol + 7 gün+ + 2FA off + 3 gün debounce.
 */
async function runOnboardingBatch() {
  const sevenDaysAgo = new Date(Date.now() - ONBOARDING_DELAY_DAYS * 24 * 60 * 60 * 1000);
  const debounceCutoff = new Date(Date.now() - DEBOUNCE_DAYS * 24 * 60 * 60 * 1000);

  const stuckUsers = await prisma.user.findMany({
    where: {
      twoFactorEnabled: false,
      isActive: true,
      deletedAt: null,
      role: { in: HARD_2FA_ROLES },
      createdAt: { lt: sevenDaysAgo },
    },
    select: { id: true, email: true, fullName: true, role: true },
  });

  if (stuckUsers.length === 0) {
    return { stuckCount: 0, sentCount: 0, skipped: 0 };
  }

  // ActivityLog'tan son hatırlatma zamanını türet (Madde 3.1 KIRMIZI: User'a yeni alan eklenmiyor)
  // ActivityLog.userId field YOK — detail içinde "userId:abc" prefix ile saklanır
  const lastReminders = await prisma.activityLog.findMany({
    where: {
      action: "TWO_FACTOR_ONBOARDING_REMINDER_SENT",
      createdAt: { gte: debounceCutoff },
    },
    select: { detail: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  // detail'den userId regex ile çıkar (`userId:abc123 · ...`)
  const recentReminderUserIds = new Set();
  for (const r of lastReminders) {
    const m = r.detail?.match(/userId:([a-z0-9]+)/i);
    if (m) recentReminderUserIds.add(m[1]);
  }

  let sentCount = 0;
  let skipped = 0;
  for (const user of stuckUsers) {
    if (recentReminderUserIds.has(user.id)) {
      skipped++;
      continue; // 3 gün debounce
    }
    const r = await sendOnboardingReminder(user);
    if (r.sent) sentCount++;
  }

  // AgentEvent metric (akış paneli görünür)
  await prisma.agentEvent.create({
    data: {
      agentName: "security",
      eventType: "ONBOARDING_REMINDER_BATCH",
      severity: stuckUsers.length > 0 ? "WARNING" : "INFO",
      payload: {
        message: `Onboarding hatırlatma: ${stuckUsers.length} stuck user, ${sentCount} email gönderildi, ${skipped} debounce skip`,
        stuckCount: stuckUsers.length,
        sentCount,
        skipped,
      },
    },
  }).catch(() => {});

  return { stuckCount: stuckUsers.length, sentCount, skipped };
}

module.exports = { sendOnboardingReminder, runOnboardingBatch };
