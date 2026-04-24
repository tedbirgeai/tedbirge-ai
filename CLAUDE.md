# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start with nodemon (auto-reload)
npm start            # Production start

# Database
npm run prisma:generate   # Regenerate Prisma client after schema changes
npm run prisma:migrate    # Run migrations (dev)
npm run seed              # Seed the database

# Workers
npm run ocr:worker   # Run OCR worker standalone (also auto-starts with server)
```

## Environment Variables

Required in `.env`:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Required; server throws at startup if missing
- `ANTHROPIC_API_KEY` — Required for AI features (Claude)

Optional:
- `PORT` (default: 5000)
- `ANALYSIS_MODE` — `mock | hybrid | real` (default: `mock`)
- `OCR_PROVIDER` — `mock | ocr_space`
- `AI_PROVIDER` — `mock | openai`
- `PDFTOPPM_PATH`, `TESSERACT_PATH` — Paths to OCR binaries if not in PATH
- `OPENAI_API_KEY`, `OCR_SPACE_API_KEY`

## Architecture

This is a Turkish legal CRM backend — a Node.js/Express API for a law firm that handles traffic and workplace accident compensation cases.

### Entry Points

- `src/server.js` — Starts Express, auto-forks the OCR worker as a child process
- `src/app.js` — Express app setup (helmet, cors, morgan, routes)
- `scripts/ocr-worker.js` — Standalone worker that polls DB for `UPLOADED` PDFs, converts them via `pdftoppm` + `tesseract`, and writes `parsedText` back

### Request Flow

```
Client → authMiddleware (JWT) → roleMiddleware (ADMIN|SALES|LAWYER|CUSTOMER) → Controller → Service → Prisma
```

Route prefix: all routes are under `/api/`, analysis routes under `/api/analysis/`.

### Key Domain Concepts

- **Lead** — A potential client case. Central entity. Has a `leadCode`, `LeadStatus` enum (NEW → WON/LOST), and holds AI-generated fields (`aiSummary`, `estimatedCompensation`, `qualificationScore`).
- **Document** — Uploaded files attached to a Lead. Status progresses: `UPLOADED → PARSED → ANALYZED`. `parsedText` filled by OCR worker; `aiAnalysis` and `extractedJson` filled by AI.
- **Assignment** — Links a Lead to a Lawyer (User with LAWYER role).
- **Contract** — Legal documents (SERVICE_AGREEMENT, POWER_OF_ATTORNEY) generated per Lead.
- **ChatSession / ChatMessage** — AI chat history tied to a Lead or User.

### AI Pipeline (`src/services/`)

- `ai.service.js` — Three Claude functions: `interpretResponse()` (classify document), `analyzeDocument()` (legal analysis), `generatePetition()` (draft legal documents in Turkish). Model constant `MODEL` is hardcoded here — **must be updated** from deprecated `claude-sonnet-4-20250514` to a current model ID.
- `compensation.engine.js` — Deterministic (no AI) Turkish compensation calculator. Extracts entities from OCR text, estimates maluliyet rate, fault rate, and outputs a compensation range. Called as step 1 before Claude enrichment in `analyzeDocument()`.
- `uploadAnalysis.bridge.js` — Bridges file upload → OCR → AI analysis pipeline.
- `workflow.service.js` — Lead lifecycle state machine.
- `decision.service.js` / `decisionEngine.service.js` — Lead qualification scoring.

### Database

PostgreSQL via Prisma ORM. Schema at `prisma/schema.prisma`. Dev database file is `prisma/dev.db` (SQLite for local dev despite schema declaring PostgreSQL — check `DATABASE_URL`).

### Auth

JWT-based. Token accepted from `Authorization: Bearer <token>` header or `?token=` query param. Role hierarchy: `ADMIN > SALES > LAWYER > CUSTOMER`. `roleMiddleware(...roles)` takes a list of allowed roles.

---

## Sınıflandırma

| Boyut | Kategori |
|---|---|
| **Sektör** | LegalTech · InsurTech |
| **Teknoloji** | Generative AI (Claude / Anthropic) · OCR pipeline · Deterministic compensation engine |
| **İş Modeli** | B2B SaaS — hukuk büroları ve sigorta brokerları için |
| **Dava Türleri** | Trafik kazası tazminatı · İş kazası tazminatı · Destekten yoksun kalma · Araç değer kaybı |

---

## Hukuki Uyum Notları

### KVKK (Kişisel Verilerin Korunması Kanunu)
- Sistemde ad, telefon, e-posta, kaza bilgisi, sağlık verisi (hastane raporları) işlenmektedir. Bu veriler **özel nitelikli kişisel veri** kapsamına girebilir (KVKK m.6).
- Veri sahibi başvuru formu ve **açık rıza metni** henüz sisteme entegre edilmemiştir — sıradaki önceliklerden biri.
- `public-lead` formu aracılığıyla toplanan veriler için aydınlatma yükümlülüğü (m.10) yerine getirilmeli.
- Üretilen dilekçe ve sözleşmelerde gerçek ad/TC/adres bilgisi yer alıyorsa, bu belgelerin depolanması veri minimizasyon ilkesine (m.4) uygun olmalı.
- `uploads/` dizinindeki belgeler için erişim log'u tutulması ve belirli süre sonunda silinmesi gerekebilir.

### Avukatlık Kanunu (1136 sayılı)
- Sistem **hukuki tavsiye** değil, **ön değerlendirme ve belge yönetimi** sunmaktadır — bu ayrımın kullanıcı arayüzünde açıkça belirtilmesi gerekir.
- AI tarafından üretilen dilekçe ve sözleşmeler, sorumlu bir avukat tarafından **incelenmeden** doğrudan müvekkile sunulmamalıdır (m.35 — yalnızca avukatlar dava vekâleti verebilir).
- `generatePetition()` çıktısı "taslak" olarak etiketlenmeli; sistem bunu otomatik olarak yasal belge olarak sunmamalı.
- Vekaletname (`POWER_OF_ATTORNEY`) üretimi noter onayı gerektirdiğinden, üretilen metin yalnızca hazırlık taslağı niteliğindedir.

---

## Tamamlanan Isler - Gecmis Ozeti (15-16 Nisan 2026, 21 oturum)

Detayli oturum notlari: tedbirge-os/docs/CLAUDE_ARSIV_Nisan_15_16.md
Commit gecmisi: git log --oneline --all

**Kisa kronoloji:**

- **15 Nisan (17 oturum):** Bug duzeltmeleri, backend endpointler, frontend sayfalar, modern dashboard, sozlesme AI, Turkce karakter fix, guvenlik, PDF, muvekkil portali, analytics, login/auth, UYAP mock, SMS, e-posta, self-servis portal, WhatsApp mock, SGK mock, public ana sayfa, AI widget, tazminat hesap, haberler, renk/logo sistemi, dilekce motoru, Admin CRM FAZ 1-2, takvim, muzakere, komisyon, Musteri 360, gelismis filtre, avukat ajanda.

- **16 Nisan (4 oturum):** RBAC guvenlik kapama, Framer Motion, sosyal medya, Supabase Storage, 2FA TOTP, PayTR, baro onay, Hakkimizda sayfasi.

**16 Nisan sonu durumu:** Genel tamamlanma %88.

---
## Sistem Durumu (2026-04-16 Güncel)

### Deploy — CANLI
| Bileşen | URL | Platform |
|---|---|---|
| Frontend | `https://tedbirge-panel.vercel.app` | Vercel |
| Backend | `https://tedbirge-ai.onrender.com` | Render |
| DB | Supabase PostgreSQL | Supabase |
| Repo Frontend | `github.com/tedbirgeai/tedbirge-panel` | GitHub |
| Repo Backend | `github.com/tedbirgeai/tedbirge-ai` | GitHub |

