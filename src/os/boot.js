/**
 * Tedbirge OS — Boot Sequence
 *
 * Server açıldığında çalışan 11 adımlı startup sequence.
 * systemd boot order'ından ilham alındı: her adım kendi timeout'u ile,
 * bağımlı olanlar sıralı, olmayanlar paralel (ama şimdilik hepsi sıralı).
 *
 * Başarılı boot → BootRecord tablosuna kayıt
 * Başarısız boot → critical adımlar başarısızsa server başlatılmaz
 *
 * Referans: TEDBIRGE_OS_FIZIBILITE_v2 — Prensip 8 (Boot Sequence)
 */

const prisma = require("../config/db");
// prisma artik singleton'dan geliyor (Madde 9.3 — TUR #20)
const { bus, EVENT_TYPES } = require('./eventBus');

// ─── Step Definitions ───────────────────────────────────────────────────────

/**
 * @typedef {Object} BootStep
 * @property {string} name
 * @property {Function} run - async () => Promise<void>
 * @property {boolean} [critical] - Başarısız olursa boot iptal (default false)
 * @property {boolean} [optional] - Hata almak normal (default false, BootRecord'da farklı işaretlenir)
 * @property {number} [timeoutMs] - default 10000
 */

const DEFAULT_TIMEOUT_MS = 10000;

// ─── Step Implementations ───────────────────────────────────────────────────

async function checkDatabase() {
  await prisma.$queryRaw`SELECT 1`;
}

async function checkSupabaseStorage() {
  // Supabase storage ping — şimdilik env var kontrol
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase env vars missing');
  }
  // TODO: gerçek bucket list çağrısı (adapter hazır olunca)
}

async function pingOracleWorker() {
  // Oracle Free hibrit henüz kurulmadı, şimdilik skip
  if (!process.env.ORACLE_SSH_HOST) {
    throw new Error('Oracle SSH not configured (optional)');
  }
  // TODO: SSH ping gerçek implementation
}

async function checkAnthropicAPI() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY missing');
  }
  // Gerçek ping yapmadan sadece key varlığı kontrol (maliyet tasarruf)
}

async function restorePgBossQueue() {
  // pg-boss henüz entegre değil, şimdilik skip
  // TODO: pg-boss.start() + restore stuck jobs
}

async function registerCronScheduler() {
  // Cron scheduler henüz kurulmadı, şimdilik skip
  // TODO: node-cron veya benzeri register
}

async function initSSEEndpoints() {
  // SSE endpoint'ler admin.os.routes.js içinde mount'lanacak
  // Şimdilik sadece module'ün yüklendiğini kontrol et
  require('../routes/admin.os.routes.js');
}

async function pingUYAP() {
  // UYAP Kurumsal Web Servis anlaşması yok, stub
  // Critical flag ile işaretli ama şimdilik warning level bırakıyoruz
  console.warn('[BOOT] UYAP Kurumsal Web Servis anlaşması bekleniyor (stub)');
}

async function pingSBM() {
  // SBM'nin hukuk yazılımına özel API'si yok, manuel mode
  // Optional — olmaması normal
  console.warn('[BOOT] SBM manuel mode (web sorgu wizard aktif)');
}

