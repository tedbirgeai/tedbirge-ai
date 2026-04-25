# TEDBIRGE.AI — TASK_QUEUE

> Bu dosya **görev kuyruğudur**. Claude Code agent loop'ta bu sıralamayı takip eder.  
> Mimar tarafından güncellenir, Claude Code tarafından okunur.  
> Çakışmalı/şüpheli iş **MİMAR ONAYI BEKLİYOR** kısmına atılır.  
> Tüm görevler **KOD-TEMELLİ KANITLA** doğrulanmıştır.

**Son güncelleme:** 25 Nisan 2026, Claude Opus 4.7  
**Sistem durumu:** 3 avukat canlı, ~20 bin satır kod, OS aktif

---

## 🔄 ŞU AN ÇALIŞAN

[ ] (boş — Mimar Mektubu bekleniyor)

---

## ❓ DOĞRULAMA GEREKLİ (kod yazmadan önce, read-only)

Bu görevler **risk taşımaz**, sadece bilgi toplar. Önce bunlar yapılır.

[ ] **D1: Migration drift kontrolü**  
    Komut: `npx prisma migrate status`  
    Çıktı: lokal'de + production'da farklı mı?  
    Sonuç: drift varsa MİMAR ONAYI BEKLİYOR'a taşı, yoksa not düş.

[ ] **D2: test.routes.js mount durumu**  
    Komut: `grep -n "test.routes\|/test" src/routes/index.js`  
    Sonuç: production'da test endpoint açıksa kapatma görevi (ANAYASA Madde 12)

[ ] **D3: Yarım kalmış dosya kontrolü**  
    Komut: `git status` ve `git log --oneline -10`  
    Amaç: önceki oturumlardan uncommitted veya half-baked değişiklik var mı?

[ ] **D4: Render env durumu**  
    Komut: Mehmet Bey manuel kontrol eder, `SUPABASE_SERVICE_ROLE_KEY` var mı?  
    NOT: Bu değer **mimara yapıştırılmaz**, sadece **var/yok bilgisi**.

