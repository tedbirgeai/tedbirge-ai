# Tedbirge AI

Türkiye trafik ve iş kazası tazminat davaları için LegalTech + InsurTech platformu.

**Backend:** Node.js · Express · Prisma · PostgreSQL (Supabase) · Claude AI  
**Frontend:** Next.js 16 · TypeScript · Tailwind CSS  
**Deploy:** Railway (backend) + Vercel (frontend)

---

## Depo Yapısı

```
tedbirge.ai/           ← Backend (bu repo kökü)
  src/                 ← Express uygulama kodu
  prisma/              ← Şema ve migration'lar
  scripts/             ← OCR worker, auto-update
  tedbirge-panel/      ← Next.js frontend (ayrı deploy)
  nixpacks.toml        ← Railway build konfigürasyonu
  Procfile             ← Railway başlangıç komutu
  .env.example         ← Ortam değişkenleri şablonu
```

---

## Yerel Geliştirme

```bash
# 1. Bağımlılıkları yükle
npm install
cd tedbirge-panel && npm install && cd ..

# 2. Ortam değişkenlerini ayarla
cp .env.example .env
# En az şunları doldur: DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY

# 3. Veritabanını senkronize et
npx prisma generate
npx prisma db push

# 4. Admin kullanıcı oluştur
npm run seed

# 5. Backend başlat (localhost:5000)
npm run dev

# 6. Frontend başlat — ayrı terminal (localhost:3000)
cd tedbirge-panel && npm run dev
```

**Admin girişi:** `admin@tedbirge.ai` / `Tedbirge2026!`

### Komutlar

```bash
npm run dev              # nodemon ile auto-reload
npm start                # Production başlat
npm run prisma:generate  # Prisma client yeniden üret
npm run prisma:migrate   # Migration çalıştır (dev)
npm run seed             # Veritabanını seed et
npm run ocr:worker       # OCR worker'ı bağımsız başlat
npm run os:update        # TEDBIRGE OS durum dosyalarını güncelle
```

---

## Deploy Rehberi

### ADIM 1 — GitHub'a yükle

```bash
# Proje kökünde (tedbirge.ai/)
git init
git add .
git commit -m "feat: initial deploy — tedbirge.ai v1.0"

# GitHub'da yeni bir private repo oluştur: tedbirge-ai
# Sonra remote ekle ve push et:
git remote add origin https://github.com/KULLANICI_ADIN/tedbirge-ai.git
git branch -M main
git push -u origin main
```

> `.env` dosyası `.gitignore`'da — asla commit edilmez.  
> `uploads/` ve `prisma/dev.db` de hariç tutulur.

---

### ADIM 2 — Supabase (Veritabanı)

