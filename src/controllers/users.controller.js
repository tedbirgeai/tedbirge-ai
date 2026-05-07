// TUR #84 T2 — Kullanıcı CRUD KVKK Disiplini (Madde 30.37)
//
// Endpointler:
//   GET    /api/users               (ADMIN) — listele (yeni alanlar dahil)
//   PATCH  /api/users/:id           (ADMIN) — Düzenle (ad/email/telefon/rol)
//   PATCH  /api/users/:id/password  (ADMIN) — Şifre sıfırla (SMS/EMAIL)
//   PATCH  /api/users/:id/status    (ADMIN) — Pasif/Aktif/Suspended
//   PATCH  /api/users/:id/archive   (ADMIN) — Arşivle
//   DELETE /api/users/:id           (ADMIN) — Soft delete (KVKK m.6 — 5 yıl saklama)
//
// Korumalar:
//   - ADMIN role guard (route middleware)
//   - Self-protection: kendi user.id'i hedef alamaz (rol değişimi/sil/arşiv/pasif)
//   - Last-admin protection: son ADMIN silinemez/arşivlenemez/pasif yapılamaz
//   - ActivityLog audit kaydı (KVKK m.10)
//   - Hard delete YASAK (KVKK m.6 — 5 yıl saklama)

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSms, normalizePhone } = require("../services/sms.service");
const { sendEmail } = require("../services/email.service");

const VALID_ROLES = ["ADMIN", "LAWYER", "SALES", "REPRESENTATIVE", "CUSTOMER"];
const VALID_STATUSES = ["ACTIVE", "PASSIVE", "SUSPENDED"]; // ARCHIVED ayrı endpoint
const SAFE_SELECT = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  phone: true,
  isActive: true,
  status: true,
  archivedAt: true,
  deletedAt: true,
  lastPasswordResetAt: true,
  mustChangePasswordOnNextLogin: true,
  twoFactorEnabled: true,
  baroOnayDurumu: true,
  temsilciOnayDurumu: true,
  createdAt: true,
  sonGirisTarihi: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────

async function ensureNotLastAdmin(userId) {
  // Aktif (deletedAt null + status != ARCHIVED) ADMIN sayısı
  const adminCount = await prisma.user.count({
    where: {
      role: "ADMIN",
      deletedAt: null,
      status: { not: "ARCHIVED" },
    },
  });
  if (adminCount <= 1) {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (target?.role === "ADMIN") {
      throw new ApiError(409, "Son ADMIN kullanıcı silinemez/arşivlenemez/pasif yapılamaz.");
    }
  }
}

function ensureNotSelf(reqUser, targetId, action) {
  if (reqUser.id === targetId) {
    throw new ApiError(409, `Kendi hesabınızı ${action} işlemi yapamazsınız.`);
  }
}

async function logActivity(action, detail) {
  try {
    await prisma.activityLog.create({ data: { action, detail: JSON.stringify(detail) } });
  } catch (_e) {
    // ActivityLog hatası ana akışı bozmasın (KVKK audit best-effort)
  }
}

function generateTempPassword() {
  // 12 hane: 4 büyük + 4 küçük + 2 sayı + 2 özel (KVKK m.12 güvenli üretim)
  const upper = "ABCDEFGHIJKLMNPQRSTUVWXYZ"; // O hariç (karışıklık)
  const lower = "abcdefghijkmnpqrstuvwxyz";   // l, o hariç
  const digit = "23456789";                    // 0, 1 hariç
  const special = "!@#$%&*";
  const pick = (chars, n) => Array.from({ length: n }, () =>
    chars[crypto.randomInt(chars.length)]
  ).join("");
  const raw = pick(upper, 4) + pick(lower, 4) + pick(digit, 2) + pick(special, 2);
  // shuffle
  return raw.split("").sort(() => crypto.randomInt(2) - 0.5).join("");
}

// ─── Endpoints ────────────────────────────────────────────────────────────

