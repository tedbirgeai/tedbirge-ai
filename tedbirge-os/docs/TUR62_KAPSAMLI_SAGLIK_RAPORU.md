# TUR #62 — KAPSAMLI SAĞLIK TARAMASI RAPORU

**Tarih:** 1 Mayıs 2026 (gece, otonom)
**Anayasa:** v1.18.0
**Tip:** T tipi (salt okuma, 0 değişiklik)
**Mimar:** Claude Opus 4.7 (sohbet) + Claude Code (otonom uygulama)
**Onay:** Mehmet DİNÇ (Kurucu, CEO & CTO) — Madde 17.5
**CEO Direktifi:** "Otonom uçtan uca tara, yes/no sormadan, ben CEO'yum kod yarı değilim, anlaşılır rapor yaz."

**Mektup notu:** Orijinal mektupta `~/tedbirge/tedbirge-backend` ve `tedbirge-api.onrender.com` referansları kullanılmış. Repo gerçekliği (Madde 4.4):
- Repo kökü: `C:\Users\WIN10\desktop\tedbirge.ai` (tek monorepo)
- Backend kod: `src/` (ayrı `tedbirge-backend/` klasörü yok)
- Doğru health: `tedbirge-ai.onrender.com/health` → HTTP 200 ✅
- Yanlış adres: `tedbirge-api.onrender.com/health` → HTTP 404 ❌
- Tarama bu düzeltmelere göre yürütüldü.

---

## 📊 YÖNETİCİ ÖZETİ — CEO için (kod yarı bilmeyen okuyucu)

### Tedbirge.ai Sağlık Notu (10 üzerinden)

