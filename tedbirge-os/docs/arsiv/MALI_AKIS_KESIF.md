# MALİ AKIŞ MİNİ KEŞİF — KOMİSYON, TAHSİLAT, FATURA
## Tarih: 27 Nisan 2026
## Mimar: Claude Code (Sonnet 4.6)

> Bu rapor Tedbirge.ai'nin gelir modelini (Tedbirge %20 / Temsilci varsa
> %10+%10) ve mali akışını kod-kanıtla tespit etmek için yazıldı.
> TEDAVİ YOK — sadece tanı.
> Disiplin: Madde 4.4 (kod kanıt), Madde 21 (sağlık taraması — mini versiyon).
> Sıfır kod değişikliği, sıfır commit, sıfır push.

---

## YÖNETİCİ ÖZETİ

| Soru | Cevap | Kanıt |
|------|-------|-------|
| %20 sabiti kodda nerede? | Lead.komisyonOrani default 20 + analytics.service.js raporlama | G-M1, G-M2 |
| Temsilci %50 split neresi? | temsilci-contract.template.js — "Platform komisyonunun %50'si" | G-M3 |
| Otomasyon seviyesi? | Yarı-manuel — tahsilat kaydı otomatik, dağıtım manuel | G-M4 |
| KDV nasıl hesaplanıyor? | Alan var, hesaplama kodu yok — manuel giriş | G-M6 |
| Masraf düşülüyor mu? | Ayrı model var, komisyon hesabında otomatik düşülmüyor | G-M7 |
| Sözleşmedeki taraf yapısı | Müvekkil ↔ Avukat (Tedbirge taraf değil), ayrıca Temsilci ↔ Tedbirge | G-M8 |

**En kritik 3 bulgu:**
1. **Temsilci payı "%10" değil — sözleşmede "Platform komisyonunun %50'si" yazıyor.** Matematiksel sonuç aynı olsa da (Tedbirge %20 × %50 = %10) kod olarak split otomatik değil, tanım farklı.
2. **PayTR Marketplace YOK — ödeme dağıtımı tamamen manuel.** PayTR callback yalnızca Lead.odemeDetay (JSON string) güncelliyor. Avukata ve temsilciye ödeme: banka havalesi.
3. **hakEdisStatus özel bir endpoint'e bağlı değil — genel Lead PATCH üzerinden.** "Avukat sisteme işaretler" iş kuralı kod olarak korunmuyor. Herhangi bir yetkili rol lead güncelleyebilir.

---

## G-M1 — Komisyon Schema Alanları

### Lead modeli — mali alanlar (schema.prisma:231-248)

```prisma
komisyonOrani         Float?           @default(20)
gercekTazminat        Float?
odemeDetay            String?
hakEdisNotu           String?
hakEdisStatus         String?          @default("BEKLEMEDE")
hakEdisTarihi         DateTime?
hakEdisTetikleyenId   String?
kdvTutari             Float?           @default(0)
masrafTutari          Float?           @default(0)
estimatedCompensation Float?
```

