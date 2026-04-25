const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/db");

// GET /api/os/status - 16 modul + son boot + son metrikler
exports.getStatus = asyncHandler(async (req, res) => {
  let tedbirgeOS = null;
  try {
    tedbirgeOS = require("../os");
  } catch (err) {
    return res.json({
      success: true,
      modules: { error: "OS core yuklenmedi: " + err.message },
      timestamp: new Date().toISOString(),
    });
  }

  const modules = {};
  const moduleNames = [
    "config", "kvkk", "secrets", "audit", "storage", "pdf",
    "email", "ai", "queue", "scheduler", "performance", "deploy",
    "uyapControl", "insurance", "navigation", "appearance",
  ];

  for (const name of moduleNames) {
    try {
      const mod = tedbirgeOS.modules && tedbirgeOS.modules[name];
      if (!mod) {
        modules[name] = { error: "Modul yuklenmedi" };
        continue;
      }
      modules[name] = typeof mod.status === "function"
        ? await mod.status()
        : { ready: true };
    } catch (err) {
      modules[name] = { error: err.message };
    }
  }

  return res.json({
    success: true,
    modules,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/os/boot-records - son 20 boot kaydi
exports.getBootRecords = asyncHandler(async (req, res) => {
  const records = await prisma.bootRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return res.json({ success: true, records });
});

// GET /api/os/events - son 50 sistem olayi
exports.getEvents = asyncHandler(async (req, res) => {
  const events = await prisma.systemEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return res.json({ success: true, events });
});
