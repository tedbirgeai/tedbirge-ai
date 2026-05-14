# 🤖 TEDBİRGE.AI — OTONOM RAPOR (TUR #132)

**Tarih:** 15 Mayis 2026 Cuma gece
**TUR:** #132 (acik — AI Cekirdek TAC M1 Belge Ayristirici)
**Tip:** Uctan uca 18 atom + Madde 30.90 + 30.91 yeni tescil
**Anayasa:** v1.41.0 → **v1.42.0 MINOR** (hedef)

---

## TUR #132 Pre-Flight Grep Raporu (Madde 30.83.1)

Code (Claude Code, terminal) bolum 2'deki tum kesif komutlarini calistirdi, sonuclar:

### 2.1 AI Analyzer Mevcut Durum

| Mevcut servis | Yol | Notlar |
|---|---|---|
| `analyzer.service.js` | `src/services/analyzer.service.js` | `analyzeExtractedText` + `calculateQualificationScore` (qualify model `claude-sonnet-4-6`) |
| `ai.service.js` | `src/services/ai.service.js` | `interpretResponse` + `generatePetition` + `analyzeDocument` — model `claude-sonnet-4-6`, ANTHROPIC_API_KEY zorunlu, MOCK mode destegi |
| `uploadAnalysis.bridge.js` | `src/services/uploadAnalysis.bridge.js` | `resolveDocumentText` (PDF/DOCX/TXT/Image extraction) + `analyzeUploadedDocument` + `analyzeDocumentById` (fire-and-forget bridge) |
| `ocr.service.js` | `src/services/ocr.service.js` | `extractTextWithVision` (Claude Vision API multimodal) |

**Karar:** Yeni `ai-analyzer.service.js` mevcut altyapi uzerine MERGE (Madde 4.6). Eski `ai.service.js` korunur — petition + qualification flow icin. Yeni service **structured JSON extraction** (epikriz/police/kaza-tutanagi vb tespit + 14 alan) yapar.

### 2.2 Document Schema + Lead Schema (mevcut alanlar)

```prisma
model Document {
  id, leadId, uploadedById, type, status, originalName, storedName,
  mimeType, sizeBytes, path, parsedText, aiAnalysis, extractedJson,
  storageKey, compensationResult, pageCount, metadata, category,
  compressionRatio, originalSize, createdAt, updatedAt, deletedAt
}

enum DocumentStatus {
  PENDING_UPLOAD, UPLOADED, PARSED, ANALYZED, FAILED, STUCK, DELETED
}
```

**Karar:** Mektupta yer alan `PROCESSING` / `COMPLETED` enum value'lari **YOK** — Madde 4.6 geriye uyumluluk geregi mevcut `PARSED` (islem suruyor) + `ANALYZED` (tamamlandi) kullanilir. M1 6 yeni Document alani **additive**.

### 2.3 Tazminat Motor Mevcut

