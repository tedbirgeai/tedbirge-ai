# TEDBIRGE.AI — MİMARİ KARARLAR LOG

> Bu dosya **karar arşividir**. Mimar oturumlarında verilen tasarım kararları, paradigma değişiklikleri, yapı tercihleri buraya yazılır.  
> Yeni mimar (her Claude Opus oturumu) bu dosyayı okur ve **aynı kararları tekrar tartışmaz**.  
> Format: tarih + karar + sebep + alternatif + etki + mimar.

---

## 25 Nisan 2026 — Mimari Anayasa Yürürlüğe Girdi

**Karar:** `CLAUDE.md` proje köküne yerleştirildi, **bağlayıcı kuralname** statüsünde.

**İçerik özeti:**
- 15 madde mimar disiplini (TUR #2 başlangıcında 16'ya çıktı — Madde 5 onay disiplini eklendi)
- 10 KIRMIZI çizgi yasak
- 7 SARI prensip
- 10 durma şartı
- Agent loop modeli
- Raporlama disiplini

**Sebep:** Önceki oturumlarda her mimar farklı tanı koymuş, kararlar log'lanmamış, yamalı bohça üretmiş.

**Alternatif (seçilmedi):**
- Mega-prompt yöntemi (felaket riski)
- Tam otonom kod yazma (KVKK riski)

**Mimar:** Claude Opus 4.7 (25 Nisan 2026 öğleden sonra oturumu)

---

## 25 Nisan 2026 — Yanıltıcı Önceki Raporlar Arşivlendi

**Karar:** 13 dosya `tedbirge-os/docs/arsiv-25-nisan-2026/` altına taşındı.

**Sebep:** 6 büyük teşhis YANLIŞ çıktı (kod taramasıyla doğrulandı). Detay önceki bölümde.

**Mimar:** Claude Opus 4.7

---

## 25 Nisan 2026 — Kod-Temelli Teşhis Modeli (Madde 4.4)

**Karar:** Mimar **kod kanıtına** dayanarak teşhis koyar. .md dosyaları **ikincil kaynaktır**.

**Sebep:** Mehmet Bey'in disiplin uyarısı: *"Sen eski yapılmış işleri de yapılmamış gibi görebilirsin."*

**Mimar:** Claude Opus 4.7

---

## 25 Nisan 2026 — Agent Loop Çalışma Modeli

**Karar:** Geliştirme **çerçeveli agent loop** ile yürütülür.

**Mehmet Bey vizyonu:** *"Sahada olmam gerekiyor, kod yazmayı bilmem, her zaman sohbet edemem. Otonom yapmam şarttır."*

**Üç katman:**
1. Refleksler (otomatik, güvenli)
2. Teşhis (otomatik, raporlayıcı)
3. Tedavi (yarı-otomatik, suggest mode)

**Mimar:** Claude Opus 4.7

---

## 25 Nisan 2026 — TUR #1 Tamamlandı (10 Commit)

**Sonuç:**
- BUG #1 (status fonksiyon adı) → fix (commit zinciri)
- BUG #2 (SUPABASE env çift standart) → fix
- PrismaClient singleton 4 dosyada refactor
- OTONOM_RAPOR.md başlatıldı
- Production health 200, deploy başarılı

**Disiplin:** Atom commit, hiç KIRMIZI çizgi ihlali yok.

**Mimar:** Claude Opus 4.7

---

## 25 Nisan 2026 — Anayasa Madde 5 Eklendi (Onay Disiplini)

**Karar:** Read-only komutlar (git diff, git status, view, Get-Content vb.) için "don't ask again" otomatik onay verilebilir. Yazma komutları için her zaman insan onayı.

**Sebep:** Mehmet Bey'in geri bildirimi: *"Hep yes no bıktım, kapsamı genişlet."* Anayasa eksikti, Claude Code'un default davranışı her komutta onay istiyordu.

**Etki:** Sahada Mehmet Bey daha az onay verir, kontrol kaybolmadan verimlilik artar.

**Mimar:** Claude Opus 4.7

**Uygulama tarihi (revize):** 25 Nisan 2026 — Anayasaya işlendi (commit 6671be1). Karar arşivi ile anayasa metni uyumlu hale geldi.

---

## 25 Nisan 2026 — TUR #2 TASARIM KARARLARI (Otonom Katman)

**Bağlam:** Sistem otonom katmanına geçiş — Auditor, Healer, Reporter modülleri.  
Mehmet Bey direktifi: **"Risk olmasın."**

### Karar 1: Auditor Tarama Kapsamı = 6/6 (Kapsamlı)

Auditor şunları tarar:
1. **Schema drift** — canlı DB ↔ schema.prisma farkı (haftalık)
2. **Env var tutarsızlığı** — eksik/bayat env'ler (saatlik)
3. **PrismaClient ihlali** — yeni `new PrismaClient()` ekleyen var mı (her commit sonrası)
4. **Performans drift** — yanıt süresi yavaşlama (haftalık)
5. **Güvenlik anomalisi** — yetkisiz erişim, normal dışı download (saatlik)
6. **Cost spike** — Anthropic API aşırı kullanım (saatlik)

**Sebep:** Mehmet Bey "kapsamlı olsun" dedi. Sahada olduğu için sistemi geniş gözle görmek istiyor.

**Alternatif (seçilmedi):**
- Minimal başlangıç (1+2+6) — yetersiz, sektörel risk büyük
- Sadece kritik (5+6) — güvenlik tek başına yetmez, drift öldürücü

**Etki:** Auditor 6 farklı tarama yapacak, bulgular SystemEvent tablosuna yazılacak.

### Karar 2: Healer Otonomluğu = B (Düşük Risk Otomatik, Kritik Onay)

**Otomatik (Healer kendi yapar — düşük risk):**
- Connection pool dolu → soft restart
- Stale cache flush
- 24+ saat eski FAILED Document temizliği
- Expired token cleanup
- Render warmup ping

**Sana onay sorar (kritik):**
- Schema migration (zaten ANAYASA Madde 3 yasaklı, Healer önerebilir, **mimar uygular**)
- Env var değişikliği
- Hesap askıya alma (yetkisiz erişim sonrası)
- API key rotation
- Bulk veri işlemi

**Mehmet Bey'in ilk seçimi C (tam otonom) idi — mimar düzeltti, B'ye döndü.**

**Sebep:** Hukuki yazılımda otomatik schema/migration/data işlemi felaket çağrısıdır. Knight Capital ($440M kayıp), AWS S3 outage gibi gerçek örnekler.

**Mehmet Bey "sen kendi en doğru kararını ver" dedi → B onaylandı.**

### Karar 3: Reporter Teknolojisi = SSE

**Karar:** Server-Sent Events (SSE). Tek yönlü canlı akış.

**Alternatif (seçilmedi):**
- Polling — şu an mevcut, akıcı değil
- WebSocket — overkill, iki yönlü gereksiz

**Sebep:** Render free tier'da düşük maliyet, mobil reconnect otomatik, mevcut Express'e kolay eklenir.

### Karar 4: AuditFinding Saklama = SystemEvent + Dosya (RİSK SIFIR)

**EN ÖNEMLİ KARAR. Detaylı yazıyorum.**

**Mehmet Bey direktifi:** *"Yasaklı olanlar nedir? Risk olmasın."*

**Önceki karar (revize edildi):** AuditFinding adında yeni tablo eklenecekti. Schema değişikliği + migration gerekecekti. ANAYASA Madde 3 #1 ve #2 ihlali olacaktı (bilinçli istisna ile).

**Yeni karar (revize sonrası, risk: 0):**

Yeni tablo **YOK**. Schema değişikliği **YOK**. Migration **YOK**.

**Yerine:**

**A) Auditor bulguları → mevcut `SystemEvent` tablosu**

