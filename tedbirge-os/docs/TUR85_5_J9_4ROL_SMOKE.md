# TUR #85.5 — J9 4 Rol Browser Session Smoke Belgesi

**Tarih:** 5 Mayıs 2026 akşam
**Anayasa:** v1.22.12 → v1.22.13 (J11 sonrası)
**Yöntem:** CEO incognito test sırasında doğrulanacak senaryo matrisi
**Hedef:** TUR #85.5 hotfix sonrası 4 rol uçtan uca akış sağlaması

## Madde 30.43 — Browser Session Smoke Disiplini (J11'de tescil)

Endpoint curl smoke (HTTP status code) **yetersiz** — bu belge gerçek browser session'ının doğrulayacağı 12+ senaryoyu tarif eder.

---

## Senaryo Matrisi (12 senaryo + 12 kontrol noktası)

### A. ADMIN (Yönetici) — TOTP aktif (CEO TOTP korundu — TUR #76+#79)

| # | Adım | Beklenen | Bağıl TUR |
|---|---|---|---|
| A1 | `/login?rol=yonetici` → `tedbirge42@gmail.com` + şifre | 2FA Challenge ekranı (TOTP) | TUR #79 |
| A2 | TOTP 6 hane → submit | `/dashboard` ADMIN paneli açılır | TUR #84 |
| A3 | DevTools → Application → Cookies | `tedbirge_token` + `tedbirge_role=ADMIN` + `tedbirge_2fa_enabled=1` üçü atomik set | TUR #84 T1 |
| A4 | `/dashboard/kullanicilar` → ⋮ İşlemler kolonu | 5 işlem dropdown (Düzenle/Şifre/Pasif/Arşiv/Sil) | TUR #84 T4 |
| A5 | F5 refresh | Aynı sayfa (redirect yok) | TUR #85.5 J1 |

### B. LAWYER (Hukukçu) — yeni hesap, 2FA yok

| # | Adım | Beklenen | Bağıl TUR |
|---|---|---|---|
| B1 | `/login?rol=hukukcu` → email + şifre | login response `requiresTwoFactorSetup: true` + `redirectTo: /2fa-secim` | TUR #82 V2 |
| B2 | Otomatik `/2fa-secim` redirect | 4-step wizard (3 yöntem radio: TOTP/SMS/Email) | TUR #78 X7 |
| B3 | TOTP seç → QR kodu + 6 hane → 10 backup TXT İndir | 2FA aktive | TUR #74 |
| B4 | Backup kod indirildikten sonra "Devam Et" | `/dashboard` (LAWYER izinli prefix) | proxy.ts ROLE_ALLOWED_ROUTES |
| B5 | DevTools → Cookies | `tedbirge_role=LAWYER` + `tedbirge_2fa_enabled=1` | TUR #85.5 J1 |
| B6 | AppLayout sol menü | LAWYER spesifik items: "Dosyalarım", "Hukukçu Paneli", "Günlük Ajanda" | TUR #57 (Madde 31.9) |

### C. REPRESENTATIVE (Temsilci)

