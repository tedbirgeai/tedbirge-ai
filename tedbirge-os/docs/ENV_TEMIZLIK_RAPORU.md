# ENV TEMIZLIK RAPORU — 25 Nisan 2026

> Bu rapor TUR #4 FAZ A ciktisidir. Tani raporudur, env silme/ekleme YAPILMAMISTIR.
> Mehmet Bey rapora gore Render'da gerekli temizligi uygular.

---

## 1. SUPABASE cift key durumu

**Render'da mevcut:**
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Kod taramasi:**

| Env | Kullanan dosyalar | Kac satir |
|-----|-------------------|-----------|
| `SUPABASE_SERVICE_KEY` | storage.service.js, uploadMiddleware.js, (auditor.js string ref) | 6 aktif |
| `SUPABASE_SERVICE_ROLE_KEY` | storage.service.js (3 yer), boot.js, os/adapters/supabase.js (4 yer) | 8 aktif |

**Detay — SUPABASE_SERVICE_KEY kullanan:**
- `src/services/storage.service.js:12` — modul seviyesi sabit, `getSupabaseClient()` fonksiyonunda kullaniliyor (uploadFile, deleteFile)
- `src/middlewares/uploadMiddleware.js:16` — `uploadToSupabase()` fonksiyonunda dogrudan kullaniliyor
- `src/os/modules/auditor.js:128` — sadece string referans (env kontrol listesi), deger okumaz

**Detay — SUPABASE_SERVICE_ROLE_KEY kullanan:**
- `src/services/storage.service.js:114,130,148` — `createSignedUploadUrl`, `verifyUpload`, `createSignedDownloadUrl` fonksiyonlarinda PRIMARY; fallback olarak SUPABASE_SERVICE_KEY var: `SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_KEY`
- `src/os/boot.js:40` — boot kontrolu: `SUPABASE_SERVICE_ROLE_KEY` eksikse uyari
- `src/os/adapters/supabase.js:73` — OS Supabase adapter, `SUPABASE_SERVICE_ROLE_KEY` okur

**Tani: KOD TUTARSIZ — iki farkli key iki farkli is yapiyor**

