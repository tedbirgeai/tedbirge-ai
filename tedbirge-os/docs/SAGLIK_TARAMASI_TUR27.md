# SAGLIK TARAMASI TUR #27 — 28 Nisan 2026

> **Tip:** T (Tarama — Madde 21, salt okuma)
> **Risk:** SIFIR (0 kod degisikligi, 0 commit, 0 schema, 0 npm, 0 env)
> **Mimar:** Claude Sonnet 4.6 (28 Nisan sabah, Mehmet Bey direktifi)
> **Kapsam:** Backend + Panel + Web + Schema/DB drift + Auth + KVKK + OS + 3rd party ENV

---

## OZET — En onemli bulgular

1. **K1 (KRITIK)** — TUR #22 migration (`add_updatedat_7_models`) production DB'ye uygulanmamis olmasi kuvvetle muhtemel. Panel "Zaman Cizelgesi" sekmesi `Durusma.updatedAt does not exist` hatasiyla patliyor. Mehmet Bey Render Shell'de dogrulama yapmali.
2. **K2 (KRITIK)** — `/api/chat` endpoint'leri AUTH YOK. `POST /send` ve `GET /:sessionKey` tamamen public. LeadId parametre olarak gonderilebiliyor. KVKK + guvenlik riski.
3. **K3 (KRITIK)** — `/lexscan` panelde 404. Backend servisi var, panel sayfasi yok. Madde 25.11 item 9 "YapilDI" isaretli ama production kanitlanmamis.
4. **O1 (ORTA)** — GA4 production'da calismıyor. `NEXT_PUBLIC_GA4_ID` Vercel env'e eklenmemis. Cookie consent kurulu ama pixel ateslenmiyor.
5. **O2 (ORTA)** — 15+ `process.env.*` kullanilan degisken `.env.example`'da eksik. `DIRECT_URL` (prisma migration icin kritik), `SUPABASE_SERVICE_ROLE_KEY` (yeni isim), `UNSUBSCRIBE_SECRET` dahil.
6. **O3 (ORTA)** — Sunucu sadece auditor/healer/reporter'i baslatıyor. Diger 10+ OS modulu (compliance, backup, costGuard, performance, security, pulse...) `start()` cagrisi almıyor.
7. **O4 (ORTA)** — Panel: `NEXT_PUBLIC_API_BASE` vs `NEXT_PUBLIC_API_BASE_URL` iki farkli env adi. Bazi dosyalar production URL, bazilari localhost default kullaniyor.

---

## KRITIK (acil kesite girer)

### K1 — Schema/DB Migration Drift: TUR #22 production'da eksik olmasi kuvvetle muhtemel

