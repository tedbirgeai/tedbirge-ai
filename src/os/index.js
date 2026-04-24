/**
 * Tedbirge OS — Ana Giris Noktasi (Barrel Export)
 *
 * Bu dosya src/os altindaki tum cekirdek modulleri tek yerden export eder.
 * Iki stil destekli:
 *
 *   1. Direkt import (duz):
 *      const { runBoot, bus, EVENT_TYPES } = require('./os');
 *
 *   2. Namespace import (grup):
 *      const os = require('./os');
 *      os.boot.runBoot();
 *      os.bus.emitOS(...);
 *
 * Her iki stil de gecerlidir — kullanim kontekstine gore tercih edilebilir.
 *
 * Modul yukleme sirasi kritik degildir; her modul kendi lifecycle'ini yonetir.
 * Server'in lifecycle yonetimi icin bakiniz: src/server.js veya src/app.js
 * (OS modullerini oraya require edip runBoot + startReconciler + startSupervisor cagirilacak).
 *
 * 5 cekirdek modul (v3 Sprint 1):
 *   - eventBus     : tum OS haberleşme omurgasi (singleton)
 *   - idempotency  : cift tiklama ve retry koruması
 *   - supervisor   : systemd tarzi task watcher (register/start/stop/resume)
 *   - boot         : 11 adimli startup sequence
 *   - reconciler   : desired vs actual state loop (her 5dk + saatlik cleanup)
 *
 * Siradaki modul katmanlari (Sprint 2+):
 *   - adapters/    : HAL (Hardware Abstraction Layer) — 9 adapter
 *   - modules/     : 15 is modulu (pulse, backup, security, compliance, ...)
 *   - observability: 3 observability dosyasi (logs, metrics, traces)
 *
 * Referans: TEDBIRGE_OS_FIZIBILITE_v2 (Prensip 1-15), v3 (UYAP/SBM/KVKK eklemeleri)
 */

// ─── Core Modules ───────────────────────────────────────────────────────────

const eventBusModule   = require('./eventBus');
const idempotencyModule = require('./idempotency');
const supervisorModule = require('./supervisor');
const bootModule       = require('./boot');
const reconcilerModule = require('./reconciler');

// ─── Flat Exports (convenience) ─────────────────────────────────────────────

module.exports = {
  // eventBus
  bus: eventBusModule.bus,
  EVENT_TYPES: eventBusModule.EVENT_TYPES,

  // idempotency
  getIdempotent: idempotencyModule.getIdempotent,
  saveIdempotent: idempotencyModule.saveIdempotent,
  cleanupExpired: idempotencyModule.cleanupExpired,
  requireIdempotencyKey: idempotencyModule.requireIdempotencyKey,
  DEFAULT_TTL_MS: idempotencyModule.DEFAULT_TTL_MS,
  HEADER_NAME: idempotencyModule.HEADER_NAME,

  // supervisor
  register: supervisorModule.register,
  start: supervisorModule.start,
  stop: supervisorModule.stop,
  resume: supervisorModule.resume,
  unregister: supervisorModule.unregister,
  getStatus: supervisorModule.getStatus,
  TASK_STATUS: supervisorModule.TASK_STATUS,
  DEFAULT_CONFIG: supervisorModule.DEFAULT_CONFIG,

  // boot
  runBoot: bootModule.runBoot,
  BOOT_STEPS: bootModule.BOOT_STEPS,

  // reconciler
  startReconciler: reconcilerModule.startReconciler,
  stopReconciler: reconcilerModule.stopReconciler,
  registerPolicyHandler: reconcilerModule.registerPolicyHandler,
  runReconcileTick: reconcilerModule.runReconcileTick,
  runCleanupTick: reconcilerModule.runCleanupTick,

  // ─── Namespaced Exports ─────────────────────────────────────────────────
  // (alternatif erisim stili: os.boot.runBoot(), os.reconciler.startReconciler())
  eventBus: eventBusModule,
  idempotency: idempotencyModule,
  supervisor: supervisorModule,
  boot: bootModule,
  reconciler: reconcilerModule,
};
