# TEDBIRGE.AI — MUVEKKIL AKISI UCTAN UCA HARITA
## Tarih: 26 Nisan 2026 (TUR #11 Kesif)
## Mimar: Claude Sonnet 4.6

> Bu rapor muvekkilin sisteme ilk temasından sozlesme imzalamasina kadar
> tum akisin kod-kanitli haritasidir. Tedavi YOK. Sonraki 3-4 turun tasarim girdisi.
> Disiplin: Anayasa Madde 4.4 (kod kaynak), Madde 4.5 (once oku).

---

## OZET SEMA (akis gorsel)

```
[GIRIS NOKTASI]
  Public form (/basvuru)   ──┐   SMS/Email/WA bildirim YOK (BUG #6)
  LexScan asistan (/lexscan)─┤   (bag yok, standalone chat)
  WhatsApp inbound ──────────┤   (Lead olusturmuyor, sadece mesaj kaydediyor)
  UTM/Referrer ──────────────┘   (YOK - hic takilmiyor)
         │
         ▼
   [LEAD OLUSUR]
   customerName/Phone/Email string
   qualificationScore = 0
   ownerId = null (hic baglanmamis)
         │
         ▼
   [AI ANALIZ] — belge yuklenince tetikleniyor (async)
   upload.service.js → analyzer.service.js → ai.service.js (claude-sonnet-4-6)
   qualificationScore guncellenir
         │
         ▼
   [BILDIRIM] — lead.service.js createLead'de var, public.route.js'de YOK (BUG #6)
   SMS + Email + WhatsApp (muvekile + avukata)
         │
         ▼
   [ATAMA] — MANUEL (otomatik bolge eslestirme YOK)
   ADMIN/SALES/REPRESENTATIVE → assignLead → Assignment.create
   Lead.status = "ASSIGNED_TO_LAWYER"
   SMS + Email + WA bildirim (avukat atandi)
         │
         ▼
   [SOZLESME OLUSTUR] — Avukat el ile
   contract.controller.js generate → Contract.create (DRAFT)
         │
         ▼
   [MUVEKKIL ONAY — SMS OTP]
   /musteri/onay-baslat → OTP SMS → /musteri/onay-dogrula
   Contract.status = "SIGNED"
         │
         ▼
   [CUSTOMER USER + Lead.ownerId KOPRUSU] ← EKSIK UI (BUG #2,3)
   registerCustomer endpoint var, UI YOK
   createCustomer endpoint var, UI YOK
         │
         ▼
   [/musteri PORTALI 5 TAB]
   Lead.ownerId === User.id ile erisim
   Genel / Belgeler / Mesajlar / Odemeler / Onay
```

**KRITIK:** Yukaridaki akista UCHUN kopukluklari var. Detaylar asagida.

---

## BOLUM 1 — GIRIS NOKTALARI

### M1 — Public Basvuru Formu

**Panel:** `tedbirge-panel/app/(public)/basvuru/page.tsx`
- 4 adim form: Bilgiler / Kaza / Belgeler / Onay
- Submit: `POST ${API_BASE}/public-lead` (FormData)
- Gonderilen alanlar: fullName, phone, email, city, summary, kvkkApproved, healthDataApproved, file (opsiyonel)

**Backend:** `src/routes/public.route.js:18`
```javascript
router.post("/public-lead", upload.single("file"), supabaseUploadMiddleware, async (req, res) => {
  const lead = await prisma.lead.create({
    data: {
      leadCode: generateLeadCode(),
      customerName: String(fullName).trim(),
      customerPhone: String(phone).trim(),
      customerEmail: email ? String(email).trim() : null,
      city: city ? String(city).trim() : null,
      accidentSummary: summary ? String(summary).trim() : null,
      kvkkConsentAt: kvkkConsent,
      healthDataConsentAt: healthDataConsent,
      status: "NEW",
      qualificationScore: 0
      // updatedAt YOK — BUG #1 (schema'da @updatedAt mi bilgi notu)
    }
  });
```

**BUG #1 — updatedAt:** public.route.js Lead.create()'da `updatedAt` set edilmiyor. Schema'da `updatedAt DateTime` (opsiyonel @updatedAt direktifi dogrulanmali). Kullanici kanitladi (ekran goruntusu mevcut).

**BUG #6 — Bildirim eksik:** public.route.js'de lead olustuktan sonra hicbir SMS/Email/WhatsApp bildirimi yok. (lead.service.js createLead()'de var ama public form farkli yol.)

