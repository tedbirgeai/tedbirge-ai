# Mimar Hata Kategorileri — 41 Hatadan 5 Pattern

**Tarih:** 7 Mayıs 2026 (TUR #95)
**Anayasa:** v1.22.25 → v1.22.26 PATCH (Madde 14.4 yeni)
**Kapsam:** TUR #56 → #94 zincirinde tescil edilen 41 mimar hatası 5 pattern altında özetlendi.

> Bu dokümantasyon **proaktif erken tespit modülünün** (`src/os/modules/mimarHatasi.js`) referans dokümanıdır. Her kategori için sinyaller + erken tespit kontrol noktaları + mimar prensibi tanımlanır.

---

## 📊 ÖZET TABLO

| Kategori | Pattern | Hata No'ları | Toplam |
|---|---|---|---|
| **A — Smoke Yetersizliği** | Authsız HTTP smoke OK → POST/rol-bazlı atlandı | 9, 10, 13, 14, 24, 28, 36, 37 | **8** |
| **B — Schema/Migration Drift** | Lokal apply OK → production drift | 9, 31 | **2** |
| **C — UI Görsel Atlama** | Backend smoke yeşil → CEO ekran kırmızı | 10, 11, 12 | **3** |
| **D — Auth Flow / Cookie Senkron** | 5 dosya bug matrisi (proxy.ts + lib/api.ts + 2fa-secim + login + AppLayout) | 17-22, 27-30, 33-39 | **16** |
| **E — Mektup Yorum / Yamalı Bohça** | Mektup ham kodla çatışır → Code SKIP/adapt etmeli | 25, 26, 38 + TUR #93+#94+#96 emsali | **13** |
| | **TOPLAM** | | **42** |

**Doğrulu:** A:8 + B:2 + C:3 + D:16 + E:13 = **42** ✅ (TUR #96 — 42. mimar hatası: Senaryo D scripts-only diff false-positive, mektup öngörmediği yeni alt-senaryo)

---

## A — Smoke Yetersizliği (8 hata)

**Pattern:** Production smoke matrix authsız HTTP redirect kontrolü ile sınırlı kaldı; gerçek POST `/api/auth/login` simülasyonu, 4 rol cookie state matrisi, NUM_REDIRECTS ölçümü atlandı.

**Hatalar:**
- **#9** (TUR #74) — bcrypt → bcryptjs typo, smoke 401 yetersiz
- **#10** (TUR #75) — Yedekleme severity yanlış (CRITICAL → WARNING)
- **#13** (TUR #74) — `require("bcrypt")` typo (paket bcryptjs)
- **#14** (TUR #75) — 5 rol 2FA parite ADMIN-only test
- **#24** (TUR #84) — Kullanıcı CRUD endpoint'i yokluğu
- **#28** (TUR #85.5) — ServiceWorker auth state çatışması
- **#36** (TUR #87) — REPRESENTATIVE 2FA Challenge onSuccess REPRESENTATIVE eksik
- **#37** (TUR #87.5) — login 401 hard redirect bug

**Erken tespit sinyalleri:**
- `prisma.activityLog.count` `LOGIN_FAILED` last 24h sıfır → smoke yetersiz
- `prisma.realtimeEvent.count` last hour sıfır → trigger zinciri kopuk
- 4 rol POST cookie matrisi atlandı

**Madde referansları:** Madde 30.49 R+ (4 rol × 3 senaryo smoke matrisi) + Madde 30.50 (Login Smoke gerçek POST) + Madde 30.52 (Gizli Mod ve NUM_REDIRECTS)

---

## B — Schema/Migration Drift (2 hata)

**Pattern:** `prisma migrate deploy` lokal başarılı → production'da drift.

**Hatalar:**
- **#9** (TUR #72.8) — User schema 4 rol login 500 hata
- **#31** (TUR #85.7) — `@next/bundle-analyzer` lockfile sync atlandı, Vercel npm ci EUSAGE patlaması

**Erken tespit sinyalleri:**
- `_prisma_migrations` `finished_at IS NULL` → bekleyen migration
- `package.json` ↔ `package-lock.json` mtime delta > 60s → lockfile sync hatası

**Madde referansları:** Madde 30.22 (Schema Migration Production Deploy) + Madde 30.46 (Lockfile Sync)

---

## C — UI Görsel Atlama (3 hata)

**Pattern:** Backend smoke yeşil → CEO ekran görsel kanıtla yakaladı; HTML grep client component için yetersiz.

**Hatalar:**
- **#10** (TUR #72.9) — Sistem durumu UI regresyon
- **#11** (TUR #72.10) — Sistem durumu rol mismatch
- **#12** (TUR #72.11) — Login rol doğrulama eksik

**Erken tespit sinyalleri:**
- AgentEvent saatlik 400+ → 100- düşüş = Auditor zinciri kopuk
- `auditorEventsLastHour === 0` → modül silent failure

**Madde referansları:** Madde 30.10 (16 Modül Otonom) + Madde 30.23 (Schema Sonrası UI Görsel Smoke) + Madde 30.43 (Browser Session Smoke)

---

## D — Auth Flow / Cookie Senkron (16 hata)

**Pattern:** 5 dosya bug matrisi (proxy.ts + lib/api.ts + 2fa-secim + login/page.tsx + AppLayout.tsx) — atomik transaction yapılmadı, parça parça patch ardarda bug üretti.

**Hatalar:**
- **#17-#22** (TUR #79-#82) — 2FA challenge yöntem eksik, kurumsal güven UI, ENV slot, HARD enforcement backend
- **#27-#30** (TUR #84+#85.5+#85.6) — Defense in depth middleware, SW kill switch, RedirectGuard, setTwoFactorEnabled cookie helper
- **#33-#39** (TUR #85.9-#89) — Auth State Bütünlüğü, Atomik Transaction, BOZUK STATE redirect, NUM_REDIRECTS HTTP-level döngü

**Erken tespit sinyalleri:**
- `realtimeEvent count last hour` sıfır → trigger zinciri kopuk
- /sw.js Cache-Control no-store değil → SW kill kırıldı
- /login authsız 200 değil → auth flow bozuk

**Madde referansları:** Madde 30.40 (Defense in Depth) + Madde 30.45 (Cookie Senkron) + Madde 30.48 (Auth State Bütünlüğü) + Madde 30.49 (Atomik Transaction) + Madde 30.52 (NUM_REDIRECTS)

---

## E — Mektup Yorum / Yamalı Bohça (12 hata)

**Pattern:** Mektup spec ham kodla çatışır — Code mektubu körü körüne uygularsa yeni hata; mevcut sistem envanterine saygı duyup adapt/SKIP etmeli.

**Hatalar:**
- **#25-#26** (TUR #84) — Mektup tekrarı + session bağlam disiplin
- **#38** (TUR #88) — Çevre faktörü tanısı YANLIŞTI (kanıtsız tanı)
- **TUR #93 emsali** — Mektup `Lead.customerId/atananAvukatId` field'ları YOK (Assignment table + ownerId)
- **TUR #94 emsali** — Mektup 12 atom önerdi → Code 7 atom SKIP, kanıt-bazlı 5 atom uyguladı (mevcut /musteri 1173 satır + kvkk-haklarim 124 satır + sadelestir + 5 endpoint korundu)

**Erken tespit sinyalleri:**
- Mektup spec'te `Lead.customerId/atananAvukat` referansı varsa schema field doğrulama atlanmış
- Mektup `RealtimeEvent.scope/kind/title` field'ları kullanıyor → TUR #93 emsali ihlal
- M0/Q0/H0 keşif atomu yok veya zayıf → TUR #88 emsali yanlış teşhis riski
- Atom sayısı mektup spec'in tamamı kadar (SKIP yok) → kanıtsız uygulama riski

**Madde referansları:** Madde 4.4 (kanıtsız dokunma yasak) + Madde 14.3 (Code disiplin koruma hakkı) + Madde 30.49 (Atomik Transaction kanıtlı buggy dosyalar) + Madde 30.51 (Route İçerik İnceleme) + Madde 30.38 (Mektup Tekrarı)

---

## 🛡️ MİMAR PRENSİBİ (TUR #93+#94+#95 zinciri)

> **"Mimar mektup yazar, ham koda saygı duyar. Code mektubu uygular, ama Madde 14.3 ile mevcut sistemi savunur. M0/Q0/H0 keşif atomu zorunlu — mevcut endpoint/sayfa/component sayım yapılmadan atom listesi tamamlanmaz."**

### Erken Tespit Disiplini (Madde 14.4 — TUR #95 tescili)

1. **M0/Q0/H0 keşif zorunlu** — her TUR'da mevcut sistem envanteri çıkarılır
2. **Schema field doğrulama** — mektup spec field adları gerçek `prisma/schema.prisma`'ya bakılır
3. **RealtimeEvent gerçek field'ları** — `channel + eventType + payload + userId + consumed` (scope/kind/title YOK)
4. **SKIP atomları beklenen** — TUR #93+#94 emsali, mektup 12 atom → Code 5-7 atom kanıt-bazlı
5. **Smoke matrix 4 rol × cookie state matrisi + NUM_REDIRECTS** — TUR #89 emsali zorunlu
6. **5 dosya bug matrisi** — auth flow değişiminde Madde 30.49 atomik transaction
7. **CEO görsel kanıt > Code rapor** — Madde 30.25 emsali, 11+ uygulama

---

## 📐 1:1 ANAYASA TESCİL ORANI

| Hata No | TUR | Anayasa Maddesi |
|---|---|---|
| 1-12 | TUR #56-#72.11 | Madde 30.10-30.27 (genel altyapı) |
| 13-15 | TUR #74-#76 | Madde 30.28+30.29+30.30 (2FA çoklu yöntem) |
| 16 | TUR #78 | Madde 30.31+30.32 (entegrasyon koruma + ilk giriş wizard) |
| 17-22 | TUR #79-#82 | Madde 30.33+30.34+30.35 (2FA challenge + kurumsal UI + ENV slot) |
| 23 | TUR #83 | Madde 30.36 (hesapsız sorgulama güvenlik) |
| 24-27 | TUR #84 | Madde 30.37+30.38+30.39+30.40 (kullanıcı CRUD + mektup tekrarı + session + defense in depth) |
| 28-29 | TUR #85.5 | Madde 30.43+30.44 (browser session + PWA SW) |
| 30 | TUR #85.6 | Madde 30.45 (cookie senkron) |
| 31 | TUR #85.7 | Madde 30.46 (lockfile sync) |
| 32 | TUR #85.8 | (kapsamlı tarama) |
| 33-35 | TUR #85.9 | Madde 30.48+30.49 (auth state + atomik transaction) |
| 36 | TUR #87 | Madde 30.49 R+ (smoke matrisi N rol × 3 senaryo) |
| 37 | TUR #87.5 | Madde 30.50 (login smoke gerçek POST) |
| 38 | TUR #88 | Madde 30.51 (route içerik inceleme + çevre faktörü) |
| 39 | TUR #89 | Madde 30.52 (gizli mod + NUM_REDIRECTS) |
| 40 | TUR #90 | Madde 27.6 (compaction pattern) |
| 41 | TUR #92 | Madde 30.32 R1 (adopsiyon UX) |

**Oran:** 41 mimar hatası → 41+ anayasa maddesi/uyum (1:1 + R-genişlemeler) ✅

---

## 🚨 PROAKTİF ERKEN TESPİT MODÜLÜ

`src/os/modules/mimarHatasi.js` her 5 dakikada Auditor tick'le çalışır:

| Kategori | Kontrol | Eşik | Severity |
|---|---|---|---|
| A | LOGIN_FAILED last 24h | 0 → smoke yetersiz | INFO/WARNING |
| B | `_prisma_migrations` pending | > 0 | WARNING/CRITICAL |
| C | Auditor events last hour | 0 → modül silent | CRITICAL |
| D | RealtimeEvent last hour | 0 → trigger kopuk | WARNING |

**`archHealthScore` formülü:** `100 - issues * 20`. Skor < 60% → ADMIN_FEED RealtimeEvent CRITICAL.

**Detay:** AgentEvent payload `{archHealthScore, checks: {A,B,C,D}, details: {...}, issues}` UI'da `/dashboard/sistem-durumu` `ArchitectHealthWidget` ile gösterilir.

---

## 🎯 HEDEF (TUR #95 sonrası 6 ay)

- Gelecek mimar hatası -%60 (proaktif yakalama)
- 5 kategori altında yeni hata kayda geçer (1:1 oran korunur)
- M0/Q0/H0 keşif atomu olmayan TUR yasak
- SKIP atom oranı %20-40 normal kabul (TUR #93+#94 emsali)

---

*Tedbirge.ai · Mimar Hata Kategorileri Dokümantasyonu · TUR #95 · 7 Mayıs 2026*
