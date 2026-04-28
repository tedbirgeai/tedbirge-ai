# SAGLIK TARAMASI TUR #32 — 28 Nisan 2026 (TUR #28 sonrasi)

> **Tip:** T (Tarama tekrari — Madde 27, kritik tedavi sonrasi zincirleme drift kontrolu)
> **Risk:** SIFIR (0 kod, 0 schema, 0 migration, 0 env, 0 npm)
> **Mimar:** Claude Sonnet 4.6 (28 Nisan ogleden sonra)
> **Kapsam:** TUR #28 sonrasi 11 baslik — backend yapi, migration drift, auth/role, health, apiFetch, web probe, KVKK/OS, env, performans, AccidentCase, Madde 26-32 uyum

---

## OZET — Bitis kaniti durumu

- **Kritik (🔴):** 1 (hedef: 0) — BITIS TANIMI KARSILANMADI
- **Orta (🟡):** 2 (hedef: ≤ 3) — HEDEF KARSILANDI
- **Dusuk (🟢):** 4
- **Not (ℹ️):** 3
- **Madde 26-32 kod tarafı uyumu:** 🟡 Kismi (Madde 29 Render Shell bekliyor, Madde 32 uyari)
- **Performans:** Kabul edilebilir — backend 292-504ms, panel 256-500ms
- **AccidentCase teşhisi:** SENARYO A (panel aktif, backend route yok, DB tablo yok)

**BITIS TANIMI KARSILANDI MI: HAYIR**
- Sebep: K1-TUR32 AccidentCase 🔴 KRITIK acik — canlı 3 avukat "Yeni Vaka Ac" tıklayınca 404/hata alıyor

---

## ADIM 1 — Backend Yapi + TUR #28 Kapsam Dogrulama

