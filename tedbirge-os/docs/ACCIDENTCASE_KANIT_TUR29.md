# ACCIDENTCASE KANIT TARAMASI — TUR #29

> **Tip:** T (Tarama mini — Madde 21, salt okuma)
> **Risk:** SIFIR (0 kod, 0 schema, 0 migration, 0 env, 0 npm)
> **Mimar:** Claude Sonnet 4.6 (28 Nisan ogleden sonra)
> **Kapsam:** AccidentCase modelinin gercek kullanimi (kod kanit — Madde 4.4)

---

## OZET

**Senaryo: B — Yari kurulu**
Frontend UI ongoren bicimde onceden insa edilmis, backend hic yazilmamis. "Yeni Vaka Ac" butonu 404 uretiyor. Panel mesajinda "yakinda" ifadesi var — ozellik kasitli olarak ileriki tur/kesit icin birakilmis.

**Onerilen tedavi:** Mimar kisa vadeli + uzun vadeli secenek belirlecek (ADIM 6).

---

## ADIM 1 — Schema Modeli (tam tanim)

**Kaynak:** `prisma/schema.prisma` satir 11-26

```
model AccidentCase {
  id           String             @id @default(cuid())
  leadId       String
  status       AccidentCaseStatus @default(DRAFT)
  summary      String?
  analysisData Json?
  reportData   Json?
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
  analyzedAt   DateTime?
  Lead         Lead               @relation(fields: [leadId], references: [id], onDelete: Cascade)
  Evidence     Evidence[]

  @@index([leadId])
  @@index([status])
}

enum AccidentCaseStatus {
  DRAFT
  EVIDENCE_READY
  ANALYZING
  COMPLETED
  FAILED
}
```

**Iliskiler:**
- `Lead` → AccidentCase: Many (leadId FK, onDelete Cascade)
- `Evidence` → AccidentCase: One-to-Many (AccidentCase is PARENT of Evidence)
- AccidentCase, Lead'in COCUĞU — Lead silinince Cascade ile silinir

**Evidence modeli:**
```
model Evidence {
  id             String       @id @default(cuid())
  accidentCaseId String
  type           EvidenceType
  fileUrl        String?
  fileName       String?
  fileMimeType   String?
  fileSize       Int?
  metadata       Json?
  notes          String?
  uploadedAt     DateTime     @default(now())
  AccidentCase   AccidentCase @relation(...)
}
```
Evidence tamamen AccidentCase'e bagimli — backend de yoksa Evidence de anlamsiz.

---

## ADIM 2 — Backend Kullanim

### A) Servisler (src/services/)
```
grep accidentCase/AccidentCase src/services/ — NO MATCHES
```
- Hicbir servis dosyasi AccidentCase icin CRUD islemi yazmamis
- `prisma.accidentCase.create / findMany / update / delete` — SIFIR cagri

### B) Route'lar / Controller'lar (src/routes/ + src/controllers/)
```
grep accidentCase src/routes/ + src/controllers/ — NO MATCHES
```
- `POST /api/accident-cases` — YOK
- `POST /api/leads/:id/accident-cases` — YOK (panel bunu cagiriyor ama endpoint tanimli degil)
- `GET /api/accident-cases` — YOK

**Kanit:** `src/routes/index.js` icinde "accident" veya "accidentCase" satirı YOK.

### C) OS / Auditor / Healer modulleri (src/os/)
```
grep accidentCase src/os/ — NO MATCHES
```
- OS katmani AccidentCase tablosuna bagimli degil
- Audit tarama, reconciler, costGuard hic referans etmiyor
- OS modulleri AccidentCase tablosu olmadan calismaya devam eder

**BACKEND OZET: AccidentCase icin SIFIR kod — ne servis, ne route, ne OS modulü.**

---

## ADIM 3 — Frontend (Panel) Kullanim

**Tek dosya:** `tedbirge-panel/app/(panel)/leads/[id]/page.tsx`

