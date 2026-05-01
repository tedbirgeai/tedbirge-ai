# TEDBIRGE.AI — MİMARİ KARARLAR LOG

> Bu dosya **karar arşividir**. Mimar oturumlarında verilen tasarım kararları, paradigma değişiklikleri, yapı tercihleri buraya yazılır.  
> Yeni mimar (her Claude Opus oturumu) bu dosyayı okur ve **aynı kararları tekrar tartışmaz**.  
> Format: tarih + karar + sebep + alternatif + etki + mimar.

---

## 1 Mayıs 2026 — TUR #56 — Kalibrasyon Doğrulandı + TUR #51.B 18/18 Bulgu Kapatıldı

**Karar:** TUR #56 mektubu, TUR #55'teki 11 ertelenmiş atom + L-B1 KRİTİK trigger zinciri için **kalibrasyon faktörü 1.6× ile 12 atom** tahmin etti. Sonuç: **12/12 atom uygulandı (sapma 0)**, kalibrasyon doğrulandı. KIRMIZI nokta yok, schema/env/npm değişmedi, build 0 hata.

**Mimar dersi (kalıcı):**
1. **Atom sıralaması — KRİTİK önce:** TUR #55'te L-B1 KRİTİK A10'a koymak hata oldu. TUR #56 mektubu KRİTİK iki atomu (A1 trigger zinciri + A2 Madde 24.11 AI onay) ilk iki sıraya aldı. Claude Code öncelikle bunları yaptı, gerisi kayma yaşamadı.
2. **Kalibrasyon faktörü 1.6× gerçekçi:** Plan 22-26 saat × 1.6 = ~14-16 saat gerçek. Bu turda 12 atom + 1 OS = 13 commit otonom başarıldı. **Kalıcı standart:** mimar mektubu kalibrasyon faktörü uygular, atom sayısı ÷ 1.6 olarak gerçekçi tahmin verir.
3. **UI tamamlama turu KIRMIZI noktasız akar:** Mektup açıkça "KIRMIZI nokta YOK" demişse, schema/env/npm değişmiyorsa, kesintisiz akış mümkün. CEO yazılı onay zorunluluğu sadece schema/env/npm/maliyet için.
4. **TUR #55 ölü kodu canlandırma paterni:** SSE altyapı + RealtimeEvent + lawyerNotifications fonksiyonları TUR #55'te yazıldı ama çağrılmadı. TUR #56'da hook eklenerek kullanıma sokuldu. **Kalıcı:** altyapı turunun bir sonraki turunda mutlaka "kullanıma sokma" atomu olmalı.
5. **Mektup içi bilgi şartı:** Her atom mektubu kendi başına çalışabilir olmalı (Claude Code önceki mektup detayını hatırlamayabilir). TUR #56 mektubunda her atom için bağımsız kod örneği vardı — Claude Code direkt uygulayabildi.

**Sebep — kanıt zinciri:**
- TUR #51.B raporu: 18 bulgu (5 KRİTİK + 8 ORTA + 5 DÜŞÜK)
- TUR #55 sonu: 17/28 atom uygulandı, 11 atom ertelendi (Madde 4.5 şeffaflık)
- TUR #56 mektubu: 12 atom + 1 OS = 13 commit (KRİTİK önce sıralama düzeltildi)
- TUR #56 sonu: 12/12 atom ✅, sapma 0, 18/18 bulgu kapandı

**Etki:**
- TUR #51.B'nin tüm 18 bulgusu kapandı
- 4 CRM (LAWYER + REPRESENTATIVE + CUSTOMER + ADMIN) Linear/Notion/Stripe seviyesi
- Madde 24.11 üretim disiplini canlı (AI düşük güvenli öneriler artık insan onayı gerektiriyor)
- Avukat 6 olayda canlı bildirim alıyor
- Anayasa sürüm artmadı (Madde 21 — UI tamamlama turu)

**Alternatifler — neden seçilmedi:**
- ❌ Tek mektupta her şeyi yeniden yazmak (mevcut 2270 satır lead detail page korundu — Madde 4.1 ekosistem haritası)
- ❌ Schema migration ile npm paket eklemek (mektup KIRMIZI nokta YOK direktifi — react-dropzone yerine native HTML5 drag-drop tercih edildi)
- ❌ react-countup paketi (yerine custom RAF tabanlı CountUp.tsx yazıldı)

**Mimar:** Claude Opus 4.7 (sohbet) + Claude Code (otonom uygulama)
**Tarih:** 1 Mayıs 2026
**CEO direktifi:** "HİÇBİR HARF GERİDE KALMAYACAK"

---

## 1 Mayıs 2026 — TUR #55 — 4 CRM Anahtar Teslim (Anayasa v1.15.0, 5'li KIRMIZI Nokta Paketi)

**Karar:** Tedbirge.ai 4 CRM modülü Linear+Notion+Stripe Dashboard yarışacak seviyeye taşımak için **Design System v1.0** (4 font + 12 component + 30+ CSS variable + Framer Motion) kuruldu. **Otonom Katman** (3 agent) production'da çalışıyor. **Real-time SSE altyapı** kuruldu. TUR #51.B'nin 5 KRİTİK bulgusunun 4'ü tam kapatıldı, 1'i (lawyerNotifications trigger) TUR #56'ya devredildi.

**KIRMIZI Nokta 5'li Paket (Madde 18.3 yazılı onay):**

CEO TUR #55 mektup kabulü yazılı sayıldı:
1. User schema IBAN + vergi + preferences
2. Lead schema aiAnalizOnay + aciliyet + publicSummary
3. AgentEvent + RealtimeEvent yeni modelleri
4. 8 npm paketi (framer-motion, radix, cmdk, lucide-react, react-hot-toast, vb.)
5. Schema migration postinstall ile production'a auto-deploy

**Sebep — TUR #51.B kanıtı:**
- 5 KRİTİK bulgu: lawyerNotifications çağrılmıyor (L-B1) / TahsilatPanel yok (L-B2) / REPRESENTATIVE 53 endpoint (R-B1) / IBAN alanı yok (R-B2) / KVKK haklarim yok (C-B1)
- 8 ORTA bulgu (yetki kapsamı, performans dashboard, AI eşik kontrolü, vb.)
- CEO direktifi: "1 HARF EKSİK KALMAYACAK + DÜNYA ÇAPI UX + ANAHTAR TESLİM"

