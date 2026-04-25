// src/controllers/admin.os.controller.js
// Tedbirge OS v3 — Admin Status Endpoints
// Mimar: Claude Opus 4.7 — 25 Nisan 2026 sabah
// Değişiklik: moduleNames listesi gerçek dosya isimleri ile uyumlu hale getirildi.
// Önceki liste: config, kvkk, secrets, audit, storage, pdf, email, queue, scheduler vb.
//   (bu modüller src/os/modules/ klasöründe YOK — uyumsuzdu)
// Yeni liste: src/os/modules/ klasöründeki 16 gerçek dosyanın aynısı.

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
  // src/os/modules/ klasöründeki 16 gerçek dosya — TAM_TESHIS ile doğrulandı
  const moduleNames = [
    "ai", "analyzer", "appearance", "backup", "compliance",
    "costGuard", "deploy", "insurance", "maintenance", "navigation",
    "notifications", "performance", "pulse", "recovery", "security",
    "uyapControl",
  ];

  for (const name of moduleNames) {
    try {
      const mod = tedbirgeOS.modules && tedbirgeOS.modules[name];
      if (!mod) {
        modules[name] = { error: "Modul yuklenmedi" };
        continue;
      }
      // Modül zaten safeRequire ile { error: ... } olarak işaretlenmişse direkt göster
      if (mod.error) {
        modules[name] = { error: mod.error };
        continue;
      }
      // status() fonksiyonu varsa çağır, yoksa hazır say
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
    select: {
      id: true,
      ok: true,
      totalMs: true,
      version: true,
      createdAt: true,
    },
  });

  return res.json({ success: true, records });
});

// GET /api/os/events - son 50 sistem olayi
exports.getEvents = asyncHandler(async (req, res) => {
  const events = await prisma.systemEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      severity: true,
      module: true,
      createdAt: true,
    },
  });

  return res.json({ success: true, events });
});
