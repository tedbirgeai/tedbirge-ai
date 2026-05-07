// TUR #99 Q5 — RBAC RolePermissions controller (Madde 30.55)

"use strict";

const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { invalidateCache } = require("../middlewares/requirePermission");

// GET /api/admin/role-permissions — ADMIN tüm matrix
exports.listMatrix = asyncHandler(async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Sadece ADMIN" });
  }
  const all = await prisma.rolePermission.findMany();
  res.json({ success: true, data: all });
});

// PATCH /api/admin/role-permissions — ADMIN toggle
exports.updateOne = asyncHandler(async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Sadece ADMIN" });
  }
  const { role, module, action, granted } = req.body;
  if (!role || !module || !action || typeof granted !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "role + module + action + granted (boolean) zorunlu",
    });
  }
  const updated = await prisma.rolePermission.upsert({
    where: { role_module_action: { role, module, action } },
    update: { granted, updatedById: req.user.id },
    create: { role, module, action, granted, updatedById: req.user.id },
  });
  invalidateCache();
  // ActivityLog (KVKK m.10 izlenebilirlik)
  try {
    await prisma.activityLog.create({
      data: {
        action: "RBAC_PERMISSION_UPDATED",
        detail: `userId:${req.user.id} ${role}.${module}.${action} = ${granted}`,
      },
    });
  } catch (_) {
    // ActivityLog yazımı kritik değil, ana akış bozulmasın
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
