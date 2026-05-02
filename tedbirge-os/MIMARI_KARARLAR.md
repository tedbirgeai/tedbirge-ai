# TEDBIRGE.AI — MİMARİ KARARLAR LOG

> Bu dosya **karar arşividir**. Mimar oturumlarında verilen tasarım kararları, paradigma değişiklikleri, yapı tercihleri buraya yazılır.  
> Yeni mimar (her Claude Opus oturumu) bu dosyayı okur ve **aynı kararları tekrar tartışmaz**.  
> Format: tarih + karar + sebep + alternatif + etki + mimar.

---

## TUR #66.5 — Vision 20 MB Limit Hotfix (KARAR TOHUMU — 2 Mayıs 2026 gece)

**Anayasa:** v1.19.1 → v1.19.2 (PATCH önerisi — Madde 32.2 alt-madde)

### Karar Tohumu (mektup CEO'dan bekleniyor)

CEO browser test 2 Mayıs gece bulgusu: 26.5 MB PDF Vision API limit aştı, AI analiz FAILED. TUR #66 v2 hata yönetimi **doğru çalıştı** (Madde 4.4 canlı kanıt — frontend gerçek mesaj gösterdi, ADMIN bildirim hook tetiklendi). Ancak kullanıcı deneyimi açısından **proaktif sıkıştırma + uyarı** gerekli.

**Önerilen 3 atom hotfix:**

1. **Frontend (`document-upload.ts`):** `compressDocument` >20 MB PDF için aggressive compress + kullanıcı uyarısı
2. **Backend (`uploadAnalysis.bridge.js`):** Vision öncesi `pdf-parse` text extract fallback
3. **Anayasa (Madde 32.2 PATCH):** Vision limit kontrolü disiplini formalize

### Karar Gerekçesi (Tohum — mektup detaylandıracak)

1. **Madde 4.1 ekosistem garantisi:** TUR #66 v2 hata mesajı doğru gösteriyor ama kullanıcı **önceden** proaktif uyarı almıyor — yarım UX
2. **Madde 32.2 sıkıştırma disiplini:** Mevcut "1920px JPG 0.85 + 2 MB hedef" PDF için Vision 20 MB limitini kapsamıyor — disiplin genişletilmeli
3. **Madde 24.11 hukuki muhatap güven skoru:** Vision atlanırsa text fallback kalitesi düşer, güven skoru otomatik düşer (zaten kurulu)

### Reddedilen Alternatif (tohum)

- **Vision limit'i 20 MB'a kadar destekleme:** Anthropic API kontrol dışı, limit değiştirilemez
- **Sadece backend text fallback:** Frontend kullanıcıya bilgi vermeden büyük dosyalar yine yüklenir, bant genişliği israfı

### Etki Tahmini

- 3 atom (A1 frontend + A2 backend + A3 anayasa)
- Süre 30-45 dk
- 0 schema, 0 npm, 0 KIRMIZI nokta
- Anayasa v1.19.1 → v1.19.2 (PATCH)

### Madde 26.4 + 26.9 (sohbet kapanış uyarısı)

CEO 2 Mayıs gece sohbeti kapatıyor — 5 dosya devir paketi knowledge klasörüne yüklenecek. Yeni sohbet TUR #66.5 mektubunu yazacak ve Code uygulayacak (Madde 26.4 açılış protokolü otomatik).

---

## TUR #66 v2 — AI Analiz Pipeline TÜM SİSTEM Uçtan Uca (2 Mayıs 2026 öğleden sonra)

**Anayasa:** v1.19.0 → v1.19.1 (PATCH — Madde 32.10 alt-madde eklendi)

### Karar

TUR #64 sonrası kopuk AI analiz zinciri **TÜM SİSTEM** olarak yeniden kuruldu (LAWYER + CUSTOMER + PUBLIC + 7 context). Frontend sabit "İşlem Hatası" string silindi, kullanıcı gerçek hata mesajını görüyor. ADMIN otomatik bildirim alıyor. Geçmiş FAILED Document'lar için retry endpoint mevcut (toplu/tekil/sayım).

Hibrit `finalize-upload` handler'ı `doc.leadId` mevcutsa `setImmediate(analyzeDocumentById)` ile AI analizi tetikler. Hata olursa Document.status FAILED + Document.aiAnalysis.error gerçek mesaj + ADMIN bildirim. Retry hâlâ hata alırsa aynı bildirim hook tetiklenir.

### Karar Gerekçesi

