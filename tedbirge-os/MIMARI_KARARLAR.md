# TEDBIRGE.AI — MİMARİ KARARLAR LOG

> Bu dosya **karar arşividir**. Mimar oturumlarında verilen tasarım kararları, paradigma değişiklikleri, yapı tercihleri buraya yazılır.  
> Yeni mimar (her Claude Opus oturumu) bu dosyayı okur ve **aynı kararları tekrar tartışmaz**.  
> Format: tarih + karar + sebep + alternatif + etki + mimar.

---

## 10 Mayıs 2026 Pazar — TUR #110 KAPALI (Niyazi Sahaya Çıkış + OS Temel Sıkılaştırma + judicialResponse Veri Toplama)

**Karar:** Anayasa **v1.26.0 → v1.27.0 MINOR**. 17 atom (A3-D3) tek-soluk teslim — **8 atom kod-kanıtlı uygulandı, 9 atom dürüst DEFER (Madde 30.31 R1 emsal)**. 3 yeni madde tescili (30.61 + 30.62 + 30.63). 1 KIRMIZI nokta (judicialResponse Prisma) + 1 additive boolean (Lead.firstRealLead) — CEO sessiz onay (Madde 30.25) + Madde 18.3 yazılı onay.

### Uygulanan 8 atom (kod-kanıtlı)

