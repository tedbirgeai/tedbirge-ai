# TEDBİRGE.AI YOL HARİTASI v1.0
**Son güncelleme:** 27 Nisan 2026 (öğleden sonra)
**Anayasa versiyonu:** v1.4.0 (Madde 24 sonrası)
**İlke:** MoSCoW + Now-Next-Later hibrit (Madde 24.5)

---

## 🎯 AKTİF KESİT

**Faz:** FAZ 4-B Operasyonel Ölçek
**Son TUR:** #40 — Blog görünürlük + içerik
**Anayasa:** v1.10.0
**Son güncelleme:** 29 Nisan 2026

### Kesit içi turlar (özet)

| TUR | Konu | Durum |
|-----|------|-------|
| #37 | GA4 entegrasyonu | Lokal ✅, production tarayıcı kanıtı bekliyor (O1) |
| #38 | PWA iOS | Lokal ✅, iPhone Safari kanıtı bekliyor (O2) |
| #39 | (kayıt için OTONOM_RAPOR'a bak) | — |
| #40 | Blog görünürlük + içerik (K1+K2+K3) | ✅ Lokal + production kapalı (8/8 kanıt) |

### Aktif önceliklendirme (sıradaki tur adayları)

1. **O1+O2 kapanışı** (Mehmet Bey manuel kontrol — 10 dk)
2. **NOW kesitinde sıradaki iş** (aşağıdaki MUST+NOW listesi)
3. **M2 — middleware → proxy migration** (NEXT)
4. **M3 — Footer birleştirme** (LATER)

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

- **2026-04-29** — TUR #40 sonrası senkronizasyon: aktif kesit FAZ 4-B v1.10.0'a güncellendi (önceden TUR #24 v1.4.0). M2, M3 yan bulguları eklendi.
- v1.0 — 27 Nisan 2026 (sabah) — başlangıç sürümü (Madde 24 ile birlikte)

---

— Tedbirge Yol Haritası
— Madde 24 (İş Planı Disiplini) yürürlükte
— Son söz: Mehmet Dinç (Madde 17.5 + 24.9)
