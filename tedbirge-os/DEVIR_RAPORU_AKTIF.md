# 🛡️ DEVIR_RAPORU_AKTIF — Tedbirge.ai

> **Bu dosya CANLIDIR. Her TUR sonunda mimar tarafından üstüne yazılır.**
> **Yeni mimar oturumu Madde 26.4 protokolü gereği bu dosyayı OKUR.**

---

## DURUM — 28 Nisan 2026 (gec gece, TUR #40 FAZ 1 tamamlandi)

**Anayasa:** v1.10.0 yürürlükte (29 madde + Kapanış)
**Aktif kesit:** FAZ 4-B Operasyonel Ölçek
**Son TUR:** #40 FAZ 1 — Trafik kazası blog makalesi (lib/blog.ts)
- A1: lib/blog.ts slug "trafik-kazasi-tazminat-rehberi-2026" dolduruldu
- Commit: 5523603 (tedbirge-panel repo)
- Push: c1773a1..5523603 → Vercel deploy tetiklendi

---

## 🔴 AÇIK KRİTİK BULGULAR

### 🔴 K1 — TUR #40 FAZ 1 — TÜM BLOG DETAY SAYFALARI 404 (gizli pencere kanıtlı)
- **Kanıt:** 3 slug production'da 404 veriyor (Mehmet Bey gizli pencere testi):
  - `/blog/trafik-kazasi-tazminat-rehberi-2026` → 404
  - `/blog/is-kazasi-tazminat-sureci` → 404
  - `/blog/sigorta-tazminat-reddedildi-ne-yapmali` → 404
- **Bilinen:** Slug doğru, `generateStaticParams` kayıtlı, deploy "Ready", commit 5523603 temiz
- **Bilinmeyen:** Runtime'da `blog/[slug]/page.tsx` neden 404 veriyor — sebep kanıtsız, tahmin yapılmadı
- **Diğer açık sorunlar:**
  - prose stili çalışmıyor (`@tailwindcss/typography` kurulu değil)
  - Anasayfada blog bölümü yok
  - Niş landing sayfalarında blog linki yok
  - Footer'da blog linki yok
- **Yarınki mimar yapacak:**
  1. Lokalde `npm run dev` çalıştır → hata mesajını gör
  2. `blog/[slug]/page.tsx` incele — runtime hatasını bul
  3. Tek atom düzeltme + public URL kanıt
  4. Sonra: stil + uçtan uca link + niş landing

---

## 🟡 PLANLI BULGULAR

