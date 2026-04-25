# TEDBİRGE OS v3 — 25 Nisan 2026 OTURUM HANDOFF

**Proje:** Tedbirge.ai — Türk trafik/iş kazası avukatı CRM platformu
**Sahip:** Mehmet DİNÇ (non-technical founder, Konya)
**Branch:** `feature/tedbirge-os-v3`
**Son commit:** `e1e71f6` feat(os-v3): supervisor.js — systemd tarzı process watcher
**Mimar:** Claude Opus 4.7 (chat tarafı) — Claude Code Sonnet 4.6 (terminal tarafı)
**Dil:** Tüm iletişim Türkçe

---

## 0. KURUCU HAKKINDA (Claude Code için)

Mehmet Bey:
- Non-technical founder. Kod yazmıyor, komut onaylıyor.
- Sen (Claude Code) mühendissin, chat'teki mimar (Claude Opus) tasarımcı.
- Ortak dilimiz Türkçe. "Ortak" diye hitap et.
- **Her komutu onay iste.** Özellikle yazma/silme/push için.
- **Kalıcı izin (2 numaralı seçenek) İSTEME.** Her PowerShell, her git işlemi için tek tek onay güvenlik zırhımız.

---

## 1. ŞU ANKİ DURUM

### 1.1 Canlı DB (Supabase)
- 32 tablo aktif (19 eski + 2 db-pull eklemesi AccidentCase/Evidence + 13 yeni OS v3)
- 10 enum (MuhatapTipi yeni, 13 değer)
- 6 yeni foreign key User/Lead üzerinden
- **Migration history drift VAR** — `_prisma_migrations` tablosu eski işleri tam yansıtmıyor. Bu tech debt, şimdilik `db push` ile yönetiliyor. OS bitişinde baseline migration ile temizlenecek.

### 1.2 Branch durumu
```
e1e71f6 feat(os-v3): supervisor.js — systemd tarzı process watcher    ← HEAD
370508e feat(os-v3): idempotency.js — çift tıklama güvenliği
d679499 feat(os-v3): eventBus.js — tüm OS'un haberleşme omurgası
d840a83 chore: gitignore'a PANEL_TANI geçici log pattern'i
9fbb843 feat(os-v3): schema iskeleti + 13 OS tablosu + 35 dosya yapısı
723ed0f docs: 27 Nisan oturum kaydi (önceki oturum, main'den fork)
```

### 1.3 OS dosya durumu (33 dosya iskelette)
- **3/33 DOLU:** eventBus.js (5.6KB), idempotency.js (5.3KB), supervisor.js (8.2KB)
- **30/33 BOŞ:** boot.js, reconciler.js, index.js, 9 adapter, 15 modül, 3 observability

### 1.4 Push durumu
- **Local commitler var, uzaktan'a PUSH YAPILMADI**
- Branch feature/tedbirge-os-v3 sadece lokalde
- Push kararı Mehmet Bey'in onayıyla verilecek

---

## 2. YAPILACAK İŞLER (Sıralı)

### 2.1 Sıradaki dosya: src/os/boot.js

**Ne yapar:** 11 adımlı startup sequence. Server açıldığında sırayla:
1. DB Connection
2. Supabase Storage
3. Oracle Worker Ping (optional)
4. Anthropic API
5. pg-boss Queue
6. Cron Scheduler
7. SSE Endpoints
8. UYAP Connectivity (stub ok — critical flag)
9. SBM Health (stub ok — optional)
10. KVKK SCC Validity (DB check)
11. VERBİS Kayıt Kontrol (şimdilik basit date check)

Her adım timeout + retry + optional flag. Sonuç `BootRecord` tablosuna yazılır, başarısız adımlar için `alertAdmin` (şimdilik console.error).

**Boot.js için spec — mimar vermiş, aşağıda TAM HALİYLE var:**

