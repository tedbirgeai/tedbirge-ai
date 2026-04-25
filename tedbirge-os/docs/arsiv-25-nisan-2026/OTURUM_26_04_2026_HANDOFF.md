# TEDBIRGE OS v3 — 26 Nisan 2026 OTURUM HANDOFF

**Branch:** feature/tedbirge-os-v3
**Son commit:** 8f9ef9a feat(os-v3): adapters/base.js — HAL taban siniflar (9 interface)
**Mimar:** Claude Opus 4.7 (chat) — Claude Code Sonnet 4.6 (terminal)
**Dil:** Turkce, "ortak" hitabi

---

## DURUM

### 7/33 OS dosyasi dolu

**DOLU:**
- eventBus.js, idempotency.js, supervisor.js (onceki oturumlardan)
- boot.js (c191ffd) — 11 adimli startup sequence
- reconciler.js (c586928) — desired vs actual state loop
- index.js (026d366) — OS barrel export, 28 export
- adapters/base.js (8f9ef9a) — HAL 9 interface + BaseAdapter abstract

**BOS (26):**
- adapters/ (8): render, supabase, anthropic, vercel, oracle, uyap, sbm, eimza
- modules/ (15): pulse, backup, security, compliance, cost, deploy, ai, analyzer, appearance, insurance, maintenance, navigation, notifications, performance, uyapControl
- observability/ (3): logs, metrics, traces

### Push durumu
Lokal ~8 commit, PUSH YAPILMADI. Sprint sonunda toplu push.

### Yardimci islemler (25 Nisan)
- CLAUDE.md 80K -> 9.7K kesim (7ea4d72)
- Arsiv: tedbirge-os/docs/CLAUDE_ARSIV_Nisan_15_16.md (72K, 21 oturum kaydi)
- Yerel yedek: CLAUDE.md.bak (gitignore'da)
- Disiplin kurali (B): read-only komutlar otomatik, yazma komutlari onayli

---

## SIRADAKI IS

### adapters/render.js — ilk gercek implementation

**Mod:** THIN adapter (~100 satir)
- BaseAdapter extend eder
- HostingAdapter interface implement eder (getUptime, getResponseTime, redeploy, getRecentLogs)
- Sadece env kontrol + health ping
- Gercek API cagrilari modules/pulse.js yazilirken genisletilir (iterative)

**Mimar Opus 4.7 onerisi:** THIN mode — modules kullanirken adapter derinlesir.

---

## SIRA (Sprint 2 kapsami)

1. adapters/render.js (thin)
2. adapters/supabase.js (thin)
3. adapters/anthropic.js (thin)
4. adapters/vercel.js (thin)
5. adapters/oracle.js (SSH-based)
6. adapters/uyap.js, sbm.js, eimza.js (stub, NOT_IMPLEMENTED)
7. Ilk modul: modules/pulse.js (Modul 1 — Nabiz)

---

## KURALLAR (degismez)

1. Her dosya sonunda dogrulama: syntax + import + runtime test + persist (varsa)
2. Her dosya sonunda commit (Turkcesiz mesaj, -m chain)
3. Push YOK (Sprint sonunda toplu)
4. Read-only komutlar otomatik onay (B disiplin)
5. Yazma/commit/push komutlari MUTLAKA ONAY
6. Kalici izin (secenek 2) HICBIR ZAMAN ISTEME
7. Mimar spec vermeden yazma yok
8. Fix yapma, ham hatayi mimara goster
9. Commit mesajinda Turkce karakter YOK (PowerShell kaçis sorunu)
10. Uzun komut 893 byte asarsa gecici .ps1 dosyasi olustur

---

## TEKNIK KRITIK NOTLAR

**Platform:**
- DB: Supabase Production `iikpmzomblocdrxeisxh`
- Backend: Render `tedbirge-ai.onrender.com`
- Panel: Vercel `tedbirge.ai`
- Storage bucket: `tedbirge-documents` (private, RLS)
- Admin: `tedbirge42@gmail.com`

**Tech debt (Sprint sonunda):**
- Local `.env` Supabase `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` eksik
- Migration drift: `AccidentCase` + `Evidence` tablolari canlida var, schema'da yok
- Baseline migration: OS bitiminde
- OTURUM_25_04_2026_HANDOFF.md arsive tasinacak

**Modul export listeleri (barrel referansi):**
- eventBus: `bus`, `EVENT_TYPES`
- idempotency: `getIdempotent`, `saveIdempotent`, `cleanupExpired`, `requireIdempotencyKey`, `DEFAULT_TTL_MS`, `HEADER_NAME`
- supervisor: `register`, `start`, `stop`, `resume`, `unregister`, `getStatus`, `TASK_STATUS`, `DEFAULT_CONFIG`
- boot: `runBoot`, `BOOT_STEPS`
- reconciler: `startReconciler`, `stopReconciler`, `registerPolicyHandler`, `runReconcileTick`, `runCleanupTick`
- base: `BaseAdapter`, `NotImplementedError`, `AdapterConfigError`, `addAdapter`, `getAdapter`, `listAdapters`, `validateAdapter`

---

## MEHMET BEY VIZYONU

> "Turkiye'deki tum trafik/is kazalarini yonetecegiz"
> "Manuel is sevmiyorum, yoruldum. Hukukcu da yorulmasin"
> "Hukukcu paneli gorselleri muazzam olsun"
> "Biz teknoloji altyapisi goturuyoruz. KEP avukatin isi"

---

## YENI MIMAR (Opus 4.7) ICIN ILK IS — SORU SORMA

Mehmet Bey yorgun degil ama onceki sohbet context'i doldu. Bu sohbet temiz baslangic.

**Hemen yap:**

1. Bu HANDOFF'u oku, kaldigin yeri sindir (5 saniye)
2. Mehmet Bey'e "Ortak, dosyayi okudum, kaldigimiz yerden basliyoruz" de (kisaca)
3. Claude Code'a 2 komut birlikte ver (tek paket):

**ADIM A — Durum senkron:**
powershell.exe -Command "cd 'C:\Users\WIN10\desktop\tedbirge.ai'; git log --oneline -8; git status; git branch --show-current"

**ADIM B — adapters/render.js THIN spec yaz:**
Dogrudan Claude Code'a ver. BaseAdapter extend eden ~100 satirlik thin adapter. Env kontrol (RENDER_API_KEY, RENDER_SERVICE_ID), health ping, getUptime/getResponseTime/redeploy/getRecentLogs metodlari _notImplemented veya stub (modules/pulse.js yazilirken gercek API entegrasyonu eklenir).

4. ADIM 1 (yaz) -> ADIM 2 (syntax) -> ADIM 3 (exports) -> ADIM 4 (runtime test: instantiate + registry'e ekle + validate) -> ADIM 5 (commit) formatinda tek paket.

**Mehmet Bey onay isteyecek komutlar disinda bekleme. "Ne yapalim" sorma. Plan net.**

"Kaldigimiz yerden" basla. "Sifirdan" degil.
