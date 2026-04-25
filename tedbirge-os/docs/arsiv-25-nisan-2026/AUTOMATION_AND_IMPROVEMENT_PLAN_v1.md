# TEDBİRGE.AI — OTOMASYON VE İYİLEŞTİRME PLANI v1

**Tarih:** 21 Nisan 2026, 06:45
**Hazırlayan:** Mimar
**Versiyon:** v1 (yüzeysel) — v2 derinlemesine fizibilite yarın gündüz yapılacak

---

## 0. ÖNEMLİ ÖNSÖZ — BU DOKÜMAN NE DEĞİL

Bu doküman **yol haritasıdır**, **uygulama kılavuzu değildir**. İçindeki hiçbir şey onaylanmadan koda dokunulmayacak. "Bunu yap" demeden hiçbir deploy olmayacak.

Ayrıca: Tedbirge.ai'yi "dünyada eşi benzeri olmayan" yapmak bir gecede olmaz. Ama sistematik, disiplinli bir yol haritası ile 3-6 ay içinde **Türkiye'deki en iyi hukuki lead yönetim + AI asistan sistemi** olabilir. Bu doküman o yolculuğun planıdır.

---

## 1. MEVCUT DURUM (21 Nisan 2026 itibariyle)

### Güçlü yanlar
- Backend canlı, 23 route grubu (auth, leads, contracts, analytics, maluliyet, lexscan...) aktif
- Panel canlı: 3 rol (admin/temsilci/hukukçu) + müvekkil self-servis portalı
- 36 sayfa mevcut: başvuru, sorgula, dashboard, leads, sözleşme, ödeme
- LexScan çalışıyor (temel seviye)
- Şifre sıfırlama uçtan uca çalışıyor
- PayTR, WhatsApp webhook, AI chat entegrasyonları var

### Bilinen boşluklar
- Müvekkil giriş akışı henüz **hiç test edilmemiş** (kullanıcı sözüdür)
- Hukukçu CRM'i kullanıcı değerlendirmesi yapılmamış
- Güvenlik sertleştirmesi eksik (2FA zorunlu değil, audit log seviyesi bilinmiyor)
- İzleme/monitoring yok (site düşerse kim öğrenecek?)
- Dependency güncelleme otomasyonu yok
- LexScan "akıllı" değil — satış hunisine yönlendiren basit bot
- Eskalasyon kanalı yok (LexScan bilmediğinde ne olur?)

---

## 2. OTOMASYON KATMANI — BU HAFTA KURULACAKLAR

Amaç: Sen uyurken/sahadayken sistem kendi kendine sağlığını kontrol etsin, sorun olursa seni uyandırsın.

### 2.1 UptimeRobot (10 dakika, ÜCRETSİZ, gece kurulabilir)

**Ne yapar:** www.tedbirge.ai ve tedbirge-ai.onrender.com'u her 5 dakikada ping atar. Düşerse sana mail/SMS/WhatsApp bildirimi gönderir.

**Neden kritik:** Render ücretsiz planı 15 dakika trafik yoksa uyuyor. İlk kullanıcının ilk isteği 30 saniye bekliyor — kayıp müşteri. UptimeRobot'un 5 dakikada bir ping'i hem uyumasını engeller hem de gerçek down durumunu yakalar.

**Kurulum adımları:**
1. https://uptimerobot.com → Sign Up (ücretsiz hesap, 50 monitor)
2. Add New Monitor → HTTP(s)
3. Friendly Name: "Tedbirge Panel"
4. URL: `https://www.tedbirge.ai`
5. Monitoring Interval: 5 minutes
6. Alert Contact: senin mail adresin
7. Create Monitor
8. Aynısını tekrarla: Friendly Name: "Tedbirge Backend", URL: `https://tedbirge-ai.onrender.com/api/health` (eğer health endpoint yoksa `/` de olur)

**Risk:** Yok. Dışarıdan okuma yapıyor, sistemine dokunmuyor.

### 2.2 Dependabot (5 dakika, ÜCRETSİZ, GitHub yerleşik)

**Ne yapar:** package.json'daki güvenlik açığı olan paketler için otomatik Pull Request açar. Sen sabah GitHub'a girdiğinde "Dependabot şunu güncellemek istiyor" PR'larını görürsün, okuyup merge edersin (veya reddedersin).

