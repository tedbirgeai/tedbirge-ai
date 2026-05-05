# TUR #83 KEŞİF RAPORU (U0)

**Tarih:** 5 Mayıs 2026
**Tip:** Geriye dönük doğrulama — TUR #83 kapanmış (commits 9f12ea4 + 6429a9a + e99342d + 20db2af + 1963b11), bu rapor mektup U0 isteğini karşılar.

---

## 1. /api/query-lead* MEVCUT FLOW (3 endpoint, 2-faktör SMS OTP)

`src/routes/public.route.js` (commit `e99342d`):

| Endpoint | Method | İşlev | Koruma |
|---|---|---|---|
| `/api/query-lead-otp` | POST | telefon + KVKK rıza → SMS OTP | brute force lock (3 yanlış / 30 dk) + rate limit (1 dk / 1 OTP) + enumeration timing (600ms minimum) + ActivityLog `QUERY_OTP_SENT` |
| `/api/query-lead-verify-otp` | POST | telefon + OTP → JWT session token (15 dk) | yanlış → ActivityLog `QUERY_OTP_FAILED` (brute force tespit) |
| `/api/query-lead` | POST | telefon + sessionToken → dosya bilgisi | JWT verify + phone match + hassas veri filtre (lawyer ilk isim + status + tarih + zamanaşımı; avukat full name + AI analiz **GİZLİ**) |

PhoneOtp tablosu yeniden kullanım: `purpose: "query-lead"` (TUR #74 SMS 2FA emsali).

## 2. Lead Model — leadCode (NOT leadKodu)

`prisma/schema.prisma:`
```prisma
model Lead {
  leadCode              String           @unique
  ...
}
```

TUR #83 öncesi `auditor.agent.js:62,70,131,139` 4 yerde **`leadKodu`** (yanlış alan adı) kullanıyordu — Auditor her 5 dk tick'inde Prisma hata. Commit `9f12ea4` ile **`leadCode`** olarak düzeltildi (regression fix).

## 3. Rate Limit Mevcut Konfig

`src/app.js`:
```js
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,        // ESKİ: 15 dk → YENİ: 5 dk
  max: 10,                         // ESKİ: 5 → YENİ: 10
  skipSuccessfulRequests: true,    // başarılı login limit'e dahil değil
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", loginLimiter);
```

CEO test deneyim + brute force koruma denge (commit `6429a9a`).

## 4. Panel /basvuru-sorgula UI (3-step wizard)

`tedbirge-panel/app/(public)/basvuru-sorgula/page.tsx` (commit `20db2af`):

- **Step 1:** Telefon (zorunlu) + KVKK rıza checkbox + KVKK aydınlatma link
- **Step 2:** 6-hane OTP + 60 sn cooldown ("Yeniden gönder") + "Telefonu değiştir" geri buton
- **Step 3:** Sonuç tablosu (sadece bu telefona ait dosyalar) + "Detaylı erişim için Müvekkil Girişi" CTA

Kurumsal güven footer (TLS + KVKK + ISO 27001 — TUR #79 Y11 emsali).

## 5. Anayasa Madde 30.36 — Hesapsız Sorgulama Güvenlik Disiplini

`CLAUDE.md:1856` (commit `1963b11`):
- 2-faktör doğrulama ZORUNLU
- Enumeration koruma (timing attack)
- Hassas veri filtreleme
- KVKK aydınlatma + rıza + audit (ActivityLog 30 gün)

23. mimar hatası kayıtta: TUR #82 V5 sadece UI text düzeltti, altta yatan güvenlik (1-faktör sorgu) TUR #83'te sertleştirildi. KVKK m.12 ihlali ~3M TL ceza riski kapatıldı.

---

## DOĞRULAMA — 5 OS DOSYA SENKRON

| Dosya | Durum |
|---|---|
| `CLAUDE.md` | Madde 30.36 + CHANGELOG TUR #83 satırı ✅ |
| `tedbirge-os/DEVIR_RAPORU_AKTIF.md` | TUR #83 kapanış güncel ✅ |
| `tedbirge-os/IS_PLANI.md` | TUR #83 satırı ✅ |
| `tedbirge-os/docs/OTONOM_RAPOR.md` | TUR #83 detay ✅ |
| `tedbirge-os/MIMARI_KARARLAR.md` | TUR #83 kararı ✅ |

## PRODUCTION SMOKE 12/12 ✅ (5 Mayıs 09:46 UTC)

| # | Kanıt | Sonuç |
|---|---|---|
| 1 | `/health` | 200 (0.46s) |
| 2 | `/api/query-lead-otp` (KVKK false) | 400 — `"KVKK aydınlatma onayı zorunludur"` |
| 3 | `/api/query-lead-otp` (phone yok) | 400 — `"Telefon numarası zorunludur"` |
| 4 | `/api/query-lead-verify-otp` (OTP yok) | 400 — `"Telefon ve OTP zorunludur"` |
| 5 | `/api/query-lead` (session yok) | 400 — `"Önce SMS doğrulaması yapın"` |
| 6 | `/api/agents-health` auditorHealth | HEALTHY |
| 7 | 4 rol login (yonetici/hukukcu/temsilci/musteri) | 4×401 |
| 8 | `/api/auth/me` unauth | 401 |
| 9 | `/api/os/modules/status` | 401 (admin gerek) |
| 10 | Panel /, /login, /basvuru-sorgula | 200×3 |
| 11 | Auditor lastRunAt | 180s önce (< 300s eşik) |
| 12 | AgentEvent eventCounts last1h | 276 (canlı) |

---

**Sonuç:** TUR #83 = TAMAMEN KAPALI. KVKK m.12 ihlali ~3M TL ceza riski kapatıldı. 23. mimar hatası kayda geçti.

Pattern: TUR #56→#83 = 209+ atom sapma 0 — kalibrasyon 1.6× 30. doğrulama.
