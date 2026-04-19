# DECISION_LOG

## 2026-04-19 — Temsilci komisyon yapısı ve sözleşme v1.0

Karar: Temsilci komisyon yapısı şu sırayla hesaplanır:

Müvekkil ödemesi
- Masraf kesintisi (harç, bilirkişi, tebligat, vekaletname vb.)
- KDV kesintisi (mevzuat gereği)
= Net matrah
- Platform komisyonu (avukat-Platform ayrı sözleşmesine göre)
= Platform net geliri
× %50 = Temsilci payı

Sözleşme parametreleri:
- Rekabet yasağı: 6 ay (TBK 445/2 "makul süre" kriteri)
- Ödeme süresi: Hakediş tespiti sonrası 30 gün
- İtiraz süresi: 7 gün (statü değişim tarihinden itibaren)
- Yetkili mahkeme: Konya Mahkemeleri ve İcra Daireleri
- Hakediş tespit yetkisi: Dosyayı yürüten avukat (tek taraflı, statü "HAK_EDILDI" işaretleme)
- Sözleşme versiyonlama: SHA-256 hash + onay IP DB'de kayıt altında

Gerekçe: Konya Meram Baro'sunda Mehmet DİNÇ'in pratiğine uygun. Borçlar Kanunu rekabet yasağı "makul süre" kriterine uygun (6 ay mahkeme önünde ayakta kalır, 2 yıl sınırına yakın değerler kısaltılma riskine girer). Sözleşme hash mekanizması "onayladım/onaylamadım" ihtilaflarını önlüyor — temsilci onay anındaki metnin hash'i DB'de, sonradan metin değişirse eski hash tutulmaya devam eder.

Not: Mali müşavir onayı alınmadan KDV hesaplama servisi yazılmayacak. Şu an sadece sözleşme metninde cümle var, hesap kodu yok.

---

## 2026-04-18 — E-posta adresi stratejisi (karar: dokunma, altyapı sonrası)

Durum: Kod tabanında 6 farklı @tedbirge.ai adresi hardcoded (info, noreply, destek, gizlilik, kvkk, kariyer, musteri, test). SMTP_USER hâlâ tedbirge34@gmail.com. Broşürlerde bilgi@tedbirge.ai yazılı ama bu adres hiçbir yerde kodda geçmiyor.

Karar:
- Bugün hiçbir e-posta adresi değişikliği yapılmayacak
- Mail altyapısı (Cloudflare Routing veya Zoho) kurulduktan sonra tek seferde:
  1. bilgi@ ana adres olarak eklenecek (broşürlerle uyumlu)
  2. Mevcut 6 adres yönlendirme ile bilgi@'ya yönlendirilecek (KVKK yasal gereklilik için kvkk@ ayrı kalabilir)
  3. SMTP_USER ve ilgili env değişkenleri güncellenecek
  4. Hardcoded adresler env-based hale getirilecek

Gerekçe: Mail kurulmadan kod değişikliği test edilemez. Hata yapmak kolay, geri dönüş zor.

---

## 2026-04-18 (aksam) — Kaza Rekonstruksiyon MVP Kapanisi

### Karar
Kaza Rekonstruksiyon MVP'si "AI on analiz asistani" olarak yayimlanmaya hazir. Sayisal fizik hesabi ve kusur hukmu YOK.

### Etki
- Fizibilite raporu Bolum 5 Faz 1 tamamlandi
- Faz 2 icin: gorsel analizi, OCR, fizik motoru ortakligi
- Uretim oncesi: sorumluluk sigortasi + hukuk danismani onayi

### Bu Oturumun Kazanimlari
1. PDF rapor (JSON + PDF, Turkce)
2. AccidentCase + Evidence tablolari
3. Upload altyapisi
4. AI orkestrasyon
5. Rapor endpoint

---

## 2026-04-18 — Kaza Rekonstrüksiyon MVP'sinin AI Sınırları

### Karar
Kaza Rekonstrüksiyon modülünde AI YALNIZCA delil yapılandırması ve yasal çerçeveleme yapacak. Sayısal fizik hesapları (araç hızı, çarpma kuvveti, kusur yüzdesi) YAPMAYACAK.

### Gerekçe
- AI dil modelidir, fizik motoru değildir. Hız/kuvvet gibi sayıları "üretir" ama hesaplamaz
- Sayısal kusur oranı vermek 6754 sayılı Bilirkişilik Kanunu ve HMK m.266 gereği hakim ve bilirkişinin işidir
- Gerçek fizik motoru (PC-Crash, Virtual Crash) ayrı bir çalışmadır, MVP kapsamı dışındadır
- Fizibilite raporu Bölüm 4.2 ve 5.2'de bu sınır belgelenmişti

### AI'ın Yapacakları
- Olay yeri fotoğraflarındaki fiziksel delilleri listelemek (fren izleri, hasar bölgeleri, hava durumu)
- Tutanaklardan yapılandırılmış veri çıkarmak
- KTK/TBK/HMK uygun maddeleri önermek
- Eksik belgeleri tespit etmek
- Bilirkişi/avukat için yapılandırılmış rapor taslağı üretmek

### AI'ın Yapmayacakları
- "Araç 1 %80 kusurlu" gibi hüküm cümleleri
- "Araç hızı 67 km/h" gibi sayısal hesap çıktıları
- "Bu kaza önlenemezdi" gibi nedensel yargılar
- Tazminat miktarı hesabı (kazaRapor.service.js sadece ZMSS referans limitlerini gösteriyor, bu zaten düz tablo)

