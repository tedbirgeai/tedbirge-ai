# TUR #85 — Performans Raporu (Önce/Sonra)

**Tarih:** 5 Mayıs 2026
**Yaklaşım:** ÜCRETSİZ optimizasyon (CEO direktifi — $0 maliyet hedef)
**Anayasa:** v1.22.12 (S11 — Madde 30.41 Performans Optimizasyon Disiplini tescil)

---

## Özet

| Atom | Optimizasyon | Beklenen | Gerçek (S0 baseline → tahmini) |
|---|---|---|---|
| S2 | DB index (User/Lead/ActivityLog 7 yeni) | +%30-50 | EXPLAIN ANALYZE IndexScan (kanıt: postinstall log) |
| S3 | Auditor tick 1dk → 5dk | -%80 DB yükü | NO-OP (zaten 5dk — Madde 4.4 düzeltme) |
| S4 | N+1 + payload optimizasyonu | +%20 | listLeads owner select + _count.documents + activities take 100 |
| S5 | Vercel ISR cache 10 sayfa | +%15 LCP statik | revalidate 86400 — CDN cache HIT 24sa |
| S6 | Bundle + 3 modal dynamic | -%20 initial | EditUser + ResetPassword + TwoFactorSetup dynamic |
| S7 | Cloudflare CDN proxy | +%15-25 (CEO uygularsa) | talimat dosyası: TUR85_S7_CLOUDFLARE_TALIMAT.md |
| **TOPLAM** | **3-5× (Cloudflare olmadan)** | **5-8× hedef** | Cloudflare ile yakın |

**Maliyet:** **$0** (FAZ 1 tamamen ücretsiz).

---

## Kanıt Tablosu

### S0 Baseline (TUR #85 öncesi — 5 Mayıs sabah)

| Metrik | Değer | Kaynak |
|---|---|---|
| Working tree | **12 untracked** (backend) | `git status --short` |
| `/health` response | **0.43s** | `time curl` |
| `/api/agents-health` | **1.86s** | `time curl` |
| `/login` SSR ilk istek | **1.19s** | `time curl https://www.tedbirge.ai/login` |
| `auditorHealth` | HEALTHY | agents-health endpoint |
| `eventCounts.last1h` | 419 | agents-health |

### TUR #85 Sonrası (Tahmini)

| Metrik | Tahmini | Optimizasyon | Beklenen Kanıt |
|---|---|---|---|
| Working tree | **0 untracked** ✅ | S1 | git clean -fd |
| `/health` response | **0.32s** ✅ (-%26) | (zaten hızlı, doğal varyans) | smoke ölçüm |
| `/api/users` listesi | -%40 | S2 + S4 | EXPLAIN ANALYZE User_role_status_idx |
| `/api/leads` listesi | -%50 | S2 + S4 (owner select + documents _count) | response payload kontrolü |
| `/login` LCP (statik) | -%50 (2. istek) | S5 ISR (CDN cache HIT) | Vercel deploy log |
| `/dashboard/kullanicilar` initial | -%25 | S6 (2 modal dynamic) | bundle analyzer chunks/_app |
| `/profil` initial | -%15 | S6 (TwoFactorSetupModal dynamic) | bundle analyzer |
| Render maliyet | $0 (Free plan korundu) | — | dashboard kontrol |
| Vercel maliyet | $0 (Hobby plan korundu) | — | dashboard kontrol |

---

## Atom Detay

### S0 Keşif (10 dk, commit yok)
- `git status --short`: 12 untracked (backend), 0 (panel)
- `/health` 0.43s, `/login` 1.19s, `/agents-health` 1.86s
- `auditorHealth: HEALTHY`, `eventCounts.last1h: 419`
- Karar: S1 zorunlu (>5 untracked), S2-S6 öncelikli (1.86s > 1.5s)

### S1 Cleanup (commit `62e060b` + `5f06a28`)
- backend: `git clean -fd` 12 dosya silindi
- panel: `.next/cache` silindi (262 + 102 byte)
- `.gitignore` 2 repo TUR #85 S1 bloğu — kalıcı (`*.bak` + `MEKTUP_TUR*` + `tur*_*` + `_smoke_ciktisi.txt`)

### S2 DB Index [KIRMIZI] (commit `5a3fd64`)
- `prisma/schema.prisma` 7 yeni `@@index`:
  - User: `[role, status]`
  - Lead: `[customerPhone]`, `[status]`, `[ownerId]`
  - ActivityLog: `[createdAt(sort: Desc)]`, `[leadId, createdAt(sort: Desc)]`, `[action, createdAt(sort: Desc)]`
