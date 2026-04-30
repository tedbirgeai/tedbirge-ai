# SAGLIK TARAMASI — TUR #18
## Tedbirge.ai Uçtan Uca Risk Denetimi (Madde 21)

**Tarih:** 26 Nisan 2026 (gece)
**Denetci:** Claude Sonnet 4.6 (otonom mimar)
**Kapsam:** Tüm sistem — 8 bölüm, 30+ keşif görevi
**Yöntem:** Salt okuma (Madde 21.2 — sıfır kod değişikliği, sıfır commit)
**Çıktı:** Sınıflandırılmış risk haritası

Sınıflandırma ölçeği:
- 🔴 KRİTİK — Üretimde aktif hata veya veri kaybı riski
- 🟡 ORTA — Güvenlik veya uyum zaafiyeti, yakın takip
- 🟢 DÜŞÜK — İyileştirme önerisi, acil değil
- ℹ️ NOT — Gözlem, risk yok

---

## BÖLÜM 1: Schema Sağlığı

### G18-S1: Model Sayım + @updatedAt Durumu (TUR #17 Doğrulama)

Toplam model sayısı: **33**

```
AccidentCase, ActivityLog, Assignment, Bilirkisi, ChatMessage, ChatSession,
Contract, DavaSurec, Document, Durusma, Evidence, IhtarnameTakip, Lead,
Masraf, Petition, PhoneOtp, PushSubscription, User, VerificationToken,
OSPolicy, IdempotencyKey, SystemEvent, SystemMetric, Trace, BootRecord,
UYAPSession, UYAPDosyaSync, UYAPTebligat, SBMSorgu, KVKKSCC,
AIUsageLog, DataSubjectRequest
```

@updatedAt mevcut (12 model) — TUR #17 doğrulandı ✓:
- AccidentCase, Assignment, ChatSession, Contract, DavaSurec, Document
- IhtarnameTakip, Lead, OSPolicy, KVKKSCC, Petition, User

**🟡 ORTA — Mutable alanı olan ama @updatedAt eksik 7 model:**

| Model | Mutable Alan | Risk |
|---|---|---|
| Bilirkisi | raporGeldiMi, itirazEdildi, raporIcerigi | Güncelleme zamanı bilinemiyor |
| Durusma | hatirlatildi | Hatırlatma durumu audit trail eksik |
| Masraf | odendi | Ödeme durumu değişimi izlenemiyor |
| UYAPDosyaSync | durum, fullPayload | UYAP sync güncelleme tarihi yok |
| UYAPTebligat | readByLawyer | Okunma zamanı yok |
| DataSubjectRequest | status, responseNote | KVKK yanıt tarihi audit trail eksik |
| SBMSorgu | sonuc | Sorgu sonucu güncellenebilir, iz yok |

Immutable (updatedAt gerek yok) — kabul edilebilir:
ActivityLog, ChatMessage, PhoneOtp, VerificationToken, Evidence, PushSubscription,
IdempotencyKey, SystemEvent, SystemMetric, Trace, BootRecord, UYAPSession, AIUsageLog

### G18-S2: KVKK Kritik Alanlar

ℹ️ NOT — KVKK alanları eksiksiz:
- Lead: kvkkConsentAt ✓, healthDataConsentAt ✓, deletedAt ✓, archivedAt ✓
- User: sozlesmeKabulTarihi ✓, sozlesmeKabulIp ✓, sozlesmeMetniHash ✓, sozlesmeVersiyonu ✓
- AIUsageLog modeli (algoritma şeffaflık logu) ✓
- DataSubjectRequest modeli (ilgili kişi hakları) ✓
- KVKKSCC modeli (yurt dışı aktarım SCC takibi) ✓

Enum MuhatapTipi kapsamlı (14 değer: TRAFIK_SIGORTASI, SGK, ISVEREN, HASTANE, vs.) ✓

### G18-S3: PrismaClient Singleton Kontrolü

