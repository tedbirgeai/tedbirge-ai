# 📋 TEDBİRGE.AI — İŞ PLANI (AKTİF KESİT)

**Son güncelleme:** 12 Mayıs 2026 Salı (TUR #115)
**Anayasa:** v1.30.0 MINOR (Madde 30.65 + 30.66 + 30.67 + 30.68 + 30.69 + 30.70)
**Aktif rekor:** 29 ardışık temiz TUR (#90 → #115)

---

## 🎯 NOW — TUR #115 KAPALI ✅ (Kartvizit Adres + Yetki Türkçe + Sidebar RBAC Dinamik)

**Saha kanıt:** Emine ÇELİK saha zincirinin #3 bulgusu — 3 saha sorunu uçtan uca çözüldü.

**5 atom:** Adres öncelik (A1) + Schema kontrol (A2 SARI TUR #116) + MODULE_LABELS Türkçe (A3) + Sidebar RBAC (A4) + Placeholder (A5)

**Madde 30.69 + 30.70 yeni** — Türkçe Lokalizasyon + RBAC Dinamik Sidebar

Backend 1.10.0→1.11.0, Panel 1.12.0→1.13.0, Anayasa v1.29.0→v1.30.0.

---

## ⏭️ NEXT — TUR #116 (SARI ENDIŞE çözümü)

**Öneri 1:** User.address + User.city schema teklifi + Profil sayfasında adres edit (TUR #115 SARI ENDIŞE çözümü)

**Öneri 2:** Premium kartvizit görsel iterasyon (TUR #112 plan)

**Öneri 3:** DRY refactor `components/kurumsal/KurumsalPage.tsx` (TUR #114 teknik borç)

---

## 🎯 ÖNCEKİ — TUR #114 KAPALI ✅ (REP Kurumsal Route + Admin Sözleşme Görünürlük)

**Saha kanıt zinciri:** Emine ÇELİK TUR #113'te sözleşme imzaladı (ilk REPRESENTATIVE milestone) → TUR #114 #2 bulgu: sidebar Kurumsal butonları çalışmıyor + ADMIN panel sözleşme listesi yok.

**Sonuç:** 6 atom uçtan uca uygulandı (DEFER 0), Madde 30.68 yeni (Rol Bazlı Route Scope), MH56 emsali.

### Ana değişiklikler
- `/temsilci/kurumsal/page.tsx` yeni — REP için Kurumsal sayfa
- AppLayout sidebar rol bazlı URL (REP→/temsilci, ADMIN/LAWYER/SALES→/dashboard)
- `GET /api/admin/sozlesmeler` + UI sayfa — ADMIN audit görünürlük
- Sidebar HUKUK section'a "Sözleşmeler" link

Backend 1.9.0→1.10.0, Panel 1.11.0→1.12.0, Anayasa v1.28.0→v1.29.0.

---

## 🎯 ÖNCEKİ — TUR #113 KAPALI ✅ (Temsilci Sözleşme SMS OTP — Emine ÇELİK Saha Acil)

**Saha kanıt:** Emine ÇELİK (gerçek REPRESENTATIVE) `/temsilci/sozlesme` "SMS gönderilemedi: Route bulunamadı" hatası — onboarding tıkalı, kartvizit/broşür/reklam butonları çalışmıyor (sözleşme kilidi).

**Sonuç:** 2 yeni endpoint (sms-otp + imzala), schema değişikliği YOK (mevcut User alanları + PhoneOtp), Backend 1.8.3 → 1.9.0 MINOR.

**Madde 30.67 yeni** — Onboarding Akış Bütünlüğü Disiplini:
1. Frontend stub mod production yasağı (CEO yazılı onay zorunlu)
2. Onboarding her ekran zorunlu (sözleşme imzasız butonlar disabled)
3. Frontend 404 → anlaşılır mesaj
4. Schema mevcut alanlar önce kontrol

**Mimar Hatası 55** — Frontend Stub Mod Production Tuzak (Emine ÇELİK emsali).

---

## ⏭️ NEXT — TUR #114 (Premium Görsel İterasyonu)

TUR #112'de planlanan görsel kaliteyi yükseltme — saha akış (TUR #113) ile gecikti, şimdi öncelik.

### Öneri yön (CEO seçimi — Madde 17.5):
1. **Premium kartvizit görsel iterasyon** — kişi fotoğrafı slot + diyagonal pattern + pdfkit upgrade (variable font wght axis)
2. **Niyazi sahaya çıkış retrospektifi** — Emine ÇELİK + diğer REP'lerin ilk lead'leri
3. **financialFlowGuard** — ilk 5 komisyon havalesi sonrası DEFER registry

---

## 🗄️ ÖNCEKİ — TUR #112 KAPALI ✅ (Premium Kartvizit + 5 Format + Font Embed + Türkçe Fix)

**Tip:** Premium kartvizit uçtan uca tasarım — Madde 17.2 R1 emsali (parçalı iş yasak)
**Sonuc:** 10/10 atom uygulandı (CEO uçtan uca direktifi — Mimar Hatası 52 pratik tescil)
**Yeni anayasa madde:** Madde 30.65 (Premium Kartvizit Disiplini)

### Production'a giren değişiklikler:
- 7 TTF font dosyası (Inter Tight + Crimson Pro + JetBrains Mono OFL) — A1
- UTF-8 encoding tüm SVG çıktılarda — A2
- Premium ön yüz SVG (Tedbirge + tedbirator italic yeşil etiket) — A3
- Premium arka yüz SVG (diyagonal aksent + reklam metni + QR) — A4
- PNG frontend canvas conversion (sharp YOK pattern) — A5
- Matbaa PDF endpoint (92×62mm + font embed + trim marks) — A6
- Dijital paylaşım PDF endpoint (compress, email uyumlu) — A7
- RBAC `kartvizit:print` action — A8
- Panel KartvizitTab premium UI (5 format + ön/arka + reklam editor) — A9
- ShareButton + brand.json + 5 belge OS senkron + atomik commit — A10

### Tedbirator etiket strateji (TUR #111 → TUR #112 değişim)
TUR #111 `registered: true` SMK m.30 riski → TUR #112 `displayMode: "label"` italic yeşil etiket (alt marka değil, sektör konumlandırma). Tescil iddiası YOK, hukuki risk sıfır.

---

## 🎯 ÖNCEKİ — TUR #110 KAPALI ✅

**Tip:** OS Temel Sıkılaştırma + judicialResponse + Niyazi sahaya çıkış HAZIR
**Commit:** `ead8a6b` (backend) + `58a730c` (panel) — Render `dep-d800eomrnols73cpchjg` ✅ live
**Sonuç:** 8/17 atom uygulandı, 9 atom dürüst DEFER (Madde 30.31 R1 emsal)

### Production'a giren değişiklikler:
- Reconciler 5 detect handler (A3) — Madde 30.63 yeni
- Dead auditor.js silindi (A4) — namespace borç kapandı
- Boot 12 → 9 step (A6) — Oracle + pg-boss + Cron Scheduler arşive
- `/api/boot-status` + BootTimelineWidget (A8)
- JudicialResponse Prisma model + 3 endpoint + form sayfası + 9. sekme (C1)
- 6 modül DEFER registry (C2) — Madde 28 kanıt eşiği
- Lead.firstRealLead boolean (C3) — milestone flag
- 5 belge senkron + atomic commit (D1+D3)

---

## ⏭️ NEXT — TUR #113 (Önerilen: Premium Görsel İterasyonu)

**Tetikleyici:** TUR #112 PDF spacing 3 mikro hotfix sonrası kartvizit fonksiyonel ✅ ama görsel olarak eski Tedbirator estetiği seviyesinde değil.

### NEXT 1 (önerilen): Premium Görsel İterasyon
- Kişi fotoğrafı slot (REPRESENTATIVE/SALES için, opsiyonel)
- Diyagonal pattern aksent (eski Tedbirator estetik referansı)
- Hiyerarşik kompozisyon (isim/rol/iletişim grup ayrımı belirgin)
- pdfkit upgrade ile variable font wght axis aktivasyonu (Bold/Regular ayrımı)
- Madde 30.66 trade-off güncellemesi (visual weight kayıp → kazanım)

### NEXT 2 (alternatif): Niyazi sahaya çıkış retrospektifi
- Saha kullanıcı geri bildirimi
- Lead.firstRealLead manuel set + uçtan uca akış kanıtı
- UX bug listesi (varsa fix)
- 24 saat sonra `firstContactSpeed` computed metric

### NEXT 3 (DEFER registry): financialFlowGuard / zamanaşımıGuard / opposingParty (Madde 28 kanıt eşiği — TUR #112+)

---

## 🗄️ TUR #111 İPTAL (CEO reset)

**Tetikleyici:** Ekrandaki 3 somut sorun fix (production canlı kanıt)
**Durum:** Code TUR #111'i 8 atom ile uyguladı, CEO görsel inceleme sonrası `git reset --hard HEAD~1` ile geri aldı. Tedbirator `registered: true` SMK m.30 riski TUR #112'de elimine edildi (label stratejisi).

### 3 atom (önerilen):
1. **A1** — Footer modül sayım fix (15/16 → 16/16 doğru sayım)
2. **A2** — Healer Kurtarma modülü gerçek retry zinciri (24 FAILED Document → 0)
3. **A3** — Güvenlik 2FA tekrarlayan ADMIN_FEED bildirim + brute-force IP rate limit

**Tahmin:** 2-3 saat, 0 KIRMIZI, 0 yeni modül, $0 (Madde 24.14 ✅)

**Hedef:** Sistem-durumu UI tamamen yeşil (UYARI + KRİTİK kalkar)

### Alternatif TUR #111 yönü:
Niyazi'nin getireceği **gerçek lead retrospektifi**:
- Lead.firstRealLead flag manuel set
- Lead → Müvekkil → Avukat atama uçtan uca akış kanıtı
- UX bug listesi (varsa fix)
- 24 saat sonra **firstContactSpeed** computed metric

---

## 🌟 PAZARTESİ 11 MAYIS 09:00 — NİYAZİ SAHAYA ÇIKIŞ

**CEO + Niyazi 4 senaryo manuel smoke:**
1. Niyazi REPRESENTATIVE login (`/login?rol=temsilci`) ✅ canlı
2. Lead create form (`/temsilci`)
3. Avukat ataması (Ramazan/Zeliha/Muzaffer)
4. Müvekkil 2FA setup wizard (TUR #72.6 + #79 altyapı)

**Saha araç seti (CEO manuel):**
- WhatsApp Business numarası + QR kod (`/baslat?ref=NIYAZI_001`) — UTM mevcut altyapı
- 1 sayfa onboarding rehberi (Tedbirge nedir, nasıl başvurulur)

---

## 🟡 PLANLI (TUR #112+)

### TUR #112+ — financialFlowGuard modülü
**Tetikleyici eşik:** İlk 5 komisyon havalesi geldiğinde
**Schema:** BankTransaction (mutabakat tablosu)
**Süre:** ~3 saat

### TUR #113+ — zamanasimiGuard modülü
**Tetikleyici eşik:** İlk 10 aktif dava (zaman aşımı yaklaşan)
**Yasal dayanak:** TBK m.72 + KTK m.109 + Sigorta Sözleşmesi + SBM bildirim
**Süre:** ~4 saat

### TUR #115+ — opposingParty modülü
**Tetikleyici eşik:** 5 dava kapanışı (sigorta şirketi pazarlık verisi birikince)
**Süre:** ~3 saat

### TUR #117+ — customerSentiment modülü
**Tetikleyici eşik:** 30 müvekkil aktif (panel-dışı duygu izleme)
**Süre:** ~4 saat

### TUR #118+ — trustIndex modülü
**Tetikleyici eşik:** 30 müvekkil + 5 dava WON
**Public:** `/guven-endeksi` sayfası (TBB Reklam Yön. uyumlu)
**Süre:** ~3 saat

### TUR #135+ — lawyerContractLifecycle modülü
**Tetikleyici eşik:** İlk sözleşme yenilemesi (~12 ay sonra)
**Süre:** ~4 saat

---

## 🔴 KIRMIZI ÇİZGİ (DEFER — Madde 30.31 R1)

### A5 — EventBus 46 emit cleanup
**Neden DEFER:** Audit trail KVKK m.10 koruması, kanıt-bazlı liste yapılmadan silmek YANLIŞ.
**Hedef TUR:** Kanıt-bazlı emit kullanım listesi yapıldıktan sonra (TUR #114+).

### A7 — HAL 9→6 type silme
**Neden DEFER:** Mektup "Code keşfedecek" diyor — stratejik tasarım kararı (Madde 14.3 mimar oturumu).
**Hedef TUR:** Mimar oturumu yapıldıktan sonra (TUR #116+).

### B1-B4 — Niyazi sahaya çıkış smoke
**Neden DEFER:** Manuel/operasyonel — kod TUR'u değil. CEO+Niyazi Pazartesi 11 May test edecek.

---

## 📊 KAZANIM ÖZETİ (BU HAFTA — TUR #105 → #110)

- **Madde 31.11** — Sıfır Sonuç UX Guard (TUR #105)
- **Madde 22.9 R2** — Sürüm Senkron PATCH (TUR #105.5)
- **Madde 31.12-13** — Vefat tazminat 11 kombinasyon (TUR #106)
- **Madde 17.2 R1** — Parçalı İş Yasağı (TUR #107) + Madde 31.14-15
- **TUR #108** — OS Dependency Mapping (pure keşif, 7 kritik bulgu)
- **TUR #109** — KISMİ KAPALI (mimarHatasi visibility + runActiveTask, A1+A2)
- **TUR #110** — OS sağlık temel + judicialResponse + 3 yeni anayasa maddesi (30.61-63)

---

## ⚠️ MİMAR HATASI ZİNCİRİ (DERS)

- **Mimar hatası 50** (TUR #108-109 arası) — Kod gerçeğine bakmadan 12 modül önerme. Düzeltme: TUR #108 keşif raporu.
- **Mimar hatası 51** (TUR #109) — TUR #108 sonrası taahhüt ihlali. Düzeltme: TUR #110 dürüst 9 DEFER + Madde 30.31 R1 emsal.

**Yeni sohbette dikkat:** Mimar (sohbet Claude) **CEO sözünün üzerine modül listesi pişirme refleksi**ni tespit ederse anında DUR (Madde 4.3 + 14.5).

---

## 🎯 LANSMAN HEDEFİ

**14 Haziran 2026 — Tedbirge.ai resmi lansman (35 gün kaldı)**

Hedef: 17 avukat, 250 müvekkil, 720 lead (yıl sonu — fizibilite raporu)

---

— İş Planı v1.27.0 · 10 Mayıs 2026 · TUR #110 KAPALI
