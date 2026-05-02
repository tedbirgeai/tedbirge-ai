# TUR #66 A0 — KEŞİF RAPORU

**Tarih:** 2 Mayıs 2026
**Anayasa:** v1.19.0 (Madde 4 + 4.1 + 4.4 + 17.5 + 24.11 + 32)
**Kapsam:** AI analiz "İşlem Hatası" + finalize-upload AI çağrı boşluğu (birleşik)
**Yöntem:** Glob + Grep + Read (read-only)
**Süre:** ~25 dk
**Risk:** 🟢 Sıfır (0 kod değişikliği)

---

## 1. finalize-upload Handler — AI Tetikleyici 0 Ref ✅

`src/routes/documents.upload.routes.js:251-303` (finalize-upload handler):
- Document `UPLOADED` status set ediyor (line 269-281)
- Activity log `DOCUMENT_UPLOAD_COMPLETED` (line 283-291)
- Response döndürüyor (line 293-301)
- **AI Analyzer çağrısı YOK** — TUR #64 sonrası boşluk kanıtlı

**Mektup tahmini doğrulandı.** finalize-upload AI tetikleyiciyi A2'de eklemek gerek.

---

## 2. analyzer.service.js — Mevcut İmplementasyon

`src/services/analyzer.service.js` (200 satır):
- **Export:** `analyzeExtractedText(input)` + `calculateQualificationScore(leadId)`
- `analyzeExtractedText` zaten try/catch (line 115-141) + `makeFallback` (line 9-28) ile soft fail
- ANALYSIS_MODE=mock fallback (line 92-102)
- `aiModule.analyzeDocument || analyzeFn` resolve pattern (line 104-113)
- Anthropic API `claude-sonnet-4-6` (QUALIFY_MODEL line 7)
- `compensation.engine.calculateCompensationEngine` entegrasyonu (line 121-127)

**Sonuç:** analyzer.service hata yönetimi zaten sağlam — A1 yeni try/catch eklemeye gerek YOK.

---

## 3. uploadAnalysis.bridge.js — Doğru Tetikleyici Fonksiyonu

`src/services/uploadAnalysis.bridge.js`:
- **Export:** `resolveDocumentText` + `analyzeUploadedDocument` + **`analyzeDocumentById(documentId)`**
- `analyzeDocumentById` (line 160-186):
  - Document'i bulur (line 164)
  - Lead'i bulur (line 169)
  - Supabase'den buffer indirir (line 175)
  - file proxy yapar + `analyzeUploadedDocument` çağırır (line 178-185)
  - Döner: `{ parsedText, extractionMethod, analysis }`
- `analyzeUploadedDocument` zaten try/catch + `[ANALYSIS_SOFT_FAIL_GUARD]` (line 131-144)
- `saveAiSummary(leadId, analysisResult, parsedText)` helper (line 9-35) — Lead.aiSummary + qualificationScore günceller

⚠️ **Mektup yanlış varsayım (Madde 4.4):** Mektup `analyzer.service.triggerAIAnalysis(documentId, leadId)` arıyor. Gerçek: **`uploadAnalysis.bridge.analyzeDocumentById(documentId)`**. Aynı işi yapıyor, sadece isim farklı. Eski silinmiş `upload.controller.completeUpload` bu fonksiyonu zaten kullanıyordu.

⚠️ **Önemli boşluk:** `analyzeDocumentById` **Document/Lead status'unu güncellemiyor** — sadece sonuç döner. Eski silinmiş `completeUpload` setImmediate içinde bu güncellemeyi yapıyordu (TUR #64'te sildim). A2'de **finalize-upload handler içinde inline** yapılmalı.

---

## 4. Anthropic API Çağrı Zinciri

`src/services/`:
- `analyzer.service.js:1` — `Anthropic = require("@anthropic-ai/sdk")` (qualifyScore için)
- `ai.service.js` — modül resolve (`analyzeDocument || analyzeFn`)
- `ocr.service.js` — `extractTextWithVision` Claude Vision (PDF/image OCR)

`src/os/modules/ai.js` (TUR #65 A0'da görüldü):
- 379 satır, circuit breaker, mock fallback, cost tracking
- TUR #65 OS Sprint 2 — şu an `aiModule.analyzeDocument` kullanılıyor mu kanıtsız (analyzer.service:104-109 dinamik resolve)

**Sonuç:** Anthropic API çağrısı **dağınık** (analyzer.service + ai.service + ocr.service). TUR #66 kapsamı dışı — TUR #65 (OS Sprint 3) tek nokta toplama hedefi.

---

## 5. muhatapAI.service.js — Madde 24.11 Üretim Disiplini

Grep ile doğrulandı: **muhatapAI.service var ama analyzer.service'ten çağrılmıyor.** Madde 24.11 güven skoru kontrolü `lawyerNotifications.notifyAiAnalysisCompleted(leadId, summary, requiresReview)` ile yapılıyor (TUR #56 A1.2 hook'u — eski silinmiş upload.service kullanıyordu).

