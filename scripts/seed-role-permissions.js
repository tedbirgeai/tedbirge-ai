// TUR #99 Q2 — RolePermission default izinleri seed (Madde 30.55)
// ADMIN failsafe — middleware'de hardcoded, seed YOK gerek
// Diğer roller için mevcut sistemin DAVRANIŞINI KORU (yumuşak rollout)

"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DEFAULTS = [
  // LAWYER mevcut yetkileri
  { role: "LAWYER", module: "leads", action: "read", granted: true },
  { role: "LAWYER", module: "leads", action: "write", granted: true },
  { role: "LAWYER", module: "documents", action: "read", granted: true },
  { role: "LAWYER", module: "documents", action: "write", granted: true },
  { role: "LAWYER", module: "messages", action: "read", granted: true },
  { role: "LAWYER", module: "messages", action: "write", granted: true },
  { role: "LAWYER", module: "clients", action: "read", granted: true },
  { role: "LAWYER", module: "bilirkisi", action: "read", granted: true },
  { role: "LAWYER", module: "bilirkisi", action: "write", granted: true },
  { role: "LAWYER", module: "assignments", action: "read", granted: true },
  { role: "LAWYER", module: "commission", action: "read", granted: true },

  // REPRESENTATIVE mevcut yetkileri
  { role: "REPRESENTATIVE", module: "leads", action: "read", granted: true },
  { role: "REPRESENTATIVE", module: "leads", action: "write", granted: true },
  { role: "REPRESENTATIVE", module: "commission", action: "read", granted: true },

  // CUSTOMER mevcut yetkileri (B2C minimal)
  { role: "CUSTOMER", module: "documents", action: "read", granted: true },
  { role: "CUSTOMER", module: "messages", action: "read", granted: true },
  { role: "CUSTOMER", module: "messages", action: "write", granted: true },
  { role: "CUSTOMER", module: "leads", action: "read", granted: true },

  // SALES mevcut yetkileri
  { role: "SALES", module: "leads", action: "read", granted: true },
  { role: "SALES", module: "leads", action: "write", granted: true },
  { role: "SALES", module: "documents", action: "read", granted: true },
  { role: "SALES", module: "users", action: "read", granted: true },
];

async function main() {
  let upserted = 0;
  for (const def of DEFAULTS) {
    await prisma.rolePermission.upsert({
      where: {
        role_module_action: {
          role: def.role,
          module: def.module,
          action: def.action,
        },
      },
      update: {}, // mevcut granted KORUNUR (admin manuel kapatmış olabilir)
      create: def,
    });
    upserted++;
  }
  console.log(`[seed-role-permissions] OK · ${upserted}/${DEFAULTS.length} default permission upserted`);
}

main()
  .catch((err) => {
    console.error("[seed-role-permissions] HATA:", err.message);
    process.exit(0); // postinstall fail etmesin
  })
  .finally(() => prisma.$disconnect());
