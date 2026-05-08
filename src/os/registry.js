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

// 12 web sayfa modülü — TUR #100.8 yeni (Madde 30.55 R2 PATCH)
const PAGE_MODULES = [
  "calendar",        // /dashboard/takvim
  "analytics",       // /dashboard/analytics
  "marketing",       // /dashboard/pazarlama
  "auditLog",        // /dashboard/audit-log
  "kvkkRequests",    // /dashboard/kvkk-talepler (ADMIN tarafı)
  "kvkkRights",      // /musteri/kvkk-haklarim (CUSTOMER tarafı)
  "settings",        // /dashboard/ayarlar
  "lawyerApproval",  // /dashboard/hukukcu-onay
  "repApproval",     // /dashboard/temsilci-onay
  "commissionLog",   // /dashboard/komisyon-log
  "pipeline",        // /temsilci/pipeline
  "hakedis",         // /temsilci/hakedis
];

// 5 kurumsal modül — TUR #100.9 yeni (Madde 34 — Kurumsal Üretim Stüdyosu)
const CORPORATE_MODULES = [
  "kartvizit",       // Kişisel iletişim kartı (LAWYER + REPRESENTATIVE + SALES)
  "brosur",          // Tedbirge.ai tanıtım broşürü (SALES + REPRESENTATIVE + ADMIN)
  "reklamGorseli",   // Sosyal medya reklam görseli (SALES + REPRESENTATIVE + ADMIN)
  "emailImzasi",     // HTML email imzası (her rol kendi)
  "paylasim",        // Web Share aksiyonu (paylaşım butonu erişimi)
];

const ALL_MODULES = [...OS_MODULES, ...BUSINESS_MODULES, ...PAGE_MODULES, ...CORPORATE_MODULES];

function getModuleRegistry() {
  return [...ALL_MODULES];
}

function getOSModules() {
  return [...OS_MODULES];
}

function getBusinessModules() {
  return [...BUSINESS_MODULES];
}

function getPageModules() {
  return [...PAGE_MODULES];
}

function getCorporateModules() {
  return [...CORPORATE_MODULES];
}

// Modül kategorisi (UI gruplandırma — opsiyonel)
function getModuleCategory(moduleName) {
  if (OS_MODULES.includes(moduleName)) return "os";
  if (BUSINESS_MODULES.includes(moduleName)) return "business";
  if (PAGE_MODULES.includes(moduleName)) return "page";
  if (CORPORATE_MODULES.includes(moduleName)) return "corporate";
  return "unknown";
}

// Runtime'da yeni modül kaydı (rare — programmatik)
async function registerNewModule(moduleName, type = "business") {
  if (!moduleName || ALL_MODULES.includes(moduleName)) return false;

  if (type === "os") {
    OS_MODULES.push(moduleName);
  } else if (type === "page") {
    PAGE_MODULES.push(moduleName);
  } else if (type === "corporate") {
    CORPORATE_MODULES.push(moduleName);
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
  PAGE_MODULES,
  CORPORATE_MODULES,
  ALL_MODULES,
  getModuleRegistry,
  getOSModules,
  getBusinessModules,
  getPageModules,
  getCorporateModules,
  getModuleCategory,
  registerNewModule,
};
