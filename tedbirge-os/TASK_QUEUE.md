# TEDBIRGE.AI — TASK_QUEUE

> Bu dosya **görev kuyruğudur**. Claude Code agent loop'ta bu sıralamayı takip eder.  
> Çakışmalı/şüpheli iş **MİMAR ONAYI BEKLİYOR** kısmına atılır.  
> Tüm görevler **KOD-TEMELLİ KANITLA** doğrulanmıştır.

**Son güncelleme:** 25 Nisan 2026, TUR #2 tasarımı sonrası  
**Sistem durumu:** 3 avukat canlı, ~20 bin satır kod, OS aktif, anayasa kuruldu

---

## 🔄 ŞU AN ÇALIŞAN

[ ] TUR #2 — Otonom Katman (Auditor + Healer + Reporter)

---

## 📋 OTONOM YAPILABİLİR — TUR #2 (Sıfır Risk, Yeni Dosyalar)

### 🔵 FAZ A — AUDITOR MODÜLÜ

[ ] **G2-1: Auditor modülü iskelet yazımı**  
    Dosya: `src/os/modules/auditor.js` (YENİ)  
    Pattern: BaseAdapter benzeri, mevcut OS modülleri ile aynı (start/stop/runTick/getStatus)  
    İçerik:
    - 6 tarama fonksiyonu (schema_drift, env_inconsistency, prisma_violation, performance_drift, security_anomaly, cost_spike)
    - runTick → her saatte bir tarama (saatlik olanlar)
    - runDaily → günlük olanlar
    - runWeekly → haftalık olanlar
    - getStatus → son tarama, bulunan sorun sayısı, son hata
    - eventBus emit ('auditor:finding', { category, severity, ...})
    - SystemEvent.create() ile bulgu kaydı  
    Commit: `feat(os): auditor module skeleton`

[ ] **G2-2: Auditor — Schema drift tarama**  
    Dosya: `src/os/modules/auditor.js` (var olan)  
    Komut: `prisma migrate diff --from-schema --to-schema --script` (sadece okuma, SQL üretmez)  
    Çıktı varsa: SystemEvent type='audit:schema_drift', severity='WARNING', detayları `module` alanına JSON  
    Commit: `feat(auditor): schema drift detection`

[ ] **G2-3: Auditor — Env tutarsızlık tarama**  
    Mantık: `process.env` içindeki tüm SUPABASE_*, ANTHROPIC_*, vb. varlık kontrolü.  
    Bulgu: env eksikse veya değer "undefined" gibi anomalilik gösteriyorsa  
    Commit: `feat(auditor): env consistency check`

[ ] **G2-4: Auditor — PrismaClient ihlal tarama**  
    Mantık: `src/` altında `new PrismaClient(` regex araması (excluded: `src/config/db.js`)  
    Bulunan dosya sayısı > 0 ise: SystemEvent type='audit:prisma_violation', severity='WARNING'  
    Commit: `feat(auditor): prisma client singleton check`

[ ] **G2-5: Auditor — Cost spike tarama**  
    Bağımlılık: mevcut costGuard.js modülünden veri okuma  
    Eşik: günlük %75 ve %90 (UYARI ve KRİTİK)  
    Commit: `feat(auditor): cost spike detection`

[ ] **G2-6: Auditor — Performans drift tarama**  
    Bağımlılık: mevcut performance.js modülünden veri okuma  
    Eşik: son 7 gün ortalama p95 > %50 yavaşlama → uyarı  
    Commit: `feat(auditor): performance drift detection`

[ ] **G2-7: Auditor — Güvenlik anomali tarama**  
    Bağımlılık: mevcut security.js modülünden veri okuma  
    Eşik: bir kullanıcı 1 saat içinde 50+ farklı lead'e bakıyorsa → uyarı  
    Commit: `feat(auditor): security anomaly detection`

[ ] **G2-8: Auditor src/os/index.js mount**  
    Mevcut dosyaya 1 satır ekle: `auditor: safeRequire('./modules/auditor', 'auditor'),`  
    Commit: `feat(os): mount auditor module`

### 🟢 FAZ B — HEALER MODÜLÜ

