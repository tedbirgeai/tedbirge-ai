/**
 * Tedbirge OS — Process Supervisor
 *
 * systemd tarzı watcher. Task'lar (in-process worker'lar, SSH bağlı job'lar)
 * bu supervisor'a kaydolur. Supervisor:
 * - Task crash'te otomatik restart (5 sn delay)
 * - 60 sn penceresinde max 3 restart, sonra "gave-up" durumuna geçer
 * - Her event'i event bus'a yayar (worker:crashed, worker:restarted, worker:gave-up)
 * - Admin manuel intervention ile gave-up task'ı tekrar aktif edebilir
 *
 * NOT: Supervisor sadece in-memory state tutar. Server restart'ta kaybolur —
 * boot.js bu task'ları yeniden register eder.
 *
 * Referans: TEDBIRGE_OS_FIZIBILITE_v2 — Prensip 9 (Process Supervisor, systemd)
 */

const { bus, EVENT_TYPES } = require('./eventBus');

// ─── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_CONFIG = Object.freeze({
  restartDelayMs: 5000,         // Çöküş sonrası restart için bekleme
  maxRestartsInWindow: 3,       // Pencere içinde max restart sayısı
  restartWindowMs: 60 * 1000,   // 60 sn rolling window
});

const TASK_STATUS = Object.freeze({
  IDLE: 'idle',           // Henüz start edilmedi
  RUNNING: 'running',     // Aktif çalışıyor
  CRASHED: 'crashed',     // Son iterasyon hata verdi, restart bekliyor
  GIVE_UP: 'gave-up',     // Çok fazla restart, manuel müdahale gerek
  STOPPED: 'stopped',     // Admin manuel durdurdu
});

// ─── Task State ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} SupervisedTask
 * @property {string} id           - Unique task identifier
 * @property {Function} runFn      - async () => Promise — task execution
 * @property {Object} config       - restart policy overrides
 * @property {string} status       - TASK_STATUS enum
 * @property {number} restartCount - total restart sayısı (metric için)
 * @property {Array<number>} recentRestarts - window içinde restart timestamp'ları
 * @property {Error|null} lastError
 * @property {Date} startedAt
 * @property {Date|null} lastCrashAt
 */

const tasks = new Map(); // taskId -> SupervisedTask

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Task kaydet. Henüz start etmez — manuel start() veya supervisor.startAll() gerekir.
 *
 * @param {string} id - unique task adı
 * @param {Function} runFn - async function, task'ın gövdesi
 * @param {Object} [config] - restart policy override
 * @returns {SupervisedTask}
 */
function register(id, runFn, config = {}) {
  if (!id || typeof id !== 'string') {
    throw new Error('Supervisor.register: id required (string)');
  }
  if (typeof runFn !== 'function') {
    throw new Error('Supervisor.register: runFn must be a function');
  }
  if (tasks.has(id)) {
    throw new Error(`Supervisor.register: task "${id}" already registered`);
  }

  const task = {
    id,
    runFn,
    config: { ...DEFAULT_CONFIG, ...config },
    status: TASK_STATUS.IDLE,
    restartCount: 0,
    recentRestarts: [],
    lastError: null,
    startedAt: null,
    lastCrashAt: null,
  };

  tasks.set(id, task);
  return task;
}

/**
 * Kayıtlı task'ı başlat. runFn çöktüğünde supervisor otomatik restart dener.
 */
async function start(taskId) {
  const task = tasks.get(taskId);
  if (!task) throw new Error(`Supervisor.start: task "${taskId}" not registered`);

  if (task.status === TASK_STATUS.RUNNING) {
    return; // Zaten çalışıyor, no-op
  }

  task.status = TASK_STATUS.RUNNING;
  task.startedAt = new Date();

  // Fire and forget — task async runs, supervisor watches
  _runWithSupervision(task);
}

/**
 * Internal: task'ı çalıştırır, çökerse restart policy'ye göre yeniden başlatır.
 */
