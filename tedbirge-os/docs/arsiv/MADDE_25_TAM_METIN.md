# ANAYASA MADDE 25 — TAM METİN
## CLAUDE.md'den çıkarıldı, ham metin

**Tarih:** 27 Nisan 2026
**Mimar:** Claude Code (Sonnet 4.6)
**Yöntem:** Madde 21.2 salt okuma

---

## VERSİYON TABLOSU (ilgili satırlar)

```
Satır 1276: — Tedbirge Mimari Anayasası v1.5.0
Satır 1277: 25 Nisan 2026 — başlangıç (Claude Opus 4.7)
Satır 1278: 27 Nisan 2026 — v1.4.0 son güncelleme (Madde 24 — İş Planı Disiplini eklendi)
Satır 1279: 27 Nisan 2026 (akşam) — v1.5.0 (Madde 25 — Pazarlama + Web Yüzü + Marka Disiplini eklendi)
Satır 1280: Versiyon geçmişi: tedbirge-os/MIMARI_KARARLAR.md
```

---

## MADDE 25 — TAM METİN

(CLAUDE.md satır 1026–1259 — değişiklik yapılmadan)

---

## MADDE 25 — PAZARLAMA + WEB YÜZÜ + MARKA DİSİPLİNİ (Türkiye Geneli)

> Bu madde Tedbirge'in dünyaya bakan tüm yüzünü disipline eder: pazarlama, web arayüzü, görsel marka kimliği, sosyal medya, içerik, dijital reklam, ölçüm. Tedbirge bir LegalTech şirketidir; reklamı **kendi markası adına** yapar, hukuki hizmet pazarlamaz. Bu madde Madde 24 (İş Planı) + Madde 24.10 (KVKK Aktarım) + Madde 4.1 (yamalı bohça yasak) ile bağlıdır.

### 25.1 Tedbirge'in Pazarlamadaki Sıfatı
Tedbirge LegalTech şirketidir. Hukuki hizmet sağlayıcısı değildir. Pazarlama kendi markası adına yapılır — kazazedeyi/mağduru hak arama bilincine ulaştırma + dijital platform tanıtımı. Avukatlık K. m.55 reklam yasağı Tedbirge'yi doğrudan bağlamaz. Mehmet Dinç **girişimci, marka sahibi**dir; LegalTech ürününü yönetir, avukat değildir.

### 25.2 Pazarlama Vaadi (Marka Mesajı)
- **Vaat:** "Hak arama sürecini dijitalleştir, kolaylaştır, hızlandır"
- **Vaat değil:** "Tazminat al" / "Avukat tut" / "Davayı kazan"
- Tedbirge **sonuç değil, süreç altyapısı** vaat eder.
- Marka tonu: güvenilir, sade, eğitici, empatik — sansasyonel değil.

### 25.3 KIRMIZI Çizgi — Yasaklı Vaatler
Tüketicinin Korunması K. (6502) ve Reklam Kurulu mevzuatı gereği YASAK:
- "Kesin tazminat alacaksınız" / "X TL garantili"
- "En iyi platform" / "Türkiye'nin 1 numaralı"
- Sayısal başarı oranı vaadi ("%95 kazandık")
- Belirli avukatın isim/fotoğraf/başarı oranı (TBB Reklam Yasağı koruması)
- Yanıltıcı sigorta tazminat rakamı (gerçek SBM tablosuna aykırı vaatler)
- Sahte yorum / değerlendirme / referans
- Tıbbi tanı/tedavi vaadi (sağlık verisi alanı için)

### 25.4 İzinli Mesaj Çerçevesi
- "Hak arama sürecini bilin" — bilgilendirme
- "Ücretsiz tazminat hesaplama" — Tedbirge'in somut hizmeti
- "Uzman hukuki destek ile dijital eşleştirme" — avukat ismi vermeden
- Anonim örnek senaryolar (eğitim amaçlı, kişi adı yok)
- Karayolları Trafik K., İş Sağlığı ve Güvenliği K., SBM tablosu, mahkeme içtihatları referansları
- Yasal süreç açıklamaları (zaman aşımı, başvuru aşamaları, gerekli belgeler)

### 25.5 Web Arayüzü — Tedbirge'in Dünyaya Bakan Yüzü
Tedbirge'nin web arayüzü kurumsal kimliği yansıtır + yasal yükümlülükleri karşılar + dönüşüm motoru gibi çalışır. Aşağıdaki bileşenler **kod düzeyinde mevcut** olmak zorundadır:

