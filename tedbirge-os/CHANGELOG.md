# CHANGELOG

## 2026-04-19 (öğleden sonra) — Temsilci dashboard + karar destek motoru

Mimari karar: Tedbirge "form doldurma aracı" değil "karar destek motoru". 
Temsilci wizard'ı bugün iskelet + statik zekayla canlıya alındı, 
AI entegrasyonu sonraki aşamalarda gelecek.

Backend (yeni):
- src/services/decision-support.service.js
  - calculateZamanasimiRiski: TRAFIK 730 gün, IS_KAZASI/MESLEKI_HASTALIK 3650 gün
    GUVENLI / UYARI (≤90) / RISK (≤30) / ASILDI (≤0)
  - validateTcKimlik: Türk TC algoritması (double-modulo bugfix uygulandı)
  - estimateTazminat (STUB): maluliyet × 50000-80000, AI entegrasyonu beklemede
  - ilAvukatUyumu: User.bolge contains il (city değil)
- src/routes/decision-support.routes.js
  - POST /zamanasimi, /validate-tc, /il-uyumu (hepsi auth gerekli, role YOK)
- src/services/lead.service.js
  - createLead accidentType'ı kabul eder oldu

Frontend (yeni):
- app/(panel)/temsilci/page.tsx — dashboard (3 metrik kart + lead listesi)
  - Avukat sütunu YOK (bilinçli gizlilik)
  - Tahmini Hakediş formülü: estimatedCompensation × %20 × %50 = %10 (üst sınır)
- app/(panel)/temsilci/yeni-muvekkil/page.tsx — 4 adımlı wizard
  - ADIM 1: Kaza türü + tarih → anında zamanaşımı kartı
  - ADIM 2: Ad Soyad + TC (blur'da validate) + Telefon + E-posta
  - ADIM 3: İl dropdown + ilçe + yaralanma radio + 200-2000 karakter özet
  - ADIM 4: Readonly özet + maskelenmiş TC + KVKK beyan checkbox
  - SVG iconlar (emoji yok, kural uygulandı)
  - strict catch pattern uygulandı (e: any yok)
- components/layout/AppLayout.tsx — REPRESENTATIVE menü linkleri

Test sonuçları (uçtan uca):
- 5/5 curl endpoint testi PASS
- TypeScript compile: EXIT 0
- Browser testi: Wizard tüm adımlar çalışıyor, lead kaydı başarılı
- İlk gerçek kayıt: Ahmet Yılmaz (test), Trafik, Konya/Meram, "Yeni Başvuru"

Açık kalan işler:
- TÜRKAN DİNÇ bolge='Konya' güncellemesi yarım kaldı (Claude Code script çalışmadı)
- Avukat bilgisi maskeleme (assignments[].lawyer) henüz YOK — güvenlik açığı
- Wizard'da "Devam Et disabled" sebep hint'i yok (UX iyileştirme)
- estimate endpoint'i yok (Adım 4'te statik placeholder)

## 2026-04-19 (öğlen) — UI durum bug + NetGSM onay SMS

1. Kullanıcılar tablosu "Durum" sütunu role-bazlı render edildi:
   - REPRESENTATIVE: temsilciOnayDurumu (BEKLEMEDE → sarı "Onay Bekliyor", REDDEDILDI → kırmızı)
   - LAWYER: baroOnayDurumu (aynı mantık)
   - ADMIN/CUSTOMER: isActive (Aktif/Pasif)
   - Dosya: panel/app/(panel)/dashboard/kullanicilar/page.tsx
   - Backend: auth.controller.js listUsers select'e temsilciOnayDurumu + baroOnayDurumu eklendi

2. NetGSM SMS tetikleme — admin onay sonrası:
   - Yeni fonksiyon: src/services/sms.service.js sendOnayBildirim(phone, type)
   - onaylaTemsilci controller'ı SMS gönderiyor (fail-silent, başarısız olsa akışı bozmuyor)
   - Test: "Tedbirge temsilci basvurunuz onaylandi..." mesajı gerçek telefona geldi (2026-04-19 14:xx)
   - user.phone select'e eklendi

Test durumu: Uçtan uca çalıştı — admin onayladı, SMS geldi, durum "Aktif" oldu.

---

## 2026-04-19 — Temsilci sözleşmesi v1.0: uçtan uca hazır