**Neden kritik:** 23 Nisan 2026 itibariyle Node ekosisteminde haftalık ortalama 15-20 güvenlik açığı açıklanıyor. Manuel takip imkânsız.

**Kurulum:** `.github/dependabot.yml` dosyası ekle (kod aşağıda, Claude Code uygular).

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
  - package-ecosystem: "npm"
    directory: "/tedbirge-panel"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "monthly"
```

**Risk:** Düşük. PR açılıyor, otomatik merge olmuyor. Sen karar veriyorsun.

### 2.3 GitHub Actions — npm audit cron (yarın gündüz, 30 dakika)

**Ne yapar:** Her gece 03:00 TR saatinde `npm audit` çalıştırır. Yüksek/kritik açık bulursa GitHub Issue açar, sen sabah görürsün.

**Neden kritik:** Dependabot sadece güncelleme önerir; npm audit ise açıkları raporlar. İkisi birbirini tamamlar.

**Dosya:** `.github/workflows/security-audit.yml`

```yaml
name: Security Audit
on:
  schedule:
    - cron: '0 0 * * *'  # UTC 00:00 = TR 03:00
  workflow_dispatch:      # manuel tetikleme de mümkün

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Backend audit
        run: npm audit --audit-level=high
        continue-on-error: true
      - name: Panel audit
        working-directory: ./tedbirge-panel
        run: npm audit --audit-level=high
        continue-on-error: true
      - name: Create issue on failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `🚨 Security audit failed - ${new Date().toISOString().split('T')[0]}`,
              body: 'npm audit yüksek/kritik seviye açık buldu. Detay için workflow log'a bak.',
              labels: ['security', 'automated']
            })
```

**Risk:** Düşük. Sadece okuma + issue açma.

### 2.4 Supabase Heartbeat (yarın gündüz, 30 dakika)

**Ne yapar:** Supabase ücretsiz planı 7 gün inaktif olursa database pause ediyor. Her 6 günde bir basit bir SELECT sorgusu atarak pause'lanmayı engelliyoruz.

**Not:** TASK_QUEUE'da zaten yazılı. Çözüm için iki yol var:
- GitHub Actions cron (ücretsiz, kolay)
- Render cron job (backend'de zaten var)

**Önerilen:** GitHub Actions. Backend'e yeni kod eklemek yerine izole çalışır.

**Dosya:** `.github/workflows/supabase-heartbeat.yml`

```yaml
name: Supabase Heartbeat
on:
  schedule:
    - cron: '0 2 */6 * *'  # 6 günde bir
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping backend
        run: |
          curl -f https://tedbirge-ai.onrender.com/api/health || exit 1
      - name: Ping health-check endpoint (DB query)
        run: |
          curl -f https://tedbirge-ai.onrender.com/api/health/db || exit 1