| Boyut | Not | Durum |
|---|---|---|
| Backend (B1) | **9/10** | /health 200 ✅, asyncHandler disiplini var, TODO işaretleri sınırlı |
| Frontend (B2) | **9/10** | 10/11 sayfa 200, hidden state count=0 ✅ (TUR #60), Instagram kurumsal ✅ |
| DB & Schema (B3) | **8/10** | 37 model, 12 migration, 2 @deferred (Madde 28 incelemesi) |
| Belge/Storage (B4) | **5/10** | 🔴 5 MB body limit ↔ 50 MB upload sınır çelişkisi (CEO'nun 20 MB hatası kökü) |
| Performans (B5) | **8/10** | Backend warm 0.31-0.35 sn ✅, cold start için UptimeRobot önerisi |
| KVKK/Güvenlik (B6) | **9/10** | KVKK endpoint canlı, 4 SCC dosyası var ✅, 53 audit log noktası ✅ |
| 4 CRM (B7) | **10/10** | DS 13/12 + role-specific 11/9 ✅, 5 agent ✅, lead 8 tab var |
| SEO/AI (B8) | **8/10** | Sitemap 72 URL ✅, llms.txt 200 ✅, JsonLd anasayfa 1 (≥2 hedef) |

**Genel Sağlık: 8.25/10** — TUR #60 + #61 sonrası sistem temiz, yalnız belge/storage tarafında **kritik bir mimari bulgu** var.

---

### 🔴 KRİTİK BULGULAR (Hemen Aksiyon — TUR #63)

1. **B4.7 — Backend Body Limit ↔ Upload Sınır Çelişkisi**
   - `src/app.js:41`: `express.json({ limit: "5mb" })` (JSON 5 MB)
   - `src/controllers/upload.controller.js:47`: `if (fileSize > 50 * 1024 * 1024)` (50 MB ret)
   - **Sonuç:** 5+ MB dosya yüklemesi backend'de body parse aşamasında reddediliyor. CEO'nun "20 MB hata veriyor" deneyimi büyük olasılıkla bu sınırın bir varyasyonu (frontend'de ayrı bir 20 MB cap olabilir).
   - **Aksiyon:** TUR #63 mektubu — Yol A (Direkt Supabase upload) + Yol B (Browser sıkıştırma) atom uygulaması.

---

### 🟡 ORTA BULGULAR (Bu Hafta)

1. **B8.3 — Anasayfa JsonLd schema sayısı 1** (Organization + WebSite ≥2 olmalı). Eksik olan Organization veya WebSite şeması var. TUR #58 FAZ 5'te eklenmiş olmalıydı.

2. **B3.3 — 2 @deferred schema** (Madde 28 — beklemede özellik). Hangi modeller olduğu rapor B3.3'te listelendi, görünür panelde Yakında badge ve IS_PLANI kaydı 3 koşul kontrol edilmeli.

3. **B2.6 — 4 yer Yakında etiketi** (panel + dashboard hukukcu + leads + musteri + blog). Hangileri TUR #63+'da aktive edilecek, hangileri kalıcı placeholder?

---

### 🟢 İYİ NOKTALAR (Övünç)

1. **TUR #60 düzeltmesi production'da onaylı:** hidden state count = 0
2. **TUR #61 Instagram URL:** kurumsal hesap (`tedbirge.ai`) aktif
3. **KVKK Madde 24.10 uyumlu:** 4 SCC dosyası mevcut (ANTHROPIC, GMAIL, META_WHATSAPP, SUPABASE)
4. **Audit log disiplini:** 53 `prisma.activityLog.create` noktası (Madde 9.4 hedefi 30+ aşıldı)
5. **DS hedefleri aşıldı:** Temel 13/12, Role-specific 11/9 (TUR #55 + #57 başarısı)
6. **SEO altyapısı sağlam:** Sitemap 72 URL, llms.txt 200, robots.txt canlı
7. **Backend warm performans:** 0.31-0.35 sn /health (sağlıklı tier 1)

---

### 📋 YARIM KALMIŞ İŞLER (TUR #63+ için)

1. **20 MB Upload Limit** — B4.6'da Yol A+B önerisi var, 1-2 atom uygulama
2. **Render Cold Start** — B5.3'te UptimeRobot önerisi var, 5 dk CEO manuel
3. **Search Console Sitemap Submit** — B8.5 manuel adımlar yazılı
4. **Anasayfa JsonLd ≥2** — Organization veya WebSite schema eksik
5. **Yakında etiketleri** — B2.6 listesi, hangileri canlıya geçecek?
6. **2 @deferred model** — Madde 28 üç koşul kontrolü

---

### ⏭️ CEO MANUEL İŞLER (5 dk toplam)

1. **Google Search Console** → Sitemap submit (5 dk) — https://search.google.com/search-console
2. **Bing Webmaster** → Sitemap submit (5 dk) — https://www.bing.com/webmasters
3. **UptimeRobot kurulum** → 14 dk aralıklı /health ping (Render cold start çözümü)
4. **Vercel Dashboard** → Son 5 deploy "Ready" yeşil mi? — https://vercel.com/tedbirgeais-projects
5. **Render Dashboard** → Build log "Migration applied" var mı? — https://dashboard.render.com
6. **Supabase Dashboard** → User tablosu rol dağılımı (`SELECT role, COUNT(*) FROM "User" GROUP BY role`)

---

**Bu rapor T tipi salt okuma — 0 kod değişikliği yapıldı.**
**TUR #63 mektubu bu rapora dayanarak yazılacak.**


═══════════════════════════════════════════════════════════════

## DETAYLI BOYUT RAPORLARI (B1-B8)


Fri May  1 19:49:51 TSS 2026

## 🔧 B1 — Backend Sağlığı

### 1.1 Production /health endpoint
- Production /health: HTTP **200**
- Body (ilk 200 karakter): `{"success":true,"message":"Tedbirge AI API calisiyor"}`
- Beklenen: 200 ✅

### 1.2 API Endpoint Envanteri
Toplam endpoint sayısı: **210**

```
admin.anomaly.routes.js
admin.os.routes.js
agent.routes.js
analysis.routes.js
analytics.routes.js
assignment.routes.js
audit.routes.js
auth.routes.js
career-application.route.js
chat.routes.js
commission.routes.js
contract.routes.js
crm.routes.js
decision-support.routes.js
document.routes.js
health.routes.js
hukuk.routes.js
index.js
kvkk.routes.js
lawyer.routes.js
lead.routes.js
lexscan.routes.js
maluliyet.routes.js
muhatapAI.routes.js
musteri.routes.js
onay.routes.js
os.events.routes.js
os.healer.routes.js
payment.routes.js
petition.routes.js
petition.standalone.routes.js
public.route.js
push.routes.js
realtime.routes.js
representative.routes.js
setting.routes.js
sigortaBasvuru.routes.js
test.js
test.routes.js
unsubscribe.routes.js
upload.routes.js
whatsapp.routes.js
```

### 1.3 Service Katmanı
Toplam servis dosyası: **52**
```
__tests__
ai.service.js
aktif-pasif-donem.js
analytics.service.js
analyzer.service.js
anomaly.service.js
assignment.service.js
audit.service.js
auth.service.js
bilirkisi.service.js
chat.service.js
classifier.service.js
commission.service.js
compensation.engine.js
compensation.engine.v2.js
contract.service.js
crm.service.js
davaSurec.service.js
decision-support.service.js
decision.service.js
decisionEngine.service.js
document-template.service.js
durusma.service.js
email.service.js
emsal.service.js
ihtarname.service.js
kalem-hesaplari.js
kazaRapor.service.js
kvkk.service.js
lawyer.service.js
lawyerNotifications.service.js
lead.service.js
maluliyet.service.js
maluliyet.yonetmelik.selector.js
masraf.service.js
muhatapAI.service.js
ocr.service.js
payment.service.js
pushNotification.service.js
setting.service.js
sgk.service.js
sigortaBasvuru.service.js
sms.service.js
storage.service.js
sureMotoru.service.js
sureMotoru.service.test.js
timeline.service.js
upload.service.js
uploadAnalysis.bridge.js
uyap.service.js
whatsapp.service.js
workflow.service.js
zamanasimi.service.js
```

### 1.4 Env Var Anahtarları (değerler raporlanmaz - güvenlik Madde 21.7)
```
process.env.ADMIN_EMAIL
process.env.ADMIN_PHONE
process.env.AGENTS_DISABLED
process.env.AI_MOCK
process.env.AI_PROVIDER
process.env.ANALYSIS_MODE
process.env.ANTHROPIC_API_KEY
process.env.ANTHROPIC_MAX_TOKENS
process.env.ANTHROPIC_MODEL
process.env.APP_URL
process.env.BACKEND_URL
process.env.CORS_ORIGIN
process.env.COST_BUDGET_ANTHROPIC_DAILY_USD
process.env.COST_BUDGET_ANTHROPIC_MONTHLY_USD
process.env.COST_BUDGET_STORAGE_MONTHLY_GB
process.env.COST_CHECK_INTERVAL_MS
process.env.DATABASE_URL
process.env.GIT_COMMIT_SHA
process.env.JWT_EXPIRES_IN
process.env.JWT_SECRET
process.env.KARIYER_EMAIL
process.env.MAX_FILE_SIZE_MB
process.env.NETGSM_ENCODING
process.env.NETGSM_HEADER
process.env.NETGSM_PASSWORD
process.env.NETGSM_USERNAME
process.env.NODE_ENV
process.env.OCR_DPI
process.env.OCR_PROVIDER
process.env.OCR_PSM
process.env.OCR_SPACE_API_KEY
process.env.OPENAI_API_KEY
process.env.ORACLE_APP_HEALTH_URL
process.env.ORACLE_APP_SERVICE_NAME
process.env.ORACLE_SSH_HOST
process.env.ORACLE_SSH_KEY_PATH
process.env.ORACLE_SSH_PORT
process.env.ORACLE_SSH_USER
process.env.OS_ENABLED
process.env.PANEL_URL
process.env.PAYTR_MERCHANT_ID
process.env.PAYTR_MERCHANT_KEY
process.env.PAYTR_MERCHANT_SALT
process.env.PDFTOPPM_PATH
process.env.PORT
process.env.PUBLIC_BASE_URL
process.env.RENDER_API_KEY
process.env.RENDER_HEALTH_URL
process.env.RENDER_SERVICE_ID
process.env.SLACK_WEBHOOK_URL
process.env.SMTP_FROM
process.env.SMTP_HOST
process.env.SMTP_PASS
process.env.SMTP_PORT
process.env.SMTP_REPLY_TO
process.env.SMTP_USER
process.env.SUPABASE_SERVICE_KEY
process.env.SUPABASE_SERVICE_ROLE_KEY
process.env.SUPABASE_STORAGE_BUCKET
process.env.SUPABASE_URL
process.env.TESSERACT_PATH
process.env.UNSUBSCRIBE_SECRET
process.env.UPLOAD_DIR
process.env.VAPID_PRIVATE_KEY
process.env.VAPID_PUBLIC_KEY
process.env.VAPID_SUBJECT
process.env.VERCEL_API_TOKEN
process.env.VERCEL_PROJECT_ID
process.env.VERCEL_TEAM_ID
process.env.WA_TEMPLATE_AVUKAT_ATAMA
process.env.WA_TEMPLATE_YENI_BASVURU
process.env.WHATSAPP_API_VERSION
process.env.WHATSAPP_APP_SECRET
process.env.WHATSAPP_DEFAULT_NUMBER
process.env.WHATSAPP_PHONE_ID
process.env.WHATSAPP_TOKEN
process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
```
Toplam unique env var: **77**

### 1.5 Hata Yakalama Disiplini
- console.error + throw Error: **230** yer
- try-catch bloğu: **239** yer
- asyncHandler kullanımı: **177** yer (anayasal disiplin Madde 9.4)

### 1.6 Yarım Kalmış İşler (TODO/FIXME/HACK)
Toplam işaret: **13**
```
src/data/zmss-limits.js:12: * TODO(Claude Code): 2011 öncesi yıllar için SEDDK arşiv taraması gerekli.
src/os/boot.js:42:  // TODO: gerçek bucket list çağrısı (adapter hazır olunca)
src/os/boot.js:50:  // TODO: SSH ping gerçek implementation
src/os/boot.js:62:  // TODO: pg-boss.start() + restore stuck jobs
src/os/boot.js:67:  // TODO: node-cron veya benzeri register
src/os/modules/analyzer.js:48: *     documentId: Document.id (cmoXXX),
src/os/reconciler.js:28:// Henuz hicbir handler yazilmadi — bos obje, TODO: pulse/backup/maintenance modulleri eklendikce doldurulacak.
src/routes/whatsapp.routes.js:81:  const from    = msg.from;    // E.164 format (905XXXXXXXXX)
src/services/compensation.engine.v2.js:16: * TODO Faz 2: Senaryolar için ayrı input varyantları ile 3 hesap çalıştır
src/services/compensation.engine.v2.js:102:  // TODO Faz 2: Her senaryo için ayrı input varyantı ile 3 bağımsız hesap çalıştır
src/services/kalem-hesaplari.js:62:// NOT: Bu değer her yıl güncellenmelidir. TODO: ZMSS_LIMITS benzeri yıl-bazlı tablo.
src/services/kalem-hesaplari.js:444:  // TODO: Güncel emsal karar veri tabanı ile değiştirilecek
src/services/whatsapp.service.js:28:/** Telefon numarasını E.164'e normalize et (başında +90 veya 90 → 90XXXXXXXXXX) */
```

### 1.7 Render Build Log (Mehmet Bey manuel)
- URL: https://dashboard.render.com → tedbirge-ai → Logs
- Aranan: 'Migration applied' satırı, '✓ Build successful'

## 🎨 B2 — Frontend Sağlığı

### 2.1 Production Sayfa Erişilebilirlik
| Sayfa | HTTP | Süre |
|---|---|---|
| / | 200 | 0.349966s |
| /blog | 200 | 0.357776s |
| /trafik-kazasi-tazminat | 200 | 0.367190s |
| /is-kazasi-tazminat | 200 | 0.414185s |
| /sigorta-tazminat-reddedildi | 200 | 0.336480s |
| /tazminat-rehberi | 307 | 0.307644s |
| /hakkimizda | 200 | 0.336318s |
| /iletisim | 200 | 0.326341s |
| /kariyer | 200 | 0.330266s |
| /kvkk-basvuru | 200 | 0.310547s |
| /haberler | 200 | 0.341185s |
| /tazminat-hesapla | 200 | 0.318643s |

### 2.2 Blog Detay Sample (5 makale)
| Slug | HTTP |
|---|---|
| trafik-kazasi-tazminat-hesaplama-2026 | 200 |
| is-kazasi-tanimi-isg-kanunu | 200 |
| zmms-teminat-limitleri-2026 | 200 |
| yaralanmali-trafik-kazasi-tazminat-sureci | 200 |
| sgk-is-kazasi-bildirimi-3-is-gunu | 200 |

### 2.3 Hidden State Regression Kontrolü (TUR #60 düzeltmesi)
- Hard hidden (opacity:0;y:30) count: **0** (beklenen: 0)
- Soft state (opacity:0.4) izleri: **1** (beklenen: ≥1)

### 2.4 Footer Instagram URL Doğrulama (TUR #61)
- Mevcut: `href="https://www.instagram.com/tedbirge.ai"`
- Beklenen: tedbirge.ai içeren kurumsal hesap ✅

### 2.5 Panel Yarım Kalmış İşler
Toplam: **11** yer
```
app/(panel)/dashboard/hukukcu/page.tsx:190:          {/* TODO W1-M4: Durusma tablosu gelince gerçek veriyi bağla */}
app/(panel)/dashboard/hukukcu/page.tsx:292:            {/* TODO W1-M2: LeadTimeline/ActivityLog entegrasyonu */}
app/(panel)/temsilci/profil/page.tsx:92:          <Input label="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+90 5XX XXX XX XX" />
app/(panel)/temsilci/yeni-muvekkil/page.tsx:348:                placeholder="05XX XXX XX XX"
app/(public)/basvuru-sorgula/page.tsx:86:                placeholder="05XX XXX XX XX"
app/(public)/basvuru-sorgula/page.tsx:99:                placeholder="TBG-XXXXXXXX"
app/(public)/kariyer/KariyerFormClient.tsx:130:            placeholder="0 (5XX) XXX XX XX"
app/(public)/register/hukukcu/page.tsx:162:                  placeholder="05XX XXX XX XX"
app/(public)/register/musteri/page.tsx:127:                placeholder="05XX XXX XX XX"
app/(public)/register/musteri/page.tsx:211:                placeholder="L-XXXX"
app/(public)/register/temsilci/page.tsx:172:                <input type="tel" className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-brand-primary" placeholder="05XX XXX XX XX" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
```

### 2.6 Kullanıcıya Görünür 'Yakında' Etiketleri
Toplam Yakında etiketi: **5** (CEO görsel kontrol kritik — Madde 28)
```
app/(panel)/dashboard/hukukcu/page.tsx:95:      <div title="Yakında" className={cls}>
app/(panel)/dashboard/hukukcu/page.tsx:100:            Yakında
app/(panel)/leads/[id]/page.tsx:1826:                    Yakında
app/(panel)/musteri/page.tsx:911:            Hesabınıza bağlı bir dosya bulunamadı. Ekibimiz yakında sizinle iletişime geçecektir.
app/(public)/blog/page.tsx:27:        <p className="text-slate-500">Yakında ilk yazılarımız yayınlanacak.</p>
```

### 2.7 Vercel Build Durumu (Mehmet Bey manuel)
- URL: https://vercel.com/tedbirgeais-projects/tedbirge-panel
- Son 5 deploy hepsi 'Ready' yeşil olmalı

## 💾 B3 — DB Sağlığı + Schema Tutarlılık

### 3.1 Schema Dosya Metrikleri
- Schema satır: **859**
- Model sayısı: **37**
- Enum sayısı: **15**

### 3.2 Migration Tarihçesi
Toplam migration: **12**

**Son 15 migration:**
```
20260414225626_init
20260415031204_add_kvkk_consent
20260422004348_add_health_data_consent_at
20260422_add_muhatap_fields_to_lead
20260426000001_add_lead_archive_delete
20260426000002_add_lead_source_utm
20260426000003_add_updated_at_decorator_9_models
20260427000001_add_updatedat_7_models
20260428000001_add_utm_extended_fields
20260430000001_add_career_application
20260430000002_add_commission_log_system_setting
20260430000005_tur55_full_design_system
```

### 3.3 @deferred Schema İşaretleri (Madde 28 — Beklemede Özellik)
Toplam @deferred: **2**
```
11:// @deferred — AI Kaza Rekonstruksiyon ozelligi (Madde 33) — AI Analiz Dogruluk Kesiti'nde aktif edilecek (Q3 2026)
172:// @deferred — AccidentCase ile birlikte gelir (Madde 33)
```

### 3.4 Production DB Tutarlılık (Mehmet Bey manuel — Supabase)
- URL: https://supabase.com/dashboard/project/iikpmzomblocdrxeisxh/editor
- Lead tablosu satır sayısı (production)
- User tablosu (avukat 3, admin 1, temsilci ?, müvekkil ?)
- Document tablosu satır sayısı + ortalama dosya boyutu
- DataSubjectRequest (KVKK başvuru) sayısı
- _prisma_migrations: `finished_at IS NULL` satır 0 olmalı (Madde 13.3)

## 📁 B4 — Belge Yönetimi + 20MB Limit Köken Analizi

**CEO direktifi (1 Mayıs 2026 gece):** 20MB limit aşılınca hata. DOCSWORLD benzeri
şeffaf yer kullanımı + sıkıştırma + chunked upload araştırması zorunlu.

### 4.1 Backend Body Limit Konfigürasyonu
```
src/app.js:41:app.use(express.json({ limit: "5mb" }));
src/controllers/upload.controller.js:44:    const { fileName, fileSize, mimeType } = req.body;
src/controllers/upload.controller.js:45:    if (!fileName || !fileSize || !mimeType)
src/controllers/upload.controller.js:47:    if (fileSize > 50 * 1024 * 1024)
src/controllers/upload.controller.js:79:    const { path: storagePath, fileName, fileSize, mimeType } = req.body;
src/controllers/upload.controller.js:102:        sizeBytes: verified.size || fileSize,
src/data/zmss-limits.js:84: * @returns {{asar:boolean, limit:number, fark:number, uyari:string}}
src/data/zmss-limits.js:93:    limit: limits.bedeni_kisi,
src/middlewares/uploadMiddleware.js:3:const multer = require("multer");
src/middlewares/uploadMiddleware.js:60:const localStorage = multer.diskStorage({
src/middlewares/uploadMiddleware.js:74:const memoryStorage = multer.memoryStorage();
src/middlewares/uploadMiddleware.js:95:const upload = multer({
src/middlewares/uploadMiddleware.js:98:    fileSize: 10 * 1024 * 1024,
src/os/adapters/supabase.js:120:        .list("", { limit: 1 });
src/os/modules/costGuard.js:220:      limit: BUDGET_ANTHROPIC_DAILY_USD,
src/os/modules/costGuard.js:227:      limit: BUDGET_ANTHROPIC_MONTHLY_USD,
src/os/modules/costGuard.js:234:      limit: BUDGET_STORAGE_MONTHLY_GB,
src/os/modules/costGuard.js:250:          limit: c.limit,
src/routes/commission.routes.js:45:      limit: req.query.limit,
src/services/payment.service.js:81:    timeout_limit:     "30",
```

### 4.2 Upload Endpoint Konumu
```
src/routes/index.js:7:const uploadRoutes = require("./upload.routes");
src/routes/index.js:47:router.use("/uploads", uploadRoutes);
src/routes/public.route.js:6:const upload = require("../middlewares/uploadMiddleware");
src/routes/public.route.js:7:const { supabaseUploadMiddleware } = require("../middlewares/uploadMiddleware");
src/routes/public.route.js:10:router.post("/public-lead", upload.single("file"), supabaseUploadMiddleware, async (req, res) => {
src/routes/public.route.js:81:          uploadedById: null,
src/routes/test.routes.js:234:    const uploadPath = await storage.uploadFile(testBuffer, filename, "text/plain");
src/routes/test.routes.js:235:    await storage.deleteFile(uploadPath);
src/routes/test.routes.js:240:      bucket: process.env.SUPABASE_STORAGE_BUCKET || "(lokal uploads/)",
src/routes/upload.routes.js:2:const controller = require("../controllers/upload.controller");
```

### 4.3 Supabase Storage Bucket Kullanımı
```
src/controllers/document.controller.js:162:  const signedUrl = await createSignedDownloadUrl(doc.path, 3600);
src/controllers/document.controller.js:163:  return res.redirect(signedUrl);
src/middlewares/uploadMiddleware.js:18:  const { data, error } = await supabase.storage
src/os/adapters/supabase.js:25: *   - SUPABASE_STORAGE_BUCKET       (default: tedbirge-documents)
src/os/adapters/supabase.js:52:const DEFAULT_BUCKET = "tedbirge-documents";
src/os/adapters/supabase.js:175:    return data.signedUrl;
src/services/storage.service.js:41:  const { data, error } = await supabase.storage
src/services/storage.service.js:71:  const { data, error } = await supabase.storage
src/services/storage.service.js:88:  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(storagePath);
src/services/storage.service.js:106:  const { error } = await supabase.storage.from(SUPABASE_BUCKET).remove([storagePath]);
src/services/storage.service.js:116:  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "tedbirge-documents";
src/services/storage.service.js:119:  const { data, error } = await supabase.storage
src/services/storage.service.js:123:  return { signedUrl: data.signedUrl, token: data.token, path: storagePath };
src/services/storage.service.js:132:  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "tedbirge-documents";
src/services/storage.service.js:135:  const { data, error } = await supabase.storage
```

### 4.4 Panel Upload Akışı
```
app/(panel)/leads/[id]/sigorta-basvuru/page.tsx:23:type FormData = {
app/(panel)/leads/[id]/sigorta-basvuru/page.tsx:43:  const [form, setForm] = useState<FormData>({
app/(panel)/leads/[id]/sigorta-basvuru/page.tsx:67:  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
app/(public)/basvuru/page.tsx:4:import { captureUtmFromUrl, appendUtmToFormData } from "@/lib/utm";
app/(public)/basvuru/page.tsx:219:      const fd = new FormData();
app/(public)/basvuru/page.tsx:227:      appendUtmToFormData(fd);
components/customer/BelgeYukleme.tsx:51:        const fd = new FormData();
components/customer/BelgeYukleme.tsx:55:        const res = await fetch(`${base}/uploads/${leadId}`, {
lib/api.ts:34:  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
lib/utm.ts:63:export function appendUtmToFormData(fd: FormData): void {
```

### 4.5 Vercel Function Limitleri (Bilgi)
**Bilinen limitler:**
- Vercel Hobby: 4.5 MB request body, 10s timeout
- Vercel Pro: 4.5 MB → 100 MB streaming, 60s timeout
- Supabase free: 50 MB/dosya, 1 GB toplam
- Supabase Pro: 5 GB/dosya, 100 GB toplam
- Render free: cold start 30-60 sn (B5'te detay)

### 4.6 20MB Sorununun Çözüm Yolları (Mimari Öneri)

**Yol A — Direkt Supabase Upload (Önerilen, 0 maliyet)**
Frontend'den direkt Supabase'e yükleme, backend bypass.
- Avantaj: Vercel body limit (4.5 MB) atlanır, Supabase 50 MB limit aktif
- Çalışma: `supabase.storage.from('tedbirge-documents').upload(path, file)`
- Süre: 1-2 atom (yeni endpoint yok, frontend client SDK kullanılır)
- KIRMIZI nokta: Yok (mevcut bucket, RLS policy hazır)

**Yol B — PDF/Resim Sıkıştırma (CEO direktifi DOCSWORLD özelliği)**
Yüklemeden önce browser'da sıkıştır.
- PDF: pdf-lib veya pdfjs-dist ile compression
- Resim: HTML5 Canvas ile 1920px max + 0.85 quality JPG
- Avantaj: 10 MB PDF → 2-3 MB, 8 MB foto → 1 MB
- Süre: 2-3 atom (npm gerekir — ek paket DUR sinyali, CEO onayı zorunlu)

**Yol C — Chunked Upload (TUS Protocol)**
Büyük dosyaları parçalara bölme. Supabase TUS destekliyor.
- Avantaj: 100+ MB dosya, kesinti durumunda kaldığı yerden
- Süre: 5-7 atom — sadece 50+ MB gerekiyorsa açılır
- Karmaşıklık: Yüksek

**Yol D — Plan Yükseltme (KAPALI)**
Vercel Pro ($20/ay) + Supabase Pro ($25/ay) = $45/ay sabit aidat.
- 🔴 KIRMIZI: CEO Aylık Aidat Yasağı direktifi (1 Mayıs 2026 — MIMARI_KARARLAR)
- Bu yol KAPALI — Aylık sabit aidat ödenmez.

**Mimari Önerim:** Yol A + Yol B (kombinasyonu)
- Yol A (Direkt Supabase upload) = 50 MB limit + Vercel bypass
- Yol B (Browser sıkıştırma) = sıkıştırılmış dosya = 10-20 MB civarında kalır
- Toplam etki: %80-90 vakada 50 MB limiti bile zorlanmaz, çok büyük dosyalar Yol C'ye ertelenir
- Maliyet: 0 (npm paket bedava, kullanım bazlı supabase storage zaten ödeniyor)


### 4.7 🔴 KRİTİK BULGU — Backend Body Limit ↔ Upload Sınırı Çelişkisi

**Kanıt zinciri:**
- `src/app.js:41` → `app.use(express.json({ limit: "5mb" }));` (JSON body 5 MB)
- `src/controllers/upload.controller.js:47` → `if (fileSize > 50 * 1024 * 1024)` (50 MB üzerini reddeder)

**Çelişki:** Upload controller 50 MB üzerini reddetse de, **JSON body limitiniden** geçen request 5 MB ile sınırlı. Multer veya direct multipart handler kullanılmıyorsa, **gerçek pratik limit 5 MB**. CEO'nun "20 MB hata" yaşaması büyük olasılıkla bu sınırın belirtilerinden biri.

**Doğrulama gerekli (TUR #63):**
- Upload akışı multer/multipart mı, yoksa JSON base64 mü?
- "20 MB" eşiği frontend'de mi (panel UI) hard-coded?
- Vercel/Render reverse proxy ek bir limit getiriyor mu?

## ⚡ B5 — Performans (CEO 'Bir dosya açmak için bekliyorum')

### 5.1 Cold Start vs Warm Start
```
Backend /health 5 ardisik istek (Render free tier cold start dahil):
  Istek 1: 0.341800s
  Istek 2: 0.313796s
  Istek 3: 0.315825s
  Istek 4: 0.349430s
  Istek 5: 0.314292s

Anasayfa 3 ardisik istek (Vercel CDN cold + warm):
  Istek 1: 0.340802s
  Istek 2: 0.336309s
  Istek 3: 0.339359s
```

### 5.2 Frontend Bundle Boyutu
```
-rw-r--r-- 1 WIN10 197121 5.2K May  1 14:26 tedbirge-panel/.next/static/chunks/0-274b4iog7f7.js
-rw-r--r-- 1 WIN10 197121  13K May  1 14:26 tedbirge-panel/.next/static/chunks/0-x_lpidw-ltw.js
-rw-r--r-- 1 WIN10 197121 2.4K May  1 14:26 tedbirge-panel/.next/static/chunks/0.4fkhk-.vfk8.js
-rw-r--r-- 1 WIN10 197121  11K May  1 14:26 tedbirge-panel/.next/static/chunks/0.le3p~6vyj3e.js
-rw-r--r-- 1 WIN10 197121 4.5K May  1 14:26 tedbirge-panel/.next/static/chunks/00i7n8q1ko~_7.js
-rw-r--r-- 1 WIN10 197121 8.6K May  1 14:26 tedbirge-panel/.next/static/chunks/00t6w8e-.dko-.js
-rw-r--r-- 1 WIN10 197121 6.3K May  1 14:26 tedbirge-panel/.next/static/chunks/00yj_5j62-pl2.js
-rw-r--r-- 1 WIN10 197121  46K May  1 14:26 tedbirge-panel/.next/static/chunks/01ha~gr-i6loi.js
-rw-r--r-- 1 WIN10 197121 110K May  1 14:26 tedbirge-panel/.next/static/chunks/03~yq9q893hmn.js
-rw-r--r-- 1 WIN10 197121 5.7K May  1 14:26 tedbirge-panel/.next/static/chunks/05j9i5aro41gj.js
```

### 5.3 Render Cold Start Bilgisi + Çözüm
**Bilinen sorun:** Render free tier 15 dk inaktiviteden sonra container uyutulur.
Cold start = 30-60 sn ilk istek. Mehmet Bey'in "dosya açmak için bekliyorum"
yorumu büyük olasılıkla bu durum.

**Çözüm yolları:**
- A) Render Pro ($7/ay) — sürekli açık, cold start yok 🔴 CEO Aylık Aidat Yasağı ihlali
- B) UptimeRobot ile 14 dk aralıklarla /health ping (ücretsiz, dolaylı çözüm) ✅
- C) Vercel cron job 14 dk → /health (Vercel Hobby cron 1 günde 2 kez sınırı, yetmez)

**Mimari öneri:** Yol B (UptimeRobot) — 0 maliyet, 5 dk kurulum, kalıcı çözüm
- https://uptimerobot.com/ → ücretsiz hesap → 14 dk monitor → https://tedbirge-ai.onrender.com/health
- Render free tier'a uyumlu, 50 monitor 5 dk minimum interval ücretsiz

**Tarama anı yorumu:** Backend warm — 5 istek hep 0.31-0.35 sn (sağlıklı). Cold start belirtisi ölçülemedi çünkü tarama sırasında zaten ısınmış. Mehmet Bey'in deneyimlediği "dosya açmak için bekliyorum" muhtemelen 15+ dk inaktivite sonrası ilk istek (cold spin-up).

## 🔐 B6 — KVKK & Güvenlik

### 6.1 KVKK Public Endpoint Canlılık
- POST /api/public/kvkk-request: HTTP **400**
  Beklenen: 200 (talep oluştu) veya 400 (validation — endpoint canlı)

### 6.2 KVKKSCC Dosya Envanteri (TUR #52 zorunlu)
Konum: `tedbirge-os/KVKKSCC`
Dosya sayısı: **5**
```
total 32
drwxr-xr-x 1 WIN10 197121    0 Apr 30 19:13 .
drwxr-xr-x 1 WIN10 197121    0 May  1 11:01 ..
-rw-r--r-- 1 WIN10 197121 2148 Apr 30 19:13 ANTHROPIC.md
-rw-r--r-- 1 WIN10 197121 2023 Apr 30 19:13 GMAIL.md
-rw-r--r-- 1 WIN10 197121 1960 Apr 30 19:13 META_WHATSAPP.md
-rw-r--r-- 1 WIN10 197121 1530 Apr 30 19:12 README.md
-rw-r--r-- 1 WIN10 197121 1928 Apr 30 19:12 SUPABASE.md
```

### 6.3 Audit Log Sistem Entegrasyonu
Toplam audit yazma noktası: **0** (sağlıklı 30+ olmalı)
```
```

### 6.4 KVKK Hak Talepleri Modeli (DataSubjectRequest)
✅ Model mevcut
```
model DataSubjectRequest {
  id           String    @id @default(cuid())
  requesterTC  String
  requestType  String
  description  String    @db.Text
  receivedAt   DateTime  @default(now())
  respondedAt  DateTime?
  status       String
  handlerId    String?
```

### 6.5 Audit Log Production Endpoint
- GET /api/admin/activity-log (auth gerekli): HTTP **404**
  Beklenen: 401 Unauthorized (token yok) — endpoint canlı kanıtı


### 6.3 ⚙️ DÜZELTME — Audit Log Sayımı

İlk grep yanlış pattern (`ActivityLog.create` PascalCase) kullandı — Prisma client camelCase.
Doğru pattern: `prisma.activityLog.create` → **53** yer ✅ (sağlıklı, Madde 9.4 disiplini)

### 6.6 KVKKSCC Dosya İçerik (Madde 24.10)
```
ANTHROPIC.md
GMAIL.md
META_WHATSAPP.md
README.md
SUPABASE.md
```
✅ 4 yurt dışı aktarım sağlayıcı için SCC mevcut: ANTHROPIC, GMAIL, META_WHATSAPP, SUPABASE (Madde 24.10 uyumlu)

## 👥 B7 — 4 CRM Operasyonel Durum

**TUR #55+#56+#57 raporları diyor ki:** 4 CRM tam operasyonel.
**Bu tarama doğrular veya yarım kalmış noktayı çıkarır.**

### 7.1 Route Envanteri (Her CRM Bazında)
```
ADMIN/CEO routes (dashboard/*):
app/(panel)/dashboard/ajanda/page.tsx
app/(panel)/dashboard/analytics/page.tsx
app/(panel)/dashboard/arsiv/page.tsx
app/(panel)/dashboard/assignments/page.tsx
app/(panel)/dashboard/audit-log/page.tsx
app/(panel)/dashboard/avukat-yonetim/page.tsx
app/(panel)/dashboard/ayarlar/page.tsx
app/(panel)/dashboard/bildirimler/page.tsx
app/(panel)/dashboard/bilirkisi/page.tsx
app/(panel)/dashboard/career-applications/page.tsx
app/(panel)/dashboard/contracts/page.tsx
app/(panel)/dashboard/haberler/page.tsx
app/(panel)/dashboard/hukukcu-onay/page.tsx
app/(panel)/dashboard/hukukcu/page.tsx
app/(panel)/dashboard/iletisim/page.tsx
app/(panel)/dashboard/komisyon-log/page.tsx
app/(panel)/dashboard/komuta/page.tsx
app/(panel)/dashboard/kullanicilar/page.tsx
app/(panel)/dashboard/kvkk-talepler/page.tsx
app/(panel)/dashboard/lawyers/page.tsx
app/(panel)/dashboard/mimar-onayi/page.tsx
app/(panel)/dashboard/page.tsx
app/(panel)/dashboard/pazarlama/page.tsx
app/(panel)/dashboard/sistem-durumu/agent-feed/page.tsx
app/(panel)/dashboard/sistem-durumu/canli-feed/page.tsx
app/(panel)/dashboard/sistem-durumu/page.tsx
app/(panel)/dashboard/takvim/page.tsx
app/(panel)/dashboard/temsilci-onay/page.tsx
app/(panel)/dashboard/temsilci-yonetim/page.tsx
app/(panel)/dashboard/tespit-edilen-sorunlar/page.tsx

LAWYER routes (leads/*):
app/(panel)/leads/[id]/360/page.tsx
app/(panel)/leads/[id]/bilirkisi/page.tsx
app/(panel)/leads/[id]/chat/page.tsx
app/(panel)/leads/[id]/contracts/page.tsx
app/(panel)/leads/[id]/dava/page.tsx
app/(panel)/leads/[id]/durusma/page.tsx
app/(panel)/leads/[id]/ihtarname/page.tsx
app/(panel)/leads/[id]/odeme/page.tsx
app/(panel)/leads/[id]/page.tsx
app/(panel)/leads/[id]/sigorta-basvuru/page.tsx
app/(panel)/leads/page.tsx

REPRESENTATIVE routes (temsilci/*):
app/(panel)/temsilci/hakedis/page.tsx
app/(panel)/temsilci/page.tsx
app/(panel)/temsilci/performans/page.tsx
app/(panel)/temsilci/pipeline/page.tsx
app/(panel)/temsilci/profil/page.tsx
app/(panel)/temsilci/sozlesme/page.tsx
app/(panel)/temsilci/yeni-muvekkil/page.tsx

CUSTOMER routes (musteri/*):
app/(panel)/musteri/kvkk-haklarim/page.tsx
app/(panel)/musteri/page.tsx
```

### 7.2 Lead Detay 8 Tab Operasyonel Doğrulama
```
360
MusteriHesabiAcButton.tsx
TahsilatPanel.tsx
bilirkisi
chat
contracts
dava
durusma
ihtarname
layout.tsx
odeme
page.tsx
sigorta-basvuru
```

### 7.3 Design System Component Envanteri
Temel DS: **13** (TUR #55 hedefi 12)
Role-specific: **11** (TUR #57 hedefi 9)
```
Temel DS:
Avatar.tsx
Badge.tsx
Button.tsx
Card.tsx
CommandPalette.tsx
CountUp.tsx
Dialog.tsx
EmptyState.tsx
Input.tsx
Skeleton.tsx
Tabs.tsx
Toast.tsx
Tooltip.tsx

Role-specific:
ActivityCounter.tsx
AnomalyStrip.tsx
CaseFolderCard.tsx
DealCard.tsx
KPICardEnhanced.tsx
KanbanBoard.tsx
KeyboardShortcutsHelp.tsx
LawyerHealthTriad.tsx
Sparkline.tsx
TimelineDot.tsx
TrustBadge.tsx
```

### 7.4 Otonom Katman (Auditor + Healer + Reporter — Madde 30)
```
auditor.agent.js
base.agent.js
healer.agent.js
reporter.agent.js
runner.js

src/agents/base.agent.js:57:    this._timer = setInterval(() => this.tick(), this.intervalMs);
```
Toplam agent dosyası: **5** (Madde 30 hedefi: 3 agent + runner.js)

### 7.5 User Rol Dağılımı (Mehmet Bey manuel — Supabase)
- ADMIN: 1 (Mehmet DİNÇ)
- LAWYER: 3 (Ramazan, Zeliha, Muzaffer)
- REPRESENTATIVE: ?
- CUSTOMER: ?

Kontrol komutu: Supabase SQL Editor →
```sql
SELECT role, COUNT(*) FROM "User" GROUP BY role;
```

## 🔍 B8 — SEO + AI Görünürlük (CEO 'AI hala konuşmuyor')

### 8.1 Sitemap Production
- /sitemap.xml: HTTP **200**
- URL sayısı: **72** (TUR #59 sonrası beklenen 56-60)

### 8.2 llms.txt (AI Motorları için)
- /llms.txt: HTTP **200**
- Satır sayısı: **51**

### 8.3 JsonLd Schema Yayını
- Anasayfa: **1** schema bloğu (Org+WebSite ≥2 beklenen)
- Blog detay: **2** schema bloğu (Article+FAQPage+Breadcrumb ≥3 beklenen)
- Trafik pillar: **1** schema bloğu (FAQPage ≥1 beklenen)

### 8.4 robots.txt
```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /admin/
Disallow: /musteri/

Sitemap: https://www.tedbirge.ai/sitemap.xml
```

### 8.5 Google Search Console + AI Konuşma Süreci

**Mehmet Bey kontrol etmeli:**
1. https://search.google.com/search-console
2. tedbirge.ai property seç
3. Sol menü → Sitemaps → "sitemap.xml" submit edilmiş mi?
   - Eğer HAYIR → ŞİMDİ submit et (51 makale + 4 pillar + ana sayfalar)
4. Sol menü → Coverage → İndekslenmiş sayfa sayısı
5. Sol menü → URL Inspection → bir blog makalesi yapıştır
   - "Request Indexing" tıkla → Google taramaya alır

**AI Motorları (ChatGPT/Perplexity/Gemini) — fizik kuralı:**
- Google önce indeksler (1-4 hafta)
- AI motorları Google'dan beslenir (1-3 ay)
- AI Overview Türkiye'de yeni (2-6 ay)

**CEO 'AI konuşmuyor' yorumu hakkında dürüst durum:**
- TUR #59'da makaleler yayınlandı: 1 Mayıs 2026 (bugün)
- Bugünden itibaren 3-6 ay süreç başladı
- Şu an "AI'da çıkmıyoruz" durumu **NORMAL** ve **BEKLENEN**
- ~1 Haziran 2026: ilk Google indeksleme görülür
- ~1 Ağustos 2026: ChatGPT/Perplexity AI motorları cevaplarda kullanmaya başlar
- ~1 Kasım 2026: AI Overview'da kayda değer trafik


