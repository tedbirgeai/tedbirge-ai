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
