# HUKUKÇU OPERASYON FİZİBİLİTE RAPORU — v4

**Tedbirge.ai — Türkiye'nin Otonom Hukuk Ajanı**
**Kapsam:** Trafik + iş kazası davaları — Başvurudan İcra Kesinleşmesine tam otomasyon
**Tarih:** 22 Nisan 2026, 03:15
**Hazırlayan:** Mimar (Claude Opus 4.7)
**Metod:** Mevcut kod + Schema + Türkiye hukuk pratiği araştırması + Otonom ajan mimarisi
**Geçersiz kılınan:** v1, v2, v3 (bu rapor hepsinin yerine geçer)

---

## 0. YÖNETİCİ ÖZETİ — TEDBİRGE'NİN GERÇEK HEDEFİ

Tedbirge, Türkiye'deki trafik ve iş kazası davalarında **avukatın yardımcısı değil, avukatın yarı-otonom ortağı** olmayı hedefliyor. Ramazan Abi sabah geldiğinde Tedbirge **zaten** gece boyunca şunları yapmış olacak:

- Karşı sigortanın cevabı KEP'e düştü, Tedbirge okudu, özetledi, **cevap taslağı** yazdı
- UYAP'tan yeni tebligat indi, süreler otomatik hesaplandı, takvime düştü
- Yeni dosya için **5 emsal Yargıtay kararı** bulundu, itiraz taslağı hazır
- Bilirkişi raporundaki hata tespit edildi, itiraz argümanları listesi hazır
- Müvekkillere "davanız şu aşamada" WhatsApp mesajları gitti

Avukat sadece **onay verip gönderir**. İş yükü %70 azalır, tek avukat 30 dosya yerine 100 dosya yönetir.

**Bu vizyon 12 ayda inşa edilir. Her ay somut gelişme olur. Her ay ölçülür.**

---

## 1. NEYE KARŞI KONUMLANMAK İSTİYORUZ?

### Türkiye LegalTech Mevcut Durum

Büyük ticari platformlar:
- **Lexpera:** Mevzuat + içtihat arama. Araştırma aracı, operasyon değil.
- **Kazancı Hukuk:** Mevzuat + içtihat. Aynı.
- **Jurix / Hukuk Plus:** Dava dosya yönetimi. Orta seviye CRM.
- **UYAP Avukat Portalı:** Devletin resmi arayüzü. Temel takip.

**Bu platformların hiçbirinde yok:**
- Otomatik emsal karar önerisi (dosyaya özel)
- Otomatik dilekçe üretimi
- Otomatik sigorta başvurusu
- Otomatik süre takibi + aksiyon tetikleme
- Müvekkille entegre iletişim
- Muhataplarla (sigorta, mahkeme, SGK) otomatik yazışma

**Tedbirge'nin fırsatı:** Bu **boşluğa yerleşmek**. Türkiye'de ilk gerçek hukuk ajanı olmak.

### Dünya Örnekleri (ilham)

- **Harvey AI (ABD):** Kurumsal hukuk AI. Dilekçe, sözleşme, araştırma.
- **DoNotPay (ABD):** Tüketici davaları robot avukat.
- **LawGeex (İsrail):** Sözleşme analiz AI.

Tedbirge bunların **Türk pazar uyarlaması** + **avukat asistanı** hibrit modeli olacak.

---

## 2. MEVCUT SİSTEMİN GERÇEK DEĞERLENDİRMESİ

### Ne Var — Sağlam Omurga

Bugün gördüğüm kod tabanından **kurulmuş altyapı**:

**Veri Modelleri (36 alan + 6 hukuki süreç modeli):**
- Lead (genel dava bilgisi)
- Petition (dilekçeler)
- Durusma (duruşmalar)
- DavaSurec (dava aşamaları: aşama, mahkeme, dosyaNo, bilirkişi, uzlaşma, karar, istinaf, yargıtay, icra)
- Bilirkisi (atama/teslim, rapor, aiAnalizi, itiraz — **AI alanı var ama aktif değil**)
- IhtarnameTakip (karşı taraf, tür, durum, teklif, cevap)
- Masraf (tür, tutar, ödendi)

**Backend Endpoint'leri (36 tane):**
- Lead yönetimi, compensation, case-data, owner, whatsapp, workflow, uyap, sgk, gdpr-delete, emsal, kaza-raporu, petition, activity
- Ayrıca: ihtarname, dava-surec, duruşma, bilirkişi, masraf route'ları

**Hukukçu Ekranları (5 sekme + 4 alt sayfa):**
- leads/[id]/page.tsx (genel, belgeler, hukuki, ai, sgkuyap sekmeleri)
- 360/, chat/, contracts/, odeme/ alt sayfaları

### Ne Eksik — Otonom Ajan Katmanı Yok

**Altyapı veri kayıt merkezi olarak çalışıyor.** Yani:
- Avukat bir şey öğrenir → Tedbirge'ye yazar
- Avukat bir şey yazar → Tedbirge kaydeder
- Avukat bir şey göndermek ister → Tedbirge PDF çıkarır