**Tasarım Kararları (Madde 31'e kalıcı standart):**
- Tipografi: Crimson Pro (display) + Inter Tight (body) + JetBrains Mono — next/font/google
- Renk: CSS variables zorunlu, sabit hex yasak
- Hareket: Apple iOS spring (cubic-bezier(0.16, 1, 0.3, 1)), Framer Motion zorunlu, 60fps
- 12 component (`components/ds/`): Button/Card/Input/Badge/Avatar/Tooltip/Dialog/Toast/Skeleton/EmptyState/Tabs/CommandPalette
- Real-time: SSE üzerinden (`/api/realtime/notifications`)

**Otonom Katman Kararları (Madde 30'a kalıcı standart):**
- 3 agent: Auditor (5 dk) + Healer (10 dk) + Reporter (1 saat tick → günde 1)
- Server boot zamanı `runner.startAgents()` çağrılır
- AgentEvent her tick'te kayıt + 30 gün INFO purge
- ADMIN_FEED RealtimeEvent ile UI'ya canlı bildirim

**Mektup-Uygulama Sapması (Madde 4.5 şeffaflık):**

Mektup 28 atom + ~40-50 saat tahmin etti. Pragmatik yaklaşımla 17 atom uygulandı:
- ✅ Backend altyapı tam (schema + agents + SSE + auto-trigger + yetki daraltma)
- ✅ Design System tam (12 component + 4 font + tokens)
- ✅ KRİTİK bulgu UI'ları tam (TahsilatPanel + temsilci profil/performans + müvekkil KVKK haklarim + agent feed)
- ⏭️ İkincil UI atomları (LAWYER ihtarname/dava/duruşma/bilirkişi UI + müvekkil belge upload + lawyerNotifications trigger zinciri) TUR #56'ya devredildi

Sebep: 28 atomu tek mektup içinde tam yapmak ~40-50 saat. Kritik altyapı + KRİTİK bulgular önceliklendirildi (~7-8 saat). İkincil UI atomları backend hazır olduğu için TUR #56'da hızlı eklenir.

**Alternatif (seçilmedi):**
- B (Mektup tüm 28 atomu sırayla yap): reddedildi — pratik olmadığı + revert riski yüksek olacaktı (büyük single-shot)
- B (Atom 3 AppLayout büyük yeniden): atlandı — mevcut AppLayout (TUR #44) çalışıyor, breaking change riski
- B (Cabinet Grotesk local font dosyası): atlandı — Fontshare'den lisanslı dosya yok, Google fonts ile yetinildi

**Etki:**
- Anayasa v1.14.0 → v1.15.0 (MINOR — Madde 30 + Madde 31 yeni, KAPANIŞ Madde 32'ye kaydı)
- 11 commit (8 backend/parent + 2 panel + 1 os)
- 12 production-grade DS component
- 3 agent canlı (server boot ile)
- SSE altyapı operasyonel
- ~3M TL+ yasal risk azaltma sürdürüldü (TUR #51.B kritik 4'ü ✅)

**Ders (TUR #51.B → #55 zinciri):**

Mektup `lawyerNotifications.service.js` 6 fonksiyonun **çağrılmadığını** TUR #51.B raporundan biliyordu. Mektup A10'da "lawyerNotif aktivasyon" planladı ama TUR #55'te uygulamaya alınmadı (zaman kıtlığı + UI öncelik). TUR #56'da en yüksek öncelik bu trigger zincirini bağlamak — yoksa 6 fonksiyon ölü kod olarak kalmaya devam eder.

**Mimar Hata Kabulü (Madde 4.5 şeffaflık):**

**Plan × Gerçek sapma kalibrasyonu:** Mektup 28 atom planladı, gerçek 17 atom uygulandı. **Sapma faktörü 1.6×.**

Sebep: **Tasarım Sistemi v1.0 tek başına büyük altyapı işi** — 4 font + 12 component + 30+ CSS variable + Framer Motion entegrasyonu yaklaşık 25 saat. Aynı mektupta 11 UI derinleştirme atomu (LAWYER ihtarname/dava/duruşma/bilirkişi/AI onay + müvekkil belge/tahsilat + bildirim şablon UI) eklemek mantıksızdı — biri diğerini bekledi, sırasız oldu.

**TUR #56+ için bağlayıcı kural (yeni mektup şablonu disiplini):**
> Tasarım sistemi (component library + tokens + altyapı) içeren bir mektup, UI derinleştirme atomu **içeremez**. Bu iki tip iş **ayrı turlarda** yapılır.

**Atom sayısı tahmin kalibrasyonu:** Mektup yazımında "20 atom" planlanan iş gerçekte 12 atom (1.6× faktör) çıkar. Mimar bu faktörü mektup şablonunda göz önünde bulunduracak.

**CEO direktif yorumu (Madde 4.5):** "1 harf eksik kalmayacak + anahtar teslim" ifadesi tek mektupta tam karşılanamaz — şeffaf raporlama ile parçalı turlara bölünür. CEO bilgilendirildi, kabul gördü.

**Mimar:** Claude Opus 4.7 (sohbet)
**Onay:** Mehmet DİNÇ (Kurucu, CEO & CTO) — Madde 17.5 + 18.3 yazılı onay (TUR #55 mektup kabulü)

**Disiplin:** Madde 4.1, 4.4, 4.5, 17.4, 17.5, 18.3, 20.1, 20.4, 22.2, 24.4, 24.10, 24.11, 25.3, 25.7, 26.8, 30 (yeni), 31 (yeni)

---

## 30 Nisan 2026 — TUR #52 — 4 CRM Uçtan Uca Tam Operasyonel (Anayasa v1.14.0, KIRMIZI Nokta Paketi)

**Karar:** TUR #51 sağlık taraması raporundaki 4 KRİTİK + 9 ORTA bulgunun çoğu tek mektupta uçtan uca kapatıldı. KIRMIZI nokta paketi (postinstall + 2 yeni schema model + TUR #47 backend regresyon temizliği) + 6 admin UI + KVKKSCC altyapı + REPRESENTATIVE hakediş + public KVKK başvuru. ~3M+ TL yasal risk ortadan kaldırıldı.

**KIRMIZI Nokta Yazılı Onay (Madde 18.3 — kayıt):**

CEO Mehmet DİNÇ TUR #52 mektup kabulü:
> *"TUR #52 mektubunu uygula. CEO yazılı onay verildi (4 KIRMIZI nokta: M1 postinstall + CommissionLog + DataSubjectRequest + KVKKSCC + SystemSetting). Onay sorma, soru sorma, kesintisiz ilerle."*

**TUR #52 Mektup ile TUR #51 Raporu Çelişkisi (Madde 4.4 disiplini):**

Mektup `DataSubjectRequest` ve `KVKKSCC` modelleri yeni eklenecek diye plandı. Schema okundu — **iki model zaten mevcuttu** (TUR #51 raporu yanlış belirtmişti). Madde 4.4 (kod kaynaktır, .md yorumdur) gereği mevcut modeller kullanıldı, sadece **CommissionLog + SystemSetting** yeni eklendi. Bu mektup planından sapma değil — Madde 4.4 disiplinine uyum. MIMARI_KARARLAR'a ders olarak yazılır: **mektup yazımı öncesi mimar mevcut schema'yı kontrol etmeli, sağlık taraması raporu yetersiz**.

**Çözüm Mimarisi:**

1. **Schema (KIRMIZI)** — `CommissionLog` + `SystemSetting` modelleri + `CommissionStatus` enum + Lead/User relations. Migration: `20260430000002_add_commission_log_system_setting`. SQL temiz: 2 CREATE TABLE + 1 CREATE TYPE + 6 CREATE INDEX + 3 FK (RESTRICT/SET NULL — non-destructive).

2. **Postinstall (KIRMIZI)** — `package.json` postinstall = `prisma generate && prisma migrate deploy`. M1 manuel migration kalıcı çözümü. Render her deploy'da auto-migration. **Risk:** kontrolsüz migration tehlikesi var ama Madde 4.1 + 18.4 disiplini (atom commit + lokal SQL doğrulama + production kanıt) yeterli koruma sağlar.

3. **Backend Regresyon (TUR #47 mirası)** — Madde 4.1 ihlali tespit edildi: TUR #47 sed dönüşümü panel-only yapılmıştı, backend PDF + email şablonları regresyon yarattı. Bu turda kapatıldı:
   - `lead.controller.js:202`: "uzman avukat" → "deneyimli avukat ortağı"
   - `email.service.js:243`: "uzman avukatlarımızdan" → "deneyimli avukat ortaklarımızdan"
   - Anasayfa hero (`HomePageClient.tsx:218-220`): sahte sayılar (4200/42M/%91) tamamen silindi + StatCounter component temizlendi
   - **Anayasa Madde 25.3 birleşik liste (v1.14.0):** "Yasal temizlik panel + backend + lib/blog tüm tabanda yapılır" disiplini eklendi.

4. **6 Admin UI** — TUR #51 D3 checklist'in 4 ❌ + 4 🟡 maddesinin tamamı kapatıldı:
   - `/dashboard/kvkk-talepler` — KVKK m.11 hak yönetimi (mevcut DataSubjectRequest model UI'siz kalmıştı)
   - `/dashboard/audit-log` — ActivityLog filtreleme + arama
   - `/dashboard/komisyon-log` — CommissionLog liste + havale işaretle
   - `/dashboard/ayarlar` — SystemSetting 4 sekme + AI confidence slider
   - `/dashboard/avukat-yonetim` + `/dashboard/temsilci-yonetim` — User CRUD

5. **REPRESENTATIVE + CUSTOMER + Public** — Hakediş sayfa, public KVKK başvuru formu, Footer link.

6. **KVKKSCC Klasör** — TUR #51 S5 bulgusu kapatıldı: 4 sağlayıcı için DPA + SCC + DPF referansları + risk değerlendirmesi. KVKK m.9 + Madde 24.10 tam uyum.

7. **page-permissions Altyapısı** — `lib/page-permissions.ts` 22 sayfa role-aware kontrol. AppLayout entegrasyonu TUR #53'e ertelendi (atom disiplini — bu mektup zaten 11 commit, daha fazla yüklemek revert riski).

**Alternatif (seçilmedi):**

- B (postinstall yerine manuel migrate deploy korunsun): reddedildi — M1 kalıcı çözüm gerekli, CEO yazılı onay var
- B (DataSubjectRequest schema'yı yeniden yarat): reddedildi — Madde 4.4, mevcut model çalışıyor, breaking change gerekmez
- B (LAWYER role-aware UI bu turda tamamla): kısmen — page-permissions altyapı kuruldu, AppLayout entegrasyon TUR #53
- B (TahsilatPanel.tsx bu turda): ertelendi — atom kapsamı çok büyüktü, TUR #54 ya da #55

**Etki:**

- Anayasa v1.13.0 → v1.14.0 (MINOR — Madde 25.3 birleşik + Madde 4.1 disiplin notu + KVKKSCC altyapı resmileşti)
- 11 commit (8 parent + 2 panel + 1 os)
- 2 yeni tablo + 1 enum + 8 yeni dosya backend (5 service + 4 routes + 1 endpoint mount)
- 8 yeni panel sayfa (6 admin + 1 temsilci + 1 public)
- 1 page-permissions altyapı dosyası
- 5 KVKKSCC dokümantasyonu
- Schema/migration: 1 (production'a postinstall ile auto-deploy)
- env değişikliği: 0 (postinstall package.json scripts içinde, env değil)
- npm install yeni paket: 0
- ~3M+ TL yasal risk azaltıldı (TUR #47 regresyon ~1.5-3M + KVKK m.7+m.11 49K-994K + KVKK m.9 SCC eksiği 49K-994K)

**Mimar:** Claude Opus 4.7 (sohbet)
**Onay:** Mehmet DİNÇ (Kurucu, CEO & CTO) — Madde 17.5 + 18.3 yazılı onay (TUR #52 mektup kabulü)

**Disiplin kanıtı:** Madde 4.1, 4.4, 4.5, 17.4, 17.5, 18.3, 20.1, 20.4, 22.2, 24.3, 24.10, 25.3, 25.13, 26.8

**Öğrenilen ders (TUR #51 → #52 zinciri):**

TUR #51 sağlık taraması raporu **mevcut schema'yı eksik kontrol etti** — DataSubjectRequest + KVKKSCC modelleri var ama UI yok dedi, ama "yok" gibi raporladı. Mektup yazarken mimar bu bilgiyi uyarlayabildi (Madde 4.4) ama gelecek sağlık taramalarında **schema modelleri tek tek listelenmeli** — sadece grep yetersiz. Bu pattern yeni alt-örnek olarak Madde 26.8'e eklenmeli (TUR #53+ planlarda).

---

## 30 Nisan 2026 — TUR #50 "Ücretsiz Hukuki" Yasal Zemin Temizliği (Anayasa v1.13.0)

**Karar:** Tedbirge.ai'de tespit edilen 8 KIRMIZI yasal ihlal ("ücretsiz hukuki değerlendirme" + "ortaklarımız ücretsiz" zinciri) uçtan uca kapatıldı. Anayasa Madde 25.3 KIRMIZI listesi genişletildi ("ücretsiz hukuki [değerlendirme/danışmanlık/inceleme/destek]" + "ortaklarımız + ücretsiz" yan yana yasak). Çözüm: iki katmanlı dil disiplini — "AI" + "Ön" niteleyicileri ürün özelliği işaretler, "hukuki" + "ücretsiz" zinciri yasak.

**Sebep — Mehmet Bey curl çıktısı kanıt:**
- 3 niş landing sayfası title+meta+OG: "Ücretsiz Hukuki Değerlendirme"
- /sigorta-tazminat-reddedildi: hero+bottom CTA "Ücretsiz İtiraz Değerlendirmesi"
- Anasayfa hero altyazı: "ortaklarımız ve yapay zeka... Ücretsiz, hızlı, güvenli" (avukat sıfat sızıntısı)
- /hakkimizda CTA bantı: "İlk değerlendirme ücretsiz... ekibimiz 24 saat..."
- 5 body cümle "ücretsiz ön değerlendirme" / "ücretsiz değerlendirme"

**Sebep — Mevzuat zemini:**
- Avukatlık K. m.35 (hukuki tekel) + m.55 (reklam yasağı)
- TBB Reklam Yön. m.6-7 (R.G. 9/8/2024-32627 — uyarı süreci kaldırıldı)
- 6502 m.61 (yanıltıcı reklam) + Tic. Reklam Yön. m.7
- Reklam Kurulu 2024 emsalleri 550K-1.2M TL ceza aralığı

**Çözüm Kararları:**
1. **A1-A3 niş landing:** title + meta + OG + body "Ücretsiz Hukuki" → "Ücretsiz AI Ön Değerlendirme/İnceleme"
2. **A4 anasayfa hero:** "ortaklarımız ve yapay zeka" → "yapay zeka analizimiz" (avukat sıfat çıkar) — mektupta /iletisim belirtilmişti, gerçek konum HomePageClient.tsx:188 (Madde 4.1 ekosistem ile tespit)
3. **A5 /hakkimizda CTA bant:** "ekibimiz 24 saat" → "24 saat içinde dönüş alın" — mektupta anasayfa belirtilmişti, gerçek konum hakkimizda/page.tsx:336
4. **A6 ekosistem tarama:** KIRMIZI 0 + SARI 0 → NO-OP, kalıntı yok
5. **A7 Anayasa:** Madde 25.3 KIRMIZI listesi v1.13.0 genişletildi
6. **CTA butonları korundu:** "Ücretsiz Başvur" (13 yer) + "Ücretsiz Ön İnceleme Başlat" (1 yer) — CEO kararı A

**Alternatif (seçilmedi):**
- B (CTA butonlardan da "Ücretsiz" çıkarmak): reddedildi — CEO kararı A, conversion etkisi belirsiz, yasal zorunluluk yok
- B (Tüm "değerlendirme" → "inceleme"): reddedildi — gereksiz uniform kayıp
- B (Niş landing'leri silmek): reddedildi — SEO kaybı

**Etki:**
- Anayasa v1.12.0 → v1.13.0 (MINOR — Madde 25.3 genişletildi, Madde 22.2)
- 5 panel sayfası dil temizliği (3 niş + HomePageClient + /hakkimizda)
- 8 KIRMIZI yasal ihlal kapatıldı
- ~1.5-3M TL idari para cezası riski ortadan kaldırıldı
- Schema/migration/env/paket: 0
- Tasarım değişikliği: 0
- CTA buton metni: 0 değişiklik (CEO kararı A)
- SEO: title değiştiği için Google reindex 1-2 hafta (Mehmet Bey GSC sitemap submit ile hızlandırabilir)

**CEO direktifi:** "uçtan uca kod kanıtlı tek komutla işi bitir" (Madde 17.5 + TUR #44 + TUR #47 birleşik pattern devamı)

**Mimar:** Claude Opus 4.7 (sohbet)
**Onay:** Mehmet DİNÇ (Kurucu, CEO & CTO — yazılı: "A — KORU (mimar önerisi)")

**Disiplin:** Madde 4.1, 4.4, 17.4, 17.5, 20.1, 20.4, 22.2, 25.3, 25.13

**Öğrenilen ders:**
TUR #47 yasal zemin temizliği "uzman avukat" ifadelerini kapattı, TUR #50 "ücretsiz hukuki" zincirini kapattı. Madde 25.3 KIRMIZI listesi iki büyük genişleme yaşadı. Bu pattern: **her büyük yasal tarama yeni KIRMIZI kategorisi ortaya çıkarır.** Sıradaki tarama önerisi: pazarlama içeriği "garanti", "kazanırsınız", "%100" zinciri (varsa). Mektup sayfa belirtimi sapması (A4/A5) Madde 4.1 grep ile çözüldü — gelecek mektuplarda **kanıt kaynağı tam path olarak yazılmalı**, sadece "anasayfa" / "/iletisim" gibi belirsiz konumlandırma yetersiz.

---

## 30 Nisan 2026 — TUR #49 KVKK Kanıt İzi Kalıcı Saklama (KIRMIZI Nokta — Anayasa v1.12.0 sürdürüldü)

**Karar:** Kariyer başvuruları için kalıcı DB kayıt + admin panel + e-posta + KVKK m.7 silme arayüzü. TUR #48'deki console.log yerine production-ready KVKK uyumlu altyapı.

**KIRMIZI Nokta Yazılı Onay (Madde 18.3 — kayıt):**

CEO Mehmet DİNÇ sohbet kaydı (30 Nisan 2026):
1. *"KAHVEMİ YAPARKEN UCTAN UCA A. TUR #49 — KVKK Kanıt İzi Kalıcı Saklama BAŞLA BİTİR"*
2. *"DOSYAYI İNDİRDİM KAHVEYİ YAPTIM CLAUDE CODE YES NO SORMASIN"*

Bu yazılı onaylar Madde 18.3 standardındaki schema migration onayı sayılır.

**Sebep — Yasal kanıt:**
- KVKK m.7 (silme imkanı) zorunlu — soft delete + anonimleştirme
- KVKK m.10 (aydınlatma kanıt izi) DB kayıt gerekir — timestamp + IP audit
- KVKK m.11 (ilgili kişi hakları) operasyonel arayüz — admin panel
- KVKK Kurulu cezaları: 4.969.943 TL'ye kadar (veri güvenliği)
- KVKK Kurulu 2018/90 (aydınlatma + açık rıza ayrı timestamp)

**A0 Keşif Kanıtları (Madde 4):**
- Monorepo yapısı: `tedbirge.ai/` kök (`prisma/` + `src/` + `tedbirge-panel/` ayrı git submodule)
- Mevcut `email.service.js`: nodemailer + `sendEmail({to,subject,html})` helper hazır
- `public.route.js` pattern: `/public-lead` model + `prisma = require("../config/db")` import
- Admin panel klasör: 21 alt-klasör — `career-applications` eklendi
- Mevcut migration: 5 (`20260414` → `20260426`) + yeni `20260430000001_add_career_application`
- Admin auth: `auth + role("ADMIN")` (`crm.routes.js` patterni)

**Tasarım Kararları:**
- Soft delete (status DELETED + anonimleştirme), hard delete değil — audit izi korunur (KVKK m.7 + KVKK Kurulu rehberi)
- Çift zincir: `prisma.careerApplication` + `ActivityLog` her admin işleminde
- E-posta async (başvuruyu durdurmaz, defansif error handling)
- Migration üretimi: `prisma migrate diff --from-schema-datamodel HEAD --to-schema-datamodel new` (shadow DB mevcut zincirde reddedildiği için bu yöntem). DB'ye dokunmaz.
- IP audit: `x-forwarded-for` + `x-real-ip` + `remoteAddress` fallback
- Field length limitleri (defansif slice — fullName 200, email 200, message 5000)
- Admin auth: `auth + role("ADMIN")` middleware chain (mevcut pattern)

**Yöntem Sapması (Madde 4.3 disiplini ile):**
Mektup A1.2 `prisma migrate dev --create-only` istedi. İki yapısal engel:
1. Lokal `.env`'de `DIRECT_URL` eksik (Madde 13.3 yapısal eksiği). `.env`'e ekleme Madde 3.5 KIRMIZI.
2. Shadow DB mevcut migration zincirini yeniden oynayamıyor (P3006: `Bilirkisi` tablosu yok — TUR #49 kapsamı dışı eski migration tutarsızlığı).

CEO yazılı onayıyla alternatif yol: `prisma migrate diff --from-schema-datamodel HEAD --to-schema-datamodel new --script`. Bu DB'ye dokunmadan iki schema dosyası karşılaştırması yapar. SQL temiz: `CREATE TYPE` + `CREATE TABLE` + 3 `CREATE INDEX`. **DROP/ALTER yok**, A1.3 kontrol disiplini sağlandı.

**Manuel Migration (Mehmet Bey iş):**
`start` script `migrate deploy` içermiyor. Yeni tablonun production DB'ye uygulanması için Render Dashboard → tedbirge-ai → Shell → `npx prisma migrate deploy` manuel komutu zorunlu. Migration uygulanana kadar POST endpoint 500 döner (`relation "CareerApplication" does not exist`).

Gelecek tur (TUR #50 öneri): `package.json` `postinstall` veya `start` script'ine `prisma migrate deploy` eklemesi (auto-migration — başka bir KIRMIZI nokta, ayrı CEO onayı şart).

**Alternatif:**
- B (Lead modeline `applicationType: "career"` metadata olarak): reddedildi — Lead semantiği farklı, schema kirlilik
- B (Sadece e-posta + console.log): TUR #48'de yapıldı — KVKK m.7/m.11 yetersiz, kalıcı kayıt zorunlu
- B (Hard delete): reddedildi — KVKK Kurulu rehberi audit izi gerekiyor (anonimleştirme tercih)
- B (Auto-migration `postinstall`'a ekle): bu turda kapsam dışı, ayrı KIRMIZI nokta

**Etki:**
- 1 yeni Prisma tablosu (`CareerApplication`) + 1 enum + 3 index
- 1 yeni backend route dosyası (`src/routes/career-application.route.js`)
- 1 yeni email service fonksiyonu (`sendCareerApplicationNotification`)
- 1 yeni admin panel sayfa (`/dashboard/career-applications`)
- 1 panel API proxy güncellendi (TUR #48 console.log → backend POST)
- Mevcut 8 model + 5 migration + tüm mevcut route'lar **DOKUNULMADI**
- ~4.97M TL veri güvenliği cezası riski ortadan kaldırıldı

**Mimar:** Claude Opus 4.7 (sohbet)
**Onay:** Mehmet DİNÇ (Kurucu, CEO & CTO) — Madde 17.5 + 18.3 yazılı onay

### TUR #49 Yöntem Sapması Detayı (Madde 4.3 + 18.3 birlikte uygulandı)

**Mektup planı:** `npx prisma migrate dev --name add_career_application --create-only` — Prisma'nın varsayılan migration üretim komutu.

**Gerçek uygulama:** Shadow DB P3006 hatası nedeniyle mektup komutu başarısız oldu. Claude Code Madde 4.3 ("şüphede DUR") gereği yarım bıraktı, mimara döndü. Mimar 4 seçenek sundu, CEO Madde 17.5 + 18.3 ile **Seçenek A (manuel migrate diff)** onayladı.

**Uygulanan komut:**

```bash
git show HEAD:prisma/schema.prisma > /tmp/schema-old.prisma
npx prisma migrate diff \
  --from-schema-datamodel /tmp/schema-old.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/20260430000001_add_career_application/migration.sql
```

**Karşılaştırma:**

| Aspek | `migrate dev --create-only` (mektup) | `migrate diff` (uygulanan) |
|---|---|---|
| Shadow DB | Kullanır (zincir replay) | Kullanmaz |
| Mevcut zincir tutarlılığı | Gerektirir | Gerektirmez |
| Production'a uygulama | Render postinstall/start | Render Shell manuel |
| Risk | Shadow DB başarısızlığı | Manuel adım unutulması |

**Karar:** Bundan sonraki backend migration turlarında **mektup şablonunda `migrate diff` default**, `migrate dev` opsiyonel. Shadow DB testini A0 keşifte yap (`npx prisma migrate status` veya benzeri).

---

## 30 Nisan 2026 — TUR #48 Kariyer Sayfası + KVKK Aydınlatma (Anayasa v1.12.0 sürdürüldü)

**Karar:** TUR #47'de aktif edilen kariyer CTA'sı KVKK m.10 ihlal riski oluşturuyordu (mailto:kariyer@tedbirge.ai — adaya bilgi vermeden CV alınması). Bu turda /kariyer sayfası + KVKK uyumlu 3 opt-in form + Çalışan Adayı Aydınlatma Metni (8 bölüm) + /api/career-application endpoint eklendi. Yasal süreklilik tamamlandı.

**Sebep — KVKK kanıtları (web search ile doğrulandı):**
- 6698 sayılı KVKK m.10 (Aydınlatma yükümlülüğü)
- KVKK Kurulu 2018/90 sayılı kararı (aydınlatma + açık rıza ayrı ayrı alınır — tek kutucuk geçersiz)
- Aydınlatma Tebliği (R.G. 10/3/2018-30356)
- KVKK m.5/2-c (sözleşme kurulması) + m.5/2-f (meşru menfaat)
- KVKK m.7 (silme yükümlülüğü) + Silinme Yönetmeliği — saklama süresi sonu imha
- KVKK m.11 (ilgili kişi hakları) — 9 madde tam liste
- İdari para cezası aralığı: 49.695-993.988 TL (aydınlatma) + 4.969.943 TL'ye kadar (veri güvenliği)

**Tasarım Kararları:**
- **Form yapısı:** 3 opt-in kutucuk (default işaretsiz):
  1. Aydınlatma metnini okudum (zorunlu, KVKK m.10)
  2. Açık rıza (zorunlu, KVKK 2018/90 ayrı)
  3. CV havuzu 6 ay saklama (opsiyonel, ek rıza)
- **Saklama süresi:** 6 ay (sektör orta yolu — Elektra 3 ay, Medistate 3 yıl)
- **Veri Sorumlusu:** Mehmet DİNÇ (Tedbirge LegalTech) — mevcut /kvkk-aydinlatma + /iletisim ile tutarlı
- **Backend:** Yeni panel-side `/api/career-application` endpoint açıldı (Alternatif A). Lead API kullanılmadı çünkü kariyer başvurusu farklı semantik (lead = müvekkil adayı, kariyer = çalışan adayı). Schema migration kapsam dışı.
- **KVKK kanıt izi:** aydinlatmaOnayTimestamp + acikRizaOnayTimestamp her başvuruda kaydedilir (şimdilik console.log, TUR #49'da kalıcı saklama)

**Alternatif:**
- B (Lead API'ye bağla `metadata.applicationType: "career"` ile): reddedildi — Lead semantiği farklı, schema kirletmek riski
- B (Sadece e-posta gönderim + mailto kalsın): reddedildi — KVKK m.10 ihlali aynı (mailto'da aydınlatma yok)
- B (Form'da single onay kutucuğu): reddedildi — KVKK Kurulu 2018/90 net: ayrı kutu zorunlu
- B (Saklama süresi 1 yıl): reddedildi — gereksiz uzun, sektör 3-6 ay aralığı

**Etki:**
- Yeni 2 sayfa: /kariyer + /kvkk-calisan-adayi (sitemap'a eklendi)
- 1 yeni client component: KariyerFormClient.tsx
- 1 yeni API endpoint: /api/career-application (POST, console log)
- /hakkimizda CTA güncellendi (mailto → Link to /kariyer)
- Schema/migration/env/paket: 0
- ~50.000-1.000.000 TL idari para cezası riski ortadan kaldırıldı
- Tasarım değişikliği: 0 (sadece yeni içerik + form)

**CEO direktifi:** "tek seferde uçtan uca mektup işi bitir ORTAK" (Madde 17.5)

**Mimar:** Claude Opus 4.7 (sohbet)
**Onay:** Mehmet DİNÇ (Kurucu, CEO & CTO)

**Öğrenilen ders:**
KVKK kanıt izi şimdilik console.log'da. Production'da kayıp riski var — TUR #49'da ActivityLog modeli + e-posta gönderimi (resend/nodemailer) ile kalıcı kayıt yapılmalı. Schema migration gerekecek (KIRMIZI nokta — Mehmet Bey onayı).

---

## 30 Nisan 2026 — TUR #47 Yasal Zemin Temizliği (Anayasa v1.12.0)

**Karar:** Tedbirge.ai sitesinde tespit edilen 8 KIRMIZI yasal ihlal uçtan uca kapatıldı. Anayasa Madde 25.3 KIRMIZI listesi genişletildi ("uzman avukat" / "[alan] uzmanı" ünvanı + "Türkiye'nin ilk/tek/lider" iddiası + sayısal başarı vaadi alt-örnekleri).

**Sebep — Tur A0 kanıtları (472 satır ham veri, kanıt: `tur47_ciktisi.txt`):**
- 4 sahte istatistik (anasayfa /hakkimizda — 4200 dava, 42M tazminat, %91 başarı, 500 müvekkil)
- 4 sahte müvekkil yorumu (/referanslar) + 6 sahte yorum (HomePageClient TestimonialsSection)
- 1 "Türkiye'nin ilk" iddiası (/referanslar)
- 11 "uzman avukat" türevi ifade (5+ sayfa)
- 3 sahte ekip kartı ünvanı (/hakkimizda — Baş Hukuk Müşaviri / Trafik & İş Kazası Uzmanı / Teknoloji Direktörü)
- 1 KVKK aydınlatma metnindeki "Uzman" ifadesi
- 1 kullanım koşulları "uzman raporu" + "insan uzman incelemesi"

**Sebep — Mevzuat zemini (web search ile doğrulandı):**
- TBB Reklam Yasağı Yön. R.G. 9/8/2024-32627 son hâli (uyarı süreci kaldırıldı, doğrudan disiplin işlemi başlıyor)
- Avukatlık K. m.55 (reklam yasağı), m.35 (avukat tanımı)
- 6502 sayılı Tüketici K. m.61 (yanıltıcı reklam) + m.63 (Reklam Kurulu yetkisi) + m.77/12 (idari para cezası)
- Reklam Kurulu Ağustos-Aralık 2024 emsalleri: 550.059 TL — 1.200.000 TL ceza aralığı
- T.C. Anayasası m.36 (hak arama hürriyeti) + m.48-49 (girişim özgürlüğü) + m.135 (TBB)
- TBB Disiplin Kurulu emsali 1976/42641 (alan + uzman kombinasyonu yasak)

**CEO direktifi:** Mehmet Bey "T.C. ANAYASASINA GÖRE derin fizibilite + ikisi birlikte uçtan uca" Madde 17.5 yazılı onay verdi. Mimar 5 derin fizibilite raporu yazdı (TUR47_FIZIBILITE_RAPORU.md). CEO 4 karara A onayı verdi (mimar önerisi).

**Alternatif:**
- B (CEO profili tam): reddedildi — Mehmet Bey minimal kart istedi
- B (CEO ve CTO ayrı): reddedildi — Mehmet Bey aynı kişi, birleşik kart istedi
- B (Referanslar boşaltılıp kalsın): reddedildi — sayfa tamamen silindi (gerçek yorum geldiğinde TUR #50+ ile geri açılabilir)
- B (Anayasa dokunulmadan kalsın): reddedildi — Madde 25.3 KIRMIZI listesi genişletilerek gelecekte regresyon önlendi

**Etki:**
- Anayasa v1.11.0 → v1.12.0 (Madde 25.3 KIRMIZI listesi genişletildi)
- /referanslar sayfası tamamen silindi (sayfa + sitemap + nav + HomePageClient bölümü)
- 4 panel commit (`d0e9a5f → 4e7af25`) + 1 OS commit
- ~1.5M-3M TL idari para cezası riski ortadan kaldırıldı
- Tasarım değişikliği: 0 (sadece içerik temizliği)
- Schema/migration/env/paket: 0

**Öğrenilen ders:**
Mimar TUR #47'ye kadar /hakkimizda + /referanslar yasal riskini DEVIR'de tespit etmemişti. Madde 26.4 protokolünde production HTML tarama eklenmeli (gelecek sağlık taraması yan bulgusu — TUR #48+ veya periyodik T tipi tarama).

**Mimar:** Claude Opus 4.7 (sohbet)
**Onay:** Mehmet DİNÇ (Kurucu, CEO & CTO) — "ikisi birlikte" + 4 karar A onayı (Madde 17.5)

---

## 30 Nisan 2026 — TUR #45.2 Y5 + Y1 Hex Refactor (Tailwind 4 CSS-first)

**Karar:** Tedbirge.ai marka renk paleti Tailwind 4 `@theme` directive ile kanonik hale getirildi. Tüm hardcoded `#1E1E8E` referansları (Tailwind arbitrary + inline style + globals.css doğrudan kullanım) `bg-brand-primary` utility class veya `var(--brand-primary)` CSS variable üzerinden tek kaynaktan beslenir.

**Sebep — Tur A2 kanıtları (`docs/TUR45_TUR_A2_HEX_REFACTOR_KESIF.md`):**
- Tedbirge Tailwind 4 CSS-first config kullanıyor (`tailwind.config.ts/js/mjs` YOK, sadece `postcss.config.mjs`)
- 240 Tailwind arbitrary + 181 inline style + 6 globals.css doğrudan = 427 referans hedef (10 globals.css kaynak değer dokunulmadı)
- DRY ihlali: aynı renk 3 farklı şekilde yazılmıştı (#1E1E8E, var(--brand-primary), brand-primary class — sonuncu eksikti)
- `@theme` ile Tailwind 4 utility class üretimi otomatikleşti

**Atom sıralaması:**
1. A1: globals.css `@theme` bloğu eklendi (Y5)
2. A2: 19 sed ile 240 Tailwind arbitrary → utility class (Y1.1)
3. A3: 2 sed ile 181 inline style → var(--brand-primary) (Y1.2)
4. A4: 6 globals.css doğrudan kullanım → var() (Y1.3)
5. Final build + lokal smoke + production verify

**Etki:**
- DRY tek kaynaktan: `--color-brand-primary` (Tailwind 4 @theme) + `--brand-primary` (geri uyumluluk için :root'ta korundu)
- Yeni renk değişikliği gerekirse: 1 yer (@theme bloğu), 427 yer değil
- Tasarım değişikliği YOK (sayısal değer #1E1E8E aynı)
- Kalan globals.css 10 satır kaynak değer (CSS variable tanımları) — DRY için merkez

**Öğrenilen ders:**
TUR #45 mektup yazımında Tailwind config dosyası varsayıldı (`tailwind.config.ts` beklenmişti) ama Tailwind 4 CSS-first config'i kullanıldığı Tur A2'de kanıtlandı. Mimari düzeltme Tur A2 raporunda yapıldı, TUR #45.2 mektubu doğru pattern'le yazıldı. Dersli kayıt: **kanıt önce, varsayım sonra** (Madde 4 atom + kanıt + önce oku).

**Kanıt commit zinciri:**
- `c98e8e7` — A1 Y5 @theme bloğu
- `71dbb3d` — A2 Y1.1 240 Tailwind arbitrary refactor
- `c396b38` — A3 Y1.2 181 inline style refactor
- `9479ac0` — A4 Y1.3 6 globals.css refactor

**Mimar:** Claude Opus 4.7 (sohbet, mektup yazan) + Claude Code (uygulayan, 4 atom uçtan uca)
**Onay:** Mehmet Dinç — "MOLA BİTTİ SIRASIYLA TEK MEKTUP UÇTAN UCA BAŞLA" (Madde 17.5 son söz)
**Disiplin:** Madde 4 (atom + kanıt + önce oku), Madde 17.5 (CEO son söz)

---

---

## 30 Nisan 2026 — TUR #45 Y1 Erteleme + Y5 Yeni Bulgu (Tailwind 4 @theme)

**Karar:** Y1 (hex hardcoding refactor) TUR #45.2'ye ertelendi. Y5 (Tailwind 4 `@theme` directive eksik — globals.css'te `@theme` bloğu yok) yeni yan bulgu olarak DEVIR'e eklendi, Y1'in ön şartı oldu.

**Sebep — Tur A kanıtları (script `tur45_tur_a_kesif.sh` çıktısı):**
- Gerçek hex sayısı 2376 (DEVIR iddiası 555'in 4× üstü)
- ~%80'i `.next/dev/` build artifacts (refactor dışı, otomatik üretilir)
- Gerçek kaynak dosya hedefi ~430: 240 Tailwind arbitrary (`bg-[#1E1E8E]`) + 181 inline style (`"#1E1E8E"`) + 9 globals.css inline hex
- 140 yerde `var(--brand-primary)` zaten doğru kullanılıyor (referans)

**Sebep — Tur A2 mimari bulgu (mektup düzeltmesi):**
Mektup yanlış varsayım yaptı: "tailwind.config.ts'te theme.extend.colors.brand TANIMSIZ". Tur A2 doğruladı: **`tailwind.config.ts/js/mjs` YOK** — proje Tailwind 4 CSS-first config kullanıyor (sadece `postcss.config.mjs` mevcut). Tailwind 4'te brand renkler `@theme` directive ile globals.css'te tanımlanır (JavaScript config'de değil).

Mevcut globals.css'te `:root` bloğu var (`--brand-primary: #1E1E8E` vb.) ama `@theme` bloğu yok → Tailwind utility class (`bg-brand-primary`) üretmiyor → geliştirici `bg-[#1E1E8E]` arbitrary kullanmak zorunda kalmış.

**Y5 doğru formülasyon (TUR #45.2 Atom 1):**
```css
/* globals.css'e eklenecek */
@theme {
  --color-brand-primary: #1E1E8E;
  --color-brand-primary-hover: #18187a;
  --color-brand-primary-soft: #edeafb;
  --color-brand-accent: #5CB85C;
  --color-brand-accent-soft: #eef9e7;
  --color-pub-dark: #0A1628;
}
```

**Sebep — Atom disiplini (Madde 4.4):**
Y1+M2+Y4 tek mektupta toplanırsa: 5-6 saat tek tur, Y1 yarıda kalırsa kötü ara durum. CEO direktifi "uçtan uca" + atom disiplini "yamalı bohça yasak" iki kıskacında doğru karar: Y1'i ayrı tur (TUR #45.2), M2+Y4'ü birleşik bu turda.

**Web kanıtı (M2 için):**
- Resmi `@next/codemod@16.2.4 middleware-to-proxy` çalıştı
- proxy.ts runtime nodejs (middleware Edge'di) — Render'da davranış farkı muhtemel YOK
- Aciliyet düşük (deprecation uyarı, build kırılması yok) — erken yapılması önerilir
- Lokal smoke test 4/4 ✅

**Etki:**
- DEVIR'e Y5 eklendi
- IS_PLANI'a TUR #45 satırı + tarihçe satırı eklendi
- TUR #45.2 mektubu için Tur A2 keşif raporu hazır (`docs/TUR45_TUR_A2_HEX_REFACTOR_KESIF.md`, 219 satır)
- TUR #45.2 önerilen 5 atom, ~2 saat (Y5 + Y1 birleşik): @theme ekleme + Tailwind arbitrary refactor + inline style refactor + globals.css temizliği + production smoke test

**Mimar:** Claude Opus 4.7 (sohbet, mektup yazan) + Claude Code (uygulama, Tur A2 kanıt toplayan)
**Onay:** Mehmet Dinç — "BANA SORU SORMA TEK SEFERDE BİZ UÇTAN UCA KOD YAPIMIZA GÖRE ANAYASAMIZA BAĞLI OLARAK İLERLİYORUZ YAP BİTİR" (Madde 17.5 son söz)
**Disiplin:** Madde 4 (atom + kanıt + önce oku), Madde 4.4 (yamalı bohça yasak), Madde 17.5 (CEO son söz)

---

---

## 28 Nisan 2026 — v1.10.0 Anayasa Sadeleştirme + Modülasyon (TUR #39)

**Karar:** CLAUDE.md 74K → 50K karaktere indirildi. Madde 25 ayrı dosyaya modüle edildi. Dört madde mevcut maddeler içine gömüldü. İki madde birleştirildi.

**Sebep:** CLAUDE.md Madde 27 eşiğini (>60K karakter = modül ayrımı) aşmıştı. LLM context verimliliği düşüyor, her oturumda sıkıştırma oluyor, karar kalitesi bozulabiliyordu. TUR #39 Ön Keşif (KU1-KU8) bunu kanıtladı.

**Yapılan değişiklikler:**
- Madde 25 tam metin (~17K karakter) → `CLAUDE_MADDE_25_DETAY.md` + `MADDE_25_KONTROL.md`
- Madde 28 (T tipi onay) → §18.7 olarak Madde 18'e gömüldü
- Madde 29 (migration kanıtı) → §4.8 olarak Madde 4'e gömüldü
- Madde 30 (apiFetch) → §13.2 olarak Madde 13'e gömüldü
- Madde 31 (ortam izolasyonu) → §13.3 olarak Madde 13'e gömüldü
- Madde 26+27 birleştirildi: Madde 27 içeriği §26.8+§26.9 olarak Madde 26'ya eklendi
- Eski Madde 32 → Madde 27, 33 → Madde 28, 34 → Madde 29
- SALES rolü Madde 11'e eklendi (schema enum'da vardı, anayasada eksikti)

**Alternatif:** Strateji W (tam modül ayrımı, anayasa/disiplin/ + anayasa/teknik/ gibi klasörler). Reddedildi — 6 dosyaya bölünme daha fazla "nereye bakacağım" sorunu yaratır.

**Etki:** CLAUDE.md, `tedbirge-os/CLAUDE_MADDE_25_DETAY.md`, `tedbirge-os/MADDE_25_KONTROL.md`

**Mimar:** Claude Sonnet 4.6 (TUR #39 — 28 Nisan 2026 gece)  
**Mehmet Bey onayı:** 28 Nisan 2026 yazılı — "Strateji Z: Sadeleştirme + Madde 25 modülasyonu"

---

## 25 Nisan 2026 — Mimari Anayasa Yürürlüğe Girdi

**Karar:** `CLAUDE.md` proje köküne yerleştirildi, **bağlayıcı kuralname** statüsünde.

**İçerik özeti:**
- 15 madde mimar disiplini (TUR #2 başlangıcında 16'ya çıktı — Madde 5 onay disiplini eklendi)
- 10 KIRMIZI çizgi yasak
- 7 SARI prensip
- 10 durma şartı
- Agent loop modeli
- Raporlama disiplini

**Sebep:** Önceki oturumlarda her mimar farklı tanı koymuş, kararlar log'lanmamış, yamalı bohça üretmiş.

**Alternatif (seçilmedi):**
- Mega-prompt yöntemi (felaket riski)
- Tam otonom kod yazma (KVKK riski)

**Mimar:** Claude Opus 4.7 (25 Nisan 2026 öğleden sonra oturumu)

---

## 25 Nisan 2026 — Yanıltıcı Önceki Raporlar Arşivlendi

**Karar:** 13 dosya `tedbirge-os/docs/arsiv-25-nisan-2026/` altına taşındı.

**Sebep:** 6 büyük teşhis YANLIŞ çıktı (kod taramasıyla doğrulandı). Detay önceki bölümde.

**Mimar:** Claude Opus 4.7

---

## 25 Nisan 2026 — Kod-Temelli Teşhis Modeli (Madde 4.4)

**Karar:** Mimar **kod kanıtına** dayanarak teşhis koyar. .md dosyaları **ikincil kaynaktır**.

**Sebep:** Mehmet Bey'in disiplin uyarısı: *"Sen eski yapılmış işleri de yapılmamış gibi görebilirsin."*

**Mimar:** Claude Opus 4.7

---

## 25 Nisan 2026 — Agent Loop Çalışma Modeli

**Karar:** Geliştirme **çerçeveli agent loop** ile yürütülür.

**Mehmet Bey vizyonu:** *"Sahada olmam gerekiyor, kod yazmayı bilmem, her zaman sohbet edemem. Otonom yapmam şarttır."*

**Üç katman:**
1. Refleksler (otomatik, güvenli)
2. Teşhis (otomatik, raporlayıcı)
3. Tedavi (yarı-otomatik, suggest mode)

**Mimar:** Claude Opus 4.7

---

## 25 Nisan 2026 — TUR #1 Tamamlandı (10 Commit)

**Sonuç:**
- BUG #1 (status fonksiyon adı) → fix (commit zinciri)
- BUG #2 (SUPABASE env çift standart) → fix
- PrismaClient singleton 4 dosyada refactor
- OTONOM_RAPOR.md başlatıldı
- Production health 200, deploy başarılı

**Disiplin:** Atom commit, hiç KIRMIZI çizgi ihlali yok.

**Mimar:** Claude Opus 4.7

---

## 25 Nisan 2026 — Anayasa Madde 5 Eklendi (Onay Disiplini)

**Karar:** Read-only komutlar (git diff, git status, view, Get-Content vb.) için "don't ask again" otomatik onay verilebilir. Yazma komutları için her zaman insan onayı.

**Sebep:** Mehmet Bey'in geri bildirimi: *"Hep yes no bıktım, kapsamı genişlet."* Anayasa eksikti, Claude Code'un default davranışı her komutta onay istiyordu.

**Etki:** Sahada Mehmet Bey daha az onay verir, kontrol kaybolmadan verimlilik artar.

**Mimar:** Claude Opus 4.7

**Uygulama tarihi (revize):** 25 Nisan 2026 — Anayasaya işlendi (commit 6671be1). Karar arşivi ile anayasa metni uyumlu hale geldi.

---

## 25 Nisan 2026 — TUR #2 TASARIM KARARLARI (Otonom Katman)

**Bağlam:** Sistem otonom katmanına geçiş — Auditor, Healer, Reporter modülleri.  
Mehmet Bey direktifi: **"Risk olmasın."**

### Karar 1: Auditor Tarama Kapsamı = 6/6 (Kapsamlı)

Auditor şunları tarar:
1. **Schema drift** — canlı DB ↔ schema.prisma farkı (haftalık)
2. **Env var tutarsızlığı** — eksik/bayat env'ler (saatlik)
3. **PrismaClient ihlali** — yeni `new PrismaClient()` ekleyen var mı (her commit sonrası)
4. **Performans drift** — yanıt süresi yavaşlama (haftalık)
5. **Güvenlik anomalisi** — yetkisiz erişim, normal dışı download (saatlik)
6. **Cost spike** — Anthropic API aşırı kullanım (saatlik)

**Sebep:** Mehmet Bey "kapsamlı olsun" dedi. Sahada olduğu için sistemi geniş gözle görmek istiyor.

**Alternatif (seçilmedi):**
- Minimal başlangıç (1+2+6) — yetersiz, sektörel risk büyük
- Sadece kritik (5+6) — güvenlik tek başına yetmez, drift öldürücü

**Etki:** Auditor 6 farklı tarama yapacak, bulgular SystemEvent tablosuna yazılacak.

### Karar 2: Healer Otonomluğu = B (Düşük Risk Otomatik, Kritik Onay)

**Otomatik (Healer kendi yapar — düşük risk):**
- Connection pool dolu → soft restart
- Stale cache flush
- 24+ saat eski FAILED Document temizliği
- Expired token cleanup
- Render warmup ping

**Sana onay sorar (kritik):**
- Schema migration (zaten ANAYASA Madde 3 yasaklı, Healer önerebilir, **mimar uygular**)
- Env var değişikliği
- Hesap askıya alma (yetkisiz erişim sonrası)
- API key rotation
- Bulk veri işlemi

**Mehmet Bey'in ilk seçimi C (tam otonom) idi — mimar düzeltti, B'ye döndü.**

**Sebep:** Hukuki yazılımda otomatik schema/migration/data işlemi felaket çağrısıdır. Knight Capital ($440M kayıp), AWS S3 outage gibi gerçek örnekler.

**Mehmet Bey "sen kendi en doğru kararını ver" dedi → B onaylandı.**

### Karar 3: Reporter Teknolojisi = SSE

**Karar:** Server-Sent Events (SSE). Tek yönlü canlı akış.

**Alternatif (seçilmedi):**
- Polling — şu an mevcut, akıcı değil
- WebSocket — overkill, iki yönlü gereksiz

**Sebep:** Render free tier'da düşük maliyet, mobil reconnect otomatik, mevcut Express'e kolay eklenir.

### Karar 4: AuditFinding Saklama = SystemEvent + Dosya (RİSK SIFIR)

**EN ÖNEMLİ KARAR. Detaylı yazıyorum.**

**Mehmet Bey direktifi:** *"Yasaklı olanlar nedir? Risk olmasın."*

**Önceki karar (revize edildi):** AuditFinding adında yeni tablo eklenecekti. Schema değişikliği + migration gerekecekti. ANAYASA Madde 3 #1 ve #2 ihlali olacaktı (bilinçli istisna ile).

**Yeni karar (revize sonrası, risk: 0):**

Yeni tablo **YOK**. Schema değişikliği **YOK**. Migration **YOK**.

**Yerine:**

**A) Auditor bulguları → mevcut `SystemEvent` tablosu**

Schema'da hâlihazırda var olan SystemEvent tablosu kullanılır:
- `type` → "audit:schema_drift", "audit:env_inconsistency", "audit:cost_spike", vb.
- `severity` → "INFO", "WARNING", "CRITICAL"
- `module` → "auditor"
- Detaylar JSON string olarak `type` veya başka kullanılan alanda

**B) Healer fix önerileri → dosya tabanlı**

`tedbirge-os/docs/AUDIT_FINDINGS/` klasörü:
- `OPEN/` → bekleyen öneriler (JSON dosyaları)
- `RESOLVED/` → çözülmüş öneriler
- `REJECTED/` → reddedilenler

Mehmet Bey panele girince dosyaları görür. Onaylama = `git mv OPEN/ RESOLVED/` (Healer veya mimar uygular).

**Avantajları:**
- ❌ Schema değişikliği yok → ANAYASA Madde 3 #1 korundu
- ❌ Migration yok → Madde 3 #2 korundu
- ❌ Üretim DB'sine SQL yok → Madde 3 #3 korundu
- ✅ Git tarihçesi zaten audit log → KVKK için bonus
- ✅ Geri alma kolay (`git revert`)
- ✅ Mevcut SystemEvent altyapısı kullanılıyor

**Sebep:** Mehmet Bey "risk olmasın" dedi. Önceki "bilinçli istisna" yaklaşımı anayasayı sulandırırdı. Mimar yaklaşımı baştan düşündü, sıfır risk seçeneği buldu.

**Mimar (önemli not):** Bu kararı vermek 2 turlu oldu:
- 1. tur: AuditFinding tablosu (yanlış, anayasa ihlali)
- 2. tur (Mehmet Bey'in uyarısından sonra): SystemEvent + dosya (doğru, sıfır risk)

Bu dürüst kayıt yarınki mimar için kıymetli. **Anayasa ihlali alışkanlığa dönüşmesin.**

**Mimar:** Claude Opus 4.7

---

## 25 Nisan 2026 — TUR #2 GÖREV LİSTESİ (Otonom Katman, Risk: 0)

**Bağlam:** Yukarıdaki 4 tasarım kararı uygulamaya geçer. Yeni dosyalar oluşturulur, mevcut dosyalara dokunulmaz (mount işlemleri hariç).

**Yeni dosyalar (tamamı sıfır risk):**

1. `src/os/modules/auditor.js` — yeni modül
2. `src/os/modules/healer.js` — yeni modül
3. `src/os/modules/reporter.js` — yeni modül (SSE bridge)
4. `src/routes/os.events.routes.js` — yeni route (SSE endpoint)
5. `tedbirge-panel/app/(panel)/dashboard/sistem-durumu/canli-feed/page.tsx`
6. `tedbirge-panel/app/(panel)/dashboard/tespit-edilen-sorunlar/page.tsx`
7. `tedbirge-panel/app/(panel)/dashboard/mimar-onayi/page.tsx`
8. `tedbirge-os/docs/AUDIT_FINDINGS/.gitkeep`
9. `tedbirge-os/docs/AUDIT_FINDINGS/OPEN/.gitkeep`
10. `tedbirge-os/docs/AUDIT_FINDINGS/RESOLVED/.gitkeep`
11. `tedbirge-os/docs/AUDIT_FINDINGS/REJECTED/.gitkeep`

**Minimal değişiklik (mevcut dosyalara):**

- `src/os/index.js` — sadece 3 yeni `safeRequire` satırı + `modules` objesinde 3 yeni anahtar
- `src/routes/index.js` — 1 yeni route mount

**Yapılmayacaklar:**

- ❌ `prisma/schema.prisma` değiştirilmiyor
- ❌ Migration oluşturulmuyor
- ❌ Mevcut OS modüllerine dokunulmuyor
- ❌ Mevcut servisler refactor edilmiyor
- ❌ npm install yok
- ❌ Yeni kütüphane yok (mevcut Express SSE ile yapılır)
- ❌ Env var değişikliği yok

**Tahmini commit sayısı:** 10-12 (her dosya atom commit + index.js mount + route mount + son rapor)

**Tahmini süre:** 4-6 saat agent loop

**Mimar:** Claude Opus 4.7

---

## 26 Nisan 2026 — TUR #5 TASARIM KARARLARI (SUPABASE Kanonik + Web Push)

### Karar 1: SUPABASE kanonik key

**Karar:** `SUPABASE_SERVICE_ROLE_KEY` master (kanonik). `SUPABASE_SERVICE_KEY` fallback olarak birakildi.

**Sebep:** Supabase'in standart env adi `SUPABASE_SERVICE_ROLE_KEY`. Eski ad (`SUPABASE_SERVICE_KEY`) ilk commit'ten kalmis. OS adapter ve boot.js zaten yeni adi kullaniyor; storage.service.js ve uploadMiddleware.js sadece eski adi biliyordu.

**Uygulama:** `storage.service.js:12` ve `uploadMiddleware.js:16` fallback pattern'e cevrildi: `SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_KEY`. (commit 688d779)

**Sonraki adim:** Mehmet Bey Render'dan `SUPABASE_SERVICE_KEY` silebilir. Fallback hala koruyucu.

### Karar 2: Web Push stratejisi — DB-backed, sendToRole

**Karar:** Push bildirimleri `pushNotification.service.js` + `PushSubscription` DB modeli uzerinden. In-memory map kullanilmadi.

**Sebep:** `pushNotification.service.js`, `PushSubscription` schema modeli, `push.routes.js` + `push.controller.js` initial commit'ten (39492ab) mevcut, tamamen DB-backed. Mektup'un in-memory tasarimi (global.pushSubscribers) gercek altyapiyi bilmeden yazilmisti. Anayasa Madde 4.4 (kod kaynaktir) uygulanarak DB-backed servis kullanildi.

**Healer entegrasyonu:** `maybeSendPush(finding)` — `sendToRole("ADMIN", payload)` cagiriyor. (commit b0766c8)

### Karar 3: Web Push Strateji — endpoint adi

**Karar:** `/api/push/vapid-key` korundu (mevcut kod, Madde 4.4).

**Risk:** Dusuk. VAPID keys mevcut, sw.js push handler mevcut. Sadece baglama eklendi.

**Endpoint adi duzeltmesi (TUR #5 sirasinda tespit):** Mektupta `/api/push/vapid-public-key` yazilmis, ama mevcut kod (push.routes.js + PwaProvider.tsx) `/api/push/vapid-key` kullaniyor. Anayasa Madde 4.4 (kod kaynaktir) geregi mevcut endpoint korundi, mektup hatali kabul edildi. Dogru endpoint: `/api/push/vapid-key`.

**Mimar:** Claude Code (TUR #5)

---

## Format ve Disiplin Notu

Yeni karar bu dosyaya **yukarıdaki formatla** eklenir.

**Kural:** Yeni karar eski kararı ezmez, üstüne yazar. Eski karar değişiyorsa, **revize maddesi** yeni karar yazılır, eskisi referans olarak kalır.

---

**Son güncelleme:** 25 Nisan 2026 (TUR #2 tasarım sonu)  
**Mimar:** Claude Opus 4.7  
**Bağlayıcı:** Tüm gelecek oturumlar

---

## 28 Nisan 2026 (sabah) — ANAYASA v1.7.0 + 7 YENİ MADDE

**Karar:** Anayasaya 7 yeni madde eklendi (Madde 26-32). Eski Madde 26 (Kapanış) → Madde 33.

**Yeni maddeler:**
- 26 — Otonom Devir + Sağlık Taraması Başlatma
- 27 — Sağlık Taraması Periyodikliği
- 28 — Onay Disiplini Genişletmesi (T tipi otomatik onay)
- 29 — Migration Uygulandi Kanıtı (ALTER TABLE çıktısı şart)
- 30 — Frontend Standart Disiplini (apiFetch zorunlu)
- 31 — Ortam İzolasyonu (lokal dev ≠ production)
- 32 — Anayasa Boyut Disiplini (40k+ özet versiyon)

**Sebep:** 28 Nisan 2026 sabah 3 sızıntı (migration drift, CORS, 401) ve sağlık taraması TUR #27 (21 bulgu) kanıtladı: bu 7 disiplin anayasada yoktu.

**Sürüm:** v1.6.0 → v1.7.0 (Madde 22 — MINOR — yeni madde eklendi)

**Mimar:** Claude Opus 4.7 (28 Nisan sabah devir oturumu, Mehmet Bey direktifi)

**Risk:** SIFIR (sadece dokümantasyon, Madde 18.4 yeşil nokta)

---

## 26 Nisan 2026 (öğle) — TUR #5 KAPANIŞ + ALTYAPI KEŞİF NOTU

**TUR #5 onaylandı:** SUPABASE kanonik + Web Push entegrasyonu, 5 commit, sıfır anayasa ihlali, public URL kanıtı toplandı.

### Önemli mimari keşif (TUR #5 sırasında)

Tedbirge.ai'nın initial commit'inde (39492ab) şu altyapı **zaten kuruluymuş** ama **hiç bağlanmamış**:

- `model PushSubscription` (prisma/schema.prisma satır 308-316)
- `src/services/pushNotification.service.js` (DB-backed, sendToRole, sendToUser)
- `src/routes/push.routes.js` (3 endpoint: vapid-key, subscribe, unsubscribe)
- `tedbirge-panel/PwaProvider.tsx` (SW kayıt altyapısı)
- `tedbirge-panel/public/sw.js` (push event handler)

TUR #4'te PwaProvider keşfedildi, TUR #5'te kalan 4 parça keşfedildi.

**Çıkarım:** Tedbirge'nin **gizli altyapısı zengin**. Yeni bir tur açmadan önce mutlaka:
1. `git log --oneline -- <ilgili dizin>` ile tarihçe
2. `Get-ChildItem -Recurse -Filter *.<uzantı>` ile mevcut dosya tespiti
3. `Select-String` ile ilgili pattern araması

Bu disiplin TUR #5'te 30+ dakika tasarruf sağladı (yeni dosya yazmak yerine bağlantı kurma).

### Anayasa Madde 4.5 yorumu güncellemesi

> "Önce oku sonra yaz" maddesinin canlı uygulaması: yeni bir özellik eklemeden önce **mevcut servis/route/model yapısı taranır**. Bulunduysa **bağlantı kurulur**, bulunmadıysa yazılır.

### Bekleyen: Mehmet Bey'in manuel adımları

1. Render → SUPABASE_SERVICE_KEY (eski) sil → /health 200 doğrula
2. Panel /dashboard/bildirimler → "Bildirimleri Aç" → tarayıcı izni → abonelik test

**Mimar:** Claude Opus 4.7 (TUR #5 kapanış)

---

## 26 Nisan 2026 — Anayasa Madde 17 + 18 Eklendi

**Karar:** İki yeni anayasa maddesi yürürlüğe girdi.

**Madde 17 (Stratejik Kesit Disiplini):** Sistemi yatay kesitlere böl, her kesiti uçtan uca tasarla. "Tüm sistem tek seferde" yasaklı.

**Madde 18 (Otonom Tur Zinciri):** Mimar bir kesit için tüm tur mektuplarını tek oturumda yazar. KIRMIZI nokta turları onay şartlı, YEŞİL nokta turları otomatik akar.

**Sebep:** Mehmet Bey saha programı + bilgi-fizik sınırı. Tek seferde tüm sistemi tasarlamak imkansız, ama bir kesit için tüm zinciri yazmak verimli.

**Etki:** Mimar oturumu açma sıklığı azalır, sahada kalma süresi artar, disiplin korunur.

**Mimar:** Claude Opus 4.7

---

## 26 Nisan 2026 (gece) — ANAYASA v1.3.0 + Madde 20+21+22 EKLENDİ

**Karar:** Anayasaya 3 yeni madde eklendi:
- **Madde 20:** Anayasa Evrim Disiplini (anayasa nasıl değişir)
- **Madde 21:** Sağlık Taraması Disiplini (uçtan uca risk denetimi)
- **Madde 22:** Versiyon Disiplini (4 katmanlı SemVer 2.0)

Eski Madde 19 (Kapanış) → Madde 23 olarak kaydı.

**Sebep:** Üç eksiklik kanıtlandı:
1. Anayasanın evrim süreci tanımsız (Madde 5, Madde 17+18 doğaçlama eklendi)
2. Uçtan uca sağlık taraması ihtiyacı vs Madde 17 (kesit disiplini) çelişkisi
3. 4 katman (anayasa, backend, panel, schema) için versiyon standardı yok

**Alternatif (seçilmedi):**
- CalVer (Calendar Versioning) — Tedbirge için zaman bilgisi yetersiz, breaking change göstermiyor
- Hybrid (CalVer + SemVer) — mental yük yüksek, araç desteği zayıf
- Madde 22'yi ayrı turla yazmak — atom mantıksal iş bölünmüş olur

**Etki:**
- Anayasa v1.0.0 → v1.3.0 (resmi versiyon güncellemesi)
- 21 madde + 1 kapanış = 22 numaralı madde + 1 kapanış (Madde 23)
- Bundan sonra her anayasa değişikliği Madde 20.4 sürecinden geçer
- Sağlık taraması Madde 21'e göre yapılır
- 4 katman versiyonu Madde 22'ye göre yönetilir

**Mimar:** Claude Opus 4.7  
**Onay:** Mehmet Bey (yazılı, sohbet kaydı)

---

## ANAYASA VERSİYON TARİHÇESİ (geriye dönük kanıt — Madde 22.7)

Anayasa şu ana kadar **3 büyük değişiklik** geçirdi ama versiyon güncellenmemişti. Madde 22 eklenirken bu **gizli ihlal** düzeltildi:

| Versiyon | Tarih | Değişiklik | Madde Sayısı | Commit |
|---|---|---|---|---|
| v1.0.0 | 25 Nisan 2026 | Başlangıç (16 madde) | 16 | (initial CLAUDE.md commit) |
| v1.1.0 | 25 Nisan 2026 | Madde 5 (Onay Disiplini) eklendi → Madde 5-15 kaydırıldı | 17 | (TUR #2 öncesi commit) |
| v1.2.0 | 26 Nisan 2026 | Madde 17 (Kesit Disiplini) + Madde 18 (Otonom Tur Zinciri) eklendi → Madde 19 (Kapanış) | 19 | (anayasa genişletme v2 commit) |
| **v1.3.0** | **26 Nisan 2026 (gece)** | **Madde 20 (Anayasa Evrim) + Madde 21 (Sağlık Taraması) + Madde 22 (Versiyon Disiplini) eklendi → Madde 23 (Kapanış)** | **22 + Kapanış** | **a4ec692** |

| **v1.4.0** | **27 Nisan 2026 (sabah)** | **Madde 24 (İş Planı Disiplini) eklendi → Madde 26 (Kapanış)** | **23 + Kapanış** | **(bu commit)** |
| **v1.11.0** | **1 Mayıs 2026 (gece geç)** | **Madde 29 (Hareket Disiplini) eklendi → KAPANIŞ Madde 30. TUR #44 büyük kesit sonrası kalıcı prensipler anayasaya yansıdı: merkezi motion kaynak, 3 katmanlı reduced-motion, ortak component disiplini, Senaryo 1 paket sınırı, soft initial state, performans bütçesi, "tek mektup uçtan uca" pattern.** | **29 + KAPANIŞ** | **(bu commit)** |

*Not: Tablonun v1.4.0 ile v1.11.0 arasındaki sürüm satırları (v1.5.0 → v1.10.0) henüz eklenmemiş — anayasa header'ında tarihçe mevcut. Tablo tutarlılığı ayrı bir doküman bütünlük turu adayı.*

**KVKK kanıt notu:** Bundan sonra anayasa değişikliklerinde tarih + commit hash + açıklama bu tablo formatına yazılacak (Madde 22.7).

**Mimar:** Claude Opus 4.7  
**Tarih:** 26 Nisan 2026 (gece)

---

## 27 Nisan 2026 (sabah) — ANAYASA v1.4.0 + Madde 24 (İş Planı Disiplini)

**Karar:** Anayasaya Madde 24 (İş Planı Disiplini) eklendi. Eski Madde 23 (Kapanış) → Madde 26 olarak kaydı.

**Madde 24 İçeriği (13 alt madde):**
- 24.1 İlke (Tedbirge'nin konumu — B2B SaaS LegalTech)
- 24.2 Paydaş yapısı (4 iç + 7 dış kategori)
- 24.3 Gelir modeli (Tedbirge %20 / Temsilci %10-%10)
- 24.4 Yasal sorumluluk dağılımı (Avukatlık K. + KVKK)
- 24.5 Yol haritası dokümanı (IS_PLANI.md)
- 24.6 Önceliklendirme kuralı (sıralı)
- 24.7 Kesit tipi (A: Bulgu Kapatma, B: Stratejik)
- 24.8 İş bitirme kriterleri
- 24.9 Karar mekanizması
- 24.10 KVKK yurt dışı aktarım disiplini
- 24.11 Hukuki muhatap şablon disiplini
- 24.12 Yol haritası güncelleme
- 24.13 Yasaklı davranış

**Sebep — 4 fizibilite raporu birleştirildi:**
1. İş Planı Fizibilite Raporu (576 satır) — MoSCoW + Now-Next-Later
2. Resmi Muhatap KEŞİF Raporu (376 satır) — 7 kategori atlas
3. Birleşik Analiz Raporu (430 satır) — sentez
4. Mali Akış Mini KEŞİF (421 satır) — gelir modeli kanıtı

**Mehmet Bey direktifleri (anayasaya gömüldü):**
- Tedbirge B2B SaaS, hukuk hizmeti vermez (Madde 24.1)
- Mehmet Dinç girişimci, marka sahibi (Madde 24.1)
- Tedbirge %20 / Temsilci %10-%10 (Madde 24.3)
- IBAN havale, PayTR gerekli değil (Madde 24.3)
- KDV/stopaj/sorumluluk Avukatlık + Vekalet — Avukat (Madde 24.4)

**Etki:**
- Anayasa v1.3.0 → v1.4.0 (MINOR — yeni madde, Madde 22.2)
- 22 madde + 1 kapanış → 23 madde + 1 kapanış
- IS_PLANI.md v1.0 oluşturuldu
- Bundan sonra her kesit Madde 24 disiplini ile başlar

**Mimar:** Claude Opus 4.7  
**Onay:** Mehmet Dinç (yazılı, sohbet kaydı)

---

## 27 Nisan 2026 (akşam) — Anayasa v1.5.0: Madde 25 (Pazarlama + Web + Marka Kapsamlı)

**Karar:** Pazarlama + Web Yüzü + Marka Disiplini Madde 25 olarak anayasaya eklendi (kapsamlı).

**Kapsam:** 14 alt madde:
- 25.1 Tedbirge'in pazarlamadaki sıfatı
- 25.2 Marka mesajı
- 25.3 KIRMIZI çizgi yasaklı vaatler
- 25.4 İzinli mesaj çerçevesi
- 25.5 Web arayüzü (marka kimliği + yasal bileşenler + dönüşüm yüzeyi + görsel/etkileşim + mobil + a11y)
- 25.6 Sosyal medya disiplini
- 25.7 KVKK + İYS + pazarlama veri
- 25.8 Yanıltıcı bilgi denetimi
- 25.9 İzinli kanallar + araçlar
- 25.10 Pazarlama verisi audit
- 25.11 Kod altyapı zorunlulukları (15 satır kontrol listesi)
- 25.12 Üç faz disiplini (FAZ 1 → 2 → 3)
- 25.13 7 sorulu pazarlama kararı filtresi
- 25.14 Yabancı pazar ayrımı (Madde 26'ya bırakıldı)

**Kanıt zemini:** PAZARLAMA_FIZIBILITE.md (27 Nisan 2026) — 5 KRİTİK eksik tespit edildi (cookie banner, GA4/Pixel, İYS opt-out, UTM frontend, qualificationScore).

**Sıradaki adım:** TUR #25 FAZ 1 mektubu (Yasal + Ölçüm Temeli — Cookie banner, aydınlatma, GA4, Pixel, UTM fix, İYS, robots/sitemap). Otonom inşa Madde 18.2 disiplini ile.

**Sınır:** Sadece Türkiye geneli. Yabancı plaka + çoklu dil pazarlama Madde 26'da.

**Etki:**
- Anayasa v1.4.0 → v1.5.0 (MINOR — yeni madde, Madde 22.2)
- 23 madde + 1 kapanış → 24 madde + 1 kapanış (Madde 25 eklendi)

**Mimar:** Claude Sonnet 4.6  
**Onay:** Mehmet Dinç (yazılı, sohbet kaydı — "Tek seferde kapsamlı kanun maddesi, sonra otonom inşa")

---

## 27 Nisan 2026 (gece sonu) — ANAYASA v1.6.0 + Madde 25.12 FAZ 4 + Madde 25.11 Genişletme

**Karar:** Madde 25.12'ye FAZ 4 (Operasyonel Ölçek + Optimizasyon) tanımı eklendi. Madde 25.11 kontrol listesi 5 yeni satır ile genişletildi (16-20).

**FAZ 4 Alt Başlıkları (4 atom kesite bölünür):**
- A. Reklam Altyapısı (TUR #26)
- B. İçerik Üretimi (TUR #27)
- C. Operasyonel Pazarlama (TUR #28)
- D. Otomasyon + Sürekli Optimizasyon (TUR #29+, sürekli)

**Sebep — Mehmet Bey direktifi (27 Nisan 2026, gece sonu):**
> "ANAYASAYA YA GÖRE FAZ 4 TAM PAKET ORTAK"
> "ANAYASADA PAZARLAMA VAR CLAUDE CODE YE SOR"
> "ortağım bizim bir anayasamız var uçtan uca kod tabanlı ilerliyoruz"

Mehmet Bey FAZ 4 başlatmak istedi. Mevcut anayasa Madde 25.12'de FAZ 4 tanımlı değildi. Madde 25.13.6 (Hangi FAZ kapsamında?) sorusuna cevap verilemiyordu. Madde 4.1 (yamalı bohça yasak) + Madde 17 (kesit disiplini) gereği önce anayasa genişletildi, sonra atom kesit mektupları yazılacak.

**Kanıt zinciri:**
- Madde 25 tam metni `tedbirge-os/docs/MADDE_25_TAM_METIN.md` dosyasında (27 Nisan 2026, Claude Code keşfi)
- Mevcut Madde 25.12: yalnızca FAZ 1+2+3 tanımlıydı
- Mevcut Madde 25.11: 15 satırlık kontrol tablosu

**Etki:**
- Anayasa v1.5.0 → v1.6.0 (MINOR — yeni alt başlık, Madde 22.2)
- Madde 25.12: 3 FAZ → 4 FAZ
- Madde 25.11: 15 satır → 20 satır
- Yeni kontrol noktaları: Google Ads conversion API, UTM şablon, A/B test, lead SLA, haftalık KPI mail
- Bundan sonra FAZ 4 atom kesit mektupları (TUR #26, #27, #28, #29+) yazılabilir

**Mimar:** Claude Opus 4.7 (yeni oturum, FAZ 4 başlangıcı)
**Onay:** Mehmet Dinç (yazılı, sohbet kaydı 27 Nisan 2026 gece)
**Disiplin:** Madde 4.1, 4.4, 4.5, 17, 20.1, 22.2, 22.7, 25.12

---

## 28 Nisan 2026 (öğleden sonra) — ANAYASA v1.8.0 + Madde 33 EKLENDİ

**Karar:** Anayasaya 1 yeni madde eklendi:
- **Madde 33:** Beklemede Özellik Disiplini (yarım kurulu özellik yönetimi)
- Eski Madde 33 (Kapanış) → **Madde 34** olarak yeniden numaralandı

**Sebep — Kanıta Dayalı (Madde 20.1):**
TUR #29 AccidentCase kanıt taraması şunu kanıtladı:
- Frontend'de aktif "Yeni Vaka Aç" butonu vardı
- Backend'de 0 referans, endpoint yoktu
- Her tıklamada kullanıcı 404 görüyordu
Bu "Senaryo B — Yarı kurulu" durumu için anayasada hiçbir kural yoktu.

**Madde 33 — 3 Koşul (hepsi zorunlu):**
1. Panel'de belirgin YAKINDA badge (amber gradient, aktif buton yok)
2. Schema'da `// @deferred` yorumu
3. IS_PLANI.md kaydı (hangi kesitte aktif edilecek)

Üç koşuldan biri eksikse → sağlık taramasında 🔴 KRİTİK sayılır.

**Uygulanan Tedavi (TUR #29-B):**
- `tedbirge-panel/app/(panel)/leads/[id]/page.tsx` — Kaza Rekonstrüksiyon bloğu amber YAKINDA kart olarak değiştirildi (commit 5517dbe)
- `prisma/schema.prisma` — AccidentCase + Evidence modelleri `// @deferred` yorumu ile işaretlendi
- `tedbirge-os/IS_PLANI.md` — AI Analiz Doğruluk Kesiti kapsamına AccidentCase eklendi

**Sürüm:** v1.7.0 → v1.8.0 (Madde 22 — MINOR — yeni madde eklendi)

**Alternatif (seçilmedi):**
- Senaryo A: CREATE TABLE + tam backend — pahalı, Q3 2026 öncesi gereksiz (KIRMIZI nokta olurdu)
- Senaryo C: Frontend + schema tamamen sil — geleceği kapatır, tasarım emekten kaçar

**Mimar:** Claude Sonnet 4.6 (TUR #29-B, 28 Nisan 2026 öğleden sonra)
**Onay:** Mehmet Dinç (TUR #29-B mektubu — yazılı talimat)
**Disiplin:** Madde 4.1, 4.4, 17.4, 20.1, 20.4, 22.2, 22.6


---

## 28 Nisan 2026 (akşam) — ANAYASA v1.9.0 + Otonom Devir Sistemi

**Karar:** Anayasa Madde 26 (Otonom Devir) sertleştirildi. Yeni alt maddeler eklendi:
- 26.4 — Açılış Protokolü (zorunlu 6 komut zinciri, atlatılamaz)
- 26.5 — Açılış Mesajı Formatı (sabit şablon)
- 26.6 — DEVIR_RAPORU_AKTIF.md (canlı tek dosya)
- 26.7 — Yasaklı davranış (26.4-26.6 kapsamı)

Madde 27'ye eklendi:
- 27.4 — Kapanış Uyarısı (sohbet süresi eşiği + uyarı formatı + Mehmet Bey kararı)

**Sebep:** 28 Nisan 2026 boyunca defalarca yaşanan iki sürtünme:
- Yeni sohbet açıldığında mimar "ne yapayım?" diye sordu
- Bağlam dolduğunda kullanıcı yapısal güvence kaybı yaşadı (compact uyarısı)

Mehmet Bey direktifi (sohbet kaydı, akşam):
- "Hiç kapanışta beni uyarsın, sohbet süresi doluyor yeni sohbet aç desin"
- "Açılışta bana hiçbir şey söylemeden kaldığı yerden devam edecek"
- "Tam otonom sistemi kur"

**Sürüm artışı:** MINOR (v1.8.0 → v1.9.0 — yeni alt maddeler, Madde 22 disiplini)

**Mimar:** Claude Sonnet 4.6 (TUR #36, 28 Nisan akşam)

**Risk:** SIFIR (sadece dokümantasyon — Madde 18.4 yeşil nokta)

**Etki:** Bağlam kayıpsız oturum geçişi. Mehmet Bey sahaya çıkarken yapısal güvence: yeni sohbet otonom devralır, bağlam köprüsü insan eliyle taşınmaz.

---

## 29-30 Nisan 2026 — TUR #42 Kurumsal Kimlik Birleştirme

### Karar 1: Paylaşımlı PublicNav Component Kararı

**Bağlam:** TUR #42 K5 araştırması gösterdi: 27 public sayfanın hiçbiri paylaşımlı nav component kullanmıyor. Anasayfa kendi inline `function PublicNav()` (159 satır), /basvuru kendi inline `<header>` (358-385. satırlar arası), niş landing'lerde nav yok. Bu dağınık nav yapısı:
- Görsel tutarsızlığa sebep oluyor
- Bakım maliyeti yüksek
- TUR #44 Animasyon turunda sayfa geçişleri için paylaşımlı nav şart

**Karar:** Anasayfanın inline PublicNav fonksiyonu `components/PublicNav.tsx` dosyasına çıkarıldı. Tüm pazarlama sayfaları (~14 sayfa) bu paylaşımlı component'i kullanır. Auth sayfaları (login, register, forgot-password, reset-password, sifre-belirle) kendi minimal layout'larını korur (farklı UX akışı).

**Uygulanan:**
- `components/PublicNav.tsx` — yeni dosya, 165 satır (sticky + glassmorphism + framer-motion)
- 13 sayfa entegre edildi: /, /basvuru, /blog, /blog/[slug], 3 niş landing, /hakkimizda, /iletisim, /haberler, /tazminat-hesapla, /lexscan, /referanslar, /basvuru-sorgula

**Alternatif (seçilmedi):** Sayfa-bazlı nav korunsun, sadece /basvuru düzeltilsin (dar K5). Geleceğin animasyon ve SEO turları için dezavantajlı, kapsamı genişlettik.

**Mimar:** Claude Opus 4.7 (TUR #42 K5, 29 Nisan 2026 gece)
**Onay:** Mehmet Dinç ("ortak web arayüzü bir bütündür" — yazılı talimat)
**Disiplin:** Madde 4 (kanıt), Madde 17.3, Madde 17.5

---

### Karar 2: M3 Yan Bulgusu Küçük Parçasını Kapsama Dahil Etme

**Bağlam:** TUR #40'tan beri açık M3 yan bulgusu: "iki Footer pattern'i (anasayfa inline lacivert + global beyaz)". TUR #42 K5 Tur B mektubunda "Footer dokunulmaz" sözü verilmişti. Ancak Mehmet Bey production kontrolünde fark etti: /basvuru'da hâlâ mor renkler görünüyor. Kanıt zinciri (Claude Code raporu): /basvuru kaynak kod %100 lacivert, mor renkler Footer.tsx hover renklerinden geliyor (10 × #534AB7).

**Karar:** M3'ün küçük parçası (Footer hover renk #534AB7 → #1E1E8E, 5 satır) bu turda kapatıldı. M3'ün asıl parçası (iki Footer pattern'i birleştirme — mimari karar gerek) LATER kalıyor.

**Uygulanan:** `components/layout/Footer.tsx` 5 satır `hover:text-[#534AB7]` → `hover:text-[#1E1E8E]`. Commit `1da080c`.

**Niye söz değiştirildi:** Madde 17.4'e göre mimar sözünü tutmalı. Ancak Madde 17.5 son söz Mehmet Bey'de — gözlem kanıt olarak kapsamı meşrulaştırdı. Risk minimal (sadece hover, layout etkilenmez), 5 satır CSS değişikliği.

**Alternatif (seçilmedi):** M3'ü tamamen LATER bırakıp TUR #42 kapansın. Ancak production'da görünür mor problem devam ederdi.

**Mimar:** Claude Opus 4.7 (TUR #42 K7, 29 Nisan 2026 gece geç)
**Onay:** Mehmet Dinç (production gözlemi + Madde 17.5 son söz)
**Disiplin:** Madde 4, Madde 17.4, Madde 17.5

---

### Karar 3: /login Gradient — Kurumsal Lacivert Ailesi Tasarım Sistemi

**Bağlam:** /login sayfası sol dekoratif paneli (hidden lg:flex masaüstü görünümü) gradient `#1E1E8E → #3b239f → #22145f` kullanıyordu. `#3b239f` (koyu violet/mor) ve `#22145f` (çok koyu navy-purple) kurumsal palette dışı renkler. Mehmet Bey'in vurgusu: "ortak web arayüzü bir bütündür".

**Karar:** Gradient kurumsal lacivert ailesi içinde kalır:
- `#1E1E8E` = `var(--brand-primary)` (kurumsal lacivert) — başlangıç
- `#18187a` = `--brand-primary-hover` (lacivert ailesi koyu varyant) — orta
- `#0f0f4d` = lacivert ailesi en koyu (siyah değil, lacivert kuzeni) — bitiş

Bu yeni gradient lacivertten kendi koyu kuzenine geçer — mor yok, kurumsal kimlikte.

**Uygulanan:** `app/(public)/login/page.tsx` line 88 gradient değişimi. Commit `d0c3cc3`.

**Tasarım sistemi sonucu:**
- Ana renk: #1E1E8E (kurumsal lacivert) — birincil
- Koyu varyant: #18187a — hover, vurgu
- En koyu: #0f0f4d — gradient ucu (yeni eklenen, palette'te değişken yok)
- Yeşil aksent: #5CB85C — CTA, aksiyon
- M7 yan bulgusu: /lexscan blue gradient hâlâ Tailwind native (kurumsal palete identical değil) — LATER

**Alternatif (seçilmedi):** Düz #1E1E8E kullanmak (gradient olmadan). Ancak gradient sayfada görsel zenginlik sağlıyor, kurumsal aile içinde kaldıkça uygundur.

**Mimar:** Claude Opus 4.7 (TUR #42 K8, 30 Nisan 2026 gece yarısı)
**Onay:** Mehmet Dinç (görsel kontrol — 3 rol Yönetici/Temsilci/Hukukçu kanıtlı)
**Disiplin:** Madde 4, Madde 17.5

---

## 1 Mayıs 2026 — TUR #43 Tur B-1 SEO Altyapı

### Karar 1: SEO Meta Altyapısı 8 Atom 2 Alt-Tura Bölündü

**Bağlam:** Tur A keşfi (12 KN) 4 kritik SEO eksikliği tespit etti — JSON-LD sıfır, OG image yok, anasayfa kendi metasından yoksun (`"use client"` engeli), `metadataBase` eksik. Toplam 8 atom önerildi. Mimar tek seferde uygulamayı reddetti — anasayfa server/client refactor B-1'in düşük-risk altyapı çalışmasıyla aynı kapsama sığmadı.

**Karar:** 8 atom **2 alt-tura** bölündü:
- **Tur B-1 (bu tur):** Düşük risk, additive — root metadata + dinamik OG image + sitemap satırı + robots satırı (4 atom). Sonradan B5 (middleware fix) eklendi.
- **Tur B-2 (sonraki):** JSON-LD enjeksiyonu (Organization + WebSite + LegalService + Article + BreadcrumbList) + anasayfa server/client bölmesi. Mimar mektubu B-1 production doğrulamasından sonra yazılır.

**Alternatif (seçilmedi):** Tek seferde 8 atom uygulamak. Anayasa Madde 4.2 (atom seviyesi) ihlali, kapsam belirsizliği, refactor riski daha yüksek olurdu.

**Mimar:** Claude Opus 4.7 (TUR #43, 30 Nisan 2026 gece yarısı sonrası)
**Onay:** Mehmet Dinç ("YAZ ORTAK" — Tur A raporu sonrası)
**Disiplin:** Madde 4.2, Madde 17.3

---

### Karar 2: OG Image Dinamik Üretim (Next.js Convention)

**Bağlam:** Tur A'da `og-image.png` 1200×630 statik dosyasının olmadığı tespit edildi. `logo.png` (640×640 JPEG) OG için yetersiz. İki seçenek vardı: (a) Mehmet Bey'den tasarımcı OG image isteyip statik dosya olarak yerleştirmek, (b) Next.js App Router `app/opengraph-image.tsx` convention'u ile dinamik üretmek.

**Karar:** Dinamik üretim seçildi (`app/opengraph-image.tsx`, Edge runtime, `ImageResponse` API). Kurumsal lacivert gradient (#1E1E8E → #0F0F4A), Türkçe başlık, "Trafik ve İş Kazası Tazminat Yönetimi" altyazı + tedbirge.ai. Logo PNG embed BU SÜRÜMDE değil (Edge runtime + uzak dosya çekme + font sorunları riski). Mehmet Bey ileride "logo da olsun" derse v2 atomu olarak eklenir.

**Sonuç:** Next.js convention sayesinde `metadata.openGraph.images` ve `metadata.twitter.images` MANUEL eklenmedi — Next.js otomatik bağladı. Production HTML'de tüm sayfalarda `og:image=https://www.tedbirge.ai/opengraph-image?...` ve eşdeğer `twitter:image` çıktı.

**Alternatif (seçilmedi):** Statik PNG dosyası — Mehmet Bey bağımlılığı + tasarım turu gerektirirdi, B-1 momentumunu kırardı.

**Mimar:** Claude Opus 4.7 (TUR #43 B2, 30 Nisan 2026 gece yarısı sonrası)
**Onay:** Mehmet Dinç ("YAZ ORTAK")
**Disiplin:** Madde 4.5

---

### Karar 3: Robots Disallow Sadece /musteri/ Eklendi (Auth Sayfaları Bilerek Açık)

**Bağlam:** Tur A keşfinde Claude Code 6 path için disallow önerdi (login, register, forgot-password, reset-password, sifre-belirle, musteri). Mimar bu öneriyi daralttı.

**Karar:** Sadece `/musteri/` disallow eklendi. Mevcut disallow'lar (`/api/`, `/dashboard/`, `/admin/`) korundu. Auth sayfaları (`/login`, `/register`, `/sifre-belirle` vb.) bilerek **açık** bırakıldı:
- Marka aramasında ("tedbirge giriş") kullanıcılar arama motorundan login sayfasına ulaşabilir — UX için yararlı
- KVKK riski yok (auth sayfaları içerik göstermiyor, public statik UI)
- `/musteri/` müvekkil portalı — KVKK kritiği, içerik halka açık değil → mutlaka disallow

**Alternatif (seçilmedi):** 6 path'i de disallow etmek. Marka SEO açısından dezavantajlı, hiçbir koruma faydası yok.

**Mimar:** Claude Opus 4.7 (TUR #43 B4, 30 Nisan 2026 gece yarısı sonrası)
**Onay:** Mehmet Dinç ("YAZ ORTAK")
**Disiplin:** Madde 4, Madde 24.10 (KVKK)

---

### Karar 4: Middleware /opengraph-image Public Path (Ek Atom B5)

**Bağlam:** B2 atomu (opengraph-image.tsx) tamamlandıktan sonra lokal smoke test'te endpoint **HTTP 307 → /login** redirect döndürdü. Kök sebep: `middleware.ts` public path listesinde `/opengraph-image` yoktu, `pathname.includes(".")` koşulu nokta içermeyen URL'i kurtaramadı. Production'da da aynı davranış olur, sosyal medya crawler'lar OG image alamazdı.

**Karar:** Middleware public path listesine `pathname.startsWith("/opengraph-image") ||` eklendi (1 satır). Ek atom B5 olarak kapsama dahil edildi.

**Niye söz değiştirildi:** Tur B-1 mektubu 4 atomdu, mimar middleware'i Tur A'da kontrol etmemişti. Ancak mektup açıkça "OG image PNG değil → DUR + raporla" dedi — Claude Code disipline uydu, mimara döndü, Mehmet Bey yazılı onayı ile B5 atomu eklendi (Madde 17.5 son söz).

**Alternatif (seçilmedi):** B1+B3+B4 commit, B2'yi ayrı turda kapatma — tur disiplini açısından doğru ama momentum kaybı + B2 dosyası ortada kalırdı.

**Mimar:** Claude Opus 4.7 (TUR #43 B5, 30 Nisan 2026 gece yarısı sonrası)
**Onay:** Mehmet Dinç (yazılı — "Mimar onayı: Seçenek A. B5 atomu uygula, 5 atom toplu commit/push, production doğrula.")
**Disiplin:** Madde 4, Madde 6 (DUR şartı), Madde 17.5

---

## 1 Mayıs 2026 — TUR #43 Tur B-2 SEO Anlam Katmanı (5 atom)

### Karar 5: JSON-LD Ortak Component (DRY + 4 Schema Factory)

**Bağlam:** Tur A'da JSON-LD sıfır tespit edildi — Google rich snippet, knowledge graph ve LegalService nis pazar görünürlüğü tamamen kapalı. Sayfa başına manuel `<script type="application/ld+json">` yazmak DRY ihlali ve kod tekrarı olurdu (her sayfada `JSON.stringify`, factory mantığı tekrarlanır).

**Karar:** `components/JsonLd.tsx` ortak server component oluşturuldu (122 satır). 4 type-safe factory:
- `organizationSchema()` — sirket bilgisi (root, tüm sayfalar)
- `websiteSchema()` — site adı + dil + publisher (root, tüm sayfalar)
- `legalServiceSchema({name, description, url, serviceType})` — niş landing'ler için
- `articleSchema({headline, description, url, datePublished, ...})` — blog detay için

`<JsonLd data={...} />` component'i tek obje veya obje dizisi kabul eder. Server component (SSR'da render olur, client hydration'a bağımlı değil — Google bot gördüğünde hazır).

**Alternatif (seçilmedi):** Sayfa başına manuel `<script>` enjeksiyonu — DRY ihlali, factory'ler her sayfada tekrar yazılırdı. JSON-LD'i client-side enjekte etmek — bot'lar SSR HTML'i çeker, JSON-LD görmez.

**Mimar:** Claude Opus 4.7 (TUR #43 B6, 1 Mayıs 2026)
**Onay:** Mehmet Dinç ("YAZ ORTAK")
**Disiplin:** Madde 4.5

---

### Karar 6: Anasayfa "use client" Tuzağı — Server Wrapper Pattern

**Bağlam:** Tur A'da anasayfa `app/(public)/page.tsx` `"use client"` directive'i nedeniyle kendi server-side `metadata` export edemediği tespit edildi. Anasayfa Tedbirge.ai'nin ana giriş noktası — Google'da generic "Tedbirge AI" başlığıyla görünüyordu, ana niş anahtar kelimeler (trafik kazası tazminatı, iş kazası) yansımıyordu. İki seçenek vardı: (a) Root layout metadata'yi anasayfa için optimize etmek (diğer sayfalar override ettiği için yetersiz), (b) Anasayfayı server wrapper + client component bölmesine ayırmak.

**Karar:** Server wrapper pattern (Seçenek b) seçildi:
- Mevcut `page.tsx` (905 satır client kod) → `HomePageClient.tsx` rename, sadece `export default function PublicHomePage` → `HomePageClient` adı değişti, JSX/hooks/motion/state aynen korundu
- Yeni `page.tsx` (23 satır server component) — anasayfa-özel metadata (title "Trafik ve İş Kazası Tazminat Yönetim Platformu", description keyword-rich, canonical, openGraph) + `<HomePageClient />` render

**Sonuç:** Production'da anasayfa başlığı `Trafik ve İş Kazası Tazminat Yönetim Platformu | Tedbirge AI` (template `%s | Tedbirge AI` çalıştı), canonical doğru, content render olmaya devam ediyor.

**Risk:** Anasayfa ana giriş noktası, refactor regresyonu görünür ve maliyetli. Lokal smoke test (HTTP 200, hero metni HTML'de var) + production kanıtı ile doğrulandı.

**Alternatif (seçilmedi):** Root layout metadata'yı anasayfa için optimize — diğer sayfalar (niş landing, blog) kendi metadata'larıyla override eder, anasayfa-özel keyword'ler diğerlerine bulaşırdı.

**Mimar:** Claude Opus 4.7 (TUR #43 B9, 1 Mayıs 2026)
**Onay:** Mehmet Dinç ("YAZ ORTAK", görsel kontrol Mehmet Bey'in tarayıcıda doğrulamasıyla)
**Disiplin:** Madde 4.2 (atom seviyesi), Madde 17.5

---

### Karar 7: Next.js Metadata Merge — og:image Manuel Referans (Ek Atom B10)

**Bağlam:** B9 anasayfa metadata'sı `openGraph: {title, description, url, type}` tanımladığında Tur B-1'de Next.js `app/opengraph-image.tsx` convention'undan otomatik gelen `og:image` ve `twitter:image` **kayboldu**. Lokal smoke test yakaladı.

**Kök sebep:** Next.js metadata merge davranışı — child `openGraph` objesi parent'ı **kısmi merge etmez**, override ettiğinde tüm sub-fields override edilir. Yani `images` belirtmezsen kalıtım almaz, **sıfır gelir**.

**Karar:** B10 ek atomu olarak (Mehmet Bey yazılı onay — "Seçenek A genişletilmiş") og:image regresyonu fixlendi. 5 dosyada manuel `openGraph.images: ["/opengraph-image"]` + `twitter.images` referansı eklendi:
- `app/(public)/page.tsx` (anasayfa)
- 3 niş landing
- `app/(public)/blog/[slug]/page.tsx` generateMetadata

`/opengraph-image` relative path — `metadataBase` (Tur B-1) sayesinde absolute URL üretildi.

**Niye söz değiştirildi:** Tur B-2 mektubu B9 metadata'sında `openGraph.images` belirtmedi — mimar Next.js merge davranışını atladı. Mehmet Bey yazılı onayı ile B10 atomu eklendi (Madde 17.5 son söz).

**Alternatif (seçilmedi):** Anasayfa `openGraph` objesini tamamen kaldırıp root inheritance — anasayfa-özel og:title/description (anasayfa için ana kazanım) kayıp olurdu.

**Mimar:** Claude Opus 4.7 (TUR #43 B10, 1 Mayıs 2026)
**Onay:** Mehmet Dinç (yazılı — "Mimar onayı: Seçenek A genişletilmiş. B9 og:image fix + B10 atomu (niş landing 3 + blog detay 1 = 4 dosya).")
**Disiplin:** Madde 4, Madde 6 (DUR şartı), Madde 17.5

---

## 1 Mayıs 2026 — TUR #44.1 Motion Altyapı (7 atom)

### Karar 8: Yazılım Altyapı — Senaryo 1 (mevcut framer-motion v12 + CSS, 0 ek paket)

**Bağlam:** Tur A keşfi 5 senaryo karşılaştırdı (mevcut+CSS, +Lottie, +GSAP, +three.js, +Motion One). Tedbirge'nin **dedicated tasarımcı YOK** — Lottie/Rive/Spline designer asset gerektirdiği için yasaklandı. GSAP framer-motion ile aynı projede iki motion sistemi karmaşası.

**Karar:** Senaryo 1 (mevcut framer-motion v12.38.0 + CSS @keyframes + globals.css motion tokens). 0 ek paket, bundle bütçe sağlam, Linear.app/Framer.com çıtası bu altyapıyla erişilebilir.

**Alternatif (seçilmedi):**
- Senaryo 3 (GSAP) — sadece TUR #44.3-A6 cinematic scroll için ek karar gereği açılabilir (henüz gerek yok)
- Lottie/Rive — designer YOK, asset üretemez

**Mimar:** Claude Opus 4.7 (TUR #44 Tur A, 1 Mayıs 2026)
**Onay:** Mehmet Dinç ("YAZ ORTAK")
**Disiplin:** Madde 4.5

---

### Karar 9: Reveal Pattern — useInView + Explicit Animate State (whileInView Yerine)

**Bağlam:** A5 ilk sürümü `whileInView="visible"` prop'u kullandı. Production smoke test ve Mehmet Bey görsel doğrulamada animasyon hiç tetiklenmedi — HTML kaynağında 4 section `opacity:0;transform:translateY(28px)` initial state'te dondu.

**Kök sebep:** Framer Motion v12'de variant key propagation parent-to-child geçer. Public layout `<motion.div key={pathname} initial="initial" animate="animate">` page transition wrapper'ı Reveal child'larının `initial="hidden"/whileInView="visible"` variant key'leriyle çakıştı — string-key collision IntersectionObserver tetiklenmesini boğdu.

**Karar:** Reveal.tsx **clean rewrite** — `whileInView` prop'u tamamen kaldırıldı, yerine `useInView` hook + `useEffect` + lokal `shouldAnimate` state pattern. `animate={shouldAnimate ? "visible" : "hidden"}` conditional string ile variant propagation atlandı, Reveal izole çalışıyor.

**Pattern detayı:**
- `useRef<HTMLElement>` + `useInView(ref, { once, amount })` IO observer
- `useEffect` ile `isInView` true olunca `setShouldAnimate(true)`
- `forwardRef` + internal ref birleşimi (`setRefs` fonksiyonu) — dış consumer + IO ikisi birden ref kullanır
- Default `amount: 0.15` (0.2'den düşürüldü, tetikleme garantisi)
- `useReducedMotion` kısa devresi korundu

**Niye söz değiştirildi:** Tur B-1 mektubu `whileInView` pattern'i önerdi, mimar Framer Motion v12 variant propagation davranışını öngöremedi. Mehmet Bey görsel doğrulamada hata yakalandı, A5-fix ek mektubuyla refactor uygulandı (Madde 17.5 son söz).

**Mimari öğrenme — TUR #44.x boyunca standart:** Scroll-triggered Reveal/animation component'leri **explicit useInView + state** pattern kullanır, `whileInView` prop'u yasak. Bu kuralı TUR #44.2 yaygınlaştırma + #44.3 cinematic scroll boyunca uygulanır.

**Alternatif (seçilmedi):** Page transition wrapper'ı public layout'tan kaldırma — TUR #43'te kazanılan smooth route transition'ı kaybetmek pahalı.

**Mimar:** Claude Opus 4.7 (TUR #44.1 A5-fix, 1 Mayıs 2026)
**Onay:** Mehmet Dinç (yazılı — "Mimar onayı: yumuşak şekilde geliyor 4 bölüm. Mektup §5 commit + push + production verify aşamalarına geç.")
**Disiplin:** Madde 4 (kanıt), Madde 6 (DUR şartı — görsel doğrulamada animasyon yokken durduk), Madde 17.5

---

### Karar 10: components/ui/ Klasörü + forwardRef Pattern Başlatma

**Bağlam:** Tur A KN-10 bulgusu: forwardRef kullanımı **0** (sıfır), `components/ui/` klasörü YOK, shadcn/ui veya Radix UI yok. Yeni motion ekleyince **wrapper cehennemi riski**.

**Karar:** TUR #44.1'de `components/ui/` klasörü kuruldu (shadcn/ui pattern'in Tedbirge başlangıcı). 3 dosya forwardRef ile yazıldı:
- `Reveal.tsx` (forwardRef<HTMLElement>, polymorphic `as` prop)
- `MotionButton.tsx` (forwardRef<HTMLButtonElement>, emphasis prop)
- `MotionCard.tsx` (forwardRef<HTMLDivElement>, emphasis prop)

**Pattern standardı:**
- Her component `"use client"` directive
- Her component `useReducedMotion()` ile JS düzeyinde respect (CSS @media + MotionConfig + hook = 3 katmanlı)
- Tüm motion token'lar `lib/motion.ts`'ten import — magic number YASAK
- forwardRef tüm yeni motion component'lerde zorunlu

**Alternatif (seçilmedi):** shadcn/ui ekleme — Tedbirge için aşırı (Radix UI ekosistem yok), motion-spesifik component'ler doğrudan yeterli.

**Mimar:** Claude Opus 4.7 (TUR #44.1 A5+A6, 1 Mayıs 2026)
**Onay:** Mehmet Dinç ("YAZ ORTAK")
**Disiplin:** Madde 4.5

---

## 1 Mayıs 2026 (gece geç) — TUR #44 BÜYÜK KAPANIŞ: Hareket Disiplini

### Karar 11: TUR #44.2 ve #44.3 Birleştirme — "Tek Mektup Uçtan Uca" Pattern

**Bağlam:** TUR #44.1 kapandıktan sonra mimar TUR #44.2 (yaygınlaştırma) ve TUR #44.3 (cinematic) için ayrı mektuplar planlamıştı. Mehmet Bey TUR #44.2 mektubunu uygulayıp 5 sayfa görsel onayı verdi (A4), sonra A8 anasayfa hero için Claude Code "atlama" kararı verdi → A10 tek görsel onay durağında "hero zaten yeterince güzeldi" tartışıldı. Mehmet Bey CEO disiplini ile **"Tur 44.2 ve 44.3'ü birleştir, tek mektup, tek onay"** direktifini verdi.

**Karar:** TUR #44.2 (yaygınlaştırma kalan atomları: A8+A9 anasayfa) ve TUR #44.3 (cinematic) **tek birleşik mektupla** uçtan uca uygulandı. Atom başına Mehmet Bey görsel onayı **kaldırıldı** — tek nokta sonu görsel onay. Mevcut working tree (TUR #44.2 A1-A7 zaten yapılmış, 11 dosya commit'siz) **korundu**, üzerine cinematic katman (C1-C8 atomları + C9 son rötuş) eklendi.

**Atomlar:**
- C1: lib/motion.ts cinematic genişleme (EASE_CINEMATIC, EASE_MAGNETIC, HERO_TIMING, heroWordCinematic, heroBadgeVariants, heroSubtitleVariants, heroCtaVariants, HOVER_SCALE_V2, HOVER_GLOW_*)
- C2+C8: globals.css cinematic CSS class'ları (.tedbirge-hero-bg + .tedbirge-hero-highlight + .tedbirge-cta-cinematic + .tedbirge-social-icon + .tedbirge-cta-pulse + 3 @keyframes)
- C3: Anasayfa hero refactor — section tedbirge-hero-bg, başlıklar kelime kelime heroWordCinematic (6 kelime), "Zeka" tedbirge-hero-highlight, alt yazı + CTA grup variant'lar, butonlar tedbirge-cta-cinematic + accent + pulse
- C4: Sosyal medya iconları motion.a → a + tedbirge-social-icon (CSS class scale+rotate+color)
- C5 atlandı (section akış zaten Reveal/SectionReveal akışkan)
- C6: HomePageClient HOVER_SCALE → HOVER_SCALE_V2 (eski import kaldırıldı)
- C7: MotionButton/MotionCard glow prop + cinematic emphasis (geriye uyumlu)
- C9 son rötuş: hidden state yumuşatma (Mehmet Bey Ctrl+Shift+R "donmuş ekran" geri bildirimine yanıt)

**Alternatif (seçilmedi):** Atom başına ayrı mektup + ayrı görsel onay (mektup mimar tasarımı). Atom başına test sürdürülebilir değildi — Mehmet Bey CEO yorumuyla doğru.

**Sonuç:**
- Anasayfa hero 2.2sn cinematic akış (badge → kelime stagger → highlight sweep → alt başlık → CTA + pulse)
- 9 sayfada Reveal yaygın
- Hover scale v2 (1.08) + glow (lacivert/yeşil) + magnetic (sosyal icon)
- prefers-reduced-motion 3 katmanlı respect

**Mimari öğrenme — "tek mektup uçtan uca" pattern (gelecek büyük kesitlerde standart):**
Büyük kesitlerde CEO disiplini için atom başına onay yerine **tek görsel onay noktası**. Mimar tüm atomları tek mektupta tarif eder, Claude Code uçtan uca uygular, Mehmet Bey **bir kez** bakar, commit kararı verir. Risk: mektup içinde yanlış varsayımlar varsa kapsam patlar. Karşı tedbir: mektup öncesi mevcut working tree açıkça not edilir, varsayımlar görünür yapılır, Claude Code mevcut yapıya uyum sağlama yetkisi verilir (örn variant ismi farklı ise gerçek ismi kullan).

**Mimar:** Claude Opus 4.7 (TUR #44.2+44.3 birleşik + C9, 1 Mayıs 2026 gece — gece yarısı sonrası)
**Onay:** Mehmet Dinç ("Mimar tavsiyesi C — Tur 44.2 ve 44.3 birleştir, tek mektup, tek onay" + "güzel olmuş" + C9 sonrası "muazzam — toplu commit talimatı")
**Disiplin:** Madde 4 (atom + kanıt), Madde 17.4 (yarım kesit yasağı — birleşik tek tur), Madde 17.5 son söz, Madde 18.4 yeşil nokta

---

### Karar 12: Soft Hidden State Pattern (C9 — SSR + Cache'siz Hydrate UX)

**Bağlam:** TUR #44.2+44.3 cinematic uygulandıktan sonra Mehmet Bey Ctrl+Shift+R yenileme sonrası ekran görüntüsü gönderdi: "Tazminat Hakkınızı" başlığı opacity:0 + blur(8px) → kayıp gibi, badge bulanık, CTA tek. F5 normal yenilemede sorun yok. Sebep: Ctrl+Shift+R cache temizler → JS bundle yeniden indirilir → server-render HTML hidden state hydrate olana kadar 1-2 sn donmuş bulanık ekran.

**Problem:** Production'da yavaş internet ilk kullanıcısı → "bozuk site" izlenimi.

**Karar:** Hidden state'leri yumuşat:
- `heroWordCinematic.hidden`: opacity 0 → 0.35, y 24 → 18, blur 8px → 4px
- `heroBadgeVariants.hidden`: opacity 0 → 0.4, y 10 → 6, scale 0.95 → 0.97
- `heroSubtitleVariants.hidden`: opacity 0 → 0.3, y 16 → 10
- `heroCtaVariants.hidden`: opacity 0 → 0.4, y 20 → 12, scale 0.96 → 0.98
- `.tedbirge-hero-highlight::after`: scaleX 0 → 0.15 + opacity 0.5 (animasyon sonu opacity 1)

**Sonuç:** Donmuş bile olsa "yarı görünür bulanık" hisseder — "kayıp" değil "yumuşakça beliriyor". `visible` state'leri **dokunulmadı** (animasyon nihai sonuç aynı).

**Alternatif (seçilmedi):** opacity:0 başlangıçta tutmak — cache'siz ilk render UX bozuk. Cinematic blur(8px) tutmak — donmuş ekran daha bozuk hisseder.

**Mimari öğrenme — gelecek motion variant'larında standart:**
SSR + client hydrate gecikmesi kombinasyonunda motion variant'ların `hidden` state'leri **0 değil 0.3-0.4 opacity + minimum geometrik bozulma** olmalı. Bu pattern animasyon "kayıp" yerine "yumuşakça beliriyor" hisseder.

**Mimar:** Claude Opus 4.7 (TUR #44 C9, 1 Mayıs 2026 gece geç)
**Onay:** Mehmet Dinç (Ctrl+Shift+R ekran görüntüsü + mimar yumuşatma teklifi onayı)
**Disiplin:** Madde 4 (kanıt — gerçek kullanıcı geri bildirimi), Madde 17.5
