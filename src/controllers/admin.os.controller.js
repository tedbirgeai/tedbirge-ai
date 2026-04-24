const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/db");

// GET /api/os/status - OS core + son bootun metrikleri
exports.getStatus = asyncHandler(async (req, res) => {
  let osReady = false;
  let osError = null;
  try {
    require("../os");
    osReady = true;
  } catch (err) {
    osError = err.message;
  }

  const lastBoot = await prisma.bootRecord.findFirst({
    orderBy: { createdAt: "desc" },
  });

  const eventCounts = await prisma.systemEvent.groupBy({
    by: ["severity"],
    _count: { severity: true },
  });

  return res.json({
    success: true,
    os: { ready: osReady, error: osError },
    lastBoot,
    eventCounts,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/os/boot-records - son 20 boot
exports.getBootRecords = asyncHandler(async (req, res) => {
  const records = await prisma.bootRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return res.json({ success: true, records });
});

// GET /api/os/events - son 50 event
exports.getEvents = asyncHandler(async (req, res) => {
  const events = await prisma.systemEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return res.json({ success: true, events });
});