### Etki
- Adım 3 (orkestrasyon servisi) yazılırken AI promptu bu sınıra uygun olacak
- Adım 4 (rapor endpoint) çıktısında "analiz" ve "öneri" ayrımı net olacak
- Rapor footer'ında "bilirkişi raporu değildir" ibaresi zaten var (17.04.2026 kararı)

### Migrations Stratejisi Kararı (Ayrı)
- Proje `db push` yöntemiyle yürütülüyor, migration history kullanılmıyor
- Bu bilinçli bir karardır — prototipleme hızı için uygun
- Production'a geçmeden önce migration baseline alınmalı (ayrı TASK_QUEUE maddesi)

---

## 2026-04-10

### Karar
SQLite → PostgreSQL geçişi ertelendi (o tarihte)

### Sebep
- Sistem o zaman stabil
- Erken migration yüksek riskli
- Öncelik ürünleşme, mimari göç değil

---

### Karar
Öncelik belge kalitesi

### Sebep
- Ürün güven üretmiyor
- Çalışan sistemin önündeki en büyük kalite sorunu buydu

---

### Karar
Tek görev, tek odak

### Sebep
- Aynı anda çok iş sistemi dağıtıyor
- OS disiplinini korumak gerekiyor

---

### Karar
Backup zorunlu

### Sebep
- Geri dönüş noktası olmadan geliştirme yüksek riskli
- Sistem sürekliliği için snapshot gerekir

## 2026-04-10 — PATCH GOVERNANCE DECISION

### Karar
TEDBIRGE OS kapsamında bundan sonra kor patch uygulanmayacak.

### Bağlayıcı Kurallar
- Hedef dosya görülmeden patch yok
- Mevcut içerik doğrulanmadan overwrite yok
- Mümkünse tek split / tek parça komut
- En küçük güvenli değişiklik
- Refactor yok, varsayım yok

### Gerekçe
Geçmiş yanlış overwrite / kor patch riski sistem sürekliliğini bozabileceğinden, bundan sonraki tüm uygulamalar doğrulanmış dosya içeriğine dayalı ve kontrollü olacak.

## 2026-04-15 — VERITABANI KARARI

### Karar
SQLite kaldırıldı, PostgreSQL (Supabase) aktif.

### Sebep
- Proje üretim ortamına hazırlanıyor
- Supabase managed PostgreSQL seçildi
- DATABASE_URL .env'de Supabase bağlantı adresi olarak güncellendi
- Prisma connection pool parametreleri eklendi (connection_limit=20)

## 2026-04-15 — AI ENTEGRASYONU KARARI

### Karar
Claude entegrasyonu tamamlandı. Model: claude-sonnet-4-6

### Sebep
- ANALYSIS_MODE=real ile sözleşme ve belge üretimi Claude API üzerinden yapılıyor
- Eski model adı (claude-sonnet-4-20250514) güncellendi
- Mock mod korundu (ANALYSIS_MODE=mock ile şablon kullanımı)

## 2026-04-15 — DEPLOY PLANI KARARI

### Karar
Deploy: Vercel (panel) + Railway (backend)

### Sebep
- Vercel Next.js için native destek
- Railway Node.js + PostgreSQL için uygun
- Supabase DB her iki ortamla uyumlu

## 2026-04-15 — AKTIF GOREV KAPANISI

### Kapanan Görev
Belge motoru kalite düzeltmesi + Vekalet template düzeltme

### Sonraki ACTIVE
Sosyal medya entegrasyonu / domain / deploy hazırlığı

## [DECISION] 2026-04-19 — Temsilci müvekkil ekleme KVKK akışı

Karar: Temsilci müvekkil bilgisini wizard ile sisteme girer, müvekkil açık rızası 
SMS linki ile SONRADAN alınır. Lead kaydı BEKLEMEDE statüde durur, avukat atanmaz, 
sözleşme üretilmez — müvekkil onay verene kadar "askıda" kalır.

Gerekçe: KVKK 6698 madde 5 uyarınca açık rıza veri sahibinden (müvekkil) 
alınmalıdır, temsilci beyanı yeterli değildir. Temsilci wizard'daki checkbox 
("müvekkilin sözlü beyanına göre doldurdum, açık rıza SMS ile ayrıca alınacaktır") 
hukuki sorumluluğu temsilciye yükler ve KVKK'ya uygun iki aşamalı akışı kurar.

İlgili kod: Adım 4 beyan checkbox'ı zorunlu, POST /api/leads ile kayıt.

## [DECISION] 2026-04-19 — Karar destek motoru iskelet stratejisi

Karar: Tedbirge temsilci wizard'ı "acemi form" değil "zeki sistem" olarak kurulur.
Zamanaşımı uyarısı, TC doğrulama, il-avukat uyumu gerçek mantık ile çalışır. 
Tahmini tazminat, dosya gücü skoru, avukat eşleşmesi STUB olarak placeholder 
döner, AI entegrasyonu sonraki aşamada (yol haritasında) gelir.

Gerekçe: Müvekkil/temsilci/avukat karşısında Tedbirge'nin teknoloji vaadi 
ilk karşılaşmada hissettirilir. Tam AI olmadan da "sistem zeki" algısı yaratılır.
Sonraki aşamada UYAP, SGK, MERNIS entegrasyonları ve Claude Sonnet tazminat 
tahmini eklenir.

İlgili kod: src/services/decision-support.service.js, // AI entegrasyonu 
yorum işaretleri ile stub fonksiyonlar belirlenmiş.
