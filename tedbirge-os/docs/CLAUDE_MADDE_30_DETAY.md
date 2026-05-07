# Madde 30 — Detay Örnekleri ve Kabuk Yasakları

> Bu dosya CLAUDE.md Madde 30 (Otonom Katman Disiplini) **alt-maddelerinin detay örneklerini** içerir.
> Anayasa kuralları CLAUDE.md'de kalır — örnekler, kontrol listeleri, kabuk yasakları, kod blokları burada.
> Yeni Claude oturumu başında **OPSIYONEL** okuma (Madde 26.4 zorunlu okumalardan değil).

**Anayasa sürümü:** v1.22.20 (Madde 30.10 → 30.52 = 43 alt-madde + 6 R-genişleme)
**Tescil:** TUR #90 — CLAUDE.md compaction (Madde 27.X yeni alt-madde)

---

### 30.10 — 16 Modül Otonom Disiplini (TUR #69 + #69.5 + #70)

**Kural:** OS modülleri (`src/os/modules/<name>.js`) `runStatusCheck()` fonksiyonu **zorunlu**. Auditor agent her 5 dk tick'te 16 modülün hepsini paralel çağırır (`runAllModules()` + `Promise.allSettled`).

**AgentEvent yazımı:** Her modül `await prisma.agentEvent.create({ agentName, eventType: "STATUS_CHECK", severity, payload })` çağırır. **agentName UI MODULES key ile birebir eşleşmeli** (`ai`, `analyzer`, `appearance`, `backup`, `compliance`, `costGuard`, `deploy`, `insurance`, `maintenance`, `navigation`, `notifications`, `performance`, `pulse`, `recovery`, `security`, `uyapControl`). MODULE_NAME değişkeni kebab-case ise (örn. `costGuard.js` → MODULE_NAME="cost-guard"), agentName **hard-coded** UI key kullanılır.

**Severity:**
- `INFO` (normal durum)
- `WARNING` (eşik aşıldı, izleme gerek)
- `CRITICAL` (acil müdahale, RealtimeEvent ADMIN_FEED bildirim eklenir)

**UI hookup:** `/api/os/modules/status` endpoint 16 modülün her biri için son `lastRunAt`, `lastSeverity`, `lastMessage`, `eventCountLast1h` döner. Sistem-durumu UI sayfası (`tedbirge-panel/app/(panel)/dashboard/sistem-durumu/page.tsx`) bu endpoint'i 10 sn'de bir çağırır.

**Yeni modül eklerken zorunlu kontrol listesi:**
1. `runStatusCheck()` fonksiyonu yazıldı
2. `prisma.agentEvent.create` await zinciri tam
3. agentName UI MODULES key ile eşleşiyor
4. `module.exports`'a `runStatusCheck` dahil
5. `Auditor.runAllModules()` `moduleNames` array'ine ekle
6. Sistem-durumu UI MODULES dictionary'ye satır ekle

**Kabuk yasağı (Madde 4.4 ile uyumlu):**
- ❌ Modül "AKTİF" gözüküp olay/saat=0 üretemez
- ❌ runStatusCheck içinde sadece `console.log` (AgentEvent yazımı şart)
- ❌ runStatusCheck'in agentName'i agent adı yazılırsa (`Auditor`, `Healer`, `Reporter`) — UI eşleşmez
- ❌ AgentEvent.create promise'i await edilmeden orchestrator return etmek

**Lokal DB drift:** Modüller production schema bekliyor olabilir (yeni alanlar). Lokal dev DB drift varsa runStatusCheck içinde her DB sorgu kendi try-catch'inde noop'a düşer — runStatusCheck **rejected** olmaz, severity INFO ile devam eder. Lokal smoke için Madde 4.4 (kod kaynaktır) — production schema yansımış olduğu için orada hata olmaz.


---

### 30.13 — Akış Paneli Disiplini (TUR #71 A22)

**Kural:** Sistem-durumu UI'da **her modül kartı** AgentEvent feed expand bölümü içerir. ModuleCard'da "Akış" butonuna basıldığında o modülün son N AgentEvent'i (`/api/os/modules/:agentName/events?limit=10`) yüklenir, timestamp + severity rozet (INFO/WARNING/CRITICAL) + payload.message satır olarak gösterilir.

