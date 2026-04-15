const path = require("path");
const { fork } = require("child_process");

const app = require("./app");
const env = require("./config/env");
const logger = require("./config/logger");
const { startDeadlineChecker } = require("./jobs/deadlineChecker.job");
const { verifyConnection: verifySmtp } = require("./services/email.service");

let workerProcess = null;

function startOcrWorker() {
  try {
    const workerPath = path.resolve(__dirname, "..", "scripts", "ocr-worker.js");
    workerProcess = fork(workerPath, [], {
      stdio: "inherit"
    });

    logger.info(`[OCR] Worker auto-started (pid=${workerProcess.pid})`);

    workerProcess.on("exit", (code, signal) => {
      logger.warn(
        `[OCR] Worker stopped (code=${code ?? "null"}, signal=${signal ?? "null"})`
      );
      workerProcess = null;
    });

    workerProcess.on("error", (error) => {
      logger.error(`[OCR] Worker process error: ${error.message}`);
    });
  } catch (error) {
    logger.error(`[OCR] Worker auto-start failed: ${error.message}`);
  }
}

app.use("/uploads", require("express").static(path.join(__dirname, "..", "uploads")));

const server = app.listen(env.port, () => {
  logger.info(`Server running on http://localhost:${env.port}`);
  startOcrWorker();
  startDeadlineChecker();
  // SMTP bağlantı kontrolü — mock modda sessizce atlanır
  verifySmtp().then((ok) => {
    if (ok) logger.info("[SMTP] Bağlantı doğrulandı");
    else     logger.warn("[SMTP] Mock mod aktif (SMTP_PASS eksik veya bağlantı başarısız)");
  });
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
function shutdown(signal) {
  logger.info(`[SERVER] ${signal} received — graceful shutdown started`);

  // Stop accepting new connections
  server.close((err) => {
    if (err) logger.error(`[SERVER] Error during close: ${err.message}`);

    // Kill OCR worker child process
    if (workerProcess) {
      logger.info("[SERVER] Sending SIGTERM to OCR worker");
      workerProcess.kill("SIGTERM");
    }

    logger.info("[SERVER] Shutdown complete");
    process.exit(err ? 1 : 0);
  });

  // Force exit after 30s if connections don't drain
  setTimeout(() => {
    logger.warn("[SERVER] Force exit after timeout");
    process.exit(1);
  }, 30_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));