### Yerel Geliştirme
| Bileşen | Adres | Başlatma |
|---|---|---|
| Backend | `localhost:5000` | `cd tedbirge.ai && npm run dev` |
| Frontend | `localhost:3000` | `cd tedbirge-panel && npm run dev` |
| Admin | `admin@tedbirge.ai` / `Tedbirge2026!` | — |

### Güncel API Endpoint'leri (Eklenenler)
```
POST   /api/auth/setup-2fa           — 2FA QR kod üret
POST   /api/auth/verify-2fa          — 2FA aktif et
POST   /api/auth/disable-2fa         — 2FA kapat
POST   /api/auth/login-2fa           — 2FA ikinci adım (tempToken → JWT)
GET    /api/onay/hukukcu             — Hukukçu onay listesi (ADMIN)
PATCH  /api/onay/hukukcu/:id/onayla  — Hukukçu onayla (ADMIN)
PATCH  /api/onay/hukukcu/:id/reddet  — Hukukçu reddet (ADMIN)
GET    /api/onay/temsilci            — Temsilci onay listesi (ADMIN)
PATCH  /api/onay/temsilci/:id/onayla — Temsilci onayla (ADMIN)
PATCH  /api/onay/temsilci/:id/reddet — Temsilci reddet (ADMIN)
POST   /api/payments/callback        — PayTR callback (public)
POST   /api/payments/leads/:id/initiate — Ödeme başlat
GET    /api/payments/leads/:id/status   — Ödeme durumu
POST   /api/payments/leads/:id/refund   — İade başlat (ADMIN)
```

