# TASK_QUEUE

═══════════════════════════════════════════════════════════════
  22 NISAN 2026 — YENI OTURUM ILK IS LISTESI
═══════════════════════════════════════════════════════════════

ACIL (sirayla):

[ ] 1. Backend /api/health endpoint ekle
      - SELECT 1 + JSON dondur
      - UptimeRobot backend monitor URL guncelle + unpause

[ ] 2. KVKK healthDataApproved DB kaydi
      - Prisma: Lead modeline healthDataApprovedAt DateTime? ekle
      - Migration + public-lead endpoint'inde kaydet

[ ] 3. /kvkk sayfasini modal icerigi ile senkronize et
      - Su an iki farkli metin var: /kvkk (eski) ve basvuru modal (yeni)
      - Veri isleyen adlari /kvkk sayfasina eklensin

[ ] 4. Vercel eski NEXT_PUBLIC_API_URL env var sil (1 dk)

UX BUGLARI:

[ ] 5. FOTOGRAF 4 MUAMMASI
      - Kullanicidan URL bilgisi al
      - Ikinci tasarim/sayfa mi, silinsin mi, birlesirilsin mi karar

[ ] 6. "Basvuru Sorgula" navbar butonu direkt yonlendirme
      - Su an: /basvuru-sorgula tiklaninca login sayfasi cikiyor
      - Cozum: direkt /basvuru-sorgula acilsin

RAPORLAR:

[ ] 7. Mimar v3 Muvekkil Girisi Fizibilitesi yazmaya baslayacak
      (Avukat anketi cevaplari gelince tam rapor olur)