// GET /api/users — listele (yeni alanlar dahil)
exports.listUsers = asyncHandler(async (req, res) => {
  const { includeArchived } = req.query || {};
  const where = includeArchived === "true"
    ? {}
    : { deletedAt: null, status: { not: "ARCHIVED" } };

  const users = await prisma.user.findMany({
    where,
    select: SAFE_SELECT,
    orderBy: { createdAt: "desc" },
  });
  res.json({ success: true, data: users });
});

// PATCH /api/users/:id — Düzenle (ad/email/telefon/rol)
exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName, email, phone, role } = req.body || {};

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new ApiError(404, "Kullanıcı bulunamadı.");
  if (target.deletedAt) throw new ApiError(409, "Silinmiş kullanıcı düzenlenemez.");

  const data = {};
  if (typeof fullName === "string" && fullName.trim().length >= 2) data.fullName = fullName.trim();

  if (typeof email === "string" && email.trim() !== target.email) {
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new ApiError(400, "Geçersiz e-posta formatı.");
    }
    const exists = await prisma.user.findUnique({ where: { email: trimmed } });
    if (exists && exists.id !== id) throw new ApiError(409, "Bu e-posta başka bir kullanıcıda kayıtlı.");
    data.email = trimmed;
  }

  if (typeof phone === "string") {
    data.phone = phone.trim() || null;
  }

  if (typeof role === "string" && role !== target.role) {
    if (!VALID_ROLES.includes(role)) throw new ApiError(400, "Geçersiz rol.");
    // Self-protection: kendi rolünü değiştiremez
    ensureNotSelf(req.user, id, "rol değiştirme");
    // Last-admin: ADMIN'den düşürme kontrolü
    if (target.role === "ADMIN") {
      await ensureNotLastAdmin(id);
    }
    data.role = role;
  }

  if (Object.keys(data).length === 0) {
    return res.json({ success: true, message: "Değişiklik yok.", data: { id } });
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: SAFE_SELECT,
  });

  await logActivity("USER_UPDATED", {
    adminId: req.user.id,
    targetId: id,
    changedFields: Object.keys(data),
  });

  res.json({ success: true, data: updated });
});

// PATCH /api/users/:id/password — ADMIN şifre sıfırla (SMS/EMAIL)
exports.resetUserPasswordByAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { channel } = req.body || {};

  if (!channel || !["SMS", "EMAIL"].includes(channel)) {
    throw new ApiError(400, "channel: 'SMS' veya 'EMAIL' zorunlu.");
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new ApiError(404, "Kullanıcı bulunamadı.");
  if (target.deletedAt) throw new ApiError(409, "Silinmiş kullanıcı için şifre sıfırlanamaz.");
  if (target.status === "ARCHIVED") throw new ApiError(409, "Arşivli kullanıcı için şifre sıfırlanamaz.");

  if (channel === "SMS" && !target.phone) {
    throw new ApiError(400, "Kullanıcının telefon numarası kayıtlı değil.");
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await prisma.user.update({
    where: { id },
    data: {
      passwordHash,
      lastPasswordResetAt: new Date(),
      passwordResetByAdminId: req.user.id,
      mustChangePasswordOnNextLogin: true,
    },
  });

  let deliveryStatus = "PENDING";
  let providerInfo = null;

  if (channel === "SMS") {
    const normalized = normalizePhone(target.phone);
    const message = `Tedbirge.ai gecici sifreniz: ${tempPassword}\n\nIlk girisinizde sifre degistirmek zorundasiniz. Guvenlik nedeniyle bu mesaji silmeyi unutmayin.`;
    const result = await sendSms(normalized, message);
    if (result?.success === false || !result) {
      deliveryStatus = "FAILED";
      providerInfo = { provider: "NetGSM", success: false };
    } else {
      deliveryStatus = "SENT";
      providerInfo = { provider: "NetGSM", bulkId: result?.bulkId, code: result?.code };
    }
  } else {
    try {
      const info = await sendEmail({
        to: target.email,
        subject: "Tedbirge.ai — Geçici şifre",
        html: `
          <p>Sayın ${target.fullName},</p>
          <p>Yönetici tarafından hesabınız için geçici şifre oluşturulmuştur:</p>
          <p style="font-family: monospace; font-size: 18px; background: #f5f5f5; padding: 12px; border-radius: 8px;">${tempPassword}</p>
          <p><strong>İlk girişinizde şifrenizi değiştirmek zorundasınız.</strong></p>
          <p>Güvenlik nedeniyle bu e-postayı silmeyi unutmayın.</p>
          <p>— Tedbirge.ai</p>
        `,
      });
      deliveryStatus = info?.messageId ? "SENT" : "FAILED";
      providerInfo = { provider: "Email", messageId: info?.messageId };
    } catch (e) {
      deliveryStatus = "FAILED";
      providerInfo = { provider: "Email", error: e.message };
    }
  }

  await logActivity("USER_PASSWORD_RESET", {
    adminId: req.user.id,
    targetId: id,
    channel,
    deliveryStatus,
    providerInfo,
  });

  if (deliveryStatus === "FAILED") {
    return res.status(502).json({
      success: false,
      message: `${channel} gönderimi başarısız. Şifre sıfırlandı, kullanıcıya manuel iletmeniz gerek.`,
      tempPasswordHint: "Sunucu loglarında provider hatası kayıtlı.",
    });
  }

  res.json({
    success: true,
    message: `Geçici şifre ${channel === "SMS" ? "SMS" : "e-posta"} ile gönderildi. Kullanıcı ilk girişte değiştirmek zorunda.`,
    deliveryStatus,
  });
});

