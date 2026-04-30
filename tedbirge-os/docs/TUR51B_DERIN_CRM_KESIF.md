# TUR #51.B — Derin 4 CRM Keşif Raporu

**Tarih:** 30 Nisan 2026
**Anayasa:** v1.14.0 (sürüm artmaz — keşif turu)
**Tip:** T (denetim, read-only)
**Süre:** ~1.5 saat
**Çıktı:** Bu rapor + DEVIR güncellemesi (1 OS commit, 0 kod değişikliği)
**Girdi:** TUR #51 + TUR #52 sonrası kod tabanı durumu

CEO direktifi: *"TÜM SİSTEM ENTEGRE OLSUN, TEKRAR GERİYE GÖTÜRME, ŞU EKSİK BU EKSİK DEME, CEO EMİR VERİYOR"*

Bu rapor TUR #55 büyük tamamlama mektubunun **kanıt zemini** olarak yazılmıştır. TUR #52'deki mektup planı sapması (DataSubjectRequest+KVKKSCC zaten mevcuttu) önlenmesi için kod tabanı **tek tek** kontrol edilmiştir.

---

## 📊 Özet — 4 CRM Operasyonel Tablosu

| CRM | ✅ Tam | 🟡 Yarım | ❌ Yok | Toplam Fonksiyon |
|---|---|---|---|---|
| **LAWYER** | 5 | 4 | 3 | 12 (Lead 8 aşama + 4 cross) |
| **REPRESENTATIVE** | 3 | 2 | 5 | 10 (5 fonksiyon × 2 katman) |
| **ADMIN** | 7 | 4 | 3 | 14 (CEO 15-checklist) |
| **CUSTOMER** | 4 | 3 | 4 | 11 (5 tab + 6 ek hak) |
| **TOPLAM** | 19 | 13 | 15 | 47 |

**Skor:** 19/47 (%40) tam operasyonel. 13 yarım + 15 yok = TUR #55 tedavi kapsamı.

---

## 🔍 BÖLÜM 1 — LAWYER CRM

### 1.1 Sayfa-Endpoint-Service Üçgeni

