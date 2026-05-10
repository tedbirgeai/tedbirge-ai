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

const prisma = require("../config/db");
// prisma artik singleton'dan geliyor (Madde 9.3 — TUR #20)
const { bus, EVENT_TYPES } = require('./eventBus');
const { cleanupExpired } = require('./idempotency');

// ─── Configuration ──────────────────────────────────────────────────────────

const RECONCILE_INTERVAL_MS = 5 * 60 * 1000;  // 5 dakika
const CLEANUP_INTERVAL_MS   = 60 * 60 * 1000; // 1 saat

// Module ismi -> policy handler fonksiyonu.
// Handler imzasi: async (policy, prisma) => ({ drift: boolean, action: string|null, details: object })
//
// TUR #110 A3 — Madde 30.63 yeni: Reconciler Drift Detection Disiplini.
// 5 handler tanimli: env_drift, schema_drift, route_orphan, role_permission_drift, version_string_drift.
// AUTO-FIX YOK — sadece detect + ADMIN_FEED bildirim (Madde 24.11). ADMIN manuel onay verir.
// Aktivasyon: OSPolicy'de { module: '<handlerName>', key: 'monitor', value: {...} } kaydi olmali.
// Aktif degilse handler hic cagrilmaz — guvenli (false alarm yok).
const POLICY_HANDLERS = {

  // 1. env_drift — beklenen env vars vs gercek
  env_drift: async (_policy, _prisma) => {
    const required = (_policy.value && Array.isArray(_policy.value.required))
      ? _policy.value.required
      : ['DATABASE_URL', 'JWT_SECRET', 'SUPABASE_URL', 'ANTHROPIC_API_KEY'];
    const missing = required.filter((k) => !process.env[k] || process.env[k].length < 10);
    return {
      drift: missing.length > 0,
      action: missing.length > 0 ? `${missing.length} env var eksik` : null,
      details: { missing, requiredCount: required.length },
    };
  },

  // 2. schema_drift — _prisma_migrations finished_at IS NULL bekleyen migration sayisi
  schema_drift: async (_policy, prismaClient) => {
    let pending = 0;
    try {
      const r = await prismaClient.$queryRaw`SELECT COUNT(*)::int AS pending FROM "_prisma_migrations" WHERE finished_at IS NULL`;
      pending = Number(r?.[0]?.pending) || 0;
    } catch (err) {
      return { drift: false, action: null, details: { error: err.message?.slice(0, 200) } };
    }
    return {
      drift: pending > 0,
      action: pending > 0 ? `${pending} bekleyen migration (postinstall hook'u kontrol et)` : null,
      details: { pendingMigrations: pending },
    };
  },

  // 3. route_orphan — RolePermission'da olup registry'de olmayan modul isimleri (orphan)
  route_orphan: async (_policy, prismaClient) => {
    try {
      const reg = require('./registry');
      const known = new Set(reg.ALL_MODULES || []);
      const distinct = await prismaClient.rolePermission.findMany({
        select: { module: true },
        distinct: ['module'],
      }).catch(() => []);
      const orphans = distinct.map((d) => d.module).filter((m) => !known.has(m));
      return {
        drift: orphans.length > 0,
        action: orphans.length > 0 ? `${orphans.length} modul registry disi izin (orphan)` : null,
        details: { orphans, knownModules: known.size },
      };
    } catch (err) {
      return { drift: false, action: null, details: { error: err.message?.slice(0, 200) } };
    }
  },

  // 4. role_permission_drift — registry'de olup RolePermission'da hic kaydi olmayan modul
  role_permission_drift: async (_policy, prismaClient) => {
    try {
      const reg = require('./registry');
      const expected = reg.ALL_MODULES || [];
      const distinct = await prismaClient.rolePermission.findMany({
        select: { module: true },
        distinct: ['module'],
      }).catch(() => []);
      const present = new Set(distinct.map((d) => d.module));
      const missing = expected.filter((m) => !present.has(m));
      return {
        drift: missing.length > 0,
        action: missing.length > 0 ? `${missing.length} modul RBAC seed eksik (boot auto-register kontrol et)` : null,
        details: { missing, expectedCount: expected.length, presentCount: present.size },
      };
    } catch (err) {
      return { drift: false, action: null, details: { error: err.message?.slice(0, 200) } };
    }
  },

  // 5. version_string_drift — version.json anayasa surumunu CLAUDE.md ile karsilastir (statik check yerine env var)
  version_string_drift: async (_policy, _prisma) => {
    try {
      const path = require('path');
      const fs = require('fs');
      const versionJsonPath = path.resolve(__dirname, '../../tedbirge-os/version.json');
      const pkgJsonPath = path.resolve(__dirname, '../../package.json');
      let versionJson = null;
      let pkgJson = null;
      try { versionJson = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8')); } catch (_) {}
      try { pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')); } catch (_) {}
      if (!versionJson || !pkgJson) {
        return { drift: false, action: null, details: { reason: 'version.json veya package.json okunamadi' } };
      }
      const drift = versionJson.backend && pkgJson.version && versionJson.backend !== pkgJson.version;
      return {
        drift,
        action: drift ? `Backend surum drift: version.json=${versionJson.backend} vs package.json=${pkgJson.version}` : null,
        details: { versionJson: versionJson.backend, pkgJson: pkgJson.version },
      };
    } catch (err) {
      return { drift: false, action: null, details: { error: err.message?.slice(0, 200) } };
    }
  },

};

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

  // TUR #110 A3 — Madde 30.63 yeni: Drift detected → ADMIN_FEED RealtimeEvent (Madde 24.11 onay icin)
  // AUTO-FIX YOK — sadece bildirim. ADMIN /dashboard/sistem-durumu'dan görüp manuel müdahale eder.
  const driftResults = results.filter((r) => r.drift);
  for (const dr of driftResults) {
    try {
      await prisma.realtimeEvent.create({
        data: {
          channel: 'ADMIN_FEED',
          eventType: 'RECONCILER_DRIFT_DETECTED',
          payload: {
            title: `🔧 Drift: ${dr.module}`,
            body: dr.action || 'Sapma tespit edildi',
            module: dr.module,
            key: dr.key,
            details: dr.details || {},
            severity: 'WARNING',
          },
        },
      });
    } catch (_) {}
  }
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