```

**Not:** `/api/health/db` endpoint'i yoksa yeni yapılacak (basit bir `SELECT 1` yapan endpoint). Yarın konuşuruz.

**Risk:** Yok.

---

## 3. MÜVEKKİL GİRİŞİ FİZİBİLİTESİ

### 3.1 Mevcut durum (dosya ağacından)

Müvekkil tarafında şu sayfalar var:
- `/basvuru` — 4 adımlı başvuru formu
- `/basvuru-sorgula` — telefon + kod ile başvuru sorgulama
- `/devam-et` — başvuru devam linki
- `/tazminat-hesapla` — anonim hesaplama
- `/musteri` — giriş yapmış müvekkilin self-servis portalı

### 3.2 Kritik sorular (yarın kod okuyunca cevaplanacak)

**Onboarding akışı:**
- Müvekkil başvuru yapıp avukat ataması yapıldıktan sonra nasıl giriş yapıyor? Otomatik şifre mi gönderiliyor, SMS kodu mu, magic link mi?
- İlk giriş deneyimi nasıl? KVKK onayı, sözleşme onayı, kimlik doğrulama adımları hangi sırada?
- Şifre sıfırlama akışı müvekkil için çalışıyor mu? (Şu an sadece admin/temsilci/hukukçu için test edildi.)

**Müvekkil portalında (`/musteri`) ne var?**
- Dava durumu
- Belge yükleme
- Mesajlaşma
- Tahsilat/ödeme bilgisi
- Duruşma takvimi
- Bunların hepsi backend'den canlı veri mi, mock mu?

**KVKK uyumu:**
- Hangi veriler toplanıyor, neden? (Amaç sınırlılığı)
- Saklama süreleri tanımlı mı?
- Veri silme talebi akışı var mı? (GDPR + KVKK hakkı)
- Veri işleme envanteri var mı?

**Güvenlik:**
- Oturum süresi ne? (JWT expiry)
- Refresh token akışı nasıl?
- Rate limiting var mı (brute force'a karşı)?
- 2FA opsiyonel mi, zorunlu mı?

### 3.3 Tahmini iş kalemleri (gündüz detaylandırılacak)

Kod okumadan tahmini ama muhtemelen:

**Yüksek öncelik (bu hafta):**
- Uçtan uca müvekkil akışı canlı testi — başvuru → atama → SMS/mail → ilk giriş → portal
- İlk giriş deneyimi UX iyileştirmeleri (KVKK, sözleşme onayları kolay mı?)
- Şifre sıfırlama müvekkil için doğrulama

**Orta öncelik (bu ay):**
- Müvekkil belge yükleme akışı (güvenli, boyut limiti, virüs taraması)
- Müvekkil ↔ avukat mesajlaşma (realtime mi polling mi?)
- Push bildirim (dava durumu değişti, duruşma yaklaşıyor)

**Düşük öncelik (bu çeyrek):**
- Mobil PWA deneyimi
- WhatsApp bot ile durum sorgulama
- Müvekkil self-servis fatura/makbuz indirme

### 3.4 Ciddi risk alanları

**1. KVKK:** Hukuk bürosu kişisel verinin en hassas olanını tutuyor (sağlık, mali, adli). Veri sorumlusu beyannamesi VERBİS'e kayıtlı mı? Aydınlatma metni yeterli mi? Açık rıza doğru alınıyor mu? Bu bir yazılım sorusu değil, **hukuki + operasyonel** sorun. İhmal edilirse idari para cezası çok ağır.

**2. İçtihat/Yargıtay verisi:** Tazminat hesaplama için kullanılan içtihat güncel mi? Kaynak ne, lisanslı mı? (Yargıtay kararları kamu ama derleyici veritabanı telifli olabilir.)

**3. Sorumluluk:** Müvekkile verilen tazminat tahmini yanlış çıkarsa kim sorumlu? Disclaimers yeterli mi? Avukatın imzaladığı sözleşme bu riski kapsıyor mu?

---

## 4. HUKUKÇU (CRM) FİZİBİLİTESİ

### 4.1 Mevcut durum (dosya ağacından)

Hukukçu / admin tarafında zengin bir panel var:
- **Dashboard:** Ana panel, rol bazlı (admin/temsilci/hukukçu farklı görüyor)
- **Leads:** Kanban + tablo, filtre, 5 sekmeli detay (360, chat, contracts, ödeme)
- **Contracts:** Sözleşme oluştur + PDF + düzenle
- **Petitions:** Dilekçe (ihtarname, dava dilekçesi)
- **Hukuk modülü:** İhtarname, duruşma, bilirkişi, masraf takibi
- **Analytics:** Funnel, gelir, avukat performansı
- **AI Chat:** Lead başına AI asistan
- **Ajanda:** Günlük ajanda (hukukçu için)
- **Takvim:** Duruşma takvimi
- **Maluliyet hesaplama modülü**
- **Atama (assignment) modülü**
- **İletişim merkezi**

Bu sayfa sayısı ve modül çeşitliliği ciddi bir yazılım — basit bir CRUD değil.

### 4.2 Kritik sorular (yarın kod okuyunca)

**Kullanılabilirlik:**
- Hukukçu günlük akışı: "Sabah girdim, ne görmeliyim?" — ajanda mı, lead listesi mi, iletişim merkezi mi?
- Hızlı erişim: En çok yapılan 3 işlem tek tıkla ulaşılıyor mu? (Yeni lead, not ekle, belge yükle?)
- Arama: Global arama var mı? (Müvekkil adı, TC, dosya no)

**Bildirim/uyarı sistemi:**
- Duruşma yaklaşırken uyarı var mı? (24 saat önce, 1 hafta önce)
- Yeni lead atandığında hukukçuya nasıl haber gidiyor? (Mail, push, SMS?)
- Müvekkil mesaj attığında hukukçu bildirim alıyor mu?

**Raporlama:**
- Hukukçu kendi performansını görüyor mu? (Aktif dava, kazanılan/kaybedilen, tahsilat)
- Admin tüm hukukçuları kıyaslayabiliyor mu?
- Aylık rapor otomatik üretiliyor mu?

**Veri giriş kolaylığı:**
- Dilekçe/sözleşme şablonları var mı? Kaç tane?
- Standart maddeler tek tıkla ekleniyor mu?
- Otomatik doldurma (müvekkil bilgileri → belge) çalışıyor mu?

**Entegrasyonlar:**
- UYAP entegrasyonu var mı? (Hukukçu için hayat kurtarıcı)
- Banka POS / PayTR entegrasyonu sorunsuz mu?
- E-imza (E-devlet) desteği var mı?

### 4.3 Tahmini iş kalemleri

**Yüksek öncelik (bu hafta/hafta sonu):**
- Hukukçu gerçek kullanım simülasyonu (Ramazan + Muzaffer hesapları aktif, senin gözlemin)
- Hızlı win'ler: eksik filtreler, zor bulunan butonlar, kafa karıştırıcı ekranlar
- Kritik uyarı sistemi (duruşma, vade sonu)

**Orta öncelik (bu ay):**
- Dilekçe/sözleşme şablon kütüphanesi genişletme
- Otomatik doldurma iyileştirmeleri
- Hukukçu performans dashboard'u
- Mobil hukukçu deneyimi (duruşma çıkışı not alma)

**Düşük öncelik (bu çeyrek):**
- UYAP entegrasyonu (bu büyük iş, ayrı proje)
- E-imza entegrasyonu
- Takım içi mesajlaşma (birden fazla hukukçu varsa)
- Takvim senkronizasyonu (Google Calendar, Outlook)

### 4.4 Risk alanları

**1. Hukukçu alışkanlıkları:** Hukukçular muhafazakar kullanıcıdır. Word + Excel + fotokopi ile çalışmaya alışıklar. Panel onların iş akışını **kolaylaştırmalı**, yeni bir öğrenme yükü olmamalı. Aksi halde "eski sistemim daha iyiydi" derler.

**2. Veri taşıma:** Mevcut bir hukuk bürosu Tedbirge'ye geçerken eski davalarını nasıl aktaracak? Import aracı var mı? Yoksa manuel giriş yapacak — bu büyük bir sürtünme.

**3. Offline kullanım:** Adliye koridorunda internet zayıf. Hukukçu not almak isterse ne olacak? PWA offline modu?

---

## 5. LEXSCAN AKILLANDIRMA + ESKALASYON MİMARİSİ

### 5.1 Senin fikrin (özetle)

> "LexScan cevap veremediğinde 'sizi Mehmet Bey'e bağlayayım mı?' desin."

Bu **doğru ve değerli** bir fikir. Profesyonel, kurumsal, müşteriyi kaybetmeden sıcak devralma. Amazon, Zendesk gibi ciddi şirketlerin kullandığı pattern.

### 5.2 Mimari tasarım

**Katman 1 — LexScan kendi başına:**
- Sistem prompt'u daha iyi yazılır (hukuki tonlama, Türkçe terimler, KVKK uyumlu)
- Konuşma geçmişi hatırlar (zaten yapıyor, iyileştirilebilir)
- Tazminat hesaplama, başvuru yönlendirme, SSS yanıtlama

**Katman 2 — Confidence scoring:**
- LexScan her yanıtında kendi güven skorunu tahmin eder (Claude'a "1-10 arası emin misin?" diye sorulur)
- Eşik altı (örn. <7) → eskalasyon tetiklenir

**Katman 3 — Eskalasyon akışı:**

```
Kullanıcı: "Babam vefat etti, trafik kazasında. Ablam manevi tazminat istemiyor 
          ama ben istiyorum. Nasıl ayrı dava açabiliriz?"