### A) Sayfa (route)
Lead detay sayfasi `/dashboard/leads/[id]` — avukat/admin belirli bir Lead'i acinca goruyor.
Ayri `/vakalar` sayfasi yok — tek nokta lead detay tab'i.

### B) Section / UI
Kod (satir 1879-1918):
```tsx
{/* Kaza Rekonstruksiyon (AI) */}
<div className="rounded-xl border border-slate-100 p-4">
  <div className="panel-card-title">🔍 Kaza Rekonstruksiyon</div>
  {!accidentCase && (
    <button onClick={createAccidentCase} disabled={accidentCaseLoading}>
      {accidentCaseLoading ? "Aciliyor…" : "Yeni Vaka Ac"}
    </button>
  )}
  {!accidentCase && !accidentCaseLoading && (
    <div className="text-sm text-slate-500">
      Delil dosyalari (fotograf, tutanak, rapor) yukleyerek AI destekli
      derinlemesine kaza analizi alin. Cikti: olgusal tespitler, yasal
      cerceve, bilirkisi notlari, PDF rapor.
    </div>
  )}
  {accidentCase && (
    <div>
      Vaka ID: {accidentCase.id}
      Durum: {accidentCase.status || "DRAFT"}
      <div className="text-xs text-slate-500 pt-2">
        Vaka acildi. Sonraki adim: delil yukleme (YAKINDA).
      </div>
    </div>
  )}
</div>
```

**Onemli kanit:** Panel mesajinda **"yakinda"** ifadesi — ozellik kasitli bicimde tamamlanmamis birakilmis.

### C) API cagrisi (state + fetch)
Kod (satir 155-333):
```tsx
const [accidentCase, setAccidentCase] = useState<any>(null);
const [accidentCaseLoading, setAccidentCaseLoading] = useState(false);

async function createAccidentCase() {
  if (accidentCase) return;
  setAccidentCaseLoading(true);
  try {
    const r = await apiFetch<any>(`/leads/${leadId}/accident-cases`, {
      method: "POST",
      body: JSON.stringify({ description: "Panel uzerinden acildi" }),
    });
    setAccidentCase(r.data || null);
  } catch (e) {
    alert("Vaka acilamadi. Lutfen tekrar deneyin.");
    setAccidentCase(null);
  } finally {
    setAccidentCaseLoading(false);
  }
}
```

**Endpoint:** `POST /api/leads/:id/accident-cases`
**Kullanici gorduğu hata:** "Vaka acilamadi. Lutfen tekrar deneyin."
**apiFetch kullanimi:** Madde 30 uyumlu ✅

**PANEL OZET:**
- TEK sayfa: leads/[id] detay tab'i
- Ayri vaka sayfasi, form sayfasi, liste sayfasi: YOK
- "yakinda" mesaji: Ozellik ileriki tur/kesit icin kasitli ertelenmis
- GET islegini de yok — mevcut AccidentCase yukleme fonksiyonu bile yazilmamis

---

## ADIM 4 — Lead Iliskisi (schema kanit)

Schema satir 264:
```
AccidentCase          AccidentCase[]
```
Lead modeli AccidentCase[] ile 1-N iliskisi kuruyor. Her Lead'in BIRDEN FAZLA kaza vakasi olabilir (varsayilan desen: bir lead icin bir vaka).

**Ileski hiyerarsisi:**
```
Lead (1)
  └─ AccidentCase (N — genellikle 1)
        └─ Evidence (N — delil dosyalari)
```

**Yorum:** AccidentCase tamamen Lead'e bagimli — Lead silinince Cascade ile siler. Lead modeli tek basina yeterli DEGIL; AccidentCase delil (Evidence) ve AI analiz ciktisi (analysisData, reportData, summary) icin ayri tablolar gerektiriyor. Bu, Lead.analysisData ile ikame edilemez (farkli amac: delil uygulama, AI rapor olusturma).

---

## ADIM 5 — Karar Matrisi

