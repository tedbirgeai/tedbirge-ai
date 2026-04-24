/**
 * src/os/modules/notifications.js
 *
 * Tedbirge OS — Modul 10: Bildirim Dispatcher (Notifications)
 *
 * AMAC:
 *   Event bus'tan kritik/warning severity event'leri dinleyip dis iletim
 *   kanallarina (SMS, email, push, Slack, WhatsApp) yonlendirmek. Tedbirge'nin
 *   mevcut altyapisinda SMS + WhatsApp Business API + email servisi var
 *   (15 Nisan oturumunda eklendi). Bu modul onlari orchestrate eder.
 *
 *   Ornek akislar:
 *     SECURITY_SUSPICIOUS_LOGIN -> admin email alert
 *     BACKUP_FAILED -> SMS + Slack webhook
 *     KVKK_SCC_EXPIRING -> admin email + takvim notu
 *     COST_BUDGET_EXCEEDED -> admin email
 *     UYAP_TEBLIGAT_RECEIVED -> avukat push bildirim
 *
 * MIMARI:
 *   - Event listener pattern: bus.onOS(EVENT_TYPE, handler)
 *   - Rules table: { eventType, channels[], severity_min, recipient_policy }
 *   - Default rules: kritik olaylar admin'e, kullanici olaylari kullaniciya
 *   - Delivery history ring buffer (son 200)
 *   - Retry queue: basarisiz delivery 3 kez, exp backoff (Sprint 3)
 *   - Channel adapter: sms/email/push/slack - baslangicta stub, Sprint 3 gercek
 *   - Idempotency: ayni event.id 2 kez bildirim gondermez
 *   - Cooldown: ayni recipient'a 5dk'da ayni tip bildirim max 1
 *
 * KAPSAM (Sprint 2 THIN):
 *   - dispatch(event) - event'i alip kanallara yonlendirir (stub delivery)
 *   - registerRule({ eventType, channels, minSeverity }) - runtime kural ekleme
 *   - Default 5 kural: security, backup, kvkk, cost, worker
 *   - Delivery log (ok + fail)
 *   - Channel stubs: sms, email, push, slack - console.log + event emit
 *   - start() / stop() - auto-listen mode
 *   - getStatus() + getDeliveryHistory()
 *
 * KAPSAM DIŞI (Sprint 3+):
 *   - Gercek kanal entegrasyonu (NetGSM SMS, Nodemailer, Web Push, Slack webhook)
 *   - Delivery retry + exp backoff
 *   - User preferences (hangi bildirimi hangi kanaldan almak istersin)
 *   - Rate limiting (gunluk max X bildirim/kullanici)
 *   - Notification digest (gunluk rollup - aynitip bildirimler birlestir)
 *   - Template engine (i18n, markdown -> html)
 *   - DND (do not disturb) saatleri
 *
 * EVENT TYPES (string literal, EVENT_TYPES'ta yok):
 *   - 'notifications:dispatched'
 *   - 'notifications:failed'
 *
 * CHANNELS (Sprint 2 THIN - hepsi stub):
 *   - sms       (NetGSM, Sprint 3)
 *   - email     (Nodemailer, Sprint 3)
 *   - push      (Web Push + FCM, Sprint 3)
 *   - slack     (webhook, Sprint 3)
 *   - whatsapp  (WhatsApp Business API, Sprint 3)
 *
 * DATA CONTRACT (rule):
 *   {
 *     eventType: 'backup:failed',
 *     channels: ['email', 'slack'],
 *     minSeverity: 'error',        // 'info' | 'warning' | 'error' | 'critical'
 *     recipientPolicy: 'admin',    // 'admin' | 'actor' | 'custom'
 *     customRecipient: null,       // veya email/phone string
 *   }
 *
 * DATA CONTRACT (delivery):
 *   {
 *     id, eventType, channel, recipient, severity, status,
 *     deliveredAt, error?, payload
 *   }
 *
 * BAGIMLILIK:
 *   - ./eventBus — bus, EVENT_TYPES
 *
 * KULLANIM:
 *   const notifications = require('./modules/notifications');
 *   notifications.start();
 *
 *   // Custom rule:
 *   notifications.registerRule({
 *     eventType: 'uyap:tebligat-received',
 *     channels: ['push', 'sms'],
 *     minSeverity: 'info',
 *     recipientPolicy: 'actor',
 *   });
 */

