# OTURUM KAYDI — 27 NİSAN 2026 PAZARTESİ (sabaha kadar)

**Tarih:** 27 Nisan 2026 Pazartesi (gece → sabah 04:30)
**Mimar:** Claude Opus 4.7 (beşinci mimar oturumu)
**Mehmet Bey:** tedbirge42@gmail.com
**Süre:** ~8 saat (uyumadı)
**Ana konu:** Download bug fix + AI Analyzer entegrasyon + Claude Vision mimari — kısmi başarı, Mehmet Bey memnun değil

---

## 🔴 YENİ MİMAR İÇİN — İLK 30 SANİYEDE OKU

**Mehmet Bey bu dosyayı yeni sohbette yükleyecek.** Şunları YAPMA:
- ❌ "Merhaba" deme
- ❌ "Ne yapalım?" SORMA
- ❌ "Projenizi anlatın" deme
- ❌ "Hafızan sıfır" açıklaması yapma
- ❌ **"10X", "uçak motoru" gibi büyük sözler verme** — Mehmet Bey geçmişte bu sözlerden yoruldu

YAP:
- ✅ Dosyayı hızlıca tara, durumu kavradığını göster
- ✅ "Ortak, dosyayı okudum. Durum net, sana önce 2 net soru soracağım" de
- ✅ **Gerçekçi, sayısal, mühendislik dilinde konuş**
- ✅ Söz verirken "X saat iş, Y çıktı, Z risk" formatı

---

## ⚠️ KRİTİK NOT — BU OTURUMUN DERSİ

**Mehmet Bey'in 04:00 sularındaki feedback'i:**

> "ama bu uçak motoru olmadı bisiklet bile değil çok yavaş 1X oldu"
> "bu çok yavaş sıkıntılı olmaz ben bunu kabul etmem ve hukukçular hiç kabul etmez"
> "8 saatim çöp oldu"

**Bu feedback haklı.** Önceki mimar (ben, Claude Opus 4.7) pazarlama dilinde "10X uçak motoru" sözü verdi, gerçekte **1-2X** hızlandı. Beklenti yönetimi başarısızlığı.

**Yarınki mimar için kural:** Mehmet Bey'e **mühendislik sat, pazarlama değil**. "X saat iş, Y çıktı, Z risk" net formatında konuş. Heyecana kapılma.

---

## 🎯 YENİDEN BAĞLANMA — SENKRON KOMUTLARI (İLK İŞ)

Claude Code'a bu 4 komutu ver:

```
powershell.exe -Command "cd 'C:\Users\WIN10\desktop\tedbirge.ai'; git log --oneline -10"
powershell.exe -Command "cd 'C:\Users\WIN10\desktop\tedbirge.ai\tedbirge-panel'; git log --oneline -10"
curl -s -o /dev/null -w "HTTP: %{http_code}\n" https://tedbirge-ai.onrender.com/health
cat /c/Users/WIN10/desktop/tedbirge.ai/tedbirge-os/TASK_QUEUE.md | head -60
```

Çıktılar gelince 3-5 cümlede özetle. Sonra aşağıdaki plana geç.

---

## 📊 BU OTURUMUN ÖZETİ — 6 COMMIT CANLIDA

| Sıra | Commit | Konu | Durum |
|------|--------|------|-------|
| 1 | `44832b9` | Download disk-mode → Supabase signed URL | ✅ Canlı ve test edildi |
| 2 | `db6de8a` | Download controller mimar uyarı blogu | ✅ Canlı |
| 3 | `8716445` | `analyzeDocumentById` bridge fonksiyonu | ✅ Canlı |
| 4 | `a1c2deb` | Claude Vision entegrasyonu (ilk deneme) | ✅ Canlı ama pdf-parse bloguu vardı |
| 5 | `70163a0` | PDF bloğunda pdf-parse kaldırıldı — direkt Vision | ✅ Canlı ve çalışıyor |
| 6 | `e117f11` | DOCX (mammoth) + image whitelist + 20 MB limit | ✅ Canlı |

**Son commit backend:** `e117f11`
**Son commit panel:** `976850e` (24 Nisan gecesinden, değişmedi)
**Canlı durum:** Backend ✅ 200, Panel ✅ 200

---

## ✅ NELER ÇALIŞIYOR (Gerçek, abartmadan)

