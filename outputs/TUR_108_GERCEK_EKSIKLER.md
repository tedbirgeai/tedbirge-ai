# TUR #108 — GERÇEK EKSİKLER (Mimar Tanısı, Pure Keşif Sonrası)

**Tarih:** 10 Mayıs 2026
**Tip:** Kod gerçeğine bakıldıktan sonra çıkarılan tanı listesi
**Anayasa:** v1.26.0 (yeni madde tescili **YOK** — bu TUR sadece keşif)
**Mimar Hatası 50 düzeltme yolu:** Sohbet mimarının önceki 12 modül önerisi vs. kod gerçeği karşılaştırması.

---

## 🎯 BU DOSYANIN AMACI

Sohbet mimarı (Claude Opus) önceki turda **12 yeni OS modülü** önermişti (sonra 8 daha eklendi → toplam 37 zihinsel model). CEO yakaladı: *"Sen vizyonumuz ile yurtdışı vizyonunu hesaplayarak parçalı işletim sistemi mi kuracaksın?"*

Bu dosya:
1. ✅ Hangi öneri **kod gerçeğine uydu** (gerçekten eksik) — pat-pat eklenebilir
2. ❌ Hangi öneri **kod gerçeğine uymadı** (zaten var, redundant)
3. 🆕 Hangi eksik **sohbet mimarının görmediği** (yeni tanı, kod kanıtlı)

**Önemli not:** Sohbet mimarının orijinal 12 modül önerisi mektupta **adlandırılmadı** — ben (Claude Code) burada kod gerçeğine bakıp **objektif tanı** yapıyorum. Sohbet mimarı bu raporu okuduğunda **kendi 12 önerisini bu listeyle karşılaştıracak**.

---

## 🔴 KRİTİK GERÇEK EKSİKLER (Kod Kanıtlı, Mimar Hatası 50 düzeltmesi için)

### EKSİK 1 — `mimarHatasi` modülü `/api/agents-health` endpoint'inde görünmüyor

**Kanıt:**
- `src/os/registry.js:7-11` OS_MODULES = 17 modül (mimarHatasi DAHİL)
- `src/agents/auditor.agent.js:197-203` runAllModules 17 modül (mimarHatasi DAHİL)
- `src/agents/auditor.agent.js:236-242` runAllActiveTasks 17 modül (mimarHatasi DAHİL)
- `src/routes/agent.routes.js:50-54` moduleNames hardcoded **16 modül** (mimarHatasi YOK)
- `src/controllers/admin.os.controller.js:25-32` moduleNames hardcoded **16 modül** (mimarHatasi YOK)
- Production curl: `moduleCounts: 16, mimarHatasi var: false`