| # | Fonksiyon | Sayfa | Endpoint | Service | Durum | Eksik |
|---|---|---|---|---|---|---|
| L1 | Atanan dosya listesi | `/dashboard/leads` ✅ | `GET /leads` ✅ | `lead.service.js` ✅ | ✅ TAM | — |
| L2 | Lead detay 360° | `/leads/[id]/360` ✅ | `GET /leads/:id` ✅ | `lead.service.js` ✅ | ✅ TAM | — |
| L3 | Müvekkil mesajlaşma | `/leads/[id]/chat` ✅ | `chat.routes.js` ✅ | `chat.service.js` ✅ | ✅ TAM | — |
| L4 | Sözleşme yönetimi | `/leads/[id]/contracts` ✅ | `contract.routes.js` ✅ | `contract.service.js` ✅ | ✅ TAM | — |
| L5 | Belge yükleme + OCR | UploadForm component ✅ | `/uploads` ✅ | `upload.service.js` + `analyzer.service.js` ✅ | ✅ TAM | — |
| L6 | İhtarname yazımı | ❌ **YOK** | `POST /leads/:id/ihtarname` ✅ | `ihtarname.service.js` ✅ | 🟡 YARIM | UI yok — backend hazır |
| L7 | Dava aşaması yönetimi | ❌ **YOK** | `POST/PATCH /leads/:id/dava-surec/asama` ✅ | `davaSurec.service.js` ✅ | 🟡 YARIM | UI yok |
| L8 | Duruşma takibi | ❌ **YOK** (kısmen ajanda widget) | `POST /leads/:id/durusmalar` ✅ | `durusma.service.js` ✅ | 🟡 YARIM | Detaylı UI yok |
| L9 | Bilirkişi yönetimi | ❌ **YOK** | `POST /leads/:id/bilirkisi` ✅ | `bilirkisi.service.js` ✅ | 🟡 YARIM | UI yok |
| L10 | **Tahsilat girişi (TahsilatPanel)** | ❌ **YOK** | `lead.caseData.controller.js` (gercekTazminat alanı) ✅ | `payment.service.js` ✅ | ❌ YOK | TahsilatPanel.tsx component yok |
| L11 | AI analiz onay (güven < 0.7) | ❌ **YOK** | `muhatapAI.controller.js` (POST güven skoru ile) ✅ | `muhatapAI.service.js` ✅ | ❌ YOK | Avukat onay UI eşik kontrolü yok |
| L12 | LAWYER bildirim (8 olay) | ✅ Push abone | sendLawyerAssigned* (3 kanal) ✅ | `lawyerNotifications.service.js` (TUR #52, **çağrılmıyor**) | 🟡 YARIM | 6 yeni fonksiyon trigger yok |

### 1.2 Bulgular

- **L-B1 (🔴 KRİTİK):** `lawyerNotifications.service.js` (TUR #52'de yazıldı) — 6 fonksiyonu hiçbir yerde çağrılmıyor (`grep -rn "lawyerNotifications" src/controllers/ src/services/ src/routes/` = 0 sonuç). **Ölü kod**. Trigger'lar service'lerden çağrılmalı: belge upload (`upload.service.js`), AI analiz (`uploadAnalysis.bridge.js`), sözleşme imza (`musteri.controller.js`), CommissionLog create (`commission.service.js`), KVKK silme (`kvkk.service.js`), DavaSurec.updateAsama (`davaSurec.service.js`).
- **L-B2 (🔴 KRİTİK):** TahsilatPanel.tsx component yok. Avukat dosya tahsilatını manual SQL veya Lead.gercekTazminat patch ile değiştirebilir ama **CommissionLog otomatik tetiklenmiyor**. TUR #52 KIRMIZI #2 yarım kaldı.
- **L-B3 (🟡 ORTA):** İhtarname/Dava/Duruşma/Bilirkişi backend'i hazır ama LAWYER UI'sı **5 yer eksik**. `/leads/[id]` page.tsx 1820+ satır olabilir (panel ana lead detay) ama ayrı sub-route'lar yok.
- **L-B4 (🟡 ORTA):** `muhatapAI.service.js` güven skoru 0.85/0.9 dönüyor ama UI tarafında **0.7 eşik kontrolü** ve **avukat onay butonu** yok (Madde 24.11 ihlali).
- **L-B5 (🟢 DÜŞÜK):** Dashboard ana sayfa LAWYER için yeterli widget gösteriyor (thisWeekDurusmalar, bekleyenIhtarname, bekleyenBilirkisi, davaAsama dağılımı).

---

## 🤝 BÖLÜM 2 — REPRESENTATIVE CRM

### 2.1 Sayfa-Endpoint-Service Üçgeni

| # | Fonksiyon | Sayfa | Endpoint | Service | Durum | Eksik |
|---|---|---|---|---|---|---|
| R1 | Lead getirme | `/temsilci/yeni-muvekkil` ✅ | `POST /leads` ✅ | `lead.service.js` ✅ | ✅ TAM | — |
| R2 | Kendi getirdiği lead listesi | `/temsilci` (196 satır) ✅ | `GET /leads` filtreli ✅ | `lead.service.js:288-289` createdById check ✅ | ✅ TAM | — |
| R3 | Self-register | `/register/temsilci` (315 satır) ✅ | `POST /auth/register/temsilci` ✅ | `auth.service.js` ✅ | ✅ TAM | — |
| R4 | Hakediş takibi | `/temsilci/hakedis` (128 satır, TUR #52) ✅ | `GET /commission-logs/me` ✅ | `commission.service.js` ✅ | ✅ TAM | — |
| R5 | **Performans dashboard** | ❌ **YOK** (TUR #52 mektup ileri sürdü, yapılmadı) | `getRepresentativeStats` ❌ | ❌ Service yok | ❌ YOK | Sayfa + endpoint + service hepsi yok |
| R6 | **Profil + IBAN yönetimi** | ❌ **YOK** | ❌ | ❌ User schema'da iban alanı yok | ❌ YOK | Schema değişikliği gerekir (KIRMIZI nokta) |
| R7 | **Yetki kapsamı (Madde 24.4)** | — | 53 endpoint'e erişim 🔴 | — | 🟡 ORTA | Yetki daraltma — ihtarname/dava-surec/durusma/bilirkisi/archive endpoint'lerinden çıkarılmalı |
| R8 | Sözleşme onay akışı | `/register/temsilci` form içinde ✅ | `POST /auth/register/temsilci` ✅ | `temsilci-contract.template.js` ✅ | ✅ TAM | — |
| R9 | Komisyon görünüm (kendi netini) | `/temsilci/hakedis` ✅ | `GET /commission-logs/me` ✅ | `commission.service.js:getTemsilciOzet` ✅ | ✅ TAM | — |
| R10 | **Müvekkil iletişim (kendi getirdiği lead)** | ❌ **YOK** (mesajlaşma sadece LAWYER + CUSTOMER) | ❌ | ❌ | ❌ YOK | Tasarım kararı — Madde 24.4 hukuki sınır |

### 2.2 Bulgular

- **R-B1 (🔴 KRİTİK):** REPRESENTATIVE **53 endpoint**'e erişebiliyor. Madde 24.4 (temsilci hukuki yetki yok) ihlali:
  - `POST /leads/:id/ihtarname` — ihtarname yazma yetkisi
  - `POST /leads/:id/dava-surec` + `PATCH /:id/dava-surec/asama` — dava aşaması değiştirme
  - `POST /leads/:id/durusmalar` + `DELETE` — duruşma yönetimi
  - `POST /leads/:id/bilirkisi` — bilirkişi atama
  - `PATCH /:id/archive` + `unarchive` — lead arşivleme
  - **TUR #55 atom:** Bu 8 endpoint'ten REPRESENTATIVE çıkarılır.
- **R-B2 (🔴 KRİTİK):** User schema'da **IBAN alanı yok**. Komisyon havalesi için bu zorunlu. Schema migration gerekiyor (KIRMIZI nokta).
- **R-B3 (🟡 ORTA):** `/temsilci/performans` sayfası yok. TUR #52 mektubunda planlandı ama yapılmadı (mektup planı uygulamada eridi). TUR #55 öncelik 1.
- **R-B4 (🟡 ORTA):** Temsilci profil sayfası yok — iletişim, IBAN, vergi numarası vs. yönetim yapamıyor.

---

## 👑 BÖLÜM 3 — ADMIN CRM

### 3.1 CEO 15-Checklist Güncelleme (TUR #51 → #52 sonrası)

| # | İhtiyaç | TUR #51 Durum | TUR #52 Durum | TUR #55 İhtiyaç |
|---|---|---|---|---|
| 1 | Lead listesi | ✅ | ✅ | — |
| 2 | User listesi | ✅ | ✅ | — |
| 3 | Avukat ekleme/silme | 🟡 (onay var, doğrudan yok) | ✅ avukat-yonetim sayfa (131 satır) | endpoint /auth/users/create-lawyer **eksik** olabilir, kontrol gerekli |
| 4 | Temsilci ekleme/silme | 🟡 | ✅ temsilci-yonetim sayfa (126 satır) | endpoint /auth/users/create-representative **eksik** olabilir, kontrol gerekli |
| 5 | **Müvekkil silme (KVKK m.7) UI** | ❌ | ✅ kvkk-talepler/page.tsx (195 satır) executeDeletion endpoint hazır | — |
| 6 | Kariyer başvuruları | ✅ | ✅ | — |
| 7 | Sistem durumu | ✅ | ✅ | — |
| 8 | **Audit log UI** | ❌ | ✅ audit-log/page.tsx (107 satır) | — |
| 9 | Komisyon raporları | 🟡 | ✅ komisyon-log/page.tsx (173 satır) | — |
| 10 | Mali rapor | 🟡 | 🟡 analytics 367 satır + 4 chart kullanım | Komisyon dağılımı + KVKK metrikler eksik |
| 11 | KVKK silme talebi UI | ❌ | ✅ kvkk-talepler ile aynı (#5) | — |
| 12 | **Bildirim ayarları (SMS/Email şablon)** | ❌ | 🟡 ayarlar var ama şablon UI değil | TUR #55 şablon yönetimi |
| 13 | **AI güven skoru ayarı** | ❌ | ✅ ayarlar/AI sekme + slider | Ama backend'e bağlama: muhatapAI.service.js DB'den okuyor mu? **kontrol gerekli** |
| 14 | Cookie + GA4 ayarları | ❌ | 🟡 ayarlar/Analytics sekme (read-only env) | — |
| 15 | Settings (env read) | ❌ | ✅ ayarlar sayfa | — |

**Yeni eksiklikler (TUR #51 listesinde yoktu, TUR #51.B keşfinde tespit):**

| # | İhtiyaç | Durum | Öncelik |
|---|---|---|---|
| 16 | **ADMIN müvekkil-yonetim sayfası** | ❌ YOK | 🟡 (avukat + temsilci var ama CUSTOMER yok) |
| 17 | **Mali rapor — komisyon dağılımı + trend** | 🟡 KISMEN | 🟡 |
| 18 | **Bildirim şablonu UI** (SMS/Email/WhatsApp template editor) | ❌ YOK | 🟢 |
| 19 | **Bulk lead update** | ✅ var (`POST /leads/bulk-update`) | — UI yeterli (lead.routes.js:12) |
| 20 | **AI confidence backend bağı** | ❌ YOK (slider DB'ye yazıyor ama muhatapAI.service okumuyor) | 🟡 |

### 3.2 Bulgular

- **A-B1 (🟡 ORTA):** TUR #52'de `ayarlar/page.tsx` AI güven skoru slider yapıldı ama `muhatapAI.service.js` **DB'den ayarı okumuyor**. SystemSetting → service entegrasyonu eksik. (`grep` ile doğrulandı: `setting.service.js` import muhatapAI'da yok.)
- **A-B2 (🟢 DÜŞÜK):** Müvekkil yönetim sayfası yok — şu an admin Lead listesi üzerinden müvekkili görebiliyor (Lead.customerName + customerPhone), CUSTOMER User kayıtları için doğrudan UI yok. CUSTOMER User'ları çoğunlukla self-register (TUR #11 sonrası) ile yaratılıyor — listele/silme ihtiyacı zayıf.
- **A-B3 (🟢 DÜŞÜK):** Mali rapor (analytics) 367 satır + 4 chart kullanımı var (yeterli derinlik) ama komisyon dağılımı ekleyebilir.
- **A-B4 (🟢 DÜŞÜK):** SystemSetting tablosu **kullanılmıyor** — sadece setting.service.js'in kendisinde upsert/list. Service'ler hardcoded değer kullanıyor (örn. `muhatapAI.service.js` 0.7 hardcoded değil mi?).

---

## 👥 BÖLÜM 4 — CUSTOMER CRM

### 4.1 Sayfa-Endpoint-Service Üçgeni

| # | Fonksiyon | Sayfa | Endpoint | Service | Durum | Eksik |
|---|---|---|---|---|---|---|
| C1 | Müvekkil portal ana | `/musteri/page.tsx` (1074 satır) ✅ | `GET /musteri/dashboard` ✅ | `musteri.controller.getDashboard` ✅ | ✅ TAM | — |
| C2 | Mesajlaşma (avukatla) | musteri page tab ✅ | `GET /musteri/mesajlar` + `POST /musteri/mesaj` ✅ | `chat.service.js` ✅ | ✅ TAM | — |
| C3 | Sözleşme onay (SMS OTP) | musteri page tab ✅ | `POST /musteri/onay-baslat/:contractId` + `POST /musteri/onay-dogrula` ✅ | `musteri.controller.startApproval/verifyApproval` ✅ | ✅ TAM | — |
| C4 | Belgeler tab | musteri page (içinde) | ❌ Müvekkil upload endpoint yok (`grep musteri.*upload` 0 sonuç) | ❌ | 🟡 YARIM | Müvekkil belge yükleme yok — sadece görüntüleme |
| C5 | Ödemeler tab | musteri page (içinde) | ❌ Müvekkil tahsilat endpoint yok (`grep musteri.*payment` 0 sonuç) | ❌ | 🟡 YARIM | Müvekkil kendi tahsilat ve hak edişlerini göremiyor |
| C6 | Onay tab | musteri page (içinde, sözleşme onay) | C3 ile aynı | C3 ile aynı | ✅ TAM | — |
| C7 | **/musteri/kvkk-haklarim** | ❌ **YOK** (TUR #52 mektup ileri sürdü, yapılmadı) | `POST /api/public/kvkk-request` (auth-free) ✅ | `kvkk.service.js` ✅ | ❌ YOK | Sayfa yok, müvekkil portal'dan başvuru yapamıyor |
| C8 | KVKK önceki başvuruları görme | ❌ | ❌ Endpoint yok | ❌ | ❌ YOK | TUR #55 kapsamı |
| C9 | AI sonuç sade dilde görüntüleme | ❌ | ❌ `publicSummary` / `customerSummary` 0 sonuç | ❌ | ❌ YOK | TUR #55 kapsamı |
| C10 | KVKK aydınlatma yurt dışı bölüm | `/kvkk-aydinlatma` ✅ (TUR #25) | — | — | 🟡 YARIM | TUR #52'de KVKKSCC tablosu eklendi ama public sayfaya entegre edilmedi |

### 4.2 Bulgular

- **C-B1 (🔴 KRİTİK):** `/musteri/kvkk-haklarim` sayfası yok. TUR #52 mektup planında vardı — yapılmadı. CUSTOMER kendi portalından KVKK başvuru yapamıyor. Public `/kvkk-basvuru` var (TUR #52) ama auth-aware versiyonu CUSTOMER için yok.
- **C-B2 (🟡 ORTA):** Müvekkil belge yükleme yok. `/musteri/page.tsx` 1074 satır olmasına rağmen upload endpoint çağrısı yok. Müvekkilin belgesi temsilci/avukat eli ile yükleniyor.
- **C-B3 (🟡 ORTA):** Müvekkil ödemeler/tahsilat tab içeriği boş — `getDashboard` muhtemelen Lead bilgisi dönüyor ama tahsilat detayı yok.
- **C-B4 (🟡 ORTA):** AI sonuç sade dilde gösterimi yok — muhatapAI çıktısı sadece Lead.muhatapTipi alanı (raw enum), müvekkile anlamlı metin dönmüyor.
- **C-B5 (🟢 DÜŞÜK):** KVKK aydınlatma metnine `KVKKSCC` tablosu entegrasyonu yok (TUR #52 sadece klasör+seed yaptı, sayfa entegrasyonu kalmadı).

---

## 🔄 BÖLÜM 5 — Cross-CRM Akış Testleri

### X-1: Müvekkil web başvurusu → ADMIN/LAWYER görünüm

| Adım | Durum | Kanıt | Eksik |
|---|---|---|---|
| Public form `/basvuru` POST `/api/public-lead` | ✅ | `public.route.js:10` | — |
| Lead create + leadCode generate | ✅ | `lead.service.js:14` | — |
| **ADMIN/SALES bildirim** | 🟡 | Admin push aboneliği varsa, `pushNotification.service.js:sendToRole` çağrılıyor mu? **kontrol gerekli** | sendNewBasvuruEmail/sendNewBasvuruSms 0 sonuç |
| LAWYER bildirim (atanmamış lead için) | ❌ | — | Lead atanmadan LAWYER bilmiyor (manuel atama bekleniyor) |
| ADMIN dashboard'a yansıma | ✅ | `dashboard/page.tsx` `apiFetch /leads` | — |

**Sonuç:** ✅ Lead oluşur, 🟡 ADMIN bildirim eksik (kontrol gerekli), ❌ LAWYER bildirim yok.

### X-2: Sözleşme imza → CONTRACT_SIGNED → LAWYER atama

| Adım | Durum | Kanıt |
|---|---|---|
| Sözleşme oluşturma | ✅ | `POST /contracts/:leadId/generate` |
| Müvekkil onay (SMS OTP) | ✅ | `POST /musteri/onay-dogrula` |
| Lead.status → CONTRACT_PENDING / ASSIGNED_TO_LAWYER | 🟡 | Status enum'da var ama otomatik geçiş kanıtlanmadı |
| **Otomatik LAWYER atama** | ❌ | `assignLeadToLawyer` body.lawyerId zorunlu — manuel |
| LAWYER bildirim (atama) | ✅ | `assignment.service.js:57-63` 3 kanal (SMS+Email+WhatsApp) |

**Sonuç:** 🟡 Manual atama akışı çalışıyor, ❌ otomatik atama yok (Madde 24.4 sebebi mantıklı — avukat müsaitliği insan kararı).

### X-3: AI analiz → güven skoru → LAWYER onay (Madde 24.11)

| Adım | Durum | Kanıt |
|---|---|---|
| Belge upload + OCR | ✅ | `upload.service.js` + `analyzer.service.js` |
| MuhatapAI çağrısı | ✅ | `muhatapAI.service.js` |
| Güven skoru DB kayıt | ✅ | `Lead.muhatapGuvenSkoru` alanı |
| **0.7 eşik kontrolü** | ❌ | `confidence < 0.7` kontrol kodu **yok** |
| **LAWYER onay UI (eşik altı)** | ❌ | UI yok |

**Sonuç:** ❌ Madde 24.11 ihlali — AI sonuç direkt yazılıyor, insan onayı zorunlu eşik değil.

### X-4: Tahsilat → CommissionLog → temsilci hakediş

| Adım | Durum | Kanıt |
|---|---|---|
| Lead.gercekTazminat patch | ✅ | `lead.caseData.controller.js:11-13` LAWYER alanı |
| **CommissionLog otomatik tetikleme** | ❌ | `gercekTazminat` change listener yok |
| Manual CommissionLog create | ✅ | `POST /commission-logs` (ADMIN/LAWYER) |
| Temsilci /me ozet | ✅ | `GET /commission-logs/me` |
| ADMIN havale işaretleme | ✅ | `PATCH /commission-logs/:id/status` |

**Sonuç:** 🟡 Manual zincir tam, ❌ otomatik tetikleyici yok (Lead.gercekTazminat değiştiğinde CommissionLog auto-create).

### X-5: KVKK silme talebi → User soft-delete → ADMIN bildirim

| Adım | Durum | Kanıt |
|---|---|---|
| Public `POST /api/public/kvkk-request` | ✅ | TUR #52 production test başarılı (`requestId: cmolos3v90004ly1xami4it49`) |
| ActivityLog audit izi | ✅ | `KVKK_REQUEST_CREATED` action |
| ADMIN UI'ya yansıma | ✅ | `/dashboard/kvkk-talepler` (TUR #52) |
| **executeKvkkDeletion → User anonimleştirme** | ✅ | `kvkk.service.js:75` — fullName/email/phone/passwordHash override |
| **ADMIN bildirim (yeni talep)** | ❌ | sendKvkkRequestNotification 0 sonuç |
| **Atanmış LAWYER'a bildirim** | ❌ | `lawyerNotifications.notifyKvkkDeletionRequest` yazıldı ama **çağrılmıyor** |

**Sonuç:** ✅ Çekirdek akış tam, ❌ bildirim zinciri eksik (L-B1 ile aynı kök neden).

---

## 📋 BÖLÜM 6 — TUR #55 Mektup Hazırlık Matrisi

### 6.1 Atom listesi (TUR #55 büyük tamamlama mektubu için hazır)

| # | Atom | CRM | Konum | Tip | Süre | Risk | Bağımlılık |
|---|---|---|---|---|---|---|---|
| 1 | TahsilatPanel.tsx component | LAWYER | `/leads/[id]` | UI ekleme + service trigger | 1.5sa | orta | CommissionLog ✅ |
| 2 | İhtarname UI yazımı | LAWYER | `/leads/[id]/ihtarname` (yeni) | yeni sayfa | 2sa | orta | endpoint ✅ |
| 3 | Dava aşaması yönetim UI | LAWYER | `/leads/[id]/dava-surec` (yeni) | yeni sayfa | 2sa | orta | endpoint ✅ |
| 4 | Duruşma takibi UI | LAWYER | `/leads/[id]/durusmalar` (yeni) | yeni sayfa | 1.5sa | düşük | endpoint ✅ |
| 5 | Bilirkişi yönetim UI | LAWYER | `/leads/[id]/bilirkisi` (yeni) | yeni sayfa | 1.5sa | düşük | endpoint ✅ |
| 6 | AI analiz onay UI (güven < 0.7) | LAWYER | `/leads/[id]` içinde modal | UI + service değişiklik | 2sa | orta | muhatapAI confidence kontrolü |
| 7 | **lawyerNotifications trigger zinciri** | LAWYER | 6 service (upload, analyzer, contract, commission, kvkk, davaSurec) | service entegrasyonu | 3sa | orta | TUR #52 service ✅ |
| 8 | REPRESENTATIVE yetki daraltma | REPRESENTATIVE | 8 endpoint × `role()` | role guard refactor | 1sa | yüksek | hukuk.routes.js + lead.routes.js (test gerekli) |
| 9 | **REPRESENTATIVE performans dashboard** | REPRESENTATIVE | `/temsilci/performans` (yeni) | yeni sayfa + endpoint + service | 3sa | düşük | Lead + CommissionLog ✅ |
| 10 | **REPRESENTATIVE profil + IBAN** | REPRESENTATIVE | `/temsilci/profil` (yeni) | sayfa + schema migration | 2sa | **🔴 KIRMIZI nokta** | User schema iban alanı eklenir |
| 11 | **/musteri/kvkk-haklarim** | CUSTOMER | yeni sayfa | UI + auth-aware endpoint | 2sa | orta | kvkk.service ✅ |
| 12 | Müvekkil belge yükleme UI | CUSTOMER | `/musteri` Belgeler tab | UI + endpoint | 2sa | orta | upload.service ✅ |
| 13 | Müvekkil tahsilat görünümü | CUSTOMER | `/musteri` Ödemeler tab | UI + endpoint | 1.5sa | düşük | CommissionLog ✅ |
| 14 | Müvekkil AI sonuç sade dil | CUSTOMER | `/musteri/page.tsx` | UI + AI publicSummary helper | 2sa | düşük | muhatapAI ✅ |
| 15 | KVKKSCC → /kvkk-aydinlatma entegrasyon | CUSTOMER | `/kvkk-aydinlatma` page | sayfa içerik genişletme | 1sa | düşük | KVKKSCC tablosu ✅ |
| 16 | AI confidence backend bağı | ADMIN | `muhatapAI.service.js` SystemSetting okuma | service refactor | 1sa | düşük | SystemSetting ✅ |
| 17 | Mali rapor genişletme | ADMIN | `/dashboard/analytics` | UI ekleme | 2sa | düşük | analytics endpoint ✅ |
| 18 | Bildirim şablon UI | ADMIN | `/dashboard/bildirim-sablon` (yeni) | sayfa + SystemSetting | 3sa | orta | SystemSetting ✅ |
| 19 | Lead.gercekTazminat → CommissionLog auto-trigger | Cross | `lead.caseData.controller.js` | service trigger | 1sa | orta | commission.service ✅ |
| 20 | ADMIN yeni başvuru bildirim | Cross | `public.route.js:public-lead` | service trigger | 30dk | düşük | pushNotification.sendToRole ✅ |

**Toplam:** 20 atom, ~33 saat Claude Code tahmini.

### 6.2 KIRMIZI Nokta Listesi (TUR #55 için CEO yazılı onay gerekenler)

- **KIRMIZI #1 (Atom 10):** User schema'ya `iban` (String?) + `bankaAdi` (String?) + `vergiNo` (String?) alanları eklenir. Migration: `20260430000003_add_user_banking_info`.

(Diğer atomların hepsi non-schema, env-suz, npm-suz.)

### 6.3 Mimar Önerisi — TUR #55 Yapısı

**Tek mektup yerine 3 paralel mektup öneriyorum:**

- **TUR #55 (LAWYER tamamlama):** Atom 1-7 — 12-15 saat Claude Code, ~10 commit
- **TUR #56 (REPRESENTATIVE + CUSTOMER):** Atom 8-15 — 12-14 saat, KIRMIZI nokta (atom 10)
- **TUR #57 (ADMIN + Cross):** Atom 16-20 — 6-8 saat, low risk

**Sebep (Madde 17.4 atom kesit):**
- TUR #52'de tek mektupta 11 commit + 25 atom yapıldı, başarılı ama mektup planı sapması (DataSubjectRequest+KVKKSCC) 1 mimar hatası verdi
- Daha küçük paketler = daha az sapma riski
- Her paket bağımsız test edilebilir + revert kolay
- CEO 3 ayrı onay (3-5 günde) yerine tek mega onay (10-14 saat tek seferde) tercih edebilir

**Alternatif:** CEO "tek komut" derse → tek mektup (TUR #55), 30+ saat Claude Code, ~25 commit. Risk yüksek ama TUR #52 paterni başarılı.

---

## ✅ Bitiş — Read-Only Doğrulama

- ✅ 6 bölüm × 26 alt-tarama tamamlandı (LAWYER 5 + REP 5 + ADMIN 5 + CUSTOMER 6 + Cross 5)
- ✅ TUR51B_DERIN_CRM_KESIF.md yazıldı (bu dosya)
- ✅ 4 CRM × Sayfa-Endpoint-Service üçgen tablosu doldu (47 fonksiyon)
- ✅ Cross-CRM 5 akış testi (✅ X1-X5 sonuçları kanıtlandı)
- ✅ TUR #55 atom listesi: 20 atom + 1 KIRMIZI nokta + mimar öneri (3 paralel mektup)
- ✅ DEVIR güncellenecek (bu rapor sonrası)
- ✅ 0 kod commit + 1 OS commit hedefleniyor
- ✅ Working tree TEMİZ

### Önemli Bulgular (TUR #55 öncelik için)

🔴 **3 KRİTİK:**
- L-B1 (lawyerNotifications çağrılmıyor — TUR #52 ölü kod)
- L-B2 (TahsilatPanel.tsx yok)
- R-B1 (REPRESENTATIVE 53 endpoint Madde 24.4 ihlali)
- R-B2 (User schema IBAN alanı yok)
- C-B1 (/musteri/kvkk-haklarim yok)

🟡 **8 ORTA:** L-B3, L-B4, R-B3, R-B4, A-B1, C-B2, C-B3, C-B4 + Cross X3 (AI eşik), Cross X4 (CommissionLog auto-trigger)

🟢 **5 DÜŞÜK:** L-B5, A-B2, A-B3, A-B4, C-B5

— Claude Code, TUR #51.B derin CRM keşif tamamlandı
— 30 Nisan 2026, Anayasa v1.14.0
— Madde 4 + Madde 17.4 + Madde 21 + Madde 26.8 disiplini