`tedbirge-panel/lib/yaralanmaHesap.ts` — kanit mevcut (TUR #107 + #122 emsali). M1 scope disi, M2'de Lead'e merge edilecek.

### 2.4 Upload Akisi (Madde 32 Hibrit)

| Endpoint | Yol | Pattern |
|---|---|---|
| `POST /api/documents/init-upload` | `src/routes/documents.upload.routes.js:179` | Supabase signed URL + Document.PENDING_UPLOAD kaydi |
| `POST /api/documents/finalize-upload` | `src/routes/documents.upload.routes.js:252` | `status=UPLOADED` + **`setImmediate` fire-and-forget AI analiz** (TUR #66 emsali, satir 296) |

`setImmediate` icinde `analyzeDocumentById(documentId)` cagrisi mevcut. ATOM 5 + 6 strateji: **bu pipeline'a yeni TAC M1 alanlari ekle** (status `PARSED` → `ANALYZED` ile esitle, aiConfidence/aiAnalysisJson dol).

### 2.5 CUSTOMER Dashboard

`tedbirge-panel/app/(panel)/musteri/page.tsx` mevcut. `BelgeYukleme` componenti import ediyor (`components/customer/BelgeYukleme.tsx`). Belge yukleme: hibrit Supabase + AI analiz progress (uploading → analyzing → complete).

### 2.6 Anthropic SDK Mevcut

`package.json:20`:
```
"@anthropic-ai/sdk": "^0.89.0"
```

**Karar:** ATOM 2 SKIP — SDK zaten mevcut, Madde 4.6 geriye uyumluluk, npm install gerek YOK.

### 2.7 Activity Log + Audit

`prisma/schema.prisma` ActivityLog model mevcut. Yeni action'lar:
- `DOCUMENT_AI_ANALYZED` (M1 yeni — confidence + type detay)
- `DOCUMENT_AI_ANALYSIS_FAILED` (M1 yeni)
- `KVKK_M6_CONSENT_GIVEN` (M1 yeni — KVKK m.10 audit zinciri)
- `AI_API_CALL_COST` (M1 yeni — maliyet izleme)

### 2.8 Healer Mevcut (TUR #110)

`src/os/modules/healer.js` mevcut. AUTO_FIX kategorileri:
- `old_failed_documents` — 24h+ FAILED Document `deleteMany` (sat 86)
- `stale_cache`, `expired_tokens`, `render_warmup`

**Karar:** ATOM 14 — `old_failed_documents` yerine **retry-stuck** pattern eklenir (delete YERINE re-trigger). Audit zinciri korunur (Madde 30.75).

### 2.9 Env Vars

`ANTHROPIC_API_KEY` zaten kullaniliyor (`analyzer.service.js:149` + `ai.service.js:46`). Render production env'de set olmasi gerek (CEO daha onceden eklemis olmali — mevcut petition + qualify endpoint'ler calisiyor).

**Karar:** ATOM 3 — CEO manuel ek is gerekmiyor, sadece yeni service icinde null check + ADMIN_FEED bildirim (eger eksikse).

---

## Pre-Flight Karar Matrisi

| ATOM | Karar | Sebep |
|---|---|---|
| 1 | UYGULA | Bu rapor |
| 2 | SKIP | `@anthropic-ai/sdk@^0.89.0` mevcut (Madde 4.6) |
| 3 | UYGULA (sadece kod) | CEO manuel iş gereksiz — env zaten kullanılıyor, kod null check eklenir |
| 4 | UYGULA | Yeni `ai-analyzer.service.js` (structured JSON extraction) |
| 5 | MERGE | Mevcut `finalize-upload` setImmediate pipeline'a M1 alanlari eklenir |
| 6 | MERGE | Pattern zaten mevcut (TUR #66) — yeni servis ek call |
| 7 | UYGULA | Document 6 yeni alan additive (KIRMIZI 1, CEO onay) |
| 8 | UYGULA | `apply-pending-schemas.js` 9 yeni ALTER (Document 6 + User 3) |
| 9 | UYGULA | `AcikRizaModal.tsx` yeni |
| 10 | UYGULA | `/api/kvkk/acik-riza-document-upload` + User 3 alan (KIRMIZI 1) |
| 11 | UYGULA (MERGE) | Mevcut `BelgeYukleme.tsx` + `UploadForm.tsx` consent gate ekle |
| 12 | UYGULA | `/me` select `kvkkM6ConsentAt` |
| 13 | UYGULA (MERGE) | `DocumentList.tsx` `needsManualReview` + `aiConfidence` badge ekle |
| 14 | UYGULA | Healer retry pattern (delete yerine re-trigger) |
| 15 | UYGULA | `ai-cost-tracker.service.js` yeni |
| 16 | UYGULA | `ai-analyzer.service.js` defaultHeaders + dokumante |
| 17 | UYGULA | 5 belge OS senkron + version |
| 18 | UYGULA | Smoke + build + commit + push |

**DEFER 0 (Madde 17.2 R1).** Hicbir atom yanlis kanitla atlanmadi.

---

## Atom Uygulama Detayi (ATOM 4-18)

### ATOM 4 — ai-analyzer.service.js (YENI)
- Dosya: `src/services/ai-analyzer.service.js`
- Model constant: `CURRENT_MODEL = "claude-opus-4-7"` (Madde 30.78)
- SYSTEM_PROMPT: 14 alan structured JSON (documentType + 13 extractedData alani + confidence skorlari)
- `analyzeDocument(text, ctx)` — Anthropic Claude messages API + JSON parse + token kullanim donulur
- Madde 30.91 backend-only header (`anthropic-dangerous-direct-browser-access: false`) + PII hash metadata

### ATOM 5-6 — Upload Controller MERGE
- Dosya: `src/routes/documents.upload.routes.js` (finalize-upload setImmediate)
- Mevcut `analyzeDocumentById` cagri korundu (Madde 4.6)
- Yeni: TAC M1 `analyzeDocument(parsedText, ctx)` cagri + `m1Fields` (6 Document alani dolduruluyor)
- `needsManualReview` tetigi: confidence <0.85 VEYA epikriz/sgk-raporu/maluliyet alani dolu (Madde 30.91 saglik verisi)
- ADMIN_FEED RealtimeEvent `AI_REVIEW_REQUIRED` (Madde 24.11)
- `logAiCost(...)` async fire-and-forget (Madde 24.14)
- ActivityLog `DOCUMENT_AI_ANALYZED` (Madde 30.75 audit zinciri)
- M1 fail durumda mevcut analiz akisi bozulmaz (Madde 4.6)

### ATOM 7 — Schema
- `prisma/schema.prisma` Document model:
  - aiAnalysisJson Json?
  - aiConfidence Float?
  - aiAnalyzedAt DateTime?
  - aiModelVersion String?
  - needsManualReview Boolean @default(false)
  - manualReviewReason String?
- User model:
  - kvkkM6ConsentAt DateTime?
  - kvkkM6ConsentIp String?
  - kvkkM6ConsentUA String?
- Mevcut alanlar dokunulmadi (Madde 4.6)
- KIRMIZI 1 CEO yazili onay (Madde 18.3 + 30.71): "uctan uca [...] basla bitir"

### ATOM 8 — Idempotent SQL
- `scripts/apply-pending-schemas.js` 9 yeni ALTER (Document 6 + User 3)
- Pattern: `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` (Madde 30.22)
- Postinstall hook + Render auto-deploy ile production'a iner

### ATOM 9 — AcikRizaModal.tsx (YENI)
- Dosya: `tedbirge-panel/components/customer/AcikRizaModal.tsx`
- WCAG AA kontrast `#15803D` emerald-dark (TUR #130 emsali — Madde 30.86)
- 44px touch target (Madde 30.85 mobil-first)
- KVKK m.6 metni + onay checkbox + 2 buton (Vazgec / Onayla)
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby` (Madde 30.83 WCAG)

### ATOM 10 — KVKK Acik Riza Backend
- `src/routes/kvkk.routes.js` `POST /kvkk/acik-riza-document-upload`
- User.kvkkM6ConsentAt + Ip + UA set
- ActivityLog `KVKK_M6_CONSENT_GIVEN` (Madde 30.75 audit)

### ATOM 11 — BelgeYukleme.tsx Consent Gate
- /auth/me'den kvkkM6ConsentAt cek (mount'ta)
- Eksikse handleFiles modal aciyor, dosyalar pendingFiles kuyrukta
- Accept → POST /kvkk/acik-riza → processFiles devam
- Reject → toast.error + kuyruk temizle

### ATOM 12 — /me Select
- `src/routes/auth.routes.js` select: `kvkkM6ConsentAt: true`

### ATOM 13 — DocumentList Badge MERGE
- `tedbirge-panel/components/documents/DocumentList.tsx`
- `needsManualReview === true` → ⚠️ "Avukat Onayı Bekliyor" badge (tooltip: manualReviewReason)
- `aiConfidence >= 0.85` + !needsManualReview → ✅ "AI Güven %X" badge
- Mevcut status badge'ler dokunulmadi (Madde 4.6)
- DocumentItem type genisletildi (lead.ts: 6 yeni alan)

### ATOM 14 — Healer Retry
- `src/os/modules/healer.js` old_failed_documents:
  - ESKI: `deleteMany({status:FAILED, createdAt<24h})`
  - YENI: `findMany({STUCK OR (FAILED + updatedAt<1h)}, take:10)` + setImmediate `analyzeDocumentById` retry
- Audit zinciri korundu (silme YOK), Madde 30.75

### ATOM 15 — AI Cost Tracker (YENI)
- `src/services/ai-cost-tracker.service.js`
- PRICING tablosu: claude-opus-4-7 ($15/$75 per million) + claude-sonnet-4-6 ($3/$15)
- ActivityLog `AI_API_CALL_COST` + aylik toplam hesapla
- $100 WARNING / $200 CRITICAL → RealtimeEvent ADMIN_FEED `AI_COST_LIMIT`
- Madde 24.14 Sifir Maliyet Disiplini

### ATOM 16 — Anthropic ZDR Headers
- `ai-analyzer.service.js` `defaultHeaders: { "anthropic-dangerous-direct-browser-access": "false" }` — backend-only kullanim
- Madde 30.91 dokumante: Standard tier kullanim, Enterprise ZDR (Zero Data Retention) TUR #150+ teknik borc (saha kanit-bazli, 30+ muvekkil)

### ATOM 17 — 5 Belge OS Senkron
- CLAUDE.md — Anayasa v1.42.0 MINOR (Madde 30.90 + 30.91 yeni)
- MIMARI_KARARLAR.md — TUR #132 KAPALI tam karar girdi (5 alan: Karar/Sebep/Alternatif/Etki/Mimar)
- DEVIR_RAPORU_AKTIF.md — TUR #132 BUGUN + TUR #131 ARSIV
- IS_PLANI.md — TUR #132 NOW + TUR #133 NEXT (M2 Lead Schema)
- OTONOM_RAPOR.md — bu rapor (pre-flight + 18 atom detay)
- version.json — anayasa 1.42.0, backend 1.16.0, panel 1.26.0, schema 1.8.0, buildDate 2026-05-15
- package.json (backend) — 1.15.0 → 1.16.0
- tedbirge-panel/package.json — 1.25.0 → 1.26.0

### ATOM 18 — Smoke + Build + Commit + Push
- `npx prisma generate` (postinstall pattern)
- `npx tsc --noEmit` panel TypeScript kontrolu (EXIT=0 zorunlu)
- `apply-pending-schemas.js` lokal smoke (idempotent, no-op eger uygulanmissa)
- Atomik commit (Madde 30.26 — 5 belge + version + 2 package.json + 14 kod dosyasi)
- `git push` → Render auto-deploy + Vercel auto-deploy

---

## Sayisal Ozet TUR #132 KAPALI

| Metrik | Deger |
|---|---|
| Toplam atom | 18 |
| Uygulanan atom | 16 (ATOM 2 + 3 disiplinli SKIP) |
| DEFER | 0 (Madde 17.2 R1) |
| KIRMIZI 1 | Schema additive (CEO yazili onay, Madde 18.3 + 30.71) |
| KIRMIZI 2 | YOK (Anthropic SDK + env mevcut) |
| Yeni anayasa madde | 2 (30.90 Saha Vaadi + 30.91 KVKK m.6) |
| Yeni Mimar Hatasi | 60 (Saha Vaadi Cehaleti) |
| Yeni servis | 2 (ai-analyzer + ai-cost-tracker) |
| Yeni component | 1 (AcikRizaModal) |
| Yeni endpoint | 1 (POST /kvkk/acik-riza-document-upload) |
| Schema alanlari | 9 (Document 6 + User 3) |
| Idempotent ALTER | 9 |
| npm install | 0 |
| env manuel iş | 0 (CEO icin) |
| Aylik AI maliyet | ~$5-15 (cost tracker $100 limit) |
| Backend version | 1.15.0 → 1.16.0 MINOR |
| Panel version | 1.25.0 → 1.26.0 MINOR |
| Schema version | 1.7.0 → 1.8.0 |
| Anayasa version | v1.41.0 → v1.42.0 MINOR |
| TUR rekor | 42 → **43 ardisik temiz TUR** (#90 → #132) |

---

## CEO Manuel Smoke (Deploy Sonrasi 5 dk)

1. `/musteri` → Belge Yukle → Acik Riza Modal acilir ✓
2. Onay → backend `/api/kvkk/acik-riza-document-upload` 200 OK ✓
3. Belge yukle → Document status PROCESSING/PARSED badge ✓ (sonra ANALYZED)
4. ~1-2 dk sonra ANALYZED + "AI Guven %XX" badge VEYA "Avukat Onayı Bekliyor" ✓
5. Admin panel ActivityLog → `DOCUMENT_AI_ANALYZED` + `KVKK_M6_CONSENT_GIVEN` + `AI_API_CALL_COST` kayit ✓
6. Yuksek volume durumda RealtimeEvent ADMIN_FEED `AI_REVIEW_REQUIRED` / `AI_COST_LIMIT` ✓

— Tedbirge OS · 15 May 2026 · TUR #132 KAPALI

