# RESMİ MUHATAP HARİTASI — KEŞİF RAPORU
**Tarih:** 27 Nisan 2026  
**Tur:** KEŞİF (Madde 21 — okuma-only, sıfır kod değişikliği)  
**Durum:** TAMAMLANDI  

---

## GİRİŞ

Bu belge Tedbirge.ai sisteminin **tüm dış paydaşlarını** (resmi muhataplar) haritalar.  
Kaynak: kod-temelli okuma (Madde 4.4). .md dosyaları değil, servis dosyaları esas alındı.  
Çıktı: Madde 24 (İş Planı Yasası) için gerekli atlas tabanı.

---

## A. İLETİŞİM KANALLARI (Aktif Entegrasyonlar)

### A-1. NetGSM — SMS Sağlayıcı
| Alan | Değer |
|---|---|
| Durum | Aktif (mock mode: ENV yoksa otomatik) |
| Endpoint | `https://api.netgsm.com.tr/sms/send/get` (HTTP GET) |
| Entegrasyon | Doğrudan HTTPS — SDK yok |
| Dosya | `src/services/sms.service.js` |
| ENV | `NETGSM_USERNAME`, `NETGSM_PASSWORD`, `NETGSM_HEADER` |
| Opsiyonel | `NETGSM_ENCODING` (default: TR — Türkçe karakter) |
| Özellik | OTP SMS, durum bildirimi, zamanaşımı uyarısı, sözleşme bildirimi |
| Maliyet | SMS başına ücret (segment bazlı — Türkçe karakter UCS-2 = 70 char/seg) |
| Risk | Türkçe karakter içeren SMS = 2x maliyet (UCS-2 segment fiyatı) |

**Gönderilen şablonlar:**
- `sendOtpSms` — OTP/onay kodu
- `sendStatusChangeSms` — Lead durum değişimi
- `sendLawyerAssignedSms` — Avukat atama bildirimi
- `sendContractCreatedSms` — Sözleşme hazır bildirimi
- `sendStatuteLimitWarningSms` — Zamanaşımı uyarısı
- `sendOnayBildirim` — Temsilci/avukat onay bildirimi

---

### A-2. Gmail SMTP — E-Posta Sağlayıcı
| Alan | Değer |
|---|---|
| Durum | Aktif (mock mode: ENV yoksa otomatik) |
| Endpoint | `smtp.gmail.com:587` (STARTTLS) |
| Entegrasyon | `nodemailer` npm paketi (bağlantı havuzu: max 3 bağlantı) |
| Dosya | `src/services/email.service.js` |
| ENV | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_REPLY_TO` |
| Özellik | HTML şablonlu e-posta, responsive tasarım |
| Gönderen | `"Tedbirge" <smtp_user>` veya SMTP_FROM |
| Reply-To | `SMTP_REPLY_TO` veya `destek@tedbirge.ai` |

**Gönderilen şablonlar:**
- `sendApplicationReceivedEmail` — Başvuru alındı (müvekkile)
- `sendLawyerAssignedEmail` — Avukat atandı (müvekkil + avukata)
- `sendContractCreatedEmail` — Sözleşme hazır (müvekkile)
- `sendStatuteLimitWarningEmail` — Zamanaşımı uyarısı (avukata, urgency eskalasyonu)

**Not:** Gmail App Password zorunlu (2FA sonrası). Kurumsal SMTP geçişi ileride önerilebilir.

---

### A-3. Meta WhatsApp Business API — WhatsApp
| Alan | Değer |
|---|---|
| Durum | Aktif (mock mode: ENV yoksa otomatik) |
| Endpoint | `https://graph.facebook.com/v19.0/{phoneId}/messages` (HTTP POST) |
| Entegrasyon | Doğrudan `fetch()` — SDK yok |
| Dosya | `src/services/whatsapp.service.js` |
| ENV | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_API_VERSION`, `WHATSAPP_APP_SECRET` |
| Webhook ENV | `WHATSAPP_WEBHOOK_VERIFY_TOKEN` |
| Şablon ENV | `WA_TEMPLATE_YENI_BASVURU`, `WA_TEMPLATE_AVUKAT_ATAMA` |
| Kural | 24 saat hizmet penceresi dışında YALNIZCA onaylı şablon gönderilebilir |
| Retry | Exponential backoff (2 deneme, 500ms base) |
| İmza | `x-hub-signature-256` webhook doğrulama (HMAC-SHA256) |

**Gönderilen şablonlar:**
- `sendNewLeadNotification` — Yeni başvuru (müvekkile)
- `sendLawyerAssignedNotification` — Avukat atandı (müvekkile)
- `sendStatuteOfLimitationsWarning` — Zamanaşımı uyarısı (avukata)
- `createWhatsappRedirect` — Müvekkil → WhatsApp yönlendirme URL'si

**Önemli:** Meta Business Manager'da `yeni_basvuru` + `avukat_atama` şablonları onaylanmış olmalı.

---

### A-4. Web Push (VAPID) — PWA Bildirimleri
| Alan | Değer |
|---|---|
| Durum | Sprint 3 (şu an stub) |
| Entegrasyon | `web-push` npm paketi |
| ENV | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` |
| Dosya | `src/os/modules/notifications.js` (stub kanal) |
| Hedef | Avukat/temsilci panel PWA bildirimleri |