async function checkKVKKSCC() {
  // KVKKSCC tablosunda aktif ve süresi dolmamış kayıtlar var mı?
  const activeScc = await prisma.kVKKSCC.count({
    where: {
      status: 'ACTIVE',
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });

  if (activeScc === 0) {
    // Henüz hiç SCC imzalanmamış — tedbirge henüz legal olarak hazır değil
    // Critical değil (boot'u durdurmaz) ama warning severity
    throw new Error('Hiç aktif KVKK SCC kaydı yok — yurt dışı veri aktarımı için Standart Sözleşme gerekiyor');
  }
}

async function checkVERBIS() {
  // VERBİS'in resmi API'si yok (2026 itibarıyla). Manuel kayıt kontrolü:
  // OSPolicy tablosunda "verbis.registered" key'i var mı?
  const verbisPolicy = await prisma.oSPolicy.findUnique({
    where: {
      module_key: {
        module: 'compliance',
        key: 'verbis.registered',
      },
    },
  });

  if (!verbisPolicy || !verbisPolicy.value || verbisPolicy.value.registered !== true) {
    throw new Error('VERBİS kaydı yapılmamış veya OSPolicy\'de işaretlenmemiş');
  }
}

// ─── Boot Sequence Definition ───────────────────────────────────────────────

const BOOT_STEPS = [
  { name: 'DB Connection', run: checkDatabase, critical: true },
  { name: 'Supabase Storage', run: checkSupabaseStorage, critical: true },
  { name: 'Oracle Worker', run: pingOracleWorker, optional: true },
  { name: 'Anthropic API', run: checkAnthropicAPI, critical: true },
  { name: 'pg-boss Queue', run: restorePgBossQueue, optional: true },
  { name: 'Cron Scheduler', run: registerCronScheduler, optional: true },
  { name: 'SSE Endpoints', run: initSSEEndpoints, critical: true },
  { name: 'UYAP Connectivity', run: pingUYAP, optional: true }, // anlaşma gelene kadar optional
  { name: 'SBM Health', run: pingSBM, optional: true },
  { name: 'KVKK SCC Validity', run: checkKVKKSCC, optional: true }, // ilk kurulum öncesi warn
  { name: 'VERBİS Kayıt', run: checkVERBIS, optional: true }, // ilk kurulum öncesi warn
];

// ─── Runner ─────────────────────────────────────────────────────────────────

async function withTimeout(promise, ms, stepName) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Step "${stepName}" timed out after ${ms}ms`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Boot sequence'i çalıştır.
 * @returns {Promise<{ok: boolean, steps: Array, totalMs: number}>}
 */
async function runBoot() {
  const startTime = Date.now();
  const results = [];
  let criticalFailure = false;

  for (const step of BOOT_STEPS) {
    const stepStart = Date.now();
    const timeoutMs = step.timeoutMs || DEFAULT_TIMEOUT_MS;

    try {
      await withTimeout(step.run(), timeoutMs, step.name);
      results.push({
        name: step.name,
        ok: true,
        durationMs: Date.now() - stepStart,
        optional: !!step.optional,
        critical: !!step.critical,
      });
      console.log(`[BOOT] ✓ ${step.name} (${Date.now() - stepStart}ms)`);
    } catch (err) {
      const result = {
        name: step.name,
        ok: false,
        durationMs: Date.now() - stepStart,
        optional: !!step.optional,
        critical: !!step.critical,
        error: err.message,
      };
      results.push(result);

      const icon = step.optional ? '⚠' : step.critical ? '✗' : '✗';
      console.log(`[BOOT] ${icon} ${step.name}: ${err.message}`);

      if (step.critical) {
        criticalFailure = true;
      }
    }
  }

  const totalMs = Date.now() - startTime;
  const allOk = !criticalFailure;

  // BootRecord'a yaz
  try {
    await prisma.bootRecord.create({
      data: {
        steps: results,
        totalMs,
        ok: allOk,
        version: process.env.GIT_COMMIT_SHA || 'unknown',
      },
    });
  } catch (err) {
    console.error('[BOOT] BootRecord persist failed:', err.message);
  }

  // Event bus'a yay
  await bus.emitOS(
    allOk ? EVENT_TYPES.SYSTEM_BOOTED : 'system:boot-failed',
    {
      severity: allOk ? 'info' : 'critical',
      module: 'boot',
      payload: {
        stepCount: results.length,
        failedSteps: results.filter(r => !r.ok).map(r => r.name),
        totalMs,
      },
    }
  ).catch(() => {});

  return {
    ok: allOk,
    steps: results,
    totalMs,
  };
}

module.exports = {
  runBoot,
  BOOT_STEPS,
};
