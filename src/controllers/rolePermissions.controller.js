// TUR #99 Q5 + TUR #100.7 P1 — RBAC RolePermissions controller (Madde 30.55 + 30.55 R2)
// Manifest endpoint + kanonik RBAC_ROLES/RBAC_ACTIONS + module registry entegrasyon

"use strict";

const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { invalidateCache } = require("../middlewares/requirePermission");
const { getModuleRegistry } = require("../os/registry");
const {
  RBAC_ROLES,
  RBAC_ACTIONS,
} = require("../../scripts/seed-role-permissions");

function getRbacModules() {
  return getModuleRegistry();
}

// GET /api/os/role-permissions — ADMIN tüm matrix
exports.listMatrix = asyncHandler(async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Sadece yöneticiler erişebilir" });
  }
  const all = await prisma.rolePermission.findMany();
  res.json({
    success: true,
    data: all,
    meta: {
      roles: RBAC_ROLES,
      modules: getRbacModules(),
      actions: RBAC_ACTIONS,
    },
  });
});

// GET /api/os/role-permissions/manifest — frontend dinamik liste için
exports.getManifest = asyncHandler(async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Sadece yöneticiler erişebilir" });
  }
  res.json({
    success: true,
    data: {
      roles: RBAC_ROLES,
      modules: getRbacModules(),
      actions: RBAC_ACTIONS,
    },
  });
});

// PATCH /api/os/role-permissions — ADMIN toggle
exports.updateOne = asyncHandler(async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Sadece yöneticiler erişebilir" });
  }
  const { role, module, action, granted } = req.body;
  if (!role || !module || !action || typeof granted !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "role + module + action + granted (boolean) zorunlu",
    });
  }
  if (!RBAC_ROLES.includes(role)) {
    return res.status(400).json({ success: false, message: `Geçersiz rol: ${role}` });
  }
  const validModules = getRbacModules();
  if (!validModules.includes(module)) {
    return res.status(400).json({ success: false, message: `Geçersiz modül: ${module}` });
  }
  if (!RBAC_ACTIONS.includes(action)) {
    return res.status(400).json({ success: false, message: `Geçersiz eylem: ${action}` });
  }

  const updated = await prisma.rolePermission.upsert({
    where: { role_module_action: { role, module, action } },
    update: { granted, updatedById: req.user.id },
    create: { role, module, action, granted, updatedById: req.user.id },
  });

  invalidateCache();

  try {
    await prisma.activityLog.create({
      data: {
        action: "RBAC_PERMISSION_UPDATED",
        detail: `userId:${req.user.id} ${role}.${module}.${action} = ${granted}`,
      },
    });
  } catch (_) {
    // ActivityLog kritik değil, ana akış bozulmasın
  }

  res.json({ success: true, data: updated });
});

// GET /api/auth/me/permissions — ROL bazlı kendi izinleri
exports.myPermissions = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Auth gerek" });
  }
  if (req.user.role === "ADMIN") {
    return res.json({ success: true, role: "ADMIN", permissions: "ALL" });
  }
  const perms = await prisma.rolePermission.findMany({
    where: { role: req.user.role, granted: true },
    select: { module: true, action: true, granted: true },
  });
  res.json({ success: true, role: req.user.role, permissions: perms });
});