// PATCH /api/users/:id/status — Pasif/Aktif/Suspended
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  if (!status || !VALID_STATUSES.includes(status)) {
    throw new ApiError(400, `Geçersiz status. Beklenen: ${VALID_STATUSES.join("|")}`);
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new ApiError(404, "Kullanıcı bulunamadı.");
  if (target.deletedAt) throw new ApiError(409, "Silinmiş kullanıcı için status değiştirilemez.");

  // Self-protect: kendi status değiştiremez (sadece pasif/suspended bloke; aktif yapma da yasak)
  ensureNotSelf(req.user, id, "durum değiştirme");

  // Last-admin: ADMIN ise pasif/suspended bloke
  if (target.role === "ADMIN" && status !== "ACTIVE") {
    await ensureNotLastAdmin(id);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status, isActive: status === "ACTIVE" },
    select: SAFE_SELECT,
  });

  await logActivity("USER_STATUS_CHANGED", {
    adminId: req.user.id,
    targetId: id,
    oldStatus: target.status,
    newStatus: status,
  });

  res.json({ success: true, data: updated });
});

// PATCH /api/users/:id/archive — Arşivle
exports.archiveUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new ApiError(404, "Kullanıcı bulunamadı.");
  if (target.deletedAt) throw new ApiError(409, "Silinmiş kullanıcı arşivlenemez.");
  if (target.archivedAt || target.status === "ARCHIVED") {
    throw new ApiError(409, "Kullanıcı zaten arşivli.");
  }

  ensureNotSelf(req.user, id, "arşivleme");
  if (target.role === "ADMIN") await ensureNotLastAdmin(id);

  const updated = await prisma.user.update({
    where: { id },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date(),
      isActive: false,
    },
    select: SAFE_SELECT,
  });

  await logActivity("USER_ARCHIVED", {
    adminId: req.user.id,
    targetId: id,
    targetRole: target.role,
  });

  res.json({
    success: true,
    message: "Kullanıcı arşivlendi. Login engellenir, kayıt korunur (KVKK m.6 — 5 yıl saklama).",
    data: updated,
  });
});

