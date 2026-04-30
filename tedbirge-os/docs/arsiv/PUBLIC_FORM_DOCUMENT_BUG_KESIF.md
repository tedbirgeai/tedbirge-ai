# PUBLIC FORM Document.create() updatedAt BUG — KESIF RAPORU
## Tarih: 26 Nisan 2026 (gece, TUR #17 Kesif)
## Mimar: Claude Code

> Bu rapor public form belgeli basvuru 500 hatasinin kok nedenini ve
> kapsamini kanitla tespit etmek icin yazildi. TEDAVI YOK -- sadece tani.
> Disiplin: Anayasa Madde 4.4 (kod kaynak), Madde 4.5 (once oku).

---

## OZET TABLO

| Soru | Cevap | Kanit |
|------|-------|-------|
| public.route.js Document.create() updatedAt veriyor mu? | HAYIR | K1 |
| schema.prisma model Document updatedAt'i @updatedAt mi? | HAYIR | K2 |
| TUR #12 sonrasi Lead.create updatedAt nasil cozulmus? | lead.service.createLead() ile (Lead'de @updatedAt var) | K1+K7 |
| Toplam prisma.document.create() cagrisi sayisi | 3 (hepsi updatedAt eksik) | K3 |
| @updatedAt decorator eksik model sayisi | 9 model | K4 |
| Kod tarafinda elle updatedAt veren yer | 0 (hic yok) | K5 |
| Production hata sayisi (son 1 saat) | Mehmet Bey kontrol edecek | K6 |

---

## K1 -- Public Route Tam Icerigi

### Document.create() cagirisi (public.route.js satir 67-79):

```javascript
if (req.file) {
  document = await prisma.document.create({
    data: {
      leadId: lead.id,
      uploadedById: null,
      type: "OTHER",
      status: "UPLOADED",
      originalName: req.file.originalname,
      storedName: req.file.filename || req.file.originalname,
      mimeType: req.file.mimetype || "application/octet-stream",
      sizeBytes: Number(req.file.size || 0),
      path: req.file.path || req.file.filename || req.file.originalname
      // updatedAt YOK -- BUG
    }
  });
```

### Lead.create() nasil cozulmus (TUR #12 sonrasi):

Commit `7eb0336` -- `fix(public): Lead.create yerine lead.service.createLead -- bildirim eklendi`:
- Public route'ta dogrudan `prisma.lead.create()` kaldirildi
- `leadService.createLead()` cagrisina gecildi
- Lead modeli schema'da `@updatedAt` decorator'i ZATEN VAR -- Prisma otomatik hallediyor
- Ama Document.create() bu fix'te DOKUNULMADI -- atlanda

