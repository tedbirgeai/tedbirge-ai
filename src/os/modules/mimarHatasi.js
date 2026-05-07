// TUR #95 H2 — Mimar Hatası Proaktif Tarama Modülü (Madde 14.4 yeni)
// 41 mimar hatası 5 kategori altında özetlendi (docs/MIMAR_HATA_KATEGORILERI.md):
//   A — Smoke Yetersizliği (8)
//   B — Schema/Migration Drift (2)
//   C — UI Görsel Atlama (3)
//   D — Auth Flow / Cookie Senkron (16)
//   E — Mektup Yorum / Yamalı Bohça (12 — TUR #93+#94 emsali)
//
// Auditor 5 dk tick'inde A+B+C+D kontrolleri (E retroaktif TUR sonu denetimi).
// Skor < 60% → ADMIN_FEED RealtimeEvent CRITICAL (TUR #93 emsali — channel/eventType/payload).

const prisma = require("../../config/db");

const MODULE_NAME = "mimarHatasi";

async function runStatusCheck() {
  const startTs = Date.now();
  const lastHour = new Date(Date.now() - 60 * 60 * 1000);
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const checks = {};
  const details = {};
  let issues = 0;

  try {
    // A — Smoke Yetersizliği
    // Login failed events last 24h sıfır ise smoke gerçek POST testi yapılmıyor demektir.
    const loginFailed24h = await prisma.activityLog.count({
      where: {
        action: { contains: "LOGIN_FAILED", mode: "insensitive" },
        createdAt: { gte: last24h },
      },
    }).catch(() => 0);
    details.A = { loginFailedLast24h: loginFailed24h };
    checks.A_smokeGap = loginFailed24h === 0; // true = uyarı (smoke yetersiz olabilir)
    if (checks.A_smokeGap) issues++;

    // B — Schema/Migration Drift
    // _prisma_migrations finished_at IS NULL → bekleyen migration var
    let pendingMigrations = 0;
    try {
      const r = await prisma.$queryRaw`SELECT COUNT(*)::int AS pending FROM "_prisma_migrations" WHERE finished_at IS NULL`;
      pendingMigrations = Number(r?.[0]?.pending) || 0;
      details.B = { pendingMigrations };
    } catch (err) {
      details.B = { error: err.message?.slice(0, 200) || "query fail" };
    }
    checks.B_schemaDrift = pendingMigrations > 0;
    if (checks.B_schemaDrift) issues++;

    // C — UI Görsel Atlama (Auditor zinciri canlı mı?)
    // Auditor saatlik 0 olay = modül silent failure
    const auditorEventsHour = await prisma.agentEvent.count({
      where: {
        agentName: "Auditor",
        createdAt: { gte: lastHour },
      },
    }).catch(() => 0);
    details.C = { auditorEventsLastHour: auditorEventsHour };
    checks.C_uiSilent = auditorEventsHour === 0;
    if (checks.C_uiSilent) issues++;

    // D — Auth Flow / Cookie Senkron / Trigger Zinciri Bütünlüğü
    // RealtimeEvent saatlik 0 olay = trigger zinciri kopuk
    const realtimeEventsHour = await prisma.realtimeEvent.count({
      where: { createdAt: { gte: lastHour } },
    }).catch(() => 0);
    details.D = { realtimeEventsLastHour: realtimeEventsHour };
    checks.D_authFlowIntegrity = realtimeEventsHour > 0; // true = SAĞLIKLI
    if (!checks.D_authFlowIntegrity) issues++;

    // archHealthScore: her kategori başına 20 puan düşüş
    const archHealthScore = Math.max(0, 100 - issues * 20);

    let severity = "INFO";
    if (issues >= 3) severity = "CRITICAL";
    else if (issues >= 1) severity = "WARNING";

    const message = issues === 0
      ? `Mimar sağlık skoru: %${archHealthScore} — pattern temiz (A:OK, B:OK, C:OK, D:OK)`
      : `Mimar sağlık skoru: %${archHealthScore} — ${issues}/4 kategori uyarı`;

    await prisma.agentEvent.create({
      data: {
        agentName: MODULE_NAME,
        eventType: "STATUS_CHECK",
        severity,
        payload: {
          message,
          archHealthScore,
          checks,
          details,
          issues,
          durationMs: Date.now() - startTs,
        },
      },
    });

    // CRITICAL → ADMIN_FEED RealtimeEvent (TUR #93 emsali — channel/eventType/payload)
    if (severity === "CRITICAL") {
      await prisma.realtimeEvent.create({
        data: {
          channel: "ADMIN_FEED",
          eventType: "ARCHITECT_HEALTH_CRITICAL",
          payload: {
            title: "🚨 Mimar Sağlık Düşüşü",
            body: message,
            severity: "CRITICAL",
            archHealthScore,
            issues,
            checks,
          },
        },
      }).catch((e) => console.error("[mimarHatasi] rt-event fail:", e.message));
    }

    return { ok: true, archHealthScore, issues, severity };
  } catch (err) {
    console.error(`[${MODULE_NAME}] runStatusCheck error:`, err.message);
    try {
      await prisma.agentEvent.create({
        data: {
          agentName: MODULE_NAME,
          eventType: "STATUS_CHECK",
          severity: "WARNING",
          payload: { message: `mimarHatasi runStatusCheck hata: ${err.message?.slice(0, 200)}`, error: true },
        },
      });
    } catch (_) {}
    return { ok: false, error: err.message };
  }
}

// runActiveTask: 5 dk tick için runStatusCheck'i çağırır (idempotent)
async function runActiveTask() {
  return runStatusCheck();
}

module.exports = { runStatusCheck, runActiveTask, MODULE_NAME };
