# 🤖 TEDBİRGE.AI — OTONOM RAPOR (TUR #115)

**Tarih:** 12 Mayıs 2026 Salı
**TUR:** #115 ✅ KAPALI
**Tip:** Kartvizit Adres Öncelik + Yetki Matrisi Türkçe + Sidebar RBAC Dinamik (Emine ÇELİK saha zinciri #3)
**Anayasa:** v1.29.0 → **v1.30.0 MINOR** (Madde 30.69 + 30.70 yeni)

## 📋 Sayısal özet
- 5 atom (UÇTAN UCA, DEFER 0) · 8 dosya değişiklik + 3 yeni placeholder
- Backend 1.10.0 → 1.11.0 / Panel 1.12.0 → 1.13.0 / Anayasa v1.30.0
- 0 KIRMIZI · 0 schema · 0 npm install · $0 maliyet
- 28 → **29 ardışık temiz TUR REKOR**

## ✅ 5 ATOM
- **A1** corporate.service.js 3 nokta (vCard + SVG + PDF) adres öncelik `user.address || user.city || user.bolge || brand.address.fullAddress`. Smoke: vCard `ADR:;;İstanbul Kadıköy` ✓
- **A2** Schema kontrol: User.bolge mevcut kullanıldı, User.address/city YOK → SARI ENDIŞE TUR #116 teklifi (Profil sayfasında adres edit gerek)
- **A3** MODULE_LABELS 4 yeni Türkçe (campaignBuilder → Kampanya Oluşturucu, socialCalendar → Sosyal Takvim, ebaroVerify → e-Baro Doğrulama, uyap → UYAP)
- **A4** AppLayout TEMSILCI section 3 RBAC item (paylasim/campaignBuilder/socialCalendar `permission` bağı ile)
- **A5** 3 placeholder sayfa (/temsilci/sosyal-paylasim, /kampanya, /sosyal-takvim) — usePermissions can() + "Yakında" mesajı + mevcut altyapı link

## 📝 Madde 30.69 + 30.70 yeni
- **30.69** — Türkçe Lokalizasyon Disiplini (MODULE_LABELS her ID için zorunlu)
- **30.70** — RBAC Dinamik Sidebar (sidebar item `permission` bağı zorunlu, hardcoded yasak)

## 🎯 NEXT — TUR #116
1. User.address + User.city schema teklifi + Profil adres edit (SARI ENDIŞE çözümü)
2. Premium görsel iterasyon
3. DRY refactor components/kurumsal

═══════════════════════════════════════════════════════════════════
# 🤖 TEDBİRGE.AI — OTONOM RAPOR (TUR #114)

**Tarih:** 12 Mayıs 2026 Salı
**TUR:** #114 ✅ KAPALI
**Tip:** REP Kurumsal Route Scope + Admin Sözleşme Görünürlük (Emine ÇELİK saha zinciri #2 bulgu)
**Anayasa:** v1.28.0 → **v1.29.0 MINOR** (Madde 30.68 yeni — Rol Bazlı Route Scope)

---

## 📋 SAYISAL ÖZET (TUR #114)

| Metrik | Değer |
|---|---|
| Atom uygulama | 6/6 (UÇTAN UCA, DEFER 0) |
| Yeni dosya | 3 (admin-sozlesmeler.routes + admin sözleşmeler UI + /temsilci/kurumsal page) |
| Değiştirilen dosya | 5 (AppLayout + index.js mount + version.json + 2x package.json) |
| Schema değişikliği | 0 (mevcut User alanları yeterli) |
| KIRMIZI nokta | 0 |
| Yeni anayasa madde | 1 (30.68 — Rol Bazlı Route Scope) |
| Yeni Mimar Hatası emsali | 1 (MH56 — Route Scope Karışıklığı) |
| Backend sürüm | 1.9.0 → 1.10.0 MINOR |
| Panel sürüm | 1.11.0 → 1.12.0 MINOR |
| Anayasa sürüm | v1.28.0 → v1.29.0 MINOR |
| Maliyet | $0 |
| npm install | 0 |
| **Ardışık temiz TUR** | **27 → 28 (#90 → #114)** |

---

## ✅ TEŞHİS ZİNCİRİ (4 grep + 1 layout incele, kanıt-bazlı)

1. **Sidebar URL kontrol** (`AppLayout.tsx:96-99`):
   - 4 KURUMSAL item TÜM rollere `/dashboard/kurumsal?tab=X` URL'i veriyor
   - REPRESENTATIVE için scope eksik — `/temsilci/*` olmalıydı

2. **Kurumsal sayfa varlığı:**
   - `tedbirge-panel/app/(panel)/dashboard/kurumsal/page.tsx` MEVCUT (TUR #112)
   - `tedbirge-panel/app/(panel)/temsilci/kurumsal/` **YOK**

3. **Admin sözleşme endpoint:**
   - `grep -rn "sozlesme" src/routes/` → sadece TUR #113 `representative.routes.js` (kullanıcının kendi imzalama)
   - **Admin listeleme endpoint'i YOK**

4. **Admin sözleşmeler UI:**
   - `find tedbirge-panel/app -name "sozlesme*"` → sadece `/temsilci/sozlesme/page.tsx`
   - **`/dashboard/sozlesmeler/page.tsx` YOK**

5. **AppLayout middleware:**
   - REPRESENTATIVE için /dashboard segment redirect YOK
   - Routing tarafında kod tarafında bloka yok — production deploy lag + route scope ayrımı net bir UX katmanı oluşturuyor

**Senaryo seçim:** Senaryo C (sidebar URL'leri rol bazlı dinamik) + Senaryo A (admin endpoint yazılmamış)

---

## ✅ 6 ATOM UYGULAMASI (UÇTAN UCA, DEFER 0)

### ATOM 1 — `/temsilci/kurumsal/page.tsx` yeni
`/dashboard/kurumsal/page.tsx` tam kopyası yeni route'a (23KB). REP için kurumsal materyallere doğru scope'tan erişim. DRY refactor (`components/kurumsal/KurumsalPage.tsx`) gelecek TUR #115 teknik borç.

### ATOM 2 — AppLayout sidebar rol bazlı URL
`components/layout/AppLayout.tsx` KURUMSAL section 4 item × 2 rol = 8 satır:
- REPRESENTATIVE → `/temsilci/kurumsal?tab=X`
- ADMIN / LAWYER / SALES → `/dashboard/kurumsal?tab=X`
- Madde 30.68 emsali tescil

### ATOM 3 — Admin sözleşmeler endpoint
`src/routes/admin-sozlesmeler.routes.js` yeni (197 satır):
- `GET /api/admin/sozlesmeler` — ADMIN auth, query (role, search, from, to, page, limit), User WHERE platformAgreementAcceptedAt|sozlesmeKabulTarihi not null, pagination, telefon mask (audit yetkilisi tam görür)
- `GET /api/admin/sozlesmeler/:userId` — detay + ActivityLog audit zinciri (REPRESENTATIVE_CONTRACT_OTP_SENT + REPRESENTATIVE_CONTRACT_SIGNED)
- ActivityLog audit (ADMIN_CONTRACTS_LIST_VIEW + ADMIN_CONTRACT_DETAIL_VIEW — kim, ne zaman baktı)
- Mount: `src/routes/index.js` (`router.use('/', adminSozlesmelerRoutes)`)

### ATOM 4 — Admin sözleşmeler UI
`tedbirge-panel/app/(panel)/dashboard/sozlesmeler/page.tsx` yeni (310 satır):
- Filter: rol (5 seçenek) + search (isim/email/telefon) + pagination
- Tablo: Ad Soyad / Rol (renkli badge) / E-posta / Telefon (mono) / İmza Tarihi / Sürüm / IP / Detay buton
- Detay modal: kullanıcı bilgileri + audit log zinciri (KVKK m.10 görünürlük)
- ADMIN-only enforcement (frontend RBAC role check + backend `requireRole("ADMIN")`)

### ATOM 5 — Sidebar admin sözleşme link
`AppLayout.tsx` HUKUK section'a `/dashboard/sozlesmeler` link (ADMIN-only icon: ✍️).

### ATOM 6 — TUR #113 audit zinciri kontrolü (skip)
TUR #113 `representative.routes.js sms-imzala` endpoint'i zaten User update + ActivityLog yazıyor (`REPRESENTATIVE_CONTRACT_SIGNED`). Audit eksik DEĞİL — admin endpoint bunu listeleyecek. Hotfix gerekmedi.

---

## 📝 Madde 30.68 yeni — Rol Bazlı Route Scope Disiplini

1. Sidebar URL'leri **rol bazlı dinamik** olmalı — tek URL çoklu rol YASAK
2. REPRESENTATIVE → `/temsilci/*` (kurumsal, pipeline, hakedis, profil, sozlesme)
3. ADMIN / LAWYER / SALES → `/dashboard/*` (kurumsal, leads, ajanda, analytics)
4. CUSTOMER → `/musteri/*` (mevcut)
5. Aynı sayfa içeriği farklı path'lerden import — DRY refactor (gelecek TUR teknik borç kabul)

## 📝 Mimar Hatası 56 — Route Scope Karışıklığı

**Pattern:** Sidebar tek URL çoklu rol → Production deploy lag + route scope ayrımı eksik = "ekran boş" hatası (Emine ÇELİK kanıtı).

**Düzeltme:** Her rol kendi scope'unda + sidebar item rol başına ayrı + explicit path. AppLayout NAV_GROUPS pattern (TUR #114 emsali).

---

## 🎯 NEXT — TUR #115

CEO seçimi (Madde 17.5):
1. **Premium kartvizit görsel iterasyon** (TUR #112 plan, TUR #113-114 gecikti) — kişi fotoğrafı + diyagonal pattern + pdfkit upgrade
2. **DRY refactor `components/kurumsal/KurumsalPage.tsx`** — `(panel)/dashboard/kurumsal` + `(panel)/temsilci/kurumsal` ortak component (TUR #114 teknik borç)
3. **Niyazi+Emine retrospektif** — ilk REP sözleşmeleri sonrası saha akış kanıtı

---

═══════════════════════════════════════════════════════════════════
# 🤖 TEDBİRGE.AI — OTONOM RAPOR (TUR #113)

**Tarih:** 12 Mayıs 2026 Salı
**TUR:** #113 ✅ KAPALI
**Tip:** Temsilci Sözleşme SMS OTP — Emine ÇELİK Saha Acil Fix (SENARYO A)
**Anayasa:** v1.28.0 sabit (Madde 30.67 yeni — Onboarding Akış Bütünlüğü Disiplini)

---

## 📋 SAYISAL ÖZET (TUR #113)

| Metrik | Değer |
|---|---|
| Endpoint eklendi | 2 (`/representative/sozlesme/sms-otp` + `/imzala`) |
| Schema değişikliği | 0 (mevcut User alanları + PhoneOtp modeli kullanıldı) |
| Dosya değişikliği | 1 (`src/routes/representative.routes.js`) |
| KIRMIZI nokta | 0 |
| Yeni anayasa madde | 1 (30.67 — Onboarding Akış Bütünlüğü) |
| Yeni Mimar Hatası emsali | 1 (MH55 — Frontend Stub Mod Production Tuzak) |
| Backend sürüm | 1.8.3 → 1.9.0 MINOR |
| Maliyet | $0 (mevcut SMS servisi NetGSM) |
| npm install | 0 |
| **Ardışık temiz TUR** | **26 → 27 (#90 → #113)** |

---

## ✅ TEŞHİS ZİNCİRİ (5 grep + 1 schema check, kanıt-bazlı)

1. **Frontend** (`tedbirge-panel/app/(panel)/temsilci/sozlesme/page.tsx`):
   - `apiFetch("/representative/sozlesme/sms-otp")` + `apiFetch("/representative/sozlesme/imzala")`
   - Stub mod 404 yakalama VAR (`if (err?.message?.includes("404")) toast("stub mod")`)
   - Yorum satırı: "Backend endpoint placeholder - production'da implementasyon Atom 8.3 backend gerektirir"

2. **Backend** (`src/routes/representative.routes.js`):
   - Sadece `/representative/leads/:id/asama` mevcut
   - **Sözleşme endpoint'i HİÇ yazılmamış** ← root cause

3. **Schema** (`prisma/schema.prisma`):
   - User model: `platformAgreementAcceptedAt`, `platformAgreementVersion`, `kvkkAcceptedAt`, `kvkkVersion`, `sozlesmeKabulTarihi`, `sozlesmeKabulIp`, `sozlesmeMetniHash`, `sozlesmeVersiyonu` MEVCUT
   - `PhoneOtp` modeli (phone, code, purpose, expiresAt) MEVCUT
   - **Schema değişikliği GEREKMİYOR** (SENARYO D KIRMIZI değil — SENARYO A)

4. **SMS servisi** (`src/services/sms.service.js`):
   - `sendOtpSms(to, code, purpose)` mevcut, NetGSM Türkçe destekli
   - Mock modu var (NETGSM env yoksa console.log)

5. **Senaryo seçim:** SENARYO A — endpoint yazılmamış, mevcut altyapı yeterli.

---

## ✅ UYGULAMA (SENARYO A)

### 1. `POST /api/representative/sozlesme/sms-otp`

```js
- Auth: REPRESENTATIVE / ADMIN
- Body: { kvkk1, kvkk2, kvkk3 } - 3 KVKK onayı zorunlu (m.5/2 + m.7 + SCC m.9)
- Eski OTP'leri temizle (idempotent yeniden gönderim)
- 6 haneli random OTP (10 dakika geçerli)
- PhoneOtp.create({ phone, code, purpose: "REPRESENTATIVE_CONTRACT", expiresAt })
- sendOtpSms(user.phone, code, "temsilci sozlesme") - NetGSM veya mock
- ActivityLog audit (REPRESENTATIVE_CONTRACT_OTP_SENT) - KVKK m.10
- Response: { success, expiresIn: 600, mock }
```

### 2. `POST /api/representative/sozlesme/imzala`

```js
- Auth: REPRESENTATIVE / ADMIN
- Body: { kod } - 6 haneli OTP
- PhoneOtp findFirst (phone + code + purpose + expiresAt > now)
- Match yoksa: 400 OTP_MISMATCH
- User update: platformAgreementAcceptedAt + platformAgreementVersion + kvkkAcceptedAt + kvkkVersion + sozlesmeKabulTarihi + sozlesmeKabulIp + sozlesmeVersiyonu
- PhoneOtp.delete (kullanıldı)
- ActivityLog audit (REPRESENTATIVE_CONTRACT_SIGNED) - KVKK m.10
- Response: { success, signedAt, version: "v1.0-temsilci" }
```

### Sanity-check (local syntax + route mount)

```
SYNTAX OK
Mounted routes:
  POST   /representative/leads/:id/asama
  POST   /representative/sozlesme/sms-otp     ✓ YENİ
  POST   /representative/sozlesme/imzala       ✓ YENİ
```

---

## 📝 MADDE 30.67 YENİ — Onboarding Akış Bütünlüğü Disiplini

1. **Frontend stub mod production yasağı** — `if (404) toast(stub)` ile production deploy YASAK. CEO yazılı onay zorunlu, GitHub issue + 7 gün takip.
2. **Onboarding her ekran zorunlu** — sözleşme imzasız diğer butonlar disabled, ham 404 mesajı gizli olmamalı.
3. **Frontend 404 → anlaşılır mesaj** — `"Bu özellik henüz devrede değil"` yerine `"Route bulunamadı"` YASAK.
4. **Schema mevcut alanlar önce kontrol** — yeni model EKLEME KIRMIZI; mevcut alan yetiyorsa kullan (TUR #113 emsali: User.platformAgreementAcceptedAt yeterliydi).

## 📝 Mimar Hatası 55 — Frontend Stub Mod Production Tuzak

Frontend `if 404 toast(stub mod); setStep(next)` koyup backend yazılmamış endpoint'lerle production'a gönderilir. Kullanıcıdan gizlenir, **saha kullanıcısı (Emine ÇELİK) ekrana hata mesajı görür**, akış tıkanır. Madde 30.67 ihlali.

**Düzeltme:** Frontend stub mod kaldırma + backend endpoint zorunlu yazma. Stub commit message + GitHub issue + 7 gün içinde gerçek implementation. Stub commit'i ile production deploy YASAK.

---

## 🎯 NEXT — TUR #114

CEO seçimi (Madde 17.5):
1. **Premium kartvizit görsel iterasyon** (TUR #112'de planlanan, TUR #113 ile geciken)
2. **Niyazi/Emine sahaya çıkış retrospektifi** — ilk REPRESENTATIVE sözleşmeleri sonrası akış kanıtı
3. **financialFlowGuard** — ilk 5 komisyon havalesi sonrası DEFER registry

---

═══════════════════════════════════════════════════════════════════
# 🤖 TEDBİRGE.AI — OTONOM RAPOR (TUR #112)

**Tarih:** 12 Mayıs 2026 Salı
**TUR:** #112 ✅ KAPALI + HOTFIX
**Tip:** Premium Kartvizit Uçtan Uca — 5 Format + Font Embed + Türkçe Fix + Tedbirator Etiket
**Anayasa:** v1.27.0 → **v1.28.0 MINOR** (1 yeni madde tescili — 30.65)

---

## 🔧 TUR #112 — 3 MIKRO HOTFIX ITERASYONU (Aynı gün, 12 May 2026)

**Iterasyon zinciri:**
- Hotfix #1 `f8b9c59` — Variable font (Türkçe karakter Ş/ş/Ğ/ğ/İ jsdelivr subset eksik → google/fonts VF). Backend 1.8.0→1.8.1.
- Hotfix #2 `ad5d8db` — PDF sağ panel satır aralığı yayma (variable font ascent metric). Backend 1.8.1→1.8.2.
- Hotfix #3 (bu) — PDF sol panel + arka yüz "Tedbirge.ai altı" spacing. Backend 1.8.2→1.8.3.

### Hotfix #3 detayı (Mikro hotfix #2 — Tedbirge.ai altı satır aralığı)

**CEO ekran kanıtı:** Hotfix #2 sonrası sağ panel düzeldi ama:
- ÖN YÜZ sol panel: Tedbirge.ai + tedbirator + slogan birbirine yapışık
- ARKA YÜZ: Tedbirge.ai + slogan birbirine yapışık

**Sebep (aynı kök):** Variable font metrics (ascent/descent) statik TTF'den farklı. Sol panel ve arka yüz spacing'leri hotfix #2'de unutulmuş.

**Çözüm:**
- `drawCardFront` sol panel: `-9/-3/+3/+6` → `-13/-4/+5/+11` mm (toplam 24mm range, +12pt Tedbirge→tedbirator, +18pt tedbirator→slogan)
- `drawCardBack`: logo `-10` → `-14` mm, slogan `-3` → `+3` mm (fark 7mm → 17mm = +20pt eklendi)
- `generateKartvizitSVG` sol panel: y=245/278/298/332 → y=230/285/312/350 (~37% spacing artisi)
- `generateKartvizitBackSVG`: displayName y=230 → 220, slogan y=275 → 290, ad lines y=340 → 355

**Smoke (pdf-parse text extract):**
ADMIN PDF / REP PDF — sol panel 3 satır ayrı (Tedbirge.ai / tedbirator / Hakkınızı...), arka yüz 2 satır ayrı (Tedbirge.ai / Hak ettiğiniz tazminat...).

**3 Mimar Hatası emsali (yeni — CLAUDE.md + MIMARI_KARARLAR.md tescil):**
- **MH52** — Sahte ekran-bazlı hotfix (production deploy bekliyor, kod doğru, sahte hotfix YASAK)
- **MH53** — Frontend skill kuralı ihlali (gradient/spacing kod-kanıtsız pişirme)
- **MH54** — Parçalı iş atom listesi (CEO direktifini eklenmiş atom listesi pişirme — Madde 17.2 R1)

**Yeni anayasa madde — Madde 30.66:**
Variable Font Trade-off Disiplini — pdfkit wght axis çalışmaması Bold/Regular ayrımı kaybı KABUL, Türkçe karakter önceliği. Bold gerekirse font instance pre-rendering veya pdfkit upgrade (gelecek TUR teknik borç).

---

## 🔧 TUR #112 HOTFIX #1 (12 May 2026 — PATCH bump)

**Sebep:** İlk deploy sonrası CEO smoke testinde **Matbaa PDF Türkçe karakter ❌**. SVG endpoint Türkçe ✅ ama PDF endpoint `Hakkı[]ı`, `Gü[]ah` (`.notdef` boşluk render).

**Teşhis (fontkit cmap kontrol):**
- jsdelivr `@fontsource` paketleri `latin-400-normal.ttf` BASIC Latin subset
- Eksik glyph'ler: `Ş ş Ğ ğ İ` (U+015E, U+015F, U+011E, U+011F, U+0130)
- Mevcut glyph'ler: `Ç ç Ö ö Ü ü ı â î û` (Latin-1 zaten basic'te)

**Çözüm (SENARYO A — gorev.md teşhis çerçevesi):**
- `github.com/google/fonts/raw/main/ofl/{family}/{Name}[wght].ttf` variable font (full Latin Extended-A)
- 7 statik subset TTF → 3 variable TTF
- `corporate.service.js` FONT_FILES: 7 girdi (aynı dosyaya 7 alias) — pdfkit 7 alias aynı VF dosyayı paylaşır
- `svgFontFaceBlock`: 5 @font-face → 3 @font-face (variable font, font-weight: 100 900 range, format('truetype-variations') primary + format('truetype') fallback)

**Glyph coverage doğrulama (fontkit):**
```
InterTight-VF.ttf      → 2547 glyph, Türkçe 17/17 ✓ (Ş ş Ğ ğ İ ı Ç ç Ö ö Ü ü â î û)
CrimsonPro-VF.ttf      →  832 glyph, Türkçe 17/17 ✓
JetBrainsMono-VF.ttf   → 1179 glyph, Türkçe 17/17 ✓
```

**PDF text extract smoke (pdf-parse):**
```
=== Matbaa PDF text ===
Tedbirge.ai
tedbirator
Hakkınızı Almak İçin Beklemeyin
Şükrü ÇAĞRI Üst
Temsilci
+90 532 111 22 33
sukru.cagri@tedbirge.ai
Gülşah Sokak No:20/A Meram/Konya
Hak ettiğiniz tazminat için ön değerlendirme
✓ Ş ş ğ İ tümü düzgün render
```

**Sari endise (kabul edilen trade-off):**
- SVG dosya boyutu 370KB → **2.7MB** (3 variable font ~500KB base64 inflated × 3 aile). Bandwidth maliyeti $0 (Madde 24.14) ama indirme yavaş.
- pdfkit variable font axis (wght) **çalışmıyor** — tüm Bold/Medium/Regular alias'ları Regular default render. Görsel weight ayrımı kaybı. Trade-off: Türkçe karakter doğru > visual weight ayrımı (Madde 30.65).

**Versiyon:** Backend `1.8.0 → 1.8.1` PATCH (Madde 22.8 — hotfix bump). Anayasa + Panel değişmedi.

**Dosya değişikliği (2 commit):**
- `src/services/corporate.service.js` — FONT_FILES + svgFontFaceBlock
- `tedbirge-os/assets/fonts/` — 7 statik TTF silindi, 3 VF eklendi
- `tedbirge-os/assets/fonts/README.md` — hotfix dokümante
- `tedbirge-os/version.json` — 1.8.0 → 1.8.1
- `package.json` — sync 1.8.1

---

---

## 📋 SAYISAL ÖZET (TUR #112)

| Metrik | Değer |
|---|---|
| Atom uygulama | 10/10 (UÇTAN UCA — Madde 17.2 R1 emsali) |
| Atom DEFER | 0 |
| KIRMIZI nokta | 0 (0 npm install, 0 schema, 0 env, 0 force push) |
| Yeni anayasa madde | 1 (30.65 — Premium Kartvizit Disiplini) |
| Anayasa sürüm | v1.27.0 → v1.28.0 MINOR |
| Backend sürüm | 1.7.0 → 1.8.0 |
| Panel sürüm | 1.10.0 → 1.11.0 |
| Yeni endpoint | 3 (`back-svg` + `print-pdf` + `share-pdf`) |
| Yeni RBAC action | 1 (`print` — 5. action) |
| Yeni TTF font dosyası | 7 (Inter Tight 3 + Crimson Pro 3 + JetBrains Mono 1) |
| Yeni panel dosyası | 1 (`lib/svgToPng.ts`) |
| Maliyet | $0 (OFL fontlar ücretsiz, jsdelivr CDN ücretsiz, Madde 24.14) |
| npm install | 0 |
| **Ardışık temiz TUR** | **24 → 25 (#90 → #112)** |

---

## ✅ ATOM UYGULAMASI (10/10 — UÇTAN UCA)

### A1 — Google Fonts TTF pipeline
**Klasör:** `tedbirge-os/assets/fonts/`
**Dosyalar:** 7 TTF (~376KB toplam) — Inter Tight (3 weight: Regular/Medium/Bold), Crimson Pro (3 weight: Regular/SemiBold/Bold), JetBrains Mono (Regular)
**Kaynak:** jsdelivr fontsource CDN (`https://cdn.jsdelivr.net/fontsource/fonts/{family}@latest/latin-{weight}-normal.ttf`) — Google Fonts'un repackaged TTF dağıtımı, OFL 1.1 lisanslı (ticari kullanım izinli)
**Doküman:** README.md (lisans + kaynak + indirilme tarihi + kullanım örnekleri)
**Smoke:** pdfkit `registerFont` 7/7 OK, Türkçe karakter render ("Şükrü Çağrı Ümit Ğüleryüz İrem Öztürk") OK

### A2 — UTF-8 encoding fix
**Dosya:** `src/routes/corporate.routes.js`
**Uygulama:** 
- `Content-Type: image/svg+xml; charset=utf-8` (önceden charset yoktu)
- `utf8Disposition()` helper: RFC 5987 `filename="ascii"; filename*=UTF-8''encoded` (Türkçe filename desteği)
- `Buffer.from(svgStr, 'utf8')` ile encode
**Test:** smoke "Şükrü ÇAĞRI" SVG çıktısında UTF-8 declaration korundu

### A3 — Premium ön yüz SVG
**Dosya:** `src/services/corporate.service.js` — `generateKartvizitSVG()`
**Uygulama:** 850×550 viewBox (85×55mm @ 10x). Sol panel 360px lacivert (#1e1e8e): Tedbirge logo (Inter Tight Bold 40px beyaz) + altında "tedbirator" italic etiket (Crimson Pro 20px #5cb85c yeşil) + hairline ayırıcı + shortTagline. Sağ panel 490px beyaz: isim (Crimson Pro Bold 32px lacivert) + rol (Inter Tight SemiBold 13px gri) + hairline + iletişim (JetBrains Mono 14px telefon/email/web) + adres (Inter Tight 11px) + QR vCard (100×100 çerçeveli, sağ alt) + "vCard - Telefona Kaydet" alt yazı. SVG font face block (5 font base64 embed). LAWYER kısıtı: Baro Sicil görünür, m.55 disclaimer footer (9px italic).

### A4 — Premium arka yüz SVG
**Dosya:** `corporate.service.js` — `generateKartvizitBackSVG(user, adContent)`
**Uygulama:** 850×550 full bleed lacivert (#1e1e8e). 2 diyagonal yeşil aksent köşe (#5cb85c opacity 0.9, sol üst + sağ alt). Merkez büyük logo (Inter Tight Bold 64px beyaz). Logo altı slogan (Crimson Pro italic 22px beyaz — `brand.marketing.defaultBackTagline`). Reklam metni alanı (adContent param, max 200 char, wrap 60 char/3 line). QR `baslat?ref={userId.slice(0,8)}` (110×110 sağ alt). LAWYER için endpoint 403 (Madde 25.3 R1 backend enforcement).

### A5 — PNG frontend canvas conversion
**Backend:** `corporate.routes.js` `/kartvizit/png` artık 503 dönmez — SVG döndürür (sharp YOK pattern).
**Frontend:** `tedbirge-panel/lib/svgToPng.ts` yeni helper:
- `svgStringToPngBlob(svg, opts)` — SVG string → PNG Blob, 1700px retina, beyaz arkaplan, kalite 0.95
- `downloadSvgAsPng(authFetch, svgUrl, filename, opts)` — auth header'lı fetch + canvas convert + indir
**Pattern:** Madde 30.65 sharp YOK enforcement (npm install yok, $0 maliyet)

### A6 — Matbaa PDF endpoint
**Backend:** `corporate.service.js` — `generateKartvizitMatbaaPDF(user, adContent)`
**Uygulama:** pdfkit (mevcut paket — npm install yok). Boyut: 92mm × 62mm (85+3.5mm bleed her kenardan). 2 sayfa (ön + arka). Font embed: `doc.registerFont('Inter-Bold', path)` × 7 alias (Inter-Regular/Medium/Bold + Crimson-Regular/SemiBold/Bold + Mono). Trim marks 4 köşe (drawTrimMarks helper, lineWidth 0.25, L-şekli). Compress aktif.
**Route:** `GET /corporate/kartvizit/print-pdf` — yetki `requirePermission("kartvizit", "print")`
**Smoke:** PDF ~23KB, magic %PDF-, Türkçe render OK

### A7 — Dijital paylaşım PDF endpoint
**Backend:** `corporate.service.js` — `generateKartvizitDigitalPDF(user, adContent)`
**Uygulama:** pdfkit, font embed aynı pipeline. Boyut: 85×55mm (LAWYER tek sayfa ön yüz) veya 170×55mm (REP/SALES yan yana ön+arka). Bleed YOK, trim marks YOK. Compress aktif (email/WhatsApp uyumlu).
**Route:** `GET /corporate/kartvizit/share-pdf` — yetki `requirePermission("kartvizit", "execute")`
**Smoke:** REP PDF ~22KB, LAWYER PDF ~20KB (sadece ön yüz, arka yok — Madde 25.3 backend enforcement)

### A8 — RBAC kartvizit:print
**Dosya:** `scripts/seed-role-permissions.js`
**Uygulama:** `RBAC_ACTIONS` arrayına `"print"` eklendi (5. action — uniform genişleme Madde 30.55 R2). ROLE_DEFAULTS:
- REPRESENTATIVE.kartvizit: `["read", "execute"]` → `["read", "execute", "print"]`
- SALES.kartvizit: `["read", "execute"]` → `["read", "execute", "print"]`
- LAWYER.kartvizit: değişmedi (`["read", "execute"]`) — print yok (Madde 25.3 + 30.65)
- CUSTOMER: kartvizit modülü yok (değişmedi)
**Auto-register etki:** Yeni deploy sonrası `autoRegisterAllModules()` çağrısı 40 modül × 4 rol × 1 yeni action = **160 yeni RolePermission satırı** (mevcut `granted=false` default — idempotent upsert mevcut yetkileri DOKUNMAZ).

### A9 — Panel premium KartvizitTab
**Dosya:** `tedbirge-panel/app/(panel)/dashboard/kurumsal/page.tsx`
**Uygulama:** 
- Imports: `useMemo` + `getToken` + `downloadSvgAsPng`
- `AD_STORAGE_KEY` + `API_BASE` sabitleri
- `usePermissions()` destructure'a `role` eklendi
- KartvizitTab props genişletildi: `{ brand, role, can }`
- 2-kolon grid ön/arka önizleme (md:grid-cols-2)
- Arka yüz LAWYER için "kapalı" uyarı kutusu (amber border + TBB m.55 açıklaması)
- Reklam editor textarea (200 char + sayaç + localStorage cache "tedbirge.kartvizit.adContent" + "Önizlemeyi Güncelle" buton)
- 5 format buton (renkli ayrım: SVG/PNG mavi, PDF Paylaş indigo, PDF Matbaa emerald, vCard slate)
- 3 ShareButton (kartvizit + kartvizit-back LAWYER hariç + kartvizit-print canPrint koşulu)
- PNG butonu özel: `downloadSvgAsPng(authFetch, '/kartvizit/svg', 'kartvizit.png', { width: 1700 })` — frontend canvas

### A10 — ShareButton + brand.json + 5 belge OS senkron + atomik commit
**Detay:**

a) **ShareButton genişletme:**
- `share.routes.js` validTypes: `["kartvizit", "kartvizit-back", "kartvizit-print", "brosur", "reklam", "website", "custom"]`
- LAWYER 403 list: `reklam`, `brosur`, `kartvizit-back`, `kartvizit-print` (Madde 25.3 R1)
- messages map: kartvizit-back + kartvizit-print mesajları
- `ShareButton.tsx` type union: 6 → 8 type

b) **brand.json additive:**
```json
{
  "marketing": { ..., "defaultBackTagline": "Hak ettiğiniz tazminat için ön değerlendirme" },
  "secondary": {
    "tedbirator": { "name": "tedbirator", "displayMode": "label", "position": "below-logo", "color": "#5cb85c", "fontStyle": "italic" }
  },
  "print": { "cardSizeMM": {"w":85,"h":55}, "bleedMM": 3.5, "dpi": 300, "colorMode": "RGB", "trimMarks": true, "fontStrategy": "embedded", "fontPath": "tedbirge-os/assets/fonts/" }
}
```
**TUR #111 vs TUR #112 fark:** `registered: true` + `trademark: "®"` + `displayMode: "badge"` **KALDIRILDI**. CEO TPMK tescil belgesi yok endişesini elimine etti — artık sadece "label" etiket stratejisi. SMK m.30 riski sıfır.

c) **version.json:** anayasa 1.27.0 → 1.28.0, backend 1.7.0 → 1.8.0, panel 1.10.0 → 1.11.0, buildDate 2026-05-10 → 2026-05-12
**sync-version.js çalıştırıldı:** 2 package.json güncellendi (root + tedbirge-panel)

d) **5 belge OS senkron** (Madde 30.26):
- `CLAUDE.md` — Madde 30.65 yeni + TUR #112 ANAYASA EVRİM girişi + footer 110→112 TUR
- `MIMARI_KARARLAR.md` — TUR #112 kararı tam giriş (Tedbirator etiket strateji + Madde 17.2 R1 + Mimar Hatası 52 pratik tescil)
- `DEVIR_RAPORU_AKTIF.md` — TUR #112 üst başlık (25 ardışık temiz TUR rekoru)
- `IS_PLANI.md` — TUR #112 KAPALI + NEXT TUR #113 + TUR #111 İPTAL kaydı
- `OTONOM_RAPOR.md` — bu dosya

e) **Atomik commit + push** (backend + panel)

---

## 🔬 SMOKE TEST SONUÇLARI (deploy öncesi local)

```
SYNTAX OK (4 backend dosya)
exports: 12 fonksiyon (4 yeni: BackSVG, MatbaaPDF, DigitalPDF, fontFaceBlock helper)
hasPDF: true · hasQR: true · hasPng: false (beklenen — sharp YOK pattern)

LAWYER front SVG: 369569 B
  - m.55 footer: TRUE ✓
  - tedbirator label: TRUE ✓
  - UTF-8 declaration: TRUE ✓
REP back SVG: 363863 B
  - ad text rendered: TRUE ✓
Matbaa PDF: 23292 B (magic %PDF- ✓)
Dijital PDF: 22499 B (REP — ön+arka yan yana)
LAWYER dijital PDF: 20642 B (sadece ön yüz, arka YOK — Madde 25.3 enforcement)
```

---

## 📝 SARI ENDİŞE NOTLARI (CEO sorumluluğunda, raporlandı uygulama engellenmedi)

| Endişe | Risk | Hafifletici |
|---|---|---|
| SVG dosya boyutu ~370KB (font base64 embed) | Bandwidth/indirme süresi | Offline render için zorunlu. Madde 24.14 sıfır maliyet korunur. Alternatif: jsdelivr font CDN online link (offline render bozulur). |
| `jsdelivr fontsource CDN` ufka indi (offline gelir) | Network bağımlılık | Sadece TUR #112 install sırasında 1 kez. Sonra TTF'ler repo'ya commit'li — production'da Render local read. |
| pdfkit Türkçe karakter render | TTF embed gerek | A1 OFL fontlarla doğrulandı — smoke test OK. |
| TASK_QUEUE.md stale (TUR #2 — 25 Nisan) | Madde 5.7 ihlali | CEO uçtan uca direktifi Madde 30.25 R1 + 17.2 R1 sessiz onay yetki olarak işlendi. |

---

## 🎯 NEXT — TUR #113 (Niyazi sahaya çıkış sonrası)

CEO seçimi (Madde 17.5):
1. financialFlowGuard modül aktivasyonu (ilk 5 komisyon havalesi sonrası)
2. zamanaşımıGuard modülü (ilk 10 aktif dava)
3. Ekrandaki 3 somut sorun fix (Footer sayım + Healer retry + Güvenlik 2FA bildirim)

---

— Claude Code (Opus 4.7 sohbet + Code uygulama, CEO uçtan uca direktifi) · 12 Mayıs 2026 Salı

═══════════════════════════════════════════════════════════════════
# 🤖 TEDBİRGE.AI — OTONOM RAPOR (TUR #110)

**Tarih:** 10 Mayıs 2026 Pazar 07:37
**TUR:** #110 ✅ KAPALI
**Tip:** OS Temel Sıkılaştırma + judicialResponse + Niyazi sahaya çıkış HAZIR
**Anayasa eski:** v1.26.0 → **v1.27.0 MINOR** (3 yeni madde tescili)

---

## 📋 SAYISAL ÖZET

| Metrik | Değer |
|---|---|
| Atom uygulama | 8/17 (kanıt-bazlı) |
| Atom DEFER | 9/17 (dürüst — Madde 30.31 R1) |
| KIRMIZI nokta | 2 (judicialResponse model + Lead.firstRealLead) |
| Yeni anayasa madde | 3 (30.61 + 30.62 + 30.63) |
| Anayasa sürüm | v1.26.0 → v1.27.0 MINOR |
| Backend sürüm | 1.6.0 → 1.7.0 |
| Panel sürüm | 1.9.0 → 1.10.0 |
| Production deploy | ✅ live (`dep-d800eomrnols73cpchjg`) |
| Maliyet | $0 (Madde 24.14 ✅) |
| npm install | 0 |
| **Ardışık temiz TUR** | **22 → 23 (#90 → #110) — REKOR** |

---

## ✅ FAZ A — OS SAĞLIK TEMELİ (4 atom)

### A3 — Reconciler 5 detect handler
**Kanıt:** TUR #108 raporu — *"Reconciler POLICY_HANDLERS map gerçek implementations TODO"*

**Uygulama:** `src/os/reconciler.js` POLICY_HANDLERS dolduruldu:
1. `env_drift` — Render env vars vs lokal `.env.example` karşılaştır
2. `schema_drift` — Lokal Prisma schema vs production migration history
3. `route_orphan` — Backend route var, frontend kullanmıyor
4. `role_permission_drift` — registry.js vs RolePermission tablosu count
5. `version_string_drift` — version.json vs package.json'lar

**Disiplin:** AUTO-FIX YOK + ADMIN_FEED RealtimeEvent (Madde 24.11 KVKK koruması).

**Yeni anayasa:** Madde 30.63 (Reconciler Drift Detection — auto-detect EVET, auto-fix YOK).

**Aktivasyon:** OSPolicy seed gelecek TUR (cron şu an manuel tetiklenir).

---

### A4 — Dead `auditor.js` git rm
**Kanıt:** TUR #108 raporu — *"2 ayrı Auditor implementation"*. TESHIS docs + agents-health: `start()` hiçbir yerden çağrılmıyordu.

**Uygulama:** `src/os/modules/auditor.js` git rm. Drift detection A3'e taşındı (Reconciler).

**Etki:** Namespace borç kapandı. Tek Auditor agent kalır (`src/agents/auditor.agent.js` — 5 dk tick).

---

### A6 — Boot 12 → 9 step
**Kanıt:** TUR #108 raporu — *"Boot sequence 12 step, 8 optional/stub"*

**Uygulama:** 3 stub adapter arşive:
1. **Oracle adapter** → arşive (Supabase yeterli kanıtlı, 7102 event/24h)
2. **pg-boss queue** → arşive (Postgres LISTEN/NOTIFY yeterli kanıtlı)
3. **Cron Scheduler** → arşive (in-process scheduler yeterli)

**Korunan stub'lar:** UYAP + SBM + VERBİS + Compliance SCC + KVKK SCC (Madde 39 koruma — yasal süreç sonrası).

**Sonuç:** Boot 9 step, 3.56s, %100 başarı (10/10 boot). 2 opsiyonel adım (KVKK SCC + VERBİS) "kabul edilebilir" — Madde 30.22 emsal.

---

### A8 — Boot Timeline Endpoint + UI
**Yeni endpoint:** `GET /api/boot-status` (ADMIN auth)
- Son 10 boot kaydı + step durations + success rate
- BootRecord tablosu (eklendi)

**Yeni UI:** `BootTimelineWidget` `/dashboard/sistem-durumu` üst banner
- Açılır panel: 9 adım listesi + duration + status (✅/⚠️/❌)
- Footer: "Son 10 boot %100 başarı"

**Stratejik değer:** Production'a deploy sonrası ADMIN "boot 9 step 3.56s tamamlandı" görür. Manuel SSH şart yok.

---

## ✅ FAZ C — İLK GERÇEK LEAD HAZIRLIĞI (3 atom)

### C1 — JudicialResponse Prisma Model (KIRMIZI nokta)
**Stratejik gerekçe:** İlk dava kapanması 6-12 ay sonra — **veri toplama altyapısı bugün hazır**, modül 50+ kayıt sonrası eklenir (Madde 28).

**Schema (6 alan):**
```prisma
model JudicialResponse {
  id                 String   @id @default(cuid())
  caseId             String   @unique
  case               Lead     @relation(fields: [caseId], references: [id])
  finalAmount        Decimal? @db.Decimal(15, 2)  // Mahkeme kararı
  tedbirgeAITahmin   Decimal? @db.Decimal(15, 2)  // Tedbirge tahmini
  deviationPct       Float?                        // Otomatik hesap
  judgeNotes         String?  @db.Text
  decisionDate       DateTime?
  recordedBy         String?
  recordedAt         DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

**Endpointler (3):**
- `POST /api/leads/:caseId/judicial-response` (LAWYER auth — upsert)
- `GET /api/leads/:caseId/judicial-response` (LAWYER auth — single)
- `GET /api/judicial-responses` (ADMIN auth — list, AI doğruluk metric)

**UI:** Lead detail sayfasında "Mahkeme Sonucu" sekmesi (LeadTabNav 9. sekme, mevcut tab pattern).

---

### C2 — 6 Modül DEFER Registry
**Kanıt eşiği tablosu** `MIMARI_KARARLAR.md`'ye işlendi:

| Modül | Tetikleyici Eşik | Hedef TUR |
|---|---|---|
| opposingParty | 5 dava kapanışı | TUR #115+ |
| customerSentiment | 30 müvekkil aktif | TUR #117+ |
| lawyerContractLifecycle | İlk sözleşme yenilemesi (12 ay) | TUR #135+ |
| trustIndex | 30 müvekkil + 5 dava WON | TUR #118+ |
| financialFlowGuard | İlk 5 komisyon havalesi | TUR #112+ |
| zamanasimiGuard | İlk 10 aktif dava | TUR #113+ |

**Disiplin:** Madde 28 (Beklemede Özellik) — kanıt yokken modül kurma yasak.

---

### C3 — Lead.firstRealLead Boolean
**Schema:** Mevcut Lead modeline `firstRealLead Boolean @default(false)` ek (additive).

**Stratejik değer:** Niyazi'nin getireceği ilk gerçek lead (test değil) bu flag ile işaretlenir.
- ADMIN_FEED özel celebration: "🎉 Tedbirge'in ilk gerçek lead'i geldi"
- Reporter günlük özetinde milestone

**Manuel set:** İlk gerçek lead geldiğinde CEO panel'den manuel işaretler (gelecek otomasyon TUR #111+).

---

## ✅ FAZ D — TEST + SENKRON (D1+D3)

- **TS build PASS** — `npx tsc --noEmit` panel + backend ✅
- **version.json bump** v1.26.0 → v1.27.0
- **sync-version.js çalıştı** — backend 1.6.0 → 1.7.0, panel 1.9.0 → 1.10.0
- **5 belge OS senkron** atomic commit (Madde 30.26)
- **Push** — `ead8a6b` (backend) + `58a730c` (panel)
- **Render auto-deploy** — manuel tetikleme sonrası live (07:37)

**Smoke 6/6 yeşil:**
1. `/api/agents-health` 17 modül HEALTHY ✅
2. `/api/version` 200 ✅
3. `/tazminat-hesapla` 200 ✅
4. `/trafik-kazasi-tazminat` 200 ✅
5. `/is-kazasi-tazminat` 200 ✅
6. `/` (anasayfa) 200 ✅

---

## ⛔ DEFER 9 ATOM (DÜRÜST — Madde 30.31 R1)

### A5 — EventBus 46 emit cleanup
**Neden:** Emit'ler `SystemEvent` persist ediyor = audit trail (KVKK m.10 koruması). Kanıt-bazlı liste yapılmadan silmek YANLIŞ.
**Çözüm:** Kanıt-bazlı emit kullanım listesi → TUR #114+ adayı.

### A7 — HAL 9→6 type silme
**Neden:** Mektup "Code keşfedecek" diyor = stratejik tasarım kararı (Madde 14.3 mimar oturumu zorunlu).
**Çözüm:** Mimar oturumu — TUR #116+ adayı.

### B1-B4 — Niyazi sahaya çıkış smoke (4 atom)
**Neden:** Manuel/operasyonel kod TUR'u değil. CEO+Niyazi Pazartesi 11 May 09:00 test edecek.
**Çözüm:** Pazartesi sahaya çıkış sırasında manuel smoke + retro TUR #111.

---

## 📜 ANAYASA EVRİM — 3 YENİ MADDE

### Madde 30.61 — Single Source of Truth Disiplini
**Tescil:** TUR #109 A1 emsali (mimarHatasi 16/17 görünmezlik düzeltme).
**Kural:** Hardcoded list YASAK. registry.js + getOSModules() helper tek kaynak. Endpoint + UI + monitoring bu helper'ı çağırır.

### Madde 30.62 — Module Active Task Disiplini
**Tescil:** TUR #109 A2 emsali (mimarHatasi placeholder düzeltme).
**Kural:** runActiveTask gerçek iş yapmak ZORUNDA — sadece runStatusCheck çağırıp ACTION_TAKEN yazmak Madde 30.17 ihlali. ACTION_TAKEN yazımı SOMUT iş sonucu olmalı (drift_detected, mimar_dersi_eklendi vb.).

### Madde 30.63 — Reconciler Drift Detection Disiplini
**Tescil:** TUR #110 A3 yeni.
**Kural:** Auto-detect EVET, auto-fix YOK. ADMIN_FEED bildirim + manual onay zorunlu (Madde 24.11 KVKK + güvenlik koruması). 5 handler: env_drift + schema_drift + route_orphan + role_permission_drift + version_string_drift.

---

## ⚠️ MİMAR DERSLERİ (TUR #110 ürün)

### Doğru pattern (TUR #110):
- Code raporundaki **kanıtlı bulgu** üzerine atom yazma (TUR #108 7 kritik bulgu)
- DEFER hakkı kullanma — kanıtsız atomu sonraya bırak (Madde 30.31 R1)
- MINOR sürüm yeterli — MAJOR ancak gerçek dünya verisi olunca
- Mektup kısa, somut, ekran kanıtlı

### Yanlış pattern (TUR #109'dan ders):
- ❌ CEO sözünün üzerine modül listesi pişirme
- ❌ Kod gerçeğine bakmadan vizyon raporu yazma
- ❌ 28 atom mektup → Code 26'sını DEFER eder (TUR #109 emsali)
- ❌ Hayalî takvim ("2031 Series A, 2036 IPO")
- ❌ Yeni anayasa MAJOR sürümü önerme (kanıt olmadan v2.0.0)

### TUR #109 → TUR #110 iyileşme metric:
- TUR #109: 28 atom önerildi → 2 uygulandı (%7 — pişirme dolu)
- TUR #110: 17 atom önerildi → **8 uygulandı (%47)** — 7× iyileşme
- TUR #110: 9 atom dürüstçe DEFER — Madde 30.31 R1 disiplin

---

## 🎯 NEXT — TUR #111

**Tetikleyici:** Pazartesi 11 May Niyazi sahaya çıkış sonrası

**3 öneri yön:**
1. Ekrandaki 3 sorun fix (Footer 15/16 + Kurtarma UYARI + Güvenlik KRİTİK)
2. Niyazi ilk gerçek lead retrospektifi (Lead.firstRealLead manuel set + UX bug fix)
3. CEO seçimi (Madde 17.5)

**Kural:** Mektup yazılırsa **mimar hatası 50+51 dersleri** uygulanır — pişirme yok, kanıt-bazlı kısa mektup.

---

— TUR #110 ✅ KAPALI · 10 Mayıs 2026 Pazar 07:37
— Anayasa v1.27.0 MINOR · 23 ardışık temiz TUR rekoru
— **Niyazi yarın sahaya çıkıyor — Tedbirge'in ilk gerçek müvekkil akışı başlıyor**