Schema'da hâlihazırda var olan SystemEvent tablosu kullanılır:
- `type` → "audit:schema_drift", "audit:env_inconsistency", "audit:cost_spike", vb.
- `severity` → "INFO", "WARNING", "CRITICAL"
- `module` → "auditor"
- Detaylar JSON string olarak `type` veya başka kullanılan alanda

**B) Healer fix önerileri → dosya tabanlı**

`tedbirge-os/docs/AUDIT_FINDINGS/` klasörü:
- `OPEN/` → bekleyen öneriler (JSON dosyaları)
- `RESOLVED/` → çözülmüş öneriler
- `REJECTED/` → reddedilenler

Mehmet Bey panele girince dosyaları görür. Onaylama = `git mv OPEN/ RESOLVED/` (Healer veya mimar uygular).

**Avantajları:**
- ❌ Schema değişikliği yok → ANAYASA Madde 3 #1 korundu
- ❌ Migration yok → Madde 3 #2 korundu
- ❌ Üretim DB'sine SQL yok → Madde 3 #3 korundu
- ✅ Git tarihçesi zaten audit log → KVKK için bonus
- ✅ Geri alma kolay (`git revert`)
- ✅ Mevcut SystemEvent altyapısı kullanılıyor

**Sebep:** Mehmet Bey "risk olmasın" dedi. Önceki "bilinçli istisna" yaklaşımı anayasayı sulandırırdı. Mimar yaklaşımı baştan düşündü, sıfır risk seçeneği buldu.