### O1 — TUR #37 GA4 production kanıtı bekleniyor
- **Durum:** Kod değişikliği yapıldı (TUR #37), Vercel deploy edildi
- **Kalan:** Mehmet Bey tarayıcıda 4 doğrulama yapacak
- **Doğrulama listesi:**
  1. https://www.tedbirge.ai/ → Cookie kabul → DevTools Network → `gtag/js?id=G-7MP4HD08T6` **VAR** mı?
  2. https://www.tedbirge.ai/basvuru → `gtag` **VAR** mı?
  3. https://www.tedbirge.ai/dashboard → `gtag` **YOK** mu?
  4. https://www.tedbirge.ai/musteri → `gtag` **YOK** mu?
- 4 evet → O1 KAPANDI

### O2 — TUR #38 PWA iOS production kanıtı bekleniyor
- **Durum:** IosInstallGuide.tsx push edildi, Vercel deploy edildi
- **Kalan:**
  - Ölçüt 11: Vercel dashboard → "Ready" durumu
  - Ölçüt 12: Chrome DevTools → iPhone simülasyon → 3s sonra banner görünüyor mu?
  - Ölçüt 13: **Gerçek iPhone Safari** → https://www.tedbirge.ai/ → banner + modal çalışıyor mu?
- 3 evet → O2 KAPANDI, TUR #38 resmi kapanışı

### O3 — TUR #40 FAZ 1 Vercel "Ready" kanıtı bekleniyor
- **Durum:** Commit 5523603 push edildi, Vercel deploy tetiklendi
- **Kalan:**
  - Vercel dashboard → deploy "Ready" durumu
  - https://www.tedbirge.ai/blog/trafik-kazasi-tazminat-rehberi-2026 → makale içeriği görünüyor mu?
- 2 evet → O3 KAPANDI, TUR #40 FAZ 1 resmi kapanışı

---

## 📋 MEHMET BEY'İN BEKLEYEN MANUEL İŞLERİ

1. **TUR #37 GA4 kanıtı** (5 dk) — O1'i kapat
   - Yeni Incognito (Ctrl+Shift+N) → F12 → Network → filter: `gtag`
   - tedbirge.ai/, /basvuru, /dashboard, /musteri kontrol

2. **TUR #38 PWA iOS kanıtı** (5 dk) — O2'yi kapat
   - Vercel dashboard deploy "Ready" kontrolü
   - Chrome DevTools → Device: iPhone 14 Pro → https://www.tedbirge.ai/ yenile → 3s bekle → banner görünmeli
   - Kendi iPhone'unda Safari → https://www.tedbirge.ai/ → 3s bekle → banner görünmeli

3. **TUR #40 FAZ 1 kanıtı** (2 dk) — O3'ü kapat
   - Vercel dashboard → commit 5523603 deploy "Ready" mi?
   - https://www.tedbirge.ai/blog/trafik-kazasi-tazminat-rehberi-2026 makale içeriği görünüyor mu?

---

## 📝 SON 5 COMMIT (tedbirge-panel repo)

```
5523603 feat(blog): TUR #40 FAZ 1 — trafik kazasi makalesi gercek icerikle guncellendi
c1773a1 feat(pwa): IosInstallGuide PwaProvider'a baglandi
2a4dde3 feat(pwa): IosInstallGuide component eklendi (iOS Safari install rehberi)
cccd060 feat(public): GA4 sadece public route'a baglandi (Madde 25.7 KVKK izolasyonu)
0a1e18f refactor(layout): GA4 ROOT layout'tan kaldirildi (Madde 25.7 panel izolasyonu)
```

---

## 🎯 SIRADAKİ ÖNERİLEN İŞ

**Önce:** Mehmet Bey O3 doğrulaması (2 dk) — Vercel deploy + makale URL

**Sonra: TUR #40 FAZ 2 — İş kazası makalesi**
- lib/blog.ts slug: is-kazasi-tazminat-sureci
- Mevzuat: 6331 sayılı İSG Kanunu, TBK m.417, SGK mevzuatı, Yargıtay kararları
- Aynı pattern: sadece lib/blog.ts, başka dosya HAYIR

**Sonra: TUR #40 FAZ 3 — Sigorta ret makalesi**
- lib/blog.ts slug: sigorta-tazminat-reddedildi-ne-yapmali
- Mevzuat: 5684 sayılı Sigortacılık Kanunu, Sigorta Tahkim Komisyonu
- Aynı pattern: sadece lib/blog.ts, başka dosya HAYIR

---

## 🔐 GEÇERLİ KIRMIZI NOKTA YAZILI ONAYLARI

- 28 Nisan 2026 sabah — TUR #28-B 7 ALTER TABLE (kapandı)
- 28 Nisan 2026 akşam — TUR #35 Document.deletedAt migration (kapandı)
- 28 Nisan 2026 gece — TUR #39 Anayasa Sadeleştirme (kapandı)

---

**Mimar:** Claude Sonnet 4.6 (TUR #40 FAZ 1)
**Son güncelleme:** 28 Nisan 2026 gec gece
**Bir sonraki güncelleme:** O3 kanıtı bildirince veya TUR #40 FAZ 2 başlayınca

🛡️ Anayasa v1.10.0 — Trafik kazası makalesi yayında (Vercel deploy bekleniyor), iş kazası + sigorta makaleleri sırada.
