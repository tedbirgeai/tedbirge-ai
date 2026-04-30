# RENDER DEPLOY + DRIFT TESHIS RAPORU
## Tarih: 26 Nisan 2026 (gece, TUR #14.6 Kesif)
## Mimar: Claude Code

> Bu rapor Render queue takilmasi ve drift sorununun gercek kok nedenini
> kanıtla tespit etmek icin yazildi. TEDAVI YOK — sadece tani.
> Hicbir kod degisikligi, SQL, commit veya push yapilmadi.

---

## K1 — Git Durumu

### Backend repo (tedbirge-ai)

Son 15 commit (en yeniden eskiye):
```
6edf545 docs: TUR #16 sonu + Muvekkil Iletisim Kesiti kapanis
b1d992f fix(musteri): mesaj sonrasi avukata push+SMS debounce (BUG #8)
6e84eb8 fix(whatsapp): bilinmeyen no icin otomatik Lead + spam koruma (BUG #7)
d71292b feat(lead): UTM tracking aktif (public form'dan yakalama + DB yazimi)
4ad6de0 feat(schema): Lead source + 3 UTM alani + selfHeal task
e322c31 fix(server): dbSelfHeal hook on startup — app.listen wrapped in finally
b55a90f feat(bootstrap): dbSelfHeal idempotent script (TUR #14 drift fix)
6d78e6e docs: OTONOM_RAPOR TUR #15 sonu
e73503d docs: OTONOM_RAPOR TUR #14 sonu
5c81fb7 feat(lead): archive/delete/restore endpoints
4292f5d feat(lead): archive/delete/restore service functions + listLeads soft-delete filter
eea0f9b feat(schema): Lead.archivedAt + deletedAt (soft delete)
```

Push durumu: `Your branch is up to date with 'origin/master'` — SENKRON

### Panel repo (tedbirge-panel)

Son 8 commit:
```
9f4456b feat(panel): public form UTM yakala (utm_source/medium/campaign)
2650837 feat(panel): musteri self-register sayfasi (/register/musteri) + login linki
86ba76c feat(lead): arsiv/silme UI — LeadActionsMenu + arsiv sayfasi (TUR #14)
3301ee3 feat(panel): MusteriHesabiAcButton + /sifre-belirle sayfasi
```

Push durumu: `Your branch is up to date with 'origin/master'` — SENKRON

**Bulgu:** TUR #14, #14.5, #16 commit'lerinin TAMAMI GitHub origin'de mevcut.
Kod tarafinda eksik yok.

---

## K2 — Lokal .env Durumu

DATABASE_URL maskelenmis ozet:
- Host: `db.dlkctvyjbuulmkgpqcvm.supabase.co` — ESKİ / BAYAT lokal veritabani
- Port: 5432
- DB: postgres

**Bulgu:** Lokal .env production'a degil, ESKI test DB'sine bagli.
Bu neden onemli:
- Lokal `prisma migrate dev` daima DRIFT hatasi verir (bayat DB)
- Render'in kendi DATABASE_URL env'i farkli olmali (production iikpmzomblocdrxeisxh)
- dbSelfHeal.js lokal calistirilirsa ESKI DB'ye baglanir — production etki yok
- Render'da dogru DATABASE_URL varsa selfHeal production DB'ye baglenir

**NOT:** Render ortam degiskenlerini Claude Code goremez. Bu rapor sadece lokal durumu kanıtliyor.

---

## K3 — Schema + Migration Dosyalari

### schema.prisma model Lead alanlari:

Beklenen 6 yeni alan:
- archivedAt: **VAR** (satir 250: `archivedAt  DateTime?`)
- deletedAt:  **VAR** (satir 251: `deletedAt   DateTime?`)
- source:     **VAR** (satir 252: `source      String?`)
- utmSource:  **VAR** (satir 253: `utmSource   String?`)
- utmMedium:  **VAR** (satir 254: `utmMedium   String?`)
- utmCampaign:**VAR** (satir 255: `utmCampaign String?`)
- @updatedAt: **VAR** (satir 224: `updatedAt DateTime @updatedAt`)

### Migration klasorleri:

```
20260414225626_init
20260415031204_add_kvkk_consent
20260422004348_add_health_data_consent_at
20260422_add_muhatap_fields_to_lead
20260426000001_add_lead_archive_delete
20260426000002_add_lead_source_utm
migration_lock.toml
```

### Migration SQL icerikleri:

