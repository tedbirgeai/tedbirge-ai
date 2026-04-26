# TEDBIRGE.AI — MUSTERI ALTYAPISI KESIF RAPORU
## Tarih: 26 Nisan 2026 (TUR #10 Kesif)
## Mimar: Claude Sonnet 4.6

> Bu rapor muvekkil portali (TUR #10) oncesi mevcut altyapi durumunu tespit eder.
> Disiplin: Anayasa Madde 4.4 (kod kaynak), Madde 4.5 (once oku).
> Tedavi YOK, sadece tani.

---

## OZET TABLO

| Soru | Cevap | Kanit |
|------|-------|-------|
| CUSTOMER rolü kodda kullaniliyor mu? | EVET — 11 dosya, 18+ satir | K1 |
| Lead.ownerId = CUSTOMER User FK mu? | EVET — `where: { ownerId: userId }` | K6 |
| Lead.customer* okunuyor/yaziliyor mu? | EVET — SMS/email/WhatsApp + analitik | K2 |
| Auth: sifre mi magic link mi? | Sifre + JWT + OTP kayit + 2FA | K3 |
| E-posta servisi kurulu mu? | EVET — nodemailer v8 (Gmail SMTP) | K4 |
| Muvekkil frontend izi var mi? | EVET — tam portal sayfasi (5 tab) | K5 |
| Document upload uploadedById nasil? | Optional String (User FK degil) | K6 |
| Muvekkil endpoint izi var mi? | EVET — 5 endpoint, index.js'de mount | K8 |

---

## KRITIK KESIF: G10-0 YANLIS TESHIS

TUR #10 ilk G10-0 kontrolunde "Lead-User (muvekkil) bagi YOK" sonucuna varildi.
**Bu teshis yanlistir.** Kod incelemesi gercegi ortaya koydu:

```
Lead.ownerId → User (CUSTOMER rolundeki kullanici)
musteri.controller.js:11: where: { ownerId: userId }
```

`ownerId` CUSTOMER kullanicinin FK'sidir. Altyapi buyuk oranda kurulu.

---

## K1 — CUSTOMER Rolü Kullanimi

**Bulunan dosyalar (11 dosya, 18+ kritik satir):**

```
src/utils/leadAccess.js:10:   CUSTOMER  → yalnizca ownerId === user.id olan lead'ler
src/utils/leadAccess.js:56:   if (role === "CUSTOMER") {
src/utils/leadAccess.js:91:   if (role === "CUSTOMER") {
src/routes/musteri.routes.js:8-13:  Tum route'lar CUSTOMER rolune acik (5 endpoint)
src/routes/contract.routes.js:12:   role("ADMIN","SALES","REPRESENTATIVE","LAWYER","CUSTOMER")
src/routes/contract.routes.js:16:   role("ADMIN","SALES","REPRESENTATIVE","LAWYER","CUSTOMER")
src/controllers/auth.controller.js:42:  role: "CUSTOMER" (createCustomer)
src/controllers/auth.controller.js:286: role: "CUSTOMER" (registerCustomer)
src/controllers/auth.controller.js:262: // Muvekkil (CUSTOMER) Web Kaydi — OTP dogrulamali
src/controllers/auth.controller.js:647: validation icinde "CUSTOMER" var
src/services/auth.service.js:9:  role = "CUSTOMER" (default)
src/controllers/lead.controller.js:21: const ownerId = role === "CUSTOMER" ? userId : null;
src/services/lead.service.js:144-145:  CUSTOMER durum guncelleyemez
src/services/lead.service.js:198:  Owner olarak sadece CUSTOMER atanabilir
src/controllers/__tests__/:  CUSTOMER test case'leri var
```

**Yorum:** CUSTOMER rolu tamamen kurulu. Hem backend hem panel hem de test altyapisinda aktif.

---

## K2 — Lead.customer* Alanlari

**Kullanim ornekleri:**

- `textTemplates.js` — SMS sablonu icin name/phone
- `promptBuilder.js` — AI prompt icin name/phone
- `contract.service.js` — Sozlesme icerigine name/phone/email yaziliyor
- `analytics.service.js` — Analitik rapor ve komisyon hesabi
- `whatsapp.service.js` — WhatsApp mesaji customerPhone'a gonderiliyor
- `sms.service.js` — 4 farkli SMS fonksiyonu customerPhone kullanıyor
- `email.service.js` — Email customerEmail'e gonderiliyor (3 farkli fonksiyon)
- `lead.service.js` — Olusturma ve arama filtreleri
- `public.route.js` — Public basvuru formu yazma/okuma
- `payment.controller.js` — PayTR odeme icin email/name/phone
- `ihtarname.service.js` — Ihtarname SMS bildirimi

**Yorum:** customer* alanlari hem iletisim altyapisi (SMS/email/WhatsApp) hem de goruntuleme icin kullaniliyor. Public form'dan gelen veri bu alanlarda tutuluyor. CUSTOMER kullanici kaydedilince Lead.ownerId set ediliyor, customer* alanlar ayri kalinmaya devam ediyor (paralel veri).

---

## K3 — Auth/Login Akisi

**Endpoint'ler:**
```
POST /auth/register          — ADMIN onayli kayit
POST /auth/register/hukukcu  — Avukat kaydi
POST /auth/register/temsilci — Temsilci kaydi
POST /auth/register/customer — Muvekkil self-kayit (OTP + email dogrulama)
POST /auth/register/send-otp — Kayit OTP gonder
POST /auth/create-customer   — Admin/Rep tarafindan musteri olustur + lead bagla
POST /auth/login             — Email + sifre
POST /auth/forgot-password   — Sifre sifirlama email
POST /auth/reset-password    — Token ile sifre yenile
POST /auth/setup-2fa         — TOTP kurulum
POST /auth/login-2fa         — 2FA dogrulama
POST /auth/verify-email      — Email dogrulama token'i
```

**Muvekkil kayit akisi (registerCustomer):**
1. `send-otp` ile telefona OTP gonder
2. `register/customer` ile: fullName + email + password + phone + otpKod + (opsiyonel leadId)
3. OTP dogrulama → User (CUSTOMER) olustur → JWT token
4. leadId varsa Lead.ownerId = User.id
5. Email dogrulama linki gonder (VerificationToken)

**Pattern:** Sifre + JWT. Magic link YOK (sadece reset ve email verify linkleri var). OTP telefon dogrulamali kayit var.

---

## K4 — E-posta/SMS Altyapisi

**package.json bagimliliklari:**
```json
"nodemailer": "^8.0.5"    — Gmail SMTP (SMTP_HOST/PORT/USER/PASS env)
"web-push": "^3.6.7"      — Web push bildirimleri
```

**Servis dosyalari:**
- `email.service.js` — Nodemailer + Gmail SMTP. SMTP_PASS yoksa mock mod.
  - sendEmail(): genel
  - sendLeadCreatedEmail(): yeni dava bildirimi avukata
  - sendContractSignedEmail(): sozlesme imzalandi
  - sendLawyerAssignedEmail(): avukat atamasi
- `sms.service.js` — NetGSM API. 4 muvekkil SMS fonksiyonu.
- `whatsapp.service.js` — WhatsApp Business API
- `pushNotification.service.js` — Web push

**Bulgu:** Email (nodemailer), SMS (NetGSM), WhatsApp, Web Push — 4 kanal kurulu. Email mock moda dusebilir (SMTP env yoksa). SMS production'da aktif.

---

## K5 — Muvekkil Frontend Izleri

**Bulunan:** `tedbirge-panel/app/(panel)/musteri/page.tsx` — TAM KURULU PORTAL

**5 sekme:**
1. Genel Bakis — leadCode, durum, atanan avukat, tahmini tazminat arali, zamanasimi sayaci, animasyonlu dava timeline
2. Belgeler — Document listesi, AI analiz gosterimi
3. Mesajlar — Avukatla real-time chat (apiFetch /musteri/mesajlar)
4. Odemeler — Masraf listesi, odeme durumu
5. Onay — SMS OTP ile sozlesme onay akisi (3 adim: sec, SMS al, dogrula)

**Endpoint baglantilar:**
```typescript
apiFetch("/musteri/dashboard")    // ana veri
apiFetch("/musteri/mesajlar")     // mesaj listesi
apiFetch("/musteri/mesaj", POST)  // mesaj gonder
apiFetch(`/musteri/onay-baslat/${id}`, POST)
apiFetch(`/musteri/onay-dogrula/${id}`, POST)
```

**Yorum:** Portal sayfasi tamamen kurulu ve fonksiyonel. getStoredUser() ile kullanici bilgisi, apiFetch ile API baglantisi. Tek eksik: login sonrasi CUSTOMER rolünün /musteri'ye yonlendirilmesi (routing).

---

## K6 — Document Upload Pattern

**musteri.controller.js getDashboard:**
```javascript
const lead = await prisma.lead.findFirst({
  where: { ownerId: userId },   // CUSTOMER kullanici = Lead.owner
  include: { documents: ... }
});
```

**model Document (schema):**
```prisma
uploadedById  String?  // User FK degil — sadece String (optional)
```

**Bulgu:** Muvekkil lead'e `ownerId` uzerinden bagli. Documents lead'e dahil, goruntuleme yapiliyor. Muvekkil belge yukleme ozelliginin frontend'i yok (panel'de sadece goruntuluyor). Upload avukat/sistem tarafindan yapiliyor.

