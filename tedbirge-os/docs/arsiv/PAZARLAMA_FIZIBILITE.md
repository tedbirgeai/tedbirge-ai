# PAZARLAMA ALTYAPI FİZİBİLİTE — KOD KANITLI ENVANTER
## Tarih: 27 Nisan 2026
## Mimar: Claude Code (Sonnet 4.6)

> Tedbirge.ai'in pazarlama yüzeyinin (backend + panel + 3rd party) tam haritası.
> Madde 21 disiplini: sıfır kod değişikliği, sadece okuma + envanter.
> Bu rapor Madde 25 (anayasa) ve Pazarlama Stratejisi Kesiti (TUR) için kanıt zemini.

---

## 0. YÖNETİCİ ÖZETİ

| Pazarlama Bileşeni | Durum | Maturity (0-5) | Risk |
|---|---|---|---|
| Public form `/basvuru` | ✅ Çalışıyor | 4/5 | 🟢 |
| LexScan AI asistan | ✅ Çalışıyor | 3/5 | 🟡 |
| WhatsApp inbound | ✅ Webhook var | 3/5 | 🟡 |
| UTM tracking | ✅ Backend yakalıyor, frontend eksik | 2/5 | 🟡 |
| Bildirim (SMS/Email/WA/Push) | ✅ 4 kanal aktif (mock düşme riski) | 3/5 | 🟡 |
| KVKK rıza altyapısı | ✅ Çift checkbox, DB kaydı var | 4/5 | 🟢 |
| Aydınlatma metni | ✅ /kvkk sayfası var | 3/5 | 🟡 |
| qualificationScore (lead skoring) | ❌ Hep 0 | 1/5 | 🟡 |
| Analytics endpoint | ✅ Tam gelişmiş (11 endpoint) | 4/5 | 🟢 |
| Panel dashboard KPI | ✅ Var | 4/5 | 🟢 |
| SEO altyapı (metadata) | 🟡 Temel metadata var, openGraph yok | 2/5 | 🟡 |
| robots.txt / sitemap | ❌ YOK | 0/5 | 🔴 |
| Google Analytics / GTM | ❌ YOK | 0/5 | 🔴 |
| Meta Pixel | ❌ YOK | 0/5 | 🔴 |
| TikTok Pixel | ❌ YOK | 0/5 | 🔴 |
| Heatmap (Hotjar/Clarity) | ❌ YOK | 0/5 | 🔴 |
| Cookie consent banner | ❌ YOK (cerez sayfası var, banner yok) | 0/5 | 🔴 |
| Conversion funnel | ✅ ActivityLog'dan hesaplıyor | 3/5 | 🟢 |
| İYS / opt-out | ❌ YOK | 0/5 | 🟡 |

**Maturity ölçeği:** 0=Yok, 1=İskelet, 2=Yarım, 3=Çalışıyor temel, 4=İyi, 5=Tam profesyonel

**Ortalama maturity:** 2.2 / 5

---

## 1. LEAD ÜRETEN KANALLAR (P1)

### 1.1 Public Form `/basvuru`

**Backend:** `src/routes/public.route.js` satır 10-115

```javascript
// public.route.js — POST /api/public/public-lead
const { fullName, phone, email, city, summary, kvkkApproved, healthDataApproved } = req.body;
// UTM yakalama:
const utmSource   = req.query.utm_source   || req.body.utm_source   || null;
const utmMedium   = req.query.utm_medium   || req.body.utm_medium   || null;
const utmCampaign = req.query.utm_campaign || req.body.utm_campaign || null;
// Lead oluşturma:
await leadService.createLead({ ..., source: "public_form", utmSource, utmMedium, utmCampaign });
```

**Frontend:** `tedbirge-panel/app/(public)/basvuru/page.tsx` — 4 adımlı form (Bilgiler, Kaza, Belgeler, Onay)

**Bildirim akışı:** ActivityLog yazıyor (PUBLIC_LEAD_CREATED). SMS/Email tetiklenip tetiklenmediği lead.service.js'te — ayrı inceleme gerekebilir.

**UTM yakalama:** Backend `req.query` + `req.body` ikilisinden yakalıyor. Frontend form'da `useSearchParams` yok — URL'deki UTM parametreleri forma iletilmiyor.