"use strict";

const { bus, EVENT_TYPES } = require("../eventBus");

// ============================================================================
// SECTION 1 — CONSTANTS
// ============================================================================

const MODULE_NAME = "notifications";

const HISTORY_SIZE = 200;
const COOLDOWN_MS = 5 * 60 * 1000;         // 5 dakika per (recipient, eventType)

const CHANNELS = Object.freeze({
  SMS: "sms",
  EMAIL: "email",
  PUSH: "push",
  SLACK: "slack",
  WHATSAPP: "whatsapp",
});

const DELIVERY_STATUS = Object.freeze({
  PENDING: "pending",
  DELIVERED: "delivered",
  FAILED: "failed",
  SKIPPED: "skipped",
});

const SEVERITY_RANK = Object.freeze({
  info: 1,
  warning: 2,
  error: 3,
  critical: 4,
});

const EVENT_DISPATCHED = "notifications:dispatched";
const EVENT_FAILED = "notifications:failed";

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "tedbirge42@gmail.com";
const DEFAULT_ADMIN_PHONE = process.env.ADMIN_PHONE || null;
const DEFAULT_SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL || null;

// ============================================================================
// SECTION 2 — DEFAULT RULES
// ============================================================================

const DEFAULT_RULES = [
  {
    eventType: EVENT_TYPES.SECURITY_SUSPICIOUS_LOGIN,
    channels: [CHANNELS.EMAIL, CHANNELS.SLACK],
    minSeverity: "warning",
    recipientPolicy: "admin",
  },
  {
    eventType: EVENT_TYPES.SECURITY_RATE_LIMIT_HIT,
    channels: [CHANNELS.EMAIL],
    minSeverity: "warning",
    recipientPolicy: "admin",
  },
  {
    eventType: EVENT_TYPES.BACKUP_FAILED,
    channels: [CHANNELS.EMAIL, CHANNELS.SMS],
    minSeverity: "error",
    recipientPolicy: "admin",
  },
  {
    eventType: EVENT_TYPES.KVKK_SCC_EXPIRING,
    channels: [CHANNELS.EMAIL],
    minSeverity: "warning",
    recipientPolicy: "admin",
  },
  {
    eventType: EVENT_TYPES.KVKK_DATA_SUBJECT_REQUEST,
    channels: [CHANNELS.EMAIL],
    minSeverity: "warning",
    recipientPolicy: "admin",
  },
  {
    eventType: EVENT_TYPES.COST_BUDGET_EXCEEDED,
    channels: [CHANNELS.EMAIL],
    minSeverity: "warning",
    recipientPolicy: "admin",
  },
  {
    eventType: EVENT_TYPES.WORKER_CRASHED,
    channels: [CHANNELS.SLACK],
    minSeverity: "error",
    recipientPolicy: "admin",
  },
];

// ============================================================================
// SECTION 3 — INTERNAL STATE
// ============================================================================

/** Kural registry: Map<eventType, Array<Rule>> */
const ruleRegistry = new Map();

/** Delivery history ring buffer */
const deliveryHistory = [];

/** Cooldown: Map<cooldownKey, timestamp> */
const cooldowns = new Map();

/** Seen event IDs (idempotency) */
const seenEventIds = new Set();
const SEEN_MAX_SIZE = 500;

let isRunning = false;
let unsubscribers = [];
let totalDispatched = 0;
let totalDelivered = 0;
let totalFailed = 0;
let totalSkipped = 0;

// ============================================================================
// SECTION 4 — RULE REGISTRY
// ============================================================================

function registerRule(rule) {
  if (!rule?.eventType || !Array.isArray(rule.channels) || rule.channels.length === 0) {
    throw new Error("registerRule: eventType + channels (non-empty array) zorunlu");
  }
  const invalid = rule.channels.filter((c) => !Object.values(CHANNELS).includes(c));
  if (invalid.length > 0) {
    throw new Error(`registerRule: gecersiz channel(s): ${invalid.join(",")}`);
  }
  if (!ruleRegistry.has(rule.eventType)) {
    ruleRegistry.set(rule.eventType, []);
  }
  ruleRegistry.get(rule.eventType).push({
    eventType: rule.eventType,
    channels: rule.channels,
    minSeverity: rule.minSeverity || "info",
    recipientPolicy: rule.recipientPolicy || "admin",
    customRecipient: rule.customRecipient || null,
  });
}