---

## K7 — Schema Ilgili Modeller

### enum Role
```prisma
enum Role {
  ADMIN
  SALES
  LAWYER
  CUSTOMER
  REPRESENTATIVE
}
```

### model User
```prisma
model User {
  id                  String  @id @default(cuid())
  fullName            String
  email               String  @unique
  phone               String?
  passwordHash        String
  role                Role    @default(CUSTOMER)
  isActive            Boolean @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime
  resetToken          String?
  resetTokenExpires   DateTime?
  sonGirisTarihi      DateTime?
  twoFactorEnabled    Boolean @default(false)
  twoFactorSecret     String?
  baroSicilNo         String?
  bolge               String?
  // ... avukat/temsilci alanlari
  assignments         Assignment[]
  createdLeads        Lead[]  @relation("Lead_createdByIdToUser")
  Lead_Lead_ownerIdToUser Lead[] @relation("Lead_ownerIdToUser")
  PushSubscription    PushSubscription[]
}
```

### model Lead
```prisma
model Lead {
  id            String   @id @default(cuid())
  leadCode      String   @unique
  customerName  String              // public form string alani
  customerPhone String              // public form string alani
  customerEmail String?             // public form string alani
  status        LeadStatus @default(NEW)
  ownerId       String?             // CUSTOMER User FK (muvekkil bagli oldugunda)
  createdById   String?             // olusturan kullanici (avukat/temsilci)
  // ... diger alanlar
  owner         User? @relation("Lead_ownerIdToUser", fields: [ownerId], ...)
  createdBy     User? @relation("Lead_createdByIdToUser", fields: [createdById], ...)
  documents     Document[]
  contracts     Contract[]
  assignments   Assignment[]
  masraflar     Masraf[]
  activities    ActivityLog[]
}
```

