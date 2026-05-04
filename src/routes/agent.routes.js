// TUR #55 A24/A25 — Agent yönetim ve AgentEvent route

const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const prisma = require("../config/db");
const runner = require("../agents/runner");

// Agent durumlari
router.get("/agents/status", auth, role("ADMIN"), (req, res) => {
  try {
    res.json({ agents: runner.getStatus() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// TUR #73 — Public agent canlilik kaniti (no auth, hassas veri yok)
// CEO browser'da direkt erisim: tedbirge-ai.onrender.com/api/os/agents-health
router.get("/agents-health", async (req, res) => {
  try {
    const agentStatus = runner.getStatus();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [count1h, count24h, lastEvent, lastError] = await Promise.all([
      prisma.agentEvent.count({ where: { createdAt: { gte: oneHourAgo } } }),
      prisma.agentEvent.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.agentEvent.findFirst({
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, agentName: true, eventType: true, severity: true, payload: true },
      }),
      // TUR #73 Z3 — Son ERROR (AGENT_ERROR / *_FAILED) — Auditor ariza tespit
      prisma.agentEvent.findFirst({
        where: { severity: "ERROR", createdAt: { gte: oneDayAgo } },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, agentName: true, eventType: true, payload: true },
      }),
    ]);

    const moduleNames = [
      "ai", "analyzer", "appearance", "backup", "compliance",
      "costGuard", "deploy", "insurance", "maintenance", "navigation",
      "notifications", "performance", "pulse", "recovery", "security", "uyapControl",
    ];

    const moduleCounts = await Promise.all(
      moduleNames.map(async (name) => {
        const c = await prisma.agentEvent.count({
          where: { agentName: name, createdAt: { gte: oneHourAgo } },
        });
        return { agentName: name, eventCountLast1h: c };
      }),
    );

    // TUR #73 Z3 — Auditor canlilik gostergesi
    const auditor = agentStatus.find((a) => a.name === "Auditor");
    let auditorHealth = "UNKNOWN";
    if (auditor?.lastRunAt) {
      const ageMs = Date.now() - new Date(auditor.lastRunAt).getTime();
      const intervalMs = auditor.intervalMs || 300000;
      if (ageMs < intervalMs * 1.5) auditorHealth = "HEALTHY";
      else if (ageMs < intervalMs * 3) auditorHealth = "DELAYED";
      else auditorHealth = "STOPPED";
    } else {
      auditorHealth = "NEVER_RAN";
    }

    res.json({
      success: true,
      generatedAt: new Date().toISOString(),
      auditorHealth, // HEALTHY | DELAYED | STOPPED | NEVER_RAN | UNKNOWN
      agents: agentStatus,
      eventCounts: {
        last1h: count1h,
        last24h: count24h,
      },
      lastEvent: lastEvent
        ? {
            agentName: lastEvent.agentName,
            eventType: lastEvent.eventType,
            severity: lastEvent.severity,
            message: lastEvent.payload?.message || null,
            createdAt: lastEvent.createdAt,
            ageSeconds: Math.floor((Date.now() - lastEvent.createdAt.getTime()) / 1000),
          }
        : null,
      lastError: lastError
        ? {
            agentName: lastError.agentName,
            eventType: lastError.eventType,
            message: lastError.payload?.message?.slice(0, 200) || null,
            createdAt: lastError.createdAt,
            ageMinutes: Math.floor((Date.now() - lastError.createdAt.getTime()) / 60000),
          }
        : null,
      moduleCounts,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Manuel tick
router.post("/agents/:name/tick", auth, role("ADMIN"), async (req, res) => {
  try {
    const result = await runner.manualTick(req.params.name);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Agent olay listesi
router.get("/agent-events", auth, role("ADMIN"), async (req, res) => {
  try {
    const { agentName, severity, limit = 50, offset = 0 } = req.query;
    const where = {};
    if (agentName) where.agentName = agentName;
    if (severity) where.severity = severity;

    const [events, total] = await Promise.all([
      prisma.agentEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: Math.min(parseInt(limit) || 50, 200),
        skip: Math.max(parseInt(offset) || 0, 0),
      }),
      prisma.agentEvent.count({ where }),
    ]);
    res.json({ events, total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