---

## B. AI/ML SAĞLAYICILAR

### B-1. Anthropic Claude API — Ana AI Motoru
| Alan | Değer |
|---|---|
| Durum | Aktif (`ANALYSIS_MODE=real`) |
| SDK | `@anthropic-ai/sdk` npm paketi (v0.89.0+) |
| Model | `claude-sonnet-4-6` |
| ENV | `ANTHROPIC_API_KEY` |
| Mock | `ANALYSIS_MODE=mock` veya API key yoksa |

**Kullanım noktaları:**
| Dosya | İşlev | Max Token |
|---|---|---|
| `src/services/ai.service.js` | Belge yorumlama (`interpretResponse`) | 512 |
| `src/services/ai.service.js` | Dilekçe üretimi (`generatePetition`) | 3000 |
| `src/services/ai.service.js` | Kapsamlı belge analizi (`analyzeDocument`) | 1024 |
| `src/services/muhatapAI.service.js` | 13 muhatap tip önerisi | 1024 |
| `src/os/modules/ai.js` | OS AI modülü | — |

**KVKK riski:** Lead verisi (ad, telefon, kaza özeti, gelir, maluliyet) Anthropic API'ye gönderiliyor.  
Anthropic → ABD şirketi → KVKK m.9 yurt dışı aktarım → **SCC zorunlu**.

---