**Duplicate check:** customerPhone ile mevcut lead kontrolu var (satir 29-38). Ayni telefon ikinci basvuru yaparsa 409 doner.

**Rate limiting:** upload.single("file") middleware var, ama rate limiter YOK public-lead endpointinde.

**Document upload:** Supabase Storage supabaseUploadMiddleware ile, basarili olursa Document tablosuna kayit.

**AI analiz:** Lead create'de tetiklenmiyor. Sadece belge yuklenince tetikleniyor (uploadAnalysis.bridge.js via upload.service.js).

---

### M2 — LexScan Asistani

**BULUNDU.** `src/controllers/lexscan.controller.js` + `src/routes/lexscan.routes.js`

```javascript
// lexscan.controller.js:1-39
// Herkese acik AI chat (claude-sonnet-4-6)
// SYSTEM_PROMPT: kaza tur → yaralanma → tazminat tahmini → basvuruya yonlendir
// MODEL = "claude-sonnet-4-6"
// MAX_TOKENS = 600
// Her yanit sonu: "👉 Ücretsiz degerlendirme icin: tedbirge.ai/basvuru"
```

Mounted: `router.use("/lexscan", lexscanRoutes)` — `/api/lexscan`
Muvekkil akisina baglantisi: DOLAYLI (sadece basvuruya yonlendirir, Lead olusturmuyor).
Frontend: Panel'de LexScan chat sayfasi aranmadi — TUR #12 konusu.

---

### M3 — UTM/Referrer Takibi

**BULUNMADI.** Kod taramasinda `utm_source`, `utm_medium`, `utm_campaign`, `gclid`, `fbclid`, `referrer` kelimeleri hicbir .js/.ts/.tsx dosyasinda yok.

Lead modelinde `source` veya `utm_*` alani yok.

---

### M4 — WhatsApp/SMS Inbound

**VAR.** `src/routes/whatsapp.routes.js`

```javascript
// GET /webhook — Meta dogrulama handshake (challenge)
// POST /webhook — Gelen mesajlar + delivery status
```

**handleIncomingMessage akisi:**
```javascript
// customerPhone ile lead bul (son 10 hane)
const lead = await prisma.lead.findFirst({
  where: { customerPhone: { contains: from.slice(-10) } },
});
if (!lead) return; // Kayıtlı musteri degil — Lead OLUSTURMUYOR

// ChatSession bul/olustur (key: "wa-{lead.id}")
// ChatMessage.create (sender: "user", mesaj: "[WhatsApp] {text}")
// ActivityLog: WHATSAPP_MESAJ_ALINDI
```

