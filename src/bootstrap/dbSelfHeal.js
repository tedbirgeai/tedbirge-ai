// src/bootstrap/dbSelfHeal.js
//
// Idempotent DB self-heal script.
// Her uygulama baslatmasinda bir kez calisir:
//   1. Sema-DB tutarsizliklarini programatik onarir (eksik kolonlari ekler)
//   2. Drift icin _prisma_migrations tablosunu sync eder
//   3. Hatalar log'lanir ama uygulamayi cokertmez
//
// Kullanim: server.js'in basinda, app.listen()'den once cagrilir.
//   await selfHealDatabase();

const prisma = require("../config/db");
// prisma artik singleton'dan geliyor (Madde 9.3 — TUR #20)

const HEAL_TASKS = [
  {
    id: "lead_archive_delete",
    expectedColumnCount: 2,
    description: "Lead.archivedAt + Lead.deletedAt kolonlari (TUR #14)",
    migrationName: "20260426000001_add_lead_archive_delete",
    sql: `ALTER TABLE "Lead"
          ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3),
          ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);`,
    checkSql: `SELECT column_name FROM information_schema.columns
               WHERE table_name = 'Lead' AND column_name IN ('archivedAt', 'deletedAt');`,
  },
  {
    id: "lead_source_utm",
    expectedColumnCount: 4,
    description: "Lead.source + UTM alanlari (TUR #16)",
    migrationName: "20260426000002_add_lead_source_utm",
    sql: `ALTER TABLE "Lead"
          ADD COLUMN IF NOT EXISTS "source" TEXT,
          ADD COLUMN IF NOT EXISTS "utmSource" TEXT,
          ADD COLUMN IF NOT EXISTS "utmMedium" TEXT,
          ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT;`,
    checkSql: `SELECT column_name FROM information_schema.columns
               WHERE table_name = 'Lead' AND column_name IN ('source', 'utmSource', 'utmMedium', 'utmCampaign');`,
  },
];

async function applyHealTask(task) {
  const log = (level, msg) => console.log(`[DB-HEAL] [${task.id}] ${level}: ${msg}`);

  try {
    const checkResult = await prisma.$queryRawUnsafe(task.checkSql);
    const existingColumns = Array.isArray(checkResult) ? checkResult.map(r => r.column_name) : [];

    if (existingColumns.length >= (task.expectedColumnCount || 2)) {
      log("info", "kolonlar zaten mevcut, atla");
    } else {
      log("info", `kolonlar eksik (${existingColumns.length}/2), uyguluyor...`);
      await prisma.$executeRawUnsafe(task.sql);
      log("ok", "SQL basariyla uygulandi");
    }

    if (task.migrationName) {
      const migrationCheck = await prisma.$queryRawUnsafe(
        `SELECT id FROM "_prisma_migrations" WHERE migration_name = $1 LIMIT 1;`,
        task.migrationName,
      );

      if (Array.isArray(migrationCheck) && migrationCheck.length === 0) {
        const checksumPlaceholder = "self-heal-bootstrap-" + Date.now();
        await prisma.$executeRawUnsafe(
          `INSERT INTO "_prisma_migrations"
            (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
           VALUES
            (gen_random_uuid()::text, $1, NOW(), $2, NULL, NULL, NOW(), 1);`,
          checksumPlaceholder,
          task.migrationName,
        );
        log("ok", `_prisma_migrations'a 'applied' kaydi eklendi: ${task.migrationName}`);
      } else {
        log("info", `_prisma_migrations zaten kayitli: ${task.migrationName}`);
      }
    }

    return { ok: true, taskId: task.id };
  } catch (err) {
    log("err", `hata: ${err.message}`);
    return { ok: false, taskId: task.id, error: err.message };
  }
}

async function selfHealDatabase() {
  console.log("[DB-HEAL] baslatiliyor — idempotent self-heal kontrolu");

  const results = [];
  for (const task of HEAL_TASKS) {
    const result = await applyHealTask(task);
    results.push(result);
  }

  const okCount = results.filter(r => r.ok).length;
  console.log(`[DB-HEAL] tamamlandi — basarili: ${okCount}/${results.length}`);

  // $disconnect kaldirildi — singleton process boyunca yasar (Madde 9.3 — TUR #20)

  return results;
}

module.exports = { selfHealDatabase };