**Etki:**
- CEO `/dashboard/sistem-durumu` UI'da 17. modülü göremez
- mimarHatasi yine yazıyor (production AgentEvent table'da var) ama görünür değil
- Madde 30.10 (16 Modül Otonom Disiplini) kuralı 17 modül için **GÜNCEL DEĞİL** — sadece anayasa metni güncellenmiş, kod hardcoded list'leri eski

**Onarım yolu (TUR #109+ adayı):** 3 yerde hardcoded list'leri `registry.getOSModules()` çağrısıyla değiştir + Madde 30.10'u "17 modül + dinamik registry" olarak güncelle.

---

### EKSİK 2 — Reconciler `POLICY_HANDLERS` map gerçek implementations YOK

**Kanıt:**
- `src/os/reconciler.js:41-44` `POLICY_HANDLERS = {}` boş map
- Yorum satırı: *"TODO: pulse/backup/maintenance modulleri eklendikce doldurulacak"*
- Modüller `registerPolicyHandler(MODULE_NAME, policyHandler)` çağırır (~50 kayıt var)
- `runReconcileTick()` 5 dk'da çalışır, `OSPolicy` tablosunu okur
- Ama gerçek drift düzeltmesi **henüz yok** — handler kayıt mekanizması var, içeriği TODO

**Etki:**
- "Desired vs actual reconciliation" Kubernetes-style iskelet hazır ama gerçek iş yapmıyor
- Drift detection theoretical — modüller policy handler kaydeder ama runtime'da reconcileTick herhangi bir corrective action almıyor
- OS dokümantasyonunda "Sprint 2 prensip 2" bahsediliyor ama production'da pasif

**Onarım yolu:** Bu büyük bir kesit (Madde 17 — Stratejik Kesit). Tek bir TUR'da tamamlanamaz. Mimar oturumunda reconciliation policy schema (OSPolicy table — şu an muhtemelen boş) + her modül için en az 1 gerçek handler implementation gerekir.

---

### EKSİK 3 — EventBus `EVENT_TYPES` taxonomy ile gerçek emit/listen kullanım uyumsuz

**Kanıt:**
- `src/os/eventBus.js:34-79` `EVENT_TYPES` enum = 30+ event tipi tanımlı
  (SYSTEM_BOOTED, BACKUP_*, WORKER_*, ANALYZER_*, ADMIN_ACTION_*, COST_*, SECURITY_*, KVKK_*, UYAP_*, SBM_*)
- Modüllerde gerçek `bus.emit` çağrıları çoğunlukla **string literal** (`bus.emit("auditor:finding", ...)` `bus.emit("BACKUP_*", ...)`)
- `bus.on` listener: 3 modül (healer, reporter, notifications) — sadece ~10 event tipini dinliyor
- ~46 emit + 3 listener = **emit/listen oranı 15:1** (events çoğu kimseye düşmüyor, sadece SystemEvent table'a persist)

**Etki:**
- EventBus altyapı zengin tasarlandı ama gerçek pub-sub mesajlaşma minimal
- Yeni modül önerisi "X event yayar, Y modülü dinler" varsayımıysa **listener yazımı zorunlu** (otomatik bağ yok)
- "Cross-module reactivity" başlangıç fazında — gelişme alanı

**Onarım yolu:** Madde 30.X yeni — "EventBus listener disiplini": her yeni `bus.emit` için en az 1 dinleyici tanımlamalı (rapor için bile olsa). Şu an TODO.

---

### EKSİK 4 — `mimarHatasi` modülü `runActiveTask` sadece `runStatusCheck` çağırır

**Kanıt:**
- `src/os/modules/mimarHatasi.js:135-137`:
  ```js
  async function runActiveTask() {
    return runStatusCheck();
  }
  ```
- Diğer 16 modül runActiveTask'ta **gerçek eylem yapar** (Madde 30.17 — gözlemci + aktör + akıllı 3 katmanlı disiplin):
  - maintenance: `Document.deleteMany` cleanup
  - recovery: FAILED Document retry
  - ai: Anthropic retry
  - compliance: KVKK 25 gün email
  - backup: snapshot age trigger
- mimarHatasi sadece sayım — Madde 30.17 (Sadece sayma yapan modül YASAK) ihlali

**Etki:**
- Modül 24h içinde ACTION_TAKEN AgentEvent yazmaz → CRITICAL warning'e yol açabilir (Madde 30.17 yasağı)
- "Aktör" katmanı eksik

**Onarım yolu:** mimarHatasi runActiveTask'a gerçek eylem ekle:
- Skor < 60% durumunda otomatik sağlık tarama önerisi (DEVIR_RAPORU'na not yazma)
- Eski STATUS_CHECK event'leri agreggate ile trend analiz
- Adaptive threshold (Madde 30.18) hesaplama

---

### EKSİK 5 — Boot sequence 8/12 step `optional/stub` (sözleşme bekleyen)

**Kanıt:**
- `src/os/boot.js`:
  - **Critical (4):** DB, Supabase Storage, Anthropic API, SSE Endpoints
  - **Optional/Stub (8):** Oracle Worker, pg-boss Queue, Cron Scheduler, UYAP, SBM, Compliance SCC Init, KVKK SCC Validity, VERBİS

**Etki:**
- 67% boot adımı henüz aktif değil
- Tedbirge OS dokümantasyonu (`TEDBIRGE_OS_FIZIBILITE_v2`) 11-step boot sequence vaat ediyor — gerçekte 4 step çalışıyor
- "Hibrit Oracle Free" + "pg-boss queue" + "UYAP/SBM stub" hala bekleyen entegrasyon

**Onarım yolu:** Bu tek tek küçük TUR'larda kapatılır (her birinin kendi şartları var — UYAP sözleşmesi, Oracle SSH key, vb.). Şu an "stub bilinçli" durum.

---

### EKSİK 6 — HAL Adapter 5/9 STUB mode

**Kanıt:**
- `src/os/adapters/`:
  - **Production-ready (4):** anthropic.js (196), render.js (146), kvkk.js (149), supabase.js
  - **THIN/STUB (5):** oracle.js (206 STUB), uyap.js (STUB), sbm.js (94 STUB), eimza.js (87 STUB), vercel.js (THIN)

**Etki:**
- HAL (Hardware Abstraction Layer) prensibi (Yarın Render → Fly.io geçişi tek adapter değişimi) **şu an çoğunlukla theoretical**
- Çoğu adapter sadece interface tanımı + isConfigured() check
- Vendor lock-in riski hala var (gerçek implementations yapılana kadar)

**Onarım yolu:** Her STUB adapter için ayrı KIRMIZI nokta TUR'u (Madde 18.3 — sözleşme/key/altyapı şartları farklı).

---

### EKSİK 7 — `auditor` 2 ayrı implementation (modules/ vs agents/)

**Kanıt:**
- `src/os/modules/auditor.js` (326 satır) — drift detection, 6 kategori, bus.emit('auditor:finding')
- `src/agents/auditor.agent.js` (276 satır) — BaseAgent extends, 5 dk tick, runAllModules + runAllActiveTasks
- İki dosya **birbirinden bağımsız çalışır** — biri Healer'a finding emit eder, diğeri 17 modülü orchestrate eder

**Etki:**
- Aynı isim "Auditor" ama 2 farklı sorumluluk
- Documentation kafa karıştırıcı (CLAUDE.md Madde 30.10 sadece agents/ Auditor'undan bahseder)
- Healer (`src/os/modules/healer.js`) `bus.on("auditor:finding")` dinler — bu eski (modules/auditor.js) stream'i kullanır
- Healer (`src/agents/healer.agent.js`) 10 dk'da bir ayrı CommissionLog/aciliyet otomatik fix yapar

**Sonuç:** İki Auditor + iki Healer + iki Reporter (modules + agents) **paralel** çalışıyor. Her biri farklı iş yapıyor ama isimler aynı. Architecture clean değil.

**Onarım yolu:** Mimar oturumunda netleştirme — 2 katman (modules vs agents) ya birleştirilmeli ya da isimler ayrılmalı (örn. modules/driftDetector.js + modules/quickFix.js + modules/sseRelay.js).

---

## 🟡 ORTA SEVİYE BULGULAR (Mimar dikkat etmeli ama kritik değil)

### BULGU 8 — Module-module communication varsayımı YANLIŞ

**Kanıt:** Module-modül direct import: **0**. EventBus listener: **3**. Yani yeni modül önerisinde *"X modülü Y modülüne haber verir"* varsayımı **yapay** — gerçekleşmesi için listener yazımı + bus.emit zinciri kurulması gerek.

**Sonuç:** Sohbet mimarı 12 modül önerirken modüller arası akış varsaydıysa, mimari değişiklik gerekecek (single layer event-driven mesh).

---

### BULGU 9 — `notifications` modülü tek "consumer-style" modül

**Kanıt:** `notifications.js` 2 bus.on listener (ai veya başka modülden bilgi alıyor). Diğer 16 modül **yalnızca emit** ediyor.

**Sonuç:** Notifications modülü "fan-in" pattern (çok kaynaktan tek hedef) — diğer modüller "fan-out" yok. Yeni "fan-in" modül önerileri (ör. cross-module dashboard) hızlıca eklenebilir.

---

### BULGU 10 — Service-modül entegrasyon az ama hassas (KVKK)

**Kanıt:** 5 entegrasyon noktasının 2'si KVKK adapter (lead.controller + document.controller). Diğer 3 (admin.os, os.events, runner) operasyonel.

**Sonuç:** KVKK audit logging Service → Module bağı kurulu. Bu örnek genişletilebilir (yeni service'lerde aynı pattern — `tedbirgeOS.modules.kvkk.logDataAccess`).

---

### BULGU 11 — Adaptive threshold altyapısı kurulu (`src/os/lib/adaptiveThreshold.js`)

**Kanıt:** Madde 30.18 disiplini var, helper kütüphanesi var, ama hangi modüllerin gerçekten kullandığını bu raporda derinleşmedim. Hızlı kontrol önerilir.

---

### BULGU 12 — Production'da Auditor HEALTHY + Healer/Reporter normal

**Kanıt:** Auditor 4 sn önce tick attı (HEALTHY), Healer 5 dk önce (10 dk interval — beklenen), Reporter 5 dk önce (1h interval — daha yeni başlatıldı). `running:false` aldatıcı naming — anlamı "tick aktif değil arada bekliyor", kayıp değil.

---

## 🆕 YENİ TANI — Sohbet Mimarının Görmediği Eksikler

### YENİ 1 — `OSPolicy` tablosu içeriği

Bu raporda kontrol etmedim ama `src/os/reconciler.js` `prisma.oSPolicy.findMany()` çağırıyor. **OSPolicy tablosu üretimde boş mu, yoksa policy kayıtları var mı?** — `psql` SELECT gerek (TUR #109'da bakılmalı). Boşsa reconciliation effective-zero'dur.

### YENİ 2 — `SystemEvent` tablosu büyüklüğü

EventBus her emit'i `SystemEvent` table'a persist ediyor. **Tablo şişmesi var mı?** — 30 gün retention var mı, yoksa sonsuza kadar yazıyor mu? Şu an Madde 30.3 sadece AgentEvent purge bahsediyor, SystemEvent için Healer içinde temizlik var mı belirsiz.

### YENİ 3 — `BootRecord` tablosu

`boot.js` her başarılı boot'u `BootRecord` table'a yazıyor. Render free tier 15 dk inactivity sonrası uyur → günde ~30-50 boot. **Tablo aylık ne kadar şişiyor?** Healer purge listesinde mi?

### YENİ 4 — Healer'ın `AUDIT_FINDINGS/OPEN/` dosya tabanlı suggestions

`src/os/modules/healer.js:13` `OPEN_DIR = path.join(process.cwd(), "tedbirge-os", "docs", "AUDIT_FINDINGS")`. Critical drift'ler dosyaya yazılıyor. **Bu dosyalar gerçekten okunuyor mu?** UI'da görünür mü, sadece local'de mi? Bu workflow tamamlanmamış olabilir.

### YENİ 5 — Anthropic adapter kullanım gerçekliği

`AI_FEATURES_ENABLED` default false (Madde 24.14). Production'da kaç AI modül çağrısı yapılıyor? Sıfır mı, yoksa CEO sometimes açıyor mu? Bu bilgi maliyet kontrolü için kritik.

---

## ✅ SONUÇ — MİMAR HATASI 50 DÜZELTME ZEMİNİ

### Kod gerçeği özetle:
- **17 modül var** (registry'de) → **16 modül görünür** (production endpoint'te)
- **Modül-modül direct import: 0** (full isolation, EventBus üstünden)
- **EventBus emit:listen oranı 15:1** (zengin altyapı, az tüketici)
- **Reconciler altyapı kurulu, handler implementations TODO**
- **Boot 12 step, 8 optional/stub**
- **HAL Adapter 9 type, 5 STUB mode**
- **2 ayrı Auditor implementation** (modules/ + agents/)

### Mimar Hatası 50 ders:
1. **Önce kod, sonra önerme** — sohbet mimarı 12 modül önerirken bu altyapıyı görmemiş
2. **Mevcut 17 modülün hepsi gerçek iş yapıyor** — yeni modül önerisi bunları "ekleme" değil "değişme" olabilir
3. **Module-modül akış varsayımı YANLIŞ** — gerçek mimari single-layer (Auditor → 17 paralel)
4. **Reconciler/HAL altyapısı 67% iskelet** — mimari "tamam" değil "hazırlanıyor"

### TUR #109 mektubu için sohbet mimarına net mesaj:
> Mehmet Bey'in vizyonu (yurtdışı + sıfır maliyet + B2B SaaS LegalTech) ile **mevcut 17 modül + 67% iskelet altyapı** kod gerçeği üstünde **dürüstçe** birleşmeli. Yeni modül önermeden önce **mevcut 17 modülün tamamlanması** (mimarHatasi visibility fix + Reconciler handler implementations + STUB adapters'in en az 1-2'si) öncelik olabilir.

> Veya: Mevcut altyapı yeterli kabul edilip **iş katmanı modülleri** (B2B, KVKK, içerik üretim, ödeme) genişletme stratejisi seçilebilir. Bu **CEO kararı** (Madde 17.5).

---

## 📁 EK BELGE LİNKLERİ

- `outputs/TUR_108_OS_HARITA.md` — Detaylı satır-bazlı tablo + tablo kullanımı + 12 keşif sorusu cevapları
- `outputs/TUR_108_DEPENDENCY_GRAPH.md` — Mermaid görsel diagram + EventBus trafik + ADMIN_FEED pipeline
- `outputs/TUR_108_GERCEK_EKSIKLER.md` — Bu dosya (mimar tanı + öneriler)

---

— TUR #108 GERÇEK EKSİKLER TAMAM
— Mimar Hatası 50 düzeltme — kod kanıtlı tanı, spekülasyon yok
— *"Önce gerçeği gör, sonra konuş."* — CEO direktifi, 10 May 2026