**TODO/FIXME sayisi:** 9 (TUR #27 D1 ile aynı — yeni eklenen yok)
- zmss-limits.js:12 — 2011 oncesi ZMSS limitleri
- reconciler.js:28 — handler map bos
- boot.js:42,50,62,67 — 4 stub TODO
- kalem-hesaplari.js:62,444 — 2 TODO
- compensation.engine.v2.js:16,102 — Faz 2 hesap

**PrismaClient singleton ihlali:** 0 (TUR #20 fix geçerli, auditor.js yalnizca detection komutu string olarak tasiyor) ✅

---

## ADIM 2 — Schema vs Production DB drift

**Schema @updatedAt sayisi:** 19
- AccidentCase (line 19) dahil — ama AccidentCase tablosu production DB'de yok
- Production beklentisi: 18 @updatedAt (TUR #28-B'nin 7 ALTER TABLE kanıtı ile tutarli)

**Mehmet Bey Render Shell'de dogrulamali (Madde 29 kanit):**
```sql
SELECT table_name, column_name FROM information_schema.columns 
WHERE column_name = 'updatedAt' AND table_schema = 'public' 
ORDER BY table_name;
```
Beklenen: 18 satir. Daha az ise yeni drift. AccidentCase satirinin olmamasi normal (tablo yok).

```sql
SELECT migration_name, finished_at FROM _prisma_migrations 
WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL;
```
Beklenen: bos set.

---

## ADIM 3 — Auth + Role Middleware Tutarlilik (TUR #28 dogrulama)

**chat.routes.js:** `router.use(authMiddleware)` ✅ — K2 fix kodda mevcut
**sigortaBasvuru.routes.js:** `router.use(authMiddleware)` + TUM route'larda roleMiddleware ✅ — O5 fix kodda mevcut
**muhatapAI.routes.js:** `router.use(authMiddleware)` + her iki POST'ta roleMiddleware ✅ — O6 fix kodda mevcut

TUR #28 FAZ 3 commit'leri (beaf0e8, 47d669d, 890d62b) dogru sekilde uygulanmis.

---

## ADIM 4 — Production Health

- `/health`: **200** ✅ — `{"success":true,"message":"Tedbirge AI API calisiyor"}`
- Backend response: 292-504ms (soguk: 504ms, ilk istek; sicak: 292-357ms) — Render icin kabul edilebilir

**Mehmet Bey Render Logs'a bakacak (son 1 saat):**
Su anahtarlari ara: ERROR, Invalid, P1001, P3005, does not exist, Yetkisiz, boot-failed, Cannot find module

---

## ADIM 5 — Panel apiFetch Standardi (Madde 30)

Raw `fetch()` kullanan dosyalar — hepsi `(public)` klasoru veya public endpoint:
- `AiChatWidget.tsx:45` — `/lexscan/chat` (public endpoint, auth gerektirmez)
- `reset-password/page.tsx:53` — public reset flow
- `basvuru-sorgula/page.tsx:48` — public lead query
- `forgot-password/page.tsx:28` — public auth flow
- `register/musteri/page.tsx:30,69` — public register
- `basvuru/page.tsx:228` — public form submit
- `devam-et/page.tsx:37` — public form devam

**Dashboard/authenticated alanlarda raw fetch ihlali: YOK** ✅
`createAccidentCase()` → `apiFetch('/leads/${leadId}/accident-cases', POST)` — Madde 30 uyumlu ✅

---

## ADIM 6 — Web Yuzu Probe

| URL | Durum |
|---|---|
| https://www.tedbirge.ai/ | **200** ✅ |
| /trafik-kazasi-tazminat | **200** ✅ |
| /is-kazasi-tazminat | **200** ✅ |
| /sigorta-tazminat-reddedildi | **200** ✅ |
| /basvuru | **200** ✅ |
| /iletisim | **200** ✅ |
| /lexscan | **200** ✅ — TUR #28 K3 fix calisiyor |
| /blog | **200** ✅ |
| /kvkk-aydinlatma | **200** ✅ |
| /sitemap.xml | **200** ✅ |
| /robots.txt | **200** ✅ |

**GA4:** `G-7MP4HD08T6: False` 🟡 — TUR #27 O1 hala acik (Mehmet Bey Vercel env aksiyonu bekleniyor)
**GSC:** `True` ✅

---

## ADIM 7 — KVKK + OS Modulleri

**server.js forEach listesi:** 16 modul ✅
```
['auditor', 'healer', 'reporter', 'compliance', 'backup', 'costGuard', 'performance',
 'security', 'pulse', 'maintenance', 'analyzer', 'notifications', 'navigation',
 'insurance', 'uyapControl', 'deploy']
```
TUR #28-E hedefi: 16 — KARSILANDI ✅

**Mehmet Bey Render Shell'de calistiracak — OS islevsel kanit:**
```sql
SELECT type, COUNT(*) FROM "SystemEvent" 
WHERE "createdAt" > NOW() - INTERVAL '1 hour' 
GROUP BY type ORDER BY 2 DESC LIMIT 30;
```
Beklenen: >= 5 tip, compliance.tick + benzeri gorulmeli, toplam >= 50 kayit.
Bos veya 1-2 tip = moduller baslatilmis ama start() cagrisi calismıyor → 🔴 KRITIK olur.

---

## ADIM 8 — 3rd Party ENV + Madde 31 Ortam Izolasyonu

**.env.example:** TUR #27 O2 eksiklikleri KAPALI ✅
- DIRECT_URL ✅, SUPABASE_SERVICE_ROLE_KEY ✅, ADMIN_PHONE ✅, UNSUBSCRIBE_SECRET ✅
- OS_ENABLED ✅, BACKEND_URL ✅, PUBLIC_BASE_URL ✅
- RENDER_API_KEY/SERVICE_ID/HEALTH_URL ✅, VERCEL_API_TOKEN/PROJECT_ID/TEAM_ID ✅
- SLACK_WEBHOOK_URL ✅, OCR_SPACE_API_KEY ✅, ANTHROPIC_MODEL/MAX_TOKENS ✅
- COST_BUDGET_DAILY_USD/MONTHLY_USD ✅, ORACLE_SSH_* (5 degisken) ✅

**Panel API_BASE standardi:** Tum dosyalar `NEXT_PUBLIC_API_BASE_URL` kullanıyor, production fallback dogru ✅
TUR #28 O4 fix dogrulandi.

**Madde 31 ortam izolasyonu:** .env.example DIRECT_URL alanı var + port 5432 migration aciklaması — uyumlu ✅

---

## ADIM 9 — Performans Olcumu

| Endpoint | Olcum 1 | Olcum 2 | Olcum 3 | Ort |
|---|---|---|---|---|
| `/health` (backend) | 504 ms | 357 ms | 292 ms | ~384 ms |
| Anasayfa (panel) | 500 ms | 277 ms | 256 ms | ~344 ms |

**Degerlendirme:** Ilk istek yuksek (Render cold-start veya baglanti kurma). Sonraki istekler 256-357ms — Render Starter plan icin normal. Mehmet Bey'in yavaslik sikayeti muhtemelen cold-start kaynaklı.

**Mehmet Bey Render Dashboard'dan kontrol edecek:**
- Plan tipi (Starter/Standard/Pro?)
- RAM kullanimi ortalama %
- CPU kullanimi ortalama %
- Son ay hata orani %

**Mehmet Bey Supabase Dashboard'dan kontrol edecek:**
- Region: aws-1-ap-southeast-2 (Sydney) dogrulandı mı?
- DB CPU ortalama %
- Slow queries (1s ustü) son 24h: kac adet?

---

## ADIM 10 — AccidentCase Teshisi

**Schema:** Model tanimli — id, leadId, status (DRAFT/EVIDENCE_READY/ANALYZING/COMPLETED/FAILED), summary, analysisData, reportData, createdAt, updatedAt (✅ @updatedAt), analyzedAt, Lead iliskisi, Evidence[] iliskisi.

**Backend:** `GET-ChildItem src/routes` + `grep accidentCase/AccidentCase src/` → **NO MATCHES**
- Hicbir route dosyasi AccidentCase endpoint'i tanimliyor
- `POST /leads/:id/accident-cases` route'u yok

**Panel:** `leads/[id]/page.tsx:318-333` — AKTIF KULLANIM
```javascript
const r = await apiFetch(`/leads/${leadId}/accident-cases`, {
  method: "POST",
  body: JSON.stringify({ description: "Panel uzerinden acildi" }),
});
```
UI: "Yeni Vaka Ac" butonu, accidentCase state, durum gostergesi — hepsi canlı avukat panelinde gorunur.

**Production DB:** TUR #28 OTONOM_RAPOR kanıtı — AccidentCase tablosu MEVCUT DEGIL (0 row in information_schema.tables).

**SENARYO: A** — Panel aktif kullaniyor (apiFetch ile, Madde 30 uyumlu), backend route eksik, DB tablo eksik.
Avukat "Yeni Vaka Ac"a tiklayinca → POST /api/leads/:id/accident-cases → 404 → "Vaka acilamadi" hatası.
**→ 🔴 KRITIK KIRMIZI NOKTA: CREATE TABLE + backend CRUD route'ları mimar onayi ile yazilmali.**

---

## 🔴 KRITIK

### K1-TUR32 — AccidentCase: Panel aktif, backend route yok, DB tablo yok
- **Dosya:** `tedbirge-panel/app/(panel)/leads/[id]/page.tsx:318-333`
- **Kod:**
  ```javascript
  apiFetch(`/leads/${leadId}/accident-cases`, { method: "POST" }) // 404 donuyor
  ```
- **Risk:** 3 aktif avukat panelinde "Yeni Vaka Ac" butonu 404/hata uretmekte. Kaza vakasi analizi akisi tamamen bozuk.
- **Onerilen kesit:** Mimar oturumu → AccidentCase CREATE TABLE (KIRMIZI nokta) + backend CRUD endpoints + Evidence model.
- **Not:** TUR #28 OTONOM_RAPOR'da "Mehmet Bey direktifi ile dokunulmadı" kaydi var. Karar bekliyor.

---

## 🟡 ORTA

### O1-TUR32 — GA4 production'da hala pasif (NEXT_PUBLIC_GA4_ID Vercel'e girilmemis)
- **Probe:** `G-7MP4HD08T6: False` (TUR #27 ile aynı)
- **Aksiyon:** Mehmet Bey → Vercel dashboard → tedbirge-panel → Environment Variables → NEXT_PUBLIC_GA4_ID = G-7MP4HD08T6
- **Etki:** Madde 25.10 ölcum disiplini — GA4 olmadan kampanya ROI olculemiyor.
- **Sure:** 5 dakika (Mehmet Bey aksiyon).

### O2-TUR32 — Anayasa boyutu 65KB — Madde 32 esigi asildi
- **Kanit:** CLAUDE.md = 65,815 byte ≈ 63,000 karakter
- **Esik:** Madde 32.2 > 60,000 → "modul ayırımı" (anayasa/disiplin/, anayasa/teknik/, vb.)
- **Aksiyon:** Mimar oturumunda CLAUDE_OZET.md hazırlanmalı + anayasa modul yapısı planlanmalı.
- **Versiyon etki:** Madde 32.4 — MINOR guncelleme gerekecek.

---

## 🟢 DUSUK

- **D1-TUR32:** 9 backend TODO — TUR #27 D1 ile aynı, yeni eklenen yok (AI Analiz Doğruluk kesitine girer)
- **D2-TUR32:** OS SystemEvent kaniti Render Shell bekliyor — 16 modul kod tarafında kayıtlı ama işlevsel çalışma doğrulanmadı (Mehmet Bey ADIM 7 sorgusu ile netleştirecek)
- **D3-TUR32:** reconciler.js:28 handler map hala bos — "TODO: pulse/backup/maintenance modulleri eklendikce doldurulacak" (TASK_QUEUE'da)
- **D4-TUR32:** /cerez-politikasi, /kullanim-kosullari, /gizlilik sayfaları bu turda probe edilmedi (kapsam dışı tutuldu — TUR #25 FAZ 1'de olusturulmustu)

---

## ℹ️ NOT

- **N1-TUR32:** Schema @updatedAt sayisi 19 (AccidentCase dahil) — production'da 18 olmali (AccidentCase tablo yok). TUR #28-B kanıtıyla tutarlı.
- **N2-TUR32:** Panel tüm raw fetch() çağrıları (public) klasorundeki public endpoint'lere gidiyor — Madde 30 ihlali YOK. createAccidentCase() zaten apiFetch kullaniyor.
- **N3-TUR32:** Performance kabul edilebilir — cold-start spike (504ms) normal, sonraki istekler 256-357ms. Mehmet Bey yavaslik sikayetinin Render cold-start veya DB sorgu kaynaklı olduğu değerlendirilmeli.

---

## Madde 26-32 Kod Uyumu Tablosu

| Madde | Icerik | Durum | Kanit |
|---|---|---|---|
| 26 | Otonom devir (CLAUDE.md + raporlar okundu) | ✅ | Bu tur basında |
| 27 | Saglik periyodikliği (TUR #28 sonrası tekrar) | ✅ | Bu rapor |
| 28 | T tipi onay (sifir yazma operasyonu) | ✅ | 0 kod commit |
| 29 | Migration kanıtı | 🟡 | Render Shell dogrulamasi bekliyor (ADIM 2 sorguları) |
| 30 | apiFetch standardı | ✅ | ADIM 5 — dashboard alanında ihlal yok |
| 31 | Ortam izolasyonu | ✅ | .env.example DIRECT_URL mevcut, dev/prod ayrımı net |
| 32 | Anayasa boyutu | 🟡 UYARI | 65,815 byte > 60,000 char esigi — modul ayarımı mimar kararı |

---

## Performans Olcumu

| Kaynak | Min | Max | Ort | Deger |
|---|---|---|---|---|
| Backend /health | 292 ms | 504 ms | 384 ms | Kabul edilebilir |
| Panel anasayfa | 256 ms | 500 ms | 344 ms | Kabul edilebilir |

Render dashboard + Supabase slow query raporu: Mehmet Bey aksiyonu (ADIM 9 aciklamasi).

---

## Mehmet Bey Calistiracak

### 1. Render Shell — Zorunlu (Madde 29 kanit)
```sql
-- Migration drift kontrolu:
SELECT table_name, column_name FROM information_schema.columns 
WHERE column_name = 'updatedAt' AND table_schema = 'public' 
ORDER BY table_name;
-- Beklenen: 18 satir (AccidentCase haric)

SELECT migration_name, finished_at FROM _prisma_migrations 
WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL;
-- Beklenen: bos set

-- OS modulleri islevsel kanit:
SELECT type, COUNT(*) FROM "SystemEvent" 
WHERE "createdAt" > NOW() - INTERVAL '1 hour' 
GROUP BY type ORDER BY 2 DESC LIMIT 30;
-- Beklenen: >= 5 tip, compliance/backup/performance tick'leri gorulmeli
```

### 2. Render Logs (son 1 saat)
Su kelimeleri ara: ERROR, P1001, P3005, does not exist, Yetkisiz, boot-failed, Cannot find module

### 3. Vercel Dashboard (5 dakika aksiyon)
tedbirge-panel → Settings → Environment Variables → `NEXT_PUBLIC_GA4_ID` = G-7MP4HD08T6 ekle
→ Redeploy tetikle → GA4 aktif hale gelecek (O1-TUR32 kapanir)

### 4. Render Dashboard
Plan tipi + RAM % + CPU % ortalama not al

### 5. Supabase Dashboard
Region + DB CPU % + slow queries (1s üstü, son 24h) not al

---

## DOKUNULMADI

- 0 kod degisikligi
- 0 commit (rapor + OTONOM_RAPOR haric)
- 0 schema / 0 migration / 0 env / 0 npm install
- Madde 21 + 27 + 28 disiplini tam uygulandı
- Hassas veri (token, PII, DATABASE_URL, API key) bu raporda yer almıyor

---

## BITIS TANIMI KONTROLU

**Hedef:** 🔴 KRİTİK = 0 + 🟡 ORTA ≤ 3 + Madde 26-32 kod tarafı uyum

| Kriter | Hedef | Sonuc |
|---|---|---|
| 🔴 KRITIK sayisi | 0 | **1** (AccidentCase) |
| 🟡 ORTA sayisi | ≤ 3 | 2 ✅ |
| Madde 26-32 uyumu | Tam | Kismi (29 + 32 bekliyor) |

**BITIS TANIMI: KARSILANMADI**

FAZ 4-B (blog icerik) henuz baslatılamaz.
Sıradaki: Mimar oturumu → AccidentCase TUR #29 (KIRMIZI nokta — Mehmet Bey onayı şart).

— Claude Code, TUR #32 saglik taramasi tekrari sonu, anayasa v1.7.0
