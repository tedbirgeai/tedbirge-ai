# 📋 TEDBİRGE.AI — İŞ PLANI (AKTİF KESİT)

**Son güncelleme:** 21 Mayıs 2026 Perşembe (TUR #132.4 KAPALI — TAC Tam Bagimsiz)
**Anayasa:** v1.44.0 MINOR (Madde 24.14 R1 genisleme + MH71 yeni)
**Aktif rekor:** 45 ardisik temiz TUR (#90 → #132.4)

---

## 🎯 NOW — TUR #132.4 KAPALI ✅ (TAC Tam Bagimsiz AI Cekirdek)

**CEO direktifi:** "Tedbirge AI analyzer + Tedbirge AI asistani — kendi beyni, kendi mulkiyeti, kendi ogrenmesi"

**17 atom uygulandı (DEFER 0 — Madde 17.2 R1 uctan uca):**
- A1: Pre-flight grep (13 Anthropic dosya tespit, MH71 emsali)
- A2: pattern-engine.service.js + 4 master data JSON (rule-based 14 alan)
- A3: ai-analyzer.service.js Anthropic söküm
- A4: intent-engine.service.js (13 intent) + faq-tr-v1.json (13 FAQ)
- A5: chatbot.service.js (ChatSession + ChatMessage reuse — KIRMIZI 5 SKIP)
- A6: lexscan.controller.js Anthropic söküm
- A7: AiChatWidget.tsx → "Tedbirge AI Asistani" + T avatar
- A8: admin.ai-training.routes.js + dashboard/ai-egitim sekmesi
- A9: Smoke + 5 belge senkron + version bump

**3 atom dürüst SKIP (Madde 30.31 R1):**
- A7 mektup (Anthropic uninstall) — MH71: 11 servis aktif kullanıyor, Madde 4.6 KALIN
- A14 mektup (ChatLog schema) — Mevcut ChatSession + ChatMessage reuse
- A15 mektup (Idempotent SQL) — A14 ile birlikte SKIP

**AI Durumu:**
- ✅ Tedbirge AI Analyzer LIVE (pattern-engine v1, $0, KVKK lokal)
- ✅ Tedbirge AI Asistani LIVE (intent-engine v1 + 13 FAQ, $0)
- 🟢 11 diger AI servisi DOKUNULMADI (Madde 4.6 KALIN)

---

## ESKI: TUR #132.1 KAPALI (AI Cekirdek Saha Dogrulama Hotfix + Hibrit Koruma)

**CEO saha kanit (6 ekran):** 3 KIRMIZI bug + 2 SARI tutarsizlik tespiti — TUR #132 saha dogrulamasiz kapatildi (MH62). Hotfix HIBRIT KORUMA (Madde 4.6) maksimum oncelik.

**14 atom uygulandı (DEFER 0 — Madde 17.2 R1):**
- A1: Pre-flight grep + hibrit harita (Madde 30.83.1, Madde 30.61 tek Document.create call site dogrulandi)
- A2: InsuranceCompany master data JSON (30 firma)
- A3: Schema Lead +11 alan additive + InsuranceCompany model + AccidentType enum (kazaTarihi/maluliyetOrani SKIP — Madde 4.6)
- A4: apply-pending-schemas.js 13 yeni idempotent değişiklik
- A5: master-data.service.js boot seed
- A6: mergeAiResultToLead (idempotent aiMergedAt guard) + upload pipeline MERGE
- A7: lead-estimation.service.js + lead.service.js null sentry (Madde 30.90)
- A8: Lead detay "Failed to fetch" transient retry
- A9: canonicalPhone tek kaynak (Madde 30.61 + MH61 düzeltme)
- A10: estimatedCompensation null UI gösterim ("Hesaplama için veri eksik")
- A11-12: Dashboard NaN guard
- A13: Healer stuck_ai_merge retry case
- A14: 5 belge OS senkron + version + commit + push

Backend `1.16.0 → 1.17.0` · Panel `1.26.0 → 1.27.0` · Schema `1.8.0 → 1.9.0` · Anayasa `v1.42.0 → v1.43.0` MINOR.

**Yeni anayasa madde:** 30.92 Master Data Disiplini · **Mimar Hatalari:** MH61 + MH62 tescil.

---

## ⏭️ NEXT — TUR #133 M3 Master Data Genisleme + M5 Hak Analizim

CEO yeni direktif bekler (Madde 30.25 R1). Hedefler:
- M3 ICD-10 master data (en sik 200 kod) + JSON Schema validation
- M3 Maluliyet TRH-2010 detay tablosu
- M3 ZMSS limit yillik (2026 v1)
- M5 CUSTOMER "Hak Analizim" tab (Lead AI verisi görünür)
- faultRate vs kusurOrani DEPRECATED isaretleme (Madde 30.61)
- Eski test data soft-delete (DEFER 5)

CEO smoke onay sonrasi mimar mektup TUR #133 hazirlar.

---

## 🗄️ ARSIV — TUR #132 KAPALI ✅ (AI Cekirdek TAC M1 Belge Ayristirici)

**16 atom uygulandı (DEFER 0 — Madde 17.2 R1):**
- ATOM 1 pre-flight grep + ATOM 2/3 disiplinli SKIP (Madde 30.31 R1)
- ATOM 4: ai-analyzer.service.js YENI (Claude Opus 4.7 + 14 alan JSON)
- ATOM 5-6: finalize-upload setImmediate'a TAC M1 MERGE
- ATOM 7-8: Document 6 + User 3 yeni alan additive (KIRMIZI 1, CEO yazili onay) + 9 idempotent ALTER
- ATOM 9: AcikRizaModal.tsx YENI (KVKK m.6)
- ATOM 10: POST /kvkk/acik-riza-document-upload + audit
- ATOM 11: BelgeYukleme.tsx consent gate
- ATOM 12: /me select kvkkM6ConsentAt
- ATOM 13: DocumentList needsManualReview + aiConfidence badge
- ATOM 14: Healer FAILED Document delete → retry
- ATOM 15: ai-cost-tracker.service.js YENI ($100/ay ADMIN_FEED)
- ATOM 16-18: ZDR headers + 5 belge senkron + smoke + commit

Backend `1.15.0 → 1.16.0` · Panel `1.25.0 → 1.26.0` · Schema `1.7.0 → 1.8.0` · Anayasa `v1.41.0 → v1.42.0` MINOR.

---

## ⏭️ NEXT — TUR #133 M2 Lead Schema Genisleme (KIRMIZI 2)

CEO yazili onayi bu mektupta yer aliyor ("uctan uca [...] basla bitir" — Madde 30.25 R1).

**M2 hedef:**
- Lead'e 10 yeni alan (kazaTarihi, kazaTuru, kazaYeri, sigortaSirketi, policeNo, maluliyetOrani, hasInjury, icdCode, vefatVar, aracDegerKaybi)
- AccidentType enum (TRAFFIC | WORK | OTHER)
- M1 AI Analyzer aiAnalysisJson → Lead otomatik merge (confidence ≥ 0.85 + audit)
- faultRate ve kusurOrani duplicate temizlik (Madde 30.61 tek-kaynak)

Lansman hedefi 14 Haziran 2026 — M1-M5 tamam beklenen (TUR #132 KAPALI, M2 NEXT).

---

## 🗄️ ARSIV — TUR #131 KAPALI ✅ (SEO/CRO 9 Atom GSC Kanit-Bazli)

**9 atom uygulandı (DEFER 0):**
- /basvuru layout.tsx YENI + H1 + 4 güven sinyali + CTA #15803D
- /trafik-kazasi-tazminat title+meta lead-intent
- /blog/zmms-teminat-limitleri-2026 title (61 imp 0% CTR fix)
- /blog/hayvana-carpma title + lead CTA (116 imp lead'e çevir)
- 7 blog post toplu meta audit
- Anasayfa hero CTA #15803D + "3 dk" + 3 güven sinyali
- /tazminat-hesapla JSON-LD FAQPage (6 FAQ)
- BlogPostClient bottom CTA / → /basvuru (50+ post etkilenir)
- Madde 30.89 + 5 belge senkron

Panel `1.24.0 → 1.25.0` MINOR, Anayasa `v1.40.0 → v1.41.0` MINOR.

---

## ⏭️ NEXT — TUR #132 GSC Retro (2-4 hafta sonra)

**Retro zorunlu olduğu için:**
- 2-4 hafta sonra GSC verisi karşılaştır
- /basvuru CTR %5.19 → %15+ tutuyor mu?
- Blog toplu CTR %0 → %2-3 tutuyor mu?
- İlk gerçek başvuru geldi mi?

Tutmazsa: atomları revize veya geri al (Madde 30.31 R1 + Madde 30.89 retro).

---

## 🗄️ ARSIV — TUR #130 KAPALI ✅ (4 İŞ Tek Atomik — Teknik Borç Temizliği + WCAG)

**11 atom uygulandı (DEFER 0):**
- İŞ 1 (3 atom): DRY KurumsalPage — 1122 → 579 satır, 543 duplicate silindi
- İŞ 2 (2 atom): 81 il × 973 ilçe (52 küçük il dolduruldu), AdresEditCard banner kaldırıldı
- İŞ 3 (2 atom): Yol B dürüst DEFER (Render erişimi yok, production stable, TUR #131 alert webhook aday)
- İŞ 4 (2 atom): WCAG kontrast (skip link/focus outline/MobilFAB ikon → emerald-700)
- ATOM 10 (Madde 30.88) + 11 (5-belge senkron)

Panel `1.23.0 → 1.24.0` MINOR, Anayasa `v1.39.0 → v1.40.0` MINOR.

---

## ⏭️ NEXT — TUR #131 Aday Listesi

1. **Render deploy alert webhook** (TUR #117 deploy fail tekrarına karşı kanıt-bazlı izleme)
2. **Saha kanıt bekliyor** (Niyazi DEMIR + Emine CELIK MobilFAB + filter URL + dynamic chunk kullanım metriği)
3. **Madde 28 kanıt eşiği** atomları (saha tetiği varsa)

---

## 🗄️ ARSIV — TUR #129 KAPALI ✅ (3 Verified Atom UCTAN UCA — Madde 30.85 + 30.86 + 30.87)

**Pre-flight emsal:** Mimar Opus 4.7 kod-kanit zinciri ile mektup (TUR #114 + #110 emsal). Madde 30.83.1 disiplinini ilk kez ihlal etmeden uygulanan mektup.

**Uygulanan 3 atom (DEFER 0):**
- **ATOM 1** Mobil FAB REPRESENTATIVE (3 CTA, mobile-only, safe-area)
- **ATOM 2** Filter URL params (sozlesmeler, Suspense boundary)
- **ATOM 3** Lead detay code splitting (DocumentList + UploadForm dynamic + TabSkeleton)

Panel `1.22.0 → 1.23.0` MINOR, Anayasa `v1.38.1 → v1.39.0` MINOR.

---

## ⏭️ NEXT — TUR #130+ Sahaya Cikis Bekliyor

Niyazi DEMIR + Emine CELIK gercek REPRESENTATIVE saha kullanim kaniti bekleniyor (Madde 28 esigi):
- Mobil FAB kullanim metriği
- Filter URL link paylasim
- Lead detay tab bundle metriği (Lighthouse)

Saha tetigi varsa kanit-bazli yeni mektup.

---

## 🗄️ ARSIV — TUR #124-#128 PRE-FLIGHT KISMI KAPANIS ✅ (C4 + D6 + 43 DEFER)

**2. iterasyon (TUR #123 sonrasi CEO talep):** Madde 30.83.1 pre-flight, kanit yoksa atla.

**Sonuc:** 46 atom grep dogrulandi → 3 uygulandi (A1 TUR #123 + C4 TUR #125 + D6 TUR #126) + 43 DEFER. Mektup %93 kod-kanitsiz cikti.

**Uygulanan:**
- **C4** — OTP Input a11y (inputMode/autoComplete/pattern/maxLength/aria-label) `temsilci/sozlesme/page.tsx`
- **D6** — Avukat tam ad CUSTOMER UI (`musteri/page.tsx` line 405)

**Gercek deger atom (TUR #129+ icin mimar yeniden tasarlamali):**
1. C2 Sticky FAB (REP saha UX, layout.tsx yeni gerek)
2. B3 Filter URL params (UX persistance, Next.js 16 Suspense)
3. F4 Lead detay 9-tab code splitting (perf, massive refactor)
4. D2 Belge kategori (Madde 3 KIRMIZI — CEO yazili onay)
5. D5 CUSTOMER profil edit (urun karari)

Panel `1.21.0 → 1.22.0` MINOR, Anayasa `v1.38.0 → v1.38.1` PATCH.

---

## 🗄️ ARSIV — TUR #123 KISMI KAPANIS ✅ (A1 + Mimar Hatasi 59 tespit)

**Durum:** TUR #123-128 birlesik mektup (60 atom, 6 TUR) Code Madde 4.4 (kod kaynaktir) ile dogrulandi. 6 atom verified, 6 atom architect speculation cikti.

**Uygulanan 1 atom (A1):** Skip link + global focus-visible + sr-only utility (`layout.tsx` + `globals.css`). Madde 30.83 anayasa madde.

**DEFER 9 atom + 5 TUR:** Architect mektupta kod-kanitsiz iddialar (Mimar Hatasi 59 tescil → Madde 30.83.1 yeni).

Panel 1.20.0→**1.21.0**, Anayasa v1.37.0→**v1.38.0**. Backend sabit.

### Madde 30.83 + 30.83.1
- 30.83 — Erisilebilirlik WCAG AA (skip link + focus + ARIA + label + touch + renk + kontrast)
- 30.83.1 — Mektup Pre-Flight (architect mektup oncesi her dosya grep, "muhtemelen" yasak)

---

## 🗄️ ARSIV — TUR #122 KAPALI ✅ (What-If Kusur Slider — Senaryo Analizi Disiplini)

**Saha kanıt:** Kimi v4.1 10 öneri analizi (önceki rapor) — #4 What-If Slider en düşük risk + motor hazır → seçildi.

### 1 atom (UÇTAN UCA, DEFER 0)
- A1 `SenaryoAnaliziYaralanma` component + Step3 mount (motor reuse, Madde 30.82+30.61+35)

**Madde 30.82 yeni** — Senaryo Analizi Disiplini (backend motor reuse zorunlu, paralel formül YASAK, brand renk Madde 35)

Panel 1.19.0→1.20.0, Anayasa v1.36.0→v1.37.0. Backend sabit.

---

## ⏭️ NEXT — TUR #123

**CEO seçimi:**
1. Email/Phone revert endpoint (TUR #121 M4 ek katman)
2. 2FA aktif kullanıcılar profil değişiminde 2FA OTP
3. Niyazi DEMİR ilk gerçek lead retrospektifi
4. TUR #117 deploy fail Render log analizi
5. Premium görsel CEO görsel feedback (TUR #121 M5 sonrası)
6. 52 küçük il × ilçe (TUR #117 SARI)
7. Vefat hesabı için what-if (Kimi #4 emsali genişletme — `hesaplaVefatTazminati` motor zaten var)

---

## 🎯 ÖNCEKİ — TUR #121 KAPALI ✅ (5 Madde UÇTAN UCA)

**CEO yazılı onay:** 2 KIRMIZI schema değişikliği + ~15 atom uçtan uca tek mektup.

### 5 madde sonuç
- **M1** Prerender fix — 2 UYGULA (force-dynamic private) + 1 SKIP (blog/[slug] async params zaten doğru)
- **M2** DocumentStatus enum +STUCK +DELETED — KIRMIZI CEO onaylı
- **M3** `.dockerignore` (15 kategori) — Dockerfile SKIP (Render Node auto-detect)
- **M4** Email/Phone 2FA tam zincir — EmailOtp model + User 2 sütun + 4 endpoint + UI OTP modal + KVKK m.11
- **M5** Premium SVG typography + diyagonal aksent (mikro iterasyon)

### 3 Yeni Madde
- **30.79** Prerender Static Optimization
- **30.80** Çift Kanal Doğrulama (KVKK m.11)
- **30.81** Build Cache

Backend 1.14.1→1.15.0, Panel 1.18.1→1.19.0, Anayasa v1.35.0→v1.36.0, Schema 1.6.0→1.7.0.

---

## ⏭️ NEXT — TUR #122

**CEO seçimi:**
1. Email/Phone revert endpoint (24h penceresi geri alma — M4 ek katman)
2. 2FA aktif kullanıcılar profil değişiminde 2FA OTP zorunluluğu
3. Niyazi DEMİR ilk gerçek lead retrospektifi
4. TUR #117 deploy fail Render log analizi
5. 52 küçük il × ilçe (TUR #117 SARI)
6. Premium görsel kullanıcı test (M5 sonrası CEO görsel feedback)

---

## 🎯 ÖNCEKİ — TUR #120.1 mikro hotfix ✅ (Next.js 16 middleware.ts → proxy.ts rename)

**Saha kanıt:** Vercel build "Both middleware file and proxy file are detected" — TUR #119 middleware.ts ile mevcut proxy.ts çakıştı.

### 5 atom (UÇTAN UCA, DEFER 0)
- A1 proxy.ts view (Senaryo B — gerçek auth+2FA kod)
- A2 middleware redirect mantığı proxy.ts başına merge (Madde 4.6 mevcut KORUNDU)
- A3 middleware.ts git rm
- A4 Build smoke (middleware-proxy çakışması KAYBOLDU)
- A5 5 belge OS senkron + Madde 30.78 yeni

**Madde 30.78 yeni** — Framework Major Version Disiplini (Next.js 16 + React 19 + Tailwind 4 baseline)
**Mimar Hatası 58** — Framework Version Cehaleti (TUR #119 middleware.ts cehaleti)

Panel 1.18.0→1.18.1 PATCH. Anayasa v1.35.0 sabit. Backend 1.14.1 sabit.

---

## 🎯 ÖNCEKİ — TUR #120 KAPALI ✅ (SEO Crawl Bütçesi Açılımı — Schema.org BlogPosting + Sitemap)

**Saha kanıt:** Google Search Console 36 URL "Discovered — not indexed". 4 hipotez kanıt-bazlı değerlendirildi.

### 7 atom (3 UYGULA + 4 SKIP no-op, DEFER 0)
- A1 ⊘ /basvuru prefix bug yok (robots.ts kanıtı)
- A2 ✓ sitemap blog priority 0.6→0.8
- A3 ✓ articleSchema Article→BlogPosting + mainEntityOfPage
- A4 ⊘ BlogSection MEVCUT (HomePageClient:405)
- A5 ⊘ organizationSchema+websiteSchema MEVCUT (layout.tsx:97)
- A6 ✓ version + 5 belge senkron
- A7 ✓ build + commit + push

**Madde 30.77 yeni** — SEO Crawl Bütçesi Disiplini (4 katmanlı defensive)

Panel 1.17.0→1.18.0, Anayasa v1.34.0→v1.35.0. Backend sabit.

### Manuel iş (CEO 5 dk)
Search Console: Sitemap yeniden gönder + 5 kritik blog URL Request Indexing → 3-7g sonra "Discovered" 36→<10 hedef.

---

## ⏭️ NEXT — TUR #121

**CEO seçimi:**
1. Email/Phone 2FA + 24h onay (TUR #118 sarı endişe, KVKK m.11)
2. Niyazi DEMİR ilk gerçek lead retrospektifi
3. TUR #117 deploy fail kök sebep teşhis (Render log)
4. Premium görsel iterasyon (kartvizit estetik)
5. DocumentStatus enum eksik
6. 52 küçük il × ilçe ekleme (TUR #117 sarı endişe)

---

## 🎯 ÖNCEKİ — TUR #119 KAPALI ✅ (Vercel Domain Redirect + SEO Temizliği)

**Saha kanıt:** Bing'de `tedbirge-panel.vercel.app/haberler+/basvuru` index olmuş — marka karmaşası + SEO duplicate. CEO 13 May 01:10 direktifi.

### 5 atom (UÇTAN UCA, DEFER 0, panel-only)
- A1 middleware.ts yeni (`*.vercel.app` + apex → 301 canonical)
- A2 Mevcut middleware MERGE (yoktu, yeni dosya)
- A3 robots.ts disallow 12 path + host bildirimi
- A4 layout.tsx canonical metadata
- A5 sitemap.ts no-op (zaten canonical)

**Madde 30.76 yeni** — Marka Domain Disiplini (3 katmanlı SEO defensive)

Panel 1.16.0→1.17.0, Anayasa v1.33.0→v1.34.0. Backend sabit.

### Manual iş (CEO 5 dk)
Google Search Console URL Removals — `tedbirge-panel.vercel.app/*`

---

## ⏭️ NEXT — TUR #120

**CEO seçimi:**
1. **Email/Phone 2FA + 24h onay penceresi** (TUR #118 sarı endişe, KVKK m.11)
2. **Niyazi DEMİR ilk gerçek lead retrospektifi**
3. **TUR #117 deploy fail kök sebep teşhis** (Render log analizi)
4. **Premium görsel iterasyon** (kartvizit estetik, ertelenen)
5. **DocumentStatus enum eksik** (analyzer/maintenance)

---

## 🎯 ÖNCEKİ — TUR #118 KAPALI ✅ (Profil Edit Tam Donanım — Ad Soyad + Email + Telefon)

**Saha kanıt:** Emine ÇELİK profil edit eksik — TUR #116-117 fokuslarında profil kimliği unutuldu (Mimar Hatası 57).

### 6 atom (UÇTAN UCA, DEFER 0)
- A1 PATCH /auth/me email/phone/fullName + unique check + KVKK m.10 audit
- A2 Email 2FA + 24h onay DEFER TUR #119
- A3 PersonalEditCard yeni component (3 input + validation + phone preview)
- A4 Profil sayfa entegrasyon (temsilci + (panel) profil)
- A5 Telefon SMS OTP DEFER TUR #119
- A6 5 belge OS senkron + Madde 30.75 + Mimar Hatası 57

**Madde 30.75 yeni** — Kritik Veri Değişim Audit Disiplini (KVKK m.10)

Backend 1.13.0→1.14.0, Panel 1.15.0→1.16.0, Anayasa v1.32.0→v1.33.0.

---

## ⏭️ NEXT — TUR #119

**CEO seçimi (Madde 17.5):**
1. **Email değişim 2FA + 24h onay penceresi** (KVKK m.11 hak, TUR #118 SARI)
2. **Telefon SMS OTP doğrulama** (TUR #113 emsali, TUR #118 SARI)
3. **2FA aktif kullanıcılar profil değişikliğinde 2FA OTP**
4. **TUR #117 deploy fail çözüm** (Render log analizi gerek)
5. **Premium görsel iterasyon** (kartvizit estetik, ertelenen)
6. **Niyazi DEMİR ilk gerçek lead retrospektifi**

---

## 🎯 ÖNCEKİ — TUR #117 KAPALI ✅ (6 Atlama Tek Seferde)

**Saha kanıt — 6 atlama:** country + dinamik banner + 81 il + ilçe + telefon format + vector ikon. CEO 5. ısrar emsali — UÇTAN UCA tek atomik commit.

### 11 atom (UÇTAN UCA, KIRMIZI 1)
- A1-A2 schema country + idempotent ALTER
- A3 turkey-locations.json (81 il × 499 ilçe)
- A4 PATCH /auth/me country validation
- A5 AdresEditCard 5 field (Ülke + Adres + 81 il dropdown + ilçe dropdown + Posta)
- A6 SAKARYA banner dinamik (Madde 4.4)
- A7 buildUserAddressLine 5 seviye + country
- A8 formatTurkishPhone helper (Madde 30.74)
- A9 SVG Lucide vector ikon
- A10 Profil entegrasyon
- A11 5 belge OS senkron

### 3 Yeni Madde
- **30.72** Dropdown Disiplini
- **30.73** Geleceğe Hazırlık Disiplini (Almanya pilot 2028+)
- **30.74** Standart Format Disiplini (telefon `0 5XX XXX XX XX`)

Backend 1.12.0→1.13.0, Panel 1.14.0→1.15.0, Anayasa v1.31.0→v1.32.0, Schema 1.5.0→1.6.0.

---

## ⏭️ NEXT — TUR #118

**CEO seçimi:**
1. **Premium görsel iterasyon** (TUR #112'den ertelenen)
2. **52 küçük il ilçe ekleme** (TUR #117 SARI ENDIŞE)
3. **Niyazi DEMİR ilk gerçek lead retrospektifi**
4. **bolge → city migration script** (manuel sarı endişe)
5. **DRY refactor** components/kurumsal

---

## 🎯 ÖNCEKİ — TUR #116 KAPALI ✅ (User.address Schema KIRMIZI + Profil Adres Edit + Kartvizit Tam Adres)

**CEO YAZILI ONAY (Madde 18.3):** "TUR #116 = User.address schema eklemesi (Madde 3 KIRMIZI — CEO onaylıyor)" — Mehmet DİNÇ, 12 May 2026

**Saha kanıt:** Emine ÇELİK kartvizit "SAKARYA" tek alan, tam adres gerekli (matbaa öncesi).

### 6 atom (UÇTAN UCA, KIRMIZI 1)
- **A1** Schema +4 alan (address/city/district/postalCode), bolge KORUNDU (Madde 4.6)
- **A2** apply-pending-schemas idempotent ALTER × 4
- **A3** PATCH /auth/me + GET genişletme + KVKK audit
- **A4** AdresEditCard paylaşılan component, temsilci/profil + (panel)/profil mount
- **A5** corporate.service 3 nokta `buildUserAddressLine` 4-seviye öncelik + RFC 6350 vCard
- **A6** bolge migrate DEFER (manuel)

### Madde 30.71 yeni — Schema KIRMIZI Geçiş Protokolü
3 şart: CEO yazılı onay + Additive + Idempotent SQL. Migration dosyası YASAK.

Backend 1.11.0→1.12.0, Panel 1.13.0→1.14.0, Anayasa v1.30.0→v1.31.0, Schema 1.4.0→1.5.0.

---

## ⏭️ NEXT — TUR #117

**CEO seçimi (Madde 17.5):**
1. **Premium görsel iterasyon** (TUR #112'den ertelenen — kartvizit estetiği)
2. **Niyazi DEMİR ilk gerçek lead retrospektifi** (saha akış kanıtı)
3. **bolge → address migration script** (SARI ENDIŞE çözümü)
4. **DRY refactor** `components/kurumsal/KurumsalPage.tsx` (TUR #114 teknik borç)

---

## 🎯 ÖNCEKİ — TUR #115 KAPALI ✅ (Kartvizit Adres + Yetki Türkçe + Sidebar RBAC Dinamik)

**Saha kanıt:** Emine ÇELİK saha zincirinin #3 bulgusu — 3 saha sorunu uçtan uca çözüldü.

**5 atom:** Adres öncelik (A1) + Schema kontrol (A2 SARI TUR #116) + MODULE_LABELS Türkçe (A3) + Sidebar RBAC (A4) + Placeholder (A5)

**Madde 30.69 + 30.70 yeni** — Türkçe Lokalizasyon + RBAC Dinamik Sidebar

Backend 1.10.0→1.11.0, Panel 1.12.0→1.13.0, Anayasa v1.29.0→v1.30.0.

---

## ⏭️ NEXT — TUR #116 (SARI ENDIŞE çözümü)

**Öneri 1:** User.address + User.city schema teklifi + Profil sayfasında adres edit (TUR #115 SARI ENDIŞE çözümü)

**Öneri 2:** Premium kartvizit görsel iterasyon (TUR #112 plan)

**Öneri 3:** DRY refactor `components/kurumsal/KurumsalPage.tsx` (TUR #114 teknik borç)

---

## 🎯 ÖNCEKİ — TUR #114 KAPALI ✅ (REP Kurumsal Route + Admin Sözleşme Görünürlük)

**Saha kanıt zinciri:** Emine ÇELİK TUR #113'te sözleşme imzaladı (ilk REPRESENTATIVE milestone) → TUR #114 #2 bulgu: sidebar Kurumsal butonları çalışmıyor + ADMIN panel sözleşme listesi yok.

**Sonuç:** 6 atom uçtan uca uygulandı (DEFER 0), Madde 30.68 yeni (Rol Bazlı Route Scope), MH56 emsali.

### Ana değişiklikler
- `/temsilci/kurumsal/page.tsx` yeni — REP için Kurumsal sayfa
- AppLayout sidebar rol bazlı URL (REP→/temsilci, ADMIN/LAWYER/SALES→/dashboard)
- `GET /api/admin/sozlesmeler` + UI sayfa — ADMIN audit görünürlük
- Sidebar HUKUK section'a "Sözleşmeler" link

Backend 1.9.0→1.10.0, Panel 1.11.0→1.12.0, Anayasa v1.28.0→v1.29.0.

---

## 🎯 ÖNCEKİ — TUR #113 KAPALI ✅ (Temsilci Sözleşme SMS OTP — Emine ÇELİK Saha Acil)

**Saha kanıt:** Emine ÇELİK (gerçek REPRESENTATIVE) `/temsilci/sozlesme` "SMS gönderilemedi: Route bulunamadı" hatası — onboarding tıkalı, kartvizit/broşür/reklam butonları çalışmıyor (sözleşme kilidi).

**Sonuç:** 2 yeni endpoint (sms-otp + imzala), schema değişikliği YOK (mevcut User alanları + PhoneOtp), Backend 1.8.3 → 1.9.0 MINOR.

**Madde 30.67 yeni** — Onboarding Akış Bütünlüğü Disiplini:
1. Frontend stub mod production yasağı (CEO yazılı onay zorunlu)
2. Onboarding her ekran zorunlu (sözleşme imzasız butonlar disabled)
3. Frontend 404 → anlaşılır mesaj
4. Schema mevcut alanlar önce kontrol

**Mimar Hatası 55** — Frontend Stub Mod Production Tuzak (Emine ÇELİK emsali).

---

## ⏭️ NEXT — TUR #114 (Premium Görsel İterasyonu)

TUR #112'de planlanan görsel kaliteyi yükseltme — saha akış (TUR #113) ile gecikti, şimdi öncelik.

### Öneri yön (CEO seçimi — Madde 17.5):
1. **Premium kartvizit görsel iterasyon** — kişi fotoğrafı slot + diyagonal pattern + pdfkit upgrade (variable font wght axis)
2. **Niyazi sahaya çıkış retrospektifi** — Emine ÇELİK + diğer REP'lerin ilk lead'leri
3. **financialFlowGuard** — ilk 5 komisyon havalesi sonrası DEFER registry

---

## 🗄️ ÖNCEKİ — TUR #112 KAPALI ✅ (Premium Kartvizit + 5 Format + Font Embed + Türkçe Fix)

**Tip:** Premium kartvizit uçtan uca tasarım — Madde 17.2 R1 emsali (parçalı iş yasak)
**Sonuc:** 10/10 atom uygulandı (CEO uçtan uca direktifi — Mimar Hatası 52 pratik tescil)
**Yeni anayasa madde:** Madde 30.65 (Premium Kartvizit Disiplini)

### Production'a giren değişiklikler:
- 7 TTF font dosyası (Inter Tight + Crimson Pro + JetBrains Mono OFL) — A1
- UTF-8 encoding tüm SVG çıktılarda — A2
- Premium ön yüz SVG (Tedbirge + tedbirator italic yeşil etiket) — A3
- Premium arka yüz SVG (diyagonal aksent + reklam metni + QR) — A4
- PNG frontend canvas conversion (sharp YOK pattern) — A5
- Matbaa PDF endpoint (92×62mm + font embed + trim marks) — A6
- Dijital paylaşım PDF endpoint (compress, email uyumlu) — A7
- RBAC `kartvizit:print` action — A8
- Panel KartvizitTab premium UI (5 format + ön/arka + reklam editor) — A9
- ShareButton + brand.json + 5 belge OS senkron + atomik commit — A10

### Tedbirator etiket strateji (TUR #111 → TUR #112 değişim)
TUR #111 `registered: true` SMK m.30 riski → TUR #112 `displayMode: "label"` italic yeşil etiket (alt marka değil, sektör konumlandırma). Tescil iddiası YOK, hukuki risk sıfır.

---

## 🎯 ÖNCEKİ — TUR #110 KAPALI ✅

**Tip:** OS Temel Sıkılaştırma + judicialResponse + Niyazi sahaya çıkış HAZIR
**Commit:** `ead8a6b` (backend) + `58a730c` (panel) — Render `dep-d800eomrnols73cpchjg` ✅ live
**Sonuç:** 8/17 atom uygulandı, 9 atom dürüst DEFER (Madde 30.31 R1 emsal)

### Production'a giren değişiklikler:
- Reconciler 5 detect handler (A3) — Madde 30.63 yeni
- Dead auditor.js silindi (A4) — namespace borç kapandı
- Boot 12 → 9 step (A6) — Oracle + pg-boss + Cron Scheduler arşive
- `/api/boot-status` + BootTimelineWidget (A8)
- JudicialResponse Prisma model + 3 endpoint + form sayfası + 9. sekme (C1)
- 6 modül DEFER registry (C2) — Madde 28 kanıt eşiği
- Lead.firstRealLead boolean (C3) — milestone flag
- 5 belge senkron + atomic commit (D1+D3)

---

## ⏭️ NEXT — TUR #113 (Önerilen: Premium Görsel İterasyonu)

**Tetikleyici:** TUR #112 PDF spacing 3 mikro hotfix sonrası kartvizit fonksiyonel ✅ ama görsel olarak eski Tedbirator estetiği seviyesinde değil.

### NEXT 1 (önerilen): Premium Görsel İterasyon
- Kişi fotoğrafı slot (REPRESENTATIVE/SALES için, opsiyonel)
- Diyagonal pattern aksent (eski Tedbirator estetik referansı)
- Hiyerarşik kompozisyon (isim/rol/iletişim grup ayrımı belirgin)
- pdfkit upgrade ile variable font wght axis aktivasyonu (Bold/Regular ayrımı)
- Madde 30.66 trade-off güncellemesi (visual weight kayıp → kazanım)

### NEXT 2 (alternatif): Niyazi sahaya çıkış retrospektifi
- Saha kullanıcı geri bildirimi
- Lead.firstRealLead manuel set + uçtan uca akış kanıtı
- UX bug listesi (varsa fix)
- 24 saat sonra `firstContactSpeed` computed metric

### NEXT 3 (DEFER registry): financialFlowGuard / zamanaşımıGuard / opposingParty (Madde 28 kanıt eşiği — TUR #112+)

---

## 🗄️ TUR #111 İPTAL (CEO reset)

**Tetikleyici:** Ekrandaki 3 somut sorun fix (production canlı kanıt)
**Durum:** Code TUR #111'i 8 atom ile uyguladı, CEO görsel inceleme sonrası `git reset --hard HEAD~1` ile geri aldı. Tedbirator `registered: true` SMK m.30 riski TUR #112'de elimine edildi (label stratejisi).

### 3 atom (önerilen):
1. **A1** — Footer modül sayım fix (15/16 → 16/16 doğru sayım)
2. **A2** — Healer Kurtarma modülü gerçek retry zinciri (24 FAILED Document → 0)
3. **A3** — Güvenlik 2FA tekrarlayan ADMIN_FEED bildirim + brute-force IP rate limit

**Tahmin:** 2-3 saat, 0 KIRMIZI, 0 yeni modül, $0 (Madde 24.14 ✅)

**Hedef:** Sistem-durumu UI tamamen yeşil (UYARI + KRİTİK kalkar)

### Alternatif TUR #111 yönü:
Niyazi'nin getireceği **gerçek lead retrospektifi**:
- Lead.firstRealLead flag manuel set
- Lead → Müvekkil → Avukat atama uçtan uca akış kanıtı
- UX bug listesi (varsa fix)
- 24 saat sonra **firstContactSpeed** computed metric

---

## 🌟 PAZARTESİ 11 MAYIS 09:00 — NİYAZİ SAHAYA ÇIKIŞ

**CEO + Niyazi 4 senaryo manuel smoke:**
1. Niyazi REPRESENTATIVE login (`/login?rol=temsilci`) ✅ canlı
2. Lead create form (`/temsilci`)
3. Avukat ataması (Ramazan/Zeliha/Muzaffer)
4. Müvekkil 2FA setup wizard (TUR #72.6 + #79 altyapı)

**Saha araç seti (CEO manuel):**
- WhatsApp Business numarası + QR kod (`/baslat?ref=NIYAZI_001`) — UTM mevcut altyapı
- 1 sayfa onboarding rehberi (Tedbirge nedir, nasıl başvurulur)

---

## 🟡 PLANLI (TUR #112+)

### TUR #112+ — financialFlowGuard modülü
**Tetikleyici eşik:** İlk 5 komisyon havalesi geldiğinde
**Schema:** BankTransaction (mutabakat tablosu)
**Süre:** ~3 saat

### TUR #113+ — zamanasimiGuard modülü
**Tetikleyici eşik:** İlk 10 aktif dava (zaman aşımı yaklaşan)
**Yasal dayanak:** TBK m.72 + KTK m.109 + Sigorta Sözleşmesi + SBM bildirim
**Süre:** ~4 saat

### TUR #115+ — opposingParty modülü
**Tetikleyici eşik:** 5 dava kapanışı (sigorta şirketi pazarlık verisi birikince)
**Süre:** ~3 saat

### TUR #117+ — customerSentiment modülü
**Tetikleyici eşik:** 30 müvekkil aktif (panel-dışı duygu izleme)
**Süre:** ~4 saat

### TUR #118+ — trustIndex modülü
**Tetikleyici eşik:** 30 müvekkil + 5 dava WON
**Public:** `/guven-endeksi` sayfası (TBB Reklam Yön. uyumlu)
**Süre:** ~3 saat

### TUR #135+ — lawyerContractLifecycle modülü
**Tetikleyici eşik:** İlk sözleşme yenilemesi (~12 ay sonra)
**Süre:** ~4 saat

---

## 🔴 KIRMIZI ÇİZGİ (DEFER — Madde 30.31 R1)

### A5 — EventBus 46 emit cleanup
**Neden DEFER:** Audit trail KVKK m.10 koruması, kanıt-bazlı liste yapılmadan silmek YANLIŞ.
**Hedef TUR:** Kanıt-bazlı emit kullanım listesi yapıldıktan sonra (TUR #114+).

### A7 — HAL 9→6 type silme
**Neden DEFER:** Mektup "Code keşfedecek" diyor — stratejik tasarım kararı (Madde 14.3 mimar oturumu).
**Hedef TUR:** Mimar oturumu yapıldıktan sonra (TUR #116+).

### B1-B4 — Niyazi sahaya çıkış smoke
**Neden DEFER:** Manuel/operasyonel — kod TUR'u değil. CEO+Niyazi Pazartesi 11 May test edecek.

---

## 📊 KAZANIM ÖZETİ (BU HAFTA — TUR #105 → #110)

- **Madde 31.11** — Sıfır Sonuç UX Guard (TUR #105)
- **Madde 22.9 R2** — Sürüm Senkron PATCH (TUR #105.5)
- **Madde 31.12-13** — Vefat tazminat 11 kombinasyon (TUR #106)
- **Madde 17.2 R1** — Parçalı İş Yasağı (TUR #107) + Madde 31.14-15
- **TUR #108** — OS Dependency Mapping (pure keşif, 7 kritik bulgu)
- **TUR #109** — KISMİ KAPALI (mimarHatasi visibility + runActiveTask, A1+A2)
- **TUR #110** — OS sağlık temel + judicialResponse + 3 yeni anayasa maddesi (30.61-63)

---

## ⚠️ MİMAR HATASI ZİNCİRİ (DERS)

- **Mimar hatası 50** (TUR #108-109 arası) — Kod gerçeğine bakmadan 12 modül önerme. Düzeltme: TUR #108 keşif raporu.
- **Mimar hatası 51** (TUR #109) — TUR #108 sonrası taahhüt ihlali. Düzeltme: TUR #110 dürüst 9 DEFER + Madde 30.31 R1 emsal.

**Yeni sohbette dikkat:** Mimar (sohbet Claude) **CEO sözünün üzerine modül listesi pişirme refleksi**ni tespit ederse anında DUR (Madde 4.3 + 14.5).

---

## 🎯 LANSMAN HEDEFİ

**14 Haziran 2026 — Tedbirge.ai resmi lansman (35 gün kaldı)**

Hedef: 17 avukat, 250 müvekkil, 720 lead (yıl sonu — fizibilite raporu)

---

— İş Planı v1.27.0 · 10 Mayıs 2026 · TUR #110 KAPALI