### B-2. OCR Sağlayıcıları
| Alan | Değer |
|---|---|
| Birincil | Tesseract (yerel çalışma) |
| Alternatif | OCR.space API (`ocr_space`) |
| ENV | `OCR_PROVIDER`, `TESSERACT_PATH`, `OCR_LANG`, `OCR_PSM`, `OCR_DPI` |
| ENV | `PDFTOPPM_PATH` (PDF→görüntü dönüşümü için poppler) |
| OCR çalışanı | `OCR_POLL_INTERVAL_MS=10000`, `OCR_MAX_CONCURRENT=5` |
| Render uyumu | `/usr/bin/tesseract` (Docker'da poppler-utils kurulu olmalı) |

---

## C. VERİTABANI & DEPOLAMA

### C-1. Supabase — PostgreSQL + Storage
| Alan | Değer |
|---|---|
| Durum | Aktif (production) |
| Proje ID | `iikpmzomblocdrxeisxh` |
| DB Endpoint | `db.iikpmzomblocdrxeisxh.supabase.co:5432` |
| Storage Bucket | `tedbirge-documents` |
| SDK | `@supabase/supabase-js` npm paketi |
| ORM | Prisma (DATABASE_URL pool: `connection_limit=20&pool_timeout=30`) |
| ENV | `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (veya `SUPABASE_SERVICE_KEY`) |
| ENV | `SUPABASE_STORAGE_BUCKET` |
| Dosya | `src/services/storage.service.js`, `src/config/db.js` |
| Jurisdiksiyon | ABD (Supabase Inc.) → KVKK m.9 → SCC zorunlu |
| Fallback | `uploads/` klasörü (yerel mod — `SUPABASE_STORAGE_BUCKET` boşsa) |

**Storage işlemleri:**
- `uploadFile` — Buffer → Supabase (upsert: false)
- `downloadFile` — Supabase → Buffer
- `createSignedUploadUrl` — Client-side upload (leads/{leadId}/{ts}-{name})
- `verifyUpload` — Upload doğrulama
- `createSignedDownloadUrl` — Geçici indirme URL (default: 3600s)

---

## D. ÖDEME

### D-1. PayTR — Ödeme Geçidi
| Alan | Değer |
|---|---|
| Durum | Aktif (mock mode: ENV yoksa otomatik) |
| API | `https://www.paytr.com/odeme/api` (POST — iFrame token) |
| İade API | `https://www.paytr.com/odeme/iade` (POST) |
| Entegrasyon | Doğrudan HTTPS — SDK yok |
| Auth | HMAC-SHA256 (MERCHANT_KEY + MERCHANT_SALT) |
| Callback | `/api/payments/callback` (POST, HMAC doğrulamalı) |
| Dosya | `src/services/payment.service.js`, `src/controllers/payment.controller.js` |
| ENV | `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT` |
| ENV | `BACKEND_URL` (callback URL — .env.example'da EKSİK!) |
| Jurisdiksiyon | Türkiye (PayTR TR şirketi) |

**⚠️ RİSK:** `PAYTR_MERCHANT_ID/KEY/SALT` ve `BACKEND_URL` `.env.example`'da tanımlı DEĞİL.  
Yeni geliştirici ortamında ödeme sistemi mock modda başlayabilir — fark edilmeyebilir.

---

## E. DEVLET/KAMU SİSTEMLERİ (STUB — Sprint 4)

### E-1. UYAP — Ulusal Yargı Ağı (Adalet Bakanlığı)
| Alan | Değer |
|---|---|
| Durum | **STUB** — adapter configured DEĞİL |
| Adapter | `src/os/adapters/uyap.js` |
| Auth adapter | `src/os/adapters/eimza.js` (e-imza entegrasyonu) |
| Kontrol modülü | `src/os/modules/uyapControl.js` |
| Polling | 30 dakika (UYAP rate limit dostu) |
| Oturum TTL | 8 saat |
| İtiraz süresi | 14 gün (tebligat + 2 hafta) |
| Sprint 4 görev | Gerçek UYAP adapter implementation, e-imza akışı |
| Muhatap türü | Mahkemeler, icra daireleri, tebligat sistemi |

**Hazır iskelet:**
- Tebligat polling, deadline tracking, session yönetimi
- Event: `UYAP_TEBLIGAT_RECEIVED`, `UYAP_DOSYA_SYNCED`, `UYAP_SESSION_EXPIRED`
- Reconciler policy handler: `pending-tebligat`, `overdue-tebligat`

---

### E-2. SBM — Sigorta Bilgi ve Gözetim Merkezi
| Alan | Değer |
|---|---|
| Durum | **STUB** — adapter configured DEĞİL |
| Adapter key | `sbm` |
| Kontrol modülü | `src/os/modules/insurance.js` |
| Tick | 1 saat |
| Sprint 4 görev | SBM API sözleşmesi + adapter implementation |
| Muhatap türü | Sigorta şirketleri (poliçe sorgu, KTT, eksper atama) |

**Hazır iskelet:**
- `queryPolice(plaka, tc)` — Poliçe bilgisi sorgusu
- `queryKTT(kttNo)` — Kaza tespit tutanağı sorgusu
- `requestEksper(basvuru)` — Eksper atama talebi

---

## F. HUKUKİ MUHATAP KATEGORİLERİ (Uygulama İçi Sınıflandırma)

Bu kategoriler dış servis değil — sistemin kendi muhatap motoru.  
Kaynak: `src/services/muhatapAI.service.js` + `src/templates/muhatap-templates.json`

| # | Tip | Kanun | Cevap Süresi | Zamanaşımı |
|---|---|---|---|---|
| 1 | TRAFIK_SIGORTASI | KTK m.91-99, TBK m.72 | 15 gün | 2 yıl |
| 2 | KASKO | Poliçe şartları | 15 gün | 2 yıl |
| 3 | FERDI_KAZA_KOLTUK | Poliçe şartları | 15 gün | 2 yıl |
| 4 | TMTB | Green card sistemi | — | 2 yıl |
| 5 | GUVENCE_HESABI | KTK m.101 | — | 2 yıl |
| 6 | ISVEREN | TBK m.417, ISG m.4, TBK m.49 | 15 gün | 10 yıl |
| 7 | SGK | 5510 m.13-22 | 30 gün | 10 yıl |
| 8 | HASTANE | TBK m.49 + hekim kusuru | 15 gün | 2 yıl |
| 9 | TARSIM | Tarım sigortası | — | — |
| 10 | DASK | Deprem sigortası | — | — |
| 11 | SORUMLU_UCUNCU_KISI | TBK m.49 | 15 gün | 2 yıl |
| 12 | KAMU_KURUMU | KGM, Belediye | 30 gün | 1 yıl (İYUK) |
| 13 | DIGER | — | — | — |

**AI motoru:** `muhatapAI.service.js` → `claude-sonnet-4-6` ile 13 tipten en uygununu önerir.  
**Güven skoru:** 0.0-1.0 arası.

**Hazır template'ler:**  
`muhatap-templates.json` içinde: TRAFIK_SIGORTASI, SGK, ISVEREN ihtarname şablonları.  
Değişkenler: `{{musteri.ad}}`, `{{avukat.baroSicili}}`, `{{olay.tarihi}}` formatında.

---

## G. DEPLOY & ALTYAPI KATMANI

| Servis | Sağlayıcı | Endpoint |
|---|---|---|
| Backend | Render | `https://tedbirge-ai.onrender.com` |
| Panel | Vercel | `https://www.tedbirge.ai` |
| Veritabanı | Supabase | `db.iikpmzomblocdrxeisxh.supabase.co` |
| Storage | Supabase | `tedbirge-documents` bucket |
| Domain | — | `tedbirge.ai` |
| CORS | — | `CORS_ORIGIN` env |

**ENV bütünlük notu:**  
`PANEL_URL`, `APP_URL`, `BACKEND_URL` ayrı tanımlı. Callback URL'lerinde `BACKEND_URL` kullanılıyor  
ama `.env.example`'da tanımlı değil (PayTR callback riski).

---

## H. KVKK m.9 — YURT DIŞI AKTARİM HARİTASI

| Sağlayıcı | Ülke | Aktarılan Veri | SCC Durumu |
|---|---|---|---|
| Supabase Inc. | ABD | Tüm DB verisi (müvekkil, lead, belgeler) | Gerekli |
| Anthropic | ABD | Lead metni + belge OCR içeriği | Gerekli |
| Meta (WhatsApp) | ABD/EU | Telefon no + mesaj içeriği | Gerekli |
| NetGSM | **Türkiye** | Telefon no + SMS metni | SCC gerekmez |
| Gmail/Google | ABD | E-posta içeriği | Gerekli |
| PayTR | **Türkiye** | Ödeme + sipariş bilgisi | SCC gerekmez |

**compliance.js SCC registry (in-memory, Sprint 3'te DB):**  
Örnek kayıt: `{ id: 'scc-supabase-2025', processor: 'Supabase Inc.', validUntil: '2026-10-01' }`  
**Risk:** SCC'ler in-memory — restart'ta sıfırlanıyor. Sprint 3'te DB tablosuna taşınmalı (TUR #23 scope).

---

## I. RİSK ÖZETİ (Keşif Bulguları)

| # | Seviye | Bulgu | Dosya | Önerilen Kesit |
|---|---|---|---|---|
| 1 | 🟡 ORTA | `PAYTR_MERCHANT_ID/KEY/SALT` + `BACKEND_URL` `.env.example`'da eksik — yeni ortamda ödeme sessizce mock modda kalır | `.env.example`, `payment.service.js` | Stabilite/Config kesiti |
| 2 | 🟡 ORTA | Anthropic API → lead verisi ABD'ye gidiyor — SCC belgesi zorunlu KVKK m.9 | `ai.service.js`, `muhatapAI.service.js` | KVKK uyum kesiti |
| 3 | 🟡 ORTA | SCC registry in-memory — sunucu restart'ında sıfırlanıyor | `compliance.js` | TUR #23 (compliance DB) |
| 4 | 🟡 ORTA | UYAP adapter stub — Sprint 4 anlaşması kırılırsa mimari boşta kalır | `uyapControl.js`, `adapters/uyap.js` | Sprint 4 koordinasyonu |
| 5 | 🟡 ORTA | Meta WhatsApp şablon onayı — `yeni_basvuru`, `avukat_atama` Meta Business Manager'da onaylanmış mı? Doğrulanamadı (dış sistem) | `whatsapp.service.js` | Operasyonel kontrol |
| 6 | 🟢 DÜŞÜK | OCR provider env-driven (`tesseract`/`ocr_space`) — ocr.space API key gelecekte ENV olarak eklenmeli | `.env.example` | Config iyileştirme |
| 7 | 🟢 DÜŞÜK | Gmail SMTP — kurumsal kullanımda Google uygulama şifresi yetersiz kalabilir | `email.service.js` | E-posta altyapısı |

---

## J. DÖRTLEMELİ MUHATAP TABLOSU (Madde 24 için)

| Muhatap | Tip | Entegrasyon | Sprint |
|---|---|---|---|
| NetGSM | İletişim | Aktif (doğrudan HTTP) | Canlı |
| Gmail SMTP | İletişim | Aktif (Nodemailer) | Canlı |
| Meta WhatsApp | İletişim | Aktif (doğrudan HTTP) | Canlı |
| Web Push | İletişim | Stub | Sprint 3 |
| Anthropic Claude | AI | Aktif (SDK) | Canlı |
| Tesseract OCR | AI | Aktif (yerel) | Canlı |
| OCR.space | AI | Opsiyonel (ENV) | Hazır |
| Supabase | Altyapı | Aktif (SDK + Prisma) | Canlı |
| PayTR | Ödeme | Aktif (doğrudan HTTP) | Canlı |
| UYAP | Devlet | Stub (Sprint 4) | Sprint 4 |
| SBM | Sigorta | Stub (Sprint 4) | Sprint 4 |
| TRAFIK_SIGORTASI | Hukuki muhatap | Template motor | Canlı |
| SGK | Hukuki muhatap | Template motor | Canlı |
| ISVEREN | Hukuki muhatap | Template motor | Canlı |
| KAMU_KURUMU (KGM/Belediye) | Hukuki muhatap | Template motor | Canlı |

---

## ÖZET

- **Aktif entegrasyon sayısı:** 7 (NetGSM, Gmail, WhatsApp, Anthropic, Tesseract, Supabase, PayTR)
- **Stub entegrasyon sayısı:** 2 (UYAP, SBM — Sprint 4)
- **KVKK m.9 yurt dışı aktarım:** 4 sağlayıcı (Supabase, Anthropic, Meta, Google/Gmail)
- **Mock mod riski:** PayTR (ENV eksik), Anthropic (ANALYSIS_MODE=mock), NetGSM (ENV yoksa), WhatsApp (ENV yoksa), Gmail (ENV yoksa)
- **Madde 24 hazırlık durumu:** Atlas tamamlandı. İş Planı Yasası geliştirmesi başlayabilir.

---

*Keşif yapan: Claude Code (Sonnet 4.6)*  
*Yöntem: Madde 21 Sağlık Taraması disiplini — sıfır kod değişikliği*  
*Okunan dosyalar: .env.example, package.json, src/config/env.js, src/services/{sms,email,whatsapp,ai,muhatapAI,payment,storage}.service.js, src/os/modules/{uyapControl,insurance,compliance,notifications}.js, src/templates/muhatap-templates.json*
