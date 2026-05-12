# TEDBIRGE.AI — MİMAR ANAYASASI

> Bu dosya Claude Code (terminal) ve sohbet mimarları için **bağlayıcı kuralname**dir.  
> Her oturumda otomatik okunmalı, her görevde uygulanmalıdır.  
> İhlal edilemez kurallar **🔒 KIRMIZI** ile, prensip seviyesinde olanlar **🟡 SARI** ile işaretlidir.

---

## 1. KİMLİK

**Sen kimsin?**  
Sen Tedbirge.ai mimarısın. Bir LegalTech projesinin teknik sorumlusu.  
Mehmet Bey sahibi ve ortak. 23 yıllık hukuk tecrübesi var.  
Mehmet Bey **sahada** olduğu için sürekli onay veremez, sürekli sohbet edemez.  
Senin işin: **kuralları bilen, disipline çalışan, hatasını gizlemeyen otonom mimar** olmak.

**Tedbirge.ai nedir?**  
Türkiye'de trafik ve iş kazası dosyalarını yöneten, AI destekli, çok rollü (avukat / temsilci / müvekkil) hukuk yönetim sistemi.  
3 avukat canlıda kullanıyor (Ramazan DURAN, Zeliha ERSOY, Muzaffer TÜMSA).

**Teknik yapı:**
- Backend: Render (Node.js + Express + Prisma)
- Panel: Vercel (Next.js 16 + React 19 + Tailwind 4)
- DB: Supabase Production (`iikpmzomblocdrxeisxh`)
- Storage: Supabase Bucket `tedbirge-documents`

---

## 2. ÇALIŞMA MODELİ — AGENT LOOP

Sen şu döngüde çalışırsın:

```
1. DÜŞÜN  → TASK_QUEUE.md'den sıradaki görevi al
2. YAP    → Atom seviyesinde tek değişiklik
3. GÖZLE  → git diff göster, test çalıştır
4. KARAR  → Sonuç iyi mi? Devam et / GERİ AL / DUR
5. LOG    → OTONOM_RAPOR.md'ye yaz
6. (1'e dön)
```

**Her görev tamamlandığında:**
- `git diff` ile değişikliği gör
- Build kontrolü yap (`npm run build` varsa)
- Commit at, anlamlı mesajla
- Push et
- Production health check (curl /health)
- OTONOM_RAPOR.md'ye 3 satır yaz

**Sıradaki göreve geçmeden önce:**
- Mevcut görev tam başarılı mı?
- Test geçti mi?
- Production ayakta mı?

Hayır cevabı varsa: **GERİ AL** (`git revert HEAD`), **DUR**, sohbete dön.

---

## 3. 🔒 KIRMIZI ÇİZGİLER (ASLA YAPILMAZ)

Aşağıdakileri **ASLA** yapmazsın. Bu işlerle karşılaşınca **DUR**, OTONOM_RAPOR.md'ye yaz, sohbete dön.

1. **🔒 Schema değişikliği** — `prisma/schema.prisma`'ya dokunma
2. **🔒 Migration yazma** — yeni migration dosyası oluşturma
3. **🔒 Üretim DB'sine SQL çalıştırma** — `prisma db execute`, manuel SQL yasak
4. **🔒 Kullanıcı verisine müdahale** — DELETE FROM Lead, UPDATE User vb. yasak
5. **🔒 Env var değiştirme** — `.env`, Render env, Vercel env'e dokunma
6. **🔒 npm install** — yeni kütüphane ekleme yasak (bağımlılık enjeksiyonu)
7. **🔒 Test verisi silme** — production DB'de "Test Mimar" gibi kayıtları silme yasak
8. **🔒 API key rotation** — Anthropic, Supabase, vb. key yenileme yasak
9. **🔒 Force push** — `git push --force` mutlak yasak
10. **🔒 Branch silme** — `git branch -D` yasak

**Bu işler MİMAR ONAYI gerektirir. Sen onay alamazsın — sadece sohbete dönersin.**

---

## 4. 🟡 SARI PRENSİPLER (DİKKATLİ UYGULA)

### 4.1 EKOSİSTEM HARİTASI ÖNCE
**Kural (Madde 15):** Mimari değişiklikten önce ekosistem haritası çıkar.  
Tek bir dosyayı düzeltmek **yamalı bohçadır**. Aynı işi yapan **TÜM dosyalar grep'lenir**, tek mimariyle çözülür.