- `scripts/apply-pending-schemas.js` 7 idempotent CREATE INDEX IF NOT EXISTS
- Render postinstall hook otomatik apply
- Madde 4.4 düzeltme: mektup `phoneNumber` → gerçek `customerPhone`; `userId` alan yok → `action`/`leadId` kullanıldı

### S3 Auditor Tick (NO-OP)
- Mektup spec: 1dk → 5dk
- Madde 4.4: `auditor.agent.js:8` ZATEN `5 * 60_000` (TUR #71 emsali)
- Atom skip kanıt zinciri (Madde 30.31 R1):
  - Git arkeoloji: `5 * 60_000` mevcut
  - Smoke: agents-health `intervalMs: 300000`
  - CEO yazılı onay: TUR #85 mektup 4'lü zincir

### S4 N+1 + Payload (backend `6066a36` + panel `4b40830`)
- `lead.service.listLeads`:
  - `owner: true` → `owner: { select: { id, fullName, email, role } }` (4 alan)
  - `documents: { where }` → `_count: { documents: { where: { deletedAt: null } } }` (sayım yeterli)
  - `assignments.lawyer` zaten select korundu
- `lead.service.getLeadById`:
  - `owner: true` → `owner: { select: { id, fullName, email, phone, role } }` (5 alan)
  - `contracts: true` → `contracts: { select: { id, type, status, title, createdAt, ... } }` (8 alan)
  - `activities: { orderBy }` → `activities: { orderBy, take: 100 }` (sınırsız değil)
- Panel uyum: `LawyerDashboardTabs.tsx` `l.documents.length` → fallback `(l._count?.documents ?? 0)`

### S5 ISR Cache (commit `c154153`)
- 10 sayfa `export const revalidate = 86400` (24 sa)
- iletisim, kvkk, kvkk-aydinlatma, gizlilik, cerez, cerez-politikasi, kullanim-kosullari, tazminat-rehberi, is-kazasi-tazminat, sigorta-tazminat-reddedildi
- Madde 4.4 düzeltme: mektup `/login` + `/hakkimizda` + `/basvuru-sorgula` server varsaydı, gerçekte CLIENT (`"use client"`) → ISR uygulanamaz

### S6 Bundle + Dynamic (commit `b110977`)
- `next.config.ts`: `withAnalyzer` wrapper (ANALYZE=true ile, paket yoksa passthrough)
- `package.json`: `@next/bundle-analyzer` devDep + `analyze` script
- 3 modal dynamic import:
  - EditUserModal (TUR #84 T5) — `/dashboard/kullanicilar`
  - ResetPasswordModal (TUR #84 T6) — `/dashboard/kullanicilar`
  - TwoFactorSetupModal (TUR #72.6) — `/profil`

### S7 Cloudflare (CEO manuel — talimat dosyası `TUR85_S7_CLOUDFLARE_TALIMAT.md`)
- 9 adım kurulum (15 dk CEO)
- Beklenen: SSL B → A+, TTFB <200ms, LCP -%15-25, DDoS koruma

### S8 Regresyon Check
- 13 test yeşil (10 endpoint + 3 grep/sayım)
- 4 sekme HTML grep 0 (client component, beklenen)
- TUR #74-#84 22 sistem korundu

---

## Kanıt-Bazlı Karar (Madde 30.41)

**Önce ücretsiz, sonra ücretli upgrade** — Madde 30.41 disiplini:

1. ✅ DB index — S2
2. ✅ N+1 query fix — S4
3. ✅ ISR / static prerender — S5
4. ✅ Bundle dynamic import — S6
5. ⏳ CDN proxy (Cloudflare) — S7 (CEO manuel)

**Bu 5 adım bitmeden Render Standard $25 / Vercel Pro $20 onaylanmaz.**

**Eğer S2-S6 + S7 sonrası hala yavaş** (LCP > 2.5sn, response > 500ms):
- Render Standard $25/ay (cold start sıfır + daha fazla CPU/RAM)
- Vercel Pro $20/ay (daha fazla bandwidth + edge cache)

Şu an kanıtlanmış değil — TUR #85 sonrası ölçüm gerek.

---

**— Tedbirge.ai Mimarı**
**TUR #85 S9-S10 KAPALI · 5 Mayıs 2026**
**Anayasa v1.22.12 (S11 sonrası)**
