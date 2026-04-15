/**
 * Simple in-memory sliding-window rate limiter.
 * No external dependencies required.
 *
 * Usage:
 *   const { uploadRateLimit } = require("./rateLimiter");
 *   router.post("/:leadId", auth, uploadRateLimit, upload.single("file"), controller.uploadLeadDocument);
 */

/**
 * createRateLimiter(options) → Express middleware
 *
 * @param {object} opts
 * @param {number} opts.windowMs   - Window length in ms (default: 60_000 = 1 minute)
 * @param {number} opts.max        - Max requests per window per IP (default: 10)
 * @param {string} opts.message    - Error message (default: Turkish)
 */
function createRateLimiter({ windowMs = 60_000, max = 10, message } = {}) {
  // Map<ip, [timestamp, ...]>
  const hits = new Map();

  // Purge stale entries every windowMs to prevent memory leak
  const purgeInterval = setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [ip, times] of hits.entries()) {
      const fresh = times.filter((t) => t > cutoff);
      if (fresh.length === 0) hits.delete(ip);
      else hits.set(ip, fresh);
    }
  }, windowMs);

  // Don't block process exit
  if (purgeInterval.unref) purgeInterval.unref();

  const errorMessage =
    message ||
    "Çok fazla istek gönderdiniz. Lütfen bir dakika bekleyin.";

  return function rateLimitMiddleware(req, res, next) {
    const ip =
      req.ip ||
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.connection?.remoteAddress ||
      "unknown";

    const now = Date.now();
    const cutoff = now - windowMs;

    const times = (hits.get(ip) || []).filter((t) => t > cutoff);
    times.push(now);
    hits.set(ip, times);

    // Set standard rate-limit response headers
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - times.length));
    res.setHeader(
      "X-RateLimit-Reset",
      Math.ceil((times[0] + windowMs) / 1000)
    );

    if (times.length > max) {
      return res.status(429).json({
        success: false,
        message: errorMessage,
        retryAfterMs: times[0] + windowMs - now,
      });
    }

    next();
  };
}

/** Upload endpoint: 10 requests / minute / IP */
const uploadRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 10,
  message: "Dosya yükleme limiti aşıldı. Lütfen bir dakika bekleyin.",
});

/** General API: 120 requests / minute / IP */
const apiRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 120,
});

module.exports = { createRateLimiter, uploadRateLimit, apiRateLimit };
