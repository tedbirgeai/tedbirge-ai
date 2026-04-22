/**
 * cleanup-test-leads.js
 * Test lead'leri listeler veya siler.
 *
 * Kullanım:
 *   node scripts/cleanup-test-leads.js          # --list modu (varsayılan)
 *   node scripts/cleanup-test-leads.js --delete  # sil (mimar onayı sonrası)
 */

require("dotenv").config();
const { Client } = require("pg");

const PATTERN = "Test Mimar HD%";
const isDelete = process.argv.includes("--delete");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("HATA: DATABASE_URL env değişkeni tanımlı değil.");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  if (!isDelete) {
    console.log(`\n[SELECT] Pattern: customerName LIKE '${PATTERN}'\n`);
    const res = await client.query(
      `SELECT "leadCode", "customerName", "createdAt"
       FROM "Lead"
       WHERE "customerName" LIKE $1
       ORDER BY "createdAt" DESC`,
      [PATTERN]
    );

    if (res.rows.length === 0) {
      console.log("Sonuç yok — temizlenecek test lead bulunamadı.");
    } else {
      console.log(`${res.rows.length} kayıt bulundu:\n`);
      res.rows.forEach((r) => {
        console.log(`  ${r.leadCode}  |  ${r.customerName}  |  ${r.createdAt.toISOString()}`);
      });
      console.log("\nSilmek için: node scripts/cleanup-test-leads.js --delete");
    }
  } else {
    console.log(`\n[DELETE] Pattern: customerName LIKE '${PATTERN}'\n`);
    const res = await client.query(
      `DELETE FROM "Lead" WHERE "customerName" LIKE $1 RETURNING "leadCode", "customerName"`,
      [PATTERN]
    );

    if (res.rows.length === 0) {
      console.log("Silinecek kayıt yok.");
    } else {
      console.log(`${res.rows.length} kayıt silindi:\n`);
      res.rows.forEach((r) => {
        console.log(`  DELETED: ${r.leadCode}  |  ${r.customerName}`);
      });
    }
  }

  await client.end();
}

main().catch((err) => {
  console.error("Script hatası:", err.message);
  process.exit(1);
});