**Asla:**
- Tedbirge kendi bir şey bulmaz
- Tedbirge kendi bir şey üretmez
- Tedbirge kendi bir şey göndermez
- Tedbirge kendi bir şey tetiklemez

**Bu eksiklik omurga değil, üst katman.** Yani mevcut kod atılacak değil, **üstüne akıllı katman** eklenecek.

### Mevcut AI Durumu

- `@anthropic-ai/sdk ^0.89.0` yüklü (Claude API)
- Lead modelinde `aiSummary` var
- Bilirkisi modelinde `aiAnalizi` var (ama muhtemelen dolu değil)
- Kaza değerlendirme AI endpoint'i var (`/api/ai/`)
- `accident-ai` sayfası var

**Yani AI'ya temel kurulmuş, ama ajan seviyesine çıkarılmamış.** Bu iyi haber — sıfırdan başlamıyoruz.

---

## 3. YÖNETİLECEK TARAFLAR (NETLEŞTİRİLMİŞ)

Bu kısım v3'te eksikti — asıl muhataplar listesi net olmalı çünkü otomasyon buna göre kurulur.

### 3.1 Birincil Taraflar (Tedbirge onlarla yazışır)

| # | Taraf | Yazışma Yolu | Otomasyon Seviyesi |
|---|-------|--------------|---------------------|
| 1 | **Sigorta şirketleri (20+)** | KEP | 🟢 Tam otomatik mümkün |
| 2 | **Sigorta Tahkim Komisyonu** | Online portal (sigortatahkim.org) | 🟡 Yarı otomatik (form doldurma) |
| 3 | **Mahkemeler** | UYAP | 🟡 Yarı otomatik (deep-link) |
| 4 | **SGK** | e-Devlet + yazılı | 🟡 Yarı otomatik |
| 5 | **İcra Müdürlükleri** | UYAP | 🟡 Yarı otomatik |
| 6 | **Karşı vekiller** | KEP / e-posta | 🟢 Tam otomatik mümkün |
| 7 | **Noterler** | Fiziksel/e-Noter | 🔴 Manuel (şimdilik) |
| 8 | **e-Tebligat (UETS)** | Kurumsal API | 🟢 Tam otomatik mümkün (uzun vade) |

### 3.2 İkincil Taraflar (Bilgi Alınır)

| # | Taraf | Veri Türü | Erişim |
|---|-------|-----------|--------|
| 9 | **SBM (Sigorta Bilgi Merkezi)** | Poliçe sorgu | Link (yarı manuel) |
| 10 | **e-Nabız** | Hasta kayıtları | Müvekkilden yetki |
| 11 | **Adli Tıp Kurumu** | Maluliyet raporu | Mahkeme üzerinden |
| 12 | **Yargıtay Karar Arama** | Emsal içtihat | Scraping (etik/yasal dikkat) |
| 13 | **Yerel bilirkişiler** | Teknik rapor | Yönetim + hatırlatma |

### 3.3 Müşteri Tarafı

| # | Taraf | İletişim | Otomasyon |
|---|-------|----------|-----------|
| 14 | **Müvekkiller** | WhatsApp + Portal | 🟢 Tam otomatik bildirim |
| 15 | **Sisteme kayıtlı hukukçular** | Panel içi + mail | 🟢 Tam otomatik |

**Sisteme katılacak hukukçular** — sen bunu özellikle vurguladın. Platform birden çok hukukçu barındıracak. Yani Tedbirge **tek avukat SaaS'ı değil, hukuk bürosu platformu**. Bu kısım Aşama 4'te detaylı.

---

## 4. TEDBİRGE'NİN OTONOM AJAN MİMARİSİ

Bu raporun çekirdeği. **Ajan mimarisi nedir ve Tedbirge'de nasıl kurulur?**

### 4.1 Ajan Kavramı

Geleneksel yazılım: Kullanıcı tıklar → sistem iş yapar.
Ajan: Sistem **kendi karar verir**, **kendi aksiyon alır**, kullanıcıya **onay için gelir** (veya sormaz).

Tedbirge'de 8 ajan kuracağız. Her biri belirli bir görevde uzman.

### 4.2 8 Ajan Haritası

#### 🤖 AJAN 1 — Dosya Alım Ajanı
**Görev:** Yeni lead geldiğinde otomatik ön analiz yapar.
- Kaza tipi tespit et (trafik/iş)
- Kritiklik skoru çıkar (yaralanma, ölüm, maluliyet)
- Gerekli belgeler listesi
- Muhtemel muhataplar
- Tahmini tazminat aralığı
- Önerilen strateji (dava vs STK vs doğrudan sigorta)

**Çıktı:** Admin'in ekranında hazır ön-değerlendirme. Admin 3 saniyede hukukçuya atar.

