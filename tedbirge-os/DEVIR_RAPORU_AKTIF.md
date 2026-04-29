# 🛡️ DEVIR RAPORU (AKTİF) — TEDBİRGE.AI

**Son güncelleme:** 29 Nisan 2026 (sabah)
**Anayasa:** v1.10.0
**Aktif kesit:** FAZ 4-B Operasyonel Ölçek
**Son TUR:** #40 — Blog görünürlük + içerik (3 bulgu, 9 atom kapatıldı)

---

## 🔴 AÇIK KRİTİK

YOK. TUR #40 sonrası kritik açık iş bulunmuyor.

---

## 🟡 PLANLI / BEKLEYEN

### O1 — TUR #37 GA4 production tarayıcı kanıtı

**Durum:** GA4 entegrasyonu lokal kanıtlı, production deploy yapıldı, **manuel tarayıcı kanıtı bekleniyor.**
**Mehmet Bey'in işi:** Production'da 4 sayfada (anasayfa, hesapla, blog detay, başvuru) DevTools Network panelinde `gtag/js` ve `collect` istekleri 200 dönüyor mu?
**Süre:** 5 dk

### O2 — TUR #38 PWA iOS production kanıtı

**Durum:** PWA manifest + service worker entegrasyonu lokal kanıtlı, production deploy yapıldı, **iPhone Safari kanıtı bekleniyor.**
**Mehmet Bey'in işi:** Gerçek iPhone Safari'de "Ana Ekrana Ekle" → ikon + isim doğru mu, açılış ekranı görünüyor mu?
**Süre:** 5 dk

### O3 — KAPANDI

K1 (TUR #40 FAZ 1 trafik makalesi production'da görünüyor mu?) bu turda kapandı — Image 7 kanıt.

---

## 📋 MEHMET BEY MANUEL İŞLER

1. **O1** — GA4 production tarayıcı kanıtı (5 dk)
2. **O2** — PWA iOS production kanıtı (5 dk)
3. (TUR #40 production kontrolü tamamlandı, ek manuel iş yok)

---

## 🟢 YAN BULGULAR (TUR #40'ta açıldı)

### M1 — Vercel edge curl 403 vs browser 404

**Detay:** TUR #40 K1 araştırması sırasında `/blog` curl ile 403, browser ile 404 dönüyordu. K1 düzeldikten sonra ikisi de 200 oldu.
**Aksiyon:** Şu an etkisiz, takip gerekmez. Cookie/CDN edge davranışı, eğer ileride benzer çelişki çıkarsa hatırlanmalı.

### M2 — middleware.ts → proxy.ts migration (Next 16 deprecation)

**Detay:** `middleware.ts` Next.js 16'da deprecated. Build sırasında uyarı üretiyor. Fonksiyonel etki yok, ileri sürümlerde kaldırılacak.
**Aksiyon:** Ayrı bir mimar kararı turu — `proxy.ts`'e migration.
**Öncelik:** SHOULD + NEXT (3-6 ay)

### M3 — İki Footer pattern'i (anasayfa inline + global)

**Detay:** Anasayfada inline lacivert tam Footer (4 sütun, marka/sosyal) + tüm sayfalarda root layout'tan gelen global beyaz minimal Footer (yasal linkler şeridi). İki ayrı kod tabanı.
**Aksiyon:** Mimari karar gerekli — birleştirme mi, rol ayrımı mı? K2'de Blog linki ikisine de ayrı ayrı eklendi (homojen değil).
**Öncelik:** SHOULD + LATER (6+ ay) — şu an fonksiyonel sorun yok.

---

## 🎯 SIRADAKİ ÖNERİLEN İŞ

**Mehmet Bey karar:**

**Seçenek A — Bekleyenleri kapat (önce hijyen):**
- O1 (GA4) ve O2 (PWA iOS) kanıtlarını topla → bu iki bulgu da kapanır → AÇIK KRİTİK 0, PLANLI 0 olur

**Seçenek B — FAZ 4-B yeni tur (operasyonel ölçek):**
- TUR #40 ile blog altyapısı tamam. Sıradaki adım IS_PLANI'da NOW kesitinde olan iş — örn. başvuru formu tamamlama, dava takibi paneli, SEO meta optimizasyonu

**Seçenek C — Mimari turlardan biri (M2 veya M3):**
- M2 (`middleware.ts` → `proxy.ts`): teknik borç temizliği, küçük tur
- M3 (Footer birleştirme): tasarım kararı, tek tur

Mimar (sohbet) önerisi: **Seçenek A** — bekleyenleri kapatıp sıfır açık bulgu ile yeni faza geç. O1 ve O2 ufak işler, devir disiplini gereği biriktirilmemeli.

---

## 📊 TUR #40 ÖZETİ (referans)

- **Süre:** ~6 saat, 3 oturum
- **Atom:** 9 (1+5+1+2)
- **Commit:** 9 (`5523603 → 1932b75`)
- **Push:** 3
- **Etkilenen dosya:** 6 (panel)
- **Mimar hata sayısı:** 2 (Madde 4 ihlali, ikisi de yapı tarafından yakalandı)
- **KIRMIZI çizgi ihlali:** 0
- **Production görsel kanıt:** 8/8

Detay: OTONOM_RAPOR.md → TUR #40 bloğu.
