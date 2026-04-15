/**
 * OCR Worker — Tedbirge AI
 *
 * - Polls the DB every POLL_INTERVAL_MS for UPLOADED PDFs
 * - Processes up to MAX_CONCURRENT documents at a time (default: 5)
 * - Documents beyond that wait for the next poll cycle
 * - Handles SIGTERM gracefully: finishes active jobs before exiting
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");
const { rerunAnalysis } = require("../src/jobs/documentAnalysis.job");

const prisma = new PrismaClient();

const POLL_INTERVAL_MS = Number(process.env.OCR_POLL_INTERVAL_MS || 10_000);
const MAX_CONCURRENT   = Number(process.env.OCR_MAX_CONCURRENT    || 5);
const BATCH_SIZE       = MAX_CONCURRENT; // fetch only as many as we can process

let stopping = false;
let activeJobs = 0;

// ─── Graceful shutdown ────────────────────────────────────────────────────────
process.on("SIGTERM", () => {
  console.log("[WORKER] SIGTERM received — finishing active jobs then exiting");
  stopping = true;
});
process.on("SIGINT", () => {
  console.log("[WORKER] SIGINT received — finishing active jobs then exiting");
  stopping = true;
});

// ─── Process one document ─────────────────────────────────────────────────────
async function processDoc(doc) {
  activeJobs++;
  try {
    console.log("[WORKER] processing:", doc.id, doc.originalName || "");

    const pdfPath = path.resolve(doc.path);

    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF not found: ${pdfPath}`);
    }

    const tempDir = path.join(os.tmpdir(), "tedbirge-ocr");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const prefix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const outputBase = path.join(tempDir, prefix);

    const pdftoppm = process.env.PDFTOPPM_PATH || "pdftoppm";

    execSync(
      `"${pdftoppm}" -r 150 -png "${pdfPath}" "${outputBase}"`,
      { stdio: "ignore", timeout: 120_000 }
    );

    const files = fs
      .readdirSync(tempDir)
      .filter((f) => f.startsWith(prefix) && f.endsWith(".png"))
      .sort();

    let fullText = "";

    for (const file of files) {
      const imgPath = path.join(tempDir, file);
      const outBase = imgPath + "-ocr";

      const tesseract = process.env.TESSERACT_PATH || "tesseract";

      execSync(
        `"${tesseract}" "${imgPath}" "${outBase}" -l tur+eng --psm 6`,
        { stdio: "ignore", timeout: 60_000 }
      );

      const txtPath = outBase + ".txt";
      if (fs.existsSync(txtPath)) {
        fullText += fs.readFileSync(txtPath, "utf8") + "\n";
      }

      // Cleanup temp files
      try { fs.unlinkSync(imgPath); } catch (_) {}
      try { fs.unlinkSync(txtPath); } catch (_) {}
    }

    await prisma.document.update({
      where: { id: doc.id },
      data: {
        parsedText: fullText.trim() || null,
        status: "PARSED",
      },
    });

    console.log("[WORKER] OCR done, starting AI analysis:", doc.id);

    try {
      await rerunAnalysis(doc.id);
      console.log("[WORKER] AI analysis complete:", doc.id);
    } catch (aiErr) {
      console.error("[WORKER] AI analysis failed for", doc.id, ":", aiErr.message);
      // OCR succeeded; leave status as PARSED so AI can be retried manually
    }

    console.log("[WORKER] done:", doc.id);
  } catch (err) {
    console.error("[WORKER] error on", doc.id, ":", err.message);
    try {
      await prisma.document.update({
        where: { id: doc.id },
        data: { status: "FAILED" },
      });
    } catch (_) {}
  } finally {
    activeJobs--;
  }
}

// ─── One poll cycle ───────────────────────────────────────────────────────────
async function poll() {
  if (stopping) return;

  const docs = await prisma.document.findMany({
    where: {
      status: "UPLOADED",
      parsedText: null,
      mimeType: "application/pdf",
    },
    take: BATCH_SIZE,
    orderBy: { createdAt: "asc" },
  });

  if (docs.length === 0) return;

  console.log(`[WORKER] poll: found ${docs.length} pending docs (max_concurrent=${MAX_CONCURRENT})`);

  // Run up to MAX_CONCURRENT in parallel, rest wait for next cycle
  const batch = docs.slice(0, MAX_CONCURRENT);
  await Promise.allSettled(batch.map((doc) => processDoc(doc)));
}

// ─── Main loop ────────────────────────────────────────────────────────────────
async function main() {
  console.log(
    `[WORKER] started — poll_interval=${POLL_INTERVAL_MS}ms  max_concurrent=${MAX_CONCURRENT}`
  );

  // Run immediately on startup, then on interval
  await poll();

  const intervalId = setInterval(async () => {
    if (stopping) {
      clearInterval(intervalId);

      // Wait for active jobs to finish
      let waited = 0;
      while (activeJobs > 0 && waited < 30_000) {
        await new Promise((r) => setTimeout(r, 500));
        waited += 500;
      }

      await prisma.$disconnect();
      console.log("[WORKER] shutdown complete");
      process.exit(0);
    }

    try {
      await poll();
    } catch (err) {
      console.error("[WORKER] poll error:", err.message);
    }
  }, POLL_INTERVAL_MS);
}

main().catch((err) => {
  console.error("[WORKER] fatal:", err.message);
  process.exit(1);
});