```javascript
/**
 * Tedbirge OS — Boot Sequence
 * 
 * Server açıldığında çalışan 11 adımlı startup sequence.
 * systemd boot order'ından ilham alındı: her adım kendi timeout'u ile,
 * bağımlı olanlar sıralı, olmayanlar paralel (ama şimdilik hepsi sıralı).
 * 
 * Başarılı boot → BootRecord tablosuna kayıt
 * Başarısız boot → critical adımlar başarısızsa server başlatılmaz
 * 
 * Referans: TEDBIRGE_OS_FIZIBILITE_v2 — Prensip 8 (Boot Sequence)
 */

const { PrismaClient } = require('@prisma/client');
const { bus, EVENT_TYPES } = require('./eventBus');

const prisma = new PrismaClient();

// ─── Step Definitions ───────────────────────────────────────────────────────

/**
 * @typedef {Object} BootStep
 * @property {string} name
 * @property {Function} run - async () => Promise<void>
 * @property {boolean} [critical] - Başarısız olursa boot iptal (default false)
 * @property {boolean} [optional] - Hata almak normal (default false, BootRecord'da farklı işaretlenir)
 * @property {number} [timeoutMs] - default 10000
 */

const DEFAULT_TIMEOUT_MS = 10000;

// ─── Step Implementations ───────────────────────────────────────────────────

async function checkDatabase() {
  await prisma.$queryRaw`SELECT 1`;
}

async function checkSupabaseStorage() {
  // Supabase storage ping — şimdilik env var kontrol
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase env vars missing');
  }
  // TODO: gerçek bucket list çağrısı (adapter hazır olunca)
}

async function pingOracleWorker() {
  // Oracle Free hibrit henüz kurulmadı, şimdilik skip
  if (!process.env.ORACLE_SSH_HOST) {
    throw new Error('Oracle SSH not configured (optional)');
  }
  // TODO: SSH ping gerçek implementation
}

async function checkAnthropicAPI() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY missing');
  }
  // Gerçek ping yapmadan sadece key varlığı kontrol (maliyet tasarruf)
}

async function restorePgBossQueue() {
  // pg-boss henüz entegre değil, şimdilik skip
  // TODO: pg-boss.start() + restore stuck jobs
}

async function registerCronScheduler() {
  // Cron scheduler henüz kurulmadı, şimdilik skip
  // TODO: node-cron veya benzeri register
}

async function initSSEEndpoints() {
  // SSE endpoint'ler admin.os.routes.js içinde mount'lanacak
  // Şimdilik sadece module'ün yüklendiğini kontrol et
  require('../routes/admin.os.routes.js');
}

async function pingUYAP() {
  // UYAP Kurumsal Web Servis anlaşması yok, stub
  // Critical flag ile işaretli ama şimdilik warning level bırakıyoruz
  console.warn('[BOOT] UYAP Kurumsal Web Servis anlaşması bekleniyor (stub)');
}

async function pingSBM() {
  // SBM'nin hukuk yazılımına özel API'si yok, manuel mode
  // Optional — olmaması normal
  console.warn('[BOOT] SBM manuel mode (web sorgu wizard aktif)');
}

async function checkKVKKSCC() {
  // KVKKSCC tablosunda aktif ve süresi dolmamış kayıtlar var mı?
  const activeScc = await prisma.kVKKSCC.count({
    where: {
      status: 'ACTIVE',
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });

  if (activeScc === 0) {
    // Henüz hiç SCC imzalanmamış — tedbirge henüz legal olarak hazır değil
    // Critical değil (boot'u durdurmaz) ama warning severity
    throw new Error('Hiç aktif KVKK SCC kaydı yok — yurt dışı veri aktarımı için Standart Sözleşme gerekiyor');
  }
}

async function checkVERBIS() {
  // VERBİS'in resmi API'si yok (2026 itibarıyla). Manuel kayıt kontrolü:
  // OSPolicy tablosunda "verbis.registered" key'i var mı?
  const verbisPolicy = await prisma.oSPolicy.findUnique({
    where: {
      module_key: {
        module: 'compliance',
        key: 'verbis.registered',
      },
    },
  });

  if (!verbisPolicy || !verbisPolicy.value || verbisPolicy.value.registered !== true) {
    throw new Error('VERBİS kaydı yapılmamış veya OSPolicy\'de işaretlenmemiş');
  }
}

// ─── Boot Sequence Definition ───────────────────────────────────────────────

const BOOT_STEPS = [
  { name: 'DB Connection', run: checkDatabase, critical: true },
  { name: 'Supabase Storage', run: checkSupabaseStorage, critical: true },
  { name: 'Oracle Worker', run: pingOracleWorker, optional: true },
  { name: 'Anthropic API', run: checkAnthropicAPI, critical: true },
  { name: 'pg-boss Queue', run: restorePgBossQueue, optional: true },
  { name: 'Cron Scheduler', run: registerCronScheduler, optional: true },
  { name: 'SSE Endpoints', run: initSSEEndpoints, critical: true },
  { name: 'UYAP Connectivity', run: pingUYAP, optional: true }, // anlaşma gelene kadar optional
  { name: 'SBM Health', run: pingSBM, optional: true },
  { name: 'KVKK SCC Validity', run: checkKVKKSCC, optional: true }, // ilk kurulum öncesi warn
  { name: 'VERBİS Kayıt', run: checkVERBIS, optional: true }, // ilk kurulum öncesi warn
];

// ─── Runner ─────────────────────────────────────────────────────────────────

async function withTimeout(promise, ms, stepName) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Step "${stepName}" timed out after ${ms}ms`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Boot sequence'i çalıştır.
 * @returns {Promise<{ok: boolean, steps: Array, totalMs: number}>}
 */