// DELETE /api/users/:id — Soft delete (KVKK m.6 uyumlu)
exports.softDeleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body || {};

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new ApiError(404, "Kullanıcı bulunamadı.");
  if (target.deletedAt) throw new ApiError(409, "Kullanıcı zaten silinmiş.");

  ensureNotSelf(req.user, id, "silme");
  if (target.role === "ADMIN") await ensureNotLastAdmin(id);

  await prisma.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: "ARCHIVED",
      isActive: false,
    },
  });

  await logActivity("USER_DELETED", {
    adminId: req.user.id,
    targetId: id,
    targetRole: target.role,
    targetEmail: target.email,
    reason: reason || null,
  });

  res.json({
    success: true,
    message: "Kullanıcı silindi (soft delete). KVKK m.6 uyarınca 5 yıl saklanır.",
  });
});

// TUR #92 Q5 — 2FA adoption widget endpoint (Madde 30.32 R1)
// ADMIN dashboard "Personel 2FA Durumu" — KVKK m.12 izlenebilirlik
exports.twoFactorAdoption = asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "LAWYER", "REPRESENTATIVE", "SALES", "CUSTOMER"] },
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      twoFactorEnabled: true,
      twoFactorMethod: true,
      sonGirisTarihi: true,
      createdAt: true,
    },
    orderBy: [{ twoFactorEnabled: "asc" }, { createdAt: "asc" }], // eksik olanlar üstte
  });

  const aktif = users.filter((u) => u.twoFactorEnabled).length;
  const eksik = users.length - aktif;
  const adoptionPct = users.length > 0 ? Math.round((aktif / users.length) * 100) : 0;

  res.json({
    success: true,
    users,
    summary: { total: users.length, aktif, eksik, adoptionPct },
  });
});

// TUR #93 W4 — Avukat Workload Widget (Madde 30.53)
// ADMIN dashboard "Avukat Workload" widget — kim kaç leade aktif, kim atıl
exports.lawyerWorkload = asyncHandler(async (_req, res) => {
  const lawyers = await prisma.user.findMany({
    where: {
      role: "LAWYER",
      isActive: true,
      deletedAt: null,
    },
    select: { id: true, fullName: true, email: true, uzmanlik: true },
    orderBy: { fullName: "asc" },
  });

  // Her avukat için Assignment ve Lead sayım
  const result = await Promise.all(
    lawyers.map(async (l) => {
      const [activeCount, totalCount, lastAssignment] = await Promise.all([
        prisma.assignment.count({
          where: { lawyerId: l.id, status: "ACTIVE" },
        }).catch(() => 0),
        prisma.assignment.count({
          where: { lawyerId: l.id },
        }).catch(() => 0),
        prisma.assignment.findFirst({
          where: { lawyerId: l.id },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true, status: true },
        }).catch(() => null),
      ]);

      // WON sayım — Lead.status WON ve assignment lawyer ile eşleşen
      const wonCount = await prisma.assignment.count({
        where: {
          lawyerId: l.id,
          lead: { status: "WON" },
        },
      }).catch(() => 0);

      let load = "normal";
      if (activeCount === 0) load = "idle";
      else if (activeCount >= 10) load = "overloaded";
      else if (activeCount >= 5) load = "busy";

      return {
        id: l.id,
        fullName: l.fullName,
        email: l.email,
        uzmanlik: l.uzmanlik || null,
        activeCount,
        wonCount,
        totalCount,
        lastAssignedAt: lastAssignment?.createdAt || null,
        load,
      };
    })
  );

  const summary = {
    total: result.length,
    idle: result.filter((r) => r.load === "idle").length,
    busy: result.filter((r) => r.load === "busy").length,
    overloaded: result.filter((r) => r.load === "overloaded").length,
    totalActiveLeads: result.reduce((s, r) => s + r.activeCount, 0),
  };

  res.json({ success: true, lawyers: result, summary });
});

