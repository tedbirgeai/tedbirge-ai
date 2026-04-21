# TEDBİRGE.AI — KAPSAMLI YAPILACAKLAR MASTER LİSTESİ

**Tarih:** 21 Nisan 2026, 23:15
**Hazırlayan:** Mimar (Mehmet Dinç ile ortak çalışma)
**Kapsam:** AUTOMATION_PLAN_v1 + HUKUKCU_CRM_FIZIBILITE_v2 + bugünkü tüm tespitler birleştirilmiştir
**Amaç:** Yeni sohbette "ne yapacağız" sorusuna gerek kalmayacak kapsamlı plan

---

## 0. ŞU AN NEREDEYİZ (Durum Fotoğrafı)

### Canlı durum
- **3 aktif avukat:** Ramazan DURAN (beğendi, kullanıyor), Zeliha ERSOY (kayıtlı), Muzaffer TÜMSA (girecek)
- **Canlı müvekkil testi başarılı:** halis ak / L-20260421-5297BU ucunca çalışıyor
- **Ürün canlı:** www.tedbirge.ai + tedbirge-ai.onrender.com aktif
- **36 sayfa, 23 backend route grubu, 3 kullanıcı rolü + müvekkil self-servis**

### 21 Nisan 2026'da tamamlanan 7 commit
1. `b774a11` — Avukat bilgisi sızıntısı (passwordHash + 2FA secret)
2. `b47553d` — Kalan lawyer:true sızıntıları + müşteri portal isActive bugfix
3. `99bda25` — Middleware public path bug (11 public path eklendi)
4. `fe2e8ae` — Başvuru success ekranı "Panele Git" → "Başvurumu Takip Et"
5. `205d51c` — Başvuru sorgula endpoint prefix düzeltmesi
6. `3824da4` — KVKK modal + sağlık verisi açık rıza checkbox
7. `e82c0eb` — KVKK modal iframe → inline içerik (tarayıcı engeli çözümü)

### Yazılan raporlar (tedbirge-os/docs/)
- `AUTOMATION_AND_IMPROVEMENT_PLAN_v1.md` (otomasyon + iyileştirme)
- `HUKUKCU_CRM_FIZIBILITE_v2.md` (hukukçu CRM derinlemesine analiz)

