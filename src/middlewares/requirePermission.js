// TUR #99 Q3 — RBAC Yetki Yönetim Disiplini (Madde 30.55)
// Mevcut role() guard'a EK olarak çalışır — paralel, AND ilişkisi
// ADMIN failsafe — RolePermission satırı olmadan da geçer

"use strict";

const prisma = require("../config/db");

// In-memory cache (5 dk) — performans
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getPermission(role, module, action) {
  const key = `${role}:${module}:${action}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.t < CACHE_TTL_MS) return cached.granted;

  let granted = false;
  try {
    const row = await prisma.rolePermission.findUnique({
      where: { role_module_action: { role, module, action } },
    });
    granted = row?.granted ?? false;
  } catch (err) {
    // RolePermission tablo henuz yoksa (lokal drift) varsayilan false (yumusak rollout — role() guard zaten korur)
    granted = false;
  }
  cache.set(key, { granted, t: Date.now() });
  return granted;
}

function requirePermission(module, action) {
  return async function permCheck(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Auth gerek" });
      }
      // ADMIN her zaman gecer (failsafe — sistem kilitlenmesin)
      if (req.user.role === "ADMIN") return next();
      const ok = await getPermission(req.user.role, module, action);
      if (!ok) {
        return res.status(403).json({
          success: false,
          message: `Bu islem icin yetkiniz yok (${module}.${action}). Yoneticinizden talep edin.`,
          code: "PERMISSION_DENIED",
          module,
          action,
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

function invalidateCache() {
  cache.clear();
}

module.exports = { requirePermission, invalidateCache, getPermission };