function clearRules() {
  ruleRegistry.clear();
}

function loadDefaultRules() {
  for (const rule of DEFAULT_RULES) {
    registerRule(rule);
  }
}

function listRules() {
  const out = [];
  for (const arr of ruleRegistry.values()) {
    out.push(...arr);
  }
  return out;
}

// ============================================================================
// SECTION 5 — RECIPIENT RESOLUTION
// ============================================================================

function resolveRecipient(rule, event, channel) {
  if (rule.recipientPolicy === "custom" && rule.customRecipient) {
    return rule.customRecipient;
  }
  if (rule.recipientPolicy === "actor" && event.actorId) {
    return event.actorId;
  }
  if (channel === CHANNELS.EMAIL) return DEFAULT_ADMIN_EMAIL;
  if (channel === CHANNELS.SMS) return DEFAULT_ADMIN_PHONE || "admin-phone-unset";
  if (channel === CHANNELS.SLACK) return DEFAULT_SLACK_WEBHOOK || "admin-slack-unset";
  if (channel === CHANNELS.PUSH) return "admin-push";
  if (channel === CHANNELS.WHATSAPP) return DEFAULT_ADMIN_PHONE || "admin-whatsapp-unset";
  return "unknown";
}

// ============================================================================
// SECTION 6 — COOLDOWN + SEEN
// ============================================================================

function isInCooldown(recipient, eventType) {
  const key = `${recipient}:${eventType}`;
  const last = cooldowns.get(key);
  if (!last) return false;
  return Date.now() - last < COOLDOWN_MS;
}

function markCooldown(recipient, eventType) {
  cooldowns.set(`${recipient}:${eventType}`, Date.now());
}

function markSeen(eventId) {
  seenEventIds.add(eventId);
  if (seenEventIds.size > SEEN_MAX_SIZE) {
    const iter = seenEventIds.values();
    for (let i = 0; i < 100; i++) {
      const v = iter.next().value;
      if (v === undefined) break;
      seenEventIds.delete(v);
    }
  }
}

// ============================================================================
// SECTION 7 — CHANNEL STUBS (Sprint 3 gercek entegrasyon)
// ============================================================================

