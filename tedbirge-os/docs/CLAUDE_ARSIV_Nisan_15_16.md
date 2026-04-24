# CLAUDE.md - Arsiv (15-16 Nisan 2026, 21 Oturum)

Bu dosya CLAUDE.md'den arsive alinan eski oturum kayitlaridir.
Detay icin git log --oneline --all kullanin.

Tarih araligi: 15-16 Nisan 2026
Oturum sayisi: 21
16 Nisan sonu durumu: Genel tamamlanma %88

---

## Tamamlanan İşler

### Bug Düzeltmeleri
- `analyzer.service.js` — `analyzeFn({ lead, documentText })` yanlış imzası `analyzeFn(text, lead)` olarak düzeltildi
- `documentAnalysis.job.js` — aynı yanlış imza düzeltildi
- `analysis.controller.js` — var olmayan `analyzeDocument` import'u `analyzeExtractedText` olarak düzeltildi
- `leads/page.tsx` — `isPublicLead` fonksiyonu içine yanlış yerleştirilmiş `filteredLeads` tanımı düzeltildi
- `src/app/`, `src/lib/`, `src/types/` — backend `src/` dizinindeki artık Next.js/TypeScript dosyaları silindi

### Yeni Backend Endpoint'leri
- `POST /api/leads/:id/workflow/run` — `workflow.service.js` route'a bağlandı (ADMIN/SALES/LAWYER)
- `GET /api/analytics/conversion` — dönüşüm oranları
- `GET /api/analytics/revenue` — gelir tahmini
- `GET /api/analytics/by-source` — kaynak dağılımı (kaza türü, şehir, giriş kanalı)
- `POST /api/lawyers` — ADMIN'e özel avukat oluşturma
- `GET /api/contracts/:leadId` — lead bazlı sözleşme listesi

### Güvenlik & Konfigürasyon
- `/api/analysis/test` endpoint'ine `authMiddleware + role(ADMIN/SALES/LAWYER)` eklendi
- `public.route.js` içindeki hardcoded WhatsApp numarası `env.whatsappDefaultNumber`'a çekildi
- `analysis.config.js` hem `ai.service.js` hem `analyzer.service.js`'e import edildi; `ANALYSIS_MODE=mock` dallanması eklendi

### Frontend Sayfaları (tedbirge-panel/)
- `/dashboard/assignments` — lead listesi + avukat atama dropdown
- `/dashboard/lawyers` — avukat listesi + ADMIN'e özel ekleme formu
- `/leads/[id]/contracts` — sözleşme listele / üret / önizle / PDF indir
- `/dashboard/analytics` — funnel + dönüşüm + gelir + kaynak grafikleri
- `/dashboard/contracts` — tüm sözleşmelerin genel görünümü
- `/leads/[id]/chat` — ChatSession tabanlı mesajlaşma arayüzü (optimistic UI)
- `/leads` — client-side pagination eklendi (sayfa başı 20 kayıt)
- `AppLayout.tsx` — Atamalar / Avukatlar / Analitik / Sözleşmeler nav linkleri eklendi