**Bulgu:**
- Inbound webhook KURULU, Meta handshake destegi var
- Ancak: Lead OLUSTURMUYOR (sadece mevcut lead'e mesaj kaydediyor)
- Bilinmeyen numara (lead yok): Sessizce atlaniyor
- Avukata bildirim: YOK (mesaj ChatMessage'a yaziliyor ama avukat push/SMS gitmiyor)

---

### M5 — Self-Register Endpoint

**Backend:** `/auth/register/customer` — KURULU

```javascript
// auth.controller.js:264
exports.registerCustomer = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone, otpKod, leadId } = req.body;
  // 1. OTP dogrula (PhoneOtp tablosu, purpose: "kayit")
  // 2. authService.register({ fullName, email, password, phone, role: "CUSTOMER" })
  // 3. leadId verilmisse: Lead.update({ ownerId: user.id })
  // 4. Email dogrulama linki gonder (VerificationToken)
});
```

**Frontend:** YOOK

Panel'de register dizini:
```
app/(public)/register/hukukcu/page.tsx  ✓
app/(public)/register/temsilci/page.tsx ✓
app/(public)/register/musteri/          ← MEVCUT DEGIL (404)
```

**Bulgu: OLDU ENDPOINT.** Backend tam kurulu, UI yok. Muvekkil self-register yapamaz.

---

### M6 — Avukat Manuel Muvekkil Kaydi

**Backend:** `/auth/create-customer` — KURULU

```javascript
// auth.controller.js:14
exports.createCustomer = asyncHandler(async (req, res) => {
  // fullName, email, password, phone, leadId
  // authService.register({ role: "CUSTOMER" })
  // leadId verilmisse: Lead.update({ ownerId: user.id })
});

// auth.routes.js:14
router.post("/create-customer", auth, role("ADMIN", "SALES", "REPRESENTATIVE"), controller.createCustomer);
```

**Frontend Panel arama:** `create-customer` string panel .tsx dosyalarinda BULUNAMADI.

**Bulgu: OLDU ENDPOINT.** ADMIN/SALES/REPRESENTATIVE cagirabiliyor ama panel UI yok. Admin "Musteri Kaydet" butonu/sayfasi yok.

---

## BOLUM 2 — ISLEME AKISI

### M7 — AI Analiz Pipeline

**qualificationScore = 0** lead olusturunca (public.route.js:69, lead.service.js:31 default).

**Gercek AI analiz:** belge yuklenince tetikleniyor.

```
upload.service.js:81
  → analyzer.service.js.analyzeExtractedText()
      → ai.service.js (Anthropic claude-sonnet-4-6)
      → compensation.engine.js
  → Lead.update({ qualificationScore, aiSummary, estimatedCompensation })
```

**Senkron mu:** Hayir — upload akisi icinde async calisıyor (await var ama HTTP response beklenmiyor).
**Fallback:** analyzer.service.js `makeFallback()` → qualificationScore=null, aiSummary hata mesaji.
**Mock mod:** `analysisConfig.analysisMode === "mock"` ise Anthropic cagirilmiyor, sabit mock sonuc.

---

### M8 — Otomatik Bildirim

**Lead olusturunca (lead.service.js createLead):**

| Kanal | Alici | Mesaj | Kod |
|-------|-------|-------|-----|
| SMS | Muvekkil | "Basvurunuz alindi. Takip: {leadCode}. tedbirge.ai/basvuru-sorgula" | :49 |
| Email | Muvekkil | sendApplicationReceivedEmail(lead) | :53 |
| WhatsApp | Avukata? | sendNewLeadNotification(lead) | :57 |
| Push | sendToUser/sendToRole | yeni lead bildirimi | :11 |

**ONEMLI:** public.route.js (public form) createLead()'i CAGIRMIYOR. Dogrudan prisma.lead.create() yapiyor. Bu nedenle public form'dan gelen basvurularda yukaridaki bildirimler GITMIYOR.

**Avukat atamasi (assignment.service.js):**

| Kanal | Alici | Mesaj |
|-------|-------|-------|
| SMS | Muvekkil | sendLawyerAssignedSms — "Av. {isim} dosyanizi aldi" |
| Email | Avukat | sendLawyerAssignedEmail |
| WhatsApp | Muvekkil | sendLawyerAssignedNotification |

**SMS sablonlari (sms.service.js):**
- sendLeadCreatedSms — basvuru alindi
- sendLawyerAssignedSms — avukat atandi
- sendDocumentAnalyzedSms — belge analizi tamamlandi
- sendStatusChangeSms — durum degisti

**textTemplates.js:** Sozlesme metin sablonlari (serviceAgreementTemplate, powerOfAttorneyTemplate) — SMS degil, PDF icerik icin.

---

### M9 — Atama Akisi

**Manuel:** `POST /api/leads/:leadId/assign` → assignment.controller.js → assignLeadToLawyer

```javascript
// assignment.service.js:7
async function assignLeadToLawyer({ leadId, lawyerId, note, caller }) {
  // REPRESENTATIVE: sadece kendi olusturuklari lead'e atayabilir
  // Lead bulunamaz → 404
  // Lawyer bulunamaz veya LAWYER degil → 400
  // Assignment.create({ leadId, lawyerId, status: "ACTIVE" })
  // Lead.update({ status: "ASSIGNED_TO_LAWYER" })
  // ActivityLog: LAWYER_ASSIGNED
  // SMS + Email + WhatsApp bildirim (parallel, hata sessiz)
}
```

**Otomatik bolge eslestirme:** YOK. Tamamen manuel.
**Coklu atama:** destekleniyor (Assignment model, status ACTIVE). Gecmis atamalar kalir.

---

### M10 — Sozlesme Akisi

**Olusturma:**
```javascript
// contract.controller.js:38
exports.generate = asyncHandler(async (req, res) => {
  // requireLeadAccessById → assertLeadAccess (ADMIN/LAWYER/REPRESENTATIVE)
  // generateContract({ leadId, type, createdById })
  // Contract.create({ status: "DRAFT", content: template, title })
});
// Tipler: SERVICE_AGREEMENT, POWER_OF_ATTORNEY
```

**Muvekkil onay:**
```javascript
// musteri.controller.js:116 startApproval
// 1. Lead.ownerId === req.user.id dogrula
// 2. OTP uret (6 hane, 10 dk)
// 3. Contract.update({ onayKodu, onayKoduExpires })
// 4. sendOtpSms(lead.customerPhone, kod)

// musteri.controller.js:145 verifyApproval
// 1. Kod + sure dogrulama
// 2. Contract.update({ musteriOnayladi: true, musteriOnayTarihi: now, status: "SIGNED" })
// 3. ActivityLog: SOZLESME_MUVEKKIL_ONAY
```

**Imzalama sonrasi:** Contract.status = "SIGNED". Document tablosuna ayrı kayit YAPILMIYOR.
**Sözlesme PDF:** contract.controller.js'de PDF generate koddu var (pdfkit) — avukat goruntuleme icin.

---

## BOLUM 3 — CIKIS NOKTALARI

### M11 — /musteri Portali 5 Endpoint Detayi

**getDashboard (`GET /musteri/dashboard`):**
```javascript
prisma.lead.findFirst({ where: { ownerId: userId },
  include: {
    documents: { select: { id, originalName, status, createdAt, aiAnalysis } },
    contracts: { select: { id, type, status, title, createdAt, musteriOnayladi, musteriOnayTarihi } },
    assignments: { where: { status: "ACTIVE" }, include: { lawyer: { select: { id, fullName, email, phone } } } },
    masraflar: { select: { id, tur, tutar, tarih, aciklama, odendi } },
    activities: { take: 30, select: { id, action, detail, createdAt } },
  }
});
// ownerId null ise → { success: true, data: null } (frontend: "hesabiniza bagli dosya yok")
```

**getMessages (`GET /musteri/mesajlar`):**
```javascript
// ownerId ile lead bul → leadId
// ChatMessage.findMany({ where: { leadId }, orderBy: { createdAt: "asc" }, take: 100 })
// sender: "user" (muvekkil) veya "lawyer" (avukat) — sender alani serbest string
```

**sendMessage (`POST /musteri/mesaj`):**
```javascript
// ChatSession bul/olustur (key: "muvekkil-{leadId}")
// ChatMessage.create({ sender: "user", message })
// ActivityLog: MUVEKKIL_MESAJ
// EKSIK: Avukata bildirim (push/SMS) gitmiyor
```

**startApproval / verifyApproval:** M10'da dokumante edildi.

---

### M12 — Document Akisi

**CUSTOMER goruntuleme:**
```javascript
// document.controller.js:29 downloadDocument
// doc → lead → assertLeadAccess(req.user, lead)
// assertLeadAccess: CUSTOMER → ownerId === user.id → izin var
// createSignedDownloadUrl(doc.path, 3600) → Supabase signed URL → res.redirect()
// Render RAM'den gecmiyor (dogrudan Supabase'den indirir)
```

**CUSTOMER upload:** YOK. document.controller.js sadece `downloadDocument` export ediyor. Upload avukat/sistem tarafindan yapiliyor. Muvekkil portal UI'inda belge yükleme butonu yok.

**uploadedById:** Optional String. User FK degil. Public form'dan yuklenen belgelerde `null` set ediliyor. CUSTOMER upload yaparsa hangi User ID yazilacagi belirsiz.

---

## BOLUM 4 — KOPUKLUKLAR

### M13 — Bilinen Bug'lar ve Eksikler

**BUG #1 — KRITIK: public.route.js updatedAt eksik**
```
Dosya: src/routes/public.route.js:58
prisma.lead.create() cagrisinda `updatedAt` field'i set edilmiyor.
Schema: updatedAt DateTime (opsiyonel @updatedAt bilgi notu)
Risk: Public form submit 500 verebilir (kullanici ekran goruntusunu sagladi)
Duzeltme: updatedAt: new Date() ekle VEYA schema'ya @updatedAt ekle
```

**BUG #2 — Self-register UI yok**
```
Backend: /auth/register/customer — tam kurulu (OTP + email)
Frontend: /register/musteri — MEVCUT DEGIL (404)
Etki: Muvekkil kendi hesabini olusturamaz
```

**BUG #3 — Admin Musteri Kaydet UI yok**
```
Backend: /auth/create-customer — tam kurulu (ADMIN/SALES/REP)
Frontend: Panel'de "Musteri Kaydet" sayfasi/butonu yok
Etki: Admin muvekkili sisteme alip Lead'e baglamiyor
```

**BUG #4 — Lead yonetimi UI yok**
```
Sil / arsiv / geri al islemi panel'de yok
Schema'da archivedAt / deletedAt alanlari da yok (soft delete mevcut degil)
Etki: Test verisi ve gercek silme islemi yapilemiyor
```

**BUG #5 — Document.uploadedById User FK degil**
```
Schema: uploadedById String? (iliskisel degil, sadece string)
Etki: Muvekkil upload yaparsa User.id yazilabilir ama veritabani katmaninda bagli degil
Bilgi notu seviyesinde (simdilik production'i etkilemiyor)
```

**BUG #6 — Public form'da bildirim eksik**
```
Dosya: src/routes/public.route.js
lead.service.js createLead() cagirilmiyor — dogrudan prisma.lead.create()
Sonuc: Public form'dan gelen basvurularda SMS/Email/WhatsApp gitmiyor
Muvekkil "basvurunuz alindi" SMS'i almıyor
```

**BUG #7 — WhatsApp inbound bilinmeyen musteri atlaniyor**
```
whatsapp.routes.js:101: if (!lead) return;
Sorun: WhatsApp'tan ilk kez mesaj atan kullanici (lead'i yok) sistem kaydina girmez
Etki: Potansiyel muvekkil kaybediliyor
```

**BUG #8 — Muvekkil mesaj atinca avukata bildirim gitmiyor**
```
musteri.controller.js:76 sendMessage
ChatMessage olusturuluyor ama avukata push/SMS yok
Etki: Avukat muvekkilin mesajini gormek icin panele girmesi gerekiyor
```

---

### M14 — Muvekkil → CUSTOMER User Koprusu

**Soru:** Public form'dan gelen Lead, ne zaman CUSTOMER User hesabina donusuyor?

**Var olan akislar:**

| Akis | Durum | UI |
|------|-------|-----|
| registerCustomer (OTP + self) | Backend KURULU | Frontend YOK |
| createCustomer (Admin/Rep) | Backend KURULU | Frontend YOK |
| Auto-account (form submit ile) | YOK | YOK |

**Sonuc: Senaryo D** — CUSTOMER User ayrı yoldan olusturulmasi gerekiyor ama bunun icin hicbir UI yok.

**Fiili durum:**
1. Muvekkil public form'u doldurur → Lead olusur (ownerId = null)
2. Avukat/Admin panele girer, lead'i gorunur
3. Muvekkili sisteme almak icin: API'ye dogrudan cagri (Postman?) veya test amacli elle yapiliyor
4. Lead.ownerId = User.id baglantisi ancak o zaman kurulur
5. Muvekkil /musteri portalina giris yapamaz (ownerId=null → dashboard null → "hesabiniza bagli dosya yok")

**Bu akis EKSIK.** Sozlesme onayini müvekkil yapmasi isteniyor (`/musteri/onay-baslat`) ama muvekkil sisteme kaydedilmemis ve ownerId baglantisi kurulmamis.

---

### M15 — Schema Ilgili Modeller

**Aranmis, bulunamayan alanlar:**
- Lead.archivedAt: YOK
- Lead.deletedAt: YOK (soft delete yok)
- Lead.source: YOK
- Lead.utm_*: YOK
- model Message: YOK (ChatMessage var)

**model Assignment:**
```prisma
model Assignment {
  id        String           @id @default(cuid())
  leadId    String
  lawyerId  String
  note      String?
  status    AssignmentStatus @default(ACTIVE)
  createdAt DateTime         @default(now())
  updatedAt DateTime
  lawyer    User             @relation(fields: [lawyerId], references: [id])
  lead      Lead             @relation(fields: [leadId], references: [id])
}
```

**model Contract:**
```prisma
model Contract {
  id                String         @id @default(cuid())
  leadId            String
  createdById       String?
  type              ContractType
  status            ContractStatus @default(DRAFT)
  title             String
  content           String
  createdAt         DateTime       @default(now())
  updatedAt         DateTime
  musteriOnayTarihi DateTime?
  musteriOnayladi   Boolean        @default(false)
  onayKodu          String?
  onayKoduExpires   DateTime?
  User              User?          @relation(...)
  Lead              Lead           @relation(...)
}
```

**model ChatMessage (mesajlasma icin):**
```prisma
model ChatMessage {
  id           String       @id @default(cuid())
  sessionId    String?
  leadId       String?
  sender       String       // "user" | "lawyer" | "system" — serbest string
  message      String
  metadataJson String?
  createdAt    DateTime     @default(now())
}
```

**model ActivityLog:**
```prisma
model ActivityLog {
  id        String   @id @default(cuid())
  leadId    String?  // null olabilir (sistem eventi)
  action    String   // LEAD_CREATED, LAWYER_ASSIGNED, SOZLESME_MUVEKKIL_ONAY, vb.
  detail    String?
  createdAt DateTime @default(now())
}
```

**model Document:**
```prisma
model Document {
  id           String  @id @default(cuid())
  leadId       String  // required
  uploadedById String? // optional String — User FK degil
  type         DocumentType @default(OTHER)
  status       DocumentStatus @default(UPLOADED)
  originalName String
  storedName   String
  mimeType     String
  sizeBytes    Int
  path         String
  parsedText   String?
  aiAnalysis   String?
  storageKey   String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime
  Lead         Lead @relation(...)
}
```

---

## MIMAR ORTAGA — STRATEJIK ONERI

### Bulgu Ozeti

| Alan | Durum |
|------|-------|
| Giris noktalari | 2 aktif (public form + LexScan), 2 hazir-ama-eksik (self-reg, admin-kayit), 1 kismen (WA inbound) |
| KRITIK bug | 2 (updatedAt eksik, bildirim eksik) |
| Orta bug | 3 (UI eksikleri + WA bilinmeyen) |
| Bilgi notu | 2 (uploadedById, avukat bildirim) |
| Muvekkil koprosu | Senaryo D — backend var, UI yok |

---

### TUR #12 — ACIL: updatedAt Bug + Public Form Bildirim (30 dk)

**Hedef:** Public form'dan gelen basvurular 500 veriyorsa duzelt, bildirim gonder.

G12-1: `src/routes/public.route.js` — prisma.lead.create() icine `updatedAt: new Date()` VEYA schema.prisma Lead.updatedAt'e `@updatedAt` ekle
G12-2: public.route.js'de lead.create() sonrasi SMS bildirim ekle (muvekkile "basvurunuz alindi")
G12-3: Test + push

Risk: DUSUK (2 atom degisiklik)

---

### TUR #13 — Muvekkil Aktivasyon Koprusu (1-2 saat)

**Hedef:** Admin/Rep panelde mevcut bir Lead'e musteri hesabi acabilsin.

G13-1: Panel leads/[id] sayfasina "Musteri Hesabi Ac" butonu + mini form (fullName, email, sifre)
G13-2: `POST /auth/create-customer` cagrisi (endpoint hazir)
G13-3: Basari sonrasi Lead.ownerId guncellendi konfirmasyon

Risk: DUSUK (yeni UI component, mevcut endpoint kullaniliyor)

---

### TUR #14 — Lead Yonetimi UI (1-2 saat)

**Hedef:** Admin lead silebilsin, arsivleyebilsin, geri alabilsin.

G14-1: Schema soft delete alanlari: `archivedAt DateTime?`, `deletedAt DateTime?`
G14-2: Lead listesinde "Arsivle" / "Sil" butonlari
G14-3: Migration + test

Risk: ORTA (schema degisiklik gerektiriyor — mimar onayi)

---

### TUR #15 — Self-Register UI (1 saat)

**Hedef:** Muvekkil kendi hesabini olusturabilsin (basvuru kodu ile).

G15-1: `/register/musteri/page.tsx` — basvuru kodu + telefon + OTP + sifre form
G15-2: `POST /auth/register/send-otp` + `POST /auth/register/customer` (her ikisi hazir)
G15-3: Basari → /musteri'ye redirect

Risk: DUSUK (backend hazir, sadece UI)

---

### TUR #16+ — Avukat Bildirimi + UTM + WhatsApp Lead Olusturma

- Muvekkil mesaj atinca avukata push/SMS bildirim
- UTM tracking (yeni Lead alanlari: source, utm_source, utm_campaign)
- WhatsApp'tan yeni musteri: bilinmeyen numara → otomatik lead olustur

Risk: ORTA-YUKSEK (schema + yeni entegrasyon)

---

— Claude Code, TUR #11 Kesif sonu