### Güncel ENV Değişkenleri (Eklenenler)
```
# 2FA (otomatik, env gerekmez)
# PayTR
PAYTR_MERCHANT_ID=        (boş - mock mod)
PAYTR_MERCHANT_KEY=       (boş - mock mod)
PAYTR_MERCHANT_SALT=      (boş - mock mod)
BACKEND_URL=http://localhost:5000
# Supabase Storage
SUPABASE_URL=             (boş - lokal fallback)
SUPABASE_SERVICE_KEY=     (boş - lokal fallback)
SUPABASE_STORAGE_BUCKET=  (boş - lokal fallback)
# Panel sosyal medya
NEXT_PUBLIC_WHATSAPP_NUMBER=905412031609
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/tedbirge
NEXT_PUBLIC_FACEBOOK_URL=https://facebook.com/tedbirge
NEXT_PUBLIC_LINKEDIN_URL=https://linkedin.com/company/tedbirge
NEXT_PUBLIC_TWITTER_URL=https://twitter.com/tedbirge
NEXT_PUBLIC_YOUTUBE_URL=https://youtube.com/@tedbirge
```

### Genel Tamamlanma: %88

### Kalan Öncelikli İşler (Sıralı)
1. **Supabase Storage bucket** — `supabase.com` → Storage → New bucket: `tedbirge-uploads` (Public)
2. **Gmail SMTP** — `myaccount.google.com` → Güvenlik → 2FA → Uygulama Şifreleri → `SMTP_PASS`
3. **WhatsApp Business API** — `business.facebook.com` → token al → `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_ID`
4. **Netgsm SMS** — `netgsm.com.tr` → `NETGSM_USERNAME` + `NETGSM_PASSWORD`
5. **PayTR gerçek credentials** — Render env: `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT`
6. **Domain tedbirge.ai** — Vercel Domains + Render Custom Domain + env güncelle
7. **Ekip fotoğrafları** — `/hakkimizda` sayfasına gerçek fotoğraflar
8. **Google My Business** kaydı

### Yeni Sohbette Başlangıç
```
CLAUDE.md oku, Tedbirge.ai projesine kaldığın yerden devam et, eksik ve yarım kalanları listele
```

## 26 Nisan 2026 — Tedbirge OS v3 Sprint 2 KAPANDI

- 33/33 dosya: Core 6 + HAL 9 + Modul 16 + Observability 3
- Tag: v3-sprint2 (ee7b481)
- Branch: feature/tedbirge-os-v3 (GitHub push edildi)
- Sprint 3'e gecis: canli entegrasyon (boot+server.js bag, DB persist, real adapter)
- TASK_QUEUE.md Sprint 3 yol haritasi guncellendi