### Kurulan otomasyon
- ✓ Dependabot aktif (27 Nisan ilk PR'lar)
- ✓ UptimeRobot panel monitor aktif (www.tedbirge.ai)
- ✗ UptimeRobot backend monitor PAUSED (health endpoint eksik)

---

## 1. YARIN SABAH — İLK 2 SAAT (ACİL, SIRALI)

Bu 4 iş yarın uyanır uyanmaz yapılacak. Her biri canlı sistemi etkiliyor.

### [ ] 1.1 Backend /api/health endpoint ekle (15 dk)
**Neden:** UptimeRobot backend monitor unpause edilmek için gerekli. Supabase heartbeat cron'unun ping atacağı endpoint de bu. Kök URL 404 dönüyor, bu yüzden monitor "down" sanıyor.

**Yapılacaklar:**
- `src/routes/health.routes.js` oluştur
- `GET /api/health` → `{ status: "ok", timestamp, version }`
- `GET /api/health/db` → Prisma ile `SELECT 1` çalıştır, DB canlı mı doğrula
- `src/routes/index.js` içinde mount et
- Commit + push

### [ ] 1.2 UptimeRobot backend monitor güncelle ve unpause (5 dk)
**Neden:** Canlı izleme olmazsa backend düşse kimse fark etmez.

**Yapılacaklar:**
- UptimeRobot dashboard'a gir
- Backend monitor URL'ini `https://tedbirge-ai.onrender.com/api/health` yap
- Monitor unpause et
- Test: status 200 döndüğünü doğrula

### [ ] 1.3 KVKK healthDataApproved DB kaydı (45 dk)
**Neden:** Şu an kullanıcı "sağlık verisi açık rıza"yı işaretliyor ama backend bu bilgiyi kaydetmiyor. Hukuki olarak ispat eksikliği.

**Yapılacaklar:**
- Prisma schema: `Lead` modeline `healthDataApprovedAt DateTime?` ekle
- Migration oluştur ve çalıştır (`npx prisma migrate dev`)
- `src/controllers/public.controller.js` (public-lead endpoint): request body'den `healthDataApproved` al, `true` ise `healthDataApprovedAt: new Date()` yaz
- Test: Yeni başvuru yap, DB'de timestamp'i kontrol et
- Commit + push

### [ ] 1.4 /kvkk sayfası ile modal içeriğini senkronize et (20 dk)
**Neden:** Şu an başvuru modal'ında (Supabase/Vercel/Render/Anthropic dahil) metin var ama `/kvkk` sayfasında yok. İki farklı aydınlatma metni = hukuki sorun.

**Yapılacaklar:**
- `tedbirge-panel/app/(public)/kvkk/page.tsx` aç
- Bölüm 4 (Veri Aktarımı) içeriğini modal'dakiyle aynı hale getir
- Veri işleyen listesi: Supabase, Vercel, Render, Anthropic ekle
- Commit + push

---

## 2. YARIN ÖĞLEDEN SONRA — UX BUG'LARI (2-3 SAAT)

### [ ] 2.1 FOTOĞRAF 4 muamması teşhisi (30 dk)
**Not:** Mehmet Bey'in bugünkü canlı testinde "Tedbirge — sigorta ve süreç teknolojisi" başlıklı **ikinci tasarım** bir sayfa göründü. Asıl ana sayfadan farklı: koyu lacivert yerine beyaz/açık tema, farklı logo, farklı kimlik.

**Yapılacaklar:**
- Mehmet Bey'e sor: "Bu sayfa tam olarak hangi URL'den geldi? Gezinti nasıldı?"
- Gerekirse: `grep -rn "sigorta ve süreç teknolojisi" tedbirge-panel/`
- Bulunca karar: silinsin mi, birleştirilsin mi, branded landing olarak kalsın mı
- Karar doğrultusunda fix veya plan yap

### [ ] 2.2 "Başvuru Sorgula" navbar butonu direkt yönlendirme (15 dk)
**Neden:** Şu an kullanıcı "Başvuru Sorgula"ya tıkladığında → login sayfası → "rolünü seç" → "Müvekkil misiniz? Dava Takibine Git" → `/basvuru-sorgula`. **4 tık mesafesi**. Olmalı: 1 tık.

**Yapılacaklar:**
- `tedbirge-panel/app/(public)/page.tsx` navbar linkini kontrol et
- "Dava Takibi" butonu `/basvuru-sorgula`'ya direkt gitsin
- Login sayfasındaki "Müvekkil misiniz?" linkini de gözden geçir
- Commit + push

### [ ] 2.3 Vercel eski env var temizliği (2 dk)
- Vercel dashboard → tedbirge-panel → Settings → Environment Variables
- `NEXT_PUBLIC_API_URL` (Apr 16 tarihli, kullanılmıyor) → **Sil**
- Sadece `NEXT_PUBLIC_API_BASE_URL` kalmalı

### [ ] 2.4 Görsel kimlik tutarsızlığı — karar toplantısı (tasarım kararı)
**Not:** Bugünkü testte iki farklı tasarım dili tespit edildi. Bu **teknik fix değil, strateji kararı**. Bugün yapılmayacak.

**Yapılacaklar:**
- Mehmet Bey ile 15 dakika: "Ana sayfa lacivert mi kalsın, yoksa ikinci tasarımın beyaz/professional hali mi baskın olsun?"
- Karar verildikten sonra: hangi sayfalar hangi tasarıma uydurulacak listesi
- Bu ayrı bir feature olarak planlansın

---

## 3. BU HAFTA — OTOMASYON TAMAMLAMA (2-3 GÜN)

(AUTOMATION_AND_IMPROVEMENT_PLAN_v1'den alındı)

### [ ] 3.1 GitHub Actions — npm audit cron (30 dk)
**Dosya:** `.github/workflows/security-audit.yml`
- Her gece 03:00 TR saati (UTC 00:00) çalışır
- `npm audit --audit-level=high` hem backend hem panel için
- Yüksek/kritik açık varsa otomatik GitHub Issue açar
- Kod içeriği v1 planında hazır

### [ ] 3.2 Supabase Heartbeat cron (20 dk)
**Dosya:** `.github/workflows/supabase-heartbeat.yml`
- Her 6 günde bir çalışır (Supabase 7 gün inaktif olursa DB pause eder)
- Backend `/api/health/db` endpoint'ini pingler
- DB'ye dokunur, pause'u engeller
- Kod içeriği v1 planında hazır

### [ ] 3.3 Staging ortamı kurulumu (karar + 1 saat)
**Neden:** Şu an canlıya direkt push yapıyoruz, bu bugün 2 kez neredeyse sistemi kırıyordu. Staging olmazsa patlak büyür.

**Seçenekler:**
- **A:** Vercel preview (zaten otomatik geliyor her PR için) + Render free tier ikinci servis
- **B:** Ayrı master branch yerine develop → master akışı

**Karar:** Mehmet Bey ile konuş, sadece sonra uygula

---

## 4. BU HAFTA — AVUKATLARLA BİREBİR GÖRÜŞMELER (KRİTİK)

(HUKUKCU_CRM_FIZIBILITE_v2 Bölüm 3'ten alındı)

### [ ] 4.1 Ramazan DURAN ile 30 dk görüşme
### [ ] 4.2 Zeliha ERSOY ile 30 dk görüşme
### [ ] 4.3 Muzaffer TÜMSA ile 30 dk görüşme (girişini yaptıktan sonra)

**Her birine aynı 8 soru** (fizibilite raporunda detaylı):

1. "Bu hafta en çok hangi işi yaparken zaman kaybediyorsun?"
2. "Bir dosyaya ilk girdiğinde 5 saniyede ne görmek istiyorsun?"
3. "Adliyedeyken telefonla hangi bilgiye bakmak istersin ama bakamıyorsun?"
4. "Müvekkil aradığında en sık sorulan 3 soru ne?"
5. "UYAP entegrasyonu derken tam olarak ne kastediyorsun?"
   - Dosya sorgu otomatik senkron mu?
   - Karar-tebligat metinleri otomatik çekilsin mi?
   - Dilekçe doğrudan gönderilsin mi?
6. "Şu an kullandığın başka yazılım var mı? Neyi iyi/kötü yapıyor?"
7. "Bir meslektaşına Tedbirge'yi anlatsan, 3 cümlede ne dersin?"
8. "Yarın sihirli bir özellik gelse, hangisi olurdu?"

**Sonuç:** Cevaplar `tedbirge-os/docs/AVUKAT_ANKET_CEVAPLARI.md` olarak kaydedilecek. v3/v4/v5 raporları bu cevaplar üzerine yazılacak.

---

## 5. BU HAFTA — GÜVENLİK SERTLEŞTİRME (AUTOMATION v1'den)

### [ ] 5.1 2FA zorunlu yap (LAWYER + ADMIN için)
**Neden:** Altyapı hazır (setup-2fa, verify-2fa, login-2fa endpoint'leri var). Hukukçuların hassas veri tutan hesapları için 2FA opsiyonel değil zorunlu olmalı.

**Yapılacaklar:**
- LAWYER ve ADMIN rollerinde `twoFactorEnabled: false` ise → login sonrası zorunlu 2FA kurulum ekranına yönlendir
- CUSTOMER için şimdilik opsiyonel
- Commit + push

### [ ] 5.2 Audit log genişletme
**Neden:** Şu an LEAD_CREATED, LAWYER_ASSIGNED gibi işlemler loglanıyor ama "kim hangi lead'i ne zaman açtı" yok. KVKK + iç denetim için kritik.

**Yapılacaklar:**
- ActivityLog'a yeni action'lar: `LEAD_VIEWED`, `DOCUMENT_DOWNLOADED`, `EXPORT_GENERATED`, `SETTINGS_CHANGED`
- Her controller'da ilgili yere log yazılsın
- Log retention: 90 gün sonra otomatik silme cron'u (KVKK veri saklama süresi sınırları)

### [ ] 5.3 Rate limiting genişletme
**Mevcut:** authLimiter, registerLimiter, passwordResetLimiter var
**Eklenecek:** `publicLeadLimiter` (basvuru spam'ini önle), `queryLeadLimiter` (sorgulama abuse engelle)

---

## 6. BU HAFTA — GLOBAL ARAMA (HUKUKCU_CRM_FIZIBILITE_v2'den)

### [ ] 6.1 Global arama kutusu
**Neden:** Fizibilite raporunda net tespit: avukat "Ahmet Yılmaz" diye aradığında panel çapında bulamıyor.

**Yapılacaklar:**
- Panel header'ına arama kutusu ekle
- Backend: `GET /api/search?q=...` endpoint
- Arama: customerName, customerPhone, customerEmail, leadCode, TC (varsa)
- Role-based filtreleme (LAWYER sadece kendine atananları görür)
- Sonuç dropdown: müvekkil + dosya numarası + durum

---

## 7. BU HAFTA — MOBİL HUKUKÇU (HUKUKCU_CRM_FIZIBILITE_v2'den)

### [ ] 7.1 Lead detay sayfası mobil uyum testi
**Neden:** 3-kolon layout masaüstü için yapılmış, telefon ve tablet deneyimi bilinmiyor. Avukatlar adliyede telefon kullanıyor.

**Yapılacaklar:**
- Gerçek telefon ile 10 dk gezi testi
- Kritik bug listesi çıkar
- Öncelik sırası: mobile-first veya masaüstü paralel

### [ ] 7.2 Duruşma → .ics export
**Neden:** Avukatlar Google Calendar / Outlook kullanıyor. Duruşma bildirimlerinin kendi takvimine senkron olması lazım.

**Yapılacaklar:**
- `GET /api/durusma/:id/ics` endpoint → iCalendar format
- UI'da "Takvimime Ekle" butonu

---

## 8. BU AY — LEXSCAN AKILLANDIRMA (AUTOMATION v1 Bölüm 5)

Bu **büyük bir iş**. Mehmet Bey'in "Mehmet Bey'e bağlayayım mı?" fikri üzerine tasarlandı.

### [ ] 8.1 Confidence scoring (3-4 gün)
- LexScan her yanıtında "1-10 arası emin misin?" kendi kendine sorar
- Eşik < 7 ise eskalasyon tetiklenir

### [ ] 8.2 Eskalasyon akışı MVP (4-5 gün)
- Kullanıcıya: "Kıdemli danışmana bağlayayım mı? (5-10 dk cevap)" / "Form doldur, 24 saat içinde dönüş"
- Backend: yeni tablolar (`escalations`, `duty_schedule`)
- WhatsApp bildirim nöbetçi avukata (başlangıçta Mehmet Bey'e)
- Otomatik lead oluştur (konuşma geçmişiyle)

### [ ] 8.3 Nöbet sistemi + SLA (+3-4 gün)
- Haftalık rotasyon: Ramazan → Muzaffer → Zeliha
- Mesai saati tanımı (hafta içi 09-18)
- Müsait değilse: otomatik form + 24 saat taahhüt
- SLA ölçümü (bildirim → cevap süresi)

### [ ] 8.4 Kullanıcı memnuniyet anketi (+2 gün)
- Eskalasyon sonrası "Yardımcı oldu mu?" (1-5 yıldız)
- Sonuçlar dashboard'da görünsün

**Toplam süre:** ~2 hafta odaklı çalışma

---

## 9. BU AY — HUKUKÇU DASHBOARD İYİLEŞTİRMELERİ

### [ ] 9.1 Hukukçu için kendi performans istatistiği
- Şu an `/api/analytics/lawyer-performance` sadece ADMIN'e açık
- LAWYER kendi istatistiğini görsün: kazanılan/aktif/tahsilat (son 30 gün)

### [ ] 9.2 Dashboard onboarding tour
- İlk giriş: 5 adımlı rehber ("Burası dashboard", "Leadler burada", "AI araçları şurada")
- Tamamlanınca tekrar gösterme

### [ ] 9.3 Hızlı işlemler (quick actions)
- Dashboard'da tek tıkla: "Yeni not", "Yeni duruşma", "Hızlı arama"

### [ ] 9.4 Kritik uyarı sistemi iyileştirme
- Mevcut: duruşma cron (geldi) + deadline checker
- Yeni: Bilirkişi rapor vadesi, ihtarname cevap süresi takibi
- Sabah dashboard'a ilk bakışta "bugün X tehlike var" kartları

---

## 10. BU AY — MÜVEKKİL PORTAL (AUTOMATION v1 Bölüm 3)

### [ ] 10.1 Müvekkil uçtan uca akış testi
**Henüz yapılmadı.** Müvekkil başvuru yapıp avukat atandıktan sonra nasıl giriş yapıyor? SMS + geçici şifre mi, magic link mi, OTP mi?

**Yapılacaklar:**
- Test hesabı oluştur
- Akışı canlıda dene
- Bug listesi çıkar, düzelt

### [ ] 10.2 Müvekkil belge yükleme akışı
- Güvenli upload (virüs taraması?)
- Dosya tipi validasyonu
- Boyut limiti (max 10 MB?)
- Yüklediği belgeyi tekrar görebilme

### [ ] 10.3 Müvekkil ↔ avukat mesajlaşma
- Mevcut: `GET /musteri/mesajlar`, `POST /musteri/mesaj`
- Eksik: hukukçu tarafında mesaj yönetimi, unread badge, realtime (Supabase Realtime veya polling)

### [ ] 10.4 Push bildirim müvekkil için
- Dava durumu değişti → push
- Duruşma yaklaşıyor → push
- Yeni belge yüklendi → push

---

## 11. BU ÇEYREK — UYAP ENTEGRASYONU (Ramazan Abi'nin talebi)

**3 seviye yaklaşım, ayrı v4 raporu yazılacak:**

### Seviye 1 — Manuel (şu an bu)
- Avukat UYAP'tan dosya no/mahkeme/durum kopyalıyor, Tedbirge'ye yapıştırıyor
- Schema'da alanlar zaten var (`uyapDosyaNo`, `uyapMahkeme`, `uyapDurum`)
- **Maliyet:** 0

### Seviye 2 — Avukat Portalı scraping
- Headless browser (Puppeteer), session yönetimi, CAPTCHA
- **Maliyet:** 4-6 haftalık mühendislik
- **Yasal risk:** Orta (UYAP kullanım şartları müphem)

### Seviye 3 — Resmi UYAP Web Servisi
- Barolar Birliği üzerinden API alınabilir mi? Araştırma gerek
- Varsa: altın standart

**Karar noktası:** 3 avukattan kaç tanesi UYAP entegrasyonu istiyor? 3/3 ise öncelik artar.

---

## 12. BU ÇEYREK — YENİ ÖZELLİKLER (Mehmet Bey'den gelen talepler)

### [ ] 12.1 SBM entegrasyonu (Sigorta Bilgi Merkezi)
- Zorunlu trafik sigortası sorgulama
- Dava değerlendirmesinde kritik veri
- Araştır: SBM resmi API var mı, scraping mi gerekir

### [ ] 12.2 Malpraktis (tıbbi kötü uygulama) dava türü
- Yeni `accidentType` değeri: `MEDICAL_MALPRACTICE`
- Özel form alanları: doktor, hastane, işlem, komplikasyon
- Ayrı bilirkişi/tazminat hesaplama mantığı

### [ ] 12.3 Kaza Rekreasyon keşfedilebilirlik iyileştirme
- Şu an AI Araçları sekmesinde var ama bulunması zor
- Lead detay sayfasında daha görünür yer (ikon + açıklama)

### [ ] 12.4 Dilekçe şablon kütüphanesi genişletme
- Her dilekçe tipi için 2-3 şablon
- Özelleştirilebilir (avukat kendi başlık/imza kaydedebilsin)

### [ ] 12.5 Tebligat/posta takibi modülü
- Fiziksel tebligat kayıt
- Elektronik tebligat (e-Tebligat) entegrasyonu
- Süre hesabı (7 gün, 15 gün, 30 gün)

---

## 13. BU ÇEYREK — BÜYÜK İŞLER

### [ ] 13.1 PWA offline-first geçişi
- En azından belge/dilekçe cache
- Service worker güçlendirme
- Adliye koridorunda çalışma

### [ ] 13.2 E-imza entegrasyonu (e-Devlet)
- Dilekçe dijital imzalama
- Hukuki geçerlilik

### [ ] 13.3 Gelişmiş analitik
- Cohort analizi
- Müvekkil LTV (lifetime value)
- Dava süresi dağılımı
- Avukat performans kıyaslama

### [ ] 13.4 Gelişmiş AI (v5 raporunda detaylı)
- Hukuki bilgi tabanı (RAG) — Yargıtay kararları, KTK, SGK mevzuatı
- Dilekçe v2 (içtihat destekli yazım)
- Belge OCR + otomatik alan çıkarma

---

## 14. HUKUKİ — MEHMET BEY + AVUKATLAR HALLEDECEK

### [ ] 14.1 VERBİS kayıt durumu
**Sorun:** Kayıtlı mı, değil mi bilmiyoruz.
**Yapılacak:** Mehmet Bey hukukçularla netleştirsin. Kayıtlı değilse KVK Kurumu'nu arayıp kayıt başlat.

### [ ] 14.2 KVKK aydınlatma metni hukuki onay
- `/kvkk` sayfası + başvuru modal metni → Ramazan Abi veya Muzaffer Bey okusun
- Eksik yerler varsa düzeltme listesi çıkarsın

### [ ] 14.3 Veri işleyen sözleşmeleri (DPA)
- Supabase DPA imzalanmalı
- Vercel DPA imzalanmalı
- Render DPA imzalanmalı
- Anthropic DPA imzalanmalı (LexScan için veri akışı kritik)

### [ ] 14.4 Veri ihlali bildirim prosedürü
- 72 saat içinde KVK Kurumu'na bildirim zorunlu
- Yazılı prosedür olmalı: ne zaman, nasıl, kim, kime
- Ramazan Abi bu prosedürü yazabilir

### [ ] 14.5 Sorumluluk çerçevesi
- Müvekkile verilen tazminat tahmini yanlış çıkarsa?
- Disclaimers yeterli mi?
- Avukat sözleşmesi bu riski kapsıyor mu?

---

## 15. RAPORLAR YAZILACAK (Sırasıyla)

### [ ] 15.1 v3 — Müvekkil Girişi Fizibilitesi
**Kapsam:** `/basvuru`, `/basvuru-sorgula`, `/musteri` portal derinlemesine analiz
**Ne zaman:** Avukat anketi cevapları geldikten sonra
**Ne kadar:** 2-3 gün

### [ ] 15.2 v4 — UYAP Entegrasyonu Raporu
**Kapsam:** 3 seviye yaklaşımın detayı, yasal analiz, maliyet, zaman
**Ne zaman:** Mayıs başı (Ramazan Abi ile görüşme sonrası)
**Ne kadar:** 2-3 gün

### [ ] 15.3 v5 — Otomasyon + LexScan Akıllandırma
**Kapsam:** Confidence scoring, eskalasyon mimarisi, nöbet sistemi, prompt mühendisliği
**Ne zaman:** Mayıs ortası
**Ne kadar:** 3-4 gün

### [ ] 15.4 v6 — Güvenlik + KVKK Boşluk Kapatma
**Kapsam:** 2FA zorunlu, audit log, VERBİS, veri işleyen sözleşmeleri, veri silme akışı
**Ne zaman:** Mayıs sonu
**Ne kadar:** 2 gün

---

## 16. YAPMAYACAĞIMIZ ŞEYLER (TUZAKLAR)

**Bu liste v1'de detaylı ama özetle:**

- ❌ "Dünyada eşsiz AI ajanı" yapmaya kalkmayacağız (3 ay kaybederiz)
- ❌ Kubernetes/mikroservis/Redis cluster kurmayacağız (10K kullanıcıya kadar gerek yok)
- ❌ 100 özellik şişirmeyeceğiz (sprint başına 2-3 özellik, hakkıyla)
- ❌ Staging olmadan canlıya push etmeyi ALIŞKANLIK haline getirmeyeceğiz (bugün 2 kez sistemi neredeyse kırıyorduk)
- ❌ "Dünyada eşsiz olsun" retoriğine kapılmayacağız (hedef: Türkiye'de trafik/iş kazası 1 numara)
- ❌ Gece 23:00'ten sonra kritik deploy yapmayacağız (yorgun karar = yanlış karar)
- ❌ Tek avukatın tek talebiyle roadmap değiştirmeyeceğiz (3/3 istek gelirse öncelik olur)

---

## 17. ÖLÇME + BAŞARI METRİKLERİ

**30 günlük KPI'lar:**
- 3 avukatın haftalık aktif kullanım oranı (DAU/WAU) → hedef %80+
- İlk müvekkil girişi sessiz mi (bug'sız) → hedef: evet
- Ortalama dilekçe yazma süresi → hedef: Word'de 30 dk ise Tedbirge'de 15 dk
- Canlıda downtime → hedef: %0.1'den az (UptimeRobot takip edecek)

**90 günlük KPI'lar:**
- 3 avukat → 10 avukata büyüme
- İlk 20 müvekkil canlıda
- İlk kazanılan dava Tedbirge üzerinden yürütülmüş
- Aylık operasyonel maliyet < $50

---

## 18. ÖNCELİK MATRİSİ (Eisenhower)

```
              ACİL                           ACİL DEĞİL
          ┌─────────────────────┬─────────────────────┐
ÖNEMLİ    │ 1.1 Health endpoint │ 3-8 Otomasyon       │
          │ 1.3 KVKK DB kayıt   │ 9-10 Dashboard UX   │
          │ 2.1 Fotoğraf 4      │ 11 UYAP entegrasyon │
          │ 4 Avukat anket      │ 15 Raporlar         │
          ├─────────────────────┼─────────────────────┤
ÖNEMSİZ   │ 2.3 env var temiz   │ 12.3 Kaza Rek. UX   │
          │ 2.4 Görsel kimlik   │ 13 Büyük işler      │
          │                     │ 16 Yapmayacaklar    │
          └─────────────────────┴─────────────────────┘
```

---

## 19. YENİ SOHBET AÇILIRSA — MİMAR İÇİN TALİMAT

Yeni Claude bu dosyaya bakıp aşağıdaki sırayla hareket etmeli:

1. **Bölüm 0** oku → mevcut durumu anla
2. **Bölüm 1** oku → acil 4 işi gör
3. **Bölüm 1.1'den başla** → `/api/health` endpoint ekle
4. Mehmet Bey'e "Günaydın, bugün backend health endpoint'ten başlıyoruz" de
5. İlk Claude Code komutunu hazırla
6. Adım adım ilerle, her iş bittiğinde ✓ işaretle

**Sorma yasağı:** "Neredeyiz?", "Ne yaptık?", "Bir hatırlatır mısın?" — bu sorular yasak. Her şey burada yazılı.

**Hatırlatma yetkisi:** Mehmet Bey'in "şunu da yapalım" dediği konular varsa, bu dokümana **hemen** ekle. Yoksa kaybolur.

---

## SON SÖZ

Tedbirge.ai **Türkiye'de trafik/iş kazası davalarında lider olabilecek altyapıya sahip**.

21 Nisan 2026, 23:00 itibariyle:
- 3 aktif hukukçu var
- Kritik güvenlik açıkları kapatıldı
- Uçtan uca müvekkil akışı çalışıyor
- Otomasyon iskelesi kuruldu
- 2 kapsamlı fizibilite raporu hazır
- Önümüzde 19 maddelik net bir yol haritası

Sıradaki 30 gün kritik. Bu planı takip edersek, 30 gün sonra Tedbirge.ai **Türkiye pazarında ciddi iddia sahibi** olur.

Planı takip etmezsek, rastgele özelliklere koşar, yorulur, dağılırız.

**Disiplin > hız. Doğru iş > çok iş.**

---

*— Mimar*
*21 Nisan 2026, 23:15*
*Ortağım Mehmet Dinç ile birlikte yazıldı*