- **Bulgu:** Panel "Zaman Cizelgesi" sekmesi calıstirildiginda `Durusma.updatedAt does not exist in the current database` hatasi veriyor (mektup'ta acikca belirtilmis).
- **Schema durumu:** `prisma/schema.prisma` 7 modele `@updatedAt` ekli (Bilirkisi, DataSubjectRequest, Durusma, Masraf, SBMSorgu, UYAPDosyaSync, UYAPTebligat).
- **Migration SQL:** `20260427000001_add_updatedat_7_models/migration.sql` — 7 ALTER TABLE ADD COLUMN komutu mevcut.
- **Yeni migration:** `20260428000001_add_utm_extended_fields` (TUR #26 FAZ 4-A) — mektuptaki baseline listesinde YOK, production'a uygulanma durumu bilinmiyor.
- **Risk:** Tum hukuk takip sekmeleri (durusma, bilirkisi, masraf) runtime'da patch edebilir. Avukat panelinde kritik is akisi bozuk.
- **Onerilen kesit:** Mehmet Bey oncelikle Render Shell dogrulamasi yapsin, sonra TUR #28 olarak ele alinir.
- **Tahmini sure:** Render Shell dogrulama 5 dk + eger eksikse `prisma migrate deploy` 10 dk.

### K2 — `/api/chat` endpoint auth yok — public veri erisimi

- **Dosya:** `src/routes/chat.routes.js`
- **Kanit:**
  ```javascript
  router.post("/send", controller.sendMessage);
  router.get("/:sessionKey", controller.getMessages);
  ```
  Her iki route'da `auth` middleware yok. `index.js:36` — `router.use("/chat", chatRoutes)` — global auth yoktur.
- **Controller:** `chat.controller.js` — `leadId` request body'den alinıyor (`req.body.leadId`). Herhangi biri herhangi bir lead'e mesaj baglayabilir.
- **Risk:** (a) Kimlik dogrulamasi olmadan müvekkil chat geçmisi okunabilir. (b) Anthropic API maliyeti olusturulabilir. (c) KVKK m.5 (dogruluk) + m.12 (guvenlik) ihlali.
- **Onerilen kesit:** TUR #28 — auth middleware ekleme (1 satir degisiklik, yesil nokta).
- **Tahmini sure:** 15 dakika.

### K3 — `/lexscan` panelde 404

- **Probe sonucu:** `404  https://www.tedbirge.ai/lexscan`
- **Backend:** `src/routes/lexscan.routes.js` — `POST /api/lexscan/chat` calisiyor (index.js:51 mount'li).
- **Panel:** `tedbirge-panel/app/(public)/` klasöründe `lexscan` dizini YOK.
- **OTONOM_RAPOR kaniti:** TUR #25 FAZ 2 — "C4: ATLANDI — LexScan panel UI bulunamadiI (tedbirge-panel'de lexscan sayfasi mevcut degil)". Kapatilmamis.
- **Madde 25.11 item 9:** "LexScan → /basvuru prefill koprüsü — YOK → TUR #26" yazıyor. TUR #26 bitti ama lexscan sayfasi hala yok.
- **Risk:** Pazarlama materyalinde lexscan vaat ediliyorsa 404 dönüyor. Kullanici deneyimi bozuk.
- **Onerilen kesit:** TUR #28 — lexscan/page.tsx oluşturma (AiChatWidget.tsx mevcut, sadece sayfa wrapper gerekiyor).
- **Tahmini sure:** 30 dakika.

---

## ORTA (mevcut/siradaki kesite eklenir)

### O1 — GA4 production'da calısmiyor (NEXT_PUBLIC_GA4_ID env ayarlanmamis)

- **Probe kaniti:** Anasayfa HTML'inde `G-7MP4HD08T6` string bulunamadi (False).
- **Kod kaniti:** `tedbirge-panel/components/GoogleAnalytics.tsx` — `const gaId = process.env.NEXT_PUBLIC_GA4_ID;` — env bos oldugunda script yuklenmez.
- **OTONOM_RAPOR:** TUR #25 FAZ 1 kapanisinda "Mehmet Bey: GA4 hesabı ac → NEXT_PUBLIC_GA4_ID Vercel'e ekle" yazıyor. Bu adim atlanmis.
- **GSC verification:** Mevcut (True) — domain dogrulamasi yapilmis.
- **Risk:** Tum kampanya (Google Ads / Meta) dönüşüm takibi yapılamiyor. Madde 25.10 ölçüm disiplini ihlali. Reklam harcamasi ROI izlenemiyor.
- **Onerilen kesit:** Mehmet Bey aksiyonu — Vercel dashboard → NEXT_PUBLIC_GA4_ID env ekleme (5 dakika).
- **Tahmini sure:** 5 dakika (Mehmet Bey Vercel dashboard'dan yapacak).

### O2 — .env.example eksik (15+ degisken kodda var ama ornekte yok)

- **Eksik kritik degiskenler:**
  - `DIRECT_URL` — Prisma migrate deploy icin zorunlu (TUR #26'da eklendi, ornekte yok)
  - `SUPABASE_SERVICE_ROLE_KEY` — Kodun kullandıgı yeni isim; ornekte `SUPABASE_SERVICE_KEY` (eski isim) var
  - `ADMIN_PHONE` — Healer SMS bildirimleri icin gerekli
  - `UNSUBSCRIBE_SECRET` — Email opt-out linki imzalama icin gerekli
  - `OS_ENABLED` — OS sistemini devre disi birakma flag'i
  - `BACKEND_URL` — Bazi servislerde kullaniliyor
  - `PUBLIC_BASE_URL` — Bazi templatelerde kullaniliyor
  - `RENDER_API_KEY`, `RENDER_SERVICE_ID`, `RENDER_HEALTH_URL` — Deploy adapter
  - `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID` — Vercel adapter
  - `SLACK_WEBHOOK_URL` — Bildirim kanali
  - `OCR_SPACE_API_KEY` — ocr_space provider icin
  - `ANTHROPIC_MODEL`, `ANTHROPIC_MAX_TOKENS` — AI konfigurasyonu
  - `COST_BUDGET_*` — CostGuard limitleri
  - `ORACLE_SSH_*` (5 degisken) — Oracle adapter (production'da kullanilmiyor ama kodda var)
- **Risk:** Yeni gelistirici/deploy ortami kurulumunda eksik env'lerden dolayi sessiz hatalar. DIRECT_URL eksikligi migration'i bloklayabilir.
- **Onerilen kesit:** TUR #28 yesil nokta — .env.example guncelleme (dokumantasyon, 30 dakika).
- **Tahmini sure:** 30 dakika.

### O3 — OS modulleri baslatilmiyor: compliance, backup, costGuard, 7+ modul

- **Kanit (server.js:66-72):**
  ```javascript
  ['auditor', 'healer', 'reporter'].forEach(name => {
    const mod = tedbirgeOS.modules[name];
    if (mod && typeof mod.start === 'function') {
      try { mod.start(); ...
  ```
  Sadece bu 3 modul baslatılıyor. Diger moduller:
  - `compliance` — KVKK SCC expiry + DSR SLA taramasi (24 saatlik tick) CALISIMIYOR
  - `backup` — Otomatik DB yedek (daily/weekly) CALISIMIYOR
  - `costGuard` — Anthropic API maliyet alarm (1 saatlik tick) CALISIMIYOR
  - `performance` — SLO izleme (1 dakika tick) CALISIMIYOR
  - `security` — Guvenlik anomali tarama (5 dakika tick) CALISIMIYOR
  - `pulse` — Saglik pingi CALISIMIYOR
  - `maintenance` — Temizlik (daily/weekly) CALISIMIYOR
  - `analyzer` — Queue isleme (10sn tick) CALISIMIYOR
  - `notifications`, `navigation`, `insurance`, `uyapControl`, `deploy` da baslatılmıyor
- **Risk:** KVKK compliance otomasyonu (en kritik) durdurulmus. Maliyet kontrol yok. Guvenlik anomalisi gozlemlenemiyor.
- **Onerilen kesit:** TUR #28 — server.js foreach listesi genisetme (yesil nokta, ~10 satir).
- **Tahmini sure:** 30 dakika + test.

### O4 — Panel: NEXT_PUBLIC_API_BASE vs NEXT_PUBLIC_API_BASE_URL iki farkli isim

- **Kanit:**
  - `basvuru/page.tsx`: `process.env.NEXT_PUBLIC_API_BASE || "https://tedbirge-ai.onrender.com"` (production default)
  - `AiChatWidget.tsx`: `process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"` (localhost default!)
  - Diger dosyalar: `NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"`
- **Risk:** Eger sadece `NEXT_PUBLIC_API_BASE` Vercel'de tanimli ise, `NEXT_PUBLIC_API_BASE_URL` bos kalir ve AiChatWidget + diger componentler localhost'a basmaya calisir (production'da hata).
- **Onerilen kesit:** TUR #28 yesil nokta — env isimlerini tek bir standartta birlestir.
- **Tahmini sure:** 1 saat (tum referanslari tek isime migrate).

### O5 — sigortaBasvuru GET endpoint'leri role kisitlamasi yok (CUSTOMER erisebilir)

- **Dosya:** `src/routes/sigortaBasvuru.routes.js`
- **Kanit:**
  ```javascript
  router.use(authMiddleware); // auth var
  router.get("/lead/:leadId", controller.listByLead); // role YOK
  router.get("/:id", controller.getOne);              // role YOK
  router.get("/:id/pdf", pdfController.generatePdf); // role YOK
  ```
- **Risk:** Kimligini dogrulayan herhangi bir kullanici (CUSTOMER dahil) sigorta basvuru verisine erisebilir. TUR #21 POST/PATCH'e roleMiddleware ekledi ama GET'lere eklemedi.
- **Onerilen kesit:** TUR #28 — 3 GET route'a role ekle (yesil nokta).
- **Tahmini sure:** 15 dakika.

### O6 — muhatapAI endpoint'leri role kisitlamasi yok

- **Dosya:** `src/routes/muhatapAI.routes.js:11-14`
- **Kanit:**
  ```javascript
  router.use(authMiddleware); // auth var
  router.post("/:id/muhatap-ai", oneriAl);      // role YOK
  router.post("/:id/muhatap-ai/onay", oneriOnayla); // role YOK
  ```
- **Risk:** CUSTOMER herhangi bir lead'in muhatap AI analizini tetikleyebilir → Anthropic API maliyeti + veri erisimi. assertLeadAccess controller'da yapiliyor mu kontrol edilmeli.
- **Onerilen kesit:** TUR #28 — roleMiddleware(ADMIN, SALES, LAWYER, REPRESENTATIVE) ekle.
- **Tahmini sure:** 15 dakika.

---

## DUSUK (TASK_QUEUE.md'ye)

### D1 — Backend TODO sayisi: 9 islevsel eksik

- **Dosyalar ve satirlar:**
  - `src/data/zmss-limits.js:12` — 2011 oncesi ZMSS limitleri eksik (hukuki hesap hatasi riski)
  - `src/os/boot.js:42` — Supabase bucket listesi gercek degil (stub)
  - `src/os/boot.js:50` — SSH ping stub
  - `src/os/boot.js:62` — pg-boss job queue kaydi yok
  - `src/os/boot.js:67` — node-cron scheduler stub (deadlineChecker ayri calisiyor)
  - `src/os/reconciler.js:28` — Handler map bos (reconciler hic is yapmıyor)
  - `src/services/compensation.engine.v2.js:16,102` — Faz 2 senaryo hesaplama eksik
  - `src/services/kalem-hesaplari.js:62` — Yillik guncelleme gerekiyor
  - `src/services/kalem-hesaplari.js:444` — Emsal karar veritabani stub
- **Risk:** Dusuk — sistem calısiyor ama hukuki hesaplar eksik veriyle yapiliyor olabilir.
- **Onerilen kesit:** AI Analiz Dogruluk Kesiti (IS_PLANI MUST+NEXT).

### D2 — Panel TODO: 2 adet (hukukcu sayfasi)

- `tedbirge-panel/app/(panel)/dashboard/hukukcu/page.tsx:190` — Durusma tablosu gercek veriye baglanmamis
- `tedbirge-panel/app/(panel)/dashboard/hukukcu/page.tsx:292` — ActivityLog entegrasyonu eksik
- **Onerilen kesit:** Avukat Is Akisi Derinlestirme (IS_PLANI SHOULD+NEXT).

### D3 — OPENAI_API_KEY olu env degiskeni

- Hicbir servis `OPENAI_API_KEY` kullanmiyor (TUR #4'te tespit edilmis).
- Render'da hala tanimli olabilir (gorsellenemiyor — Mehmet Bey kontrol etsin).
- **Aksiyon:** Render env'den silmek yeterli (10 dakika).

### D4 — Masraf.odendi audit trail eksik

- TUR #18'den bu yana cozulmemis — TASK_QUEUE'da.

### D5 — IS_PLANI stale: "Aktif tur: TUR #24" yazıyor ama TUR #26 bitti

- `tedbirge-os/IS_PLANI.md` son guncelleme 27 Nisan. TUR #24-26 tamamlandi.
- **Aksiyon:** Mimar oturumunda IS_PLANI guncellenmeli.

### D6 — backup modulu Sprint 3 stub

- `src/os/modules/backup.js` — `start()` calisiyor ama gercek pg_dump yok.
- TUR #24 henuz yapilmadi (IS_PLANI'nda secilmis ama gerceklestirilmemis).
- **Onerilen kesit:** TUR #24 BACKUP MIMARISI — IS_PLANI MUST+NOW kapsaminda.

---

## NOT (bilgi amacli)

### N1 — /api/system/status endpoint yok (404)

Mektup'taki probe komutu: `GET /api/system/status` → "Route bulunamadi" (404). Bu endpoint hic yazilmamis. NOT: `/api/os/status` calisiyor (ADMIN auth ile) — alternatif endpoint bu.

### N2 — deadlineChecker node-cron calisıyor (server.js'de baslatilıyor)

`server.js:58` — `startDeadlineChecker()` dogrudan cagrilıyor. `cron.schedule("0 8 * * *")` her sabah 08:00'de avukat zamanasimi kontrolu yapıyor. TUR #19 duzeltmesi (`assignedAt → createdAt`) uygulanmis.

### N3 — AIUsageLog PII fix onaylandi

`src/services/ai.service.js:17` — `const dataSent = "hash:${hash}"` — SHA-256 hash kullaniliyor, ham metin yok. TUR #26 Atom 4 basarili.

### N4 — GSC dogrulama mevcut ama Search Console kaydi belirsiz

Anasayfa HTML'inde `google-site-verification` meta tag mevcut. Ama Search Console'da property dogrulanmis mi? Mehmet Bey kontrol etmeli.

### N5 — TUR #26 FAZ 4-A commit'leri push edilmis mi?

OTONOM_RAPOR'da "Push: BEKLIYOR — Mehmet Bey toplu push onayi isteniyor" yazıyor. Ama ana git log'da TUR #26 commit'leri gorunuyor (`4ee923a`, `b100c80`, `071e1df` vs). Durum netlestirilmeli.

### N6 — Chat routes public oldugu anlasiyor ama leadId baglantisi risk olusturuyor

`src/routes/chat.routes.js` uzerindeki public erimin LexScan AI widget icin kasitli olmasi muhtemel (AiChatWidget.tsx `sessionKey` ile calisıyor). Ancak controller `leadId` parametre kabul ettigi icin kotu niyetli kullanim riski var. K2 bulgusuyla birlikte ele alinmali.

---

## MEHMET BEY CALISTIRACAK (Render Shell + Tarayici)

### Render Shell PSQL — Migration Dogrulama

```bash
# Hangi migration'lar uygulanmis (bitirme tarihi olan):
psql "$DIRECT_URL" -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at NULLS FIRST;"

# TUR #22 (7 model updatedAt) uygulanmis mi:
psql "$DIRECT_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name='Durusma' AND column_name='updatedAt';"
psql "$DIRECT_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name='Bilirkisi' AND column_name='updatedAt';"
psql "$DIRECT_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name='Masraf' AND column_name='updatedAt';"

# TUR #26 FAZ 4-A UTM alanlari uygulanmis mi:
psql "$DIRECT_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name='Lead' AND column_name IN ('utmTerm','utmContent','gclid','referrer','landingPage');"

# OS modulleri calisıyor mu (son 24 saatte SystemEvent):
psql "$DIRECT_URL" -c "SELECT type, COUNT(*) FROM \"SystemEvent\" WHERE \"createdAt\" > NOW() - INTERVAL '24 hours' GROUP BY type ORDER BY 2 DESC LIMIT 20;"

# KVKK tabloları mevcut mu:
psql "$DIRECT_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('DataExportRecord','DataSubjectRequest','KVKKConsent','KVKKSCC');"
```

### Tarayici (Console + Network) Kontrol

Dashboard sayfalarini tek tek acin:
- `/dashboard` (ana)
- `/dashboard/analytics`
- `/dashboard/pazarlama`
- `/dashboard/lawyers`
- `/dashboard/bilirkisi-takibi`
- `/dashboard/sistem-durumu`
- Leads listesinden bir Lead ac → "Zaman Cizelgesi" sekmesi (updatedAt hatasi burada patliyor)

F12 → Console'da kirmizi hata var mi?
F12 → Network'te 4xx/5xx donen API cagrisi var mi?

### Render Logs

Render dashboard → tedbirge-ai → Logs sekmesi:
Son 24 saat filtresi: `ERROR`, `Invalid`, `P1001`, `P3005`, `does not exist`, `Yetkisiz`, `boot-failed` ara.
Her benzersiz hata mesajini asagidaki alana yaz ve paylas.

### Vercel Env Dogrulama

Vercel dashboard → tedbirge-panel → Settings → Environment Variables:
- `NEXT_PUBLIC_GA4_ID` var mi ve degeri G-XXXXXXXX formunda mi?
- `NEXT_PUBLIC_API_BASE` mi yoksa `NEXT_PUBLIC_API_BASE_URL` mi tanimli? Her ikisi de mi?

---

## DOKUNULMADI

- 0 kod degisikligi
- 0 commit (rapor commit'i haric)
- 0 schema/migration/env/npm install
- Madde 21 disiplini tam uygulandı (Madde 21.2 + 21.4 + 21.7)
- Hassas veri (token, parola, müvekkil TC/telefon) bu raporda yer almıyor

---

## BULGU SAYILARI

- 🔴 KRİTİK: 3 (K1, K2, K3)
- 🟡 ORTA: 6 (O1-O6)
- 🟢 DÜŞÜK: 6 (D1-D6)
- ℹ️ NOT: 6 (N1-N6)

— Claude Code, TUR #27 saglik taramasi sonu
