# TEDBİRGE.AI YOL HARİTASI v1.0
**Son güncelleme:** 27 Nisan 2026 (öğleden sonra)
**Anayasa versiyonu:** v1.4.0 (Madde 24 sonrası)
**İlke:** MoSCoW + Now-Next-Later hibrit (Madde 24.5)

---

## 🎯 AKTİF KESİT

**Faz:** FAZ 4-B Operasyonel Ölçek
**Son TUR:** #45.2 — Y5 + Y1 Hex Refactor (KAPALI — DEVIR temiz, açık 🔴 0 / 🟡 0)
**Anayasa:** v1.11.0
**Son güncelleme:** 30 Nisan 2026 (TUR #45.2 sonu)

### Kesit içi turlar (özet)

| TUR | Konu | Durum |
|-----|------|-------|
| #37 | GA4 entegrasyonu | Lokal ✅, production tarayıcı kanıtı bekliyor (O1) |
| #38 | PWA iOS | Lokal ✅, iPhone Safari kanıtı bekliyor (O2) |
| #39 | (kayıt için OTONOM_RAPOR'a bak) | — |
| #40 | Blog görünürlük + içerik (K1+K2+K3) | ✅ Lokal + production kapalı (8/8 kanıt) |
| #41 | PWA icon altyapısı (K4) + GA4/PWA bekleyenleri (O1+O2) | ✅ Lokal + production kapalı |
| #42 | Kurumsal kimlik birleştirme (K5+K6+K7+K8) | ✅ Lokal + production kapalı |
| #43 | SEO Meta Disiplini (Tur A keşif + B-1 altyapı + B-2 anlam) | ✅ 10 atom, 4 schema tipi (Org/WebSite/LegalService/Article) |
| #44 | Hareket Disiplini (Tur A + 44.1 + 44.2+44.3 birleşik + C9) | ✅ 25 atom, anasayfa cinematic 2.2sn, 9 sayfa Reveal, anayasa Madde 29 eklendi |
| #45 | Yan Bulgu Temizliği (Y4 + M2) | ✅ Kapalı (Y1 ertelendi #45.2'ye, Y5 yeni bulgu eklendi) |
| #45.2 | Y5 + Y1 Hex Refactor (Tailwind 4 @theme + ~430 referans) | ✅ Kapalı |

### TUR #44 — Hareket Disiplini ✅ BÜYÜK KAPANIŞ

**Tarih:** 1 Mayıs 2026 (tek gün, ~10 saat)
**Atom:** ~25 (Tur A keşif + 7 altyapı + 9 yaygınlaştırma + 8 cinematic + 1 son rötuş C9)
**Commit:** 13 panel (`7081d29` → `9555bb8`) + 5 OS (`edc40fe` → `9bebbf5`)
**Anayasa:** v1.10.0 → v1.11.0 (Madde 29 Hareket Disiplini eklendi, KAPANIŞ Madde 30'a kaydı)

**Sonuç:**
- Türkiye legal tech sınıfında zirve teyitli
- Dünya legal tech çıtasının %50-60'ında (linear.app/framer.com erişilebilir)
- Anasayfa hero 2.2sn cinematic akış (badge → kelime stagger → highlight sweep → alt yazı → CTA pulse)
- 9 sayfada Reveal motion disiplini, hover scale v2 (1.08) + glow + magnetic
- 0 ek paket (Senaryo 1 başarılı), 0 schema/migration/env

Detay: `docs/OTONOM_RAPOR.md` → TUR #44 büyük blok.

### Aktif önceliklendirme (sıradaki tur adayları)

1. **MOLA önerilen** — TUR #40-#44 ~30 saatte 70+ atom, sürdürülebilir değil
2. **TUR #45 İçerik Stratejisi** (önerilen sonraki) — SEO + blog yol haritası
3. **TUR #45 Yan bulgu temizliği** alternatifi — Y1 hex hardcoding + M2 middleware Next 16 + Y4 OS arşivleme

---

## 📋 NOW (1-3 ay) — Aktif veya çok yakında

### MUST + NOW (en yüksek öncelik)

**1. Bulgu Kapatma Fazı (mevcut)**
- **Kesit içeriği:** TUR #19 → TUR #24
- **Paydaş:** ADMIN (sistem sağlığı)
- **Süre:** 1-2 hafta
- **Kalan:** TUR #22, #23, #24

**2. ENV Bütünlük Mini Tur (yeni)**
- **Niye:** PayTR ENV eksik (sağlık taraması ortaya çıkardı) — ama Mehmet Bey direktifi: PayTR gerekli değil
- **Karar:** Bu nokta **iptal** edilebilir (PayTR kullanılmayacaksa)
- **Aksi takdirde:** Backend URL + diğer env tutarlılık (30 dk)

### SHOULD + NOW
- (boş — şu an aktif kesit dışında SHOULD+NOW yok)

---

## 📅 NEXT (3-6 ay) — Sıradaki dalga

### MUST + NEXT

**3. AI Analiz Doğruluk Kesiti (Stratejik B)**
- **Paydaş:** LAWYER (öncelikli — yanlış öneri = dava kaybı), CUSTOMER
- **Risk:** Hukuki — `muhatapAI.service.js` güven skoru kullanımı + compensation engine doğruluğu
- **Süre:** 1-2 hafta
- **Bağımlılık:** TUR #23 (KVKK) sonrası (yurt dışı aktarım netleşmeli)
- **Kapsam Notu (TUR #29 eklendi — 28 Nisan 2026):** AccidentCase (AI Kaza Rekonstrüksiyon) bu kesitte aktif edilecek
  - Schema: hazır (`// @deferred` işareti — Madde 33)
  - Panel UI: hazır (YAKINDA badge ile — TUR #29-B)
  - Backend: YOK — CREATE TABLE + service + route bu kesitte yazılacak

**4. Sözleşme Yönetimi Kesiti (Stratejik B)**
- **Paydaş:** LAWYER, CUSTOMER
- **Risk:** Hukuki — sözleşme sonrası avukat bildirimi (TUR #11 G18-M5'te eksik tespit), imzalı PDF Document tablosuna kaydetme
- **Süre:** 1-2 hafta
- **Bağımlılık:** AI Analiz Doğruluk sonrası

### SHOULD + NEXT

**5. Avukat İş Akışı Derinleştirme**
- **Paydaş:** LAWYER (3 aktif kullanıcı + büyüme)
- **Risk:** Operasyonel
- **Süre:** 1-2 hafta
- **Kapsam:** Mobil deneyim, bildirim merkezi, performans raporları

**6. Müvekkil Portal Derinleştirme**
- **Paydaş:** CUSTOMER
- **Risk:** UX
- **Süre:** 1 hafta

### SHOULD + NEXT — Yeni eklemeler (TUR #40 yan bulguları)

- **M2** — `middleware.ts` → `proxy.ts` migration (Next.js 16 deprecation)
  - Tip: Teknik borç
  - Süre: ~1 saat (1 dosya rename + import güncelleme + build kanıtı)
  - Risk: Düşük (Next.js dokümantasyonu net)
  - Tetikleyici: Bir sonraki major Next.js sürümü

---

## 🌅 LATER (6+ ay) — Uzun vade

### MUST + LATER

**7. UYAP Entegrasyon Kesiti**
- **Paydaş:** LAWYER
- **Risk:** Avukatlık K. m.46 — uzun vadeli zorunluluk
- **Süre:** 2-4 hafta
- **Bağımlılık:** E-imza adapter + UYAP API anlaşması

**8. SBM Entegrasyon Kesiti**
- **Paydaş:** LAWYER, CUSTOMER
- **Risk:** Hukuki — sigorta poliçe sorgusu için zorunlu
- **Süre:** 1-2 hafta
- **Bağımlılık:** SBM API sözleşmesi

**9. CommissionLog + Mali Modülü**
- **Paydaş:** ADMIN, REPRESENTATIVE
- **Risk:** Mali kayıt eksikliği (vergi denetiminde sorun)
- **Süre:** 1 hafta
- **Kapsam:** Hak ediş kayıt sistemi, temsilci ödeme takibi, e-arşiv hazırlığı (eğer GİB limiti aşılırsa)

### SHOULD + LATER

- Otonom katman olgunlaştırma (Auditor/Healer/Reporter)
- KVKK Aşaması 2 (anonimleştirme, bulk export)
- Performans raporlaması (avukat dashboard)
- Mobil uygulama (PWA üzerinden)

### COULD + LATER (TASK_QUEUE.md)
- Audit log dashboard
- WhatsApp Business onayı (Meta production geçişi)
- Bilirkişi raporu yönetimi
- Baro doğrulama otomasyonu
- **M5** — Manifest icon kaynağı: logo.png (640×640, opak) → manifest icons (şu an icon-192.png/icon-512.png)
  - Tip: Kalite iyileştirmesi
  - Süre: ~30 dk (manifest path değişimi + lokal kanıt + push)
  - Risk: Düşük
  - Tetikleyici: PWA install splash veya Android adaptive icon şikayeti
- **M7** — /lexscan hero blue gradient kurumsal palette identical değil (TUR #42'de açıldı)
  - Sayfa: app/(public)/lexscan/page.tsx
  - Mevcut: bg-gradient-to-b from-blue-900 to-blue-700 (Tailwind native)
  - Olması gereken: kurumsal #1E1E8E veya benzer
  - Süre: ~10 dk
  - Risk: Düşük

---

## 🏛️ WON'T (bu çeyrek yok)

- Multi-language UI (Türkiye odaklı)
- VPS taşıma (3-6 ay sonra konuşulacak — MIMARI_KARARLAR 26 Nisan)
- PayTR Marketplace (IBAN üzerinden manuel — Mehmet Bey direktifi)
- Dış API satışı (henüz iç ürün)
- E-fatura entegrasyonu (Mehmet Bey'in vergi danışmanı kararına bağlı)

---

## 📊 PAYDAŞ BAZLI ETKİ TABLOSU

| Kesit | ADMIN | LAWYER | REPRESENTATIVE | CUSTOMER |
|---|---|---|---|---|
| Bulgu Kapatma | 🔴 | 🟡 | 🟡 | 🟡 |
| AI Analiz Doğruluk | 🟢 | 🔴 | 🟢 | 🔴 |
| Sözleşme Yönetimi | 🟡 | 🔴 | 🟢 | 🔴 |
| Avukat Akışı | 🟢 | 🔴 | 🟢 | 🟡 |
| Müvekkil Portal | 🟢 | 🟡 | 🟢 | 🔴 |
| UYAP Entegrasyon | 🟢 | 🔴 | 🟢 | 🟢 |
| SBM Entegrasyon | 🟢 | 🔴 | 🟢 | 🟡 |
| CommissionLog | 🔴 | 🟡 | 🔴 | 🟢 |

🔴 = doğrudan etkilenir, 🟡 = orta etkilenir, 🟢 = düşük/yok

---

## 🌐 DIŞ MUHATAP ETKİ TABLOSU (Madde 24.10 KVKK Disiplini)

| Sağlayıcı | Yurt | KVKK m.9 | SCC Durumu | İlgili Kesit |
|---|---|---|---|---|
| Supabase | ABD | EVET | Eksik (in-memory) | TUR #23 |
| Anthropic | ABD | EVET | Eksik (in-memory) | TUR #23 + AI Analiz |
| Meta WhatsApp | ABD/EU | EVET | Eksik (in-memory) | TUR #23 |
| Gmail | ABD | EVET | Eksik (in-memory) | TUR #23 |
| NetGSM | TR | HAYIR | Gerekmez | — |
| Render | ABD | Veri yok* | — | — |
| Vercel | ABD | Veri yok* | — | — |
| Türk Patent | TR | HAYIR | Gerekmez | — |

*Veri yok = sadece compute (DB onlarda değil)

---

## ⏱️ KAPASİTE NOTU

- **Mehmet Bey:** Tedbirge sahibi (girişimci, ürün sahibi)
- **Haftalık ortalama:** Değişken (saha programı yoğunluğuna bağlı)
- **Tipik tur süresi:** 1-3 saat
- **Tipik kesit süresi:** 5-15 saat (5-10 tur)
- **Sürdürülebilir hız:** Haftada 1-2 kesit veya 5-10 tur

---

## 🔗 BAĞIMLILIKLAR

```
Bulgu Kapatma Fazı (mevcut)
    ↓ (TUR #23 KVKK uyumu önce kapanmalı)
AI Analiz Doğruluk Kesiti
    ↓
Sözleşme Yönetimi Kesiti
    ↓
Avukat İş Akışı Derinleştirme + Müvekkil Portal
    ↓ (paralel olabilir)
UYAP + SBM Entegrasyonları
    ↓
CommissionLog + Mali Modülü (LATER)
```

### SHOULD + LATER — Yeni eklemeler (TUR #40 yan bulguları)

- **M3** — İki Footer pattern'i birleştirme (anasayfa inline + global root)
  - Tip: Mimari karar
  - Süre: 1 mimar tartışma turu + 1 uygulama turu
  - Risk: Orta (UX değişikliği, Mehmet Bey karar verir)
  - Bağımlılık: Yok, bağımsız ele alınabilir

---

## 🔄 GÜNCELLEME TARİHÇESİ

- **2026-04-30 (TUR #45.2)** — Y5 (Tailwind 4 @theme bloğu) + Y1 (~430 hex referans dönüşümü: 240 Tailwind arbitrary + 181 inline + 6 globals.css) kapatıldı. Açık 🔴 KRİTİK 0, açık 🟡 PLANLI 0.
- **2026-04-30** — TUR #45 sonrası: Y4 (OS arşivleme) + M2 (middleware → proxy.ts) kapatıldı. Y1 erteleme TUR #45.2'ye, Y5 yeni eklendi (Tailwind 4 @theme directive eksik — Y1'in ön şartı).
- **2026-05-01 (gece geç)** — TUR #44 BÜYÜK KAPANIŞ sonrası: aktif kesit son TUR #42 → #44, anayasa v1.10.0 → v1.11.0 (Madde 29 Hareket Disiplini), TUR #43 + #44 satırları ve TUR #44 detay bloğu eklendi, Y1/Y2/Y3/Y4 yan bulgular DEVIR'e geçti.
- **2026-04-30 (gece yarısı)** — TUR #42 sonrası: aktif kesit son TUR #41 → #42, M7 (/lexscan blue gradient) COULD+LATER'a eklendi.
- **2026-04-29 (öğleden sonra)** — TUR #41 sonrası: aktif kesit son TUR #40 → #41, M5 (manifest logo.png) COULD+LATER'a eklendi.
- **2026-04-29** — TUR #40 sonrası senkronizasyon: aktif kesit FAZ 4-B v1.10.0'a güncellendi (önceden TUR #24 v1.4.0). M2, M3 yan bulguları eklendi.
- v1.0 — 27 Nisan 2026 (sabah) — başlangıç sürümü (Madde 24 ile birlikte)

---

— Tedbirge Yol Haritası
— Madde 24 (İş Planı Disiplini) yürürlükte
— Son söz: Mehmet Dinç (Madde 17.5 + 24.9)