async function runBoot() {
  const startTime = Date.now();
  const results = [];
  let criticalFailure = false;

  for (const step of BOOT_STEPS) {
    const stepStart = Date.now();
    const timeoutMs = step.timeoutMs || DEFAULT_TIMEOUT_MS;

    try {
      await withTimeout(step.run(), timeoutMs, step.name);
      results.push({
        name: step.name,
        ok: true,
        durationMs: Date.now() - stepStart,
        optional: !!step.optional,
        critical: !!step.critical,
      });
      console.log(`[BOOT] ✓ ${step.name} (${Date.now() - stepStart}ms)`);
    } catch (err) {
      const result = {
        name: step.name,
        ok: false,
        durationMs: Date.now() - stepStart,
        optional: !!step.optional,
        critical: !!step.critical,
        error: err.message,
      };
      results.push(result);

      const icon = step.optional ? '⚠' : step.critical ? '✗' : '✗';
      console.log(`[BOOT] ${icon} ${step.name}: ${err.message}`);

      if (step.critical) {
        criticalFailure = true;
      }
    }
  }

  const totalMs = Date.now() - startTime;
  const allOk = !criticalFailure;

  // BootRecord'a yaz
  try {
    await prisma.bootRecord.create({
      data: {
        steps: results,
        totalMs,
        ok: allOk,
        version: process.env.GIT_COMMIT_SHA || 'unknown',
      },
    });
  } catch (err) {
    console.error('[BOOT] BootRecord persist failed:', err.message);
  }

  // Event bus'a yay
  await bus.emitOS(
    allOk ? EVENT_TYPES.SYSTEM_BOOTED : 'system:boot-failed',
    {
      severity: allOk ? 'info' : 'critical',
      module: 'boot',
      payload: {
        stepCount: results.length,
        failedSteps: results.filter(r => !r.ok).map(r => r.name),
        totalMs,
      },
    }
  ).catch(() => {});

  return {
    ok: allOk,
    steps: results,
    totalMs,
  };
}

module.exports = {
  runBoot,
  BOOT_STEPS,
};
```

**Boot.js doğrulamaları (yazdıktan sonra):**

```bash
# 1) Sözdizimi
node --check src/os/boot.js && echo "OK"

# 2) Import
node -e "const b = require('./src/os/boot'); console.log('Exports:', Object.keys(b).join(', ')); console.log('Step count:', b.BOOT_STEPS.length);"
# Beklenen: Exports: runBoot, BOOT_STEPS   | Step count: 11

# 3) Gerçek boot çalıştır (çoğu adım warn/error atacak çünkü env/setup eksik, normal)
node -e "const { runBoot } = require('./src/os/boot'); runBoot().then(r => { console.log('OK:', r.ok, 'totalMs:', r.totalMs); console.log('Başarısız adımlar:', r.steps.filter(s => !s.ok).map(s => s.name + ' (' + (s.optional ? 'opt' : 'crit') + ')').join(', ')); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });"
# Beklenen: 
# [BOOT] ✓ DB Connection
# [BOOT] ✓ Supabase Storage (env varsa)
# [BOOT] ⚠ Oracle Worker
# [BOOT] ✓ Anthropic API (env varsa)
# [BOOT] ⚠ pg-boss Queue
# [BOOT] ⚠ Cron Scheduler
# [BOOT] ✓ SSE Endpoints
# [BOOT] ⚠ UYAP Connectivity
# [BOOT] ⚠ SBM Health
# [BOOT] ⚠ KVKK SCC Validity
# [BOOT] ⚠ VERBİS Kayıt
# OK: true/false ...

# 4) BootRecord DB'ye yazıldı mı?
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.bootRecord.findMany({ orderBy: { createdAt: 'desc' }, take: 1 }).then(r => { console.log('Son boot:', r[0]?.createdAt, '| ok:', r[0]?.ok, '| totalMs:', r[0]?.totalMs, '| steps:', r[0]?.steps?.length); p.\$disconnect(); });"
# Beklenen: en az 1 kayıt, 11 step
```

**Boot.js commit mesajı (4/4 doğrulama geçerse):**

```
feat(os-v3): boot.js — 11 adımlı startup sequence

