# AUDITOR START TESHISI — TUR #8 Faz C Adim 1
## Tarih: 26 Nisan 2026

## SORU
Auditor neden tarama yapmiyor?

---

## KANIT 1 — Auditor.start() icerigi

src/os/modules/auditor.js satir 53-60:
```javascript
function start() {
  if (state.started) return;
  state.started = true;
  state.tickInterval = setInterval(runTick, TICK_INTERVAL_MS);  // 1 saat
  setImmediate(runTick);  // ilk tick aninda
  bus.emit("auditor:started", { at: new Date().toISOString() });
}
```

`module.exports` (satir 315-326):
```javascript
module.exports = {
  start,
  stop,
  runTick,
  runScan,
  recordFinding,
  getStatus,
  resetState,
  MODULE_NAME,
  TICK_INTERVAL_MS,
  EVENT_FINDING,
};
```

Bulgu: `start()` fonksiyonu MEVCUT ve dogru yazilmis. setInterval + setImmediate ile
1 saatlik periyodik tarama + anlik ilk tetik. Sorun auditor kodunda degil.

---

## KANIT 2 — Reconciler.start() icerigi (calisan ornek)

src/os/reconciler.js (modules/ disinda, dogrudan os/ altinda):
```javascript
function startReconciler() {
  if (isRunning) { return; }
  isRunning = true;
  reconcileTimer = setInterval(() => { runReconcileTick()... }, 5 * 60 * 1000);
  cleanupTimer   = setInterval(() => { runCleanupTick()... }, 60 * 60 * 1000);
  console.log('[RECONCILER] started: ...');
}

module.exports = {
  startReconciler,
  stopReconciler,
  registerPolicyHandler,
  runReconcileTick,
  runCleanupTick,
};
```

Bulgu: Reconciler da ayni setInterval pattern'ini kullaniyor.
Reconciler calisiyor, auditor calismıyor — fark DOSYA KONUMU ve CAGIRIM SEKLI.

---

## KANIT 3 — Boot.js start cagrı listesi

src/os/boot.js BOOT_STEPS dizisinde (satir 127-139):
```javascript
const BOOT_STEPS = [
  { name: 'DB Connection',     run: checkDatabase,       critical: true  },
  { name: 'Supabase Storage',  run: checkSupabaseStorage,critical: true  },
  { name: 'Oracle Worker',     run: pingOracleWorker,    optional: true  },
  { name: 'Anthropic API',     run: checkAnthropicAPI,   critical: true  },
  { name: 'pg-boss Queue',     run: restorePgBossQueue,  optional: true  },
  { name: 'Cron Scheduler',    run: registerCronScheduler, optional: true},
  { name: 'SSE Endpoints',     run: initSSEEndpoints,    critical: true  },
  { name: 'UYAP Connectivity', run: pingUYAP,            optional: true  },
  { name: 'SBM Health',        run: pingSBM,             optional: true  },
  { name: 'KVKK SCC Validity', run: checkKVKKSCC,        optional: true  },
  { name: 'VERBİS Kayit',      run: checkVERBIS,         optional: true  },
];
```

Bulgu: boot.js HICBIR MODUL start() cagirisi yapmıyor.
`auditor`, `healer`, `reporter` kelimeleri boot.js'de YOK.
Boot sadece altyapi kontrolu yapiyor (DB, Supabase, API key), modul lifecyle sorumluluğu yok.

---

## KANIT 4 — index.js modules objesi

src/os/index.js satir 75-96:
```javascript
const modules = {
  ai:            safeRequire('./modules/ai', 'ai'),
  analyzer:      safeRequire('./modules/analyzer', 'analyzer'),
  // ... 16 is modulu ...
  auditor:       safeRequire('./modules/auditor', 'auditor'),   // ← mount edilmis
  healer:        safeRequire('./modules/healer', 'healer'),     // ← mount edilmis
  reporter:      safeRequire('./modules/reporter', 'reporter'), // ← mount edilmis
  kvkk:          safeRequire('./adapters/kvkk', 'kvkk'),        // ← mount edilmis
};
```