**Alan yorumları:**
- `komisyonOrani`: Tedbirge'nin aldığı komisyon oranı (%). Default %20. Her lead'de override edilebilir.
- `gercekTazminat`: Gerçek tahsilat tutarı (estimatedCompensation'dan farklı — fiili). Doldurulma zorunluluğu yok.
- `odemeDetay`: PayTR ödeme bilgisi JSON string olarak saklanıyor (structured değil, ham).
- `hakEdisStatus`: **String tipi (enum değil!)** — BEKLEMEDE / HAK_EDILDI / ODENDI değerleri sözleşmeden çıkarılıyor. Tipi `String` olduğu için herhangi bir değer yazılabilir.
- `kdvTutari`: KDV tutarı (TL). Default 0. Hesaplama kodu yok — manuel giriş alanı.
- `masrafTutari`: Lead düzeyinde toplam masraf (TL). Ayrıca Masraf modeli de var (detaylı).

### User modeli — mali alanlar (schema.prisma:340-343)

```prisma
hukukcuKomisyon  Float?  @default(20)
primOrani        Float?  @default(50)
baroSicilNo      String?
```

**Alan yorumları:**
- `hukukcuKomisyon`: Avukat kayıt sırasında belirlenir. Default %20. Avukat'ın **Tedbirge'ye ödeyeceği komisyon oranı** — müvekkil-avukat sözleşmesindeki başarı priminin bu kadarı platforma kalır.
- `primOrani`: Default %50. Avukat için teşvik / prim oranı. Temsilci için de kullanılıyor (ayrı anlam). Anlamı kullanım yerine göre farklı.
- `baroSicilNo`: Fatura kesme ve resmi yazışmalar için kritik.

**IBAN / banka hesabı alanı:** User modelinde YOK. Temsilci ve avukatlara ödeme yapılırken banka bilgisi nereden alınıyor — kod tabanında tespit edilemedi.

### Ayrı modeller

**Masraf modeli (schema.prisma:274-284):**
```prisma
model Masraf {
  id        String
  leadId    String
  tur       String      -- masraf türü (harç, bilirkişi, tebligat...)
  tutar     Float
  tarih     DateTime    @default(now())
  aciklama  String?
  odendi    Boolean     @default(false)
  createdAt DateTime    @default(now())
  -- updatedAt YOK (TUR#18 bulgusudur — hâlâ düzeltilmedi)
}
```

**CommissionLog / Settlement / PaymentDistribution modeli:** YOK. Mali dağıtımın DB kaydı bulunmuyor.

---

## G-M2 — Komisyon Hesaplama Mantığı

### Tespit: %20 sabitinin kod lokasyonları

| Dosya | Satır | Bağlam |
|---|---|---|
| `prisma/schema.prisma` | 231 | `komisyonOrani Float? @default(20)` — schema default |
| `src/services/analytics.service.js` | 289 | `const oran = l.komisyonOrani ?? 20;` — fallback |
| `src/services/analytics.service.js` | 290 | `komisyon = Math.round((estimatedCompensation * oran) / 100)` — hesaplama |
| `src/services/contract.service.js` | 88 | `"tahsil edilen net tazminatın %20'si (KDV dahil)"` — sözleşme şablonu |
| `src/services/contract.service.js` | 141 | aynı ifade — service agreement şablonu |
| `src/controllers/auth.controller.js` | 409, 731 | `hukukcuKomisyon: Number(hukukcuKomisyon) || 20` — avukat kayıt default |

### Komisyon hesaplama kodu (analytics.service.js:281-301)

```javascript
async function getKomisyonSummary() {
  const wonLeads = await prisma.lead.findMany({
    where: { status: "WON", estimatedCompensation: { gt: 0 } },
    select: { id, estimatedCompensation, komisyonOrani, customerName, leadCode },
  });
  let totalKomisyon = 0;
  const details = wonLeads.map((l) => {
    const oran = l.komisyonOrani ?? 20;           // Lead'e özgü oran, yoksa %20
    const komisyon = Math.round(((l.estimatedCompensation ?? 0) * oran) / 100);
    totalKomisyon += komisyon;
    return { ...l, komisyonOrani: oran, komisyon };
  });
  return { count, totalKomisyon, avgKomisyon, details };
}
```

**Sonuç:** Bu fonksiyon sadece **raporlama** amaçlı. Gerçek tahsilata değil `estimatedCompensation` (tahmini) üzerinden hesaplıyor. Status=WON olan leadleri filtreli. Fiili tahsilat/dağıtım tetiklenmiyor.

### %10 sabiti

Doğrudan "0.10" veya "%10" sabiti kod tabanında komisyon bağlamında **bulunamadı**.  
Temsilci payı sözleşmede farklı formüle edilmiş — bkz. G-M3.

---

## G-M3 — Temsilci Komisyon Akışı

### Temsilci sözleşmesi (temsilci-contract.template.js:27-38)

```
4. KOMİSYON YAPISI
(a) Masraf kesintisi: Dosyaya ilişkin masraflar düşülür.
(b) KDV kesintisi: Avukatlık hizmetine uygulanan KDV düşülür.
(c) Net matrah üzerinden Platform komisyonu: Avukat-Platform arasındaki
    ayrı sözleşmeye göre hesaplanır.
(d) Temsilci payı: Platform'un aldığı net komisyonun %50'si Temsilci'ye ödenir.

5. HAKEDİŞ TESPİTİ VE ÖDEME
Avukat, Platform sistemi üzerinden dosya statüsünü "HAK_EDILDI" olarak
işaretlemesiyle hakediş doğar. Platform, en geç 30 gün içinde Temsilci'nin
bildirdiği banka hesabına ödemeyi gerçekleştirir.
```

**Formül matematiksel sonucu:**
- Müvekkil tahsilatından masraf + KDV düşülür = Net matrah
- Net matrah × hukukcuKomisyon (avukatın Platform'a ödediği oran, default %20) = Platform komisyonu
- Platform komisyonu × %50 = Temsilci payı

**Örnek:** 100.000 TL tahsilat, 5.000 TL masraf, %18 KDV
→ Net ≈ 80.500 TL
→ Platform ≈ 80.500 × 20% = 16.100 TL
→ Temsilci ≈ 16.100 × 50% = 8.050 TL
→ Avukat ≈ 80.500 - 16.100 = 64.400 TL

**NOT:** Mehmet Bey'in direktifinde "Temsilci %10 alır" ifadesi, sözleşmedeki "%50 platform komisyonu" ifadesiyle örtüşüyor (netlerde aynı sonuç). Ama kod formülle değil, sözleşme metninden türetiliyor.

**Kod tarafında lead-temsilci bağlantısı:**
- `Lead.ownerId` → Temsilcinin ID'si (kim getirdi)
- `Lead.createdById` → Kim oluşturdu
- `User.primOrani = 50` → Default temsilci payı oranı (sözleşmedeki %50)

**Otomatik split kodu:** YOK. Hakediş akışı tamamen manuel:
1. Avukat panelde hakEdisStatus'u güncelliyor (Lead PATCH)
2. Platform 30 gün içinde banka havalesi yapıyor
3. Bildirim SMS/email: mevcut servislerle (smsSendStatusChange gibi) olabilir ama spesifik hakediş bildirimi kodu görülmedi

---

## G-M4 — PayTR Tahsilat Akışı

### payment.controller.js özeti

**Ödeme başlatma (payment.controller.js:7-45):**
```javascript
// merchantOid = lead.leadCode
// userIp = müşteri IP
// paymentAmount = TL × 100 (kuruş)
// userName = lead.customerName
// basketItems = [["Hukuki Danışmanlık Hizmeti", tutar, 1]]
const result = await createPayment({ merchantOid: lead.leadCode, ... });
// DB'ye kaydedilen: odemeDetay JSON string → status: "PENDING"
```

**Callback (payment.controller.js:50-81):**
```javascript
// HMAC doğrulama → lead bul (leadCode üzerinden) →
// odemeDetay güncelle: status: "PAID" / "FAILED" + paidAt
// ActivityLog: "ODEME_BASARILI" / "ODEME_BASARISIZ"
// hakEdisStatus güncelleme: YOK
// Komisyon hesaplama: YOK
// Avukata/temsilciye bildirim: YOK
res.send("OK"); // PayTR "OK" bekler
```

**Sonuç — PayTR akışı:**
- Ödeme yönü: Müvekkil → PayTR (single merchant, Tedbirge adına)
- PayTR Marketplace (otomatik split): **KULLANILMIYOR**
- Callback sonrası: sadece `odemeDetay` güncelliyor, komisyon dağıtımı tetiklenmiyor
- İade: `POST /api/payments/leads/:leadId/refund` → sadece ADMIN yetkili
- odemeDetay ham JSON string — structured değil, indexleme/sorgulama zor

**Önemli:** PayTR ödeme kimin adına? `lead.customerName` (müvekkil). Senaryo: **Müvekkil → Tedbirge PayTR hesabına.** Avukat kendi hesabına değil. Bu "Müvekkil Tedbirge'ye ödüyor, Tedbirge avukata dağıtıyor" modelini ima ediyor.

---

## G-M5 — Hak Ediş Akışı

### hakEdisStatus alanı (schema.prisma:239)

```prisma
hakEdisStatus  String?  @default("BEKLEMEDE")
```

**String tipi — enum değil.** Serbest değer girilebilir. Sözleşmede adı geçen değerler:
- `BEKLEMEDE` (default)
- `HAK_EDILDI` (avukat işaretler)
- Muhtemelen `ODENDI` (ödeme sonrası)

**hakEdisStatus'u güncelleyen özel endpoint:** YOK (controllers grep boş döndü).  
Güncelleme büyük ihtimalle genel `PATCH /api/leads/:id` üzerinden yapılıyor.  
Yetki kontrolü: assertLeadAccess — LAWYER kendi lead'ini görebiliyor.

**Hak ediş akışı sözleşme ↔ kod karşılaştırması:**

| Sözleşme | Kod |
|---|---|
| Avukat "HAK_EDILDI" işaretler | Genel lead PATCH — özel endpoint yok |
| Platform 30 gün içinde öder | Manuel banka havalesi — otomatik değil |
| Temsilci 7 gün içinde itiraz edebilir | İtiraz mekanizması kodu yok |
| Hakediş doğmayan haller | Sistem kontrolü yok |

**hakEdisTetikleyenId:** Var, kim tetikledi kaydediliyor — bu iyi bir denetim izi.

---

## G-M6 — KDV ve Fatura Akışı

### KDV alanı

```prisma
kdvTutari  Float?  @default(0)  -- Lead modeli
```

**KDV hesaplama kodu:** Bulunamadı. `0.18`, `0.20`, `KDV_RATE` sabiti yok.  
`kdvTutari` alanına elle değer girilmeli — otomatik hesaplama yok.

**Sözleşme metni (temsilci-contract.template.js:31):**
```
KDV kesintisi: Mevzuat gereği avukatlık hizmetine uygulanan KDV düşülür.
```
Oran belirtilmemiş. 2026 avukatlık hizmetleri KDV oranı: %20 (KDV sistemine göre).

### E-Fatura / E-Arşiv

**Entegrasyon:** YOK. GİB API kodu bulunamadı.

**2026 yükümlülüğü:** 5.000 TL üzeri faturalar → e-arşiv zorunlu (TC GİB). Tedbirge komisyon gelirleri bu limiti kesinlikle aşıyor.

**Fatura tarafları (kod-kanıtlı):**
1. `master-attorney-contract.template.js` → Taraflar: MÜVEKKİL ↔ AVUKAT. Tedbirge sözleşmede taraf değil.
2. `textTemplates.js:79` → `"Tedbirge Teknoloji A.Ş."` imzacı olarak görünüyor — ama bu eski şablon.
3. `temsilci-contract.template.js` → Taraflar: TEMSİLCİ ↔ PLATFORM (Tedbirge).

**Fatura yönü (tahmin değil — kanıt eksik):**  
Mehmet Bey netleştirecek: Avukat → Tedbirge'ye fatura mı kesiyor, yoksa Tedbirge → Avukata mı?

---

## G-M7 — Masraf Akışı

### Masraf servisi (masraf.service.js:10-22)

```javascript
async function createMasraf(leadId, data) {
  return prisma.masraf.create({
    data: {
      leadId,
      tur:      data.tur,        // "harc", "bilirkisi", "tebligat"...
      tutar:    parseFloat(data.tutar),
      tarih:    data.tarih ? new Date(data.tarih) : new Date(),
      aciklama: data.aciklama || null,
      odendi:   data.odendi ?? false,
    },
  });
}
```

**Masraf endpoint yetkileri (hukuk.routes.js:31):**
```javascript
router.post("/:id/masraflar", auth,
  role("ADMIN", "SALES", "REPRESENTATIVE", "LAWYER"), ctrl.createMasraf);
```
→ CUSTOMER hariç herkes masraf girebilir. Onay akışı yok.

**Masraf komisyon hesabında düşülüyor mu:**
- `analytics.service.js:getKomisyonSummary()` → `estimatedCompensation × komisyonOrani / 100` — masraf yok
- Sözleşme metninde "masraf düşülür" yazıyor ama hesaplama otomatik değil
- Lead.masrafTutari alanı var ama komisyon hesabına dahil edilmemiyor

**Masraf ödeme kaydı:**
- `odendi: Boolean @default(false)` — kim ödedi: yok
- Kim ödedi (müvekkil mi, avukat mı, platform mu): kod tabanında belirsiz
- `updatedAt` yok — masraf değişim geçmişi izlenemiyor (TUR #18 bulgusu)

---

## G-M8 — Sözleşme Şablonu

### Müvekkil-Avukat Sözleşmesi (master-attorney-contract.template.js)

**Taraflar:** MÜVEKKİL ↔ AVUKAT  
(Tedbirge imzacı taraf DEĞİL)

**%20 ifadesi (contract.service.js:88):**
```
"- Başarı primi: tahsil edilen net tazminatın %20'si (KDV dahil)"
```
Hardcoded — `success_fee_rate` değişkeni ile template'e geçiliyor ama contract.service.js prompt'ta sabit %20 yazıyor.

**Masraf düşümü (master-attorney-contract.template.js:90-91):**
```
Tahsil edilen bedelden masraf, harç, vergi, eksper / rapor gideri ve benzeri
kalemlerin düşülmesinden sonra hesaplama net tutar üzerinden yapılır.
```
→ Sözleşme masraf düşümünü öngörüyor. Kod bunu otomatik yapmıyor.

### Temsilci-Platform Sözleşmesi (temsilci-contract.template.js)

**Taraflar:** TEMSİLCİ ↔ PLATFORM (Tedbirge)  
**Versiyon:** v1.0-temsilci (19.04.2026)

**Kritik madde (md. 4d):**
```
Temsilci payı: Platform'un aldığı net komisyonun %50'si Temsilci'ye ödenir.
```
→ "Tedbirge %20 alır, bunun %50'si temsilciye" = Temsilci net ~%10 alır.  
→ Avukat net ~%80 alır.

**Hakediş koşulları (md. 5):**
- Avukat "HAK_EDILDI" işaretler
- Platform 30 gün içinde banka havalesi yapar

### Eski textTemplates.js (lead.controller.js tarafından kullanılan)

```
Başarıya Bağlı Ücret  : Tahsil edilen net tutarın %[BAŞARI ORANI]'i + KDV
```
Placeholder — BAŞARI ORANI dolduruluyor mu? Kod tespit edilemedi.

---

## ÖZET TABLO — MALİ AKIŞ DURUMU

| Konu | Durum | Yorum |
|------|-------|-------|
| Komisyon hesaplama (Tedbirge %20) | Yarı-Otomatik | Default schema değeri var, raporlama otomatik, fiili dağıtım manuel |
| Temsilci %50 platform komisyonu | Manuel | Sözleşmede tanımlı, kod otomasyonu yok |
| PayTR tahsilat → Lead kaydı | Otomatik | Callback Lead.odemeDetay güncelliyor |
| Avukat → Tedbirge ödeme | Manuel | Banka havalesi, kodu yok |
| Tedbirge → Temsilci ödeme | Manuel | Banka havalesi, IBAN kaydı yok |
| KDV hesaplama | Manuel | Alan var (kdvTutari), hesaplama yok |
| E-fatura / E-arşiv | YOK | GİB entegrasyonu bulunamadı |
| Masraf düşümü (komisyon hesabında) | Hayır | Masraf kaydı var, komisyon hesabına dahil edilmiyor |
| Hakediş özel endpoint | Hayır | Genel lead PATCH üzerinden |
| CommissionLog / dağıtım kaydı | Hayır | Böyle model yok |

---

## EKSİK NOKTALAR (Mehmet Bey için)

Mimar varsayım yapamaz — aşağıdakiler Mehmet Bey'in netleştirmesi gerek:

1. **Banka hesabı:** Avukat ve temsilci IBAN'ları nerede tutuluyor? User modelinde yok. Harici kayıt mı (sistem dışı)?
2. **Fatura yönü:** Avukat → Tedbirge'ye fatura mı kesiyor? Yoksa Tedbirge → Avukata mı? Hangi taraf vergi mükellefi olarak fatura düzenliyor?
3. **E-arşiv zorunluluğu:** 2026 GİB e-arşiv kapsamında mısınız? Hangi tüzel kişilik (Tedbirge Teknoloji A.Ş.)?
4. **PayTR hesabı:** Müvekkil ödemeleri hangi PayTR hesabına giriyor — Tedbirge mi, avukat mı?
5. **Şahıs şirketi vergi yapısı:** Stopaj mı, KDV mükellefiyeti mi? Komisyon geliri nasıl beyan ediliyor?
6. **Masraf kim öder:** Avukat masrafı kendi cebinden mi karşılıyor, yoksa müvekkil avansından mı?
7. **hakEdisStatus değerleri:** BEKLEMEDE → HAK_EDILDI → ODENDI akışı mı? Başka değer var mı?
8. **Sözleşmedeki %20 Mehmet Bey beklentisiyle örtüşüyor mu?** Sözleşmede "tahsil edilen net tutarın %20'si" yazıyor. "Net" sonrası masraf düşülüyor mu, önce mi?

---

## SONRAKİ ADIM

1. Mimar oturumu — bu raporu Mehmet Bey ile birlikte okuyacak
2. Mehmet Bey eksik mali yapı bilgilerini (banka, fatura, vergi) ekleyecek
3. Madde 24 (İş Planı Yasası) **gelir modeli** alt başlığı bu bulgularla yazılacak
4. Eksiklik tespiti sonrası yeni tur açılacak (hakediş otomasyonu, IBAN kaydı, vb.)

---

## OKUMA LİSTESİ (kanıt dosyaları)

| Dosya | İçerik |
|---|---|
| `prisma/schema.prisma:231-248` | Lead mali alanlar |
| `prisma/schema.prisma:340-343` | User.hukukcuKomisyon, primOrani |
| `prisma/schema.prisma:274-284` | Masraf modeli |
| `src/services/analytics.service.js:281-301` | getKomisyonSummary() — raporlama |
| `src/services/masraf.service.js` | Masraf CRUD |
| `src/controllers/payment.controller.js` | PayTR tam akış |
| `src/services/payment.service.js` | PayTR API client |
| `src/routes/payment.routes.js` | Endpoint yetkileri |
| `src/templates/contracts/master-attorney-contract.template.js` | Müvekkil-Avukat sözleşmesi |
| `src/templates/contracts/temsilci-contract.template.js` | Temsilci-Platform sözleşmesi |
| `src/services/contract.service.js:88,141` | %20 hardcoded sözleşme promptu |
| `src/utils/textTemplates.js:64` | Eski şablon — %[BAŞARI ORANI] placeholder |

---

*Claude Code, Mali Akış Mini KEŞİF sonu*  
*Disiplin: Madde 4.4 + Madde 21 — sıfır kod değişikliği, sıfır commit, sıfır push*  
*Müvekkil verisi maskelendi. PAYTR keys görünmedi (ENV sadece .env.example'da placeholder).*
