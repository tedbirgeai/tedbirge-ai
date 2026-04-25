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

## Format ve Disiplin Notu

Yeni karar bu dosyaya **yukarıdaki formatla** eklenir.

**Kural:** Yeni karar eski kararı ezmez, üstüne yazar. Eski karar değişiyorsa, **revize maddesi** yeni karar yazılır, eskisi referans olarak kalır.

---

**Son güncelleme:** 25 Nisan 2026 (TUR #2 tasarım sonu)  
**Mimar:** Claude Opus 4.7  
**Bağlayıcı:** Tüm gelecek oturumlar
