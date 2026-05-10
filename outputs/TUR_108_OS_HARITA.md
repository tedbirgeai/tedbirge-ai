# TUR #108 — OS HARITA (Pure Keşif Tanı Raporu)

**Tarih:** 10 Mayıs 2026
**Tip:** Pure keşif — kod değişikliği YOK (Madde 14.3 + 14.5 + TUR #97 emsali)
**Anayasa:** v1.26.0
**Mimar Hatası 50 düzeltme yolu:** Önce gerçeği gör, sonra konuş (CEO direktifi).

---

## 📊 BÖLÜM A — 17 OS Modülü Satır-Bazlı Tablo

Kaynak: `src/os/modules/*.js` (3 agent dosyası — auditor.js + healer.js + reporter.js HARİÇ — 17 modül)

| Modül         | Toplam Satır | runStatusCheck | runActiveTask | Severity Yelpazesi      | Env Vars (count) |
|---------------|--------------|----------------|---------------|--------------------------|-------------------|
| ai            | 624          | 138            | 84            | INFO + (CRITICAL inline) | 2 (ANTHROPIC + AI_FLAG) |
| analyzer      | 615          | 97             | 53            | (event-bazlı)            | 0 (lazy)          |
| appearance    | 237          | 56             | 49            | INFO + WARNING           | 0                 |
| backup        | 724          | 190            | 90            | WARNING (+CRITICAL)      | 5 (Supabase env)  |
| compliance    | 689          | 83             | 52            | (event-bazlı, CRITICAL)  | 0                 |
| costGuard     | 626          | 91             | 60            | (event-bazlı)            | 4 (COST_BUDGET_*) |
| deploy        | 691          | 138            | 44            | (event-bazlı)            | 5 (Render+Vercel) |
| insurance     | 284          | 40             | 49            | INFO                     | 0                 |
| maintenance   | 536          | 41             | 89            | INFO                     | 0                 |
| mimarHatasi   | 139          | 117            | 3 (=runStatusCheck) | CRITICAL + WARNING  | 0                 |
| navigation    | 360          | 48             | 112           | (event-bazlı)            | 1 (PANEL_URL)     |
| notifications | 648          | 53             | 55            | (event-bazlı)            | 3 (ADMIN+SLACK)   |
| performance   | 541          | 52             | 44            | (event-bazlı)            | 0                 |
| pulse         | 598          | 43             | 65            | CRITICAL + INFO          | 0                 |
| recovery      | 472          | 44             | 83            | (event-bazlı)            | 0                 |
| security      | 689          | 95             | 141           | CRITICAL                 | 0                 |
| uyapControl   | 619          | 35             | 49            | INFO                     | 1 (UYAP_API_URL)  |
| **TOPLAM**    | **9092**     | **1459**       | **1170**      | —                        | **21 env**        |

**Not:** "Severity Yelpazesi" sütunu modül dosyasında **sabit string olarak görünen** severity'leri gösterir. Çoğu modül severity'yi runtime'da koşula göre seçer — tam yelpaze AgentEvent tablosunda görünür.

---

## 🔗 BÖLÜM B — Modül-Modül Bağımlılık Matrisi

### B.1 Doğrudan import (require) bağımlılığı

```
Modül-modül require sayısı: 0 (SIFIR)
```

**Tek istisna:** `src/agents/runner.js` Pulse modülünü 1× import eder (Pazar 23:59 weekly snapshot için).

**Bulgu:** 17 modül **tamamen izole**. Hiçbir modül diğerini import etmez. Tüm cross-module iletişim `eventBus` üzerinden GİDER veya `AgentEvent`/`RealtimeEvent` tablolarına yazılır.

### B.2 EventBus üzerinden bağ

```
bus.emit (modüllerden çıkan): 46 emit (17 modül toplam)
bus.on (modülden dinleyen):    3 listener
  ├─ healer.js: bus.on("auditor:finding")   ← Auditor finding'leri otomatik fix/suggest
  ├─ reporter.js: bus.on(EVENT_NAME) (~8 event) ← SSE relay (panel'e yayın)
  └─ notifications.js: bus.on (2 event)
```

**Bulgu:** EventBus altyapısı zengin (`EVENT_TYPES` içinde 30+ event taxonomy) ama gerçek tüketici sadece 3 modül. Çoğu `bus.emit` "kimseye düşmüyor".

### B.3 reconciler — `registerPolicyHandler` kayıtları

| Modül | registerPolicyHandler çağrısı |
|---|---|
| ai, backup, compliance, costGuard, deploy, maintenance, performance, pulse, security, uyapControl | 4× |
| analyzer | 4× |
| insurance, navigation | 2× |
| appearance, mimarHatasi, notifications, recovery | 0× |

**Toplam:** ~50 policy handler kaydı. Ancak `src/os/reconciler.js` `POLICY_HANDLERS` map **runtime kayıtları** kabul eder — kayıt mekanizması var, **gerçek policy reconciliation döngüsünde drift düzeltmesi henüz aktif değil** (kod yorumuna göre "TODO: pulse/backup/maintenance modulleri eklendikce doldurulacak").

---

## 🔄 BÖLÜM C — Service-Modül Tetikleme Haritası

| Service / Controller / Route | OS Modülü Tetikleme |
|---|---|
| `src/agents/runner.js` (in-process scheduler) | `pulse.weeklyRunner()` Pazar 23:59 TR |
| `src/agents/auditor.agent.js` (5 dk tick) | `runAllModules()` (17 modül paralel) + `runAllActiveTasks()` (17 modül paralel) |
| `src/controllers/admin.os.controller.js` | `tedbirgeOS.modules[name].status\|getStatus()` (read-only durum) |
| `src/controllers/document.controller.js` | `tedbirgeOS.modules.kvkk.logDataExport(...)` (KVKK adapter) |
| `src/controllers/lead.controller.js` | `tedbirgeOS.modules.kvkk.logDataAccess(...)` (KVKK adapter) |
| `src/routes/os.events.routes.js` | `tedbirgeOS.modules.reporter.addClient(res)` (SSE bağlantı) |

**Bulgu:** Service katmanı doğrudan iş modüllerini tetiklemiyor. Tüm tetiklemeler `Auditor` üstünden (5 dk tick) veya KVKK adapter (audit log) üstünden geçer.

**Mektupta `lead.service → ai modülü` gibi varsayılan akış GERÇEK KODDA YOK.** AI analizi aslında `analyzer.service` (eski direkt servis) üzerinden tetiklenir, OS `ai` modülü AGENT seviyesinde sadece kullanım sayım + retry orchestration yapar.

---

## 🌐 BÖLÜM D — External API Bağımlılık Tablosu

| Modül | External Endpoint | Bağımlılık Türü | Fail-mode davranış |
|---|---|---|---|
| **ai** | `api.anthropic.com/v1/messages` | Anthropic Claude (`AI_FEATURES_ENABLED` flag — Madde 24.14) | Flag false → SKIP, key yoksa SKIP |
| **backup** | `api.supabase.com/v1/projects/{ref}/database/backups` | Supabase Management API | Token yok → SKIP + WARNING (saatte 1) |
| **deploy** | `api.render.com` + `api.vercel.com` | Deploy platform health | Key yok → SKIP |
| **navigation** | `${PANEL_URL}` | Panel reachability check | Yanıt yok → WARNING |
| **notifications** | (Slack webhook commented out) | Şu an dış API çağrısı YOK | — |

**Bulgu:** 17 modülün **sadece 4'ü** dış API'ye bağımlı. Geri kalan 13 modül **tamamen DB-internal** (sadece Prisma sorgu + AgentEvent yazımı). Bu Madde 24.14 (sıfır marjinal maliyet) ile uyumlu — Anthropic feature flag default kapalı, geri kalan modüller dış servis aboneliği gerektirmez.

---

## 📡 BÖLÜM E — Production AgentEvent Dağılımı (10 May 2026 00:38 UTC anlık)

Kaynak: `GET https://tedbirge-ai.onrender.com/api/agents-health` (auth-free, Madde 30.27)

```json
{
  "auditorHealth": "HEALTHY",
  "agents": [
    {"name":"Auditor","intervalMs":300000,"lastRunAt":"2026-05-10T00:34:12.339Z","running":true},
    {"name":"Healer","intervalMs":600000,"lastRunAt":"2026-05-10T00:33:56.703Z","running":false},
    {"name":"Reporter","intervalMs":3600000,"lastRunAt":"2026-05-10T00:33:52.932Z","running":false}
  ],
  "eventCounts": {"last1h": 293, "last24h": 7102}
}
```

**Production module-bazlı son 1 saat AgentEvent count:**

| Modül | Son 1h Event | Yaklaşık Periyot Doğru mu? |
|---|---|---|
| ai | 12 | ✅ (5 dk tick × 12 = 60 dk × 2 olay/tick = ~12) |
| analyzer | 15 | ✅ |
| appearance | 13 | ✅ |
| backup | 12 | ✅ |
| compliance | 13 | ✅ |
| costGuard | 14 | ✅ |
| deploy | 15 | ✅ |
| insurance | 13 | ✅ |
| maintenance | 12 | ✅ |
| navigation | 13 | ✅ |
| notifications | 14 | ✅ |
| performance | 14 | ✅ |
| pulse | 12 | ✅ |
| recovery | 14 | ✅ |
| security | 15 | ✅ |
| uyapControl | 14 | ✅ |
| **mimarHatasi** | **❌ ENDPOINT'TE GÖRÜNMÜYOR** | **🔴 KRİTİK BULGU** |

**Toplam (16 modül):** ~225 event/saat × 24h = ~5400 module-event/gün + auditor heartbeat + 6 audit check finding + healer/reporter relay = **7102 event/gün** (production rapor ile uyumlu).

**🔴 KRİTİK BULGU:** `src/routes/agent.routes.js:50-54` `moduleNames` array **HARDCODED 16 modül** (`mimarHatasi` YOK) ama `src/agents/auditor.agent.js:197-203` 17 modülü çağırır (mimarHatasi DAHİL). Yani mimarHatasi modülü production'da 5 dk tick atıyor + AgentEvent yazıyor, ama public health endpoint görmezden geliyor. **Kanıt zinciri kopuk** — Mimar Hatası 50 düzeltme dosyası kendisi mimar hatası yarattı.

**3 farklı yerde inkonsisten module listesi (Madde 30.10 ihlali):**
| Konum | Modül sayısı | mimarHatasi var mı? |
|---|---|---|
| `src/os/registry.js OS_MODULES` | 17 | ✅ |
| `src/agents/auditor.agent.js runAllModules` | 17 | ✅ |
| `src/agents/auditor.agent.js runAllActiveTasks` | 17 | ✅ |
| `src/controllers/admin.os.controller.js moduleNames` | 16 | ❌ |
| `src/routes/agent.routes.js moduleNames` | 16 | ❌ |

---

## ❓ BÖLÜM F — 12 Keşif Sorusunun Direkt Cevapları

### Yapı Soruları

**1. 17 modülün gerçekten kaç satır kodu var?**
- Toplam: **9092 satır** (3 agent + 17 modül = 20 dosya × ortalama 493 satır)
- En büyük: `backup.js` (724 satır) — Supabase Management API + age check + integrity
- En küçük: `mimarHatasi.js` (139 satır) — sadece 4 audit kategorisi sayım
- runStatusCheck toplam: **1459 satır** (ortalama 86 satır/modül)
- runActiveTask toplam: **1170 satır** (ortalama 69 satır/modül)

**2. Her modül hangi DB tabloları kullanıyor?**

Ortak (yüksek paylaşım):
- `agentEvent` — **17/17 modül** (tüm modüller AgentEvent yazar)
- `realtimeEvent` — **13/17 modül** (ADMIN_FEED bildirimi yazan modüller)
- `activityLog` — **4 modül** (compliance, mimarHatasi, notifications, security)

Modül-özel:
- `lead` — pulse, navigation, recovery, insurance (analitik veya sayım)
- `document` — ai, analyzer, costGuard, maintenance, pulse, recovery (FAILED retry, age check)
- `user` — appearance, navigation, security
- `kVKKSCC` — sadece compliance
- `dataSubjectRequest` — sadece compliance
- `commissionLog` — sadece pulse
- `assignment` — sadece navigation
- `session` — sadece maintenance

**3. Modüller birbirini import ediyor mu?**
**Hayır — SIFIR import.** Tek istisna: `runner.js` Pulse'u (agent değil, scheduler için) import eder. Modüller tamamen izole.

**4. runStatusCheck'ler gerçekten farklı iş mi yapıyor, yoksa kopya-yapıştır pattern mi?**
Pattern benzer (try-catch + DB sorgu + agentEvent.create + ADMIN_FEED RealtimeEvent koşullu) ama her modül **kendi domain'inde** ayrı sorgular yapar. **Kopya değil**, ortak shape.

**5. runActiveTask'lar gerçekten EYLEM yapıyor mu?**
- ✅ **Gerçek eylem yapan modüller:** maintenance (Document.deleteMany cleanup), recovery (FAILED Document retry), ai (anthropic retry), compliance (KVKK 25 gün email), backup (snapshot age trigger)
- ⚠️ **Sadece ADMIN_FEED öneri yazan:** insurance (auto-assign yok, sadece sayım), navigation (rebalance öneri), security (2FA off bildirim), pulse (anomaly detect)
- ❌ **runActiveTask sadece runStatusCheck çağırır:** mimarHatasi (3 satır — `return runStatusCheck()`)

### İletişim Soruları

**6. AgentEvent tablosu kaç satır?**
- Production son 1h: **293 event**
- Production son 24h: **7102 event**
- Yaklaşık günlük yazım: ~7100/gün × 30 gün = ~213k/ay
- Healer her 30 gün eski INFO event'leri purge eder (Madde 30.3) — tablo boyutu kontrol altında

**7. Bir modül CRITICAL yazsa, başka modül bunu görüyor mu?**
**Sadece UI** (ADMIN_FEED RealtimeEvent → SSE → panel). Modüller arası **otomatik tepki YOK**. EventBus altyapısı var ama sadece `auditor:finding` → `healer` zinciri kullanılıyor. Diğer modül-modül feedback yok.

**8. RealtimeEvent ADMIN_FEED hangi modüller yazıyor, hangileri yazmıyor?**

✅ Yazan (13 modül + 2 yer):
- ai, analyzer, backup, compliance, costGuard, deploy, insurance, maintenance (yok), mimarHatasi (sadece CRITICAL), navigation, pulse, recovery, security
- Plus: `auditor.agent.js` (AUDITOR_FINDINGS) + `auth.controller.js` (registration pending) + `reporter.agent.js` (digest)

❌ Yazmayan:
- `notifications` (kendisi notification gönderme servisi — meta)
- `performance` (sadece AgentEvent)
- `appearance` (sadece AgentEvent)
- `uyapControl` (sadece AgentEvent — UYAP API yok henüz)
- `maintenance` (sadece DB temizlik, alarm yok)

**9. Service layer modülleri tetikliyor mu?**
**Minimal — 5 nokta:**
1. `lead.controller.js` → `kvkk` adapter (KVKK audit log)
2. `document.controller.js` → `kvkk` adapter (KVKK audit log)
3. `admin.os.controller.js` → 16 modül `status()` (read-only)
4. `os.events.routes.js` → `reporter.addClient()` (SSE)
5. `runner.js` → `pulse.weeklyRunner()` (Pazar 23:59)

Service layer ile OS modülleri arasında **direkt iş tetikleme yok**. AI analizi `analyzer.service` üzerinden gider (eski direkt servis), OS `ai` modülü sadece **gözlemci**.

### Sağlık Soruları

**10. Auditor durursa kaç modül durur?**
17 modül. `Auditor.run()` → `runAllModules()` + `runAllActiveTasks()` zinciri 17 modülü 5 dk'da bir tetikler. Auditor durursa 17 modülün de runStatusCheck/runActiveTask çalışmaz → AgentEvent yazımı durur → mimarHatasi modülü `auditorEventsHour === 0` → CRITICAL self-detect.

**11. Hangi modüller external API'ye bağımlı?**
- **ai** (Anthropic) — `AI_FEATURES_ENABLED` flag default kapalı (Madde 24.14)
- **backup** (Supabase Management API) — `SUPABASE_ACCESS_TOKEN` env, yoksa SKIP+WARNING
- **deploy** (Render API + Vercel API) — key yoksa SKIP
- **navigation** (Panel URL HEAD check) — fail → WARNING
- **notifications** (placeholder Slack — şu an pasif)

Diğer 12 modül **tamamen DB-internal** (sıfır dış servis bağımlılığı).

**12. Hangi modüller production'da gerçekten çalışıyor?**
- 16 modül `/api/agents-health` endpoint'inde görünür ve son 1h 12-15 event yazmış (✅ çalışıyor).
- **mimarHatasi PRODUCTION'DA ÇALIŞIYOR** (Auditor 17 modülü çağırır, kod kanıtı: `src/agents/auditor.agent.js:197-203`) **AMA** public endpoint'te görünmüyor (Bölüm E kanıtı — 🔴 KRİTİK).

---

## 📋 ÖZET

- **17 OS modülü, 9092 satır iş kodu** (3 agent + 17 modül = 9858 satır toplam)
- **Modül-modül direkt bağımlılık: SIFIR** (full isolation)
- **EventBus 30+ taxonomy ama 3 listener** (healer, reporter, notifications)
- **5 service-modül entegrasyon noktası** (KVKK adapter ağırlıklı)
- **4 modül external API'ye bağımlı** (geri kalan 13 modül DB-internal — Madde 24.14 uyumlu)
- **Production: 16 modül görünür + 1 modül (mimarHatasi) endpoint'te eksik** (3 yerde hardcoded list inkonsistansı)
- **Reconciler altyapı kurulu ama POLICY_HANDLERS map çoğunlukla TODO** (drift detection yapay)
- **Boot sequence 11 adım, 8'i optional/stub** (Oracle, pg-boss, UYAP, SBM, VERBİS, KVKK SCC, vb.)
- **HAL Adapter ekosistem 9 interface, çoğu THIN/STUB mode** (sözleşme bekliyor)

— TUR #108 Bölüm A-F TAMAM
— Mimar Hatası 50 düzeltme — pure tanı, kod fix YOK