═══════════════════════════════════════════════════════════════
KULLANICININ (MEHMET BEY'IN) KENDI HALLEDECEGI:
═══════════════════════════════════════════════════════════════

[ ] 8. Ramazan DURAN ile 30 dk gorusme (8 soruluk anket, v2 bolum 3)
[ ] 9. Zeliha ERSOY ile 30 dk gorusme (8 soruluk anket)
[ ] 10. Muzaffer TUMSA giris sonrasi geri bildirim
[ ] 11. VERBIS kayit durumu netlestir (hukuki)
[ ] 12. KVKK metni avukat onayi

URUN IYILESTIRME TALEPLERI (AVUKATLARDAN GELEN):

[ ] 13. SBM entegrasyonu (Sigorta Bilgi Merkezi)
[ ] 14. Malpraktis (tibbi kotu uygulama) dava turu eklenmeli
[ ] 15. Kaza Rekreasyon kesfedilebilirlik UI iyilestirmesi

═══════════════════════════════════════════════════════════════

[x] TAMAMLANDI — 21 NISAN SABAH
[ ] Vercel build hatasi (Suspense boundary) — COZULDU (commit 26ed40c)
[ ] Middleware public path fix — COZULDU (commit eb8221b)
[ ] AiChatWidget env var fix — COZULDU (commit 801d4d7)
[ ] Reset-password uctan uca test — GECTI

[x] TAMAMLANDI — 21 NISAN OGLEDEN SONRA + AKSAM ✓
[x] Avukat sizintisi guvenlik fix (2 commit, sabah + ogleden sonra)
[x] Middleware public path bug kapat (11 yeni path)
[x] Basvuru success ekrani yonlendirme duzelt
[x] Basvuru sorgula endpoint uyumsuzlugu duzelt
[x] KVKK UI iyilestirmesi (modal + ikinci checkbox)
[x] KVKK iframe → inline icerik (tarayici engeli cozumu)
[x] UptimeRobot panel monitor kuruldu
[x] Dependabot config dosyasi eklendi
[x] Hukukcu CRM Fizibilite v2 yazildi ve kaydedildi

═══════════════════════════════════════════════════════════════

## OS KURALLARI
- Sadece ACTIVE görev yürütülür
- TASK_QUEUE dışına çıkılamaz
- Görev kapanışı için zorunlu:
  - CHANGELOG
  - CURRENT_STATE
  - TASK_QUEUE güncellemesi
- Refactor yasak
- Çoklu değişiklik yasak
- Backup alınmadan EXECUTE yok
- Stabil sonuç sonrası snapshot zorunlu

## ACTIVE
1. Sosyal medya entegrasyonu / domain / deploy hazırlığı

## TODO
1. Avukat bilgisi maskeleme — assignments[].lawyer temsilciye sızıyor, GÜVENLİK AÇIĞI
0. [Faz 3] Panel ZMSS bloğunda maluliyet oranı input alanı — Mod A/B seçici, Sağlık Kurulu Raporu yüklenince otomatik hesap tetikle (compensation.engine.v2 bağlı)
2. TÜRKAN DİNÇ bolge='Konya' güncellemesi (dün yarım kaldı)
3. Müvekkil SMS onay akışı — Contract.musteriOnayladi/onayKodu DB'de hazır, endpoint ve SMS linki yok
4. Admin manuel avukat atama UI
5. Wizard UX iyileştirme: "Devam Et disabled" sebep tooltip'i
6. Supabase'de sözleşme hash+version+IP alanları doğrulaması (bugün yapılamadı)
7. İl/bölge listesi kararı (81 il mi, 7 bölge mi, ilçe mi? — karar verilmeden kodlanmayacak)
8. Avukat panelinde "Hakediş tetikle" butonu (Lead.hakEdisStatus HAK_EDILDI işaretleme)
9. Hakediş hesaplama servisi (KDV formülü için mali müşavir onayından sonra)
10. Admin şeffaflık paneli (hangi müvekkil hangi temsilciden geldi takibi, masraf/hakediş şeffaf)
11. Geçmişte kaydolmuş temsilcilerin v1.0 sözleşmesini yeniden onaylama mekanizması (eski %5 kayıtları için)
12. Mail altyapısı (domain Spaceship'te — büyük resim netleşene kadar ertelendi, DECISION_LOG 18 Nis kararı geçerli)
13. Kaza Rekonstrüksiyon: /analyze idempotency guard — status EVIDENCE_READY dışında çağrılırsa 409 Conflict dönsün; force=true query param ile override edilsin. (2026-04-18)
14. WhatsApp gerçek API — WHATSAPP_TOKEN + WHATSAPP_PHONE_ID env gir
15. SMTP şifre — SMTP_PASS ile Gmail App Password gir
16. Deploy — Vercel (panel) + Railway (backend) kurulumu
17. KVKK onay akışı — public-lead formuna rıza checkbox + Lead modeline kvkkConsentAt
18. SGK gerçek API — mock'u SGK e-Bildirge ile değiştir
19. UYAP gerçek API — mock'u UYAP API ile değiştir
20. Avukat eşleşme mantığı — lead scoring + otomatik atama
21. Google My Business entegrasyonu — yorum yönetimi
22. E-imza entegrasyonu (KEP / BTK onaylı)
23. Müvekkil mobil uygulaması
24. E-posta altyapısı ve tutarlılık (2026-04-18 sonrası):
    a) Mail sunucusu kur (Cloudflare Routing veya Zoho free plan)
    b) bilgi@tedbirge.ai çalışır hale getir
    c) Kod tabanındaki 6 adres referansını env-based yap
    d) Tüm adresler bilgi@'ya yönlendirilsin (kvkk@ muhtemelen ayrı kalmalı)
    e) Broşürlerdeki bilgi@tedbirge.ai gerçekten çalışsın

