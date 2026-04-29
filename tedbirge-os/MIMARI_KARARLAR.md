# TEDBIRGE.AI — MİMARİ KARARLAR LOG

> Bu dosya **karar arşividir**. Mimar oturumlarında verilen tasarım kararları, paradigma değişiklikleri, yapı tercihleri buraya yazılır.  
> Yeni mimar (her Claude Opus oturumu) bu dosyayı okur ve **aynı kararları tekrar tartışmaz**.  
> Format: tarih + karar + sebep + alternatif + etki + mimar.

---

## 28 Nisan 2026 — v1.10.0 Anayasa Sadeleştirme + Modülasyon (TUR #39)

**Karar:** CLAUDE.md 74K → 50K karaktere indirildi. Madde 25 ayrı dosyaya modüle edildi. Dört madde mevcut maddeler içine gömüldü. İki madde birleştirildi.

**Sebep:** CLAUDE.md Madde 27 eşiğini (>60K karakter = modül ayrımı) aşmıştı. LLM context verimliliği düşüyor, her oturumda sıkıştırma oluyor, karar kalitesi bozulabiliyordu. TUR #39 Ön Keşif (KU1-KU8) bunu kanıtladı.

**Yapılan değişiklikler:**
- Madde 25 tam metin (~17K karakter) → `CLAUDE_MADDE_25_DETAY.md` + `MADDE_25_KONTROL.md`
- Madde 28 (T tipi onay) → §18.7 olarak Madde 18'e gömüldü
- Madde 29 (migration kanıtı) → §4.8 olarak Madde 4'e gömüldü
- Madde 30 (apiFetch) → §13.2 olarak Madde 13'e gömüldü
- Madde 31 (ortam izolasyonu) → §13.3 olarak Madde 13'e gömüldü
- Madde 26+27 birleştirildi: Madde 27 içeriği §26.8+§26.9 olarak Madde 26'ya eklendi
- Eski Madde 32 → Madde 27, 33 → Madde 28, 34 → Madde 29
- SALES rolü Madde 11'e eklendi (schema enum'da vardı, anayasada eksikti)

**Alternatif:** Strateji W (tam modül ayrımı, anayasa/disiplin/ + anayasa/teknik/ gibi klasörler). Reddedildi — 6 dosyaya bölünme daha fazla "nereye bakacağım" sorunu yaratır.

**Etki:** CLAUDE.md, `tedbirge-os/CLAUDE_MADDE_25_DETAY.md`, `tedbirge-os/MADDE_25_KONTROL.md`