// TUR #92 Q5 — Manuel 2FA hatırlatma (ADMIN tetik)
exports.send2faReminder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, fullName: true, role: true, twoFactorEnabled: true },
  });
  if (!user) return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı" });
  if (user.twoFactorEnabled) {
    return res.status(400).json({ success: false, message: "Kullanıcı zaten 2FA aktif" });
  }

  const { sendOnboardingReminder } = require("../services/onboardingReminder.service");
  const result = await sendOnboardingReminder(user);

  if (!result.sent) {
    return res.status(500).json({ success: false, message: "Email gönderilemedi", reason: result.reason });
  }

  // Madde 30.37 — ActivityLog audit (sendOnboardingReminder içinde zaten yazıyor)
  res.json({ success: true, message: "Hatırlatma email gönderildi", userId: user.id });
});

// TUR #95 H5 — Mimar Sağlık Skoru widget endpoint (Madde 14.4)
// 4 KPI: 2FA adoption + Lawyer workload + Auditor + RealtimeEvent + arch health score
exports.architectHealth = asyncHandler(async (_req, res) => {
  const lastHour = new Date(Date.now() - 60 * 60 * 1000);

  // KPI 1-2: 2FA adoption (HARD rolleri)
  const HARD_2FA_ROLES = ["ADMIN", "LAWYER", "REPRESENTATIVE", "SALES"];
  const [twoFaUsers, totalHard2faUsers] = await Promise.all([
    prisma.user.count({
      where: {
        role: { in: HARD_2FA_ROLES },
        twoFactorEnabled: true,
        deletedAt: null,
      },
    }).catch(() => 0),
    prisma.user.count({
      where: {
        role: { in: HARD_2FA_ROLES },
        deletedAt: null,
      },
    }).catch(() => 0),
  ]);
  const adoptionRate = totalHard2faUsers > 0
    ? Math.round((twoFaUsers / totalHard2faUsers) * 100)
    : 100;

  // KPI 3: Aktif avukat sayım (Assignment table — TUR #93 emsali, Lead.atananAvukatId YOK)
  const [activeAssignments, distinctActiveLawyers] = await Promise.all([
    prisma.assignment.count({
      where: {
        status: "ACTIVE",
        lead: { status: { in: ["ASSIGNED_TO_LAWYER", "ACTIVE", "CONTRACT_PENDING"] } },
      },
    }).catch(() => 0),
    prisma.assignment.findMany({
      where: { status: "ACTIVE" },
      select: { lawyerId: true },
      distinct: ["lawyerId"],
    }).then((arr) => arr.length).catch(() => 0),
  ]);

  // KPI 4-5: Auditor + RealtimeEvent saatlik aktivite
  const [auditorEventsHour, realtimeEventsHour] = await Promise.all([
    prisma.agentEvent.count({
      where: { agentName: "Auditor", createdAt: { gte: lastHour } },
    }).catch(() => 0),
    prisma.realtimeEvent.count({
      where: { createdAt: { gte: lastHour } },
    }).catch(() => 0),
  ]);

  // mimarHatasi son tick (Madde 14.4)
  const archHealthEvent = await prisma.agentEvent.findFirst({
    where: { agentName: "mimarHatasi", eventType: "STATUS_CHECK" },
    orderBy: { createdAt: "desc" },
    select: { payload: true, severity: true, createdAt: true },
  }).catch(() => null);

  // Pending migrations
  let pendingMigrations = 0;
  try {
    const r = await prisma.$queryRaw`SELECT COUNT(*)::int AS pending FROM "_prisma_migrations" WHERE finished_at IS NULL`;
    pendingMigrations = Number(r?.[0]?.pending) || 0;
  } catch (_) {}

  res.json({
    success: true,
    kpi: {
      adoptionRate,
      twoFaUsers,
      totalHard2faUsers,
      activeAssignments,
      distinctActiveLawyers,
      auditorEventsHour,
      realtimeEventsHour,
      pendingMigrations,
    },
    archHealth: {
      score: archHealthEvent?.payload?.archHealthScore ?? null,
      severity: archHealthEvent?.severity || "UNKNOWN",
      checks: archHealthEvent?.payload?.checks || {},
      details: archHealthEvent?.payload?.details || {},
      issues: archHealthEvent?.payload?.issues ?? null,
      lastRun: archHealthEvent?.createdAt || null,
    },
  });
});