**Yorum:**
- Lead.create() updatedAt: lead.service icerisinde otomatik (schema @updatedAt sayesinde)
- Document.create() updatedAt: SET EDILMIYOR -- BUG
- createLead() service kullaniliyor: EVET (TUR #12 sonrasi)
- Hata yonetimi: try/catch var ama async handler degil (raw async)

---

## K2 -- model Document Tam Tanimi

```prisma
model Document {
  id                 String         @id @default(cuid())
  leadId             String
  uploadedById       String?
  type               DocumentType   @default(OTHER)
  status             DocumentStatus @default(UPLOADED)
  originalName       String
  storedName         String
  mimeType           String
  sizeBytes          Int
  path               String
  parsedText         String?
  aiAnalysis         String?
  extractedJson      String?
  storageKey         String?
  compensationResult String?
  pageCount          Int?
  createdAt          DateTime       @default(now())
  updatedAt          DateTime       <-- @updatedAt DECORATOR YOK
  Lead               Lead           @relation(fields: [leadId], references: [id])
}
```

**Kiyaslama: model Lead updatedAt:**
```prisma
updatedAt    DateTime    @updatedAt   <-- decorator VAR (satir 224)
```

**Bulgu:**
- Document.updatedAt tanimi: `updatedAt DateTime` (bare -- no decorator, no default)
- Lead.updatedAt tanimi: `updatedAt DateTime @updatedAt` (decorator var -- Prisma otomatik set ediyor)
- Tutarsizlik: EVET -- Lead'de var, Document'ta yok

**Sonuc:** Document.create() cagrisi `updatedAt` field'i EXPLICIT vermezse Prisma "Argument `updatedAt` is missing" hatasi atar. Cunku:
- `@updatedAt` yok → Prisma otomatik set etmiyor
- `@default(now())` yok → varsayilan deger yok
- Zorunlu alan (nullable degil) → gecersiz input

---

## K3 -- Tum prisma.document.create() Cagrilari

```
src/routes/public.route.js:67       prisma.document.create  <-- BUG (public form)
src/controllers/upload.controller.js:94  prisma.document.create  <-- BUG (panel upload)
src/services/upload.service.js:28   prisma.document.create  <-- BUG (servis katmani)
```

### public.route.js:67 -- updatedAt var mi?
```javascript
data: { leadId, uploadedById: null, type, status, originalName, storedName,
        mimeType, sizeBytes, path }
// updatedAt: YOK
```

### upload.controller.js:94 -- updatedAt var mi?
```javascript
data: { leadId, uploadedById: req.user.id, originalName, storedName, path,
        sizeBytes, mimeType, status: "UPLOADED" }
// updatedAt: YOK
```

### upload.service.js:28 -- updatedAt var mi?
```javascript
data: { leadId, uploadedById, type, originalName, storedName, mimeType,
        sizeBytes, path, status: "UPLOADED" }
// updatedAt: YOK
```

**Sayim:**
- Toplam Document.create cagirisi: 3
- updatedAt veren: 0
- updatedAt vermeyen (bug): 3/3
- Etkilenen senaryolar:
  - Public form belgeli basvuru (public.route.js) -- BILINEN BUG
  - Panel uzerinden belge yukleme (upload.controller.js) -- MUHTEMELEN DE BOZUK
  - Servis katmaninda belge yukleme (upload.service.js) -- MUHTEMELEN DE BOZUK

---

## K4 -- Schema'da updatedAt Decorator Durumu

Ham cikti (`grep -n "updatedAt" prisma/schema.prisma`):
```
18:  updatedAt    DateTime
43:  updatedAt DateTime
82:  updatedAt  DateTime
97:  updatedAt         DateTime
128:  updatedAt       DateTime
150:  updatedAt          DateTime
196:  updatedAt      DateTime
224:  updatedAt             DateTime         @updatedAt
300:  updatedAt      DateTime
333:  updatedAt                  DateTime
485:  updatedAt DateTime @updatedAt
633:  updatedAt       DateTime  @updatedAt
```

**Tablo -- model satir haritalamasi:**
| Model | Satir | Icerik | @updatedAt? |
|-------|-------|--------|-------------|
| AccidentCase | 18 | `updatedAt DateTime` | HAYIR |
| Assignment | 43 | `updatedAt DateTime` | HAYIR |
| ChatSession | 82 | `updatedAt DateTime` | HAYIR |
| Contract | 97 | `updatedAt DateTime` | HAYIR |
| DavaSurec | 128 | `updatedAt DateTime` | HAYIR |
| Document | 150 | `updatedAt DateTime` | HAYIR |
| IhtarnameTakip | 196 | `updatedAt DateTime` | HAYIR |
| Lead | 224 | `updatedAt DateTime @updatedAt` | EVET |
| Petition | 300 | `updatedAt DateTime` | HAYIR |
| User | 333 | `updatedAt DateTime` | HAYIR |
| OSPolicy | 485 | `updatedAt DateTime @updatedAt` | EVET |
| KVKKSCC | 633 | `updatedAt DateTime @updatedAt` | EVET |

**Bulgu:**
- @updatedAt decorator olan model sayisi: 3 (Lead, OSPolicy, KVKKSCC)
- @updatedAt decorator OLMAYAN model sayisi: 9
- Eksik model listesi: AccidentCase, Assignment, ChatSession, Contract, DavaSurec,
  Document, IhtarnameTakip, Petition, User
- Etkilenen model create() cagrilari: bu modellerin hepsinde updatedAt explicit set edilmeli

**KRITIK NOT:** Assignment.create() ve Contract.create() da ayni soruna sahip.
Ancak bunlar production'da calisiyor mu test edilmedi (bu tur kapsam disi).

---

## K5 -- Manuel updatedAt Veren Yerler

Ham cikti:
```
src/routes/public.route.js:488:      orderBy: { updatedAt: "desc" },
src/routes/public.route.js:493:        updatedAt: true,
src/routes/public.route.js:560:      orderBy: { updatedAt: "desc" },
src/routes/public.route.js:565:        updatedAt:    true,
src/services/analytics.service.js:375:      updatedAt: true,
src/services/analytics.service.js:382:    orderBy: { updatedAt: "desc" },
src/services/sigortaBasvuru.service.js:53:    updatedAt: record.updatedAt,
```

**Analiz:**
- Toplam `updatedAt:` goren satir: 7
- Bunlarin tamami: orderBy, select, veya deger kopyalama (read operations)
- `updatedAt: new Date()` seklinde MANUEL set eden yer: 0 (SIFIR)
- Pattern tutarli mi: Hayir -- Lead icin @updatedAt var (schema cozuyor), diger modeller icin ne schema ne kod tarafinda cozum yok

**Sonuc:** Kod tabaninda hicbir yerde `updatedAt: new Date()` ile manuel set etme yok.
@updatedAt olmayan modellerde create() cagrisi her zaman hata verir.

---

## K6 -- Production Hata Sayisi

(Mehmet Bey Render dashboard'dan kontrol edecek -- not dusulur)

```
Render Logs son 1 saat: [N] adet "Argument `updatedAt` is missing" hatasi
Etkilenen endpoint: POST /api/public-lead (belgeli basvuru)
Etkilenen kullanici tahmini: her belge yukleyen potansiyel muvekkil
```

Ek soru Mehmet Bey icin: Panel'den belge yuklendiginde de hata var mi?
(upload.controller.js:94 ayni soruna sahip -- Render Logs'da kontrol edilmeli)

---

## K7 -- Git Log: public.route.js Degisiklik Gecmisi

```
d71292b feat(lead): UTM tracking aktif (public form'dan yakalama + DB yazimi)
7eb0336 fix(public): Lead.create yerine lead.service.createLead -- bildirim eklendi
f012308 refactor(prisma): singleton in public.route
f74f130 fix(public-lead): add supabaseUploadMiddleware to file upload chain
83bc975 feat: record health data consent timestamp for KVKK compliance
39492ab feat: initial commit -- tedbirge.ai v1.0 backend
```

**TUR #12 commit'i (7eb0336) ne yapti:**
- Hash: `7eb0336`
- Yaklasim: Dogrudan `prisma.lead.create()` → `leadService.createLead()` service'ine gec
- Lead icin updatedAt sorunu: Lead schema'da `@updatedAt` var, Prisma otomatik halleddi
- Document.create icin ne yapti: HICBIR SEY -- tamamen atlanmis
- Kapsam: Sadece Lead.create() path'i duzeltildi, Document.create() path'i gozden kacti

---

## K8 -- Lokal Import Test

```
$ node -e "require('./src/routes/public.route'); console.log('public.route OK');"
public.route OK
```

**Sonuc:** OK -- modul syntax'i dogru, dependency hatalari yok.
Hata runtime'da Prisma Client seviyesinde oluyor (schema enforcement).

---

## OZET BULGU

**Net teshis: SENARYO A + B KARISIK**

### Acil bug (Senaryo A -- atom fix):
Public form belgeli basvuru cokuyor cunku:
- `prisma.document.create()` cagrisi `updatedAt` vermiyor (public.route.js:67)
- Schema'da Document.updatedAt field'inde `@updatedAt` decorator YOK
- Prisma Client bu durumda field'i zorunlu tutuyor → 500 hatasi
- Fix: 3 Document.create() lokasyonuna `updatedAt: new Date()` ekle
- Risk: SIFIR (kod degisiklik, schema dokunmuyor)

### Sistemik sorun (Senaryo B -- schema migration):
- 9 modelde @updatedAt decorator eksik (AccidentCase, Assignment, ChatSession,
  Contract, DavaSurec, Document, IhtarnameTakip, Petition, User)
- Bu modellerin create() cagrilari da muhtemelen hata veriyor
- Dogru cozum: Schema'ya @updatedAt decorator ekle → prisma generate → Client guncelle
- Risk: SCHEMA DEGISIKLIGI (mektuplarda mimar onayi sart, migration gerekiyor)

### Etkilenen alan:
- Public form belgeli basvuru: BOZUK (kanitli)
- Panel belge yukleme (upload.controller.js): MUHTEMELEN BOZUK (ayni pattern)
- Servis katmani belge yukleme (upload.service.js): MUHTEMELEN BOZUK (ayni pattern)
- Assignment.create(), Contract.create(): Bilinmiyor (bu tur kapsam disi)

**Mimara Not:**
- Oncelik: Acil fix -- 3 Document.create() lokasyonuna `updatedAt: new Date()` ekle
  → Senaryo A, YEsil nokta, mimar onayi gerekmez
  → public.route.js:67 + upload.service.js:28 + upload.controller.js:94
- Sonra: Schema migration -- 9 modele @updatedAt decorator ekle
  → Senaryo B, KIRMIZI nokta, Mehmet Bey onayi sart
  → Migration olusturulacak (tek bos migration, cunku @updatedAt sadece client tarafinda etki)

---

— Claude Code, TUR #17 Kesif sonu