### model Document
```prisma
model Document {
  id           String  @id @default(cuid())
  leadId       String
  uploadedById String?  // optional String (User relation degil, sadece String)
  type         DocumentType @default(OTHER)
  status       DocumentStatus @default(UPLOADED)
  originalName String
  storedName   String
  storageKey   String?
  aiAnalysis   String?
  Lead         Lead @relation(fields: [leadId], references: [id])
}
```

---

## K8 — Muvekkil Endpoint Izleri

```javascript
// src/routes/musteri.routes.js — 5 endpoint
router.get("/dashboard",                   auth, role("CUSTOMER"), ctrl.getDashboard);
router.get("/mesajlar",                    auth, role("CUSTOMER"), ctrl.getMessages);
router.post("/mesaj",                      auth, role("CUSTOMER"), ctrl.sendMessage);
router.post("/onay-baslat/:contractId",    auth, role("CUSTOMER"), ctrl.startApproval);
router.post("/onay-dogrula/:contractId",   auth, role("CUSTOMER"), ctrl.verifyApproval);

// src/routes/index.js:47 — mount edilmis
router.use("/musteri", musteriRoutes);
```

**Yorum:** Endpoint'ler kurulu ve aktif. Muvekkil login olup JWT alinca /musteri/* endpoint'lerine erisebiliyor.

---

## MIMAR ORTAGA GIRDI — TUR #10 KARAR SECENEKLERI

### Gercek Durum (kod kaniti)

Altyapi dusundugumuzden COK daha ilerlede:

| Bilesik | Durum |
|---------|-------|
| CUSTOMER rol (schema) | KURULU |
| Lead.ownerId → User FK | KURULU |
| /auth/register/customer | KURULU |
| /auth/create-customer (admin) | KURULU |
| /musteri/* (5 endpoint) | KURULU |
| musteri.controller.js | KURULU |
| Panel /musteri/page.tsx (5 tab) | KURULU |
| SMS bildirimleri | KURULU |
| Email bildirimleri | KURULU |
| Sozlesme SMS onay | KURULU |

### Yol A — Migration SART
Kanit disi. CUSTOMER zaten var, ownerId zaten FK.
Onerilen: ATLA.

### Yol B — Migration GEREK YOK (mevcut altyapi yeterli)
**KANITA UYGUN.**
- Backend: hazir
- Panel sayfasi: hazir
- Kayit akisi: hazir

Eksik olan (kucuk):
1. Panel login sonrasi CUSTOMER rolunu /musteri'ye yonlendirme (routing hook)
2. Panel layout'ta CUSTOMER icin sidebar/nav (su an avukat/admin navbari gosterilebilir)
3. Muvekkil olusturma paneli (admin'in musteri kaydedip Lead baglamasi icin UI)

### Yol C — Kucuk Patch (Onerim)
- G10-1: Panel login redirect — CUSTOMER → /musteri
- G10-2: Panel layout — CUSTOMER icin temiz nav (panel sidebar gizle veya musteri layout)
- G10-3: Admin panelinde "Musteri Kaydı" akisi (create-customer endpoint zaten var)
- G10-4: Test + deploy

**Sure: 1-2 saat. Risk: Dusuk. Schema/Migration: SIFIR.**

---

— Claude Code, TUR #10 Kesif sonu