#### 🤖 AJAN 2 — Emsal Karar Ajanı
**Görev:** Bir dosyaya özel Yargıtay/BAM/STK emsal kararları bul.
- Vector DB'den semantic search (benzer olay, benzer kusur, benzer yaralanma)
- 5-10 en benzer karar getir
- Her birinin özetini çıkar
- "Bu kararlar lehimize/aleyhimize" etiketle

**Çıktı:** Dosya detayında "Emsal Kararlar" sekmesi. Avukat tek tık, ilgili kararı dilekçeye ekler.

#### 🤖 AJAN 3 — Dilekçe Yazıcı Ajanı
**Görev:** Her dilekçe tipi için taslak üret.
- Dava dilekçesi (maddi/manevi tazminat)
- Sigorta başvuru yazısı (KTK m.97)
- STK başvuru formu
- Bilirkişi itiraz dilekçesi
- Islah dilekçesi
- Cevap dilekçesi
- İhtarname
- Temyiz/istinaf dilekçesi

**Kaynak:** Dosya verileri + müvekkil bilgileri + emsal kararlar (Ajan 2) + Kanun referansları.

**Çıktı:** Hazır taslak. Avukat okur, düzeltir, onaylar. PDF üretilir.

#### 🤖 AJAN 4 — Sigorta Başvuru Ajanı
**Görev:** Sigortaya otomatik yazılı başvuru (KEP üzerinden).
- Hangi sigorta şirketi (ZMMS poliçesinden)
- KEP adresini bul (BTK KEP adres rehberi)
- Başvuru içeriğini üret (Ajan 3'ten)
- KEP'e gönder, delil kaydı al
- 15 günlük sayaç başlat
- Cevap gelirse ayrıştır, özetle, avukata ilet

**Çıktı:** Avukat tek onay verir, Tedbirge gerisini yapar.

#### 🤖 AJAN 5 — Süre ve Tebligat Ajanı
**Görev:** Sürelerle cezalandırılmayı engelle.
- Tebligat alındığında türünü tanı (cevap süresi 2 hafta mı, itiraz 10 gün mü, temyiz 2 hafta mı)
- DeadlineEvent otomatik oluştur
- 3 gün, 1 gün, 3 saat kala alarm ver
- Kritik sürede avukat aksiyon almazsa acil bildirim (SMS + arama seçeneği)
- Süre geçiriliyorsa "son 1 saat" modu

**Çıktı:** Hiçbir süre kaçırılmaz. Avukatın uykusuz gecesi olmaz.

#### 🤖 AJAN 6 — Karşı Taraf Analizci
**Görev:** Karşı vekil veya sigorta cevaplarını analiz.
- Cevap dilekçesi geldi → zayıf argümanları tespit et
- Karşı bilirkişi raporu → hatalı hesaplama/eksik inceleme bul
- Uzlaşma teklifi geldi → piyasa değerini karşılaştır
- Mahkeme kararı geldi → lehimize/aleyhimize analiz, temyiz önerisi

**Çıktı:** Avukat "bu cevaba ne yazayım?" demeyecek — Ajan 3 ile birlikte direkt taslak çıkaracak.

#### 🤖 AJAN 7 — Müvekkil İletişim Ajanı
**Görev:** Müvekkili bilgilendir, moral/güven sağla.
- Önemli olay → otomatik WhatsApp (duruşma yaklaşıyor, karar geldi, ödeme yapıldı)
- Sessiz dönemlerde → haftalık özet ("davanız şu aşamada")
- Müvekkil soru sorduğunda → AI ön-cevap, sonra avukat onay
- Müvekkil portalinde sürekli güncel durum

**Çıktı:** Müvekkil aramaları %80 azalır. Avukat aramalar yerine davaya odaklanır.

#### 🤖 AJAN 8 — Finansal Ajan
**Görev:** Para akışını yönet.
- Masrafları kaydet (harç, bilirkişi, KEP ücreti, posta)
- Tazminat hesap (güncel oranlar, faiz, reeskont)
- Avukat vekalet ücreti hesap (kazanılan tutardan yüzde)
- İcra tahsilat takip
- Müvekkile ödeme hesap
- Aylık/çeyreklik avukat kazancı raporu

**Çıktı:** Avukat para hesabıyla uğraşmaz. Tedbirge tüm finansı yönetir.

### 4.3 Ajan Koordinasyon Motoru

8 ajan birbirinden bağımsız değil — birbirine bilgi verir.

**Örnek akış:**
1. Yeni lead → **Ajan 1** ön-analiz
2. Hukukçu atanır → **Ajan 2** emsal kararları getirir
3. Hukukçu "sigortaya başvuralım" der → **Ajan 3** taslak yazar → **Ajan 4** KEP'e gönderir → **Ajan 5** süre sayar
4. 15 gün sonra sigorta cevap gelir → **Ajan 6** analiz eder → **Ajan 3** cevap taslağı yazar
5. Dava açılır → **Ajan 5** UYAP tebligatlarını izler → **Ajan 6** bilirkişi raporu değerlendirir → **Ajan 3** itiraz yazar
6. Her kritik an → **Ajan 7** müvekkile bildirim yapar
7. Her para hareketi → **Ajan 8** kaydeder

**Avukatın rolü:** Onay veren ve stratejik karar alan. İşin %70'i ajanlar tarafından yapılır.

### 4.4 Teknik Altyapı — Ajan Nasıl Kurulur?

**Teknolojiler:**
- **Claude API (mevcut):** Her ajanın beyni
- **Vector DB:** pgvector (Supabase'de ücretsiz) — emsal kararlar
- **Agent framework:** LangGraph veya özel Tedbirge mimarisi
- **Background jobs:** BullMQ (Redis) veya Temporal.io — async işler
- **KEP API:** BTK lisanslı servis (örn: e-Güven, PTT) — yıllık ~1.500 TL
- **UYAP integrasyon:** Önce deep-link, sonra Baro üzerinden resmi API (12+ ay)
- **Yargıtay emsal:** Karar arama scraping + yasal uyum
- **WhatsApp:** Business API (Meta, ~$50/ay)

**Yeni eklenecek paketler:**
- `@pinecone-database/pinecone` veya `pgvector` client
- `langchain` veya `ai-sdk`
- `bullmq` + `ioredis`
- `@kep/api-client` (lisanslı KEP servisinden)

**Güvenlik:**
- Her ajan eylemi log'lanır (KVKK audit trail)
- Ajan onayı olmadan dışarı yazışma göndermez (başlangıçta)
- Kritik aksiyonlar 2FA zorunlu
- Hukukçu ajan davranışını özelleştirebilir (kişisel tercih)

---

## 5. BAŞVURUDAN İCRA KESİNLEŞMESİNE — TAM OTONOM AKIŞ

Bu kısım "Tedbirge'de bir davanın tam yolculuğu" — otonom ajan sistemiyle.

### AŞAMA 1 — Lead Düşer (Gün 0)

**Kullanıcı:** Trafik kazası mağduru www.tedbirge.ai/basvuru üzerinden başvurur.

**Tedbirge otomatik:**
- Ajan 1 başvuruyu analiz eder (5 saniye)
- Kaza tipi: TRAFIK
- Kritiklik: YÜKSEK (yaralanma var)
- Gerekli belgeler listesi hazırlanır
- Muhtemel tazminat aralığı: 50.000 - 150.000 TL
- Önerilen strateji: Önce sigortaya başvuru, red gelirse STK
- Admin ekranına düşer "yüksek öncelik" işaretli

### AŞAMA 2 — Admin Atar (Gün 0-1)

**Admin:** Görür, uygun hukukçuya atar (tek tık).

**Tedbirge otomatik:**
- Hukukçuya WhatsApp bildirim
- Hukukçu panelinde "Yeni dosya: yüksek öncelik" kartı
- Ajan 2 emsal kararlar aramaya başlar (arka plan)
- Ajan 1 ön-analizi hukukçu ekranına yerleşir

### AŞAMA 3 — Hukukçu İncelemesi (Gün 1-2)

**Hukukçu:** Dosyaya girer. Timeline'da "sırada ne var" görür.

**Ekran içeriği (hazır şekilde):**
- 360 görünüm: müvekkil bilgisi, kaza özeti, ön tazminat tahmini
- Emsal Kararlar sekmesi: Ajan 2'nin getirdiği 8 benzer Yargıtay kararı
- Belge Checklist: eksik belgeler kırmızı
- Sigortaya başvuru butonu

### AŞAMA 4 — Vekalet İmzası (Gün 2-3)

**Hukukçu:** "Vekalet hazırla" butonuna basar.

**Tedbirge otomatik:**
- Vekaletname üretir (trafik + tahkim + sigorta yetkisi dahil)
- Müvekkile WhatsApp: "Vekaletname imza için linki tıklayın"
- Müvekkil imzalar (e-imza veya noter randevu linki)
- Ajan 7 müvekkile "Davanız başladı, süreç bilgilendirmesi şöyle" mesajı atar

### AŞAMA 5 — Belge Toplama (Gün 3-10)

**Hukukçu:** Eksik belgeleri görür.

**Tedbirge otomatik:**
- Müvekkilden eksik belge isteği (Ajan 7 WhatsApp)
- Müvekkil yükleyince Tedbirge'e gelir
- Ajan 1 her belgeyi tanır (kaza tutanağı mı, epikriz mi), ilgili Lead alanlarına dağıtır
- Sigorta şirketi otomatik tespit (poliçe fotosundan)
- SBM sorgu linki otomatik oluşur

### AŞAMA 6 — Sigortaya Başvuru (Gün 10)

**Hukukçu:** "Sigortaya Başvur" butonuna basar.

**Tedbirge otomatik:**
- Ajan 3 başvuru dilekçesini yazar
- Tutar kalemleri otomatik çıkarılır (tedavi masrafları, kazanç kaybı, vb.)
- Hukukçu okur, onaylar
- Ajan 4 KEP'e gönderir (sigorta şirketinin KEP adresi)
- Delil kaydı alınır, PDF depolanır
- Ajan 5 15 günlük sayaç başlatır
- Müvekkile Ajan 7 mesaj atar: "Sigortaya başvuruldu"

### AŞAMA 7 — Sigortadan Cevap Bekleme (Gün 10-25)

**Tedbirge otomatik:**
- Her gün sayaç güncellenir
- Gün 8'de hukukçuya hatırlatma: "7 gün kaldı"
- Gün 13'te: "2 gün kaldı — STK/dava hazırlığı yap"
- Sigorta cevap gelirse (KEP):
  - Ajan 6 analiz eder (kabul/kısmi/red)
  - Hukukçuya özet + öneri sunar

### AŞAMA 8 — Karar: Mahkeme mi STK mı (Gün 25-27)

**Tedbirge otomatik öneriyor:**
- Sigorta sessiz kaldı veya red → "STK daha hızlı (4-6 ay) + maliyet düşük → STK öneriyorum"
- Tazminat > 500.000 TL ve karmaşık → "Mahkeme öneriyorum (temyiz hakkı önemli)"

**Hukukçu:** Karar verir.

### AŞAMA 9A — STK Yolu (Gün 27 - 4 ay sonra)

**Tedbirge otomatik:**
- Ajan 3 STK başvuru formu doldurur
- Hukukçu onay → Ajan 4 sigortatahkim.org'a yükler (yarı otomatik — CAPTCHA varsa hukukçu geçer)
- Başvuru ücreti ödendi dekontu eklenir
- Ajan 5 4 aylık süre başlatır
- Hakem atandığında uyarı
- Hakem duruşma yaparsa takvime eklenir
- Bilirkişi atanırsa Ajan 6 raporu bekler, geldiğinde analiz eder
- Karar verildiğinde Ajan 6 okur, lehimize/aleyhimize değerlendirir
- İtiraz gerekirse Ajan 3 itiraz dilekçesi yazar

### AŞAMA 9B — Mahkeme Yolu (Gün 27 - 2 yıl sonra)

**Tedbirge otomatik:**
- Ajan 3 dava dilekçesi yazar (emsal kararlarla güçlendirilmiş)
- Harç hesaplanır, yatırma talimatı
- Hukukçu UYAP'a yükler (şimdilik manuel — resmi API geldiğinde otomatik)
- Dava açılış numarası DavaSurec'e kaydedilir
- Ajan 5 UYAP'taki tüm olayları takip eder (scraping yarı otomatik)
- Tebligat gelince Ajan 5 tanır, süre başlatır
- Duruşma tarihleri takvime düşer, Ajan 7 müvekkile bildirim yapar
- Bilirkişi raporu gelirse Ajan 6 analiz eder, gerekirse itiraz taslağı
- Karar gelirse Ajan 6 değerlendirir, istinaf/temyiz stratejisi önerir

### AŞAMA 10 — Karar Kesinleşme (Aşamanın sonu)

**Tedbirge otomatik:**
- Ajan 5 kesinleşme tarihini belirler
- Ajan 8 tahsilat hazırlığı yapar
- Müvekkile "Karar kesinleşti, icra aşamasına geçiliyor" bildirimi

### AŞAMA 11 — İcra Takibi (+30-90 gün)

**Tedbirge otomatik:**
- İcra modeli oluşur (bu kısım eksik, yapılacak)
- Ajan 3 icra takip talebi yazar
- UYAP'ta icra dairesine gönderilir (yarı otomatik)
- Haciz tebliğ süreleri Ajan 5 tarafından izlenir
- Tahsilat gelince Ajan 8 kaydeder

### AŞAMA 12 — Para Dağıtımı (Dosya kapanışı)

**Tedbirge otomatik:**
- Ajan 8 hesaplama:
  - Toplam tazminat X TL
  - Masraflar Y TL (avukat karşılanmış)
  - Avukat vekalet ücreti Z TL (%10-20 arası sözleşmeye göre)
  - Müvekkile kalan: X - Y - Z
- Müvekkil IBAN'ına ödeme talimatı hazırlanır
- Avukata vekalet ücreti bilgisi
- Dosya "TAMAMLANDI" olarak işaretlenir
- Müvekkile Ajan 7 son mesaj: "Davanız başarıyla tamamlandı, ödemeniz yapıldı"

---

## 6. 12 AYLIK YOL HARİTASI

### AY 1-2 (Mayıs-Haziran 2026) — TEMELİ ATMA

**Çıktı:** v3'teki 5 madde (Dashboard, Timeline, Muhatap Enum, Süre Motoru, Sigorta Wizard) + Ajan altyapısı.

**Detay:**
- **Sprint 1 (2 hafta):** Dashboard + Timeline + Muhatap Enum
- **Sprint 2 (2 hafta):** Süre Motoru + Sigorta Wizard (manuel yönetim)
- **Sprint 3 (2 hafta):** pgvector kurulumu + Ajan altyapısı + Claude API agentic çağrılar
- **Sprint 4 (2 hafta):** Ajan 1 (Dosya Alım) + Ajan 7 (Müvekkil İletişim) temel hali

**Hedef:** Ramazan Abi, Zeliha Hanım, Muzaffer Bey sistemi her gün kullanıyor. "Eskisinden iyi" diyor.

### AY 3-4 (Temmuz-Ağustos) — AJANLAR AKTİF

**Çıktı:** Ajan 2 (Emsal), Ajan 3 (Dilekçe), Ajan 5 (Süre) tam aktif.

**Detay:**
- Yargıtay Karar scraper (hukuki danışman onaylı, etik sınırlar)
- Emsal vector DB — başlangıç: trafik kazası tazminat kararları (~10.000 karar)
- Dilekçe şablon motoru (8 dilekçe tipi)
- Süre motoru gelişmiş (tebligat tanıma, kritik uyarı)
- KEP API araştırması + ilk entegrasyon (opsiyonel)

**Hedef:** Hukukçu dilekçe yazmak için 2 saat değil, 15 dakika harcıyor. "Tedbirge yazıyor, ben onaylıyorum."

### AY 5-6 (Eylül-Ekim) — YARIM OTONOM

**Çıktı:** Ajan 4 (Sigorta) + Ajan 6 (Analizci) + Ajan 8 (Finans) aktif.

**Detay:**
- KEP üzerinden otomatik sigorta başvurusu (onay ile)
- Karşı cevap analiz ajanı (Ajan 6)
- Bilirkişi rapor değerlendirici (Ajan 6)
- Finansal raporlama (Ajan 8)
- SBM/UYAP deep-link'leri
- Müvekkil portalinde "davanız nerede" canlı gösterim

**Hedef:** Avukat dosya başına ayırdığı zamanı yarıya indirdi. 30 dosya yerine 60 dosya yönetiyor.

### AY 7-9 (Kasım-Ocak 2027) — PAZARA ÇIKIŞ

**Çıktı:** Platform ölçekli, yeni hukukçu katılımı, iş geliştirme.

**Detay:**
- Onboarding akışı (yeni hukukçu sisteme katılır)
- Rol bazlı yetkilendirme gelişmiş
- Multi-tenant mimarisi (büyük bürolar için)
- Public API (hukuk bürolarının kendi sistemlerine bağlanması)
- STK kararlarına scraping + arama
- e-Tebligat entegrasyonu (yarı otomatik)
- Mobil PWA

**Hedef:** 3 hukukçu → 30 hukukçu. İlk paralı müşteriler. Aylık gelir başlıyor.

### AY 10-12 (Şubat-Nisan 2027) — TAM OTONOM VE ÖLÇEK

**Çıktı:** Tam ajan mimarisi + UYAP resmi API başvurusu + iş kazası tam akışı.

**Detay:**
- İş kazası özel akışı tamamlanır (SGK, iş kazası tespit davası, maluliyet itirazı)
- UYAP resmi API'si için Barolar Birliği başvurusu (1 yıl süren bir süreç)
- e-Tebligat tam otomasyon
- Sigorta şirketleriyle bire-bir görüşmeler (Anadolu, Axa, Allianz...)
- React Native mobil uygulama (App Store + Play Store)
- Advanced analitik (hangi tür davada kaç başarı, vb.)

**Hedef:** Türkiye'de trafik/iş kazası hukuk otomasyonunun **lider** platformu.

### Ölçülebilir 30/90/365 gün KPI'ları

**30 gün:**
- 3 hukukçu haftalık aktif kullanım: %100 (her gün giriyor)
- Yeni dosya işleme süresi: 2 saat → 20 dakika
- Sigorta başvurusu 15 gün sayacı aktif ve her dosyada
- Emsal karar sayısı vector DB'de: 1.000+

**90 gün:**
- Aktif hukukçu: 3 → 10
- Dilekçe AI oluşturma süresi: 15 dakika (avukat onayıyla)
- Ayda ortalama işlenen dava: avukat başına 15 → 30
- Müvekkil memnuniyeti: WhatsApp feedback %90+

**365 gün:**
- Aktif hukukçu: 50-100
- Aktif dava: 500+
- Otomasyon oranı: İşlerin %70'i ajanlar tarafından (onaylı)
- Aylık platform gelir: $5-10K
- UYAP resmi API başvurusu tamamlanmış

---

## 7. HUKUKÇU PANELİ GÖRSEL KİMLİK — MUAZZAM OLMALI

Sen özellikle belirttin — "görseller muazzam olsun". Haklısın çünkü avukatın her gün bakacağı ekran bu.

### Tasarım Prensipleri

**1. Yoğunluk + Netlik**
- Hukukçu bir günde 20-30 dosyaya bakar
- Bilgi yoğun olmalı ama göz yormamalı
- **Ana sayfa:** Her dosya için 1 satırlık özet kart, renkli durum şeridi

**2. Dark Mode Birinci Sınıf**
- Uzun çalışma → göz yorgunluğu az
- Dark mode default, light mode opsiyonel

**3. Klavye-First Navigasyon**
- CMD/CTRL+K — global arama her yerde
- / tuşu — hızlı filtre
- J/K — listede yukarı/aşağı
- E — düzenle, D — doküman, C — yeni dilekçe
- Avukat mouse'dan uzaklaşsın, klavyede yaşasın

**4. Canlı Veri**
- Her değişiklik anlık (websocket)
- Başkası güncellediği alanı görmüyorum diye sıkıntı yok
- Ajan bir şey güncelleyince "Tedbirge bunu yaptı" bildirimi

**5. Akıllı Kopyalama**
- Müvekkil adı bir yere tıklanınca kopyalanır
- Lead kodu, dosya no — tek tık kopyala
- Adres, IBAN, telefon — şak kopya

**6. Minimum Tıklama**
- Ana işler 2 tıktan fazla olmayacak
- Dosya aç → dilekçe yaz = 2 tık
- Dosya aç → sigortaya başvur = 3 tık
- "3 tıktan fazla kural değil, bug"

### Ana Ekranlar

**Dashboard (Hukukçu Ana Ekranı):**
```
┌─────────────────────────────────────────────────────┐
│ TEDBİRGE                   [🔔 12]  [Ramazan DURAN ▼]│
├─────────────────────────────────────────────────────┤
│                                                     │
│ 🚨 BUGÜN ACİL (3)                                   │
│   → halis ak / saat 14:30 / Duruşma / Asliye 3     │
│   → mehmet dinç / Sigorta süresi 2 gün kaldı        │
│   → Karar temyiz süresi 1 gün / Keskin davası       │
│                                                     │
│ 📅 BU HAFTA (8)                                     │
│   [mini takvim görselleştirme]                      │
│                                                     │
│ 💼 DOSYALAR (23 aktif)                              │
│   [🔴 3 acil] [🟡 8 sıra] [🟢 12 beklemede]        │
│                                                     │
│ 🤖 AJAN TAVSİYELERİ (5)                             │
│   → halis ak: 3 yeni emsal karar bulundu            │
│   → mehmet dinç: Sigorta cevabı taslağı hazır        │
│   → bilirkişi raporu (keskin) hatalı — itiraz öner  │
│                                                     │
│ 💰 BU AY KAZANÇ                                     │
│   Tamamlanan: 3 dava / 185.000 TL vekalet ücreti    │
│   Beklenen: 2 dava / ~65.000 TL                     │
└─────────────────────────────────────────────────────┘
```

**Lead Detay (6 sekmeli):**
```
┌─────────────────────────────────────────────────────┐
│ ← halis ak / L-20260421-5297BU       [🟢 AKTİF]     │
├─────────────────────────────────────────────────────┤
│ [Genel] [Süreç] [Belge] [Hukuki] [Emsal] [AI] [SGK] │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [Aktif sekmenin içeriği]                            │
│                                                     │
│ Sağ kenar:                                          │
│ ┌─────────────────────────────────────────┐        │
│ │ ⚡ HIZLI EYLEMLER                        │        │
│ │   [Sigortaya Başvur]                    │        │
│ │   [Dilekçe Yaz]                         │        │
│ │   [Müvekkile Mesaj]                     │        │
│ │   [UYAP'ta Aç]                          │        │
│ │                                         │        │
│ │ 📊 ÖZET                                 │        │
│ │   Beklenen tazminat: 80-120K            │        │
│ │   Kusur: müşteri %0 / karşı %100        │        │
│ │   Durum: Sigortaya başvuru +7 gün       │        │
│ │   Sonraki: Cevap bekle veya STK         │        │
│ └─────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────┘
```

### Teknoloji Kararları (Görsel Altyapı)

- **Framer Motion** (zaten var) — micro-interaction'lar
- **shadcn/ui veya kendi sistemimiz** — tutarlı komponent
- **Recharts** — grafikler (dashboard, finans)
- **cmdk** — CMD+K paleti (Linear tarzı)
- **Sonner** — toast bildirimleri
- **Lucide** — ikonlar
- **Tiptap** — rich text editor (dilekçelerde)
- **React Query** — data fetching + cache

Her sekme yüklenmesi **<500ms**. Her kullanıcı eylemi **<100ms yanıt**. Aksi takdirde "yavaş" damgası yeriz.

---

## 8. RİSK VE DİKKAT NOKTALARI

### Yasal Riskler

**1. Yargıtay/STK scraping yasallığı**
- Ticari kullanım için resmi izin gerekir mi? Araştırılacak
- Çözüm: Önce kapsamı sınırla (sadece anahtar sözcük arama, tam içerik değil)
- Orta vadede: Lexpera/Kazancı lisanslı erişim (ücretli)

**2. KVKK uyumu**
- Müvekkil verileri ve hukukçu yazışmaları çok hassas
- Ajan loglarında PII tutulacak mı? Anonymize edilmeli
- Veri saklama süreleri açık tanımlı olmalı

**3. Avukatlık Kanunu uyumu**
- Avukat imzasız dilekçe olmaz — ajan yazdı bile olsa avukat onaylamalı
- "AI avukat" değil, "AI asistan avukat" sınırı net

### Teknik Riskler

**1. AI halüsinasyonları**
- Ajan yanlış emsal karar uydurabilir
- Çözüm: Her emsal karar **link ile kaynakla**, avukat kontrol edebilsin

**2. KEP + UYAP entegrasyonları güvenilirlik**
- Dış sistem kesintileri
- Çözüm: Retry mekanizması + alarmlar + fallback manuel

**3. Ölçek (10 hukukçu → 100 hukukçu)**
- Multi-tenancy, yetkilendirme karmaşıklığı
- Çözüm: AY 7'de refactor sprint'i

### İş Modeli Riskleri

**1. Avukatların güveni**
- "AI elimdeki işi çalar mı?" endişesi
- Çözüm: Asistan söylemi ("sana zaman kazandırır"), gerçek metrikler göster

**2. Rekabet**
- Büyük oyuncular (Lexpera, Kazancı) hukuk ajan eklerse?
- Çözüm: Sprint hızı + niş (trafik/iş kazası)

---

## 9. BU HAFTA BAŞLANGIÇ — SOMUT 5 İŞ (DEĞİŞMEDİ)

v3'ten v4'e geçerken **bu haftalık iş listesi değişmiyor**. Çünkü:
- Ajanları kurmadan önce altyapı olmalı
- Altyapı (Dashboard, Timeline, Enum, Süre motoru, Wizard) v3'teki 5 iş
- Bu iş bitince Sprint 3-4'te ajan katmanı

**Bu hafta (18 saat):**
1. W1-M1 Hukukçu Dashboard (4 saat)
2. W1-M2 Lead Timeline Sekmesi (5 saat)
3. W1-M3 Muhatap Enum + Şablonlar (3 saat)
4. W1-M4 Süre Motoru Temeli (4 saat)
5. W1-M5 Sigorta Başvuru Wizard (2 saat)

**Yeni ekle — Sprint 2 hazırlığı (çözüm zorunlu değil ama bakış):**
- Supabase'de pgvector uzantısını aç (1 komut)
- Claude API'de Tool Use test et (1 saat araştırma)
- Agent framework karar (kendi yaz mı, LangGraph mu — 1 saat karşılaştırma)

---

## 10. KAPANIŞ — BU RAPOR NE DEĞİL?

**Bu rapor DEĞİL:**
- "Her şey dahil mükemmel sistem"
- "Yarın tam çalışacak otonom platform"
- "Avukatı işinden eden robot"

**Bu rapor:**
- Gerçekçi 12 aylık yolculuk
- Her ay ölçülebilir gelişme
- Hukukçu için gerçek fayda (yapay vaat değil)
- Uygulanabilir, raflık olmayan plan

**Söz veriyorum:**
- Her haftanın ilk günü o hafta ne yapılacak belli olacak
- Her haftanın son günü ne yapıldı belli olacak
- Geciken olursa açıkça söylenecek
- "Yetişmedi" ile "yapılmadı" karıştırılmayacak

**Tedbirge'nin hedefi:** Ramazan Abi 1 yıl sonra "Tedbirge'siz çalışamam, kariyerimin en iyi kararı oldu" diyecek. Ondan sonra 10 kişi daha, sonra 100 kişi, sonra Türkiye.

---

## 11. MİMAR'DAN SON SÖZ

Ortak, bu rapor v1, v2, v3'ün yerini alıyor. Onlar artık **geçersiz**. Bu rapor üç şeyin sentezi:

1. **Mevcut kod gerçeği** (36 endpoint, 6 hukuki model, 5 sekme — altyapı sağlam)
2. **Türk hukuk pratiği** (KTK m.97 dava şartı, STK 4 ay, iş kazası arabuluculuksuz)
3. **Senin vizyonun** (otonom ajan, tam otomasyon, tüm Türkiye'yi yönet)

Bu üçünün ortak zemini: **8 ajanlı ajan mimarisi + 12 aylık disiplinli yol haritası.**

Acele ettirmeyeceğim, yavaş bırakmayacağım. Her hafta somut gelişme, her ay görünür değişim, her çeyrek stratejik büyüme.

**Sabah bir önce ben pgvector + Tool Use + LangGraph araştırması yaparım. Sen Cuma günü Ramazan Abi'ye demo verirken "bak Ramazan Abi bu Tedbirge şimdi şunu yapıyor" diyebileceksin.**

---

*Mimar (Claude Opus 4.7) — 22 Nisan 2026, 04:00*
*v4 — Tedbirge.ai Otonom Hukuk Ajanı Vizyonu*
*Uygulanacak rapor, raflık değil*