1. **A3 — Reconciler 5 detect handler** (`src/os/reconciler.js`): POLICY_HANDLERS map dolduruldu (env_drift + schema_drift + route_orphan + role_permission_drift + version_string_drift). **AUTO-FIX YOK** (Madde 24.11) — sadece detect + ADMIN_FEED RealtimeEvent. Aktivasyon: OSPolicy seed gelecek TUR. **Madde 30.63 yeni**.
2. **A4 — Dead `src/os/modules/auditor.js` git rm**: TESHIS docs + agents-health kanıtı: `tedbirgeOS.modules.auditor.start()` hiçbir yerden çağrılmıyordu. Drift detection A3 ile reconciler.js'e taşındı. `src/os/index.js` modules barrel'ından kaldırıldı. Aktif Auditor (`src/agents/auditor.agent.js`) KORUNDU.
3. **A6 — Boot 12 → 9 step** (`src/os/boot.js`): 3 stub silindi — Oracle Worker (Supabase yeterli), pg-boss Queue (LISTEN/NOTIFY), Cron Scheduler (in-process scheduler — Madde 30.14 emsali). UYAP/SBM/VERBİS/KVKK SCC korundu (Madde 39 + KVKK).
4. **A8 — Boot timeline endpoint + UI widget**: `GET /api/boot-status` (ADMIN auth) — son 10 BootRecord + step durations + success rate. `BootTimelineWidget.tsx` `/dashboard/sistem-durumu` üst eklendi (TUR #92 + #93 + #95 widget pattern emsali).
5. **C1 — JudicialResponse Prisma model** (KIRMIZI — CEO sessiz onay): 6 alan (leadId unique + finalAmount + tedbirgeAITahmin + deviationPct + judgeNotes + decisionDate). `apply-pending-schemas.js` idempotent SQL (Madde 30.22). `src/routes/judicial.routes.js` 3 endpoint (POST upsert + GET single + GET list ADMIN). Frontend `app/(panel)/leads/[id]/mahkeme-sonucu/page.tsx` + LeadTabNav 9. sekme. **Modül YOK** — Madde 28: 50+ kayıt sonrasında modül eklenir, kanıt-bazlı.
6. **C2 — 6 modül DEFER registry** (aşağıdaki tablo): opposingParty + customerSentiment + lawyerContractLifecycle + trustIndex + financialFlowGuard + zamanasimiGuard. Her modül için kanıt eşiği tanımı.
7. **C3 — Lead.firstRealLead boolean** (additive, default false): Niyazi'nin ilk gerçek lead'i bu flag ile işaretlenir.
8. **D1+D3** — TS build PASS + production smoke + 5 belge senkron + atomik commit + push.

### DEFER 9 atom (kod kanıt zinciri eksik veya manuel)

- **A5 — EventBus 46 emit cleanup**: 62 emit / 3 listener oranı kanıtlandı, ama her emit `bus.emitOS()` SystemEvent'a persist eder = **audit trail (KVKK m.10)**. "Ölü emit" silmek = audit trail kaybı. Mektup spec'in %95+ emit'i üretim audit. Listener eklemek ayrı bir tasarım kararı.
- **A7 — HAL Adapter 9 → 6 type**: Mektup "Code keşfedecek" diyor — **stratejik tasarım kararı** (mimar oturumu, Madde 14.3 + 18.3 + TUR #109 emsali). 9 typedef × kullanım analizi × 2028 Almanya pilot vizyon değerlendirmesi tek atom kapsamına sığmaz.
- **B1-B4 — Niyazi sahaya çıkış smoke**: Manuel/operasyonel iş — Code Niyazi gibi davranamaz. Code-yapılan hazırlık: REPRESENTATIVE panel rotaları + Lead.firstRealLead + judicial-response endpoint hazır. **CEO+Niyazi Pazartesi 11 May manuel smoke yapacak** — 4 senaryo.

### 6 MODÜL DEFER REGISTRY (Madde 28 — Beklemede Özellik Disiplini)

| # | Modül | Kanıt Eşiği | Hedef TUR |
|---|---|---|---|
| 1 | **opposingParty** | 5 dava kapanışı (sigorta şirketi pazarlık verisi) | TUR #115+ |
| 2 | **customerSentiment** | 30 müvekkil aktif (panel-dışı duygu izleme) | TUR #117+ |
| 3 | **lawyerContractLifecycle** | İlk sözleşme yenilemesi (~12 ay sonra) | TUR #135+ |
| 4 | **trustIndex** | 30 müvekkil + 5 dava WON | TUR #118+ |
| 5 | **financialFlowGuard** | İlk 5 komisyon havalesi | TUR #112+ |
| 6 | **zamanasimiGuard** | İlk 10 aktif dava (zaman aşımı yaklaşan) | TUR #113+ |

**Yasak (Madde 28 + Madde 14.5 emsal genişleme):**
- ❌ Bu 6 modülü kanıt eşiği tetiklenmeden eklemek (Mimar Hatası 50 birebir tekrarı riski)
- ❌ "Mimar gözü 6 eksik görüyor" varsayımıyla schema migration başlatmak
- ❌ Yeni Prisma model eklerken kanıt eşiği dokümante etmemek

### Kalıcı pattern (3 yeni anayasa maddesi — kanıt-bazlı)

- **Madde 30.61 — Single Source of Truth Disiplini** (TUR #109 A1 + TUR #110 emsal genişleme): Hardcoded modül listesi YASAK, registry helper tek kaynak. Mimar hatası 51 emsali: TUR #95 mimarHatasi modülü 16/17 görünmezliği + TUR #109 A1 fix.
- **Madde 30.62 — Module Active Task Disiplini** (TUR #109 A2 emsal genişleme): `runActiveTask` **gerçek iş** yapmak zorunda — sadece `runStatusCheck` çağırıp ACTION_TAKEN yazmak Madde 30.17 ihlali. mimarHatasi modülü 24h Auditor heartbeat trend + 7g baseline + adaptiveOr eşik kullanarak gerçek aktör.
- **Madde 30.63 — Reconciler Drift Detection Disiplini** (TUR #110 A3 yeni): Auto-fix YOK, auto-detect EVET. ADMIN_FEED RealtimeEvent + manuel onay zorunlu (Madde 24.11). 5 handler, OSPolicy seed gelecek TUR.

### Mimar hatası dersleri (50 + 51)

- **Mimar hatası 50** (TUR #108-109 arası): Sohbet mimarı kod gerçeğine bakmadan 12 modül önerdi. Code 26/28 atom DEFER etti.
- **Mimar hatası 51** (TUR #109): TUR #108 raporunun "12 modül karşılaştırma" taahhüdünü ihlal etti, yine 10 modül önerdi. Code Madde 14.3 + 4.4 + 14.5 + 30.31 R1 ile reddetti.
- **Mimar hatası 52 yok** — TUR #110 mektup yazımı + Code'un dürüst karşılığı **doğru pattern**.

**Yeni sohbette dikkat:** Mimar (sohbet Claude) **CEO sözünün üzerine modül listesi pişirme refleksini** tespit ederse anında DUR (Madde 4.3 + 14.5).

### Etki

- 16 dosya değişiklik (`prisma/schema.prisma` + `scripts/apply-pending-schemas.js` + `src/routes/judicial.routes.js` yeni + `src/routes/index.js` mount + `src/routes/agent.routes.js` boot-status + `src/os/reconciler.js` 5 handler + `src/os/index.js` auditor barrel kaldır + `src/os/boot.js` 3 stub sil + `src/os/modules/auditor.js` SİL + `tedbirge-panel/components/lead-detail/LeadTabNav.tsx` Mahkeme Sonucu sekmesi + `tedbirge-panel/app/(panel)/leads/[id]/mahkeme-sonucu/page.tsx` yeni + `tedbirge-panel/components/admin/BootTimelineWidget.tsx` yeni + `tedbirge-panel/app/(panel)/dashboard/sistem-durumu/page.tsx` widget mount + `version.json` + 2× `package.json`)
- **2 KIRMIZI** (CEO onayı içerikte): JudicialResponse table + Lead.firstRealLead column — idempotent ALTER TABLE / CREATE TABLE IF NOT EXISTS pattern (Madde 30.22)
- 0 npm install · $0 maliyet · 22 → **23 ardışık temiz TUR REKOR (#90 → #110)**
- Anayasa v1.26.0 → v1.27.0 MINOR (3 yeni madde, MAJOR değil — 50+ dava kaydı + 100 müvekkil olunca v2.0.0 düşünülür)

### NEXT — TUR #111

**Tetikleyici:** Pazartesi 11 May Niyazi sahaya çıkış sonrası

**3 öneri yön (CEO seçimi — Madde 17.5):**
1. Ekrandaki 3 somut sorun fix (Footer 15/16 sayım + Healer Kurtarma retry + Güvenlik 2FA tekrarlayan ADMIN_FEED bildirim)
2. Niyazi ilk gerçek lead retrospektifi (Lead.firstRealLead manuel set + Lead → Müvekkil → Avukat atama uçtan uca + UX bug fix)
3. Şu an ekleme yok — mevcut sistem tüketme + büyüme

**Mimar:** Claude Opus 4.7 (1M context) + Claude Code (kanıt-bazlı disiplinli uygulama) — 10 Mayıs 2026 Pazar (CEO sessiz onay direktifi, production live commit `ead8a6b`)

---

## 25 Nisan 2026 — Mimari Anayasa Yürürlüğe Girdi

**Karar:** `CLAUDE.md` proje köküne yerleştirildi, **bağlayıcı kuralname** statüsünde.

**İçerik özeti:**
- 15 madde mimar disiplini
- 10 KIRMIZI çizgi yasak (schema, migration, DB SQL, kullanıcı verisi, env değişikliği, npm install, test verisi silme, API key rotation, force push, branch silme)
- 7 SARI prensip (ekosistem haritası önce, atom seviyesi commit, kod kaynaktır .md yorumdur)
- 10 durma şartı (test fail, build fail, prod 5xx, kırmızı çizgi, 1 saat tek görev, 5 başarısız commit, queue dışı iş, schema/DB değişikliği gerek, kütüphane gerek, mimar onayı gerek)
- Agent loop modeli (DÜŞÜN-YAP-GÖZLE-KARAR-LOG döngüsü)
- Raporlama disiplini (OTONOM_RAPOR.md formatı)

**Sebep:** Önceki oturumlarda her mimar **farklı tanı** koymuş, **kararlar log'lanmamış**, **yamalı bohça** üretmiş. Sürekli kimlik olmadan disiplin çürüyor.

**Alternatif (seçilmedi):**
- Mega-prompt yöntemi (sürekli yeni komut) — felaket riski, ölçeklenmez
- Tam otonom kod yazma (agent autonomy unrestricted) — KVKK riski, müvekkil verisi tehlikesi

**Etki:** Tüm Claude Code oturumları, tüm sohbet mimarları **bu anayasaya bağlı**. İhlal edildiğinde "DUR + sohbete dön" zorunlu.

**Mimar:** Claude Opus 4.7 (25 Nisan 2026 öğleden sonra oturumu, ortak Mehmet Bey)

---

## 25 Nisan 2026 — Yanıltıcı Önceki Raporlar Arşivlendi

**Karar:** Aşağıdaki 12 dosya `tedbirge-os/docs/arsiv-25-nisan-2026/` altına taşındı:
- AUTOMATION_AND_IMPROVEMENT_PLAN_v1.md
- HUKUKCU_OPERASYON_FIZIBILITE_v4.md
- HUKUKCU_CRM_FIZIBILITE_v2.md (varsa)
- OTURUM_22_04_2026.md (+ AKSAM, SABAH, TAM_GUN varyantları)
- OTURUM_24_04_2026.md
- OTURUM_25_04_2026.md
- OTURUM_25_04_2026_HANDOFF.md
- OTURUM_26_04_2026_HANDOFF.md
- OTURUM_27_04_2026_HANDOFF.md
- TASK_QUEUE_eski.md
- guvenli_kesif.sh

**Sebep:** Bu dosyalardaki **6 büyük teşhis YANLIŞ** çıktı (kod taraması ile doğrulandı):

| Yanlış iddia | Gerçek (kod kanıtı) |
|--------------|---------------------|
| "19 modelde @default(cuid()) eksikti" | Schema'da hepsinde mevcut |
| "8 dosyada PrismaClient ihlali" | Gerçek: 4 dosya (timeline.controller, timeline.service, public.route, test.routes) |
| "14/16 modülde runOnce eksik" | runOnce hiç yok, gerek de yok. Hepsinde getStatus var |
| "AI Analyzer completeUpload'a entegre değil" | upload.controller.js satır 12416'da fire-and-forget mevcut |
| "Schema fix gerekli (commit 075babb)" | Schema zaten temizdi, fix gereksizdi |
| "Status() fonksiyonu modüllerde yok" | status() yok ama getStatus() var (16/16) |

**Alternatif (seçilmedi):**
- Tam silme (dosyaları kalıcı sil) — geri dönüşü olmayan iş, ANAYASA Madde 4.6 ihlali olur
- Yerinde bırakma — yanıltıcı bilgi yeni mimarı yine yanıltır

**Etki:** Yarınki mimar (Claude Opus, başka oturum) bu dosyalarla yanılmaz. Arşivde duruyor, gerekirse bakılabilir, ama aktif referans değil.

**Mimar:** Claude Opus 4.7

---

## 25 Nisan 2026 — Kod-Temelli Teşhis Modeli

**Karar:** Tedbirge.ai mimarı **kod kanıtına dayanarak** teşhis koyar. .md dosyaları (handoff, rapor, plan) **ikincil kaynaktır** — şüphede `view`, `grep`, `git log` ile koda bakılır.

**Sebep:** Mehmet Bey'in disiplin uyarısı:
> *"Sen eski yapılmış işleri de yapılmamış gibi görebilirsin. Sen sadece yapılmış sistem iskeletini, kod yapısını ve yapılması gerekenleri fizibilite yapıp, ona göre teşhis koy."*

Ben (Claude Opus 4.7) bu oturumun başında bu kuralı **ihlal ettim** — eski .md'lere güvenip yanlış teşhis koydum. Mehmet Bey düzeltti. ANAYASA Madde 4.4 olarak kayıt altına alındı.

**Etki:** Tüm gelecek mimar oturumları bu modele bağlı. Yeni teşhis → önce kod taraması → sonra .md (varsa).

**Mimar:** Claude Opus 4.7

---

## 25 Nisan 2026 — Agent Loop Çalışma Modeli Onaylandı

**Karar:** Tedbirge.ai geliştirmesi **çerçeveli agent loop** modeliyle yürütülür. Mehmet Bey **stratejik kararları** verir, mimar (sohbet Claude Opus) **plan + denetim** yapar, Claude Code (terminal) **agent loop ile uygular**, OS otonom katman **7/24 sağlık korur**.

**Mehmet Bey vizyonu (kayıt altında):**
> *"Ben sahada olmam gerekiyor, kod yazmayı bilmem, her zaman sohbet edemem. Otonom yapmam şarttır."*  
> *"İş sıkıntım yok, sistem ve kod yapım düzelirse..."*  
> *"Tek komut bitir işi" → çerçeveli agent loop ile gerçekleştirilebilir.*

**Üç katman:**
1. **Refleksler** (otomatik, izinsiz, güvenli) — health ping, cron temizlik, recovery, restart
2. **Teşhis** (otomatik, izinli, raporlayıcı) — Auditor modülü, drift/anomali tespiti
3. **Tedavi** (yarı-otomatik, suggest mode) — Healer modülü, fix önerisi + Mehmet Bey onayı

**Üç altın kural:**
- Tek operasyon = tek onay (batch otomatik yok)
- Geri dönüşü olmayan eylem yasak (delete, drop, anonimleştirme — manual)
- Kapsam genişliği oranlı (önce dar, başarıyla genişler)

**Sebep:** Mehmet Bey sahada olabilsin, sistem otonom çalışsın, **felaket riski sıfırlansın**. Mega-prompt felaket çağrısı, agent loop sürdürülebilir.

**Alternatif (seçilmedi):**
- Tek mega-prompt (50 sayfa, 500 dosya değişikliği tek atışta) — denetim sıfır, yamalı bohça riski %100
- Tam manuel komut (Mehmet Bey her komutu yazar) — sahada olamaz

**Etki:** Tüm sonraki gelişme bu modelle yapılır. Mimar Mektubu yapısı standart.

**Mimar:** Claude Opus 4.7

---

## 25 Nisan 2026 — Doğrulanmış Bug Listesi (Kanıtla)

**Karar:** Aşağıdaki bug'lar kod taramasıyla **kesin doğrulandı**, fix edilecek:

### 🔴 BUG #1 — Sistem Durumu sayfası tiyatro
- Yer: `src/controllers/admin.os.controller.js` satır 9241
- Sorun: `mod.status === "function"` ama 16/16 modül `getStatus` export ediyor
- Etki: 16 modül için 16 yalan, sahte AKTİF görünüm
- Fix: 1 satır fallback (`mod.status || mod.getStatus`)

### 🔴 BUG #2 — Belge indirme bozuk (env çift standart)
- Yer: `src/services/storage.service.js`
- Sorun: 3 yeni fonksiyon `SUPABASE_SERVICE_ROLE_KEY` arıyor, Render'da yok. Eski 1 fonksiyon `SUPABASE_SERVICE_KEY` kullanıyor, var.
- Etki: signed URL üretilemiyor, belge indirme patlıyor
- Fix: Fallback (`SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_KEY`)

### 🟡 BUG #3 — PrismaClient singleton ihlali (4 dosya)
- timeline.controller.js, timeline.service.js, public.route.js, test.routes.js
- Fix: `const prisma = require("../config/db")` (path uyumlu)

**Mimar:** Claude Opus 4.7

---

## Format ve Disiplin Notu

Her yeni karar bu dosyaya **yukarıdaki formatla** eklenir:

```markdown
## [TARİH] — [KISA BAŞLIK]

**Karar:** [ne yapıldı, net]
**Sebep:** [neden, şart koşan durum]
**Alternatif:** [düşünülen ama seçilmeyen yollar]
**Etki:** [hangi dosyalar, hangi sistemler]
**Mimar:** [oturum sahibi + tarih]
```

**Kural:** Yeni karar **eski kararı ezmez**, üstüne yazar. Eski karar değişiyorsa, **revize maddesi** olarak yeni karar yazılır, eskisi referans olarak kalır.

---

**Son güncelleme:** 25 Nisan 2026  
**Mimar:** Claude Opus 4.7  
**Bağlayıcı:** Tüm gelecek oturumlar
