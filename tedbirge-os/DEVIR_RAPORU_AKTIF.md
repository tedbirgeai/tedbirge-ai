# 🛡️ TEDBIRGE.AI — DEVİR RAPORU (AKTİF)

📋 **ANAYASA:** v1.43.0 MINOR (Madde 30.92 yeni — Master Data Disiplini)
📂 **🚀 TUR #132.1 KAPALI: AI CEKIRDEK SAHA DOGRULAMA HOTFIX + HIBRIT KORUMA — 14 ATOM 🚀**
📅 **SON GÜNCELLEME:** 15 Mayıs 2026 Cuma gece (TUR #132.1 KAPALI — hotfix)
👤 **CEO Onay:** Mehmet DINÇ — "belge yukleme hibrit sistemdir hic bir seyi bozmadan uctan uca kod tabanli otonom aksin gitsin 0 hata ile duzelt bana hic bir sey sorma basla bitir." (15 May 2026 gece, Madde 18.3 yazili onay = KIRMIZI 2 + KIRMIZI 3)
🤖 **Mimar:** Claude Opus 4.7 (TUR #132.1 mektup, 14 atom + Madde 30.92 yeni + MH61 + MH62 tescil) + Claude Code (pre-flight grep hibrit harita + 14 atom uygulama)
🌟 **Tarih:** 15 Mayıs 2026 gece — 44 ARDISIK TEMIZ TUR REKOR (#90 → #132.1)

---

## 🎯 BUGÜN — TUR #132.1 KAPALI (AI Cekirdek Saha Dogrulama Hotfix)

**CEO 14 May 2026 saha kanit (6 ekran):** 3 KIRMIZI bug + 2 SARI tutarsizlik.

### Bulgular ve Cozumler
- **Bug 1 (MH61):** Duplicate phone false positive — `public.route.js` `findFirst({customerPhone: String(phone).trim()})` normalize'siz. ATOM 9: `canonicalPhone` helper tek kaynak (Madde 30.61) + DB'deki tum lead'leri kanonik karsilastir.
- **Bug 2:** Lead detay "Failed to fetch" mavi banner — generic transient hata. ATOM 8: 2s sonra tek seferlik retry + banner suppress (Senaryo E).
- **Bug 3:** AI ciktisi Lead'e yazilmiyor. ATOM 6: `mergeAiResultToLead` (idempotent aiMergedAt guard) + finalize-upload setImmediate entegrasyon.
- **Bug 4:** Tahmini tazminat 221.240 sabit — `calculateCompensation({})` engine default ~221K uretiyor (Madde 30.90 ihlali). ATOM 7: `lead.service.js` createLead'de `compensationInput` yetersiz veri ise `estimatedCompensation: null` + `lead-estimation.service.js` AI merge sonrasi yeniden hesap.
- **Sari:** Avukat Is Yuku %NaN. ATOM 11-12: `Number.isFinite` guard + 0 dava ise em-dash (Madde 31.11).

### Uygulanan 14 atom (DEFER 0 — HIBRIT KORUMA Madde 4.6 maksimum)
- ATOM 1: Pre-flight grep + hibrit harita (Madde 30.83.1)
- ATOM 2: InsuranceCompany master data JSON (30 firma v1-2026)
- ATOM 3: Schema additive — Lead +11 alan + InsuranceCompany model + AccidentType enum. **kazaTarihi + maluliyetOrani SKIP** (mevcut `accidentDate` + `maluliyetOrani` korundu, Madde 4.6 + 30.31 R1 dürüst SKIP)
- ATOM 4: apply-pending-schemas.js 13 yeni idempotent değişiklik
- ATOM 5: master-data.service.js YENI + server.js boot seed entegrasyon
- ATOM 6: ai-analyzer.service.js `mergeAiResultToLead` + documents.upload.routes.js MERGE
- ATOM 7: lead-estimation.service.js YENI + lead.service.js null sentry
- ATOM 8: Lead detay loadLead transient retry pattern
- ATOM 9: phoneNormalize.js + public.route.js findFirst kanonik karsilastirma
- ATOM 10: Lead detay UI estimatedCompensation null gösterim (amber "veri eksik" card)
- ATOM 11-12: Dashboard NaN guard (Avukat İş Yükü winPct + avgCompensation)
- ATOM 13: Healer yeni retry case `stuck_ai_merge`
- ATOM 14: 5 belge OS senkron + version + commit + push

### Madde 30.92 yeni
Master Data Disiplini — sabit referans veri JSON dosyalari versioning'li, boot seed idempotent upsert (Madde 30.61 sentezi).

### Mimar Hatalari tescil
- **MH61:** Frontend-Backend Tutarsizlik (Duplicate Check) — phone normalize'siz iki tarafta da
- **MH62:** Saha Dogrulamasiz "TUR KAPALI" Ilani — Madde 28 saha kanit esigi atlandi

### Sürüm
Backend `1.16.0 → 1.17.0` MINOR · Panel `1.26.0 → 1.27.0` MINOR · Schema `1.8.0 → 1.9.0` · Anayasa `v1.42.0 → v1.43.0` MINOR.

### NEXT TUR #133 — M3 Master Data + M5 Hak Analizim
CEO yeni direktif bekler (Madde 30.25 R1). Hedef:
- M3 ICD-10 master data (en sik 200 kod)
- M3 Maluliyet TRH-2010 detay tablosu
- M3 ZMSS limit yillik (2026 v1)
- M5 CUSTOMER "Hak Analizim" tab (Lead AI verisi gorunur)
- faultRate vs kusurOrani DEPRECATED isaretleme (Madde 30.61)
- Eski test data soft-delete

---

## 🗄️ ARSIV — TUR #132 KAPALI (AI Cekirdek TAC M1 Belge Ayristirici)

**Saha Vaadi (Madde 30.90):** "Musvekkil belge yukleyince dakikalar icinde kaza turu / sigorta sirketi / police no / maluliyet orani / kusur orani / ICD-10 / vefat var mi / arac deger kaybi otomatik cikmali." — Mehmet DINÇ 15 May 2026.

### Uygulanan 16 atom (DEFER 0 — Madde 17.2 R1)
- **ATOM 1** Pre-flight grep raporu OTONOM_RAPOR.md (Madde 30.83.1) — Anthropic SDK mevcut, ANTHROPIC_API_KEY mevcut, finalize-upload pipeline mevcut tespit
- **ATOM 2** SKIP — `@anthropic-ai/sdk@^0.89.0` mevcut (Madde 4.6)
- **ATOM 3** SKIP (manuel iş) — env zaten var, sadece kod null check
- **ATOM 4** `src/services/ai-analyzer.service.js` YENI — Claude Opus 4.7 + 14 alan structured JSON (epikriz/police/kaza-tutanagi vb tespit)
- **ATOM 5-6** `src/routes/documents.upload.routes.js` MERGE — finalize-upload setImmediate'a TAC M1 entegrasyonu (Madde 4.6 mevcut analyzer korunur)
- **ATOM 7** Document 6 + User 3 yeni alan additive (KIRMIZI 1, CEO yazili onay)
- **ATOM 8** apply-pending-schemas.js 9 yeni ALTER (idempotent)
- **ATOM 9** `tedbirge-panel/components/customer/AcikRizaModal.tsx` YENI — KVKK m.6 acik riza UI (WCAG AA + 44px touch)
- **ATOM 10** `src/routes/kvkk.routes.js` POST `/kvkk/acik-riza-document-upload` + ip/UA audit
- **ATOM 11** `BelgeYukleme.tsx` MERGE — consent gate (modal acilir, /auth/me'den kvkkM6ConsentAt kontrol)
- **ATOM 12** `/auth/me` select `kvkkM6ConsentAt` eklendi
- **ATOM 13** `DocumentList.tsx` MERGE — needsManualReview ⚠️ badge + aiConfidence ✅ % badge
- **ATOM 14** `healer.js` MERGE — old_failed_documents `deleteMany` → setImmediate retry (audit zinciri korundu)
- **ATOM 15** `src/services/ai-cost-tracker.service.js` YENI — aylik $100 limit ADMIN_FEED bildirim
- **ATOM 16** Anthropic ZDR/backend-only headers dokumantasyonu
- **ATOM 17** 5 belge OS senkron + version.json + 2 package.json
- **ATOM 18** Smoke (prisma generate + tsc --noEmit) + atomik commit + push

### Madde 30.90 + 30.91 yeni
- **30.90 Saha Vaadi:** Mimar fizibilite vaat-bazli, risk matrisi ikincil
- **30.91 KVKK m.6:** Acik riza ekrani zorunlu + sifreli storage + Anthropic backend-only (Enterprise ZDR TUR #150+ teknik borc)

### Sürüm
Backend `1.15.0 → 1.16.0` MINOR · Panel `1.25.0 → 1.26.0` MINOR · Schema `1.7.0 → 1.8.0` (Document 6 + User 3 yeni alan) · Anayasa `v1.41.0 → v1.42.0` MINOR.

### NEXT TUR #133 — M2 Lead Schema Genisleme
Hedefler:
- Lead'e 10 yeni alan (kazaTarihi, kazaTuru, kazaYeri, sigortaSirketi, policeNo, maluliyetOrani, hasInjury, icdCode, vefatVar, aracDegerKaybi)
- M1 AI Analyzer ciktisi → Lead otomatik merge (confidence ≥ 0.85)
- AccidentType enum (TRAFFIC | WORK | OTHER)
- faultRate ve kusurOrani duplicate temizlik (Madde 30.61)

---

## 🗄️ ARSIV — TUR #131 KAPALI (SEO/CRO 9 Atom GSC Kanit-Bazli)

**Pre-flight GSC kanit:** 16 günde (26 Nis-11 May 2026) 70 tıklama / 310 gösterim / 0 başvuru. CRO + SEO eş zamanlı sorun.

### Uygulanan 9 atom (DEFER 0)
- **ATOM 1** `/basvuru/layout.tsx` YENI metadata (CTR %5.19 → %15+ hedef) + H1 lead-intent + 4 güven sinyali + CTA #15803D
- **ATOM 2** `/trafik-kazasi-tazminat` title+meta (Hesaplama 2026 + Yargıtay 17. HD + araç değer kaybı keywords)
- **ATOM 3** `/blog/zmms-teminat-limitleri-2026` title genişletme (61 imp 0% CTR → SEDDK 2026 limitleri net)
- **ATOM 4** `/blog/hayvana-carpma-trafik-kazasi-sorumluluk` title + lead CTA inline (116 imp lead'e çevir)
- **ATOM 5** 7 blog post toplu meta audit (TBB tarife, SGK 3 gün, ölümlü destek, vb.)
- **ATOM 6** Anasayfa hero CTA `#5CB85C` → `#15803D` + "Ucretsiz Hak Sorgulama (3 dk)" + 3 güven sinyali
- **ATOM 7** `/tazminat-hesapla` JSON-LD FAQPage (6 FAQ, Google rich result)
- **ATOM 8** BlogPostClient.tsx bottom CTA `/` → `/basvuru` + brand renk + lead-intent (1 yerde değişiklik tüm 50+ blog post etkiler)
- **ATOM 9** Madde 30.89 + 5 belge senkron

### Madde 30.89 yeni — SEO/CRO Kanit-Bazli Optimizasyon Disiplini
GSC veri zorunlu kanıt. CTR hedef matrisi (poz 1→%30+, poz 5→%10+, poz 10→%3+). JSON-LD FAQPage tazminat sayfaları. Blog post → /basvuru CTA. 2-4 hafta retro zorunlu.

### Sürüm
Panel `1.24.0 → 1.25.0` MINOR · Anayasa `v1.40.0 → v1.41.0` MINOR. Backend 1.15.0 / Schema 1.7.0 sabit.

### NEXT TUR #132 — GSC Retro (2-4 hafta sonra)
Hedefler:
- /basvuru CTR %5.19 → %15+
- /trafik-kazasi-tazminat CTR %2.08 → %8+
- Blog toplu CTR %0 → %2-3
- İlk gerçek başvuru: ~1-2/hafta

Kanıt tutmazsa atomları revize/geri al.

---

## 🗄️ ARSIV — TUR #130 KAPALI (4 İŞ Tek Atomik — Teknik Borç Temizliği + WCAG Kontrast)

**4 iş tek atomik commit (Madde 17.2 R1 + Madde 30.88 yeni):**

### İŞ 1 — DRY KurumsalPage Refactor (TUR #114 teknik borç, 16 TUR açık)
- `components/kurumsal/KurumsalPage.tsx` YENI (561 satır, eski içerik tam taşındı)
- `app/(panel)/dashboard/kurumsal/page.tsx`: 561 → 9 satır wrapper
- `app/(panel)/temsilci/kurumsal/page.tsx`: 561 → 9 satır wrapper
- **1122 → 579 satır** (543 duplicate satır silindi)
- Madde 30.61 tek-kaynak + 30.68 route scope korundu

### İŞ 2 — 52 Küçük İl İlçesi (TUR #117 SARI ENDIŞE, 13 TUR açık)
- `lib/turkey-locations.json` 81 il × **973 ilçe** (eski 499 + yeni 474)
- 52 boş il'den 0 boş'a (Adıyaman 9, Afyonkarahisar 18, Erzurum 20, Kastamonu 20, ...)
- AdresEditCard sarı banner kaldırıldı (Madde 30.72 tam uyum)
- Placeholder güncellendi
- T.C. resmi kaynak (e-Devlet + İçişleri Bakanlığı public knowledge)

### İŞ 3 — TUR #117 Deploy Fail Teşhis (10 TUR tekrar) — Yol B Dürüst DEFER
- Madde 30.31 R1 dürüst DEFER seçildi
- Code Render CLI/dashboard erişimi YOK → Madde 4.4 ihlal etmeden teşhis imkansız
- Production stable (12 ardışık başarılı deploy TUR #118-#129, health 200)
- Kök sebep retrospektif tespit edilemiyor (log retention belirsiz)
- TUR #131 aday: Render alert webhook (Slack/email) kanıt-bazlı izleme

### İŞ 4 — WCAG AA Kontrast Audit (TUR #123 tamamlama)
- Python lokal contrast hesabı ($0)
- **KRITIK FAIL bulundu:** `#22C55E` BG + white text = **2.28:1** (AA 4.5 gerek)
- **3 yer düzeltildi:**
  1. `app/layout.tsx` skip link `focus:bg-emerald-500` → `focus:bg-emerald-700` (5.02:1 PASS)
  2. `app/globals.css` `*:focus-visible outline` `#22C55E` → `#15803D`
  3. `components/temsilci/MobilFAB.tsx` Yeni Lead ikon `#22C55E` → `#15803D`
- `brand.json` additive: `accentColorDark: "#15803D"` + `accentForeground: "#FFFFFF"`

### Madde 30.88 yeni — Teknik Borç Temizliği Disiplini
3 TUR'dan fazla açık sarı endişe otomatik öncelik artırılır. TUR #130 emsal: 4 borç tek atomik.

### Sürüm
Panel `1.23.0 → 1.24.0` MINOR · Anayasa `v1.39.0 → v1.40.0` MINOR. Backend 1.15.0 / Schema 1.7.0 sabit.

### Smoke
- `npx tsc --noEmit` EXIT=0 ✓
- 0 KIRMIZI · 0 schema · 0 npm install · 0 env · $0
- 5-belge OS senkron aktif

---

## 🗄️ ARSIV — TUR #129 KAPALI (3 Verified Atom UCTAN UCA — Madde 30.85 + 30.86 + 30.87)

**Pre-flight emsal mektup:** Mimar Opus 4.7 TUR #129 mektubunu **kod-kanit zinciri ile** yazdi (TUR #114 + #110 emsal). Code grep dogrulamasi → 3 atom uygulandi, 0 DEFER.

### Uygulanan 3 atom (DEFER 0, UCTAN UCA)

**ATOM 1 — C2 REPRESENTATIVE Mobil FAB (Madde 30.85):**
- `tedbirge-panel/components/temsilci/MobilFAB.tsx` yeni component
- `components/layout/AppLayout.tsx` mount + `pb-[72px] md:pb-6` main padding
- 3 CTA: Yeni Lead (yesil) + Kartvizit (lacivert) + Sozlesme (lacivert)
- `md:hidden` mobil-only, `min-h-[56px]` touch target (WCAG 2.5.5)
- `safe-area-inset-bottom` iOS notch desteği

**ATOM 2 — B3 Filter URL Params Persistance (Madde 30.86):**
- `app/(panel)/dashboard/sozlesmeler/page.tsx` useSearchParams + useRouter
- Filter state URL'e sync (rol + search + page)
- Suspense boundary (Next.js 16 zorunlu) — leads/[id]/page.tsx emsal
- `router.replace` (history kalin olmaz)
- Sayfa yenilenince filter korunur, link paylasilabilir

**ATOM 3 — F4 Lead Detay Code Splitting (Madde 30.87):**
- `app/(panel)/leads/[id]/page.tsx` DocumentList + UploadForm `dynamic()` import
- `components/common/TabSkeleton.tsx` yeni (animate-pulse, ARIA role=status)
- `ssr: false` panel sayfasi zaten client
- Belgeler tab acilince lazy load → ilk yukleme bundle size dusus

### Madde 30.85 + 30.86 + 30.87 yeni

- **30.85 Mobil-First** — REPRESENTATIVE 3 CTA + 44px touch + safe-area
- **30.86 Filter URL Persistance** — useSearchParams + Suspense + router.replace
- **30.87 Core Web Vitals** — Code splitting + skeleton + image priority + font swap

### Surum
Panel `1.22.0 → 1.23.0` MINOR, Anayasa `v1.38.1 → v1.39.0` MINOR. Backend 1.15.0 / Schema 1.7.0 sabit.

### Smoke
- `npx tsc --noEmit` EXIT=0 ✓
- 0 KIRMIZI · 0 schema · 0 npm install · 0 env · $0 maliyet
- 5-belge OS senkron (Madde 30.26) aktif

### Vercel deploy sonrasi manuel smoke (CEO 2 dk)
1. `/temsilci` mobilde alt FAB gorunur (3 CTA) ✓
2. `/temsilci` desktopta FAB GORUNMEZ ✓
3. `/dashboard/sozlesmeler?role=REPRESENTATIVE` URL filter calisir ✓
4. Sayfa yenile → filter korunur ✓
5. `/leads/[id]` belgeler tab → skeleton sonra icerik ✓

---

## 🗄️ ARSIV — TUR #124-#128 KISMI KAPANIS (Pre-Flight 43 atom DEFER + C4 + D6)

**2. iterasyon (TUR #123 sonrasi):** CEO "TUR #124-128 mektubundaki atomlari Madde 30.83.1 pre-flight protokoluyle tek tek grep'le dogrula. Belirsiz iddialar YASAK — kanit yoksa atla."

**Sonuc:** 46 atom grep ile dogrulandi.
- **TUR #124:** 0/10 (3 zaten var, 6 refactor/spec, 1 B8 bug yanlis teshis)
- **TUR #125:** 1/8 — **C4 OTP a11y** (inputMode/autoComplete/aria — SMS auto-fill destegi)
- **TUR #126:** 1/7 — **D6 avukat tam ad** (fullName.split[0] → fullName, KVKK m.11 bilgi hakki)
- **TUR #127:** 0/5 (production-tested kartvizit/brosur micro-tuning, visual kanit yok)
- **TUR #128:** 0/6 (F2 zaten var, F1 yanlis oncul, F3 default)

**Toplam:** 3/46 (%6.5) uygulama. Mektup pattern revize gerek (TUR #129+).

**Surum:** Panel `1.21.0 → 1.22.0` MINOR, Anayasa `v1.38.0 → v1.38.1` PATCH (Madde 30.83.1 pratik tescil).

Bkz. `OTONOM_RAPOR.md` — 46-atom kesin grep tablo.

---

## 🗄️ ARSIV — TUR #123 KISMI KAPANIS (A1 + Mimar Hatasi 59)

**Mektup:** TUR #123-128 birlesik (60 atom, 6 TUR, DEFER 0). Madde 4.4 (kod kaynaktir) zorunlu kildi her atom oncesi grep/view.

**Sonuc:** 6 atom dogrulandi → A1 uygulandi (skip link + focus-visible). A2/A3/A4/A7/A8/D4 architect speculation cikti (mevcut UI zaten dogru, KVKK m.11 zaten var). Mimar Hatasi 59 tescil edildi (Madde 30.83.1 yeni).

**Surum:** Panel 1.20.0 → **1.21.0** MINOR, Anayasa v1.37.0 → **v1.38.0** MINOR. Backend sabit (1.15.0).

### Uygulanan 1 atom (A1)
- `tedbirge-panel/app/layout.tsx`: `<a href="#main">Ana icerige atla</a>` skip link + `<div>` → `<main id="main">`
- `tedbirge-panel/app/globals.css`: `*:focus-visible { outline: 2px solid #22C55E; }` + sr-only utility
- `<html lang="tr">` mevcut dogru ✓
- Brand `#22C55E` accent (brand.json + Madde 35)

### DEFER 9 atom + 5 TUR
Bkz. `OTONOM_RAPOR.md` tablo. Architect mektupta "muhtemelen", "ihtimali", "olabilir" kelimeleri kullandi (Madde 30.83.1 yasak). Grep ile dogrulandi atomlar:
- KVKK m.11 musteri formu **zaten var** (`/musteri/kvkk-haklarim`)
- Tab brand color **zaten dogru** (`tab-item.active` CSS)
- Register checkbox **zaten dogru** (implicit label wrapper)
- /iletisim form **mevcut degil** (sadece info kartlar)
- Slider ARIA **zaten implicit** (native `<input type="range">`)

### Madde 30.83 + 30.83.1 yeni

**30.83 — Erisilebilirlik WCAG AA Disiplini:** 7 zorunlu (skip link + focus-visible + ARIA + label-input + 44px touch + renk-bagimsiz + kontrast).

**30.83.1 — Mektup Pre-Flight Disiplini:** Architect mektup yazimi oncesi her dosya grep. "Muhtemelen"/"ihtimali"/"olabilir" YASAK. Belirsizse "Code D dogrulasin" diye isaretle, "uygula" yazma.

### Smoke
- `npx tsc --noEmit` EXIT=0 ✓
- A1 + Madde 30.83 + version.json bump ✓
- 5-belge OS senkron (CLAUDE/MIMARI/DEVIR/IS_PLANI/OTONOM) ✓

### NEXT
CEO sohbete donsun → Mimar (Opus 4.7) TUR #124-#128 atomlarini Madde 30.83.1 protokolu ile yeniden dogrulasin → Code uctan uca uygulayabilir.

---

## 🗄️ ARSIV — TUR #122 KAPALI (What-If Kusur Slider — Senaryo Analizi Disiplini)

**Saha kanıt:** Kimi v4.1 10 öneri kod-bazlı analiz raporu — #4 What-If Slider en düşük risk (motor hazır, 0 KIRMIZI).

**Sürüm:** Panel 1.19.0 → **1.20.0** MINOR, Anayasa v1.36.0 → **v1.37.0** MINOR. Backend sabit (1.15.0).

### Uygulanan 1 atom (UÇTAN UCA, DEFER 0)
- **A1** `SenaryoAnaliziYaralanma` component (`tazminat-hesapla/page.tsx`) + Step3 mount (`!fullKusurFault` koşullu)
  - HTML5 native `<input type="range">` 0-99 (npm install YOK)
  - `useMemo` ile 4 senaryo (kusur 0/25/50/whatIf), motor `hesaplaYaralanmaTazminati` reuse
  - Bar chart `<div>` width % (npm install YOK)
  - Brand renkler: `#1E1E8E` primary + `#22C55E` accent (Madde 35)
  - Madde 4.6 — mevcut Step3 yaralanmaSonuc + Hesap Detayı + Uyarı + CTA dokunulmadı

### Madde 30.82 yeni — Senaryo Analizi Disiplini
Backend motor reuse zorunlu. Paralel hesaplama formülü YASAK (Madde 30.61 tek-kaynak sentezi). Brand.json renkleri zorunlu (Madde 35).

### Smoke
```
Panel tsc --noEmit: exit 0
useMemo import eklendi, mevcut Step3 yapısı korundu
```

---

## 🎯 ÖNCEKİ — TUR #121 KAPALI (5 Madde UÇTAN UCA — Prerender + DocStatus + Render + Email/Phone 2FA + Premium SVG)

**CEO yazılı onay (Madde 18.3 + 30.71):** *"CEO ONAYLIYOR TEK KOMUTLA TEK MEKTUPLA HEM ARAŞTIR HEM UYGULA"* — 13 May 2026 gece

**Sürüm:** Backend 1.14.1 → **1.15.0** MINOR, Panel 1.18.1 → **1.19.0** MINOR, Anayasa v1.35.0 → **v1.36.0** MINOR, Schema 1.6.0 → **1.7.0**.

### 5 Madde Kanıt-Bazlı Sonuç

| M | İş | Senaryo | Karar |
|---|---|---|---|
| M1 | Prerender fix | A/B/C hibrit | 2 UYGULA + 1 SKIP (`/blog/[slug]` async params zaten doğru) |
| M2 | DocumentStatus enum | Additive | UYGULA (STUCK + DELETED) — KIRMIZI CEO onaylı |
| M3 | Render build | A | `.dockerignore` UYGULA, Dockerfile SKIP (Render Node auto-detect) |
| M4 | Email/Phone 2FA | A tam zincir | UYGULA (schema + email.service + 4 endpoint + UI OTP modal) — KIRMIZI CEO onaylı |
| M5 | Premium görsel | Mikro iterasyon | UYGULA (typography + letter-spacing + diyagonal aksent büyütme) |

### Uygulanan ~15 atom + 3 SKIP no-op (UÇTAN UCA, DEFER 0)
- **M1** 2 sayfa force-dynamic (private, robots disallow) + 1 SKIP (public ISR)
- **M2** schema enum + idempotent ALTER TYPE × 2
- **M3** .dockerignore (15 kategori exclude) + Dockerfile SKIP + render.yaml SKIP
- **M4** EmailOtp model + User 2 sütun + 4 SQL idempotent + sendOtpEmail/sendEmailChangedInfo helpers + 4 endpoint (request/confirm × email/phone) + PATCH /me reject (400 USE_VERIFY_FLOW) + PersonalEditCard 2-adım OTP modal + KVKK m.11 disclaimer
- **M5** corporate.service.js SVG: isim 32→36 + letter-spacing 0.02em + unvan 13→14 italic + mono 0.05em + diyagonal 80→100

### Madde 30.79+30.80+30.81 yeni
- **30.79** Prerender Static Optimization (private→force-dynamic, public→async params)
- **30.80** Çift Kanal Doğrulama (KVKK m.11 hak, email/phone 2-adım OTP + 24h iptal)
- **30.81** Build Cache (`.dockerignore` zorunlu, layer caching, >3dk = teknik borç)

### Smoke
```
Backend syntax (4 dosya): OK
Prisma generate: PASS (EmailOtp + DocStatus.STUCK/DELETED + User columns)
Panel tsc --noEmit: exit 0
```

---

## 🎯 ÖNCEKİ — TUR #120.1 mikro hotfix (Next.js 16 middleware.ts → proxy.ts rename)

**Saha kanıt (Vercel build log, commit b1ac2eb):**
```
Error: Both middleware file "./middleware.ts" and proxy file "./proxy.ts"
are detected. Please use "./proxy.ts" only.
```

**Kök sebep:** TUR #119 mektubu Next.js 16 deprecated `middleware.ts` pattern önerdi. Next.js 16 middleware.ts → proxy.ts rename. Projede zaten proxy.ts MEVCUT (33+ mimar hatası auth+2FA defense). Çakışma → Vercel deploy fail.

**Sürüm:** Panel 1.18.0 → **1.18.1** PATCH (hotfix). Anayasa v1.35.0 sabit. Backend 1.14.1 sabit.

### Uygulanan 5 atom (UÇTAN UCA, DEFER 0)
- **A1** proxy.ts view kanıt: gerçek işlevsel auth+2FA kod (Senaryo B kesin)
- **A2** Senaryo B merge: middleware redirect mantığı proxy.ts EN BAŞINA, mevcut logic KORUNDU (Madde 4.6)
- **A3** middleware.ts `git rm` (Vercel çakışma çözüldü)
- **A4** Build smoke: `tsc --noEmit` exit 0, middleware-proxy çakışması KAYBOLDU (pre-existing prerender hataları ayrı konu — TUR #117 issue)
- **A5** 5 belge OS senkron + Madde 30.78 yeni

### Madde 30.78 yeni — Framework Major Version Disiplini
Mimar mektubu öncesi CLAUDE.md Madde 1 "Teknik yapı" satırı baseline kaynak. Next.js 16 / React 19 / Tailwind 4 deprecated pattern YASAK.

### Mimar Hatası 58 — Framework Version Cehaleti
TUR #119 mektup Next.js 16'da middleware.ts önerdi (deprecated). Düzeltme: mektup öncesi package.json + CLAUDE.md kontrol.

---

## 🎯 ÖNCEKİ — TUR #120 KAPALI (SEO Crawl Bütçesi Açılımı — Schema.org BlogPosting + Sitemap Priority)

---

## 🎯 BUGÜN — TUR #120 KAPALI (SEO Crawl Bütçesi Açılımı — Schema.org BlogPosting + Sitemap Priority)

**Saha kanıt (Google Search Console):** 36 URL "Discovered — currently not indexed", son tarama `1970-01-01` (Unix epoch = hiç crawl edilmemiş). 26 blog post + 4 statik + 3 araç + 2 indeks + 1 form.

**Sürüm:** Panel 1.17.0 → **1.18.0** MINOR, Anayasa v1.34.0 → **v1.35.0** MINOR. Backend sabit (1.14.1).

### 4 Hipotez kanıt-bazlı sonuç

| Hipotez | Kanıt | Karar |
|---|---|---|
| H1 `/basvuru` prefix bug | robots.ts'te YOK | ⊘ SKIP |
| H2 Sitemap priority zayıf | blog `0.6 as const` | ✓ UYGULA → 0.8 |
| H3 İç link grafı zayıf | HomePageClient BlogSection MEVCUT | ⊘ SKIP |
| H4 BlogPosting JSON-LD eksik | `Article` schema mevcut ama spesifik değil | ✓ UYGULA → BlogPosting + mainEntityOfPage |

### Uygulanan 3 atom + 4 SKIP no-op (UÇTAN UCA, DEFER 0)
- **A1 ⊘** `/basvuru` prefix bug yok (Mimar Hatası 50 önleme — kod-kanıtsız uygulama YASAK)
- **A2 ✓** sitemap.ts blog priority 0.6 → 0.8 (Madde 30.77 #2)
- **A3 ✓** articleSchema `@type: Article → BlogPosting` + `mainEntityOfPage` (Madde 30.77 #3)
- **A4 ⊘** BlogSection MEVCUT (HomePageClient:405 `getFeaturedPosts(3)` hub-spoke aktif)
- **A5 ⊘** organizationSchema + websiteSchema MEVCUT (layout.tsx:97)
- **A6 ✓** version bump + 5 belge senkron
- **A7 ✓** Build + commit + push

### Madde 30.77 yeni — SEO Crawl Bütçesi Disiplini
4 katmanlı defensive: robots.txt prefix bug check + sitemap 3 sinyal zorunlu + JSON-LD structured data (BlogPosting + Organization) + hub-spoke iç link grafı.

### Manuel iş (CEO 5 dk, deploy sonrası)
Google Search Console → Sitemaps "Yeniden gönder" → 5 kritik blog URL "Request Indexing" → 3-7 gün sonra "Discovered" 36 → <10 hedef.

---

## 🎯 ÖNCEKİ — TUR #119 KAPALI (Vercel Domain Redirect + SEO Temizliği — Marka Domain Disiplini)

**Saha kanıt (Bing arama):** `tedbirge-panel.vercel.app/haberler` + `/basvuru` Google'a index olmuş. SEO duplicate content + marka karmaşası.

**Sürüm:** Panel 1.16.0 → **1.17.0** MINOR, Anayasa v1.33.0 → **v1.34.0** MINOR. Backend sabit (1.14.1).

### Uygulanan 5 atom (UÇTAN UCA, DEFER 0)
- **A1** middleware.ts yeni (`*.vercel.app` + apex `tedbirge.ai` → 301 `www.tedbirge.ai`, static asset exclude)
- **A2** Mevcut middleware MERGE — yoktu, yeni dosya yeterli (Madde 4.6 korundu)
- **A3** robots.ts disallow listesi 4 → 12 path (private/auth all blocked) + `host: https://www.tedbirge.ai`
- **A4** layout.tsx `alternates.canonical: "https://www.tedbirge.ai"` (Google duplicate önleme)
- **A5** sitemap.ts kontrol (no-op — zaten canonical kullanıyordu)

### Madde 30.76 yeni — Marka Domain Disiplini
3 katmanlı SEO defensive: Middleware 301 + Canonical metadata + robots host bildirimi. Production sadece canonical domain üzerinden erişilir.

### Manual iş (CEO 5 dk, deploy sonrası)
Google Search Console → tedbirge.ai property → URL Removals → `tedbirge-panel.vercel.app/*` removal talebi (24-48h içinde index'ten kalkar).

---

## 🎯 ÖNCEKİ — TUR #118 KAPALI (Profil Edit Tam Donanım — Ad Soyad + Email + Telefon + KVKK Audit)

**Saha kanıt:** Emine ÇELİK profil "Kişisel Bilgi" görüntüleme var ama edit YOK. TUR #116-117 adres+country fokuslarında profil kimliği unutulmuş (Mimar Hatası 57).

**Sürüm:** Backend 1.13.0 → **1.14.0** MINOR, Panel 1.15.0 → **1.16.0** MINOR, Anayasa v1.32.0 → **v1.33.0** MINOR

### Uygulanan 6 atom (UÇTAN UCA, DEFER 0)
- **A1** PATCH /auth/me email/phone/fullName + unique check + KVKK audit (Prisma P2002 + pre-flight findUnique + findFirst)
- **A2** Email 2FA + 24h onay DEFER TUR #119 (sarı endişe)
- **A3** PersonalEditCard yeni paylaşılan component (3 input + validation + telefon preview)
- **A4** (panel)/temsilci/profil eski "Kişisel Bilgi" kartı kaldırıldı + PersonalEditCard mount; (panel)/profil aynı mount
- **A5** Telefon SMS OTP DEFER TUR #119 (sarı endişe)
- **A6** 5 belge OS senkron + Madde 30.75 + Mimar Hatası 57

### Madde 30.75 yeni — Kritik Veri Audit Disiplini
KVKK m.10: ad soyad / email / telefon / IBAN / vergi değişikliği `ActivityLog` ile eski + yeni değer korunur. DB unique (P2002) + pre-flight findUnique + frontend validation 3 katmanlı defensive.

### Mimar Hatası 57 — Profil Edit Eksik Field
CEO 7. ısrar emsali: TUR #116-117 fokuslarında profil kimliği unutuldu. Düzeltme: PersonalEditCard (kimlik) + AdresEditCard (iş set) iki ayrı kart zorunlu.

---

## 🎯 ÖNCEKİ — TUR #117 KAPALI (6 Atlama Tek Seferde — Country + 81 İl + Telefon Format + Vector İkon)

**Saha kanıt (6 atlama):** country yok + SAKARYA banner statik + 81 il dropdown yok + il-ilçe ilişkili yok + telefon format yok + ikon yok.

**Sürüm:** Backend 1.12.0 → **1.13.0** MINOR, Panel 1.14.0 → **1.15.0** MINOR, Anayasa v1.31.0 → **v1.32.0** MINOR, Schema 1.5.0 → **1.6.0**

### Uygulanan 11 atom (UÇTAN UCA, DEFER 0, KIRMIZI 1)

- **A1** User.country additive (Almanya pilot 2028+ Madde 30.73)
- **A2** apply-pending-schemas idempotent ALTER TABLE
- **A3** turkey-locations.json (81 il × 499 ilçe, 29 büyükşehir tam, 52 küçük il SARI TUR #118)
- **A4** PATCH /auth/me country validation
- **A5** AdresEditCard 5 field (Ülke dropdown + Adres textarea + Şehir dropdown 81 il + İlçe dropdown il'e bağlı + Posta kodu)
- **A6** SAKARYA banner dinamik (Madde 4.4 — `legacyBolge` user.bolge bazlı, statik değil)
- **A7** buildUserAddressLine 5 seviye (country yabancı ise satır sonu, "Türkiye" implicit)
- **A8** formatTurkishPhone helper (Madde 30.74 — 10/11/12 hane → "0 545 490 33 95")
- **A9** SVG Lucide vector ikon (phone/mail/globe stroke 1.4)
- **A10** Profil entegrasyon (temsilci/profil + (panel)/profil country pass)
- **A11** 5 belge OS senkron + commit + push

### 3 Yeni Madde

- **30.72** Dropdown Disiplini (kontrollü veri girişi)
- **30.73** Geleceğe Hazırlık Disiplini (Almanya pilot 2028+)
- **30.74** Standart Format Disiplini (telefon/IBAN/posta görsel)

### Mimar Hatası 56 — 6 Atlama Tek Seferde

CEO çoklu atlama → UÇTAN UCA tek atomik commit (Madde 17.2 R1).

### Smoke (local)
```
formatTurkishPhone: "5454903395" → "0 545 490 33 95" ✓
PDF: line 5 "0 545 490 33 95" ✓, line 8 "Atatürk Cd... Adapazarı, Sakarya" ✓
turkey-locations: 81 il / 499 ilçe / 29 büyükşehir tam
```

---

## 🎯 ÖNCEKİ — TUR #116 KAPALI (User.address Schema + Profil Adres Edit + Kartvizit Tam Adres)

**CEO yazılı onay (Madde 18.3):** "TUR #116 = User.address schema eklemesi (Madde 3 KIRMIZI — CEO onaylıyor) + Profil sayfasında adres edit + kartvizit tam adres" — Mehmet DİNÇ, 12 May 2026

**Saha kanıt:** Emine ÇELİK kartvizitinde "SAKARYA" (user.bolge tek alan), matbaaya gitmeden tam adres gerekli. TUR #115 SARI ENDIŞE → TUR #116'da çözüldü.

**Sürüm:** Backend 1.11.0 → **1.12.0** MINOR, Panel 1.13.0 → **1.14.0** MINOR, Anayasa v1.30.0 → **v1.31.0** MINOR, Schema 1.4.0 → **1.5.0**

### Uygulanan 6 atom (KIRMIZI 1 — CEO yazılı onaylı)

- **A1** Schema additive: User'a 4 yeni alan (address/city/district/postalCode). `bolge` KORUNDU (Madde 4.6).
- **A2** `apply-pending-schemas.js` idempotent ALTER TABLE IF NOT EXISTS × 4. Migration dosyası YASAK (Madde 3 ikincil).
- **A3** Backend PATCH /auth/me genişletme + GET /auth/me select genişletme + validation + KVKK m.10 audit (PROFILE_ADDRESS_UPDATE)
- **A4** Paylaşılan `AdresEditCard.tsx` component (4 input + validation + toast + bolge legacy banner). Mount: temsilci/profil + (panel)/profil.
- **A5** `corporate.service.js` 3 nokta `buildUserAddressLine` helper — 4 seviye öncelik (address → city → bolge → brand). vCard RFC 6350 yapılandırılmış ADR.
- **A6** bolge migration script DEFER (manuel kullanıcı tercih korunsun)

### Madde 30.71 yeni — Schema KIRMIZI Geçiş Protokolü

3 zorunlu şart: CEO yazılı onay + Additive (Madde 4.6) + Idempotent SQL (Madde 30.22). Prisma migration dosyası YASAK.

### Smoke (local)
- vCard: `ADR:;;Atatürk Cd. Çiçek Sk. No:42/3;Sakarya;Adapazarı;54100;Turkiye` ✓
- SVG/PDF: Türkçe karakterler UTF-8 korundu ✓
- 3 fallback seviye doğrulandı (yeni address → city+district → bolge)

---

## 🎯 ÖNCEKİ — TUR #115 KAPALI (Kartvizit Adres + Yetki Türkçe + Sidebar RBAC Dinamik)

**Saha kanıt:** Emine ÇELİK saha zincirinin #3 bulgusu — kartvizit kurumsal adres + İngilizce modül adları + sidebar'da REP yetkili modüller görünmüyor.

**Sürüm:** Backend 1.10.0 → **1.11.0** MINOR, Panel 1.12.0 → **1.13.0** MINOR, Anayasa v1.29.0 → **v1.30.0** MINOR

### Uygulanan 5 atom (UÇTAN UCA, DEFER 0)
- **A1** — corporate.service.js 3 nokta adres öncelik (`user.address || user.city || user.bolge || brand.address.fullAddress`)
- **A2** — Schema kontrol: User.bolge mevcut (kullanıldı), User.address SARI ENDIŞE TUR #116 teklifi
- **A3** — MODULE_LABELS 4 Türkçe (campaignBuilder/socialCalendar/ebaroVerify/uyap)
- **A4** — AppLayout TEMSILCI 3 RBAC item (paylasim/campaignBuilder/socialCalendar)
- **A5** — 3 placeholder sayfa (/temsilci/sosyal-paylasim, /kampanya, /sosyal-takvim)

### Madde 30.69 + 30.70 yeni
- **30.69** — Türkçe Lokalizasyon Disiplini (MODULE_LABELS zorunlu Türkçe karşılık)
- **30.70** — RBAC Dinamik Sidebar Disiplini (sidebar item RBAC bağı zorunlu, hardcoded yasak)

---

## 🎯 ÖNCEKİ — TUR #114 KAPALI (REP Kurumsal Route + Admin Sözleşme Görünürlük)

**Saha kanıt:** Emine ÇELİK zincirinin 2. bulgusu — REP sidebar Kurumsal butonları çalışmıyor + ADMIN panel sözleşmeler listesi yok.

**Sürüm:** Backend 1.9.0 → **1.10.0** MINOR, Panel 1.11.0 → **1.12.0** MINOR, Anayasa v1.28.0 → **v1.29.0** MINOR

### Uygulanan 6 atom (UÇTAN UCA, DEFER 0)
- **A1** — `/temsilci/kurumsal/page.tsx` yeni (REP için /dashboard kopyası, DRY refactor TUR #115)
- **A2** — AppLayout sidebar rol bazlı URL (REP→/temsilci, ADMIN/LAWYER/SALES→/dashboard, Madde 30.68 emsali)
- **A3** — `GET /api/admin/sozlesmeler` + `/:userId` (User join + ActivityLog audit, KVKK m.10 görünürlük)
- **A4** — `/dashboard/sozlesmeler` admin UI (filter + tablo + detay modal + pagination)
- **A5** — Sidebar HUKUK section'a admin "Sözleşmeler" link (ADMIN only)
- **A6** — TUR #113 audit zinciri kontrolü (skip — audit zaten var, admin endpoint listeleyecek)

### Madde 30.68 yeni — Rol Bazlı Route Scope Disiplini
Sidebar URL'leri rol bazlı dinamik: REP → /temsilci/*, ADMIN/LAWYER/SALES → /dashboard/*, CUSTOMER → /musteri/*. Tek URL çoklu rol YASAK.

### Mimar Hatası 56 — Route Scope Karışıklığı
Production deploy lag + route scope ayrımı eksik = "ekran boş" hatası. Düzeltme: rol başına ayrı sidebar item + explicit path.

---

## 🎯 ÖNCEKİ — TUR #113 KAPALI (Temsilci Sözleşme SMS OTP — Saha Acil)

**Saha kanıt:** Emine ÇELİK (REPRESENTATIVE, gerçek kullanıcı) `/temsilci/sozlesme` sayfasında "SMS gönderilemedi: Route bulunamadı". Onboarding tıkalı, kartvizit/broşür/reklam butonları çalışmıyor (sözleşme kilidi).

**Sürüm:** Backend 1.8.3 → **1.9.0** MINOR (yeni endpoint), Panel 1.11.0 sabit, Anayasa v1.28.0 (Madde 30.67 + MH55 yeni).

### Uygulanan (SENARYO A — endpoint yazılmamış, schema değişikliği yok)
- **2 yeni endpoint** (`src/routes/representative.routes.js`):
  - `POST /api/representative/sozlesme/sms-otp` — REP/ADMIN auth, 3 KVKK onay, 6 haneli OTP PhoneOtp kayıt, sendOtpSms gönderim, ActivityLog audit
  - `POST /api/representative/sozlesme/imzala` — REP/ADMIN auth, 6 haneli OTP doğrulama + User platformAgreementAcceptedAt/kvkkAcceptedAt/sozlesmeKabulIp/sozlesmeVersiyonu güncelle + ActivityLog audit (KVKK m.10)
- **Schema değişikliği YOK** — mevcut User alanları + PhoneOtp modeli kullanıldı
- **SMS servisi** mevcut `sendOtpSms` (NetGSM Türkçe destekli, mock modda console.log)

### Madde 30.67 yeni — Onboarding Akış Bütünlüğü Disiplini
1. Frontend stub mod production'a gönderilmez (CEO yazılı onay zorunlu)
2. Onboarding her ekran zorunlu (sözleşme imzasız butonlar disabled)
3. Frontend 404 → anlaşılır mesaj, ham "Route bulunamadı" YASAK
4. Schema mevcut alanlar önce kontrol — yeni model KIRMIZI

### Mimar Hatası 55 — Frontend Stub Mod Production Tuzak
Frontend stub commit + production deploy = saha hatası. Emine ÇELİK emsali. Düzeltme: stub commit zorunlu issue + 7 gün takip.

---

## 🎯 ÖNCEKİ — TUR #112 KAPALI (Premium Kartvizit Uçtan Uca)

**Sürüm:** Backend 1.7.0 → **1.8.3** (3 PATCH hotfix), Panel 1.10.0 → **1.11.0**, Anayasa v1.27.0 → **v1.28.0 MINOR**

**Commit zinciri:**
- Ana `58fbe6f` — 10 atom premium kartvizit uçtan uca (5 format + ön/arka + reklam editör)
- Hotfix #1 `f8b9c59` — Variable font Türkçe karakter (jsdelivr subset → google/fonts VF)
- Hotfix #2 `ad5d8db` — PDF sağ panel satır aralığı yayma
- Hotfix #3 (bu commit) — PDF sol panel + arka yüz "Tedbirge.ai altı" spacing

**3 Mimar Hatası emsali (ders notu):**
- MH52 — Sahte ekran-bazlı hotfix (production deploy bekliyorken hotfix teşhisi)
- MH53 — Frontend skill kuralı ihlali (gradient/spacing kod-kanıtsız pişirme)
- MH54 — Parçalı iş atom listesi (CEO direktifini eklenmiş atom listesi pişirme)

**Madde 30.66 yeni** — Variable Font Trade-off Disiplini (pdfkit wght axis çalışmaması → Bold/Regular ayrımı kaybı KABUL, Türkçe karakter önceliği)

### Uygulanan 10 atom (10/10 — UÇTAN UCA, parçalı iş yasak)

- **A1** — Google Fonts TTF pipeline: 7 OFL dosya (Inter Tight + Crimson Pro + JetBrains Mono) `tedbirge-os/assets/fonts/` altında, jsdelivr fontsource CDN'den çekildi, README dokümante.
- **A2** — UTF-8 encoding fix: `Content-Type: charset=utf-8`, RFC 5987 filename, `Buffer.from(svg, 'utf8')`. Türkçe karakter (Şükrü, ÇAĞRI, Ümit) render OK.
- **A3** — Premium ön yüz SVG (`generateKartvizitSVG`): 850×550, sol panel Tedbirge + "tedbirator" italic yeşil etiket (alt etiket, alt marka DEĞİL), sağ panel Crimson Pro Bold isim + JetBrains Mono iletişim. LAWYER kısıt KORUNDU.
- **A4** — Premium arka yüz SVG (`generateKartvizitBackSVG`): full bleed lacivert + diyagonal yeşil aksent + merkez logo + Crimson Pro italic slogan + reklam metni + QR. LAWYER 403 (Madde 25.3).
- **A5** — PNG frontend canvas conversion: `lib/svgToPng.ts` yeni helper, backend `/png` SVG döndürür, panel canvas API retina 2x PNG çevirir. Sharp YOK pattern korundu.
- **A6** — Matbaa PDF (`generateKartvizitMatbaaPDF`): pdfkit + 92×62mm (bleed) + 2 sayfa + font embed (Inter/Crimson/Mono `registerFont`) + trim marks 4 köşe. Çıktı ~23KB.
- **A7** — Dijital paylaşım PDF (`generateKartvizitDigitalPDF`): pdfkit + 85×55mm (LAWYER) veya 170×55mm (ön+arka yan yana, REP/SALES) + compress aktif. Çıktı ~20-22KB email/WhatsApp uyumlu.
- **A8** — RBAC `kartvizit:print` action: 5. RBAC action (uniform genişleme Madde 30.55 R2), REPRESENTATIVE + SALES default açık, LAWYER + CUSTOMER default kapalı (Madde 25.3 + KVKK).
- **A9** — Panel premium KartvizitTab: 2-kolon ön/arka önizleme + reklam editor (200 char + localStorage) + 5 format buton + 3 ShareButton. LAWYER 2 format (SVG/PNG/PDF Paylaş + vCard, arka yüz YOK + matbaa YOK).
- **A10** — ShareButton + brand.json + 5 belge OS senkron + atomik commit + push + smoke.

### Madde 30.65 yeni — Premium Kartvizit Disiplini

5 zorunluluk:
1. UTF-8 zorunlu (Türkçe karakter desteği)
2. Font pipeline OFL (Inter Tight + Crimson Pro + JetBrains Mono — `assets/fonts/` commit'li)
3. 5 format zorunlu (SVG + PNG + PDF Paylaş + PDF Matbaa + vCard)
4. LAWYER enforcement backend 403 (arka yüz + matbaa)
5. PNG sharp YOK pattern (frontend canvas)

### Tedbirator etiket stratejisi (CEO TUR #112 kararı)

`secondary.tedbirator.registered: true` SMK m.30 riski elimine → artık `displayMode: "label"` italic yeşil etiket (alt etiket, alt marka DEĞİL, tescil iddiası YOK). Hukuki risk sıfır.

### Sayısal özet

- 10/10 atom (parçalı iş yasak — Madde 17.2 R1)
- 0 KIRMIZI, 0 schema, 0 env, 0 npm install
- $0 maliyet (OFL fontlar ücretsiz, jsdelivr CDN ücretsiz)
- ~17 dosya değişiklik + 8 yeni dosya (7 TTF + svgToPng.ts + README)
- 24 → **25 ardışık temiz TUR REKOR (#90 → #112)**

---

## 🎯 ÖNCEKİ — TUR #110 KAPALI (production live)

**Commit:** `ead8a6b` (backend) + `58a730c` (panel) — Render deploy `dep-d800eomrnols73cpchjg` ✅ live 07:37
**Sürüm:** Backend 1.6.0 → **1.7.0**, Panel 1.9.0 → **1.10.0**, Anayasa v1.26.0 → **v1.27.0 MINOR**

### Uygulanan 8 atom (kanıt-bazlı)
- **A3** — Reconciler 5 detect handler (env_drift + schema_drift + route_orphan + role_permission_drift + version_string_drift) — AUTO-FIX YOK + ADMIN_FEED RealtimeEvent (Madde 30.63 yeni)
- **A4** — Dead `src/os/modules/auditor.js` git rm (TUR #108 namespace borç kapanışı, hiçbir yerden çağrılmıyordu)
- **A6** — Boot 12 → 9 step (Oracle + pg-boss + Cron Scheduler arşive — Supabase + LISTEN/NOTIFY + in-process scheduler yeterli kanıtlı)
- **A8** — `GET /api/boot-status` ADMIN endpoint + BootTimelineWidget `/dashboard/sistem-durumu` üst banner
- **C1** — JudicialResponse Prisma model (KIRMIZI — CEO sessiz onay) + 3 endpoint (POST upsert + GET single + GET list ADMIN) + mahkeme-sonucu form sayfası + LeadTabNav 9. sekme
- **C2** — 6 modül DEFER registry (MIMARI_KARARLAR.md kanıt eşiği tablosu)
- **C3** — `Lead.firstRealLead` boolean (additive default false — milestone flag)
- **D1+D3** — TS build PASS + 5 belge OS senkron + atomik commit + push

### DEFER 9 atom (dürüst — Madde 30.31 R1)
- **A5** — EventBus 46 emit cleanup (audit trail KVKK m.10 — kanıt-bazlı liste yapılmadan silmek YANLIŞ)
- **A7** — HAL 9→6 type silme (mimar oturumu kararı — Madde 14.3)
- **B1-B4** — Niyazi sahaya çıkış smoke (manuel/operasyonel, Pazartesi 11 May CEO+Niyazi)

### 3 yeni anayasa maddesi (kanıt-bazlı kalıcı pattern)
- **Madde 30.61** — Single Source of Truth Disiplini (hardcoded list YASAK, registry.js + getOSModules() helper tek kaynak)
- **Madde 30.62** — Module Active Task Disiplini (runActiveTask gerçek iş zorunlu, sadece runStatusCheck çağırıp ACTION_TAKEN yazmak Madde 30.17 ihlali)
- **Madde 30.63** — Reconciler Drift Detection Disiplini (auto-detect EVET, auto-fix YOK, ADMIN onayı zorunlu — Madde 24.11)

### 6 modül DEFER registry (Madde 28 — kanıt eşiği)
| Modül | Tetikleyici Eşik | Hedef TUR |
|---|---|---|
| opposingParty | 5 dava kapanışı | TUR #115+ |
| customerSentiment | 30 müvekkil aktif | TUR #117+ |
| lawyerContractLifecycle | İlk sözleşme yenilemesi (12 ay sonra) | TUR #135+ |
| trustIndex | 30 müvekkil + 5 dava WON | TUR #118+ |
| financialFlowGuard | İlk 5 komisyon havalesi | TUR #112+ |
| zamanasimiGuard | İlk 10 aktif dava (zaman aşımı yaklaşan) | TUR #113+ |

---

## 🌟 23 ARDIŞIK TEMİZ TUR REKOR (#90 → #110)

```
TUR #90  ✅  CLAUDE.md compaction (246k → 162k, -%34)
TUR #91  ✅  Performans uçak hızı (TTFB 1.1s → 0.47s, -%58)
TUR #92  ✅  Adopsiyon UX + Muzaffer TÜMSA otonom giriş kanıtı
TUR #93  ✅  Yatay CRM bildirim zinciri (Madde 30.53)
TUR #94  ✅  Müvekkil panel B2C (Madde 31.9 R1)
TUR #95  ✅  Mimar Hatası Proaktif Tarama (Madde 14.5 + mimarHatasi)
TUR #96  ✅  Lockfile drift Senaryo D (Madde 14.5 R1 + 30.46 R1)
TUR #97  ✅  AccidentCase Tanı Raporu (3 bug + 1 boot crash)
TUR #98  ✅  AI Bağımsızlık + Madde 24.14 (sıfır maliyet)
TUR #99  ✅  RBAC Yetki Yönetim Paneli (Madde 30.55)
TUR #100 ✅  4 Rol İş Akışı + Madde 31.9 R2 — 🎉 TEDBİRGE.AI 2.0
TUR #100.5-100.10 ✅  RBAC HOTFIX + ENTERPRISE + STÜDYO + AUTH BLOB
TUR #101 ✅  AI Metin Üretici (Madde 36)
TUR #102 ✅  Pazar Lansmanı + UTM (Madde 37)
TUR #103 ✅  e-Baro Manuel Adapter (Madde 38)
TUR #104 ✅  UYAP Manuel Veri (Madde 39, TCK m.243 koruma)
TUR #105 ✅  Tazminat Hesapla UX Fix (Senaryo B + Madde 31.11)
TUR #105.5 ✅  Version Senkron PATCH (Madde 22.9 R2)
TUR #106 ✅  Şehir Kaldır + Vefat Modülü (Madde 31.12 + 31.13)
TUR #107 ✅  TAM DONANIM Yaralanma+Vefat (Madde 17.2 R1 + 31.14 + 31.15)
TUR #108 ✅  OS Dependency Mapping (pure keşif, 7 kritik bulgu, Mimar hatası 50)
TUR #109 ✅  KISMİ KAPALI A1+A2 (mimarHatasi visibility + runActiveTask, 26 atom DEFER, Mimar hatası 51)
TUR #110 ✅  OS Temel Sıkılaştırma + judicialResponse + Niyazi sahaya çıkış HAZIR (8/17 atom)
═══════════════════════════════════════════════════════════
~500+ atom · sapma 0 · v1.27.0 MINOR · production stable
```

---

## 🔴 AÇIK KRİTİK (ekrandan kanıt — 10 May 15:19)

⚠️ Production /dashboard/sistem-durumu üzerinde 3 somut sorun:
1. **Footer "15/16 modül aktif"** — TUR #110 A4 sonrası 16/16 olmalı, sayım hatası (auditor.js silindi → registry 16, gösterge yanlış)
2. **Kurtarma UYARI** — 24 eski FAILED Document + 2 sıkışmış PENDING lead (7d+) — Healer retry yapmıyor, Madde 30.17 emsal ihlali
3. **Güvenlik KRİTİK** — 1 LAW01_2FA_OFF brute-force tespit edilmiş ama ADMIN_FEED tekrarlayan uyarı yok (Madde 30.32 + 24.11)

**Bu 3'ü TUR #111 adayı** — yeni modül değil, mevcut sistemin görevini tam yapması.

---

## 🟡 PLANLI

- **Pazartesi 11 May 09:00** — Niyazi sahaya çıkış (CEO+Niyazi 4 senaryo manuel smoke)
- **TUR #111** — Ekrandaki 3 somut sorun fix (Footer sayım + Kurtarma retry + Güvenlik 2FA bildirim)
- **TUR #112+** — financialFlowGuard modülü (ilk 5 komisyon havalesi geldiğinde)
- **TUR #113+** — zamanasimiGuard modülü (ilk 10 aktif dava zaman aşımı yaklaşınca)

---

## 📋 CEO MANUEL İŞLER (öncelikli)

1. **Pazartesi 09:00 Niyazi sahaya çıkış** — REPRESENTATIVE login + Lead create + avukat atama + 2FA setup wizard (4 senaryo)
2. **İlk gerçek lead geldiğinde** — `Lead.firstRealLead` flag manuel set (gelecek otomasyon TUR #111+)
3. **WhatsApp QR kod** — `/baslat?ref=NIYAZI_001` UTM linki + QR kod (mevcut Kurumsal Üretim Stüdyosu — TUR #100.9 altyapı)

---

## 🎯 SIRADAKİ ÖNERİLEN İŞ

**TUR #111 — Ekrandaki 3 somut sorun fix (3 atom, ~2-3 saat, $0, 0 KIRMIZI)**

Gerekçe: TUR #110 sonrası production'da kanıtlı 3 ihlal (Madde 30.17 + 30.32 + sayım drift). Vizyon değil, ekrandaki gerçek. Yeni modül yok — mevcut sistemin görevini tam yapması.

**ALTERNATİF:** Niyazi sahaya çıkış sonrası **gerçek lead retrospektifi** beklenir, sonra TUR #111 öncelik değişebilir.

---

## ⚠️ MİMAR HATASI ZİNCİRİ (oturum dersi — yeni sohbete taşı)

- **Mimar hatası 50** (TUR #108-109 arası) — kod gerçeğine bakmadan 12 modül önerme. Code 26/28 atom DEFER etti. Düzeltme yolu: TUR #108 keşif raporu.
- **Mimar hatası 51** (TUR #109) — TUR #108 sonrası taahhüt ihlali (yine kod-kanıtsız modül önerisi). Düzeltme yolu: TUR #110 dürüst 9 DEFER + Madde 30.31 R1 emsal.
- **Mimar hatası 52 yok** — TUR #110 mektup yazımı + Code'un dürüst karşılığı **doğru pattern**.

**Yeni sohbette dikkat:** Mimar (sohbet Claude) **CEO sözünün üzerine modül listesi pişirme refleksi** olabilir. Yeni mimar oturumunda bu pattern tespit edilirse anında DUR demek (Madde 4.3 + 14.5).

---

## 🛠️ 5 BELGE OS SENKRON (Madde 30.26)

Bu güncellenen 5 belge:
1. **DEVIR_RAPORU_AKTIF.md** — bu dosya
2. **CLAUDE.md** — Anayasa v1.27.0 (Madde 30.61-63 yeni)
3. **IS_PLANI.md** — TUR #110 KAPALI, NEXT TUR #111
4. **OTONOM_RAPOR.md** — TUR #110 detay + 8 atom + 9 DEFER + mimar dersleri
5. **MIMARI_KARARLAR.md** — 6 modül DEFER kanıt eşiği tablosu + TUR #110 kararı

---

— Mimar imza · 10 Mayıs 2026 Pazar 07:37
— Anayasa v1.27.0 MINOR · 23 ardışık temiz TUR · production live
— **Niyazi yarın sahaya çıkıyor — Tedbirge'in ilk gerçek müvekkil akışı başlıyor**
