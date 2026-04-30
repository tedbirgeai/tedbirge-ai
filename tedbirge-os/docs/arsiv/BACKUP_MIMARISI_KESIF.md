# BACKUP MİMARİSİ KEŞİF
## Tarih: 27 Nisan 2026
## Mimar: Claude Code (Sonnet 4.6)

> TUR #24 (Backup Mimarisi Kesiti) için kanıt zemini.
> Madde 21 disiplini: sıfır kod değişikliği, sadece okuma.

---

## YÖNETİCİ ÖZETİ

| Soru | Cevap | Risk | Kanıt |
|------|-------|------|-------|
| backup.js gerçek mi, iskelet mi? | **%100 iskelet — SKIPPED döndürüyor** | 🔴 | G-B1 |
| pg_dump container'da var mı? | **YOK — Dockerfile yok, render.yaml'da install yok** | 🔴 | G-B2 |
| Supabase Storage'a yedek gidiyor mu? | **YOK — hiçbir referans yok** | 🔴 | G-B3 |
| Retention politikası belirli mi? | **Constant var (7g DB / 30g Storage) ama uygulanmıyor** | 🟡 | G-B4 |
| Restore testi yapılmış mı? | **YOK — sıfır restore script** | 🔴 | G-B5 |
| Cron tetikleyici var mı? | **YOK — server.js'te backup.start() bile çağrılmıyor** | 🔴 | G-B6 |
| KVKK m.5 uyumu kararlaştırıldı mı? | **Hayır — MIMARI_KARARLAR'da kayıt yok** | 🟡 | G-B7 |

**En kritik 3 bulgu:**
1. 🔴 **Hiç yedek alınmıyor** — backup.js start() server.js'te çağrılmıyor, pg_dump binary yok
2. 🔴 **pg_dump container'da mevcut değil** — Render `env: node`, postgresql-client kurulu değil
3. 🔴 **Restore script + test sıfır** — yedek varsayılsa bile geri yükleme senaryosu test edilmemiş

---

## G-B1: backup.js Mevcut Yapı

**Dosya konumu:** `src/os/modules/backup.js` (mektuptaki `tedbirge-os/scripts/backup.js` YOK)

**Kritik kodlar:**

```javascript
// runDatabaseBackup() — satır 127-187
// Sprint 3 placeholder:
// const { spawn } = require('child_process');
// const dump = spawn('pg_dump', [process.env.DATABASE_URL, '-F', 'c']);
// ... upload to Supabase Storage bucket 'backups/'

record = {
  status: BACKUP_STATUS.SKIPPED,  // her çağrıda SKIPPED döndürüyor
  details: { note: "THIN mode: gercek pg_dump Sprint 3, metadata-only kayit" }
};
```

**Mimari:**
- setInterval: daily 24h (DB), weekly 7*24h (Storage)
- History: in-memory ring buffer (son 30 kayıt) — DB'ye yazılmıyor
- Event emit: BACKUP_STARTED / BACKUP_COMPLETED / BACKUP_FAILED mevcut
- Reconciler: policyHandler var — drift detection çalışıyor ama tedavi yapılamaz (iskelet)
- Retention constants: `DEFAULT_DB_RETENTION_DAYS = 7`, `DEFAULT_STORAGE_RETENTION_DAYS = 30`

**Analiz:** backup.js tamamen iskelet. runDatabaseBackup() ve runStorageBackup() her zaman `SKIPPED` döndürüyor. Gerçek yedekleme SIFIR.

---

## G-B2: pg_dump Binary Erişimi

**Dockerfile:** YOK (root dizinde `Dockerfile` dosyası yok)

**render.yaml:**
```yaml
services:
  - type: web
    env: node          # postgresql-client kurulu değil
    buildCommand: npm ci --omit=dev && npx prisma generate && npx prisma migrate deploy
    startCommand: node src/server.js
```

**package.json:**
- `"pg": "^8.20.0"` → devDependency (sadece Prisma CLI için, pg_dump değil)
- `"node-cron": "^4.2.1"` → mevcut (deadlineChecker kullanıyor)
- pg_dump wrapper paketi (pg-dump-restore, node-pg-dump vb.): **YOK**

**Sonuç:** pg_dump binary container'da **MEVCUT DEĞİL**. Render'ın Node.js ortamında
PostgreSQL client araçları varsayılan olarak kurulmaz. pg_dump çalıştırmak için:
- Dockerfile ile `apt-get install postgresql-client` VEYA
- `pg` npm paketi üzerinden programatik dump (psql wire protocol) gerekir.

---

## G-B3: Supabase Backup

**Grep sonucu:** `(supabase.*backup|storage.*backup|backup.*supabase|tedbirge-backup)` — **0 eşleşme**

**Supabase Free tier:** Otomatik Point-in-Time Recovery (PITR) yok (Pro tier özelliği).
Ücretsiz tier: manuel pg_dump veya Supabase Dashboard export.

**Mevcut storage bucket:** `tedbirge-documents` (belge yükleme). `tedbirge-backups` bucket: **YOK**.

**Sonuç:** Ne uygulama tarafından ne Supabase tarafından otomatik yedek alınıyor.
Supabase Free → yedek sorumluluğu tamamen uygulama tarafında.

---

## G-B4: Retention + Encryption

**backup.js sabitleri:**
```javascript
const DEFAULT_DB_RETENTION_DAYS = 7;       // satır 81
const DEFAULT_STORAGE_RETENTION_DAYS = 30; // satır 82
```

**Uygulama:** Retention sabiti tanımlı ama:
- Yedek alınmadığı için retention uygulanacak dosya yok
- Cleanup mekanizması: reconciler'da drift detection var, silme logic YOK
- Eski yedek silme fonksiyonu: **YOK**

