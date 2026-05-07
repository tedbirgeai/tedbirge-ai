// TUR #91 P4 — Memory cache (Map tabanli, 0 npm)
// Madde 30.41 R1 Performans FAZ 2 — public read-only endpoint'lerde p95 latency dusur.
// Auth route'larda KULLANIM YASAK (Madde 30.41 + KVKK m.12) — sadece anonim/public endpoint.

class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlSeconds) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  delete(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  size() {
    return this.store.size;
  }
}

module.exports = new MemoryCache();
