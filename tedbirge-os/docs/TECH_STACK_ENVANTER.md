# TECH STACK ENVANTERİ
Tarih: 2026-04-22  
Hazırlayan: Claude Code (envanter görevi, kod değişikliği yok)

---

## 1. BACKEND

| Kategori | Değer |
|---|---|
| **Repo adı** | tedbirge-ai |
| **Dil** | JavaScript (CommonJS — `"type": "commonjs"`) |
| **TypeScript** | YOK |
| **Framework** | Express.js `^4.21.2` |
| **Node.js zorunlu** | `>=20.0.0` |
| **npm zorunlu** | `>=10.0.0` |
| **Entry point** | `src/server.js` |
| **Dev araç** | nodemon `^3.1.9` |

### Bağımlılıklar (dependencies)

| Paket | Versiyon | Amaç |
|---|---|---|
| `@anthropic-ai/sdk` | ^0.89.0 | Claude AI (dilekçe, analiz, LexScan) |
| `@prisma/client` | ^6.19.2 | ORM — PostgreSQL |
| `@supabase/supabase-js` | ^2.103.3 | Supabase Storage (dosya yükleme) |
| `axios` | ^1.14.0 | HTTP client (WhatsApp, SGK, UYAP mock) |
| `bcryptjs` | ^2.4.3 | Şifre hash (auth) |
| `cookie-parser` | ^1.4.7 | Cookie okuma |
| `cors` | ^2.8.5 | CORS middleware |
| `dotenv` | ^16.4.5 | Env değişkenleri |
| `express` | ^4.21.2 | Web framework |
| `express-rate-limit` | ^8.3.2 | Rate limiting (login 5/15dk, api 100/dk) |
| `helmet` | ^8.1.0 | Security headers |
| `jsonwebtoken` | ^9.0.2 | JWT auth (24h) |
| `morgan` | ^1.10.0 | HTTP request logger |
| `multer` | ^2.0.0 | Dosya yükleme (PDF, JPEG, PNG) |
| `node-cron` | ^4.2.1 | Zamanaşımı + duruşma cron job'ları |
| `nodemailer` | ^8.0.5 | E-posta (mock mod aktif) |
| `pdf-parse` | ^1.1.1 | PDF metin çıkarma |
| `pdfkit` | ^0.18.0 | PDF oluşturma (sözleşme, dilekçe) |
| `qrcode` | ^1.5.4 | 2FA QR kod üretimi |
| `speakeasy` | ^2.0.0 | TOTP 2FA |
| `uuid` | ^11.1.0 | UUID üretimi |
| `web-push` | ^3.6.7 | Push bildirimleri |
| `zod` | ^3.24.2 | Validation (bazı endpoint'lerde) |

### devDependencies

| Paket | Versiyon | Amaç |
|---|---|---|
| `jest` | ^30.3.0 | Test framework (mevcut test yok, script var) |
| `nodemon` | ^3.1.9 | Auto-reload (dev) |
| `pg` | ^8.20.0 | PostgreSQL driver (Prisma için) |
| `prisma` | ^6.19.2 | ORM CLI |

### Mimari Kararlar

| Kategori | Karar |
|---|---|
| **ORM** | Prisma |
| **Auth** | JWT (`jsonwebtoken`) — Bearer token + cookie |
| **2FA** | speakeasy TOTP + qrcode |
| **Validation** | zod (kısmi) — tam validation yok |
| **Logger** | morgan (HTTP) + console.error (uygulama) — winston/pino YOK |
| **Test** | Jest kurulu ama test dosyası yok (`test:smoke` sadece echo) |
| **OpenAI SDK** | YOK |
| **Başka AI SDK** | YOK (sadece Anthropic) |

---

## 2. FRONTEND / PANEL

| Kategori | Değer |
|---|---|
| **Repo adı** | tedbirge-panel |
| **Framework** | Next.js `16.2.2` |
| **Router** | App Router (`app/` dizini var) |
| **React** | `19.2.4` |
| **Dil** | TypeScript `^5` |
| **Stil** | Tailwind CSS `^4.2.2` |
| **Animasyon** | Framer Motion `^12.38.0` |

### dependencies

| Paket | Versiyon | Amaç |
|---|---|---|
| `framer-motion` | ^12.38.0 | Sayfa animasyonları, scroll reveal |
| `next` | 16.2.2 | Framework |
| `react` | 19.2.4 | UI |
| `react-dom` | 19.2.4 | DOM rendering |

### devDependencies

| Paket | Versiyon | Amaç |
|---|---|---|
| `@tailwindcss/postcss` | ^4 | Tailwind PostCSS entegrasyonu |
| `@types/node` | ^20 | Node.js tip tanımları |
| `@types/react` | ^19 | React tip tanımları |
| `@types/react-dom` | ^19 | ReactDOM tip tanımları |
| `eslint` | ^9 | Linter |
| `eslint-config-next` | 16.2.2 | Next.js ESLint kuralları |
| `tailwindcss` | ^4.2.2 | CSS framework |
| `typescript` | ^5 | Dil |

### Mimari Kararlar

| Kategori | Karar |
|---|---|
| **UI Library** | Tailwind CSS (shadcn/MUI/Chakra YOK) |
| **State Management** | React useState/useContext — Redux/Zustand YOK |
| **Form Library** | Vanilla (useState) — react-hook-form/formik YOK |
| **Routing** | App Router (Next.js 16) |
| **API iletişim** | fetch() doğrudan — axios/swr/react-query YOK |

---

## 3. VERİTABANI

| Kategori | Değer |
|---|---|
| **Provider** | PostgreSQL |
| **Host (prod)** | Supabase (`iikpmzomblocdrxeisxh.supabase.co`) |
| **ORM** | Prisma `^6.19.2` |
| **Migration sayısı** | 2 (+ migration_lock.toml) |
| **Model sayısı** | 17 |

### Prisma Modelleri

| # | Model | Açıklama |
|---|---|---|
| 1 | `PhoneOtp` | SMS OTP doğrulama |
| 2 | `User` | Kullanıcı (ADMIN/SALES/LAWYER/REPRESENTATIVE/CUSTOMER) |
| 3 | `Lead` | Ana dava/başvuru varlığı |
| 4 | `IhtarnameTakip` | Sigorta müzakere akışı |
| 5 | `DavaSurec` | Dava aşamaları |
| 6 | `Durusma` | Duruşma takvimi |
| 7 | `Bilirkisi` | Bilirkişi takip |
| 8 | `Masraf` | Dava masraf takibi |
| 9 | `ChatSession` | AI sohbet oturumu |
| 10 | `ChatMessage` | AI sohbet mesajları |
| 11 | `Document` | Yüklenen belgeler (OCR pipeline) |
| 12 | `Assignment` | Avukat-dava ataması |
| 13 | `Contract` | Sözleşme (vekâletname + hizmet) |
| 14 | `Petition` | AI dilekçe |
| 15 | `ActivityLog` | Aktivite zaman çizelgesi |
| 16 | `VerificationToken` | Email doğrulama token |
| 17 | `PushSubscription` | Web push aboneliği |

---

## 4. HOSTING / ALTYAPI

| Bileşen | Platform | Config |
|---|---|---|
| **Frontend** | Vercel | `tedbirge-panel/vercel.json` mevcut |
| **Backend** | Render | `render.yaml` YOK (dashboard config) |
| **Veritabanı** | Supabase PostgreSQL | — |
| **Dosya Depolama** | Supabase Storage (prod) / local uploads/ (dev) | — |
| **Dockerfile** | YOK | — |
| **GitHub Actions workflows** | YOK | — |
| **Dependabot** | VAR | `.github/dependabot.yml` |

### vercel.json Notları
- `NEXT_PUBLIC_API_URL` → `https://tedbirge-backend.up.railway.app/api` (**DİKKAT: eski Railway URL, Render'a taşındı — güncellenmesi gerekiyor**)
- `/api/:path*` rewrites → aynı eski Railway URL
- Security headers: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`

---

## 5. AI ENTEGRASYONları

| SDK | Versiyon | Kullanım |
|---|---|---|
| `@anthropic-ai/sdk` | ^0.89.0 | Claude claude-sonnet-4-6 — sözleşme, dilekçe, OCR analiz, LexScan chat |
| OpenAI SDK | **YOK** | — |
| Başka AI SDK | **YOK** | — |

**Model:** `claude-sonnet-4-6` (hardcoded `src/services/ai.service.js`)

---

## 6. GÜVENLİK PAKETLERİ

| Paket | Versiyon | Rol |
|---|---|---|
| `helmet` | ^8.1.0 | HTTP security headers |
| `cors` | ^2.8.5 | Cross-origin policy |
| `express-rate-limit` | ^8.3.2 | Rate limiting |
| `bcryptjs` | ^2.4.3 | Şifre hash |
| `jsonwebtoken` | ^9.0.2 | JWT imzalama |
| `speakeasy` | ^2.0.0 | TOTP 2FA |
| `qrcode` | ^1.5.4 | 2FA QR kod |

---

## 7. DİĞER TESPİTLER

### Repo Yapısı
```
C:\Users\WIN10\desktop\tedbirge.ai\       ← BACKEND repo (tedbirge-ai)
  src/                                     ← Express uygulaması
  prisma/                                  ← Schema + migrations
  scripts/                                 ← OCR worker, auto-update
  tedbirge-panel/                          ← FRONTEND repo (tedbirge-panel) — iç içe!
    app/                                   ← Next.js App Router
    components/
    public/
  tedbirge-os/                             ← Proje yönetim sistemi (kod değil)
    docs/                                  ← Raporlar, fizibilite, envanter
    CURRENT_STATE.md
    TASK_QUEUE.md
    CHANGELOG.md
```

**Monorepo mu, ayrı repo mu?**  
İkisi de: `tedbirge-ai` ve `tedbirge-panel` ayrı GitHub repo'ları ama dosya sisteminde `tedbirge-panel/` backend klasörünün **içinde** yaşıyor. Gerçek bir monorepo tooling yok (Turborepo, nx, Lerna YOK).

### Dikkat Gerektiren Tespitler

| # | Tespit | Risk |
|---|---|---|
| 1 | `vercel.json`'da `NEXT_PUBLIC_API_URL` Railway URL'ine işaret ediyor | YÜKSEK — prod'da yanlış backend'e istek gidebilir |
| 2 | Backend'de `render.yaml` yok — Render config dashboard'da elle yapılmış | ORTA — config drift riski, reproducible değil |
| 3 | Test dosyası yok (`jest` kurulu ama `test:smoke` sadece `console.log`) | ORTA — regresyon koruması yok |
| 4 | Uygulama logger yok (winston/pino) — sadece `console.error` | DÜŞÜK — prod log yönetimi zor |
| 5 | `zod` kurulu ama kullanım kısmi — tam input validation yok | ORTA — injection riski |
| 6 | GitHub Actions CI/CD pipeline yok — sadece Dependabot | ORTA — otomatik test/deploy yok |
| 7 | `tedbirge-panel/` backend repo içinde — git submodule değil, ayrı `.git` | BİLGİ |
| 8 | `Dockerfile` git history'de görünüyor ama dosya yok — silinmiş olabilir | BİLGİ |