Durum:
- `SUPABASE_SERVICE_KEY` → eski fonksiyonlar (uploadFile, deleteFile, uploadMiddleware)
- `SUPABASE_SERVICE_ROLE_KEY` → yeni fonksiyonlar (signedURL'ler, boot, OS adapter)
- Fallback pattern mevcut: yeni fonksiyonlar `SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_KEY`

Bu nedenle her ikisi de Render'da olmali. Biri eksik olursa:
- `SUPABASE_SERVICE_KEY` eksikse: `uploadFile` ve `uploadMiddleware` calismiyor (direkt belge yuklemesi bozulur)
- `SUPABASE_SERVICE_ROLE_KEY` eksikse: signed URL'ler, boot, OS adapter calismaz (uygulama baslamaz)

**Onerilen aksiyon:**
> Her iki key'i de TUT. Ikisi de aktif kullanimda.
> TUR #5 mimar oturumunda kanonik key secilecek, kod tek env'e tasiyacak.

---

## 2. OPENAI_API_KEY durumu

**Kod taramasi:**
- `src/config/env.js:36` — `openAiApiKey: process.env.OPENAI_API_KEY || ""`
- `src/config/analysis.config.js:6-7` — `aiProvider: process.env.AI_PROVIDER || "mock"` ve `openAiApiKey: process.env.OPENAI_API_KEY || ""`

**AI_PROVIDER kullanimi:**
- `src/services/analyzer.service.js` — sadece `analysisMode` okur (`"mock"` mi kontrol)
- `src/services/ai.service.js` — sadece `analysisMode` okur
- `src/services/contract.service.js` — sadece `analysisMode` okur
- `src/services/bilirkisi.service.js` — sadece `analysisMode` okur

**Kritik bulgu:** Hicbir servis `aiProvider` veya `openAiApiKey` degerini okuyup KULLANMIYOR.
Config dosyalarinda tanimli ama hicbir kod `analysisConfig.openAiApiKey` veya `analysisConfig.aiProvider` ile OpenAI API'yi cagirmiyor.

**Tani: OLU AGIRLIK + GUVENLIK RISKI**

`OPENAI_API_KEY` canlida hic kullanilmiyor. Anthropic (`ANTHROPIC_API_KEY`) aktif provider.
Kullanilmayan bir API key Render'da duruyor = gereksiz saldiri yuzey alani.

**Onerilen aksiyon:**
> `OPENAI_API_KEY` Render'dan silinebilir.
> Sistem hic etkilenmez (hicbir servis bu key'i okuyup kullanmiyor).
> Silme oncesi: once `OPENAI_API_KEY`'i bos birakin veya "DELETED" yapin, 10 dakika izleyin, /health 200 devam ediyorsa selin.

---

## 3. OZET TABLO

| Env | Render'da | Kod kullanimi | Karar |
|-----|-----------|---------------|-------|
| `SUPABASE_SERVICE_KEY` | Olmali | 6 aktif satir (uploadFile, uploadMiddleware) | TUT |
| `SUPABASE_SERVICE_ROLE_KEY` | Olmali | 8 aktif satir (signedURL, boot, OS adapter) | TUT |
| `OPENAI_API_KEY` | Mevcut | 0 aktif kullanim (sadece config'de tanimli) | SIL |

---

## 4. MEHMET BEY'E NET ADIMLAR

### ADIM 1 — OPENAI_API_KEY silme (dusuk risk)
1. Render dashboard → tedbirge-ai servisi → Environment
2. `OPENAI_API_KEY` satirini bul
3. Silmeden once degeri kopyala ve guvenli yere kaydet (ihtiyat)
4. Degeri bos birak (veya satiri sil)
5. Save Changes → otomatik restart (~2 dakika)
6. Restart sonrasi `https://tedbirge-ai.onrender.com/health` → 200 dogrula
7. Panel'de belge yukle/indir test et → calisiyorsa silme tamamlandi

### ADIM 2 — SUPABASE key tutarsizligi (TUR #5 icin not)
- Simdilik DOKUNMA. Her iki key de gerekli.
- TUR #5 mimar oturumunda kod tarafinda kanonik key secimine karar verilecek.
- O turda: `SUPABASE_SERVICE_ROLE_KEY` kanonik, `SUPABASE_SERVICE_KEY` koddan kaldirilacak.

---

## 5. KOD TARAFI IYILESTIRME ONERISI (TUR #5)

Kanonik key secim plani:
- `SUPABASE_SERVICE_ROLE_KEY` → kanonik (Supabase standart adi, OS adapter zaten bunu kullaniyor)
- Degistirilecek dosyalar: `storage.service.js` (modul seviyesi sabit + getSupabaseClient), `uploadMiddleware.js`
- Fallback pattern kaldirilacak, tek env dogrudan okunacak
- Mimar oturumunda onaylanacak, TUR #5 otonom yurutecek

---

**Mimar:** Claude Code (TUR #4 FAZ A)
**Tarih:** 25 Nisan 2026

---

## SUPABASE Tarama Sonucu (26 Nisan 2026)

### Bulgular

`SUPABASE_SERVICE_KEY` kullanan dosyalar (aktif):
- `src/services/storage.service.js:12` — modul sabiti: `const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ""`
- `src/services/storage.service.js:16,17,19` — `getSupabaseClient()` fonksiyonu (uploadFile, deleteFile icin)
- `src/services/storage.service.js:114,130,148` — fallback zaten var: `SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_KEY`
- `src/middlewares/uploadMiddleware.js:16` — `process.env.SUPABASE_SERVICE_KEY` (direkt, fallback yok)
- `src/os/modules/auditor.js:128` — sadece string referans (env kontrol listesi, deger okumaz)

`SUPABASE_SERVICE_ROLE_KEY` kullanan dosyalar:
- `src/os/boot.js:40` — sadece yeni ad
- `src/os/adapters/supabase.js:73,112` — sadece yeni ad
- `src/services/storage.service.js:114,130,148` — primary (fallback: SERVICE_KEY)

### Tani

KARMA — Her iki env aktif kullanımda.
- `getSupabaseClient()` (sat. 12-19) ve `uploadMiddleware.js` (sat. 16) sadece eski adı (`SUPABASE_SERVICE_KEY`) biliyor.
- `createSignedUploadUrl`, `verifyUpload`, `createSignedDownloadUrl` zaten fallback pattern kullaniyor.
- `boot.js`, `supabase.js` adapter sadece yeni adı (`SUPABASE_SERVICE_ROLE_KEY`) biliyor.

### Karar (Mimar)

`SUPABASE_SERVICE_ROLE_KEY` kanonik (master), `SUPABASE_SERVICE_KEY` fallback.

G5-2'de degistirilecek 2 yer:
1. `storage.service.js:12` — modul sabiti fallback pattern'e cevirilecek
2. `uploadMiddleware.js:16` — fallback pattern'e cevirilecek

Degistirilmeyecek:
- `storage.service.js:114,130,148` — zaten fallback pattern, dokunulmaz
- `boot.js`, `supabase.js` — zaten yeni ad kullaniyor, dokunulmaz
- `auditor.js:128` — string referans, anlam degismez

Sonuc: G5-2 sonrasi `SUPABASE_SERVICE_KEY` Render'dan silinebilir (fallback her yerde aktif).
