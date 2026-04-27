/**
 * Tedbirge OS — Event Bus
 *
 * OS katmanındaki tüm modüller arası haberleşmenin omurgası.
 * Node.js EventEmitter üstünde singleton + persistence + audit trail.
 *
 * Her event:
 * - Memory'de emit edilir (anlık dinleyicilere)
 * - SystemEvent tablosuna yazılır (KVKK audit, retrospektif analiz)
 * - Critical severity event'ler ayrıca alert kanalına akar (ileride)
 *
 * Referans: TEDBIRGE_OS_FIZIBILITE_v2 — Prensip 11 (Event-Driven Architecture)
 */

const { EventEmitter } = require('node:events');
const prisma = require("../config/db");
// prisma artik singleton'dan geliyor (Madde 9.3 — TUR #20)

// ─── Event Taxonomy ─────────────────────────────────────────────────────────
// Her event bir "namespace:action" pattern'i izler.
// severity: info | warning | error | critical

/**
 * @typedef {Object} EventMeta
 * @property {string} type        - "backup:completed" gibi
 * @property {string} severity    - "info" | "warning" | "error" | "critical"
 * @property {string} [module]    - Hangi modül tetikledi (pulse, backup, vs)
 * @property {string} [actorId]   - User.id — KVKK audit için
 * @property {Object} [payload]   - Event'e özgü veri
 */

const EVENT_TYPES = Object.freeze({
  // System lifecycle
  SYSTEM_BOOTED: 'system:booted',
  SYSTEM_SHUTDOWN: 'system:shutdown',
  SYSTEM_HEALTH_CHANGED: 'system:health-changed',

  // Backup module
  BACKUP_STARTED: 'backup:started',
  BACKUP_COMPLETED: 'backup:completed',
  BACKUP_FAILED: 'backup:failed',

  // Worker / supervisor
  WORKER_CRASHED: 'worker:crashed',
  WORKER_RESTARTED: 'worker:restarted',
  WORKER_GAVE_UP: 'worker:gave-up',

  // Analyzer (AI pipeline)
  ANALYZER_QUEUE_HIGH: 'analyzer:queue-depth-high',
  ANALYZER_JOB_COMPLETED: 'analyzer:job-completed',

  // Admin actions
  ADMIN_ACTION_REQUESTED: 'admin:action-requested',
  ADMIN_ACTION_APPROVED: 'admin:action-approved',
  ADMIN_ACTION_REJECTED: 'admin:action-rejected',

  // Cost tracking
  COST_BUDGET_EXCEEDED: 'cost:budget-exceeded',
  COST_ANOMALY_DETECTED: 'cost:anomaly-detected',

  // Security
  SECURITY_SUSPICIOUS_LOGIN: 'security:suspicious-login',
  SECURITY_RATE_LIMIT_HIT: 'security:rate-limit-hit',

  // KVKK
  KVKK_SCC_EXPIRING: 'kvkk:scc-expiring',
  KVKK_DATA_SUBJECT_REQUEST: 'kvkk:data-subject-request',

  // UYAP
  UYAP_TEBLIGAT_RECEIVED: 'uyap:tebligat-received',
  UYAP_DOSYA_SYNCED: 'uyap:dosya-synced',
  UYAP_SESSION_EXPIRED: 'uyap:session-expired',

  // SBM
  SBM_SORGU_COMPLETED: 'sbm:sorgu-completed',
});

// ─── Singleton Bus ──────────────────────────────────────────────────────────

class TedbirgeEventBus extends EventEmitter {
  constructor() {
    super();
    // EventEmitter default max listeners 10 — OS için yetersiz
    this.setMaxListeners(100);
    this._persistEnabled = true;
    this._devLogEnabled = process.env.NODE_ENV !== 'production';
  }

  /**
   * Event yay + persist et.
   * @param {string} type - EVENT_TYPES içinden bir değer
   * @param {EventMeta} meta
   */
  async emitOS(type, meta = {}) {
    const event = {
      type,
      severity: meta.severity || 'info',
      module: meta.module || null,
      actorId: meta.actorId || null,
      payload: meta.payload || {},
      timestamp: new Date(),
    };

    // 1. Dev log (production'da kapalı)
    if (this._devLogEnabled) {
      const icon = this._severityIcon(event.severity);
      console.log(`${icon} [OS] ${type} ${event.module ? `(${event.module})` : ''}`);
    }

    // 2. Memory emit — anlık dinleyiciler
    // super.emit senkron: bir dinleyici fırlatırsa diğerlerine ulaşmaz
    // Bu yüzden her listener'ı try/catch ile sarmak dinleyicinin sorumluluğu
    try {
      super.emit(type, event);
      super.emit('*', event); // wildcard dinleyici (metrics vb için)
    } catch (err) {
      console.error(`[OS/eventBus] Listener error for ${type}:`, err.message);
    }

    // 3. Persist — SystemEvent tablosuna yaz (audit trail)
    if (this._persistEnabled) {
      try {
        await prisma.systemEvent.create({
          data: {
            type: event.type,
            severity: event.severity,
            module: event.module,
            payload: event.payload,
            actorId: event.actorId,
          },
        });
      } catch (err) {
        // Persist hatası event'i durdurmasın, sadece log
        console.error(`[OS/eventBus] Persist failed for ${type}:`, err.message);
      }
    }

    return event;
  }

  /**
   * Type-safe dinleyici ekle. Handler async olabilir.
   * Handler içinde fırlatılan hatalar yakalanır, bus patlamazı.
   */
  onOS(type, handler) {
    const wrapped = async (event) => {
      try {
        await handler(event);
      } catch (err) {
        console.error(`[OS/eventBus] Handler error for ${type}:`, err.message);
      }
    };
    this.on(type, wrapped);
    return () => this.off(type, wrapped); // unsubscribe fonksiyonu döner
  }

  /**
   * Persistance'ı geçici kapat (test için)
   */
  disablePersist() { this._persistEnabled = false; }
  enablePersist() { this._persistEnabled = true; }

  _severityIcon(severity) {
    switch (severity) {
      case 'critical': return '🔥';
      case 'error': return '❌';
      case 'warning': return '⚠️ ';
      case 'info':
      default: return 'ℹ️ ';
    }
  }
}

// Singleton instance
const bus = new TedbirgeEventBus();

module.exports = {
  bus,
  EVENT_TYPES,
};