LexScan (confidence: 4/10):
"Bu sorunuz yasal miras + usul + maddi/manevi tazminat üçgeninde uzman değerlendirme 
gerektiriyor. Size yanlış bilgi vermeyi istemem. 

İki seçeneğiniz var:
  1) Kıdemli hukuk danışmanımız Mehmet Bey'e şimdi bağlanayım — 
     genellikle 5-10 dakika içinde cevap verir (Pzt-Cuma 09:00-18:00).
  2) 'Ücretsiz ön değerlendirme formu'nu doldurun, en geç 24 saat 
     içinde size özel dönüş yapalım.

Hangisini tercih edersiniz?"
```

**Katman 4 — Backend eskalasyon motoru:**

```
Tetikleyici olaylar:
  - Confidence < eşik
  - Kullanıcı "insanla konuşmak istiyorum" diyor
  - Kullanıcı 3+ kez aynı soruyu tekrar soruyor (frustrasyon sinyali)
  - Hukuki karmaşıklık anahtar kelimeleri (miras, ceza, velayet)

Aksiyon:
  1) Admin paneline yeni "eskalasyon" notification düş
  2) Mehmet Bey'e (veya nöbetçi avukata) WhatsApp/push/mail bildirim
  3) Lead otomatik oluştur (konuşma geçmişi ile)
  4) Kullanıcıya "beklemeye aldık" mesajı
  5) Müsait değilse: otomatik form + 24 saat taahhüt
