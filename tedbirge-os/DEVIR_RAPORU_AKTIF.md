# 🛡️ DEVIR_RAPORU_AKTIF — Tedbirge.ai

> **Bu dosya CANLIDIR. Her TUR sonunda mimar tarafından üstüne yazılır.**
> **Yeni mimar oturumu Madde 26.4 protokolü gereği bu dosyayı OKUR.**

---

## DURUM — 28 Nisan 2026 (gec gece, TUR #38 kod tamamlandi)

**Anayasa:** v1.9.1 yürürlükte (34 madde + Kapanış)
**Aktif kesit:** FAZ 4-B Operasyonel Ölçek (TUR #38 tamamlandı — doğrulama bekleniyor)
**Son TUR:** #38 — PWA iOS install rehberi
- A1: IosInstallGuide.tsx oluşturuldu — commit 2a4dde3
- A2: PwaProvider'a entegre edildi — commit c1773a1
- Push: cccd060..c1773a1 → Vercel deploy tetiklendi

---

## 🔴 AÇIK KRİTİK BULGULAR

**Yok.**

---

## 🟡 PLANLI BULGULAR

### O1 — TUR #37 GA4 production kanıtı bekleniyor
- **Durum:** Kod değişikliği yapıldı (TUR #37), Vercel deploy edildi
- **Kalan:** Mehmet Bey tarayıcıda 4 doğrulama yapacak (bitiş tanımı Madde 27.1)
- **Doğrulama listesi:**
  1. https://www.tedbirge.ai/ → Cookie kabul → DevTools Network → `gtag/js?id=G-7MP4HD08T6` **VAR** mı?
  2. https://www.tedbirge.ai/basvuru → `gtag` **VAR** mı?
  3. https://www.tedbirge.ai/dashboard → `gtag` **YOK** mu?
  4. https://www.tedbirge.ai/musteri → `gtag` **YOK** mu?
- 4 evet → O1 KAPANDI

### O2 — TUR #38 PWA iOS production kanıtı bekleniyor
- **Durum:** IosInstallGuide.tsx push edildi, Vercel deploy tetiklendi
- **Kalan:** Madde 27.1 ölçüt 11-13
  - Ölçüt 11: Vercel dashboard → "Ready" durumu
  - Ölçüt 12: Chrome DevTools → iPhone simülasyon → 3s sonra banner görünüyor mu?
  - Ölçüt 13: **Gerçek iPhone Safari** → https://www.tedbirge.ai/ → banner + modal çalışıyor mu?
- 3 evet → O2 KAPANDI, TUR #38 resmi kapanışı

---

## 📋 MEHMET BEY'İN BEKLEYEN MANUEL İŞLERİ

1. **TUR #37 GA4 kanıtı** (5 dk) — O1'i kapat
   - Yeni Incognito (Ctrl+Shift+N) → F12 → Network → filter: `gtag`
   - tedbirge.ai/, /basvuru, /dashboard, /musteri kontrol

2. **TUR #38 PWA iOS kanıtı** (5 dk) — O2'yi kapat
   - Vercel dashboard deploy "Ready" kontrolü
   - Chrome DevTools → Device: iPhone 14 Pro → https://www.tedbirge.ai/ yenile → 3s bekle → banner görünmeli
   - Kendi iPhone'unda Safari → https://www.tedbirge.ai/ → 3s bekle → banner görünmeli

3. **Blog 3 HTML içeriği** — Sıradaki FAZ 4-B kesiti
   - lib/blog.ts'deki 3 placeholder → mevzuat referanslı içerik
   - Mehmet Bey + uzman avukat onayı ile

---

## 📝 SON 5 COMMIT (panel repo)

```
c1773a1 feat(pwa): IosInstallGuide PwaProvider'a baglandi
2a4dde3 feat(pwa): IosInstallGuide component eklendi (iOS Safari install rehberi)
cccd060 feat(public): GA4 sadece public route'a baglandi (Madde 25.7 KVKK izolasyonu)
0a1e18f refactor(layout): GA4 ROOT layout'tan kaldirildi (Madde 25.7 panel izolasyonu)
93a17c4 feat(belge): TUR #35-4/5/6 - soft delete + retry + bulk delete UI
```

---

## 🎯 SIRADAKİ ÖNERİLEN İŞ

**Önce:** Mehmet Bey O2 + O1 doğrulaması (toplam 10 dk)

**Sonra: Blog 3 makale içerik üretimi (FAZ 4-B devamı)**
- 3 taslak: trafik kazası, iş kazası, sigorta tazminat reddedildi
- `lib/blog.ts`'deki placeholder'ları mevzuat referanslı HTML ile doldurmak
- Mimar taslak yazar, Mehmet Bey + uzman avukat redakte eder (Madde 25.13 #3)
- "TUR #39 aç" diyince mimar içerik mektubu yazar

---

## 🔐 GEÇERLİ KIRMIZI NOKTA YAZILI ONAYLARI

- 28 Nisan 2026 sabah — TUR #28-B 7 ALTER TABLE (kapandı)
- 28 Nisan 2026 akşam — TUR #35 Document.deletedAt migration (kapandı)

---

**Mimar:** Claude Sonnet 4.6 (TUR #38 A3)
**Son güncelleme:** 28 Nisan 2026 gec gece
**Bir sonraki güncelleme:** O2 kanıtları bildirince (TUR #38 resmi kapanışı)

🛡️ Anayasa v1.9.1 — iOS PWA install rehberi hazır, Mehmet Bey gerçek iPhone testi bekliyor.