**Mimar (önemli not):** Bu kararı vermek 2 turlu oldu:
- 1. tur: AuditFinding tablosu (yanlış, anayasa ihlali)
- 2. tur (Mehmet Bey'in uyarısından sonra): SystemEvent + dosya (doğru, sıfır risk)

Bu dürüst kayıt yarınki mimar için kıymetli. **Anayasa ihlali alışkanlığa dönüşmesin.**

**Mimar:** Claude Opus 4.7

---

## 25 Nisan 2026 — TUR #2 GÖREV LİSTESİ (Otonom Katman, Risk: 0)

**Bağlam:** Yukarıdaki 4 tasarım kararı uygulamaya geçer. Yeni dosyalar oluşturulur, mevcut dosyalara dokunulmaz (mount işlemleri hariç).

**Yeni dosyalar (tamamı sıfır risk):**

1. `src/os/modules/auditor.js` — yeni modül
2. `src/os/modules/healer.js` — yeni modül
3. `src/os/modules/reporter.js` — yeni modül (SSE bridge)
4. `src/routes/os.events.routes.js` — yeni route (SSE endpoint)
5. `tedbirge-panel/app/(panel)/dashboard/sistem-durumu/canli-feed/page.tsx`
6. `tedbirge-panel/app/(panel)/dashboard/tespit-edilen-sorunlar/page.tsx`
7. `tedbirge-panel/app/(panel)/dashboard/mimar-onayi/page.tsx`
8. `tedbirge-os/docs/AUDIT_FINDINGS/.gitkeep`
9. `tedbirge-os/docs/AUDIT_FINDINGS/OPEN/.gitkeep`
10. `tedbirge-os/docs/AUDIT_FINDINGS/RESOLVED/.gitkeep`
11. `tedbirge-os/docs/AUDIT_FINDINGS/REJECTED/.gitkeep`

**Minimal değişiklik (mevcut dosyalara):**

- `src/os/index.js` — sadece 3 yeni `safeRequire` satırı + `modules` objesinde 3 yeni anahtar
- `src/routes/index.js` — 1 yeni route mount

**Yapılmayacaklar:**

- ❌ `prisma/schema.prisma` değiştirilmiyor
- ❌ Migration oluşturulmuyor
- ❌ Mevcut OS modüllerine dokunulmuyor
- ❌ Mevcut servisler refactor edilmiyor
- ❌ npm install yok
- ❌ Yeni kütüphane yok (mevcut Express SSE ile yapılır)
- ❌ Env var değişikliği yok

**Tahmini commit sayısı:** 10-12 (her dosya atom commit + index.js mount + route mount + son rapor)

**Tahmini süre:** 4-6 saat agent loop

**Mimar:** Claude Opus 4.7

---

## 26 Nisan 2026 — TUR #5 TASARIM KARARLARI (SUPABASE Kanonik + Web Push)

### Karar 1: SUPABASE kanonik key

**Karar:** `SUPABASE_SERVICE_ROLE_KEY` master (kanonik). `SUPABASE_SERVICE_KEY` fallback olarak birakildi.

**Sebep:** Supabase'in standart env adi `SUPABASE_SERVICE_ROLE_KEY`. Eski ad (`SUPABASE_SERVICE_KEY`) ilk commit'ten kalmis. OS adapter ve boot.js zaten yeni adi kullaniyor; storage.service.js ve uploadMiddleware.js sadece eski adi biliyordu.

**Uygulama:** `storage.service.js:12` ve `uploadMiddleware.js:16` fallback pattern'e cevrildi: `SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_KEY`. (commit 688d779)

**Sonraki adim:** Mehmet Bey Render'dan `SUPABASE_SERVICE_KEY` silebilir. Fallback hala koruyucu.

### Karar 2: Web Push stratejisi — DB-backed, sendToRole

**Karar:** Push bildirimleri `pushNotification.service.js` + `PushSubscription` DB modeli uzerinden. In-memory map kullanilmadi.

**Sebep:** `pushNotification.service.js`, `PushSubscription` schema modeli, `push.routes.js` + `push.controller.js` initial commit'ten (39492ab) mevcut, tamamen DB-backed. Mektup'un in-memory tasarimi (global.pushSubscribers) gercek altyapiyi bilmeden yazilmisti. Anayasa Madde 4.4 (kod kaynaktir) uygulanarak DB-backed servis kullanildi.

**Healer entegrasyonu:** `maybeSendPush(finding)` — `sendToRole("ADMIN", payload)` cagiriyor. (commit b0766c8)

### Karar 3: Web Push Strateji — endpoint adi

**Karar:** `/api/push/vapid-key` korundu (mevcut kod, Madde 4.4).

**Risk:** Dusuk. VAPID keys mevcut, sw.js push handler mevcut. Sadece baglama eklendi.

**Endpoint adi duzeltmesi (TUR #5 sirasinda tespit):** Mektupta `/api/push/vapid-public-key` yazilmis, ama mevcut kod (push.routes.js + PwaProvider.tsx) `/api/push/vapid-key` kullaniyor. Anayasa Madde 4.4 (kod kaynaktir) geregi mevcut endpoint korundi, mektup hatali kabul edildi. Dogru endpoint: `/api/push/vapid-key`.

**Mimar:** Claude Code (TUR #5)

---

## Format ve Disiplin Notu

Yeni karar bu dosyaya **yukarıdaki formatla** eklenir.

**Kural:** Yeni karar eski kararı ezmez, üstüne yazar. Eski karar değişiyorsa, **revize maddesi** yeni karar yazılır, eskisi referans olarak kalır.

---

**Son güncelleme:** 25 Nisan 2026 (TUR #2 tasarım sonu)  
**Mimar:** Claude Opus 4.7  
**Bağlayıcı:** Tüm gelecek oturumlar

---

## 28 Nisan 2026 (sabah) — ANAYASA v1.7.0 + 7 YENİ MADDE

**Karar:** Anayasaya 7 yeni madde eklendi (Madde 26-32). Eski Madde 26 (Kapanış) → Madde 33.

**Yeni maddeler:**
- 26 — Otonom Devir + Sağlık Taraması Başlatma
- 27 — Sağlık Taraması Periyodikliği
- 28 — Onay Disiplini Genişletmesi (T tipi otomatik onay)
- 29 — Migration Uygulandi Kanıtı (ALTER TABLE çıktısı şart)
- 30 — Frontend Standart Disiplini (apiFetch zorunlu)
- 31 — Ortam İzolasyonu (lokal dev ≠ production)
- 32 — Anayasa Boyut Disiplini (40k+ özet versiyon)

**Sebep:** 28 Nisan 2026 sabah 3 sızıntı (migration drift, CORS, 401) ve sağlık taraması TUR #27 (21 bulgu) kanıtladı: bu 7 disiplin anayasada yoktu.

**Sürüm:** v1.6.0 → v1.7.0 (Madde 22 — MINOR — yeni madde eklendi)

**Mimar:** Claude Opus 4.7 (28 Nisan sabah devir oturumu, Mehmet Bey direktifi)

**Risk:** SIFIR (sadece dokümantasyon, Madde 18.4 yeşil nokta)

---

## 26 Nisan 2026 (öğle) — TUR #5 KAPANIŞ + ALTYAPI KEŞİF NOTU

**TUR #5 onaylandı:** SUPABASE kanonik + Web Push entegrasyonu, 5 commit, sıfır anayasa ihlali, public URL kanıtı toplandı.

### Önemli mimari keşif (TUR #5 sırasında)

Tedbirge.ai'nın initial commit'inde (39492ab) şu altyapı **zaten kuruluymuş** ama **hiç bağlanmamış**:

- `model PushSubscription` (prisma/schema.prisma satır 308-316)
- `src/services/pushNotification.service.js` (DB-backed, sendToRole, sendToUser)
- `src/routes/push.routes.js` (3 endpoint: vapid-key, subscribe, unsubscribe)
- `tedbirge-panel/PwaProvider.tsx` (SW kayıt altyapısı)
- `tedbirge-panel/public/sw.js` (push event handler)

TUR #4'te PwaProvider keşfedildi, TUR #5'te kalan 4 parça keşfedildi.

**Çıkarım:** Tedbirge'nin **gizli altyapısı zengin**. Yeni bir tur açmadan önce mutlaka:
1. `git log --oneline -- <ilgili dizin>` ile tarihçe
2. `Get-ChildItem -Recurse -Filter *.<uzantı>` ile mevcut dosya tespiti
3. `Select-String` ile ilgili pattern araması

Bu disiplin TUR #5'te 30+ dakika tasarruf sağladı (yeni dosya yazmak yerine bağlantı kurma).

### Anayasa Madde 4.5 yorumu güncellemesi

> "Önce oku sonra yaz" maddesinin canlı uygulaması: yeni bir özellik eklemeden önce **mevcut servis/route/model yapısı taranır**. Bulunduysa **bağlantı kurulur**, bulunmadıysa yazılır.

### Bekleyen: Mehmet Bey'in manuel adımları

1. Render → SUPABASE_SERVICE_KEY (eski) sil → /health 200 doğrula
2. Panel /dashboard/bildirimler → "Bildirimleri Aç" → tarayıcı izni → abonelik test

**Mimar:** Claude Opus 4.7 (TUR #5 kapanış)

---

## 26 Nisan 2026 — Anayasa Madde 17 + 18 Eklendi

**Karar:** İki yeni anayasa maddesi yürürlüğe girdi.

**Madde 17 (Stratejik Kesit Disiplini):** Sistemi yatay kesitlere böl, her kesiti uçtan uca tasarla. "Tüm sistem tek seferde" yasaklı.

**Madde 18 (Otonom Tur Zinciri):** Mimar bir kesit için tüm tur mektuplarını tek oturumda yazar. KIRMIZI nokta turları onay şartlı, YEŞİL nokta turları otomatik akar.

**Sebep:** Mehmet Bey saha programı + bilgi-fizik sınırı. Tek seferde tüm sistemi tasarlamak imkansız, ama bir kesit için tüm zinciri yazmak verimli.

**Etki:** Mimar oturumu açma sıklığı azalır, sahada kalma süresi artar, disiplin korunur.

**Mimar:** Claude Opus 4.7

---

## 26 Nisan 2026 (gece) — ANAYASA v1.3.0 + Madde 20+21+22 EKLENDİ

**Karar:** Anayasaya 3 yeni madde eklendi:
- **Madde 20:** Anayasa Evrim Disiplini (anayasa nasıl değişir)
- **Madde 21:** Sağlık Taraması Disiplini (uçtan uca risk denetimi)
- **Madde 22:** Versiyon Disiplini (4 katmanlı SemVer 2.0)

Eski Madde 19 (Kapanış) → Madde 23 olarak kaydı.

**Sebep:** Üç eksiklik kanıtlandı:
1. Anayasanın evrim süreci tanımsız (Madde 5, Madde 17+18 doğaçlama eklendi)
2. Uçtan uca sağlık taraması ihtiyacı vs Madde 17 (kesit disiplini) çelişkisi
3. 4 katman (anayasa, backend, panel, schema) için versiyon standardı yok

**Alternatif (seçilmedi):**
- CalVer (Calendar Versioning) — Tedbirge için zaman bilgisi yetersiz, breaking change göstermiyor
- Hybrid (CalVer + SemVer) — mental yük yüksek, araç desteği zayıf
- Madde 22'yi ayrı turla yazmak — atom mantıksal iş bölünmüş olur

**Etki:**
- Anayasa v1.0.0 → v1.3.0 (resmi versiyon güncellemesi)
- 21 madde + 1 kapanış = 22 numaralı madde + 1 kapanış (Madde 23)
- Bundan sonra her anayasa değişikliği Madde 20.4 sürecinden geçer
- Sağlık taraması Madde 21'e göre yapılır
- 4 katman versiyonu Madde 22'ye göre yönetilir

**Mimar:** Claude Opus 4.7  
**Onay:** Mehmet Bey (yazılı, sohbet kaydı)

---

## ANAYASA VERSİYON TARİHÇESİ (geriye dönük kanıt — Madde 22.7)

Anayasa şu ana kadar **3 büyük değişiklik** geçirdi ama versiyon güncellenmemişti. Madde 22 eklenirken bu **gizli ihlal** düzeltildi:

| Versiyon | Tarih | Değişiklik | Madde Sayısı | Commit |
|---|---|---|---|---|
| v1.0.0 | 25 Nisan 2026 | Başlangıç (16 madde) | 16 | (initial CLAUDE.md commit) |
| v1.1.0 | 25 Nisan 2026 | Madde 5 (Onay Disiplini) eklendi → Madde 5-15 kaydırıldı | 17 | (TUR #2 öncesi commit) |
| v1.2.0 | 26 Nisan 2026 | Madde 17 (Kesit Disiplini) + Madde 18 (Otonom Tur Zinciri) eklendi → Madde 19 (Kapanış) | 19 | (anayasa genişletme v2 commit) |
| **v1.3.0** | **26 Nisan 2026 (gece)** | **Madde 20 (Anayasa Evrim) + Madde 21 (Sağlık Taraması) + Madde 22 (Versiyon Disiplini) eklendi → Madde 23 (Kapanış)** | **22 + Kapanış** | **a4ec692** |

| **v1.4.0** | **27 Nisan 2026 (sabah)** | **Madde 24 (İş Planı Disiplini) eklendi → Madde 26 (Kapanış)** | **23 + Kapanış** | **(bu commit)** |

**KVKK kanıt notu:** Bundan sonra anayasa değişikliklerinde tarih + commit hash + açıklama bu tablo formatına yazılacak (Madde 22.7).

**Mimar:** Claude Opus 4.7  
**Tarih:** 26 Nisan 2026 (gece)

---

## 27 Nisan 2026 (sabah) — ANAYASA v1.4.0 + Madde 24 (İş Planı Disiplini)

**Karar:** Anayasaya Madde 24 (İş Planı Disiplini) eklendi. Eski Madde 23 (Kapanış) → Madde 26 olarak kaydı.

**Madde 24 İçeriği (13 alt madde):**
- 24.1 İlke (Tedbirge'nin konumu — B2B SaaS LegalTech)
- 24.2 Paydaş yapısı (4 iç + 7 dış kategori)
- 24.3 Gelir modeli (Tedbirge %20 / Temsilci %10-%10)
- 24.4 Yasal sorumluluk dağılımı (Avukatlık K. + KVKK)
- 24.5 Yol haritası dokümanı (IS_PLANI.md)
- 24.6 Önceliklendirme kuralı (sıralı)
- 24.7 Kesit tipi (A: Bulgu Kapatma, B: Stratejik)
- 24.8 İş bitirme kriterleri
- 24.9 Karar mekanizması
- 24.10 KVKK yurt dışı aktarım disiplini
- 24.11 Hukuki muhatap şablon disiplini
- 24.12 Yol haritası güncelleme
- 24.13 Yasaklı davranış

**Sebep — 4 fizibilite raporu birleştirildi:**
1. İş Planı Fizibilite Raporu (576 satır) — MoSCoW + Now-Next-Later
2. Resmi Muhatap KEŞİF Raporu (376 satır) — 7 kategori atlas
3. Birleşik Analiz Raporu (430 satır) — sentez
4. Mali Akış Mini KEŞİF (421 satır) — gelir modeli kanıtı

**Mehmet Bey direktifleri (anayasaya gömüldü):**
- Tedbirge B2B SaaS, hukuk hizmeti vermez (Madde 24.1)
- Mehmet Dinç girişimci, marka sahibi (Madde 24.1)
- Tedbirge %20 / Temsilci %10-%10 (Madde 24.3)
- IBAN havale, PayTR gerekli değil (Madde 24.3)
- KDV/stopaj/sorumluluk Avukatlık + Vekalet — Avukat (Madde 24.4)

**Etki:**
- Anayasa v1.3.0 → v1.4.0 (MINOR — yeni madde, Madde 22.2)
- 22 madde + 1 kapanış → 23 madde + 1 kapanış
- IS_PLANI.md v1.0 oluşturuldu
- Bundan sonra her kesit Madde 24 disiplini ile başlar

**Mimar:** Claude Opus 4.7  
**Onay:** Mehmet Dinç (yazılı, sohbet kaydı)

---

## 27 Nisan 2026 (akşam) — Anayasa v1.5.0: Madde 25 (Pazarlama + Web + Marka Kapsamlı)

**Karar:** Pazarlama + Web Yüzü + Marka Disiplini Madde 25 olarak anayasaya eklendi (kapsamlı).

**Kapsam:** 14 alt madde:
- 25.1 Tedbirge'in pazarlamadaki sıfatı
- 25.2 Marka mesajı
- 25.3 KIRMIZI çizgi yasaklı vaatler
- 25.4 İzinli mesaj çerçevesi
- 25.5 Web arayüzü (marka kimliği + yasal bileşenler + dönüşüm yüzeyi + görsel/etkileşim + mobil + a11y)
- 25.6 Sosyal medya disiplini
- 25.7 KVKK + İYS + pazarlama veri
- 25.8 Yanıltıcı bilgi denetimi
- 25.9 İzinli kanallar + araçlar
- 25.10 Pazarlama verisi audit
- 25.11 Kod altyapı zorunlulukları (15 satır kontrol listesi)
- 25.12 Üç faz disiplini (FAZ 1 → 2 → 3)
- 25.13 7 sorulu pazarlama kararı filtresi
- 25.14 Yabancı pazar ayrımı (Madde 26'ya bırakıldı)

**Kanıt zemini:** PAZARLAMA_FIZIBILITE.md (27 Nisan 2026) — 5 KRİTİK eksik tespit edildi (cookie banner, GA4/Pixel, İYS opt-out, UTM frontend, qualificationScore).

**Sıradaki adım:** TUR #25 FAZ 1 mektubu (Yasal + Ölçüm Temeli — Cookie banner, aydınlatma, GA4, Pixel, UTM fix, İYS, robots/sitemap). Otonom inşa Madde 18.2 disiplini ile.

**Sınır:** Sadece Türkiye geneli. Yabancı plaka + çoklu dil pazarlama Madde 26'da.

**Etki:**
- Anayasa v1.4.0 → v1.5.0 (MINOR — yeni madde, Madde 22.2)
- 23 madde + 1 kapanış → 24 madde + 1 kapanış (Madde 25 eklendi)

**Mimar:** Claude Sonnet 4.6  
**Onay:** Mehmet Dinç (yazılı, sohbet kaydı — "Tek seferde kapsamlı kanun maddesi, sonra otonom inşa")

---

## 27 Nisan 2026 (gece sonu) — ANAYASA v1.6.0 + Madde 25.12 FAZ 4 + Madde 25.11 Genişletme

**Karar:** Madde 25.12'ye FAZ 4 (Operasyonel Ölçek + Optimizasyon) tanımı eklendi. Madde 25.11 kontrol listesi 5 yeni satır ile genişletildi (16-20).

**FAZ 4 Alt Başlıkları (4 atom kesite bölünür):**
- A. Reklam Altyapısı (TUR #26)
- B. İçerik Üretimi (TUR #27)
- C. Operasyonel Pazarlama (TUR #28)
- D. Otomasyon + Sürekli Optimizasyon (TUR #29+, sürekli)

**Sebep — Mehmet Bey direktifi (27 Nisan 2026, gece sonu):**
> "ANAYASAYA YA GÖRE FAZ 4 TAM PAKET ORTAK"
> "ANAYASADA PAZARLAMA VAR CLAUDE CODE YE SOR"
> "ortağım bizim bir anayasamız var uçtan uca kod tabanlı ilerliyoruz"

Mehmet Bey FAZ 4 başlatmak istedi. Mevcut anayasa Madde 25.12'de FAZ 4 tanımlı değildi. Madde 25.13.6 (Hangi FAZ kapsamında?) sorusuna cevap verilemiyordu. Madde 4.1 (yamalı bohça yasak) + Madde 17 (kesit disiplini) gereği önce anayasa genişletildi, sonra atom kesit mektupları yazılacak.

**Kanıt zinciri:**
- Madde 25 tam metni `tedbirge-os/docs/MADDE_25_TAM_METIN.md` dosyasında (27 Nisan 2026, Claude Code keşfi)
- Mevcut Madde 25.12: yalnızca FAZ 1+2+3 tanımlıydı
- Mevcut Madde 25.11: 15 satırlık kontrol tablosu

**Etki:**
- Anayasa v1.5.0 → v1.6.0 (MINOR — yeni alt başlık, Madde 22.2)
- Madde 25.12: 3 FAZ → 4 FAZ
- Madde 25.11: 15 satır → 20 satır
- Yeni kontrol noktaları: Google Ads conversion API, UTM şablon, A/B test, lead SLA, haftalık KPI mail
- Bundan sonra FAZ 4 atom kesit mektupları (TUR #26, #27, #28, #29+) yazılabilir

**Mimar:** Claude Opus 4.7 (yeni oturum, FAZ 4 başlangıcı)
**Onay:** Mehmet Dinç (yazılı, sohbet kaydı 27 Nisan 2026 gece)
**Disiplin:** Madde 4.1, 4.4, 4.5, 17, 20.1, 22.2, 22.7, 25.12

