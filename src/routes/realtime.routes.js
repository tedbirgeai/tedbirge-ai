// TUR #55 A26 — Real-time SSE altyapısı

const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const prisma = require("../config/db");

/**
 * GET /api/realtime/notifications
 * SSE stream — kullanicinin RealtimeEvent kanalini dinler.
 * - userId hedefli olaylar
 * - role bazli kanal (ADMIN_FEED rolu ADMIN goruyor)
 */
router.get("/realtime/notifications", auth, async (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const userId = req.user.id;
  const userRole = req.user.role;

  // Hangi kanallari dinleyeceğiz?
  const channels = [`USER_${userId}`];
  if (userRole === "ADMIN") channels.push("ADMIN_FEED");
  if (userRole === "LAWYER") channels.push(`LAWYER_${userId}`);
  if (userRole === "REPRESENTATIVE") channels.push(`TEMSILCI_${userId}`);

  // Kayit acildiginda init mesaji
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ userId, channels })}\n\n`);

  // Polling RealtimeEvent (5 saniye)
  const interval = setInterval(async () => {
    try {
      const events = await prisma.realtimeEvent.findMany({
        where: {
          OR: [
            { userId, consumed: false },
            { channel: { in: channels }, consumed: false },
          ],
        },
        orderBy: { createdAt: "asc" },
        take: 20,
      });

      for (const ev of events) {
        res.write(`event: ${ev.eventType}\n`);
        res.write(`data: ${JSON.stringify({ id: ev.id, channel: ev.channel, payload: ev.payload, createdAt: ev.createdAt })}\n\n`);
        await prisma.realtimeEvent.update({
          where: { id: ev.id },
          data: { consumed: true },
        });
      }

      // Heartbeat (her 25 sn'de bir, proxy timeout)
      res.write(`: heartbeat ${Date.now()}\n\n`);
    } catch (err) {
      console.warn("[SSE] poll hata:", err.message);
    }
  }, 5000);

  req.on("close", () => {
    clearInterval(interval);
    try { res.end(); } catch (e) {}
  });
});

/**
 * GET /api/realtime/unread-count
 * Bildirim bell rozetinin saymasi icin (cheap query).
 */
router.get("/realtime/unread-count", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const channels = [`USER_${userId}`];
    if (userRole === "ADMIN") channels.push("ADMIN_FEED");

    const count = await prisma.realtimeEvent.count({
      where: {
        OR: [
          { userId, consumed: false },
          { channel: { in: channels }, consumed: false },
        ],
      },
    });
    res.json({ unread: count });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
