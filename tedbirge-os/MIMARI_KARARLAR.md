# TEDBIRGE.AI — MİMARİ KARARLAR LOG

> Bu dosya **karar arşividir**. Mimar oturumlarında verilen tasarım kararları, paradigma değişiklikleri, yapı tercihleri buraya yazılır.  
> Yeni mimar (her Claude Opus oturumu) bu dosyayı okur ve **aynı kararları tekrar tartışmaz**.  
> Format: tarih + karar + sebep + alternatif + etki + mimar.

---

## 12 Mayıs 2026 Salı — TUR #115 KAPALI (Kartvizit Adres + Yetki Türkçe + Sidebar RBAC Dinamik — Emine ÇELİK Saha Zinciri #3)

**Karar:** Anayasa **v1.29.0 → v1.30.0 MINOR**. Backend `1.10.0 → 1.11.0` MINOR. Panel `1.12.0 → 1.13.0` MINOR. 2 yeni madde tescili (30.69 + 30.70). 0 KIRMIZI, 0 schema, 0 npm install.

**Saha kanıt zinciri (Emine ÇELİK 3. bulgu):**
- BULGU 1: Kartvizit ön yüz temsilci adresi yerine kurumsal Tedbirge adresi (Meram/Konya) görünüyordu
- BULGU 2: Yetki Matrisi'nde `campaignBuilder`, `socialCalendar`, `ebaroVerify`, `uyap` ham İngilizce ID
- BULGU 3: REPRESENTATIVE yetkili olduğu pazarlama modülleri sidebar'da link yok (RBAC matriste görünür ama navigasyon eksik)

**Teşhis sonucu (kanıt-bazlı):**
- User schema: `User.bolge String?` mevcut (line 398), `User.address` ve `User.city` YOK. SARI ENDIŞE: TUR #116 schema teklifi.
- corporate.service.js 3 nokta `brand.address.fullAddress` hardcoded (vCard + SVG + PDF)
- MODULE_LABELS frontend dict'inde 4 modül Türkçe yok (campaignBuilder/socialCalendar/ebaroVerify/uyap)
- AppLayout TEMSILCI section'da paylasim/campaignBuilder/socialCalendar sidebar item YOK

**5 ATOM uygulandı (UÇTAN UCA):**

1. **ATOM 1 — Kartvizit adres öncelik** (`corporate.service.js` 3 nokta):
   - `generateVCard`: `ADR:;;${user.address || user.city || user.bolge || brand.address.fullAddress}`
   - `generateKartvizitSVG`: SVG `<text>` adres satırı aynı öncelik
   - `drawCardFront`: PDF text aynı öncelik
   - Broşür (`generateBrosurSVG`) kurumsal kalır (brand.address sabit)

2. **ATOM 2 — Schema kontrolü** (KIRMIZI çizgi):
   - User.address ve User.city YOK
   - User.bolge VAR → kullanıldı, KIRMIZI yok
   - SARI ENDIŞE: TUR #116 schema teklifi (User.address explicit field profile edit için)

3. **ATOM 3 — MODULE_LABELS Türkçe** (`yetkiler/page.tsx`):
   - 4 yeni: campaignBuilder → "Kampanya Oluşturucu", socialCalendar → "Sosyal Takvim", ebaroVerify → "e-Baro Doğrulama", uyap → "UYAP"
   - Madde 30.69 emsali tescil

4. **ATOM 4 — AppLayout TEMSILCI section RBAC item'lar** (`AppLayout.tsx`):
   - `/temsilci/sosyal-paylasim` (paylasim:execute)
   - `/temsilci/kampanya` (campaignBuilder:read)
   - `/temsilci/sosyal-takvim` (socialCalendar:read)
   - `permission` alanı ile RBAC bağı — Madde 30.70 emsali

5. **ATOM 5 — 3 placeholder sayfa** (`/temsilci/{sosyal-paylasim,kampanya,sosyal-takvim}/page.tsx`):
   - usePermissions can() kontrolü
   - "Yakında" mesajı + ilgili mevcut altyapı linki (kartvizit/UTM)
   - Tam işlevsellik gelecek TUR (yetki erişimi öncelikti)

### Madde 30.69 yeni — Türkçe Lokalizasyon Disiplini

Modül ID JS naming convention kalır, frontend MODULE_LABELS Türkçe ZORUNLU. Yeni modül eklenince checklist: registry.js + MODULE_LABELS + AppLayout NAV_GROUPS güncelleme.

### Madde 30.70 yeni — RBAC Dinamik Sidebar Disiplini

Sidebar item'ları `permission: { module, action }` ile bağlı. Yetki seed'ed modüllerin sidebar item'ı zorunlu. Hardcoded gösterim YASAK.

### Etki