- runBoot(): sıralı 11 adım, her biri timeout + try/catch
- BOOT_STEPS: DB, Supabase, Oracle, Anthropic, pg-boss, Cron, SSE, UYAP, SBM, KVKK SCC, VERBİS
- Critical vs optional flag: critical başarısızsa boot fail, optional warning
- BootRecord tablosuna her çalıştırma yazılır (ok/totalMs/steps)
- Event bus: system:booted (success) veya system:boot-failed (critical)
- UYAP/SBM stub implementation (anlaşma bekleniyor)
- KVKK SCC/VERBİS optional (henüz imzalanmadı, warning level)
- timeout wrapper (default 10sn)

Doğrulama: 4/4 (syntax, import, real boot, BootRecord persist)
Ref: TEDBIRGE_OS_FIZIBILITE_v2 Prensip 8 (systemd boot)
```

### 2.2 Sonraki dosyalar (sırayla)

**reconciler.js** (boot.js'ten sonra)
- 5 dakikalık cron, OSPolicy desired vs actual karşılaştırma
- IdempotencyKey.cleanupExpired() saatlik çağır
- Event bus ile yay

**adapters/base.js**
- 5 interface tanımı: HostingAdapter, StorageAdapter, AIAdapter, LegalAdapter, DataProtectionAdapter
- JSDoc ile tip bilgisi

**adapters/render.js, supabase.js, anthropic.js** (önce gerçek adapter'lar)
**adapters/oracle.js** (SSH implementation — node-ssh)
**adapters/uyap.js, sbm.js, eimza.js** (stub — NOT_IMPLEMENTED)

**modules/pulse.js** (ilk module — Modül 1 Nabız)
Sonra sırayla 14 modül daha.

---

## 3. KURALLAR (Değişmez)

1. **Her dosya yazımından sonra doğrulama** — syntax + import + smoke test + DB persist (varsa)
2. **Her dosyadan sonra commit** — mesaj formatı yukarıdaki gibi
3. **Push YOK** — sadece local commit, push kararı mimarda
4. **canlı DB'ye dokunma** — migration hata verirse DUR, mimara bildir
5. **Schema değişikliği yapma** — prisma/schema.prisma zaten senkron, kod yazımına odaklan
6. **EPERM gelirse** — zombie process var demektir, Get-Process node + Stop-Process ile temizle, sonra prisma generate
7. **Her komut onayında** 1 (Yes) seçilir, 2 (kalıcı izin) İSTEME
8. **Emoji yeterli** — başlıklar ✓ ✗ ⚠ 🔥, süsleme değil

---

## 4. MİMAR KARARLARI (Önceki oturumda verildi — değişmez)

- **Yol 1 (vertical PI CRM)** — generalist horizontal değil (marka raporu)
- **Oracle Free + hibrit** — backup altyapı (OCR altyapı raporu)
- **OS v3 kapsamı** — 122 saat v2 + 118 saat v3 eklemesi = 240 saat toplam
- **Manuel SBM mode** — SBM API yok, wizard ile manuel
- **UYAP Kurumsal Web Servis** — 6 aylık anlaşma süreci, kod tarafı stub beklentisi
- **KVKK SCC acil** — 4 yurt dışı işleyen (Supabase, Anthropic, Vercel, Render) için ayrı SCC
- **Migration drift tech debt** — şimdilik db push, sonra baseline migration

---

## 5. İLK İŞİN

1. Git status kontrol et (temiz olmalı, HEAD = e1e71f6)
2. Mimar'a haber ver: "Handoff okundu, boot.js yazımına hazırım"
3. Mimar onay verince yukarıdaki boot.js spec'ini yaz
4. 4 doğrulama çalıştır, ham çıktıları göster
5. Her doğrulamadan sonra DUR, mimar onayı bekle
6. 4/4 geçerse commit at

---

## 6. ACİL DURUMLAR

**Eğer DB bağlantısı kopmuşsa:**
```bash
DB_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
echo "URL uzunluk: ${#DB_URL}"
# Boşsa .env kayıp, mimara bildir
```

**Eğer schema.prisma drift varsa:**
- `npx prisma db pull --force` YAPMA (canlı veri kaybı riski)
- Mimara bildir, birlikte baseline migration yap

**Eğer EPERM geliyorsa:**
```powershell
Get-Process node | Where-Object { $_.Id -notin @(AKTIF_PID_LIST) } | Stop-Process -Force
```
AKTIF_PID_LIST'i Get-NetTCPConnection ile bul (port 3000 ve 5000 dinleyenler).

---

## 7. MİMAR İLETİŞİM PROTOKOLÜ

- Her doğrulama sonrası **DUR** yaz, mimar onayı bekle
- "Mimar onayı varsayılarak..." diye otomatik ilerleme — YAPMA
- Beklenmedik hata → ham çıktıyı göster, fix yapma
- Her commit sonrası `git log --oneline -3` göster

---

**Hazırsın. Başla.**
