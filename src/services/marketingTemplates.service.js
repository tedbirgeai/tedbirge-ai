"use strict";

// TUR #101 — Madde 24.14 + Madde 25.3 R1
// Hazir sablon kutuphanesi (sifir maliyet) + opsiyonel BYOK AI feature flag

const fs = require("fs");
const path = require("path");

const TEMPLATES_FILE = path.join(__dirname, "../data/marketingTemplates.json");

let cached = null;
let lastReadTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

function loadTemplates() {
  const now = Date.now();
  if (cached && now - lastReadTime < CACHE_TTL) return cached;

  try {
    const content = fs.readFileSync(TEMPLATES_FILE, "utf8");
    cached = JSON.parse(content);
    lastReadTime = now;
    return cached;
  } catch (err) {
    console.warn("[marketingTemplates] load fail:", err.message);
    return { templates: [] };
  }
}

function getTemplatesByChannel(channel) {
  const all = loadTemplates();
  return all.templates.filter((t) => t.channel === channel);
}

function getRandomTemplate(channel, excludeIds = []) {
  const filtered = getTemplatesByChannel(channel).filter(
    (t) => !excludeIds.includes(t.id)
  );
  if (filtered.length === 0) {
    const all = getTemplatesByChannel(channel);
    if (all.length === 0) return null;
    return all[Math.floor(Math.random() * all.length)];
  }
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function getChannels() {
  const all = loadTemplates();
  const channels = new Set(all.templates.map((t) => t.channel));
  return Array.from(channels);
}

function getCategories(channel) {
  const filtered = getTemplatesByChannel(channel);
  const cats = new Set(filtered.map((t) => t.category));
  return Array.from(cats);
}

function fillTemplate(template, vars = {}) {
  let text = template.text;
  let subject = template.subject;
  Object.entries(vars).forEach(([key, value]) => {
    const re = new RegExp(`\\{${key}\\}`, "g");
    text = text.replace(re, value || "");
    if (subject) subject = subject.replace(re, value || "");
  });
  return { ...template, text, subject };
}

function invalidateCache() {
  cached = null;
  lastReadTime = 0;
}

module.exports = {
  loadTemplates,
  getTemplatesByChannel,
  getRandomTemplate,
  getChannels,
  getCategories,
  fillTemplate,
  invalidateCache,
};
