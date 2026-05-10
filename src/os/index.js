/**
 * Tedbirge OS — Ana Giriş Noktası (Barrel Export)
 *
 * Çekirdek + 16 İş Modülü tek noktadan export edilir.
 *
 * Kullanım:
 *   const tedbirgeOS = require('./os');
 *   tedbirgeOS.bus.emit(...)              // çekirdek event bus
 *   tedbirgeOS.runBoot()                  // boot zinciri
 *   tedbirgeOS.modules.ai.status()        // 16 modülden biri
 *
 * Mimar: Claude Opus 4.7 — 25 Nisan 2026
 * Değişiklik: modules namespace eklendi (admin.os.controller için)
 */

// ─── ÇEKIRDEK ───────────────────────────────────────────────────────────────
const eventBusModule    = require('./eventBus');
const idempotencyModule = require('./idempotency');
const supervisorModule  = require('./supervisor');
const bootModule        = require('./boot');
const reconcilerModule  = require('./reconciler');

// EventBus exports
const { bus, EVENT_TYPES } = eventBusModule;

// Idempotency exports
const {
  getIdempotent,
  saveIdempotent,
  cleanupExpired,
  requireIdempotencyKey,
  DEFAULT_TTL_MS,
  HEADER_NAME,
} = idempotencyModule;

// Supervisor exports
const {
  register,
  start,
  stop,
  resume,
  unregister,
  getStatus,
  TASK_STATUS,
  DEFAULT_CONFIG,
} = supervisorModule;

// Boot exports
const { runBoot, BOOT_STEPS } = bootModule;

// Reconciler exports
const {
  startReconciler,
  stopReconciler,
  registerPolicyHandler,
  runReconcileTick,
  runCleanupTick,
} = reconcilerModule;

// ─── 16 İŞ MODÜLÜ ──────────────────────────────────────────────────────────
// src/os/modules/ klasöründeki gerçek dosyalar (TAM_TESHIS satır 74-89 ile doğrulandı)
//
// Hata toleransı: Bir modül require sırasında patlarsa boot'u öldürmesin.
// Patlayan modül { error: "<mesaj>" } olarak işaretlenir, diğerleri yüklenir.

function safeRequire(path, name) {
  try {
    return require(path);
  } catch (err) {
    console.error(`[os/index] Modul yuklenemedi: ${name}: ${err.message}`);
    return { error: `Modul yuklenemedi: ${err.message}` };
  }
}

const modules = {
  ai:            safeRequire('./modules/ai', 'ai'),
  analyzer:      safeRequire('./modules/analyzer', 'analyzer'),
  appearance:    safeRequire('./modules/appearance', 'appearance'),
  backup:        safeRequire('./modules/backup', 'backup'),
  compliance:    safeRequire('./modules/compliance', 'compliance'),
  costGuard:     safeRequire('./modules/costGuard', 'costGuard'),
  deploy:        safeRequire('./modules/deploy', 'deploy'),
  insurance:     safeRequire('./modules/insurance', 'insurance'),
  maintenance:   safeRequire('./modules/maintenance', 'maintenance'),
  navigation:    safeRequire('./modules/navigation', 'navigation'),
  notifications: safeRequire('./modules/notifications', 'notifications'),
  performance:   safeRequire('./modules/performance', 'performance'),
  pulse:         safeRequire('./modules/pulse', 'pulse'),
  recovery:      safeRequire('./modules/recovery', 'recovery'),
  security:      safeRequire('./modules/security', 'security'),
  uyapControl:   safeRequire('./modules/uyapControl', 'uyapControl'),
  // TUR #110 A4 — modules.auditor SILINDI: src/os/modules/auditor.js DEAD CODE'du.
  //   Hicbir yerden start() cagrilmiyordu (TESHIS docs + agents-health kaniti).
  //   Drift detection sorumlulugu src/os/reconciler.js POLICY_HANDLERS'a (5 handler) tasindi (Madde 30.63 yeni).
  //   Aktif Auditor: src/agents/auditor.agent.js (5dk tick orchestrator, KORUNDU).
  healer:        safeRequire('./modules/healer', 'healer'),
  reporter:      safeRequire('./modules/reporter', 'reporter'),
  // TUR #95 H2 — Mimar Hatası Proaktif Tarama (Madde 14.4)
  mimarHatasi:   safeRequire('./modules/mimarHatasi', 'mimarHatasi'),
  kvkk:          safeRequire('./adapters/kvkk', 'kvkk'),
};

// ─── BARREL EXPORT ──────────────────────────────────────────────────────────
module.exports = {
  // EventBus
  bus,
  EVENT_TYPES,

  // Idempotency
  getIdempotent,
  saveIdempotent,
  cleanupExpired,
  requireIdempotencyKey,
  DEFAULT_TTL_MS,
  HEADER_NAME,

  // Supervisor
  register,
  start,
  stop,
  resume,
  unregister,
  getStatus,
  TASK_STATUS,
  DEFAULT_CONFIG,

  // Boot
  runBoot,
  BOOT_STEPS,

  // Reconciler
  startReconciler,
  stopReconciler,
  registerPolicyHandler,
  runReconcileTick,
  runCleanupTick,

  // Çekirdek modül erişimi (alternatif)
  eventBus:    eventBusModule,
  idempotency: idempotencyModule,
  supervisor:  supervisorModule,
  boot:        bootModule,
  reconciler:  reconcilerModule,

  // 16 iş modülü (admin.os.controller bunu kullanır)
  modules,

  // TUR #100.7 P3 + P4 — RBAC auto-register (Madde 30.55 R2)
  registry: require('./registry'),
  ensureRbacRegistration,
};

// ─── TUR #100.7 P4 — RBAC Auto-Register Boot Hook (Madde 30.55 R2) ──────────
// Yeni modül `src/os/registry.js`'e eklendiğinde RolePermission tablosuna
// otomatik 4 rol × 4 action = 16 satır kayıt edilir (mevcut izinler KORUNUR).

let lastRbacRegistration = 0;
const RBAC_REGISTRATION_INTERVAL = 5 * 60 * 1000; // 5 dk lock

async function ensureRbacRegistration() {
  try {
    const { autoRegisterAllModules } = require('../../scripts/seed-role-permissions');
    const result = await autoRegisterAllModules();
    console.log(`[os] RBAC auto-register OK · ${result.modules} modül × 4×4 = ${result.rows} satır upsert`);
    return result;
  } catch (err) {
    // Tablonun olmaması (drift) graceful skip — postinstall yedek
    console.warn('[os] RBAC auto-register skip:', err.message);
    return null;
  }
}

async function maybeEnsureRbac() {
  const now = Date.now();
  if (now - lastRbacRegistration < RBAC_REGISTRATION_INTERVAL) return;
  lastRbacRegistration = now;
  await ensureRbacRegistration();
}

// Boot tetiği — OS_ENABLED=true ise setImmediate ile event loop sonrası
if (process.env.OS_ENABLED === 'true') {
  setImmediate(() => {
    maybeEnsureRbac().catch((err) => {
      console.warn('[os] Initial RBAC ensure başarısız:', err.message);
    });
  });
}