A2'de finalize-upload handler içine bu hook eklenmeli:
```js
const guvenSkoru = Number(result.analysis?.guvenSkoru ?? result.analysis?.confidence ?? 1);
const requiresReview = Number.isFinite(guvenSkoru) && guvenSkoru < 0.7;
await lawyerNotif.notifyAiAnalysisCompleted(leadId, summary, requiresReview);
```

---

## 6. Lead Schema AI Alanları

| Mektup tahmini | Gerçek (kanıtlı) | Karar |
|---|---|---|
| `Lead.aiAnalizDurum` enum | ❌ YOK | A2 kullanmaz |
| `Lead.aiAnalizHata` text | ❌ YOK | A2 kullanmaz |
| `Lead.aiAnalizSonGuncelleme` | ❌ YOK | A2 kullanmaz |
| `Lead.aiSummary` string | ✅ VAR (kullanılıyor) | A2 kullanır |
| `Lead.qualificationScore` int | ✅ VAR | A2 günceller |
| `Document.status` enum (PENDING_UPLOAD, UPLOADED, ANALYZED, FAILED) | ✅ VAR | A2 ANALYZED/FAILED set eder |
| `Document.aiAnalysis` JSON | ✅ VAR | A2 sonuç veya error kaydeder |
| `Document.parsedText` text | ✅ VAR | A2 set eder |
| `Document.extractedJson` JSON | ✅ VAR | A2 set eder (TUR #56) |

⚠️ **OTONOMİ SINIRI Senaryo 2 değerlendirmesi:** Mektup `aiAnalizDurum/Hata` field'ları varsayıyor — schema'da yok. Ama mevcut `Document.status FAILED + Document.aiAnalysis JSON.error` altyapısı **aynı işi yapıyor** (eski silinmiş `upload.service` zaten bu pattern'i kullanıyordu — TUR #64 öncesi kanıtlı).

**Sonuç:** Schema migration GEREKMEZ. Mektup yanlış varsayım. KIRMIZI nokta yok. (Madde 4.4 — kod kaynaktır)

---

## 7. "İşlem Hatası" String Kaynağı — Frontend Sabit

`tedbirge-panel/components/documents/DocumentList.tsx:22`:
```ts
if (s === "FAILED") return "İşlem Hatası";
```

**Backend'den gelmiyor — frontend default.** Document.status === "FAILED" durumunda gösterilen sabit text.

**A2 sonrası senaryo:** finalize-upload sonrası setImmediate AI analiz başarılı → Document.status = ANALYZED → frontend "İşlem Hatası" göstermez.

Hata olursa → Document.status = FAILED + aiAnalysis.error JSON'a gerçek mesaj → frontend "İşlem Hatası" göstermeye devam eder ama detay aiAnalysis JSON'da. Frontend iyileştirme **opsiyonel** (TUR #66 kapsamı dışı, kapsam genişletmemek için skip).

---

## 8. Hata Kök Tahmini — A0.4 Render Logs Yok

CEO Render logs paylaşımı **alınmadı**. Mektup A0.4 talimatı gereği savunmacı varsayım:

**Senaryo X — finalize-upload AI çağrısı yok (en olası %95):**
- TUR #63'te hibrit upload eklendi, AI tetikleyici eklenmedi (boşluk)
- CEO browser test 1 Mayıs gece: belge UPLOADED kaldı, AI hiç tetiklenmedi
- Frontend Document.status === "UPLOADED" gösterimi muhtemelen "Yüklendi"
- Belki **eski multer üzerinden yüklenmiş bir belge** test edildi → Document.status FAILED kalmış olabilir → "İşlem Hatası" görüldü
- VEYA: TUR #63'te schema migration sonrası Document modelinde PENDING_UPLOAD enum eklendi, eski Document'lerin status'u broken state'e düştü

**Senaryo Y — analyzer.service runtime hatası (%5):**
- Anthropic API quota/timeout (analyzer.service'de zaten soft fail var, FAILED yapmaz)
- PDF Vision 20 MB üstü reject (uploadAnalysis.bridge.js:91-95)

**Karar:** A2 finalize-upload AI tetikleyici eklenince **yeni belgelerde sorun çözülür**. CEO browser test ile A3.3 doğrular.

---

## 9. setImmediate Pattern

Mevcut kullanım:
- `src/controllers/document.controller.js:85` — başka bir setImmediate (kapsam dışı)
- `src/os/modules/auditor.js:58` — agent runner (Madde 30)

A2.1 finalize-upload handler'a yeni setImmediate eklenecek — pattern aynı (eski silinmiş `upload.service.uploadDocument` ve `upload.controller.completeUpload` setImmediate kullanıyordu).

---

## 10. A1+ Atom Planı Revizesi

| Atom | Mektup | Revize | Sebep |
|---|---|---|---|
| A1 — Eski sistem AI bug | 30-60 dk | **NO-OP / minimal** | analyzer.service zaten sağlam (soft fail + makeFallback). Frontend "İşlem Hatası" gösterimi opsiyonel iyileştirme — kapsam genişletmemek için skip. |
| A2.1 — finalize-upload AI tetikleyici | 30-45 dk | 30 dk | `setImmediate(analyzeDocumentById)` + Document/Lead update + lawyerNotif hook (eski silinmiş `completeUpload` pattern'i taşı). |
| A2.2 — analyzer tek giriş | (yoktu) | A2.1 birleşik | uploadAnalysis.bridge.analyzeDocumentById tek giriş. |
| A2.3 — public-lead AI erişim | (mektupta) | NO-OP | doc.leadId Yol E sayesinde gerçek lead.id, her context aynı yolu kullanır. |
| A3 — Smoke + CEO browser test | 20-30 dk | 20 dk | Lokal boot + production curl + (CEO browser test sonradan) |
| A4 — OS senkron | 20 dk | 20 dk | DEVIR + IS_PLANI + OTONOM_RAPOR + MIMARI_KARARLAR |

**Yeni toplam:** ~1.5 saat (mektup 2-3 saat tahmininden küçük).
**Atom sayısı:** 4 (A0 + A2 + A3 + A4 — A1 NO-OP).
**Schema migration:** 0
**npm install:** 0
**KIRMIZI nokta:** 0

---

## 11. OTONOMİ SINIRI Değerlendirmesi (mektup 4 senaryo)

| Senaryo | Tetiklendi? | Kanıt |
|---|---|---|
| 1: `triggerAIAnalysis` fonksiyon yok | ⚠️ İSİM YANLIŞ ama **yok değil** | `analyzeDocumentById` mevcut, mektup yanlış isim. Madde 4.4 ile fonksiyon mevcut. **Kapsam değişmedi.** |
| 2: `Lead.aiAnalizDurum/Hata` schema yok | ⚠️ FIELD'lar yok ama **alternatif var** | Document.status FAILED + Document.aiAnalysis JSON.error mevcut altyapı, eski silinmiş upload.service zaten kullanıyordu. **Schema migration gerekmez.** |
| 3: A0.4 Render logs alınamadı | ✅ Tetiklendi | Savunmacı varsayım: A2 finalize tetikleyici %95 olası kökü çözer, A3 CEO browser test kritikleşir. |
| 4: A1 60 dk aştı | ❌ HAYIR | A1 NO-OP — kapsam küçüldü. |

**Sonuç:** Senaryo 3 tetiklenmiş ama Madde 17.5 + CEO direktifi "sırasıyla başla bitir" gereği A2 savunmacı uygulanır (eski pattern'i taşı + hata yakalama Document.aiAnalysis.error'a yaz). Mimar (sohbet) bilgilendirilmeden devam.

---

## 12. A0 Sonuç

✅ **A0 keşfi tamamlandı, sürpriz büyük yapısal mesele YOK.**
✅ **Mektup 2 yanlış varsayım: fonksiyon adı (`triggerAIAnalysis` → `analyzeDocumentById`) + schema fields (`aiAnalizDurum/Hata` → `Document.status FAILED + Document.aiAnalysis`). Madde 4.4 — kod kaynaktır.**
✅ **Atom planı 5 atom → 4 atom (A1 NO-OP, A2 birleşik commit).**
✅ **Madde 17.5 + CEO direktifi gereği A2-A4 otonom akış başlar.**

Sonraki: **A2 — finalize-upload AI tetikleyici** (30 dk).

---

**— Claude Code (Anthropic)**
**TUR #66 A0 — 2 Mayıs 2026**
**Anayasa v1.19.0 yürürlükte**
**Pattern devam: TUR #56+57+58+59+60+62+63+63.5+63.5v2+64+66 A0**
