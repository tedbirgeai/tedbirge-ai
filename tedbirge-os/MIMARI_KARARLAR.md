# TEDBIRGE.AI — MİMARİ KARARLAR LOG

> Bu dosya **karar arşividir**. Mimar oturumlarında verilen tasarım kararları, paradigma değişiklikleri, yapı tercihleri buraya yazılır.  
> Yeni mimar (her Claude Opus oturumu) bu dosyayı okur ve **aynı kararları tekrar tartışmaz**.  
> Format: tarih + karar + sebep + alternatif + etki + mimar.

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