async function _runWithSupervision(task) {
  while (task.status === TASK_STATUS.RUNNING) {
    try {
      await task.runFn();
      // Normal tamamlandı — long-running değilse buraya gelir, döngü çıkar
      task.status = TASK_STATUS.IDLE;
      return;
    } catch (err) {
      // Task çöktü
      task.lastError = err;
      task.lastCrashAt = new Date();
      task.status = TASK_STATUS.CRASHED;

      bus.emitOS(EVENT_TYPES.WORKER_CRASHED, {
        severity: 'error',
        module: 'supervisor',
        payload: {
          taskId: task.id,
          error: err.message,
          errorStack: err.stack,
        },
      }).catch(() => {}); // event bus hatası supervisor'ı durdurmasın

      // Restart policy kontrolü
      const canRestart = _checkRestartPolicy(task);

      if (!canRestart) {
        task.status = TASK_STATUS.GIVE_UP;
        bus.emitOS(EVENT_TYPES.WORKER_GAVE_UP, {
          severity: 'critical',
          module: 'supervisor',
          payload: {
            taskId: task.id,
            restartsInWindow: task.recentRestarts.length,
            lastError: err.message,
          },
        }).catch(() => {});
        return; // Restart bırakıldı, manuel müdahale gerek
      }

      // Restart delay
      await _sleep(task.config.restartDelayMs);

      // Restart sayacı güncelle
      task.restartCount += 1;
      task.recentRestarts.push(Date.now());
      task.status = TASK_STATUS.RUNNING;

      bus.emitOS(EVENT_TYPES.WORKER_RESTARTED, {
        severity: 'warning',
        module: 'supervisor',
        payload: {
          taskId: task.id,
          restartCount: task.restartCount,
          restartsInWindow: task.recentRestarts.length,
        },
      }).catch(() => {});

      // Loop devam eder, task yeniden çalışır
    }
  }
}

/**
 * Restart penceresi kontrolü.
 * @returns {boolean} restart yapılabilir mi
 */
function _checkRestartPolicy(task) {
  const now = Date.now();
  const windowStart = now - task.config.restartWindowMs;

  // Pencere dışındaki restart'ları temizle (rolling window)
  task.recentRestarts = task.recentRestarts.filter(t => t >= windowStart);

  // Pencere içinde max'a ulaşıldı mı
  return task.recentRestarts.length < task.config.maxRestartsInWindow;
}

/**
 * Task'ı manuel durdur (admin action).
 */
function stop(taskId) {
  const task = tasks.get(taskId);
  if (!task) throw new Error(`Supervisor.stop: task "${taskId}" not registered`);
  task.status = TASK_STATUS.STOPPED;
}

/**
 * GAVE_UP durumundaki task'ı yeniden aktif et (admin manuel müdahale).
 */
async function resume(taskId) {
  const task = tasks.get(taskId);
  if (!task) throw new Error(`Supervisor.resume: task "${taskId}" not registered`);
  if (task.status !== TASK_STATUS.GIVE_UP && task.status !== TASK_STATUS.STOPPED) {
    throw new Error(`Supervisor.resume: task "${taskId}" is ${task.status}, not resumable`);
  }

  // Restart penceresini temizle
  task.recentRestarts = [];
  task.status = TASK_STATUS.RUNNING;
  _runWithSupervision(task);
}

/**
 * Task'ı unregister et (artık izlenmesin).
 */
function unregister(taskId) {
  const task = tasks.get(taskId);
  if (!task) return false;
  task.status = TASK_STATUS.STOPPED;
  tasks.delete(taskId);
  return true;
}

/**
 * Tüm task'ların snapshot'unu döndür (Modül 1 — Pulse için).
 */
function getStatus() {
  return Array.from(tasks.values()).map(t => ({
    id: t.id,
    status: t.status,
    restartCount: t.restartCount,
    restartsInWindow: t.recentRestarts.length,
    lastError: t.lastError ? t.lastError.message : null,
    startedAt: t.startedAt,
    lastCrashAt: t.lastCrashAt,
  }));
}

function _sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = {
  register,
  start,
  stop,
  resume,
  unregister,
  getStatus,
  TASK_STATUS,
  DEFAULT_CONFIG,
};