## DONE
- Temsilci dashboard + wizard (2026-04-19 öğleden sonra)
- Kullanıcılar tablosu UI durum bug düzeltmesi (2026-04-19 sabah)
- NetGSM SMS onay bildirimi (2026-04-19 sabah)
- Karar destek servisi (3 stub + 1 gerçek fonksiyon)
- Temsilci sözleşmesi v1.0 backend + frontend entegrasyonu (2026-04-19)
- DB şeması: User (sozlesme* 3 alan) + Lead (masraf/KDV/hakediş 6 alan) (2026-04-19)
- Yeni public endpoint: GET /api/contracts/temsilci/current (2026-04-19)
- Komisyon default 5 -> 50 (sözleşmeye uyum) (2026-04-19)
- Sözleşme hash + version + IP DB kaydı (2026-04-19)
- Belge motoru kalite düzeltmesi (2026-04-10)
- Vekalet template düzeltme (2026-04-10)
- Sözleşme AI entegrasyonu — claude-sonnet-4-6 (2026-04-15)
- Türkçe karakter mojibake düzeltmeleri (2026-04-15)
- Kullanıcı yönetimi — ADMIN only kayıt (2026-04-15)
- PDF endpoint — pdfkit (2026-04-15)
- Müvekkil self-servis portalı (2026-04-15)
- UYAP mock entegrasyonu (2026-04-15)
- SMS Netgsm mock + e-posta Nodemailer mock (2026-04-15)
- WhatsApp Business API mock (2026-04-15)
- Public ana sayfa + tazminat hesaplama + haberler (2026-04-15)
- AI Chat Widget (2026-04-15)
- Renk sistemi: #1E1E8E / #5CB85C (2026-04-15)
- Logo entegrasyonu (2026-04-15)
- Zamanaşımı cron job — node-cron (2026-04-15)
- Sosyal kanıt sayfası (referanslar) (2026-04-15)
- Avukat performans analytics (2026-04-15)
- SGK mock servisi (2026-04-15)
- Gereksiz backup klasörleri temizlendi (2026-04-15)
- TEDBIRGE OS senkronize edildi (2026-04-15)

## COMMIT BEKLEYEN BİRİKMİŞ İŞLER (2026-04-20 itibarıyla)

Aşağıdaki gruplar kodda tamamlandı ancak henüz commit edilmedi.
Her grup bağımsız bir commit olarak atılmalı.

### 1. 2FA + Kullanıcı Kabul Akışı
Dosyalar: src/controllers/auth.controller.js, src/services/auth.service.js, prisma/schema.prisma
Test edildi mi: Kısmi (login akışı test edildi, 2FA QR kodu tarayıcıda doğrulanmadı)
Commit mesajı: `feat: add TOTP 2FA and terms acceptance flow for LAWYER role`

### ~~2. Sözleşme Modülü~~ — COMMITTED c545f19
Dosyalar: src/controllers/contract.controller.js, src/routes/contract.routes.js, src/templates/contracts/temsilci-contract.template.js
Commit: `feat: contract generation with AI mode and PDF download`

### 3. Kaza Rekonstrüksiyon
Dosyalar: src/controllers/accidentCase.controller.js, src/routes/accidentCase.routes.js, src/services/kazaRekonstruksiyon.service.js
Test edildi mi: Hayır (panel UI bağlantısı test edilmedi, 401/500 bloğu açık)
Commit mesajı: `feat: accident reconstruction service and routes (WIP)`

### ~~4. Karar Destek Motoru~~ — COMMITTED 3062888 + 82ced92
Dosyalar: src/services/decision-support.service.js, src/routes/decision-support.routes.js, src/routes/index.js (mount)
Not: index.js mount'u artık temiz — accident-cases ayrı commit bekliyor (Grup #3 testi sonrası)
Commit: `feat(decision-support): integrate compensation engine` + `feat(routes): mount decision-support endpoints`

### ~~5. SMS Onay Bildirimi~~ — COMMITTED 9dc080a
Dosyalar: src/controllers/onay.controller.js, src/services/sms.service.js
Commit: `feat: send NetGSM SMS on temsilci approval`

### 6. Docker Hazırlığı
Dosyalar: .dockerignore, Dockerfile
Test edildi mi: Hayır (build denenmedi)
Commit mesajı: `chore: add Dockerfile and .dockerignore for production deploy`