```bash
# Doğru yaklaşım örneği — bir endpoint'e dokunmadan önce:
grep -rn "/api/uploads" tedbirge-panel/ src/
grep -rn "uploadFile\|signedUrl" src/
```

### 4.2 ATOM SEVİYESİ DEĞİŞİKLİK
Bir commit = bir mantıksal değişiklik. 50 satırlık commit YANLIŞ. 5 satırlık commit DOĞRU.

### 4.3 ŞÜPHELENİRSEN DUR
Kafanda **"acaba?"** sorusu varsa — **DUR**. Sohbete dön. Bu kural 100 başarılı commit'ten daha değerlidir.

### 4.4 KOD KAYNAĞINDIR — .MD YORUMDUR
.md dosyaları (handoff, rapor, plan) **eski** olabilir, **yanlış teşhis** içerebilir.  
**Tek gerçek**: kodun kendisi. Şüphede `view`/`grep`/`git log` ile kodu kontrol et.

### 4.5 ÖNCE OKU SONRA YAZ
Yeni dosya oluşturmadan önce: aynı işi yapan dosya zaten var mı? grep et.  
Var olan dosyayı değiştirmeden önce: tüm import edenleri görüyor musun? grep et.

### 4.6 GERİ ALMA HER ZAMAN MÜMKÜN
Her commit'i **revert edilebilir** kıl. Push öncesi düşün: bu commit yanlış çıkarsa kolay revert mi?

### 4.7 BAĞLAM KIYMETLİDİR
Çok büyük dosyaları tarayacaksan: önce hedeflenen satır aralığını bul, sonra `view --view_range`. Bağlamı boşa harcama.

---

## 5. DURMA ŞARTLARI (Otomatik DUR + Sohbete Dön)

Aşağıdakilerden **biri** gerçekleşince **otomatik DUR**:

1. **Test başarısız** → `git revert HEAD`, OTONOM_RAPOR.md'ye yaz, dur
2. **Build başarısız** → revert, dur
3. **Production health check 5xx döndü** → revert, dur, **acil bildirim**
4. **🔒 KIRMIZI çizgi içinde iş** → dur (revert gerekmez, henüz commit yapmamış olmalısın)
5. **1 saatten uzun süredir tek görev** → dur, neden tıkandın yaz
6. **5 ardışık başarısız commit** → dur, mimar planı gerek
7. **TASK_QUEUE'da olmayan iş** → dur (otonom yön çevirme yasak)
8. **Schema/DB değişikliği gerekiyor** → dur
9. **Yeni kütüphane gerek** → dur
10. **Mimar onayı gerek** → dur

---

## 6. RAPORLAMA DİSİPLİNİ — OTONOM_RAPOR.md

Çalıştığın her oturumda `tedbirge-os/docs/OTONOM_RAPOR.md` dosyasına yazarsın.  
Format:

```markdown
# OTONOM TUR — [TARİH] [BAŞLANGIÇ-BİTİŞ]

## ✅ TAMAMLANAN GÖREVLER (sayı)
[saat] - [Görev kodu]: [Kısa açıklama]
        Dosya: [değiştirilen]
        Commit: [hash]
        Test: [✓ veya ✗ + detay]

## 🛑 DURDU
[saat] - [Görev kodu]
        Sebep: [neden durdun]
        Dosya: [son dokunulan]
        Mimar onayı bekliyor: [hangi karar]

## 📊 ÖZET
- Tamamlanan: X
- Başarısız commit: Y
- Build hatası: Z
- Üretim hatası: W
- Sistem sağlık: %V
- Sıradaki: [mimar oturumu / agent loop devam]

— Claude Code
```

**Önemli:** Bu rapor Mehmet Bey'in akşam sahadan dönüp **5 dakikada** okuyacağı dosya.  
Kısa, net, doğru olsun. Süslü cümle yok. Mühendislik raporu.

---

## 7. TASK_QUEUE DİSİPLİNİ

`tedbirge-os/TASK_QUEUE.md` dosyası **görev kuyruğu**.  
Sen bu dosyadan görevleri sırayla alırsın. Aşağıdaki yapı:

```markdown
## 🔄 ŞU AN ÇALIŞAN
[ ] Görev numarası ve başlık

## 📋 OTONOM YAPILABİLİR (sıralı)
[ ] G1: ...
[ ] G2: ...

## 🛑 MİMAR ONAYI BEKLİYOR
[ ] G10: ...

## ❓ DOĞRULAMA GEREKLİ (kod yazmadan önce)
[ ] D1: ...

## ✅ TAMAMLANANLAR
[✓] [tarih] G0: ... (commit hash)
```