**Mimar:** Claude Sonnet 4.6 (TUR #39 — 28 Nisan 2026 gece)  
**Mehmet Bey onayı:** 28 Nisan 2026 yazılı — "Strateji Z: Sadeleştirme + Madde 25 modülasyonu"

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

---

## 28 Nisan 2026 (öğleden sonra) — ANAYASA v1.8.0 + Madde 33 EKLENDİ

**Karar:** Anayasaya 1 yeni madde eklendi:
- **Madde 33:** Beklemede Özellik Disiplini (yarım kurulu özellik yönetimi)
- Eski Madde 33 (Kapanış) → **Madde 34** olarak yeniden numaralandı

**Sebep — Kanıta Dayalı (Madde 20.1):**
TUR #29 AccidentCase kanıt taraması şunu kanıtladı:
- Frontend'de aktif "Yeni Vaka Aç" butonu vardı
- Backend'de 0 referans, endpoint yoktu
- Her tıklamada kullanıcı 404 görüyordu
Bu "Senaryo B — Yarı kurulu" durumu için anayasada hiçbir kural yoktu.

**Madde 33 — 3 Koşul (hepsi zorunlu):**
1. Panel'de belirgin YAKINDA badge (amber gradient, aktif buton yok)
2. Schema'da `// @deferred` yorumu
3. IS_PLANI.md kaydı (hangi kesitte aktif edilecek)

Üç koşuldan biri eksikse → sağlık taramasında 🔴 KRİTİK sayılır.

**Uygulanan Tedavi (TUR #29-B):**
- `tedbirge-panel/app/(panel)/leads/[id]/page.tsx` — Kaza Rekonstrüksiyon bloğu amber YAKINDA kart olarak değiştirildi (commit 5517dbe)
- `prisma/schema.prisma` — AccidentCase + Evidence modelleri `// @deferred` yorumu ile işaretlendi
- `tedbirge-os/IS_PLANI.md` — AI Analiz Doğruluk Kesiti kapsamına AccidentCase eklendi

**Sürüm:** v1.7.0 → v1.8.0 (Madde 22 — MINOR — yeni madde eklendi)

**Alternatif (seçilmedi):**
- Senaryo A: CREATE TABLE + tam backend — pahalı, Q3 2026 öncesi gereksiz (KIRMIZI nokta olurdu)
- Senaryo C: Frontend + schema tamamen sil — geleceği kapatır, tasarım emekten kaçar

**Mimar:** Claude Sonnet 4.6 (TUR #29-B, 28 Nisan 2026 öğleden sonra)
**Onay:** Mehmet Dinç (TUR #29-B mektubu — yazılı talimat)
**Disiplin:** Madde 4.1, 4.4, 17.4, 20.1, 20.4, 22.2, 22.6


---

## 28 Nisan 2026 (akşam) — ANAYASA v1.9.0 + Otonom Devir Sistemi

**Karar:** Anayasa Madde 26 (Otonom Devir) sertleştirildi. Yeni alt maddeler eklendi:
- 26.4 — Açılış Protokolü (zorunlu 6 komut zinciri, atlatılamaz)
- 26.5 — Açılış Mesajı Formatı (sabit şablon)
- 26.6 — DEVIR_RAPORU_AKTIF.md (canlı tek dosya)
- 26.7 — Yasaklı davranış (26.4-26.6 kapsamı)

Madde 27'ye eklendi:
- 27.4 — Kapanış Uyarısı (sohbet süresi eşiği + uyarı formatı + Mehmet Bey kararı)

**Sebep:** 28 Nisan 2026 boyunca defalarca yaşanan iki sürtünme:
- Yeni sohbet açıldığında mimar "ne yapayım?" diye sordu
- Bağlam dolduğunda kullanıcı yapısal güvence kaybı yaşadı (compact uyarısı)

Mehmet Bey direktifi (sohbet kaydı, akşam):
- "Hiç kapanışta beni uyarsın, sohbet süresi doluyor yeni sohbet aç desin"
- "Açılışta bana hiçbir şey söylemeden kaldığı yerden devam edecek"
- "Tam otonom sistemi kur"

**Sürüm artışı:** MINOR (v1.8.0 → v1.9.0 — yeni alt maddeler, Madde 22 disiplini)

**Mimar:** Claude Sonnet 4.6 (TUR #36, 28 Nisan akşam)

**Risk:** SIFIR (sadece dokümantasyon — Madde 18.4 yeşil nokta)

**Etki:** Bağlam kayıpsız oturum geçişi. Mehmet Bey sahaya çıkarken yapısal güvence: yeni sohbet otonom devralır, bağlam köprüsü insan eliyle taşınmaz.

---

## 29-30 Nisan 2026 — TUR #42 Kurumsal Kimlik Birleştirme

### Karar 1: Paylaşımlı PublicNav Component Kararı

**Bağlam:** TUR #42 K5 araştırması gösterdi: 27 public sayfanın hiçbiri paylaşımlı nav component kullanmıyor. Anasayfa kendi inline `function PublicNav()` (159 satır), /basvuru kendi inline `<header>` (358-385. satırlar arası), niş landing'lerde nav yok. Bu dağınık nav yapısı:
- Görsel tutarsızlığa sebep oluyor
- Bakım maliyeti yüksek
- TUR #44 Animasyon turunda sayfa geçişleri için paylaşımlı nav şart

**Karar:** Anasayfanın inline PublicNav fonksiyonu `components/PublicNav.tsx` dosyasına çıkarıldı. Tüm pazarlama sayfaları (~14 sayfa) bu paylaşımlı component'i kullanır. Auth sayfaları (login, register, forgot-password, reset-password, sifre-belirle) kendi minimal layout'larını korur (farklı UX akışı).

**Uygulanan:**
- `components/PublicNav.tsx` — yeni dosya, 165 satır (sticky + glassmorphism + framer-motion)
- 13 sayfa entegre edildi: /, /basvuru, /blog, /blog/[slug], 3 niş landing, /hakkimizda, /iletisim, /haberler, /tazminat-hesapla, /lexscan, /referanslar, /basvuru-sorgula

**Alternatif (seçilmedi):** Sayfa-bazlı nav korunsun, sadece /basvuru düzeltilsin (dar K5). Geleceğin animasyon ve SEO turları için dezavantajlı, kapsamı genişlettik.

**Mimar:** Claude Opus 4.7 (TUR #42 K5, 29 Nisan 2026 gece)
**Onay:** Mehmet Dinç ("ortak web arayüzü bir bütündür" — yazılı talimat)
**Disiplin:** Madde 4 (kanıt), Madde 17.3, Madde 17.5

---

### Karar 2: M3 Yan Bulgusu Küçük Parçasını Kapsama Dahil Etme

**Bağlam:** TUR #40'tan beri açık M3 yan bulgusu: "iki Footer pattern'i (anasayfa inline lacivert + global beyaz)". TUR #42 K5 Tur B mektubunda "Footer dokunulmaz" sözü verilmişti. Ancak Mehmet Bey production kontrolünde fark etti: /basvuru'da hâlâ mor renkler görünüyor. Kanıt zinciri (Claude Code raporu): /basvuru kaynak kod %100 lacivert, mor renkler Footer.tsx hover renklerinden geliyor (10 × #534AB7).

**Karar:** M3'ün küçük parçası (Footer hover renk #534AB7 → #1E1E8E, 5 satır) bu turda kapatıldı. M3'ün asıl parçası (iki Footer pattern'i birleştirme — mimari karar gerek) LATER kalıyor.

**Uygulanan:** `components/layout/Footer.tsx` 5 satır `hover:text-[#534AB7]` → `hover:text-[#1E1E8E]`. Commit `1da080c`.

**Niye söz değiştirildi:** Madde 17.4'e göre mimar sözünü tutmalı. Ancak Madde 17.5 son söz Mehmet Bey'de — gözlem kanıt olarak kapsamı meşrulaştırdı. Risk minimal (sadece hover, layout etkilenmez), 5 satır CSS değişikliği.

**Alternatif (seçilmedi):** M3'ü tamamen LATER bırakıp TUR #42 kapansın. Ancak production'da görünür mor problem devam ederdi.

**Mimar:** Claude Opus 4.7 (TUR #42 K7, 29 Nisan 2026 gece geç)
**Onay:** Mehmet Dinç (production gözlemi + Madde 17.5 son söz)
**Disiplin:** Madde 4, Madde 17.4, Madde 17.5

---

### Karar 3: /login Gradient — Kurumsal Lacivert Ailesi Tasarım Sistemi

**Bağlam:** /login sayfası sol dekoratif paneli (hidden lg:flex masaüstü görünümü) gradient `#1E1E8E → #3b239f → #22145f` kullanıyordu. `#3b239f` (koyu violet/mor) ve `#22145f` (çok koyu navy-purple) kurumsal palette dışı renkler. Mehmet Bey'in vurgusu: "ortak web arayüzü bir bütündür".

**Karar:** Gradient kurumsal lacivert ailesi içinde kalır:
- `#1E1E8E` = `var(--brand-primary)` (kurumsal lacivert) — başlangıç
- `#18187a` = `--brand-primary-hover` (lacivert ailesi koyu varyant) — orta
- `#0f0f4d` = lacivert ailesi en koyu (siyah değil, lacivert kuzeni) — bitiş

Bu yeni gradient lacivertten kendi koyu kuzenine geçer — mor yok, kurumsal kimlikte.

**Uygulanan:** `app/(public)/login/page.tsx` line 88 gradient değişimi. Commit `d0c3cc3`.

**Tasarım sistemi sonucu:**
- Ana renk: #1E1E8E (kurumsal lacivert) — birincil
- Koyu varyant: #18187a — hover, vurgu
- En koyu: #0f0f4d — gradient ucu (yeni eklenen, palette'te değişken yok)
- Yeşil aksent: #5CB85C — CTA, aksiyon
- M7 yan bulgusu: /lexscan blue gradient hâlâ Tailwind native (kurumsal palete identical değil) — LATER

**Alternatif (seçilmedi):** Düz #1E1E8E kullanmak (gradient olmadan). Ancak gradient sayfada görsel zenginlik sağlıyor, kurumsal aile içinde kaldıkça uygundur.

**Mimar:** Claude Opus 4.7 (TUR #42 K8, 30 Nisan 2026 gece yarısı)
**Onay:** Mehmet Dinç (görsel kontrol — 3 rol Yönetici/Temsilci/Hukukçu kanıtlı)
**Disiplin:** Madde 4, Madde 17.5

---

## 1 Mayıs 2026 — TUR #43 Tur B-1 SEO Altyapı

### Karar 1: SEO Meta Altyapısı 8 Atom 2 Alt-Tura Bölündü

**Bağlam:** Tur A keşfi (12 KN) 4 kritik SEO eksikliği tespit etti — JSON-LD sıfır, OG image yok, anasayfa kendi metasından yoksun (`"use client"` engeli), `metadataBase` eksik. Toplam 8 atom önerildi. Mimar tek seferde uygulamayı reddetti — anasayfa server/client refactor B-1'in düşük-risk altyapı çalışmasıyla aynı kapsama sığmadı.

**Karar:** 8 atom **2 alt-tura** bölündü:
- **Tur B-1 (bu tur):** Düşük risk, additive — root metadata + dinamik OG image + sitemap satırı + robots satırı (4 atom). Sonradan B5 (middleware fix) eklendi.
- **Tur B-2 (sonraki):** JSON-LD enjeksiyonu (Organization + WebSite + LegalService + Article + BreadcrumbList) + anasayfa server/client bölmesi. Mimar mektubu B-1 production doğrulamasından sonra yazılır.

**Alternatif (seçilmedi):** Tek seferde 8 atom uygulamak. Anayasa Madde 4.2 (atom seviyesi) ihlali, kapsam belirsizliği, refactor riski daha yüksek olurdu.

**Mimar:** Claude Opus 4.7 (TUR #43, 30 Nisan 2026 gece yarısı sonrası)
**Onay:** Mehmet Dinç ("YAZ ORTAK" — Tur A raporu sonrası)
**Disiplin:** Madde 4.2, Madde 17.3

---

### Karar 2: OG Image Dinamik Üretim (Next.js Convention)

**Bağlam:** Tur A'da `og-image.png` 1200×630 statik dosyasının olmadığı tespit edildi. `logo.png` (640×640 JPEG) OG için yetersiz. İki seçenek vardı: (a) Mehmet Bey'den tasarımcı OG image isteyip statik dosya olarak yerleştirmek, (b) Next.js App Router `app/opengraph-image.tsx` convention'u ile dinamik üretmek.

**Karar:** Dinamik üretim seçildi (`app/opengraph-image.tsx`, Edge runtime, `ImageResponse` API). Kurumsal lacivert gradient (#1E1E8E → #0F0F4A), Türkçe başlık, "Trafik ve İş Kazası Tazminat Yönetimi" altyazı + tedbirge.ai. Logo PNG embed BU SÜRÜMDE değil (Edge runtime + uzak dosya çekme + font sorunları riski). Mehmet Bey ileride "logo da olsun" derse v2 atomu olarak eklenir.

**Sonuç:** Next.js convention sayesinde `metadata.openGraph.images` ve `metadata.twitter.images` MANUEL eklenmedi — Next.js otomatik bağladı. Production HTML'de tüm sayfalarda `og:image=https://www.tedbirge.ai/opengraph-image?...` ve eşdeğer `twitter:image` çıktı.

**Alternatif (seçilmedi):** Statik PNG dosyası — Mehmet Bey bağımlılığı + tasarım turu gerektirirdi, B-1 momentumunu kırardı.

**Mimar:** Claude Opus 4.7 (TUR #43 B2, 30 Nisan 2026 gece yarısı sonrası)
**Onay:** Mehmet Dinç ("YAZ ORTAK")
**Disiplin:** Madde 4.5

---

### Karar 3: Robots Disallow Sadece /musteri/ Eklendi (Auth Sayfaları Bilerek Açık)

**Bağlam:** Tur A keşfinde Claude Code 6 path için disallow önerdi (login, register, forgot-password, reset-password, sifre-belirle, musteri). Mimar bu öneriyi daralttı.

**Karar:** Sadece `/musteri/` disallow eklendi. Mevcut disallow'lar (`/api/`, `/dashboard/`, `/admin/`) korundu. Auth sayfaları (`/login`, `/register`, `/sifre-belirle` vb.) bilerek **açık** bırakıldı:
- Marka aramasında ("tedbirge giriş") kullanıcılar arama motorundan login sayfasına ulaşabilir — UX için yararlı
- KVKK riski yok (auth sayfaları içerik göstermiyor, public statik UI)
- `/musteri/` müvekkil portalı — KVKK kritiği, içerik halka açık değil → mutlaka disallow

**Alternatif (seçilmedi):** 6 path'i de disallow etmek. Marka SEO açısından dezavantajlı, hiçbir koruma faydası yok.

**Mimar:** Claude Opus 4.7 (TUR #43 B4, 30 Nisan 2026 gece yarısı sonrası)
**Onay:** Mehmet Dinç ("YAZ ORTAK")
**Disiplin:** Madde 4, Madde 24.10 (KVKK)

---

### Karar 4: Middleware /opengraph-image Public Path (Ek Atom B5)

**Bağlam:** B2 atomu (opengraph-image.tsx) tamamlandıktan sonra lokal smoke test'te endpoint **HTTP 307 → /login** redirect döndürdü. Kök sebep: `middleware.ts` public path listesinde `/opengraph-image` yoktu, `pathname.includes(".")` koşulu nokta içermeyen URL'i kurtaramadı. Production'da da aynı davranış olur, sosyal medya crawler'lar OG image alamazdı.

**Karar:** Middleware public path listesine `pathname.startsWith("/opengraph-image") ||` eklendi (1 satır). Ek atom B5 olarak kapsama dahil edildi.

**Niye söz değiştirildi:** Tur B-1 mektubu 4 atomdu, mimar middleware'i Tur A'da kontrol etmemişti. Ancak mektup açıkça "OG image PNG değil → DUR + raporla" dedi — Claude Code disipline uydu, mimara döndü, Mehmet Bey yazılı onayı ile B5 atomu eklendi (Madde 17.5 son söz).

**Alternatif (seçilmedi):** B1+B3+B4 commit, B2'yi ayrı turda kapatma — tur disiplini açısından doğru ama momentum kaybı + B2 dosyası ortada kalırdı.

**Mimar:** Claude Opus 4.7 (TUR #43 B5, 30 Nisan 2026 gece yarısı sonrası)
**Onay:** Mehmet Dinç (yazılı — "Mimar onayı: Seçenek A. B5 atomu uygula, 5 atom toplu commit/push, production doğrula.")
**Disiplin:** Madde 4, Madde 6 (DUR şartı), Madde 17.5

---

## 1 Mayıs 2026 — TUR #43 Tur B-2 SEO Anlam Katmanı (5 atom)

### Karar 5: JSON-LD Ortak Component (DRY + 4 Schema Factory)

**Bağlam:** Tur A'da JSON-LD sıfır tespit edildi — Google rich snippet, knowledge graph ve LegalService nis pazar görünürlüğü tamamen kapalı. Sayfa başına manuel `<script type="application/ld+json">` yazmak DRY ihlali ve kod tekrarı olurdu (her sayfada `JSON.stringify`, factory mantığı tekrarlanır).

**Karar:** `components/JsonLd.tsx` ortak server component oluşturuldu (122 satır). 4 type-safe factory:
- `organizationSchema()` — sirket bilgisi (root, tüm sayfalar)
- `websiteSchema()` — site adı + dil + publisher (root, tüm sayfalar)
- `legalServiceSchema({name, description, url, serviceType})` — niş landing'ler için
- `articleSchema({headline, description, url, datePublished, ...})` — blog detay için

`<JsonLd data={...} />` component'i tek obje veya obje dizisi kabul eder. Server component (SSR'da render olur, client hydration'a bağımlı değil — Google bot gördüğünde hazır).

**Alternatif (seçilmedi):** Sayfa başına manuel `<script>` enjeksiyonu — DRY ihlali, factory'ler her sayfada tekrar yazılırdı. JSON-LD'i client-side enjekte etmek — bot'lar SSR HTML'i çeker, JSON-LD görmez.

**Mimar:** Claude Opus 4.7 (TUR #43 B6, 1 Mayıs 2026)
**Onay:** Mehmet Dinç ("YAZ ORTAK")
**Disiplin:** Madde 4.5

---

### Karar 6: Anasayfa "use client" Tuzağı — Server Wrapper Pattern

**Bağlam:** Tur A'da anasayfa `app/(public)/page.tsx` `"use client"` directive'i nedeniyle kendi server-side `metadata` export edemediği tespit edildi. Anasayfa Tedbirge.ai'nin ana giriş noktası — Google'da generic "Tedbirge AI" başlığıyla görünüyordu, ana niş anahtar kelimeler (trafik kazası tazminatı, iş kazası) yansımıyordu. İki seçenek vardı: (a) Root layout metadata'yi anasayfa için optimize etmek (diğer sayfalar override ettiği için yetersiz), (b) Anasayfayı server wrapper + client component bölmesine ayırmak.

**Karar:** Server wrapper pattern (Seçenek b) seçildi:
- Mevcut `page.tsx` (905 satır client kod) → `HomePageClient.tsx` rename, sadece `export default function PublicHomePage` → `HomePageClient` adı değişti, JSX/hooks/motion/state aynen korundu
- Yeni `page.tsx` (23 satır server component) — anasayfa-özel metadata (title "Trafik ve İş Kazası Tazminat Yönetim Platformu", description keyword-rich, canonical, openGraph) + `<HomePageClient />` render

**Sonuç:** Production'da anasayfa başlığı `Trafik ve İş Kazası Tazminat Yönetim Platformu | Tedbirge AI` (template `%s | Tedbirge AI` çalıştı), canonical doğru, content render olmaya devam ediyor.

**Risk:** Anasayfa ana giriş noktası, refactor regresyonu görünür ve maliyetli. Lokal smoke test (HTTP 200, hero metni HTML'de var) + production kanıtı ile doğrulandı.

**Alternatif (seçilmedi):** Root layout metadata'yı anasayfa için optimize — diğer sayfalar (niş landing, blog) kendi metadata'larıyla override eder, anasayfa-özel keyword'ler diğerlerine bulaşırdı.

**Mimar:** Claude Opus 4.7 (TUR #43 B9, 1 Mayıs 2026)
**Onay:** Mehmet Dinç ("YAZ ORTAK", görsel kontrol Mehmet Bey'in tarayıcıda doğrulamasıyla)
**Disiplin:** Madde 4.2 (atom seviyesi), Madde 17.5

---

### Karar 7: Next.js Metadata Merge — og:image Manuel Referans (Ek Atom B10)

**Bağlam:** B9 anasayfa metadata'sı `openGraph: {title, description, url, type}` tanımladığında Tur B-1'de Next.js `app/opengraph-image.tsx` convention'undan otomatik gelen `og:image` ve `twitter:image` **kayboldu**. Lokal smoke test yakaladı.

**Kök sebep:** Next.js metadata merge davranışı — child `openGraph` objesi parent'ı **kısmi merge etmez**, override ettiğinde tüm sub-fields override edilir. Yani `images` belirtmezsen kalıtım almaz, **sıfır gelir**.

**Karar:** B10 ek atomu olarak (Mehmet Bey yazılı onay — "Seçenek A genişletilmiş") og:image regresyonu fixlendi. 5 dosyada manuel `openGraph.images: ["/opengraph-image"]` + `twitter.images` referansı eklendi:
- `app/(public)/page.tsx` (anasayfa)
- 3 niş landing
- `app/(public)/blog/[slug]/page.tsx` generateMetadata

`/opengraph-image` relative path — `metadataBase` (Tur B-1) sayesinde absolute URL üretildi.

**Niye söz değiştirildi:** Tur B-2 mektubu B9 metadata'sında `openGraph.images` belirtmedi — mimar Next.js merge davranışını atladı. Mehmet Bey yazılı onayı ile B10 atomu eklendi (Madde 17.5 son söz).

**Alternatif (seçilmedi):** Anasayfa `openGraph` objesini tamamen kaldırıp root inheritance — anasayfa-özel og:title/description (anasayfa için ana kazanım) kayıp olurdu.

**Mimar:** Claude Opus 4.7 (TUR #43 B10, 1 Mayıs 2026)
**Onay:** Mehmet Dinç (yazılı — "Mimar onayı: Seçenek A genişletilmiş. B9 og:image fix + B10 atomu (niş landing 3 + blog detay 1 = 4 dosya).")
**Disiplin:** Madde 4, Madde 6 (DUR şartı), Madde 17.5