Reconciler ise FARKLI: modules objesinde DEGIL, dogrudan os/ altindan barrel export:
```javascript
const reconcilerModule  = require('./reconciler');
const { startReconciler, stopReconciler, ... } = reconcilerModule;
// ...
module.exports = {
  startReconciler,  // ← dogrudan export, modules objesi disinda
  // ...
  modules,          // ← auditor/healer/reporter burada
};
```

Bulgu: Auditor `tedbirgeOS.modules.auditor` yoluyla erisiliyor.
Reconciler `tedbirgeOS.startReconciler()` yoluyla dogrudan erisilebilir.
Bu iki farkli mimari yol.

---

## KANIT 5 — server.js boot tetikleme

src/server.js satir 44-48:
```javascript
if (process.env.OS_ENABLED !== 'false') {
  tedbirgeOS.runBoot().then(r => {
    if (r.ok) {
      logger.info(`[OS] Boot OK (${r.steps.length} step, ${r.totalMs}ms)`);
      tedbirgeOS.startReconciler();   // ← RECONCILER: direkt cagrı, calisiyor
      logger.info('[OS] Reconciler started');
      // AUDITOR, HEALER, REPORTER: start() cagrisi YOK
    }
    else {
      logger.error(`[OS] Boot failed: ${r.steps.filter(s=>!s.ok).map(s=>s.name).join(', ')}`);
    }
  }).catch(err => logger.error(`[OS] Boot threw: ${err.message}`));
}
```

Bulgu: server.js `tedbirgeOS.startReconciler()` cagrisi var.
`tedbirgeOS.modules.auditor.start()` cagrisi YOK.
`tedbirgeOS.modules.healer.start()` cagrisi YOK.
`tedbirgeOS.modules.reporter.start()` cagrisi YOK.

---

## KOK NEDEN

`src/server.js`'de boot basarili olunca yalnizca `startReconciler()` cagriliyor;
`tedbirgeOS.modules.auditor.start()`, `healer.start()`, `reporter.start()` cagrisi
olmadigi icin bu modullerin `setInterval` donguleri hicbir zaman kurulmuyor.

---

## ONERILEN ATOM DUZELTME

**Dosya:** `src/server.js`
**Satir:** 46 (r.ok blogu icinde, `startReconciler()` cagrisindan sonra)

MEVCUT (satir 46):
```javascript
if (r.ok) {
  logger.info(`[OS] Boot OK (${r.steps.length} step, ${r.totalMs}ms)`);
  tedbirgeOS.startReconciler();
  logger.info('[OS] Reconciler started');
}
```

ONERILEN (eklenecek 6 satir, mevcut satirlar degismez):
```javascript
if (r.ok) {
  logger.info(`[OS] Boot OK (${r.steps.length} step, ${r.totalMs}ms)`);
  tedbirgeOS.startReconciler();
  logger.info('[OS] Reconciler started');
  ['auditor', 'healer', 'reporter'].forEach(name => {
    const mod = tedbirgeOS.modules[name];
    if (mod && typeof mod.start === 'function') {
      try { mod.start(); logger.info(`[OS] ${name} started`); }
      catch(e) { logger.error(`[OS] ${name}.start() failed: ${e.message}`); }
    }
  });
}
```

**Risk seviyesi:** DUSUK
- Mevcut satirlar degismiyor (startReconciler, boot log)
- Her modul try/catch ile korumalı — biri patlarsa digerleri etkilenmiyor
- safeRequire hata durumunda `{ error: "..." }` donduruyor — `typeof mod.start === 'function'`
  kontrolu bunu yakalıyor, exception atmıyor

**Test stratejisi:**
1. Degisiklik sonrasi deploy → Render Logs'ta `[OS] auditor started` satiri gorulmeli
2. DB sorgusu (deploy +2dk): `auditor:started` event SystemEvent'ta olmali
3. DB sorgusu (deploy +1sa): `audit:env_inconsistency` veya herhangi `audit:*` event olmali
4. /health: 200 hala donmeli (regression yok)

---

— Claude Code, TUR #8 Faz C Adim 1 sonu (TESHIS)