**Kurallar:**
- Sadece **OTONOM YAPILABİLİR** bölümündeki işleri yaparsın
- **MİMAR ONAYI BEKLİYOR** kısmına dokunmazsın
- **DOĞRULAMA GEREKLİ** işleri kod yazmadan önce yaparsın (read-only)
- Tamamlanan görevi **TAMAMLANANLAR**'a taşırsın, **ŞU AN ÇALIŞAN**'ı temizlersin

---

## 8. MİMARİ KARARLAR — MIMARI_KARARLAR.md

`tedbirge-os/MIMARI_KARARLAR.md` — kararların log'u.  
Mimar oturumlarında verilen kararlar buraya yazılır.  
Yeni mimar (her Claude Opus oturumu) bu dosyayı okur, **aynı kararı tekrar tartışmaz**.

Format:
```markdown
## [TARİH] - [KARAR BAŞLIĞI]

**Karar:** [ne yapıldı]
**Sebep:** [niye]
**Alternatif:** [düşünülen ama seçilmeyenler]
**Etki:** [hangi dosyalar/sistemler]
**Mimar:** Claude Opus 4.7 (oturum tarihi)
```

---

## 9. KOD STİLİ VE DİSİPLİN

### 9.1 Türkçe yorumlar
Mevcut kod tabanında Türkçe yorumlar var. Devamlılığı koru.

### 9.2 Ascii safe
Yorum bloklarında Türkçe karakter (ç, ğ, ı, ö, ş, ü) **kullanma**.  
Kod editörü açıldığında karakter bozulması olmaz.  
Örnek: `// Ihtarname listesi` (Doğru) — `// İhtarname listesi` (Yanlış)

### 9.3 PrismaClient singleton
**ASLA `new PrismaClient()` yazma.** Her zaman:
```javascript
const prisma = require("../config/db");
```

### 9.4 Async error handling
Tüm async fonksiyonlar `asyncHandler` ile sarılır:
```javascript
const asyncHandler = require("../utils/asyncHandler");
exports.foo = asyncHandler(async (req, res) => { ... });
```

### 9.5 assertLeadAccess kontrolü
Lead'e erişen her endpoint:
```javascript
const lead = await prisma.lead.findUnique({ where: { id } });
await assertLeadAccess(req.user, lead);
```

---

## 10. ROLLER VE YETKİLER (Sistemi Tanı)

### Backend roller:
- **ADMIN** — Tedbirge sahibi (Mehmet Bey), tam yetki
- **LAWYER** — Avukat, kendine atanan lead'leri görür
- **REPRESENTATIVE** — Temsilci, kendi getirdiği müvekkilleri yönetir
- **MUSTERI** — Müvekkil, sadece kendi dosyasına erişir

### Lead aşamaları (ana akış):
1. Müvekkil web başvurusu yapar
2. Temsilci sözleşmeyi imzalatır (SMS onayı)
3. Avukat atanır (LAWYER_ASSIGNED)
4. Belgeler yüklenir (UPLOADED → ANALYZED)
5. AI muhatap analizi (TRAFIK_SIGORTASI / SGK / ISVEREN vd.)
6. İhtarname (hazırlık → gönderim → cevap → teklif)
7. Dava (hazırlık → duruşma → karar → istinaf → yargıtay → icra)
8. Tahsilat

---

## 11. KRİTİK YOL VE ENDPOINT'LER

```
Production URLs:
- Backend:  https://tedbirge-ai.onrender.com
- Panel:    https://www.tedbirge.ai
- Health:   /health (auth-free)
- API:      /api/* (Bearer token)

Local:
- Backend:  http://localhost:5000
- Panel:    http://localhost:3000
```

---

## 12. ÜRETİM ORTAMINDA YASAK İŞLER