**Empty state:** "Bu modülün son aktivitesi yok" — gerçekten 0 olay olduğunda. Sahte "yükleniyor" sonsuz döngü YASAK (TUR #69+#70 dersi: Akış paneli olmayan modül = mimar mektup boşluğu).

**Backend zorunlu:** `GET /api/os/modules/:agentName/events?limit=10` Auth ADMIN, `prisma.agentEvent.findMany({ where: { agentName }, orderBy: { createdAt: "desc" }, take: limit })`. Yeni modül ekleyen mektupta bu endpoint hookup atom **ZORUNLU** — backend route + frontend toggleLogs fetch zinciri tam.

**Yasak:**
- ❌ ModuleCard'da Akış butonu olup endpoint çağrısı olmaması (UI yalanı)
- ❌ Yeni modül için akış paneli atom unutulması (TUR #69+#70 mektup boşluğu)
- ❌ Empty state yerine "..." yükleniyor sonsuz spinner


---

### 30.14 — EmailDigest Disiplini (TUR #71 A23)

**Kural:** CEO sabah inbox'ında **09:00 TR** her gün otomatik özet emaili olur. `src/services/emailDigest.service.js` Gmail SMTP transporter (`email.service`) üzerinden gönderir. İçerik: son 24h Lead.count + Document.count + DataSubjectRequest.count + AgentEvent CRITICAL count + Document FAILED count.

**Cron:** `src/agents/runner.js` in-process scheduler (1 dk interval, UTC saat kontrolü) — `node-cron` paketsiz disiplin. UTC 06:00 = TR 09:00. Aynı gün tekrar tetiklenmesin diye `lastDigestDate` flag.

**Hedef:** `process.env.CEO_EMAIL` fallback `mehmet@tedbirge.ai`. KVKK m.4 — müvekkil verisi maskelenmemiş gönderilemez (sadece sayısal aggregate).

**EmailDigest tablosu:** `prisma.emailDigest` her gönderim için kayıt (sentAt + metrics + status + error). Modül `src/os/modules/emailDigest.js` runStatusCheck son sentAt + 7 gün gönderim sayısı + son hata AgentEvent yazar.

**Yasak:**
- ❌ HTML template'te ham müvekkil ismi/TC/telefon/email
- ❌ CEO_EMAIL env değişikliğini KIRMIZI nokta olmadan değiştirme (Madde 3 #5)
- ❌ Cron scheduler atom atlaması — gün başı emaili olmadan EmailDigest disiplini yarım


---

### 30.15 — LLM Router Güvenlik Disiplini (TUR #71 A19)

**Kural:** CEO Konsol doğal dil sorgu → SQL → Anthropic Tool Use → cevap zinciri **SADECE SELECT** çalışır. `src/services/llmRouter.service.js` SDK `@anthropic-ai/sdk` model `claude-sonnet-4`.

**SQL regex check (zorunlu çift kapı):**
1. `!/^\s*(SELECT|WITH)/i.test(sql)` → REDDET
2. `/(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE)/i.test(sql)` → REDDET

İkili kontrol — biri kırılsa diğeri korur. Sadece geçerse `prisma.$queryRawUnsafe(sql)` çalıştırılır.

**KVKK alan maskeleme (system prompt):** TC kimlik, telefon, email, adres alanları döndürülürken Madde 21.7 maskeleme (`5XX-***-**98`, `te***@gmail.com`, `***`) uygulanır. System prompt'ta açık talimat zorunlu.

**Tool Use:** Anthropic `tool_use` block ile `prismaSelect` tool. Backend tool execute SQL regex check sonrası prisma sorgu, tool_result Anthropic'e dönüş.

**Yasak:**
- ❌ Tek regex check (çift kapı zorunlu)
- ❌ INSERT/UPDATE/DELETE komut zincirine kapı açma (KIRMIZI Madde 3 #3 ihlali)
- ❌ Maskelenmemiş KVKK alanı CEO'ya bile döndürme
- ❌ ANTHROPIC_API_KEY hardcode (env zorunlu)


---

### 30.16 — Komut Çubuğu UI Disiplini (TUR #71 A20)

**Kural:** `/dashboard/komut` sayfası — CEO Konsol arayüzü. Üst textarea + **Cmd+Enter (Mac) / Ctrl+Enter (Win)** submit. Loading shimmer state. Geçmiş 10 sorgu **lokal session state** (DB persist YASAK — Madde 21.7 KVKK).

**Cevap kartı:** doğal dil paragraf + JSON tablo (max 20 satır collapsible) + SQL details + token usage. ApiFetch wrapper (Madde 13.2) zorunlu.

**Sidebar:** `components/layout/AppLayout.tsx` "CEO Konsol" menü, ADMIN role, `✨` (sparkles) ikon, route `/dashboard/komut`.

**Örnek chip'ler:** En az 3 örnek (avukat lead, KVKK başvuru, tahsilat). Tıklanınca query alanı otomatik doldurur.

**Mobile responsive zorunlu** (max-w-4xl + p-6).

**Yasak:**
- ❌ Geçmiş 10 sorgu DB persist (KVKK riski + cache şişkin)
- ❌ Submit butonu olmadan sadece klavye shortcut (erişilebilirlik)
- ❌ apiFetch atlama (Madde 13.2 ihlali)


---

### 30.19 — 5 Rol 2FA Disiplini (TUR #72.6)

**Kural:** Tedbirge.ai 5 giriş noktası (ADMIN + LAWYER + REPRESENTATIVE + CUSTOMER + Public Register) için 2FA zorunluluk matrisi:

| Rol | Seviye | Login Engel | Sebep |
|---|---|---|---|
| **ADMIN** | ZORUNLU | İlk girişte zorunlu setup wizard | KVKK m.12 (veri kontrolörü) |
| **LAWYER** | ZORUNLU | 30 gün kullanım sonrası zorunlu setup | KVKK m.12 + UYAP entegrasyon güvenliği |
| **SALES** | ZORUNLU | İlk girişte zorunlu setup wizard | KVKK m.12 (müvekkil verisine erişim) |
| **REPRESENTATIVE** | ÖNERİLEN | YOK | Komisyon ve müvekkil bilgisi koruması |
| **CUSTOMER** | OPSİYONEL | YOK | UI'de teklif, KVKK m.11 hak |
| **Public Register** | — | Setup zorunlu değil, kayıt sonrası 5 dk toast | — |

**Backend:** TOTP RFC 6238 (speakeasy npm). Backup codes 10 × 8-haneli, bcrypt hash. Login flow: password → 2FA challenge (tempToken 5 dk JWT) → final JWT 24h. Recovery: backup code (tek kullanım, kullanılan kod silinir).

**5 Endpoint:**
- `POST /api/auth/setup-2fa` (auth) — secret + qrCode + otpauthUrl
- `POST /api/auth/verify-2fa` (auth) — token doğrula + enable + 10 backup code üret
- `POST /api/auth/disable-2fa` (auth + token) — devre dışı bırak
- `POST /api/auth/login-2fa` (public) — tempToken + otpToken → JWT
- `POST /api/auth/login-backup-code` (public, TUR #72.6 yeni) — tempToken + backupCode → JWT

**UI (DRY):** 4 component 5 rol paylaşır:
- `components/profile/ProfileLayout.tsx` — Hero + sections
- `components/profile/TwoFactorSection.tsx` — durum + aktivasyon
- `components/profile/TwoFactorSetupModal.tsx` — 4-step wizard
- `components/auth/TwoFactorChallenge.tsx` — login OTP + backup

**Security modülü `runActiveTask` 5 rol matrisi (Madde 30.10 ek):**
- ADMIN no_2fa → CRITICAL + ADMIN_FEED + email
- LAWYER no_2fa → CRITICAL (KVKK m.12 + UYAP)
- REPRESENTATIVE no_2fa → INFO log (login engel yok)
- CUSTOMER no_2fa → INFO log (opsiyonel)
- ACTION_TAKEN payload: `{ admin_no_2fa, lawyer_no_2fa, representative_no_2fa, customer_no_2fa, total_no_2fa }`

**Yasak:**
- ❌ ADMIN/LAWYER/SALES için 2FA opsiyonel saymak (KVKK m.12 ihlali)
- ❌ CUSTOMER için 2FA zorunlu yapmak (CTV düşüşü + onboarding sürtünmesi)
- ❌ Backup codes kullanımı sonrası kodu silmemek (tek kullanım kuralı)
- ❌ tempToken süresini 5 dk üstü uzatmak (güvenlik)
- ❌ SMS-only 2FA (TOTP standart, SMS phishing zayıf — gelecekte ek seçenek)
- ❌ 2FA otomatik aktive etme (KVKK + UX, Madde 24.11 ihlali)


---

### 30.30 — Provider Onay Doğruluk Disiplini (TUR #76)

**Kural:** Tüm 2FA / OTP / bildirim kanalları için **provider onayı** zorunlu kontrol — "API call yapıldı" yetersiz, "API onayladı + son ucu kanıtlandı" şart (Madde 4.4 emsali genişleme).

**1. Provider Response Kodu Kontrol ZORUNLU:**
- **SMS (NetGSM):** `response.code === '00'` (başarı) kontrolü; aksi takdirde throw + `ActivityLog SMS_OTP_FAILED` + `PhoneOtp.deleteMany`
- **Email (Resend/Nodemailer):** `messageId` yokluğu = hata; aksi takdirde throw + `ActivityLog EMAIL_OTP_FAILED`
- `result.success === false` veya yokluğu → throw, ASLA silent dön

**2. UI Doğruluğu:**
- "Gönderildi" mesajı **SADECE** provider onayı sonrası göster (provider response kanıt)
- Hata durumunda gerçek hata mesajı + **fallback CTA** ("E-posta yöntemini deneyin")
- 60 sn cooldown timer + "Gelmedi mi?" yönlendirme

**3. Phone Format Normalize (NetGSM):**
- `90XXX` 12 hane standart (mevcut `sms.service.js normalizePhone()`)
- International input (`+90`, `0090`) → otomatik normalize
- Geçersiz format → throw, ASLA göndermeye çalışma

**4. Boot-time ENV Validation:**
- `NETGSM_USERNAME/PASSWORD/HEADER` + `RESEND_API_KEY` veya SMTP eksik ise warn log
- Boot durdurma YOK (geri uyumluluk + mock mode fallback)

**5. ADMIN Sağlık Testi (TUR #76 R6 emsali):**
- `POST /api/auth/test-2fa-channel` (auth + ADMIN)
- 3 yöntem × tek tıkla smoke test
- Response: `{ method, ms, providerCode, providerMessage, mock, deliveryHint }`
- CEO Konsol UI'da "2FA Kanal Sağlık Testi" kartı (gelecek genişleme)

**6. Retry + Fallback Pattern:**
- SMS başarısız → frontend'de **"E-posta yöntemine geçin"** CTA
- Email başarısız → **"Authenticator App (TOTP) en hızlı"** CTA
- TOTP başarısız → **"SMS/Email'i deneyin"** CTA

**7. ActivityLog Ayrım Zorunlu:**
- `SMS_OTP_SENT` (provider onaylı) ↔ `SMS_OTP_FAILED` (provider hata)
- `EMAIL_OTP_SENT` ↔ `EMAIL_OTP_FAILED`
- Meta payload: `bulkId / messageId / errorCode / phoneMask / emailMask`

**TUR #76 emsal — 15. mimar hatası:**
TUR #74'te SMS akışında provider response kodu kontrolü yoktu. Backend `sms.service.js sendSms()` `{success:false}` döndürdü ama ASLA throw etmedi. `twoFactorOtp.service.js` bu dönüş değerini kontrol etmedi → ActivityLog yanlış `SMS_OTP_SENT` yazıldı → UI "SMS Gönderildi" yalanı. CEO 17:33 görsel kanıtla yakaladı.

**TUR #77 emsal — 15.1 mikro mimar hatası — Madde 30.30 R4 (ENV Tag Default Yasağı):**
Backend kod yazılırken `process.env.X` tag default seçimi YASAK — mevcut deployment ENV listesini taramadan (`Render dashboard` + `.env.example`) tek tag'e bağlanma silent failure riskini büyütür. **Geri uyumlu fallback zinciri** zorunlu:

```js
const username = process.env.X_PRIMARY      // mevcut deployment
              || process.env.X_FALLBACK     // önceki tag
              || process.env.X_LEGACY;      // eski kurulum
```

**TUR #77 emsali (15.1):** TUR #74'te NetGSM USERNAME tag'ine bağlandı (CEO Render uyumlu, doğru). Ama farklı deployment'larda `NETGSM_USERCODE` veya `NETGSM_USER` olabilir. Q1 fallback zinciri eklendi — tek backend kod tabanı tüm deployment'larda çalışır.

**Boot validation pattern:**
```js
(function bootValidate() {
  if (!getX()) console.warn("[Provider] EKSİK: X_PRIMARY (veya fallback)");
  // boot durmaz, geri uyumluluk + mock mode fallback
})();
```

**Madde 30.30 emsali genişleme:** "API call yapıldı + provider onayladı" yetersiz — **"ENV doğru tag okundu + provider onayladı + son ucu kanıtlandı"** zorunlu. ENV mismatch silent failure'ın gizli sebebi olabilir.

**Yasak:**
- ❌ "API call başarılı" silent return (success:false swallow)
- ❌ UI "Gönderildi" mesajı provider onayı olmadan
- ❌ ActivityLog `_SENT` ayrımı olmadan tek action ile (SENT vs FAILED ayrı)
- ❌ Phone normalize atlanması (NetGSM standart farklı dönüşler)
- ❌ Provider hatası durumunda fallback CTA göstermemek (kullanıcı çözüm yolu görmeli)


---

### 30.28 — 2FA Çoklu Yöntem Disiplini (TUR #74)

**Kural:** Tedbirge.ai 2FA için **3 yöntem destek** (kullanıcı tercih):

1. **TOTP** (Authenticator App) — önerilen, internet gerekmez
2. **SMS** — NetGSM Türkiye-içi KVKK uyumlu (mevcut `src/services/sms.service.js`)
3. **E-posta** — Nodemailer (mevcut `src/services/email.service.js`)

**Her yöntem ortak:**
- 6 haneli rastgele kod (`crypto.randomInt(100000, 1000000)`)
- TOTP: 30sn pencere ±1 (speakeasy)
- SMS: 5 dk geçerlilik + 1 dk rate limit (NetGSM ücreti)
- E-posta: 10 dk geçerlilik + 2 dk rate limit
- 10 backup kod, bcryptjs hash, tek kullanım
- KVKK ActivityLog: `SMS_OTP_SENT` / `EMAIL_OTP_SENT` (phoneMask + emailMask)

**Schema (mevcut yapı yeniden kullanım):**
- `User.twoFactorMethod`: TOTP | SMS | EMAIL (TUR #72.6'da eklenmişti)
- `User.phone` / `User.email` (mevcut)
- `PhoneOtp` tablosu (mevcut, `purpose: '2fa-sms' | '2fa-email'` field'ı kullan)
- **Yeni schema migration GEREK YOK** (TUR #74 emsali — mevcut yapıyı yeniden kullan)

**Endpoint'ler:**
- `POST /auth/setup-2fa` (TOTP, mevcut)
- `POST /auth/verify-2fa` (TOTP, mevcut)
- `POST /auth/setup-2fa-sms` (TUR #74 yeni)
- `POST /auth/verify-2fa-sms` (TUR #74 yeni)
- `POST /auth/setup-2fa-email` (TUR #74 yeni)
- `POST /auth/verify-2fa-email` (TUR #74 yeni)
- `POST /auth/login-2fa` (TOTP, mevcut)
- `POST /auth/login-send-otp` (SMS/EMAIL, TUR #74 yeni — tempToken sonrası OTP gönder)
- `POST /auth/login-verify-otp` (SMS/EMAIL, TUR #74 yeni — tempToken + otpToken + method)
- `POST /auth/login-backup-code` (3 yöntem ortak, mevcut)

**UI Pattern:**
- `TwoFactorSetupModal.tsx`: 4-step wizard, Step 1'de 3 yöntem radio (Yakında YASAK), Step 2 yönteme göre dallanır
- `TwoFactorChallenge.tsx`: Login akışında `User.twoFactorMethod`'a göre otomatik OTP gönder + 6 haneli kod + Resend cooldown

**ADMIN/LAWYER/SALES için zorunlu** (Madde 30.19 + 30.28).

**Yasak:**
- ❌ "Yakında" placeholder ile yöntem devre dışı bırakma (TUR #72.6 → #74 dersi: CEO 4 Mayıs'ta talep etti, hemen aktif)
- ❌ Yeni schema migration eklemek varsa mevcut yapı yeniden kullanma (PhoneOtp + User.twoFactorMethod)
- ❌ SMS/Email rate limit olmadan endpoint açma (NetGSM ücreti + spam riski)
- ❌ Login akışında method-bağımsız endpoint (her yöntem ayrı validation, cross-method DoS riski)
- ❌ Raw OTP kod DB'de saklamak istisnası SMS/Email TTL kısa olsa bile (PhoneOtp pattern: kullanıldığında delete)

**TUR #74 emsal — 13. mimar hatası kaydı:**
TUR #72.6'da backup codes eklerken `auth.controller.js:558,589` `require("bcrypt")` typo (paket `bcryptjs`). Production: `MODULE_NOT_FOUND` → 500 throw → CEO 4 Mayıs 16:16 ilk Authenticator denemesinde gördü. **Yeni kural (Madde 30.22 genişleme TUR #75'te):** Auth endpoint için GET smoke + POST happy path zorunlu (sadece 401 yetmez, deploy sonrası gerçek call test).


---

### 30.40 — Defense in Depth Disiplini (TUR #84)

**Kural:** Kritik güvenlik enforcement'ı (özellikle KVKK m.12 kapsamı 2FA/auth) **çok katmanlı** olmalı:

1. **Backend explicit flag** (Madde 30.29 R1) — login response `requiresTwoFactorSetup: true` + `redirectTo` + `setupMessage`
2. **Frontend handler** (Madde 30.29 R1 R+) — login page response.data flag'i okur, `router.replace("/2fa-secim")`
3. **Middleware redirect** (yeni — TUR #84 T1) — server-side cookie tabanlı bypass koruması

Tek katman yetersiz — kullanıcı doğrudan URL/API ile bypass denerse middleware engellemeli.

**TUR #84 T1 uygulaması:**
- `tedbirge-panel/proxy.ts` HARD_2FA_ROLES Set + TWO_FA_SETUP_ALLOWED_PATHS array
- Cookie `tedbirge_2fa_enabled` = '0' + HARD rol + setup-disi path → `/2fa-secim` redirect
- `lib/api.ts setToken(token, role, twoFactorEnabled)` → cookie set
- `clearToken()` → cookie temizle (logout sonrası bypass riski yok)

**Allowed setup paths (whitelist):** `/2fa-secim`, `/login`, `/_next`, `/favicon` (zorunlu setup wizard sırasında erişilebilir).

**27. mimar gözlem:** T0.5 keşfi — middleware proxy.ts ROLE_ALLOWED_ROUTES var ama 2FA setup zorlaması yoktu (kullanıcı direkt URL ile dashboard'a giderse bypass riski). Backend (TUR #82 V2) + Frontend (TUR #82 V3) zaten vardı, middleware eklendi → 3 katman tamam.

**Yasak:**
- ❌ Tek katman 2FA enforcement (kullanıcı URL/API direkt çağırırsa bypass)
- ❌ Cookie tabanlı middleware kontrolünü atlatmak için yeni endpoint'leri whitelist'e eklemeden açma
- ❌ `tedbirge_2fa_enabled` cookie'sini set etmemek (login sonrası middleware bilgi kaynağından mahrum)
- ❌ Geri uyumluluk gerekçesiyle 2FA bypass (KVKK m.12 ihlali kalıcılaşır)


---

### 30.49 — Auth Flow Atomik Transaction Disiplini (TUR #85.9)

**Kural:** Auth flow'un **5 ana dosyası** birlikte çalışır:
1. `proxy.ts` (server-side middleware redirect kararı)
2. `app/(public)/login/page.tsx` (client-side login form + setToken)
3. `app/(public)/2fa-secim/page.tsx` (client-side 2FA setup wizard + cookie senkron)
4. `app/(panel)/layout.tsx` (client/server layout — auth state guard)
5. `lib/api.ts` (apiFetch + setToken/clearToken/setTwoFactorEnabled helpers)

Birinde değişiklik yaparken **diğer 4'ünün uyumu kontrol edilmeden parça-bazlı patch YASAK**. Bug fix multi-dosya ise **TEK commit + tek push** (atomik transaction).

**Sebep — 34+35. mimar hatası kayıt:**
- 34: TUR #85.5'te 6 hipotez (A-F) verildi, sadece 1'i (Hipotez C cookie senkron) uygulandı, diğer 5 hipotez kanıt-bazlı doğrulanmadan reddedildi → ikinci/üçüncü bug'lar kaldı.
- 35: 5 dosya parça parça patch'lendi → satır-bazında uyumsuzluklar kaldı (örn. cookie set'i bir dosyada atomik değil, diğerinde bekleniyor → race condition).

**Çözüm pattern:**
1. Bug rapor edildiğinde: **5 dosya birlikte oku, BUG MATRİSİ çıkar (8 senaryo × 5 dosya tablosu)**
2. Her hücre ✅ doğru / ❌ bug / ⚠️ tehlikeli geçiş
3. Kanıtlı bug olan dosyalar: TEK commit (atomik transaction) — rollback tek revert
4. Kanıtlı bug olmayan dosyalar: **Madde 4.4 dokunma** (kod kaynaktır, gereksiz değişim yasak)

**Tartışma:** Mektup spec "5 dosya hep birlikte düzelt" diyebilir, ama Madde 4.4 kanıt-bazlı yaklaşım gerektirir. **Bug matrisi kanıtı olmayan dosya dokunulmaz** — atomik transaction sadece kanıtlı buggy dosyaları kapsar.

**Yasak:**
- ❌ Multi-dosya bug için ayrı ayrı commit (state inconsistency riski)
- ❌ Kanıtsız hipotezleri uygulamak (Madde 4.4 ihlal — kod kaynaktır)
- ❌ Bug matrisi olmadan auth flow patch (parça parça yamacılık → ardarda bug zinciri)
- ❌ Tek hipoteze odaklanıp diğer hipotezleri kanıt-bazlı reddetmemek (34. mimar hatası emsali)


---

### 30.49 R+ — Smoke Matrisi N Rol × ≥3 Senaryo Disiplini (TUR #87)

**Kural:** Auth flow değişikliği veya yeni rol eklemesi sonrası smoke testi **N rol × en az 3 senaryo** içermeli (authsız + ilk login 2FA setup + 2FA aktif login + protected route). **Authsız smoke yetersiz** — rol-bazlı login simülasyonu zorunlu.

**Sebep — 36. mimar hatası kayıt:** TUR #85.9 Q8 smoke 8 senaryo test edildi ama hepsi authsız `/dashboard` 307 redirect kontroluyle sınırlıydı. Rol-bazlı login simülasyonu test matrisinde yoktu. Sonuç: REPRESENTATIVE 2FA Challenge `onSuccess` handler'ında /temsilci eksikti (CUSTOMER + default /dashboard yalnızca) → ekstra hop → mobile RedirectGuard riski. CEO 6 May 18:41 Emine Çelik (REPRESENTATIVE) ERR_TOO_MANY_REDIRECTS (-310, Chrome mobile) ile yakaladı.

**Smoke matrisi standart formatı (4 rol × 3 senaryo = 12 senaryo minimum):**

| # | Rol | Senaryo | Beklenen |
|---|---|---|---|
| 1 | ADMIN | Authsız → /dashboard | 307 → /login |
| 2 | ADMIN | İlk login (2FA off) | 2FA setup → /2fa-secim |
| 3 | ADMIN | 2FA aktif login | /dashboard |
| 4 | LAWYER | Authsız → /lawyer-dashboard | 307 → /login |
| 5 | LAWYER | İlk login (2FA off) | HARD → /2fa-secim |
| 6 | LAWYER | 2FA aktif login | /lawyer-dashboard |
| 7 | REPRESENTATIVE | Authsız → /temsilci | 307 → /login |
| 8 | REPRESENTATIVE | İlk login (2FA off) | HARD → /2fa-secim |
| 9 | REPRESENTATIVE | 2FA aktif login | /temsilci |
| 10 | CUSTOMER | Authsız → /musteri | 307 → /login |
| 11 | CUSTOMER | İlk login | /musteri (SOFT) |
| 12 | CUSTOMER | 2FA aktif login | /musteri |

**Her rol için 3 minimum senaryo:**
1. **Authsız protected route** — middleware redirect doğrulaması
2. **İlk login (2FA off)** — HARD enforcement (ADMIN/LAWYER/SALES/REPRESENTATIVE) veya SOFT (CUSTOMER)
3. **2FA aktif login + role-aware redirect** — login/page.tsx onSuccess + 2fa-secim/page.tsx finishAndContinue + initial submit hepsi rol için doğru target

**Code curl multi-step session ile simüle edilebilir:** cookie jar + curl `-c/-b` flag'leri ile login → 2FA challenge → backup code → protected route session.

**Kalıcı önlem:** Madde 30.49 (Atomik Transaction) ile birlikte: 5 dosya bug matrisi + 4 rol × 3 senaryo smoke = tam koruma.

**Yasak:**
- ❌ Sadece authsız smoke ile auth flow değişikliği commit etmek (36. mimar hatası emsali)
- ❌ Tek rol smoke ile başka rolleri varsaymak (REPRESENTATIVE handle edildi sanılırken eksik kalabilir)
- ❌ /login HTML grep ile sekme sayma (client component, JS bundle DOM render — TUR #85 S8 emsali kanıtlı false alarm)
- ❌ 5 dosyadan biri için "kanıtlı bug yok" dediğinde rol-bazlı senaryoları atlamak (her rol minimum 3 senaryo)


---

### 30.50 — Login Smoke Disiplini (TUR #87.5)

**Kural:** Auth flow smoke testleri **sadece HTTP redirect kontrolü değil**, gerçek `POST /api/auth/login` + response.status + response.body kontrolü içermeli. Otonom HTTP simülasyonu zorunlu (curl `-X POST` + `-d` JSON body + `-w "HTTP_CODE:%{http_code}"`). Madde 30.49 R+ (Smoke Matrisi N Rol × ≥3 Senaryo) ile birlikte uygulanır.

**Sebep — 37. mimar hatası kayıt:** TUR #87 Q9 smoke 12 senaryo authsız HTTP redirect kontrolü ile sınırlıydı (`curl -sI /dashboard` → 307). Gerçek `POST /api/auth/login` simülasyonu yapılmadı, frontend error handling test edilmedi. CEO 6 May 19:36 Emine Çelik (REPRESENTATIVE Xiaomi mobile PWA app) Temsilci sekme + email + şifre → kırmızı muğlak hata + sekme Yönetici'ye sıfırlandı şikayetiyle yakaladı.

**Bug akışı:** lib/api.ts `apiFetch` 401 → `window.location.href = "/login"` HARD redirect → `?rol=temsilci` parametresi kayboluyor → varsayılan Yönetici sekmesi → "Oturum süresi doldu" muğlak mesaj. **Login DENEMESI** sırasında hard redirect yanlış davranış (gerçek session timeout ile karıştırılıyor). Backend zaten net mesaj dönüyor (401 "Geçersiz kullanıcı bilgileri", 403 "Hesap onay bekliyor") ama frontend hard redirect yüzünden mesaj gösterilmiyor + sekme + form state kayboluyor.

**Çözüm pattern:**

1. **`apiFetch` login endpoint ayrımı:** `path.startsWith("/auth/login")` kontrolü ile login DENEMESI 401 = sadece throw (login sayfası error.message gösterir). Authenticated endpoint 401 = gerçek session timeout, hard redirect doğru davranış.

2. **Sekme persistence:** Login sayfası rol seçici sekme değişiminde `window.history.replaceState` ile URL `?rol=` parametre update zorunlu (refresh + paylaşım + back button için).

3. **Backend response disiplini:** `{ success: false, message: "..." }` net Türkçe mesaj zorunlu. ASCII safe (Madde 9.2) — `Geçersiz` yerine `Gecersiz` (kod tabanı kuralı).

**Smoke matrisi standart formatı (4 rol × 4 alt-senaryo = 16):**

| # | Rol | Aksiyon | Beklenen Backend | Beklenen Frontend |
|---|---|---|---|---|
| 1 | ADMIN/LAWYER/REPRESENTATIVE/CUSTOMER | Yanlış şifre | 401 + "Gecersiz kullanici bilgileri" | Kırmızı kutu mesaj + sekme korundu + ?rol= URL'de |
| 2 | REPRESENTATIVE/LAWYER | Onay bekleyen hesap | 403 + "Hesabiniz onay bekliyor" | Kırmızı kutu + sekme korundu |
| 3 | Doğru hesap (2FA off) | Email + şifre doğru | 200 + requiresTwoFactorSetup=true (HARD rol) veya 200 + redirect | /2fa-secim wizard |
| 4 | Cross-role mismatch | ADMIN email + Temsilci sekme | 403 + correctRole=ADMIN | Sekme otomatik Yönetici'ye geçer + uyarı |

**Code curl multi-step simüle:**
```bash
# 4 rol × yanlış şifre
for role in temsilci yonetici hukukcu musteri; do
  curl -s -X POST "$BACKEND/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"yanlis_${role}@example.com\",\"password\":\"yanlis123\",\"requestedRole\":\"$role\"}" \
    -w "\nHTTP_CODE:%{http_code}"
done
# Beklenen: hepsi 401 + Gecersiz mesaj
```

**Yasak:**
- ❌ Sadece HTTP redirect smoke ile auth flow değişikliği commit etmek (37. mimar hatası emsali)
- ❌ `apiFetch` 401 handling'i tek davranışla bırakmak (login DENEMESI ≠ session timeout — ayrım zorunlu)
- ❌ Backend net mesajı frontend'de gösterilmediği halde "smoke geçti" demek
- ❌ Smoke regex'inde Türkçe karakter (Madde 9.2 ASCII safe — kod kaynağı `Gecersiz` yazıyor, regex `Gecersiz` aramalı)
- ❌ Sekme persistence URL update'siz bırakmak (refresh sonrası kullanıcı varsayılan sekmeye düşer = UX bug)


---

### 30.52 — Gizli Mod ve NUM_REDIRECTS Disiplini (TUR #89)

**Kural:** Auth flow bug raporlandığında **HTTP-level döngü kanıtı** için `curl -L --max-redirs 20 -o /dev/null -w "%{num_redirects}"` ile `NUM_REDIRECTS` ölçümü zorunludur. Cookie state matrisi (4 rol × 2 2FA durumu = 8 senaryo) ile gerçek browser state simülasyonu yapılır.

**NUM_REDIRECTS yorum tablosu:**

| NUM | Yorum | Aksiyon |
|---|---|---|
| 0-1 | Normal — döngü yok | Bug çevre faktörü olabilir, Madde 30.51 emsali |
| 2-3 | Beklenen multi-hop (örn. /protected → /login → /2fa-secim) | Akış doğru, kontrol et |
| 4-5 | Şüpheli — normal multi-hop sınırı | Detaylı verbose inceleme |
| ≥6 | **KOD-BUG kesin** — HTTP-level döngü | Atomik fix zorunlu |
| 20 (max) | Döngü kesin | KIRMIZI eşik fix zorunlu |

**Cookie state matrisi (zorunlu test):**

```bash
# 8 senaryo minimum:
for role in REPRESENTATIVE LAWYER ADMIN SALES; do
  for twoFa in 0 1; do
    COOKIE="tedbirge_token=fake; tedbirge_role=$role; tedbirge_2fa_enabled=$twoFa"
    NUM=$(curl -s -L --max-redirs 20 -H "Cookie: $COOKIE" -o /dev/null -w "%{num_redirects}" "$PROD/<target_route>")
    echo "[$role 2fa=$twoFa] NUM=$NUM"
  done
done
# CUSTOMER soft 2FA için ayrıca test edilir
```

**Sebep — 39. mimar hatası kayıt (TUR #88 yetersiz inceleme):** TUR #88 X1 sahte cookie testi sadece "token YOK + 2fa=1" ve "role YOK + 2fa=1" varyasyonlarını test etti — **2fa=0 + REPRESENTATIVE tam authenticated senaryo eksikti**. CEO 6 May 19:50 Emine Çelik 9 ekran kanıtı + Chrome gizli mod testi (cache/SW/cookie sıfır) ERR_TOO_MANY_REDIRECTS ile yakaladı. TUR #88 "çevre faktörü" tanısı YANLIŞTI.

TUR #89 X1'de tam cookie matrisi test edildi:
- REPRESENTATIVE 2fa=1 → NUM=0 ✅
- REPRESENTATIVE 2fa=0 → **NUM=20 (max — DÖNGÜ KESİN)** ❌

Verbose çıktı:
```
GET /temsilci → 307 → /2fa-secim
GET /2fa-secim → 307 → /temsilci
GET /temsilci → 307 → /2fa-secim
... döngü
```

**Kök sebep:** `proxy.ts` HARD 2FA enforcement bloğu setup allowed path durumunda **early return next() YAPMIYOR**, alttaki `isAllowed` kontrolü tetikleniyor. /2fa-secim ROLE_ALLOWED_ROUTES.REPRESENTATIVE içinde olmadığı için defaultLanding → /temsilci → 2FA enforcement → /2fa-secim → DÖNGÜ. Tek satır fix: setup allowed branch'inde `return NextResponse.next()`.

**Gizli mod kanıtı kritik:** Tarayıcı cache/SW/cookie sıfır olsa bile bug devam ediyorsa **kesin kod-bug**. Çevre faktörü hipotezi reddedilir.

**Madde 30.51 ile ilişki:** Madde 30.51 "ham kodda kanıt yoksa çevre faktörü" diyordu. TUR #89 emsali — **kanıt arayışı tek varyasyonla sınırlanmamalı**. Cookie state matrisi (8 senaryo) zorunlu. Eksik test = yanlış teşhis.

**Gizli mod test protokolü:**
1. Browser → New Incognito/InPrivate Window
2. Login → 2FA setup → target route ziyaret
3. ERR_TOO_MANY_REDIRECTS oluşursa **kesin kod-bug** (cache/SW/cookie sıfır)
4. CEO ekran kaydı → Code curl multi-step simülasyon → NUM_REDIRECTS ölçümü

**Yasak:**
- ❌ Auth flow bug için NUM_REDIRECTS ölçümü atlanması (39. mimar hatası emsali)
- ❌ Cookie state matrisinden 1-2 senaryo test edip "tam test" demek (8 senaryo minimum)
- ❌ Gizli mod kanıtı sunulduğu halde "çevre faktörü" demek (Madde 30.51 R+ — gizli mod = kesin kod-bug)
- ❌ NUM ≥ 6 alındığı halde "kod fix yapmadım" demek (KIRMIZI eşik fix zorunlu)
- ❌ HARD 2FA enforcement setup allowed path'lerde early return atlanması (39. mimar hatası emsali)

---

---