| # | Adım | Beklenen | Bağıl TUR |
|---|---|---|---|
| C1 | `/login?rol=temsilci` → email + şifre | `requiresTwoFactorSetup: true` → `/2fa-secim` | TUR #82 V2 |
| C2 | SMS yöntem seç → NetGSM kod gönderildi | provider code='00' (TUR #81 + CEO ENV) | TUR #74+#81 |
| C3 | 6 hane SMS OTP doğrula | 2FA aktive, `/temsilci` redirect | proxy.ts defaultLanding |
| C4 | DevTools → Cookies | `tedbirge_role=REPRESENTATIVE` + `tedbirge_2fa_enabled=1` | TUR #85.5 J1 |
| C5 | `/dashboard` direkt URL | `/temsilci` redirect (proxy.ts isAllowed false) | proxy.ts |

### D. CUSTOMER (Müvekkil) — SOFT 2FA

| # | Adım | Beklenen | Bağıl TUR |
|---|---|---|---|
| D1 | `/login?rol=musteri` → email + şifre | login response `twoFactorReminder: true` (engelleme yok) | TUR #82 V2 |
| D2 | Otomatik `/musteri` redirect | Müvekkil paneli açılır | proxy.ts |
| D3 | DevTools → Cookies | `tedbirge_role=CUSTOMER` + `tedbirge_2fa_enabled=0` (engelleme yok) | TUR #85.5 J1 |
| D4 | `/dashboard` direkt URL | `/musteri` redirect | proxy.ts |

### E. Cross-role mismatch (KVKK m.12 koruma — TUR #72.10)

| # | Adım | Beklenen |
|---|---|---|
| E1 | `/login?rol=temsilci` → ADMIN email + ADMIN şifre | 403 toast: *"Yetkisiz işlem: bu hesap 'Yönetici' rolüne ait. Lütfen 'Yönetici' sekmesinden giriş yapın."* |
| E2 | Otomatik sekme geçişi | Yönetici sekmesi seçili (UI auto-switch) |

### F. Brute force koruma (TUR #83 + TUR #85 S2 rate limit)

| # | Adım | Beklenen |
|---|---|---|
| F1 | 3 yanlış şifre denemesi | 30 dk lock + "Çok fazla giriş denemesi" mesajı |
| F2 | 5 dk içinde 10 deneme limiti | 429 + 5 dk bekleme |

### G. Hesapsız Sorgulama (TUR #83 koruma)

| # | Adım | Beklenen |
|---|---|---|
| G1 | `/basvuru-sorgula` 3-step wizard | Step 1: telefon + KVKK rıza checkbox |
| G2 | KVKK rıza vermezse | 403 + "KVKK aydınlatma onayı zorunludur" |
| G3 | KVKK + telefon → SMS OTP | Step 2: 6 hane + 60 sn cooldown + "Telefonu değiştir" |
| G4 | OTP doğru → sonuç | Step 3: lawyer ilk isim + status + tarih + zamanaşımı (avukat full name + AI analiz GİZLİ) |

### H. Yetkisiz dashboard erişim (proxy.ts isAllowed)

| # | Adım | Beklenen |
|---|---|---|
| H1 | LAWYER logged-in → `/dashboard/kullanicilar` URL | 307 redirect → `/dashboard` (LAWYER izinli prefix) veya 403 |
| H2 | CUSTOMER logged-in → `/dashboard` URL | 307 redirect → `/musteri` (defaultLanding) |
| H3 | REPRESENTATIVE logged-in → `/dashboard` URL | 307 redirect → `/temsilci` |

### I. Logout

| # | Adım | Beklenen |
|---|---|---|
| I1 | Logout button | clearToken() → 3 cookie atomik temizlik + localStorage temizle |
| I2 | Logout sonrası `/dashboard` URL | 307 redirect → `/login` (token yok) |

### J. ServiceWorker kontrolü (TUR #85.5 J1 KRİTİK)

| # | Adım | Beklenen |
|---|---|---|
| J1 | DevTools → Application → Service Workers | "redundant" veya boş (eski SW kill switch ile kendini sildi) |
| J2 | Network sekmesi → "Fulfilled by" sütunu | (memory cache) veya boş — **(ServiceWorker) bayrağı YASAK** |
| J3 | Refresh sonrası | SW kayıtlı değil (yeni `public/sw.js` kill switch + PwaProvider register kaldırıldı) |

### K. Refresh resilience

| # | Adım | Beklenen |
|---|---|---|
| K1 | `/lawyer-dashboard` → F5 | Aynı sayfa korundu, redirect yok |
| K2 | 1 saat sonra refresh | Token hala geçerli (7 gün cookie + 7 gün JWT exp) → sayfa korundu |

### L. Redirect Guard (TUR #85.5 J7 defansif önlem)

| # | Adım | Beklenen |
|---|---|---|
| L1 | Manuel test (cookie zorla bozarak) → 5+ redirect tetikle | RedirectGuard cookie temizler + `/login?redirect_guard=1` redirect |
| L2 | `/login?redirect_guard=1` toast | "Yeniden yönlendirme döngüsü tespit edildi. Hesabınızdan çıkış yapıldı, lütfen yeniden giriş yapın." |

---

## Cookie State Smoke Tablosu

| Aşama | tedbirge_token | tedbirge_role | tedbirge_2fa_enabled |
|---|---|---|---|
| Login formu (giriş yapılmamış) | yok | yok | yok |
| Login submit (HARD rol + 2FA yok) | jwt | ROL | 0 |
| 2FA setup wizard tamamlandı | yeni jwt | ROL | 1 |
| 2FA challenge (login mevcut 2FA) sonrası | yeni jwt | ROL | 1 |
| Logout | yok | yok | yok |
| RedirectGuard halt | yok (silindi) | yok | yok |

---

## Cache Header Smoke (TUR #85.5 J1 next.config.ts)

| Endpoint | Beklenen Header |
|---|---|
| `https://www.tedbirge.ai/sw.js` | `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` + `Service-Worker-Allowed: /` |
| `https://www.tedbirge.ai/login` | `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` + `Pragma: no-cache` |
| `https://www.tedbirge.ai/2fa-secim` | aynı |
| `https://www.tedbirge.ai/dashboard` | aynı |

Smoke komutu:
```bash
curl -I https://www.tedbirge.ai/sw.js
curl -I https://www.tedbirge.ai/login
```

---

## DevTools Network Beklenen (Image karşı kanıt)

**Önce (CEO Image 1, 5 Mayıs 17:05 — bug):**
- 324 request, 22.1 KB
- "Fulfilled by: (ServiceWorker)" tüm 307 redirect
- `/dashboard` ↔ `/2fa-secim` ping-pong
- ERR_TOO_MANY_REDIRECTS

**Sonra (TUR #85.5 hotfix sonrası beklenen):**
- < 50 request normal sayfa
- "Fulfilled by" sütunu boş veya (memory cache)
- Redirect zinciri max 1-2 hop
- Cookie atomik 3 set/clear

---

## Çıktı Kabul Kriteri

**12/12 yeşil → TUR #85.5 KAPALI**
**< 12/12 → DUR + raporla**

Smoke geçmeyen senaryo CEO browser test sırasında raporlanır → Mimar oturumu açılır → revert + revize.

CEO browser test (~10 dk) — Edge "siteler için verileri temizle" tedbirge.ai sonrası incognito 4 rol senaryosu.

---

**— Tedbirge.ai Mimarı**
**TUR #85.5 J9 SMOKE BELGESİ · 5 Mayıs 2026**
**Anayasa v1.22.13 (J11 sonrası)**