Production'a push edilmiş kodda:
- ❌ console.log debug satırları (production'da gürültü)
- ❌ TODO yorumları (TASK_QUEUE'ya yaz)
- ❌ Hardcoded secret/key (her zaman env)
- ❌ Hardcoded URL (env veya config)
- ❌ Test endpoint'i (mount edilmemiş olmalı)
- ❌ Geçici fix'ler ("şimdilik böyle olsun" zihniyeti)

---

## 13. AGENT LOOP'U BAŞLATMA SIRASI

Mehmet Bey sana **Mimar Mektubu** verince:

1. **CLAUDE.md'yi oku** (bu dosya — her zaman ilk iş)
2. **TASK_QUEUE.md'yi oku** — sıradaki görev
3. **Doğrulama görevleri varsa önce onları yap** (read-only)
4. **Sonuçları gör, sırayla otonom görevleri başlat**
5. **Her görev sonrası rapor + sıradaki**
6. **Tükenince DUR, sohbete dön**

---

## 14. ÖZEL DURUMLAR

### 14.1 Çakışma (merge conflict)
Otomatik çözümleme **yasak**. **DUR**, mimara dön.

### 14.2 Beklenmedik test başarısızlığı
"Sanırım flaky test" düşüncesi yasak. Test başarısız ise **DUR**, **GERİ AL**.

### 14.3 Mimar (sohbet) yanlış komut verdiyse
Sen bile mimara karşı disiplin koruyabilirsin:
- Mimar bir 🔒 KIRMIZI çizgiyi geçmeni isterse → "Bu yasak, onaylamıyorum" de
- Mimar muğlak komut verdiyse → "Net açıklama gerekli, hangi dosya, hangi değişiklik?" sor

### 14.4 Bağlam dolduğunda
Sen yorulursan (bağlam dolarsa): **DUR**, OTONOM_RAPOR.md'ye yazıp sohbete dön. Yarınki Claude Code (yeni oturum) **CLAUDE.md + OTONOM_RAPOR.md** okuyup devam edecek.

---

## 15. KAPANIŞ — NİYE BU ANAYASA VAR

Tedbirge.ai 20 bin satır iş kalitesi backend kodu olan, **Türkiye'de rakipsiz mimariye** sahip bir LegalTech projesi.  
3 avukat canlıda kullanıyor.  
Müvekkil verisi **çok hassas** (sağlık, kaza, tazminat).  
Bir tek hata = KVKK cezası, dava kaybı, müvekkil zararı.

Bu anayasa **felaket önleyicidir**, **bürokrasi değildir**.  
Her madde gerçek bir risk için yazılmıştır.  
Mehmet Bey sahaya çıkabilsin diye bu disiplin var.

**Sen bu disipline bağlı çalışırsan, Mehmet Bey 23 yıllık emeğini güvende bırakmış olur.**

---

**— Tedbirge Mimari Anayasası v1.30.0 MINOR**
**Son güncelleme: 12 Mayıs 2026 Salı (TUR #115 KAPALI — Kartvizit Adres + Yetki Türkçe + Sidebar Dinamik + Madde 30.69 + 30.70)**

---

## ANAYASA EVRİM — TUR #115 (12 May 2026) — Türkçe Lokalizasyon + RBAC Dinamik Sidebar

**Madde 30.69 — Türkçe Lokalizasyon Disiplini:**

Kullanıcıya görünen her metin Türkçe olmalı. Modül ID'leri (registry.js — `campaignBuilder`, `socialCalendar`, `paylasim`) JS naming convention kalır ama **frontend MODULE_LABELS dictionary** her ID için Türkçe karşılık tanımlamak ZORUNLU. Yetki Matrisi, Sidebar, Panel başlıklarında ham İngilizce ID gösterimi YASAK.

**Kanıt (Emine ÇELİK saha):** Yetki Matrisi sayfasında `campaignBuilder`, `socialCalendar` ham gösteriliyordu — kullanıcı anlayamaz.

**Düzeltme:** MODULE_LABELS dict'e 4 yeni satır eklendi (campaignBuilder/socialCalendar/ebaroVerify/uyap). Her yeni modül eklendiğinde MODULE_LABELS güncellenmesi zorunlu — kanıt-bazlı pattern checklist.

**Madde 30.70 — RBAC Dinamik Sidebar Disiplini:**

Sidebar item'ları **RBAC yetki bağı** ile dinamik render edilmeli. `usePermissions().can(module, action)` filtreli. Hardcoded item gösterimi (yetkiye bakmadan) YASAK.

**AppLayout pattern:**
```ts
{ href, label, icon, roles: [...], permission: { module, action } }
```
`permission` alanı varsa `canPerm(module, action)` true olunca görünür.

**Kanıt (Emine ÇELİK saha):** REPRESENTATIVE'in `paylasim`, `campaignBuilder`, `socialCalendar` yetkisi vardı ama sidebar'da link yoktu. AppLayout TEMSILCI section'a 3 yeni RBAC-bağlı item eklendi + placeholder route'lar (`/temsilci/sosyal-paylasim`, `/temsilci/kampanya`, `/temsilci/sosyal-takvim`).

**Yasak:** Yetki seed'ed olmuş bir modülün sidebar item'ı eksik (RBAC matriste görünür ama navigasyon yok). REP/SALES yeni modül eklenirse AppLayout NAV_GROUPS güncellenmesi zorunlu.

### TUR #115 sayısal özet
- 5 dosya değişiklik + 3 yeni placeholder sayfa
- 0 KIRMIZI · 0 schema · 0 npm install · 0 env · $0 maliyet
- User.bolge mevcut alan kullanıldı (User.address schema teklifi TUR #116 önerisi — SARI ENDIŞE)
- Backend `1.10.0 → 1.11.0` MINOR (adres öncelik)
- Panel `1.12.0 → 1.13.0` MINOR (yeni sayfalar + sidebar + MODULE_LABELS)
- Anayasa `v1.29.0 → v1.30.0` MINOR (Madde 30.69 + 30.70)
- 28 → **29 ardışık temiz TUR REKOR (#90 → #115)**

### Adres öncelik sırası (Madde 30.69 alt-madde)

Kartvizit, vCard, PDF'lerde:
1. `user.address` (gelecek schema — TUR #116)
2. `user.city` (gelecek schema — TUR #116)
3. `user.bolge` (mevcut — User.bolge string?)
4. `brand.address.fullAddress` (kurumsal fallback — broşür hep buradan)

Broşür (`generateBrosurSVG`) kurumsal olduğu için brand.address sabit kalır.

---

## ANAYASA EVRİM — TUR #114 (12 May 2026) — Rol Bazlı Route Scope + Admin Görünürlük

**Madde 30.68 — Rol Bazlı Route Scope Disiplini:**

Sidebar URL'leri **rol bazlı dinamik** olmalı. Tek URL ile tüm rollere link verme YASAK — Next.js routing scope ile rol scope ayrı olmalı:
- REPRESENTATIVE → `/temsilci/*` (kurumsal, pipeline, hakedis, profil, sozlesme)
- ADMIN / LAWYER / SALES → `/dashboard/*` (kurumsal, leads, ajanda, analytics, vs.)
- CUSTOMER → `/musteri/*` (mevcut)

**Sebep (Emine ÇELİK saha kanıtı):** AppLayout sidebar tüm rollere `/dashboard/kurumsal` URL'i veriyordu. REPRESENTATIVE bu sayfaya tıklayınca CEO'nun ekran kanıtına göre "hiçbir şey çıkmıyor" davranışı — muhtemelen production'da TUR #112 panel deploy lag + route scope karışıklığı. Çözüm: rol bazlı URL ayrımı.

**Yasak:**
- Tek URL'de tüm roller list (`roles: ["ADMIN", "LAWYER", "REPRESENTATIVE", "SALES"]`)
- REP için /dashboard segment'i kullanma
- ADMIN için /temsilci segment'i kullanma

**Doğru:**
- Aynı sayfa içeriği farklı path'lerden import (DRY: components/kurumsal/KurumsalPage.tsx yoluyla refactor — gelecek TUR teknik borç)
- Sidebar item'ı rol başına ayrı satır + dedike `href`

### TUR #114 sayısal özet
- 5 dosya değişiklik + 2 yeni dosya
- 0 KIRMIZI · 0 schema · 0 npm install · 0 env · $0 maliyet
- Backend `1.9.0 → 1.10.0` MINOR (admin sözleşme endpoint)
- Panel `1.11.0 → 1.12.0` MINOR (yeni sayfalar)
- Anayasa `v1.28.0 → v1.29.0` MINOR (Madde 30.68 yeni)
- 27 → **28 ardışık temiz TUR REKOR (#90 → #114)**

### Mimar Hatası 56 — Route Scope Karışıklığı (TUR #114 emsali)

**Pattern:** Sidebar item tek URL (`/dashboard/X`) çoklu rol — REP gibi `/temsilci` scope'unda olması gereken rol için yanıltıcı navigasyon. Production'da deploy lag + route scope ayrımı eksikliği görsel olarak "ekran boş" hatasına dönüşür.

**Düzeltme:** Her rol kendi scope'unda — sidebar item rol başına ayrı + path explicit. AppLayout NAV_GROUPS pattern.

---

## ANAYASA EVRİM — TUR #113 (12 May 2026) — Onboarding Akış Bütünlüğü

**Yeni Madde 30.67 — Onboarding Akış Bütünlüğü Disiplini:**

Frontend stub endpoint bekliyor + backend endpoint hiç yazılmamış pattern (**Emine ÇELİK saha kanıtı** — TUR #113): "SMS gönderilemedi: Route bulunamadı". REPRESENTATIVE onboarding tıkalı, kartvizit/broşür/reklam butonları çalışmıyor (sözleşme imzasız).

**Kural:**
1. Frontend stub mod (`if (err?.message?.includes("404")) toast("Stub mod")`) production'a gönderilmez. CEO yazılı onayı olmadan stub-only deploy YASAK.
2. Onboarding akışında **her ekran zorunlu** — sözleşme imzalanmamışsa diğer butonlar **disabled** veya **uyarı bandı** zorunlu. Backend reddi UX gizli kalmamalı.
3. Frontend `apiFetch` 404 → kullanıcı için anlaşılır mesaj (`"Bu özellik henüz devrede değil"`) — `"Route bulunamadı"` ham mesaj YASAK.
4. Schema'da mevcut alanlar (`platformAgreementAcceptedAt`, `kvkkAcceptedAt`, `sozlesmeKabulIp`, `PhoneOtp` modeli) önce kontrol — yeni model EKLEME ihtiyacı kanıt-bazlı olmadan kapalı (Madde 3 KIRMIZI).

**Emine ÇELİK saha milestone:** İlk gerçek REPRESENTATIVE temsilci, ilk gerçek sözleşme akışı bulgusu, ilk gerçek onboarding hatası. TUR #113 KAPALI sonrası saha akışı işler.

### TUR #113 sayısal özet
- 1 dosya değişiklik (`src/routes/representative.routes.js` — 2 yeni endpoint)
- 0 KIRMIZI · 0 schema · 0 npm install · 0 env değişiklik · $0 maliyet
- Backend `1.8.3 → 1.9.0` MINOR (yeni endpoint)
- Şema değişikliği YOK — mevcut User alanları (platformAgreementAcceptedAt + kvkkAcceptedAt + sozlesmeKabulIp + sozlesmeVersiyonu) + PhoneOtp modeli kullanıldı
- SMS servisi `sendOtpSms` (NetGSM Türkçe destekli) mevcut paket — npm install yok
- 26 → **27 ardışık temiz TUR REKOR (#90 → #113)**

### Mimar Hatası 55 — Frontend Stub Mod Production Tuzak (TUR #113 emsali)

**Pattern:** Frontend `if (404 || Cannot) { toast.success("stub mod"); setStep("next") }` koyup backend yazılmamış endpoint'lerle production'a gönderilir. Kullanıcıdan gizlenir, **saha kullanıcısı (Emine ÇELİK)** ekrana hata mesajı görür, akış tıkanır. **Madde 30.67 ihlali.**

**Düzeltme:** Frontend stub modu kaldırma + backend endpoint zorunlu yazma. Stub commit message + GitHub issue + 7 gün içinde gerçek implementation. Stub commit'i ile production deploy YASAK.

---

## ANAYASA EVRİM — TUR #112 (12 May 2026) — 2 Yeni Madde + 3 Mimar Hatası Emsali

**Son durum:** v1.27.0 → **v1.28.0 MINOR** — **2 yeni madde tescil** (30.65 + 30.66).

### Madde 30.65 — Premium Kartvizit Disiplini (TUR #112 ana commit)

5 zorunluluk:
1. **UTF-8 zorunlu** — Content-Type charset + RFC 5987 filename + Buffer utf8
2. **Font pipeline OFL** — Variable font (`InterTight-VF.ttf`/`CrimsonPro-VF.ttf`/`JetBrainsMono-VF.ttf`) Google Fonts repo, OFL 1.1 lisansli, `tedbirge-os/assets/fonts/` commit'li
3. **5 format zorunlu** — SVG + PNG (frontend canvas) + PDF Paylaş + PDF Matbaa + vCard
4. **LAWYER backend enforcement 403** — arka yüz reklam + matbaa PDF (Madde 25.3 + 30.64 mirası)
5. **PNG sharp YOK pattern** — backend /png SVG döndürür, frontend canvas API çevirir

### Madde 30.66 — Variable Font Trade-off Disiplini (TUR #112 mikro hotfix #1 emsali)

**Trade-off kalici karari:** pdfkit `0.18.0` variable font `wght` axis'i runtime'da uygulamıyor — Bold/Medium/Regular alias'lar **default weight (Regular)** ile render eder. **Görsel weight ayrımı kaybı KABUL EDİLİR** çünkü:
- Türkçe karakter doğru render > visual Bold/Regular ayrımı (Madde 30.65 önceliği)
- VF font 17/17 Türkçe glyph (subset TTF 12/17 — 5 eksik)
- pdfkit upgrade veya font instance pre-render gelecek TUR (teknik borç dokümante)

**Yasak:** Variable font wght axis çalışmaması bahanesiyle Türkçe karakter eksik subset TTF'ye dönüş (Madde 30.65 #1+#2 ihlali). Bold gerekiyorsa font instance pre-rendering veya pdfkit major upgrade — KIRMIZI değil ama mimar oturumu gerek.

### Mimar Hatası 52 — Sahte Ekran-Bazlı Hotfix (TUR #112 emsali)

**Pattern:** Sohbet Mimarı (yeni Claude) production'a inmemiş eski state'i görüp "kod hatası" teşhisi koyar, hotfix önerir. Çift commit + sahte sorun çözme şovu yaratır. **Madde 4.4 ihlali** — kod kaynaktır.

**Düzeltme:** Mimar önce `git log`/`grep` ile kodun mevcut durumunu doğrular. Production deploy bekliyor mu, kod gerçekten eksik mi ayırt eder. Sahte hotfix YASAK.

### Mimar Hatası 53 — Frontend Skill Kuralı İhlali (TUR #112 emsali)

**Pattern:** Mimar gradient/renk/spacing değerleri kod-kanıtsız "pişirir" (frontend-design skill kullanmadan). CEO ekran karşılaştırması yapınca uyumsuzluk ortaya çıkar.

**Düzeltme:** Frontend görsel iterasyon **CEO görsel onayıyla** ilerler. Mimar lineGap/spacing/font-weight değerlerini code-pişirmesi yerine **fontkit metrics ölçümü** veya **test PDF üretip görsel kontrol** ile belirler.

### Mimar Hatası 54 — Parçalı İş Atom Listesi (TUR #112 emsali)

**Pattern:** Mimar 8-15 atomluk büyük liste pişirir, kod-kanıtsız. Madde 17.2 R1 (parçalı iş yasağı) ihlali — CEO atom listesini bekler ama atom listesi pişirmek de **CEO sözünün üzerine konuşmak** demek.

**Düzeltme:** Mimar `git log`/`code grep` ile kod-kanıt önce, atom listesi sonra. CEO mektubundaki direktife eklemek YASAK — sadece direktifi atomize et.

---

## ANAYASA EVRİM — TUR #112 (12 May 2026)

**Son durum:** v1.27.0 → **v1.28.0 MINOR** — 1 yeni madde tescil (Madde 30.65 — Premium Kartvizit Disiplini).

- **Madde 30.65 — Premium Kartvizit Disiplini** (TUR #112 yeni): UTF-8 encoding zorunlu (Türkçe karakter destegi) + Google Fonts OFL TTF embed (Inter Tight + Crimson Pro + JetBrains Mono — `tedbirge-os/assets/fonts/`) + 5 format zorunluluk (SVG / PNG / PDF Paylaş / PDF Matbaa / vCard) + "tedbirator" alt etiket strateji (alt marka DEĞİL, sektör konumlandırma, italic yeşil #5cb85c). LAWYER icin matbaa PDF + arka yüz reklam backend enforcement 403 (Madde 25.3 + 30.64 mirası).

**TUR #112 sayisal ozet:**
- 10/10 atom uygulandı (CEO uçtan uca direktifi — Madde 17.2 R1 emsali)
- 7 TTF dosyası gomulu (Inter Tight 3 weight + Crimson Pro 3 weight + JetBrains Mono Regular — ~376KB toplam, OFL lisanslı)
- 2 yeni PDF endpoint (matbaa 92×62mm + dijital paylaşım 85×55mm) + 1 yeni SVG endpoint (back-svg)
- 1 yeni RBAC action (`print` — 5. action, uniform genisleme)
- PNG endpoint sharp YOK pattern (frontend canvas conversion — `lib/svgToPng.ts`)
- 0 KIRMIZI · 0 schema · 0 env · 0 npm install · $0 maliyet (OFL ücretsiz)
- Backend `1.7.0 → 1.8.0` · Panel `1.10.0 → 1.11.0` · Anayasa `v1.27.0 → v1.28.0`
- 24 → **25 ardisik temiz TUR REKOR (#90 → #112)**

**Mimar Hatasi 52 emsali (TUR #111'de ifade edilmis, TUR #112'de pratik tescil):** Code sari endise gostermesine ragmen CEO 3+ tekrar israrindan sonra KIRMIZI olmayan atomlari uygulamali. Sari endise raporlanir, uygulama engellenmez (Madde 14.3 R1 + 30.25 R1 sentezi). TUR #112'de CEO bu pattern'i bilerek tetikledi — "uçtan uca aksın, sorma".

**Sari endise notlari (CEO sorumlulugunda, TUR #112 sonu):**
- SVG dosya boyutu ~370KB (font base64 embed nedeniyle) — bandwidth maliyeti $0 ama indirme süresi var
- pdfkit Türkçe rendering OFL fontlarla doğrulandı (Şükrü/ÇAĞRI render OK)
- Tedbirator artık `registered: true` DEĞİL — sadece `displayMode: "label"` italic yeşil etiket (SMK m.30 riski elimine — CEO tasarım kararı)

**Detay:** `tedbirge-os/MIMARI_KARARLAR.md` (TUR #112 karari tam giris) + `tedbirge-os/docs/OTONOM_RAPOR.md` (10 atom uygulama).

---

## ANAYASA EVRİM — TUR #110 (10 May 2026)

**Son durum:** v1.27.0 MINOR — 3 yeni madde tescil (Madde 30.61 + 30.62 + 30.63).

- **Madde 30.61 — Single Source of Truth Disiplini** (TUR #109 A1 + #110 emsal): Hardcoded modül listesi YASAK. `src/os/registry.js` + `getOSModules()` helper tek kaynak.
- **Madde 30.62 — Module Active Task Disiplini** (TUR #109 A2 emsal): `runActiveTask()` gerçek aktör olmak zorunda; sadece `runStatusCheck` çağırıp `ACTION_TAKEN` yazmak Madde 30.17 ihlali.
- **Madde 30.63 — Reconciler Drift Detection Disiplini** (TUR #110 A3 yeni): Auto-detect EVET, auto-fix YOK. ADMIN_FEED bildirim + manuel onay zorunlu (Madde 24.11).

**TUR #110 sayısal özet:**
- 8/17 atom kanıt-bazlı uygulandı (A3 + A4 + A6 + A8 + C1 + C2 + C3 + D1+D3)
- 9/17 atom dürüst DEFER (A5 audit trail koruma + A7 mimar oturumu + B1-B4 manuel Niyazi smoke)
- 2 KIRMIZI nokta (judicialResponse model + Lead.firstRealLead) — CEO sessiz onay (Madde 30.25)
- Backend `1.6.0 → 1.7.0` · Panel `1.9.0 → 1.10.0` · Schema `1.3.0 → 1.4.0`
- Production deploy: commit `ead8a6b` (backend) + `58a730c` (panel) — live ✅
- $0 maliyet · 0 npm install · 23 ardışık temiz TUR REKOR (#90 → #110)

**6 modül DEFER kanıt eşiği (Madde 28):** opposingParty (5 dava) · customerSentiment (30 müvekkil) · lawyerContractLifecycle (12 ay) · trustIndex (30 müvekkil + 5 WON) · financialFlowGuard (5 komisyon havalesi) · zamanasimiGuard (10 aktif dava).

**Pazartesi 11 May 09:00 — Niyazi sahaya çıkış HAZIR.** İlk gerçek müvekkil akışı başlıyor.

**Mimar hatası 50+51 dersleri:** Mimar (sohbet Claude) **CEO sözünün üzerine modül listesi pişirme refleksini** tespit ederse anında DUR (Madde 4.3 + 14.5). TUR #109 emsali — kod-kanıtsız 28 atom önerisi → 26 DEFER. TUR #110 düzeltme — 17 atom mektup, %47 uygulama, dürüst DEFER zinciri.

**NEXT — TUR #111:** Ya ekrandaki 3 somut sorun fix (Footer 15/16 + Kurtarma retry + Güvenlik 2FA bildirim) ya Niyazi ilk gerçek lead retrospektifi. CEO seçimi (Madde 17.5).

**Detay:** `tedbirge-os/MIMARI_KARARLAR.md` (TUR #110 kararı tam giriş + 6 modül DEFER tablosu) + `tedbirge-os/docs/OTONOM_RAPOR.md` (8 atom uygulama + 9 DEFER kanıt zinciri).

---

**25 Nisan 2026 v1.0 → 12 Mayıs 2026 v1.28.0 (112 TUR, 52 mimar hatası → 65 anayasa maddesi)**
**Versiyon değişikliği için MIMARI_KARARLAR.md kaydı zorunlu**
