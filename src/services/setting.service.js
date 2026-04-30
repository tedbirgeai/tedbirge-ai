// TUR #52 — SystemSetting Servisi (ADMIN UI)

const prisma = require("../config/db");

const DEFAULTS = {
  "ai.muhatap.confidence_threshold": { value: "0.70", category: "ai", description: "MuhatapAI guven skoru esigi (0.5-0.95)" },
  "notification.email.from": { value: "noreply@tedbirge.ai", category: "notification", description: "E-posta gonderici adresi" },
  "notification.sms.signature": { value: "Tedbirge AI", category: "notification", description: "SMS sonu imza" },
  "analytics.ga4_id": { value: "", category: "analytics", description: "Google Analytics 4 olcum ID (env'de tanimli, UI read-only)" },
  "analytics.cookie_consent_version": { value: "v1.0", category: "analytics", description: "Cerez rizasi politika versiyonu" },
};

async function listSettings({ category } = {}) {
  const where = category ? { category } : {};
  return prisma.systemSetting.findMany({
    where,
    orderBy: [{ category: "asc" }, { key: "asc" }],
    include: { updater: { select: { id: true, fullName: true } } },
  });
}

async function getSetting(key) {
  const found = await prisma.systemSetting.findUnique({ where: { key } });
  if (found) return found;
  const def = DEFAULTS[key];
  if (def) return { id: null, key, value: def.value, category: def.category, description: def.description };
  return null;
}

async function upsertSetting(key, { value, category, description, updatedBy }) {
  const def = DEFAULTS[key] || {};
  return prisma.systemSetting.upsert({
    where: { key },
    update: {
      value: String(value).slice(0, 4000),
      category: category || def.category || "general",
      description: description || def.description,
      updatedBy: updatedBy || null,
    },
    create: {
      key,
      value: String(value).slice(0, 4000),
      category: category || def.category || "general",
      description: description || def.description,
      updatedBy: updatedBy || null,
    },
  });
}

async function ensureDefaults() {
  const operations = Object.entries(DEFAULTS).map(([key, def]) =>
    prisma.systemSetting.upsert({
      where: { key },
      update: {},
      create: { key, value: def.value, category: def.category, description: def.description },
    })
  );
  return Promise.all(operations);
}

module.exports = {
  DEFAULTS,
  listSettings,
  getSetting,
  upsertSetting,
  ensureDefaults,
};