1. [supabase.com](https://supabase.com) → **New Project** oluştur
2. **Settings → Database → Connection string (URI)** kopyala
3. Bağlantı dizesinin sonuna ekle:
   ```
   ?connection_limit=20&pool_timeout=30
   ```
4. Bu değer Railway ve yerel `.env`'deki `DATABASE_URL` olacak

**Supabase Storage (uploads/ için):**
1. Storage → **New Bucket** → `tedbirge-uploads` (private)
2. Settings → API → **service_role key** kopyala
3. Railway Variables'a ekle: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_STORAGE_BUCKET`

---

### ADIM 3 — Railway (Backend Deploy)

Railway, `nixpacks.toml` ve `Procfile` dosyalarını okur — ek yapılandırma gerekmez.

```bash
# Railway CLI ile deploy
npm install -g @railway/cli
railway login
railway init          # Yeni proje oluştur (tedbirge-backend adı önerilir)
railway up            # İlk deploy
```

**Ya da GitHub entegrasyonu ile (önerilen):**
1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
2. `tedbirge-ai` reposunu seç
3. **Root directory:** `/` (repo kökü)
4. Railway otomatik `nixpacks.toml`'ı okur ve Tesseract + Poppler kurar

**Railway Variables (Dashboard → Variables → Raw Editor):**
```
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://postgres:SIFRE@db.XXXX.supabase.co:5432/postgres?connection_limit=20&pool_timeout=30
JWT_SECRET=<openssl rand -hex 32 ile üret>
JWT_EXPIRES_IN=24h
ANTHROPIC_API_KEY=sk-ant-api03-...
ANALYSIS_MODE=real
CORS_ORIGIN=https://tedbirge-panel.vercel.app
OCR_PROVIDER=tesseract
TESSERACT_PATH=/usr/bin/tesseract
PDFTOPPM_PATH=/usr/bin/pdftoppm
SUPABASE_URL=https://XXXX.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_STORAGE_BUCKET=tedbirge-uploads
VAPID_PUBLIC_KEY=<üretilmiş key>
VAPID_PRIVATE_KEY=<üretilmiş key>
VAPID_SUBJECT=mailto:tedbirge34@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tedbirge34@gmail.com
SMTP_PASS=<Gmail uygulama şifresi>
NETGSM_USERNAME=<netgsm kullanıcı adı>
NETGSM_PASSWORD=<netgsm şifre>
NETGSM_HEADER=TEDBIRGE
WHATSAPP_TOKEN=<Meta token>
WHATSAPP_PHONE_ID=<Meta phone ID>
WHATSAPP_API_VERSION=v19.0
WHATSAPP_WEBHOOK_VERIFY_TOKEN=tedbirge-webhook-secret-2026
WHATSAPP_DEFAULT_NUMBER=905412031609
```

**VAPID Anahtarı Üretme:**
```bash
node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(JSON.stringify(k,null,2))"
```

**Deploy sonrası Railway URL'i not et** — örn: `https://tedbirge-ai-production.up.railway.app`  
Bu URL Vercel'deki `NEXT_PUBLIC_API_BASE_URL` değişkenine girilecek.

---

### ADIM 4 — Vercel (Frontend Deploy)

Frontend, `tedbirge-panel/vercel.json` dosyasını içerir.

```bash
# Vercel CLI ile deploy
npm install -g vercel
cd tedbirge-panel
vercel --prod
```

**Ya da GitHub entegrasyonu ile (önerilen):**
1. [vercel.com](https://vercel.com) → **New Project → Import Git Repository**
2. `tedbirge-ai` reposunu seç
3. **Root Directory:** `tedbirge-panel`
4. **Framework:** Next.js (otomatik algılanır)

**Vercel Environment Variables (Dashboard → Settings → Environment Variables):**
```
NEXT_PUBLIC_API_BASE_URL=https://tedbirge-ai-production.up.railway.app/api
```

> `vercel.json` içindeki `NEXT_PUBLIC_API_URL` değerini de Railway URL'iniz ile güncelleyin.

---

### ADIM 5 — CORS Güncelle

Backend Railway'e deploy edildikten sonra, Vercel'den gelen domain'i CORS'a izin ver.

Railway Variables'ta `CORS_ORIGIN` değerini güncelle:
```
CORS_ORIGIN=https://tedbirge-panel.vercel.app
```

Özel domain aldıktan sonra (örn. tedbirge.ai):
```
CORS_ORIGIN=https://tedbirge.ai,https://www.tedbirge.ai
```

---

### ADIM 6 — Veritabanı Migration

Railway deploy'undan sonra `Procfile` komutu otomatik çalışır:
```
npx prisma migrate deploy && node src/server.js
```

İlk deploy'da migration history yoksa Prisma'yı baseline'a alın:
```bash
# Yerel makineden Railway'e bağlanarak çalıştırın
DATABASE_URL="railway_db_url" npx prisma migrate deploy
```

---

### ADIM 7 — Deploy Sonrası Kontrol

```bash
# Backend sağlık kontrolü
curl https://tedbirge-ai-production.up.railway.app/health

# Admin girişi testi
curl -X POST https://tedbirge-ai-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tedbirge.ai","password":"Tedbirge2026!"}'
```

Frontend: `https://tedbirge-panel.vercel.app` adresinde açılıyor olmalı.

---

## Ortam Değişkenleri

Tam liste için: **`.env.example`** dosyasına bak.

**Zorunlu (sistem başlamaz):**
```
DATABASE_URL          Supabase PostgreSQL bağlantı dizesi
JWT_SECRET            JWT imzalama anahtarı
ANTHROPIC_API_KEY     Claude AI anahtarı
```

**AI modu:**
```
ANALYSIS_MODE=mock    → Şablon kullan (hızlı, ücretsiz)
ANALYSIS_MODE=real    → Claude API çağrısı (production)
```

**OCR (Railway'de otomatik kurulur):**
```
TESSERACT_PATH=/usr/bin/tesseract
PDFTOPPM_PATH=/usr/bin/pdftoppm
```

---

## Mimari

```
İstemci → authMiddleware (JWT) → roleMiddleware (ADMIN|SALES|REPRESENTATIVE|LAWYER|CUSTOMER)
       → Controller → Service → Prisma → Supabase PostgreSQL
```

**AI Pipeline:**
```
Belge yüklendi (UPLOADED)
  → OCR Worker (Tesseract) → parsedText yazıldı (PARSED)
  → documentAnalysis.job → compensation.engine.js (deterministik)
  → Claude claude-sonnet-4-6 zenginleştirme
  → aiAnalysis, extractedJson, estimatedCompensation yazıldı (ANALYZED)
```

**Bildirim Pipeline:**
```
Tetikleyici (yeni başvuru / AI analiz / avukat atama / teklif)
  → SMS (Netgsm) + WhatsApp (Meta Cloud API) + Push (VAPID) + ActivityLog
```

---

## API Endpoint Özeti

| Yöntem | Yol | Açıklama |
|---|---|---|
| POST | `/api/auth/login` | Giriş |
| POST | `/api/auth/register` | Kullanıcı kaydı (ADMIN only) |
| POST | `/api/auth/forgot-password` | Şifre sıfırlama |
| GET | `/api/leads` | Lead listesi |
| POST | `/api/leads/bulk-update` | Toplu güncelleme |
| GET | `/api/leads/:id` | Lead detay |
| POST | `/api/leads/:id/workflow/run` | Workflow tetikle |
| GET | `/api/leads/:id/uyap-status` | UYAP durumu |
| GET | `/api/leads/:id/sgk-data` | SGK verisi |
| DELETE | `/api/leads/:id/gdpr-delete` | KVKK veri silme |
| POST | `/api/leads/:id/ihtarname` | İhtarname oluştur |
| POST | `/api/leads/:leadId/petitions` | Dilekçe oluştur |
| GET | `/api/contracts/:id/pdf` | Sözleşme PDF indir |
| GET | `/api/analytics/funnel` | Dava hunisi |
| GET | `/api/analytics/monthly-trend` | Aylık trend |
| GET | `/api/analytics/komisyon` | Komisyon özeti |
| GET | `/api/maluliyet/yaralanma-turleri` | AMA tablosu |
| POST | `/api/maluliyet/hesapla` | Tazminat hesapla |
| POST | `/api/lexscan/chat` | LexScan AI sohbet |
| POST | `/api/whatsapp/webhook` | WhatsApp webhook |
| GET | `/health` | Sistem sağlığı |

---

## Kullanıcı Rolleri

| Rol | Yetkiler |
|---|---|
| `ADMIN` | Her şey + kullanıcı yönetimi |
| `SALES` | Lead, atama, analytics |
| `REPRESENTATIVE` | Saha temsilcisi — lead oluştur/görüntüle |
| `LAWYER` | Sadece atandığı davalar |
| `CUSTOMER` | Sadece kendi başvurusu |

---

## Güvenlik

- Rate limiting: login 5/15dk, API 100/dk
- CORS: `CORS_ORIGIN` env ile kilitli
- JWT: 24h, bcrypt hash (cost=10)
- Helmet middleware: XSS, HSTS, CSP başlıkları
- MIME type kontrolü: sadece PDF, JPEG, PNG
- KVKK: `DELETE /api/leads/:id/gdpr-delete`

---

## Kalan Yapılacaklar (Deploy Sonrası)

| Görev | Öncelik | Not |
|---|---|---|
| Gmail uygulama şifresi | Yüksek | SMTP_PASS — Google Account → App Passwords |
| Netgsm credentials | Yüksek | SMS için NETGSM_USERNAME + NETGSM_PASSWORD |
| WhatsApp Business API | Orta | WHATSAPP_TOKEN + WHATSAPP_PHONE_ID |
| Supabase Storage | Orta | uploads/ → bulut depolama |
| Özel domain (tedbirge.ai) | Orta | ~10 gün |
| TRAMER/SBGM entegrasyonu | Uzun vadeli | Hasar sorgulama |
| E-imza (Turktrust/KEP) | Uzun vadeli | Sözleşme imzalama |

---

## Hukuki Uyarı

Bu sistem Avukatlık Kanunu 1136 uyarınca **avukat yerine geçmez**; karar destek aracıdır.  
AI çıktıları taslak niteliğindedir, sorumlu avukat tarafından incelenmeden sunulmamalıdır.  
KVKK m.6 kapsamında özel nitelikli kişisel veri işlenmektedir — açık rıza zorunludur.  
AB AI Act Madde 6 kapsamında yüksek riskli AI sistemi — insan denetimi zorunludur.