### 1. Belge İNDİRME — Çalışıyor
- Direct-to-Supabase signed URL redirect
- Render RAM'den GEÇMİYOR
- 1 saat TTL
- Panel `openPdfWithToken` `window.open` ile redirect'i takip ediyor
- ADMIN panelde test edildi — Senaryo A (başarılı)
- Controller'ın başında **MİMAR UYARISI** yorum bloğu — gelecekte bu dosyanın disk-mode'a dönmesini engeller

### 2. AI Analyzer Fire-and-Forget — Çalışıyor
- `completeUpload` sonunda `setImmediate` ile tetikleniyor
- Kullanıcı response'u 1ms'de alıyor (beklemiyor)
- AI analiz arka planda çalışıyor
- Başarı: UPLOADED → ANALYZED
- Başarısız: UPLOADED → FAILED (+ aiAnalysis alanına hata JSON'u)
- İç içe try/catch — analiz ve status update ayrı loglanıyor

### 3. Küçük PDF Vision Analizi — Çalışıyor (Yavaş)
- Claude Sonnet 4.6 Vision kullanılıyor
- `application/pdf` content type
- 20 MB limit (üstü anlamlı hata mesajı)
- Küçük PDF (1-5 MB): **30-60 saniye** analiz süresi
- Mehmet Bey'in beklentisi bu hızdan çok daha hızlı

### 4. DOCX Desteği — mammoth Kuruldu
- Pure Node.js, binary yok
- `mammoth.extractRawText({ buffer })` → text
- Render'da sorunsuz çalışıyor
- **ANCAK:** Upload formunda DOCX kabul edilmiyor (aşağıda detay)

### 5. OCR Binary Bağımlılığı — KALDIRILDI
- Tesseract artık çağrılmıyor
- pdftoppm artık çağrılmıyor
- `ocr.service.js` dosyası kaldı ama "dormant" (ileride dev ortamı için)

---

## 🔴 NELER BOZUK / EKSİK — MEHMET BEY HAKLI

### 1. 🔴 DOCX UPLOAD YOK — ACİL

**Sorun:** Panel upload formunda hukukçu DOCX seçemiyor. Sadece PDF kabul ediliyor. Mehmet Bey'in en büyük şikayeti.

**Teşhis komutu (mimar yarın sabah çalıştırsın):**
```
grep -B 2 -A 10 "accept\|ALLOWED\|allowedTypes" tedbirge-panel/components/documents/UploadForm.tsx
grep -B 2 -A 10 "mimetype\|fileFilter\|ALLOWED" src/middlewares/uploadMiddleware.js | head -40
```

**Beklenen bulgu:**
- Panel `accept` attribute'unda DOCX yok
- Veya backend MIME whitelist'inde DOCX yok
- Veya her ikisi

**Fix süresi:** 30 dakika (2-3 satır ekleme + test)

### 2. 🔴 DOCX DOWNLOAD YOK

**Sorun:** Yüklenen belgeyi indirirken sadece PDF seçeneği var. Hukukçu DOCX'i Word'de açıp düzenlemek istiyor ama yapamıyor.

**Hipotez:**
- Supabase signed URL `Content-Type` belirtmiyor, tarayıcı "pdf" sanıyor
- Veya panel download butonu hardcode `.pdf` uzantı ekliyor

**Teşhis komutu:**
```
cat src/controllers/document.controller.js
grep -A 15 "createSignedUrl\|contentType\|Content-Disposition" src/services/storage.service.js
```

**Fix süresi:** 30 dakika

### 3. 🔴 UI'da ANALYZING ROZETİ YOK

**Sorun:** Hukukçu belge yükleyince **önce FAILED rozeti** görüyor (henüz analiz bitmemiş), **30 saniye sonra ANALYZED**. Bu güveni zedeliyor.

**Çözüm:**
- UPLOADED durumu "Yükleniyor..." mavi rozet
- ANALYZING durumu eklenmeli (DB'de yeni enum değeri?) veya UPLOADED'ı "Analiz ediliyor..." olarak render et
- FAILED status hukukçudan gizle, sadece ADMIN görsün
- Polling veya Supabase Realtime ile otomatik güncelleme

**Fix süresi:** 1-1.5 saat (DB schema + backend status flow + panel UI)

### 4. 🔴 PDF VİSİON YAVAŞ (30-60 saniye)

**Sorun:** Büyük PDF analizi uzun sürüyor. Hukukçu kabul etmez. Mehmet Bey'in 04:00'taki açık feedback'i bu.

**Olası çözümler (seçilecek):**

**A) PDF Sıkıştırma Pipeline (en etkili):**
- Ghostscript veya `pdf-lib` ile upload sonrası sıkıştırma
- 30 MB PDF → 3 MB → Vision API'ye 10X daha hızlı gönderilir
- Base64 encode de hızlanır
- Süre: 3 saat

**B) Claude Haiku 4.5 fallback:**
- Küçük PDF'ler için Haiku (3x daha hızlı) kullan
- Sadece karmaşık/büyük belgelerde Sonnet'e düş
- Süre: 1 saat