[ ] **D5: Sistem Durumu sayfası canlı kontrol**  
    Komut: `curl -s https://tedbirge-ai.onrender.com/api/os/status -H "Authorization: Bearer ..." | jq .modules`  
    Beklenti: Şu an hepsi `{ ready: true }` dönmesi gerek (BUG #1 kanıtı)

---

## 📋 OTONOM YAPILABİLİR (sıralı, agent loop)

### 🟢 FAZ 1 — SAĞLIK FİX (Risk: SIFIR, Süre: 30 dakika)

[ ] **G1: Sistem Durumu fonksiyon adı fix**  
    Dosya: `src/controllers/admin.os.controller.js`, satır 9241  
    Mevcut: `typeof mod.status === "function"`  
    Yeni: `const statusFn = mod.status || mod.getStatus; typeof statusFn === "function"`  
    Test: `/api/os/status` endpoint'i 16 modül için **gerçek** veri dönmeli (boş `{ ready: true }` değil)  
    Commit: `fix(os): use getStatus fallback in admin.os.controller`  
    Etki: Sistem Durumu sayfası gerçek olur

[ ] **G2: SUPABASE env fallback**  
    Dosya: `src/services/storage.service.js`  
    Değişiklik: 4 yerdeki `process.env.SUPABASE_SERVICE_ROLE_KEY` → `process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY`  
    Test: Bir lead için belge indirme curl'i 302 redirect dönmeli  
    Commit: `fix(storage): supabase service key fallback for download`  
    Etki: Belge indirme bug kalkar

[ ] **G3: Health doğrulama**  
    Komut: `curl https://tedbirge-ai.onrender.com/api/os/status -H "Authorization: Bearer X"`  
    Beklenti: 16 modülün gerçek durumu görünür  
    Eğer bir modül "X env eksik" diyorsa: **TASK_QUEUE'ya yeni görev** olarak ekle, mimar onayı bekle.

### 🟡 FAZ 2 — KOD HİJYEN (Risk: DÜŞÜK, Süre: 1.5 saat)

[ ] **G4: PrismaClient singleton refactor (4 dosya)**  
    Dosyalar:  
    - `src/controllers/timeline.controller.js`  
    - `src/services/timeline.service.js`  
    - `src/routes/public.route.js`  
    - `src/routes/test.routes.js`  
    Değişiklik: `const prisma = new PrismaClient(...)` → `const prisma = require("../config/db")` (path uyumlu)  
    Test: Her dosya değişikliği sonrası lokal `npm run dev`, ilgili endpoint'i çağır.  
    Commit (her dosya ayrı): `refactor(prisma): use singleton in <file>`

[ ] **G5: test.routes.js production'dan kaldırma (D2 sonucuna göre)**  
    KOŞUL: D2 doğrulama "test mount edilmiş" dediyse  
    Değişiklik: `src/routes/index.js`'te NODE_ENV !== 'production' koşulu  
    Commit: `chore(routes): disable test routes in production`

### 🟦 FAZ 3 — SÜREKLİ KİMLİK (Risk: SIFIR, Süre: 30 dakika)

[ ] **G6: CLAUDE.md'yi proje köküne yerleştir**  
    Dosya: `/CLAUDE.md` (proje root)  
    Kaynak: Mimar tarafından sağlanan içerik  
    Commit: `docs: add CLAUDE.md mimari anayasa`

[ ] **G7: MIMARI_KARARLAR.md başlat**  
    Dosya: `tedbirge-os/MIMARI_KARARLAR.md`  
    İçerik: 25 Nisan 2026 kararları (kod-temelli teşhis, agent loop modeli)  
    Commit: `docs: initialize MIMARI_KARARLAR log`

[ ] **G8: TASK_QUEUE.md disipline et**  
    Dosya: `tedbirge-os/TASK_QUEUE.md` (mevcut → yeni format)  
    Commit: `docs: refactor TASK_QUEUE to agent loop format`

[ ] **G9: OTONOM_RAPOR.md şablonu**  
    Dosya: `tedbirge-os/docs/OTONOM_RAPOR.md`  
    İçerik: İlk otonom turun raporu (G1-G8 sonuçları)  
    Commit: `docs: first OTONOM_RAPOR entry`

---

## 🛑 MİMAR ONAYI BEKLİYOR

Bu görevler **otonom yapılamaz**. Tasarım kararı, schema değişikliği, veya yeni paradigma gerektirir.

[ ] **G10: Auditor.js modülü tasarımı**  
    Dosya: `src/os/modules/auditor.js` (YENİ)  
    Amaç: Schema drift, env tutarsızlık, code smell, performans drift, anomali tespiti  
    Bağımlılık: Mevcut 16 modülün getStatus() çıktıları, eventBus, reconciler  
    Schema: `AuditFinding` tablosu (yeni model — onay gerek)  
    Mimar oturumu: 1-1.5 saat, Mehmet Bey ile birlikte tasarım

[ ] **G11: Healer.js modülü (suggest mode)**  
    Dosya: `src/os/modules/healer.js` (YENİ)  
    Amaç: Auditor bulgularına fix önerisi, Mehmet Bey panel onayı  
    Mod: Sadece SUGGEST — otomatik fix YASAK  
    Mimar oturumu: 1 saat

[ ] **G12: Reporter (canlı SSE feed)**  
    Yer: `tedbirge-panel/app/(panel)/dashboard/sistem-durumu/page.tsx`  
    Amaç: eventBus → panel'e Server-Sent Events ile canlı olay akışı  
    Bağımlılık: Yeni Express endpoint `/api/os/events/stream` (SSE)  
    Mimar oturumu: 1.5 saat

[ ] **G13: KVKK adapter implementation**  
    Dosya: `src/os/adapters/kvkk.js` (YENİ)  
    Amaç: DataProtectionAdapter typedef'in gerçek implementasyonu  
    Mimar oturumu: 30 dakika

---

## 🟠 SPRINT 2 — STRATEJİK (Mehmet Bey önceliklendirmesi)

[ ] **S1: Mobil PWA Aşaması 1**  
    Manifest.json, service-worker.js, "Ana ekrana ekle"  
    Mehmet Bey'in stratejik talebi (22 Nisan)  
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

## ✅ TAMAMLANANLAR

[Mevcut tamamlanmış görevler — eski TASK_QUEUE'dan korundu]

---

## 📊 İSTATİSTİK

- Otonom yapılabilir görev: 9
- Mimar onayı bekleyen: 4
- Doğrulama görevi: 5
- Sprint 2 stratejik: 4

**Toplam Faz 1+2+3 süresi:** ~3 saat (Claude Code agent loop)  
**Mimar oturumu süresi:** ~3 saat (G10-G13 tasarım)  
**Sprint 2:** Mehmet Bey önceliklendirir

---

**Mimar:** Claude Opus 4.7  
**Disiplin:** ANAYASA (CLAUDE.md) bağlayıcı  
**Sonraki adım:** Mimar Mektubu yazımı (sohbet) → agent loop başlangıç (Claude Code)