- 5 dosya değişiklik (`corporate.service.js`, `AppLayout.tsx`, `yetkiler/page.tsx`, `version.json`, 2x `package.json`)
- 3 yeni dosya (`sosyal-paylasim/page.tsx`, `kampanya/page.tsx`, `sosyal-takvim/page.tsx`)
- 5 belge OS senkron
- 28 → **29 ardışık temiz TUR REKOR (#90 → #115)**

### NEXT — TUR #116

**Öneri:** User.address + User.city schema teklifi + Profil sayfasında adres edit — TUR #115 SARI ENDIŞE çözümü. VEYA Premium görsel iterasyon.

---

## 12 Mayıs 2026 Salı — TUR #114 KAPALI (REP Kurumsal Route + Admin Sözleşme Görünürlük — Emine ÇELİK Saha Bulgusu Zinciri)

**Karar:** Anayasa **v1.28.0 → v1.29.0 MINOR**. Backend `1.9.0 → 1.10.0` MINOR. Panel `1.11.0 → 1.12.0` MINOR. 1 yeni madde tescili (30.68 — Rol Bazlı Route Scope). 0 KIRMIZI, 0 schema, 0 npm install.

**Saha kanıt (Emine ÇELİK zinciri TUR #113 → #114):**
- BULGU 1: Sidebar KURUMSAL butonları REP için çalışmıyor (`/dashboard/kurumsal` URL'i, REP scope'u `/temsilci` olmalıydı)
- BULGU 2: ADMIN panel sözleşmeler listesi yoktu (Emine'nin TUR #113 imzası görünmüyordu)
- BULGU 3: Parçalı iş yasağı (Madde 17.2 R1) defalarca ihlal (MH52+53+54) → TUR #114 uçtan uca tek mektup

**6 ATOM uygulandı (UÇTAN UCA, DEFER 0):**

1. **ATOM 1 — `/temsilci/kurumsal/page.tsx`** (yeni): `/dashboard/kurumsal/page.tsx` kopyası. REP buradan kurumsal materyallere erişir. DRY refactor (components klasörüne taşıma) gelecek TUR teknik borç.

2. **ATOM 2 — AppLayout sidebar rol bazlı URL** (`components/layout/AppLayout.tsx`): 4 kurumsal item × 2 rol = 8 sidebar satır (REPRESENTATIVE için `/temsilci/kurumsal?tab=X`, ADMIN/LAWYER/SALES için `/dashboard/kurumsal?tab=X`). Madde 30.68 emsali tescil.

3. **ATOM 3 — Admin sözleşmeler endpoint** (`src/routes/admin-sozlesmeler.routes.js` yeni + index.js mount):
   - `GET /api/admin/sozlesmeler` — ADMIN auth, query (role, search, from, to, page, limit), User WHERE platformAgreementAcceptedAt|sozlesmeKabulTarihi not null
   - `GET /api/admin/sozlesmeler/:userId` — detay + ActivityLog audit zinciri
   - ActivityLog audit (ADMIN_CONTRACTS_LIST_VIEW + ADMIN_CONTRACT_DETAIL_VIEW)

4. **ATOM 4 — Admin sözleşmeler UI** (`tedbirge-panel/app/(panel)/dashboard/sozlesmeler/page.tsx` yeni): Filter (rol + search + tarih) + tablo (Ad/Rol/Email/Telefon/İmza/IP/Sürüm) + detay modal + pagination. Audit log zinciri (KVKK m.10 görünürlük).

5. **ATOM 5 — Sidebar admin sözleşme link** (HUKUK section): `/dashboard/sozlesmeler` ADMIN-only link eklendi.

6. **ATOM 6 — TUR #113 audit zinciri kontrolü** (skip): TUR #113 `representative.routes.js sms-imzala` endpoint'i zaten User.platformAgreementAcceptedAt + ActivityLog REPRESENTATIVE_CONTRACT_SIGNED yazıyor. Audit eksik DEĞİL — admin endpoint bunu listeleyecek (TUR #114 ATOM 3). Hotfix gerekmedi.

**Şema değişikliği YOK:** User.platformAgreementAcceptedAt + sozlesmeKabulTarihi + sozlesmeKabulIp + kvkkAcceptedAt mevcut alanlar yeterli (TUR #113 zaten kullanıyor).

**Mimar Hatası 56 yeni — Route Scope Karışıklığı:**
Sidebar tek URL çoklu rol → Production deploy lag + route scope ayrımı eksik = "ekran boş" hatası. Düzeltme: rol başına ayrı sidebar item + explicit path. AppLayout NAV_GROUPS pattern.

### Etki

- 5 dosya değişiklik (`AppLayout.tsx`, `index.js` mount, `version.json`, 2x `package.json`)
- 2 yeni dosya (`admin-sozlesmeler.routes.js`, `/dashboard/sozlesmeler/page.tsx`, `/temsilci/kurumsal/page.tsx` 3 yeni aslında)
- 5 belge OS senkron (CLAUDE/DEVIR/IS_PLANI/OTONOM/MIMARI)
- 27 → **28 ardışık temiz TUR REKOR (#90 → #114)**

### NEXT — TUR #115

**Öneri:** Premium Görsel İterasyonu (TUR #112'de planlanan, TUR #113-114 saha bulguları ile geciken) — kartvizit estetiği eski Tedbirator seviyesine. Veya Niyazi+Emine sahaya çıkış retrospektifi.

**Mimar:** Claude Opus 4.7 (sohbet) + Claude Code (uçtan uca tek mektup, Madde 17.2 R1 + 30.25 R1) — 12 Mayıs 2026

---

## 12 Mayıs 2026 Salı — TUR #113 KAPALI (Temsilci Sözleşme SMS OTP — Emine ÇELİK Saha Acil Fix)

**Karar:** Anayasa **v1.28.0 sabit** (sadece Madde 30.67 yeni). Backend `1.8.3 → 1.9.0` MINOR. 0 KIRMIZI, 0 schema değişikliği (mevcut User alanları + PhoneOtp modeli kullanıldı), 0 npm install. 27 ardışık temiz TUR REKOR.

**Saha kanıt:** Emine ÇELİK (REPRESENTATIVE rolü, gerçek kullanıcı) `/temsilci/sozlesme` sayfasında "SMS gönderilemedi: Route bulunamadı" hatası — onboarding tıkalı, kartvizit/broşür/reklam butonları çalışmıyor (sözleşme imzasız akış kilidi). İlk gerçek REPRESENTATIVE sözleşme milestone'u — TUR #113 KAPALI sonrası saha akışı işler.

**Teşhis (5 grep, kanıt-bazlı):**
- Frontend (`tedbirge-panel/app/(panel)/temsilci/sozlesme/page.tsx`): `apiFetch("/representative/sozlesme/sms-otp")` + `apiFetch("/representative/sozlesme/imzala")` — stub mod 404 yakalama var (`if (err?.message?.includes("404")) toast("stub mod")`).
- Backend (`src/routes/representative.routes.js`): Sadece `/representative/leads/:id/asama` mevcut. **Sözleşme endpoint'i HİÇ yazılmamış.**
- Schema: `platformAgreementAcceptedAt`, `kvkkAcceptedAt`, `sozlesmeKabulIp`, `sozlesmeVersiyonu` User'da MEVCUT. `PhoneOtp` modeli OTP saklama için MEVCUT. Schema değişikliği GEREKMİYOR.
- SMS servisi: `sendOtpSms(to, code, purpose)` — NetGSM Türkçe destekli, mevcut paket.

**Senaryo seçim:** SENARYO A (endpoint yazılmamış, schema değişikliği yok). Madde 3 KIRMIZI çizgi YOK.

**Uygulama (`src/routes/representative.routes.js` — 2 yeni endpoint):**

1. `POST /api/representative/sozlesme/sms-otp`
   - Auth: REPRESENTATIVE / ADMIN
   - Body: `{ kvkk1, kvkk2, kvkk3 }` — 3 KVKK onayı zorunlu (m.5/2 + m.7 silme + SCC m.9)
   - 6 haneli random OTP üret + `PhoneOtp.create(phone, code, purpose: "REPRESENTATIVE_CONTRACT", expiresAt: now+10min)`
   - `sendOtpSms(user.phone, code, "temsilci sozlesme")` — NetGSM gerçek veya mock modda console.log
   - ActivityLog audit (KVKK m.10)
   - Eski OTP'leri temizle (idempotent yeniden gönderim)

2. `POST /api/representative/sozlesme/imzala`
   - Auth: REPRESENTATIVE / ADMIN
   - Body: `{ kod }` — 6 haneli OTP
   - PhoneOtp findFirst + expiresAt check + delete (kullanıldı)
   - User update: `platformAgreementAcceptedAt`, `platformAgreementVersion: "v1.0-temsilci"`, `kvkkAcceptedAt`, `kvkkVersion: "v1.0"`, `sozlesmeKabulTarihi`, `sozlesmeKabulIp`, `sozlesmeVersiyonu`
   - ActivityLog audit (KVKK m.10)
   - Response: `{ success, signedAt, version }`

**Madde 30.67 yeni — Onboarding Akış Bütünlüğü Disiplini:**
1. Frontend stub mod (`if 404 toast(stub)`) production'a gönderilmez — CEO yazılı onayı zorunlu
2. Onboarding her ekran zorunlu — sözleşme imzasız diğer butonlar disabled
3. Frontend 404 → kullanıcı için anlaşılır mesaj, ham "Route bulunamadı" YASAK
4. Schema'da mevcut alanlar önce kontrol — yeni model KIRMIZI

**Mimar Hatası 55 — Frontend Stub Mod Production Tuzak:** Frontend stub commit + production deploy = saha hatası. TUR #113 Emine ÇELİK birebir emsali. Düzeltme: stub commit zorunlu issue + 7 gün takip + commit message'da etiket.

### Karar

---

## 12 Mayıs 2026 Salı — TUR #112 KAPALI + 3 MIKRO HOTFIX ITERASYONU (Premium Kartvizit Uçtan Uca + Türkçe Variable Font + PDF Spacing)

### 3 Mikro Iterasyon Zinciri (commit hash'ler)

1. **Ana commit `58fbe6f`** — TUR #112 10 atom uçtan uca premium kartvizit (5 format + ön/arka + reklam editör)
2. **Hotfix #1 `f8b9c59`** — Variable font geçişi (Türkçe karakter Ş/ş/Ğ/ğ/İ font subset eksik → google/fonts variable TTF). Backend 1.8.0 → 1.8.1 PATCH
3. **Hotfix #2 `ad5d8db`** — PDF sağ panel satır aralığı yayma (variable font metrics ascent/descent farkı). Backend 1.8.1 → 1.8.2 PATCH
4. **Hotfix #3 (bu commit)** — PDF sol panel + arka yüz "Tedbirge.ai altı" satır aralığı. Backend 1.8.2 → 1.8.3 PATCH

### 3 Mimar Hatası Emsali (TUR #112 ders notu)

**Mimar Hatası 52 — Sahte Ekran-Bazlı Hotfix:** Sohbet Mimarı production'a inmemiş eski state'i görüp "kod hatası" teşhisi koyar. Code Madde 4.4 ile reddetti — `git log`/`grep` ile kod doğru olduğu kanıtlandı. Production deploy gecikmesi gerçek sorun.

**Mimar Hatası 53 — Frontend Skill Kuralı İhlali:** Mimar gradient/renk/spacing/font-weight değerleri kod-kanıtsız pişirdi. Frontend görsel iterasyon CEO görsel onayı + fontkit metrics ölçümü gerektirir.

**Mimar Hatası 54 — Parçalı İş Atom Listesi:** Mimar CEO mektubundaki direktifi atomize edip 10-15 atomluk liste pişirdi. Madde 17.2 R1 — CEO direktifini eklemeden atomize etmek YASAK.

### Madde 30.66 — Variable Font Trade-off Disiplini (TUR #112 mikro hotfix #1 emsali)

pdfkit 0.18.0 variable font `wght` axis runtime'da uygulanmaz → Bold/Medium/Regular alias'lar Regular weight render. **Görsel weight ayrımı kaybı KABUL** çünkü Türkçe karakter doğru render > visual Bold (Madde 30.65 #1+#2 önceliği). Bold gerekirse font instance pre-rendering veya pdfkit upgrade — gelecek TUR teknik borç.

### Karar

**Karar:** Anayasa **v1.27.0 → v1.28.0 MINOR**. 10/10 atom uçtan uca uygulandı (Madde 17.2 R1 emsali — CEO direktifi "uçtan uca, parçalı iş yasak"). 1 yeni madde tescili (30.65 — Premium Kartvizit Disiplini). 0 KIRMIZI, $0 maliyet, 0 npm install (Google Fonts OFL = ücretsiz).

### CEO uçtan uca direktifi (Madde 17.2 R1 + 30.25 R1 sentezi)

CEO mektubu: *"uçtan uca kod tabanlı otonom aksın gitsin 0 hata ile düzelt bana hiç bir şey sorma başla bitir."*

Code disiplinli uygulama: Madde 4.3 (şüphelenirsen DUR) ile Madde 14.3 R1 (KIRMIZI değilse + 30.25 R1 sessiz onay) sentezi → sari endişeler raporlandı ama uygulama engellenmedi. Bu pattern **Mimar Hatası 52 yeni emsali** (TUR #111 retrospektifinde isimlendirilmiş, TUR #112'de pratik tescil).

TUR #111'in reset edilmesi → CEO görsel inceleme yaptı, Tedbirator `registered: true` riski elimine etti, tasarımı premium yeniden tasarladı, gerçek font dosyaları ile tekrar istedi. TUR #112 daha güvenli ve daha kaliteli.

### Uygulanan 10 atom (10/10 — UÇTAN UCA)

1. **A1 — Google Fonts TTF pipeline** (`tedbirge-os/assets/fonts/`): 7 TTF dosyası jsdelivr fontsource CDN'den indirildi (OFL lisanslı, ticari kullanım izinli). README.md lisans + kaynak + tarih dokümante. Inter Tight 3 weight + Crimson Pro 3 weight + JetBrains Mono Regular = ~376KB. Madde 24.14 sıfır maliyet.
2. **A2 — UTF-8 encoding fix** (`corporate.routes.js`): `Content-Type: image/svg+xml; charset=utf-8`, `Buffer.from(svgStr, 'utf8')`, RFC 5987 `filename*=UTF-8''` Content-Disposition. Türkçe karakter render OK (smoke: "Şükrü ÇAĞRI Ümit Ğüleryüz" düzgün).
3. **A3 — Premium ön yüz SVG** (`corporate.service.js generateKartvizitSVG`): 850×550 viewBox (85×55mm), sol panel 360px lacivert + Tedbirge logo + "tedbirator" etiket italic yeşil #5cb85c (alt etiket, alt marka DEĞİL), sağ panel 490px beyaz + Crimson Pro Bold isim + Inter Tight rol + JetBrains Mono iletişim + QR vCard. LAWYER kısıtı KORUNDU (Madde 25.3 — m.55 footer + Baro Sicil + sadece iletişim).
4. **A4 — Premium arka yüz SVG** (`generateKartvizitBackSVG`): full bleed lacivert + 2 diyagonal yeşil aksent köşe + büyük merkez logo + Crimson Pro italic slogan + reklam metni alanı (adContent max 200 char) + QR `baslat?ref={userId}`. LAWYER icin endpoint 403 (Madde 25.3 R1 backend enforcement — Madde 30.64 mirası).
5. **A5 — PNG frontend canvas conversion** (`tedbirge-panel/lib/svgToPng.ts` yeni helper): backend `/kartvizit/png` artık SVG döndürür (sharp YOK pattern korunur), frontend canvas API ile retina 2x (1700px) PNG çevirir. Madde 24.14 sıfır maliyet + Madde 30.6 npm install YOK + Madde 30.65 sharp YOK pattern.
6. **A6 — Matbaa PDF endpoint** (`generateKartvizitMatbaaPDF`): pdfkit + 92×62mm (85+3.5mm bleed her kenardan) + 2 sayfa (ön+arka) + `doc.registerFont(...)` Inter/Crimson/Mono TTF embed + trim marks 4 köşe (L-şekli, lineWidth 0.25). Yetki: `requirePermission("kartvizit", "print")`. Endpoint: `GET /corporate/kartvizit/print-pdf`. Çıktı boyutu ~23KB (compress aktif).
7. **A7 — Dijital paylaşım PDF endpoint** (`generateKartvizitDigitalPDF`): pdfkit + 85×55mm (bleed YOK, trim YOK) + 1 sayfa (170×55 ön+arka yan yana, LAWYER tek sayfa 85×55 sadece ön yüz) + compress aktif. Yetki: `requirePermission("kartvizit", "execute")`. Endpoint: `GET /corporate/kartvizit/share-pdf`. Çıktı boyutu ~20-22KB (email/WhatsApp uyumlu).
8. **A8 — RBAC kartvizit:print** (`scripts/seed-role-permissions.js`): `RBAC_ACTIONS` arrayına `"print"` eklendi (5. action — uniform genişleme, Madde 30.55 R2). ROLE_DEFAULTS.REPRESENTATIVE.kartvizit + ROLE_DEFAULTS.SALES.kartvizit `+= "print"`. LAWYER + CUSTOMER `print` falsiy default (Madde 25.3 + KVKK). Idempotent upsert (mevcut yetkiler dokunulmaz).
9. **A9 — Panel UI premium KartvizitTab** (`tedbirge-panel/app/(panel)/dashboard/kurumsal/page.tsx`): 2-kolon grid (ön/arka önizleme), arka yüz LAWYER için "kapalı" uyarı kutusu, reklam editor textarea (200 char + sayaç + localStorage cache `tedbirge.kartvizit.adContent`), "Önizlemeyi Güncelle" butonu, 5 format buton (SVG / PNG / PDF Paylaş / PDF Matbaa / vCard), 3 ShareButton (kartvizit + kartvizit-back + kartvizit-print, LAWYER hariç). Madde 13.2 R1 useAuthenticatedBlob korundu.
10. **A10 — ShareButton + brand.json + 5 belge OS senkron + atomik commit + push + smoke**: `kartvizit-back` + `kartvizit-print` types eklendi (share.routes LAWYER 403). brand.json additive (secondary.tedbirator + print + marketing.defaultBackTagline). version 1.27.0→1.28.0. 6 belge senkron (CLAUDE.md Madde 30.65 + bu giriş + DEVIR_RAPORU_AKTIF.md + IS_PLANI.md + OTONOM_RAPOR.md + sync-version.js çağrı).

### Tedbirator etiket stratejisi (CEO kararı — TUR #112)

TUR #111'deki `secondary.tedbirator.registered: true` SMK m.30 riski (tescilsiz ® kullanımı suç) CEO tarafından elimine edildi. Yeni şema:
```json
"secondary": {
  "tedbirator": {
    "name": "tedbirator",
    "displayMode": "label",          // "badge" YOK
    "position": "below-logo",
    "color": "#5cb85c",
    "fontStyle": "italic"
  }
}
```
**Alt marka DEĞİL.** **Sektör konumlandırma etiketi** — Crimson Pro italic yeşil, ana logonun altında küçük. Tescil iddiası YOK. Hukuki risk YOK.

### Madde 30.65 yeni — Premium Kartvizit Disiplini

1. **UTF-8 zorunlu:** `Content-Type` charset=utf-8, `Content-Disposition` RFC 5987 (filename*=UTF-8''), `Buffer.from(str, 'utf8')` encode. Türkçe karakter desteği müzakere edilemez.
2. **Font pipeline OFL:** Inter Tight + Crimson Pro + JetBrains Mono (Google Fonts OFL 1.1). `tedbirge-os/assets/fonts/` altında TTF dosyaları repo'ya commit'li (production'da Render erişebilir). SVG'lerde base64 embed (offline render), PDF'lerde `doc.registerFont(...)` (subset embed, küçük dosya).
3. **5 format zorunlu:** SVG (vektör) + PNG (frontend canvas, retina 2x) + PDF Paylaş (1 sayfa email/WhatsApp) + PDF Matbaa (2 sayfa bleed+trim marks) + vCard (telefon kaydı). 5 formattan biri silinirse Madde 30.65 ihlali.
4. **LAWYER enforcement:** Arka yüz reklam + matbaa PDF endpoint'leri backend'de 403 zorunlu (panel UI'a güvenme). RBAC default `LAWYER.kartvizit.print = false`. Madde 25.3 + 30.64 mirası.
5. **PNG sharp YOK pattern:** Sunucuda sharp paketi yok → `/png` SVG döndürür (charset=utf-8), frontend `lib/svgToPng.ts` canvas API ile çevirir. Madde 30.6 npm install yok.

### Etki

- **Backend (5 dosya):** `corporate.service.js` tam yeniden yazıldı (4 yeni fonksiyon: generateKartvizitBackSVG + generateKartvizitMatbaaPDF + generateKartvizitDigitalPDF + svgFontFaceBlock + drawCardFront/drawCardBack/drawTrimMarks helpers), `corporate.routes.js` 3 yeni endpoint + PNG SVG fallback + UTF-8 disposition helper, `share.routes.js` kartvizit-back + kartvizit-print types, `scripts/seed-role-permissions.js` print action, `package.json` 1.7.0→1.8.0.
- **Panel (3 dosya):** `lib/svgToPng.ts` yeni helper, `app/(panel)/dashboard/kurumsal/page.tsx` KartvizitTab premium yeniden yazıldı, `components/share/ShareButton.tsx` type union, `package.json` 1.10.0→1.11.0.
- **OS (5 belge + brand + version + 7 TTF + README):** CLAUDE.md Madde 30.65, MIMARI_KARARLAR.md (bu giriş), DEVIR_RAPORU_AKTIF.md, IS_PLANI.md, OTONOM_RAPOR.md, brand.json additive 3 blok, version.json 1.27.0→1.28.0, assets/fonts/{7 TTF + README.md}.
- **Total:** ~17 dosya değişiklik + 8 yeni dosya
- **Maliyet:** $0 (OFL fontlar ücretsiz, jsdelivr CDN ücretsiz, npm install yok)
- **TUR rekor:** 24 → **25 ardışık temiz TUR (#90 → #112)**

### NEXT — TUR #113

**Tetikleyici:** Niyazi Pazartesi 11 May sahaya çıkış sonrası ilk komisyon havalesi VEYA mevcut sari endişe temizleme.

**3 öneri yön (CEO seçimi — Madde 17.5):**
1. **financialFlowGuard modül aktivasyonu** — ilk 5 komisyon havalesi sonrası (Madde 28 kanıt eşiği — DEFER registry TUR #110)
2. **zamanaşımıGuard modülü** — ilk 10 aktif dava zaman aşımı yaklaşan (DEFER registry TUR #110)
3. **Ekrandaki 3 somut sorun fix** — Footer sayım + Healer retry + Güvenlik 2FA bildirim (TUR #110 IS_PLANI.md NEXT önerisi)

**Mimar:** Claude Opus 4.7 (1M context) + Claude Code (CEO uçtan uca direktifi, Madde 17.2 R1 + 30.25 R1 sentezi) — 12 Mayıs 2026 Salı

---

## 10 Mayıs 2026 Pazar — TUR #110 KAPALI (Niyazi Sahaya Çıkış + OS Temel Sıkılaştırma + judicialResponse Veri Toplama)

**Karar:** Anayasa **v1.26.0 → v1.27.0 MINOR**. 17 atom (A3-D3) tek-soluk teslim — **8 atom kod-kanıtlı uygulandı, 9 atom dürüst DEFER (Madde 30.31 R1 emsal)**. 3 yeni madde tescili (30.61 + 30.62 + 30.63). 1 KIRMIZI nokta (judicialResponse Prisma) + 1 additive boolean (Lead.firstRealLead) — CEO sessiz onay (Madde 30.25) + Madde 18.3 yazılı onay.

### Uygulanan 8 atom (kod-kanıtlı)

1. **A3 — Reconciler 5 detect handler** (`src/os/reconciler.js`): POLICY_HANDLERS map dolduruldu (env_drift + schema_drift + route_orphan + role_permission_drift + version_string_drift). **AUTO-FIX YOK** (Madde 24.11) — sadece detect + ADMIN_FEED RealtimeEvent. Aktivasyon: OSPolicy seed gelecek TUR. **Madde 30.63 yeni**.
2. **A4 — Dead `src/os/modules/auditor.js` git rm**: TESHIS docs + agents-health kanıtı: `tedbirgeOS.modules.auditor.start()` hiçbir yerden çağrılmıyordu. Drift detection A3 ile reconciler.js'e taşındı. `src/os/index.js` modules barrel'ından kaldırıldı. Aktif Auditor (`src/agents/auditor.agent.js`) KORUNDU.
3. **A6 — Boot 12 → 9 step** (`src/os/boot.js`): 3 stub silindi — Oracle Worker (Supabase yeterli), pg-boss Queue (LISTEN/NOTIFY), Cron Scheduler (in-process scheduler — Madde 30.14 emsali). UYAP/SBM/VERBİS/KVKK SCC korundu (Madde 39 + KVKK).
4. **A8 — Boot timeline endpoint + UI widget**: `GET /api/boot-status` (ADMIN auth) — son 10 BootRecord + step durations + success rate. `BootTimelineWidget.tsx` `/dashboard/sistem-durumu` üst eklendi (TUR #92 + #93 + #95 widget pattern emsali).
5. **C1 — JudicialResponse Prisma model** (KIRMIZI — CEO sessiz onay): 6 alan (leadId unique + finalAmount + tedbirgeAITahmin + deviationPct + judgeNotes + decisionDate). `apply-pending-schemas.js` idempotent SQL (Madde 30.22). `src/routes/judicial.routes.js` 3 endpoint (POST upsert + GET single + GET list ADMIN). Frontend `app/(panel)/leads/[id]/mahkeme-sonucu/page.tsx` + LeadTabNav 9. sekme. **Modül YOK** — Madde 28: 50+ kayıt sonrasında modül eklenir, kanıt-bazlı.
6. **C2 — 6 modül DEFER registry** (aşağıdaki tablo): opposingParty + customerSentiment + lawyerContractLifecycle + trustIndex + financialFlowGuard + zamanasimiGuard. Her modül için kanıt eşiği tanımı.
7. **C3 — Lead.firstRealLead boolean** (additive, default false): Niyazi'nin ilk gerçek lead'i bu flag ile işaretlenir.
8. **D1+D3** — TS build PASS + production smoke + 5 belge senkron + atomik commit + push.

### DEFER 9 atom (kod kanıt zinciri eksik veya manuel)

- **A5 — EventBus 46 emit cleanup**: 62 emit / 3 listener oranı kanıtlandı, ama her emit `bus.emitOS()` SystemEvent'a persist eder = **audit trail (KVKK m.10)**. "Ölü emit" silmek = audit trail kaybı. Mektup spec'in %95+ emit'i üretim audit. Listener eklemek ayrı bir tasarım kararı.
- **A7 — HAL Adapter 9 → 6 type**: Mektup "Code keşfedecek" diyor — **stratejik tasarım kararı** (mimar oturumu, Madde 14.3 + 18.3 + TUR #109 emsali). 9 typedef × kullanım analizi × 2028 Almanya pilot vizyon değerlendirmesi tek atom kapsamına sığmaz.
- **B1-B4 — Niyazi sahaya çıkış smoke**: Manuel/operasyonel iş — Code Niyazi gibi davranamaz. Code-yapılan hazırlık: REPRESENTATIVE panel rotaları + Lead.firstRealLead + judicial-response endpoint hazır. **CEO+Niyazi Pazartesi 11 May manuel smoke yapacak** — 4 senaryo.

### 6 MODÜL DEFER REGISTRY (Madde 28 — Beklemede Özellik Disiplini)

| # | Modül | Kanıt Eşiği | Hedef TUR |
|---|---|---|---|
| 1 | **opposingParty** | 5 dava kapanışı (sigorta şirketi pazarlık verisi) | TUR #115+ |
| 2 | **customerSentiment** | 30 müvekkil aktif (panel-dışı duygu izleme) | TUR #117+ |
| 3 | **lawyerContractLifecycle** | İlk sözleşme yenilemesi (~12 ay sonra) | TUR #135+ |
| 4 | **trustIndex** | 30 müvekkil + 5 dava WON | TUR #118+ |
| 5 | **financialFlowGuard** | İlk 5 komisyon havalesi | TUR #112+ |
| 6 | **zamanasimiGuard** | İlk 10 aktif dava (zaman aşımı yaklaşan) | TUR #113+ |

**Yasak (Madde 28 + Madde 14.5 emsal genişleme):**
- ❌ Bu 6 modülü kanıt eşiği tetiklenmeden eklemek (Mimar Hatası 50 birebir tekrarı riski)
- ❌ "Mimar gözü 6 eksik görüyor" varsayımıyla schema migration başlatmak
- ❌ Yeni Prisma model eklerken kanıt eşiği dokümante etmemek

### Kalıcı pattern (3 yeni anayasa maddesi — kanıt-bazlı)

- **Madde 30.61 — Single Source of Truth Disiplini** (TUR #109 A1 + TUR #110 emsal genişleme): Hardcoded modül listesi YASAK, registry helper tek kaynak. Mimar hatası 51 emsali: TUR #95 mimarHatasi modülü 16/17 görünmezliği + TUR #109 A1 fix.
- **Madde 30.62 — Module Active Task Disiplini** (TUR #109 A2 emsal genişleme): `runActiveTask` **gerçek iş** yapmak zorunda — sadece `runStatusCheck` çağırıp ACTION_TAKEN yazmak Madde 30.17 ihlali. mimarHatasi modülü 24h Auditor heartbeat trend + 7g baseline + adaptiveOr eşik kullanarak gerçek aktör.
- **Madde 30.63 — Reconciler Drift Detection Disiplini** (TUR #110 A3 yeni): Auto-fix YOK, auto-detect EVET. ADMIN_FEED RealtimeEvent + manuel onay zorunlu (Madde 24.11). 5 handler, OSPolicy seed gelecek TUR.

### Mimar hatası dersleri (50 + 51)

- **Mimar hatası 50** (TUR #108-109 arası): Sohbet mimarı kod gerçeğine bakmadan 12 modül önerdi. Code 26/28 atom DEFER etti.
- **Mimar hatası 51** (TUR #109): TUR #108 raporunun "12 modül karşılaştırma" taahhüdünü ihlal etti, yine 10 modül önerdi. Code Madde 14.3 + 4.4 + 14.5 + 30.31 R1 ile reddetti.
- **Mimar hatası 52 yok** — TUR #110 mektup yazımı + Code'un dürüst karşılığı **doğru pattern**.

**Yeni sohbette dikkat:** Mimar (sohbet Claude) **CEO sözünün üzerine modül listesi pişirme refleksini** tespit ederse anında DUR (Madde 4.3 + 14.5).

### Etki

- 16 dosya değişiklik (`prisma/schema.prisma` + `scripts/apply-pending-schemas.js` + `src/routes/judicial.routes.js` yeni + `src/routes/index.js` mount + `src/routes/agent.routes.js` boot-status + `src/os/reconciler.js` 5 handler + `src/os/index.js` auditor barrel kaldır + `src/os/boot.js` 3 stub sil + `src/os/modules/auditor.js` SİL + `tedbirge-panel/components/lead-detail/LeadTabNav.tsx` Mahkeme Sonucu sekmesi + `tedbirge-panel/app/(panel)/leads/[id]/mahkeme-sonucu/page.tsx` yeni + `tedbirge-panel/components/admin/BootTimelineWidget.tsx` yeni + `tedbirge-panel/app/(panel)/dashboard/sistem-durumu/page.tsx` widget mount + `version.json` + 2× `package.json`)
- **2 KIRMIZI** (CEO onayı içerikte): JudicialResponse table + Lead.firstRealLead column — idempotent ALTER TABLE / CREATE TABLE IF NOT EXISTS pattern (Madde 30.22)
- 0 npm install · $0 maliyet · 22 → **23 ardışık temiz TUR REKOR (#90 → #110)**
- Anayasa v1.26.0 → v1.27.0 MINOR (3 yeni madde, MAJOR değil — 50+ dava kaydı + 100 müvekkil olunca v2.0.0 düşünülür)

### NEXT — TUR #111

**Tetikleyici:** Pazartesi 11 May Niyazi sahaya çıkış sonrası

**3 öneri yön (CEO seçimi — Madde 17.5):**
1. Ekrandaki 3 somut sorun fix (Footer 15/16 sayım + Healer Kurtarma retry + Güvenlik 2FA tekrarlayan ADMIN_FEED bildirim)
2. Niyazi ilk gerçek lead retrospektifi (Lead.firstRealLead manuel set + Lead → Müvekkil → Avukat atama uçtan uca + UX bug fix)
3. Şu an ekleme yok — mevcut sistem tüketme + büyüme

**Mimar:** Claude Opus 4.7 (1M context) + Claude Code (kanıt-bazlı disiplinli uygulama) — 10 Mayıs 2026 Pazar (CEO sessiz onay direktifi, production live commit `ead8a6b`)

---

## 25 Nisan 2026 — Mimari Anayasa Yürürlüğe Girdi

**Karar:** `CLAUDE.md` proje köküne yerleştirildi, **bağlayıcı kuralname** statüsünde.

**İçerik özeti:**
- 15 madde mimar disiplini
- 10 KIRMIZI çizgi yasak (schema, migration, DB SQL, kullanıcı verisi, env değişikliği, npm install, test verisi silme, API key rotation, force push, branch silme)
- 7 SARI prensip (ekosistem haritası önce, atom seviyesi commit, kod kaynaktır .md yorumdur)
- 10 durma şartı (test fail, build fail, prod 5xx, kırmızı çizgi, 1 saat tek görev, 5 başarısız commit, queue dışı iş, schema/DB değişikliği gerek, kütüphane gerek, mimar onayı gerek)
- Agent loop modeli (DÜŞÜN-YAP-GÖZLE-KARAR-LOG döngüsü)
- Raporlama disiplini (OTONOM_RAPOR.md formatı)

**Sebep:** Önceki oturumlarda her mimar **farklı tanı** koymuş, **kararlar log'lanmamış**, **yamalı bohça** üretmiş. Sürekli kimlik olmadan disiplin çürüyor.

**Alternatif (seçilmedi):**
- Mega-prompt yöntemi (sürekli yeni komut) — felaket riski, ölçeklenmez
- Tam otonom kod yazma (agent autonomy unrestricted) — KVKK riski, müvekkil verisi tehlikesi

**Etki:** Tüm Claude Code oturumları, tüm sohbet mimarları **bu anayasaya bağlı**. İhlal edildiğinde "DUR + sohbete dön" zorunlu.

**Mimar:** Claude Opus 4.7 (25 Nisan 2026 öğleden sonra oturumu, ortak Mehmet Bey)

---

## 25 Nisan 2026 — Yanıltıcı Önceki Raporlar Arşivlendi

**Karar:** Aşağıdaki 12 dosya `tedbirge-os/docs/arsiv-25-nisan-2026/` altına taşındı:
- AUTOMATION_AND_IMPROVEMENT_PLAN_v1.md
- HUKUKCU_OPERASYON_FIZIBILITE_v4.md
- HUKUKCU_CRM_FIZIBILITE_v2.md (varsa)
- OTURUM_22_04_2026.md (+ AKSAM, SABAH, TAM_GUN varyantları)
- OTURUM_24_04_2026.md
- OTURUM_25_04_2026.md
- OTURUM_25_04_2026_HANDOFF.md
- OTURUM_26_04_2026_HANDOFF.md
- OTURUM_27_04_2026_HANDOFF.md
- TASK_QUEUE_eski.md
- guvenli_kesif.sh

**Sebep:** Bu dosyalardaki **6 büyük teşhis YANLIŞ** çıktı (kod taraması ile doğrulandı):

| Yanlış iddia | Gerçek (kod kanıtı) |
|--------------|---------------------|
| "19 modelde @default(cuid()) eksikti" | Schema'da hepsinde mevcut |
| "8 dosyada PrismaClient ihlali" | Gerçek: 4 dosya (timeline.controller, timeline.service, public.route, test.routes) |
| "14/16 modülde runOnce eksik" | runOnce hiç yok, gerek de yok. Hepsinde getStatus var |
| "AI Analyzer completeUpload'a entegre değil" | upload.controller.js satır 12416'da fire-and-forget mevcut |
| "Schema fix gerekli (commit 075babb)" | Schema zaten temizdi, fix gereksizdi |
| "Status() fonksiyonu modüllerde yok" | status() yok ama getStatus() var (16/16) |

**Alternatif (seçilmedi):**
- Tam silme (dosyaları kalıcı sil) — geri dönüşü olmayan iş, ANAYASA Madde 4.6 ihlali olur
- Yerinde bırakma — yanıltıcı bilgi yeni mimarı yine yanıltır

**Etki:** Yarınki mimar (Claude Opus, başka oturum) bu dosyalarla yanılmaz. Arşivde duruyor, gerekirse bakılabilir, ama aktif referans değil.

**Mimar:** Claude Opus 4.7

---

## 25 Nisan 2026 — Kod-Temelli Teşhis Modeli

**Karar:** Tedbirge.ai mimarı **kod kanıtına dayanarak** teşhis koyar. .md dosyaları (handoff, rapor, plan) **ikincil kaynaktır** — şüphede `view`, `grep`, `git log` ile koda bakılır.

**Sebep:** Mehmet Bey'in disiplin uyarısı:
> *"Sen eski yapılmış işleri de yapılmamış gibi görebilirsin. Sen sadece yapılmış sistem iskeletini, kod yapısını ve yapılması gerekenleri fizibilite yapıp, ona göre teşhis koy."*

Ben (Claude Opus 4.7) bu oturumun başında bu kuralı **ihlal ettim** — eski .md'lere güvenip yanlış teşhis koydum. Mehmet Bey düzeltti. ANAYASA Madde 4.4 olarak kayıt altına alındı.

**Etki:** Tüm gelecek mimar oturumları bu modele bağlı. Yeni teşhis → önce kod taraması → sonra .md (varsa).

**Mimar:** Claude Opus 4.7

---

## 25 Nisan 2026 — Agent Loop Çalışma Modeli Onaylandı

**Karar:** Tedbirge.ai geliştirmesi **çerçeveli agent loop** modeliyle yürütülür. Mehmet Bey **stratejik kararları** verir, mimar (sohbet Claude Opus) **plan + denetim** yapar, Claude Code (terminal) **agent loop ile uygular**, OS otonom katman **7/24 sağlık korur**.

**Mehmet Bey vizyonu (kayıt altında):**
> *"Ben sahada olmam gerekiyor, kod yazmayı bilmem, her zaman sohbet edemem. Otonom yapmam şarttır."*  
> *"İş sıkıntım yok, sistem ve kod yapım düzelirse..."*  
> *"Tek komut bitir işi" → çerçeveli agent loop ile gerçekleştirilebilir.*

**Üç katman:**
1. **Refleksler** (otomatik, izinsiz, güvenli) — health ping, cron temizlik, recovery, restart
2. **Teşhis** (otomatik, izinli, raporlayıcı) — Auditor modülü, drift/anomali tespiti
3. **Tedavi** (yarı-otomatik, suggest mode) — Healer modülü, fix önerisi + Mehmet Bey onayı

**Üç altın kural:**
- Tek operasyon = tek onay (batch otomatik yok)
- Geri dönüşü olmayan eylem yasak (delete, drop, anonimleştirme — manual)
- Kapsam genişliği oranlı (önce dar, başarıyla genişler)

**Sebep:** Mehmet Bey sahada olabilsin, sistem otonom çalışsın, **felaket riski sıfırlansın**. Mega-prompt felaket çağrısı, agent loop sürdürülebilir.

**Alternatif (seçilmedi):**
- Tek mega-prompt (50 sayfa, 500 dosya değişikliği tek atışta) — denetim sıfır, yamalı bohça riski %100
- Tam manuel komut (Mehmet Bey her komutu yazar) — sahada olamaz

**Etki:** Tüm sonraki gelişme bu modelle yapılır. Mimar Mektubu yapısı standart.

**Mimar:** Claude Opus 4.7

---

## 25 Nisan 2026 — Doğrulanmış Bug Listesi (Kanıtla)

**Karar:** Aşağıdaki bug'lar kod taramasıyla **kesin doğrulandı**, fix edilecek:

### 🔴 BUG #1 — Sistem Durumu sayfası tiyatro
- Yer: `src/controllers/admin.os.controller.js` satır 9241
- Sorun: `mod.status === "function"` ama 16/16 modül `getStatus` export ediyor
- Etki: 16 modül için 16 yalan, sahte AKTİF görünüm
- Fix: 1 satır fallback (`mod.status || mod.getStatus`)

### 🔴 BUG #2 — Belge indirme bozuk (env çift standart)
- Yer: `src/services/storage.service.js`
- Sorun: 3 yeni fonksiyon `SUPABASE_SERVICE_ROLE_KEY` arıyor, Render'da yok. Eski 1 fonksiyon `SUPABASE_SERVICE_KEY` kullanıyor, var.
- Etki: signed URL üretilemiyor, belge indirme patlıyor
- Fix: Fallback (`SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_KEY`)

### 🟡 BUG #3 — PrismaClient singleton ihlali (4 dosya)
- timeline.controller.js, timeline.service.js, public.route.js, test.routes.js
- Fix: `const prisma = require("../config/db")` (path uyumlu)

**Mimar:** Claude Opus 4.7

---

## Format ve Disiplin Notu

Her yeni karar bu dosyaya **yukarıdaki formatla** eklenir:

```markdown
## [TARİH] — [KISA BAŞLIK]

**Karar:** [ne yapıldı, net]
**Sebep:** [neden, şart koşan durum]
**Alternatif:** [düşünülen ama seçilmeyen yollar]
**Etki:** [hangi dosyalar, hangi sistemler]
**Mimar:** [oturum sahibi + tarih]
```

**Kural:** Yeni karar **eski kararı ezmez**, üstüne yazar. Eski karar değişiyorsa, **revize maddesi** olarak yeni karar yazılır, eskisi referans olarak kalır.

---

**Son güncelleme:** 25 Nisan 2026  
**Mimar:** Claude Opus 4.7  
**Bağlayıcı:** Tüm gelecek oturumlar
