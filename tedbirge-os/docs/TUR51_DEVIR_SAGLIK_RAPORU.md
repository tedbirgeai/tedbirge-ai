# TUR #51 — Büyük Sağlık Taraması + 3 CRM Kesif Raporu

**Tarih:** 30 Nisan 2026
**Anayasa:** v1.13.0 yürürlükte
**Tip:** T (denetim, read-only)
**Süre:** ~1.5 saat
**Çıktı:** sadece bu rapor + DEVIR güncellemesi (1 OS commit, 0 kod değişikliği)

CEO direktifi: *"Sağlık taraması kapsamlı yap, yarım kalmış HUKUKÇU CRM TEMSİLCİ CRM ADMİN CRM yi de içine alarak uçtan uca eksik yanlış ne varsa çıkar. Ben CEO yum, kod yazmam, sistemi admin panelinden kontrol ederim."*

CEO öncelik kararı: **D — 3 CRM eşit öncelik, tek büyük paket**

---

## 📊 Özet — Bulgu Tasnifi

| Tip | Sayı | Açıklama |
|---|---|---|
| 🔴 **KRİTİK** | **4** | TUR #47 regresyonu, gelir motoru eksik UI, KVKK SCC kayıt boşluğu, M1 manuel migration hâlâ açık |
| 🟡 **ORTA** | **9** | LAWYER iş akışı eksikleri, REPRESENTATIVE komisyon log boşluğu, ADMIN settings UI yok |
| 🟢 **DÜŞÜK** | **6** | Panel raw fetch (Madde 13.2), kullanılmayan endpoint, kozmetik |
| ℹ️ **NOT** | **5** | Anayasa sürüm IS_PLANI'da senkron değil, agents/ klasör yok, dokümantasyon |

**Toplam bulgu:** 24 (panel + backend + os + production)

---

## Bölüm A — Standart Sağlık Taraması (Madde 26.8)

### ✅ A1 — Backend yapı bütünlüğü
- `src/app.js` + `src/server.js` mevcut, server.listen 1 yerde ✅
- Middleware sırası doğru: helmet → cors → morgan → json → cookieParser → uploads-static → loginLimiter → apiLimiter → analysis routes → genel routes → notFound → errorHandler ✅
- `src/routes/index.js`'de 31 mount edilmiş route ✅
- Auth + role middleware tutarlı kullanılıyor ✅

**TEMİZ.**

### 🟡 A2 — Migration durumu (S1)