**Encryption:**
- Encryption-at-rest: Supabase varsayılan AES-256 (altyapı katmanı)
- Encryption-in-transit: HTTPS/TLS zorunlu (Supabase API)
- Ek katman (gpg, uygulama seviyesi): **YOK**

**MIMARI_KARARLAR.md:** Backup retention kararı **kaydedilmemiş**.

**Sonuç:** Retention sayılar var, anlam yok. Cleanup ve encryption kararı alınmamış.

---

## G-B5: Restore Testi

**Grep sonucu:** `(restore|pg_restore)` → **0 uygulama kodu eşleşmesi** (sadece node_modules)

**src/jobs/ klasörü:**
- `deadlineChecker.job.js`
- `documentAnalysis.job.js`
- Restore job: **YOK**

**Sonuç:** Restore script yok, test edilmemiş. "Yedek var" varsayılsa bile geri yükleme
senaryosu sıfır test. Felakette ne kadar sürede sistemi ayağa kaldırırız: bilinmiyor.

---

## G-B6: Cron / Scheduler

**node-cron mevcut:** `"node-cron": "^4.2.1"` — package.json'da bağımlılık var.

**deadlineChecker.job.js pattern** (referans):
```javascript
const cron = require("node-cron");
cron.schedule('0 8 * * *', async () => { ... }); // her gün 08:00
```

**backup.js pattern:** setInterval kullanıyor, node-cron DEĞİL.

**server.js:** backup.start() çağrısı — **YOK**. backup modülü hiç başlatılmıyor.

**Sonuç:** node-cron altyapısı kullanılabilir durumda ama backup için:
1. server.js'te backup.start() yok → setInterval hiç başlamıyor
2. node-cron ile günlük schedule kurulmamış
3. TUR #24'te hem trigger hem gerçek implementasyon lazım

---

## G-B7: KVKK m.5 Uyumu

**KVKK m.5:** "Kişisel veriler işlendikleri amaç için gerekli olan süre kadar saklanır."

**Mevcut durum:**
- Yedek alınmıyor → veri saklama süresi sorusu şu an varsayımsal
- gdprDelete (TUR #23 C3 ile düzeltildi) → uygulama DB'den siliyor
- Silinen müvekkilin yedeklerden silinmesi: **mümkün değil** (immutable backup sorunu)

**KVKK saklama süresi kararı:** MIMARI_KARARLAR.md'de **kayıt yok**.

**Hukuki perspektif:** Kaza dosyaları → dava zamanaşımı 2-10 yıl. Yedeklerin
minimum bu süre boyunca tutulması + sonrasında silinmesi gerekiyor.
Yedek retention 7 gün (backup.js sabiti) çok kısa — dava arşivi için yetersiz.

**Sonuç:** KVKK m.5 uyum kararı alınmamış. 7 günlük retention hukuki olarak sorunlu
(davalar 2-10 yıl sürüyor, yedek çok erken silinir). Retention süresi Mehmet Bey +
avukat görüşü gerektirir.

---

## TUR #24 KESİT ÖNERİSİ

### A. Dar (Minimum Viability — 3-5 saat, ~5 tur)

**Hedef:** İlk gerçek yedek alınıyor ve Supabase Storage'a gidiyor.

**Tur planı:**
1. Render ortamında pg_dump yerine `pg` npm paketi ile programatik dump (binary yok sorunu çözümü)
2. Supabase Storage'a `tedbirge-backups` bucket + dump yükleme
3. server.js'te `tedbirge-backup.js` cron job mount (node-cron 02:00)
4. SystemEvent ile backup başarı/hata logu (DB'ye yaz)
5. Retention: 7 gün sonrası eski yedekleri sil (bucket list + delete)

**Risk:** Orta — pg paketi ile dump boyutu büyük olabilir, Supabase Storage limiti var.

### B. Geniş (Production-grade — 1-2 hafta, ~10-15 tur)

**A +:**
- Restore script (staging DB'ye test restore)
- Haftalık otomatik restore drill (Render → ayrı Supabase instance)
- GPG encryption (backup-at-rest ek katman)
- Retention politikası KVKK m.5 ile uyumlu (min 2 yıl kaza dosyası)
- BackupRecord DB tablosu (in-memory yerine kalıcı tarihçe)
- Admin dashboard: backup durumu, son başarılı yedek, restore SLA

**Risk:** Yüksek — staging DB kurulumu (maliyet), ayrı Supabase project gerekebilir.

**Öneri:** **A (Dar)** — Önce hiç yedek olmayan kritik riski kapat. B kesitin öğeleri
sonraki fazda SHOULD+NEXT olarak girebilir.

---

## EKSİK NOKTALAR (Mehmet Bey için — manuel kontrol)

1. **Supabase tier:** Free mi, Pro mu? Pro'da otomatik PITR var → A kesitin önemi değişir.
2. **Yedek hedef:** Supabase Storage (mevcut) mi, yoksa Wasabi/S3 dış depolama mı?
   Supabase'in kendisi kurtarılırsa yedekler de gider — offsite önemli.
3. **Restore SLA:** Felaket senaryosunda kaç saat içinde sistem ayağa kalkmalı? (RTO)
4. **KVKK retention süresi:** Avukat görüşü — kaza dosyaları ne kadar saklanmalı?
   Hukuki minimum: dava zamanaşımı + 1 yıl (2-10 yıl arası).
5. **pg paketi dump yöntemi:** Production DB boyutu ne kadar?
   Büyük DB'de pg ile programatik dump bellek sorunu yaratabilir.

---

— Claude Code, BACKUP MİMARİSİ KEŞİF sonu (sıfır kod değişikliği — Madde 21.2)
— Commit: YOK
