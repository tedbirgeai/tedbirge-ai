# TUR #85 S7 — Cloudflare Proxy CEO Manuel Kurulum Talimatı

**Tarih:** 5 Mayıs 2026
**Tip:** CEO manuel atom (Mimar/Code GitHub repo dışı)
**Beklenen kazanç:** %15-25 LCP iyileşme + DDoS koruma + SSL B → A grade
**Süre:** ~15 dakika
**Maliyet:** $0 (Cloudflare Free plan)

---

## Önkoşul

- Domain: `tedbirge.ai`
- Domain registrar erişimi (GoDaddy / Namecheap / vb.)
- DNS yönetim yetkisi (CEO Mehmet DİNÇ)

---

## 9 Adım Kurulum

### 1. Hesap Aç
- https://cloudflare.com → "Sign Up"
- E-posta: `mehmet@tedbirge.ai` (önerilen)
- Şifreyi güvenli yöneticide saklayın
- 2FA aktif et (KVKK m.12 uyumlu — Authenticator app önerilir)

### 2. Domain Ekle
- Dashboard → "Add a Site"
- `tedbirge.ai` yaz → "Continue"
- Plan seç: **Free** ($0/ay)
- Cloudflare otomatik DNS records keşfeder (~30 sn)

### 3. DNS Records Doğrula
Cloudflare bulduğu kayıtları gösterir. Şunlar olmalı:
- A record: `tedbirge.ai` → Vercel IP (gri bulut yeterli, turuncu = proxy)
- A record: `www.tedbirge.ai` → Vercel IP
- CNAME: `tedbirge-ai.onrender.com` → Render hedef (gri bulut — backend proxy YASAK, geçer)
- TXT: SPF/DMARC (varsa email)

**Önemli:** İlk kurulumda **gri bulut** (DNS only) bırak. Sonra adım 7'de turuncu (proxy) açılır.

### 4. Nameserver Değiştir
Cloudflare 2 nameserver verir, örn:
- `kashif.ns.cloudflare.com`
- `mira.ns.cloudflare.com`

CEO domain registrar'a giriş → DNS / Nameserver ayarları → mevcut nameserver'ları **siler**, Cloudflare'in 2'sini **yazar**.

**DNS propagation:** 5 dk – 24 sa (genelde 30 dk).

**Doğrulama:** `https://www.whatsmydns.net/#NS/tedbirge.ai` — globalde Cloudflare nameserver'ları görünmeli.

### 5. SSL/TLS Ayarı
- Cloudflare Dashboard → SSL/TLS → Overview
- **Encryption Mode: Full (strict)** seç
  - Vercel ve Render zaten valid SSL kullanır → strict modu güvenli

### 6. Speed → Auto Minify
- Cloudflare Dashboard → Speed → Optimization
- **Auto Minify:** HTML ✅ + CSS ✅ + JavaScript ✅
- **Brotli compression:** ON
- **Early Hints:** ON (HTTP 103 ile preload — LCP iyileşme)

### 7. Caching → Standard + Page Rules
- Caching → Configuration → **Cache Level: Standard**
- Browser Cache TTL: **4 saat**

**Page Rules** (Free plan = 3 rules limit):
1. `tedbirge.ai/api/*` → Cache Level: **Bypass** (API'ler cache'lenmesin)
2. `tedbirge.ai/_next/static/*` → Cache Level: **Cache Everything** + Edge TTL: **1 ay**
3. `tedbirge.ai/*` → Cache Level: **Standard** + Edge TTL: **1 saat**

**Gri bulut → Turuncu (Proxy ON):**
- Adım 3'te DNS records kontrol et → A records (`tedbirge.ai`, `www.tedbirge.ai`) yanındaki bulut iconuna tıkla → **turuncu** olmalı (proxy aktif)
- API endpoint backend (`tedbirge-ai.onrender.com`) **gri** kalır (CNAME, proxy etmez)

### 8. Always Online
- Cloudflare Dashboard → Caching → Configuration
- **Always Online: ON** (Vercel/Render down olursa son cached sürüm görünür)

### 9. Ek Güvenlik (Opsiyonel ama Önerilen)
- Security → Settings → **Security Level: Medium**
- Security → Settings → **Bot Fight Mode: ON** (free plan, basit bot koruma)
- Firewall Rules → "Block known bad IPs" (free plan, otomatik)

---

## Kanıt + Doğrulama (CEO uygulayınca)

### A. DNS Propagation
```
https://dns.google/query?name=tedbirge.ai&type=A
```
Beklenen: A record Cloudflare proxy IP (104.x.x.x veya 172.x.x.x).

### B. SSL Grade
```
https://www.ssllabs.com/ssltest/analyze.html?d=tedbirge.ai
```
Beklenen: **A+** (önce muhtemelen B).

### C. CDN Cache Hit Test
```bash
curl -I https://www.tedbirge.ai/_next/static/css/<chunk>.css
```
Beklenen: `cf-cache-status: HIT` (ikinci istekte).

### D. TTFB (Time to First Byte)
- WebPageTest.org → tedbirge.ai → Türkiye-dışı sunucudan test
- Beklenen TTFB: <200ms (önce 500ms+).

### E. Lighthouse (Türkiye-içi simülasyon)
- Chrome DevTools → Lighthouse → Performance
- Beklenen LCP: <2.5sn (önce 3-4sn olabilir).

---

## Risk + Önlemler

### Risk 1: DNS Koparsa Site Offline
- **Önlem:** Adım 4'ten ÖNCE registrar'da TTL'i **5 dk** yap (24 saat değil).
- Sorun olursa eski nameserver'ları geri yazıp 5 dk içinde restore.

### Risk 2: SSL Strict Mode Backend'i Bozarsa
- **Önlem:** Önce Adım 5'te "Full (strict)" yerine **"Full"** dene (strict olmayan).
- Test sonrası strict'e geçirilebilir.

### Risk 3: API Cache'lenirse Auth Bozulur
- **Önlem:** Adım 7 Page Rule #1 (`/api/*` → Bypass) ZORUNLU.
- Auth token'ları cache'lenmemeli.

### Risk 4: Email Servisi Bozulması
- **Önlem:** Adım 3'te MX records korunmalı (Cloudflare otomatik ekler ama doğrula).
- TXT records (SPF/DMARC) korunmalı.

---

## CEO Yapınca Sonraki Adım

CEO Cloudflare kurulumunu tamamladığında:

1. `tedbirge-os/DEVIR_RAPORU_AKTIF.md` "S7 ✅ <timestamp>" işaretle
2. Cloudflare Dashboard → Analytics → ilk 24 saat kanıt screenshot al
3. SSL grade kanıtı (B → A+)
4. TTFB önce/sonra ölçüm

---

## Önemli Notlar

- **Mektup spec:** Bu dosya CEO talimatı, Mimar/Code uygulamaz (atom skip + DEVIR not).
- **Madde 4.1 ekosistem:** Cloudflare ek katman, mevcut sistemler (Vercel + Render + Supabase) üstüne proxy.
- **Madde 18.3 KIRMIZI nokta:** Domain nameserver değişimi = geri alınabilir AMA DNS propagation süresi var. CEO 5 dk TTL ile risk azalır.
- **Madde 30.41 emsali:** Cloudflare = ücretsiz CDN, Render Standard ($25/ay) öncesi denenmesi zorunlu performans optimizasyon adımı.

---

**— Tedbirge.ai Mimarı (TUR #85 S7 — Mimar/Code skip + CEO manuel)**
**Tarih:** 5 Mayıs 2026