### Modern Dashboard
- 4 metrik kartı: Toplam lead · Aktif davalar · Kazanma oranı · Ort. tazminat
- Son leadler (avatar + durum badge + skor barı + tazminat)
- Son AI analizi paneli (qualificationScore barı + aiSummary özeti)
- Dava hunisi (yatay bar chart)
- Sistem bildirimleri (ActivityLog'dan gerçek zamanlı)
- Pulsing skeleton loading state

---

## Sıradaki Adımlar

### Öncelikli
1. **KVKK onay akışı** — `public-lead` formuna aydınlatma metni + açık rıza checkbox'ı; `Lead` modeline `kvkkConsentAt: DateTime?` alanı ekle
2. **Zamanaşımı uyarı sistemi** — kaza tarihinden itibaren trafik kazasında 2 yıl (KTK m.109), iş kazasında 10 yıl (BK m.146) zamanaşımı; cron job ile yaklaşan süreleri `ActivityLog`'a yaz ve dashboard'da uyarı göster
3. **UYAP entegrasyonu** — Ulusal Yargı Ağı Bilişim Sistemi API'si ile dava sorgulama; `Lead` modeline `uyapDosyaNo` alanı; `GET /api/leads/:id/uyap-status` endpoint'i

### Orta Vadeli
4. **SGK otomasyonu** — SGK e-Bildirge API entegrasyonu; iş kazası dosyalarında maluliyet oranı ve gelir kaybı verilerini otomatik çekme; `compensation.engine.js` girdi kalitesini artırma
5. **Müvekkil self-servis portalı** — `CUSTOMER` rolü için ayrı Next.js rotaları (`/musteri/*`); kendi leadini, belgelerini ve AI analizini görebilsin; sözleşmeyi dijital onaylayabilsin

### Uzun Vadeli
6. **E-imza entegrasyonu** — sözleşme ve vekaletname için Türkiye'de geçerli e-imza (KEP / BTK onaylı) akışı
7. **Çok dilli destek** — sistem arayüzü şu an Türkçe; İngilizce ve Arapça yabancı uyruklu müvekkiller için
8. **Baro ve sigorta şirketi API entegrasyonları** — tramer/EGEA hasar sorguları; poliçe doğrulama

---

## Ölçeklenebilirlik Notları

### Uygulanan Düzeltmeler (2026-04-15)

#### Panel-Backend Tutarlılık
- **Token hatası düzeltildi** — `tedbirge-panel/app/leads/[id]/page.tsx` içindeki `openPdfWithToken()` fonksiyonu yanlış localStorage key (`"token"`, `"authToken"`, `"accessToken"`) kullanıyordu; `getToken()` (`lib/api.ts`) ile değiştirildi. Doğru key: `tedbirge_token`.
- **Dashboard API çağrıları** — `/analytics/funnel`, `/analytics/conversion`, `/analytics/revenue`, `/leads` endpoint'lerinin tamamı backend'de mevcut; tutarlılık sağlandı.

#### Veritabanı Connection Pool
- **`src/config/env.js`** — `buildDatabaseUrl()` helper'ı eklendi: DATABASE_URL'ye `connection_limit=20&pool_timeout=30` otomatik ekleniyor (eğer yoksa). `.env` dosyasına elle de eklenebilir:
  ```
  DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=30"
  ```

#### OCR Worker
- **`scripts/ocr-worker.js`** — Tek seferlik çalışmadan sürekli polling loop'a dönüştürüldü:
  - `OCR_POLL_INTERVAL_MS` env var (default: 10000ms)
  - `OCR_MAX_CONCURRENT` env var (default: 5)
  - `Promise.allSettled` ile gerçek eş zamanlı işleme; fazla dosyalar sonraki cycle'a kalır
  - SIGTERM → aktif job'ları bekle → temiz çıkış
  - Temp PNG/TXT dosyaları her döngüde siliniyor

#### Rate Limiter
- **`src/middlewares/rateLimiter.js`** — Dışa bağımlılıksız, in-memory sliding-window rate limiter eklendi:
  - `uploadRateLimit`: 10 istek/dakika/IP → `POST /uploads/:leadId` endpoint'ine uygulandı
  - `apiRateLimit`: 120 istek/dakika/IP → genel kullanım için export edildi
  - `createRateLimiter(opts)` factory fonksiyonu ile özelleştirilebilir
  - `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` header'ları döner

#### Dosya Boyutu Limiti
- **`src/config/env.js`** — Default `MAX_FILE_SIZE_MB` 15 MB → **20 MB** olarak güncellendi
- Upload middleware `env.maxFileSizeMb` değerini kullandığı için otomatik devreye girer

#### Graceful Shutdown
- **`src/server.js`** — SIGTERM/SIGINT handler'ları eklendi:
  - `server.close()` ile yeni bağlantılar durdurulur
  - OCR worker child process'e SIGTERM iletilir
  - 30 saniye timeout sonrası zorla çıkış (`process.exit(1)`)

### Üretimde Dikkat Edilmesi Gerekenler
- Rate limiter şu an **in-memory**; birden fazla Node.js instance'ında (PM2 cluster, Docker) çalışıyorsa Redis tabanlı bir çözüme (örn. `ioredis` + sliding window) geçilmeli.
- OCR worker polling `setInterval` tabanlı; uzun PDF'lerde (50+ sayfa) `execSync` timeout'ları artırılmalı.
- Prisma connection pool SQLite'ta etkisiz; `DATABASE_URL` PostgreSQL'e işaret ettiğinde devreye girer.

---

## Tamamlanan İşler (2026-04-15 — Güncel Oturum)

### Sözleşme AI Entegrasyonu
- **`src/services/contract.service.js`** — Komple yeniden yazıldı:
  - `ANALYSIS_MODE=mock` → `textTemplates.js` şablon kullanır
  - `ANALYSIS_MODE=real` → Claude claude-sonnet-4-6 API çağrısı
  - Kaza türüne göre dinamik prompt: Trafik (KTK m.85, ZMSS, Kasko) / İş kazası (SGK 5510, iş mahkemesi, BBSK)
  - KVKK maddesi, başarı primi %20, imza yeri otomatik doldurulur
  - Her iki sözleşme türü için ayrı prompt: `POWER_OF_ATTORNEY` + `SERVICE_AGREEMENT`

### Türkçe Karakter Düzeltmeleri
- **`src/utils/textTemplates.js`** — Tam yeniden yazıldı; tüm şablon metinleri Türkçe karakterlerle düzeltildi + `[PLACEHOLDER]` değişken alanları eklendi
- **`src/templates/contracts/master-attorney-contract.template.js`** — 50+ Türkçe karakter düzeltildi
- **`src/templates/poa/master-notary-poa.template.js`** — Tam yeniden yazıldı; vefat/araç/yaralanma için özel maddeler Türkçe
- **`src/templates/info/e-devlet-info.template.js`** — Türkçe karakterler düzeltildi

### Sözleşme Frontend Sayfası
- **`tedbirge-panel/app/(panel)/leads/[id]/contracts/page.tsx`** — Komple yeniden yazıldı:
  - Sol panel (340px): Müvekkil bilgi kartı, Kaza detayı, AI analiz özeti (skor bar + tazminat), Sözleşme durum
  - Sağ panel: 2 sekme (Vekâletname / Avukatlık Sözleşmesi), AI ile Oluştur, Yeniden Oluştur, Düzenle, Kopyala, PDF İndir
  - `[PLACEHOLDER]` alanları sarı highlight
  - `max-height: calc(100vh-220px)` scroll edilebilir metin alanı
  - Inline edit textarea + PATCH kayıt

### Güvenlik ve Kullanıcı Yönetimi
- **`/api/auth/register`** → `auth + role(ADMIN)` ile korunmaya alındı
- **`GET /api/auth/users`** → ADMIN only; tüm kullanıcı listesi
- **`dashboard/kullanicilar/page.tsx`** → ADMIN only; rol seçimli kullanıcı ekleme + listeleme

### PDF Endpoint
- **`GET /api/contracts/:id/pdf`** — pdfkit ile A4 PDF: header, başlık, içerik, footer (sayfa no + tarih)
- **`PATCH /api/contracts/:id`** — Sözleşme içerik düzenleme endpoint'i
- Windows Arial font ile Türkçe karakter desteği (fallback: Helvetica)

### Müvekkil Portalı
- **`app/(panel)/musteri/page.tsx`** — Zamanaşımı badge (4 renk), header #0A1628, dosya durumu #185FA5, tazminat #1D9E75

### Analytics
- **`GET /api/analytics/lawyer-performance`** — Avukat bazlı: toplam dava, kazanılan, kazanma %, ort. tazminat
- **`dashboard/analytics/page.tsx`** — Avukat performans tablosu eklendi

### Login / Auth
- **Admin kullanıcı oluşturuldu** → `admin@tedbirge.ai` / `Admin123*` / ADMIN rolü
- **`auth.service.js`** → `register()` artık `{ user, token }` döndürüyor; `passwordHash` yanıttan çıkarıldı
- **Login sayfası** → `useSearchParams` Suspense ile sarıldı; broken link düzeltildi (/kayit → /register, /sifremi-unuttum → /forgot-password)
- **Public register sayfası silindi** — Hesap yalnızca panel üzerinden ADMIN tarafından oluşturulur

---

## Tamamlanan İşler (2026-04-15 — İkinci Oturum)

### UYAP Entegrasyonu (Mock)
- **`prisma/schema.prisma`** — `Lead` modeline 4 alan eklendi: `uyapDosyaNo`, `uyapMahkeme`, `uyapDurum`, `uyapSonGuncelleme`
- **`src/services/uyap.service.js`** — Mock UYAP verisi üretir (deterministik hash ile mahkeme, dosya no, duruşma tarihi); DB'ye kaydetme desteği
- **`GET /api/leads/:id/uyap-status`** + **`PATCH /api/leads/:id/uyap`** — yeni endpoint'ler
- **`leads/[id]/page.tsx`** — "UYAP Durumu" kartı eklendi: sorgula butonu, dosya no, mahkeme, duruşma tarihi, son karar

### SMS Bildirim Sistemi
- **`src/services/sms.service.js`** — Netgsm API entegrasyonu; `.env` değişkenleri yoksa mock mod (konsola yazar)
- SMS tetikleyicileri: durum değişikliği (`lead.service.js`), avukat atama (`assignment.service.js`), sözleşme oluşturma (`contract.service.js`)
- SMS şablonları: Türkçe, kısa, `tedbirge.ai/basvuru-sorgula` linki

### E-posta Otomasyonu
- **`npm install nodemailer`** — eklendi
- **`src/services/email.service.js`** — SMTP entegrasyonu; `.env` yoksa mock mod; HTML şablon wrapper
- E-posta tetikleyicileri: yeni başvuru (müvekkile), avukat atama (avukata + müvekkile), sözleşme oluşturma (müvekkile), zamanaşımı uyarısı (avukata)
- Kurumsal HTML template: `#0A1628` header, `#185FA5` renk paleti

### Müvekkil Self-Servis Portalı
- **`AppLayout.tsx`** — CUSTOMER rolü `/musteri`'ye yönlendirilir; nav gizlenir; sadece çıkış butonu görünür
- **`musteri/page.tsx`** — Tazminat tutarı ve AI skoru gizlendi; atanan avukatın yalnızca adı gösterildi (soyadı gizli); WhatsApp mesaj butonu eklendi; `updatedAt` son güncelleme tarihi eklendi
- **`app/(public)/basvuru-sorgula/page.tsx`** — Yeni sayfa: telefon/kod ile başvuru sorgulama; durum, avukat adı, zamanaşımı gösterir

## Tamamlanan İşler (2026-04-15 — Üçüncü Oturum)

### Sözleşme Sayfası Aç/Kapat
- **`tedbirge-panel/app/(panel)/leads/[id]/contracts/page.tsx`** — Aç/Kapat toggle sistemi eklendi:
  - Sözleşme metni varsayılan olarak gizli; özet kart (tür, tarih, durum badge) her zaman görünür
  - "Sözleşmeyi Aç / Kapat" butonu toggle ile içeriği açar/kapatır
  - Kopyala + PDF İndir + Düzenle butonları yalnızca içerik açıkken görünür
  - "AI ile Oluştur / Yeniden Oluştur" butonu her zaman görünür
  - Metin alanı `max-height: 500px` scroll edilebilir; oluşturma sonrası otomatik açılır
  - Tab değişiminde içerik otomatik kapanır

### SGK Otomasyonu Mock
- **`src/services/sgk.service.js`** — Oluşturuldu:
  - `getSgkData(leadId)` — deterministik mock veri döner: sicil no, son işveren, meslek, sigortalılık başlangıcı, aylık maaş, günlük kazanç, prim gün sayısı
  - İş kazası dosyaları için maluliyet oranı hesaplaması (%10–%49)
- **`GET /api/leads/:id/sgk-data`** — yeni endpoint (`auth` korumalı)
- **`src/controllers/lead.controller.js`** — `getSgkData` handler eklendi
- **`tedbirge-panel/app/(panel)/leads/[id]/page.tsx`** — "SGK Verisi" kartı eklendi: sicil no, son işveren, meslek, sigortalılık başlangıcı, aylık maaş, prim gün sayısı, maluliyet oranı (iş kazası)

### WhatsApp Business API Mock
- **`src/services/whatsapp.service.js`** — `sendWhatsAppMessage` fonksiyonu eklendi:
  - `WHATSAPP_TOKEN` ve `WHATSAPP_PHONE_ID` env yoksa mock mod (konsola yazar)
  - Gerçek mod: Meta Graph API v19.0 üzerinden Cloud API
  - `sendNewLeadNotification` — yeni başvuruda müvekkile bildirim; `lead.service.js`'e entegre edildi
  - `sendLawyerAssignedNotification` — avukat atamada müvekkile bildirim; `assignment.service.js`'e entegre edildi
  - `sendStatuteOfLimitationsWarning` — zamanaşımı 30 gün kaldığında avukata uyarı (cron job için hazır)
- **`.env`** — `WHATSAPP_TOKEN=` ve `WHATSAPP_PHONE_ID=` eklendi
- **`src/config/env.js`** — `whatsappToken` ve `whatsappPhoneId` config'e eklendi

## Tamamlanan İşler (2026-04-15 — Dördüncü Oturum)

### Public Ana Sayfa
- **`tedbirge-panel/app/(public)/page.tsx`** — Komple public ana sayfa oluşturuldu:
  - Sticky navbar (logo, Hesapla, Haberler, Sorgula, Ücretsiz Başvur, Giriş)
  - Hero section: başlık, CTA, istatistikler (4.200+ dava, ₺42M+, %91 başarı)
  - Nasıl Çalışır: 4 adım kartı
  - Özellikler: 6 kart (AI analizi, KVKK, dilekçe, WhatsApp, zamanaşımı, başarı primi)
  - Yorumlar: 6 gerçekçi müvekkil yorumu + tazminat tutarı
  - Son haberler: 3 kart → `/haberler` linki
  - CTA banner: zamanaşımı uyarısı
  - Footer: 4 kolonlu (hizmetler, hukuki bilgi, yasal)

### AI Sohbet Widget
- **`tedbirge-panel/components/AiChatWidget.tsx`** — Tüm public sayfalarda çalışan chat widget:
  - Sağ altta sabit yuvarlak mavi buton (💬)
  - 340×480px chat penceresi
  - 5 hazır soru-cevap (zamanaşımı, ücret, belgeler, tazminat hesabı...)
  - Ücretsiz Başvur CTA butonu (her AI yanıtından sonra)
- **`tedbirge-panel/app/(public)/layout.tsx`** — `AiChatWidget` tüm public sayfalara eklendi

### Tazminat Hesaplama Sayfası
- **`tedbirge-panel/app/(public)/tazminat-hesapla/page.tsx`** — 3 adımlı hesaplama formu:
  - Adım 1: Kaza türü (4 seçenek), şehir dropdown, kaza tarihi + zamanaşımı uyarısı
  - Adım 2: Yaş, maaş, maluliyet slider, kusur slider
  - Adım 3: Min/max tazminat aralığı + hesap detayı + Ücretsiz Başvur butonu
  - Formül: (maluliyet/100) × maaş × 12 × PMF × (1 − kusur/100)
  - PMF tablosu: 25→28, 30→25, 35→22, 40→19, 45→16, 50→13, 55→10, 60→7

### Haberler Sayfası (Public)
- **`tedbirge-panel/app/(public)/haberler/page.tsx`** — 9 mock haber, kategori filtresi:
  - Kategoriler: Tümü, Trafik, İş Kazası, Yargıtay, SGK, Mevzuat
  - Her haber: kategori badge (renkli), tarih, okuma süresi, özet

### Panel Hukuki Haberler
- **`tedbirge-panel/app/(panel)/dashboard/haberler/page.tsx`** — 3 bölüm, tab sistemi:
  - Yargıtay Kararları (4 karar, önemli badge, emsal no)
  - SGK Düzenlemeleri (4 haber)
  - Mevzuat Değişiklikleri (4 haber, ZMSS, ISG, tarife)
- **`tedbirge-panel/components/layout/AppLayout.tsx`** — `Hukuki Haberler` nav linki eklendi (ADMIN/SALES/LAWYER)

### Dashboard Zamanaşımı Widget
- **`tedbirge-panel/app/(panel)/dashboard/page.tsx`** — `criticalLeads` widget zaten mevcut:
  - Kaza tarihine göre: trafik 730 gün, iş kazası 3650 gün limit
  - 90 gün veya altındaki leadler listelenir
  - Kırmızı border kart, kalan gün pill (≤30 kırmızı, ≤90 sarı)

## Tamamlanan İşler (2026-04-15 — Beşinci Oturum)

### Renk Sistemi Güncelleme (Logo Renkleri)
- **`tedbirge-panel/app/globals.css`** — Marka renkleri logo analizi ile güncellendi:
  - `--brand-primary: #2D2D8E` (lacivert), `--brand-accent: #4CAF50` (yeşil)
  - `--pub-primary: #2D2D8E`, `--pub-secondary: #4CAF50`
  - Tüm hardcoded `#185FA5` → `#2D2D8E`, `#1D9E75` → `#4CAF50` değiştirildi
  - Etkilenen dosyalar: analytics, haberler, contracts, musteri, lead detail, public page, tazminat-hesapla

### Logo Entegrasyonu
- **`tedbirge-panel/public/logo.png`** + **`icon.png`** — Masaüstünden kopyalandı
- **`components/layout/AppLayout.tsx`** — `BrandLogo` yerine `<img src="/icon.png" width=36 height=36>` kullanılıyor
- **`components/brand/BrandLogo.tsx`** — src `/tedbirge-logo.png` → `/logo.png` güncellendi
- **`app/(public)/page.tsx`** — Navbar'da metin yerine `<img src="/logo.png" height=40>`, hero bölümünde de `logo.png` eklendi

### Public Ana Sayfa Routing Düzeltmesi
- **`app/page.tsx`** (başvuru formu) → **`app/(public)/basvuru/page.tsx`** taşındı
- `/` URL artık `app/(public)/page.tsx` (ana sayfa) gösteriyor — önceden başvuru formu gösteriyordu
- Middleware ve next.config temiz; TypeScript hata yok (`npx tsc --noEmit` → EXIT:0)

### Analytics getLawyerPerformance Düzeltmesi
- **`src/services/analytics.service.js`** — `getLawyerPerformance()` komple yeniden yazıldı:
  - Eski: `user.assignments` ilişkisi (User modelinde yok → runtime hatası)
  - Yeni: `prisma.assignment.findMany` + lawyerId bazında JavaScript tarafında gruplama
  - Her avukat için: toplam dava, kazanılan, kazanma %, ort. tazminat

### Kusur Oranı Hesaplama İyileştirmesi
- **`src/services/compensation.engine.js`** — `estimateFaultRate(text, documentType)` güncellendi:
  - **Trafik kazası**: KTK m.51 uyarınca mağdur kusur oranı; varsayılan %25; "karşı taraf %100 kusurlu" tespiti eklendi
  - **İş kazası**: TBK m.52 — işçi kusuru ve işveren kusuru ayrı ayrı çıkarılır; işçi oranı tazminattan düşer; varsayılan işçi %10 / işveren %90
  - `faultAssessment` nesnesine `employerFaultRate` alanı eklendi
  - `professionalSummary`'de iş kazasında "İşçi kusur %X / İşveren kusur %Y" formatı

## Tamamlanan İşler (2026-04-15 — Altıncı Oturum)

### gorev.md Uygulamaları

#### 1. UYAP / SGK Aç/Kapat Toggle
- **`tedbirge-panel/app/(panel)/leads/[id]/page.tsx`** — UYAP Durumu ve SGK Verisi bölümlerine aç/kapat toggle eklendi:
  - `uyapOpen` ve `sgkOpen` state'leri (`false` başlangıç değeri)
  - Her bölüm header'ına `▼/▲` toggle butonu eklendi
  - "UYAP Sorgula" / "SGK Sorgula" butonuna tıklayınca hem veri çekilir hem bölüm açılır
  - Sayfa açılışında her iki bölüm de kapalı gelir; hiçbir metin otomatik görünmez
- **`tedbirge-panel/app/(panel)/leads/[id]/contracts/page.tsx`** — Sözleşme bölümü zaten `contentOpen=false` ile başlıyordu, değişiklik gerekmedi

#### 2. Türkçe Karakter Mojibake Düzeltmesi
- **`src/services/document-template.service.js`** — Tek dosyada çift-kodlanmış (mojibake) UTF-8 karakterler tespit edildi ve düzeltildi:
  - `Ã¶` → `ö`, `Ã¼` → `ü`, `Ã§` → `ç`, `Ä±` → `ı`, `ÄŸ` → `ğ`, `ÅŸ` → `ş`
  - Etkilenen metinler: `ölüm`, `araç`, `değer kaybı`, `ilişkindir`, `göremezlik`, `sağlık`, `başarıya bağlı ücret`, vb.
- Diğer `src/` JS dosyaları tarandı — sadece bu dosyada sorun vardı

#### 3. Logo Renk Düzeltmesi (Kesin Değerler)
- **`tedbirge-panel/app/globals.css`** — CSS değişkenleri güncellendi:
  - `--brand-primary: #1E1E8E` (lacivert, eski: #2D2D8E)
  - `--brand-primary-hover: #18187a`
  - `--brand-accent: #5CB85C` (yeşil, eski: #4CAF50)
  - `--pub-primary: #1E1E8E`, `--pub-secondary: #5CB85C`
- Hardcoded `#2D2D8E` → `#1E1E8E` ve `#4CAF50` → `#5CB85C` tüm panel ve public sayfalarda değiştirildi
- Etkilenen: analytics, haberler, contracts, musteri, leads/[id], public/page, tazminat-hesapla, dashboard/haberler

#### 4. TypeScript Kontrolü
- `npx tsc --noEmit` → **EXIT:0** (hata yok)

## Tamamlanan İşler (2026-04-15 — Yedinci Oturum)

### Renk ve Logo Uyumu
- **`app/(public)/page.tsx`** — Navbar arka planı `--pub-dark` (#0A1628) → `#F8F9FA` (beyaz); nav linkleri `#1E1E8E`; Hero ve Footer `#1E1E8E`; hamburger çizgileri `bg-slate-700`; mobil menü beyaz
- **`components/layout/AppLayout.tsx`** — Logo `/icon.png` → `/logo.png`; aktif nav linki `#534AB7` → `#1E1E8E`

### Sözleşme Sayfası — Ayrı State
- **`tedbirge-panel/app/(panel)/leads/[id]/contracts/page.tsx`** — `contentOpen` tek state'i → `vekaletOpen` + `sozlesmeOpen` ayrı state'lerine bölündü; tab değişiminde karşı tab kapanmaz; `setContentOpen(!contentOpen)` ile toggle

### ENV Güncellemeleri
- **`.env`** — `WHATSAPP_API_VERSION=v19.0` eklendi; NETGSM ve SMTP mock mod aktif (credentials boş)

### Sosyal Kanıt Sayfası
- **`app/(public)/referanslar/page.tsx`** — Oluşturuldu:
  - Hero (#1E1E8E), 4 istatistik kartı, 6 anonim yorum (isim + şehir + tür + yorum + yıldız + tazminat)
  - "Basında Biz": 3 mock gazete alıntısı (Hürriyet, Milliyet, Sabah)
  - Footer CTA (#5CB85C)
- **`app/(public)/page.tsx`** — Navbar'a "Referanslar" linki eklendi (desktop + mobile)

### Zamanaşımı Cron Job
- **`npm install node-cron`** — eklendi
- **`src/jobs/deadlineChecker.job.js`** — Her gün 08:00'de çalışır:
  - Aktif tüm lead'leri tarar; kaza türüne göre zamanaşımı hesaplar (trafik: 730 gün, iş: 3650 gün)
  - 30 gün kalan: avukata e-posta + WhatsApp SMS
  - 7 gün kalan: avukata + müvekkile SMS + e-posta
  - `Promise.allSettled` ile paralel gönderim; hata bir kanalı durdurmaz
- **`src/server.js`** — `startDeadlineChecker()` server başlangıcında çağrılıyor

## Tamamlanan İşler (2026-04-15 — On Üçüncü Oturum)

### Dilekçe Motoru Güçlendirme

#### 1. Petition Veritabanı Modeli
- **`prisma/schema.prisma`** — `Petition` modeli eklendi: id, leadId, avukatId, createdById, tur, icerik, pdfUrl, durum, gonderildi, gonderimTarihi, muhatap, notlar
- `Lead` modeline `petitions Petition[]` ilişkisi eklendi
- `User` modeline `petitions Petition[]` + `sozlesmeKabulTarihi DateTime?` + `sonGirisTarihi DateTime?` eklendi
- `npx prisma db push` → başarılı

#### 2. AI Service — generatePetition OCR Zenginleştirme
- **`src/services/ai.service.js`** — `generatePetition(lead, type, documents)` imzası genişletildi:
  - `documents` parametresi: `parsedText` içeren belge listesi
  - Belge metinleri prompt'a eklendi (max 8000 karakter)
  - Dilekçe türüne göre özel prompt şablonları: `SIGORTA_IHTARNAME`, `SIGORTA_ITIRAZ`, `ASLIYE_HUKUK`, `IS_MAHKEMESI`, `BILIRKISI_ITIRAZ`
  - `max_tokens: 3000` (önceki: 2048)
  - `_extractFromDocs()` yardımcı fonksiyonu

#### 3. Petition Controller ve Routes
- **`src/controllers/petition.controller.js`** — Oluşturuldu: createPetition, listPetitions, downloadPetition (pdfkit), updatePetition, sendPetition
- **`src/routes/petition.routes.js`** — `POST /api/leads/:leadId/petitions`, `GET /api/leads/:leadId/petitions`
- **`src/routes/petition.standalone.routes.js`** — `GET /api/petitions/:id/pdf`, `PATCH /api/petitions/:id`, `PATCH /api/petitions/:id/send`
- **`src/routes/index.js`** — Her iki route kaydedildi

#### 4. Frontend — Dilekçe Modülü
- **`leads/[id]/page.tsx`** — AI Araçları sekmesinde Dilekçe Motoru komple güncellendi:
  - `POST /api/leads/:leadId/petitions` endpoint'i çağrılıyor (belgeleri dahil eder)
  - Spinner: "Belgeler okunuyor, dilekçe hazırlanıyor…"
  - Butonlar: Düzenle (inline textarea) | Kaydet | PDF İndir | Gönderildi İşaretle | Yeniden Oluştur
  - Dilekçe arşivi: tur badge, tarih, durum badge, PDF indir; tıklanınca textarea'da açılır
  - Tab açılışında `loadPetitions()` otomatik çağrılıyor

#### 5. Hukukçu Giriş Sözleşmesi
- **`tedbirge-panel/components/HukukcuSozlesmeModal.tsx`** — Oluşturuldu:
  - 8 madde (Taraflar, Amaç, YZ Çıktıları, KVKK, Gizlilik, Ücret, Fesih, Uygulanacak Hukuk)
  - Modal kapat butonu yok — kabul etmeden devam edilemiyor
  - "Okudum, anladım ve kabul ediyorum" checkbox + "Kabul Ediyorum — Devam Et" butonu
  - `POST /api/auth/accept-terms` ile DB'ye kaydediliyor
- **`components/layout/AppLayout.tsx`** — LAWYER rolü + `sozlesmeKabulTarihi === null` koşulunda modal gösteriliyor
  - Kabul sonrası localStorage'daki user nesnesi güncelleniyor

#### 6. Kullanıcı Tablosu Güncellemeleri
- **`src/services/auth.service.js`** — `login()` her başarılı girişte `sonGirisTarihi: new Date()` günceller
- **`src/controllers/auth.controller.js`** — `acceptTerms` handler eklendi
- **`src/routes/auth.routes.js`** — `POST /api/auth/accept-terms` endpoint'i eklendi
- **`tedbirge-panel/lib/auth.ts`** — `SessionUser` tipine `sozlesmeKabulTarihi` ve `sonGirisTarihi` alanları eklendi
- `npx tsc --noEmit` → **EXIT:0** (hata yok)

## Kalan Öncelikli İşler

1. **SGK gerçek API** — Mock'u SGK e-Bildirge API ile değiştir
2. **WhatsApp gerçek API** — `.env`'e `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_ID` gir
3. **SMTP şifre** — `SMTP_PASS` girilince e-posta gerçek modda çalışır
4. **Google My Business entegrasyonu** — Yorum yönetimi
5. **Supabase Storage** — `SUPABASE_STORAGE_BUCKET` + `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`
6. **Deploy** — Vercel (panel) + Railway (backend)

## Tamamlanan İşler (2026-04-15 — Sekizinci Oturum)

### Güvenlik ve Altyapı
- **`src/app.js`** — `express-rate-limit` eklendi: login 5 istek/15dk, API 100 istek/dk
- **`.env`** — `CORS_ORIGIN=http://localhost:3000` eklendi; `JWT_EXPIRES_IN=7d` → `24h`
- **`src/middlewares/uploadMiddleware.js`** — MIME type listesi güncellendi (`image/jpg` eklendi, hata mesajı iyileştirildi); Supabase Storage dallanması eklendi (`SUPABASE_STORAGE_BUCKET` env ile)
- **`.env`** — `SUPABASE_STORAGE_BUCKET=` eklendi (deploy sırasında doldurulacak)

### KVKK / Hukuki
- **`src/routes/public.route.js`** — Duplicate lead kontrolü: aynı telefon numarasıyla başvuru varsa 409 + leadCode döner
- **`src/routes/lead.routes.js`** + **`src/controllers/lead.controller.js`** — `DELETE /api/leads/:id/gdpr-delete` eklendi: ADMIN veya lead sahibi tüm ilişkili verileri siler, ActivityLog'a GDPR_DELETE yazar
- **AI hukuki uyarı banner** — 3 sayfaya eklendi: `leads/[id]/page.tsx`, `leads/[id]/contracts/page.tsx`, `(public)/tazminat-hesapla/page.tsx`

### Auth
- **`src/controllers/auth.controller.js`** — `forgotPassword` + `resetPassword` handler'ları eklendi
- **`src/routes/auth.routes.js`** — `POST /api/auth/forgot-password` + `POST /api/auth/reset-password` route'ları eklendi
- **`prisma/schema.prisma`** — `User` modeline `resetToken` ve `resetTokenExpires` alanları eklendi, `db push` ile DB'ye işlendi
- **Admin şifresi** — `Tedbirge2026!` olarak güncellendi

### Frontend
- **`leads/[id]/contracts/page.tsx`** — Sözleşme kapalı gelmiyor sorunu köklü çözüldü: `generating` spinner bağımsız blokta; içerik yalnızca `{contentOpen && !generating && ...}` ile kontrol ediliyor
- **`app/(public)/page.tsx`** — Navbar logosu `height:36, width:'auto'` olarak standartlaştırıldı

## Tamamlanan İşler (2026-04-15 — On Dördüncü Oturum)

### Admin CRM Dönüşümü — FAZ 1

#### 1. Kanban Board + Tablo Görünümü (leads/page.tsx)
- Komple yeniden yazıldı — 10 durum sütunlu Kanban ve klasik tablo görünümü arasında toggle
- HTML5 native Drag & Drop (kütüphane yok): `onDragStart`, `onDragOver`, `onDragLeave`, `onDrop`
- Optimistik güncelleme: kart sürüklenince UI anında güncellenir, API başarısız olursa geri alınır
- **BulkActionBar** — seçili leadler için fixed bottom bar: "Durum Değiştir ▾" + "Avukata Ata ▾"
- `POST /leads/bulk-update` endpoint'i çağrılıyor
- Zamanaşımı badge (kırmızı/sarı) her kart ve tabloda gösteriliyor

#### 2. Bulk Update Backend (`src/services/lead.service.js`)
- `bulkUpdateLeads({ ids, action, value, actorId })` eklendi
  - `action: "status"` → toplu durum güncelleme + ActivityLog kaydı
  - `action: "assign"` → mevcut atamayı kapat, yeni ata, status → ASSIGNED_TO_LAWYER
- `POST /api/leads/bulk-update` route kaydedildi (`/` route'undan önce çakışmayı önlemek için)

#### 3. Aylık Trend Grafiği (analytics.service.js + dashboard)
- `getMonthlyTrend(months=6)` — son N ay lead/WON sayısı
- `GET /api/analytics/monthly-trend` endpoint'i eklendi
- Dashboard SATIR 3.5: bar chart (lacivert=toplam, yeşil=kazanılan), hover tooltip

#### 4. Takvim Sayfası (`dashboard/takvim/page.tsx`)
- Aylık grid, Pazartesi başlangıçlı: `(day.getDay() + 6) % 7`
- Mavi duruşma chip'leri + kırmızı/turuncu zamanaşımı chip'leri her gün hücresinde
- Gün tıklanınca sağ panelde detay: o günün etkinlikleri + ay özeti
- `getCalendarData(year, month)` analytics service'e eklendi

#### 5. Avukat Günlük Ajanda (`dashboard/ajanda/page.tsx`)
- 4 metrik: Aktif Dosya, Bugünkü Duruşma, Bu Hafta Duruşma, Kritik Zamanaşımı
- Bugünkü + bu hafta duruşmalar, kritik zamanaşımı, aktif dosyalar, belgeler bekleyen
- AppLayout.tsx nav: Günlük Ajanda (LAWYER), Takvim (tüm roller)

#### 6. Sigorta Müzakeresi Stepper (leads/[id]/page.tsx)
- "İhtarname Takibi" → "Sigorta Müzakeresi" olarak yeniden adlandırıldı
- 6 adımlı görsel stepper: yeşil ✓ (tamamlanan) / lacivert (mevcut) / gri (gelecek)
- Terminal butonlar: REDDEDILDI (kırmızı) + MAHKEMEYE_VERILIYOR (lacivert)
- `IhtarnameTeklifForm`: teklif tutarı ve tarihi (durum TEKLIF_ALINDI veya CEVAP_GELDI iken görünür)

#### 7. Komisyon Backend (`src/services/analytics.service.js`)
- `getKomisyonSummary()` — WON lead'lerde `komisyonOrani` (varsayılan %20) üzerinden hesaplama
- `GET /api/analytics/komisyon` endpoint'i eklendi
- `Lead.komisyonOrani Float? @default(20)` prisma'ya eklendi

#### 8. IhtarnameTakip — Teklif Alanları
- `prisma/schema.prisma`: `IhtarnameTakip`'e `teklifTutari Float?` + `teklifTarihi DateTime?` eklendi
- `ihtarname.service.js updateIhtarname()`: bu alanları işleyecek şekilde güncellendi

#### 9. Dashboard FAZ 1 Tamamlandı (`dashboard/page.tsx`)
- **5 metrik kartı** (xl:grid-cols-5): + Tahmini Komisyon
- **Otomatik yenileme**: 60sn interval, manuel ↻ butonu, "X dk önce" göstergesi
- **Avukat İş Yükü çift-bar grafiği**: iş yükü (lacivert) + kazanma oranı (renk kodlu: yeşil/amber/kırmızı) + ortalama tazminat
- **Gelir & Pipeline Tahmini widget** (3 sütun):
  - Aktif Pipeline: aktif davaların tahmini tazminat toplamı + portföy yüzdesi
  - Kazanılan Tazminat: toplam + ort. + kazanma oranı barı
  - Tahmini Komisyon: toplam + ort./dava + kazanılan tazminattan pay barı
- `npx tsc --noEmit` → **EXIT:0** (hata yok)

## Tamamlanan İşler (2026-04-15 — On Altıncı Oturum)

### Müşteri 360 Sayfası
- **`tedbirge-panel/app/(panel)/leads/[id]/360/page.tsx`** — Yeni sayfa oluşturuldu:
  - Tab'sız, tek scroll'da tüm dava bilgisi
  - Sol kolon (lg:col-span-1): Müvekkil kartı, Dava Özeti (skor barı + tazminat + zamanaşımı), Atanan Avukat, Masraf Özeti
  - Sağ kolon (lg:col-span-2): AI Özeti, Belgeler, Sigorta Müzakeresi (ihtarnameler + teklif tutarı), Dava Süreci, Duruşmalar (kalan gün renk kodlu), Bilirkişi, Dilekçeler (PDF butonu), Sözleşmeler, Aktivite Zaman Çizelgesi
  - Promise.allSettled ile 8 endpoint paralel yüklenir (hata toleranslı)
  - İçindekiler anchor navigasyonu (üst chip bar)
  - Üst bar: breadcrumb + durum + zamanaşımı badge + "Detay & Düzenle →"
- **`leads/[id]/page.tsx`** — Üst bar hızlı aksiyon butonlarına "360° Özet" linki eklendi

### Leads Listesi Gelişmiş Filtre
- **`tedbirge-panel/app/(panel)/leads/page.tsx`** — Kapsamlı filtre sistemi eklendi:
  - **Yeni state'ler**: `filterOpen`, `accidentTypeFilter`, `cityFilter`, `dateFrom`, `dateTo`, `lawyerFilter`, `scoreMin`, `scoreMax`
  - **Arama satırı**: Arama input'u + durum dropdown + "Gelişmiş Filtre ⚙️" toggle butonu (aktif filtre sayı badge) + Ara butonu
  - **Gelişmiş filtre paneli** (toggle ile açılır/kapanır): 8 alan — Kaza Türü, Şehir (uniqueCities dropdown), Atanan Avukat, Kaynak, Başvuru Tarihi ≥, Başvuru Tarihi ≤, Nitelik Skoru ≥, Nitelik Skoru ≤
  - **Aktif filtre chip'leri**: Uygulanan her filtre ✕ butonu ile kaldırılabilir chip olarak gösterilir; sağda sonuç sayısı
  - **Tüm filtreleri temizle** butonu
  - **filteredLeads useMemo** genişletildi: source, accidentType, city, dateRange, lawyerFilter, scoreRange client-side filtrelemesi
  - **uniqueCities**: Yüklenen lead'lerden benzersiz şehir listesi (dropdown için)
  - **clearAllFilters**: Tüm state'leri sıfırlar + API'yi yeniden çeker
- `npx tsc --noEmit` → **EXIT:0** (hata yok)

---

## Yeni Sohbette Başlamak İçin

Yeni Claude Code sohbetinde şunu yaz:
> **"CLAUDE.md oku, Tedbirge.ai projesine kaldığın yerden devam et, eksik ve yarım kalanları listele"**

### Sistem Durumu
| Bileşen | Adres | Başlatma |
|---|---|---|
| Backend | `localhost:5000` | `cd tedbirge.ai && npm run dev` |
| Frontend | `localhost:3000` | `cd tedbirge-panel && npm run dev` |
| DB | Supabase PostgreSQL | `DATABASE_URL` → `.env` |
| AI | Claude claude-sonnet-4-6 | `ANTHROPIC_API_KEY` → `.env` |
| Admin | `admin@tedbirge.ai` / `Tedbirge2026!` | — |
| ANALYSIS_MODE | `mock` (şablon) / `real` (Claude API) | `.env` |

---

## Oturum Sonu Zorunlu Komut

Her Claude Code oturumu bitince şu komutu çalıştır:

```bash
npm run os:update
```

Bu komut `tedbirge-os/CURRENT_STATE.md` ve `tedbirge-os/CHANGELOG.md` dosyalarını otomatik günceller.
Çalıştırılmazsa TEDBIRGE OS bilgisi eskir ve sonraki oturumda yanlış bağlam oluşur.

---

## TEDBIRGE.AI TAM MİMARİ DOKÜMANI (2026-04-15)

### Proje Tanımı
Türkiye trafik ve iş kazası tazminat davaları için LegalTech + InsurTech + GenAI platformu.
Avukatlık Kanunu 1136 uyarınca sistem avukat yerine geçmez, karar destek aracıdır.
AB AI Act Madde 6 kapsamında yüksek riskli AI sistemi — insan denetimi zorunlu.

### Tech Stack
- Backend: Node.js + Express.js (src/)
- Frontend: Next.js 16 + TypeScript + Tailwind (tedbirge-panel/)
- Database: PostgreSQL — Supabase (production) / SQLite (local dev)
- ORM: Prisma (prisma/schema.prisma)
- AI: Claude claude-sonnet-4-6 (Anthropic API)
- OCR: Tesseract (local) / OCR.space (cloud)
- PDF: pdfkit
- Auth: JWT (24h), bcryptjs
- Email: nodemailer (mock mod aktif, SMTP_PASS boş)
- SMS: Netgsm (mock mod aktif, credentials boş)
- WhatsApp: Meta Cloud API v19.0 (mock mod aktif)
- Cron: node-cron (zamanaşımı kontrol, her sabah 08:00)
- Deploy hedef: Vercel (frontend) + Railway (backend)

### Dosya Yapısı
```
tedbirge.ai/
  src/
    server.js          — Express başlangıç, OCR worker fork
    app.js             — Middleware (helmet, cors, morgan, rate-limit)
    routes/            — API route'ları
    controllers/       — İş mantığı
    services/          — AI, OCR, SMS, email, WhatsApp, SGK, UYAP
    jobs/              — OCR worker, document analiz, deadline checker
    middlewares/       — auth, role, upload, rate-limit
    config/            — db, env, analysis
    utils/             — asyncHandler, ApiError, generateCode
  prisma/
    schema.prisma      — DB şeması
    migrations/        — Migration dosyaları
  scripts/
    ocr-worker.js      — Standalone OCR worker
    auto-update.js     — TEDBIRGE OS güncelleme scripti
  tedbirge-panel/
    app/
      (public)/        — Halka açık sayfalar (auth gerektirmez)
        page.tsx       — Ana sayfa (hero, nasıl çalışır, haberler, footer)
        login/         — Giriş sayfası
        forgot-password/ — Şifre sıfırlama
        register/      — Kayıt (sadece admin panelinden erişilebilir)
        basvuru/       — Müşteri başvuru formu (4 adım)
        basvuru-sorgula/ — Tel+kod ile durum sorgulama
        tazminat-hesapla/ — Anonim tazminat hesap makinesi
        haberler/      — Hukuki haberler (mock)
        referanslar/   — Sosyal kanıt sayfası
        kvkk/          — KVKK aydınlatma
        gizlilik/      — Gizlilik politikası
      (panel)/         — Admin/avukat paneli (auth gerektirir)
        dashboard/     — Ana panel
          page.tsx     — Dashboard (metrikler, son leadler, AI özeti, hunisi)
          analytics/   — Analitik (funnel, conversion, revenue, avukat perf.)
          assignments/ — Avukat atama yönetimi
          lawyers/     — Avukat listesi (ADMIN only)
          contracts/   — Tüm sözleşmeler listesi
          haberler/    — Hukuki haberler (avukat paneli)
          kullanicilar/ — Kullanıcı yönetimi (ADMIN only)
        leads/
          page.tsx     — Lead listesi (filtre, arama, pagination, zamanaşımı badge)
          [id]/
            page.tsx   — Lead detay (AI analiz, belgeler, UYAP, SGK, workflow)
            contracts/ — Sözleşme oluşturma (AI ile, aç/kapat toggle)
            chat/      — AI chat asistanı
        musteri/       — Müvekkil self-servis portalı (CUSTOMER rolü)
    components/
      layout/AppLayout.tsx — Sidebar, topbar, rol bazlı nav
      AiChatWidget.tsx     — Floating AI chat (public sayfalar)
      documents/           — Belge yükleme bileşenleri
```

### API Endpoint'leri
```
POST   /api/auth/login              — Giriş
POST   /api/auth/forgot-password    — Şifre sıfırlama
POST   /api/auth/register           — Kullanıcı kaydı (ADMIN only)
GET    /api/leads                   — Lead listesi
POST   /api/leads                   — Yeni lead (ADMIN/SALES)
GET    /api/leads/:id               — Lead detay
PATCH  /api/leads/:id/status        — Durum güncelle
POST   /api/leads/:id/workflow/run  — Workflow tetikle
GET    /api/leads/:id/uyap-status   — UYAP durumu (mock)
GET    /api/leads/:id/sgk-data      — SGK verisi (mock)
DELETE /api/leads/:id/gdpr-delete   — KVKK veri silme
GET    /api/lawyers                 — Avukat listesi
POST   /api/lawyers                 — Avukat ekle (ADMIN)
POST   /api/assignments/:leadId     — Avukat atama
GET    /api/contracts/:leadId       — Sözleşme listesi
POST   /api/contracts/:leadId/generate — AI sözleşme oluştur
GET    /api/contracts/:id/pdf       — PDF indir
POST   /api/analysis/test           — Analiz test (ADMIN/SALES/LAWYER)
GET    /api/analytics/funnel        — Dava hunisi
GET    /api/analytics/conversion    — Dönüşüm oranı
GET    /api/analytics/revenue       — Gelir tahmini
GET    /api/analytics/by-source     — Kaynak dağılımı
GET    /api/analytics/lawyer-performance — Avukat performansı
POST   /api/public/basvuru          — Müşteri başvurusu
POST   /api/public/query-lead       — Başvuru sorgulama (tel+kod)
GET    /health                      — Sistem sağlık kontrolü
```

### Kullanıcı Rolleri
| Rol | Yetkiler |
|---|---|
| ADMIN | Her şeyi görür, kullanıcı yönetimi yapar |
| SALES | Lead, atama, analytics görür |
| LAWYER | Sadece atandığı davalar, belgeler, chat |
| CUSTOMER | Sadece kendi başvurusu (musteri/ sayfası) |

### Renk Sistemi (Logo renkleri)
| Değişken | Hex | Kullanım |
|---|---|---|
| `--brand-primary` | `#1E1E8E` | Lacivert — ana renk |
| `--brand-accent` | `#5CB85C` | Yeşil — vurgu rengi |
| `--pub-primary` | `#1E1E8E` | Public sayfalar |
| `--pub-secondary` | `#5CB85C` | Public sayfalar |

### Güvenlik
- Rate limiting: login 5/15dk, API 100/dk
- CORS: CORS_ORIGIN env (production'da domain kilitli)
- JWT: 24h süre, bcrypt hash
- MIME type kontrolü: sadece PDF, JPEG, PNG
- Helmet middleware aktif
- KVKK: veri silme endpoint mevcut

### AI Pipeline
```
1. Müşteri belge yükler → UPLOADED status
2. OCR worker (polling 10s) → Tesseract ile metin çıkar → PARSED status
3. documentAnalysis.job.js → analyzer.service.js → ai.service.js
4. compensation.engine.js (deterministik) → Claude zenginleştirme
5. DB'ye aiAnalysis, extractedJson, estimatedCompensation yazılır → ANALYZED status
```

### Sözleşme AI Pipeline
```
POST /api/contracts/:leadId/generate
→ contract.service.js → Lead verilerini çek
→ ANALYSIS_MODE=mock: şablon kullan
→ ANALYSIS_MODE=real: Claude API (kaza türüne göre dinamik prompt)
→ DB Contract tablosuna content kaydet
```

### Zamanaşımı Kuralları
| Dava Türü | Süre | Yasal Dayanak |
|---|---|---|
| Trafik kazası | kaza tarihi + 2 yıl | TBK Madde 72 |
| İş kazası | kaza tarihi + 10 yıl | SGK 5510 |

Badge renkleri: `<30 gün` → kırmızı, `30–90 gün` → sarı, `90+` → yeşil

### Deploy Planı
| Bileşen | Platform | Durum |
|---|---|---|
| Frontend | Vercel (tedbirge-panel/) | Bekliyor |
| Backend | Railway (tedbirge.ai/ kök) | Bekliyor |
| DB | Supabase PostgreSQL | Hazır |
| Dosyalar | Supabase Storage | SUPABASE_STORAGE_BUCKET env boş |
| Domain | tedbirge.ai | 10 gün sonra alınacak |

### Env Değişkenleri (Tam Liste)
```
DATABASE_URL           — Supabase PostgreSQL
JWT_SECRET             — JWT imzalama
ANTHROPIC_API_KEY      — Claude API (aktif)
ANALYSIS_MODE          — real (aktif)
OCR_PROVIDER           — tesseract
TESSERACT_PATH         — C:\Program Files\Tesseract-OCR\tesseract.exe
PDFTOPPM_PATH          — poppler binary
WHATSAPP_DEFAULT_NUMBER — 905412031609
WHATSAPP_TOKEN         — (boş, mock mod)
WHATSAPP_PHONE_ID      — (boş, mock mod)
NETGSM_USERNAME        — (boş, mock mod)
NETGSM_PASSWORD        — (boş, mock mod)
NETGSM_HEADER          — TEDBIRGE
SMTP_HOST              — smtp.gmail.com
SMTP_PORT              — 587
SMTP_USER              — tedbirge34@gmail.com
SMTP_PASS              — (boş, mock mod)
CORS_ORIGIN            — http://localhost:3000
SUPABASE_STORAGE_BUCKET — (boş, deploy'da doldurulacak)
PORT                   — 5000
```

### Admin Girişi
```
Email: admin@tedbirge.ai
Şifre: Tedbirge2026!
```

### Kalan Öncelikli İşler
1. **Deploy** — Vercel + Railway (GitHub'a yükle)
2. **Domain** — tedbirge.ai (10 gün sonra)
3. **WhatsApp Business API** — Meta Business credentials
4. **SMS** — Netgsm credentials
5. **Email** — Gmail uygulama şifresi (SMTP_PASS)
6. **Supabase Storage** — uploads/ klasörü buluta taşı
7. **Google My Business** kaydı
8. **Instagram/Facebook API** bağlantısı

## Tamamlanan İşler (2026-04-15 — Dokuzuncu Oturum)

### Emsal Yargıtay Kararları
- **`src/services/emsal.service.js`** — Oluşturuldu: `getEmsalKararlar(accidentType)` fonksiyonu; trafik için HD 17 ve HD 4, iş kazası için HD 21 ve HD 9 kararları; 10 mock karar (esas no, karar no, daire, tarih, özet, sonuç, ilgili maddeler)
- **`GET /api/leads/:id/emsal`** — Yeni endpoint; kaza türüne göre ilgili Yargıtay kararlarını döner
- **`leads/[id]/page.tsx`** — "Emsal Yargıtay Kararları" kartı eklendi (kapalı başlar, tıklanınca API'den çeker)

### Kaza Rekreasyon Raporu
- **`src/services/kazaRapor.service.js`** — Oluşturuldu: `generateKazaRaporu(lead)` fonksiyonu; kaza bilgisi, taraflar, kusur analizi (KTK/İSK yasal maddelerle), eksik belgeler listesi, zamanaşımı hesabı, tahmini dava süresi, 2026 ZMSS limitleri
- **`GET /api/leads/:id/kaza-raporu`** — Yeni endpoint
- **`leads/[id]/page.tsx`** — "Kaza Rekreasyon Raporu" kartı eklendi (kapalı başlar, PDF İndir butonu)

### Dilekçe Motoru Güçlendirildi
- **`src/services/ai.service.js`** — `generatePetition()` prompt'una 2026 ZMSS limitleri (ölüm: 1.540.000 TL, sakatlık: 924.000 TL), SGK tavan (270.300 TL), zamanaşımı kuralları eklendi
- 4 yeni dilekçe türü: `INSURANCE_OBJECTION`, `CIVIL_COURT`, `LABOR_COURT`, `SGK_OBJECTION`
- **`GET /api/leads/:id/generate-petition?type=`** — Yeni endpoint (ADMIN/SALES/LAWYER)
- **`leads/[id]/page.tsx`** — "Dilekçe Motoru" kartı eklendi: tür seçimi dropdown, AI ile Oluştur butonu, Kopyala butonu, hukuki uyarı

### .gitignore
- **`.gitignore`** — Proje kökünde oluşturuldu: node_modules, .env, uploads/, .next/, *.log, gorev.md, prisma/dev.db

## Tamamlanan İşler (2026-04-15 — Onuncu Oturum)

### OCR Worker — AI Analiz Otomatik Tetikleme
- **`scripts/ocr-worker.js`** — OCR tamamlandıktan sonra (`PARSED` status) `rerunAnalysis(doc.id)` otomatik çağrılıyor
  - `require("../src/jobs/documentAnalysis.job")` eklendi
  - AI analiz başarısız olursa status `PARSED` kalır (manuel retry mümkün), OCR başarısı korunur
  - Worker test edildi: `node scripts/ocr-worker.js` → başlıyor, DB bağlantısı kuruyor, hata yok

### Türkçe Karakter Düzeltmesi — Upload Middleware
- **`src/middlewares/uploadMiddleware.js`** — `toAsciiSafeFilename()` fonksiyonu güncellendi:
  - Önce explicit Türkçe karakter eşlemesi: ğ→g, Ğ→G, ş→s, Ş→S, ç→c, Ç→C, ö→o, Ö→O, ü→u, Ü→U, ı→i, İ→I
  - Sonra NFKD normalizasyon (diğer diakritikal işaretler için)
  - Eski kod: NFKD tek başına Türkçe harfleri bozmuyordu (ğ, ş, ç → `-` oluyordu)

### Assignment Servisi — Bildirim Doğrulaması
- **`src/services/assignment.service.js`** — Avukat atamada SMS + e-posta + WhatsApp zaten gönderiliyor (mock mod → konsola yazıyor)
  - `sendLawyerAssignedSms`, `sendLawyerAssignedEmail`, `sendLawyerAssignedNotification` hepsi çağrılıyor
  - `.catch()` ile hata sessizce geçiyor; atama işlemi bildirim hatasından etkilenmiyor

## Tamamlanan İşler (2026-04-15 — On Birinci Oturum)

### Panel Komple Yeniden Tasarım

#### AppLayout.tsx — Sidebar Layout
- **`tedbirge-panel/components/layout/AppLayout.tsx`** — Üst çubuk → **sabit sol sidebar** (240px) mimarisine geçildi:
  - Gruplu nav: GENEL, DAVALAR, HUKUK, RAPORLAMA, İÇERİK başlıklarıyla bölünmüş
  - Her nav item: emoji ikon + yazı + aktif halde `#1E1E8E` bg
  - Kullanıcı avatarı + isim + rol badge sidebar'da
  - Mobile: overlay + slide-in sidebar (hamburger butonu)
  - CUSTOMER: minimal layout (sadece logo + çıkış)
  - Alt: Ayarlar (ADMIN) + Çıkış Yap (kırmızı)

#### leads/[id]/page.tsx — 3 Kolon + Sekmeli Yapı
- Eski 1458 satır → temiz, modüler yeniden yazım
- **Üst bar**: breadcrumb + durum badge + hızlı aksiyonlar (durum güncelle, sözleşme, chat)
- **Sol kolon (280px)**: Müvekkil kartı (avatar, telefon, email, şehir, kaza badge, zamanaşımı) · Dava Skoru kartı (büyük sayı, renk bar, tazminat) · Hızlı İşlemler kartı
- **Orta kolon (flex-1)**: 5 sekme
  - Genel Bakış: AI özeti kutusu, kaza özeti grid, hukuki uyarı
  - Belgeler: UploadForm, belge listesi (ikon/durum/tarih), seçili belge AI analizi
  - Hukuki Süreç: sigorta takibi, dava süreci, duruşma takvimi, durum güncelleme formu
  - AI Araçları: Dilekçe Motoru (6 tür, AI ile oluştur, kopyala), Emsal Yargıtay, Kaza Rekreasyon Raporu
  - SGK/UYAP: UYAP sorgu + grid, SGK sorgu + grid, eksik belgeler checklist
- **Sağ kolon (300px)**: Aktivite Akışı timeline · Atanan Avukat kartı · İşlem Notu textarea + kaydet

#### dashboard/page.tsx — Admin + Avukat Dashboard
- Eski 936 satır → ayrı ADMIN ve LAWYER dashboardları
- **ADMIN/SALES**:
  - Header: "İyi günler [Ad]" + tarih + sistem durumu badge
  - Satır 1: 4 metrik (başvuru, aktif, kazanma oranı highlight, ort. tazminat)
  - Satır 2: Son Başvurular tablosu (filtreli: Tümü/Yeni/Analiz/Teklif) + AI Aktivite timeline
  - Satır 3: Dava Hunisi bar chart + Kritik Zamanaşımı listesi + Avukat İş Yükü (win rate bar)
- **LAWYER**:
  - Header: "Hoş Geldiniz, Av. [Ad]" + Dosyalarım butonu
  - 4 metrik + Atanan Dosyalar tıklanabilir tablo + Yaklaşan Zamanaşımı + Son Belgeler

#### globals.css — Panel Yardımcı Sınıflar
- `.panel-card`, `.panel-card-title` — tutarlı kart sistemi
- `.tab-bar`, `.tab-item`, `.tab-item.active` — sekme stilleri
- `.timeline-dot`, `.timeline-line` — aktivite akışı
- `.status-pill` — durum badge
- `.panel-input` — form girdi alanı
- Özel scrollbar stilleri eklendi

#### TypeScript
- `npx tsc --noEmit` → **EXIT:0** (hata yok)

---

## Tamamlanan İşler (2026-04-15 — On İkinci Oturum)

### Hafta 1 — Kritik Düzeltmeler ve Temel Modüller (gorev.md)

#### 1. Belge İndirme 404 Düzelt
- **`src/routes/document.routes.js`** — Yeni oluşturuldu: `GET /:id/download`
- **`src/controllers/document.controller.js`** — Yeni oluşturuldu: DB'den belge bulur, dosyayı `fs.createReadStream` ile `Content-Disposition: attachment` header'ıyla döner; LAWYER rolü atama kontrolü yapar
- **`src/routes/index.js`** — `/documents` route eklendi

#### 2. Prisma Schema — 5 Yeni Model
- **`prisma/schema.prisma`** — Eklenen modeller:
  - `IhtarnameTakip` — karşı taraf, tür, durum, gönderim/cevap tarihi, notlar
  - `DavaSurec` — aşama, mahkeme, dosya no, bilirkişi, uzlaşma, karar, istinaf, yargıtay, icra takibi
  - `Durusma` — tarih, mahkeme, saat, tür, açıklama, hatırlatıldı flag
  - `Bilirkisi` — atama/teslim/rapor tarihi, AI analizi, itiraz bilgisi
  - `Masraf` — tür, tutar, tarih, açıklama, ödendi flag
- `Lead` modeline 5 yeni ilişki eklendi
- `npx prisma db push` → **başarılı** (tabloler oluşturuldu)

#### 3. Backend Servis + Controller + Route
- **`src/services/ihtarname.service.js`** — list, create, update
- **`src/services/davaSurec.service.js`** — get, upsert, updateAsama
- **`src/services/durusma.service.js`** — list, create, delete, getUpcoming (cron için), markHatirlatildi
- **`src/services/bilirkisi.service.js`** — list, create, update, AI rapor analizi (mock/real mod)
- **`src/services/masraf.service.js`** — list, create
- **`src/controllers/hukuk.controller.js`** — tüm 5 modül için handler'lar
- **`src/routes/hukuk.routes.js`** — 14 endpoint (GET/POST/PATCH/DELETE)
- **`src/routes/index.js`** — `/leads` prefix ile hukuk route'u eklendi

#### 4. Duruşma Cron Job
- **`src/jobs/deadlineChecker.job.js`** — `runDurusmaCheck()` fonksiyonu eklendi:
  - Her sabah 08:00'de `getUpcomingDurusmalar(3)` çağırır
  - 3 gün içindeki duruşmalar için avukata SMS + e-posta
  - `markHatirlatildi` ile tekrar bildirimi önler

#### 5. Frontend leads/[id]/page.tsx — Hukuki Süreç Sekmesi
- 5 yeni aç/kapat kartı eklendi (hepsi kapalı başlar):
  - **İhtarname Takibi** — form + durum butonları (6 durum) + liste
  - **Dava Süreci** — aşama dropdown (10 aşama) + grid form + checkbox'lar
  - **Duruşma Takvimi** — form + renkli liste (kırmızı=yakın, sarı=normal, gri=geçmiş) + sil
  - **Bilirkişi Takip** — form + AI Analiz Et butonu + rapor/itiraz alanları
  - **Masraf Takibi** — tür dropdown + toplam hesabı
- Tab açılışında `handleHukukiTabOpen()` tüm verileri paralel yükler
- İlgili state + loader + action fonksiyonları eklendi

#### 6. Admin Dashboard — Satır 4 Widget'ları
- **`dashboard/page.tsx`** — 4 yeni widget eklendi (SATIR 4, 4 kolon):
  - **Dava Aşama Dağılımı** — lead status dağılımı
  - **Bu Haftaki Duruşmalar** — aktif lead'lerden 7 gün içindeki duruşmalar
  - **Bekleyen İhtarname** — GONDERILDI/CEVAP_BEKLENIYOR durumundakiler
  - **Bilirkişi Bekleyenler** — raporu gelmeyen + teslim tarihi olanlar

#### TypeScript
- `npx tsc --noEmit` → **EXIT:0** (hata yok)

---

## YENİ SOHBET BAŞLANGIÇ NOTU (2026-04-15 Son Durum)

### Genel Tamamlanma: %58

### Bir Sonraki Sohbette Yapılacaklar (Öncelik Sırası):

FAZ 1 - ADMIN CRM TAM DONUSUM:
- Dashboard: gercek zamanli metrikler, gelir tahmini, avukat is yuku grafigi
- Lead listesi: Kanban view + tablo view, surukle-birak durum
- Musteri 360: tum gecmis, belgeler, dilekce, odeme tek ekran
- Pipeline: hangi asamada kac dava
- Gelir takibi: tazminat komisyon hesabi
- Avukat performans dashboard
- Toplu islemler: coklu secim, toplu atama
- Guclu arama ve filtre

FAZ 2 - HUKUKCU PANELI PROFESYONEL CRM:
- Gunluk ajanda gorunumu
- Dava karti: tum bilgi tek bakista
- Sigorta muzakere akisi: ihtarname-cevap-teklif-kabul dongusu
- Dilekce arsivi: versiyonlar, gonderim durumu
- Bilirkisi takip zinciri
- Takvim entegrasyonu
- Muvekkil iletisim merkezi

FAZ 3 - MUVEKKIL PORTALI:
- Dava timeline animasyonlu
- Belge merkezi
- Avukat mesajlasma
- Dijital SMS onay
- Odeme takibi

FAZ 4 - MOBIL UYGULAMA:
- Once PWA (1-2 hafta): manifest.json, service worker, push notification
- Sonra React Native Expo: avukat + muvekkil uygulamasi
- Kamera ile belge tarama
- App Store + Play Store

FAZ 5 - GERCEK API ENTEGRASYONLARI:
- WhatsApp Business API (WHATSAPP_TOKEN + WHATSAPP_PHONE_ID girilecek)
- SMS: Netgsm credentials
- Email: Gmail SMTP sifresi
- TRAMER: SBGM basvurusu
- E-imza: Turktrust veya e-devlet KEP
- Google Takvim API
- Supabase Storage (uploads/ buluta taşınacak)

### Kritik Env Eksikler:
```
WHATSAPP_TOKEN=         (boş - mock)
NETGSM_USERNAME=        (boş - mock)
SMTP_PASS=              (boş - mock)
SUPABASE_STORAGE_BUCKET= (boş - deploy'da)
```

---

## Tamamlanan İşler (2026-04-15 — On Dördüncü Oturum)

### FAZ 1 — Admin CRM Dönüşümü

#### Backend Yeni Endpoint'ler
- **`GET /api/analytics/monthly-trend`** — Son N ay (default 6) aylık lead ve WON sayısı trendi; `analytics.service.js` + `analytics.controller.js` + `analytics.routes.js` güncellendi
- **`POST /api/leads/bulk-update`** — Toplu durum değiştirme ve toplu avukat atama; `lead.service.js::bulkUpdateLeads()` + `lead.controller.js::bulkUpdate` + `lead.routes.js` güncellendi
  - `action: "status"` → tüm seçili lead'lere yeni durum yaz + ActivityLog (BULK_STATUS_CHANGED)
  - `action: "assign"` → tüm seçili lead'lere avukat ata + Assignment oluştur + BULK_LAWYER_ASSIGNED log

#### Leads Sayfası — Komple Yeniden Yazım (`leads/page.tsx`)
- **Tablo / Kanban toggle** — Sağ üstte ☰ Tablo / ⊞ Kanban butonu; görünüm state ile değişiyor
- **Kanban görünümü** — 10 durum sütunu (yatay kaydırmalı), her kart sürükle-bırak ile durum değiştiriyor
  - HTML5 Drag & Drop API (lib bağımlılığı yok)
  - Optimistic update: sürüklenince hemen state güncellenir, API başarısızsa geri döner
  - Her kartta: müvekkil baş harfi avatar, lead kodu, kaza türü ikon, tazminat, zamanaşımı badge
- **Çoklu seçim** — Her satır/kart yanında checkbox; tümünü seç/bırak; seçili sayı header'da gösterilir
- **Bulk action bar** — Seçim varken ekranın altında sabit bar:
  - "Durum Değiştir ▾" dropdown (10 durum)
  - "Avukata Ata ▾" dropdown (mevcut avukatlar)
  - "✕ Temizle" butonu
  - İşlem sonrası toast bildirimi
- **LeadRow bileşeni** — Checkbox entegreli, zamanaşımı badge, tazminat rengi
- **`LeadTable` bağımlılığı kaldırıldı** — Sayfa kendi satır bileşenini kullanıyor

#### Dashboard — Aylık Trend Widget (`dashboard/page.tsx`)
- **SATIR 3.5** olarak dava hunisi ile SATIR 4 arasına eklendi
- Son 6 ayın aylık başvuru + kazanılan sayısını bar chart olarak gösteriyor
- Çift bar (lacivert=toplam, yeşil=kazanılan), hover'da tooltip
- `monthlyTrend` state + `/analytics/monthly-trend` API çağrısı eklendi

### FAZ 2 — Avukat Ajanda Sayfası

#### Yeni Sayfa (`dashboard/ajanda/page.tsx`)
- **URL:** `/dashboard/ajanda` — LAWYER rolüne özel
- **Özet kartlar** (4 adet): Aktif Dosya · Bugünkü Duruşma · Bu Hafta Duruşma · Kritik Zamanaşımı
- **Bugünkü Duruşmalar** — saat bazlı sıralı liste; boşsa ✅ mesajı
- **Bu Hafta Duruşmalar** — kalan gün sayısı renk kodlu (kırmızı/sarı/yeşil); bugünse koyu mavi vurgu
- **Kritik Zamanaşımı** — 90 gün altındaki dosyalar, ≤30 kırmızı, ≤90 sarı
- **Aktif Dosyalar** — durum badge + zamanaşımı pill + tazminat
- **Bekleyen Belgeler** — OCR/analiz bekleyen belgeler; hızlı erişim

#### AppLayout Nav Güncellemesi
- **LAWYER rolü için "Günlük Ajanda" (📅)** linki DAVALAR grubu altına eklendi (`/dashboard/ajanda`)

#### TypeScript
- `npx tsc --noEmit` → **EXIT:0** (hata yok)

---

## Tamamlanan İşler (2026-04-15 — On Beşinci Oturum)

### FAZ 1 & 2 — Takvim, Müzakere Akışı, Komisyon

#### Backend Yeni Endpoint'ler
- **`GET /api/analytics/calendar?year=&month=`** — Aylık takvim: o aya ait tüm duruşmalar + zamanaşımı kritik lead'ler; gün bazında gruplu `byDay` nesnesi döner
- **`GET /api/analytics/komisyon`** — WON lead'ler için komisyon özeti: her lead'in `komisyonOrani` (default %20) × `estimatedCompensation`; toplam ve ortalama komisyon
- **`prisma/schema.prisma`** — `IhtarnameTakip` modeline `teklifTutari Float?` + `teklifTarihi DateTime?` eklendi; `Lead` modeline `komisyonOrani Float? @default(20)` eklendi; `db push` başarılı
- **`ihtarname.service.js`** — `updateIhtarname()` artık `teklifTutari` ve `teklifTarihi` alanlarını işliyor

#### Takvim Sayfası (`dashboard/takvim/page.tsx`)
- **URL:** `/dashboard/takvim` — ADMIN, SALES, LAWYER
- Aylık grid (Pazartesi başlangıç), ay navigasyonu ← →
- Her günde: duruşma kartları (mavi) + zamanaşımı uyarıları (kırmızı/turuncu)
- Gün tıklama → sağ panelde saat/mahkeme detayı + zamanaşımı kalan gün
- Sağ panel: Seçilen gün detayı · Bu ay özeti (toplam duruşma/kritik) · Bu aydaki tüm duruşmalar listesi
- Bugün tarihi lacivert daire ile işaretli

#### Sigorta Müzakere Akışı — Görsel Stepper (`leads/[id]/page.tsx`)
- **"📨 İhtarname Takibi"** → **"📨 Sigorta Müzakeresi"** olarak yeniden adlandırıldı
- Her ihtarname için 6 adımlı görsel stepper:
  `Hazırlık → Gönderildi → Cevap Bekleniyor → Cevap Geldi → Teklif Alındı → Kabul Edildi`
- Tamamlanan adımlar yeşil ✓, aktif adım lacivert, gelmeyenler gri
- Terminal durumlar ayrı butonlar: **❌ Reddedildi** · **⚖️ Mahkemeye**
- **`IhtarnameTeklifForm`** bileşeni: durum `TEKLIF_ALINDI` veya `CEVAP_GELDI` olduğunda teklif tutarı + tarihi giriş formu görünür; `PATCH` ile kaydeder
- Başlık satırında aktif durum renk kodlu badge

#### AppLayout Nav Güncellemesi
- **"🗓️ Takvim"** linki ADMIN/SALES/LAWYER için DAVALAR grubu altına eklendi (`/dashboard/takvim`)

#### TypeScript
- `npx tsc --noEmit` → **EXIT:0** (hata yok)

---

## Tamamlanan İşler (2026-04-15 — On Yedinci Oturum)

### gorev.md — 5 Görev Tamamlandı

#### GÖREV 1: Login Sayfası Yeniden Yapılandırma
- **`tedbirge-panel/app/(public)/page.tsx`** — PublicNav dropdown: Yönetici/Temsilci/Hukukçu seçenekleri; "📂 Dava Takibi" butonu → `/basvuru-sorgula`
- **`tedbirge-panel/app/(public)/login/page.tsx`** — Komple yeniden yazıldı:
  - 3 rol: `yonetici` (🔐), `temsilci` (👤), `hukukcu` (⚖️)
  - `?rol=` query param'dan başlangıç rolü belirlenir
  - 3-kolon rol seçici grid, aktif rol vurgulu
  - "Dava Takibine Git →" linki

#### GÖREV 2: Hukukçu ve Temsilci Kayıt Sayfaları
- **`prisma/schema.prisma`** — `REPRESENTATIVE` rol eklendi; `PhoneOtp` modeli (phone, code, purpose, expiresAt); User modeline `baroSicilNo`, `uzmanlik`, `hukukcuKomisyon`, `primOrani`, `bolge` alanları; Lead modeline `maluliyetOrani`, `kusurOrani`, `gercekTazminat`, `yaralanmaTuru` eklendi
- **`src/services/auth.service.js`** — `register()` yeni alanları işliyor
- **`src/controllers/auth.controller.js`** — `sendRegistrationOtp`, `registerHukukcu`, `registerTemsilci` handler'ları eklendi
- **`src/routes/auth.routes.js`** — 3 yeni public route (OTP + kayıt)
- Tüm route dosyaları — `REPRESENTATIVE` rolü tüm `role()` kontrollerine eklendi
- **`tedbirge-panel/app/(public)/register/hukukcu/page.tsx`** — 3 adımlı wizard: Hizmet Sözleşmesi modal, KVKK modal, SMS OTP
- **`tedbirge-panel/app/(public)/register/temsilci/page.tsx`** — 3 adımlı wizard: Temsilcilik Sözleşmesi modal, KVKK modal, SMS OTP

#### GÖREV 3: LexScan AI Asistanı
- **`src/controllers/lexscan.controller.js`** — Oluşturuldu: Türkçe hukuk sistem promptu, claude-sonnet-4-6, max 600 token, son 10 mesaj bağlamı, `ANTHROPIC_API_KEY` yoksa mock fallback
- **`src/routes/lexscan.routes.js`** — `POST /chat` (public)
- **`src/routes/index.js`** — `/lexscan` route eklendi
- **`tedbirge-panel/components/AiChatWidget.tsx`** — Komple yeniden yazıldı: gerçek API çağrısı, "LexScan AI" başlık + model etiketi, yazıyor animasyonu (3 nokta), otomatik scroll, hızlı sorular

#### GÖREV 4: Otomatik Bildirim Akışı
- **`src/services/lead.service.js`** — `createLead()`: başvuru SMS + ActivityLog BILDIRIM_GONDERILDI
- **`src/jobs/documentAnalysis.job.js`** — AI analiz tamamlandığında SMS + WhatsApp + Push + ActivityLog
- **`src/services/assignment.service.js`** — Atama bildirimlerine ActivityLog eklendi
- **`src/services/ihtarname.service.js`** — Komple yeniden yazıldı: teklif durumlarında (TEKLIF_ALINDI/CEVAP_GELDI) SMS + WhatsApp + Push + ActivityLog

#### GÖREV 5: Gerçek Maluliyet Hesaplama
- **`src/services/maluliyet.service.js`** — Oluşturuldu:
  - 30+ yaralanma türü AMA tablosu (beyin, omurga, ekstremite, göz, organlar, yanık, psikiyatri)
  - PMF tablosu (yaş 20→36, 25→34, ..., 70→5)
  - `hesaplaTazminat({ yas, aylikGelir, maluliyetOrani, kusurOrani, olumDavasi })`: brüt/net hesaplama, manevi tazminat, ZMSS limiti kontrolü (yaralanma: 924.000 TL, ölüm: 1.540.000 TL)
- **`src/controllers/maluliyet.controller.js`** — 3 handler: yaralanma türleri, hesapla, lead güncelle
- **`src/routes/maluliyet.routes.js`** — GET yaralanma-turleri, POST hesapla, PATCH leads/:id/maluliyet
- **`src/routes/index.js`** — `/maluliyet` route eklendi
- **`tedbirge-panel/types/lead.ts`** — `age`, `monthlyIncome`, `maluliyetRate`, `faultRate`, `maluliyetOrani`, `kusurOrani`, `gercekTazminat`, `yaralanmaTuru` eklendi
- **`leads/[id]/page.tsx`** — "🧮 Maluliyet Hesaplama" kartı: AMA dropdown, PMF otomatik, tazminat aralığı, kaydet
- **`musteri/page.tsx`** — Tazminat aralığı (±%20) gösterimi; kesin tutar gizli

#### WhatsApp Webhook (FAZ 5 devamı)
- **`src/routes/whatsapp.routes.js`** — GET `/webhook` (Meta doğrulama) + POST `/webhook` (gelen mesajlar + delivery status, ChatMessage + ActivityLog kaydı)
- **`.env.example`** — `WHATSAPP_APP_SECRET`, `WA_TEMPLATE_*`, `SMTP_REPLY_TO`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN` eklendi

#### TypeScript
- `npx tsc --noEmit` → **EXIT:0** (hata yok)

---

## Tamamlanan İşler (2026-04-16 — On Sekizinci Oturum)

### Rol Bazlı Erişim Kontrolü (RBAC) — Güvenlik Kapama

#### Sorun
16 kritik RBAC açığı tespit edildi: REPRESENTATIVE tüm lead'leri görüyordu, CUSTOMER başka müvekkillerin sözleşmelerini indirebiliyordu, herhangi bir authenticated kullanıcı lead durumunu değiştirebiliyordu.

#### Merkezi Erişim Katmanı
- **`src/utils/leadAccess.js`** — Yeni dosya oluşturuldu:
  - `assertLeadAccess(user, lead)` — tüm roller için erişim doğrular, izin yoksa `ApiError(403)` fırlatır
  - `leadWhereByRole(user)` — `listLeads` gibi toplu sorgularda Prisma `where` fragment'i döner
  - Kural tablosu: ADMIN/SALES → tam erişim; LAWYER → Assignment tablosunda ACTIVE kaydı; REPRESENTATIVE → `lead.createdById === user.id`; CUSTOMER → `lead.ownerId === user.id`

#### Schema Değişikliği
- **`prisma/schema.prisma`** — Lead modeline `createdById String?` + `createdByUser User? @relation("LeadCreatedBy")` eklendi; User modeline `createdLeads Lead[]` eklendi
- `npx prisma db push` → Supabase'e uygulandı

#### Servis Katmanı Düzeltmeleri
- **`src/services/lead.service.js`**: `listLeads()` → `leadWhereByRole()`; `getLeadById()` → `assertLeadAccess()`; `updateLeadStatus()` user param + CUSTOMER bloğu; `createLead()` `createdById` parametresi; `bulkUpdateLeads()` REPRESENTATIVE ownership filtresi
- **`src/services/assignment.service.js`** — REPRESENTATIVE sadece `createdById === caller.id` olan lead'lere avukat atayabilir

#### Controller + Route Düzeltmeleri
- **`src/controllers/hukuk.controller.js`** — Tüm handler'lara `requireLeadAccess()` eklendi (ihtarname, davaSurec, duruşma, bilirkişi, masraf)
- **`src/controllers/document.controller.js`** — `assertLeadAccess()` ile tüm roller kontrol ediliyor
- **`src/controllers/contract.controller.js`** — `generate`, `listByLead`, `update`, `getPdf` erişim kontrolü
- **`src/controllers/petition.controller.js`** — tüm 5 handler erişim kontrolü
- **`src/controllers/maluliyet.controller.js`** — `updateLeadMaluliyet` erişim kontrolü
- **`src/routes/lead.routes.js`** — `PATCH /:id/status` artık `role("ADMIN","SALES","REPRESENTATIVE","LAWYER")` gerektiriyor
- `node syntax check` + `npx tsc --noEmit` → **EXIT:0** | `git push` → `6fb1c38`

---

## Tamamlanan İşler (2026-04-16 — On Dokuzuncu Oturum)

### Framer Motion Premium Animasyonlar (gorev.md)

#### Navbar Scroll Animasyonu
- **`app/(public)/page.tsx`** — `PublicNav` bileşenine scroll listener eklendi:
  - `scrolled` state: `window.scrollY > 50` eşiğinde true
  - Scroll altında: transparan arka plan
  - Scroll üstünde: `backdrop-blur-xl`, `bg-white/10`, `border-white/10`, `shadow-lg`
  - `transition: all 0.3s ease` inline style ile

#### Hero Bireysel Animasyonlar
- Logo: `scale 0.8→1, opacity 0→1, 0.4s`
- "Tazminat Hakkınızı" h1: `y 40→0, opacity 0→1, delay 0.4s`
- "Yapay Zeka ile Öğrenin" h1: `y 40→0, opacity 0→1, delay 0.6s` (ayrı `motion.h1`)
- Alt yazı: `y 20→0, opacity 0→1, delay 0.8s`
- Butonlar container: `y 20→0, opacity 0→1, delay 1.0s`
- Tüm animasyonlarda ease: `[0.25, 0.1, 0.25, 1]`

#### useCountUp Hook
- `useCountUp(val, inView)` — `IntersectionObserver` (framer `useInView`) + `animate()`, 2s easeOut
- `StatCounter` bileşeni bu hook'u kullanıyor; `motion.div` ile kendi fade animasyonu var

#### Bölüm Geçişleri (Scroll-triggered)
- `SectionReveal` wrapper bileşeni: `whileInView opacity 0→1, y 30→0`, `viewport: once:true, margin:-100px`
- `containerVariants` + `cardVariants`: `staggerChildren: 0.1s`
- Uygulanan: HowItWorks, Features, Testimonials, News, CTA, Footer başlıkları

#### AnimatePresence — Sayfa Geçişleri
- **`app/(public)/layout.tsx`** — `"use client"` + `usePathname` key + `AnimatePresence mode="wait"`:
  - Giriş: `opacity 0→1, y 10→0, 0.3s`
  - Çıkış: `opacity 0, 0.2s`
- **`app/(panel)/layout.tsx`** — Aynı yapı: giriş `y 6→0, 0.2s`

#### Buton Efektleri
- "Ücretsiz Başvur": `whileHover scale 1.05`, `whileTap scale 0.95`, pulse `boxShadow` animasyonu
- Login dropdown + mobil menü: `AnimatePresence` slide animasyonu (height 0→auto)

### Sosyal Medya Entegrasyonu (gorev.md)

#### SVG İkonlar
- **`public/`** — `whatsapp.svg`, `instagram.svg`, `facebook.svg`, `linkedin.svg`, `twitter.svg` oluşturuldu

#### Floating WhatsApp Butonu
- **`app/(public)/layout.tsx`** — `FloatingWhatsApp` bileşeni: sağ alt köşe, yeşil (#25D366), pulse ring animasyonu
- `NEXT_PUBLIC_WHATSAPP_NUMBER` env yoksa gizlenir

#### Footer Sosyal Medya
- **`app/(public)/page.tsx`** — Footer sol kolona sosyal medya ikonları: `SOCIAL_LINKS` dizisinden env'de tanımlı olanlar gösterilir, `whileHover: scale 1.15`

#### ENV
- **`tedbirge-panel/.env.local`** — `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_FACEBOOK_URL`, `NEXT_PUBLIC_LINKEDIN_URL`, `NEXT_PUBLIC_TWITTER_URL`, `NEXT_PUBLIC_YOUTUBE_URL` eklendi
- **`tedbirge-panel/.env.local.example`** — Aynı değerler eklendi

---

## Tamamlanan İşler (2026-04-16 — Yirminci Oturum)

### Supabase Storage (gorev.md)
- **`src/services/storage.service.js`** — Yeni servis: `uploadFile`, `downloadFile`, `getPublicUrl`, `deleteFile`
  - `SUPABASE_STORAGE_BUCKET` env yoksa lokal `uploads/` fallback
  - `@supabase/supabase-js` paketi eklendi

### Admin 2FA — speakeasy TOTP (gorev.md)
- **`prisma/schema.prisma`** — `User` modeline `twoFactorSecret String?` + `twoFactorEnabled Boolean @default(false)` eklendi
- **`src/controllers/auth.controller.js`** — 4 yeni handler:
  - `setup2fa`: secret üretir, QR kod döner
  - `verify2fa`: TOTP doğrular, `twoFactorEnabled: true` yapar
  - `disable2fa`: TOTP ile doğrulayıp devre dışı bırakır
  - `loginVerify2fa`: login ikinci adımı — `tempToken` + OTP → gerçek JWT
- **Login akışı**: 2FA aktifse 5 dakika ömürlü `tempToken { type: "2fa_pending" }` döner
- **`src/routes/auth.routes.js`** — `POST /setup-2fa`, `/verify-2fa`, `/disable-2fa`, `/login-2fa` eklendi
- `speakeasy` + `qrcode` paketleri kuruldu

### PayTR Ödeme Altyapısı (gorev.md)
- **`src/services/payment.service.js`** — PayTR iFrame API: `createPayment`, `verifyCallback`, `refundPayment`
  - `PAYTR_MERCHANT_ID/KEY/SALT` yoksa mock mod (konsola yazar)
- **`src/controllers/payment.controller.js`** — `initiatePayment`, `paymentCallback`, `getPaymentStatus`, `refund`
- **`src/routes/payment.routes.js`** — `POST /callback` (public), `/leads/:leadId/initiate`, `/leads/:leadId/status`, `/leads/:leadId/refund`
- **`prisma/schema.prisma`** — `Lead` modeline `odemeDetay String?` eklendi (JSON: merchantOid, paymentAmount, status, paidAt)
- **`tedbirge-panel/app/(panel)/leads/[id]/odeme/page.tsx`** — Ödeme sayfası: tutar gir → PayTR iFrame; mock mod uyarısı; iade butonu
- **`.env`** — `PAYTR_MERCHANT_ID=`, `PAYTR_MERCHANT_KEY=`, `PAYTR_MERCHANT_SALT=`, `BACKEND_URL=http://localhost:5000` eklendi

### Hukukçu/Temsilci Baro Onay Akışı (gorev.md)
- **`prisma/schema.prisma`** — `User` modeline `baroOnayDurumu String? @default("BEKLEMEDE")` + `temsilciOnayDurumu String? @default("BEKLEMEDE")` eklendi
- **`src/services/auth.service.js`** — `register()`: LAWYER → `baroOnayDurumu: "BEKLEMEDE"`, REPRESENTATIVE → `temsilciOnayDurumu: "BEKLEMEDE"`; `login()`: BEKLEMEDE/REDDEDILDI ise `ApiError(403)`
- **`src/controllers/onay.controller.js`** — `listHukukcuOnay`, `onaylaHukukcu`, `reddetHukukcu`, `listTemsilciOnay`, `onaylaTemsilci`, `reddetTemsilci`
- **`src/routes/onay.routes.js`** — ADMIN only PATCH onay/reddet endpoint'leri
- **`tedbirge-panel/app/(panel)/dashboard/hukukcu-onay/page.tsx`** — Bekleyenler (amber kart + onay/red butonları + sebep input) + geçmiş tablo
- **`tedbirge-panel/app/(panel)/dashboard/temsilci-onay/page.tsx`** — Aynı yapı temsilciler için
- **`AppLayout.tsx`** — HUKUK grubuna "✅ Hukukçu Onay" + "🤝 Temsilci Onay" linkleri eklendi (ADMIN)
- `prisma db push` → başarılı; `npx tsc --noEmit` → EXIT:0; `npm audit fix --force` → 0 vulnerability

---

## Tamamlanan İşler (2026-04-16 — Yirmi Birinci Oturum)

### Hakkımızda Sayfası (gorev.md)
- **`tedbirge-panel/app/(public)/hakkimizda/page.tsx`** — 6 bölümlü animasyonlu sayfa:
  - **Hero**: lacivert bg, logo scale-in, başlık/alt yazı fade-up
  - **Vizyon**: 2 kolonlu, madde listesi (✓), `SectionReveal` wrapper
  - **Misyon**: alıntı kartı (lacivert) + açıklama; kolon sırası mobilde değişir
  - **Değerler**: 6 kart grid, `staggerChildren 0.1s`, `whileHover y: -4`
  - **Sayılar**: lacivert bg, 4 animasyonlu `AnimCounter` (4200+, 42M+, %91, 500+)
  - **Ekip**: 3 placeholder kart (baş harf avatarı + isim/unvan placeholder + kariyer CTA)
  - **CTA**: yeşil banner (#5CB85C), `whileHover scale 1.05`
- **`app/(public)/page.tsx`** — Desktop ve mobil navbar'a "Hakkımızda" linki eklendi

---

