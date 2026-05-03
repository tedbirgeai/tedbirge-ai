// TUR #71 A23 — EmailDigest sabah 09:00 inbox raporu
// Madde 30.14 — EmailDigest Disiplini

const prisma = require("../config/db");
const { sendEmail } = require("./email.service");

const CEO_EMAIL = process.env.CEO_EMAIL || "mehmet@tedbirge.ai";

function formatDate(d) {
  return new Date(d).toLocaleString("tr-TR", { dateStyle: "full" });
}

async function gatherMetrics() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [yeniLead, yeniDoc, kvkk, criticalEvents, failedDocs] = await Promise.all([
    prisma.lead.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
    prisma.document.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
    prisma.dataSubjectRequest.count({
      where: { receivedAt: { gte: since } },
    }).catch(() => 0),
    prisma.agentEvent.count({
      where: { severity: "CRITICAL", createdAt: { gte: since } },
    }).catch(() => 0),
    prisma.document.count({
      where: { status: "FAILED", updatedAt: { gte: since } },
    }).catch(() => 0),
  ]);

  return {
    yeniLead,
    yeniDoc,
    kvkk,
    criticalEvents,
    failedDocs,
    since: since.toISOString(),
    generatedAt: new Date().toISOString(),
  };
}

function buildHtml(metrics) {
  const today = formatDate(new Date());
  return `
<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><title>Tedbirge OS Günlük Özet</title></head>
<body style="font-family:Arial,sans-serif;background:#f6f7f9;padding:24px;color:#222;">
  <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:14px;padding:28px;box-shadow:0 2px 12px rgba(0,0,0,.06);">
    <div style="border-bottom:2px solid #1e1e8e;padding-bottom:14px;margin-bottom:20px;">
      <div style="font-size:11px;color:#666;letter-spacing:1px;">TEDBIRGE OS</div>
      <h1 style="margin:6px 0 0;color:#1e1e8e;font-size:22px;">Günlük Özet</h1>
      <div style="color:#888;font-size:13px;margin-top:4px;">${today}</div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px;">
      <div style="background:#f0f4ff;padding:16px;border-radius:10px;">
        <div style="font-size:11px;color:#666;text-transform:uppercase;">Yeni Başvuru</div>
        <div style="font-size:28px;font-weight:bold;color:#1e1e8e;">${metrics.yeniLead}</div>
      </div>
      <div style="background:#f0fff4;padding:16px;border-radius:10px;">
        <div style="font-size:11px;color:#666;text-transform:uppercase;">Yeni Belge</div>
        <div style="font-size:28px;font-weight:bold;color:#3b7f17;">${metrics.yeniDoc}</div>
      </div>
      <div style="background:#fff8f0;padding:16px;border-radius:10px;">
        <div style="font-size:11px;color:#666;text-transform:uppercase;">KVKK Başvuru</div>
        <div style="font-size:28px;font-weight:bold;color:#92400e;">${metrics.kvkk}</div>
      </div>
      <div style="background:${metrics.criticalEvents > 0 ? "#fef2f2" : "#f0fff4"};padding:16px;border-radius:10px;">
        <div style="font-size:11px;color:#666;text-transform:uppercase;">CRITICAL Olay</div>
        <div style="font-size:28px;font-weight:bold;color:${metrics.criticalEvents > 0 ? "#dc2626" : "#3b7f17"};">${metrics.criticalEvents}</div>
      </div>
    </div>

    <div style="background:${metrics.failedDocs > 0 ? "#fef2f2" : "#f6f7f9"};padding:14px;border-radius:10px;margin-bottom:18px;">
      <span style="color:#666;">FAILED Belge (24h):</span>
      <strong style="color:${metrics.failedDocs > 0 ? "#dc2626" : "#3b7f17"};">${metrics.failedDocs}</strong>
    </div>

    <div style="background:#f6f7f9;padding:14px;border-radius:10px;font-size:13px;color:#555;">
      Detaylı sistem durumu: <a href="https://www.tedbirge.ai/dashboard/sistem-durumu" style="color:#1e1e8e;">Sistem Durumu</a><br>
      CEO Konsol: <a href="https://www.tedbirge.ai/dashboard/komut" style="color:#1e1e8e;">Doğal Dil Komut</a>
    </div>

    <div style="margin-top:20px;font-size:11px;color:#888;text-align:center;">
      Tedbirge OS v1.21.0 · Otonom günlük rapor · ${new Date().toISOString().split("T")[0]}
    </div>
  </div>
</body></html>`;
}

async function sendDailyDigest() {
  const metrics = await gatherMetrics();
  const html = buildHtml(metrics);

  let status = "SENT";
  let errorMsg = null;
  try {
    await sendEmail({
      to: CEO_EMAIL,
      subject: `Tedbirge OS — Günlük Özet · ${new Date().toLocaleDateString("tr-TR")}`,
      html,
    });
  } catch (err) {
    status = "FAILED";
    errorMsg = err.message;
    console.error("[emailDigest] gönderim hata:", err.message);
  }

  try {
    await prisma.emailDigest.create({
      data: { metrics, status, error: errorMsg },
    });
  } catch (err) {
    console.error("[emailDigest] DB kayıt hata:", err.message);
  }

  // AgentEvent
  try {
    await prisma.agentEvent.create({
      data: {
        agentName: "emailDigest",
        eventType: "DAILY_DIGEST_SENT",
        severity: status === "SENT" ? "INFO" : "WARNING",
        payload: { ...metrics, status, error: errorMsg, recipient: CEO_EMAIL },
      },
    });
  } catch (_) {}

  return { ok: status === "SENT", status, metrics };
}

async function runStatusCheck() {
  // Modül durumu metric'i
  const startTs = Date.now();
  let lastSentAt = null;
  let sentCount7d = 0;
  let lastError = null;

  try {
    const last = await prisma.emailDigest.findFirst({
      orderBy: { sentAt: "desc" },
      select: { sentAt: true, status: true, error: true },
    });
    lastSentAt = last?.sentAt || null;
    lastError = last?.status === "FAILED" ? last.error : null;

    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    sentCount7d = await prisma.emailDigest.count({
      where: { sentAt: { gte: since7d }, status: "SENT" },
    });
  } catch (_) {}

  const severity = lastError ? "WARNING" : "INFO";

  try {
    await prisma.agentEvent.create({
      data: {
        agentName: "emailDigest",
        eventType: "STATUS_CHECK",
        severity,
        payload: {
          lastSentAt: lastSentAt?.toISOString() || null,
          sentCount7d,
          lastError,
          durationMs: Date.now() - startTs,
          message: lastSentAt
            ? `EmailDigest · son ${formatDate(lastSentAt)} · 7g'de ${sentCount7d} digest`
            : "EmailDigest · henüz gönderim yok (cron 09:00 bekleniyor)",
        },
      },
    });
  } catch (_) {}

  return { ok: !lastError, lastSentAt, sentCount7d };
}

module.exports = { sendDailyDigest, runStatusCheck, gatherMetrics };