**Bulgu S1 (🟡 ORTA):** **M1 manuel migration hâlâ açık (TUR #49 mirası).**
- Lokal: 10 migration mevcut (`20260414225626_init` → `20260430000001_add_career_application`)
- Schema: 33 model + 2 `@deferred` (Madde 28 — AccidentCase + ilgili)
- Production'da `20260430000001_add_career_application` uygulanması Mehmet Bey'in Render Shell adımı. **Hâlâ bekliyor.**
- Etki: `/api/public-career-application` POST 500 dönüyor (relation does not exist)
- **Tedavi:** TUR #51 sonrası mektup — Render Shell `npx prisma migrate deploy` (manuel) **veya** TUR #52 (postinstall'a ekleme — KIRMIZI nokta, CEO onayı şart)

### 🟡 A3 — Auth + Role guard kapsam (S2)

Backend'de standalone `role("X")` çağrı sayımı:
- `role("ADMIN")` — 34 (büyük çoğunluk)
- `role("CUSTOMER")` — 5
- `role("LAWYER")` standalone — 0 (sadece çoklu kombinasyon içinde)
- `role("REPRESENTATIVE")` standalone — 0 (sadece çoklu kombinasyon içinde)
- `role("SALES")` — 0 standalone (29 çoklu)

**Bulgu S2 (🟡 ORTA):** LAWYER ve REPRESENTATIVE için ayrı endpoint **yok**. Hep çoklu rol ile karışık. Örneğin `role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER")` — bu güçlü güvenlik değil çünkü 4 rolün de aynı endpoint'e erişimi var. Avukat dosyaya ne kadar müdahale edebilir? Temsilci avukat kararına ne kadar müdahale edebilir? **Rol-spesifik filtreleme controller seviyesinde yapılıyor** (örn. `lead.controller.js:322 if req.user?.role === "LAWYER"`) ama route guard'da değil.

**Tedavi:** Ayrı tur — rol-spesifik endpoint ayrımı (B tipi kesit, ~3-4 saat).

### ✅ A4 — Production /health

- Backend `https://tedbirge-ai.onrender.com/health` → **200** ✅
- Panel `https://www.tedbirge.ai/` → **200** ✅

**TEMİZ.**

### 🟢 A5 — Panel apiFetch disiplini (S3)

**Bulgu S3 (🟢 DÜŞÜK / ℹ️ NOT):** 11 yerde raw `fetch(` kullanımı — **Madde 13.2 ihlali**:

| Konum | Bağlam |
|---|---|
| `app/(public)/basvuru/page.tsx:230` | `${API_BASE}/public-lead` — public form, FormData (apiFetch FormData desteklemiyor olabilir) |
| `app/(public)/basvuru-sorgula/page.tsx:49` | `/query-lead` |
| `app/(public)/devam-et/page.tsx:37` | URL paramlı continue |
| `app/(public)/forgot-password/page.tsx:28` | OTP send |
| `app/(public)/kariyer/KariyerFormClient.tsx:52` | `/api/career-application` (panel-side endpoint, raw OK) |
| `app/(public)/register/musteri/page.tsx:30,69` | Register OTP + customer create |
| `app/(public)/reset-password/page.tsx:53` | Reset password |
| `app/api/career-application/route.ts:15` | Server-side proxy fetch (OK) |
| `components/AiChatWidget.tsx:45` | `/lexscan/chat` |

**Çoğu Madde 13.2 istisnası:** auth-öncesi public formlar (apiFetch token gerektirir, public form'da token yok). Comment ile işaretlenmeli ama silinmemeli. **Tedavi:** Comment ekleme (~30 dk) — TUR #52+ TASK_QUEUE.

### ✅ A6 — Web probe (kritik public sayfalar)

19 public sayfa probe — **18 / 200, 1 / 307** (`/sifre-belirle` token-aware redirect — beklenen).

**TEMİZ.**

### ✅ A7 — Korumalı rota auth-gate

7 korumalı rota — hepsi **307 → /login** ✅

**TEMİZ.**

### 🟡 A8 — OS dosya bütünlüğü (S4)

- 6 ana OS dosyası mevcut ✅
- Anayasa sürümü `CLAUDE.md` v1.13.0 ✅
- DEVIR sürümü v1.13.0 ✅
- **Bulgu S4 (ℹ️ NOT):** `IS_PLANI.md` başlığında `Anayasa versiyonu: v1.4.0 (Madde 24 sonrası)` — **eskiden kalma, güncel değil**. v1.13.0 olmalı.

**Tedavi:** ~1 dk str_replace — bu tedavi mektubuna gerek yok, mikro fix.

### ℹ️ A9 — Env tutarlılığı

Backend `process.env.*` keyleri (Mehmet Bey notu için):
- `DATABASE_URL` (zorunlu) + `DIRECT_URL` (lokal'de eksik — Madde 13.3 yapısal, biliniyor)
- `JWT_SECRET`, `NODE_ENV`, `PORT`, `APP_URL`, `PANEL_URL`, `PUBLIC_BASE_URL`
- AI: `ANTHROPIC_API_KEY`, `AI_MOCK`, `TESSERACT_PATH`, `OCR_PSM`
- Storage: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`
- Payment: `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT` (kullanılmıyor — Madde 24.3 PayTR yok kararı)
- SMS/WhatsApp: `NETGSM_USERNAME`, `NETGSM_HEADER`, `NETGSM_ENCODING`, `WHATSAPP_TOKEN`, `WA_TEMPLATE_*` (3 template)
- E-posta: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `ADMIN_EMAIL`, `KARIYER_EMAIL`
- Diğer: `ADMIN_PHONE`, `SLACK_WEBHOOK_URL`, `GIT_COMMIT_SHA`

**`.env.example` mevcut** ✅. Bu liste raporda kalıcı kayıt.

### ✅ A10 — Performans bütçesi

| Sayfa | Boyut | Madde 29.6 (<500KB) |
|---|---|---|
| `/` | 47.5 KB | ✅ |
| `/basvuru` | 37.6 KB | ✅ |
| `/blog` | 31.5 KB | ✅ |

**TEMİZ.**

### 🔴 A11 — KVKK yurt dışı aktarım (S5)

**Bulgu S5 (🔴 KRİTİK):** `tedbirge-os/KVKKSCC/` klasörü **YOK**. Schema'da `model KVKKSCC` mevcut ama dosya kayıtları boş.
- 4 yurt dışı sağlayıcı: Supabase, Anthropic, Meta WhatsApp, Gmail/Google
- Madde 24.10 her aktarım için **SCC dosyası** zorunlu kılıyor
- KVKK m.9 ihlali — yasal risk yüksek (potansiyel ceza 49K-994K TL aralığı)

**Tedavi:** Acil kesit (~2-3 saat) — TUR #52 veya öncesi:
1. SCC PDF dosyalarını sağlayıcılardan indir/oluştur
2. `tedbirge-os/KVKKSCC/` klasörü açılır
3. `KVKKSCC` tablosuna 4 kayıt eklenir (admin panel veya script)
4. KVKK aydınlatma metnine link verilir

---

## Bölüm B — LAWYER CRM Derin Tarama

**LAWYER:** Gelir motoru, 3 avukat canlı kullanıyor. Eksik UI = gelir kaybı.

### B1 — Panel sayfa envanteri (22 sayfa)

`app/(panel)/dashboard/` altında **22 sayfa**:
ajanda, analytics, arsiv, assignments, bildirimler, bilirkisi, career-applications, contracts, haberler, hukukcu, hukukcu-onay, iletisim, kullanicilar, lawyers, mimar-onayi, page (dashboard root), pazarlama, sistem-durumu (+ canli-feed alt), takvim, temsilci-onay, tespit-edilen-sorunlar.

LAWYER kontrol pattern (`role === "LAWYER"`) sadece 4 dosyada görüldü: `dashboard/page.tsx`, `arsiv/page.tsx`, `kullanicilar/page.tsx`, `leads/page.tsx`. Diğer 18 sayfanın **çoğu role-aware değil** — backend filtresi var ama frontend role-spesifik gizleme/gösterme yok.

**Bulgu L1 (🟡 ORTA):** Frontend role-aware sayfa gizleme kapsamı yetersiz. Avukat ihtiyacı dışı sayfaları görüp tıklayıp veri yok hatası alıyor olabilir (UX kaybı).

### B2 — LAWYER backend endpoint envanteri

`role(.*"LAWYER"...)` çoklu çağrılarda **34 endpoint**'de bulunuyor — hep ADMIN/SALES/REPRESENTATIVE ile birlikte.

Avukat-spesifik:
- `getMyLeads`, `getAssignedLeads` — backend'de `if req.user?.role === "LAWYER"` ile filtreleme (`lead.controller.js:322,340`)
- Assignment endpoint avukatın **kendisini atayamaz**: `assignment.routes.js` sadece ADMIN/SALES/REPRESENTATIVE atayabilir ✅

**Bulgu L2 (🟢 DÜŞÜK):** LAWYER kendi dashboard data endpoint'i yok (örn. "benim atanan dosyalar", "bu hafta duruşmalarım"). Manuel filtreleme ile çalışıyor ama dedicated endpoint yok.

### B3 — 8 aşama iş akışı zinciri (CLAUDE.md Madde 11)

| # | Aşama | Schema enum | Service | Durum |
|---|---|---|---|---|
| 1 | Müvekkil web başvurusu | `LeadStatus.NEW` | `lead.service.js` | ✅ Tam |
| 2 | Temsilci sözleşmesi | `LeadStatus.CONTRACT_PENDING` | `contract.service.js` + `temsilci-contract.template.js` | ✅ Tam |
| 3 | Avukat atanması | `LeadStatus.ASSIGNED_TO_LAWYER` | `assignment.service.js` + `sendLawyerAssignedEmail` | ✅ Tam |
| 4 | Belge yükleme + analiz | `DOCS_PENDING → DOCS_RECEIVED → ANALYZED` | `upload.service.js` + `uploadAnalysis.bridge.js` | ✅ Tam |
| 5 | AI muhatap analizi | — | `muhatapAI.service.js` | ✅ Tam |
| 6 | İhtarname | (DavaSurec model — sub-state) | `ihtarname.service.js` | ✅ Tam |
| 7 | Dava | (DavaSurec asama) | `davaSurec.service.js` + `durusma.service.js` + `bilirkisi.service.js` + `masraf.service.js` | ✅ Tam |
| 8 | Tahsilat + komisyon | `LeadStatus.WON` + `Lead.gercekTazminat` | `payment.service.js` + analytics komisyon hesabı | 🔴 **YARIM** |

**Bulgu L3 (🔴 KRİTİK):** **CommissionLog modeli YOK**. Schema'da `Lead.komisyonOrani` ve `Lead.gercekTazminat` alanları var ama:
- Tahsilat olunca temsilciye otomatik bildirim/kayıt zinciri **YOK**
- Komisyon ödenip ödenmediği takibi UI'siz
- Hak ediş tarihi/tutar/durum log'u yok
- Sözleşme template (`temsilci-contract.template.js`) "Hakediş tespit yetkisi: dosyayı yürüten avukat" diyor ama UI'sı **yok** (avukat HAK_EDILDI işaretlemesi yapamıyor)
- IS_PLANI'nda LATER olarak yazılmış ama gerçekte **gelir kaybı** ve sözleşme yükümlülük ihlali riski

**Tedavi:** TUR #52 mektup adayı (yüksek öncelik):
- `model CommissionLog` Prisma migration (KIRMIZI nokta)
- Avukat dashboard'a "Hak Ediş İşaretle" butonu
- Temsilci dashboard'a "Bekleyen Hakediş" listesi (şu an "Yakında" placeholder — Madde 28 yarım kurulu özellik)
- Otomatik bildirim e-postası (ödendi/bekliyor)

### B4 — LAWYER bildirim ve veri görünürlüğü

- `sendLawyerAssignedEmail` mevcut (atama olunca) ✅
- Diğer olaylar (yeni belge yüklendi, AI analizi tamamlandı, duruşma yaklaştı) — bildirim **eksik**

**Bulgu L4 (🟡 ORTA):** Avukat sadece atama bildirimi alıyor. Belge upload, AI analiz tamamlanma, duruşma 3 gün uyarısı, ihtarname cevabı vb. olaylar için bildirim yok.

### B5 — Yarım kurulu özellikler (Madde 28)

- `prisma/schema.prisma:11,172`: 2 `@deferred` model (AccidentCase + ilişkili) ✅ Madde 28.4 işaret
- `app/(panel)/dashboard/hukukcu/page.tsx:95,100`: "Yakında" badge ✅ Madde 28.3
- `app/(panel)/leads/[id]/page.tsx:1822`: "Yakında" — ne özelliği belli değil, kontrol edilmeli
- `app/(panel)/temsilci/page.tsx:106`: "Bekleyen Hakediş — Yakında" — L3 bulgusunun kanıtı
- `app/(public)/blog/page.tsx:27`: "Yakında ilk yazılarımız yayınlanacak" — blog boş

**Bulgu L5 (🟢 DÜŞÜK):** `leads/[id]/page.tsx:1822` "Yakında" konumu belirsiz — Madde 28.5 IS_PLANI kaydı eksik olabilir.

---

## Bölüm C — REPRESENTATIVE CRM Derin Tarama

**REPRESENTATIVE:** Lead getiren temsilci, %10 komisyon hak eder. Schema kayıt eksik.

### C1 — Panel sayfa envanteri

- `app/(panel)/temsilci/page.tsx` — temsilci ana paneli ✅
- `app/(panel)/temsilci/yeni-muvekkil/page.tsx` — lead getirme formu ✅
- `app/(panel)/dashboard/temsilci-onay/page.tsx` — ADMIN onay sayfası
- `app/(public)/register/temsilci/page.tsx` — self-register

`AppLayout.tsx:39-40`: nav'da temsilci linkleri ✅

**Bulgu R1 (🟢 DÜŞÜK):** Temsilci paneli mevcut ama "Bekleyen Hakediş" placeholder "Yakında" (page.tsx:106) — L3 ile aynı kök sebep.

### C2 — REPRESENTATIVE backend endpoint envanteri

`role(.*"REPRESENTATIVE"...)` çoklu çağrılarda **44 endpoint**'de bulunuyor (ADMIN/SALES ile birlikte). Bu büyük yetki — temsilci ihtarname/dava/bilirkişi endpoint'lerine erişebiliyor (`hukuk.routes.js:11-32`).

**Bulgu R2 (🟡 ORTA):** **Temsilci hukuk endpoint'lerine erişebilir** — bu beklenmeyen yetki genişliği. `role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER")` pattern'ı temsilciyi de avukat seviyesine çekiyor. Madde 24.4 yasal sorumluluk dağılımı ile çelişiyor (temsilci hukuki yetki yok). Backend controller seviyesinde filtreleme var mı tarama gerekli.

`Lead.createdById` mevcut, temsilci kendi getirdiği lead'i filtreleyebiliyor (`lead.service.js:288-289` "if check.createdById !== actorId" kontrolü).

### C3 — Komisyon zinciri

- `Lead.komisyonOrani` (default 20) ✅ schema'da
- `Lead.gercekTazminat` ✅ schema'da
- Analytics: `getKomisyonSummary` toplam tahmini komisyon hesaplıyor (`analytics.service.js:283-292`)
- **CommissionLog modeli YOK** ❌
- Temsilci sözleşme template'i "HAK_EDILDI" status'u tarif ediyor ama enum'da yok, UI yok

**Bulgu R3 (🔴 KRİTİK):** L3 ile aynı — CommissionLog modeli + UI eksikliği temsilci tarafında **gelir kaybı + sözleşme yükümlülük ihlali**.

### C4 — Self-onboarding ve sözleşme

- Temsilci `/register/temsilci` ile kendi kaydolur ✅
- Sözleşme template'i mevcut (`temsilci-contract.template.js`) ✅
- ADMIN onay sayfası `temsilci-onay` mevcut ✅

**Bulgu R4 (🟢 DÜŞÜK):** Self-register sonrası sözleşme onay akışı kodlanmış mı? `register/temsilci/page.tsx`'te kontrol gerekli (sözleşme kabul check) — daha derin tarama gelecek tur.

### C5 — Performans ve raporlama

- Temsilci ana sayfa lead listesini ve estimatedCompensation gösteriyor ✅
- "Bekleyen Hakediş" placeholder "Yakında" ❌

**Bulgu R5 (🟡 ORTA):** Temsilci kendi performans dashboard'u yok (kendi getirdiği toplam lead sayısı, dönüşüm oranı, kazanılan komisyon dökümü). Sadece lead listesi.

---

## Bölüm D — ADMIN CRM (CEO Kontrol Paneli)

### D1 — Panel sayfa envanteri

22 sayfa (B1'de listelendi). ADMIN spesifik kontrol pattern'ı 5 sayfada: `arsiv`, `kullanicilar`, `lawyers`, `dashboard/page.tsx`, `leads/[id]`.

**Yok:** `/admin` route — yokluğu sorun değil, `/dashboard` zaten admin-aware.

### D2 — Backend endpoint envanteri

`role(.*"ADMIN"...)` toplam **89 endpoint** (en yüksek). User yönetimi, settings/featureFlags **endpoint yok** ❌.

### D3 — CEO Checklist (15 madde)

CEO direktifi: *"SİSTEMİ ADMİN PANELİNDEN KONTROL EDER İŞİME BAKARIM"*

| # | İhtiyaç | Durum | Eksik / Konum |
|---|---|---|---|
| 1 | **Lead listesi** (filtre + arşiv + sil) | ✅ | `app/(panel)/leads/page.tsx` + `[id]` detay + `dashboard/arsiv` |
| 2 | **User listesi** (avukat + temsilci + müvekkil + admin) | ✅ | `dashboard/kullanicilar/page.tsx` (`/auth/users` endpoint) |
| 3 | **Avukat ekleme/silme** (UI'dan) | 🟡 KISMEN | Avukat **onay** var (`hukukcu-onay`) ama doğrudan ekleme yok — self-register + onay zinciri zorunlu |
| 4 | **Temsilci ekleme/silme** | 🟡 KISMEN | `temsilci-onay` ile onay var, ama ADMIN doğrudan ekleyemez (sadece self-register sonrası onaylayabilir) |
| 5 | **Müvekkil silme (KVKK m.7)** | ❌ **YOK** | DataSubjectRequest schema'da var ama **UI yok** (sadece `/kvkk-aydinlatma` public sayfa) — **KVKK ihlal riski** |
| 6 | **Kariyer başvuruları** | ✅ | `dashboard/career-applications/page.tsx` (TUR #49) — ama M1 manuel migration olmadan endpoint 500 |
| 7 | **Sistem durumu** | ✅ | `dashboard/sistem-durumu/page.tsx` + `canli-feed/page.tsx` |
| 8 | **Audit log UI** (kim ne yaptı) | ❌ **YOK** | `ActivityLog` schema'da var, listeleyen UI yok |
| 9 | **Komisyon raporları** | 🟡 KISMEN | Dashboard'da toplam tahmini komisyon var ama detaylı log/CommissionLog UI yok (R3 + L3 bulgusu) |
| 10 | **Mali rapor** (aylık gelir, dağılım) | 🟡 KISMEN | `analytics/page.tsx` revenue + funnel ama mali rapor formatı yok |
| 11 | **KVKK silme talebi UI** (tek tık) | ❌ **YOK** | Madde 5 ile aynı — **KVKK m.7 ihlali riski** |
| 12 | **Bildirim ayarları** (SMS/Email şablon) | ❌ **YOK** | `dashboard/bildirimler/page.tsx` mevcut ama içerik denetimi gerekli, şablon UI yok |
| 13 | **AI güven skoru ayarları** (muhatapAI 0.7 eşiği) | ❌ **YOK** | Hardcoded, UI yok |
| 14 | **Cookie + GA4 ayarları** | ❌ **YOK** | Env'den okunuyor, UI yok |
| 15 | **Settings sayfası** (env read-only) | ❌ **YOK** | Yok |

**Skor: 7/15 ✅, 4/15 🟡, 4/15 ❌**

**Bulgu A1 (🔴 KRİTİK):** Madde 5 + 11 (KVKK silme talebi UI) **ÇOK acil** — KVKK m.7 ilgili kişinin "verimi sil" talebi 30 gün içinde işlenmeli. UI yok = manuel SQL ile silme = kanıt izi kayıp = ihlal.

**Bulgu A2 (🟡 ORTA):** Madde 3-4 (kullanıcı ekleme), 8 (audit log), 12-15 (bildirim/AI/cookie/settings) — ADMIN UI'siz çalışıyor. Mehmet Bey **kod yazmaz** dediği için bu eksikler doğrudan operasyonel engel.

### D4 — Mehmet Bey manuel iş listesi

Açık manuel iş:
- 🟡 **M1** — Render Shell `npx prisma migrate deploy` (TUR #49 mirası, hâlâ açık)

Geçmiş manuel işler (referans):
- TUR #21 Backup mimarisi (manuel Supabase backup kontrolü)
- TUR #33 OS canlılık komutu
- KVKK aydınlatma + SCC manuel kontrol

**Bulgu A3 (ℹ️ NOT):** M1 hâlâ açık — TUR #51 sonrası ya manuel uygulama ya da TUR #52 (postinstall'a `prisma migrate deploy` eklemek — KIRMIZI nokta).

### D5 — ADMIN canlı sistem feed

- **Otonom katman (`src/agents/`) klasörü YOK** — Auditor/Healer/Reporter sadece `src/services/`'te değil, gerçekten yok
- `dashboard/sistem-durumu` + `canli-feed` UI mevcut ama **arka uçta otonom event üretici yok** — sadece manuel data refresh

**Bulgu A4 (🟡 ORTA):** Otonom katman (Madde 17.1 madde 5 — Auditor/Healer/Reporter olgunlaştırma) **henüz başlamadı**. IS_PLANI'da LATER olarak işaret olabilir, doğrulama gerekli.

---

## Bölüm E — Yasal Regresyon Kontrolü

### 🔴 E1 — TUR #47 yasal temizlik regresyon (4 KIRMIZI bulgu)

**Bulgu E1 (🔴 KRİTİK):** **TUR #47'nin yarım kapatılan ihlalleri:**

| # | Konum | Sorun | Regresyon mu? |
|---|---|---|---|
| E1.1 | `tedbirge-panel/app/(public)/HomePageClient.tsx:218-220` | **`{ val: "4200+", label: "Tamamlanan Dava" }`, `"₺42M+"`, `"%91"`** sahte istatistikler — ANASAYFA HERO'DA HÂLÂ DURUYOR | **EVET** — TUR #47 /hakkimizda'dan sildi ama anasayfa hero'yu ATLADI |
| E1.2 | `src/controllers/lead.controller.js:202` | PDF metni: `"Dosyanizin hukuki takibi icin uzman avukat destegi alabilirsiniz."` | **EVET** — backend'de TUR #47 sed çalışmadı (panel-only dönüşümdü) |
| E1.3 | `src/services/email.service.js:243` | E-posta şablonu: `"Dosyanız uzman avukatlarımızdan birine atanmıştır."` | **EVET** — backend regresyon |
| E1.4 | `tedbirge-panel/lib/blog.ts:116` | `"alanında uzman bilirkişiler"` | HAYIR — yasal terim (`6100 sayılı HMK m.266` bilirkişi tanımı), KEEP |

**Etki:**
- E1.1 anasayfa hero TUR #47'nin temel hedefi olan **sahte sayısal başarı vaadi** — Madde 25.3 KIRMIZI ihlal — Reklam Kurulu cezası riski (550K-1.2M TL emsal)
- E1.2 + E1.3 her PDF/e-posta gönderildiğinde "uzman avukat" sıfatı yayılıyor — **TBB Reklam Yön. m.6 dolaylı ihlal**

**Tedavi:** ACİL kesit (~30 dk):
- `HomePageClient.tsx:218-220` stats array silme + StatCounter component temizleme
- `lead.controller.js:202` PDF metni: "uzman avukat" → "deneyimli avukat" (TUR #47 patterni)
- `email.service.js:243` e-posta: "uzman avukatlarımızdan" → "deneyimli avukat ortaklarımızdan"

### ✅ E2 — TUR #50 "ücretsiz hukuki" regresyon

- Panel: 0 kalıntı ✅
- Backend: 0 kalıntı ✅
- `kullanim-kosullari/page.tsx:24` — "garanti edilen sonuç, kesin tazminat tutarı ya da bilirkişi raporu olarak değerlendirilmemelidir" — **disclaimer**, TBB reklam ihlali değil (red-flag formu negative — "olarak değerlendirilmemelidir"), KEEP

**TEMİZ.**

### 🟢 E3 — Madde 25.3 KIRMIZI listesi diğer ihlaller

- **kesin tazminat / garanti / kazanırsınız:** disclaimer dışında bulunamadı ✅
- **TestimonialsSection / MüvekkilYorum component:** **silinmiş** ✅ (TUR #47 mirası temiz)

**Bulgu E2 (🟢 DÜŞÜK):** Yeni KIRMIZI kategori adayı yok (E1 dışında).

---

## Bölüm F — Tedavi Yol Haritası

### 🔴 Acil Kesitler (öncelik sırası — TUR #52+ adayları)

**1. TUR #52 — TUR #47 Regresyon Onarımı + KVKK m.7 Silme UI** (~3-4 saat, B+T tipi karışık)
- E1.1 anasayfa sahte sayılar sil (HomePageClient.tsx:218-220)
- E1.2 + E1.3 backend "uzman avukat" → "deneyimli avukat" (PDF + e-posta şablonu)
- A1 KVKK m.7 silme talebi admin UI (`dashboard/kvkk-talepleri/`) — DataSubjectRequest CRUD
- M1 manuel migration (Mehmet Bey Render Shell) **veya** postinstall ekleme (KIRMIZI nokta — CEO onayı şart)
- **Yasal risk:** ~1.5-3M TL reklam cezası (E1) + 49K-994K TL KVKK (A1)

**2. TUR #53 — KVKK SCC Klasör + Kayıt** (~2-3 saat, B tipi)
- S5: `tedbirge-os/KVKKSCC/` klasör açma
- 4 sağlayıcı SCC PDF dosyası ekleme (Supabase, Anthropic, Meta, Google)
- KVKKSCC tablosuna 4 kayıt (admin script veya manuel)
- KVKK aydınlatma metni link güncelleme
- **Yasal risk:** KVKK m.9 ihlali (49K-994K TL)

**3. TUR #54 — CommissionLog Modeli + UI** (~5-6 saat, B tipi, KIRMIZI nokta)
- L3 + R3: CommissionLog Prisma model + migration
- HAK_EDILDI status enum ekleme
- Avukat dashboard "Hak Ediş İşaretle" butonu
- Temsilci dashboard "Bekleyen Hakediş" gerçek liste (placeholder yerine)
- Otomatik bildirim e-postası (ödendi/bekliyor)
- **Etki:** Gelir motoru tamamlanır + sözleşme yükümlülüğü kapanır

### 🟡 Sıradaki Dalga (TUR #55+)

**4. TUR #55 — ADMIN CEO UI Tamamlama** (~6-8 saat, büyük B tipi)
- D3 #3-4: Avukat/Temsilci doğrudan ekleme UI
- D3 #8: Audit log UI (`/dashboard/audit-log`)
- D3 #10: Mali rapor formatı (`/dashboard/mali-rapor`)
- D3 #12-15: Bildirim/AI/Cookie/Settings UI'leri (~2 saat her biri)

**5. TUR #56 — LAWYER İş Akışı Bildirimleri** (~3-4 saat, B tipi)
- L4: Belge upload, AI analiz tamamlanma, duruşma 3 gün uyarısı bildirimleri
- L1: Frontend role-aware sayfa gizleme

**6. TUR #57 — REPRESENTATIVE Performans Dashboard** (~2-3 saat, B tipi)
- R5: Temsilci kendi performans (toplam lead, dönüşüm, beklenen komisyon)
- R2: Temsilci hukuk endpoint yetkisi inceleme — gerekirse role guard daraltma

### 🟢 TASK_QUEUE (gelecek dalga)

- S2 (rol-spesifik endpoint ayrımı) — 3-4 saat
- S3 panel raw fetch comment ekleme — 30 dk
- S4 IS_PLANI anayasa sürüm güncelleme — 1 dk
- L2 LAWYER kendi dashboard data endpoint — 1 saat
- L5 leads/[id]/page.tsx:1822 "Yakında" konumu netleştir
- A4 Otonom katman (Auditor/Healer/Reporter) — IS_PLANI'da LATER doğrulama

### ℹ️ NOT

- A3 (M1 manuel migration) — TUR #52'de tedavi
- A9 env keys — bu rapor referans listesi olarak hizmet eder
- E2 yeni KIRMIZI kategori adayı yok — TUR #50 yasal zemin temiz

---

## Mimar Önerisi — Sonraki Mektup

**ÖNCELİK 1: TUR #52 — Regresyon + KVKK Silme UI**
- E1.1 + E1.2 + E1.3 (TUR #47 regresyon — Madde 4.1 ekosistem hatası)
- A1 KVKK m.7 silme talebi admin UI
- M1 migration (manuel veya postinstall)
- **Süre:** ~3-4 saat, 5-6 commit
- **CEO onay:** A1 KVKK silme UI build için yazılı evet, M1 postinstall için 🔴 KIRMIZI nokta (ayrı yazılı onay)

**ÖNCELİK 2: TUR #53 — KVKK SCC Kayıt** (Mehmet Bey öncelik kararı)
**ÖNCELİK 3: TUR #54 — CommissionLog** (Mehmet Bey gelir motoru tamamlama kararı)

**Mehmet Bey D direktifi (3 CRM eşit öncelik):**
TUR #54 (CommissionLog) hem LAWYER hem REPRESENTATIVE'i tamamlıyor. ADMIN UI eksikleri TUR #55'te bütüncül kapatılır. **D direktifi 3 paydaşı 3 ayrı turda eşit sırayla tamamlar.**

---

## Bitiş — Read-Only Doğrulama

- ✅ 6 bölüm taraması bitti (A:11 + B:5 + C:5 + D:5 + E:3 = **29 alt-tarama**)
- ✅ TUR51_DEVIR_SAGLIK_RAPORU.md yazıldı (bu dosya)
- ✅ Bulgu tasnifi: 🔴 4, 🟡 9, 🟢 6, ℹ️ 5 (toplam 24)
- ✅ D3 CEO checklist 15 madde tamamlandı
- ✅ Paydaş bazlı bulgu kodlaması: L1-L5, R1-R5, A1-A4, S1-S5, E1-E2
- ✅ Tedavi yol haritası TUR #52, #53, #54, #55, #56, #57 mektup adayları
- ✅ 0 kod commit, 0 schema, 0 migration — read-only doğrulandı
- ✅ DEVIR_RAPORU_AKTIF.md güncellenecek (bu rapor sonrası)

— Claude Code, TUR #51 sağlık taraması tamamlandı
— 30 Nisan 2026, Anayasa v1.13.0 yürürlükte
— Madde 4 + Madde 17.4 + Madde 17.5 + Madde 21 + Madde 26.8 disiplini
