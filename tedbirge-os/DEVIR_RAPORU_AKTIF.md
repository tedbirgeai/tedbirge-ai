# 🛡️ DEVIR RAPORU (AKTİF) — TEDBİRGE.AI

**Son güncelleme:** 1 Mayıs 2026 (TUR #43 Tur B-1 sonrası)
**Anayasa:** v1.10.0
**Aktif kesit:** FAZ 4-B Operasyonel Ölçek
**Son TUR:** #43 Tur B-1 — SEO Meta Altyapı (B1+B2+B3+B4+B5 kapatıldı)

---

## 🔴 AÇIK KRİTİK

**TUR #43 Tur B-2** — JSON-LD + anasayfa server/client bölmesi
- JSON-LD (Organization + WebSite + LegalService + Article + BreadcrumbList) — Tur A'da SIFIR JSON-LD tespit edildi, Google rich snippet imkanı tamamen kapalı
- Anasayfa `app/(public)/page.tsx` `"use client"` directive'i nedeniyle kendi server-side metadata export edemiyor — server/client bölmesi (server wrapper + client component) gerek
- Mimar mektubu B-1 production doğrulamasından sonra yazılacak
- Beklenen atom: 4-5 (1 anasayfa refactor + 3-4 JSON-LD enjeksiyon)

---

## 🟡 PLANLI / BEKLEYEN

YOK (Tur B-2 yukarıda kritik olarak listelendi).

---

## 📋 MEHMET BEY MANUEL İŞLER

YOK.

---

## 🟢 YAN BULGULAR (gelecek tur adayları)

### M2 — middleware.ts → proxy.ts migration (Next 16 deprecation)

**Detay:** middleware.ts Next.js 16'da deprecated, build uyarısı.
**Öncelik:** SHOULD + NEXT (3-6 ay)
**Süre:** ~1 saat
**Risk:** Düşük

### M3 — İki Footer pattern'i birleştirme (KÜÇÜK PARÇA TUR #42'DE KAPATILDI)

**Detay:** Anasayfada inline lacivert tam Footer + tüm sayfalarda global beyaz minimal Footer. İki ayrı kod tabanı.
**TUR #42 ile kapatılan:** Footer.tsx hover rengi #534AB7 → #1E1E8E (5 satır).
**Hâlâ açık:** İki Footer'ın birleştirilmesi (mimari karar).
**Öncelik:** SHOULD + LATER (6+ ay)

### M5 — Manifest icon kaynağı logo.png olabilir mi (TUR #41'de açıldı, hâlâ açık)

**Detay:** app/manifest.ts icons array /icons/icon-192.png ve /icons/icon-512.png kullanıyor. public/logo.png (640×640, opak, kurumsal kaynak) manifest'te kullanılmıyor.
**Öncelik:** COULD + LATER (kozmetik)
**Tetikleyici:** PWA install splash veya Android adaptive icon şikayeti

### M7 — /lexscan hero blue gradient kurumsal palette identical değil (TUR #42'de açıldı)

**Detay:** /lexscan sayfası bg-gradient-to-b from-blue-900 to-blue-700 (Tailwind native) kullanıyor. Kurumsal #1E1E8E değil.
**Öncelik:** COULD + LATER (kozmetik, kurumsal palete yakın ama identical değil)
**Süre:** ~10 dk

---

## 🎯 SIRADAKİ ÖNERİLEN İŞ

**TUR #43 Tur B-1 KAPALI**, Tur B-2 açık. Mehmet Bey kararı:

**Seçenek A — TUR #43 Tur B-2 (devam):**
- JSON-LD enjeksiyonu (Organization + WebSite + LegalService + Article + BreadcrumbList)
- Anasayfa server/client bölmesi (server wrapper + client component)
- Mimar mektubu yazılacak (B-1 production doğrulaması ✅ tamam)
- Süre tahmini: ~1.5-2 saat (4-5 atom)
- **Önerilen:** SEO çalışmasının zincirini koparmadan kapatmak

**Seçenek B — Mola:**
- TUR #40 + #41 + #42 + #43 B-1 = ~18 saatte 33 atom uygulandı
- Bir sonraki Claude oturumu temiz başlangıç (Madde 26.4 protokol)
- Tur B-2 mektubu yarın/öbürgün yazılır

**Seçenek C — TUR #44 Animasyon (B-2 sonrası):**
- Önceki devir notunda da belirtildi: SEO meta düzeldikten sonra animasyon zenginliği görünür
- Tur B-2 kapanmadan açılması anayasa Madde 17.4 ihlali (yarım kesit)

Mimar önerisi: **Seçenek A — Tur B-2 ile zinciri kapat**, sonra mola. Tur B-1 momentum'u taze, kapsam dar (4-5 atom).

---

## 📊 TUR #43 Tur B-1 ÖZETİ (referans)

- **Süre:** ~1 saat 30 dk, 1 oturum
- **Atom:** 5 panel (B1+B2+B3+B4+B5 — B5 mimar onayı sonrası ek atom)
- **Commit:** 5 panel (`9f3c699 → aa068ce`)
- **Push:** 1 (toplu)
- **Mimar hata:** 1 (mektupta middleware öngörülmedi, lokal smoke test yakaladı, B5 ile kapatıldı)
- **Production kanıt:** 5/5 (anasayfa OG/twitter ✓, opengraph-image 200 PNG 1200×630 ✓, sitemap 19 URL ✓, robots /musteri/ ✓)

Detay: OTONOM_RAPOR.md → TUR #43 bloğu. Tur A keşif: docs/TUR43_TUR_A_SEO_KESIF.md.

---

## 📊 TUR #42 ÖZETİ (önceki tur referansı)

- **Süre:** ~9 saat, 1 oturum (kapsam keşfedildikçe genişledi)
- **Atom:** 12 (9 panel + 3 os)
- **Commit:** 9 panel (`c6d06ee → d0c3cc3`) + 3 os
- **Push:** 4 (panel), 1 (os)
- **Mimar hata:** 7 (hepsi yapı tarafından yakalandı, KIRMIZI ihlal yok)
- **Production görsel kanıt:** 9/9

Detay: OTONOM_RAPOR.md → TUR #42 bloğu.

---

## 📊 TUR #41 ÖZETİ (önceki tur referansı)

- **Süre:** ~2 saat, 1 oturum
- **Atom:** 7 (4 panel + 3 os)
- **Mimar hata:** 0
- **KIRMIZI çizgi ihlali:** 0

Detay: OTONOM_RAPOR.md → TUR #41 bloğu.