```

**Katman 5 — Operasyonel:**
- Nöbet sistemi (haftalık Mehmet → Ahmet → Ayşe)
- Mesai saati tanımı (hafta içi 09-18, hafta sonu 10-14 gibi)
- Yanıt SLA'sı ölçümü (bildirim atıldı → cevap geldi)
- Kullanıcı memnuniyet anketi (eskalasyon sonrası)

### 5.3 Teknik gereksinimler

**Yeni backend endpoint'ler:**
- `POST /api/lexscan/escalate` — eskalasyon tetikle
- `GET /api/lexscan/on-duty` — şu an nöbetçi kim
- `POST /api/lexscan/take-over` — avukat eskalasyonu üstlenir

**Yeni DB tabloları:**
- `escalations` (id, conversation_id, reason, status, assigned_to, response_time)
- `duty_schedule` (lawyer_id, start, end, availability)
- `lexscan_conversations` (mevcut mu, yoksa eklenecek)

**Bildirim kanalları:**
- WhatsApp Business API (en hızlı)
- Web push (panel açıksa)
- Mail (backup)

### 5.4 Ne kadar sürer

Doğru yaptığımızda:
- MVP (confidence + temel eskalasyon + WhatsApp bildirim): **1 hafta**
- Nöbet sistemi + SLA ölçümü: **+3-4 gün**
- Kullanıcı memnuniyet ölçümü: **+2 gün**
- Toplam: **~2 hafta odaklı çalışma**

Aceleyle "sahte akıllı" yapmak yerine, gerçekten işe yarayan bir sistem için bu süre makul.

---

## 6. GÜVENLİK + KVKK BOŞLUK ANALİZİ (Yüzeysel)

Kod okumadan tahmini boşluklar. Yarın derinlemesine bakacağız.

### 6.1 Kimlik doğrulama
- [ ] 2FA tüm roller için zorunlu mu? (Şu an opsiyonel sanırım)
- [ ] Şifre politikası (uzunluk, karmaşıklık, tekrar kullanım yasağı)?
- [ ] Brute-force koruması (rate limit, CAPTCHA)?
- [ ] Oturum yönetimi (concurrent session limit, idle timeout)?

### 6.2 Yetki yönetimi (Authorization)
- [ ] RBAC (role-based) uygulanıyor mu, doğru uygulanıyor mu?
- [ ] Bir temsilci başka temsilcinin lead'ini görebiliyor mu? Görmemeli.
- [ ] Bir müvekkil başka müvekkilin davasını görebiliyor mu? Kesinlikle görmemeli.
- [ ] API endpoint'leri yetki kontrolü tutarlı mı? (Örn: `GET /leads/123` — sadece sahip/atanan görür)

### 6.3 Veri güvenliği
- [ ] At-rest encryption (veritabanı)?
- [ ] In-transit encryption (HTTPS) — evet, Let's Encrypt var
- [ ] Hassas veri (TC no, sağlık) özel şifreleme?
- [ ] Belge yükleme: virüs taraması? Dosya tipi validasyonu? Boyut limiti?
- [ ] Backup stratejisi? (Supabase otomatik backup var ama retention?)

### 6.4 Log & audit
- [ ] Kritik işlemler (login, şifre değiştirme, veri silme) loglanıyor mu?
- [ ] Kim ne zaman ne yaptı izlenebiliyor mu?
- [ ] Log retention + rotation?
- [ ] PII loglarda temizleniyor mu? (Log'da şifre görünmemeli)

### 6.5 KVKK uyumu
- [ ] VERBİS kaydı yapıldı mı?
- [ ] Aydınlatma metni yeterli mi?
- [ ] Açık rıza akışı (özellikle hassas veri için) doğru mu?
- [ ] Kişisel veri işleme envanteri var mı?
- [ ] Veri işleyen sözleşmeleri (Supabase, Vercel, Render) imzalı mı?
- [ ] Veri silme talebi akışı? (Kullanıcı "verimi sil" dediğinde ne olur?)
- [ ] Veri ihlali bildirim prosedürü? (72 saat içinde KVK Kurumu'na)

### 6.6 Üçüncü parti entegrasyonlar
- [ ] Anthropic API (LexScan) — veri paylaşımı KVKK aydınlatmada var mı?
- [ ] PayTR — PCI DSS uyumu onların sorumluluğunda ama entegrasyon doğru mu?
- [ ] WhatsApp — Meta veri paylaşımı bildiriliyor mu?

---

## 7. YAPMAMAMIZ GEREKEN ŞEYLER (TUZAKLAR)

Bu bölüm çok önemli — en çok hata buralarda yapılır.

### 7.1 Hype'a kapılıp "süper AI ajanı" yazmak
- LangChain/LangGraph/AutoGPT ile "otonom avukat" yapmaya kalkmak → 3 ay kaybederiz, çıkan şey işe yaramaz
- Kullanıcı "Claude/ChatGPT gibi olsun" der — olamaz, o tek tek firmalar milyar dolar harcıyor
- **Yapılacak:** Net, dar, işe yarayan AI özellikleri. LexScan'i Mehmet Bey'e bağlamak > LexScan'i Harvey.ai yapmaya çalışmak

### 7.2 Altyapıya gereksiz yatırım
- Kubernetes, mikroservis, Redis cluster, Elasticsearch → şu an **gerek yok**
- Render + Vercel + Supabase üçlüsü 10K aktif kullanıcıya kadar yeter
- **Yapılacak:** Kullanıcı sayısı artınca ölçek sorununu çöz. Şimdiden çözme.

### 7.3 Özellik şişirme
- "Şu da olsa, bu da olsa" → 100 eksik özellikli sistem, 1'i bile iyi çalışmayan
- **Yapılacak:** Her sprint 2-3 özelliği **hakkıyla** bitir. Diğerlerini **yazılı olarak** ertele (backlog).

### 7.4 Test ve staging olmadan canlıya
- Biz şu an bunu yapıyoruz. Devam ederse büyük bir patlama olacak.
- **Yapılacak:** Staging ortamı (ücretsiz Vercel preview + Render free tier). Her PR staging'te test edilsin, sonra master'a.

### 7.5 "Dünyada eşi olmayan" retorik tuzağı
- Bu cümle tasarımı zehirler. Gerçek kullanıcı ihtiyacından koparır, göstermelik özelliklere götürür.
- **Yapılacak:** Hedef — "Türkiye'de trafik/iş kazası davalarında hukukçu ve müvekkilin 1 numaralı dijital asistanı." Net, ölçülebilir, ulaşılabilir.

### 7.6 Gece/yorgun kafayla önemli karar
- Bu gece 06:00'da neredeyse Vercel env var'ı yanlış değere çeviriyorduk. Şanslıydık.
- **Yapılacak:** Saat 23:00'ten sonra sadece **bozuk bir şey acil olmadıkça** deploy yok. Yeni özellik kesinlikle yok.

---

## 8. ÖNCELİK SIRASI — NE ZAMAN NE YAPILACAK

### Bu gece (22 Nisan 04:00-07:00 arası)
**SADECE:** Bu dokümanı oku + yorum ver + uyu. Kod yok.

### Yarın gündüz (22 Nisan öğleden sonra)
1. UptimeRobot kur (10 dk, tarayıcıda, kod yok)
2. Dependabot YAML'ını ekle (5 dk, Claude Code yapacak)
3. Bu dokümanın v2'si için Claude Code'dan kod okuma komutları hazırla
4. Müvekkil girişi uçtan uca canlı test (sen, gerçek akış)
5. Hukukçu paneli gezisi (Ramazan + Muzaffer'e verilmeden önce sen hissini al)

### Bu hafta
1. npm audit cron + Supabase heartbeat (GitHub Actions)
2. Müvekkil akışı tespit edilen kritik bug/UX sorunları
3. LexScan confidence scoring prototip (tek feature, izole)

### Bu ay
1. LexScan eskalasyon mimarisi (Mehmet Bey'e bağlanma)
2. 2FA zorunlu yap (tüm roller)
3. Audit log sertleştirme
4. Hukukçu dashboard iyileştirmeleri
5. KVKK boşluk kapatma

### Bu çeyrek (Haziran sonuna kadar)
1. UYAP entegrasyonu araştırması (ayrı proje)
2. Mobil deneyim (PWA + native düşünülebilir)
3. Hukuki bilgi tabanı / RAG (LexScan için)
4. Gelişmiş analitik (cohort, LTV, CAC)

---

## 9. DOKÜMANIN v2 PLANI

Yarın gündüz, taze kafayla, şu dosyaların içini okuyarak detaylandıracağım:

1. `app/(public)/basvuru/page.tsx` — müvekkil başvuru akışı
2. `app/(panel)/musteri/page.tsx` — müvekkil portalı
3. `app/(panel)/dashboard/page.tsx` — ana dashboard
4. `app/(panel)/leads/page.tsx` + `[id]/page.tsx` — lead yönetimi
5. `src/routes/auth.routes.js` — kimlik doğrulama akışı
6. `src/routes/musteri.routes.js` — müvekkil endpoint'leri
7. `src/routes/lexscan.routes.js` + controller — LexScan mevcut davranışı
8. `src/middleware/` — yetki kontrolü

Her biri için v1'deki "kritik sorular" listesi cevaplanacak, somut iş kalemleri çıkarılacak.

---

## 10. KARAR NOKTALARI — SENİN ONAYIN LAZIM

Aşağıdaki sorulara cevap verirsen, plan somutlaşır:

1. **UptimeRobot + Dependabot bu gece kurulsun mu?** (Risk: yok. Fayda: hemen)
2. **npm audit + Supabase heartbeat yarın yapılsın mı?** (Risk: yok.)
3. **LexScan eskalasyonu Mehmet Bey'e mi gidecek, senin WhatsApp'ına mı?** (Başlangıçta senin WhatsApp'ın daha mantıklı, Mehmet Bey hazır olana kadar)
4. **2FA zorunlu hale getirelim mi, yoksa opsiyonel mi kalsın?** (Güvenlik vs. kullanıcı sürtünme)
5. **Staging ortamı kurulsun mu?** (Ücretsiz ama ek iş. Şu an canlıya direk push yapıyoruz.)
6. **KVKK/VERBİS durumu nedir?** (Bu senin hukuki tarafta cevaplaman gereken bir soru, benim değil)

---

## SONUÇ

Tedbirge.ai **iyi bir noktada** — 36 sayfa, 23 API grubu, 3 rol, canlıda çalışan sistem. Eksiklerimiz var ama bunlar "sistem bozuk" değil, "sistem olgunlaşmamış" eksikleri. 3-6 aylık disiplinli çalışma ile Türkiye'de lider olabiliriz.

Bu doküman v1'dir. v2 yarın gündüz hazır olacak.

**Son not:** Sen uyu. Ben de (metaforik olarak) uyuyorum — bir sonraki mesajı attığında yeniden buradayım, gün saati ne olursa olsun.

---

*— Mimar*
*21 Nisan 2026, 07:00*
