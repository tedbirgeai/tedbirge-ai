# MADDE_25_KONTROL — Pazarlama Kontrol Listesi

> Bu dosya Madde 25 (Pazarlama + Web Yüzü + Marka Disiplini) için hızlı başvuru listesidir.
> Tam metin: CLAUDE_MADDE_25_DETAY.md
> Anayasa: v1.10.0 (28 Nisan 2026)

---

## 1. PAZARLAMAKARARIFİLTRESİ — 7 Soru (Madde 25.13)

Her yeni pazarlama hamlesi (yeni kanal, kampanya, mesaj çerçevesi) için:

| # | Soru | Referans |
|---|---|---|
| 1 | Tüketici hukukuna uygun mu? (6502 + Reklam Kurulu) | m.25.1 |
| 2 | Tedbirge'nin LegalTech sıfatına yakışır mı? | m.25.1-25.2 |
| 3 | Avukat ortakları TBB ihlaline sokuyor mu? | m.25.3 KIRMIZI |
| 4 | KVKK + cookie consent + IYS uyumlu mu? | m.25.7 |
| 5 | Kod altyapı destekliyor mu? | m.25.11 tablo |
| 6 | Hangi FAZ kapsamında? (FAZ 1 → 2 → 3 → 4 sirasi) | m.25.12 |
| 7 | Olcum plani ne? (KPI hedefi tanimli mi) | m.25.10 |

**7 evet → uygulanir. Bir hayir → DUR.**

---

## 2. FAZ UYUM TABLOSU (Madde 25.12)

| FAZ | Ad | Durum | Kapsam Ozeti |
|---|---|---|---|
| **FAZ 1** | Yasal + Olcum Temeli | **TAMAMLANDI** (TUR #25) | Cookie consent, GA4, Meta Pixel, UTM, IYS, robots.txt, KVKK sayfalari |
| **FAZ 2** | Donusum + Marka Yuzu | **TAMAMLANDI** (TUR #26) | Landing pages, LexScan koprosu, anasayfa animasyonu, a11y |
| **FAZ 3** | Trafik + Olcum + Icerik | **AKTIF** (TUR #27+) | /dashboard/pazarlama, blog modulu, Google/Meta Ads, KPI otomasyon |
| **FAZ 4** | Operasyonel Olcek + Opt. | **SONRAKI** (TUR #29+) | A: Reklam altyapisi, B: Icerik, C: Otomasyon, D: A/B test |

---

## 3. KOD ALTYAPI TABLOSU — Canli Kontrol (Madde 25.11)

| # | Bilesen | Konum | Durum |
|---|---|---|---|
| 1 | Cookie consent banner | tedbirge-panel/components/ | **TAMAM** (TUR #25) |
| 2 | Aydinlatma metni (yurt disi aktarim dahil) | /kvkk-aydinlatma | **TAMAM** (TUR #25) |
| 3 | GA4 entegrasyonu | layout.tsx + env | **TAMAM** (TUR #25, #37) |
| 4 | Meta Pixel | layout.tsx + env | **YOK** (Mehmet Bey direktifi: Meta Pixel yok) |
| 5 | UTM frontend yakalama | basvuru/page.tsx | **TAMAM** (TUR #25) |
| 6 | IYS opt-out altyapisi | sms + email service | **TAMAM** (TUR #25) |
| 7 | robots.txt + sitemap.xml | public/ + app/ | **TAMAM** (TUR #25) |
| 8 | qualificationScore AI hesaplama | analyzer.service.js | **TAMAM** (TUR #26) |
| 9 | LexScan → /basvuru prefill koprasu | lexscan + basvuru | **TAMAM** (TUR #26) |
| 10 | Nis landing pages | app/(public)/* | **TAMAM** (TUR #26) |
| 11 | Pazarlama dashboard | /dashboard/pazarlama | **AKTIF KESIT** (TUR #27) |
| 12 | Conversion funnel hesabi | /api/analytics | **AKTIF KESIT** (TUR #27) |
| 13 | Hero animasyonu (Lottie/video/gradient) | anasayfa | **TAMAM** (TUR #26) |
| 14 | Musteri yolculugu zaman tuneli | anasayfa | **TAMAM** (TUR #26) |
| 15 | Blog modulu + 10 makale | /blog rotasi | **AKTIF KESIT** (TUR #27+) |
| 16 | Google Ads conversion API | /api/conversion + env | SONRAKI (TUR #29, FAZ 4-A) |
| 17 | UTM sablon kutuphanesi | docs/UTM_SABLON.md | SONRAKI (TUR #29, FAZ 4-A) |
| 18 | A/B test altyapisi | basvuru/page.tsx variants | SONRAKI (TUR #29+, FAZ 4-D) |
| 19 | Lead takip SLA otomasyon | jobs/leadFollowUp.job.js | SONRAKI (TUR #28+, FAZ 4-C) |
| 20 | Haftalik KPI mail otomasyonu | jobs/weeklyReport.job.js | SONRAKI (TUR #28+, FAZ 4-C) |

---

## 4. KIRMIZI CIZGI OZET (Madde 25.3)

Hicbir pazarlama iceriginde asagidakiler YASAK:

- "Kesin tazminat alacaksiniz" / "X TL garantili"
- "En iyi platform" / "Turkiye'nin 1 numarali"
- Sayisal basari orani vaadi ("%95 kazandik")
- Belirli avukatin isim / fotograf / basari orani (TBB Reklam Yasagi)
- Yaniltici sigorta tazminat rakami
- Sahte yorum / degerlendirme / referans
- Trafik kazasi, is kazasi disi alanlarda tibbi tani/tedavi vaadi

---

## 5. KVKK + IYS HIZLI OZET (Madde 25.7)

- Cookie consent **kabul alınmadan** GA4 / TikTok Pixel tetiklenmez
- Form'da 3 ayri kutu (default ISARETSIIZ):
  1. "KVKK aydinlatma okudum" (zorunlu)
  2. "Saglik verisi islenmesini onayliyorum" (zorunlu)
  3. "E-posta/SMS ile pazarlama mesaji almak istiyorum" (opt-in)
- Her SMS/e-posta'da IYS opt-out linki zorunlu
- Her riza/red zaman damgali kayit (Lead + ActivityLog)

---

## 6. FAZ 4 ALT BASLIKLAR (Madde 25.12 FAZ 4)

FAZ 4 dört alt baslik — **kapsam, uygulama atom turlara bolunur:**

- **A** — Reklam Altyapisi (Google Ads conversion API, UTM sablon, bütce disiplini)
- **B** — Icerik Uretimi (blog makaleler, sosyal medya seriler, editöryel takvim)
- **C** — Operasyonel Pazarlama (lead takip SLA, funnel alarm, haftalik KPI, retargeting)
- **D** — Otomasyon + Surekli Optimizasyon (lead skor, A/B test motoru, davranis izleme)

KIRMIZI nokta sinyali (Madde 18.3 yazili onay zorunlu):
- Yeni env degiskeni (GOOGLE_ADS_CONVERSION_ID vb.)
- Yeni 3rd party SDK (npm install)
- Davranis izleme kutuphanesi (Hotjar, Clarity vb.)

---

**Son guncelleme:** 28 Nisan 2026 — Anayasa v1.10.0 modülasyonu
**Kaynak:** CLAUDE_MADDE_25_DETAY.md (tam metin)
