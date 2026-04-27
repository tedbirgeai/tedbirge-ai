# TEDBIRGE SEO + ORGANIK TRAFIK OPERASYON REHBERI
## Madde 25.6 + 25.10 Disiplinine Uygun

---

## 1. GOOGLE SEARCH CONSOLE KURULUMU

### Adim 1: Hesap Olustur
1. https://search.google.com/search-console ac
2. Google hesabi ile giris yap (GA4 ile ayni hesap onerilir)
3. "Mulk Ekle" > "URL Oneki"
4. URL: https://www.tedbirge.ai

### Adim 2: Mulkiyeti Dogrula
**Onerilen:** Google Analytics ile otomatik dogrulama

GA4 zaten kurulu (FAZ 1) — "GA ile dogrula" secenegi otomatik onaylar.

Alternatif: HTML Meta Tag — kod kopyala > mimar oturumuna yapistir >
mektup ile app/layout.tsx'e eklenir (env: NEXT_PUBLIC_GSC_VERIFICATION_ID).

### Adim 3: Sitemap Bildir
1. Search Console > "Sitemap'ler" menusu
2. Yeni sitemap ekle: sitemap.xml
3. Gonder > Google taramaya baslar (24-72 saat)

URL: https://www.tedbirge.ai/sitemap.xml (Next.js App Router otomatik uretir)

### Adim 4: URL Denetimi
Her yeni sayfa icin (ornegin yeni blog yazisi):
- Search Console > "URL Denetle"
- Yeni URL gir > "Dizine Ekleme Iste"
- Manuel hizlandirma

---

## 2. ICERIK ONCELIK SIRASI

### Ilk 4 Hafta — SEO Temeli

**Hafta 1: Kapsamli Rehberler (uzun makale)**
- "Trafik Kazasi Sonrasi 30 Adimlik Rehber" (3000+ kelime)
- Hedef anahtar: "trafik kazasi sonrasi ne yapmali"

**Hafta 2: Nis Ilgi**
- "Konya'da Trafik Kazasi Tazminati Nasil Alinir?" (yerel SEO)
- "Is Kazasi Tutanagi Nasil Tutulur?"

**Hafta 3: Mevzuat Aciklama**
- "SBM 2026 Tablo Aciklamasi"
- "Manevi Tazminat Hesaplama Kriterleri"

**Hafta 4: Sikca Sorulan**
- "Sigortanin Reddettigi Tazminata Itiraz"
- "Tahkim Komisyonu Basvuru"

### Sonraki Aylar
- Haftada 1 yeni makale (minimum)
- Eski makaleleri 3 ayda bir guncelle
- Mevzuat degisikligi aninda guncelleme

---

## 3. ANAHTAR KELIME ARASTIRMASI

### Yuksek Hacim (Turkiye, aylik)
- "trafik kazasi tazminat" — 50K+
- "is kazasi tazminat" — 20K+
- "sigorta tazminat hesaplama" — 15K+
- "trafik sigortasi ne oder" — 10K+

### Orta Hacim
- "kazadan sonra ne yapmali" — 5K
- "manevi tazminat nedir" — 5K
- "sigorta itirazi" — 3K

### Dusuk Hacim, Yuksek Niyetli (long-tail)
- "trafik kazasi avukati ucretsiz danisma" — 800
- "is kazasi SGK basvuru" — 600
- "Konya trafik kazasi tazminat" — 200

**Strateji:** Yuksek hacim > kapsamli rehber. Dusuk hacim > nis landing page
(FAZ 2'de yapildi: /trafik-kazasi-tazminat, /is-kazasi-tazminat, /sigorta-tazminat-reddedildi).

---

## 4. BACKLINK STRATEJISI

- Hukuk forumlari: Yararli yorum + Tedbirge linki (egitici, spam degil)
- Misafir yazilar: Yerel haber siteleri, hukuk bloglari
- Konya yerel is rehberleri: Tedbirge isletme kaydi
- Avukat ortak websiteleri: Karsilikli link
  (B2B sayfasi onerisi — muvekkil sayfasi DEGIL, TBB ihlali riski)

---

## 5. AYLIK KPI (Madde 25.10)

| Metrik | Hedef Ay 1 | Hedef Ay 3 | Hedef Ay 6 |
|---|---|---|---|
| Organic ziyaretci | 100 | 1.000 | 5.000 |
| Blog yazisi sayisi | 4 | 12 | 24 |
| GSC indexli sayfa | 8 | 20 | 40 |
| Top 10'da anahtar kelime | 0 | 3 | 10 |

### Olcum Araclari
- Google Search Console (ucretsiz)
- Google Analytics 4 (FAZ 1'de kuruldu)
- Pazarlama Dashboard (/dashboard/pazarlama — FAZ 3'te kuruldu)
- Ahrefs / Semrush (ucretli, opsiyonel)

---

## 6. SOSYAL MEDYA + SEO BAGI

- Her blog yayini > 3 sosyal medya postu
  (SOSYAL_MEDYA_REHBERI.md Sablon 1 + 5 + 7)
- LinkedIn paylasim > backlink degeri
- TikTok video aciklamasinda blog linki > trafik

---

## 7. TEKNIK SEO KONTROL LISTESI

Mevcut durum (FAZ 1 + FAZ 2 + FAZ 3 sonrasi):

| # | Unsur | Durum |
|---|---|---|
| 1 | sitemap.xml | TAMAM (Next.js otomatik, FAZ 2 + FAZ 3 guncellendi) |
| 2 | robots.txt | TAMAM (FAZ 1) |
| 3 | OG meta (anasayfa) | TAMAM (mevcut) |
| 4 | OG meta (nis landing) | TAMAM (FAZ 2) |
| 5 | OG meta (blog) | TAMAM (FAZ 3, generateMetadata) |
| 6 | Canonical URL | Next.js App Router otomatik |
| 7 | Hiz (Core Web Vitals) | Test edilmeli — PageSpeed Insights |
| 8 | Mobil uyumluluk | Tailwind responsive, test et |
| 9 | HTTPS | Vercel otomatik |
| 10 | GSC kayit | YAPILACAK — Mehmet Bey manuel |

---

— Tedbirge Mimari (Claude Opus 4.7), 27 Nisan 2026
— Anayasa v1.5.0 Madde 25.10 ekli operasyon rehberi
