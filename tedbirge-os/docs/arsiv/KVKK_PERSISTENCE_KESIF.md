# KVKK PERSISTENCE KEŞİF — compliance.js + KVKKSCC + DSR
## Tarih: 27 Nisan 2026
## Mimar: Claude Code (Sonnet 4.6)

> Bu rapor TUR #23 (KVKK Persistence Kesiti) için kanıt zemini.
> Anayasa Madde 24.10 (KVKK Yurt Dışı Aktarım Disiplini) ile uyumlu
> bir persistence katmanı kurmak için mevcut yapı tespit edildi.
> TEDAVİ YOK — sadece tanı.
> Disiplin: Madde 4.4 (kod kanıt), Madde 21 (sağlık taraması).

---

## YÖNETİCİ ÖZETİ

| Soru | Cevap | Kanıt |
|------|-------|-------|
| KVKKSCC modeli alanları | Var — 10 alan, yeterli yapı | G-K1 |
| DataSubjectRequest alanları | Var — TC, tip, durum, yanıt notu — @updatedAt eklendi (TUR #22) | G-K1 |
| compliance.js durumu | Saf in-memory — DB yazımı YOK | G-K2 |
| AIUsageLog yazımı | Schema var, hiçbir servis yazmıyor (sadece tablo) | G-K5 |
| 4 sağlayıcı SCC DB kaydı | YOK — compliance.js in-memory, boot.js DB okuyor ama hiç kimse DB'ye yazıyor | G-K4 |
| KVKK m.7 silme akışı | Kısmi — gdprDelete çalışıyor (TUR #19), 5 tablo eksik | G-K3 |
| KVKK m.11 export akışı | TAMAMEN EKSİK — endpoint yok | G-K3 |
| KVKK m.13 başvuru takibi | Endpoint yok — DataSubjectRequest model var ama akış boş | G-K3 |
| VERBİS/İYS izleri | VERBİS: boot.js OSPolicy kontrol ediyor; İYS: hiç yok | G-K6 |

**En kritik 3 bulgu:**
1. 🔴 compliance.js / boot.js KOPUKLUK: compliance.js SCC'yi in-memory'e yazar, boot.js DB'den okur — aralarında hiçbir veri köprüsü yok. Boot her başladığında "aktif SCC yok" uyarısı verir.
2. 🔴 AIUsageLog: Model ve tablo var, hiçbir servis veri yazmıyor. KVKK m.10 (algoritma şeffaflığı) audit trail sıfır.
3. 🔴 gdprDelete eksik cascade: Bilirkisi, Durusma, Masraf, UYAPDosyaSync, UYAPTebligat kayıtları silinmiyor — KVKK m.7 tam değil.

---

## G-K1: KVKKSCC ve DataSubjectRequest Schema Modelleri

### KVKKSCC modeli
```prisma
model KVKKSCC {
  id              String    @id @default(cuid())
  dataProcessor   String        // "Supabase Inc.", "Anthropic" vb.
  country         String        // "US", "EU"
  sccSignedAt     DateTime      // SCC imza tarihi
  kurulBildirimAt DateTime?     // KVKK Kuruluna bildirim
  bildirimBelge   String?       // Belge URL/referansı
  expiresAt       DateTime?     // Son geçerlilik (null = süresiz)
  status          String        // "ACTIVE", "EXPIRED", "REVOKED"
  notlar          String?   @db.Text
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt  ← TUR #17 pattern

  @@index([status, expiresAt])
  @@index([dataProcessor])
}
```

**Alan değerlendirmesi:**
- `dataProcessor`, `country`, `sccSignedAt`, `status` → yeterli çekirdek
- `expiresAt` → expiry takibi için iyi
- `kurulBildirimAt`, `bildirimBelge` → KVKK Kurulu bildirimi takibi — iyi düşünülmüş
- EKSİK alan yok — model yapısal olarak yeterli
- Schema = iyi. **Problem**: bu tabloya hiçbir servis veri yazmıyor.

**Boot kontrolü (boot.js:88-104):**
```javascript
async function checkKVKKSCC() {
  const activeScc = await prisma.kVKKSCC.count({
    where: {
      status: 'ACTIVE',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
  if (activeScc === 0) {
    throw new Error('Hiç aktif KVKK SCC kaydı yok — yurt dışı veri aktarımı için Standart Sözleşme gerekiyor');
  }
}
```
Bu boot step `optional: true` → uyarı verir, boot'u durdurmaz. Şu an her başlatmada uyarı üretiyor (KVKKSCC tablosu boş).

---

### DataSubjectRequest modeli
```prisma
model DataSubjectRequest {
  id           String    @id @default(cuid())
  requesterTC  String              // TC kimlik no (PII — maskele)
  requestType  String              // "erasure", "access", "portability", "rectification"
  description  String    @db.Text  // Talep açıklaması
  receivedAt   DateTime  @default(now())
  respondedAt  DateTime?           // Yanıt tarihi
  status       String              // "PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED"
  handlerId    String?             // İşleyen admin/user
  handler      User?     @relation(...)
  responseNote String?   @db.Text  // Yanıt notu
  updatedAt    DateTime  @updatedAt  ← TUR #22 ile eklendi ✅

  @@index([status, receivedAt])
  @@index([requesterTC])
}
```

**Alan değerlendirmesi:**
- KVKK m.13: 30 günlük yanıt süresi → `receivedAt` var, hesaplanabilir
- `requesterTC`: PII alan — KVKK m.3 "ilgili kişi kimliği" doğru
- EKSİK: `leadId` bağlantısı yok — hangi müvekkil talebi, Lead ile bağlanılamıyor
- EKSİK: enum yerine String tipler (requestType, status) — tip güvenliği yok
- `updatedAt` TUR #22 ile eklendi — audit trail şimdi var ✅

---

### AIUsageLog modeli
```prisma
model AIUsageLog {
  id         String   @id @default(cuid())
  leadId     String?
  userId     String
  aiService  String    // "claude", "tesseract" vb.
  purpose    String    // "analyze", "petition", "muhatap"
  inputSize  Int       // byte
  outputSize Int       // byte
  dataSent   String   @db.Text  // ← PII RISKI: gerçek girdi metni burada
  latencyMs  Int?
  createdAt  DateTime @default(now())

  @@index([userId, createdAt])
  @@index([leadId])
  @@index([purpose, createdAt])
}
```

**Alan değerlendirmesi:**
- `dataSent @db.Text` → AI'ya gönderilen gerçek girdi DB'de saklanıyor (potansiyel PII)
- @updatedAt YOK — log modeli, immutable, doğru tasarım
- Model ve tablo var — **hiçbir servis buraya yazı yazmıyor** (G-K5 kanıtı)

---

## G-K2: compliance.js OS Modülü — Mevcut Yapı

**Dosya:** `src/os/modules/compliance.js` (434 satır)

### Kritik state tanımı (satır 117-129):
```javascript
/** SCC registry. Map<id, SccRecord> */
const sccRegistry = new Map();   // ← SAFI IN-MEMORY

/** Data Subject Request queue. Map<id, DsrRecord> */
const dsrQueue = new Map();      // ← SAFI IN-MEMORY

const sccCooldown = new Map();
const dsrCooldown = new Map();
```

**Sonuç: Prisma import'u yok. DB yazımı yok. Hiçbir fonksiyon DB'ye dokunmuyor.**

### addScc() (satır 140-149):
```javascript
function addScc(scc) {
  if (!scc?.id || !scc?.processor || !scc?.validUntil) {
    throw new Error("addScc: id, processor, validUntil zorunlu");
  }
  sccRegistry.set(scc.id, { ...scc, addedAt: new Date().toISOString() });
  return sccRegistry.get(scc.id);
}
```
→ Sadece `sccRegistry` Map'e yazar. KVKKSCC tablosuna YOK.

### addRequest() (satır 199-224):
```javascript
function addRequest(req) {
  const record = { id, type, requesterId, payload, requestedAt, dueBy, status, completedAt };
  dsrQueue.set(id, record);
  return record;
}
```
→ Sadece `dsrQueue` Map'e yazar. DataSubjectRequest tablosuna YOK.

### checkSccExpirations() — event emit (satır 165-189):
→ in-memory `sccRegistry`'yi tarar. Event emit eder: `KVKK_SCC_EXPIRING`.
→ Ama sccRegistry'de kayıt yoksa (restart sonrası) — hiçbir zaman expire uyarısı vermez.

### Modül analizi:
| Özellik | Durum |
|---------|-------|
| State | Safi in-memory (Map) |
| DB bağlantısı | YOK (Prisma import yok) |
| Server restart sonrası | Tüm SCC ve DSR sıfırlanır |
| init() / seed | Yok — başlangıçta DB'den yükleme yapılmıyor |
| SCC → KVKKSCC tablosu | Köprü YOK |
| DSR → DataSubjectRequest tablosu | Köprü YOK |
| KVKK m.9 audit trail | Sıfır (persistent kayıt yok) |
| KVKK m.13 (30 gün takip) | In-memory, restart'ta kaybolur |

**Madde 24.10 ihlali:** SCC kayıtları kalıcı değil. KVKK denetiminde "hangi tarihte hangi SCC imzalandı" sorusu yanıtsız kalır.

**Bulgu sınıflandırması:** 🔴 KRİTİK — server restart'ta tüm compliance state sıfırlanıyor.

---

## G-K3: KVKK Akışları — Controller ve Service'ler

### KVKK m.7 Silme Akışı — gdprDelete

**Dosya:** `src/controllers/lead.controller.js:446`
```javascript
exports.gdprDelete = asyncHandler(async (req, res) => {
  await prisma.$transaction([
    prisma.chatMessage.deleteMany({ where: { leadId: id } }),
    prisma.chatSession.deleteMany({ where: { leadId: id } }),
    prisma.contract.deleteMany({ where: { leadId: id } }),
    prisma.assignment.deleteMany({ where: { leadId: id } }),
    prisma.document.deleteMany({ where: { leadId: id } }),
    prisma.activityLog.deleteMany({ where: { leadId: id } }),
    prisma.lead.delete({ where: { id } }),
  ]);
```

**Silinen tablolar:** ChatMessage, ChatSession, Contract, Assignment, Document, ActivityLog, Lead ✅

**EKSİK — silinmeyen tablolar:**
- `Bilirkisi` (leadId var) — bilirkişi raporları silme talebiyle kalmaya devam eder
- `Durusma` (leadId var) — duruşma kayıtları
- `Masraf` (leadId var) — masraf kayıtları (mali veri)
- `UYAPDosyaSync` (leadId var) — UYAP dosya verileri
- `IhtarnameTakip` (leadId var) — ihtarname içerikleri
- `Petition` (leadId var) — dilekçe içerikleri

**Sonuç:** 🔴 KVKK m.7 tam değil. 6 tablo cascade'e dahil edilmemiş.

---

### KVKK m.11 Export Akışı
**Route grep sonucu:** Hiçbir gdprExport route'u bulunamadı.
**Kanıt:** `src/routes/lead.routes.js:36` → sadece `router.delete("/:id/gdpr-delete", ...)` var.

**Sonuç:** 🔴 KVKK m.11 (ilgili kişi erişim hakkı / veri taşıma) endpoint'i YOK.
kvkk.js adapter'da `getAccessLog()` var (SystemEvent okur) ama expose edilmemiş.

---

### KVKK m.13 Başvuru Takibi
**DataSubjectRequest endpoint kontrolü:** Hiçbir controller/route bulunamadı.

**Mevcut durum:**
- Model var (schema) ✅
- Tablo var (DB) ✅
- API endpoint YOK ❌
- Admin arayüzü YOK ❌
- Müvekkil başvuru formu YOK ❌

**Sonuç:** 🟡 DataSubjectRequest model hazır ama akış boş. Başvuru gelirse manuel işlem gerekir.

---

### KVKK Rıza Kaydı (pozitif bulgu)
**public.route.js:32-56:**
```javascript
const kvkkConsent = kvkkApproved === true || kvkkApproved === "true" || kvkkApproved === "1"
// ...
kvkkConsentAt: kvkkConsent,
```
→ Web başvurusunda rıza tarihi `Lead.kvkkConsentAt` olarak kaydediliyor ✅

**kvkk.js adapter:** logDataAccess, logDataExport, recordConsent → SystemEvent tablosuna yazar ✅
**Kullanım:** lead.controller.js:71 ve document.controller.js:47 — optional chaining ile çağrılıyor (?.logDataAccess — modül başlatılmamışsa sessizce atlanır)

---

## G-K4: Yurt Dışı Aktarım Kayıtları

### compliance.js / boot.js KOPUKLUK

```
compliance.addScc() → sccRegistry (Map, in-memory)
boot.checkKVKKSCC() → prisma.kVKKSCC (DB tablosu)
```

Bu ikisi hiçbir zaman buluşmuyor. `sccRegistry`'den KVKKSCC tablosuna yazı yok, `KVKKSCC`'den `sccRegistry`'e yükleme yok.

### 4 Sağlayıcı için SCC Durumu

| Sağlayıcı | Servis dosyası | Kod izi | KVKKSCC DB kaydı | SCC belgesi |
|-----------|---------------|---------|-----------------|-------------|
| Supabase | storage.service.js | SUPABASE_URL env | YOK | Mehmet Bey kontrolü |
| Anthropic | ai.service.js | ANTHROPIC_API_KEY env | YOK | Mehmet Bey kontrolü |
| Meta WhatsApp | whatsapp.service.js | graph.facebook.com | YOK | Mehmet Bey kontrolü |
| Gmail | email.service.js | SMTP_HOST/PORT | YOK | Mehmet Bey kontrolü |

**Kanıt:** `grep -r "scc"` → sadece compliance.js ve boot.js. Hiçbir servis KVKKSCC tablosuna yazmıyor.

### Aydınlatma Metni

**Kanıt:**
- `src/constants/disclaimers.js:10` → KVKK_DISCLAIMER string (Türkçe metin) — statik constant
- `src/utils/textTemplates.js:57` → "KVKK kapsamındaki aydınlatma yükümlülüğü yerine getirilmiş sayılır"
- `src/services/email.service.js:150` → link: `https://tedbirge.ai/kvkk` (harici sayfa)
- Sözleşme template'lerinde referans: `master-attorney-contract.template.js:154` → "Ek-4: KVKK aydınlatma ve açık rıza metni"

**Sonuç:** Aydınlatma metni statik string olarak var. Yurt dışı aktarım açık olarak bu metinde yer alıyor mu? Mehmet Bey kontrolü gerekli.

---

## G-K5: AI Algoritma Şeffaflık (KVKK m.10)

**Grep sonucu:** `AIUsageLog` için sıfır eşleşme (src/ dizini).

```
Grep "AIUsageLog" src/**/*.js → No matches found
```

**Anlam:** AIUsageLog modeli var, tablo DB'de var — ama hiçbir servis buraya yazmıyor.

**Etkilenen servisler:**
- `src/services/ai.service.js` → interpretResponse, generatePetition, analyzeDocument — log YOK
- `src/services/muhatapAI.service.js` → 13 muhatap analizi — log YOK
- `src/os/modules/ai.js` → OS AI modülü — log YOK

**Ek risk — AIUsageLog.dataSent @db.Text:**
Bu alan, AI'ya gönderilen gerçek metni saklıyor. Yazım başlasa bu PII (müvekkil adı, kaza detayı, sağlık raporu) DB'de `dataSent` kolonunda açık metin olarak duracak. Maskeleme/şifreleme tanımı yok.

**Sonuç:** 🔴 AIUsageLog sıfır aktif. KVKK m.10 audit trail yok. Ancak dataSent alanının PII riski TUR #23'te değerlendirilmeli.

---

## G-K6: VERBİS / İYS / BTK Kayıtları

### VERBİS

**boot.js:107-122:**
```javascript
async function checkVERBIS() {
  const verbisPolicy = await prisma.oSPolicy.findUnique({
    where: { module_key: { module: 'compliance', key: 'verbis.registered' } },
  });
  if (!verbisPolicy || !verbisPolicy.value || verbisPolicy.value.registered !== true) {
    throw new Error('VERBİS kaydı yapılmamış veya OSPolicy\'de işaretlenmemiş');
  }
}
```
→ Boot sequence'de `optional: true` → uyarı verir, boot'u durdurmaz.
→ OSPolicy tablosunda `verbis.registered = true` yoksa her boot'da uyarı üretir.

**Sonuç:** 🟡 VERBİS kontrol mekanizması var (OSPolicy üzerinden) ama kayıt durumu belirsiz.

### İYS (Tıkla — ticari ileti onayı)

**Grep sonucu:** SMS gönderen `sms.service.js`'de İYS referansı YOK.
NetGSM çağrıları direkt yapılıyor — İYS onay kontrolü yok.

**Sonuç:** 🟡 İYS kodu yok. SMS gönderimleri İYS onayı kontrol etmeden yapılıyor.

### BTK

**Grep sonucu:** BTK referansı yok (sadece kısmen eşleşen 3 satır — `btk` alt-string değil gerçek BTK referans).

**Sonuç:** 🟢 BTK bildirimi manuel süreç — beklenen.

---

## ÖZET TABLO — KVKK PERSISTENCE DURUMU

| Konu | Durum | Risk | Yorum |
|------|-------|------|-------|
| KVKKSCC schema | ✅ Var, 10 alan, yeterli | — | Model iyi tasarlanmış |
| DataSubjectRequest schema | ✅ Var, @updatedAt eklendi | — | leadId bağlantısı eksik |
| compliance.js → KVKKSCC DB | ❌ YOK (in-memory) | 🔴 KRİTİK | TUR #23 scope |
| boot.js ↔ compliance.js kopukluk | ❌ Disconnect | 🔴 KRİTİK | SCC hiç persist edilmiyor |
| 4 sağlayıcı KVKKSCC DB kaydı | ❌ YOK | 🔴 KRİTİK | TUR #23 scope |
| KVKK m.7 silme | ⚠️ KISMİ | 🔴 KRİTİK | 6 tablo eksik cascade |
| KVKK m.11 export | ❌ YOK | 🔴 KRİTİK | Endpoint yok |
| KVKK m.13 DSR başvuru | ❌ YOK | 🟡 ORTA | Model var, akış yok |
| AIUsageLog yazımı | ❌ Schema-only | 🔴 KRİTİK | m.10 audit trail sıfır |
| KVKK rıza kaydı | ✅ Çalışıyor | — | Lead.kvkkConsentAt |
| kvkk.js adapter log | ✅ Çalışıyor (opsiyonel) | — | SystemEvent'e yazıyor |
| Aydınlatma metni | ⚠️ Statik string | 🟡 ORTA | Yurt dışı aktarım açık mı? |
| VERBİS kayıt | ⚠️ Boot check var | 🟡 ORTA | OSPolicy'de işaretli mi? |
| İYS (SMS onayı) | ❌ YOK | 🟡 ORTA | NetGSM doğrudan çalışıyor |
| BTK bildirimi | — | 🟢 DÜŞÜK | Manuel süreç |

---

## TUR #23 KESİT ÖNERİSİ

KEŞİF'e göre TUR #23 kapsamı iki seçenek:

### A. Dar Bulgu Kapatma (atomik — önerilen ilk adım)
**Kapsam:**
1. compliance.js → KVKKSCC tablosuna köprü: `addScc()` KVKKSCC'ye de yazacak
2. Sunucu başlarken KVKKSCC tablosundan sccRegistry'yi seed eder (yükleme)
3. compliance.addRequest() → DataSubjectRequest tablosuna da yazacak
4. gdprDelete cascade genişletme (6 eksik tablo)

**Süre:** 3-4 saat
**Risk:** Orta (kod refactor + DB yazımı)
**Schema değişikliği:** YOK (mevcut tablolar yeterli)

### B. Stratejik KVKK Kesiti (geniş — 3-4 TUR)
**Kapsam:** A + şunlar:
- 4 sağlayıcı için KVKKSCC başlangıç kayıtları (Mehmet Bey onaylı seed)
- KVKK m.11 export endpoint (gdprExport)
- DataSubjectRequest POST endpoint (müvekkil başvuru)
- DataSubjectRequest admin listesi endpoint
- AIUsageLog → ai.service.js entegrasyonu (dataSent maskeleme ile)
- İYS onay kolonu Lead'e ekle (schema — KIRMIZI nokta)
- VERBİS OSPolicy kaydı

**Süre:** 1-2 hafta
**Risk:** Yüksek (schema değişikliği var — KIRMIZI nokta)

**Öneri:** A (dar) ile başla, B'yi sonraki kesitte aç. Dar/geniş kararı Mehmet Bey verir.

---

## EKSİK NOKTALAR (Mehmet Bey için — manuel kontrol)

1. **VERBİS kayıt durumu:** Tedbirge VERBİS'e kayıtlı mı? OSPolicy'de `verbis.registered = true` girilmiş mi?
2. **SCC fiziksel sözleşmeler:** 4 sağlayıcı için imzalanmış SCC belgesi var mı? (Supabase DPA, Anthropic DPA, Meta WhatsApp DPA, Google Workspace DPA)
3. **Aydınlatma metni içeriği:** `tedbirge.ai/kvkk` sayfasında yurt dışı aktarım (Supabase ABD, Anthropic ABD, Meta ABD/EU, Gmail ABD) açık olarak belirtiliyor mu?
4. **İYS (Tıkla) kaydı:** NetGSM üzerinden gönderilen ticari nitelikteki SMS'ler için müvekkillerin İYS kaydı var mı?
5. **KVKK Kurulu bildirim:** Veri ihlali durumunda 72 saat bildirimi için süreç var mı? (kod tabanında yok — G-K2'de "GDPR Article 33 Sprint 3+" olarak işaretlenmiş)
6. **Müvekkil-Avukat-Tedbirge veri işleme sözleşmesi:** Tedbirge'nin "Veri İşleyen" sıfatı avukat ile yazılı sözleşmede düzenlendi mi?

---

## SONRAKİ ADIM

1. Mimar oturumu — bu raporu okuyacak
2. Mehmet Bey eksik hukuki/operasyonel noktaları ekleyecek
3. TUR #23 kesit kapsamı netleşecek (A: dar / B: geniş)
4. Kesit mektubu yazılacak (mimar mektubu)
5. gdprDelete eksik cascade → KIRMIZI değil (schema değişikliği yok), otonom yapılabilir
6. compliance.js → DB köprüsü → KIRMIZI değil (mevcut tablolar yeterli), otonom yapılabilir
7. DataSubjectRequest leadId eksikliği → schema ekleme → KIRMIZI nokta (Mehmet Bey onayı)

---

— Claude Code, KVKK Persistence KEŞİF sonu (sıfır kod değişikliği — Madde 21.2)
— Commit: YOK (Madde 21 disiplini)
