# 📋 TEDBİRGE.AI — İŞ PLANI (AKTİF KESİT)

**Son güncelleme:** 10 Mayıs 2026 Pazar 07:37
**Anayasa:** v1.27.0 MINOR
**Aktif rekor:** 23 ardışık temiz TUR (#90 → #110)

---

## 🎯 NOW — TUR #110 KAPALI ✅

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

## ⏭️ NEXT — TUR #111 (Pazartesi sonrası)

**Tip:** Ekrandaki 3 somut sorun fix (production canlı kanıt)
**Tetikleyici:** Niyazi Pazartesi sahaya çıktıktan sonra ilk lead retrospektifi sırasında

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
