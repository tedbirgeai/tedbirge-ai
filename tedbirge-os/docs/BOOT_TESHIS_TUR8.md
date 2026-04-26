# TEDBIRGE.AI — BOOT TESHISI TUR #8 FAZ A
## Tarih: 26 Nisan 2026 (gece)
## Mimar: Claude Sonnet 4.6 (TUR #8 agent)

> Bu rapor `system:boot-failed` eventlerinin kok neden teshistir.
> Disiplin: Anayasa Madde 4.4 (kod kaynak). Hic tedavi YOK, sadece teshis.
> Faz B (mimar oturumu) bu raporla tedavi plani kuracak.

---

## OZET

**Sorun:** system:boot-failed 30 eventte ayni failedSteps listesi (TUR #7 kaniti).
**Etki:** OS moduller (Auditor, Healer, Reporter, KVKK + 17 mevcut) start() cagrisini alamiyor.

**Kok neden: 2 KATMANLI SORUN**

Katman 1 — Boot fail sebebi:
  `checkSupabaseStorage()` adimi `SUPABASE_SERVICE_ROLE_KEY` env var kontrolu yapıyor.
  Bu env Render'da tanimli degil (veya bos).
  Bu adim `critical: true` → `criticalFailure = true` → `system:boot-failed`.

Katman 2 — Modul start() eksikligi (boot basarili olsa bile gecerli):
  server.js satir 46: `r.ok === true` durumunda sadece `startReconciler()` cagiriliyor.
  Hicbir modulun `.start()` metodu cagrilmiyor.
  Auditor, Healer, Reporter, KVKK hicbir zaman `start()` almayacak.

**Kanit seviyesi:** YUKSEK (30/30 event ayni, kod okuma kesin)

---

## KOD ZINCIRI (G8A-1 → G8A-4)

### boot.js (src/os/boot.js)

Boot sequence 11 adim, her adim timeout ile korumalı (default 10sn).
`critical: true` olan adim fail ederse `criticalFailure = true`.
Sonunda `bus.emitOS(allOk ? 'system:booted' : 'system:boot-failed', ...)` cagiriliyor.

```
BOOT_STEPS = [
  { name: 'DB Connection',     critical: true  },  ← GECIYOR (failedSteps'de yok)
  { name: 'Supabase Storage',  critical: true  },  ← FAIL (failedSteps'de var)
  { name: 'Oracle Worker',     optional: true  },  ← FAIL (optional, kritik degil)
  { name: 'Anthropic API',     critical: true  },  ← GECIYOR (failedSteps'de yok)
  { name: 'pg-boss Queue',     optional: true  },  ← GECIYOR
  { name: 'Cron Scheduler',    optional: true  },  ← GECIYOR
  { name: 'SSE Endpoints',     critical: true  },  ← GECIYOR
  { name: 'UYAP Connectivity', optional: true  },  ← GECIYOR (sadece console.warn)
  { name: 'SBM Health',        optional: true  },  ← GECIYOR (sadece console.warn)
  { name: 'KVKK SCC Validity', optional: true  },  ← FAIL (optional, kritik degil)
  { name: 'VERBİS Kayit',      optional: true  },  ← FAIL (optional, kritik degil)
]
```

`checkSupabaseStorage()` kodu (satir 38-43):
```javascript
async function checkSupabaseStorage() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase env vars missing');
  }
}
```

`SUPABASE_SERVICE_ROLE_KEY` boşsa veya tanimli degilse → exception → critical fail.

**Not:** boot.js satir 14-17 Anayasa ihlali:
  `const { PrismaClient } = require('@prisma/client');`
  `const prisma = new PrismaClient();`
  Singleton kullanmiyor. Ancak DB Connection adimi gectiğinden boot-fail sebebi degil.
  eventBus.js satir 16-18'de de ayni ihlal var.

### src/os/index.js

safeRequire fonksiyonu (satir 66-73): try/catch ile korumalı, hata durumunda
`{ error: "..." }` donduruyor, boot'u durdurmuyor. 20 modul mount.

### eventBus.js

`emitOS(type, meta)` metodu: memory emit + SystemEvent persist.
Persist hatasi event'i durdurmuyor (try/catch, sadece log).
`onOS(type, handler)` metodu: handler hatalari yakalanıyor, bus patlamiyor.

### Boot cagirisi (src/server.js)

Kritik satir (satir 44-48):
```javascript
if (process.env.OS_ENABLED !== 'false') {
  tedbirgeOS.runBoot().then(r => {
    if (r.ok) {
      logger.info(`[OS] Boot OK ...`);
      tedbirgeOS.startReconciler();   // ← SADECE RECONCILER
      logger.info('[OS] Reconciler started');
    }
    else { logger.error(`[OS] Boot failed: ...`); }
  }).catch(err => logger.error(`[OS] Boot threw: ${err.message}`));
}
```

**KRITIK EKSIKLIK:** `r.ok === true` durumunda modullerin `start()` cagirisi YOK.
`tedbirgeOS.modules.auditor.start()`, `healer.start()`, `reporter.start()` vb.
HICBIRI cagrilmiyor. Boot basarili olsa bile auditor taramalari baslamayacak.

---

## HAM HATA KANITI (G8A-5)

Son 30 boot-failed event, TUM ayni failedSteps:

```json
{
  "failedSteps": ["Supabase Storage", "Oracle Worker", "KVKK SCC Validity", "VERBİS Kayıt"],
  "stepCount": 11,
  "toplam_event": 30,
  "ilk_event": "2026-04-25T02:34:46.286Z",
  "son_event":  "2026-04-26T06:30:21.545Z"
}
```

Ornek event (en son):
```json
{
  "id": "cmofe2qug0001um3cmuuk26j1",
  "type": "system:boot-failed",
  "severity": "critical",
  "module": "boot",
  "payload": {
    "totalMs": 1456,
    "stepCount": 11,
    "failedSteps": ["Supabase Storage", "Oracle Worker", "KVKK SCC Validity", "VERBİS Kayıt"]
  },
  "createdAt": "2026-04-26T06:30:21.545Z"
}
```

**Pattern analizi (G8A-6):**
- Hep ayni 4 adim fail ediyor: Supabase Storage, Oracle Worker, KVKK SCC, VERBİS
- Hicbir event farkli pattern gostermiyor (30/30 ayni)
- Saat dagilimi: 25 Nisan 02:34'ten 26 Nisan 06:30'a kadar (her deploy/restart'ta)
- totalMs: 1121-1758ms arasi (11 adim bu sure'de tamamlanıyor)
- Sonuc: Deterministik hata, her restart'ta tekrarlaniyor

---

## SISTEM EVENT GENEL BAKIS (G8A-7)

```json
[
  { "_count": 27, "type": "system:boot-failed" }
]
```

(24 saat pencere, yalnizca G7 esnasinda cekildi — tam toplam 30)

- system:boot-failed: 30
- system:booted: 0
- system:boot-success: 0
- Diger system:*: 0

Yorum: HICBIR basarili boot yok. Sistem ilk gununden beri hep fail ediyor.
API /health = 200 calisıyor cunku Express server boot-failed'dan etkilenmiyor
(server.listen() onceden baslıyor, boot async .then() ile calışıyor).

---

## MODUL DOSYA SAGLIGI (G8A-8 → G8A-10)

| Modul | Durum | Icerik | Ilk inceleme |
|-------|-------|--------|--------------|
| auditor.js | 327 satir | start/stop/runTick/getStatus tam | Suphe yok |
| healer.js | Onceki turda okundu | start/stop + SMS+Push tam | Suphe yok |
| reporter.js | 103 satir | start/stop/addClient/relayEvent/getStatus | Suphe yok |
| kvkk.js | 150 satir | 4 fonksiyon dolu | Suphe yok |

**Eksik paket kontrolu (package.json):**
- web-push: VAR (^3.6.7)
- @prisma/client: VAR (^6.19.2)
- node-cron: VAR (^4.2.1)
- Eksik paket: YOK — tum bagimliliklar mevcut

**Schema modelleri:**
- BootRecord: VAR (satir 538)
- KVKKSCC: VAR (satir 616)
- OSPolicy: VAR (satir 472)

Modul dosya sagligi sorunu yok. Sorun yukarda.

---

## KOK NEDEN HIPOTEZLERI (Faz B'de tartisılacak)

### Hipotez 1 (KESIN — Faz A kaniti): SUPABASE_SERVICE_ROLE_KEY Render'da tanimsiz

- Kanit: 30/30 event'te "Supabase Storage" failedSteps'de. `checkSupabaseStorage()`
  kodu `SUPABASE_SERVICE_ROLE_KEY` kontrol ediyor, yoksa throw.
  Bu adim `critical: true` → criticalFailure = true → boot-failed.
- Cozum (Faz C/Mehmet Bey): Render env dashboard → `SUPABASE_SERVICE_ROLE_KEY` ekle
  (TUR #5'te storage.service.js kanonik key olarak tanimlanmisti,
  ama boot.js bunu bilmiyor ve eski env varini aramıyor)
- Risk: SIFIR (env ekleme — kod degisikligi yok)
- Sure: 2 dakika (Render dashboard)

### Hipotez 2 (KESIN — Faz A kaniti): server.js'de modul start() eksikligi

- Kanit: server.js satir 46 — `r.ok === true` durumunda yalnizca `startReconciler()`
  cagiriliyor. `tedbirgeOS.modules.auditor.start()` vb. cagirisi yok.
  Auditor `setInterval(runTick, 1 saat)` ancak `start()` cagrilinca kurabilir.
- Cozum (Faz C): server.js'de `r.ok` durumunda modul start() cagirilari eklenmeli
  (atom degisiklik, 5-10 satir, mimar onayi gerekiyor)
- Risk: DUSUK (server.js await pattern degismeyecek, sadece modul start ekleme)
- Sure: 10 dakika (atom degisiklik + test)

### Hipotez 3 (DUSUK OLASILIK): Oracle Worker/KVKK SCC/VERBİS optional fail boot-failed'a katkida bulunuyor

- Kanit: Bu adimlar `optional: true` — `criticalFailure` flag'ini degistirmiyor.
  Sadece boot "temiz gecmedi" gostergesi.
- Bu tek basina boot-failed YAPMIYOR. Hipotez 1 (Supabase) asil neden.
- Cozum gerekmez (optional, beklenen davranis).

---

## TEDAVI ONERISI — FAZ B/C ICIN GIRDI

**Sira 1 (Mehmet Bey, env — 2 dakika):**
  Render env dashboard → `SUPABASE_SERVICE_ROLE_KEY` = [mevcut Supabase service role key]
  NOT: Bu key zaten Render'da baska isimle olabilir.
  TUR #5 raporu: storage.service.js fallback eklendi ama boot.js fallback bilmiyor.
  Kontrol: Render dashboard'da hangi SUPABASE_ key'leri var?

**Sira 2 (Claude Code, kod — 10 dakika, mimar onayi ile):**
  server.js'de `r.ok === true` blogu icine modul start() cagirilari ekle:
  ```javascript
  if (r.ok) {
    logger.info(`[OS] Boot OK ...`);
    tedbirgeOS.startReconciler();
    // Modul start cagrilari (eksik olan):
    Object.entries(tedbirgeOS.modules).forEach(([name, mod]) => {
      if (mod && typeof mod.start === 'function') {
        try { mod.start(); } catch(e) { logger.error(`[OS] ${name}.start() hata: ${e.message}`); }
      }
    });
  }
  ```

**TEST stratejisi (Faz C sonrasi):**
  1. Render env eklendi → deploy tetiklendi
  2. DB sorgusu: `system:booted` event var mi?
  3. DB sorgusu: `auditor:started` event var mi?
  4. 1 saat bekle: `audit:env_inconsistency` veya herhangi `audit:*` event var mi?
  5. /health: 200 hala donuyor mu?

---

## KAPSAM DISI (bu fazda yapilmadi)

- Hicbir kod degisikligi yapilmadi (Faz C'ye sakli)
- Modul restart denenmedi
- Render shell'den manuel komut calistirilmadi
- `OS_ENABLED=false` denenmedi

---

— Claude Code, TUR #8 Faz A sonu (TESHIS)
