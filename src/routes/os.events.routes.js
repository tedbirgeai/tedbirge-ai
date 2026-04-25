/**
 * src/routes/os.events.routes.js
 * SSE endpoint — Sistem olay akışı (Reporter)
 */

const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");

router.get("/events/stream", auth, (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "ADMIN required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // nginx için

  res.flushHeaders();

  try {
    const tedbirgeOS = require("../os");
    if (
      tedbirgeOS.modules &&
      tedbirgeOS.modules.reporter &&
      tedbirgeOS.modules.reporter.addClient
    ) {
      tedbirgeOS.modules.reporter.addClient(res);
    } else {
      res.write('event: error\ndata: {"error":"reporter not available"}\n\n');
      res.end();
    }
  } catch (err) {
    res.write(`event: error\ndata: {"error":"${err.message}"}\n\n`);
    res.end();
  }

  // Heartbeat — her 30 saniye
  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    } catch (_) {}
  }, 30000);

  req.on("close", () => clearInterval(heartbeat));
});

module.exports = router;
