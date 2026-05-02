# TUR #64 A0 — KEŞİF RAPORU

**Tarih:** 2 Mayıs 2026
**Anayasa:** v1.19.0 (Madde 4 + 4.1 + 4.4 + 17.5 + 32.8)
**Kapsam:** Eski upload endpoint silme + ekosistem sonuçlandırma
**Yöntem:** Glob + Grep + Read (read-only) — Madde 4.4 kod kaynaktır
**Süre:** ~30 dk
**Risk:** 🟢 Sıfır (0 kod değişikliği)

---

## 1. Backend SİLİNECEK Dosyalar (kanıtlı)

| Dosya | Satır kanıtı | İçerik | Karar |
|---|---|---|---|
| `src/routes/upload.routes.js` | 1-15 (3 endpoint) | `POST /:leadId` (multer) + `/:leadId/request-url` + `/:leadId/complete` (signed URL akışı eski) | ❌ TAM SİL |
| `src/controllers/upload.controller.js` | 1-155 | `uploadLeadDocument` + `requestUploadUrl` + `completeUpload` (Document.create line 95) | ❌ TAM SİL |
| `src/services/upload.service.js` | 1-134 | `uploadDocument({ leadId, file })` multer akışı (Document.create line 29) | ❌ TAM SİL |
| `src/middlewares/uploadMiddleware.js` | 1-133 | `multer.diskStorage` + `memoryStorage` + `supabaseUploadMiddleware` | ❌ SİL (public.route.js hibrit'e geçince 0 ref) |

**Mount kaldırılacak:**
- `src/routes/index.js:7` — `const uploadRoutes = require("./upload.routes");`
- `src/routes/index.js:48` — `router.use("/uploads", uploadRoutes);`

---

## 2. Backend KORUNACAK Dosyalar (gerekçeli)

| Dosya | Gerekçe |
|---|---|
| `src/routes/documents.upload.routes.js` | TUR #63 hibrit endpoint — `init-upload` + `finalize-upload`, 10 context (kanıt: line 48-64 Zod discriminated union). KORUNUR. |
| `src/services/storage.service.js` | `uploadFile`/`downloadFile`/`getPublicUrl`/`deleteFile`/`createSignedDownloadUrl` başka servisler tarafından meşru kullanılıyor. `createSignedUploadUrl` + `verifyUpload` artık çağrılmayacak — silinmesi başka kesit (TUR #65+) işi, **TUR #64 kapsamı dışı**. KORUNUR. |
| `src/routes/career-application.route.js` | Sadece JSON body, **multer YOK**, Document.create YOK. CV `cvLink` URL string olarak alınıyor (line 42). Multer middleware silmek için engel değil. KORUNUR (dokunulmaz). |

---

## 3. Backend TEMİZLENECEK Dosya (kısmî)

### `src/routes/public.route.js` — POST `/public-lead` (line 6-10, 75-99)

**Mevcut akış:** multer + supabaseUploadMiddleware + leadService.createLead + `prisma.document.create` (tek HTTP POST, multipart, hem Lead hem Document).

**Yapılacak:**
1. `require("../middlewares/uploadMiddleware")` (line 6-7) → **SİL**
2. Route handler'da `upload.single("file")` + `supabaseUploadMiddleware` middleware zinciri → **SİL**
3. `req.file` koşulu içindeki `prisma.document.create` + `PUBLIC_DOCUMENT_UPLOADED` activity log (line 75-99) → **SİL**
4. Response'tan `documentId` field → **SİL** (line 133)
5. Lead create sonrası response'a `leadId` zaten dönüyor (line 131) — KORUNUR, panel hibrit upload için kullanacak

**Sebep:** Belge artık hibrit endpoint üzerinden gelecek (`POST /api/documents/init-upload` → PUT Supabase → finalize). public.route.js sadece Lead create yapacak.

---

## 4. Panel Migrasyon Listesi (sürpriz: 1 sayfa)

**Mektup tahmini:** 11+ FormData kullanan sayfa.
**Gerçek:** **1 sayfa**.

| Dosya | FormData? | uploadDocument? | Karar |
|---|---|---|---|
| `tedbirge-panel/app/(public)/basvuru/page.tsx` | ✅ EVET (line 219) | ❌ HAYIR | ⚠️ A2.1'de migrate |
| `tedbirge-panel/components/documents/UploadForm.tsx` | ❌ | ✅ (line 7,64) | ✅ TEMİZ (TUR #63 A6) |
| `tedbirge-panel/components/customer/BelgeYukleme.tsx` | ❌ | ✅ (line 10,54) | ✅ TEMİZ (TUR #63.5 v2) |

**`/api/uploads/` arama sonucu:** Panel'de **0 referans**. Panel zaten eski endpoint'i çağırmıyor.

**OTONOMI SINIRI Senaryo 2 değerlendirmesi:** ❌ TETİKLENMEDİ — kapsam tahminden 11× küçük.

---

## 5. Public-Lead Kanalı Kararı (Yol E — pragmatik)

### Sorun

Mektup A2.1 önerisi:
```tsx
await uploadDocument(file, {
  context: "public-lead",
  leadId: createdLeadId,
  draftToken: response.draftToken
});
```

### Mevcut altyapı (kanıt)

`src/routes/documents.upload.routes.js:50` — Zod şemada `public-lead`:
```js
z.object({ kind: z.literal("public-lead"), leadDraftToken: z.string().min(8), category: z.string().optional() })
```

`src/routes/documents.upload.routes.js:74-77` — `checkPermission`:
```js
if (context.kind === "public-lead") {
  return { allowed: true, leadId: null };
}
```

⚠️ **Gizli güvenlik açığı:** `leadDraftToken` Zod'da var ama `checkPermission`'da **doğrulanmıyor** — anonim biri herhangi bir 8+ karakter string ile public-drafts/ klasörüne yazabilir. TUR #63 bu açığı tasarımda açık bırakmış.

### Karar: Yol E

`leadDraftToken` = `leadId` parse pattern. Schema değişikliği yok, yeni token mekanizması yok.

**Frontend (`tedbirge-panel/lib/document-upload.ts` UploadContext type aynı kalır):**
```ts
{ kind: 'public-lead'; leadDraftToken: string; category?: string }
```
— `leadDraftToken` field'ına `lead.id` (UUID) geçirilir.

**Backend `documents.upload.routes.js` `checkPermission` public-lead branch'i güçlendirilir:**
```js
if (context.kind === "public-lead") {
  const lead = await prisma.lead.findUnique({
    where: { id: context.leadDraftToken },
    select: { id: true, createdAt: true, source: true },
  });
  if (!lead) return { allowed: false };
  if (lead.source !== "public_form") return { allowed: false };
  const ageMs = Date.now() - new Date(lead.createdAt).getTime();
  if (ageMs > 30 * 60 * 1000) return { allowed: false }; // 30 dk pencere
  return { allowed: true, leadId: lead.id };
}
```

**Etkiler:**
- `Document.leadId` artık public-lead için `null` değil, gerçek `lead.id` — audit log + lead'e bağlı görünür
- `buildPath` line 156-158 mevcut: `public-drafts/${context.leadDraftToken}/...` aynen çalışır (leadDraftToken = leadId fakat path'te string)
- 30 dk pencere — public form sonrası belge yükleme için makul süre
- `source: "public_form"` zorunlu — sadece gerçek public lead'ler kabul edilir

**Reddedilen alternatifler:**
- Yol F (UUID draftToken): Yeni token mekanizması, Lead model'i `metadata Json` field'ı gerektirir (kontrol edilmeli — Lead schema'ya değişiklik = KIRMIZI nokta). TUR #64 kapsamını aşar.
- Yol C (mevcut multipart koru): Madde 32.8 ihlali (Vercel 4.5 MB body bypass yapılmış olmaz).

---

## 6. Career Application Kararı

`src/routes/career-application.route.js` (line 1-194):
- POST `/public-career-application`: sadece JSON body, **multer YOK**
- CV "cvLink" URL string (line 42, slice 1000) — kullanıcı dosya yüklemiyor, dış URL veriyor
- ADMIN GET/PATCH/DELETE — JSON only

**Sonuç:** Career upload özelliği **henüz uygulanmamış**. cvLink string mekanizması mevcut. Hibrit `career` context (Zod line 51) tanımlı ama UI hiç kullanmıyor.

**Madde 28 değerlendirmesi:** UI iskeleti yok → Madde 28 tetiklenmez (Madde 28.1 son cümle: "Eğer UI iskeleti hiç yoksa Madde 28 tetiklenmez"). Atıl context kalır.

**TUR #64 kapsamı:** Career endpoint'e dokunulmaz. Multer middleware silinmesini engellemez.

---

## 7. Madde 28 @deferred Kontrolü — 10 Context

| Context | Backend Zod | Frontend type | UI iskeleti | Madde 28 |
|---|---|---|---|---|
| `lead` | ✅ | ✅ | ✅ (UploadForm.tsx aktif) | tetiklenmez (canlı) |
| `public-lead` | ✅ | ✅ | ⚠️ basvuru/page.tsx (A2.1'de aktif) | tetiklenmez (A2.1'de canlı olacak) |
| `career` | ✅ | ✅ | ❌ yok | tetiklenmez (UI yok — Madde 28.1) |
| `kvkk-request` | ✅ | ✅ | ❌ yok | tetiklenmez (UI yok) |
| `tahsilat` | ✅ | ✅ | ❌ yok | tetiklenmez (UI yok) |
| `bilirkisi` | ✅ | ✅ | ❌ yok | tetiklenmez (UI yok) |
| `dava` | ✅ | ✅ | ❌ yok | tetiklenmez (UI yok) |
| `ihtarname` | ✅ | ✅ | ❌ yok | tetiklenmez (UI yok) |
| `sozlesme` | ✅ | ✅ | ✅ BelgeYukleme.tsx (TUR #63.5 v2) | tetiklenmez (canlı) |
| `general` | ✅ | ✅ | ✅ ADMIN panel | tetiklenmez (canlı) |

**Sonuç:** 0 Madde 28 ihlali. Atıl context'ler Zod'da/TS type'da tanımlı, UI yok → Madde 28.1 son cümlesi gereği bekleyen özellik **sayılmaz**, idle pozisyonda.

---

## 8. A1+ Atom Planı Revizesi

Mektup atom planı **kapsam küçüldüğü için** revize edilir:

| Atom | Mektup tahmini | Revize | Sebep |
|---|---|---|---|
| A1 — Backend silme | 30-45 dk | 30 dk | Net liste (4 dosya tam sil + 1 mount + 1 import) |
| A2.0 — Hibrit public-lead doğrulama | (yok) | 15 dk | Yol E gereği `checkPermission` güçlendirme (yeni alt-atom) |
| A2.1 — basvuru/page.tsx migrate | 30-45 dk | 30 dk | Public-lead akışı: form → leadId → uploadDocument |
| A2.2 — sigorta-basvuru | 30-45 dk | **NO-OP** | Panel'de FormData yok, gereksiz |
| A2.3 — Diğer FormData | 1+ saat | **NO-OP** | 0 başka kullanıcı |
| A2.4 — Career | 30 dk | **NO-OP** | Career multer kullanmıyor zaten |
| A3 — Smoke | 30 dk | 20 dk | Panel build + curl + grep |
| A4 — OS senkron | 20 dk | 20 dk | OTONOM_RAPOR + IS_PLANI + MIMARI_KARARLAR + DEVIR |

**Yeni toplam:** ~2 saat (mektup tahmini 3-4 saat — kapsam küçük).
**Atom sayısı:** 6 (A0 + A1 + A2.0 + A2.1 + A3 + A4).
**Schema migration:** 0
**npm install:** 0
**Yeni paket:** 0
**KIRMIZI nokta:** 0

---

## 9. OTONOMI SINIRI Değerlendirmesi (mektup 4 senaryo)

| Senaryo | Tetiklendi? | Kanıt |
|---|---|---|
| 1: multer'ın career haricinde başka meşru kullanımı | ❌ HAYIR | Career multer kullanmıyor (cvLink string). Multer sadece upload.routes.js + public.route.js'de — ikisi de TUR #64 kapsamında. |
| 2: 15+ FormData panel sayfası | ❌ HAYIR | Tam tersi: 1 sayfa. Kapsam tahminden küçük. |
| 3: documents.upload.routes.js ile upload.routes.js paylaşılan kod | ❌ HAYIR | Hibrit endpoint kendi `getSupabase()` instance'ı kullanıyor (line 41-46) — storage.service.js'in `createSignedUploadUrl` fonksiyonuna bağımlı değil. Tek paylaşım: `assertLeadAccess` (utils/leadAccess.js — meşru). |
| 4: A2 next build sürpriz hata | henüz değerlendirilmedi | A2 sırasında doğrulanır |

**Sonuç:** A1-A4 otonom akış için hiçbir engel yok. CEO direktifi "yes/no sorma" + Madde 17.5 gereği devam.

---

## 10. Riskler + Azaltma

| Risk | Azaltma |
|---|---|
| public-lead 30 dk pencere aşıldıysa upload başarısız | Frontend hata yakalama: "Başvurunuz çok uzun süre önce oluşturulmuş, yeniden başvurun" toast |
| `lead.source !== "public_form"` kontrolü gerçek lead'leri reddedebilir | public.route.js:64 zaten `source: "public_form"` set ediyor — tüm public lead'lerde mevcut |
| upload.controller.js'in setImmediate AI Analyzer çağrısı (eski) silinince public form'lardaki dosyalar AI analiz almaz | Hibrit endpoint finalize-upload zaten AI Analyzer tetikliyor (TUR #63 mektubu). Kontrol: `documents.upload.routes.js` finalize handler'ında AI çağrısı var mı? **Yok** (line 241-293). Bu boşluk **TUR #66**'ya (mektubun mevcut "AI Analiz İşlem Hatası" düzeltme planı) bırakılır — TUR #64 kapsamı dışı. |
| Panel basvuru/page.tsx state machine kırılması | A2.1 atom commit + lokal `npx tsc --noEmit` doğrulama |

---

## 11. A0 Sonuç

✅ **A0 keşfi tamamlandı, sürpriz yapısal mesele YOK.**
✅ **OTONOMI SINIRI 4 senaryosundan 0'ı tetiklendi.**
✅ **Kapsam mektup tahmininden küçük (kalibrasyon faktörü 1.6× gerekli değil — gerçek süre 2 saat).**
✅ **Madde 17.5 + Madde 4.1 + Madde 32.8 + CEO direktifi gereği A1-A4 otonom akış başlar.**

Bir sonraki atom: **A1 — Backend Eski Endpoint Silme** (30 dk).

---

**— Claude Code (Anthropic)**
**TUR #64 A0 — 2 Mayıs 2026**
**Anayasa v1.19.0 yürürlükte**
**Pattern devam: TUR #56+57+58+59+60+62+63+63.5+63.5v2+64 A0**
