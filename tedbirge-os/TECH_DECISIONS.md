# TECH_DECISIONS

## Current Stack

### Backend
- Node.js + Express
- Prisma ORM
- PostgreSQL — Supabase (üretim)
- SQLite — yalnızca yerel dev fallback (DATABASE_URL'ye göre)

### Frontend
- Next.js 14 (App Router)
- Tailwind CSS
- TypeScript

### AI
- Claude claude-sonnet-4-6 (Anthropic SDK)
- ANALYSIS_MODE: mock | real
- Sözleşme, dilekçe, belge analizi için aktif

### OCR
- Tesseract (yerel) + OCR.space (bulut fallback)
- pdftoppm ile PDF → PNG dönüşümü

### Bildirimler
- SMS: Netgsm API (mock mod aktif, credentials bekleniyor)
- E-posta: Nodemailer SMTP (mock mod aktif, SMTP_PASS bekleniyor)
- WhatsApp: Meta Graph API v19.0 (mock mod aktif, credentials bekleniyor)

### Deploy Planı
- Panel: Vercel
- Backend: Railway
- DB: Supabase PostgreSQL
- Domain: tedbirge.ai

### Monitoring / Cron
- node-cron: Zamanaşımı kontrolü (her gün 08:00)
- OCR worker: setInterval polling (OCR_POLL_INTERVAL_MS)

## Rule
- Çalışan sistemi bozma
- Gereksiz migration yok
- Yeni teknoloji yalnızca açık ihtiyaç varsa
- Önce ürünleşme, sonra mimari genişleme

## Future
- Redis — rate limiter için (şu an in-memory, multi-instance gerekirse)
- E-imza KEP / BTK onaylı entegrasyonu
- UYAP gerçek API (şu an mock)
- SGK e-Bildirge gerçek API (şu an mock)
- Mobil uygulama (React Native)
