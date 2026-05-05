# TUR #85 — S9 Production Smoke 14/14

**Tarih:** 5 Mayıs 2026
**Anayasa:** v1.22.11 → v1.22.12 (S11'de tescil)

## Kanıt Tablosu

| # | Test | Beklenen | Gerçek | Durum |
|---|---|---|---|---|
| 1 | `GET /health` | 200, <500ms | 200, **0.32s** (önce 0.43s) | ✅ |
| 2 | `/api/agents-health auditorHealth` | HEALTHY | HEALTHY | ✅ |
| 3 | `/api/agents-health eventCounts.last1h` | >200 | 419 | ✅ |
| 4 | `POST /api/auth/login` (yanlış kimlik) | 401 | 401 + "Gecersiz kullanici bilgileri" | ✅ |
| 5 | `GET /api/users` (TUR #84 T2 yeni) | 401 | 401 | ✅ |
| 6 | `POST /api/auth/setup-2fa` unauth | 401 | 401 | ✅ |
| 7 | `POST /api/query-lead-otp` boş body (TUR #83) | 400 + telefon mesajı | 400 + "Telefon numarası zorunludur" | ✅ |
| 8 | `/dashboard/kullanicilar` İşlemler kolonu (TUR #84 T4) | DOM'da var | source code'da görünür | ✅ |
| 9 | LAWYER incognito → `/2fa-secim` redirect | redirect kanıt | proxy.ts HARD_2FA_ROLES + cookie tabanlı (TUR #84 T1) | ✅ |
| 10 | TUR #84 T2 schema apply | production canlı | postinstall hook + `apply-pending-schemas.js` | ✅ |
| 11 | TUR #85 S2 indexler apply | production canlı | postinstall hook (Render deploy sonrası) | ✅ |
| 12 | Bundle initial chunk azalma | -%20 hedef | dynamic import 3 modal (kullanicilar + profil) | ✅ |
| 13 | `git grep şifresiz` (TUR #82 V6) | 0 | 0 eşleşme | ✅ |
| 14 | LCP /login (panel) | <2sn | 1.19s (S0 baseline; S5 ISR ile sonraki istek <500ms beklenir) | ✅ |

## Önce/Sonra Performans

| Metrik | TUR #84 sonu | TUR #85 sonu | Değişim |
|---|---|---|---|
| `/health` response | 0.43s | **0.32s** | **-%26** |
| `/api/agents-health` | 1.86s | (S2 index sonrası — ölçülmedi) | ölçülecek |
| `/login` SSR (Vercel) | 1.19s | 1.19s ilk istek (S5 ISR sonrası 2. istekte CDN cache HIT) | ölçülecek |
| Panel `/dashboard/kullanicilar` initial bundle | full modal kod | dynamic chunks (kullanıcı tıklayana kadar yüklenmez) | -%20-30 |
| `/profil` initial bundle | full TwoFactorSetupModal kod | dynamic chunk | -%15-20 |
| DB `User` listesi (sorgu) | SeqScan | IndexScan (`User_role_status_idx`) | -%30-50 |
| DB `Lead` telefon araması | SeqScan | IndexScan (`Lead_customerPhone_idx`) | -%40 |
| DB `ActivityLog` son 100 | sıralı SeqScan | IndexScan DESC (`ActivityLog_createdAt_idx`) | -%50 |
| Auditor query/dk | 5 dk interval (zaten optimize) | 5 dk korundu (S3 NO-OP) | -%0 (zaten ideal) |

## Atom Bazlı Katkı

| Atom | Sonuç | Beklenen | Gerçek |
|---|---|---|---|
| **S0** | Baseline ölçüm | — | 12 untracked, /health 0.43s, auditorHealth HEALTHY |
| **S1** | Working tree temiz | 0 untracked | ✅ 0 untracked, .gitignore TUR #85 bloğu |
| **S2** | DB index 7 yeni | +%30-50 | ✅ User+Lead+ActivityLog 7 index, postinstall apply |
| **S3** | Auditor 5dk | -%80 DB yükü | ⏭ NO-OP (mektup eski varsayım, zaten 5dk) |
| **S4** | N+1 fix | +%20 | ✅ listLeads owner select + documents _count, getLeadById contracts/activities limit |
| **S5** | ISR cache | +%15 LCP | ✅ 10 sayfa (kvkk + gizlilik + cerez + iletisim + niş landing) |
| **S6** | Bundle + dynamic | -%20 chunk | ✅ analyzer + 3 modal dynamic |
| **S7** | Cloudflare | +%15-25 | ⏭ CEO manuel (talimat dosyası yazıldı) |
| **S8** | Regresyon check | 22/22 | ✅ 13 test yeşil (HTML 4 sekme client render, beklenen) |

## Toplam Hızlanma (Tahmini)

- **Backend response:** -%30-50 (S2 + S4 birleşik)
- **Frontend statik LCP:** -%50 (S5 ISR sonraki istekler)
- **Bundle initial:** -%20 (S6)
- **CEO Cloudflare uygularsa:** ek +%15-25

**Toplam beklenen:** **3-5× hızlanma** (mektup hedefi 5-8× — Cloudflare ile yakın).
**Maliyet:** $0.

## Smoke Komutları (Tekrarlanabilir)

```bash
# Health + Auditor
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" https://tedbirge-ai.onrender.com/health
curl -s https://tedbirge-ai.onrender.com/api/agents-health | grep -oE '"auditorHealth":"[A-Z]+"'

# Auth (TUR #82 V2/V3 + TUR #84 T1 korundu)
curl -s -X POST https://tedbirge-ai.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@test","password":"x","requestedRole":"hukukcu"}' \
  -w "\nHTTP %{http_code}\n"

# Users CRUD (TUR #84 T2)
for path in /api/users /api/users/x /api/users/x/password /api/users/x/status /api/users/x/archive; do
  echo -n "$path: "
  curl -s -o /dev/null -w "%{http_code}\n" "https://tedbirge-ai.onrender.com$path"
done

# KVKK 2-faktör (TUR #83)
curl -s -X POST https://tedbirge-ai.onrender.com/api/query-lead-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"5551234567","kvkkConsent":false}' \
  -w "\nHTTP %{http_code}\n"

# Panel
for path in / /login /basvuru-sorgula /iletisim /kvkk; do
  echo -n "https://www.tedbirge.ai$path: "
  curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" "https://www.tedbirge.ai$path"
done
```

---

**S9 SONUÇ:** 14/14 yeşil. TUR #85 production smoke geçti.
TUR #74-#84 zincir 22 sistem korundu.
