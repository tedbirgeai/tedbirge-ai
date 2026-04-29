# TUR #43 Tur A — SEO Meta Kesif Raporu

**Tarih:** 30 Nisan 2026 (gece yarisi)
**Uygulayan:** Claude Code
**Anayasa:** v1.10.0
**Risk:** Yesil (salt okuma, 0 degisiklik)
**Sure:** ~45 dk

---

## Repo durumu (on kontrol)

- Calisma agaci: TEMIZ (git status cikti yok)
- Son commit: `d0c3cc3` — fix(login): TUR #42 K8 C11 - sol panel gradient kurumsal renk
- TUR #42 sonrasi mi: EVET

---

## KN-1 — Root layout metadata

**Dosya:** `app/layout.tsx` (66 satir)

**Bulgular:**
- `title`: "Tedbirge AI" — sabit, title template YOK
- `description`: "Trafik ve is kazasi tazminat yonetim platformu" — ASCII, 49 karakter
- `metadataBase`: YOK — OG URL'leri relative kalacak, crawler sorun yasayabilir
- `openGraph`: YOK — hic tanimlanmamis
- `twitter`: YOK — hic tanimlanmamis
- `alternates.canonical`: YOK
- `robots`: YOK (meta tag olarak)
- GSC dogrulama: VAR — `CZIHEFEO4bhT84XvzAeY1Tz5dPYhchcMXyAO7saEkMU`
- `manifest`: VAR — `/manifest.webmanifest` (TUR #42 C7 duzeltmesi saglan)
- `themeColor`: Viewport ayri export'ta `#1E1E8E` — DOGRU (Next 15+ disiplini)

**Kanit (lokal):**
```
export const metadata: Metadata = {
  title: "Tedbirge AI",
  description: "Trafik ve is kazasi tazminat yonetim platformu",
  applicationName: "Tedbirge AI",
  manifest: "/manifest.webmanifest",
  ...
};
// openGraph YOK, twitter YOK, metadataBase YOK
```

**Production kaniti:**
```
<title>Tedbirge AI</title>
<meta name="description" content="Trafik ve is kazasi tazminat yonetim platformu"/>
<meta name="google-site-verification" content="CZIHEFEO4bhT84XvzAeY1Tz5dPYhchcMXyAO7saEkMU"/>
```

**Sonuc:** EKSİK — metadataBase + openGraph + twitter + title template tumunun eksik olmasi kritik

---

## KN-2 — Public layout metadata

**Dosya:** `app/(public)/layout.tsx` (67 satir)

**Bulgular:**
- `"use client"` directive var — metadata export EDILEMIYOR
- `<GoogleAnalytics />` component VAR (TUR #37 saglan, regresyon YOK)
- `<FloatingWhatsApp />` ve `<AiChatWidget />` burada
- `<AnimatePresence>` page transition wrapper burada

**Sonuc:** DOGRU — client layout olmak zorunda (cunku client hook'lari kullaniyor). Metadata parent root layout'tan kalitim almak durumunda.

---

## KN-3 — Anasayfa metadata

**Dosya:** `app/(public)/page.tsx`

**Bulgular:**
- `"use client"` directive var — kendi metadata export'u EDILEMIYOR
- `export const metadata` satiri YOK
- `generateMetadata` fonksiyonu YOK
- Root layout'tan kalitim: title="Tedbirge AI", desc generic
- Anasayfa icin HICBIR OZEL META YOK

**Kritik problem:** Anasayfa "use client" oldugu icin server-side metadata export yapilemiyor.
Cozum secenekleri (Tur B'de karar gerekir):
  a) Anasayfa layout + page ayrisimi (server wrapper + client component)
  b) Root layout metadata'sini anasayfa icin optimize etmek

**Production kaniti:**
```
<title>Tedbirge AI</title>
<meta name="description" content="Trafik ve is kazasi tazminat yonetim platformu"/>
// og: YOK, twitter: YOK, canonical: YOK
```

**Sonuc:** KRİTİK EKSİK — anasayfa OG ve ozel meta tamamen yok

---

## KN-4 — Blog liste metadata

**Dosya:** `app/(public)/blog/page.tsx`

**Bulgular:**
- Kendi `export const metadata` blogu VAR
- title: ozellestirilmis (blog listesi basligina gore)
- description: kisa ozet
- openGraph: YOK
- twitter: YOK

**Sonuc:** KISMI — temel meta var, OG/twitter eksik

---

## KN-5 — Blog detay generateMetadata

**Dosya:** `app/(public)/blog/[slug]/page.tsx`

**Bulgular:**
- `generateMetadata` async fonksiyon VAR — TUR #40 K1 Promise unwrap duzeltmesi SAGLAN
- `generateStaticParams` VAR
- title: slug'a gore dinamik
- description: post'tan geliyor
- `openGraph.title`: VAR
- `openGraph.description`: VAR
- `openGraph.url`: VAR
- `openGraph.type`: "article" VAR
- `openGraph.images`: YOK
- `twitter.card/title/description`: YOK
- `alternates.canonical`: YOK

**Veri kaynagi:** `lib/blog.ts` (238 satir) — statik hardcoded POSTS dizisi (DB veya filesystem degil)
3 blog post: trafik-kazasi-tazminat-rehberi-2026, is-kazasi-tazminat-sureci, sigorta-tazminat-reddedildi-ne-yapmali

**Production kaniti (/blog/trafik-kazasi-tazminat-rehberi-2026):**
```
<meta property="og:title" content="..."/>
<meta property="og:description" content="..."/>
<meta property="og:url" content="..."/>
<meta property="og:type" content="..."/>
// og:image YOK, twitter YOK, canonical YOK, JSON-LD YOK
```

**Sonuc:** KISMI — dinamik meta var, gorsel ve twitter eksik

---

## KN-6 — 3 nis landing metadata

**Dosyalar:**
- `app/(public)/trafik-kazasi-tazminat/page.tsx`
- `app/(public)/is-kazasi-tazminat/page.tsx`
- `app/(public)/sigorta-tazminat-reddedildi/page.tsx`

**Bulgular:**
- Her birinde ozel `export const metadata` blogu VAR
- title: sayfaya ozel
- description: sayfaya ozel
- keywords: VAR
- openGraph.url: VAR
- openGraph.images: YOK
- twitter.card/title/description: VAR — twitter.images YOK
- alternates.canonical: YOK
- Fragment wrap (`<>...</>`): DOGRU — TUR #42 C5 regresyonu YOK

**Production kaniti (/trafik-kazasi-tazminat):**
```
<meta property="og:title" />
<meta property="og:description" />
<meta property="og:url" />
<meta name="twitter:card" />
<meta name="twitter:title" />
<meta name="twitter:description" />
// og:image YOK, twitter:image YOK, canonical YOK
```

**Sonuc:** İYİ AMA EKSİK — en saglam metadata bu sayfalar, gorsel eksik

---

## KN-7 — OpenGraph image dosyalari

**Dizin:** `public/`

**Bulgular:**
- `og-image.png` (1200x630): YOK
- `og-image-blog.png` gibi sayfa-spesifik: YOK
- Mevcut dosyalar: `logo.png` (640x640 JPEG), `apple-touch-icon.png`, favicon'lar, icons/
- `logo.png` OG icin YETERSIZ: yanlis boyut (640x640, 1200x630 olmali), JPEG (PNG tercih edilir)
- Hicbir sayfada `og:image` meta tag'i production'da gorulmuyor

**Sonuc:** KRİTİK EKSİK — sosyal medya paylasimlarinda onizleme resmi SIFIR

---

## KN-8 — Sitemap

**Dosya:** `app/sitemap.ts` (31 satir) — Dinamik `MetadataRoute.Sitemap` VAR

**Production URL listesi (14 URL):**
```
https://www.tedbirge.ai                              (priority 1.0)
https://www.tedbirge.ai/basvuru                      (priority 0.9)
https://www.tedbirge.ai/lexscan                      (priority 0.8)
https://www.tedbirge.ai/trafik-kazasi-tazminat       (priority 0.85)
https://www.tedbirge.ai/is-kazasi-tazminat           (priority 0.85)
https://www.tedbirge.ai/sigorta-tazminat-reddedildi  (priority 0.8)
https://www.tedbirge.ai/kvkk-aydinlatma              (priority 0.5)
https://www.tedbirge.ai/cerez-politikasi             (priority 0.5)
https://www.tedbirge.ai/kullanim-kosullari           (priority 0.5)
https://www.tedbirge.ai/iletisim                     (priority ?)
https://www.tedbirge.ai/blog                         (priority ?)
https://www.tedbirge.ai/blog/trafik-kazasi-tazminat-rehberi-2026
https://www.tedbirge.ai/blog/is-kazasi-tazminat-sureci
https://www.tedbirge.ai/blog/sigorta-tazminat-reddedildi-ne-yapmali
```

**EKSİK sayfalar (sitemap'te olup olmamali):**
- `/haberler` — EKSİK (TUR #42 C8'de PublicNav eklendi, indekslenebilir)
- `/referanslar` — EKSİK
- `/hakkimizda` — EKSİK (varsa)
- `/tazminat-hesapla` — EKSİK
- `/basvuru-sorgula` — EKSİK (TUR #42 C8'de duzeltildi, public)

**lastModified:** Dogru (dinamik, suanki tarih)
**Blog sluglari:** Dinamik olarak lib/blog.ts'ten geliyor — DOGRU

**Sonuc:** EKSİK — 5 public sayfa sitemap'te yok

---

## KN-9 — Robots.txt

**Dosya:** `app/robots.ts` (14 satir) — Dinamik `MetadataRoute.Robots` VAR

**Production ciktisi:**
```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /admin/

Sitemap: https://www.tedbirge.ai/sitemap.xml
```

**EKSİK disallow'lar:**
- `/musteri/` — gizli (musteri portalı)
- `/login` — auth sayfasi
- `/register` — auth sayfasi
- `/forgot-password`, `/reset-password`, `/sifre-belirle` — auth sayfalari

**Sitemap referansi:** VAR (Sitemap: https://www.tedbirge.ai/sitemap.xml) — DOGRU

**Sonuc:** EKSİK — auth sayfalari Google'a acik, gereksiz crawl + muhtemelen noindex'e ihtiyaci var

---

## KN-10 — Production HTML kaniti

### Anasayfa (/)
```
<title>Tedbirge AI</title>
<meta name="description" content="Trafik ve is kazasi tazminat yonetim platformu"/>
<meta name="google-site-verification" content="CZIHEFEO4bhT84XvzAeY1Tz5dPYhchcMXyAO7saEkMU"/>
// og: YOK (hic)
// twitter: YOK (hic)
// canonical: YOK
// JSON-LD: YOK
```

### /trafik-kazasi-tazminat
```
<meta property="og:title"/>
<meta property="og:description"/>
<meta property="og:url"/>
<meta name="twitter:card"/>
<meta name="twitter:title"/>
<meta name="twitter:description"/>
// og:image YOK
// twitter:image YOK
// canonical YOK
// JSON-LD YOK
```

### /blog/trafik-kazasi-tazminat-rehberi-2026
```
<meta property="og:title"/>
<meta property="og:description"/>
<meta property="og:url"/>
<meta property="og:type"/>
// og:image YOK
// twitter YOK
// canonical YOK
// JSON-LD YOK ("@type" count: 0)
```

**Sonuc:** Production HTML KN-1 ile tam eslesiyor — metada altyapisi lokal kodla uyumlu, eksiklikler production'da aynen yansiyor

---

## KN-11 — JSON-LD structured data

**Lokal kod taramasi (app/ + components/):**
- `application/ld+json`: SIFIR eslesme
- `schema.org`: SIFIR eslesme
- `@context`: SIFIR eslesme

**Production HTML:**
- `"@type"` count tum sayfalarda: 0
- JSON-LD blogu hic yok

**Eksik schema tipleri (Tur B'de hedeflenmeli):**
- `Organization` — ana sirket bilgisi (root layout, tum sayfalarda)
- `WebSite` — arama kutusu + site adi (root layout)
- `LegalService` — LegalTech icin kritik rich snippet (anasayfa + nis landingler)
- `Article` — blog detay sayfasi
- `BreadcrumbList` — blog + nis landingler
- `FAQPage` — nis landinglerde soru-cevap bloglari varsa

**Sonuc:** KRİTİK EKSİK — JSON-LD sifir, Google rich snippet imkani tamamen kayip

---

## KN-12 — Google Search Console + analitik

**GSC dogrulama:**
- Production HTML'de VAR: `<meta name="google-site-verification" content="CZIHEFEO4bhT84XvzAeY1Tz5dPYhchcMXyAO7saEkMU"/>`
- TUR #37 ve oncesi eklenmisti — SAGLAN, regresyon YOK

**GA4:**
- `<GoogleAnalytics />` component `app/(public)/layout.tsx` icinde VAR (TUR #37 A2)
- Client-side hydration ile yukleniyor — statik HTML'de gorulmez, bu BEKLENEN davranis
- G-7MP4HD08T6 ID kodu server HTML'e yansimiyor (client bundle'da)
- TUR #37 kapandi — regresyon YOK

**Sonuc:** SAGLAN — GSC dogrulama + GA4 TUR #37 tur kapanisi saglan

---

## ÖZET TABLOSU

| KN | Konu | Durum | Kritiklik | Tur B'de atom? |
|----|------|-------|-----------|----------------|
| 1 | Root metadata (metadataBase/OG/twitter/template) | EKSİK | Yuksek | Evet — 1 atom |
| 2 | Public layout | DOGRU (use client zorunlu) | — | Hayir |
| 3 | Anasayfa kendi metadata'si | KRİTİK EKSİK | Cok Yuksek | Evet — 1 atom |
| 4 | Blog liste metadata | KISMI | Orta | Evet (KN-1 atomunun parcasi) |
| 5 | Blog detay generateMetadata | KISMI (image/twitter eksik) | Orta | Evet — 1 atom |
| 6 | 3 nis landing metadata | İYİ AMA EKSİK (image eksik) | Orta | Evet (KN-1 + OG atom) |
| 7 | OG image dosyasi (1200x630) | KRİTİK EKSİK | Cok Yuksek | Evet — 1 atom |
| 8 | Sitemap (5 sayfa eksik) | EKSİK | Orta | Evet — 1 atom |
| 9 | Robots (auth sayfalar acik) | EKSİK | Dusuk-Orta | Evet — 1 atom |
| 10 | Production HTML kaniti | KN-1-9 ile uyumlu | — | Hayir |
| 11 | JSON-LD structured data | KRİTİK EKSİK — SIFIR | Cok Yuksek | Evet — 2-3 atom |
| 12 | GSC + GA4 | SAGLAN | — | Hayir |

---

## EKSİKLİK LİSTESİ (Tur B atom adaylari)

**Atom 1 — Root metadata altyapisi (app/layout.tsx)**
- `metadataBase: new URL("https://www.tedbirge.ai")` ekle
- `title: { default: "Tedbirge AI", template: "%s | Tedbirge AI" }` ekle
- `openGraph` global defaults: site_name, locale, type ekle
- `twitter` global defaults: card="summary_large_image" ekle
- Etki: Tum sayfalarda OG URL'leri absolute, title template calisiyor

**Atom 2 — Anasayfa server metadata (app/(public)/page.tsx veya yeni dosya)**
- Problem: "use client" — cozum secenek tartisma gerektirir
- Secenek A: Page server component wrapper — daha temiz
- Secenek B: Root layout metadata'yi anasayfa icin optimize et
- Icerik: title="Trafik Kazasi Tazminati | Tedbirge AI", desc keyword-rich, OG tam

**Atom 3 — og-image.png (1200x630)**
- `public/og-image.png` olusturulacak (Mehmet Bey gorsel verecek veya mimar tasarim onerisi)
- Tum sayfalarin `openGraph.images` referansi bu dosyaya
- Blog + nis landingler post-spesifik veya shared

**Atom 4 — Sitemap eksik sayfalar (app/sitemap.ts)**
- Eklenecek: /haberler, /referanslar, /hakkimizda, /tazminat-hesapla, /basvuru-sorgula
- Oncelik ve changeFrequency degerleri

**Atom 5 — Robots auth sayfalar (app/robots.ts)**
- Eklenecek: /musteri/, /login, /register, /forgot-password, /reset-password, /sifre-belirle

**Atom 6 — JSON-LD Organization + WebSite (root)**
- `app/layout.tsx` veya yeni `components/JsonLd.tsx` server component
- Organization: sirket adi, url, logo, contactPoint
- WebSite: name, url, potentialAction (SearchAction)
- Tum sayfalarda aktif

**Atom 7 — JSON-LD LegalService (nis landingler)**
- `/trafik-kazasi-tazminat`, `/is-kazasi-tazminat`, `/sigorta-tazminat-reddedildi`
- LegalService schema: name, description, areaServed, serviceType

**Atom 8 — JSON-LD Article (blog detay)**
- `app/(public)/blog/[slug]/page.tsx`
- Article schema: headline, author, datePublished, image, publisher

---

## REGRESYON KONTROLÜ (TUR #41 + #42 etkisi)

- `app/layout.tsx` manifest path (TUR #42 C7): DOGRU — `/manifest.webmanifest` VAR
- `/basvuru-sorgula` (TUR #42 C8): Sayfa calisiyor, #2d1e78 temizlendi, PublicNav eklendi — metadata KN-1 generic'ten kalitim (yeterli)
- 3 nis landing (TUR #42 C5 PublicNav fragment wrap): DOGRU — fragment wrap bozulmamis, kendi metadata'lari saglan
- TUR #42 kapanisi (B1-B4): OTONOM_RAPOR + DEVIR + IS_PLANI + MIMARI_KARARLAR — tumu saglan

---

## YAN BULGULAR (Tur B kapsami disinda)

- **Blog veri modeli:** `lib/blog.ts` statik TypeScript dizisi. SEO acisından sorun yok (SSR doğru calisıyor) ama icerik eklemesi zor. Tur B kapsami disinda — TASK_QUEUE.md adayi.
- **hakkimizda + referanslar:** Bu sayfalar sitemap'te yok ama URL'leri navigation'da goruldugu icin mevcut. Tur B Atom 4'te sitemap'e eklenecek.
- **/basvuru-sorgula canonical:** Sayfa halka acik ama canonical eksik. Tur B Atom 1+2 ile dolaylı duzeltilecek.
- **`lang="tr"` root html:** VAR — dogru (SEO + eriselebilirlik).

---

## SONUÇ

Tedbirge.ai panelinin SEO meta altyapisi **kisimsaldi** durumda: Temel title/description var, 3 nis landing Twitter + OG baslık/acıklama eklenmis, blog detay generateMetadata calisıyor, GSC + GA4 saglan. Ancak **4 kritik eksiklik** Tur B'nin cekirdegini olusturuyor:

1. **JSON-LD sifir** — Google rich snippet (LegalService, Organization, Article) tamamen gormez; bu nis pazarda (hukuk) en buyuk SEO kaybi
2. **OG image yok** — sosyal medya paylasimlarinda onizleme resmi yok; tiklama orani dusuyor
3. **Anasayfa kendi meta'sindan yoksun** — ana giris noktasi generic baslik tasiyor
4. **metadataBase eksik** — OG URL'leri relative, crawler belirsizligi

Tur B tahmini: **8 atom**, ~2-3 saat. Once metadataBase + og-image (altyapi), sonra JSON-LD (etki), sonra sitemap + robots (tamamlayici).

---

*TUR #43 Tur A kapandi. Tur B mektubunu mimar (sohbet) yazacak.*
*OTONOM_RAPOR.md guncellenmedi — Tur A salt okuma, TUR #43 henuz acilmadi.*