### ~~7. Lead / Route Çeşitli Güncellemeler~~ — COMMITTED 9bfd3ee
Dosyalar: src/controllers/lead.controller.js (commit edildi)
Not: lead.routes.js'deki tek yeni satır accident-cases rotası (Grup #3) — henüz commit edilmedi
Commit: `feat(lead): add GDPR delete, UYAP, SGK, emsal, kaza raporu endpoints`

### ~~8. Config / Meta~~ — COMMITTED da15ab0
Dosyalar: .gitignore, CLAUDE.md, package.json, package-lock.json, tedbirge-os/CURRENT_STATE.md
Commit: `chore: update gitignore, deps, and project metadata`

## Karar Destek Motoru Olgunlaştırma (sonraki fazda)

- ~~estimateTazminat() — ölü kod~~ — TAMAMLANDI: compensation.engine.js ile entegre edildi, POST /api/decision-support/tazminat aktif (2026-04-20)
- il-uyumu "enYakinIl: Konya" hardcoded — gerçek mesafe/bölge hesabı yok.
  Karar: 81 il listesi + bölge eşleşmesi ekle (TASK_QUEUE #7 il/bölge kararından sonra).

### compensation.engine.js analizi (2026-04-20)

**1. Export'lar ve imzalar**
- `safeTest()` → `{ status, version }` — health check, parametresiz
- `calculateCompensationEngine(input)` → tam tazminat raporu
  - Input: `{ lead: { age, monthlyIncome, gender }, text: string }`
  - Output: `{ documentType, caseType, extractedEntities, faultAssessment, maluliyetEstimate, actuarial, compensation, missingDocuments, legalRisk, professionalSummary }`

**2. Formül mantığı**
- Belge tipi tespiti: regex (trafik/iş kazası/tıbbi)
- Yaş, gelir, maluliyet: OCR text'ten regex + lead verisine fallback
- Kusur oranı: KTK m.51 (trafik), TBK m.52 (iş kazası — işçi/işveren ayrımı)
- Aktüeryal: aktif dönem 60 yaşa, pasif dönem 72 yaşa kadar, %10 sabit iskonto
- Brüt = aktüeryal + tedavi + araç + değer kaybı + destekten yoksun kalma
- Net = brüt × (1 − kusur oranı)
- Manevi tazminat: kaza tipine göre base (ölüm 250K, yaralanma 120K, diğer 75K) + ağırlık çarpanları
- Tazminat aralığı: min ×0.85, max ×1.20

**3. estimateTazminat() entegrasyon planı — ~10 satır değişiklik**
```
// decision-support.service.js'e ekle:
const { calculateCompensationEngine } = require("./compensation.engine");

function estimateTazminat(leadData, documentText = "") {
  const result = calculateCompensationEngine({ lead: leadData, text: documentText });
  return {
    min: result.compensation.estimatedCompensationRange.min,
    max: result.compensation.estimatedCompensationRange.max,
    guven: result.legalRisk.fileStrengthLevel,  // LOW | MEDIUM | HIGH
    not: result.professionalSummary,
    detail: result.compensation,
  };
}
```
3 adım: (1) import ekle, (2) fonksiyon gövdesini değiştir, (3) endpoint'e documentText parametresi ilet.

**4. Türk hukuku açısından eksikler**
- ZMSS limiti yok — 2026 limitleri uygulanmıyor (yaralanma 924K TL, ölüm 1.540M TL)
- PMF sabit %10 iskonto — Yargıtay değişken PMF metodolojisi değil
- SGK rücu kesintisi yok — maluliyet tazminatından SGK ödediği düşülmeli
- Destekten yoksun kalmada eş/çocuk/anne-baba pay ayrımı yok (tek %70 sabit)
- Geçici iş göremezlik (istirahat günlüğü) hesabı yok
- TBK m.76 denkleştirme (sigorta ödemesi mahsubu) yok
- Tüm bu eksikler için gerçek dava verileriyle kalibrasyon + avukat onayı gerekli

## Panel Geliştirme — Kullanıcı Notları (2026-04-20 gece)

### 1. Emsal Yargıtay Kararları
- Şu an: liste boş, placeholder var, "Aç" butonu çalışmıyor
- İstenen: Güncel Yargıtay kararları otomatik gelsin, "Aç" butonu kararı tam metniyle açsın
- Not: Yargıtay emsal karar kaynağı ne olacak — Lexpera, Jurix, manual scraper?
  Karar sonraki oturumda. Mimari seçim yapılmadan kodlanmayacak.

### 2. Kaza Rekreasyon Raporu → "ZMSS & Tazminat Hesapla"
- Şu an: "Kaza Rekreasyon Raporu" başlıklı boş bölüm
- İstenen: Başlığı "ZMSS & Tazminat Hesapla" olarak değiştir
  Fonksiyon: compensation.engine + SGK/UYAP verileri birleşik tam tazminat raporu:
    SGK'daki gelir + UYAP'taki durum + maluliyet → net tazminat + ZMSS limit uyarısı + avukat payı tahmini

### 3. Kaza Rekonstrüksiyon (20 yıllık hayal)
- Şu an: "Yeni Vaka Aç" butonu var, modül boş (Grup #3 test edilmedi)
- İstenen: Delil dosyaları (fotoğraf, tutanak, rapor) yüklenince AI destekli kaza analizi:
  olgusal tespitler, yasal çerçeve, bilirkişi notları, PDF rapor
- Not: Mehmet Bey'in 20 yıllık vizyonu. Ayrı oturumda mimari tasarım:
  multimodal AI, görüntü analizi, Avukatlık Kanunu çerçevesi.
  ŞİMDİLİK DOKUNMA — önce Grup #3 testi yapılacak.

### 4. Malpraktis (Tıbbi Hata) Modülü — YENİ
- Şu an: yok
- İstenen: Trafik kazası paralelinde tıbbi hata davaları için kusur ve tazminat modülü
- Mimari gereksinim: Ayrı case type (lead.accidentType = "MALPRACTICE") + kendi:
  - Zamanaşımı: TBK m.146 genel 10 yıl / HMK hizmet sözleşmesi 5 yıl / sağlık mesleki sorumluluk özel hüküm
  - Kusur: hekim standart bakım, CVMK doktrini
  - Tazminat formülü: tedavi + manevi + kalıcı zarar
  - Eksik belge: hasta dosyası, konsey raporu, SGK kayıtları
  - Uyarılar: Yargıtay 13. HD içtihatları
- Not: Mimari tasarım sonraki oturumda. Şimdilik sadece iskelet madde.

### 5. SBM (Sigorta Bilgi Merkezi) Entegrasyonu — YENİ
- Şu an: yok. Panel'de SGK/UYAP var, SBM yok.
- İstenen: Lead oluşturulurken veya dosyaya girildiğinde SBM'den:
  - Kaza tutanağı çek (plaka + tarih ile)
  - Aracın ZMSS poliçesi, sigorta şirketi, poliçe no
  - Önceki hasar/tazminat kayıtları (mükerrerlik kontrolü)
  - Sürücü trafik sicil bilgisi
- Mimari konumu: architecture/ACTORS.md'de SBM "Provider" aktörü —
  Tedbirge veri tüketicisi.
- Kritik nokta: SBM'ye erişim TOBB/SBM üyeliği ile sınırlı. Üyelik
  yoksa başlangıçta mock + manuel giriş, sonra gerçek entegrasyon.
- Önerilen dizin: src/integrations/sbm/sbm.adapter.js
- Öncelik: YÜKSEK. Trafik kazası omurga verisi. UYAP'tan ÖNCE gelmeli
  çünkü UYAP dava sonrası, SBM dava öncesi veri kaynağı.
- Not: Mimari tasarım sonraki oturumda. Şimdilik sadece iskelet madde.
