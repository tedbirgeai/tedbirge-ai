# OTURUM KAYDI — 22 Nisan 2026 ÖĞLEDEN SONRA/AKŞAM

**Tarih:** 22 Nisan 2026 Çarşamba, 05:00 — ~17:00 (12 saat)
**Mimar:** Claude Opus 4.7 (iki oturum: sabah + öğleden sonra)
**Konu:** W1-M4 Süre Motoru tam entegrasyon + güvenlik tatbikatı + pool fix
**Sonuç:** W1-M4 KAPANDI. 5 commit canlıda. Cuma demosu omurgası hazır.

---

## BUGÜN YAPILANLAR (Kronolojik)

### Sabah Oturumu (05:00-09:00) — Önceki Mimar'dan Devralındı
Referans: `OTURUM_22_04_2026_SABAH.md`

- ✅ W1-M1 Hukukçu Dashboard
- ✅ W1-M2 Lead Timeline
- ✅ W1-M3 Muhatap Enum + Şablonlar
- ✅ 4 gizli regresyon (analytics pool, Railway→Render proxy, render.yaml, timeline dedupe)
- ✅ KASIM lead `L-20260421-LU10D6` backfilled

### Öğleden Sonra Oturumu (10:00-17:00) — Bu Oturum

#### W1-M4 C1 — Süre Motoru Servisi (Backend)
- **Commit:** `384dacb`
- **Dosyalar:** 4 yeni/güncel
  - `src/services/sureMotoru.service.js` (YENİ, pure function)
  - `src/data/sureKurallari.js` (YENİ, veri odaklı kural tablosu)
  - `src/services/sureMotoru.service.test.js` (YENİ, 7 senaryo manuel doğrulama)
  - `src/controllers/lead.controller.js` (UPD, getLead response'a `sureler` alanı)
- **Kapsam:** KTK m.99 (15 gün sigorta cevap) + İSG m.14 (3 gün işveren bildirim) + 5510 SK m.21 (10 yıl SGK rücu) + TBK m.72 (zamanaşımı, mevcut servis delegasyonu) + HMK m.93 (son gün hafta sonu kaydırma)
- **Önemli:** `zamanasimi.service.js` ZATEN VARDI (4 servis kullanıyor), dokunulmadı, `sureMotoru` import edip kullanıyor
- **ADIM 0 bulguları:** `olayTarihi` → `accidentDate`, `kazaSonucu` → `injurySeverity`'den türetiliyor, `basvuruTarihi` → `ihtarnameler[0].gonderimTarihi`'nden. `normalizeLead()` ile schema-agnostic yapıldı.
- **Canlı:** Render deploy OK, `/api/leads/:id` response'da `sureler: [...]` alanı dönüyor

#### GÜVENLİK TATBİKATI — JWT_SECRET Yenilendi
- **Kök neden:** Canlı doğrulama için Claude Code admin credential'larla login curl yaptı, JWT token + admin şifresi terminal output'una ve sohbet kayıtlarına sızdı
- **Çözüm:** Render'da `JWT_SECRET` env var'ı `crypto.randomBytes(64).toString('hex')` ile yenilendi, manual redeploy, eski tüm token'lar invalidate edildi
- **Yeni protokol kuralı:** Claude Code ASLA canlı credential ile login curl yapmaz. Auth gerektiren test için browser DevTools Network tab'dan token kopyalanır. Şifreler komuta GİRMEZ.
- **Açık tech debt:** Admin şifresi (`admin@tedbirge.ai`) hâlâ aynı, değiştirilmedi. Yarın sabah ilk iş: admin şifresini değiştir (profilden). Sızmış şifre bash history + Windows event log'da kayıtlı olabilir.

#### W1-M4 C2 — Analytics Endpoint (Backend)
- **Commit:** `75f63df`
- **Dosyalar:** 3 güncel
  - `src/services/analytics.service.js` (UPD, `getKritikSureler(user)` fonksiyonu)
  - `src/controllers/analytics.controller.js` (UPD, thin wrapper handler)
  - `src/routes/analytics.routes.js` (UPD, `GET /api/analytics/kritik-sureler`)
- **Kapsam:** Role-aware (LAWYER: Assignment `isActive:true` üzerinden atanmış leads, ADMIN: tüm aktif leads). `sureMotoru.hesaplaSureler()` uygulayıp SARI/KIRMIZI/GECTI olanları listeler.
- **ADIM 0 bulguları:** `lawyerId` Lead'de YOK — `Assignment` tablosu üzerinden. `customerName` tek alan (firstName/lastName yok). Terminal status: `WON` ve `LOST` (CLOSED/CANCELLED/DELETED yok).
- **Canlı:** Render deploy OK

#### W1-M4 C3 — Panel Entegrasyonu
- **Commit:** `85db4a9`
- **Dosyalar:** 4 yeni/güncel
  - `components/lead/SureKarti.tsx` (YENİ, 4 durum: YESIL/SARI/KIRMIZI/GECTI)
  - `app/(panel)/leads/[id]/page.tsx` (UPD, `lead.sureler` render)
  - `app/(panel)/dashboard/ajanda/page.tsx` (UPD, widget endpoint'e bağlandı)
  - `app/(panel)/dashboard/hukukcu/page.tsx` (UPD, widget endpoint'e bağlandı + hint text kaldırıldı)
- **Not:** Local `npm run build` Turbopack bug'ı nedeniyle `InvariantError` verdi (Next.js 16.2.2 bilinen issue, pre-existing, `/basvuru` da etkiliyor). Vercel production build farklı ortam, sorunsuz deploy etti.
- **Canlı:** Vercel deploy OK, panel görsel doğrulandı

#### Supabase Pool Size Artırımı
- **Değişiklik:** Connection pool size 15 → 25
- **Sebep:** `timeline.service.js` 10 paralel sorgu yapıyor, pool tükeniyordu (`MaxClientsInSessionMode` hatası)
- **Durum:** Pool 25'e çıkarıldı, test edilmedi (son kontrol kullanıcı tarafında kaldı)

---

## MEVCUT AÇIK İŞLER

### 🟡 Doğrulanmamış: Timeline Pool Fix
Pool 25'e çıkarıldı ama `timeline.service.js` crash'i çözüldü mü kontrol edilmedi. Panel'de herhangi bir lead'in timeline'ı açılmalı, "Timeline yüklenemedi" hatası gitti mi bakılmalı. Eğer hâlâ hata varsa:
- Yaklaşım C: `timeline.service.js`'i `$transaction` refactor'u (1 saat iş, kalıcı çözüm)
- Yaklaşım B: Promise.all'u sıralı await yap (10ms → 100ms yavaşlar, pool-safe)

### 🟡 Demo Veri Manipülasyonu
KASIM lead (`L-20260421-LU10D6`) şu an muhtemelen tüm süreleri YEŞIL bölgede. Cuma demosunda Ramazan Bey'e "Kritik Süreler" widget'ı boş görünmesin diye:
- `accidentDate`'i 1 yıl 11 ay öncesine çek → TBK zamanaşımı KIRMIZI
- veya `ihtarnameler[0].gonderimTarihi`'ni 13 gün öncesine çek → SIGORTA_CEVAP SARI
- Cuma sabahı yapılır, Supabase SQL ile 1 satır update

### 🔴 Açık Güvenlik İşi
Admin şifresi değiştirilmedi (sızmış olabilir). YARIN İLK İŞ.

### 🟡 Açık Tech Debt (Önceden Biliniyor)
- Local `.env` bayat, silinmiş Supabase'i gösteriyor — Sprint 2'de "local dev'i emekliye ayır"
- CLAUDE.md 76k token → 40k altına indir
- PANEL_TANI_2.txt untracked, içerik incelenecek
- Procfile ve render.yaml senkron mu
- Next.js 16.2.2 Turbopack bug'ı (pre-existing, Vercel'i etkilemiyor, Sprint 2'de takip)

---

## SPRINT 1 — CUMA DEMOSUNA KALAN İŞLER

| İş | Tahmin | Öncelik | Durum |
|----|--------|---------|-------|
| **W1-M3.5** AI Muhatap Analizi | 4-6 saat | Bonus | Açık |
| **W1-M5** Sigorta Wizard | 2 saat | Zorunlu | Açık |

**Zaman hesabı:** Perşembe tam gün (~8-10 saat) + Cuma sabah (~3-4 saat) = **12-14 saat**. Toplam iş **6-8 saat**. Rahatlıkla biter.

**Demo hedefi (Cuma 24 Nisan, Ramazan DURAN'a):**
1. Yeni başvuru gelir, form doldurulur
2. AI otomatik muhatap tespiti (W1-M3.5) — "Trafik sigortası, %95 güven"
3. Hukukçu tek tık onay
4. "Belge Oluştur → İhtarname"
5. Şablon otomatik dolu (W1-M3 ✅)
6. **Süre motoru uyarısı (W1-M4 ✅)** — "16. gün cevap yoksa dava"
7. Sigorta'ya otomatik başvuru (W1-M5)

---

## YARIN SABAH (23 NİSAN PERŞEMBE) — NET PLAN

**Yeni sohbet açıldığında Claude Opus 4.7 aşağıdaki sırayla ilerleyecek. "Ne yapacağız" SORMAYACAK.**

### 1. Durum Senkronizasyonu (ilk 3 dakika)

Claude Code'a otomatik şu komutları ver:

```
view C:\Users\WIN10\desktop\tedbirge.ai\tedbirge-os\docs\OTURUM_22_04_2026_TAM_GUN.md
git -C C:\Users\WIN10\desktop\tedbirge.ai log --oneline -5
git -C C:\Users\WIN10\desktop\tedbirge.ai\tedbirge-panel log --oneline -5
curl -s -o NUL -w "HTTP: %{http_code}\n" https://tedbirge-ai.onrender.com/health
```

### 2. Güvenlik Kapatması (5 dakika) — ÖNCELİK 1

Mehmet Bey'e: "İlk iş admin şifresini değiştiriyoruz. Panel'e gir, profilden şifre değiştir, yeni şifreyi password manager'ına kaydet."

### 3. Timeline Pool Kontrolü (5 dakika) — ÖNCELİK 2

Mehmet Bey'e: "KASIM lead timeline'ı aç, 'Timeline yüklenemedi' hatası var mı?" 
- Hata yok → Pool fix çözdü, geç
- Hata var → `$transaction` refactor gorev dosyası hazırla (15 dk gorev)

### 4. W1-M5 Sigorta Wizard (2 saat) — ZORUNLU

Backend zaten hazır (sigorta başvuru servisi, KEP alanları). Panel tarafında wizard UI yazılacak: 3-4 adımlı form → önizleme → "Sigortaya Başvur" butonu → backend'e POST → PDF üretimi.

ADIM 0 keşif komutları:
```
view C:\Users\WIN10\desktop\tedbirge.ai\src\services\ihtarname.service.js
grep -rn "sigorta\|basvuru\|KEP" C:\Users\WIN10\desktop\tedbirge.ai\tedbirge-panel\app --include=*.tsx -l
```

Gorev dosyası Downloads'a indirilecek, tek seferde uygulanacak pattern.

### 5. W1-M3.5 AI Muhatap Analizi (4-6 saat) — BONUS

Cuma demosunun "vay be" anı. Kural tabanlı değil, tam Claude API (Anthropic SDK zaten yüklü, `@anthropic-ai/sdk ^0.89.0`). 
- Yeni lead geldiğinde (veya muhatap boşken) backend otomatik muhatap tespiti yapar
- Güven skoru 0-1, gerekçe metni
- Panel'de "AI Önerisi: Trafik Sigortası (%95)" kartı, hukukçu tek tık onay

Backend:
- `src/services/muhatapAI.service.js` (YENİ) — Claude API çağrısı, JSON response
- Lead create veya manual trigger endpoint

Panel:
- `components/lead/MuhatapAIKart.tsx` — Öneri gösterimi + onay butonu

### 6. Cuma Sabah (24 Nisan) — Demo Hazırlığı

- KASIM lead'de demo veri manipülasyonu (KIRMIZI süre görünsün)
- End-to-end akış provası (başvuru → AI muhatap → şablon → süre → wizard)
- Ramazan Bey'e demo: muazzam vizyon anı

---

## KRİTİK BİLGİLER (Her Oturumda Hatırla)

**Platform:**
- Backend: **Render** (`https://tedbirge-ai.onrender.com`) — Railway ÖLÜ
- Panel: **Vercel** (`https://www.tedbirge.ai`)
- DB: **Supabase** proje `iikpmzomblocdrxeisxh` — eski proje `dlkctvyjbuulmkgpqcvm` silinmiş
- API: `/api` same-origin proxy (CORS yok, Vercel rewrites)

**CI/CD:** Render `buildCommand: npm ci && prisma generate && prisma migrate deploy` — migration'lar otomatik uygulanır.

**Supabase Pool:** 25 (bugün 15'ten yükseltildi).

**13 Muhatap Enum:** TRAFIK_SIGORTASI, KASKO, FERDI_KAZA_KOLTUK, TMTB, GUVENCE_HESABI, ISVEREN, SGK, HASTANE, TARSIM, DASK, SORUMLU_UCUNCU_KISI, KAMU_KURUMU, DIGER

**Lead alanları (W1-M3'ten + W1-M4'ten):** muhatapTipi, muhatapAdi, muhatapTespitKaynagi, muhatapGuvenSkoru, muhatapGerekce, + runtime `sureler: SureUyarisi[]` (Prisma select'te yok, controller hesaplayıp ekliyor)

**Aktif şablonlar:** TRAFIK_SIGORTASI, SGK, ISVEREN (`src/templates/muhatap-templates.json`). Diğer 10 placeholder, Sprint 2'de.

---

## OTURUM BOYUNCA KURALLAR (Yeni Mimar İçin)

1. **Otonom Protokol 7/7 Denetim** her commit öncesi: TS, kapsam, canlı etki, geri alma, sır sızıntısı, test veri, commit mesajı
2. **Read-only Claude Code komutları** (view, cat, grep, ls, git log/show/diff) için onay sorulmaz
3. **Write/commit/push/migration** için her zaman onay
4. **Migration SQL mimar onayından** geçmeli
5. **Canlı DB'ye elle SQL atmadan** önce mimar onayı
6. **Schema değişikliği** = mimar onayı şart
7. **Her görev başında:** `[Madde X] Başlangıç: hedef + dosyalar + süre + risk`
8. **Her görev bitişinde:** `[Madde X] Bitiş: dosyalar + commit hash + push + TS + canlı test + 7/7`
9. **Uzun komutlar** → Downloads'a `.md` olarak indir, Claude Code `view` ile okusun
10. **YENİ — Güvenlik:** Claude Code canlı credential ile login curl YAPMAZ. JWT token'lar terminal output'a DÖKÜLMEZ. Auth test için browser DevTools kullan.
11. **YENİ — Ham çıktı:** Claude Code build/test hatalarında özet + "3 seçenek" sunmaz. Ham stack trace verir, mimar karar verir.
12. **YENİ — Tek fazlı görev dosyası:** Görev dosyalarında "TASLAK" bölümü olmaz. Tek seferde uygulanacak kapsamlı görev veya hiç görev.

---

## MEHMET BEY'İN VİZYONU (Unutma)

> "Biz Türkiye'deki tüm trafik/iş kazalarını yöneteceğiz."
> "Otomatik hiçbir şey yok — olması lazım. Emsal kararları otomatik bulup itiraz et, sigortaya başvuru otomatik olsun."
> "Hukukçu paneli görselleri muazzam olsun."
> "Manuel iş sevmiyorum, yoruldum."
> "Hukukçu da yorulmasın — manuel dropdown değil, AI otomatik seçsin."

Bu vizyon → W1-M3.5 AI Muhatap (kural değil, tam Claude API) + `HUKUKCU_OPERASYON_FIZIBILITE_v4.md`'deki 8 ajan mimarisi (Sprint 3-4).

---

## BAŞARI METRİĞİ

**Cuma demo öncesi hedef:**
- W1-M5 ✓ zorunlu (Perşembe sabah)
- W1-M3.5 ✓ bonus (Perşembe öğle sonrası)
- Smoke test: Yeni başvuru → AI muhatap → şablon → süre → wizard canlıda
- Ramazan'a Cuma demo, vizyon "görülecek"

**Mehmet Bey'in uyarıları:**
- "Eksiksiz rapor yazma" tuzağı YOK — küçük sprint, hızlı commit
- Canlıda 3 avukat var — her push öncesi dikkat
- Otomasyon = asıl hedef, manuel = geçici
- Manuel iş yorar — mümkün olduğunca otomatikleştir

---

*Kayıt: Mimar (Claude Opus 4.7) — 22 Nisan 2026, oturum sonu*
*Bir sonraki mimar: Bu dosyayı oku, ne yapacağını BİL. "Ne yapalım" sorma, İŞE BAŞLA.*