[ ] **G2-9: Healer modülü iskelet**  
    Dosya: `src/os/modules/healer.js` (YENİ)  
    Pattern: start/stop/runTick/getStatus  
    Görev:
    - Auditor'un emit ettiği finding event'lerini dinler (eventBus.on('auditor:finding'))
    - Düşük risk olanları kendi yapar (cache flush, FAILED Document silme, expired token cleanup)
    - Kritik olanları `tedbirge-os/docs/AUDIT_FINDINGS/OPEN/<timestamp>-<category>.json` yazar  
    Commit: `feat(os): healer module skeleton (suggest mode)`

[ ] **G2-10: Healer — Otomatik fix listesi**  
    İçerik:
    - `cache_flush` → in-memory cache temizleme (ilgili modül)
    - `failed_document_cleanup` → 24+ saat eski FAILED Document kaydı silme
    - `expired_token_cleanup` → süresi dolmuş token cleanup
    - `render_warmup` → kendi /health'a ping  
    Her birinde audit log eventi: SystemEvent type='healer:auto_fix', severity='INFO'  
    Commit: `feat(healer): auto-fix low-risk operations`

[ ] **G2-11: Healer — Suggest mode (kritik bulgular için)**  
    İçerik:
    - Schema drift bulunca → `OPEN/<timestamp>-schema-drift.json` yaz (öneri SQL içerir)
    - Env tutarsızlık → `OPEN/<timestamp>-env-inconsistency.json`
    - Cost spike CRITICAL → `OPEN/<timestamp>-cost-spike.json`
    - Güvenlik anomali → `OPEN/<timestamp>-security-anomaly.json`  
    Format: JSON, açıklayıcı, fix önerisi içerir, otomatik UYGULAMAZ  
    Commit: `feat(healer): suggest mode for critical findings`

[ ] **G2-12: Healer src/os/index.js mount**  
    `healer: safeRequire('./modules/healer', 'healer'),`  
    Commit: `feat(os): mount healer module`

### 🟡 FAZ C — REPORTER MODÜLÜ + SSE

[ ] **G2-13: Reporter modülü**  
    Dosya: `src/os/modules/reporter.js` (YENİ)  
    Görev: eventBus event'lerini topla, SSE clientlerine yayınla  
    Pattern: start/stop/getStatus  
    İçerik: SSE client connection pool yönet, her event'i tüm dinleyen clientlere gönder  
    Commit: `feat(os): reporter module (SSE bridge)`

[ ] **G2-14: SSE Endpoint**  
    Dosya: `src/routes/os.events.routes.js` (YENİ)  
    Endpoint: `GET /api/os/events/stream`  
    Auth: ADMIN gerekli (admin auth middleware)  
    İçerik: text/event-stream header, reporter modülüne bağlan, eventleri stream et  
    Commit: `feat(api): SSE stream endpoint`

[ ] **G2-15: SSE route mount**  
    Dosya: `src/routes/index.js` (mevcut)  
    1 satır ekleme: `router.use('/os', require('./os.events.routes'));`  
    Commit: `feat(api): mount SSE events route`

[ ] **G2-16: Reporter src/os/index.js mount**  
    `reporter: safeRequire('./modules/reporter', 'reporter'),`  
    Commit: `feat(os): mount reporter module`

### 🟣 FAZ D — PANEL SAYFALARI

[ ] **G2-17: Canlı Feed sayfası**  
    Dosya: `tedbirge-panel/app/(panel)/dashboard/sistem-durumu/canli-feed/page.tsx` (YENİ)  
    İçerik: EventSource ile `/api/os/events/stream` dinle, gelen event'leri akış kutusunda göster  
    Görsel: Tarihli event listesi, her event satırı: zaman + module + type + severity (renkli)  
    Commit: `feat(panel): live event feed page`

[ ] **G2-18: Tespit Edilen Sorunlar sayfası**  
    Dosya: `tedbirge-panel/app/(panel)/dashboard/tespit-edilen-sorunlar/page.tsx` (YENİ)  
    İçerik:
    - SystemEvent tablosundan `type LIKE 'audit:%'` filtresi
    - Severity renkli badge (INFO=mavi, WARNING=sarı, CRITICAL=kırmızı)
    - Filtreleme: kategoriye göre, severity'ye göre, tarihe göre
    - Detay modal: mesaj, ham JSON, ne zaman, hangi modül  
    Commit: `feat(panel): audit findings page`