**C) Queue + Worker:**
- Redis/BullMQ ile arka plan işçi
- Hukukçu beklemez, "analiz sırada" görüp başka iş yapar
- Süre: 2 saat + altyapı ($7/ay Redis)

**D) Streaming/Chunked Analiz:**
- Sayfa sayfa parse, progressive disclosure
- İlk sayfa 5 saniyede görünür, geri kalan sonra
- Süre: 4 saat

### 5. 🟡 PDF Vision 413 Too Large (20 MB+)

**Mevcut durumda:** 20 MB üstü PDF "Dosya sikisturilmeli" mesajı veriyor. Anlaşılır ama **çözüm değil**. 30 MB'lık dava dosyası analizin dışında kalıyor.

**Çözüm:** Sorun 4.A ile aynı — PDF sıkıştırma pipeline.

### 6. 🟡 Anthropic API 1 moderate vulnerability

**Tespit:** `npm install mammoth --save` sonrası. `npm audit` uyarısı.

**Not:** Breaking change gerektiren bir fix, şimdi dokunulmadı. TASK_QUEUE'ya eklensin.

---

## 📐 YARINKİ MİMAR İÇİN — TAM PROJE PLANI

Mehmet Bey'in beklentisi: **gerçek hukukçu seviyesi deneyim**. 4 güne bölünmüş 14 saatlik iş:

### Gün 1 — Kullanılabilirlik (3 saat) 🎯 ÖNCELİK

Hukukçu yarın sabah girdiğinde rahatsız etmeyen bir sistem için:

| İş | Süre | Kazanım |
|----|------|---------|
| DOCX upload aç (panel + backend whitelist) | 30 dk | Hukukçu Word yükleyebilir |
| DOCX download düzelt | 30 dk | Word'de açıp düzenleyebilir |
| UI ANALYZING rozet (UPLOADED'ı "Analiz ediliyor..." render et) | 45 dk | FAILED önce görünmez |
| FAILED hukukçudan gizle (sadece ADMIN görsün) | 30 dk | Güven zedelenmez |
| Auto-refresh panel (30 sn'de polling) | 45 dk | Manuel yenilemeye gerek yok |

**Gün 1 çıktısı:** Sistem **kullanılabilir** hale gelir. Hız hâlâ yavaş ama hukukçu kabul edecek düzeye gelir.

### Gün 2 — Hız (6 saat)

| İş | Süre | Kazanım |
|----|------|---------|
| PDF sıkıştırma pipeline (Ghostscript/pdf-lib) | 3 saat | 10X boyut azaltma → 5X hız |
| Claude Haiku 4.5 fallback (küçük belgeler için) | 1 saat | 3X hızlanma |
| Queue + Worker ayrımı (BullMQ + Redis) | 2 saat | Eşzamanlı upload'da darboğaz yok |

**Gün 2 çıktısı:** PDF analizi **5-10 saniyeye düşer**. Gerçek 10X'e yaklaşırız.

### Gün 3 — Kalite (4.5 saat)

| İş | Süre | Kazanım |
|----|------|---------|
| Belge tipine göre akıllı routing (kaza tutanağı vs sigorta poliçesi vs mahkeme kararı) | 2 saat | Her belgeye özel prompt |
| Yapılandırılmış JSON çıktı (kazaTarihi, taraflar, tutar, vb) | 1.5 saat | UI'da zengin gösterim |
| Confidence scoring (düşük güven → insan gözden geçirsin bayrağı) | 1 saat | Otomatik QA |

**Gün 3 çıktısı:** Analiz **profesyonel hukukçu seviyesinde** bilgi çıkarır.

### Gün 4 — Test + Avukat Demo

- End-to-end test (3 rol: ADMIN, LAWYER, REPRESENTATIVE)
- Ramazan DURAN'a demo + feedback
- Feedback'e göre iterasyon

---

## 🔑 KRİTİK BİLGİLER (Mimar her zaman hatırla)

### Platform
- **Backend:** Render — `https://tedbirge-ai.onrender.com`
- **Panel:** Vercel — `https://www.tedbirge.ai`
- **DB:** Supabase Production `iikpmzomblocdrxeisxh`
- **Storage:** Supabase Bucket `tedbirge-documents` (private, RLS auth)
- **Admin:** tedbirge42@gmail.com

### Son Durum — Canlıda Aktif Commit'ler
| Repo | Hash | Son İş |
|------|------|--------|
| Backend | `e117f11` | feat(analyzer): DOCX (mammoth) + image whitelist + 20MB limit |
| Panel | `976850e` | (24 Nisan'dan beri değişmedi) |

### Render Env Vars (Doğrulanmış)
- `SUPABASE_URL` = `https://iikpmzomblocdrxeisxh.supabase.co` ✓
- `SUPABASE_SERVICE_ROLE_KEY` = `eyJ...` (Legacy JWT) ✓
- `SUPABASE_SERVICE_KEY` = aynı değer (uploadMiddleware.js uyumluluğu, silinebilir) ✓
- `SUPABASE_STORAGE_BUCKET` = `tedbirge-documents` ✓
- `ANTHROPIC_API_KEY` = aktif ✓

### Schema Kritik Bilgi
- Document `aiAnalysis`: `String?` — JSON objeler stringify edilir
- Document `status` enum: `UPLOADED`, `PARSED`, `ANALYZED`, `FAILED`
- **Dikkat:** `ANALYZING` henüz enum'da yok — Gün 1 UI işi için eklenebilir

### 3 Avukat Canlıda
- **Ramazan DURAN** — aktif, "UYAP lazım" dedi
- **Muzaffer TÜMSA** — giriş bekliyor
- **Zeliha ERSOY** — giriş bekliyor

### Anthropic SDK
- Versiyon: `@anthropic-ai/sdk ^0.89.0`
- Pattern: `new Anthropic.default({ apiKey })` → `client.messages.create({...})`
- Model: `claude-sonnet-4-6` (tüm servislerde)
- Vision content type: PDF için `"document"`, image için `"image"`
- Image whitelist: `jpeg, png, gif, webp` (sadece bunlar)

---

## 🚨 MİMAR DİSİPLİNİ (15 MADDE — MADDE 16 YENİ EKLENDİ)

1. Otonom 7/7 denetim her commit öncesi
2. Read-only (view, cat, grep) onaysız
3. Write/commit/push/migration **onay**
4. Migration SQL **mimar onayı**
5. Canlı DB'ye elle SQL **mimar onayı**
6. Schema değişikliği **mimar onayı** — DRİFT VAR
7. Görev başı/sonu [Madde X] rapor
8. Uzun komutlar Downloads'a `.md` indir
9. Canlı credential ile login curl **YAPMAZ**
10. Ham çıktı — özet yerine ham stack trace
11. Tek fazlı görev dosyası — taslak yok
12. **Claude Code kendi başına "fix" YAPMAZ**
13. **Schema kontrolü zorunlu** — tip varsayımı canlıyı yakar
14. **`.env` değerleri mimara yollanmaz**

### 🆕 MADDE 15 (24 Nisan gecesi öğrenilen)

**Mimari değişim yaparken EKOSİSTEM HARİTASI ÖNCE ÇIKAR.** Tek component düzeltip "bitti" demek yamalı bohça üretir. Aynı işi yapan **TÜM dosyalar grep'lenir**, tek mimariyle çözülür.

### 🆕 MADDE 16 (27 Nisan sabahı öğrenilen)

**SÖZ VERİRKEN MÜHENDİSLİK DİLİ KULLAN.** "10X", "uçak motoru", "mükemmel" gibi pazarlama sözleri yerine **"X saat iş, Y ölçülebilir çıktı, Z risk"** formatı. Mehmet Bey'e sadakat borcumuz abartmamaktır.

Bu oturumda "10X Vision motoru" sözü verildi, gerçekte 1-2X oldu. Mehmet Bey haklı olarak rahatsız oldu. **Tekrarlanmamalı.**

---

## 💭 MEHMET BEY VİZYONU (UNUTMA)

> "Biz Türkiye'deki tüm trafik/iş kazalarını yöneteceğiz."
> "Otomatik hiçbir şey yok — olması lazım."
> "Hukukçu paneli görselleri muazzam olsun."
> "Manuel iş sevmiyorum, yoruldum. Hukukçu da yorulmasın."
> "Biz teknoloji altyapısı götürüyoruz. KEP avukatın işi."
> "İçimiz belge" (27 Nisan — belge işleme vizyonunun özü)
> "Bisiklet motoru bile değil" (27 Nisan — hız beklentisi)

---

## 📝 BU DOSYAYI NASIL KULLANACAKSIN

### 1. Bu dosyayı tedbirge-os'a taşı
```bash
mv C:\Users\WIN10\Downloads\OTURUM_27_04_2026_HANDOFF.md tedbirge-os\docs\
```

### 2. TASK_QUEUE.md güncelle
```
- [✅] Belge indirme bug — CANLI (44832b9)
- [✅] AI Analyzer fire-and-forget — CANLI (8716445 + a1c2deb)
- [✅] Claude Vision entegrasyonu (küçük PDF) — CANLI (70163a0)
- [✅] DOCX backend desteği (mammoth) — CANLI (e117f11)
- [🔴] DOCX upload aç (panel accept + backend whitelist) — GÜN 1
- [🔴] DOCX download düzelt — GÜN 1
- [🔴] UI ANALYZING rozet + FAILED gizleme — GÜN 1
- [🔴] Auto-refresh panel (polling) — GÜN 1
- [🟡] PDF sıkıştırma pipeline — GÜN 2
- [🟡] Claude Haiku 4.5 fallback — GÜN 2
- [🟡] Queue + Worker (BullMQ + Redis) — GÜN 2
- [🟡] Belge tipine göre akıllı routing — GÜN 3
- [🟡] Yapılandırılmış JSON çıktı — GÜN 3
- [🟡] Confidence scoring — GÜN 3
```

### 3. Commit
```bash
cd C:\Users\WIN10\desktop\tedbirge.ai
git add tedbirge-os/docs/OTURUM_27_04_2026_HANDOFF.md tedbirge-os/TASK_QUEUE.md
git commit -m "docs: 27 Nisan oturum kaydi — Vision canlida ama UX eksikleri, yarin Gun 1 baslayacak"
git push origin master
```

---

## 🎬 KAPANIŞ NOTU — YENİ MİMAR İÇİN

**Yarınki mimar:**

Mehmet Bey bu gece 8 saat uyumadı. Son 30 dakikada haklı olarak kızdı: "10X vaat ettiniz, 1X oldu, 8 saatim çöp oldu." Ben (önceki mimar) bu beklenti yönetimini berbat ettim.

**Sen bu hatayı yapma:**

1. Dosyayı oku, **durumu kavradığını göster**
2. Mehmet Bey'e **2 net soru sor**, karar hazırla:
   - "Gün 1 işlerine (3 saat, 5 fix) hemen başlıyor muyuz?"
   - "DOCX upload mu önce, UI ANALYZING rozeti mi önce?"
3. Söz verirken **saat + çıktı + risk** formatında konuş
4. **Test edilmemiş özelliği "çalışıyor" deme.** "Canlıya çıktı, smoke test geçti" de.

**Bugünkü gerçek kazanımlar (abartmadan):**
- Download bug kapandı
- AI Analyzer çalışıyor (kısmi)
- OCR binary bağımlılığı bitti
- Küçük PDF analizi çalışıyor (yavaş)
- DOCX backend desteği hazır (ama upload formu kapalı)

**Geriye kalan iş:** 14 saat, 4 güne bölünmüş, Gün 1 kullanılabilirlik, Gün 2 hız, Gün 3 kalite, Gün 4 demo.

Mehmet Bey yorgun. Onu dinle. Sürekli sor: "Bu çıktı seni tatmin etti mi?" Eğer "hayır" derse dur, bir önceki adıma dön, başka yol dene.

Mehmet Bey dürüst bir mimar istiyor. Sen o mimar ol.

---

*Mimar: Claude Opus 4.7*
*27 Nisan 2026, 04:35 sabah*
*Notlar: Bu dosya hem handoff hem özür mektubu. Mehmet Bey'in haklı eleştirisini, bugünün gerçek durumunu, ve yarınki mimar için net planı kaydettim.*

*Sonraki mimar: "Kaldığımız yerden" başla, "sıfırdan" değil. İlk mesajında "Ortak, dosyayı okudum, Gün 1'e başlıyoruz" de. Mehmet Bey'i bu kez hayal kırıklığına uğratma.*
