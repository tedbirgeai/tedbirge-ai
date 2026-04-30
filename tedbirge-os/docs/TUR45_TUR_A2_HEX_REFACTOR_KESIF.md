# TUR #45 Tur A2 — Y1 Hex Refactor Mini Keşif

**Tarih:** 30 Nisan 2026
**Anayasa:** v1.11.0
**Tip:** Salt okuma keşif (Madde 21.2)
**Mimar (uygulayan):** Claude Code
**Mimar (yazacak):** Claude Opus 4.7 (sohbet) — TUR #45.2 mektubu için bu rapor zemindir

---

## C1 — Tailwind Config Durumu

**Bulgu:** `tailwind.config.ts/js/mjs` **YOK**. Tek dosya:

```
postcss.config.mjs
```

`postcss.config.mjs` içeriği:
```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

**Sonuç:** Proje **Tailwind 4 CSS-first config** kullanıyor (anayasa Madde 25 + TUR #44 Tur A KN-1 doğrulaması). Tailwind 4'te `theme.extend.colors.brand` JavaScript config dosyasında **tanımlanamaz** — `@theme` directive ile **globals.css** içinde tanımlanır.

**Mektup §C1 yanlış varsayım:** Mektup `tailwind.config.ts` içinde brand renk eklenmesini önerdi (Y5 kavramı). Tailwind 4'te bu mümkün değil — Y5 yeniden formüle edilmeli: globals.css'e `@theme` bloğu eklemek.

---

## C2 — globals.css :root Blok Durumu

`globals.css` ilk 80 satır (kısa özet):

- **`:root` bloğu** mevcut: 17 kurumsal renk + 11 motion token + 8 cinematic token = 36 CSS custom property tanımlı
- Brand renkleri: `--brand-primary: #1E1E8E`, `--brand-accent: #5CB85C`, `--pub-primary`, `--pub-secondary`, `--pub-dark` vb.
- **`@theme` bloğu YOK** — bu sebepten Tailwind utility class'ları (`bg-brand-primary` gibi) **çalışmıyor**, geliştirici `bg-[#1E1E8E]` arbitrary kullanmak zorunda.

**Önemli ayrım:**
- `:root { --brand-primary: ... }` → **CSS variable**, sadece `var(--brand-primary)` ile referans verilebilir, Tailwind utility üretmez
- `@theme { --color-brand-primary: ... }` → **Tailwind 4 directive**, Tailwind otomatik `bg-brand-primary`, `text-brand-primary` vb. utility'ler üretir

Bu mimari ayrımı Y1 refactor stratejisinin temel taşı.

---

## C3 — Tailwind Arbitrary (`bg-[#...]`) Pattern Dağılımı

**Toplam kaynak dosya kullanımı:** 240 (`.next/` ve `node_modules/` hariç)

**Pattern bazlı dosyalar:**

### `bg-[#1E1E8E]` (15 dosya)
- app/(panel)/dashboard/{ajanda,arsiv,page,sistem-durumu,takvim}.tsx
- app/(panel)/leads/{page, [id]/360, [id]/page, [id]/sigorta-basvuru, [id]/MusteriHesabiAcButton}.tsx
- app/(public)/{basvuru, register/musteri, sifre-belirle, tazminat-hesapla}/page.tsx
- components/lead/SigortaBasvuruKart.tsx

### `text-[#1E1E8E]` (14 dosya)
- app/(panel)/dashboard/{ajanda,arsiv,page,takvim}.tsx
- app/(panel)/leads/{page, [id]/360, [id]/page}.tsx
- app/(public)/{basvuru, login, register/musteri, sifre-belirle}/page.tsx
- components/{HukukcuSozlesmeModal, layout/AppLayout, layout/Footer}.tsx

### `border-[#1E1E8E]` (19 dosya)
- 7 panel dashboard sayfası
- 5 panel leads sayfası
- 5 public sayfa (basvuru, register/{hukukcu,musteri,temsilci}, sifre-belirle, tazminat-hesapla)
- components/{AiChatWidget, layout/AppLayout}.tsx

