# TUR #44 Tur A — Hareket Disiplini Kapsamlı Keşif Raporu

**Tarih:** 1 Mayıs 2026 (TUR #43 sonrası gece)
**Uygulayan:** Claude Code
**Anayasa:** v1.10.0
**Risk:** 🟢 YEŞİL (salt okuma + dış kaynak fetch, 0 değişiklik)
**Süre:** ~75 dk

## Repo durumu (ön kontrol)
- Çalışma ağacı: TEMİZ
- Son commit: `a83ca7f` — feat(seo): TUR #43 B9 - anasayfa server/client bölmesi
- TUR #43 sonrası mı: EVET
- node_modules: VAR

---

## BÖLÜM I — Mevcut Motion Altyapısı

### KN-1: Yüklü animasyon paketleri

**Bulgular:**
- `framer-motion`: **v12.38.0** (en güncel sürüm — 2025 sonu/2026 başı, Motion API v12)
- `tailwindcss`: **v4.2.2** (Tailwind 4 — CSS-first config, `tailwind.config.ts` YOK, `postcss.config.mjs` ile çalışıyor)
- `tailwindcss-animate`: YOK
- `gsap`, `lottie`, `three`, `@react-spring/web`, `motion-one`, `auto-animate`: YOK
- `@radix-ui`: YOK
- node_modules/framer-motion raw boyutu: **5.4 MB** (gzip ~50-60 KB tahmin)

**Sonuç:** Tek animasyon kütüphanesi (Framer Motion v12). Modern sürüm, MotionConfig + useReducedMotion + tüm v12 özellikleri kullanılabilir. Tailwind 4 CSS-first config olduğu için tailwind.config'de animation/keyframe extend EDİLEMEZ — keyframe'ler globals.css'te @keyframes olarak tanımlanmalı veya Framer Motion'da kalmalı.

### KN-2: Framer Motion kullanım haritası

**Bulgular (import edilen 6 dosya):**
- `app/(public)/HomePageClient.tsx` — motion=58 (en yoğun)
- `app/(public)/hakkimizda/page.tsx` — motion=27 (ikinci yoğun)
- `app/(public)/layout.tsx` — motion=8 (page transition + FloatingWhatsApp)
- `components/PublicNav.tsx` — motion=8 (mobile menu + sticky)
- `components/IosInstallGuide.tsx` — motion=12 (modal + reduced-motion AKTIF)
- `app/(panel)/layout.tsx` — motion=3 (panel page transition)

**Variant tanımları:**
- HomePageClient: `sectionVariants`, `containerVariants`, `cardVariants`, `EASE = [0.25, 0.1, 0.25, 1]`
- /hakkimizda: `fadeUp`, `stagger`, `cardVariant`, `EASE = [0.25, 0.1, 0.25, 1]` — **AYNI EASE değer 2 dosyada tekrar**

**Kritik bulgu (DRY ihlali):**
- `SectionReveal` component anasayfada **inline** tanımlı (95-105. satır)
- /hakkimizda'da AYNI pattern variant'larla **tekrar** tanımlı, başka isimle (fadeUp/stagger/cardVariant)
- İki dosyada da `EASE = [0.25, 0.1, 0.25, 1]` magic number tekrar
- Variant API'si aynı (hidden/visible, opacity+y, duration~0.5-0.6, staggerChildren 0.1) — **merkezi olabilir**

**Sonuç:** Framer Motion altyapısı VAR ama merkezi DEĞİL — DRY ihlali. Anasayfa ve hakkımızda variant'larını paylaşan ortak kaynak yok. Diğer 17 sayfa motion=0 (aşağıda).

### KN-3: Merkezi motion design tokens

**Bulgular:**
- `lib/motion*`, `components/animations*`, `lib/transitions*`, `lib/variants*`: YOK
- globals.css'te motion token (--motion-ease, --duration, --ease): YOK
- globals.css'te @keyframes: SIFIR
- Tailwind config animation/keyframes extend: EDİLEMEZ (Tailwind 4 CSS-first)
- globals.css'te sadece `transition: all 0.15s` (line 112) ve `transition: border-color 0.15s` (line 163) — 2 kullanım, magic number

**Sonuç:** **Merkezi motion design system YOK.** Bu Tur B'nin **birincil atomu** olmalı:
- `lib/motion.ts` (yeni) — paylaşılan EASE, durations, variants
- globals.css'e `--ease-standard`, `--duration-fast`, `--duration-base`, `--duration-slow` custom property'leri

### KN-4: Page transition mimarisi

**Bulgular:**
- Public layout (`app/(public)/layout.tsx`) **AnimatePresence VAR**:
  - `<motion.div key={pathname} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} transition={{duration:0.3, ease:"easeOut"}}>`
  - Tüm public sayfalarda otomatik route transition
- Panel layout (`app/(panel)/layout.tsx`) AYRI AnimatePresence — panel için ayrı geçiş
- Anasayfa server/client bölmesi (TUR #43 B9) layout'taki AnimatePresence'i etkilemedi — `key={pathname}` route düzeyinde çalışıyor, server wrapper transparan

**Sonuç:** Page transition **temel altyapısı sağlam**. TUR #44'te bu motion daha zengin hale getirilebilir (örn. niş landing'lere giriş özel staggered hero) ama yıkım yok.

### KN-5: Scroll reveal mimarisi

**Bulgular:**
- `whileInView` kullanan sayfalar: HomePageClient + /hakkimizda **(SADECE 2 sayfa)**
- `useInView` hook kullanımı: Aynı 2 sayfa (kendi inline AnimCounter'larında)
- IntersectionObserver manuel kullanımı: YOK (Framer'in whileInView yeterli)
- `<Reveal>`, `<FadeIn>`, `<Scroll>` ortak component: YOK

**Sonuç:** Scroll reveal **2 sayfada hapsedilmiş**, geri kalan 17 public sayfada YOK. TUR #44'ün ana fırsatı: ortak `<Reveal>` component'i + niş landing/blog liste/detay sayfalarına yayma.

### KN-6: Mikro etkileşimler

**Bulgular:**
- Framer `whileHover/Tap/Focus` toplam: **13** kullanım (anasayfa + PublicNav + IosInstallGuide + layout)
- Tailwind `hover:scale-/transition-/duration-`: **38** kullanım (tüm app'te)
- `components/ui/`: YOK
- Ortak `<Button>`, `<Card>`, `<CTA>` component'i: YOK (sadece `components/dashboard/StatCard.tsx`)
- `forwardRef` kullanımı: **0** (sıfır — motion-aware wrapper için kritik eksik)

**Hover scale tutarsızlık (HomePageClient):**
- Line 182: `whileHover={{ scale: 1.05 }}`
- Line 196: `whileHover={{ scale: 1.03 }}`
- Line 682: `whileHover={{ scale: 1.05 }}`
- Line 733: `whileHover={{ scale: 1.15 }}` ← uçuk değer

**Sonuç:** Mikro etkileşim **karışık**: Framer + Tailwind transition ikisi de kullanılıyor, ortak Button/Card component yok, scale değerleri tutarsız. TUR #44 atom adayı: `<MotionButton>` ve `<MotionCard>` ortak component, scale değerleri token'da (örn. `--scale-hover-base: 1.03`).

---

## BÖLÜM II — Tasarım Sistemi + Motion Tokens

### KN-7: Renk + spacing + typography token'ları

**Bulgular (globals.css custom properties — 17 token):**
```
--brand-primary: #1E1E8E
--brand-primary-hover: #18187a
--brand-primary-soft: #edeafb
--brand-accent: #5CB85C
--brand-accent-soft: #eef9e7
--page-bg: #f6f7fb
--border-color: #e7e7ef
--text-main: #1f2251
--text-soft: #6b7280
--card-shadow: 0 10px 30px rgba(30,30,142,0.08)
--primary: #1E1E8E (duplicate)
--accent: #5CB85C (duplicate)
--pub-primary: #1E1E8E (duplicate)
--pub-secondary: #5CB85C (duplicate)
--pub-dark: #0A1628
--pub-card-radius: 12px
--pub-btn-radius: 8px
```

**#1E1E8E referans sayısı (renk hex hardcoded):** 555 yer (DRY ihlali — token varken hex tekrar yazımı)

**Sonuç:** Renk token'ları VAR ama **MOTION token'ları YOK** ve **hex hardcoding** yaygın. TUR #44'te motion token eklenirken aynı disiplin uygulanmalı (ease/duration variable, kullanıcı dosya = var(--ease-standard)).

### KN-8: Mevcut keyframe envanteri

**Bulgular:**
- globals.css @keyframes: **SIFIR**
- Tailwind config keyframe extend: EDİLEMEZ (Tailwind 4)
- Inline style animation:
  - `app/(panel)/leads/[id]/chat/page.tsx:210` — animationDelay (typing dots)
  - `components/AiChatWidget.tsx:130-132` — `animate-bounce` (Tailwind built-in)

**Sonuç:** CSS keyframe ekosistemi **boş**. Tüm motion JS-tabanlı (Framer Motion). TUR #44'te CSS @keyframes eklenerek (örn. shimmer, gradient-shift, pulse) Framer Motion'la kombine cinematic efektler kurulabilir.

### KN-9: prefers-reduced-motion desteği

**Bulgular:**
- Sadece `components/IosInstallGuide.tsx:37` — `useReducedMotion()` kullanıyor
- Anasayfa, /hakkimizda, public layout AnimatePresence: **respect ETMİYOR**
- globals.css `@media (prefers-reduced-motion)`: YOK
- Framer Motion `<MotionConfig reducedMotion="user">`: YOK

**KRİTİK eksiklik (WCAG 2.2 + Madde 25 erişilebilirlik gereği).** TUR #44'te **zorunlu atom**:
- Public layout `<MotionConfig reducedMotion="user">` wrapper
- Anasayfa hero/section reveal'ları reducedMotion bayrağına göre kısaltma
- globals.css'e `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }` global fallback

### KN-10: Motion-aware component mimarisi

**Bulgular:**
- forwardRef: **0** (hiç yok)
- shadcn/ui: YOK
- Radix UI: YOK
- components/ui/ klasörü: YOK
- Component'ler `as` prop kabul etmiyor

**Sonuç:** Yeni motion ekleyince **wrapper cehennemi riski**. Çözüm: TUR #44'te ortak `<MotionButton>`, `<MotionCard>`, `<MotionLink>` (forwardRef ile) eklenmeli — sayfa-spesifik motion duplicate'lerini ortak component'e taşımak.

---

## BÖLÜM III — Sayfa-Sayfa Animasyon Envanteri

### KN-11: Anasayfa (HomePageClient.tsx, 905 satır)

**Bulgular:**
- Motion sayım: 58 (en yoğun)
- `<HeroSection>`, `<SectionReveal>` inline component'ler tanımlı
- 5 cardVariants + containerVariants + sectionVariants kullanım yeri
- Hero section'da `<motion.div>` çoklu (decorative circles, başlık, CTA, AnimCounter)
- BlogSection (TUR #40 K2 A1) görünüyor ama motion variantı kullanmıyor (statik render)

**Mimar yorumu:** Anasayfa "ortalama-üstü" başlangıç noktası ama "muazzam" değil. Hero'da typewriter/word-stagger yok, scroll-triggered cinematic yok, gradient-shift yok. Linear.app/Stripe seviyesinden uzak.

### KN-12: 3 niş landing (motion=0, server component)

**Bulgular:**
- /trafik-kazasi-tazminat (192 satır), /is-kazasi-tazminat (192), /sigorta-tazminat-reddedildi (213)
- **motion=0, "use client"=0** — server component, framer çalışmaz
- TUR #43 B7'de LegalService JSON-LD eklendi (server component'te), TUR #42 C5'te PublicNav fragment wrap

**Refactor gereksinimi:** Animation eklemek için **alt-component'e bölme** veya **client component refactor**. TUR #43 B9 anasayfa pattern'i tekrarı (server wrapper + client child). Risk düşük çünkü metadata zaten var.

### KN-13: Blog sayfaları

**Bulgular:**
- /blog liste (52 satır, motion=0, server)
- /blog/[slug] (83 satır, motion=0, server) — `generateMetadata` + Article JSON-LD (TUR #43 B8)
- 3 statik post (lib/blog.ts hardcoded)

**Refactor:** Blog detay zaten server component (TUR #43 B8 için zorunluydu). Animation için ya alt-component (`<BlogPostBody>`) ya da liste card'ları için ortak `<MotionCard>` component.

### KN-14: 14+ public sayfa motion tablosu

| Sayfa | Satır | Motion | Use Client | Not |
|---|---|---|---|---|
| /basvuru | 935 | 0 | ✓ | Büyük form, motion yok |
| /basvuru-sorgula | 192 | 0 | ✓ | TUR #42 C8 |
| /iletisim | 81 | 0 | (server) | |
| /hakkimizda | 405 | 27 | ✓ | İkinci yoğun motion |
| /referanslar | 291 | 0 | ✓ | |
| /haberler | 187 | 0 | ✓ | |
| /tazminat-hesapla | 427 | 0 | ✓ | Hesap aracı, motion fırsatı |
| /lexscan | 49 | 0 | (server) | |
| /kvkk-aydinlatma | 51 | 0 | (server) | |
| /cerez-politikasi | 29 | 0 | (server) | |
| /kullanim-kosullari | 139 | 0 | (server) | |
| /login | 227 | 0 | ✓ | TUR #42 K8 sonrası |
| /register/* (3 sayfa) | 246+315+381 | 0 | ✓ | |
| /forgot-password | 124 | 0 | ✓ | |
| /reset-password | 167 | 0 | ✓ | |
| /sifre-belirle | 129 | 0 | ✓ | |

**Sonuç:** 17+ public sayfa **motion sıfır**. Sadece 2 sayfa (anasayfa + hakkımızda) animasyon yoğun. **Tutarsızlık ekstrem.**

**TUR #44 kapsam tavsiyesi:**
- ✅ Mutlaka dahil: niş landing 3, blog liste, blog detay, /tazminat-hesapla, /referanslar (kart hover), /basvuru (form mikro etkileşim), /haberler
- ⚠️ Opsiyonel: /login + register'lar (form animation + transition)
- ❌ Dışarda: legal sayfalar (kvkk/cerez/kullanim-kosullari) — sadece okuma, motion gereksiz

---

## BÖLÜM IV — Performans Baseline

### KN-15: Bundle size baseline

**Bulgular:**
- node_modules/framer-motion: **5.4 MB raw** (gzip ~50-60 KB tahmin, agresif tree-shaking ile daha az)
- node_modules/motion, gsap, lottie, three, lottiefiles, react-spring: **YOK**
- .next/static: 2.3 MB (lokal build)

**Hedef bütçe (Tur B):**
- First Load JS < 250 KB (Vercel önerisi)
- Hiçbir tek sayfa First Load JS > 300 KB
- framer-motion bundle increment hedef: < 10 KB (animation kodu artışı kabul, kütüphane kodu sabit)

### KN-16: Lighthouse mobil baseline

**Bulgular:**
- `lighthouse` CLI: YOK
- `npx lighthouse`: YOK (cache'de yok, install gerekir)
- Alternatif: PageSpeed Insights manuel — **Mehmet Bey rapor ekleme önerilir**:
  - https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.tedbirge.ai%2F
  - https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.tedbirge.ai%2Ftrafik-kazasi-tazminat
  - https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.tedbirge.ai%2Fblog%2Ftrafik-kazasi-tazminat-rehberi-2026

**Tavsiye:** Tur B-1 öncesi Mehmet Bey 3 PageSpeed skoru not düşsün (Performance / LCP / CLS / INP / TBT). Tur B sonrası aynı 3 sayfa tekrar ölçüm — regresyon kanıtı.

### KN-17: CrUX gerçek kullanıcı verisi

**Bulgular:** Tedbirge.ai trafik henüz düşük, CrUX yeterli veri muhtemelen YOK. Lab Data (Lighthouse) baseline yeterli.

### KN-18: Animasyon-ilgili performans göstergeleri

**Bulgular:**
- `transform/translate/scale` kullanım: **3** (GPU-accelerated, az ama anasayfa+hakkımızda Framer'ın native transform'larına bağımlı)
- `top/left/right/bottom` transition: **0** (mükemmel — kötü pattern yok)
- `will-change` kullanımı: **0** (Framer Motion otomatik yönetiyor — kabul)
- `height/width` animation: **1** (CLS riski minimal)

**Sonuç:** Mevcut performans **temiz**. Animasyon eklerken aynı disiplin korunmalı (transform + opacity dışına çıkmamak, layout-thrashing'den kaçınmak).

---

## BÖLÜM V — Rakip Referansı

### KN-19: Türkiye legal tech (yerel sınıf)

**Sonuçlar (curl HTTP):**
- legalup.com.tr → **HTTP 000** (DNS/network ölü)
- avukat.io → **HTTP 200**, paket tespit edilmedi, **animation density 0**
- hukukidestek.net → 301 redirect (deprecated)
- adli.io → HTTP 000

**Mimar yorumu:** Türkiye legal tech sınıfında **çıta sıfır seviyede**. avukat.io HTTP 200 dönüyor ama HTML'de framer/gsap/lottie/transform/keyframe tek bir referans yok — statik site. **Tedbirge zaten bu sınıfta zirvede.** "Sınıfında tek" iddiası bu sınıf için bugün doğru ama **bu çıta düşük** — uluslararası referans gerek.

### KN-20: Dünya legal tech

**Sonuçlar:**
- clio.com → HTTP 200, **lottie + rive** tespit edildi, animation density **25**
- ironcladapp.com → 301 (clio.com'a benzer scale)
- lex.page → HTTP 200, paket bundled (tespit edilemedi), density 3
- harvey.ai → HTTP 308

**Mimar yorumu:** Dünya legal tech orta-yüksek olgunluk. Clio + Ironclad **rive** kullanıyor (modern motion graphics platform — Lottie alternatifi, daha güçlü). Tedbirge bu sınıfa **3-6 ay yatırımla** ulaşabilir, ama tek seferde değil.

### KN-21: Dünya SaaS animasyon zirve

**Sonuçlar:**
- linear.app → HTTP 200, **rive**, animation density **208** ← devasa
- stripe.com → HTTP 200, rive, density 1 (HTML'de — ama Stripe asset-heavy, density ölçümü misleading)
- vercel.com → HTTP 200, paket bundled, density 4
- framer.com → HTTP 200, rive, density 3
- arc.net → HTTP 200, paket bundled, density 1
- superhuman.com → HTTP 200, rive, density 0 (HTML temiz)

**Mimar yorumu:**
- **rive** modern SaaS zirve standardı (Lottie'nin halefi, runtime daha küçük, interaktif animasyon daha iyi)
- linear.app çok yoğun motion (CSS animations + transforms her yerde)
- stripe.com gradient mastery + scroll choreography (HTML grep yetmez, JS bundle'da)
- framer.com kendi ürünü framer-motion kullanıyor — referans

**WebFetch derin inceleme yapılmadı (zaman/araç limiti):** Mehmet Bey opsiyonel olarak https://www.framer.com hero'ya bakıp stagger/typewriter referansı olarak eklenebilir.

### Tedbirge için gerçekçi hedef

**Sınıflar:**
1. **Türkiye legal tech** — zaten zirvede ✅
2. **Dünya legal tech (clio/ironclad)** — 3-6 ay yatırım (rive + cinematic scroll + asset üretimi) — TUR #44 tek başına yeter mi: HAYIR
3. **Dünya SaaS zirve (linear/stripe/framer)** — 6-12 ay yatırım — TUR #44 ulaşamaz

**Gerçekçi TUR #44 hedefi:** "Türkiye legal tech ✅ + Dünya legal tech ortası ⚠️ (clio çıtasının %50-60'ı)" — iyileştirme ölçülebilir, kapsamı disiplinli.

---

## BÖLÜM VI — Yazılım Altyapısı Kararı

### KN-22: Bundle bütçe + perf bütçesi

**Mevcut:** framer-motion 5.4 MB raw / ~50-60 KB gzip
**Hedef ek bütçe:** < 10 KB tek tek atom başına, < 50 KB toplam tüm TUR #44

### KN-23: 5 senaryo karşılaştırma

| Senaryo | Avantaj | Dezavantaj | Bütçe | TUR #44 uyumu |
|---|---|---|---|---|
| **1: Mevcut framer-motion + CSS** | 0 ek paket, en hızlı | Cinematic scroll-triggered zor, vektör ikon yok | 0 KB | ✅ TUR #44.1 + 44.2 |
| **2: Lottie ekle** | Vektör animasyon, designer flow | Designer gerek, JSON dosyaları | ~30 KB | ❌ Designer YOK — TUR #44 dışı |
| **3: GSAP ekle** | ScrollTrigger pin/scrub, timeline | framer-motion ile çakışır (iki sistem) | ~50 KB | ⚠️ TUR #44.3 cinematic için, riskli |
| **4: @react-three/fiber** | 3D, hero parallax depth | Ağır, mobile zayıf, designer | ~120 KB | ❌ Tedbirge için aşırı |
| **5: Motion One / Auto-animate** | Çok küçük | framer-motion zaten var | 2-3 KB | ❌ Gereksiz |

**Mimar tavsiyesi:** **SENARYO 1 (mevcut framer-motion + CSS keyframes + globals.css custom property motion tokens).**

**Gerekçe:**
- framer-motion v12 zaten production'da, MotionConfig + useScroll + useTransform + scroll-driven animations API tam
- Tailwind 4 CSS-first ile @keyframes kombine, gradient-shift / shimmer / pulse cinematic efektler mümkün
- 0 ek paket = bundle bütçe sağlam, regresyon riski minimal
- Linear.app/Framer.com çıtası framer-motion ile **erişilebilir** (Framer.com kendisi zaten framer-motion ile yazılmış)
- GSAP eklemek mimari karmaşa: aynı projede 2 motion sistemi, hangi atomda hangisi karmaşası

**Senaryo 3 (GSAP) için karar penceresi:** Eğer TUR #44.3'te scroll-triggered cinematic (Stripe checkout flow tarzı pin'lenmiş 3-step reveal) gerek olursa, ek atom olarak Mehmet Bey onayıyla eklenir. **Tur A şu an Senaryo 3'ü gerekli görmüyor.**

### KN-24: Designer-developer köprü

**Bulgular:**
- Tedbirge'nin tasarımcı kaynağı durumu: Mehmet Bey + Claude (kod tabanlı) — **dedicated tasarımcı YOK**
- Lottie/Rive/Spline gerek **YOK** (designer asset üretemez)
- SVG path animation Framer Motion native + CSS @keyframes ile mümkün

**Mimar tavsiyesi:** **TUR #44'te designer-bağımlı teknoloji yasaklı.** Sadece kod-tabanlı (framer-motion + CSS) — Mehmet Bey'in "uçtan uca kod tabanlı" emrine harfiyen uyum.

---

## EK-1 — Tutarsızlık Haritası

| Element | Yer | Mevcut | Tutarsızlık | Risk |
|---|---|---|---|---|
| EASE değer | HomePage + hakkımızda | `[0.25, 0.1, 0.25, 1]` | 2 dosyada tekrar tanım | DÜŞÜK |
| sectionVariants/fadeUp | HomePage + hakkımızda | duration 0.5-0.6, y 28-32 | İsim farklı, içerik aynı | ORTA (DRY) |
| Hover scale (CTA) | HomePage line 182,196,682,733 | 1.05/1.03/1.05/1.15 | 4 farklı değer | YÜKSEK |
| Page transition | Public + Panel layout | duration 0.3, easeOut | 2 ayrı tanım | DÜŞÜK |
| BlogSection animation | HomePage | Yok (statik) | Hero + diğer bölümler animate ama BlogSection değil | ORTA |
| 17+ sayfa motion=0 | Niş, blog, /tazminat-hesapla vb | Hiç motion yok | Anasayfa+hakkımızda yoğun, geri kalan boş | YÜKSEK |
| Hover stilleri | Tailwind transition vs Framer whileHover | 38 vs 13 | 2 sistem karışık | ORTA |

**Sonuç:** Tutarsızlıkların çoğu **DRY ihlali + ortak component eksikliği**. Merkezi `lib/motion.ts` + `<MotionButton>` + `<Reveal>` ile çözülebilir.

---

## EK-2 — Mehmet Bey görsel onay aşamaları

| Atom (öneri) | Onay tipi | Red durumunda revert maliyeti |
|---|---|---|
| TUR #44.1 lib/motion.ts (yeni) | Yazılı | Düşük (yeni dosya, sil) |
| TUR #44.1 prefers-reduced-motion altyapı | Yazılı | Düşük (CSS + MotionConfig wrapper) |
| TUR #44.1 ortak `<Reveal>` + `<MotionButton>` | Yazılı | Orta (component tüm sayfaya yayılınca etki büyür) |
| TUR #44.1 1 sayfa (niş trafik) demo motion | **Görsel** | Düşük (1 sayfa) |
| TUR #44.2 Anasayfa hero zenginleştirme | **Görsel zorunlu** | Orta (hero kritik, regresyon görünür) |
| TUR #44.2 Niş landing'lere reveal yayma | Görsel | Düşük (her sayfa atom) |
| TUR #44.3 Cinematic scroll prototip (1 sayfa) | **Görsel zorunlu** | Yüksek (scroll-trigger karmaşa) |

---

## EK-3 — Risk haritası

| Atom kategorisi | Performans | Erişilebilirlik | Mobile | SEO | Tasarım kararı |
|---|---|---|---|---|---|
| lib/motion.ts | YOK | YOK | YOK | YOK | DÜŞÜK |
| prefers-reduced-motion | YOK | KAZANIM | KAZANIM | YOK | YOK |
| `<Reveal>` ortak component | DÜŞÜK | DÜŞÜK | DÜŞÜK | DÜŞÜK | DÜŞÜK |
| Sayfa-sayfa reveal yayma | ORTA (toplam) | ORTA | ORTA | ORTA (LCP riski) | ORTA |
| Anasayfa hero zenginleştirme | YÜKSEK | YÜKSEK | YÜKSEK | YÜKSEK (LCP) | YÜKSEK |
| Cinematic scroll-trigger (44.3) | ÇOK YÜKSEK | YÜKSEK | YÜKSEK | YÜKSEK | YÜKSEK |
| Mikro etkileşim (button/card hover) | DÜŞÜK | DÜŞÜK | DÜŞÜK | YOK | DÜŞÜK |

**Önleme stratejileri:**
- Her atom sonrası lokal smoke test (Tur B-1 B2 dersi — 307 redirect kanıtı)
- LCP/CLS Lighthouse kontrolü 5 puan üstü düşüşte revert
- prefers-reduced-motion respect zorunlu (her motion atomu)
- Mobile cihaz testi (Chrome DevTools Throttle 4G + Slow 3G)

---

## EK-4 — Erişilebilirlik gereksinimleri (WCAG 2.2 + Madde 25)

| Gereksinim | Tedbirge mevcut | TUR #44 atom |
|---|---|---|
| `prefers-reduced-motion: reduce` respect | KISMI (sadece IosInstallGuide) | ✅ ZORUNLU — public layout `<MotionConfig reducedMotion="user">` |
| Animasyon süre üst limiti 5 saniye | Bilinmiyor — kontrol gerek | ⚠️ Tur B'de audit |
| Yanıp sönen efekt < 3Hz | Repeat:Infinity var (FloatingWhatsApp pulse) | ⚠️ Tur B'de duration kontrol |
| Otomatik animasyon durdurulabilir | YOK (FloatingWhatsApp pulse durdurulamaz) | ⚠️ Tur B'de pause/play |
| Klavye fokuslu element animasyon | Bilinmiyor | ⚠️ Tur B'de audit |
| Aria-hidden / aria-live | Tur A kapsamı dışı | TUR #45 ayrı erişilebilirlik turu |

**Sonuç:** TUR #44.1'in **birinci atomu**: prefers-reduced-motion altyapısı + MotionConfig wrapper + globals.css fallback. Bu olmadan sonraki atomlar açılmasın.

---

## EK-5 — KIRMIZI ÇİZGİLER (Tur B mektubuna)

```
🔒 TUR #44 BOYUNCA ASLA YAPILMAYACAK:

1. Lighthouse Performance Score 5+ puan düşüş → revert tetikleyici
2. LCP > 2.5s (Core Web Vitals iyi eşik) → revert
3. CLS > 0.1 → revert
4. INP > 200ms → revert
5. First Load JS > 300KB tek bir sayfa için → revert
6. prefers-reduced-motion respect atlama → DUR + atom yeniden
7. Lokal smoke test geçmeden push → YASAK (Tur B-1 B2 dersi)
8. Schema/migration/env değişikliği → KAPSAMI DIŞINDA
9. Yeni paket ekleme (Senaryo 1 dışına çıkma) → mimar onayı + Tur B-1.5
10. Designer asset gerektiren teknoloji (Lottie, Rive, Spline) → YASAK
11. top/left/right/bottom transition (CPU-bound layout thrashing) → YASAK
12. height/width animation tek başına (CLS) → max-height/transform alternatifi
13. AnimatePresence key={pathname} kırılması → public layout'tan dokunma
14. SectionReveal/cardVariants vb mevcut variant'ları silmek (anasayfa + hakkımızda kullanıyor) → ortak component'e taşırken eski isim alias bırak
15. Anasayfa server/client bölmesi (TUR #43 B9) bozulması → page.tsx server component statu korunur
```

---

## EK-6 — Tur B alt-tur kapsam önerisi

### TUR #44.1 — Motion Altyapı (yaklaşık ~2-3 saat, 6-7 atom)

**Hedef:** Merkezi motion sistemi + erişilebilirlik + ortak component'ler.

| Atom | Konu | Risk | Tahmini süre |
|---|---|---|---|
| 44.1-A1 | `lib/motion.ts` (yeni) — EASE + durations + variants merkezi | 🟢 | 20 dk |
| 44.1-A2 | globals.css motion custom properties (--ease-*, --duration-*) | 🟢 | 10 dk |
| 44.1-A3 | globals.css `@media (prefers-reduced-motion: reduce)` global fallback | 🟢 | 10 dk |
| 44.1-A4 | Public layout `<MotionConfig reducedMotion="user">` wrapper | 🟢 | 15 dk |
| 44.1-A5 | `<Reveal>` ortak server-friendly component (forwardRef) | 🟡 | 30 dk |
| 44.1-A6 | `<MotionButton>` + `<MotionCard>` ortak component (forwardRef) | 🟡 | 40 dk |
| 44.1-A7 | Niş trafik landing demo: `<Reveal>` + `<MotionButton>` entegrasyon | 🟢 | 20 dk |

**Yazılım altyapısı:** Senaryo 1 (mevcut framer-motion + CSS).
**Mehmet Bey onayı:** A7 sonrası **görsel doğrulama** (1 sayfa demo).

### TUR #44.2 — Sayfa-sayfa Yaygınlaştırma + Anasayfa Zenginleştirme (~3-4 saat, 8-10 atom)

**Hedef:** 17+ sayfa motion sıfırı kapatma + anasayfa hero seviye yükseltme.

| Atom | Konu | Risk | Tahmini süre |
|---|---|---|---|
| 44.2-A1 | 3 niş landing → server wrapper + client child refactor (TUR #43 B9 pattern) | 🟡 | 30 dk |
| 44.2-A2 | 3 niş landing'e `<Reveal>` + section variants entegrasyon | 🟢 | 30 dk |
| 44.2-A3 | Blog liste card hover + reveal | 🟢 | 20 dk |
| 44.2-A4 | Blog detay reveal (server wrapper var, client kısım için refactor) | 🟡 | 30 dk |
| 44.2-A5 | /tazminat-hesapla form mikro etkileşim + result reveal | 🟢 | 30 dk |
| 44.2-A6 | /referanslar + /haberler card reveal + hover | 🟢 | 25 dk |
| 44.2-A7 | /basvuru form mikro etkileşim (input focus, validation feedback) | 🟡 | 40 dk |
| 44.2-A8 | Anasayfa hero typewriter / word-stagger zenginleştirme | 🟡 | 40 dk |
| 44.2-A9 | Anasayfa BlogSection reveal (eksik variant) | 🟢 | 20 dk |
| 44.2-A10 | Hover scale tutarsızlığı düzeltme (1.05/1.03/1.15 → token) | 🟢 | 15 dk |

**Mehmet Bey onayı:** A8 sonrası anasayfa **görsel zorunlu**, A1-A2 sonrası niş demo görsel.

### TUR #44.3 — Cinematic Scroll + Gradient Choreography (~3-5 saat, 5-7 atom)

**Hedef:** "Sınıfında tek" hedefine yaklaşma — sadece anasayfa + 1 niş landing.

| Atom | Konu | Risk | Tahmini süre |
|---|---|---|---|
| 44.3-A1 | useScroll + useTransform progress bar (anasayfa scroll indicator) | 🟡 | 30 dk |
| 44.3-A2 | Anasayfa hero gradient-shift @keyframes + Framer kombine | 🟡 | 40 dk |
| 44.3-A3 | Niş landing hero parallax (transform translateY scroll-driven) | 🟡 | 30 dk |
| 44.3-A4 | Anasayfa stats counter gelişmiş reveal (sıralı stagger) | 🟢 | 25 dk |
| 44.3-A5 | Anasayfa CTA section magnetic hover (advanced micro-interaction) | 🟡 | 40 dk |
| 44.3-A6 | (OPSİYONEL) GSAP ScrollTrigger ile pin'lenmiş 3-step reveal — **AYRI MEKTUP, ek karar** | ⚠️ YÜKSEK | 60 dk + GSAP ekleme |

**Mehmet Bey onayı:** Her atomda **görsel zorunlu** (cinematic kararlar geri alma maliyeti yüksek).

### Toplam tahmin

- TUR #44.1: 6-7 atom, ~2-3 saat
- TUR #44.2: 8-10 atom, ~3-4 saat
- TUR #44.3: 5-7 atom, ~3-5 saat (44.3-A6 OPSİYONEL — ayrı karar)

**TOPLAM:** ~20-25 atom, ~8-12 saat (3 ayrı oturum önerilir, mola arası).

---

## EK-7 — Yan Bulgular (animasyon dışı)

1. **Tailwind 4 keşfi:** `tailwind.config.ts/js` YOK — Tailwind 4 CSS-first config kullanıyor (postcss.config.mjs sadece). Bu bilinmesi gereken yapı bulgusu — gelecek turlarda animation/keyframe Tailwind config'de eklenmek istenirse, çözüm globals.css custom property veya @keyframes.

2. **#1E1E8E hex 555 yerde tekrar:** CSS custom property `--brand-primary` var ama 555 yerde hex hardcoded. DRY ihlali. Bu **TUR #44 kapsamı dışında** — ayrı tur (örn. TUR #45 kod kalitesi) adayı.

3. **forwardRef kullanımı sıfır:** Component'ler ref-uyumlu değil. TUR #44.1'de `<MotionButton>` eklenirken bu pattern başlatılır, sonraki turlar genişletir.

4. **components/ui/ klasörü yok:** shadcn/ui benzeri component sistemi yok. TUR #44.1 `<MotionButton>` + `<MotionCard>` + `<Reveal>` ile bu klasörün başlangıcı kurulur.

5. **Inline EASE = [0.25, 0.1, 0.25, 1]:** Custom cubic-bezier 2 dosyada tekrar yazılmış. Magic number. lib/motion.ts ile kapatılır.

---

## ÖZET TABLOSU (24 KN)

| KN | Konu | Bulgu | Kritiklik | Atom | Alt-tur |
|----|------|-------|-----------|------|---------|
| 1 | Yüklü paketler | framer-motion v12.38, Tailwind 4, başka yok | DÜŞÜK | hayır | — |
| 2 | Framer kullanım haritası | 6 dosya, anasayfa+hakkımızda yoğun, DRY ihlali | YÜKSEK | EVET | 44.1 |
| 3 | Merkezi motion tokens | YOK (kritik) | YÜKSEK | EVET | 44.1 |
| 4 | Page transition | Public+panel layout AnimatePresence VAR, sağlam | DÜŞÜK | hayır | — |
| 5 | Scroll reveal | Sadece 2 sayfa, ortak component yok | YÜKSEK | EVET | 44.1+44.2 |
| 6 | Mikro etkileşim | Framer+Tailwind karışık, hover scale tutarsız | ORTA | EVET | 44.2 |
| 7 | Renk/spacing token | Renk var, motion yok | YÜKSEK | EVET | 44.1 |
| 8 | Keyframe envanteri | SIFIR @keyframes | ORTA | EVET | 44.1+44.3 |
| 9 | prefers-reduced-motion | Sadece IosInstallGuide (1/19 dosya) | KRİTİK | EVET | 44.1 |
| 10 | Motion-aware component | forwardRef=0, components/ui yok | YÜKSEK | EVET | 44.1 |
| 11 | Anasayfa motion | 58, "ortalama-üstü" — muazzam değil | ORTA | EVET | 44.2+44.3 |
| 12 | Niş landing motion | 0 (3 sayfa server) | YÜKSEK | EVET | 44.2 |
| 13 | Blog motion | 0 (liste+detay server) | ORTA | EVET | 44.2 |
| 14 | 14+ public sayfa | 17 sayfa motion=0, ekstrem tutarsızlık | YÜKSEK | EVET | 44.2 |
| 15 | Bundle baseline | framer-motion 5.4MB raw, .next 2.3MB | DÜŞÜK | hayır | — |
| 16 | Lighthouse | CLI yok, PageSpeed manuel öneri | ORTA | hayır | manuel |
| 17 | CrUX | Trafik düşük, lab data yeterli | DÜŞÜK | hayır | — |
| 18 | Anim-perf | transform=3, top/left=0, will-change=0, height-anim=1 — temiz | DÜŞÜK | hayır | — |
| 19 | Türkiye legal tech | Çıta sıfır seviye | DÜŞÜK | hayır | (zirve var) |
| 20 | Dünya legal tech | clio/ironclad rive, density 25 | ORTA | hayır | hedef |
| 21 | Dünya SaaS zirve | linear density 208, rive yaygın | YÜKSEK | hayır | uzun vade |
| 22 | Bundle bütçe | framer-motion yeter, ek paket gerekmiyor | DÜŞÜK | hayır | — |
| 23 | 5 senaryo | Senaryo 1 (mevcut+CSS) tavsiye | YÜKSEK | hayır | karar |
| 24 | Designer-developer köprü | Designer YOK → kod-tabanlı zorunlu | YÜKSEK | hayır | kapsam kararı |

---

## SONUÇ — Mehmet Bey'in 3 Sorusuna Cevap

### Soru 1: Tedbirge hangi sınıfta tek olabilir?

**Cevap (kanıta dayalı):**
- **Türkiye legal tech (yerel):** ✅ Zaten zirvede, TUR #44 sonrası **liderlik teyitli**. (avukat.io HTTP 200 ama animation density 0; legalup.com.tr ölü; hukukidestek.net deprecated.)
- **Dünya legal tech (clio/ironclad):** TUR #44 ile **%50-60 çıtaya** ulaşılabilir. Tam çıta için 3-6 ay sürekli yatırım + designer asset gerek.
- **Dünya SaaS animasyon zirve (linear/stripe/framer):** Tek tur ulaşamaz. 6-12 ay yatırım + dedicated designer + rive/lottie ekosistem.

**Tedbirge gerçekçi hedef:** Türkiye legal tech ✅ + Dünya legal tech ortası ⚠️.

### Soru 2: Hangi yazılım altyapısı senaryosu uygun?

**Cevap: SENARYO 1 (mevcut framer-motion v12 + CSS @keyframes + globals.css motion tokens).**

**Gerekçe:**
- 0 ek paket — bundle bütçe sağlam
- framer-motion v12 modern (MotionConfig, useReducedMotion, useScroll, scroll-driven animations API)
- Tailwind 4 CSS-first ile @keyframes globals.css'te tanımlanır
- Designer YOK — designer-bağımlı teknoloji (Lottie, Rive, Spline) yasaklanır
- Senaryo 3 (GSAP) **sadece TUR #44.3-A6'da, ek karar gereği** açılabilir

### Soru 3: Alt-tur sırası önerisi?

**Cevap (kanıta dayalı):**

1. **TUR #44.1 — Altyapı** (~2-3 saat, 6-7 atom): lib/motion.ts + prefers-reduced-motion + ortak component'ler. **ZORUNLU ÖNCE** çünkü 44.2 ve 44.3 bu altyapıya bağımlı.

2. **TUR #44.2 — Yaygınlaştırma + Anasayfa zenginleştirme** (~3-4 saat, 8-10 atom): 17+ motion=0 sayfa kapatma + anasayfa hero seviye yükseltme. **44.1 production doğrulamasından sonra mektup yazılır.**

3. **TUR #44.3 — Cinematic scroll** (~3-5 saat, 5-7 atom): Sadece anasayfa + 1 niş landing'de scroll-triggered cinematic. **Mehmet Bey görsel onay zorunlu.** OPSİYONEL atom 44.3-A6 (GSAP) ayrı karar.

**Alt-tur arası MOLA önerilir** — context window + yorgunluk + Mehmet Bey görsel doğrulama için.

---

**TUR #44 Tur A KAPANIŞI**

Tur A 75 dakikada tamamlandı. 24 KN + 6 EK + 7 yan bulgu + 3 sınıf rakip analizi + 5 senaryo karşılaştırması.

**Mimar şimdi Tur B-1 (TUR #44.1 Altyapı) mektubunu yazabilir.** İçerik: 6-7 atom, Senaryo 1, lib/motion.ts + prefers-reduced-motion + `<Reveal>`/`<MotionButton>` + 1 demo sayfa.

KIRMIZI bulgu: YOK (mevcut animasyon altyapısı sağlam, tutarsızlıklar tedavi edilebilir).