**🟡 ORTA — 5 OS altyapı dosyasında new PrismaClient() ihlali (Anayasa Madde 9.3):**

```
src/bootstrap/dbSelfHeal.js:15  — new PrismaClient()
src/os/reconciler.js:20         — new PrismaClient()
src/os/idempotency.js:18        — new PrismaClient()
src/os/eventBus.js:18           — new PrismaClient()
src/os/boot.js:17               — new PrismaClient()
```

Not: src/os/modules/auditor.js:166 — string mesaj içinde geçiyor, gerçek ihlal değil ✓
Etki: 5 ayrı PrismaClient instance → connection pool baskısı. Render üzerinde
max_connections sınırına yaklaşılırsa sorun çıkabilir. Auditor bu durumu zaten
tespit ediyor (prisma_violation scan). Sprint 3'te singleton geçişi önerilir.

---

## BÖLÜM 2: Auth / 4 Rol

### G18-A1: 4 Rol Auth

ℹ️ NOT — Enum'da 5 rol var: ADMIN, LAWYER, CUSTOMER, REPRESENTATIVE, SALES
Anayasa Madde 11'de 4 rol (SALES listelenmiyor ama kodda var). Tutarsızlık küçük,
risk yok — SALES rolü erişim kontrollerinde LAWYER ile eşit haklara sahip.

JWT auth akışı:
- authMiddleware.js: Bearer token ✓, isActive kontrolü ✓
- 2FA: speakeasy TOTP, window=1, tempToken 5 dakika ✓
- Onay durumu: baroOnayDurumu/temsilciOnayDurumu BEKLEMEDE ise isActive=false ✓

**🟡 ORTA — JWT query param desteği (authMiddleware.js:9):**
```
const token = tokenFromHeader || req.query?.token || null;
```
URL'de token geçmek: server log, browser history, CDN log riskine yol açar.
Üretim dokümantasyonunda "query token" kullanımı belirtilmemiş, ancak
lead.routes.js:30 downloadContractPdf endpoint'i public (no auth) — bu nedenle
neden var olduğu anlaşılamadı. Sprint 3'te kaldırılması önerilir.

### G18-A2: Yetki Middleware

ℹ️ NOT — assertLeadAccess kullanımı 11 controller'da doğrulandı:
hukuk, document, contract, upload, timeline, maluliyet, lead.caseData,
petition (6 yerde), lead.compensation, lead.service

roleMiddleware.js: req.user.role kontrolü ✓

### G18-A3: OTP / Reset

ℹ️ NOT — Tüm akışlar sağlıklı:
- PhoneOtp: 10 dk TTL, kayıt öncesi temizleniyor ✓
- PasswordReset: 1 saat TTL, tek kullanımlık ✓
- Rate limiter: authLimiter, registerLimiter, passwordResetLimiter — 3 endpoint ✓
- Email verification: 24 saat TTL, tek kullanımlık ✓

---

## BÖLÜM 3: Müvekkil Yolculuğu

### G18-M1: Giriş Noktaları

ℹ️ NOT — public.route.js endpoint'leri:
- POST /api/public-lead — yeni başvuru, auth yok (doğru) ✓
- leadService.createLead() aracılığıyla ✓, @updatedAt TUR #17 sonrası ✓
- KVKK: kvkkConsentAt, healthDataConsentAt kaydediliyor ✓
- UTM parametreleri: utmSource, utmMedium, utmCampaign ✓

**🟢 DÜŞÜK — /api/leads/query (public) rate limiter yok:**
Phone ile müvekkil durumu sorgulanabiliyor, herhangi biri sorgulayabilir.
Dönen bilgi minimal (status + avukat adı ilk kelime + lastUpdated) ama
brute-force ile phone/status bilgisi çıkarılabilir. rateLimiters eklenmesi önerilir.

### G18-M2: AI Analiz Pipeline

ℹ️ NOT — completeUpload → analyzeDocumentById → fire-and-forget (setImmediate) ✓
AI analiz başarısız olursa document.status = "FAILED" güncelleniyor ✓