1. **Madde 4.1 ekosistem garantisi:** TUR #64 sonrası finalize-upload AI tetikleyici eksikti. Yeni belgeler analiz edilmiyordu.
2. **Madde 4.4 kod kaynaktır:** Mektup `triggerAIAnalysis` adında fonksiyon arıyordu — gerçek `analyzeDocumentById` mevcut. Mektup `Lead.aiAnalizDurum/Hata` schema fields varsayıyordu — yok ama `Document.status FAILED + Document.aiAnalysis JSON` mevcut altyapı yeterli (eski silinmiş upload.service zaten kullanıyordu). **Schema migration gerekmedi.**
3. **Madde 24.11 hukuki muhatap güven skoru disiplini:** `notifyAiAnalysisCompleted(leadId, summary, requiresReview)` hook (TUR #56 A1.2) — güven skoru < 0.7 ise manuel onay zorunlu, finalize handler bu hook'u tetikliyor.
4. **CEO direktifi "uçtan uca tek seferde":** v1 (sadece finalize tetikleyici) → v2 7 atom (frontend + ADMIN bildirim + retry job). Yarım uygulama Madde 17.4 (yarım kesit) ihlali olur.
5. **Sabit "İşlem Hatası" YASAK (Madde 4.4):** Frontend gerçek `Document.aiAnalysis.error` göstermeli. Yeni Madde 32.10 ile formalize edildi.

### Reddedilen Alternatifler

**Sadece A2 (v1 dar kapsam):**
- Avantaj: Hızlı, dar değişiklik
- Red: Frontend sabit "İşlem Hatası" + ADMIN bildirim + retry mekanizması yok → kullanıcı gerçek hatayı göremez, ADMIN haberdar olmaz, geçmiş FAILED'ler hâlâ kırık. Madde 4.1 ekosistem ihlali.

**Lead.aiAnalizDurum/Hata schema migration:**
- Avantaj: Mektup harfine sadık
- Red: Mevcut Document.status FAILED + Document.aiAnalysis.error JSON aynı işi yapıyor (eski silinmiş upload.service kanıtı). Schema migration KIRMIZI nokta + CEO yazılı onay gereksiz külfet.

**setImmediate yerine senkron AI çağrısı:**
- Avantaj: Garantili sonuç finalize response'ta
- Red: 10-30 sn API latency kullanıcıya yansır, kötü UX. Fire-and-forget pattern doğru (TUR #56 + eski upload.service kanıtı).

### Etki

- **7 atom** sapma 0 (A0 keşif + A2 finalize + A3 panel + A4 ADMIN bildirim + A5 retry endpoint + A6 smoke + A7 OS)
- **5+ commit** (1 OS A0 + 1 A2 backend + 1 A4+A5 backend + 1 A3 panel + 1 OS A7)
- **3 yeni endpoint:** POST `/api/os/ai-retry/all`, POST `/api/os/ai-retry/:id`, GET `/api/os/ai-failed-count`
- **1 yeni servis fonksiyonu:** `lawyerNotifications.notifyAiAnalysisFailed`
- **Frontend:** sabit "İşlem Hatası" → gerçek `aiAnalysis.error` mesajı
- **Schema migration:** 0
- **npm install:** 0
- **Env değişikliği:** 0
- **KIRMIZI ihlal:** 0
- **Production smoke:** 7/7 yeşil
- **Anayasa:** v1.19.0 → v1.19.1 (PATCH)

### CEO Direktifi (Madde 17.5)

CEO Mehmet DİNÇ:
- v1 mektup sırasında: *"DUR. CEO yeni direktif verdi: uçtan uca tam sistem kapsamı."*
- v2 mektup sonrası: *"Otonom uçtan uca, sırasıyla başla bitir."*

KIRMIZI nokta türü yok (schema/npm/env 0). Madde 18.4 yeşil nokta otomatik akış.

### Mektup Düzeltmeleri (Madde 4.4)

- v1 mektup `triggerAIAnalysis` → gerçek `analyzeDocumentById` (uploadAnalysis.bridge.js)
- v1 mektup `Lead.aiAnalizDurum/Hata` → gerçek `Document.status FAILED + Document.aiAnalysis JSON.error`
- v2 mektup `/api/admin/ai-retry/...` URL → gerçek `/api/os/ai-retry/...` (admin.os.routes mount)

### Pattern

`TUR #56+57+58+59+60+62+63+63.5+63.5v2+64+66v2 = 75+ atom sapma 0 — kalibrasyon faktörü 1.6× altıncı kez doğrulandı`

### Mimar

Claude Opus 4.7 (1M context) — Sohbet mimarı (mektup yazan) + Claude Code uygulayan; CEO Mehmet DİNÇ otonom direktif

---

## TUR #64 — Eski Upload Endpoint Silme + Public-Lead Güvenlik Kapatma (2 Mayıs 2026)

**Anayasa:** v1.19.0 (sürüm artmaz — sadece TUR kaydı)

### Karar

Eski multer akışı (`/api/uploads/:leadId` + signed URL eski endpoint'leri) tamamen silindi. `uploadDocument` hibrit util TÜM SİSTEM için **gerçek tek giriş noktası** oldu (sadece tasarım garantisi değil — kanıtlı: backend multer 0, panel FormData 0, eski Document.create 0).

İkinci karar: TUR #63 zamanından kalan public-lead **gizli güvenlik açığı** kapatıldı. `documents.upload.routes.js` Zod şeması `leadDraftToken` istiyordu ama `checkPermission` doğrulamıyordu — anonim biri herhangi bir 8+ char string ile `public-drafts/` klasörüne yazabilirdi.

**Yol E (pragmatik):** `leadDraftToken` içeriği `lead.id` (UUID). 30 dk pencere + `lead.source === "public_form"` kontrolü.

### Karar Gerekçesi

1. **Madde 32.8 yasak listesi tam uygulanması:** Vercel 4.5 MB body bypass + tek util kuralı + audit log atlama riski 0
2. **Madde 4.1 ekosistem garantisi:** TUR #63 sonrası kalan teknik borç (eski multer + 3 ayrı `Document.create`) silindi
3. **Public-lead güvenlik:** Yeni token mekanizması eklemeden mevcut Lead.createdAt + source field ile doğrulama (0 schema değişikliği)
4. **A0 keşif disiplini (Madde 4.1 + 4.4):** Mektup tahmin "11+ panel sayfası" — gerçek 1. Eski endpoint panel'de zaten kullanılmıyordu. Atom planı revize edildi (9 atom → 6 atom, ~4 saat → ~1.5 saat).

### Reddedilen Alternatifler

**Yol F (UUID draftToken yeni mekanizma):**
- Avantaj: Mektup harfine en sadık, "draftToken" ismi gerçek crypto token
- Red: Lead modeli `metadata Json` field gerektirir veya in-memory cache; schema değişikliği = KIRMIZI nokta; yeni TUR (#65+) gerektirir; Yol E ile aynı güvenlik seviyesi minimum kod ile

**Eski endpoint deprecate işaretleyip korumak:**
- Avantaj: Yarı zamanlı geçiş riski yok
- Red: Madde 4.1 ekosistem garantisi ihlali; "yarı kurulu" mimari Madde 32.8 yasak

### Etki

- **6 atom** (A0 keşif + A1 backend silme + A2.0 hibrit doğrulama + A2.1 panel migrate + A2.2 backend temizlik + A3 smoke + A4 OS) sapma 0
- **5 commit** (3 backend + 1 panel ayrı git repo + 1 OS A0; A4 OS bu commit ile birlikte 6)
- **4 backend dosya silindi** (upload.routes + upload.controller + upload.service + uploadMiddleware) — 310 satır temizlik
- **public.route.js 132 satır azaldı** (multer + Document.create + activityLog blokları)
- **Public-lead güvenlik açığı kapandı** (gizli, TUR #63'ten beri vardı)
- **Schema migration:** 0
- **npm install:** 0
- **Env değişikliği:** 0
- **KIRMIZI ihlal:** 0

### CEO Yazılı Onay (Madde 17.5)

CEO Mehmet DİNÇ direktifi: *"Otonom uçtan uca uygula yes/no sorma."* (TUR #63 pattern devam — sohbet kaydı 2 Mayıs 2026 mektup teslimi). Schema/npm/env yok → KIRMIZI nokta yok → Madde 18.4 yeşil nokta otomatik.

### Mektup Düzeltmeleri (Madde 4.4 — Kod Kaynaktır)

- Mektup tahmini "11+ panel sayfası FormData" → gerçek **1 sayfa** (basvuru/page.tsx)
- Mektup `src/middleware/uploadMiddleware.js` → gerçek `src/middlewares/uploadMiddleware.js` (çoğul)
- Mektup `documents.upload.routes.js` "zaten doğru pattern" → gerçek **public-lead doğrulama yarımdı**, gizli güvenlik açığı kapatıldı (Yol E)
- Mektup `draftToken` cryptographic → Yol E pragmatik: leadDraftToken = lead.id

### Pattern

`TUR #56+57+58+59+60+62+63+63.5+63.5v2+64 = 65+ atom sapma 0 — kalibrasyon faktörü 1.6× sürdü`

### Mimar

Claude Opus 4.7 (1M context) — Sohbet mimarı (mektup yazan) + Claude Code uygulayan; CEO Mehmet DİNÇ otonom direktif

---

## TUR #63 — Hibrit Belge Mimarisi (CEO yazılı onay 2 Mayıs 2026)

**Anayasa:** v1.18.0 → v1.19.0 (MINOR — Madde 32 Belge Disiplini eklendi)

### Karar

Tedbirge.ai'nin tüm belge yönetimi (CUSTOMER + LAWYER + REPRESENTATIVE + ADMIN + public form'lar) **hibrit mimari** ile çalışır:

- **Ana kopya:** Supabase Storage (her zaman, KVKK Madde 24.10 güvenli)
- **Cache:** IndexedDB, 30 gün TTL, logout'ta `purgeAllCache()` (zorunlu temizleme)
- **Sıkıştırma:** Browser tarafı zorunlu (resim 1920px JPG 0.85, PDF rebuild)
- **Upload:** 4 adımlı — `compress` → `init-upload` (signed URL) → `PUT` direkt Supabase → `finalize-upload` (DB UPLOADED + audit log)
- **Download:** `useDocument(id)` hook → cache → network fallback → blob URL otomatik revoke

### Karar Gerekçesi

1. **Bulut tek kaynak (Supabase Storage)** — KVKK uyumlu (Madde 24.10), 4 sağlayıcının SCC altyapısı zaten kuruldu, ana kopya kaybolmaz, avukat/müvekkil PC kaybedilse bile veri güvende
2. **Hibrit cache (IndexedDB 30 gün TTL)** — avukat sahada offline hızlı erişim sağlar, logout purge ile KVKK m.4 ihlali yok
3. **Browser sıkıştırma (%85 yer tasarrufu — 12 MB → 1 MB)** — Vercel egress maliyeti düşer, mobil kullanıcı için kritik, kullanıcıya şeffaf
4. **Direkt Supabase upload (Vercel 4.5 MB body limit bypass)** — TUR #62 B4.7 KRİTİK problemi çözer (50 MB upload sınırı vs 5 MB body)
5. **10 UploadContext tipi (Zod discriminatedUnion)** — yamalı bohça yok (Madde 4.1), tek util tüm kanal: lead, public-lead, career, kvkk-request, tahsilat, bilirkisi, dava, ihtarname, sozlesme, general
6. **Schema migration: prisma migrate diff DB'siz pattern (TUR #49 dersi)** — DIRECT_URL lokalde yok → DB'siz SQL üretildi (547 byte), beklenmedik DROP/CASCADE/RENAME yok, production deploy CEO Render Shell manuel

### Reddedilen Alternatifler

**Yol 1 (Sadece sıkıştırma — bulut tek kaynak):**
- Avantaj: KVKK güvenliği maksimum
- Red sebebi: Avukat sahada offline çalışamaz, ağ bağlantısı kopukken belge görüntülenemez

**Yol 3 (Tam lokal — IndexedDB ana kaynak):**
- Avantaj: Hızlı offline erişim
- Red sebebi: KVKK Madde 4 ihlali — avukat PC'si tek kaynak olursa veri sorumlusunun (avukat) güvenli arşivleme yükümlülüğü ihlal edilir; PC kaybı/çalınma = veri kaybı

### CEO Yazılı Onay (Madde 18.3)

CEO Mehmet DİNÇ yazılı onay (sohbet kaydı 2 Mayıs 2026 — gece TUR #63 mektup teslimi):
- *"Schema migration onayı veriyorum. TUR #63 v3 mektubu hazırla. Yaz mektubu hatasız 0 risk ile."*
- *"Otonom uçtan uca uygula yes/no sorma."*

KIRMIZI nokta türü: schema migration (PENDING_UPLOAD enum + 4 yeni alan + leadId nullable) + npm install (browser-image-compression + pdf-lib).

### Etki

- **9 atom** (A0 ekosistem + A1 schema + A2 sıkıştırma + A3 hibrit upload + A4 cache + A5 body+logout + A6 mevcut kanal + A7 download + A8 smoke + A9 OS senkron) — sapma 0
- **9 commit** (5 backend ana repo + 4 panel ayrı repo)
- **TUR #62 B4.7 KRİTİK** çözüldü (5 MB body ↔ 50 MB upload çelişkisi)
- **~%85 yer tasarrufu** (sıkıştırma) — Vercel egress + Supabase storage maliyeti düşer
- **TÜM rolde tek mimari** — public form, CUSTOMER, LAWYER, REPRESENTATIVE, ADMIN aynı `uploadDocument(file, {context})` util kullanır
- **A1.7 production deploy** CEO Render Shell beklemede (Madde 3.1 — KIRMIZI çizgi)

### Mektup Düzeltmeleri (Madde 4.4 — Kod Kaynaktır)

A0 ön kontrolünde mektup hataları yakalandı:
- `BilirkisiAtama` → `Bilirkisi` (yanlış model adı)
- `Ihtarname` → `IhtarnameTakip` (yanlış model adı)
- `lead.atananAvukatId/getirenTemsilciId/customerId` → `assertLeadAccess` (Madde 9.5 mevcut pattern)
- `audit.service.logActivity` → inline `prisma.activityLog.create` (helper yoktu)
- Backend monorepo + panel ayrı git repo — commit'ler iki repoya bölündü

### TUR #63.5 v2 Düzeltme — Madde 4.1 Ekosistem Garanti (1 Mayıs 2026 gece)

CEO browser test sonrası 403 "Yetkiniz yok" + F12 Network "init-upload 0 istek" semptomu iki katmanlı bug ortaya çıkardı:

**Bug 1 — TUR #63.5 v1: ADMIN superuser bypass eksikti**
- `src/routes/documents.upload.routes.js` `checkPermission` lead-bağlı bloğunda `assertLeadAccess`'ten ÖNCE ADMIN bypass yoktu
- ADMIN için `Lead.assignments / ownerId / createdById` hiçbiri eşleşmiyor → 403
- Düzeltme (commit `11beb9d`): `if (user.role === "ADMIN") return { allowed: true, leadId };`

**Bug 2 — TUR #63.5 v2: Bearer auth eksikliği + BelgeYukleme A6'da atlanmıştı**
- `lib/document-upload.ts` `credentials: 'include'` kullanıp Authorization header eklemiyordu (Madde 13.2 ihlali)
- Backend `optionalAuth` Bearer bekliyor → `req.user = null` → ADMIN bypass çalışamıyor
- `BelgeYukleme.tsx` (müvekkil portal) hala FormData + `/uploads/:leadId` eski endpoint kullanıyordu
- Düzeltme (commit `e796c1a`): `getAuthHeaders()` helper + BelgeYukleme `uploadDocument` util'e geçirildi

**CEO Browser Test Onayı (1 Mayıs 2026 gece):**
- URL: `tedbirge.ai/leads/cmoid5omy0008it1yrab8u7wp`
- F12 Network: init-upload 200 + finalize-upload 200
- Aktivite Akışı: DOCUMENT_UPLOAD_INITIATED + DOCUMENT_UPLOAD_COMPLETED
- 505253 bytes tedbirge-brosur-erzurum.pdf

**Garanti:** TUR #63 A6 kapsam yetersizliği TUR #63.5 v2'de tamamlandı. Tüm lead-bound upload UI tek hibrit util kullanır, Bearer header zorunludur, ADMIN her context'te bypass eder.

### Madde Referansları

- **Madde 4.1** (ekosistem haritası önce) — 10 UploadContext tek mimari, BelgeYukleme atlanmıştı (TUR #63.5 v2'de kapatıldı)
- **Madde 4.4** (kod kaynaktır) — A0 ön kontrol ile mektup hataları yakalandı
- **Madde 9.5** (assertLeadAccess) — ADMIN superuser bypass eklendi (TUR #63.5 v1)
- **Madde 13.2** (apiFetch/Bearer zorunlu) — `credentials: include` yetmez, Bearer header şart (TUR #63.5 v2)
- **Madde 18.3** (KIRMIZI nokta yazılı onay) — schema + npm install için CEO yazılı onayı
- **Madde 24.10** (KVKK Yurt Dışı Aktarım) — bulut ana kopya + SCC zinciri
- **Madde 32** (yeni) — Belge Disiplini Hibrit Mimari TÜM SİSTEM (9 alt-madde)
- **Madde 3.1** (KIRMIZI çizgi: production DB SQL) — A1.7 CEO Render Shell manuel

**Mimar:** Claude Opus 4.7 (sohbet) + Claude Code (otonom uygulama)
**Onay:** Mehmet DİNÇ (Kurucu, CEO & CTO) — Madde 17.5 + 18.3 + browser test onayı 1 Mayıs 2026 gece

---

## 1 Mayıs 2026 — TUR #59 KAPANIŞ — FAZ 5 İçerik Üretimi (Anayasa v1.18.0)

**Karar:** TUR #59 ile FAZ 5 İçerik Üretimi tamamlandı. 10 atom + 50 niş makale + 3 pillar refactor + iç linking grafı + sitemap auto-update.

**Anayasa:** v1.17.0 → v1.18.0 (MINOR — Madde 33.2 düzeltme + 50 makale kümesi tescilli).

### Kanıt — 10 atom uygulandı

| # | Atom | Commit |
|---|---|---|
| A0 | BlogPost type genişletme + Madde 33.2 düzeltme | 91d3b9f |
| A1.1-A1.5 | 50 makale POSTS array (5 batch) | 88407ae + 8bac916 + e1c6171 + e99834f |
| A2 | blog detay FAQPage + BreadcrumbList JsonLd + SSS render | c2e29fd |
| A3+A4+A5 | 3 pillar cluster grid (20+15+15) | 9c3cd25 |
| A6 | sitemap + iç linking audit (0 bozuk) | b98e327 |
| A7 | production smoke test | (sadece doğrulama) |
| A8 | OS senkron + Anayasa v1.18.0 | (bu commit) |

### Altyapı Kararı (Kritik) — MDX vs POSTS Array

**Bağlam:** TUR #59-60-61 birleşik mektup MDX altyapısı öneriyordu. MDX npm paket gerektirdiği için 0-paket disiplini ile çelişti.

**Önceki sohbette tespit:** DUR sinyali #2 (npm install gerekirse) tetiklendi. Sohbete dönüş yapıldı.

**Yeni TUR #59 mektubu çözümü:** Mevcut `lib/blog.ts` POSTS array yolunu seçti — MDX reddedildi.

**Avantajlar:**
- 0 npm install (Aylık Aidat Yasağı + 0-paket disiplini uyumlu)
- Mevcut altyapı genişlemesi (TUR #43+46+TUR #51 B8 üstüne kuruldu)
- Hızlı uygulama (10-12 saat tahmin, gerçek 9 commit)

**Pattern (TUR #60+ için):** Yeni özellik mektubu yazılmadan önce mevcut altyapı kontrol edilmelidir. Mevcut yapıyla yapılabilecekse paket eklenmemelidir.

### Madde 33.2 Düzeltme

**Önceki metin:** Avukat onayı her içerik için zorunlu.

**Yeni metin:** Madde 25.3 KIRMIZI listesi kontrolü yeterli. TUR #47 fizibilite raporları anayasal düzeyde önceden kurmuştu; her içerik için ayrı avukat onayı zorunlu değil.

**Akış:** AI taslak → Madde 25.3 KIRMIZI kontrol → CEO onayı (Madde 17.5) → yayın

### Beklenen Sonuç (3-6 Ay)

Aylık 100-500 organik AI-yönlendirmeli ziyaretçi (ChatGPT/Perplexity/Gemini/AI Overview). 50 makale + 3 pillar ile niş topical authority kuruldu.

### Pattern (TUR #56+57+58+59 = 43/43 Atom Sapma 0)

Kalibrasyon faktörü 1.6× **dördüncü kez** kalıcı pattern olarak doğrulandı. Mimar mektubu yazarken plan ÷ 1.6 gerçekçi tahmin verir.

### CEO Direktif Keskinliği

CEO direktifi *"DOSTUM NEDEN BÖLÜP PARÇALIYORSUN... UÇTAN UCA TEK KOMUTLA UYGULA"* otonom akışı stabilize etti. 9 commit kesintisiz, 0 build hatası.

### Madde Referansları

Madde 4 + 17.4 + 17.5 + 22 + 24.1 + 24.13 + 25.3 + 33 (33.2 düzeltildi) + CEO direktifleri 1 Mayıs 2026 (Aylık Aidat Yasağı + UÇTAN UCA TEK KOMUT).

**Mimar:** Claude Opus 4.7 (sohbet) + Claude Code (otonom uygulama)
**Onay:** Mehmet DİNÇ (Kurucu, CEO & CTO)

---

## 1 Mayıs 2026 — Aylık Sabit Aidat Yasağı (CEO Direktifi)

**Karar:** Tedbirge.ai aylık sabit üyelik aidatı ödemez.

**Kapsam:** Tüm 3. parti SaaS hizmetler (chat platform, voice platform, vector DB cloud, AI orchestration tool, conversational AI).

**İstisna:** Sadece **kullanım bazlı API ücreti** (Anthropic, OpenAI gibi LLM API'leri) ödenebilir — çünkü bunlar kullandıkça öder, sabit aidat değil.

**Yasak listesi (örnek):**
- Voiceflow / Botpress / Intercom AI Chat (aylık $50-500)
- Pinecone / Weaviate Cloud (pgvector alternatifi var)
- Drift / HubSpot Conversational AI (aylık $400+)
- ElevenLabs sabit aylık paket (FAZ 7'ye kadar değerlendirilmez)
- Custom GPT Plus kurumsal abonelik

**Disiplin sorgusu:** Her yeni 3. parti hizmet önerisi için mimar şu soruyu sorar — "Bunu kendi altyapımızla (Next.js + PostgreSQL + Anthropic API + mevcut Render/Vercel) yapabilir miyiz?" Cevap **evet** ise alternatif kabul edilir. **Hayır** ise CEO onayına götürülür.

**Beraberinde gelen yetki:** FAZ 5-7 roadmap (Discoverability + Chat + Voice) bu kararla uyumlu olmalı. 0 TL sabit ek aidat disiplini garanti altında. Sadece kullanım bazlı API ücreti orantılı geçer.

**Ekonomik etki:** 5 yıllık kâr farkı tahmini 1-2.5 milyon TL (sabit aidat ödemiyoruz vs ödüyor olsak fark).

**Pattern (TUR #59+ için):**
1. Yeni özellik mektubu yazılmadan önce mimar "0-paket disiplini" sorusu sorar
2. Eğer paket gerekiyorsa CEO onayı + Aylık Aidat Yasağı uyumu kontrolü (sabit ücret mi / kullanım bazlı mı?)
3. Kullanım bazlı geçer, sabit aylık geçmez
4. TUR #57 (3 paket adayı reddedildi: react-beautiful-dnd / canvas-confetti / lottie-react) bu pattern'in kanıtıdır

**Madde referansları:** Madde 4 (ekonomi prensibi) + Madde 17.5 (CEO son söz) + Madde 22 (sürüm disiplini) + Madde 33 (İçerik Üretim Disiplini)

**CEO direktif tarihi:** 1 Mayıs 2026 (TUR #58 mektup yazımı sırasında)
**Mimar:** Claude Opus 4.7

---

## 1 Mayıs 2026 — TUR #58 KAPANIŞ — FAZ 5 Discoverability Başlangıcı (Anayasa v1.17.0)

**Karar:** TUR #58 ile FAZ 5 (Discoverability) resmi olarak başladı. 9 atom uygulandı (sapma 0): llms.txt + JsonLd 3 factory + 3 SSS landing + /tazminat-rehberi + AI snippet + brand footer + Madde 33.

**Anayasa:** v1.16.0 → v1.17.0 (MINOR — Madde 33 İçerik Üretim Disiplini eklenmesi)

### Kanıt — 9 atom uygulandı

| # | Atom | Commit |
|---|---|---|
| A1 🔴 | llms.txt Anthropic standartı | 9515565 |
| A2 | JsonLd FAQPage + HowTo + BreadcrumbList factory | a1a5bba |
| A3 | /trafik-kazasi-tazminat 15 SSS + FAQPage | 6e3546d |
| A4 | /is-kazasi-tazminat 15 SSS + FAQPage | 13abbbf |
| A5 | /sigorta-tazminat-reddedildi 10 SSS + FAQPage | 864b78f |
| A6 | /tazminat-rehberi yeni sayfa + HowTo (8 adım) | d692e18 |
| A7 | AI snippet meta disiplini (3 niş hero) | 5866a54 |
| A8 | BrandFooterStrip 4 sayfada + Twitter Card | 84c6612 |
| A9 | OS senkron + Anayasa v1.17.0 + Madde 33 | (bu commit) |

### Yeni Madde 33 — İçerik Üretim Disiplini (5 alt-madde)

- 33.1 İlke: public içerik sadece bilgilendirme (Madde 24.1 + 24.13 referans)
- 33.2 Onay disiplini: CEO + danışman avukat + "Tedbirge Editöryal Ekibi" yazar + disclaimer + AI taslak avukat onayı
- 33.3 Yasak: spesifik tazminat vaadi / sonuç vaadi (TBB Reklam Yasağı) / avukat ismi / "size özgü" / müvekkil izlenimi
- 33.4 SEO/AEO: FAQPage/HowTo/Article/BreadcrumbList schema + AI snippet + llms.txt + brand footer
- 33.5 Madde referansları

### Operasyonel Kazanım

**Discoverability altyapı tam:** ChatGPT/Claude/Perplexity/Gemini Tedbirge'i yapılandırılmış kaynak olarak görür. 40 SSS + 8 adım HowTo schema. 4 niş sayfada AI snippet ilk 150 char disiplini. Brand footer her sayfada. Madde 33 ile içerik üretim süreci anayasal disiplin altında.

### Beklenen Sonuç (6 Ay)

Aylık 5-30 organik AI-yönlendirmeli ziyaretçi. TUR #58 **altyapı**dır — trafik için TUR #59 (30 niş içerik makalesi) gerekli.

### Sebep — CEO Direktifi (1 Mayıs 2026)

> "Diğer AI'lar (ChatGPT/Gemini/Perplexity) bizi öneren cevap versin"

Mevcut durum: Tedbirge AI scraper'lar tarafından yapılandırılmış kaynak olarak görünmüyordu. AI Overview/ChatGPT'de niş sorgu ("trafik kazası tazminatı Türkiye") cevaplarında alıntılanma şansı düşüktü.

TUR #58 ile bu altyapı kuruldu — TUR #59 ile 30 niş makale yayını sonrası AI scraper'lar yapılandırılmış kaynağa erişip alıntı yapacak.

### Alternatifler

- **A. SEO ajansı kiralamak (aylık $500-2000)** → reddedildi: Aylık Aidat Yasağı (yukarıda) + 0-paket disiplini
- **B. Schema.org kütüphanesi (next-seo gibi paket)** → reddedildi: native JsonLd factory zaten mevcut, paket gereksiz
- **C. Tüm landing'leri sıfırdan yazmak** → reddedildi: mevcut 4 sayfa fonksiyonel, FAQPage schema ekleme yeter

**Seçilen:** Mevcut altyapıya 9 atom enjeksiyon + 0 paket + 0 schema değişikliği.

### Beraberinde

- **TUR #59-64** FAZ 5 devam (30 niş makale + teknik SEO + monitoring)
- **TUR #65+** FAZ 6 (Public AI Chat) başlatma kararı FAZ 5 trafik üretimi görüldükten sonra
- **Sağlık taraması (T tipi tur)** Mehmet Bey kararıyla isteğe bağlı

### Pattern (TUR #59+ için)

1. **Schema + altyapı turu** (büyük, KIRMIZI nokta paketli) — TUR #55
2. **Fonksiyonel UI tamamlama turu** (orta, schema sabit) — TUR #56
3. **Rol-ruh karakter farklılaştırma turu** (büyük, kompozisyon değişimi) — TUR #57
4. **Discoverability altyapı turu** (orta, içerik şeması) — **TUR #58 ✅**
5. **İçerik üretim turu** (büyük, niş makaleler) — TUR #59 (sıradaki)
6. **Teknik SEO turu** (orta, performans + iç link) — TUR #60+

### Mimar Dersi (TUR #56+57+58 = 33/33 atom — Pattern Üçüncü Kez Doğrulandı)

**Kalibrasyon faktörü 1.6× üç tur üst üste doğrulandı.** Bu artık tahminin değil **standardın** parçası. Mimar mektubu yazarken plan ÷ 1.6 gerçekçi tahmin verir, atom sayısı buna göre belirlenir.

**0-paket disiplini sürdürülebilir** — TUR #57'de 3 paket adayı reddedildi, TUR #58'de hiç paket adayı çıkmadı (bu da disiplinin doğal sonucu).

**KRİTİK önce sıralama** TUR #58'de A1 (llms.txt) ilk yapıldı — KRİTİK altyapı tamamen oturduktan sonra ORTA atomlar (A2-A8) sorunsuz aktı.

**CEO direktif keskinliği** ("HİÇBİR HARF GERİDE KALMAYACAK") otonom akışı stabilize ediyor — 9 commit kesintisiz, 0 build hatası.

**Mimar:** Claude Opus 4.7 (sohbet) + Claude Code (otonom uygulama)
**Onay:** Mehmet DİNÇ (Kurucu, CEO & CTO) — TUR #58 mektubu A onayı + Aylık Aidat Yasağı direktifi

**Disiplin Kanıtı:** Madde 4 + 17.4 + 17.5 + 21 + 22 (MINOR) + 22.4 (OS senkron) + 24.1 + 24.11 + 24.13 + 27 (boyut) + 33 (yeni) + CEO direktifi (Aylık Aidat Yasağı)

---

## 1 Mayıs 2026 — TUR #57 KAPANIŞ — 4 CRM Rol-Ruh Karakter Farklılaştırma (Anayasa v1.16.0)

**Karar:** TUR #57 mektubu 12/12 atom uygulandı (sapma 0). 4 CRM artık niş emsal seviyesinde: CEO ↔ Stripe Dashboard+Linear Insights · LAWYER ↔ Clio Manage+MyCase · REPRESENTATIVE ↔ HubSpot Sales+Pipedrive · CUSTOMER ↔ Stripe Customer Portal+Apple HIG. Anayasa v1.15.0 → **v1.16.0** (MINOR — Madde 31.9 tohumdan resmileşti).

### Kanıt — 9 yeni DS komponenti (`components/ds/role-specific/`)

| Komponent | Hedef CRM | Niş Emsal İlhamı |
|---|---|---|
| `KPICardEnhanced` | CEO | Stripe Dashboard sparkline KPI |
| `Sparkline` | CEO | Linear Insights mini grafik |
| `AnomalyStrip` | CEO | Vercel Analytics anomali bandı |
| `KanbanBoard` | REPRESENTATIVE | HubSpot Sales pipeline |
| `DealCard` | REPRESENTATIVE | Pipedrive deal card + rotting border |
| `ActivityCounter` | REPRESENTATIVE | HubSpot haftalık aktivite |
| `CaseFolderCard` | LAWYER | Clio matter folder metaforu |
| `LawyerHealthTriad` | LAWYER | Clio Util/Real/Coll → Türk piyasa uyarlama |
| `TimelineDot` | CUSTOMER | Apple HIG depth + Linear Public Status |
| `TrustBadge` | CUSTOMER | Stripe Customer Portal güven simgesi + Apple Mail başlık |
| `KeyboardShortcutsHelp` | CEO | Linear ? help modal |

### Kanıt — 2 yeni route + 2 utility + 2 endpoint

- `/dashboard/komuta` (CEO): 6 KPI üst şerit + AnomalyStrip + canlı SSE feed + mali önizleme
- `/temsilci/pipeline` (REP): KanbanBoard + ActivityCounter
- `lib/sadelestir.ts`: 30 hukuki terim → sade Türkçe (CUSTOMER ekranlarında)
- `lib/keyboardNav.ts`: Linear-stili G+harf hook
- `GET /api/admin/anomalies`: 3 anomali tespit (AI/KVKK/komisyon)
- `POST /api/representative/leads/:id/asama`: Kanban drag-drop state machine

### 0-Paket Disiplini Zaferi (Madde 4 ekonomi)

3 npm paket adayı native alternatifle **reddedildi**:

| Reddedilen | Native Alternatif | Gerekçe |
|---|---|---|
| `react-beautiful-dnd` | HTML5 DragEvent API | 2022'de deprecated, modern tarayıcılar zaten destekliyor |
| `canvas-confetti` | CSS keyframe `confetti-fall` | 30 partikül CSS yeter, paket bütçesi gereksiz |
| `lottie-react` | Inline SVG illüstrasyon | 4 basit SVG yeter, runtime player yükü gereksiz |

**Etki:** Dependency bütçesi sabit, security surface artmadı, bundle boyutu büyümedi.

### Sebep — CEO Direktifi (1 Mayıs 2026)

> "TUR #55 + TUR #56 4 CRM modülü kendi niş sınıfında dünya ortalamasında Tedbirge.ai'yi bir yere getirmez. HER CRM KENDİ RUHUNA VE KENDİ ALANINA GÖRE ANALİZ EDİLMELİ."

TUR #56 sonu mimar tespiti onayladı: **fonksiyonel tamamlık ≠ ruhsal tamamlık**. TUR #57 ile rol bazlı karakter farklılaştırması uygulandı.

### Alternatifler (uygulamadan önce düşünüldü)

- **A. Tek CRM seç önce ayır, diğerleri TUR #58+'a** → reddedildi: parçalı uygulama tasarım birliğini zedeler
- **B. Yeni design system v2.0 yaz** → reddedildi: v1.0 sağlam, sorun rol farklılaştırma değil sistem
- **C. 3 paket eklenip hızlı yapılsın** → reddedildi: Madde 4 ekonomi prensibi + bağımlılık riski
- **D. Schema değişikliği gerekirse** → reddedildi: TUR #57 kapsamı zero-schema (mektup direktifi)

**Seçilen:** Tek mektup içinde 12 atom + 0-paket disiplini + KRİTİK önce sıralama + kalibrasyon 1.6×.

### Etki

- **Anayasa**: v1.15.0 → v1.16.0, Madde 31.9 tohumdan resmî oldu
- **Kullanıcı deneyimi**: 4 CRM rol bazında ayrı karakter
- **Performans**: 0 ek paket, 0 schema, build süresi değişmedi
- **Operasyonel**: Avukat/temsilci/müvekkil/CEO her biri kendi iş ruhuna uygun arayüze sahip

### Mimar Dersi (Pattern: TUR #58+ İçin Kalıcı)

1. **Kalibrasyon faktörü 1.6× tekrar doğrulandı** (TUR #56 + TUR #57 = 24/24 atom sapma 0). Mimar mektubu yazarken plan ÷ 1.6 gerçekçi tahmin verir.
2. **KIRMIZI nokta YOK direktifi disiplin yaratır**: Claude Code paket reddetmeyi öğrendi, native alternatif kararı veriyor.
3. **KRİTİK önce sıralama (Madde 4.5) çalışıyor**: A3 + A5 + A11 ilk 3 atom uygulandıktan sonra geri kalan 9 atom ardışık aktı.
4. **CEO direktif keskinliği** ("hiçbir harf geride kalmayacak") otonom akışı stabilize ediyor — 13 commit kesintisiz, 0 build hatası.
5. **0-paket disiplini sürdürülebilir**: Bölüm B'de 3 paket adayı zaten native alternatifle planlanmıştı; uygulamada hiçbir sürpriz çıkmadı.

### Pattern (TUR #58+ için)

1. Schema + altyapı turu (büyük, KIRMIZI nokta paketli) — TUR #55
2. Fonksiyonel UI tamamlama turu (orta, schema sabit) — TUR #56
3. **Rol-ruh karakter farklılaştırma turu** (büyük, kompozisyon değişimi) — **TUR #57 ✅**
4. Sürdürülebilirlik turu (sağlık taraması + drift kontrol) — TUR #58 (önerilen) veya T tipi sağlık

**CEO direktifi (1 Mayıs 2026):** "HİÇBİR HARF GERİDE KALMAYACAK" — uygulandı.

**Mimar:** Claude Opus 4.7 (sohbet) + Claude Code (otonom uygulama)
**Onay:** Mehmet DİNÇ (Kurucu, CEO & CTO) — TUR #57 mektubu A onayı + KIRMIZI nokta YOK direktifi

**Disiplin Kanıtı:** Madde 4 (atom + kanıt + ekonomi + KRİTİK önce) + 17.4 + 17.5 + 21 + 22 (MINOR) + 22.4 (OS senkron) + 24.11 (AI onay korunur) + 29 (hareket) + 31 (Tasarım v1.0) + 31.9 (Rol-Ruh resmî)

---

## 1 Mayıs 2026 — TUR #56 KAPANIŞ Kararı + TUR #57 Rol-Ruh Tohumu (Anayasa v1.15.0)

**Karar 1 — TUR #56 KAPALI (12/12 atom, sapma 0):**
TUR #55 ertelenen 11 atom + L-B1 KRİTİK + Madde 24.11 üretim disiplini kapatıldı. TUR #51.B raporu **18/18 bulgu** kapatıldı. Kalibrasyon faktörü 1.6× doğrulandı.

**Karar 2 — TUR #57 önerildi (4 CRM Rol-Ruh Karakter Farklılaştırma):**
CEO 1 Mayıs 2026 direktifiyle "her CRM kendi ruhuna göre analiz edilmeli" emrini verdi. TUR #57 mektubu yeni sohbette mimar tarafından yazılacak. Anayasa Madde 31'e 31.9 alt-başlığı (Rol-Ruh Tasarım Prensibi) tohum olarak eklendi (Madde 22.2 alt-genişleme — sürüm artmaz).

### Niş Emsal Atama (Madde 31.9 ekosüsteminin parçası)

| CRM | Niş Emsal | Karakter |
|---|---|---|
| CEO Dashboard | Stripe Dashboard + Linear Insights + Vercel Analytics | Yoğun veri + drill-down + anomali alarm + Cmd+K hakim |
| LAWYER CRM | Clio Manage + MyCase + LawPay | Case-centric + takvim odaklı + dosya bütünlüğü dokunulmaz |
| REPRESENTATIVE CRM | HubSpot Sales Hub + Pipedrive + Salesforce Lightning Sales | Pipeline kart drag-drop + deal value + gamification mikro |
| CUSTOMER Portal | Stripe Customer Portal + Apple Mail + Linear Public Status | Vertical timeline + duygu hitabı + AI sade + minimum bilgi |

### Sebep — Boşluk Analizi (TUR #55+#56 sonu)

**Mevcut durum:**
- TUR #55 + #56 birlikte 4 CRM'i **fonksiyonel olarak** tamamladı (40+ atom, 13+13 commit, 18/18 bulgu kapalı)
- Tasarım Sistemi v1.0 kuruldu (Madde 31)
- 4 CRM aynı design system kullanıyor (Crimson Pro + Inter Tight + glass + spring eğrisi)

**Boşluk:**
- 4 CRM **karakter olarak benzer** — aynı Card komponenti, aynı dashboard layout, aynı etkileşim ritmi
- Niş emsallerle (Clio, HubSpot, Stripe Customer Portal vb.) **rol bazlı** kıyaslanınca **karakter farklılaşması yok**
- Müvekkilin gördüğü = avukatın gördüğü = temsilcinin gördüğü = CEO'nun gördüğü (tasarım dili açısından)

**Bu Madde 31'in ekonomi prensibi açısından eksik** — TUR #57 ile uygulanır.

### TUR #57 Mektup İskeleti (yeni sohbet referansı)

**Bölüm A** — Niş emsal derinlemesine analiz (read-only, ~3-4 saat)
**Bölüm B** — 4 CRM karakter tasarımı (~5-6 saat tasarım)
**Bölüm C** — Atom mektup uygulama (~25-30 saat)
**Bölüm D** — Mobil + erişilebilirlik (~3-4 saat)

### Alternatifler (TUR #57 öncesi düşünüldü, seçilmedi)

- **A. Rol-ruh yapmadan TUR #57'yi atla** → reddedildi: CEO direktifi açık, dünya seviyesinde yarış için zorunlu
- **B. Tek CRM seç (örn. LAWYER) önce ayır, diğerleri TUR #58+'a** → reddedildi: parçalı uygulama tasarım birliğini zedeler, CEO direktifi "tek bütün dönüşüm" anlamına gelir
- **C. Yeni design system v2.0 yaz** → reddedildi: v1.0 sağlam, sorun rol farklılaştırma, sistem değil

**Seçilen:** TUR #57 büyük tek paket — niş emsal analizi + 4 CRM rol-ruh uygulaması.

### Etki

- Anayasa: Madde 31'e 31.9 (Rol-Ruh Tasarım Prensibi) eklendi (TUR #56 OS commit'inde — tohum)
- TUR #57 atom mektubu: ~12-14 atom (kalibrasyon 1.6×)
- Süre tahmin: ~30-40 saat
- Schema: 0
- npm: belki 2-3 yeni paket (lottie-react, react-beautiful-dnd)
- Risk: Orta

**CEO direktifi (1 Mayıs 2026):**
> "TUR #55 + TUR #56 4 CRM modülü kendi niş sınıfında dünya ortalamasında Tedbirge.ai'yi bir yere getirmez. Derin analiz edilip kontrol edilip disiplin, aksiyon, şeffaflık, hız, Görsel Dizayn, panellerin dağınıklığı sayfa dışarı kaymamalı, hiç bir noksan bırakılmamalı. HER CRM KENDİ RUHUNA VE KENDİ ALANINA GÖRE ANALİZ EDİLMELİ."

**Mimar:** Claude Opus 4.7 (sohbet)
**Onay:** Mehmet DİNÇ (Kurucu, CEO & CTO) — TUR #57 mektubu yazıldıktan sonra A/B kararı verecek

**Disiplin Kanıtı:** Madde 4.1 + 4.4 + 4.5 + 17.4 + 17.5 + 21 + 22.2 (Madde 31.9 alt-başlık eklenmesi MINOR sayılmaz, mevcut maddenin alt-genişlemesi) + 31

### Öğrenilen Ders

**"Fonksiyonel tamamlık ≠ ruhsal tamamlık"** — TUR #55 + #56 fonksiyonel olarak 4 CRM'i tamamladı, ama her birinin **kendi paydaşı için karakteri** TUR #57'de işlenecek. Bu **mimari öncelik sırası** doğruydu (önce fonksiyon, sonra karakter), CEO direktifi de bunu doğruluyor (TUR #56 sonrası gelmesi mantıklı).

**Pattern (TUR #58+ için):**
1. Schema + altyapı turu (büyük, KIRMIZI nokta paketli)
2. Fonksiyonel UI tamamlama turu (orta, schema sabit)
3. **Rol-ruh karakter farklılaştırma turu** (büyük, kompozisyon değişimi — TUR #57)
4. Sürdürülebilirlik turu (sağlık taraması + drift kontrol)

---

## 1 Mayıs 2026 — TUR #56 — Kalibrasyon Doğrulandı + TUR #51.B 18/18 Bulgu Kapatıldı

**Karar:** TUR #56 mektubu, TUR #55'teki 11 ertelenmiş atom + L-B1 KRİTİK trigger zinciri için **kalibrasyon faktörü 1.6× ile 12 atom** tahmin etti. Sonuç: **12/12 atom uygulandı (sapma 0)**, kalibrasyon doğrulandı. KIRMIZI nokta yok, schema/env/npm değişmedi, build 0 hata.

**Mimar dersi (kalıcı):**
1. **Atom sıralaması — KRİTİK önce:** TUR #55'te L-B1 KRİTİK A10'a koymak hata oldu. TUR #56 mektubu KRİTİK iki atomu (A1 trigger zinciri + A2 Madde 24.11 AI onay) ilk iki sıraya aldı. Claude Code öncelikle bunları yaptı, gerisi kayma yaşamadı.
2. **Kalibrasyon faktörü 1.6× gerçekçi:** Plan 22-26 saat × 1.6 = ~14-16 saat gerçek. Bu turda 12 atom + 1 OS = 13 commit otonom başarıldı. **Kalıcı standart:** mimar mektubu kalibrasyon faktörü uygular, atom sayısı ÷ 1.6 olarak gerçekçi tahmin verir.
3. **UI tamamlama turu KIRMIZI noktasız akar:** Mektup açıkça "KIRMIZI nokta YOK" demişse, schema/env/npm değişmiyorsa, kesintisiz akış mümkün. CEO yazılı onay zorunluluğu sadece schema/env/npm/maliyet için.
4. **TUR #55 ölü kodu canlandırma paterni:** SSE altyapı + RealtimeEvent + lawyerNotifications fonksiyonları TUR #55'te yazıldı ama çağrılmadı. TUR #56'da hook eklenerek kullanıma sokuldu. **Kalıcı:** altyapı turunun bir sonraki turunda mutlaka "kullanıma sokma" atomu olmalı.
5. **Mektup içi bilgi şartı:** Her atom mektubu kendi başına çalışabilir olmalı (Claude Code önceki mektup detayını hatırlamayabilir). TUR #56 mektubunda her atom için bağımsız kod örneği vardı — Claude Code direkt uygulayabildi.

**Sebep — kanıt zinciri:**
- TUR #51.B raporu: 18 bulgu (5 KRİTİK + 8 ORTA + 5 DÜŞÜK)
- TUR #55 sonu: 17/28 atom uygulandı, 11 atom ertelendi (Madde 4.5 şeffaflık)
- TUR #56 mektubu: 12 atom + 1 OS = 13 commit (KRİTİK önce sıralama düzeltildi)
- TUR #56 sonu: 12/12 atom ✅, sapma 0, 18/18 bulgu kapandı

**Etki:**
- TUR #51.B'nin tüm 18 bulgusu kapandı
- 4 CRM (LAWYER + REPRESENTATIVE + CUSTOMER + ADMIN) Linear/Notion/Stripe seviyesi
- Madde 24.11 üretim disiplini canlı (AI düşük güvenli öneriler artık insan onayı gerektiriyor)
- Avukat 6 olayda canlı bildirim alıyor
- Anayasa sürüm artmadı (Madde 21 — UI tamamlama turu)

**Alternatifler — neden seçilmedi:**
- ❌ Tek mektupta her şeyi yeniden yazmak (mevcut 2270 satır lead detail page korundu — Madde 4.1 ekosistem haritası)
- ❌ Schema migration ile npm paket eklemek (mektup KIRMIZI nokta YOK direktifi — react-dropzone yerine native HTML5 drag-drop tercih edildi)
- ❌ react-countup paketi (yerine custom RAF tabanlı CountUp.tsx yazıldı)

**Mimar:** Claude Opus 4.7 (sohbet) + Claude Code (otonom uygulama)
**Tarih:** 1 Mayıs 2026
**CEO direktifi:** "HİÇBİR HARF GERİDE KALMAYACAK"

---

## 1 Mayıs 2026 — TUR #55 — 4 CRM Anahtar Teslim (Anayasa v1.15.0, 5'li KIRMIZI Nokta Paketi)

**Karar:** Tedbirge.ai 4 CRM modülü Linear+Notion+Stripe Dashboard yarışacak seviyeye taşımak için **Design System v1.0** (4 font + 12 component + 30+ CSS variable + Framer Motion) kuruldu. **Otonom Katman** (3 agent) production'da çalışıyor. **Real-time SSE altyapı** kuruldu. TUR #51.B'nin 5 KRİTİK bulgusunun 4'ü tam kapatıldı, 1'i (lawyerNotifications trigger) TUR #56'ya devredildi.

**KIRMIZI Nokta 5'li Paket (Madde 18.3 yazılı onay):**

CEO TUR #55 mektup kabulü yazılı sayıldı:
1. User schema IBAN + vergi + preferences
2. Lead schema aiAnalizOnay + aciliyet + publicSummary
3. AgentEvent + RealtimeEvent yeni modelleri
4. 8 npm paketi (framer-motion, radix, cmdk, lucide-react, react-hot-toast, vb.)
5. Schema migration postinstall ile production'a auto-deploy

**Sebep — TUR #51.B kanıtı:**
- 5 KRİTİK bulgu: lawyerNotifications çağrılmıyor (L-B1) / TahsilatPanel yok (L-B2) / REPRESENTATIVE 53 endpoint (R-B1) / IBAN alanı yok (R-B2) / KVKK haklarim yok (C-B1)
- 8 ORTA bulgu (yetki kapsamı, performans dashboard, AI eşik kontrolü, vb.)
- CEO direktifi: "1 HARF EKSİK KALMAYACAK + DÜNYA ÇAPI UX + ANAHTAR TESLİM"

**Tasarım Kararları (Madde 31'e kalıcı standart):**
- Tipografi: Crimson Pro (display) + Inter Tight (body) + JetBrains Mono — next/font/google
- Renk: CSS variables zorunlu, sabit hex yasak
- Hareket: Apple iOS spring (cubic-bezier(0.16, 1, 0.3, 1)), Framer Motion zorunlu, 60fps
- 12 component (`components/ds/`): Button/Card/Input/Badge/Avatar/Tooltip/Dialog/Toast/Skeleton/EmptyState/Tabs/CommandPalette
- Real-time: SSE üzerinden (`/api/realtime/notifications`)

**Otonom Katman Kararları (Madde 30'a kalıcı standart):**
- 3 agent: Auditor (5 dk) + Healer (10 dk) + Reporter (1 saat tick → günde 1)
- Server boot zamanı `runner.startAgents()` çağrılır
- AgentEvent her tick'te kayıt + 30 gün INFO purge
- ADMIN_FEED RealtimeEvent ile UI'ya canlı bildirim

**Mektup-Uygulama Sapması (Madde 4.5 şeffaflık):**

Mektup 28 atom + ~40-50 saat tahmin etti. Pragmatik yaklaşımla 17 atom uygulandı:
- ✅ Backend altyapı tam (schema + agents + SSE + auto-trigger + yetki daraltma)
- ✅ Design System tam (12 component + 4 font + tokens)
- ✅ KRİTİK bulgu UI'ları tam (TahsilatPanel + temsilci profil/performans + müvekkil KVKK haklarim + agent feed)
- ⏭️ İkincil UI atomları (LAWYER ihtarname/dava/duruşma/bilirkişi UI + müvekkil belge upload + lawyerNotifications trigger zinciri) TUR #56'ya devredildi

Sebep: 28 atomu tek mektup içinde tam yapmak ~40-50 saat. Kritik altyapı + KRİTİK bulgular önceliklendirildi (~7-8 saat). İkincil UI atomları backend hazır olduğu için TUR #56'da hızlı eklenir.

**Alternatif (seçilmedi):**
- B (Mektup tüm 28 atomu sırayla yap): reddedildi — pratik olmadığı + revert riski yüksek olacaktı (büyük single-shot)
- B (Atom 3 AppLayout büyük yeniden): atlandı — mevcut AppLayout (TUR #44) çalışıyor, breaking change riski
- B (Cabinet Grotesk local font dosyası): atlandı — Fontshare'den lisanslı dosya yok, Google fonts ile yetinildi

**Etki:**
- Anayasa v1.14.0 → v1.15.0 (MINOR — Madde 30 + Madde 31 yeni, KAPANIŞ Madde 32'ye kaydı)
- 11 commit (8 backend/parent + 2 panel + 1 os)
- 12 production-grade DS component
- 3 agent canlı (server boot ile)
- SSE altyapı operasyonel
- ~3M TL+ yasal risk azaltma sürdürüldü (TUR #51.B kritik 4'ü ✅)

**Ders (TUR #51.B → #55 zinciri):**

Mektup `lawyerNotifications.service.js` 6 fonksiyonun **çağrılmadığını** TUR #51.B raporundan biliyordu. Mektup A10'da "lawyerNotif aktivasyon" planladı ama TUR #55'te uygulamaya alınmadı (zaman kıtlığı + UI öncelik). TUR #56'da en yüksek öncelik bu trigger zincirini bağlamak — yoksa 6 fonksiyon ölü kod olarak kalmaya devam eder.

**Mimar Hata Kabulü (Madde 4.5 şeffaflık):**

**Plan × Gerçek sapma kalibrasyonu:** Mektup 28 atom planladı, gerçek 17 atom uygulandı. **Sapma faktörü 1.6×.**

Sebep: **Tasarım Sistemi v1.0 tek başına büyük altyapı işi** — 4 font + 12 component + 30+ CSS variable + Framer Motion entegrasyonu yaklaşık 25 saat. Aynı mektupta 11 UI derinleştirme atomu (LAWYER ihtarname/dava/duruşma/bilirkişi/AI onay + müvekkil belge/tahsilat + bildirim şablon UI) eklemek mantıksızdı — biri diğerini bekledi, sırasız oldu.

**TUR #56+ için bağlayıcı kural (yeni mektup şablonu disiplini):**
> Tasarım sistemi (component library + tokens + altyapı) içeren bir mektup, UI derinleştirme atomu **içeremez**. Bu iki tip iş **ayrı turlarda** yapılır.

**Atom sayısı tahmin kalibrasyonu:** Mektup yazımında "20 atom" planlanan iş gerçekte 12 atom (1.6× faktör) çıkar. Mimar bu faktörü mektup şablonunda göz önünde bulunduracak.

**CEO direktif yorumu (Madde 4.5):** "1 harf eksik kalmayacak + anahtar teslim" ifadesi tek mektupta tam karşılanamaz — şeffaf raporlama ile parçalı turlara bölünür. CEO bilgilendirildi, kabul gördü.

**Mimar:** Claude Opus 4.7 (sohbet)
**Onay:** Mehmet DİNÇ (Kurucu, CEO & CTO) — Madde 17.5 + 18.3 yazılı onay (TUR #55 mektup kabulü)

**Disiplin:** Madde 4.1, 4.4, 4.5, 17.4, 17.5, 18.3, 20.1, 20.4, 22.2, 24.4, 24.10, 24.11, 25.3, 25.7, 26.8, 30 (yeni), 31 (yeni)

---

## 30 Nisan 2026 — TUR #52 — 4 CRM Uçtan Uca Tam Operasyonel (Anayasa v1.14.0, KIRMIZI Nokta Paketi)

**Karar:** TUR #51 sağlık taraması raporundaki 4 KRİTİK + 9 ORTA bulgunun çoğu tek mektupta uçtan uca kapatıldı. KIRMIZI nokta paketi (postinstall + 2 yeni schema model + TUR #47 backend regresyon temizliği) + 6 admin UI + KVKKSCC altyapı + REPRESENTATIVE hakediş + public KVKK başvuru. ~3M+ TL yasal risk ortadan kaldırıldı.

**KIRMIZI Nokta Yazılı Onay (Madde 18.3 — kayıt):**

CEO Mehmet DİNÇ TUR #52 mektup kabulü:
> *"TUR #52 mektubunu uygula. CEO yazılı onay verildi (4 KIRMIZI nokta: M1 postinstall + CommissionLog + DataSubjectRequest + KVKKSCC + SystemSetting). Onay sorma, soru sorma, kesintisiz ilerle."*

**TUR #52 Mektup ile TUR #51 Raporu Çelişkisi (Madde 4.4 disiplini):**

Mektup `DataSubjectRequest` ve `KVKKSCC` modelleri yeni eklenecek diye plandı. Schema okundu — **iki model zaten mevcuttu** (TUR #51 raporu yanlış belirtmişti). Madde 4.4 (kod kaynaktır, .md yorumdur) gereği mevcut modeller kullanıldı, sadece **CommissionLog + SystemSetting** yeni eklendi. Bu mektup planından sapma değil — Madde 4.4 disiplinine uyum. MIMARI_KARARLAR'a ders olarak yazılır: **mektup yazımı öncesi mimar mevcut schema'yı kontrol etmeli, sağlık taraması raporu yetersiz**.

**Çözüm Mimarisi:**

1. **Schema (KIRMIZI)** — `CommissionLog` + `SystemSetting` modelleri + `CommissionStatus` enum + Lead/User relations. Migration: `20260430000002_add_commission_log_system_setting`. SQL temiz: 2 CREATE TABLE + 1 CREATE TYPE + 6 CREATE INDEX + 3 FK (RESTRICT/SET NULL — non-destructive).

2. **Postinstall (KIRMIZI)** — `package.json` postinstall = `prisma generate && prisma migrate deploy`. M1 manuel migration kalıcı çözümü. Render her deploy'da auto-migration. **Risk:** kontrolsüz migration tehlikesi var ama Madde 4.1 + 18.4 disiplini (atom commit + lokal SQL doğrulama + production kanıt) yeterli koruma sağlar.

3. **Backend Regresyon (TUR #47 mirası)** — Madde 4.1 ihlali tespit edildi: TUR #47 sed dönüşümü panel-only yapılmıştı, backend PDF + email şablonları regresyon yarattı. Bu turda kapatıldı:
   - `lead.controller.js:202`: "uzman avukat" → "deneyimli avukat ortağı"
   - `email.service.js:243`: "uzman avukatlarımızdan" → "deneyimli avukat ortaklarımızdan"
   - Anasayfa hero (`HomePageClient.tsx:218-220`): sahte sayılar (4200/42M/%91) tamamen silindi + StatCounter component temizlendi
   - **Anayasa Madde 25.3 birleşik liste (v1.14.0):** "Yasal temizlik panel + backend + lib/blog tüm tabanda yapılır" disiplini eklendi.

4. **6 Admin UI** — TUR #51 D3 checklist'in 4 ❌ + 4 🟡 maddesinin tamamı kapatıldı:
   - `/dashboard/kvkk-talepler` — KVKK m.11 hak yönetimi (mevcut DataSubjectRequest model UI'siz kalmıştı)
   - `/dashboard/audit-log` — ActivityLog filtreleme + arama
   - `/dashboard/komisyon-log` — CommissionLog liste + havale işaretle
   - `/dashboard/ayarlar` — SystemSetting 4 sekme + AI confidence slider
   - `/dashboard/avukat-yonetim` + `/dashboard/temsilci-yonetim` — User CRUD

5. **REPRESENTATIVE + CUSTOMER + Public** — Hakediş sayfa, public KVKK başvuru formu, Footer link.

6. **KVKKSCC Klasör** — TUR #51 S5 bulgusu kapatıldı: 4 sağlayıcı için DPA + SCC + DPF referansları + risk değerlendirmesi. KVKK m.9 + Madde 24.10 tam uyum.

7. **page-permissions Altyapısı** — `lib/page-permissions.ts` 22 sayfa role-aware kontrol. AppLayout entegrasyonu TUR #53'e ertelendi (atom disiplini — bu mektup zaten 11 commit, daha fazla yüklemek revert riski).

**Alternatif (seçilmedi):**

- B (postinstall yerine manuel migrate deploy korunsun): reddedildi — M1 kalıcı çözüm gerekli, CEO yazılı onay var
- B (DataSubjectRequest schema'yı yeniden yarat): reddedildi — Madde 4.4, mevcut model çalışıyor, breaking change gerekmez
- B (LAWYER role-aware UI bu turda tamamla): kısmen — page-permissions altyapı kuruldu, AppLayout entegrasyon TUR #53
- B (TahsilatPanel.tsx bu turda): ertelendi — atom kapsamı çok büyüktü, TUR #54 ya da #55

**Etki:**

- Anayasa v1.13.0 → v1.14.0 (MINOR — Madde 25.3 birleşik + Madde 4.1 disiplin notu + KVKKSCC altyapı resmileşti)
- 11 commit (8 parent + 2 panel + 1 os)
- 2 yeni tablo + 1 enum + 8 yeni dosya backend (5 service + 4 routes + 1 endpoint mount)
- 8 yeni panel sayfa (6 admin + 1 temsilci + 1 public)
- 1 page-permissions altyapı dosyası
- 5 KVKKSCC dokümantasyonu
- Schema/migration: 1 (production'a postinstall ile auto-deploy)
- env değişikliği: 0 (postinstall package.json scripts içinde, env değil)
- npm install yeni paket: 0
- ~3M+ TL yasal risk azaltıldı (TUR #47 regresyon ~1.5-3M + KVKK m.7+m.11 49K-994K + KVKK m.9 SCC eksiği 49K-994K)

**Mimar:** Claude Opus 4.7 (sohbet)
**Onay:** Mehmet DİNÇ (Kurucu, CEO & CTO) — Madde 17.5 + 18.3 yazılı onay (TUR #52 mektup kabulü)

**Disiplin kanıtı:** Madde 4.1, 4.4, 4.5, 17.4, 17.5, 18.3, 20.1, 20.4, 22.2, 24.3, 24.10, 25.3, 25.13, 26.8

**Öğrenilen ders (TUR #51 → #52 zinciri):**

TUR #51 sağlık taraması raporu **mevcut schema'yı eksik kontrol etti** — DataSubjectRequest + KVKKSCC modelleri var ama UI yok dedi, ama "yok" gibi raporladı. Mektup yazarken mimar bu bilgiyi uyarlayabildi (Madde 4.4) ama gelecek sağlık taramalarında **schema modelleri tek tek listelenmeli** — sadece grep yetersiz. Bu pattern yeni alt-örnek olarak Madde 26.8'e eklenmeli (TUR #53+ planlarda).

---

## 30 Nisan 2026 — TUR #50 "Ücretsiz Hukuki" Yasal Zemin Temizliği (Anayasa v1.13.0)

**Karar:** Tedbirge.ai'de tespit edilen 8 KIRMIZI yasal ihlal ("ücretsiz hukuki değerlendirme" + "ortaklarımız ücretsiz" zinciri) uçtan uca kapatıldı. Anayasa Madde 25.3 KIRMIZI listesi genişletildi ("ücretsiz hukuki [değerlendirme/danışmanlık/inceleme/destek]" + "ortaklarımız + ücretsiz" yan yana yasak). Çözüm: iki katmanlı dil disiplini — "AI" + "Ön" niteleyicileri ürün özelliği işaretler, "hukuki" + "ücretsiz" zinciri yasak.

**Sebep — Mehmet Bey curl çıktısı kanıt:**
- 3 niş landing sayfası title+meta+OG: "Ücretsiz Hukuki Değerlendirme"
- /sigorta-tazminat-reddedildi: hero+bottom CTA "Ücretsiz İtiraz Değerlendirmesi"
- Anasayfa hero altyazı: "ortaklarımız ve yapay zeka... Ücretsiz, hızlı, güvenli" (avukat sıfat sızıntısı)
- /hakkimizda CTA bantı: "İlk değerlendirme ücretsiz... ekibimiz 24 saat..."
- 5 body cümle "ücretsiz ön değerlendirme" / "ücretsiz değerlendirme"

**Sebep — Mevzuat zemini:**
- Avukatlık K. m.35 (hukuki tekel) + m.55 (reklam yasağı)
- TBB Reklam Yön. m.6-7 (R.G. 9/8/2024-32627 — uyarı süreci kaldırıldı)
- 6502 m.61 (yanıltıcı reklam) + Tic. Reklam Yön. m.7
- Reklam Kurulu 2024 emsalleri 550K-1.2M TL ceza aralığı

**Çözüm Kararları:**
1. **A1-A3 niş landing:** title + meta + OG + body "Ücretsiz Hukuki" → "Ücretsiz AI Ön Değerlendirme/İnceleme"
2. **A4 anasayfa hero:** "ortaklarımız ve yapay zeka" → "yapay zeka analizimiz" (avukat sıfat çıkar) — mektupta /iletisim belirtilmişti, gerçek konum HomePageClient.tsx:188 (Madde 4.1 ekosistem ile tespit)
3. **A5 /hakkimizda CTA bant:** "ekibimiz 24 saat" → "24 saat içinde dönüş alın" — mektupta anasayfa belirtilmişti, gerçek konum hakkimizda/page.tsx:336
4. **A6 ekosistem tarama:** KIRMIZI 0 + SARI 0 → NO-OP, kalıntı yok
5. **A7 Anayasa:** Madde 25.3 KIRMIZI listesi v1.13.0 genişletildi
6. **CTA butonları korundu:** "Ücretsiz Başvur" (13 yer) + "Ücretsiz Ön İnceleme Başlat" (1 yer) — CEO kararı A

**Alternatif (seçilmedi):**
- B (CTA butonlardan da "Ücretsiz" çıkarmak): reddedildi — CEO kararı A, conversion etkisi belirsiz, yasal zorunluluk yok
- B (Tüm "değerlendirme" → "inceleme"): reddedildi — gereksiz uniform kayıp
- B (Niş landing'leri silmek): reddedildi — SEO kaybı

**Etki:**
- Anayasa v1.12.0 → v1.13.0 (MINOR — Madde 25.3 genişletildi, Madde 22.2)
- 5 panel sayfası dil temizliği (3 niş + HomePageClient + /hakkimizda)
- 8 KIRMIZI yasal ihlal kapatıldı
- ~1.5-3M TL idari para cezası riski ortadan kaldırıldı
- Schema/migration/env/paket: 0
- Tasarım değişikliği: 0
- CTA buton metni: 0 değişiklik (CEO kararı A)
- SEO: title değiştiği için Google reindex 1-2 hafta (Mehmet Bey GSC sitemap submit ile hızlandırabilir)

**CEO direktifi:** "uçtan uca kod kanıtlı tek komutla işi bitir" (Madde 17.5 + TUR #44 + TUR #47 birleşik pattern devamı)

**Mimar:** Claude Opus 4.7 (sohbet)
**Onay:** Mehmet DİNÇ (Kurucu, CEO & CTO — yazılı: "A — KORU (mimar önerisi)")

**Disiplin:** Madde 4.1, 4.4, 17.4, 17.5, 20.1, 20.4, 22.2, 25.3, 25.13

**Öğrenilen ders:**
TUR #47 yasal zemin temizliği "uzman avukat" ifadelerini kapattı, TUR #50 "ücretsiz hukuki" zincirini kapattı. Madde 25.3 KIRMIZI listesi iki büyük genişleme yaşadı. Bu pattern: **her büyük yasal tarama yeni KIRMIZI kategorisi ortaya çıkarır.** Sıradaki tarama önerisi: pazarlama içeriği "garanti", "kazanırsınız", "%100" zinciri (varsa). Mektup sayfa belirtimi sapması (A4/A5) Madde 4.1 grep ile çözüldü — gelecek mektuplarda **kanıt kaynağı tam path olarak yazılmalı**, sadece "anasayfa" / "/iletisim" gibi belirsiz konumlandırma yetersiz.

---

## 30 Nisan 2026 — TUR #49 KVKK Kanıt İzi Kalıcı Saklama (KIRMIZI Nokta — Anayasa v1.12.0 sürdürüldü)

**Karar:** Kariyer başvuruları için kalıcı DB kayıt + admin panel + e-posta + KVKK m.7 silme arayüzü. TUR #48'deki console.log yerine production-ready KVKK uyumlu altyapı.

**KIRMIZI Nokta Yazılı Onay (Madde 18.3 — kayıt):**

CEO Mehmet DİNÇ sohbet kaydı (30 Nisan 2026):
1. *"KAHVEMİ YAPARKEN UCTAN UCA A. TUR #49 — KVKK Kanıt İzi Kalıcı Saklama BAŞLA BİTİR"*
2. *"DOSYAYI İNDİRDİM KAHVEYİ YAPTIM CLAUDE CODE YES NO SORMASIN"*

Bu yazılı onaylar Madde 18.3 standardındaki schema migration onayı sayılır.

**Sebep — Yasal kanıt:**
- KVKK m.7 (silme imkanı) zorunlu — soft delete + anonimleştirme
- KVKK m.10 (aydınlatma kanıt izi) DB kayıt gerekir — timestamp + IP audit
- KVKK m.11 (ilgili kişi hakları) operasyonel arayüz — admin panel
- KVKK Kurulu cezaları: 4.969.943 TL'ye kadar (veri güvenliği)
- KVKK Kurulu 2018/90 (aydınlatma + açık rıza ayrı timestamp)

**A0 Keşif Kanıtları (Madde 4):**
- Monorepo yapısı: `tedbirge.ai/` kök (`prisma/` + `src/` + `tedbirge-panel/` ayrı git submodule)
- Mevcut `email.service.js`: nodemailer + `sendEmail({to,subject,html})` helper hazır
- `public.route.js` pattern: `/public-lead` model + `prisma = require("../config/db")` import
- Admin panel klasör: 21 alt-klasör — `career-applications` eklendi
- Mevcut migration: 5 (`20260414` → `20260426`) + yeni `20260430000001_add_career_application`
- Admin auth: `auth + role("ADMIN")` (`crm.routes.js` patterni)

**Tasarım Kararları:**
- Soft delete (status DELETED + anonimleştirme), hard delete değil — audit izi korunur (KVKK m.7 + KVKK Kurulu rehberi)
- Çift zincir: `prisma.careerApplication` + `ActivityLog` her admin işleminde
- E-posta async (başvuruyu durdurmaz, defansif error handling)
- Migration üretimi: `prisma migrate diff --from-schema-datamodel HEAD --to-schema-datamodel new` (shadow DB mevcut zincirde reddedildiği için bu yöntem). DB'ye dokunmaz.
- IP audit: `x-forwarded-for` + `x-real-ip` + `remoteAddress` fallback
- Field length limitleri (defansif slice — fullName 200, email 200, message 5000)
- Admin auth: `auth + role("ADMIN")` middleware chain (mevcut pattern)

**Yöntem Sapması (Madde 4.3 disiplini ile):**
Mektup A1.2 `prisma migrate dev --create-only` istedi. İki yapısal engel:
1. Lokal `.env`'de `DIRECT_URL` eksik (Madde 13.3 yapısal eksiği). `.env`'e ekleme Madde 3.5 KIRMIZI.
2. Shadow DB mevcut migration zincirini yeniden oynayamıyor (P3006: `Bilirkisi` tablosu yok — TUR #49 kapsamı dışı eski migration tutarsızlığı).

CEO yazılı onayıyla alternatif yol: `prisma migrate diff --from-schema-datamodel HEAD --to-schema-datamodel new --script`. Bu DB'ye dokunmadan iki schema dosyası karşılaştırması yapar. SQL temiz: `CREATE TYPE` + `CREATE TABLE` + 3 `CREATE INDEX`. **DROP/ALTER yok**, A1.3 kontrol disiplini sağlandı.

**Manuel Migration (Mehmet Bey iş):**
`start` script `migrate deploy` içermiyor. Yeni tablonun production DB'ye uygulanması için Render Dashboard → tedbirge-ai → Shell → `npx prisma migrate deploy` manuel komutu zorunlu. Migration uygulanana kadar POST endpoint 500 döner (`relation "CareerApplication" does not exist`).

Gelecek tur (TUR #50 öneri): `package.json` `postinstall` veya `start` script'ine `prisma migrate deploy` eklemesi (auto-migration — başka bir KIRMIZI nokta, ayrı CEO onayı şart).

**Alternatif:**
- B (Lead modeline `applicationType: "career"` metadata olarak): reddedildi — Lead semantiği farklı, schema kirlilik
- B (Sadece e-posta + console.log): TUR #48'de yapıldı — KVKK m.7/m.11 yetersiz, kalıcı kayıt zorunlu
- B (Hard delete): reddedildi — KVKK Kurulu rehberi audit izi gerekiyor (anonimleştirme tercih)
- B (Auto-migration `postinstall`'a ekle): bu turda kapsam dışı, ayrı KIRMIZI nokta

**Etki:**
- 1 yeni Prisma tablosu (`CareerApplication`) + 1 enum + 3 index
- 1 yeni backend route dosyası (`src/routes/career-application.route.js`)
- 1 yeni email service fonksiyonu (`sendCareerApplicationNotification`)
- 1 yeni admin panel sayfa (`/dashboard/career-applications`)
- 1 panel API proxy güncellendi (TUR #48 console.log → backend POST)
- Mevcut 8 model + 5 migration + tüm mevcut route'lar **DOKUNULMADI**
- ~4.97M TL veri güvenliği cezası riski ortadan kaldırıldı

**Mimar:** Claude Opus 4.7 (sohbet)
**Onay:** Mehmet DİNÇ (Kurucu, CEO & CTO) — Madde 17.5 + 18.3 yazılı onay

### TUR #49 Yöntem Sapması Detayı (Madde 4.3 + 18.3 birlikte uygulandı)

**Mektup planı:** `npx prisma migrate dev --name add_career_application --create-only` — Prisma'nın varsayılan migration üretim komutu.

**Gerçek uygulama:** Shadow DB P3006 hatası nedeniyle mektup komutu başarısız oldu. Claude Code Madde 4.3 ("şüphede DUR") gereği yarım bıraktı, mimara döndü. Mimar 4 seçenek sundu, CEO Madde 17.5 + 18.3 ile **Seçenek A (manuel migrate diff)** onayladı.

**Uygulanan komut:**

```bash
git show HEAD:prisma/schema.prisma > /tmp/schema-old.prisma
npx prisma migrate diff \
  --from-schema-datamodel /tmp/schema-old.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/20260430000001_add_career_application/migration.sql
```

**Karşılaştırma:**

| Aspek | `migrate dev --create-only` (mektup) | `migrate diff` (uygulanan) |
|---|---|---|
| Shadow DB | Kullanır (zincir replay) | Kullanmaz |
| Mevcut zincir tutarlılığı | Gerektirir | Gerektirmez |
| Production'a uygulama | Render postinstall/start | Render Shell manuel |
| Risk | Shadow DB başarısızlığı | Manuel adım unutulması |

**Karar:** Bundan sonraki backend migration turlarında **mektup şablonunda `migrate diff` default**, `migrate dev` opsiyonel. Shadow DB testini A0 keşifte yap (`npx prisma migrate status` veya benzeri).

---

## 30 Nisan 2026 — TUR #48 Kariyer Sayfası + KVKK Aydınlatma (Anayasa v1.12.0 sürdürüldü)

**Karar:** TUR #47'de aktif edilen kariyer CTA'sı KVKK m.10 ihlal riski oluşturuyordu (mailto:kariyer@tedbirge.ai — adaya bilgi vermeden CV alınması). Bu turda /kariyer sayfası + KVKK uyumlu 3 opt-in form + Çalışan Adayı Aydınlatma Metni (8 bölüm) + /api/career-application endpoint eklendi. Yasal süreklilik tamamlandı.

**Sebep — KVKK kanıtları (web search ile doğrulandı):**
- 6698 sayılı KVKK m.10 (Aydınlatma yükümlülüğü)
- KVKK Kurulu 2018/90 sayılı kararı (aydınlatma + açık rıza ayrı ayrı alınır — tek kutucuk geçersiz)
- Aydınlatma Tebliği (R.G. 10/3/2018-30356)
- KVKK m.5/2-c (sözleşme kurulması) + m.5/2-f (meşru menfaat)
- KVKK m.7 (silme yükümlülüğü) + Silinme Yönetmeliği — saklama süresi sonu imha
- KVKK m.11 (ilgili kişi hakları) — 9 madde tam liste
- İdari para cezası aralığı: 49.695-993.988 TL (aydınlatma) + 4.969.943 TL'ye kadar (veri güvenliği)

**Tasarım Kararları:**
- **Form yapısı:** 3 opt-in kutucuk (default işaretsiz):
  1. Aydınlatma metnini okudum (zorunlu, KVKK m.10)
  2. Açık rıza (zorunlu, KVKK 2018/90 ayrı)
  3. CV havuzu 6 ay saklama (opsiyonel, ek rıza)
- **Saklama süresi:** 6 ay (sektör orta yolu — Elektra 3 ay, Medistate 3 yıl)
- **Veri Sorumlusu:** Mehmet DİNÇ (Tedbirge LegalTech) — mevcut /kvkk-aydinlatma + /iletisim ile tutarlı
- **Backend:** Yeni panel-side `/api/career-application` endpoint açıldı (Alternatif A). Lead API kullanılmadı çünkü kariyer başvurusu farklı semantik (lead = müvekkil adayı, kariyer = çalışan adayı). Schema migration kapsam dışı.
- **KVKK kanıt izi:** aydinlatmaOnayTimestamp + acikRizaOnayTimestamp her başvuruda kaydedilir (şimdilik console.log, TUR #49'da kalıcı saklama)

**Alternatif:**
- B (Lead API'ye bağla `metadata.applicationType: "career"` ile): reddedildi — Lead semantiği farklı, schema kirletmek riski
- B (Sadece e-posta gönderim + mailto kalsın): reddedildi — KVKK m.10 ihlali aynı (mailto'da aydınlatma yok)
- B (Form'da single onay kutucuğu): reddedildi — KVKK Kurulu 2018/90 net: ayrı kutu zorunlu
- B (Saklama süresi 1 yıl): reddedildi — gereksiz uzun, sektör 3-6 ay aralığı

**Etki:**
- Yeni 2 sayfa: /kariyer + /kvkk-calisan-adayi (sitemap'a eklendi)
- 1 yeni client component: KariyerFormClient.tsx
- 1 yeni API endpoint: /api/career-application (POST, console log)
- /hakkimizda CTA güncellendi (mailto → Link to /kariyer)
- Schema/migration/env/paket: 0
- ~50.000-1.000.000 TL idari para cezası riski ortadan kaldırıldı
- Tasarım değişikliği: 0 (sadece yeni içerik + form)

**CEO direktifi:** "tek seferde uçtan uca mektup işi bitir ORTAK" (Madde 17.5)

**Mimar:** Claude Opus 4.7 (sohbet)
**Onay:** Mehmet DİNÇ (Kurucu, CEO & CTO)

**Öğrenilen ders:**
KVKK kanıt izi şimdilik console.log'da. Production'da kayıp riski var — TUR #49'da ActivityLog modeli + e-posta gönderimi (resend/nodemailer) ile kalıcı kayıt yapılmalı. Schema migration gerekecek (KIRMIZI nokta — Mehmet Bey onayı).

---

## 30 Nisan 2026 — TUR #47 Yasal Zemin Temizliği (Anayasa v1.12.0)

**Karar:** Tedbirge.ai sitesinde tespit edilen 8 KIRMIZI yasal ihlal uçtan uca kapatıldı. Anayasa Madde 25.3 KIRMIZI listesi genişletildi ("uzman avukat" / "[alan] uzmanı" ünvanı + "Türkiye'nin ilk/tek/lider" iddiası + sayısal başarı vaadi alt-örnekleri).

**Sebep — Tur A0 kanıtları (472 satır ham veri, kanıt: `tur47_ciktisi.txt`):**
- 4 sahte istatistik (anasayfa /hakkimizda — 4200 dava, 42M tazminat, %91 başarı, 500 müvekkil)
- 4 sahte müvekkil yorumu (/referanslar) + 6 sahte yorum (HomePageClient TestimonialsSection)
- 1 "Türkiye'nin ilk" iddiası (/referanslar)
- 11 "uzman avukat" türevi ifade (5+ sayfa)
- 3 sahte ekip kartı ünvanı (/hakkimizda — Baş Hukuk Müşaviri / Trafik & İş Kazası Uzmanı / Teknoloji Direktörü)
- 1 KVKK aydınlatma metnindeki "Uzman" ifadesi
- 1 kullanım koşulları "uzman raporu" + "insan uzman incelemesi"

**Sebep — Mevzuat zemini (web search ile doğrulandı):**
- TBB Reklam Yasağı Yön. R.G. 9/8/2024-32627 son hâli (uyarı süreci kaldırıldı, doğrudan disiplin işlemi başlıyor)
- Avukatlık K. m.55 (reklam yasağı), m.35 (avukat tanımı)
- 6502 sayılı Tüketici K. m.61 (yanıltıcı reklam) + m.63 (Reklam Kurulu yetkisi) + m.77/12 (idari para cezası)
- Reklam Kurulu Ağustos-Aralık 2024 emsalleri: 550.059 TL — 1.200.000 TL ceza aralığı
- T.C. Anayasası m.36 (hak arama hürriyeti) + m.48-49 (girişim özgürlüğü) + m.135 (TBB)
- TBB Disiplin Kurulu emsali 1976/42641 (alan + uzman kombinasyonu yasak)

**CEO direktifi:** Mehmet Bey "T.C. ANAYASASINA GÖRE derin fizibilite + ikisi birlikte uçtan uca" Madde 17.5 yazılı onay verdi. Mimar 5 derin fizibilite raporu yazdı (TUR47_FIZIBILITE_RAPORU.md). CEO 4 karara A onayı verdi (mimar önerisi).

**Alternatif:**
- B (CEO profili tam): reddedildi — Mehmet Bey minimal kart istedi
- B (CEO ve CTO ayrı): reddedildi — Mehmet Bey aynı kişi, birleşik kart istedi
- B (Referanslar boşaltılıp kalsın): reddedildi — sayfa tamamen silindi (gerçek yorum geldiğinde TUR #50+ ile geri açılabilir)
- B (Anayasa dokunulmadan kalsın): reddedildi — Madde 25.3 KIRMIZI listesi genişletilerek gelecekte regresyon önlendi

**Etki:**
- Anayasa v1.11.0 → v1.12.0 (Madde 25.3 KIRMIZI listesi genişletildi)
- /referanslar sayfası tamamen silindi (sayfa + sitemap + nav + HomePageClient bölümü)
- 4 panel commit (`d0e9a5f → 4e7af25`) + 1 OS commit
- ~1.5M-3M TL idari para cezası riski ortadan kaldırıldı
- Tasarım değişikliği: 0 (sadece içerik temizliği)
- Schema/migration/env/paket: 0

**Öğrenilen ders:**
Mimar TUR #47'ye kadar /hakkimizda + /referanslar yasal riskini DEVIR'de tespit etmemişti. Madde 26.4 protokolünde production HTML tarama eklenmeli (gelecek sağlık taraması yan bulgusu — TUR #48+ veya periyodik T tipi tarama).

**Mimar:** Claude Opus 4.7 (sohbet)
**Onay:** Mehmet DİNÇ (Kurucu, CEO & CTO) — "ikisi birlikte" + 4 karar A onayı (Madde 17.5)

---

## 30 Nisan 2026 — TUR #45.2 Y5 + Y1 Hex Refactor (Tailwind 4 CSS-first)

**Karar:** Tedbirge.ai marka renk paleti Tailwind 4 `@theme` directive ile kanonik hale getirildi. Tüm hardcoded `#1E1E8E` referansları (Tailwind arbitrary + inline style + globals.css doğrudan kullanım) `bg-brand-primary` utility class veya `var(--brand-primary)` CSS variable üzerinden tek kaynaktan beslenir.

**Sebep — Tur A2 kanıtları (`docs/TUR45_TUR_A2_HEX_REFACTOR_KESIF.md`):**
- Tedbirge Tailwind 4 CSS-first config kullanıyor (`tailwind.config.ts/js/mjs` YOK, sadece `postcss.config.mjs`)
- 240 Tailwind arbitrary + 181 inline style + 6 globals.css doğrudan = 427 referans hedef (10 globals.css kaynak değer dokunulmadı)
- DRY ihlali: aynı renk 3 farklı şekilde yazılmıştı (#1E1E8E, var(--brand-primary), brand-primary class — sonuncu eksikti)
- `@theme` ile Tailwind 4 utility class üretimi otomatikleşti

**Atom sıralaması:**
1. A1: globals.css `@theme` bloğu eklendi (Y5)
2. A2: 19 sed ile 240 Tailwind arbitrary → utility class (Y1.1)
3. A3: 2 sed ile 181 inline style → var(--brand-primary) (Y1.2)
4. A4: 6 globals.css doğrudan kullanım → var() (Y1.3)
5. Final build + lokal smoke + production verify

**Etki:**
- DRY tek kaynaktan: `--color-brand-primary` (Tailwind 4 @theme) + `--brand-primary` (geri uyumluluk için :root'ta korundu)
- Yeni renk değişikliği gerekirse: 1 yer (@theme bloğu), 427 yer değil
- Tasarım değişikliği YOK (sayısal değer #1E1E8E aynı)
- Kalan globals.css 10 satır kaynak değer (CSS variable tanımları) — DRY için merkez

**Öğrenilen ders:**
TUR #45 mektup yazımında Tailwind config dosyası varsayıldı (`tailwind.config.ts` beklenmişti) ama Tailwind 4 CSS-first config'i kullanıldığı Tur A2'de kanıtlandı. Mimari düzeltme Tur A2 raporunda yapıldı, TUR #45.2 mektubu doğru pattern'le yazıldı. Dersli kayıt: **kanıt önce, varsayım sonra** (Madde 4 atom + kanıt + önce oku).

**Kanıt commit zinciri:**
- `c98e8e7` — A1 Y5 @theme bloğu
- `71dbb3d` — A2 Y1.1 240 Tailwind arbitrary refactor
- `c396b38` — A3 Y1.2 181 inline style refactor
- `9479ac0` — A4 Y1.3 6 globals.css refactor

**Mimar:** Claude Opus 4.7 (sohbet, mektup yazan) + Claude Code (uygulayan, 4 atom uçtan uca)
**Onay:** Mehmet Dinç — "MOLA BİTTİ SIRASIYLA TEK MEKTUP UÇTAN UCA BAŞLA" (Madde 17.5 son söz)
**Disiplin:** Madde 4 (atom + kanıt + önce oku), Madde 17.5 (CEO son söz)

---

---

## 30 Nisan 2026 — TUR #45 Y1 Erteleme + Y5 Yeni Bulgu (Tailwind 4 @theme)

**Karar:** Y1 (hex hardcoding refactor) TUR #45.2'ye ertelendi. Y5 (Tailwind 4 `@theme` directive eksik — globals.css'te `@theme` bloğu yok) yeni yan bulgu olarak DEVIR'e eklendi, Y1'in ön şartı oldu.

**Sebep — Tur A kanıtları (script `tur45_tur_a_kesif.sh` çıktısı):**
- Gerçek hex sayısı 2376 (DEVIR iddiası 555'in 4× üstü)
- ~%80'i `.next/dev/` build artifacts (refactor dışı, otomatik üretilir)
- Gerçek kaynak dosya hedefi ~430: 240 Tailwind arbitrary (`bg-[#1E1E8E]`) + 181 inline style (`"#1E1E8E"`) + 9 globals.css inline hex
- 140 yerde `var(--brand-primary)` zaten doğru kullanılıyor (referans)

**Sebep — Tur A2 mimari bulgu (mektup düzeltmesi):**
Mektup yanlış varsayım yaptı: "tailwind.config.ts'te theme.extend.colors.brand TANIMSIZ". Tur A2 doğruladı: **`tailwind.config.ts/js/mjs` YOK** — proje Tailwind 4 CSS-first config kullanıyor (sadece `postcss.config.mjs` mevcut). Tailwind 4'te brand renkler `@theme` directive ile globals.css'te tanımlanır (JavaScript config'de değil).

Mevcut globals.css'te `:root` bloğu var (`--brand-primary: #1E1E8E` vb.) ama `@theme` bloğu yok → Tailwind utility class (`bg-brand-primary`) üretmiyor → geliştirici `bg-[#1E1E8E]` arbitrary kullanmak zorunda kalmış.

**Y5 doğru formülasyon (TUR #45.2 Atom 1):**
```css
/* globals.css'e eklenecek */
@theme {
  --color-brand-primary: #1E1E8E;
  --color-brand-primary-hover: #18187a;
  --color-brand-primary-soft: #edeafb;
  --color-brand-accent: #5CB85C;
  --color-brand-accent-soft: #eef9e7;
  --color-pub-dark: #0A1628;
}
```

**Sebep — Atom disiplini (Madde 4.4):**
Y1+M2+Y4 tek mektupta toplanırsa: 5-6 saat tek tur, Y1 yarıda kalırsa kötü ara durum. CEO direktifi "uçtan uca" + atom disiplini "yamalı bohça yasak" iki kıskacında doğru karar: Y1'i ayrı tur (TUR #45.2), M2+Y4'ü birleşik bu turda.

**Web kanıtı (M2 için):**
- Resmi `@next/codemod@16.2.4 middleware-to-proxy` çalıştı
- proxy.ts runtime nodejs (middleware Edge'di) — Render'da davranış farkı muhtemel YOK
- Aciliyet düşük (deprecation uyarı, build kırılması yok) — erken yapılması önerilir
- Lokal smoke test 4/4 ✅

**Etki:**
- DEVIR'e Y5 eklendi
- IS_PLANI'a TUR #45 satırı + tarihçe satırı eklendi
- TUR #45.2 mektubu için Tur A2 keşif raporu hazır (`docs/TUR45_TUR_A2_HEX_REFACTOR_KESIF.md`, 219 satır)
- TUR #45.2 önerilen 5 atom, ~2 saat (Y5 + Y1 birleşik): @theme ekleme + Tailwind arbitrary refactor + inline style refactor + globals.css temizliği + production smoke test

**Mimar:** Claude Opus 4.7 (sohbet, mektup yazan) + Claude Code (uygulama, Tur A2 kanıt toplayan)
**Onay:** Mehmet Dinç — "BANA SORU SORMA TEK SEFERDE BİZ UÇTAN UCA KOD YAPIMIZA GÖRE ANAYASAMIZA BAĞLI OLARAK İLERLİYORUZ YAP BİTİR" (Madde 17.5 son söz)
**Disiplin:** Madde 4 (atom + kanıt + önce oku), Madde 4.4 (yamalı bohça yasak), Madde 17.5 (CEO son söz)

---

---

## 28 Nisan 2026 — v1.10.0 Anayasa Sadeleştirme + Modülasyon (TUR #39)

**Karar:** CLAUDE.md 74K → 50K karaktere indirildi. Madde 25 ayrı dosyaya modüle edildi. Dört madde mevcut maddeler içine gömüldü. İki madde birleştirildi.

**Sebep:** CLAUDE.md Madde 27 eşiğini (>60K karakter = modül ayrımı) aşmıştı. LLM context verimliliği düşüyor, her oturumda sıkıştırma oluyor, karar kalitesi bozulabiliyordu. TUR #39 Ön Keşif (KU1-KU8) bunu kanıtladı.

**Yapılan değişiklikler:**
- Madde 25 tam metin (~17K karakter) → `CLAUDE_MADDE_25_DETAY.md` + `MADDE_25_KONTROL.md`
- Madde 28 (T tipi onay) → §18.7 olarak Madde 18'e gömüldü
- Madde 29 (migration kanıtı) → §4.8 olarak Madde 4'e gömüldü
- Madde 30 (apiFetch) → §13.2 olarak Madde 13'e gömüldü
- Madde 31 (ortam izolasyonu) → §13.3 olarak Madde 13'e gömüldü
- Madde 26+27 birleştirildi: Madde 27 içeriği §26.8+§26.9 olarak Madde 26'ya eklendi
- Eski Madde 32 → Madde 27, 33 → Madde 28, 34 → Madde 29
- SALES rolü Madde 11'e eklendi (schema enum'da vardı, anayasada eksikti)

**Alternatif:** Strateji W (tam modül ayrımı, anayasa/disiplin/ + anayasa/teknik/ gibi klasörler). Reddedildi — 6 dosyaya bölünme daha fazla "nereye bakacağım" sorunu yaratır.

**Etki:** CLAUDE.md, `tedbirge-os/CLAUDE_MADDE_25_DETAY.md`, `tedbirge-os/MADDE_25_KONTROL.md`

**Mimar:** Claude Sonnet 4.6 (TUR #39 — 28 Nisan 2026 gece)  
**Mehmet Bey onayı:** 28 Nisan 2026 yazılı — "Strateji Z: Sadeleştirme + Madde 25 modülasyonu"

---

## 25 Nisan 2026 — Mimari Anayasa Yürürlüğe Girdi

**Karar:** `CLAUDE.md` proje köküne yerleştirildi, **bağlayıcı kuralname** statüsünde.

**İçerik özeti:**
- 15 madde mimar disiplini (TUR #2 başlangıcında 16'ya çıktı — Madde 5 onay disiplini eklendi)
- 10 KIRMIZI çizgi yasak
- 7 SARI prensip
- 10 durma şartı
- Agent loop modeli
- Raporlama disiplini

**Sebep:** Önceki oturumlarda her mimar farklı tanı koymuş, kararlar log'lanmamış, yamalı bohça üretmiş.

**Alternatif (seçilmedi):**
- Mega-prompt yöntemi (felaket riski)
- Tam otonom kod yazma (KVKK riski)

**Mimar:** Claude Opus 4.7 (25 Nisan 2026 öğleden sonra oturumu)

---

## 25 Nisan 2026 — Yanıltıcı Önceki Raporlar Arşivlendi

**Karar:** 13 dosya `tedbirge-os/docs/arsiv-25-nisan-2026/` altına taşındı.

**Sebep:** 6 büyük teşhis YANLIŞ çıktı (kod taramasıyla doğrulandı). Detay önceki bölümde.

**Mimar:** Claude Opus 4.7

---

## 25 Nisan 2026 — Kod-Temelli Teşhis Modeli (Madde 4.4)

**Karar:** Mimar **kod kanıtına** dayanarak teşhis koyar. .md dosyaları **ikincil kaynaktır**.

**Sebep:** Mehmet Bey'in disiplin uyarısı: *"Sen eski yapılmış işleri de yapılmamış gibi görebilirsin."*

**Mimar:** Claude Opus 4.7

---

## 25 Nisan 2026 — Agent Loop Çalışma Modeli

**Karar:** Geliştirme **çerçeveli agent loop** ile yürütülür.

**Mehmet Bey vizyonu:** *"Sahada olmam gerekiyor, kod yazmayı bilmem, her zaman sohbet edemem. Otonom yapmam şarttır."*

**Üç katman:**
1. Refleksler (otomatik, güvenli)
2. Teşhis (otomatik, raporlayıcı)
3. Tedavi (yarı-otomatik, suggest mode)

**Mimar:** Claude Opus 4.7

---

## 25 Nisan 2026 — TUR #1 Tamamlandı (10 Commit)

**Sonuç:**
- BUG #1 (status fonksiyon adı) → fix (commit zinciri)
- BUG #2 (SUPABASE env çift standart) → fix
- PrismaClient singleton 4 dosyada refactor
- OTONOM_RAPOR.md başlatıldı
- Production health 200, deploy başarılı

**Disiplin:** Atom commit, hiç KIRMIZI çizgi ihlali yok.

**Mimar:** Claude Opus 4.7

---

## 25 Nisan 2026 — Anayasa Madde 5 Eklendi (Onay Disiplini)

**Karar:** Read-only komutlar (git diff, git status, view, Get-Content vb.) için "don't ask again" otomatik onay verilebilir. Yazma komutları için her zaman insan onayı.

**Sebep:** Mehmet Bey'in geri bildirimi: *"Hep yes no bıktım, kapsamı genişlet."* Anayasa eksikti, Claude Code'un default davranışı her komutta onay istiyordu.

**Etki:** Sahada Mehmet Bey daha az onay verir, kontrol kaybolmadan verimlilik artar.

**Mimar:** Claude Opus 4.7

**Uygulama tarihi (revize):** 25 Nisan 2026 — Anayasaya işlendi (commit 6671be1). Karar arşivi ile anayasa metni uyumlu hale geldi.

---

## 25 Nisan 2026 — TUR #2 TASARIM KARARLARI (Otonom Katman)

**Bağlam:** Sistem otonom katmanına geçiş — Auditor, Healer, Reporter modülleri.  
Mehmet Bey direktifi: **"Risk olmasın."**

### Karar 1: Auditor Tarama Kapsamı = 6/6 (Kapsamlı)

Auditor şunları tarar:
1. **Schema drift** — canlı DB ↔ schema.prisma farkı (haftalık)
2. **Env var tutarsızlığı** — eksik/bayat env'ler (saatlik)
3. **PrismaClient ihlali** — yeni `new PrismaClient()` ekleyen var mı (her commit sonrası)
4. **Performans drift** — yanıt süresi yavaşlama (haftalık)
5. **Güvenlik anomalisi** — yetkisiz erişim, normal dışı download (saatlik)
6. **Cost spike** — Anthropic API aşırı kullanım (saatlik)

**Sebep:** Mehmet Bey "kapsamlı olsun" dedi. Sahada olduğu için sistemi geniş gözle görmek istiyor.

**Alternatif (seçilmedi):**
- Minimal başlangıç (1+2+6) — yetersiz, sektörel risk büyük
- Sadece kritik (5+6) — güvenlik tek başına yetmez, drift öldürücü

**Etki:** Auditor 6 farklı tarama yapacak, bulgular SystemEvent tablosuna yazılacak.

### Karar 2: Healer Otonomluğu = B (Düşük Risk Otomatik, Kritik Onay)

**Otomatik (Healer kendi yapar — düşük risk):**
- Connection pool dolu → soft restart
- Stale cache flush
- 24+ saat eski FAILED Document temizliği
- Expired token cleanup
- Render warmup ping

**Sana onay sorar (kritik):**
- Schema migration (zaten ANAYASA Madde 3 yasaklı, Healer önerebilir, **mimar uygular**)
- Env var değişikliği
- Hesap askıya alma (yetkisiz erişim sonrası)
- API key rotation
- Bulk veri işlemi

**Mehmet Bey'in ilk seçimi C (tam otonom) idi — mimar düzeltti, B'ye döndü.**

**Sebep:** Hukuki yazılımda otomatik schema/migration/data işlemi felaket çağrısıdır. Knight Capital ($440M kayıp), AWS S3 outage gibi gerçek örnekler.

**Mehmet Bey "sen kendi en doğru kararını ver" dedi → B onaylandı.**

### Karar 3: Reporter Teknolojisi = SSE

**Karar:** Server-Sent Events (SSE). Tek yönlü canlı akış.

**Alternatif (seçilmedi):**
- Polling — şu an mevcut, akıcı değil
- WebSocket — overkill, iki yönlü gereksiz

**Sebep:** Render free tier'da düşük maliyet, mobil reconnect otomatik, mevcut Express'e kolay eklenir.

### Karar 4: AuditFinding Saklama = SystemEvent + Dosya (RİSK SIFIR)

**EN ÖNEMLİ KARAR. Detaylı yazıyorum.**

**Mehmet Bey direktifi:** *"Yasaklı olanlar nedir? Risk olmasın."*

**Önceki karar (revize edildi):** AuditFinding adında yeni tablo eklenecekti. Schema değişikliği + migration gerekecekti. ANAYASA Madde 3 #1 ve #2 ihlali olacaktı (bilinçli istisna ile).

**Yeni karar (revize sonrası, risk: 0):**

Yeni tablo **YOK**. Schema değişikliği **YOK**. Migration **YOK**.

**Yerine:**

**A) Auditor bulguları → mevcut `SystemEvent` tablosu**

Schema'da hâlihazırda var olan SystemEvent tablosu kullanılır:
- `type` → "audit:schema_drift", "audit:env_inconsistency", "audit:cost_spike", vb.
- `severity` → "INFO", "WARNING", "CRITICAL"
- `module` → "auditor"
- Detaylar JSON string olarak `type` veya başka kullanılan alanda

**B) Healer fix önerileri → dosya tabanlı**

`tedbirge-os/docs/AUDIT_FINDINGS/` klasörü:
- `OPEN/` → bekleyen öneriler (JSON dosyaları)
- `RESOLVED/` → çözülmüş öneriler
- `REJECTED/` → reddedilenler

Mehmet Bey panele girince dosyaları görür. Onaylama = `git mv OPEN/ RESOLVED/` (Healer veya mimar uygular).

**Avantajları:**
- ❌ Schema değişikliği yok → ANAYASA Madde 3 #1 korundu
- ❌ Migration yok → Madde 3 #2 korundu
- ❌ Üretim DB'sine SQL yok → Madde 3 #3 korundu
- ✅ Git tarihçesi zaten audit log → KVKK için bonus
- ✅ Geri alma kolay (`git revert`)
- ✅ Mevcut SystemEvent altyapısı kullanılıyor

**Sebep:** Mehmet Bey "risk olmasın" dedi. Önceki "bilinçli istisna" yaklaşımı anayasayı sulandırırdı. Mimar yaklaşımı baştan düşündü, sıfır risk seçeneği buldu.

**Mimar (önemli not):** Bu kararı vermek 2 turlu oldu:
- 1. tur: AuditFinding tablosu (yanlış, anayasa ihlali)
- 2. tur (Mehmet Bey'in uyarısından sonra): SystemEvent + dosya (doğru, sıfır risk)

Bu dürüst kayıt yarınki mimar için kıymetli. **Anayasa ihlali alışkanlığa dönüşmesin.**

**Mimar:** Claude Opus 4.7

---

## 25 Nisan 2026 — TUR #2 GÖREV LİSTESİ (Otonom Katman, Risk: 0)

**Bağlam:** Yukarıdaki 4 tasarım kararı uygulamaya geçer. Yeni dosyalar oluşturulur, mevcut dosyalara dokunulmaz (mount işlemleri hariç).

**Yeni dosyalar (tamamı sıfır risk):**

1. `src/os/modules/auditor.js` — yeni modül
2. `src/os/modules/healer.js` — yeni modül
3. `src/os/modules/reporter.js` — yeni modül (SSE bridge)
4. `src/routes/os.events.routes.js` — yeni route (SSE endpoint)
5. `tedbirge-panel/app/(panel)/dashboard/sistem-durumu/canli-feed/page.tsx`
6. `tedbirge-panel/app/(panel)/dashboard/tespit-edilen-sorunlar/page.tsx`
7. `tedbirge-panel/app/(panel)/dashboard/mimar-onayi/page.tsx`
8. `tedbirge-os/docs/AUDIT_FINDINGS/.gitkeep`
9. `tedbirge-os/docs/AUDIT_FINDINGS/OPEN/.gitkeep`
10. `tedbirge-os/docs/AUDIT_FINDINGS/RESOLVED/.gitkeep`
11. `tedbirge-os/docs/AUDIT_FINDINGS/REJECTED/.gitkeep`

**Minimal değişiklik (mevcut dosyalara):**

- `src/os/index.js` — sadece 3 yeni `safeRequire` satırı + `modules` objesinde 3 yeni anahtar
- `src/routes/index.js` — 1 yeni route mount

**Yapılmayacaklar:**

- ❌ `prisma/schema.prisma` değiştirilmiyor
- ❌ Migration oluşturulmuyor
- ❌ Mevcut OS modüllerine dokunulmuyor
- ❌ Mevcut servisler refactor edilmiyor
- ❌ npm install yok
- ❌ Yeni kütüphane yok (mevcut Express SSE ile yapılır)
- ❌ Env var değişikliği yok

**Tahmini commit sayısı:** 10-12 (her dosya atom commit + index.js mount + route mount + son rapor)

**Tahmini süre:** 4-6 saat agent loop

**Mimar:** Claude Opus 4.7

---

## 26 Nisan 2026 — TUR #5 TASARIM KARARLARI (SUPABASE Kanonik + Web Push)

### Karar 1: SUPABASE kanonik key

**Karar:** `SUPABASE_SERVICE_ROLE_KEY` master (kanonik). `SUPABASE_SERVICE_KEY` fallback olarak birakildi.

**Sebep:** Supabase'in standart env adi `SUPABASE_SERVICE_ROLE_KEY`. Eski ad (`SUPABASE_SERVICE_KEY`) ilk commit'ten kalmis. OS adapter ve boot.js zaten yeni adi kullaniyor; storage.service.js ve uploadMiddleware.js sadece eski adi biliyordu.

**Uygulama:** `storage.service.js:12` ve `uploadMiddleware.js:16` fallback pattern'e cevrildi: `SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_KEY`. (commit 688d779)

**Sonraki adim:** Mehmet Bey Render'dan `SUPABASE_SERVICE_KEY` silebilir. Fallback hala koruyucu.

### Karar 2: Web Push stratejisi — DB-backed, sendToRole

**Karar:** Push bildirimleri `pushNotification.service.js` + `PushSubscription` DB modeli uzerinden. In-memory map kullanilmadi.

**Sebep:** `pushNotification.service.js`, `PushSubscription` schema modeli, `push.routes.js` + `push.controller.js` initial commit'ten (39492ab) mevcut, tamamen DB-backed. Mektup'un in-memory tasarimi (global.pushSubscribers) gercek altyapiyi bilmeden yazilmisti. Anayasa Madde 4.4 (kod kaynaktir) uygulanarak DB-backed servis kullanildi.

**Healer entegrasyonu:** `maybeSendPush(finding)` — `sendToRole("ADMIN", payload)` cagiriyor. (commit b0766c8)

### Karar 3: Web Push Strateji — endpoint adi

**Karar:** `/api/push/vapid-key` korundu (mevcut kod, Madde 4.4).

**Risk:** Dusuk. VAPID keys mevcut, sw.js push handler mevcut. Sadece baglama eklendi.

**Endpoint adi duzeltmesi (TUR #5 sirasinda tespit):** Mektupta `/api/push/vapid-public-key` yazilmis, ama mevcut kod (push.routes.js + PwaProvider.tsx) `/api/push/vapid-key` kullaniyor. Anayasa Madde 4.4 (kod kaynaktir) geregi mevcut endpoint korundi, mektup hatali kabul edildi. Dogru endpoint: `/api/push/vapid-key`.

**Mimar:** Claude Code (TUR #5)

---

## Format ve Disiplin Notu

Yeni karar bu dosyaya **yukarıdaki formatla** eklenir.

**Kural:** Yeni karar eski kararı ezmez, üstüne yazar. Eski karar değişiyorsa, **revize maddesi** yeni karar yazılır, eskisi referans olarak kalır.

---

**Son güncelleme:** 25 Nisan 2026 (TUR #2 tasarım sonu)  
**Mimar:** Claude Opus 4.7  
**Bağlayıcı:** Tüm gelecek oturumlar

---

## 28 Nisan 2026 (sabah) — ANAYASA v1.7.0 + 7 YENİ MADDE

**Karar:** Anayasaya 7 yeni madde eklendi (Madde 26-32). Eski Madde 26 (Kapanış) → Madde 33.

**Yeni maddeler:**
- 26 — Otonom Devir + Sağlık Taraması Başlatma
- 27 — Sağlık Taraması Periyodikliği
- 28 — Onay Disiplini Genişletmesi (T tipi otomatik onay)
- 29 — Migration Uygulandi Kanıtı (ALTER TABLE çıktısı şart)
- 30 — Frontend Standart Disiplini (apiFetch zorunlu)
- 31 — Ortam İzolasyonu (lokal dev ≠ production)
- 32 — Anayasa Boyut Disiplini (40k+ özet versiyon)

**Sebep:** 28 Nisan 2026 sabah 3 sızıntı (migration drift, CORS, 401) ve sağlık taraması TUR #27 (21 bulgu) kanıtladı: bu 7 disiplin anayasada yoktu.

**Sürüm:** v1.6.0 → v1.7.0 (Madde 22 — MINOR — yeni madde eklendi)

**Mimar:** Claude Opus 4.7 (28 Nisan sabah devir oturumu, Mehmet Bey direktifi)

**Risk:** SIFIR (sadece dokümantasyon, Madde 18.4 yeşil nokta)

---

## 26 Nisan 2026 (öğle) — TUR #5 KAPANIŞ + ALTYAPI KEŞİF NOTU

**TUR #5 onaylandı:** SUPABASE kanonik + Web Push entegrasyonu, 5 commit, sıfır anayasa ihlali, public URL kanıtı toplandı.

### Önemli mimari keşif (TUR #5 sırasında)

Tedbirge.ai'nın initial commit'inde (39492ab) şu altyapı **zaten kuruluymuş** ama **hiç bağlanmamış**:

- `model PushSubscription` (prisma/schema.prisma satır 308-316)
- `src/services/pushNotification.service.js` (DB-backed, sendToRole, sendToUser)
- `src/routes/push.routes.js` (3 endpoint: vapid-key, subscribe, unsubscribe)
- `tedbirge-panel/PwaProvider.tsx` (SW kayıt altyapısı)
- `tedbirge-panel/public/sw.js` (push event handler)

TUR #4'te PwaProvider keşfedildi, TUR #5'te kalan 4 parça keşfedildi.

**Çıkarım:** Tedbirge'nin **gizli altyapısı zengin**. Yeni bir tur açmadan önce mutlaka:
1. `git log --oneline -- <ilgili dizin>` ile tarihçe
2. `Get-ChildItem -Recurse -Filter *.<uzantı>` ile mevcut dosya tespiti
3. `Select-String` ile ilgili pattern araması

Bu disiplin TUR #5'te 30+ dakika tasarruf sağladı (yeni dosya yazmak yerine bağlantı kurma).

### Anayasa Madde 4.5 yorumu güncellemesi

> "Önce oku sonra yaz" maddesinin canlı uygulaması: yeni bir özellik eklemeden önce **mevcut servis/route/model yapısı taranır**. Bulunduysa **bağlantı kurulur**, bulunmadıysa yazılır.

### Bekleyen: Mehmet Bey'in manuel adımları

1. Render → SUPABASE_SERVICE_KEY (eski) sil → /health 200 doğrula
2. Panel /dashboard/bildirimler → "Bildirimleri Aç" → tarayıcı izni → abonelik test

**Mimar:** Claude Opus 4.7 (TUR #5 kapanış)

---

## 26 Nisan 2026 — Anayasa Madde 17 + 18 Eklendi

**Karar:** İki yeni anayasa maddesi yürürlüğe girdi.

**Madde 17 (Stratejik Kesit Disiplini):** Sistemi yatay kesitlere böl, her kesiti uçtan uca tasarla. "Tüm sistem tek seferde" yasaklı.

**Madde 18 (Otonom Tur Zinciri):** Mimar bir kesit için tüm tur mektuplarını tek oturumda yazar. KIRMIZI nokta turları onay şartlı, YEŞİL nokta turları otomatik akar.

**Sebep:** Mehmet Bey saha programı + bilgi-fizik sınırı. Tek seferde tüm sistemi tasarlamak imkansız, ama bir kesit için tüm zinciri yazmak verimli.

**Etki:** Mimar oturumu açma sıklığı azalır, sahada kalma süresi artar, disiplin korunur.

**Mimar:** Claude Opus 4.7

---

## 26 Nisan 2026 (gece) — ANAYASA v1.3.0 + Madde 20+21+22 EKLENDİ

**Karar:** Anayasaya 3 yeni madde eklendi:
- **Madde 20:** Anayasa Evrim Disiplini (anayasa nasıl değişir)
- **Madde 21:** Sağlık Taraması Disiplini (uçtan uca risk denetimi)
- **Madde 22:** Versiyon Disiplini (4 katmanlı SemVer 2.0)

Eski Madde 19 (Kapanış) → Madde 23 olarak kaydı.

**Sebep:** Üç eksiklik kanıtlandı:
1. Anayasanın evrim süreci tanımsız (Madde 5, Madde 17+18 doğaçlama eklendi)
2. Uçtan uca sağlık taraması ihtiyacı vs Madde 17 (kesit disiplini) çelişkisi
3. 4 katman (anayasa, backend, panel, schema) için versiyon standardı yok

**Alternatif (seçilmedi):**
- CalVer (Calendar Versioning) — Tedbirge için zaman bilgisi yetersiz, breaking change göstermiyor
- Hybrid (CalVer + SemVer) — mental yük yüksek, araç desteği zayıf
- Madde 22'yi ayrı turla yazmak — atom mantıksal iş bölünmüş olur

**Etki:**
- Anayasa v1.0.0 → v1.3.0 (resmi versiyon güncellemesi)
- 21 madde + 1 kapanış = 22 numaralı madde + 1 kapanış (Madde 23)
- Bundan sonra her anayasa değişikliği Madde 20.4 sürecinden geçer
- Sağlık taraması Madde 21'e göre yapılır
- 4 katman versiyonu Madde 22'ye göre yönetilir

**Mimar:** Claude Opus 4.7  
**Onay:** Mehmet Bey (yazılı, sohbet kaydı)

---

## ANAYASA VERSİYON TARİHÇESİ (geriye dönük kanıt — Madde 22.7)

Anayasa şu ana kadar **3 büyük değişiklik** geçirdi ama versiyon güncellenmemişti. Madde 22 eklenirken bu **gizli ihlal** düzeltildi:

| Versiyon | Tarih | Değişiklik | Madde Sayısı | Commit |
|---|---|---|---|---|
| v1.0.0 | 25 Nisan 2026 | Başlangıç (16 madde) | 16 | (initial CLAUDE.md commit) |
| v1.1.0 | 25 Nisan 2026 | Madde 5 (Onay Disiplini) eklendi → Madde 5-15 kaydırıldı | 17 | (TUR #2 öncesi commit) |
| v1.2.0 | 26 Nisan 2026 | Madde 17 (Kesit Disiplini) + Madde 18 (Otonom Tur Zinciri) eklendi → Madde 19 (Kapanış) | 19 | (anayasa genişletme v2 commit) |
| **v1.3.0** | **26 Nisan 2026 (gece)** | **Madde 20 (Anayasa Evrim) + Madde 21 (Sağlık Taraması) + Madde 22 (Versiyon Disiplini) eklendi → Madde 23 (Kapanış)** | **22 + Kapanış** | **a4ec692** |

| **v1.4.0** | **27 Nisan 2026 (sabah)** | **Madde 24 (İş Planı Disiplini) eklendi → Madde 26 (Kapanış)** | **23 + Kapanış** | **(bu commit)** |
| **v1.11.0** | **1 Mayıs 2026 (gece geç)** | **Madde 29 (Hareket Disiplini) eklendi → KAPANIŞ Madde 30. TUR #44 büyük kesit sonrası kalıcı prensipler anayasaya yansıdı: merkezi motion kaynak, 3 katmanlı reduced-motion, ortak component disiplini, Senaryo 1 paket sınırı, soft initial state, performans bütçesi, "tek mektup uçtan uca" pattern.** | **29 + KAPANIŞ** | **(bu commit)** |

*Not: Tablonun v1.4.0 ile v1.11.0 arasındaki sürüm satırları (v1.5.0 → v1.10.0) henüz eklenmemiş — anayasa header'ında tarihçe mevcut. Tablo tutarlılığı ayrı bir doküman bütünlük turu adayı.*

**KVKK kanıt notu:** Bundan sonra anayasa değişikliklerinde tarih + commit hash + açıklama bu tablo formatına yazılacak (Madde 22.7).

**Mimar:** Claude Opus 4.7  
**Tarih:** 26 Nisan 2026 (gece)

---

## 27 Nisan 2026 (sabah) — ANAYASA v1.4.0 + Madde 24 (İş Planı Disiplini)

**Karar:** Anayasaya Madde 24 (İş Planı Disiplini) eklendi. Eski Madde 23 (Kapanış) → Madde 26 olarak kaydı.

**Madde 24 İçeriği (13 alt madde):**
- 24.1 İlke (Tedbirge'nin konumu — B2B SaaS LegalTech)
- 24.2 Paydaş yapısı (4 iç + 7 dış kategori)
- 24.3 Gelir modeli (Tedbirge %20 / Temsilci %10-%10)
- 24.4 Yasal sorumluluk dağılımı (Avukatlık K. + KVKK)
- 24.5 Yol haritası dokümanı (IS_PLANI.md)
- 24.6 Önceliklendirme kuralı (sıralı)
- 24.7 Kesit tipi (A: Bulgu Kapatma, B: Stratejik)
- 24.8 İş bitirme kriterleri
- 24.9 Karar mekanizması
- 24.10 KVKK yurt dışı aktarım disiplini
- 24.11 Hukuki muhatap şablon disiplini
- 24.12 Yol haritası güncelleme
- 24.13 Yasaklı davranış

**Sebep — 4 fizibilite raporu birleştirildi:**
1. İş Planı Fizibilite Raporu (576 satır) — MoSCoW + Now-Next-Later
2. Resmi Muhatap KEŞİF Raporu (376 satır) — 7 kategori atlas
3. Birleşik Analiz Raporu (430 satır) — sentez
4. Mali Akış Mini KEŞİF (421 satır) — gelir modeli kanıtı

**Mehmet Bey direktifleri (anayasaya gömüldü):**
- Tedbirge B2B SaaS, hukuk hizmeti vermez (Madde 24.1)
- Mehmet Dinç girişimci, marka sahibi (Madde 24.1)
- Tedbirge %20 / Temsilci %10-%10 (Madde 24.3)
- IBAN havale, PayTR gerekli değil (Madde 24.3)
- KDV/stopaj/sorumluluk Avukatlık + Vekalet — Avukat (Madde 24.4)

**Etki:**
- Anayasa v1.3.0 → v1.4.0 (MINOR — yeni madde, Madde 22.2)
- 22 madde + 1 kapanış → 23 madde + 1 kapanış
- IS_PLANI.md v1.0 oluşturuldu
- Bundan sonra her kesit Madde 24 disiplini ile başlar

**Mimar:** Claude Opus 4.7  
**Onay:** Mehmet Dinç (yazılı, sohbet kaydı)

---

## 27 Nisan 2026 (akşam) — Anayasa v1.5.0: Madde 25 (Pazarlama + Web + Marka Kapsamlı)

**Karar:** Pazarlama + Web Yüzü + Marka Disiplini Madde 25 olarak anayasaya eklendi (kapsamlı).

**Kapsam:** 14 alt madde:
- 25.1 Tedbirge'in pazarlamadaki sıfatı
- 25.2 Marka mesajı
- 25.3 KIRMIZI çizgi yasaklı vaatler
- 25.4 İzinli mesaj çerçevesi
- 25.5 Web arayüzü (marka kimliği + yasal bileşenler + dönüşüm yüzeyi + görsel/etkileşim + mobil + a11y)
- 25.6 Sosyal medya disiplini
- 25.7 KVKK + İYS + pazarlama veri
- 25.8 Yanıltıcı bilgi denetimi
- 25.9 İzinli kanallar + araçlar
- 25.10 Pazarlama verisi audit
- 25.11 Kod altyapı zorunlulukları (15 satır kontrol listesi)
- 25.12 Üç faz disiplini (FAZ 1 → 2 → 3)
- 25.13 7 sorulu pazarlama kararı filtresi
- 25.14 Yabancı pazar ayrımı (Madde 26'ya bırakıldı)

**Kanıt zemini:** PAZARLAMA_FIZIBILITE.md (27 Nisan 2026) — 5 KRİTİK eksik tespit edildi (cookie banner, GA4/Pixel, İYS opt-out, UTM frontend, qualificationScore).

**Sıradaki adım:** TUR #25 FAZ 1 mektubu (Yasal + Ölçüm Temeli — Cookie banner, aydınlatma, GA4, Pixel, UTM fix, İYS, robots/sitemap). Otonom inşa Madde 18.2 disiplini ile.

**Sınır:** Sadece Türkiye geneli. Yabancı plaka + çoklu dil pazarlama Madde 26'da.

**Etki:**
- Anayasa v1.4.0 → v1.5.0 (MINOR — yeni madde, Madde 22.2)
- 23 madde + 1 kapanış → 24 madde + 1 kapanış (Madde 25 eklendi)

**Mimar:** Claude Sonnet 4.6  
**Onay:** Mehmet Dinç (yazılı, sohbet kaydı — "Tek seferde kapsamlı kanun maddesi, sonra otonom inşa")

---

## 27 Nisan 2026 (gece sonu) — ANAYASA v1.6.0 + Madde 25.12 FAZ 4 + Madde 25.11 Genişletme

**Karar:** Madde 25.12'ye FAZ 4 (Operasyonel Ölçek + Optimizasyon) tanımı eklendi. Madde 25.11 kontrol listesi 5 yeni satır ile genişletildi (16-20).

**FAZ 4 Alt Başlıkları (4 atom kesite bölünür):**
- A. Reklam Altyapısı (TUR #26)
- B. İçerik Üretimi (TUR #27)
- C. Operasyonel Pazarlama (TUR #28)
- D. Otomasyon + Sürekli Optimizasyon (TUR #29+, sürekli)

**Sebep — Mehmet Bey direktifi (27 Nisan 2026, gece sonu):**
> "ANAYASAYA YA GÖRE FAZ 4 TAM PAKET ORTAK"
> "ANAYASADA PAZARLAMA VAR CLAUDE CODE YE SOR"
> "ortağım bizim bir anayasamız var uçtan uca kod tabanlı ilerliyoruz"

Mehmet Bey FAZ 4 başlatmak istedi. Mevcut anayasa Madde 25.12'de FAZ 4 tanımlı değildi. Madde 25.13.6 (Hangi FAZ kapsamında?) sorusuna cevap verilemiyordu. Madde 4.1 (yamalı bohça yasak) + Madde 17 (kesit disiplini) gereği önce anayasa genişletildi, sonra atom kesit mektupları yazılacak.

**Kanıt zinciri:**
- Madde 25 tam metni `tedbirge-os/docs/MADDE_25_TAM_METIN.md` dosyasında (27 Nisan 2026, Claude Code keşfi)
- Mevcut Madde 25.12: yalnızca FAZ 1+2+3 tanımlıydı
- Mevcut Madde 25.11: 15 satırlık kontrol tablosu

**Etki:**
- Anayasa v1.5.0 → v1.6.0 (MINOR — yeni alt başlık, Madde 22.2)
- Madde 25.12: 3 FAZ → 4 FAZ
- Madde 25.11: 15 satır → 20 satır
- Yeni kontrol noktaları: Google Ads conversion API, UTM şablon, A/B test, lead SLA, haftalık KPI mail
- Bundan sonra FAZ 4 atom kesit mektupları (TUR #26, #27, #28, #29+) yazılabilir

**Mimar:** Claude Opus 4.7 (yeni oturum, FAZ 4 başlangıcı)
**Onay:** Mehmet Dinç (yazılı, sohbet kaydı 27 Nisan 2026 gece)
**Disiplin:** Madde 4.1, 4.4, 4.5, 17, 20.1, 22.2, 22.7, 25.12

---

## 28 Nisan 2026 (öğleden sonra) — ANAYASA v1.8.0 + Madde 33 EKLENDİ

**Karar:** Anayasaya 1 yeni madde eklendi:
- **Madde 33:** Beklemede Özellik Disiplini (yarım kurulu özellik yönetimi)
- Eski Madde 33 (Kapanış) → **Madde 34** olarak yeniden numaralandı

**Sebep — Kanıta Dayalı (Madde 20.1):**
TUR #29 AccidentCase kanıt taraması şunu kanıtladı:
- Frontend'de aktif "Yeni Vaka Aç" butonu vardı
- Backend'de 0 referans, endpoint yoktu
- Her tıklamada kullanıcı 404 görüyordu
Bu "Senaryo B — Yarı kurulu" durumu için anayasada hiçbir kural yoktu.

**Madde 33 — 3 Koşul (hepsi zorunlu):**
1. Panel'de belirgin YAKINDA badge (amber gradient, aktif buton yok)
2. Schema'da `// @deferred` yorumu
3. IS_PLANI.md kaydı (hangi kesitte aktif edilecek)

Üç koşuldan biri eksikse → sağlık taramasında 🔴 KRİTİK sayılır.

**Uygulanan Tedavi (TUR #29-B):**
- `tedbirge-panel/app/(panel)/leads/[id]/page.tsx` — Kaza Rekonstrüksiyon bloğu amber YAKINDA kart olarak değiştirildi (commit 5517dbe)
- `prisma/schema.prisma` — AccidentCase + Evidence modelleri `// @deferred` yorumu ile işaretlendi
- `tedbirge-os/IS_PLANI.md` — AI Analiz Doğruluk Kesiti kapsamına AccidentCase eklendi

**Sürüm:** v1.7.0 → v1.8.0 (Madde 22 — MINOR — yeni madde eklendi)

**Alternatif (seçilmedi):**
- Senaryo A: CREATE TABLE + tam backend — pahalı, Q3 2026 öncesi gereksiz (KIRMIZI nokta olurdu)
- Senaryo C: Frontend + schema tamamen sil — geleceği kapatır, tasarım emekten kaçar

**Mimar:** Claude Sonnet 4.6 (TUR #29-B, 28 Nisan 2026 öğleden sonra)
**Onay:** Mehmet Dinç (TUR #29-B mektubu — yazılı talimat)
**Disiplin:** Madde 4.1, 4.4, 17.4, 20.1, 20.4, 22.2, 22.6


---

## 28 Nisan 2026 (akşam) — ANAYASA v1.9.0 + Otonom Devir Sistemi

**Karar:** Anayasa Madde 26 (Otonom Devir) sertleştirildi. Yeni alt maddeler eklendi:
- 26.4 — Açılış Protokolü (zorunlu 6 komut zinciri, atlatılamaz)
- 26.5 — Açılış Mesajı Formatı (sabit şablon)
- 26.6 — DEVIR_RAPORU_AKTIF.md (canlı tek dosya)
- 26.7 — Yasaklı davranış (26.4-26.6 kapsamı)

Madde 27'ye eklendi:
- 27.4 — Kapanış Uyarısı (sohbet süresi eşiği + uyarı formatı + Mehmet Bey kararı)

**Sebep:** 28 Nisan 2026 boyunca defalarca yaşanan iki sürtünme:
- Yeni sohbet açıldığında mimar "ne yapayım?" diye sordu
- Bağlam dolduğunda kullanıcı yapısal güvence kaybı yaşadı (compact uyarısı)

Mehmet Bey direktifi (sohbet kaydı, akşam):
- "Hiç kapanışta beni uyarsın, sohbet süresi doluyor yeni sohbet aç desin"
- "Açılışta bana hiçbir şey söylemeden kaldığı yerden devam edecek"
- "Tam otonom sistemi kur"

**Sürüm artışı:** MINOR (v1.8.0 → v1.9.0 — yeni alt maddeler, Madde 22 disiplini)

**Mimar:** Claude Sonnet 4.6 (TUR #36, 28 Nisan akşam)

**Risk:** SIFIR (sadece dokümantasyon — Madde 18.4 yeşil nokta)

**Etki:** Bağlam kayıpsız oturum geçişi. Mehmet Bey sahaya çıkarken yapısal güvence: yeni sohbet otonom devralır, bağlam köprüsü insan eliyle taşınmaz.

---

## 29-30 Nisan 2026 — TUR #42 Kurumsal Kimlik Birleştirme

### Karar 1: Paylaşımlı PublicNav Component Kararı

**Bağlam:** TUR #42 K5 araştırması gösterdi: 27 public sayfanın hiçbiri paylaşımlı nav component kullanmıyor. Anasayfa kendi inline `function PublicNav()` (159 satır), /basvuru kendi inline `<header>` (358-385. satırlar arası), niş landing'lerde nav yok. Bu dağınık nav yapısı:
- Görsel tutarsızlığa sebep oluyor
- Bakım maliyeti yüksek
- TUR #44 Animasyon turunda sayfa geçişleri için paylaşımlı nav şart

**Karar:** Anasayfanın inline PublicNav fonksiyonu `components/PublicNav.tsx` dosyasına çıkarıldı. Tüm pazarlama sayfaları (~14 sayfa) bu paylaşımlı component'i kullanır. Auth sayfaları (login, register, forgot-password, reset-password, sifre-belirle) kendi minimal layout'larını korur (farklı UX akışı).

**Uygulanan:**
- `components/PublicNav.tsx` — yeni dosya, 165 satır (sticky + glassmorphism + framer-motion)
- 13 sayfa entegre edildi: /, /basvuru, /blog, /blog/[slug], 3 niş landing, /hakkimizda, /iletisim, /haberler, /tazminat-hesapla, /lexscan, /referanslar, /basvuru-sorgula

**Alternatif (seçilmedi):** Sayfa-bazlı nav korunsun, sadece /basvuru düzeltilsin (dar K5). Geleceğin animasyon ve SEO turları için dezavantajlı, kapsamı genişlettik.

**Mimar:** Claude Opus 4.7 (TUR #42 K5, 29 Nisan 2026 gece)
**Onay:** Mehmet Dinç ("ortak web arayüzü bir bütündür" — yazılı talimat)
**Disiplin:** Madde 4 (kanıt), Madde 17.3, Madde 17.5

---

### Karar 2: M3 Yan Bulgusu Küçük Parçasını Kapsama Dahil Etme

**Bağlam:** TUR #40'tan beri açık M3 yan bulgusu: "iki Footer pattern'i (anasayfa inline lacivert + global beyaz)". TUR #42 K5 Tur B mektubunda "Footer dokunulmaz" sözü verilmişti. Ancak Mehmet Bey production kontrolünde fark etti: /basvuru'da hâlâ mor renkler görünüyor. Kanıt zinciri (Claude Code raporu): /basvuru kaynak kod %100 lacivert, mor renkler Footer.tsx hover renklerinden geliyor (10 × #534AB7).

**Karar:** M3'ün küçük parçası (Footer hover renk #534AB7 → #1E1E8E, 5 satır) bu turda kapatıldı. M3'ün asıl parçası (iki Footer pattern'i birleştirme — mimari karar gerek) LATER kalıyor.

**Uygulanan:** `components/layout/Footer.tsx` 5 satır `hover:text-[#534AB7]` → `hover:text-[#1E1E8E]`. Commit `1da080c`.

**Niye söz değiştirildi:** Madde 17.4'e göre mimar sözünü tutmalı. Ancak Madde 17.5 son söz Mehmet Bey'de — gözlem kanıt olarak kapsamı meşrulaştırdı. Risk minimal (sadece hover, layout etkilenmez), 5 satır CSS değişikliği.

**Alternatif (seçilmedi):** M3'ü tamamen LATER bırakıp TUR #42 kapansın. Ancak production'da görünür mor problem devam ederdi.

**Mimar:** Claude Opus 4.7 (TUR #42 K7, 29 Nisan 2026 gece geç)
**Onay:** Mehmet Dinç (production gözlemi + Madde 17.5 son söz)
**Disiplin:** Madde 4, Madde 17.4, Madde 17.5

---

### Karar 3: /login Gradient — Kurumsal Lacivert Ailesi Tasarım Sistemi

**Bağlam:** /login sayfası sol dekoratif paneli (hidden lg:flex masaüstü görünümü) gradient `#1E1E8E → #3b239f → #22145f` kullanıyordu. `#3b239f` (koyu violet/mor) ve `#22145f` (çok koyu navy-purple) kurumsal palette dışı renkler. Mehmet Bey'in vurgusu: "ortak web arayüzü bir bütündür".

**Karar:** Gradient kurumsal lacivert ailesi içinde kalır:
- `#1E1E8E` = `var(--brand-primary)` (kurumsal lacivert) — başlangıç
- `#18187a` = `--brand-primary-hover` (lacivert ailesi koyu varyant) — orta
- `#0f0f4d` = lacivert ailesi en koyu (siyah değil, lacivert kuzeni) — bitiş

Bu yeni gradient lacivertten kendi koyu kuzenine geçer — mor yok, kurumsal kimlikte.

**Uygulanan:** `app/(public)/login/page.tsx` line 88 gradient değişimi. Commit `d0c3cc3`.

**Tasarım sistemi sonucu:**
- Ana renk: #1E1E8E (kurumsal lacivert) — birincil
- Koyu varyant: #18187a — hover, vurgu
- En koyu: #0f0f4d — gradient ucu (yeni eklenen, palette'te değişken yok)
- Yeşil aksent: #5CB85C — CTA, aksiyon
- M7 yan bulgusu: /lexscan blue gradient hâlâ Tailwind native (kurumsal palete identical değil) — LATER

**Alternatif (seçilmedi):** Düz #1E1E8E kullanmak (gradient olmadan). Ancak gradient sayfada görsel zenginlik sağlıyor, kurumsal aile içinde kaldıkça uygundur.

**Mimar:** Claude Opus 4.7 (TUR #42 K8, 30 Nisan 2026 gece yarısı)
**Onay:** Mehmet Dinç (görsel kontrol — 3 rol Yönetici/Temsilci/Hukukçu kanıtlı)
**Disiplin:** Madde 4, Madde 17.5

---

## 1 Mayıs 2026 — TUR #43 Tur B-1 SEO Altyapı

### Karar 1: SEO Meta Altyapısı 8 Atom 2 Alt-Tura Bölündü

**Bağlam:** Tur A keşfi (12 KN) 4 kritik SEO eksikliği tespit etti — JSON-LD sıfır, OG image yok, anasayfa kendi metasından yoksun (`"use client"` engeli), `metadataBase` eksik. Toplam 8 atom önerildi. Mimar tek seferde uygulamayı reddetti — anasayfa server/client refactor B-1'in düşük-risk altyapı çalışmasıyla aynı kapsama sığmadı.

**Karar:** 8 atom **2 alt-tura** bölündü:
- **Tur B-1 (bu tur):** Düşük risk, additive — root metadata + dinamik OG image + sitemap satırı + robots satırı (4 atom). Sonradan B5 (middleware fix) eklendi.
- **Tur B-2 (sonraki):** JSON-LD enjeksiyonu (Organization + WebSite + LegalService + Article + BreadcrumbList) + anasayfa server/client bölmesi. Mimar mektubu B-1 production doğrulamasından sonra yazılır.

**Alternatif (seçilmedi):** Tek seferde 8 atom uygulamak. Anayasa Madde 4.2 (atom seviyesi) ihlali, kapsam belirsizliği, refactor riski daha yüksek olurdu.

**Mimar:** Claude Opus 4.7 (TUR #43, 30 Nisan 2026 gece yarısı sonrası)
**Onay:** Mehmet Dinç ("YAZ ORTAK" — Tur A raporu sonrası)
**Disiplin:** Madde 4.2, Madde 17.3

---

### Karar 2: OG Image Dinamik Üretim (Next.js Convention)

**Bağlam:** Tur A'da `og-image.png` 1200×630 statik dosyasının olmadığı tespit edildi. `logo.png` (640×640 JPEG) OG için yetersiz. İki seçenek vardı: (a) Mehmet Bey'den tasarımcı OG image isteyip statik dosya olarak yerleştirmek, (b) Next.js App Router `app/opengraph-image.tsx` convention'u ile dinamik üretmek.

**Karar:** Dinamik üretim seçildi (`app/opengraph-image.tsx`, Edge runtime, `ImageResponse` API). Kurumsal lacivert gradient (#1E1E8E → #0F0F4A), Türkçe başlık, "Trafik ve İş Kazası Tazminat Yönetimi" altyazı + tedbirge.ai. Logo PNG embed BU SÜRÜMDE değil (Edge runtime + uzak dosya çekme + font sorunları riski). Mehmet Bey ileride "logo da olsun" derse v2 atomu olarak eklenir.

**Sonuç:** Next.js convention sayesinde `metadata.openGraph.images` ve `metadata.twitter.images` MANUEL eklenmedi — Next.js otomatik bağladı. Production HTML'de tüm sayfalarda `og:image=https://www.tedbirge.ai/opengraph-image?...` ve eşdeğer `twitter:image` çıktı.

**Alternatif (seçilmedi):** Statik PNG dosyası — Mehmet Bey bağımlılığı + tasarım turu gerektirirdi, B-1 momentumunu kırardı.

**Mimar:** Claude Opus 4.7 (TUR #43 B2, 30 Nisan 2026 gece yarısı sonrası)
**Onay:** Mehmet Dinç ("YAZ ORTAK")
**Disiplin:** Madde 4.5

---

### Karar 3: Robots Disallow Sadece /musteri/ Eklendi (Auth Sayfaları Bilerek Açık)

**Bağlam:** Tur A keşfinde Claude Code 6 path için disallow önerdi (login, register, forgot-password, reset-password, sifre-belirle, musteri). Mimar bu öneriyi daralttı.

**Karar:** Sadece `/musteri/` disallow eklendi. Mevcut disallow'lar (`/api/`, `/dashboard/`, `/admin/`) korundu. Auth sayfaları (`/login`, `/register`, `/sifre-belirle` vb.) bilerek **açık** bırakıldı:
- Marka aramasında ("tedbirge giriş") kullanıcılar arama motorundan login sayfasına ulaşabilir — UX için yararlı
- KVKK riski yok (auth sayfaları içerik göstermiyor, public statik UI)
- `/musteri/` müvekkil portalı — KVKK kritiği, içerik halka açık değil → mutlaka disallow

**Alternatif (seçilmedi):** 6 path'i de disallow etmek. Marka SEO açısından dezavantajlı, hiçbir koruma faydası yok.

**Mimar:** Claude Opus 4.7 (TUR #43 B4, 30 Nisan 2026 gece yarısı sonrası)
**Onay:** Mehmet Dinç ("YAZ ORTAK")
**Disiplin:** Madde 4, Madde 24.10 (KVKK)

---

### Karar 4: Middleware /opengraph-image Public Path (Ek Atom B5)

**Bağlam:** B2 atomu (opengraph-image.tsx) tamamlandıktan sonra lokal smoke test'te endpoint **HTTP 307 → /login** redirect döndürdü. Kök sebep: `middleware.ts` public path listesinde `/opengraph-image` yoktu, `pathname.includes(".")` koşulu nokta içermeyen URL'i kurtaramadı. Production'da da aynı davranış olur, sosyal medya crawler'lar OG image alamazdı.

**Karar:** Middleware public path listesine `pathname.startsWith("/opengraph-image") ||` eklendi (1 satır). Ek atom B5 olarak kapsama dahil edildi.

**Niye söz değiştirildi:** Tur B-1 mektubu 4 atomdu, mimar middleware'i Tur A'da kontrol etmemişti. Ancak mektup açıkça "OG image PNG değil → DUR + raporla" dedi — Claude Code disipline uydu, mimara döndü, Mehmet Bey yazılı onayı ile B5 atomu eklendi (Madde 17.5 son söz).

**Alternatif (seçilmedi):** B1+B3+B4 commit, B2'yi ayrı turda kapatma — tur disiplini açısından doğru ama momentum kaybı + B2 dosyası ortada kalırdı.

**Mimar:** Claude Opus 4.7 (TUR #43 B5, 30 Nisan 2026 gece yarısı sonrası)
**Onay:** Mehmet Dinç (yazılı — "Mimar onayı: Seçenek A. B5 atomu uygula, 5 atom toplu commit/push, production doğrula.")
**Disiplin:** Madde 4, Madde 6 (DUR şartı), Madde 17.5

---

## 1 Mayıs 2026 — TUR #43 Tur B-2 SEO Anlam Katmanı (5 atom)

### Karar 5: JSON-LD Ortak Component (DRY + 4 Schema Factory)

**Bağlam:** Tur A'da JSON-LD sıfır tespit edildi — Google rich snippet, knowledge graph ve LegalService nis pazar görünürlüğü tamamen kapalı. Sayfa başına manuel `<script type="application/ld+json">` yazmak DRY ihlali ve kod tekrarı olurdu (her sayfada `JSON.stringify`, factory mantığı tekrarlanır).

**Karar:** `components/JsonLd.tsx` ortak server component oluşturuldu (122 satır). 4 type-safe factory:
- `organizationSchema()` — sirket bilgisi (root, tüm sayfalar)
- `websiteSchema()` — site adı + dil + publisher (root, tüm sayfalar)
- `legalServiceSchema({name, description, url, serviceType})` — niş landing'ler için
- `articleSchema({headline, description, url, datePublished, ...})` — blog detay için

`<JsonLd data={...} />` component'i tek obje veya obje dizisi kabul eder. Server component (SSR'da render olur, client hydration'a bağımlı değil — Google bot gördüğünde hazır).

**Alternatif (seçilmedi):** Sayfa başına manuel `<script>` enjeksiyonu — DRY ihlali, factory'ler her sayfada tekrar yazılırdı. JSON-LD'i client-side enjekte etmek — bot'lar SSR HTML'i çeker, JSON-LD görmez.

**Mimar:** Claude Opus 4.7 (TUR #43 B6, 1 Mayıs 2026)
**Onay:** Mehmet Dinç ("YAZ ORTAK")
**Disiplin:** Madde 4.5

---

### Karar 6: Anasayfa "use client" Tuzağı — Server Wrapper Pattern

**Bağlam:** Tur A'da anasayfa `app/(public)/page.tsx` `"use client"` directive'i nedeniyle kendi server-side `metadata` export edemediği tespit edildi. Anasayfa Tedbirge.ai'nin ana giriş noktası — Google'da generic "Tedbirge AI" başlığıyla görünüyordu, ana niş anahtar kelimeler (trafik kazası tazminatı, iş kazası) yansımıyordu. İki seçenek vardı: (a) Root layout metadata'yi anasayfa için optimize etmek (diğer sayfalar override ettiği için yetersiz), (b) Anasayfayı server wrapper + client component bölmesine ayırmak.

**Karar:** Server wrapper pattern (Seçenek b) seçildi:
- Mevcut `page.tsx` (905 satır client kod) → `HomePageClient.tsx` rename, sadece `export default function PublicHomePage` → `HomePageClient` adı değişti, JSX/hooks/motion/state aynen korundu
- Yeni `page.tsx` (23 satır server component) — anasayfa-özel metadata (title "Trafik ve İş Kazası Tazminat Yönetim Platformu", description keyword-rich, canonical, openGraph) + `<HomePageClient />` render

**Sonuç:** Production'da anasayfa başlığı `Trafik ve İş Kazası Tazminat Yönetim Platformu | Tedbirge AI` (template `%s | Tedbirge AI` çalıştı), canonical doğru, content render olmaya devam ediyor.

**Risk:** Anasayfa ana giriş noktası, refactor regresyonu görünür ve maliyetli. Lokal smoke test (HTTP 200, hero metni HTML'de var) + production kanıtı ile doğrulandı.

**Alternatif (seçilmedi):** Root layout metadata'yı anasayfa için optimize — diğer sayfalar (niş landing, blog) kendi metadata'larıyla override eder, anasayfa-özel keyword'ler diğerlerine bulaşırdı.

**Mimar:** Claude Opus 4.7 (TUR #43 B9, 1 Mayıs 2026)
**Onay:** Mehmet Dinç ("YAZ ORTAK", görsel kontrol Mehmet Bey'in tarayıcıda doğrulamasıyla)
**Disiplin:** Madde 4.2 (atom seviyesi), Madde 17.5

---

### Karar 7: Next.js Metadata Merge — og:image Manuel Referans (Ek Atom B10)

**Bağlam:** B9 anasayfa metadata'sı `openGraph: {title, description, url, type}` tanımladığında Tur B-1'de Next.js `app/opengraph-image.tsx` convention'undan otomatik gelen `og:image` ve `twitter:image` **kayboldu**. Lokal smoke test yakaladı.

**Kök sebep:** Next.js metadata merge davranışı — child `openGraph` objesi parent'ı **kısmi merge etmez**, override ettiğinde tüm sub-fields override edilir. Yani `images` belirtmezsen kalıtım almaz, **sıfır gelir**.

**Karar:** B10 ek atomu olarak (Mehmet Bey yazılı onay — "Seçenek A genişletilmiş") og:image regresyonu fixlendi. 5 dosyada manuel `openGraph.images: ["/opengraph-image"]` + `twitter.images` referansı eklendi:
- `app/(public)/page.tsx` (anasayfa)
- 3 niş landing
- `app/(public)/blog/[slug]/page.tsx` generateMetadata

`/opengraph-image` relative path — `metadataBase` (Tur B-1) sayesinde absolute URL üretildi.

**Niye söz değiştirildi:** Tur B-2 mektubu B9 metadata'sında `openGraph.images` belirtmedi — mimar Next.js merge davranışını atladı. Mehmet Bey yazılı onayı ile B10 atomu eklendi (Madde 17.5 son söz).

**Alternatif (seçilmedi):** Anasayfa `openGraph` objesini tamamen kaldırıp root inheritance — anasayfa-özel og:title/description (anasayfa için ana kazanım) kayıp olurdu.

**Mimar:** Claude Opus 4.7 (TUR #43 B10, 1 Mayıs 2026)
**Onay:** Mehmet Dinç (yazılı — "Mimar onayı: Seçenek A genişletilmiş. B9 og:image fix + B10 atomu (niş landing 3 + blog detay 1 = 4 dosya).")
**Disiplin:** Madde 4, Madde 6 (DUR şartı), Madde 17.5

---

## 1 Mayıs 2026 — TUR #44.1 Motion Altyapı (7 atom)

### Karar 8: Yazılım Altyapı — Senaryo 1 (mevcut framer-motion v12 + CSS, 0 ek paket)

**Bağlam:** Tur A keşfi 5 senaryo karşılaştırdı (mevcut+CSS, +Lottie, +GSAP, +three.js, +Motion One). Tedbirge'nin **dedicated tasarımcı YOK** — Lottie/Rive/Spline designer asset gerektirdiği için yasaklandı. GSAP framer-motion ile aynı projede iki motion sistemi karmaşası.

**Karar:** Senaryo 1 (mevcut framer-motion v12.38.0 + CSS @keyframes + globals.css motion tokens). 0 ek paket, bundle bütçe sağlam, Linear.app/Framer.com çıtası bu altyapıyla erişilebilir.

**Alternatif (seçilmedi):**
- Senaryo 3 (GSAP) — sadece TUR #44.3-A6 cinematic scroll için ek karar gereği açılabilir (henüz gerek yok)
- Lottie/Rive — designer YOK, asset üretemez

**Mimar:** Claude Opus 4.7 (TUR #44 Tur A, 1 Mayıs 2026)
**Onay:** Mehmet Dinç ("YAZ ORTAK")
**Disiplin:** Madde 4.5

---

### Karar 9: Reveal Pattern — useInView + Explicit Animate State (whileInView Yerine)

**Bağlam:** A5 ilk sürümü `whileInView="visible"` prop'u kullandı. Production smoke test ve Mehmet Bey görsel doğrulamada animasyon hiç tetiklenmedi — HTML kaynağında 4 section `opacity:0;transform:translateY(28px)` initial state'te dondu.

**Kök sebep:** Framer Motion v12'de variant key propagation parent-to-child geçer. Public layout `<motion.div key={pathname} initial="initial" animate="animate">` page transition wrapper'ı Reveal child'larının `initial="hidden"/whileInView="visible"` variant key'leriyle çakıştı — string-key collision IntersectionObserver tetiklenmesini boğdu.

**Karar:** Reveal.tsx **clean rewrite** — `whileInView` prop'u tamamen kaldırıldı, yerine `useInView` hook + `useEffect` + lokal `shouldAnimate` state pattern. `animate={shouldAnimate ? "visible" : "hidden"}` conditional string ile variant propagation atlandı, Reveal izole çalışıyor.

**Pattern detayı:**
- `useRef<HTMLElement>` + `useInView(ref, { once, amount })` IO observer
- `useEffect` ile `isInView` true olunca `setShouldAnimate(true)`
- `forwardRef` + internal ref birleşimi (`setRefs` fonksiyonu) — dış consumer + IO ikisi birden ref kullanır
- Default `amount: 0.15` (0.2'den düşürüldü, tetikleme garantisi)
- `useReducedMotion` kısa devresi korundu

**Niye söz değiştirildi:** Tur B-1 mektubu `whileInView` pattern'i önerdi, mimar Framer Motion v12 variant propagation davranışını öngöremedi. Mehmet Bey görsel doğrulamada hata yakalandı, A5-fix ek mektubuyla refactor uygulandı (Madde 17.5 son söz).

**Mimari öğrenme — TUR #44.x boyunca standart:** Scroll-triggered Reveal/animation component'leri **explicit useInView + state** pattern kullanır, `whileInView` prop'u yasak. Bu kuralı TUR #44.2 yaygınlaştırma + #44.3 cinematic scroll boyunca uygulanır.

**Alternatif (seçilmedi):** Page transition wrapper'ı public layout'tan kaldırma — TUR #43'te kazanılan smooth route transition'ı kaybetmek pahalı.

**Mimar:** Claude Opus 4.7 (TUR #44.1 A5-fix, 1 Mayıs 2026)
**Onay:** Mehmet Dinç (yazılı — "Mimar onayı: yumuşak şekilde geliyor 4 bölüm. Mektup §5 commit + push + production verify aşamalarına geç.")
**Disiplin:** Madde 4 (kanıt), Madde 6 (DUR şartı — görsel doğrulamada animasyon yokken durduk), Madde 17.5

---

### Karar 10: components/ui/ Klasörü + forwardRef Pattern Başlatma

**Bağlam:** Tur A KN-10 bulgusu: forwardRef kullanımı **0** (sıfır), `components/ui/` klasörü YOK, shadcn/ui veya Radix UI yok. Yeni motion ekleyince **wrapper cehennemi riski**.

**Karar:** TUR #44.1'de `components/ui/` klasörü kuruldu (shadcn/ui pattern'in Tedbirge başlangıcı). 3 dosya forwardRef ile yazıldı:
- `Reveal.tsx` (forwardRef<HTMLElement>, polymorphic `as` prop)
- `MotionButton.tsx` (forwardRef<HTMLButtonElement>, emphasis prop)
- `MotionCard.tsx` (forwardRef<HTMLDivElement>, emphasis prop)

**Pattern standardı:**
- Her component `"use client"` directive
- Her component `useReducedMotion()` ile JS düzeyinde respect (CSS @media + MotionConfig + hook = 3 katmanlı)
- Tüm motion token'lar `lib/motion.ts`'ten import — magic number YASAK
- forwardRef tüm yeni motion component'lerde zorunlu

**Alternatif (seçilmedi):** shadcn/ui ekleme — Tedbirge için aşırı (Radix UI ekosistem yok), motion-spesifik component'ler doğrudan yeterli.

**Mimar:** Claude Opus 4.7 (TUR #44.1 A5+A6, 1 Mayıs 2026)
**Onay:** Mehmet Dinç ("YAZ ORTAK")
**Disiplin:** Madde 4.5

---

## 1 Mayıs 2026 (gece geç) — TUR #44 BÜYÜK KAPANIŞ: Hareket Disiplini

### Karar 11: TUR #44.2 ve #44.3 Birleştirme — "Tek Mektup Uçtan Uca" Pattern

**Bağlam:** TUR #44.1 kapandıktan sonra mimar TUR #44.2 (yaygınlaştırma) ve TUR #44.3 (cinematic) için ayrı mektuplar planlamıştı. Mehmet Bey TUR #44.2 mektubunu uygulayıp 5 sayfa görsel onayı verdi (A4), sonra A8 anasayfa hero için Claude Code "atlama" kararı verdi → A10 tek görsel onay durağında "hero zaten yeterince güzeldi" tartışıldı. Mehmet Bey CEO disiplini ile **"Tur 44.2 ve 44.3'ü birleştir, tek mektup, tek onay"** direktifini verdi.

**Karar:** TUR #44.2 (yaygınlaştırma kalan atomları: A8+A9 anasayfa) ve TUR #44.3 (cinematic) **tek birleşik mektupla** uçtan uca uygulandı. Atom başına Mehmet Bey görsel onayı **kaldırıldı** — tek nokta sonu görsel onay. Mevcut working tree (TUR #44.2 A1-A7 zaten yapılmış, 11 dosya commit'siz) **korundu**, üzerine cinematic katman (C1-C8 atomları + C9 son rötuş) eklendi.

**Atomlar:**
- C1: lib/motion.ts cinematic genişleme (EASE_CINEMATIC, EASE_MAGNETIC, HERO_TIMING, heroWordCinematic, heroBadgeVariants, heroSubtitleVariants, heroCtaVariants, HOVER_SCALE_V2, HOVER_GLOW_*)
- C2+C8: globals.css cinematic CSS class'ları (.tedbirge-hero-bg + .tedbirge-hero-highlight + .tedbirge-cta-cinematic + .tedbirge-social-icon + .tedbirge-cta-pulse + 3 @keyframes)
- C3: Anasayfa hero refactor — section tedbirge-hero-bg, başlıklar kelime kelime heroWordCinematic (6 kelime), "Zeka" tedbirge-hero-highlight, alt yazı + CTA grup variant'lar, butonlar tedbirge-cta-cinematic + accent + pulse
- C4: Sosyal medya iconları motion.a → a + tedbirge-social-icon (CSS class scale+rotate+color)
- C5 atlandı (section akış zaten Reveal/SectionReveal akışkan)
- C6: HomePageClient HOVER_SCALE → HOVER_SCALE_V2 (eski import kaldırıldı)
- C7: MotionButton/MotionCard glow prop + cinematic emphasis (geriye uyumlu)
- C9 son rötuş: hidden state yumuşatma (Mehmet Bey Ctrl+Shift+R "donmuş ekran" geri bildirimine yanıt)

**Alternatif (seçilmedi):** Atom başına ayrı mektup + ayrı görsel onay (mektup mimar tasarımı). Atom başına test sürdürülebilir değildi — Mehmet Bey CEO yorumuyla doğru.

**Sonuç:**
- Anasayfa hero 2.2sn cinematic akış (badge → kelime stagger → highlight sweep → alt başlık → CTA + pulse)
- 9 sayfada Reveal yaygın
- Hover scale v2 (1.08) + glow (lacivert/yeşil) + magnetic (sosyal icon)
- prefers-reduced-motion 3 katmanlı respect

**Mimari öğrenme — "tek mektup uçtan uca" pattern (gelecek büyük kesitlerde standart):**
Büyük kesitlerde CEO disiplini için atom başına onay yerine **tek görsel onay noktası**. Mimar tüm atomları tek mektupta tarif eder, Claude Code uçtan uca uygular, Mehmet Bey **bir kez** bakar, commit kararı verir. Risk: mektup içinde yanlış varsayımlar varsa kapsam patlar. Karşı tedbir: mektup öncesi mevcut working tree açıkça not edilir, varsayımlar görünür yapılır, Claude Code mevcut yapıya uyum sağlama yetkisi verilir (örn variant ismi farklı ise gerçek ismi kullan).

**Mimar:** Claude Opus 4.7 (TUR #44.2+44.3 birleşik + C9, 1 Mayıs 2026 gece — gece yarısı sonrası)
**Onay:** Mehmet Dinç ("Mimar tavsiyesi C — Tur 44.2 ve 44.3 birleştir, tek mektup, tek onay" + "güzel olmuş" + C9 sonrası "muazzam — toplu commit talimatı")
**Disiplin:** Madde 4 (atom + kanıt), Madde 17.4 (yarım kesit yasağı — birleşik tek tur), Madde 17.5 son söz, Madde 18.4 yeşil nokta

---

### Karar 12: Soft Hidden State Pattern (C9 — SSR + Cache'siz Hydrate UX)

**Bağlam:** TUR #44.2+44.3 cinematic uygulandıktan sonra Mehmet Bey Ctrl+Shift+R yenileme sonrası ekran görüntüsü gönderdi: "Tazminat Hakkınızı" başlığı opacity:0 + blur(8px) → kayıp gibi, badge bulanık, CTA tek. F5 normal yenilemede sorun yok. Sebep: Ctrl+Shift+R cache temizler → JS bundle yeniden indirilir → server-render HTML hidden state hydrate olana kadar 1-2 sn donmuş bulanık ekran.

**Problem:** Production'da yavaş internet ilk kullanıcısı → "bozuk site" izlenimi.

**Karar:** Hidden state'leri yumuşat:
- `heroWordCinematic.hidden`: opacity 0 → 0.35, y 24 → 18, blur 8px → 4px
- `heroBadgeVariants.hidden`: opacity 0 → 0.4, y 10 → 6, scale 0.95 → 0.97
- `heroSubtitleVariants.hidden`: opacity 0 → 0.3, y 16 → 10
- `heroCtaVariants.hidden`: opacity 0 → 0.4, y 20 → 12, scale 0.96 → 0.98
- `.tedbirge-hero-highlight::after`: scaleX 0 → 0.15 + opacity 0.5 (animasyon sonu opacity 1)

**Sonuç:** Donmuş bile olsa "yarı görünür bulanık" hisseder — "kayıp" değil "yumuşakça beliriyor". `visible` state'leri **dokunulmadı** (animasyon nihai sonuç aynı).

**Alternatif (seçilmedi):** opacity:0 başlangıçta tutmak — cache'siz ilk render UX bozuk. Cinematic blur(8px) tutmak — donmuş ekran daha bozuk hisseder.

**Mimari öğrenme — gelecek motion variant'larında standart:**
SSR + client hydrate gecikmesi kombinasyonunda motion variant'ların `hidden` state'leri **0 değil 0.3-0.4 opacity + minimum geometrik bozulma** olmalı. Bu pattern animasyon "kayıp" yerine "yumuşakça beliriyor" hisseder.

**Mimar:** Claude Opus 4.7 (TUR #44 C9, 1 Mayıs 2026 gece geç)
**Onay:** Mehmet Dinç (Ctrl+Shift+R ekran görüntüsü + mimar yumuşatma teklifi onayı)
**Disiplin:** Madde 4 (kanıt — gerçek kullanıcı geri bildirimi), Madde 17.5