[ ] **G2-19: Mimar Onayı sayfası**  
    Dosya: `tedbirge-panel/app/(panel)/dashboard/mimar-onayi/page.tsx` (YENİ)  
    İçerik:
    - Backend'den `GET /api/os/healer/pending` (yeni endpoint, dosya sistemi okur)
    - `tedbirge-os/docs/AUDIT_FINDINGS/OPEN/` klasöründeki JSON dosyaları liste
    - Her öneri için: incele, onayla, reddet butonları
    - Onayla → backend dosyayı RESOLVED'a taşır + ilgili işlemi yapar (örnek: schema migration emre)
    - Reddet → REJECTED'a taşır  
    Commit: `feat(panel): healer suggestions approval page`

[ ] **G2-20: Audit Findings klasör yapısı**  
    Dosyalar:
    - `tedbirge-os/docs/AUDIT_FINDINGS/.gitkeep`
    - `tedbirge-os/docs/AUDIT_FINDINGS/OPEN/.gitkeep`
    - `tedbirge-os/docs/AUDIT_FINDINGS/RESOLVED/.gitkeep`
    - `tedbirge-os/docs/AUDIT_FINDINGS/REJECTED/.gitkeep`  
    Commit: `chore: audit findings folder structure`

### 🔴 FAZ E — KAPANIŞ

[ ] **G2-21: TUR #2 OTONOM_RAPOR güncelleme**  
    Dosya: `tedbirge-os/docs/OTONOM_RAPOR.md` (mevcut, TUR #1 kayıtlı)  
    Eklenir: TUR #2 başlık + 21 görev sonucu  
    Commit: `docs: OTONOM_RAPOR Tur #2 sonu`

[ ] **G2-22: Toplu push + Render deploy + health check**  
    Komut: `git push origin master`  
    Bekle: 3-5 dakika  
    Doğrula: `curl https://tedbirge-ai.onrender.com/health`  
    Beklenen: HTTP 200 + Sistem Durumu sayfası 19 modül gösterecek (mevcut 16 + 3 yeni)

---

## 🛑 MİMAR ONAYI BEKLİYOR

[ ] **G2-23: KVKK Adapter implementation** (Sprint 2)  
    Dosya: `src/os/adapters/kvkk.js` (YENİ)  
    Sebep: DataProtectionAdapter typedef tanımlı, implementation eksik  
    Mimar oturumu gerek

[ ] **G3-1: Auditor SMS bildirim entegrasyonu** (TUR #3)  
    CRITICAL severity bulgular Mehmet Bey'e SMS  
    NetGSM API mevcut, sadece Auditor'dan köprü gerek

---

## 🟠 SPRINT 2 — STRATEJİK (Mehmet Bey önceliklendirmesi)

[ ] **S1: Mobil PWA Aşaması 1**  
    Manifest.json, service-worker.js, "Ana ekrana ekle"  
    Süre: 3 gün

[ ] **S2: Müvekkil portalı belge yükleme**  
    `app/musteri/[id]/belgeler/page.tsx` yeni  
    Süre: 1 gün

[ ] **S3: Avukat profili + müvekkil yorum sistemi**  
    Schema değişikliği gerek  
    Süre: 2-3 gün

[ ] **S4: Performans metric'leri**  
    Dilekçe yazma süresi, müvekkil arama sıklığı, sözleşme imzalama süresi  
    Pazarlama için kritik  
    Süre: 1-2 gün

---

## ✅ TAMAMLANANLAR (TUR #1 — 25 Nisan)

- [✓] G1: Sistem Durumu fonksiyon adı fix (BUG #1)
- [✓] G2: SUPABASE env fallback (BUG #2)
- [✓] G4-1: timeline.controller.js singleton
- [✓] G4-2: timeline.service.js singleton
- [✓] G4-3: public.route.js singleton
- [✓] G4-4: test.routes.js singleton
- [✓] G5: test routes production yasak (atlandı — zaten koşullu mount)
- [✓] G9: OTONOM_RAPOR.md başlatıldı
- [✓] Anayasa Madde 5 eklendi (onay disiplini)

---

## 📊 İSTATİSTİK

- **TUR #2 görev sayısı:** 22 (otonom yapılabilir)
- **Mimar onayı bekleyen:** 2 (KVKK adapter, SMS entegrasyonu)
- **Sprint 2 stratejik:** 4
- **Tahmini TUR #2 süresi:** 4-6 saat agent loop
- **Tahmini commit sayısı:** ~22

---

**Mimar:** Claude Opus 4.7  
**Disiplin:** ANAYASA (CLAUDE.md) bağlayıcı  
**TUR #2 Sıfır Risk Garantisi:** Schema değişikliği yok, migration yok, npm install yok, env değişikliği yok
