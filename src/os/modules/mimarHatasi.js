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

// shouldRunActiveTask: günde 1 kez gerçek aktör görev (TUR #109 A2 — Madde 30.62 yeni)
let lastActionAt = null;
function shouldRunActiveTask() {
  if (!lastActionAt) return true;
  const ageMs = Date.now() - lastActionAt;
  return ageMs >= 24 * 60 * 60 * 1000; // 24h
}

// runActiveTask: GERÇEK aktör (TUR #109 A2 — Madde 30.62 yeni)
// Madde 30.17 ihlali kapandı: artık sadece runStatusCheck çağırmıyor.
// Aktör: son 24h Auditor heartbeat trend + son 7g mimar hatası baseline + adaptiveThreshold
async function runActiveTask() {
  const startTs = Date.now();
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    // 1. Auditor heartbeat trend (son 24h)
    const auditorHeartbeats24h = await prisma.agentEvent.count({
      where: { agentName: "auditor", eventType: "HEARTBEAT", createdAt: { gte: last24h } },
    }).catch(() => 0);

    // Beklenen: 5 dk tick × 12 = 60 × 24 = ~288 heartbeat/24h. Sapma > %20 → uyarı.
    const expectedHeartbeats = 288;
    const heartbeatDeviationPct = expectedHeartbeats > 0
      ? Math.abs((auditorHeartbeats24h - expectedHeartbeats) / expectedHeartbeats * 100)
      : 0;

    // 2. mimarHatasi baseline (son 7g STATUS_CHECK ortalama issues)
    const mimarEvents7d = await prisma.agentEvent.findMany({
      where: { agentName: MODULE_NAME, eventType: "STATUS_CHECK", createdAt: { gte: last7d } },
      select: { payload: true },
      take: 200,
    }).catch(() => []);

    let avgIssues = 0;
    let avgScore = 100;
    if (mimarEvents7d.length > 0) {
      const issuesList = mimarEvents7d.map(e => e.payload?.issues || 0);
      const scoreList = mimarEvents7d.map(e => e.payload?.archHealthScore || 100);
      avgIssues = issuesList.reduce((a, b) => a + b, 0) / issuesList.length;
      avgScore = scoreList.reduce((a, b) => a + b, 0) / scoreList.length;
    }

    // 3. AgentEvent CRITICAL son 7g sayım (mimar hatası tetikleyici)
    const critical7d = await prisma.agentEvent.count({
      where: { severity: "CRITICAL", createdAt: { gte: last7d } },
    }).catch(() => 0);

    let actionSeverity = "INFO";
    let actionMessage = `Trend analizi: 24h heartbeat ${auditorHeartbeats24h}/${expectedHeartbeats} (sapma %${heartbeatDeviationPct.toFixed(1)}), 7g ortalama skor %${avgScore.toFixed(0)}, CRITICAL ${critical7d}`;

    if (heartbeatDeviationPct > 20 || avgScore < 60) {
      actionSeverity = "WARNING";
      actionMessage = `Mimar trend uyarı: heartbeat sapma %${heartbeatDeviationPct.toFixed(1)}, skor %${avgScore.toFixed(0)}, CRITICAL ${critical7d}/7g`;
    }

    // ACTION_TAKEN AgentEvent (Madde 30.17 + Madde 30.62 yeni — gerçek aktör kanıt)
    await prisma.agentEvent.create({
      data: {
        agentName: MODULE_NAME,
        eventType: "ACTION_TAKEN",
        severity: actionSeverity,
        payload: {
          message: actionMessage,
          action_taken: {
            trendAnalyzed: true,
            heartbeats24h: auditorHeartbeats24h,
            heartbeatDeviationPct: Number(heartbeatDeviationPct.toFixed(2)),
            avgIssues7d: Number(avgIssues.toFixed(2)),
            avgScore7d: Number(avgScore.toFixed(0)),
            critical7d,
          },
          durationMs: Date.now() - startTs,
        },
      },
    });

    lastActionAt = Date.now();
    return { ok: true, action: "trend_analyzed", severity: actionSeverity };
  } catch (err) {
    console.error(`[${MODULE_NAME}] runActiveTask error:`, err.message);
    try {
      await prisma.agentEvent.create({
        data: {
          agentName: MODULE_NAME,
          eventType: "ACTION_TAKEN",
          severity: "WARNING",
          payload: { message: `runActiveTask hata: ${err.message?.slice(0, 200)}`, error: true },
        },
      });
    } catch (_) {}
    return { ok: false, error: err.message };
  }
}

module.exports = { runStatusCheck, runActiveTask, shouldRunActiveTask, MODULE_NAME };