| Kriter | Senaryo A (tam) | Senaryo B (yari kurulu) | Gercek | Eslesme |
|---|---|---|---|---|
| Backend service var (CRUD) | EVET | HAYIR | **HAYIR** (0 referans) | B ✅ |
| Backend route var (HTTP) | EVET | HAYIR | **HAYIR** (0 referans) | B ✅ |
| Frontend page var (leads/[id]) | EVET | EVET | **EVET** | Her ikisi |
| Frontend submit zinciri calisir | EVET | HAYIR (404) | **HAYIR** (404 — alert) | B ✅ |
| "yakinda" mesaji | HAYIR | EVET | **EVET** | B ✅ |
| OS modul bagimliligi | - | HAYIR | **HAYIR** (0 referans) | B ✅ |
| Lead iliskisi (1-N) | EVET | - | **EVET** | Schema hazir |

**SONUC: SENARYO B — Yari kurulu**
4/4 B kriteri karsilaniyor. Backend tamamen yazilmamis, frontend UI iskelet olarak hazir, "yakinda" etiketi kasitli etelemeyi dogruluyor.

---

## ADIM 6 — Tedavi Onerileri (mimar karar verecek)

### Kisa Vadeli (YEŞİL nokta, tur icinde yapilabiir)
Panel `leads/[id]/page.tsx`'den "Kaza Rekonstüksiyon" blou kaldirilir veya "Yakinda" placeholder'a donusturulur. Avukat "Yeni Vaka Ac" butonunu gormez, 404 hatasi ortadan kalkar. Schema ve backend dokunulmaz.

**Risk:** Cok dusuk (1 dosya, 1 blok UI kaldirilir). Yeşil nokta.

### Uzun Vadeli (KIRMIZI nokta, ayri kesit)
Tam kaza rekonstruksiyon kesiti:
1. `CREATE TABLE "AccidentCase" (...)` + `CREATE TABLE "Evidence" (...)`
2. `accidentCase.service.js` — CRUD + AI analiz tetikleme
3. `accidentCase.controller.js` + `accidentCase.routes.js`
4. Panel: delil yukleme formu, AI durum gostergesi, PDF rapor indirme

**Kapsam:** 1-2 haftalik B tipi stratejik kesit. Mehmet Bey oncelik verir.

### Onerim (senaryo etiketi olarak):
Kisa vadeli + uzun vadeli ikisi birlikte planlanmali:
- **TUR #29-B (YEŞİL):** Frontend bloğu kaldir veya "Yakinda (Hazırlanıyor)" olarak degistir
- **TUR #30+ (KIRMIZI, ayri kesit):** Tam AccidentCase backend + Evidence + AI rapor olusturma

Mimar hangi yolu secerse secer, bu raporun kaniti yeterlidir.

---

## DOKUNULMADI

- 0 kod degisikligi
- 0 commit (rapor + OTONOM_RAPOR haric)
- 0 schema / 0 migration / 0 env / 0 npm install
- Madde 21 + 27 + 28 + 4.4 disiplini tam uygulandı
- Hassas veri (token, PII, DATABASE_URL) bu raporda yer almıyor

---

## BULGU OZETI

| Katman | Durum | Kanit |
|---|---|---|
| Schema | Tanimli (AccidentCase + Evidence + enum) | schema.prisma:11-26, 165-185 |
| Backend service | **HAYIR** — 0 referans | grep src/services/ → no match |
| Backend route | **HAYIR** — 0 referans | grep src/routes/ + src/controllers/ → no match |
| OS modul | **HAYIR** — 0 referans | grep src/os/ → no match |
| Panel sayfa | EVET — leads/[id] tab'i | page.tsx:155, 318, 1879 |
| Panel API cagri | EVET — apiFetch kullanıyor | page.tsx:322 (`/leads/${leadId}/accident-cases`) |
| "yakinda" etiketi | EVET | page.tsx:1914 |
| Production DB tablosu | **HAYIR** — tablo mevcut degil | TUR #28 OTONOM_RAPOR kaniti |

**SENARYO B — Yari kurulu. Frontend iskelet hazir, backend hic yazilmamis.**

— Claude Code, TUR #29 AccidentCase kanit taramasi sonu, anayasa v1.7.0