**Sonuç:** ~30 farklı dosya, 240 kullanım. Mekanik sed-replace **olası** ama Tailwind class collision riski yok (arbitrary class'lar deterministik).

---

## C4 — Inline Style Pattern Dağılımı

**Toplam kaynak kullanımı:** 181 (`.next/` ve `node_modules/` hariç)

**Pattern:** `style={{ color: "#1E1E8E" }}`, `background: "#1E1E8E"`, vb.

**Dosya dağılımı (30 dosya):**

Panel:
- app/(panel)/dashboard/{ajanda,bilirkisi,haberler,hukukcu,hukukcu-onay,iletisim,page,takvim,temsilci-onay}.tsx
- app/(panel)/leads/{page, [id]/360, [id]/contracts, [id]/odeme, [id]/page}.tsx
- app/(panel)/musteri/page.tsx

Public:
- app/(public)/HomePageClient.tsx (TUR #44'te de bilinen yer)
- app/(public)/{basvuru, basvuru-sorgula, haberler, hakkimizda, iletisim, is-kazasi-tazminat, login, referanslar, register/hukukcu, register/temsilci, sigorta-tazminat-reddedildi, tazminat-hesapla, trafik-kazasi-tazminat}/page.tsx
- app/layout.tsx

**Sonuç:** Inline style **kolay dönüşüm** — `"#1E1E8E"` → `"var(--brand-primary)"` mekanik replace. 181 yer, ~30 dosya, sed güvenli.

---

## C5 — `var(--brand-primary)` Kullanımı

**Toplam kullanım:** 140 (~30+ dosya)

**Bulgu:** Brand variable'ı zaten **140 yerde aktif kullanılıyor** — bu hem doğru pattern'in benimsendiğinin kanıtı, hem de tutarsızlık göstergesi (181 inline hex hâlâ var).

**Dağılım:**
- Panel: 12+ dosya (analytics, assignments, contracts, haberler, kullanicilar, lawyers, leads, leads/[id]/chat, leads/[id]/contracts, temsilci, temsilci/yeni-muvekkil)
- Public: forgot-password, login, reset-password
- Components: brand/{BrandLogo, BrandLogo.backup}, dashboard/StatCard, documents/DocumentList, leads/LeadTable
- globals.css

**Karşılaştırma:**
- ✅ var(--brand-primary): 140 yer (doğru pattern)
- ❌ "#1E1E8E" inline: 181 yer (eski pattern)
- ❌ bg-[#1E1E8E] arbitrary: 240 yer (Tailwind 4 @theme eksik)

---

## C6 — postcss.config.mjs

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

**Sonuç:** Tailwind 4 PostCSS plugin yapılandırması. Tek plugin, ekstra config yok. `@tailwindcss/postcss` package.json'da v4.x.x olmalı (TUR #44 Tur A'da v4.2.2 doğrulandı).

---

## Toplam Sayım Özeti (Y1 Refactor Hedefi)

| Pattern | Sayı | Refactor Stratejisi |
|---|---|---|
| Tailwind arbitrary `bg-[#...]` | 240 | Y5 öncülünden sonra `bg-brand-primary` (Tailwind utility) |
| Inline style `"#1E1E8E"` | 181 | `var(--brand-primary)` mekanik replace |
| globals.css inline hex | 9 | manuel düzeltme |
| **Toplam refactor hedef** | **~430** | |

**`var(--brand-primary)` zaten kullanılan:** 140 (referans, dokunulmaz)

**.next/ build artifacts:** Tur A'daki 2376 toplam sayımdan ~%80'i build artifacts (refactor dışı, otomatik yeniden üretilir).

---

## Y5 Yeniden Formülasyon (Mektup Düzeltmesi)

**Mektup (yanlış):** "tailwind.config.ts'te theme.extend.colors.brand TANIMSIZ — config'e brand renk eklenmeli"

**Doğru (Tailwind 4):** "globals.css'te `@theme` directive bloğu YOK. Brand renkler `:root { --brand-primary: ... }` olarak CSS variable tanımlı ama Tailwind utility class olarak `@theme` bloğunda **eksik**. Tailwind 4 `@theme` directive ile renkleri ekleyince `bg-brand-primary`, `text-brand-primary` vb. utility'ler otomatik üretilir."

**Y5 önerilen değişiklik (TUR #45.2'de uygulanacak):**

```css
/* globals.css'e eklenecek */
@theme {
  --color-brand-primary: #1E1E8E;
  --color-brand-primary-hover: #18187a;
  --color-brand-primary-soft: #edeafb;
  --color-brand-accent: #5CB85C;
  --color-brand-accent-soft: #eef9e7;
  --color-pub-dark: #0A1628;
}
```

Sonra Tailwind otomatik üretir:
- `bg-brand-primary` → `background-color: #1E1E8E`
- `text-brand-primary` → `color: #1E1E8E`
- `border-brand-primary` → `border-color: #1E1E8E`
- Opacity modifier: `bg-brand-primary/20` → `background-color: rgba(30, 30, 142, 0.2)`

---

## Y1 Refactor Önerilen Sıra (TUR #45.2 mektubu için)

1. **Atom 1 — Y5: globals.css'e @theme bloğu ekle** (5 dk)
   - 6 brand renk Tailwind theme'a eklenir
   - Build geçer, mevcut `bg-[#1E1E8E]` çalışmaya devam eder (yeni `bg-brand-primary` de kullanılabilir)

2. **Atom 2 — Tailwind arbitrary refactor (sed)** (45 dk)
   - 240 yerde `bg-[#1E1E8E]` → `bg-brand-primary`
   - `text-[#1E1E8E]` → `text-brand-primary`
   - `border-[#1E1E8E]` → `border-brand-primary`
   - Opacity variants: `bg-[#1E1E8E]/20` → `bg-brand-primary/20`
   - Build + lokal smoke test her sayfada

3. **Atom 3 — Inline style refactor (sed)** (30 dk)
   - 181 yerde `"#1E1E8E"` → `"var(--brand-primary)"`
   - Style attribute kontrolü

4. **Atom 4 — globals.css inline hex temizliği** (15 dk)
   - 9 yerde manuel `#1E1E8E` → `var(--brand-primary)` düzeltme

5. **Atom 5 — Production smoke test** (15 dk)
   - 5+ sayfa + dashboard + leads detay görsel kanıt

**Toplam TUR #45.2 tahmini:** ~2 saat, 5 atom, düşük risk (renkler aynı, sadece referans değişimi).

---

## Sonuç

Bu rapor **TUR #45.2 (Y1 hex refactor) mektubu için kanıt zeminidir**. Mimar (Claude Opus 4.7, sohbet) bu raporu okuyup uygulama mektubunu yazacak.

**Tur A2 ana bulgular:**
- Tailwind 4 CSS-first config (tailwind.config.* dosyası YOK, Y5 mektup varsayımı yanlış)
- `:root` CSS variable zaten tanımlı, ama `@theme` directive eksik (Tailwind utility üretilmiyor)
- 240 Tailwind arbitrary + 181 inline style + 9 globals.css = ~430 refactor hedefi
- 140 var(--brand-primary) zaten doğru kullanılıyor (referans)
- Sed güvenli, Tailwind class collision riski yok

— Mimar (Claude Code, Tur A2 uygulayan) — TUR #45 (30 Nisan 2026)
— Anayasa v1.11.0 yürürlükte