async function sendViaChannel(channel, recipient, event) {
  // Sprint 3:
  // if (channel === 'sms') return await netgsm.send(recipient, formatSms(event));
  // if (channel === 'email') return await mailer.send(recipient, formatEmail(event));
  // if (channel === 'slack') return await fetch(webhook, { body: formatSlack(event) });

  console.log(
    `[NOTIFICATIONS][STUB] channel=${channel} recipient=${recipient} event=${event.type} severity=${event.severity}`
  );

  return {
    ok: true,
    stub: true,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// SECTION 8 — DISPATCH
// ============================================================================

function meetsSeverity(eventSeverity, minSeverity) {
  const eRank = SEVERITY_RANK[eventSeverity] || 1;
  const mRank = SEVERITY_RANK[minSeverity] || 1;
  return eRank >= mRank;
}

function recordDelivery(record) {
  deliveryHistory.push(record);
  if (deliveryHistory.length > HISTORY_SIZE) {
    deliveryHistory.shift();
  }
}

function generateDeliveryId() {
  return `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Event'i kural tablosu uzerinden kanallara dagit.
 * @param {object} event - { type, severity, payload?, id?, actorId? }
 * @returns {Promise<Array<Delivery>>}
 */
async function dispatch(event) {
  if (!event?.type) {
    throw new Error("dispatch: event.type zorunlu");
  }

  const eventId = event.id || `${event.type}:${event.timestamp?.getTime?.() || Date.now()}`;
  if (seenEventIds.has(eventId)) {
    return [];
  }
  markSeen(eventId);

  const rules = ruleRegistry.get(event.type) || [];
  const deliveries = [];

  for (const rule of rules) {
    if (!meetsSeverity(event.severity, rule.minSeverity)) {
      totalSkipped++;
      continue;
    }

    for (const channel of rule.channels) {
      const recipient = resolveRecipient(rule, event, channel);

      if (isInCooldown(recipient, event.type)) {
        totalSkipped++;
        continue;
      }

      const delivery = {
        id: generateDeliveryId(),
        eventType: event.type,
        channel,
        recipient,
        severity: event.severity || "info",
        status: DELIVERY_STATUS.PENDING,
        deliveredAt: null,
        error: null,
        payload: event.payload || null,
      };

      try {
        const result = await sendViaChannel(channel, recipient, event);
        delivery.status = result.ok ? DELIVERY_STATUS.DELIVERED : DELIVERY_STATUS.FAILED;
        delivery.deliveredAt = new Date().toISOString();
        if (!result.ok) delivery.error = result.error || "unknown";
        markCooldown(recipient, event.type);
      } catch (err) {
        delivery.status = DELIVERY_STATUS.FAILED;
        delivery.deliveredAt = new Date().toISOString();
        delivery.error = err.message;
      }

      recordDelivery(delivery);
      deliveries.push(delivery);
      totalDispatched++;

      if (delivery.status === DELIVERY_STATUS.DELIVERED) {
        totalDelivered++;
      } else {
        totalFailed++;
      }
    }
  }

  if (deliveries.length > 0) {
    const eventName =
      deliveries.every((d) => d.status === DELIVERY_STATUS.DELIVERED)
        ? EVENT_DISPATCHED
        : EVENT_FAILED;
    await bus.emitOS(eventName, {
      severity: eventName === EVENT_FAILED ? "warning" : "info",
      module: MODULE_NAME,
      payload: {
        originalEventType: event.type,
        deliveryCount: deliveries.length,
        delivered: deliveries.filter((d) => d.status === DELIVERY_STATUS.DELIVERED).length,
        failed: deliveries.filter((d) => d.status === DELIVERY_STATUS.FAILED).length,
        channels: [...new Set(deliveries.map((d) => d.channel))],
      },
    });
  }

  return deliveries;
}

// ============================================================================
// SECTION 9 — LIFECYCLE (auto-listen mode)
// ============================================================================

function start() {
  if (isRunning) {
    console.warn("[NOTIFICATIONS] zaten calisiyor, start cagrisi gormezden gelindi");
    return;
  }

  if (ruleRegistry.size === 0) {
    loadDefaultRules();
  }

  for (const eventType of ruleRegistry.keys()) {
    const unsubscribe = bus.onOS(eventType, async (event) => {
      try {
        await dispatch(event);
      } catch (err) {
        console.error(`[NOTIFICATIONS] dispatch error for ${eventType}:`, err.message);
      }
    });
    unsubscribers.push(unsubscribe);
  }

  isRunning = true;
  console.log(
    `[NOTIFICATIONS] started: ${ruleRegistry.size} rule(s), ${unsubscribers.length} listener(s), cooldown ${COOLDOWN_MS / 60000}dk`
  );
}

function stop() {
  if (!isRunning) return;
  for (const u of unsubscribers) {
    if (typeof u === "function") u();
  }
  unsubscribers = [];
  isRunning = false;
  console.log("[NOTIFICATIONS] stopped");
}

// ============================================================================
// SECTION 10 — READ API
// ============================================================================

function getStatus() {
  return {
    isRunning,
    totalDispatched,
    totalDelivered,
    totalFailed,
    totalSkipped,
    ruleCount: listRules().length,
    historySize: deliveryHistory.length,
    seenEventIds: seenEventIds.size,
    cooldownCount: cooldowns.size,
    adminEmail: DEFAULT_ADMIN_EMAIL,
  };
}

function getDeliveryHistory() {
  return [...deliveryHistory];
}

function resetState() {
  clearRules();
  deliveryHistory.length = 0;
  cooldowns.clear();
  seenEventIds.clear();
  totalDispatched = 0;
  totalDelivered = 0;
  totalFailed = 0;
  totalSkipped = 0;
}

// ============================================================================
// SECTION 11 — EXPORTS
// ============================================================================

module.exports = {
  start,
  stop,
  dispatch,
  registerRule,
  clearRules,
  loadDefaultRules,
  listRules,
  getStatus,
  getDeliveryHistory,
  resetState,
  MODULE_NAME,
  HISTORY_SIZE,
  COOLDOWN_MS,
  CHANNELS,
  DELIVERY_STATUS,
  SEVERITY_RANK,
  EVENT_DISPATCHED,
  EVENT_FAILED,
  DEFAULT_RULES,
};