**20260426000001_add_lead_archive_delete:**
```sql
ALTER TABLE "Lead" ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "deletedAt" TIMESTAMP(3);
```

**20260426000002_add_lead_source_utm:**
```sql
ALTER TABLE "Lead"
ADD COLUMN "source" TEXT,
ADD COLUMN "utmSource" TEXT,
ADD COLUMN "utmMedium" TEXT,
ADD COLUMN "utmCampaign" TEXT;
```

**Bulgu:** Her iki migration dosyasi dogru SQL iceriyor. `IF NOT EXISTS` yok (manuel
migration — selfHeal'de IF NOT EXISTS kullaniliyor).

---

## K4 — Bootstrap Script Durumu

dbSelfHeal.js: **VAR** (`src/bootstrap/dbSelfHeal.js`)

HEAL_TASKS listesi:
1. `lead_archive_delete` — expectedColumnCount: 2, archivedAt + deletedAt
2. `lead_source_utm` — expectedColumnCount: 4, source + utmSource + utmMedium + utmCampaign

server.js entegrasyon: **VAR**

Entegrasyon noktasi (server.js satir 39-47):
```javascript
const { selfHealDatabase } = require("./bootstrap/dbSelfHeal");
let server = null;

selfHealDatabase()
  .then(...)
  .catch(...)
  .finally(() => {
    server = app.listen(env.port, () => { ... });
  });
```

`app.listen()` artik selfHealDatabase().finally() icinde calistirilıyor.
Null-check `if (!server) { process.exit(0); return; }` graceful shutdown'da mevcut.

---

## K5 — TUR #16 Kod Parcalari

| Dosya | Beklenen Degisiklik | Durum |
|---|---|---|
| public.route.js | UTM yakalama (utm_source/medium/campaign) | **VAR** |
| lead.service.js | source/utmSource/utmMedium/utmCampaign DB yazimi | **VAR** |
| whatsapp.routes.js | bilinmeyen no otomatik Lead + spam koruma | **VAR** |
| musteri.controller.js | avukat push+SMS debounce bildirimi | **VAR** |
| basvuru/page.tsx | window.location.search UTM yakalama | **VAR** |

Hic birinde eksik yok.

---

## K6 — Import Test

Komutlar: `cd tedbirge.ai && node -e "require('./src/...')"`

| Modul | Sonuc |
|---|---|
| lead.service | **OK** |
| public.route | **OK** |
| whatsapp.routes | **OK** |
| musteri.controller | **OK** |
| dbSelfHeal | **OK** |

Hic bir modul import hatasi vermedi. Syntax ve dependency sorunu yok.

---

## K7 — Render Build Logu

Bu adim Claude Code tarafindan yapilamaz.
Mehmet Bey Render dashboard'dan build logunu getirmeli.

Beklenen log satirlari (dogru deploy durumunda):
```
Cloning from github.com/tedbirgeai/tedbirge-ai.git
Checking out commit e322c31 (veya daha yeni)
Running build command: npm install && npx prisma generate
...
[DB-HEAL] baslatiliyor — idempotent self-heal kontrolu
[DB-HEAL] [lead_archive_delete] ...
[DB-HEAL] [lead_source_utm] ...
[DB-HEAL] tamamlandi — basarili: 2/2
Server running on http://localhost:PORT
```

---

## OZET BULGU

**Net teshis: SENARYO A — Render deploy tetiklenmemis veya eski commit'te takili.**

Kanit:
- Kod: 6 yeni alan schema'da VAR, 2 migration dosyasi VAR, selfHeal VAR, import testleri OK
- Git: Her iki repo origin ile SENKRON
- Lokal: 5 modul hatasiz import oluyor

**Ne eksik:**
- Render'in son deploy'u muhtemelen TUR #14.5 oncesinde kaldi
  (TUR #14.5 G14.5-7: "Mehmet Bey Build Command'i guncelle + Manual Deploy tetikle" — bu adim onaylandi mi bilinmiyor)
- selfHeal script production'da hic calismadiysa kolonlar hala eksik

**Mimara Not:**
Tedavi mektubu tek bir sey soyle:
> "Mehmet Bey Render dashboard'a girmeli, Manual Deploy tetiklemeli.
>  Build Command: `npm install && npx prisma generate` olmali.
>  Deploy sonrasi Render Logs'da [DB-HEAL] satirlarini kontrol etmeli."

Kod degisikligi GEREKMIYOR. Sadece deploy tetiklenmesi yeterli.

---

— Claude Code, TUR #14.6 Kesif sonu
