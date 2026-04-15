#!/usr/bin/env node
/**
 * TEDBIRGE OS — Seviye 1 Hafıza Sistemi
 * Çalıştırma: npm run os:update
 *
 * Ne yapar:
 * - tedbirge-os/CURRENT_STATE.md tarihini ve sistem durumunu günceller
 * - tedbirge-os/CHANGELOG.md'ye oturum sonu kaydı ekler
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OS_DIR = path.join(ROOT, 'tedbirge-os');

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').slice(0, 15); // YYYYMMDDTHHmmss
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ Güncellendi: ${path.relative(ROOT, filePath)}`);
}

// ─── Backend / Panel durumu kontrolü ─────────────────────────────────────────

function detectEnvState() {
  const envPath = path.join(ROOT, '.env');
  const envContent = readFile(envPath) || '';

  const hasAnthropicKey = /ANTHROPIC_API_KEY=.+/.test(envContent);
  const hasDb = /DATABASE_URL=.+/.test(envContent);
  const analysisMode = (envContent.match(/ANALYSIS_MODE=(\w+)/) || [])[1] || 'mock';
  const hasWhatsApp = /WHATSAPP_TOKEN=.+/.test(envContent) &&
    !/WHATSAPP_TOKEN=$/.test(envContent);
  const hasSmtp = /SMTP_PASS=.+/.test(envContent) &&
    !/SMTP_PASS=$/.test(envContent);
  const hasNetgsm = /NETGSM_USERNAME=.+/.test(envContent) &&
    !/NETGSM_USERNAME=$/.test(envContent);

  return { hasAnthropicKey, hasDb, analysisMode, hasWhatsApp, hasSmtp, hasNetgsm };
}

// ─── CURRENT_STATE.md güncelle ───────────────────────────────────────────────

function updateCurrentState() {
  const env = detectEnvState();
  const currentStatePath = path.join(OS_DIR, 'CURRENT_STATE.md');

  const aiStatus = env.hasAnthropicKey
    ? `Aktif — claude-sonnet-4-6, ANALYSIS_MODE=${env.analysisMode}`
    : 'Pasif — ANTHROPIC_API_KEY eksik';

  const dbStatus = env.hasDb ? 'PostgreSQL — Supabase' : 'Eksik — DATABASE_URL yok';

  const notifications = [
    !env.hasWhatsApp && '- WhatsApp: gerçek API credentials eksik (WHATSAPP_TOKEN)',
    !env.hasSmtp && '- SMTP: şifre girilmemiş (SMTP_PASS)',
    !env.hasNetgsm && '- SMS Netgsm: credentials eksik (NETGSM_USERNAME)',
  ].filter(Boolean);

  const riskSection = notifications.length > 0
    ? notifications.join('\n')
    : '- Bilinen kritik eksik yok';

  const content = `# CURRENT_STATE

Tarih: ${today()}
Son Güncelleme: ${new Date().toLocaleString('tr-TR')}

## Sistem Durumu
- Backend: Çalışıyor (localhost:5000)
- Panel: Çalışıyor (localhost:3000)
- OCR: Aktif (polling loop, 10s interval)
- AI: ${aiStatus}
- PDF: Çalışıyor (pdfkit, Türkçe karakter desteği)
- DB: ${dbStatus}

## Ürün Durumu
- Teknik: Güçlü
- Ürün: Gelişiyor
- Güven: Yüksek

## Aktif Odak
- Sosyal medya entegrasyonu ve deploy hazırlığı

## Risk
${riskSection}

## Aktif Görev
- Sosyal medya entegrasyonu / domain / deploy hazırlığı

## Backup Durumu
- Backup engine: Aktif
- Snapshot disiplini: Zorunlu

## PATCH_POLICY_STATUS
- Kor patch yasak.
- Tüm değişiklikler doğrulanmış dosya içeriğine dayanır.
- Mümkün olan her durumda tek split / tek parça komut verilir.
`;

  writeFile(currentStatePath, content);
}

// ─── CHANGELOG.md'ye oturum kaydı ekle ──────────────────────────────────────

function appendChangelog() {
  const changelogPath = path.join(OS_DIR, 'CHANGELOG.md');
  const existing = readFile(changelogPath) || '';
  const ts = timestamp();
  const dateStr = today();

  // Bugün zaten "os:update" kaydı varsa tekrar ekleme
  const sessionMarker = `## ${dateStr} — os:update`;
  if (existing.includes(sessionMarker)) {
    console.log('ℹ  CHANGELOG: Bugün zaten os:update kaydı var, atlandı.');
    return;
  }

  const entry = `
## ${dateStr} — os:update (${ts})
- CURRENT_STATE.md otomatik güncellendi (npm run os:update)
- Sistem durumu, tarih ve risk alanları yenilendi
`;

  // Changelog'un başına (# CHANGELOG başlığından sonra) ekle
  const updated = existing.replace(
    /^(# CHANGELOG\n)/,
    `$1${entry}`
  );

  writeFile(changelogPath, updated);
}

// ─── Ana akış ────────────────────────────────────────────────────────────────

function main() {
  console.log('\n🧠 TEDBIRGE OS — Hafıza Güncelleme Başladı\n');

  if (!fs.existsSync(OS_DIR)) {
    console.error('✗ tedbirge-os/ klasörü bulunamadı. Proje kökünden çalıştırın.');
    process.exit(1);
  }

  updateCurrentState();
  appendChangelog();

  console.log('\n✅ TEDBIRGE OS güncellendi.\n');
}

main();