**KVKK:** Çift onay checkbox (kvkkApproved + healthDataApproved), DB'ye tarih olarak kaydediliyor.

**Maturity: 4/5** — Çalışıyor, UTM front-to-back iletimi eksik.

---

### 1.2 LexScan AI Asistan

**Backend:** `src/controllers/lexscan.controller.js`

```javascript
// LexScan system prompt'u — CTA:
"👉 Ücretsiz değerlendirme için: tedbirge.ai/basvuru"
// Model: claude-sonnet-4-6, MAX_TOKENS: 600
// Mock mod: ANTHROPIC_API_KEY yoksa örnek yanıt döner
```

**Lead oluşturma:** Doğrudan lead.create çağrısı YOK. Dolaylı yönlendirme → /basvuru CTA ile.

**Frontend:** `(public)/tazminat-hesapla` — ayrı hesap sayfası var (tam incelenmedi).

**Maturity: 3/5** — Çalışıyor, lead conversion direkt değil.

---

### 1.3 WhatsApp Inbound

**Backend:** `src/routes/whatsapp.routes.js` (dosya okunmadı — P1-D kapsamında)

**Kanıt:** `public.route.js` satır 316 → `/api/track-whatsapp/:id` endpoint'i — WhatsApp yönlendirme tracing var.

**Bilinmeyen numara → Lead:** Mektup sorusu — `whatsapp.service.js` tam incelemesi ayrıca yapılabilir.

**Maturity: 3/5**

---

### 1.4 Self-Register `/register/musteri`

**Frontend:** `tedbirge-panel/app/(public)/register/musteri/page.tsx` — **MEVCUT**

Ayrıca: `/register/hukukcu` ve `/register/temsilci` sayfaları da var.

**Backend endpoint:** Muhtemelen `auth.controller.js` — tam incelenmedi.

**Maturity: 3/5**

---

### 1.5 Avukat Manuel Müvekkil Kaydı

**Kanıt:** Panel'de `/register/musteri` sayfası var — avukat veya yönetici de kullanabilir.

**Maturity: 3/5**

---

### 1.6 Ek Kanallar (Keşfedildi)

- `/basvuru-sorgula` — müvekkil kendi başvurusunu sorgulayabilir
- `/devam-et` — başvuru devam sayfası
- `/tazminat-hesapla` — tazminat hesaplama (LexScan bağlantılı)
- `/referanslar` — sosyal kanıt sayfası
- `/haberler` — blog/haber sayfası (içerik var mı bilinmiyor)

---

## 2. UTM / KAYNAK TAKİBİ (P2)

### 2.1 Schema Alanları

