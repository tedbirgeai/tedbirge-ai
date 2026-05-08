// TUR #100.7 P3 — Module Registry (TEK KAYNAK) — Madde 30.55 R2
// Yeni modül buraya eklendiğinde RolePermission tablosuna otomatik kayıt edilir.

"use strict";

// 17 OS modülü (TUR #95 mimarHatasi dahil)
const OS_MODULES = [
  "ai", "analyzer", "appearance", "backup", "compliance", "costGuard",
  "deploy", "insurance", "maintenance", "navigation", "notifications",
  "performance", "pulse", "recovery", "security", "uyapControl", "mimarHatasi",
];

// İş katmanı modülleri (RBAC matrisinde görünen iş alanları)
const BUSINESS_MODULES = [
  "leads", "users", "documents", "messages", "clients", "bilirkisi",
  "assignments", "commission", "accidentCase",
];

const ALL_MODULES = [...OS_MODULES, ...BUSINESS_MODULES];

function getModuleRegistry() {
  return [...ALL_MODULES];
}

function getOSModules() {
  return [...OS_MODULES];
}

function getBusinessModules() {
  return [...BUSINESS_MODULES];
}

// Runtime'da yeni modül kaydı (rare — programmatik)
async function registerNewModule(moduleName, type = "business") {
  if (!moduleName || ALL_MODULES.includes(moduleName)) return false;

  if (type === "os") {
    OS_MODULES.push(moduleName);
  } else {
    BUSINESS_MODULES.push(moduleName);
  }
  ALL_MODULES.push(moduleName);

  // RolePermission tablosuna 4 rol × 4 action = 16 satır otomatik kayıt
  try {
    const { autoRegisterModule } = require("../../scripts/seed-role-permissions");
    await autoRegisterModule(moduleName);
    return true;
  } catch (err) {
    console.warn(`[registry] ${moduleName} auto-register başarısız:`, err.message);
    return false;
  }
}

module.exports = {
  OS_MODULES,
  BUSINESS_MODULES,
  ALL_MODULES,
  getModuleRegistry,
  getOSModules,
  getBusinessModules,
  registerNewModule,
};
