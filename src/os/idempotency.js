/**
 * Tedbirge OS — Idempotency
 *
 * Çift tıklama / retry güvenliği. Her kritik OS endpoint'i bu middleware'i kullanır.
 *
 * Akış:
 * 1. Client UUID üretir (crypto.randomUUID), Idempotency-Key header'ında gönderir
 * 2. Backend key ile IdempotencyKey tablosunu kontrol eder
 * 3a. Cache hit → cached response'u döndür (endpoint hiç çalışmaz)
 * 3b. Cache miss → endpoint çalıştırır, response'u cache'ler, döndürür
 * 4. TTL (default 1 saat) sonra cache expire — reconciler temizler
 *
 * Referans: TEDBIRGE_OS_FIZIBILITE_v2 — Prensip 12 (Idempotency)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 saat
const HEADER_NAME = 'idempotency-key';
const MAX_KEY_LENGTH = 128;

// ─── Core Functions ─────────────────────────────────────────────────────────

/**
 * Cache'den idempotent response al.
 * @param {string} key - Client-generated UUID
 * @returns {Promise<{response: any, createdAt: Date} | null>}
 */
async function getIdempotent(key) {
  if (!key || typeof key !== 'string') return null;

  try {
    const record = await prisma.idempotencyKey.findUnique({
      where: { key },
    });

    if (!record) return null;

    // Expire kontrol
    if (record.expiresAt < new Date()) {
      // Expire olmuş, temizle
      await prisma.idempotencyKey.delete({ where: { key } }).catch(() => {});
      return null;
    }

    return {
      response: record.response,
      createdAt: record.createdAt,
    };
  } catch (err) {
    console.error('[OS/idempotency] getIdempotent error:', err.message);
    return null; // Cache erişilemezse endpoint çalışsın, fail-open
  }
}

/**
 * Idempotent response'u cache'le.
 * @param {string} key
 * @param {any} response - JSON-serializable
 * @param {number} [ttlMs] - default 1 saat
 */
async function saveIdempotent(key, response, ttlMs = DEFAULT_TTL_MS) {
  if (!key || typeof key !== 'string') return;

  const expiresAt = new Date(Date.now() + ttlMs);

  try {
    await prisma.idempotencyKey.upsert({
      where: { key },
      create: {
        key,
        response,
        expiresAt,
      },
      update: {
        response,
        expiresAt,
      },
    });
  } catch (err) {
    console.error('[OS/idempotency] saveIdempotent error:', err.message);
    // Cache yazılamazsa sessizce devam, endpoint çalışır zaten
  }
}

/**
 * Expired kayıtları temizle. Reconciler her saat çağırır.
 * @returns {Promise<number>} silinen satır sayısı
 */
async function cleanupExpired() {
  try {
    const result = await prisma.idempotencyKey.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  } catch (err) {
    console.error('[OS/idempotency] cleanupExpired error:', err.message);
    return 0;
  }
}

// ─── Express Middleware ─────────────────────────────────────────────────────

/**
 * Idempotency middleware factory.
 *
 * Kullanım:
 *   router.post('/backup/start', requireIdempotencyKey(), async (req, res) => { ... });
 *
 * Options:
 *   ttlMs: cache süresi (default 1 saat)
 *   required: true ise header yoksa 400 döner, false ise middleware'i pas geçer
 */
function requireIdempotencyKey(options = {}) {
  const { ttlMs = DEFAULT_TTL_MS, required = true } = options;

  return async function idempotencyMiddleware(req, res, next) {
    const key = req.headers[HEADER_NAME];

    // Header yoksa
    if (!key) {
      if (required) {
        return res.status(400).json({
          error: 'Idempotency-Key header required',
          hint: 'Generate UUID on client, pass as Idempotency-Key header',
        });
      }
      return next();
    }

    // Key format kontrol
    if (typeof key !== 'string' || key.length > MAX_KEY_LENGTH) {
      return res.status(400).json({
        error: 'Invalid Idempotency-Key',
        hint: `Must be string, max ${MAX_KEY_LENGTH} chars`,
      });
    }

    // Cache kontrol
    const cached = await getIdempotent(key);
    if (cached) {
      // Cache hit — endpoint'i çalıştırmadan response'u dön
      res.setHeader('X-Idempotent-Replay', 'true');
      res.setHeader('X-Idempotent-Original-Date', cached.createdAt.toISOString());
      return res.json(cached.response);
    }

    // Cache miss — endpoint çalışsın, response'u yakalayıp cache'leyelim
    const originalJson = res.json.bind(res);
    res.json = function interceptedJson(body) {
      // Async cache yazımı — response'u geciktirmesin
      saveIdempotent(key, body, ttlMs).catch(err => {
        console.error('[OS/idempotency] Post-response cache error:', err.message);
      });
      return originalJson(body);
    };

    next();
  };
}

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = {
  getIdempotent,
  saveIdempotent,
  cleanupExpired,
  requireIdempotencyKey,
  DEFAULT_TTL_MS,
  HEADER_NAME,
};