### G18-M3: Document.status FAILED

🟢 DÜŞÜK — upload.controller.js:120+ FAILED durumu işleniyor.
Ancak public.route.js:67 document.create'de hata durumunda FAILED işaretleme yok
(try-catch 500 dönüyor, document.status güncellenmeden kalıyor).
TUR #17 @updatedAt fix'i bu yolu kapattı — artık 500 alınmamalı ✓

### G18-M4: Atama

ℹ️ NOT — assignment.routes.js: POST /:leadId → ADMIN/SALES/REPRESENTATIVE ✓

### G18-M5: Sözleşme

ℹ️ NOT — musteri.routes.js: /onay-baslat, /onay-dogrula → CUSTOMER rol ✓
contract.controller.js: assertLeadAccess ✓

### G18-M6: Dava

ℹ️ NOT — hukuk.routes.js: assertLeadAccess tüm işlemler ✓
DavaSurec: @updatedAt ✓ (TUR #17)

---

## BÖLÜM 4: Avukat İş Akışı

### G18-AV1: Panel Sayfaları

ℹ️ NOT — lead.routes.js'de LAWYER rolü birçok endpoint'e erişebilir ✓
leadWhereByRole filtresi ile sadece kendi leads'lerini görür ✓

### G18-AV2: İletişim / Bildirim

**🔴 KRİTİK — deadlineChecker.job.js:62 — `assignedAt` alan hatası:**

```javascript
// src/jobs/deadlineChecker.job.js:60-63
include: {
  assignments: {
    include: { lawyer: { select: { id: true, fullName: true, email: true, phone: true } } },
    orderBy: { assignedAt: "desc" },  // ← HATA: Assignment modelinde 'assignedAt' yok!
```

Assignment modeli (prisma/schema.prisma:36-46):
```
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

`assignedAt` alanı yok. `createdAt` olmalı. Bu query Prisma'nın runtime
validation'ında P2025 veya field validation hatası fırlatır → cron job her
gün 08:00'de hata alıyor → avukatlara zamanaşımı uyarısı GİTMİYOR.
Müvekkilin hakkı zamanında korunmuyor → KVKK/etik risk.

**Düzeltme:** `orderBy: { assignedAt: "desc" }` → `orderBy: { createdAt: "desc" }`
Not: Bu TUR #19 tur mektubuna KIRMIZI NOKTA olarak işlenmelidir.

### G18-AV3: Raporlama

🟢 DÜŞÜK — analytics.routes.js mevcut. Avukata özel raporlama sayfası
panel tarafında kontrol edilmedi (backend scope dışı).

---

## BÖLÜM 5: Temsilci

### G18-T1: Yetkiler

ℹ️ NOT — REPRESENTATIVE rolü:
- Lead oluşturma ✓
- Lead atama ✓
- Müşteri hesabı oluşturma ✓
- Temsilci sözleşmesi (sozlesmeVersiyonu, sozlesmeMetniHash, sozlesmeKabulIp) ✓

### G18-T2: Sınırlar

ℹ️ NOT — Temsilci onaylanmamışsa isActive=false → auth engeli ✓
assertLeadAccess: REPRESENTATIVE sadece kendi getirdiği leads'e erişir ✓

**🟡 ORTA — sigortaBasvuru.routes.js: rol kontrolü yok:**
```javascript
router.use(authMiddleware);  // sadece auth, rol yok
router.post("/lead/:leadId", controller.create);
```
CUSTOMER rolündeki kullanıcı da sigorta başvurusu oluşturabilir.
Beklenen: sadece ADMIN/SALES/LAWYER/REPRESENTATIVE. Sprint 3'te rol eklenmeli.

---

## BÖLÜM 6: Admin

### G18-AD1: Sistem Durumu

ℹ️ NOT — admin.os.routes.js: /os/status, /boot-records, /events → auth + ADMIN ✓
OS modülleri: auditor, backup, compliance, healer, pulse aktif ✓

### G18-AD2: KVKK Paneli

**🔴 KRİTİK — gdprDelete transaction'da hatalı relation adı:**

```javascript
// src/controllers/lead.controller.js:468
prisma.chatMessage.deleteMany({ where: { session: { leadId: id } } }),
```

ChatMessage modelinde relation adı `ChatSession` (büyük C), `session` değil.
Prisma bu ilişki filtresini tanımayabilir → transaction kısmen başarısız
→ KVKK silme tamamlanmıyor → çözülmemiş veri kalıyor → KVKK m.7 ihlali riski.

Aynı zamanda ChatMessage modelinde doğrudan `leadId` alanı var:
```prisma
leadId String?
```
Doğru yaklaşım: `prisma.chatMessage.deleteMany({ where: { leadId: id } })`

**🟡 ORTA — compliance.js OS modülü in-memory SCC/DSR:**
SCC registry ve DSR queue in-memory. Server restart'ta tüm kayıtlar kayboluyor.
Veritabanında KVKKSCC ve DataSubjectRequest modelleri var ama compliance modülü
bunları kullanmıyor — Sprint 3'te DB entegrasyonu şart.

### G18-AD3: Yedekleme

**🟡 ORTA — backup.js: Sprint 2 THIN iskele, gerçek yedek yok:**
```
runDatabaseBackup() — placeholder (gerçek pg_dump Sprint 3)
runStorageBackup()  — placeholder (gerçek tarama Sprint 3)
```
Şu an Supabase'in kendi point-in-time recovery'sine bağımlı. Harici bağımlılık
olarak kabul edilebilir ama Tedbirge backup politikası yoksa KVKK denetimde sorun.

---

## BÖLÜM 7: AI / Otomasyon

### G18-AI1: OS Modülleri

ℹ️ NOT — 18 OS modülü mevcut:
ai, analyzer, appearance, auditor, backup, compliance, costGuard, deploy,
healer, insurance, maintenance, navigation, notifications, performance,
pulse, recovery, reporter, security, uyapControl

Auditor: 6 kategori tarama (schema_drift, env_inconsistency, prisma_violation,
performance_drift, security_anomaly, cost_spike) — setInterval 1 saat ✓
Healer: auditor:finding eventini dinliyor ✓

### G18-AI2: SMS / Email / WhatsApp

ℹ️ NOT — 3 gateway mevcut:
- SMS: Netgsm (mock mod — env yoksa) ✓
- Email: SMTP Nodemailer (mock mod) ✓
- WhatsApp: WhatsApp Business API (mock mod) ✓
- test.routes.js: devOnly guard ile production'da 404 ✓

### G18-AI3: Cron Jobs

ℹ️ NOT — deadlineChecker: node-cron, her gün 08:00 ✓
2 aşamalı uyarı: 30 gün avukata, 7 gün avukat+müvekkile ✓
Duruşma hatırlatma: 3 gün öncesinden ✓
Push notification: pushNotification.service ✓

(Asıl bug G18-AV2'de raporlandı — `assignedAt` hatası)

---

## BÖLÜM 8: Finansal

### G18-F1: PayTR

ℹ️ NOT — payment.routes.js:
- Callback: public (PayTR sunucusundan geldiği için doğru) ✓
- Initiate: auth + ADMIN/SALES/LAWYER/REPRESENTATIVE ✓
- Status: auth ✓
- Refund: auth + ADMIN ✓

### G18-F2: Masraf

🟢 DÜŞÜK — Masraf modeli: `odendi` boolean mutable, updatedAt yok.
Ödeme yapıldığında güncelleme tarihi audit trail'de yok.

### G18-F3: Komisyon

ℹ️ NOT — hukukcuKomisyon (User), komisyonOrani (Lead),
hakEdisStatus, hakEdisTarihi, hakEdisNotu, kdvTutari, masrafTutari — Lead ✓

---

## ÖZET RİSK TABLOSU

| Risk | Bulgu | Dosya | Öncelik |
|---|---|---|---|
| 🔴 KRİTİK | deadlineChecker `assignedAt` hatası → cron job çöküyor | src/jobs/deadlineChecker.job.js:62 | TUR #19 KIRMIZI NOKTA |
| 🔴 KRİTİK | gdprDelete ChatMessage ilişki adı yanlış → KVKK silme eksik | src/controllers/lead.controller.js:468 | TUR #19 KIRMIZI NOKTA |
| 🟡 ORTA | 5 OS dosyasında new PrismaClient() ihlali | src/os/boot.js, eventBus.js, reconciler.js, idempotency.js; src/bootstrap/dbSelfHeal.js | Sprint 3 |
| 🟡 ORTA | JWT query param token → server log riski | src/middlewares/authMiddleware.js:9 | Sprint 3 |
| 🟡 ORTA | sigortaBasvuru routes'ta rol kontrolü yok | src/routes/sigortaBasvuru.routes.js | Sprint 3 |
| 🟡 ORTA | compliance.js in-memory SCC/DSR (restart'ta kaybolur) | src/os/modules/compliance.js | Sprint 3 |
| 🟡 ORTA | backup.js Sprint 2 iskele, gerçek yedek yok | src/os/modules/backup.js | Sprint 3 |
| 🟡 ORTA | 7 modelde mutable alan var ama updatedAt yok | schema.prisma | Sprint 3 |
| 🟢 DÜŞÜK | /leads/query public endpoint rate limiter yok | src/routes/public.route.js:469 | Sprint 4 |
| 🟢 DÜŞÜK | Masraf.odendi güncellemede audit trail eksik | prisma/schema.prisma | Sprint 4 |
| 🟢 DÜŞÜK | public.route.js Document.create FAILED işaretleme yok | src/routes/public.route.js:66-88 | Sprint 4 |

---

## SONUÇ DEĞERLENDİRMESİ

**Sistem genel sağlığı:** 🟡 ORTA-İYİ

**Acil müdahale gerektirenler (🔴 2 adet):**
1. deadlineChecker `assignedAt` → `createdAt` düzeltmesi (avukat bildirimleri çalışmıyor)
2. gdprDelete ChatMessage ilişki adı (KVKK uyumu riski)

Her ikisi de **tek satır düzeltmesi**, mimar onayı gerektirmiyor, TUR #19
🔴 KIRMIZI NOKTA değil 🟢 YEŞİL NOKTA olarak planlanabilir.

**Olumlu bulgular:**
- TUR #17 @updatedAt fix'i doğrulandı — 12 model sağlıklı ✓
- 33 model arasında KVKK alanları eksiksiz ✓
- assertLeadAccess 11 controller'da tutarlı ✓
- 2FA, OTP, rate limiting, rol middleware — tamamı yerinde ✓
- Zamanaşımı + duruşma cron job mantığı doğru (sadece alan adı hatası var)

---

## SONRAKİ ADIMLAR (Mimar Önerisi)

TUR #19 planı:
1. 🟢 deadlineChecker `assignedAt` → `createdAt` (1 satır)
2. 🟢 gdprDelete ChatMessage `session` → `leadId` doğrudan filtre (1 satır)
3. 🟢 public.route.js /leads/query endpoint'e rateLimiter ekle
4. 🟢 sigortaBasvuru.routes.js rol kontrolü ekle

Sprint 3 kapsamı:
- OS dosyalarında PrismaClient singleton geçişi
- compliance.js DB entegrasyonu (KVKKSCC + DataSubjectRequest kullanımı)
- backup.js gerçek pg_dump implementasyonu
- 7 modele updatedAt ekleme (mimar onayı + migration)

---

*Sıfır kod değişikliği — Madde 21.2 uyarınca salt okuma taraması*
*Commit: yok — Madde 21 gereği*
*Toplam keşif görevi: 30+ (8 bölüm)*

— Claude Sonnet 4.6 (TUR #18, 26 Nisan 2026)