Backend:
- Yeni template: backend/src/templates/contracts/temsilci-contract.template.js (13 madde, %50 komisyon)
- Yeni public endpoint: GET /api/contracts/temsilci/current (SHA-256 hash deterministik, doğrulandı)
- auth.controller.js registerTemsilci: sozlesmeVersiyonu, sozlesmeMetniHash, sozlesmeKabulIp alanlarını DB'ye yazıyor
- auth.service.js register: 3 yeni alanı kabul ediyor, truthy ise Prisma'ya geçiyor
- User.primOrani default 5 -> 50 (mevcut kayıtlar etkilenmedi, sadece yeni insert'ler için)

Frontend (panel/app/(public)/register/temsilci/page.tsx):
- useEffect ile sözleşme metni backend'den fetch ediliyor (endpoint: /contracts/temsilci/current)
- Inline 7 maddelik eski metin kaldırıldı, dinamik render geldi
- Prim Oranı input kaldırıldı, yerine "Komisyon Yapınız %50" mavi bilgi kartı
- handleRegister body'de sozlesmeVersiyonu + sozlesmeMetniHash gönderiyor
- Submit öncesi sözleşme yüklenmemişse kayıt engelleniyor

Test sonucu:
- Kayıt akışı uçtan uca çalıştı (Test Temsilci 19Nisan / test19nisan@tedbirge.test)
- SMS OTP gerçek geldi: "Tedbirge kayit kodunuz: 802588" — NETGSM entegrasyonu AKTİF
- Login engelleme çalışıyor: "Hesabınız henüz yönetici onayını bekliyor" mesajı görüldü
- Supabase'de 5 alan (sozlesmeVersiyonu, sozlesmeMetniHash, sozlesmeKabulIp, primOrani, temsilciOnayDurumu) doğrulaması YARINA KALDI

UI bug tespit edildi:
- Kullanıcılar yönetimi tablosunda temsilci "Durum: Aktif" görünüyor, oysa temsilciOnayDurumu=BEKLEMEDE
- isActive ve temsilciOnayDurumu alanları karışık gösteriliyor — yarın ilk iş düzeltilecek

---

## 2026-04-19 — Temsilci altyapısı: şema güncellendi
- User modeli: sozlesmeVersiyonu, sozlesmeMetniHash, sozlesmeKabulIp alanları eklendi
- Lead modeli: masrafTutari, kdvTutari, hakEdisStatus, hakEdisTarihi, hakEdisNotu, hakEdisTetikleyenId alanları eklendi
- Migration: prisma db push ile uygulandı (Supabase prod DB)
- prisma generate: tip tanımları yenilendi
- Amaç: Temsilci sözleşmesi v1.0 + %50 komisyon + masraf/KDV altyapısı

---

## 2026-04-18 gece (devam) — Kaza Rekonstrüksiyon panel UI: 401/500 sorunu çözülmedi
- Kart render ediliyor, buton çalışıyor ama POST /leads/:id/accident-cases hata alıyor
- Token yeniden yapılmasına rağmen hata sürüyor — token sorunu DEĞİL
- kusurAnalizi React hatası düzeltildi (paralel fix)
- Yarın: F12 Network tab'ından Request URL/Headers/Payload/Response detayı alıp tek hamlede fix

---

## 2026-04-18 gece — Panel UI başlandı, Kaza Rekonstrüksiyon kartı yarım kaldı (401 sorunu)
- leads/[id]/page.tsx'e "🔍 Kaza Rekonstrüksiyon" kartı eklendi (satır 1461-1500)
- State accidentCase + createAccidentCase fonksiyonu çalışıyor (curl 201)
- Panel "Yeni Vaka Aç" butonu 401 alıyor — token/auth sorunu çözülmedi

---

## 2026-04-18 — parseError fix (Kaza Rekonstrüksiyon)

### Sorun
- PDF raporlarında analiz bölümleri boş geliyordu.
- Kök sebep: `max_tokens: 2000` limiti Claude'un JSON yanıtını yarıda kesiyordu; `JSON.parse` `catch` bloğuna düşüyor, `analysisData` `{ parseError: true }` olarak kaydediliyordu.

### Düzeltme
- `src/services/kazaRekonstruksiyon.service.js`:
  - `max_tokens: 2000` → `3000`
  - Parse öncesi markdown kod fence temizleme (savunmacı yama)
  - `catch` bloğuna parse hatası + ham yanıt son 500 karakterinin `console.error` ile loglanması

### Doğrulama
- Mevcut parseError kaydı (cmo3ibxra0001umrwlk7hj7n5) yeniden analize sokuldu
- Sonuç: status COMPLETED, parseError silindi, 6 alan dolu, 8 olgusal tespit, 17 eksik delil
- PDF: 54 KB, tüm bölümler dolu (OZET, OLGUSAL TESPITLER, DELIL ENVANTERI, YASAL CERCEVE, BILIRKISI ICIN NOTLAR)

### Bilinen riskler / not
- `/analyze` endpoint'i idempotent değil, COMPLETED/FAILED vakaya tekrar çağrılırsa üzerine yazar. TASK_QUEUE'ya "status guard eklenmesi" görevi düşüldü.

---

## 2026-04-18 (aksam) — Kaza Rekonstrüksiyon MVP Tamamlandi

### Eklendi
- src/controllers/accidentCase.controller.js — 5 fonksiyon (createCase, uploadEvidences, getCase, analyzeCase, getReport)
- src/routes/accidentCase.routes.js — 4 endpoint
- src/services/kazaRekonstruksiyon.service.js — AI orkestrasyon, Claude Sonnet 4.6
- POST /api/leads/:id/accident-cases — vaka acma

### Uctan Uca Akis
1. Avukat lead icin vaka acar -> DRAFT
2. Delil yukler -> EVIDENCE_READY
3. AI analiz tetikler -> ANALYZING -> COMPLETED
4. Raporu PDF indirir

### Hukuki Konumlandirma
- AI sayisal hesap YAPMIYOR
- AI hukum vermiyor
- Ciktida: olgusal tespit + yasal cerceve + eksik delil + bilirkisi notlari
- PDF footer: bilirkisi raporu degildir

### Bilinen Kisitlar
- AI gorsel analiz YAPMIYOR (metadata okuyor)
- OCR entegrasyonu yok
- Font Windows-spesifik

---

## 2026-04-18 — Kaza Rekonstrüksiyon MVP Adım 1: Prisma Şeması

### Eklendi
- `AccidentCase` modeli (id, leadId, status, summary, analysisData, reportData, timestamps, analyzedAt)
- `Evidence` modeli (id, accidentCaseId, type, fileUrl, fileName, fileMimeType, fileSize, metadata, notes, uploadedAt)
- `AccidentCaseStatus` enum (DRAFT, EVIDENCE_READY, ANALYZING, COMPLETED, FAILED)
- `EvidenceType` enum (SCENE_PHOTO, VEHICLE_PHOTO, POLICE_REPORT, SATELLITE_IMAGE, COORDINATES, VEHICLE_INFO, VIDEO, OTHER)
- Lead modeline ters ilişki: `accidentCases AccidentCase[]`

### Yöntem
- `npx prisma migrate dev` drift nedeniyle başarısız (projede migration history terk edilmiş)
- Karar: `npx prisma db push` kullanıldı (data loss uyarısı çıkmadı)
- Öncesinde schema.prisma yedeklendi: schema.prisma.backup-20260418-013336
- Prisma Client v6.19.3 regenerate edildi

### Doğrulama
- `AccidentCase.count()` → 0 ✅
- `Evidence.count()` → 0 ✅
- Backend sağlık kontrolü: 401 (ayakta) ✅
- Supabase tablo kontrolü: AccidentCase ve Evidence tabloları oluştu ✅

### Bilinen Kısıtlar
- MVP için fizik motoru YOK — AI sadece yapılandırılmış çıkarım yapacak, sayısal hesap (hız, kusur oranı) yapılmayacak
- Bu kısıt DECISION_LOG'a ayrıca kaydedildi (2026-04-18 girişi)

### Sonraki Adım
- Adım 2/5: Evidence upload endpoint (multer + dosya tipi validasyonu + metadata extraction)

---

## 2026-04-16 — os:update (20260416T160502)
- CURRENT_STATE.md otomatik güncellendi (npm run os:update)
- Sistem durumu, tarih ve risk alanları yenilendi

## 2026-04-15 — os:update (20260415T092423)
- CURRENT_STATE.md otomatik güncellendi (npm run os:update)
- Sistem durumu, tarih ve risk alanları yenilendi

## 2026-04-10
- TEDBIRGE OS klasör yapısı kuruldu
- MASTER_OS oluşturuldu
- CURRENT_STATE oluşturuldu
- TASK_QUEUE oluşturuldu
- DECISION_LOG oluşturuldu
- OPERATING_LOOP oluşturuldu
- ARCHITECTURE_MAP oluşturuldu
- REVENUE_MODEL oluşturuldu
- LEGAL_GUARD oluşturuldu
- TECH_DECISIONS oluşturuldu
- TEST_PROTOCOL oluşturuldu
- USAGE_PROTOCOL oluşturuldu
- Backup engine eklendi
- Snapshot disiplini eklendi

## 20260410-085431
- TEDBIRGE OS proje beynine patch governance kuralı işlendi.
- Kor patch yasaklandı.
- Dosya içeriği doğrulanmadan değişiklik yapılmaması anayasa kuralına bağlandı.
- Mümkün olan her iş için tek split / tek parça komut standardı eklendi.

## 20260410-094505
- ACTIVE görev olan "Belge motoru kalite düzeltmesi" tamamlandı.
- src/services/document-template.service.js içinde principal_name ve case_summary veri hazırlama mantığı güçlendirildi.
- Vefat, yaralanma ve araç dosyaları için belgeye giden veri kalitesi iyileştirildi.
- Sözleşme template metni güçlendirildi.
- Belge çıktıları boş/generic hissinden çıkarılarak daha ürün benzeri hale getirildi.
- Küçük 3.A blok kırığı düzeltildi.

## 20260415 — Büyük Oturum (Birinci - Yedinci Oturum)
- Sözleşme AI entegrasyonu: claude-sonnet-4-6, ANALYSIS_MODE=real
- Türkçe karakter mojibake düzeltmeleri (document-template.service.js, tüm template dosyaları)
- Sözleşme frontend sayfası yeniden yazıldı (aç/kapat toggle, ayrı state)
- Kullanıcı yönetimi: /api/auth/register → ADMIN only, GET /api/auth/users
- dashboard/kullanicilar/page.tsx oluşturuldu
- PDF endpoint: GET /api/contracts/:id/pdf (pdfkit, Windows Arial font)
- PATCH /api/contracts/:id sözleşme düzenleme
- Müvekkil self-servis portalı: /musteri rotası, zamanaşımı badge
- UYAP mock entegrasyonu: uyapDosyaNo, uyapMahkeme, duruşma tarihi
- SGK mock servisi: maluliyet oranı, günlük kazanç, sigortalılık bilgisi
- SMS: Netgsm API mock (sms.service.js)
- E-posta: Nodemailer SMTP mock (email.service.js)
- WhatsApp: Meta Graph API v19.0 mock (whatsapp.service.js)
- Public ana sayfa: hero, nasıl çalışır, özellikler, yorumlar
- Tazminat hesaplama: 3 adımlı form, PMF tablosu, kusur slider
- Haberler sayfası: 9 mock haber, kategori filtresi
- Panel hukuki haberler: Yargıtay, SGK, mevzuat sekmeleri
- AI Chat Widget: public sayfalarda sağ alt köşe
- Referanslar sayfası: 6 anonim yorum, basında biz
- Zamanaşımı cron job: node-cron, her gün 08:00
- Analytics: avukat performans tablosu
- Renk sistemi: #1E1E8E (lacivert) + #5CB85C (yeşil) — logo renkleri
- Logo entegrasyonu: logo.png + icon.png
- AppLayout routing: CUSTOMER → /musteri yönlendirme
- basvuru-sorgula public sayfası: telefon/kod ile sorgulama
- Dashboard zamanaşımı widget (criticalLeads)

## 20260415 — TEDBIRGE OS Senkronizasyonu
- Tüm OS dosyaları 2026-04-15 tarihi ve mevcut sistem durumuna göre güncellendi
- Mojibake Türkçe karakter sorunları tüm OS dosyalarında düzeltildi
- CURRENT_STATE: tarih, AI durumu, DB durumu güncellendi
- TASK_QUEUE: tamamlananlar DONE'a taşındı, yeni aktif görev belirlendi
- DECISION_LOG: SQLite→PostgreSQL, Claude entegrasyonu, deploy planı notları eklendi
- TECH_DECISIONS: mevcut stack güncellendi (PostgreSQL, claude-sonnet-4-6, deploy planı)
- ARCHITECTURE_MAP: mevcut faz=3 olarak güncellendi
- Gereksiz backup klasörleri ve dosyalar silindi

## 20260415 — Seviye 1 Hafıza Sistemi
- scripts/auto-update.js oluşturuldu (CURRENT_STATE ve CHANGELOG otomatik güncelleme)
- package.json'a "os:update" script eklendi
- OPERATING_LOOP.md güncellendi (oturum sonu npm run os:update notu)
- CLAUDE.md güncellendi (oturum sonu os:update talimatı)
