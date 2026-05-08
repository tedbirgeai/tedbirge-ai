// TUR #100.7 P2 — RolePermission auto-register + seed (Madde 30.55 R2)
// TUR #99 Q2 mevcut + auto-register pattern eklendi.
// ADMIN failsafe — middleware'de hardcoded, seed YOK gerek.

"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Rol başına default izinler (mevcut sistem davranışını korur — Madde 14.3)
// Her [role] içinde { module: [actions] } formatı
const ROLE_DEFAULTS = {
  LAWYER: {
    leads: ["read", "write"],
    documents: ["read", "write"],
    messages: ["read", "write"],
    clients: ["read"],
    bilirkisi: ["read", "write"],
    assignments: ["read"],
    commission: ["read"],
    accidentCase: ["read", "execute"], // analiz tetikleme yetkisi
  },
  REPRESENTATIVE: {
    leads: ["read", "write"],
    clients: ["read"],
    commission: ["read"],
    assignments: ["read"],
  },
  CUSTOMER: {
    documents: ["read"],
    messages: ["read", "write"],
    leads: ["read"],
    accidentCase: ["read"], // sadece kendi vakası — controller içinde Lead.ownerId kontrolü
  },
  SALES: {
    leads: ["read", "write"],
    documents: ["read"],
    users: ["read"],
    clients: ["read"],
  },
};

// Madde 30.21 + 30.29 — 5 rol envanteri (LEGAL_REP enum'da YOK, A maddesi)
const RBAC_ROLES = ["LAWYER", "REPRESENTATIVE", "CUSTOMER", "SALES"];
const RBAC_ACTIONS = ["read", "write", "delete", "execute"];

/**
 * Tek modül için 4 rol × 4 action = 16 satır upsert.
 * ROLE_DEFAULTS[role][module] içinde varsa granted=true, yoksa false.
 * Mevcut izinler DOKUNULMAZ (update: {}).
 */
async function autoRegisterModule(moduleName) {
  let registered = 0;
  for (const role of RBAC_ROLES) {
    for (const action of RBAC_ACTIONS) {
      const defaultGranted =
        ROLE_DEFAULTS[role]?.[moduleName]?.includes(action) ?? false;

      await prisma.rolePermission.upsert({
        where: {
          role_module_action: { role, module: moduleName, action },
        },
        update: {}, // mevcut granted KORUNUR (admin manuel kapatmış olabilir)
        create: {
          role,
          module: moduleName,
          action,
          granted: defaultGranted,
        },
      });
      registered++;
    }
  }
  return registered;
}

/**
 * Tüm registry modülleri için auto-register.
 * Boot zamanı + manuel seed çağrısında.
 */
async function autoRegisterAllModules() {
  const { getModuleRegistry } = require("../src/os/registry");
  const modules = getModuleRegistry();
  let total = 0;
  for (const moduleName of modules) {
    total += await autoRegisterModule(moduleName);
  }
  return { modules: modules.length, rows: total };
}

async function main() {
  console.log("[seed-role-permissions] Auto-register başlıyor...");
  const result = await autoRegisterAllModules();
  console.log(
    `[seed-role-permissions] OK · ${result.modules} modül × ${RBAC_ROLES.length} rol × ${RBAC_ACTIONS.length} action = ${result.rows} satır upsert`
  );
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error("[seed-role-permissions] HATA:", err.message);
      process.exit(0); // postinstall fail etmesin
    })
    .finally(() => prisma.$disconnect());
}

module.exports = {
  RBAC_ROLES,
  RBAC_ACTIONS,
  ROLE_DEFAULTS,
  autoRegisterModule,
  autoRegisterAllModules,
};
