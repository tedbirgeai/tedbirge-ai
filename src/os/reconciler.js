/**
 * Tedbirge OS — Reconciler
 *
 * Kubernetes desired-state reconciliation paradigmasinin Tedbirge uyarlamasi.
 *
 * Iki ayri dongu:
 *   1. Her 5 dakika — OSPolicy desired vs actual karsilastirma, sapma varsa handler cagir
 *   2. Her 1 saat  — IdempotencyKey.cleanupExpired() (sureli idempotency kayitlarini sil)
 *
 * Her iterasyon SystemEvent'a yazilir ve event bus'a emit edilir.
 * Hata olsa dongu durmaz — sonraki tick calismaya devam eder.
 *
 * Referans: TEDBIRGE_OS_FIZIBILITE_v2 — Prensip 2 (Desired vs Actual State)
 */

const { PrismaClient } = require('@prisma/client');
const { bus, EVENT_TYPES } = require('./eventBus');
const { cleanupExpired } = require('./idempotency');

const prisma = new PrismaClient();

// ─── Configuration ──────────────────────────────────────────────────────────

const RECONCILE_INTERVAL_MS = 5 * 60 * 1000;  // 5 dakika
const CLEANUP_INTERVAL_MS   = 60 * 60 * 1000; // 1 saat

// Module ismi -> policy handler fonksiyonu.
// Handler imzasi: async (policy, prisma) => ({ drift: boolean, action: string|null, details: object })
// Henuz hicbir handler yazilmadi — bos obje, TODO: pulse/backup/maintenance modulleri eklendikce doldurulacak.
const POLICY_HANDLERS = {};

// ─── Internal State ─────────────────────────────────────────────────────────

let reconcileTimer = null;
let cleanupTimer = null;
let isRunning = false;

// ─── Policy Reconciliation ──────────────────────────────────────────────────

/**
 * Tek bir policy icin desired vs actual karsilastirma yap.
 * Handler yoksa (modul henuz eklenmedi) skip et — hata degil.
 */
async function reconcilePolicy(policy) {
  const handler = POLICY_HANDLERS[policy.module];

  if (!handler) {
    return { module: policy.module, key: policy.key, status: 'no_handler', drift: false };
  }

  try {
    const result = await handler(policy, prisma);
    return {
      module: policy.module,
      key: policy.key,
      status: result.drift ? 'drift_corrected' : 'in_sync',
      drift: !!result.drift,
      action: result.action || null,
      details: result.details || {},
    };
  } catch (err) {
    return {
      module: policy.module,
      key: policy.key,
      status: 'handler_error',
      drift: false,
      error: err.message,
    };
  }
}

/**
 * Tum aktif policy'leri getir, her biri icin reconcilePolicy cagir.
 * Sonuclari tek bir SystemEvent'a topla, event bus'a yay.
 */
async function runReconcileTick() {
  const tickStart = Date.now();
  const results = [];

  try {
    const policies = await prisma.oSPolicy.findMany();

    for (const policy of policies) {
      const result = await reconcilePolicy(policy);
      results.push(result);
    }
  } catch (err) {
    console.error('[RECONCILER] Policy fetch failed:', err.message);
    results.push({ status: 'fetch_error', error: err.message });
  }

  const durationMs = Date.now() - tickStart;
  const driftCount = results.filter(r => r.drift).length;
  const errorCount = results.filter(r => r.status === 'handler_error' || r.status === 'fetch_error').length;

  console.log(
    `[RECONCILER] tick=${results.length} drift=${driftCount} err=${errorCount} ${durationMs}ms`
  );

  // Event bus'a yay — observability
  await bus.emitOS('system:reconciler-tick', {
    severity: errorCount > 0 ? 'warn' : 'info',
    module: 'reconciler',
    payload: {
      policyCount: results.length,
      driftCount,
      errorCount,
      durationMs,
      results,
    },
  }).catch(() => {});
}

// ─── Idempotency Cleanup ────────────────────────────────────────────────────

/**
 * Saatlik idempotency temizligi.
 * Basarisiz olursa log at, durma.
 */
async function runCleanupTick() {
  const tickStart = Date.now();

  try {
    const deletedCount = await cleanupExpired();
    const durationMs = Date.now() - tickStart;

    console.log(`[RECONCILER] cleanup deleted=${deletedCount} ${durationMs}ms`);

    await bus.emitOS('system:idempotency-cleanup', {
      severity: 'info',
      module: 'reconciler',
      payload: { deletedCount, durationMs },
    }).catch(() => {});
  } catch (err) {
    console.error('[RECONCILER] Cleanup failed:', err.message);
    await bus.emitOS('system:idempotency-cleanup', {
      severity: 'warn',
      module: 'reconciler',
      payload: { error: err.message },
    }).catch(() => {});
  }
}

// ─── Lifecycle ──────────────────────────────────────────────────────────────

/**
 * Reconciler'i baslat. Iki ayri interval olusturur:
 *   - runReconcileTick() her 5 dakika
 *   - runCleanupTick() her 1 saat
 *
 * Idempotent — bir kez calissa tekrar cagirmak sessizce gecer.
 */
function startReconciler() {
  if (isRunning) {
    console.warn('[RECONCILER] Zaten calisiyor, start cagrisi gormezden gelindi');
    return;
  }

  isRunning = true;

  // Ilk tick'i hemen calistirma — boot sequence bittikten sonra server'in stabilizasyona zaman taniyor.
  // Ilk reconcile tick: boot +5dk, ilk cleanup tick: boot +1sa.

  reconcileTimer = setInterval(() => {
    runReconcileTick().catch(err => {
      console.error('[RECONCILER] Unhandled reconcile error:', err.message);
    });
  }, RECONCILE_INTERVAL_MS);

  cleanupTimer = setInterval(() => {
    runCleanupTick().catch(err => {
      console.error('[RECONCILER] Unhandled cleanup error:', err.message);
    });
  }, CLEANUP_INTERVAL_MS);

  console.log(
    `[RECONCILER] started: reconcile ${RECONCILE_INTERVAL_MS / 60000}dk, cleanup ${CLEANUP_INTERVAL_MS / 60000}dk`
  );
}

/**
 * Reconciler'i durdur. Graceful shutdown icin.
 * Idempotent — zaten durmussa sessizce gecer.
 */
function stopReconciler() {
  if (!isRunning) return;

  if (reconcileTimer) {
    clearInterval(reconcileTimer);
    reconcileTimer = null;
  }
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }

  isRunning = false;
  console.log('[RECONCILER] stopped');
}

/**
 * Handler registrasyonu — diger moduller (pulse, backup, maintenance) kendi policy handler'larini kaydeder.
 */
function registerPolicyHandler(moduleName, handler) {
  if (typeof handler !== 'function') {
    throw new Error(`Handler must be a function (module: ${moduleName})`);
  }
  POLICY_HANDLERS[moduleName] = handler;
}

module.exports = {
  startReconciler,
  stopReconciler,
  registerPolicyHandler,
  runReconcileTick,  // test ve manuel tetikleme icin export
  runCleanupTick,    // test ve manuel tetikleme icin export
};