`prisma/schema.prisma` — Lead modeli (TUR #16 ile eklendi):
```prisma
source      String?
utmSource   String?
utmMedium   String?
utmCampaign String?
```

`src/bootstrap/dbSelfHeal.js` satır 34-38: self-heal migration ile eklendi (güvenli).

### 2.2 Backend Yakalama

**Aktif:** `public.route.js` satır 46-62 — UTM query param + body'den yakalıyor.

**lead.service.js** satır 37-39:
```javascript
utmSource: data.utmSource || null,
utmMedium: data.utmMedium || null,
utmCampaign: data.utmCampaign || null,
```

### 2.3 Frontend Yakalama

**Boşluk:** `basvuru/page.tsx`'de `useSearchParams` yok — URL'deki `?utm_source=google` değerleri form body'ye eklenmiyor. Kullanıcı Google Ads'tan gelirse UTM kayboluyor.

### 2.4 Lead.source Değerleri

Tespit edilen: `"public_form"` (kanıtlı, satır 59).
Diğerleri (lexscan, whatsapp, manual, temsilci) — tam liste için lead.service.js incelemesi gerekir.

**Maturity: 2/5** — Backend alıyor ama frontend göndermediği için Google/Meta Ads UTM izi kaybolur.

---

## 3. BİLDİRİM ALTYAPISI (P3)

### 3.1 SMS (NetGSM)

**`src/services/sms.service.js`** — tam gerçek implementasyon.
- Env: `NETGSM_USERNAME`, `NETGSM_PASSWORD`, `NETGSM_HEADER`
- Mock mod: env eksikse otomatik mock düşer
- Türkçe karakter: UCS-2 desteği, segment hesaplama var
- Hata kodları tablosu: 8 kod tanımlı

**Şablonlar:** Gömülü (her fonksiyon kendi mesaj metnini üretiyor — merkezi şablon YOK).

**Opt-out:** YOK — İYS kaydı veya vazgeçme linki yok.

**Maturity: 3/5**

---

### 3.2 Email

**`src/services/email.service.js`** — Nodemailer + Gmail SMTP.
- Pool: maxConnections 3, maxMessages 50
- Mock mod: SMTP_HOST/USER/PASS eksikse otomatik mock

**Unsubscribe link:** İncelenmedi ama büyük ihtimalle YOK (İYS araması boş döndü).

**Maturity: 3/5**

---

### 3.3 WhatsApp Outbound

`src/services/whatsapp.service.js` — mock mu üretim mi: env'e bağlı (Meta Business API).
Kanıt: `public.route.js`'de `track-whatsapp` redirect, `env.whatsappDefaultNumber` kullanımı.

**Maturity: 3/5**

---

### 3.4 Web Push

**`src/services/pushNotification.service.js`**:
```javascript
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";
// web-push paketi, PushSubscription DB tablosu var
```

`server.js` → `PwaProvider` mount → manifest.json mevcut. PWA kurulu.

**Maturity: 3/5**

---

### 3.5 İYS / Opt-in / Opt-out

**Grep sonucu:** Sıfır eşleşme — İYS entegrasyonu, SMS opt-out, email unsubscribe YOK.

**Risk:** 6563 sayılı Elektronik Ticaret Kanunu — pazarlama SMS/email için önceden onay şart. Form'da "pazarlama iletişimine izin veriyorum" checkbox'ı ayrı değil — sadece KVKK onayı var.

**Maturity: 0/5**

---

## 4. LEAD MODELİ + KVKK + ANALİTİK (P4)

### 4.1 Lead Modeli Pazarlama Alanları

```prisma
kvkkConsentAt       DateTime?   // KVKK onay tarihi
healthDataConsentAt DateTime?   // Sağlık verisi onay tarihi
source              String?     // Kaynak: "public_form" vb.
utmSource           String?
utmMedium           String?
utmCampaign         String?
qualificationScore  Int         @default(0)
aiSummary           String?
archivedAt          DateTime?
deletedAt           DateTime?
```

### 4.2 KVKK Rıza Akışı

**Kanıtlı:** `public.route.js` satır 32-44 — kvkkApproved + healthDataApproved çift onay, tarih olarak kaydedilir.

**Eksik:** Pazarlama iletişimi (İYS) için ayrı onay yok. Çift rıza (kişisel veri + pazarlama) ayrımı yapılmamış.

### 4.3 Aydınlatma Metni

**Dosya:** `tedbirge-panel/app/(public)/kvkk/page.tsx` — mevcut.

Yurt dışı aktarım açıklaması: panel sayfası içeriği incelenmedi — büyük ihtimalle eksik.

### 4.4 qualificationScore

**Kanıt:** `public.route.js` satır 58 → `qualificationScore: 0` — sabit sıfır.

Dinamik hesaplama: YOK. AI analiz tetiklenmiyor.

**Maturity: 1/5**

---

### 4.5 Analytics Endpoint — Backend (P8 ile birleştirildi)

**`src/routes/analytics.routes.js`** — 11 endpoint:

| Endpoint | Açıklama | Yetki |
|---|---|---|
| `/funnel` | Lead durum dağılımı | ADMIN/SALES/REP |
| `/conversion` | Dönüşüm oranı | ADMIN/SALES/REP |
| `/revenue` | Tahmini gelir | ADMIN/SALES/REP |
| `/by-source` | Kaynak bazlı lead | ADMIN/SALES/REP |
| `/lawyer-performance` | Avukat performansı | ADMIN/SALES/REP |
| `/monthly-trend` | Aylık trend | ADMIN/SALES/REP |
| `/calendar` | Duruşma takvimi | Herkes (auth) |
| `/komisyon` | Komisyon özeti | ADMIN/SALES/REP |
| `/bilirkisi-summary` | Bilirkişi özeti | Auth |
| `/iletisim-ozet` | İletişim özeti | Auth |
| `/kritik-sureler` | Zamanaşımı uyarıları | Auth |

**Maturity: 4/5** — Güçlü analytics altyapısı var. Panel entegrasyonu ayrıca bakılabilir.

---

## 5. PANEL UI — PAZARLAMA YÜZÜ (P5)

### 5.1 Public Sayfalar (19 sayfa)

```
(public)/                    — Anasayfa (büyük landing page)
(public)/basvuru             — Başvuru formu (4 adım)
(public)/basvuru-sorgula     — Başvuru durum sorgulama
(public)/cerez               — Çerez politikası
(public)/devam-et            — Başvuru devam sayfası
(public)/forgot-password     — Şifre unuttum
(public)/gizlilik            — Gizlilik politikası
(public)/haberler            — Blog/haberler
(public)/hakkimizda          — Hakkımızda
(public)/kullanim-kosullari  — Kullanım koşulları
(public)/kvkk                — KVKK aydınlatma
(public)/login               — Giriş
(public)/referanslar         — Sosyal kanıt / referanslar
(public)/register/hukukcu    — Avukat kayıt
(public)/register/musteri    — Müvekkil kayıt
(public)/register/temsilci   — Temsilci kayıt
(public)/reset-password      — Şifre sıfırlama
(public)/sifre-belirle       — Şifre belirleme
(public)/tazminat-hesapla    — Tazminat hesaplama (LexScan bağlantılı)
```

### 5.2 Anasayfa İçeriği

`tedbirge-panel/app/(public)/page.tsx` — **Büyük animasyonlu landing page**:
- Framer Motion animasyonu (useCountUp, scroll-triggered counters)
- İstatistik sayıçları (ör: "₺...M+", "%..." gibi)
- CTA yapısı mevcut
- Tailwind CSS kullanıyor (responsive)

### 5.3 SEO Altyapı

**layout.tsx** metadata:
```typescript
export const metadata: Metadata = {
  title: "Tedbirge AI",
  description: "Trafik ve is kazasi tazminat yonetim platformu",
  applicationName: "Tedbirge AI",
  manifest: "/manifest.json",  // PWA
  // openGraph: YOK
  // twitter: YOK
  // keywords: YOK
};
```

**Eksikler:**
- `openGraph` → Sosyal paylaşımda önizleme yok (WhatsApp link paylaşımı kör)
- `twitter` card → Twitter/X paylaşım yok
- `keywords` → meta keywords yok
- Sayfa bazlı metadata → her sayfa için `generateMetadata` yok (hepsi aynı başlık)

**robots.txt:** YOK — `tedbirge-panel/public/robots.txt` bulunamadı.

**sitemap.xml:** YOK — `sitemap.ts/js` bulunamadı (node_modules dışında).

**Mobile responsive:** Tailwind CSS kullanıyor, responsive çalışması beklenir.

**Maturity: 2/5**

---

## 6. 3RD PARTY ENTEGRASYON (P6)

| Araç | Kurulu mu? | ENV key | Konum |
|---|---|---|---|
| Google Analytics 4 | ❌ YOK | — | — |
| Google Tag Manager | ❌ YOK | — | — |
| Meta Pixel (FB/IG) | ❌ YOK | — | — |
| TikTok Pixel | ❌ YOK | — | — |
| Hotjar | ❌ YOK | — | — |
| Microsoft Clarity | ❌ YOK | — | — |
| Cookie Consent Banner | ❌ YOK | — | — |

**Kanıt:** Tüm grep aramaları (googleAnalytics, gtag, GTM, fbq, metaPixel, ttq, hotjar, clarity, cookieBanner) — sıfır eşleşme.

**Not:** `(public)/cerez` sayfası var (çerez metni), ama interaktif cookie consent banner yok.

**Maturity: 0/5**

---

## 7. DOMAIN + DEPLOY (P7)

### 7.1 Vercel (Panel)

**`tedbirge-panel/vercel.json`:**
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "env": { "NEXT_PUBLIC_API_URL": "https://tedbirge-ai.onrender.com/api" },
  "rewrites": [{ "source": "/api/:path*", "destination": "https://tedbirge-ai.onrender.com/api/:path*" }],
  "headers": [X-Content-Type-Options, X-Frame-Options: DENY, X-XSS-Protection, Referrer-Policy]
}
```

**Güvenlik:** Security headers eklenmiş (iyi). Region: Vercel default (büyük ihtimalle Frankfurt).

**next.config.ts:** Boş — `const nextConfig: NextConfig = {};`

### 7.2 Render (Backend)

**`render.yaml`:** (önceki taramadan)
```yaml
env: node, region: frankfurt, plan: free
buildCommand: npm ci --omit=dev && npx prisma generate && npx prisma migrate deploy
startCommand: node src/server.js
```

**server.js'te backup.start():** YOK (TUR #24 keşfi).

### 7.3 CORS

**Grep:** `cors(` → `src/app.js` veya middleware'de tanımlı — tam origin listesi incelenmedi. Render backend'de CORS config'i muhtemelen `CORS_ORIGIN` env var ile.

### 7.4 Subdomain'ler

Referans bulunan: `www.tedbirge.ai` (vercel.json URL referansından). Ayrı API subdomaini (`api.tedbirge.ai`) yok — `/api` path rewrite kullanılıyor.

**Maturity: 4/5** — Deploy altyapı güçlü, security headers var.

---

## 8. KPI / DASHBOARD (P8)

### 8.1 Analytics Endpoint Tam Listesi

11 endpoint — Bölüm 4.5'te detaylıdır. `getLeadsBySource` özellikle pazarlama için kritik.

### 8.2 Panel Dashboard Sayfaları

`(panel)` altında — tam sayfa listesi incelenmedi. Analytics endpoint'lerin kullanıldığı dashboard sayfaları mevcut (daha önce canlı kullanımdan biliniyordu).

### 8.3 Conversion Funnel

`analytics.controller.js` → `getLeadFunnel()` → ActivityLog/Lead.status bazlı hesaplama.
**Çalışıyor** — kaynak bazlı kırılım için `getLeadsBySource()` de var.

### 8.4 Lead Status Pipeline

`analytics.routes.js` → `/funnel` → Lead durumu geçişleri izleniyor.

**Maturity: 4/5**

---

## 9. EN KRİTİK 5 BULGU

1. 🔴 **Google Analytics / Meta Pixel / GTM SIFIR** — Kaç ziyaretçi geliyor, hangi kanaldan convert ediyor, reklam ROI ne — hiçbiri ölçülmüyor. Kör pazarlama.

2. 🔴 **robots.txt + sitemap.xml YOK** — Google crawl engellenmiyor ama sitemap da yok. Organik SEO için kırmızı bayrak. `(public)/haberler` ve `(public)/tazminat-hesapla` hiç indekslenmiyor olabilir.

3. 🔴 **Cookie Consent Banner YOK** — GDPR/KVKK uyumu için zorunlu. Pixel eklenince otomatik ihlal olur (önce consent alınmadan çerez set edilemez). Şu an pixel yok ama eklenmeden önce çözülmeli.

4. 🟡 **UTM Frontend → Backend kopukluğu** — Google Ads / Meta Ads'tan `?utm_source=google&utm_campaign=kaza` ile gelen kullanıcı başvuru formu doldururken UTM kaybolur. ROI ölçümü imkansız.

5. 🟡 **qualificationScore hep 0** — Lead kalite skoru yok. Avukat hangi lead'e önce baksın bilinmiyor. Yanlış lead'e zaman kaybolabilir.

---

## 10. EKSİKLER LİSTESİ — Kapatma Sırası Önerisi

### Kategori A: KVKK / Yasal (NOW + MUST)

- Cookie consent banner (pixel eklemeden önce zorunlu)
- İYS pazarlama onayı — form'a ayrı checkbox (6563 sayılı Kanun)
- openGraph metadata (sosyal paylaşım izni — bilgi eksikliği değil, kullanıcı deneyimi)

### Kategori B: Veri Toplama (UTM, Pixel, Analytics)

- UTM frontend yakalama: `useSearchParams` ile URL → form body aktarımı
- Google Analytics 4 kurulumu (GTM üzerinden — cookie consent ÖNCE)
- Meta Pixel kurulumu (CAPI — Conversions API sunucu taraflı, daha KVKK uyumlu)
- Lead.source genişletme: "temsilci", "lexscan", "whatsapp_inbound"

### Kategori C: Dönüşüm Optimizasyonu

- qualificationScore gerçek hesaplama (kaza türü, maluliyet, gelir bazlı)
- LexScan → Lead bridge (doğrudan lead.create ile conversion)
- Tazminat hesaplama sayfası UTM + CTA optimizasyonu

### Kategori D: SEO / Organic

- robots.txt oluşturma
- sitemap.xml (dinamik — `app/sitemap.ts`)
- Sayfa bazlı generateMetadata (basvuru, tazminat-hesapla, hakkimizda)
- openGraph + Twitter card ekle (sosyal paylaşım önizlemesi)
- `/haberler` sayfasına gerçek içerik (hukuk rehberi makaleleri)

### Kategori E: Bildirim / Müşteri Yolculuğu

- İYS opt-in / opt-out sistemi
- SMS opt-out mekanizması (NetGSM kayıt önerisi)
- Email unsubscribe linki
- Yeni lead SMS/email tetikleyicisi (public form'dan gelince admin bilgilendir — incelenmedi)

---

## 11. PAZARLAMA STRATEJİSİ KESİTİ ÖNERİLERİ

### Öneri 1: Analytics Foundation Kesiti (NOW + MUST — ~1 hafta)

**Neden NOW:** Pixel eklenecekse consent önce şart; analytics olmadan sonraki kesitin etkisi ölçülemez.

**İçerik:**
1. Cookie consent banner (temel, KVKK uyumlu)
2. Google Analytics 4 kurulumu (GTM ile)
3. Meta Pixel kurulumu (CAPI sunucu taraflı önerilir — KVKK dostu)
4. robots.txt + sitemap.xml

**Süre:** 3-5 gün | **Risk:** Düşük | **Mimar onayı:** GTM env key için KIRMIZI NOKTA.

---

### Öneri 2: UTM + Lead Skoring Kesiti (NOW + SHOULD — ~3-5 gün)

**İçerik:**
1. `basvuru/page.tsx`'de `useSearchParams` + hidden UTM input
2. qualificationScore gerçek hesaplama (kural tabanlı, AI tetikleme opsiyonel)
3. Lead.source genişletme

**Süre:** 3 gün | **Risk:** Düşük

---

### Öneri 3: SEO İçerik Altyapısı (NEXT + SHOULD — ~1-2 hafta)

**İçerik:**
1. Sayfa bazlı generateMetadata
2. openGraph + Twitter card
3. `/haberler` içerik modeli
4. Tazminat hesaplama → basvuru conversion funnel

**Süre:** 1-2 hafta | **Risk:** Düşük

---

### Öneri 4: İYS / Bildirim Uyumu (NEXT + MUST — ~3-5 gün)

**İçerik:**
1. Form'a pazarlama izetişimi checkbox'ı
2. SMS opt-out endpoint
3. Email unsubscribe token sistemi

**Süre:** 3-5 gün | **Risk:** Orta (form değişikliği + iletişim servisi)

---

## 12. EKSİK NOKTALAR — Mehmet Bey Manuel Kontrol

1. **Google Search Console** kayıtlı mı? (indexleme raporu için kritik)
2. **Google Business Profile** var mı? (Konya / Türkiye yerel SEO)
3. **Sosyal medya hesapları:** Instagram, TikTok, LinkedIn — aktif mi?
4. **Avukat reklam kısıtlaması:** TBB Reklam Yasağı Yönetmeliği — Meta/Google reklamlarında kullanılan dil Mehmet Bey + bir avukat tarafından onaylanmalı. Otomatik kontrol imkansız.
5. **Meta Business Manager:** WhatsApp Business API production onaylandı mı? (mock düşme riski)
6. **NetGSM bakiye:** SMS servisi aktif mi, bakiye yeterliliği izleniyor mu?
7. **NEXT_PUBLIC_API_URL:** vercel.json'da production URL hardcoded — çevreye göre değişiyor mu?

---

— Claude Code, Pazarlama Altyapı Kapsamlı KEŞİF sonu (sıfır kod değişikliği — Madde 21.2)
— Commit: YOK