#### 25.5.1 Marka Kimliği (Görsel Tutarlılık)
- **Logo:** Tek dosya, tüm sayfalarda aynı yerde (tedbirge-panel/public/logo)
- **Renk paleti:** ana renk + 2 yardımcı renk + nötr (Tailwind config'te tanımlı)
- **Tipografi:** ana font + başlık fontu (next/font ile yüklü)
- **İkon seti:** tek kütüphane (lucide-react veya benzer — karışık YASAK)
- **Görsel ton:** profesyonel, sade, güvenilir — clipart YASAK

`tedbirge-panel/app/layout.tsx` ve `tailwind.config.ts` kalıcı referans dosyalarıdır. Marka değişikliği bu iki dosya merkezinden yapılır.

#### 25.5.2 Yasal Bileşenler (Mevzuat Zorunluluğu)
- **Cookie consent banner:** İlk ziyarette gösterilir, kullanıcı **kabul/red/özelleştir** seçenekleri sunar (KVKK m.10 + ePrivacy)
- **Aydınlatma metni:** `/kvkk-aydinlatma` sayfası — yurt dışı aktarım sağlayıcıları (Vercel, Supabase, Anthropic, Meta, Google) **açıkça** belirtilir (Madde 24.10)
- **Çerez politikası:** `/cerez-politikasi` sayfası — hangi çerez ne yapar, ne kadar saklanır
- **Kullanım koşulları:** `/kullanim-kosullari` — Tedbirge'in B2C platform sıfatı, sorumluluk sınırları
- **KVKK başvuru sayfası:** `/kvkk-basvuru` — DataSubjectRequest endpoint'ine bağlı (TUR #23 sonrası)
- **İletişim sayfası:** `/iletisim` — şirket adı, MERSİS no (varsa), e-posta, telefon (Bilgi Toplumu Hizmetleri K.)
- **Footer:** Her sayfada sabit, yukarıdaki 6 sayfaya link içerir

#### 25.5.3 Dönüşüm Yüzeyi (Conversion Surface)
- **Anasayfa:** Net vaat (m.25.2), tek belirgin CTA, sosyal kanıt (anonim), 3 anlatım blok (kim için, nasıl çalışır, neden Tedbirge)
- **Niş Landing Pages (kaza türü bazlı):**
  - `/trafik-kazasi-tazminat` (ölümlü, yaralanmalı, maddi hasar)
  - `/is-kazasi-tazminat` (SGK + manevi)
  - `/sigorta-tazminat-reddedildi` (KTT itiraz)
  - Her biri özel mesaj + özel form (gereksiz alan yok)
- **Public form `/basvuru`:** UTM otomatik yakalama (frontend `useSearchParams`), KVKK rıza kutucuğu (default işaretsiz, opt-in), sağlık verisi rızası ayrı kutucuk, **pazarlama rızası ayrı kutucuk** (İYS + e-posta için)
- **LexScan `/lexscan`:** AI sohbet sonu **prefill URL ile başvuru** (`?prefill=...`) — kazazedenin yazdığı bilgiler form'a otomatik aktarılır, sıfırdan tekrar yazma yok
- **Müşteri portal `/musteri`:** mevcut (TUR #15) — pazarlamada **vaat olarak öne çıkar**: "Davanızı dijital takip edin"

#### 25.5.4 Görsel + Etkileşim (Canlı Yüz)
- **Hero alanı:** statik resim YASAK; ya **Lottie animasyonu** ya **kısa loop video** ya **animated gradient** (sadece bir tanesi seçilir, dağınık olmaz)
- **Süreç animasyonu:** "Nasıl çalışır" bölümünde **3-4 adım animasyonlu görselle** anlatılır (form → analiz → eşleştirme → süreç)
- **Sosyal kanıt animasyonu:** "Bu hafta X başvuru alındı" gibi **canlı sayaç** (gerçek veriden, abartısız) — tek satırlık animasyon
- **Haber/blog akışı:** Anasayfada son 3 blog yazısı carousel ile dönüşümlü (SEO + güven)
- **Müvekkil yolculuğu zaman tüneli:** Ana sayfada interaktif blok — kazadan tahsilat'a kadar adımlar
- **CSS framework:** Tailwind (mevcut). Animasyon: **Framer Motion** veya saf CSS keyframes (yeni paket gerekirse Madde 18.3 KIRMIZI nokta ile onay)
- **Görsel aşırılık YASAK:** Parıltı, gereksiz parallax, otomatik açılan modal, agresif pop-up (kullanıcı deneyimini bozar + KVKK rıza akışını gizler)

#### 25.5.5 Mobil Öncelik
- Tüm sayfalar **mobile-first** Tailwind responsive class'lar ile yazılır
- Mobil 320px → 768px → 1024px → 1440px breakpoint'lerinde test edilir
- Touch hedef minimum 44x44px (Apple HIG + Material Design ortak standart)
- Yatay scroll YASAK (kötü UX)

#### 25.5.6 Erişilebilirlik (a11y)
- Tüm görsellerin `alt` attribute'ü Türkçe + anlamlı
- Form alan etiketleri `<label>` ile bağlı
- Klavye navigasyonu çalışır (Tab order doğru)
- Renk kontrastı WCAG AA seviyesi (4.5:1 metin için)
- Ekran okuyucu test (NVDA / VoiceOver) — düzenli denetim

### 25.6 Sosyal Medya — İçerik + Şablon Disiplini
Tedbirge'in sosyal medya hesapları **marka tutarlılığı** ile yönetilir:

#### 25.6.1 Aktif Kanallar (Türkiye)
- **Instagram** — görsel + video (reel + post + story)
- **TikTok** — eğitim video formatı (15-60 saniye)
- **YouTube** — uzun format (5-15 dakika rehber)
- **LinkedIn** — kurumsal + B2B (avukatlara yönelik içerik)
- **X (Twitter)** — hukuk haberleri + içtihat (opsiyonel)
- **Facebook** — sosyal medya hesabı tutulur (reklam için gerekli) ama organic önceliği düşük

#### 25.6.2 İçerik Şablonu Disiplini
- **Tek brand kit:** Logo, renk, font tüm postlarda aynı
- **Şablon kütüphanesi:** Canva veya Figma — minimum 10 şablon (eğitim post, sosyal kanıt, blog tanıtım, kullanıcı sorusu, mevzuat değişikliği, avukat ipucu)
- **İçerik takvimi:** Haftalık planlama, aylık tema, 1 hafta önceden hazır
- **Hashtag stratejisi:** Türkçe ana hashtag (#trafikkazasi #tazminat #iskazasi) + niş etiketler

#### 25.6.3 İçerik Türleri ve KIRMIZI Çizgileri
İzinli içerik:
- Eğitici: "İş kazası geçirenlerin bilmesi gereken 5 hak"
- Mevzuat: "SBM tablosu güncellendi, ne anlama geliyor?"
- Süreç: "Başvurudan sonuca: tipik bir trafik kazası dosyası nasıl ilerler?"
- Anonim örnek: "X bir kazazede, SGK'ya başvurdu, sigorta da buradaydı..."
- Soru-cevap: kullanıcı yorumlarına yanıt
- Teknoloji: "Tedbirge nasıl çalışır?" tanıtımı

YASAK içerik (m.25.3 paralel):
- Belirli avukat ismi / fotoğraf / kazanılan dava sayısı
- Tazminat rakam vaadi
- Müvekkil isim / yüz / dosya bilgisi (KVKK)
- Sansasyonel başlık ("Bunu yapan tazminatın 10 katını alıyor!")
- Sigortacıyı / avukatı / mahkemeyi karalayıcı içerik

### 25.7 KVKK + İYS + Pazarlama Veri Disiplini
- **Cookie consent:** GA4, Meta Pixel, TikTok Pixel **rıza alınmadan tetiklenmez** (cookie banner red'inde pixel atılmaz)
- **Pazarlama rızası ayrı:** Form'da "KVKK aydınlatma okudum" + "sağlık verisi işlenmesini onaylıyorum" + **"e-posta/SMS ile pazarlama mesajı almak istiyorum"** üç ayrı kutucuk (default hepsi işaretsiz)
- **İYS opt-out:** Her e-posta + SMS gönderiminde **opt-out linki/kelimesi** zorunlu — kullanıcı tek tıkla rıza geri alabilir
- **Audit log:** Her rıza/red kayıt edilir (`Lead` modelinde + `ActivityLog`'ta zaman damgalı)
- **PII maskeleme:** Pazarlama analizinde kullanılan AI çağrılarında müvekkil PII maskelenir (TUR #23 AIUsageLog disiplini ile paralel)

### 25.8 Yanıltıcı Bilgi Denetimi
- Web arayüzündeki **her sayfa** mevzuat referanslı yazılır — kanun maddesi, mahkeme kararı, SBM tablosu kaynağı belirtilir
- Mehmet Bey **3 ayda bir** tüm public sayfaları gözden geçirir, mevzuat değişikliği varsa içerik güncellenir
- Yeni bir vaat / istatistik / oran metne girerse **kaynak link** zorunlu (Reklam Kurulu denetimi koruma)
- Eski / yanıltıcı ifade tespit edilirse **24 saat içinde** düzeltilir
- Kullanıcı şikayeti / Tüketici Hakem Heyeti başvurusu gelirse 3 dakikada kanıt zinciri (m.25.10)

### 25.9 İzinli Pazarlama Kanalları + Araçları (Türkiye)
- **Arama:** Google Ads (Türkiye yerel hedef)
- **Sosyal:** Meta Ads (Facebook/Instagram), TikTok Ads
- **Görsel + video:** YouTube Ads (genç kitle + eğitim)
- **Influencer/içerik üretici:** Mikro hesap (10K-100K), hukuk-sigorta-sağlık alanı, yazılı sözleşme + KVKK uyum + etiketli post (#işbirliği)
- **SEO:** Blog (kendi alt domain veya `/blog` rotası), Google Search Console kayıtlı, sitemap.xml dinamik
- **Email pazarlama:** İzinli liste (İYS opt-in), şablon merkezi (`notificationTemplates.js` — TUR #18 ertelendi, gelecek)
- **Push:** mevcut (TUR #5), pazarlama push **opt-in ile**
- **YASAK kanallar:** Soğuk arama, izinsiz toplu SMS/e-posta, sahte yorum, agresif retargeting (rahatsız edici sıklık), spam forum/yorum

### 25.10 Pazarlama Verisi Audit ve Ölçüm Disiplini
**Ölçümsüz pazarlama YASAK.** Her kampanya için:
- **Harcama** (TL bazında, kanal başı)
- **Lead** (yeni başvuru sayısı, kanal başı)
- **CPL** (lead başına maliyet, hedef: kanal başı tanımlı)
- **Conversion funnel** (ziyaretçi → form başlat → form bitir → avukat ataması → sözleşme → tahsilat)
- **ROI** (komisyon geliri / pazarlama harcaması, kanal başı)

Bu metrikler:
- Backend: `/api/analytics` endpoint (mevcut, genişletilecek)
- Frontend: `/dashboard/pazarlama` sayfası (yeni — TUR #27 kapsamında)
- 3rd party: GA4 + Meta Ads Manager + Google Ads Manager (gerçek pazarlama harcaması raporu)

Şikayet gelirse (Reklam Kurulu, KVKK Kurumu, Tüketici Hakem Heyeti) **kanıt zinciri 3 dakikada** çıkartılabilir olmalı (lead başına KVKK rıza zaman damgası, kanal kaynağı, gönderilen mesaj logu).

### 25.11 Kod Altyapı Zorunlulukları (Madde 4.4 — kod kanıt)
Aşağıdaki bileşenler **kod tabanında mevcut olmadan** pazarlama kampanyası BAŞLATILAMAZ:

| # | Bileşen | Konum | Durum (KEŞİF 27 Nis 2026) |
|---|---|---|---|
| 1 | Cookie consent banner | tedbirge-panel/components/ | YOK → TUR #25 FAZ 1 |
| 2 | Aydınlatma metni (yurt dışı aktarım dahil) | /kvkk-aydinlatma | YOK / yarım → TUR #25 FAZ 1 |
| 3 | GA4 entegrasyonu | layout.tsx + env | YOK → TUR #25 FAZ 1 |
| 4 | Meta Pixel | layout.tsx + env | YOK → TUR #25 FAZ 1 |
| 5 | UTM frontend yakalama | basvuru/page.tsx | YARIM → TUR #25 FAZ 1 |
| 6 | İYS opt-out altyapısı | sms + email service | YOK → TUR #25 FAZ 1 |
| 7 | robots.txt + sitemap.xml | tedbirge-panel/public/ + app/ | YOK → TUR #25 FAZ 1 |
| 8 | qualificationScore AI hesaplama | analyzer.service.js | 0 default → TUR #26 |
| 9 | LexScan → /basvuru prefill köprüsü | lexscan + basvuru | YOK → TUR #26 |
| 10 | Niş landing pages | tedbirge-panel/app/(public)/* | YOK → TUR #26 |
| 11 | Pazarlama dashboard | /dashboard/pazarlama | YOK → TUR #27 |
| 12 | Conversion funnel hesabı | /api/analytics | YOK → TUR #27 |
| 13 | Hero animasyonu (Lottie/video/gradient) | anasayfa | YOK → TUR #26 |
| 14 | Müvekkil yolculuğu zaman tüneli | anasayfa | YOK → TUR #26 |
| 15 | Blog modülü + 10 makale | /blog rotası | YOK → TUR #27 sonrası |

**Bu tablo Madde 25'in canlı kontrol listesidir.** Yeni bileşen eklendiğinde tablo güncellenir (Madde 20 evrim).

### 25.12 Üç Faz Disiplini (Atlama YASAK — Madde 17.4 yamalı bohça yasağı paralel)

#### FAZ 1 — Yasal + Ölçüm Temeli (NOW + MUST)
**Reklam başlamadan ZORUNLU.** TUR #25 kapsamı:
- Cookie consent banner
- Aydınlatma metni güncelleme (yurt dışı aktarım)
- GA4 + Meta Pixel kurulumu (cookie rıza ile bağlı)
- UTM frontend fix (basvuru/page.tsx)
- İYS opt-out altyapısı (sms + email service)
- robots.txt + sitemap.xml
- /kvkk-basvuru sayfası (DataSubjectRequest endpoint'e — TUR #23 sonrası)
- /cerez-politikasi + /kullanim-kosullari sayfaları
- Footer'da yasal link bütünlüğü

**Tahmini süre:** 1 hafta. KIRMIZI nokta var (env değişikliği — GA4_ID, META_PIXEL_ID + npm install — cookie consent kütüphanesi).

#### FAZ 2 — Dönüşüm + Marka Yüzü (NOW + MUST, FAZ 1 sonrası)
TUR #26 kapsamı:
- qualificationScore gerçek AI hesaplama (analyzer.service genişletme)
- LexScan → /basvuru prefill köprüsü
- Niş landing pages (3 başlık: trafik / iş / sigorta-ret)
- Anasayfa yeniden tasarım (hero animasyonu, süreç animasyonu, sosyal kanıt, müvekkil yolculuğu)
- Mobil deneyim denetimi
- Erişilebilirlik (a11y) denetimi

**Tahmini süre:** 1-2 hafta.

#### FAZ 3 — Trafik + Ölçüm + İçerik (NOW → NEXT)
TUR #27 + sonrası:
- /dashboard/pazarlama analytics dashboard (UTM kırılım, conversion funnel, KPI kartları)
- Google Ads ilk kampanya (test bütçesi)
- Meta Ads ilk kampanya
- Blog modülü kurulum + 10 başlangıç makale
- Sosyal medya içerik takvimi başlangıcı
- KPI raporu otomasyonu (haftalık)

**Tahmini süre:** sürekli (3+ ay aktif yönetim).

### 25.13 Pazarlama Kararı Filtresi (Karar Vermeden Önce 7 Soru)
Her yeni pazarlama hamlesi (yeni kanal, yeni kampanya, yeni mesaj çerçevesi):
1. **Tüketici hukukuna uygun mu?** (6502 + Reklam Kurulu)
2. **Tedbirge'in LegalTech sıfatına yakışır mı?** (m.25.1-25.2)
3. **Avukat ortakları TBB ihlaline sokuyor mu?** (m.25.3 KIRMIZI çizgi)
4. **KVKK + cookie consent + İYS uyumlu mu?** (m.25.7)
5. **Kod altyapı destekliyor mu?** (m.25.11 tablo)
6. **Hangi FAZ kapsamında?** (FAZ 1 → 2 → 3 sırası m.25.12)
7. **Ölçüm planı ne?** (m.25.10 — KPI hedefi tanımlı mı)

7 evet → uygulanır. Bir hayır → DUR.

### 25.14 Yabancı Pazar (Ayrılmış)
Yabancı plaka kazaları + çoklu dil pazarlama bu maddenin kapsamı dışındadır. İlk evre Türkiye geneli. Yabancı pazar açılımı **Madde 26** ile düzenlenir, ülkeye özel hukuki danışmanlık + ek araştırma sonrasında.

---

## DOĞRULAMA SORULARI (Mehmet Bey için)

1. Madde 25'in toplam alt madde sayısı: **14** (25.1 → 25.14)
2. FAZ 4 tanımlı mı? (Madde 25.12 kontrolü): **HAYIR** — Madde 25.12 FAZ 1, FAZ 2, FAZ 3 tanımlı. FAZ 4 yok.
3. Madde 25.11 kontrol listesi tablosu mevcut mu: **EVET** — 15 satırlık tablo, satır 1186–1202 arası.

---

— Claude Code, Madde 25 metin çıkarma sonu
— Sıfır kod değişikliği (Madde 21.2 ✓)
— Sıfır commit
