# FAZ 4-A MİNİ KEŞİF — REKLAM ALTYAPISI ZEMİN RAPORU
## Madde 21.2 Salt Okuma — Sıfır Kod Değişikliği

**Tarih:** 27 Nisan 2026 (gece sonu)
**Mimar:** Claude Code (Sonnet 4.6)
**Yöntem:** Madde 21.2 sağlık taraması (mini, dar kapsam)
**Hedef:** FAZ 4-A mimar mektubuna kanıt zemini sağlamak

---

## YÖNETİCİ ÖZETİ

| Soru | Cevap | Kanıt |
|---|---|---|
| Lead modelinde UTM alanları var mı? | KISMEN — 3/5 alan var | G-A1 |
| Public lead endpoint UTM yakalıyor mu? | EVET (3 alan, query+body) | G-A2 |
| Frontend UTM yakalama çalışıyor mu? | KISMEN — cross-page persistence YOK | G-A3 |
| /api/analytics/marketing ne dönüyor? | UTM kırılımı + funnel + skor dağılımı | G-A4 |
| GA4 özel event tetikliyor mu? | HAYIR — sadece temel pageview | G-A5 |
| Cookie consent → GA4 tetik mantığı | window.dispatchEvent → GA4 yükleniyor | G-A6 |
| qualificationScore çalışıyor mu? | EVET — async, 0-100, lead oluşturma sonrası | G-A7 |
| Sitemap niş landing'leri içeriyor mu? | EVET — 3/3 landing sitemap'te | G-A8 |

**FAZ 4-A için en kritik 3 bulgu:**
1. **GA4 özel event sıfır** — Form submit / conversion event hiç tetiklenmiyor. Google Ads conversion API için gerekli event altyapısı tamamen eksik. (G-A5)
2. **UTM cross-page persistence yok** — UTM yalnızca form submit anında `window.location.search`'ten okunuyor. Landing page'den farklı sayfaya geçilirse UTM kayboluyor. (G-A3)
3. **AIUsageLog dataSent maskelenmemiş** — ai.service.js:17'de 200 karakter ham snippet (belge içeriği — potansiyel PII) maskelenmeden loglanıyor. (G-A7)

---

## G-A1 — Lead Modeli UTM Alanları

```
prisma/schema.prisma satır 255–257:
255:  utmSource             String?
256:  utmMedium             String?
257:  utmCampaign           String?
```

**Sonuç:**
- Mevcut: `utmSource String?`, `utmMedium String?`, `utmCampaign String?` — 3 alan
- YOK: `utmTerm`, `utmContent` (Google Ads keyword ve reklam içerik takibi için gerekli)
- YOK: `referrer` (organik trafik kaynak takibi)
- YOK: `landingPage` (hangi URL'den form dolduruldu)

---

## G-A2 — Public Lead Endpoint UTM Yakalama

```
src/routes/public.route.js satır 46–62:
46:    const utmSource   = req.query.utm_source   || req.body.utm_source   || null;
47:    const utmMedium   = req.query.utm_medium   || req.body.utm_medium   || null;
48:    const utmCampaign = req.query.utm_campaign || req.body.utm_campaign || null;
...
60:      utmSource:   utmSource   ? String(utmSource).slice(0, 100)   : null,
61:      utmMedium:   utmMedium   ? String(utmMedium).slice(0, 100)   : null,
62:      utmCampaign: utmCampaign ? String(utmCampaign).slice(0, 100) : null,

src/services/lead.service.js satır 38–40:
38:      utmSource: data.utmSource || null,
39:      utmMedium: data.utmMedium || null,
40:      utmCampaign: data.utmCampaign || null,
```

**Sonuç:**
- Backend hem `req.query` hem `req.body`'den UTM alıyor — FormData POST için body yolu aktif
- 100 karakter limit var (güvenlik)
- `createLead` servisi tüm 3 UTM parametresini opsiyonel olarak alıyor
- `utmTerm`, `utmContent` backend'e de geçmiyor (şema eksikliği ile tutarlı)

---

## G-A3 — Frontend UTM Yakalama

```
tedbirge-panel/app/(public)/basvuru/page.tsx satır 210–225:
210:  const _search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
211:  const utmSource   = _search?.get("utm_source")   || "";
212:  const utmMedium   = _search?.get("utm_medium")   || "";
213:  const utmCampaign = _search?.get("utm_campaign") || "";
...
223:  if (utmSource)   fd.append("utm_source",   utmSource);
224:  if (utmMedium)   fd.append("utm_medium",   utmMedium);
225:  if (utmCampaign) fd.append("utm_campaign", utmCampaign);
```

**Sonuç:**
- UTM yakalama: `window.location.search` — `useSearchParams` ile değil (Suspense sorunundan döndürüldü)
- Çalıştığı durumlar: Kullanıcı doğrudan `/basvuru?utm_source=google&utm_medium=cpc&utm_campaign=trafik` URL'siyle gelirse çalışır
- Cross-page persistence: YOK — sessionStorage/localStorage'a yazılmıyor
- Kayıp senaryosu: Kullanıcı landing page'e gelir (`/trafik-kazasi-tazminat?utm_source=google`) → oradan `/basvuru`'ya tıklarsa UTM parametreleri yeni URL'e taşınmadıkça kaybolur
- `utm_term`, `utm_content`: frontend'de de yakalanmıyor

---

## G-A4 — /api/analytics/marketing Detay

```
src/routes/analytics.routes.js satır 19:
19:  router.get("/marketing", auth, role("ADMIN"), controller.getMarketingMetrics);

src/controllers/analytics.controller.js satır 81–134:
81:  const [leadsBySource, leadsByUtmSource, leadsByUtmCampaign, leadsByStatus, allLeads, dailyLeads] =
82:    await Promise.all([
83:      prisma.lead.groupBy({ by: ["source"], ... }),
88:      prisma.lead.groupBy({ by: ["utmSource"], ... utmSource: { not: null } }),
93:      prisma.lead.groupBy({ by: ["utmCampaign"], ... utmCampaign: { not: null } }),
98:      prisma.lead.groupBy({ by: ["status"], ... }),
103:      prisma.lead.findMany({ select: { qualificationScore: true } }),
107:      prisma.$queryRaw`SELECT DATE("createdAt") as date, COUNT(*)::int as count ...`
    ]);
117:  const scoreDistribution = {
118:    yuksek: ...(qualificationScore >= 70),
119:    orta:   ...(40 <= qualificationScore < 70),
120:    dusuk:  ...(0 < qualificationScore < 40),
121:    hesaplanmadi: ...(!qualificationScore),
```

**Sonuç:**
- Mevcut endpoint'ler (10 adet): funnel, conversion, revenue, by-source, lawyer-performance, monthly-trend, calendar, komisyon, bilirkisi-summary, **marketing**
- `/marketing` sadece ADMIN rolüne açık — doğru
- Hesaplanan metrikler: UTM Source kırılımı, UTM Campaign kırılımı, status funnel, qualificationScore dağılımı (yüksek/orta/düşük/hesaplanmadı), günlük lead trend, kaynak bazlı sayım
- **Eksik**: UTM Medium kırılımı (şemada var, sorguda yok), conversion rate (sözleşme → tahsilat), CPL (pazarlama harcaması backend'e girmediği için hesaplanamaz), ROI

---

## G-A5 — GA4 Frontend Entegrasyonu

```
tedbirge-panel/components/GoogleAnalytics.tsx satır 1–42:
 8:  const gaId = process.env.NEXT_PUBLIC_GA4_ID;
10:  useEffect(() => {
12:    const consent = document.cookie.includes("tedbirge_cookie_consent=true");
...
21:  if (!gaId || !consentGiven) return null;
25:    <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
29:    <Script id="ga4-init" strategy="afterInteractive">
31:      window.dataLayer = window.dataLayer || [];
32:      function gtag(){dataLayer.push(arguments);}
34:      gtag('config', '${gaId}', {
35:        anonymize_ip: true,
36:        cookie_flags: 'SameSite=None;Secure',
```

**Sonuç:**
- GA4 ID env: `NEXT_PUBLIC_GA4_ID` — Vercel env'de tanımlı olması gerekiyor (değer maskelendi)
- Script strategy: `afterInteractive` — doğru
- anonymize_ip: `true` — KVKK uyumlu
- Özel event: SIFIR — `gtag('event', ...)` çağrısı yok
- Form submit event: YOK
- Button click event: YOK
- Conversion event: YOK
- Google Ads conversion API bağlantısı: YOK

---

## G-A6 — Cookie Consent + Analytics

```
tedbirge-panel/components/CookieConsent.tsx satır 19–53:
19:  <CookieConsent
21:    cookieName="tedbirge_cookie_consent"
22:    buttonText="Tümünü Kabul Et"
23:    declineButtonText="Reddet"
24:    enableDeclineButton
...
49:    onAccept={() => {
51:      window.dispatchEvent(new Event("cookie-consent-accepted"));
    }}

tedbirge-panel/components/GoogleAnalytics.tsx satır 16–18:
16:    const handler = () => setConsentGiven(true);
17:    window.addEventListener("cookie-consent-accepted", handler);
18:    return () => window.removeEventListener("cookie-consent-accepted", handler);
```

**Sonuç:**
- Tetikleme yöntemi: `window.dispatchEvent(new Event("cookie-consent-accepted"))` → GoogleAnalytics dinliyor → state güncelleniyor → Script yükleniyor
- Kabul akışı: Çalışıyor
- Red durumunda davranış: `onDecline` handler YOK — `react-cookie-consent` reddetme cookie'si set etmiyor (sadece banner'ı kapatıyor). Sonraki ziyarette banner tekrar görünür. GA4 yüklenmiyor — doğru.
- "Özelleştir" seçeneği: YOK — sadece "Tümünü Kabul Et" + "Reddet"
- Meta Pixel / TikTok Pixel bağlantısı: YOK (Mehmet Bey kararı: Meta Pixel YOK — tutarlı)

---

## G-A7 — qualificationScore + AIUsageLog

```
src/services/analyzer.service.js satır 146–198:
146: async function calculateQualificationScore(leadId) {
150:   const apiKey = process.env.ANTHROPIC_API_KEY;
151:   if (!apiKey) return; // mock ortamda sessizce cik
163:   if (!lead || !lead.accidentSummary || lead.accidentSummary.trim().length < 20) return;
165:   const prompt = `...Ozet: ${lead.accidentSummary.slice(0, 800)}...`
170:   Sadece JSON don: {"score": <0-100 tam sayi>, "reason": "<en fazla 1 cumle Turkce>"}
174:   const client = new Anthropic.default({ apiKey });
176:     model: QUALIFY_MODEL,     // "claude-sonnet-4-6"
177:     max_tokens: 100,
191:   await prisma.lead.update({ data: { qualificationScore: Math.round(score) } });

src/services/lead.service.js satır 75–78:
75:  // Nitelendirme skoru — async, bloke etmez
76:  calculateQualificationScore(lead.id).catch((err) =>
77:    console.error("[QUALIFY] Skor tetiklenemedi:", err.message)
78:  );

src/services/ai.service.js satır 12–38:
17:    const dataSent = `hash:${hash} | snippet:${(inputText || "").slice(0, 200)}`;
24:    await prisma.aIUsageLog.create({
25:      data: { userId, leadId, aiService: `anthropic/${MODEL}`, purpose,
26:        inputSize, outputSize, dataSent, latencyMs }
```

**Sonuç:**
- Hesaplama modu: **async fire-and-forget** (`.catch()` ile, bloke etmiyor)
- Tetikleme noktası: `lead.service.js:76` — lead oluşturulduktan hemen sonra
- Skor aralığı: 0-100 tam sayı (`Math.round`)
- Model: `claude-sonnet-4-6`
- Minimum koşul: `accidentSummary` >= 20 karakter
- Mock mod: `ANALYSIS_MODE=mock` ise sessizce çıkıyor (skor null kalıyor)
- AIUsageLog yazma noktası: **1 adet** — `ai.service.js:logAIUsage()` — `userId` yoksa sadece console.log, veritabanına yazmıyor
- **Maskeleme durumu: EKSİK** — `dataSent` alanında `snippet:${inputText.slice(0, 200)}` ham 200 karakter metin gidiyor. Belge içeriği (kaza özeti, sağlık verisi) maskelenmemiş olabilir.

---

## G-A8 — Sitemap + Landing Pages

```
tedbirge-panel/app/robots.ts:
  rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard/", "/admin/"] }]
  sitemap: "https://www.tedbirge.ai/sitemap.xml"

tedbirge-panel/app/sitemap.ts satır 18–29:
  { url: base },                              // priority: 1.0
  { url: `${base}/basvuru` },                 // priority: 0.9
  { url: `${base}/lexscan` },                 // priority: 0.8
  { url: `${base}/trafik-kazasi-tazminat` },  // priority: 0.85 ✅
  { url: `${base}/is-kazasi-tazminat` },      // priority: 0.85 ✅
  { url: `${base}/sigorta-tazminat-reddedildi` }, // priority: 0.8 ✅
  { url: `${base}/kvkk-aydinlatma` },
  { url: `${base}/cerez-politikasi` },
  { url: `${base}/kullanim-kosullari` },
  ...blogUrls
```

```
(public) klasörü içeriği:
basvuru, basvuru-sorgula, blog, cerez, cerez-politikasi, devam-et,
forgot-password, gizlilik, haberler, hakkimizda, is-kazasi-tazminat,
kullanim-kosullari, kvkk, kvkk-aydinlatma, layout.tsx, login, page.tsx,
referanslar, register, reset-password, sifre-belirle, sigorta-tazminat-reddedildi,
tazminat-hesapla, trafik-kazasi-tazminat
```

**Sonuç:**
- robots.ts: dinamik, `/` izinli, `/api/` + `/dashboard/` + `/admin/` yasak ✅
- Sitemap statik URL sayısı: 9 + blog URL'leri (dinamik)
- 3 niş landing page sitemap'te: HEPSİ VAR ✅
- /blog rotası: VAR ✅
- Sitemap'te EKSİK sayfalar: `/hakkimizda`, `/iletisim`, `/haberler`, `/referanslar` (public klasöründe var ama sitemap'e eklenmemiş)
- `/iletisim` sayfası: public klasöründe YOK (Madde 25.5.2 zorunlu — Bilgi Toplumu Hizmetleri K.)

---

## EKSİK NOKTALAR (Mehmet Bey için)

Bu bölüm varsayım değil, mimar oturumunda netleştirilecek sorular:

1. **Meta Pixel kararı kesin mi?** — Anayasa Madde 25.12 FAZ 4-A "Mehmet Bey kararı 27 Nisan: Meta Pixel YOK" diyor. FAZ 4-A mektubundan çıkarılsın mı, yoksa ileride değerlendirme için "askıya alındı" olarak mı işaretlensin?

2. **Google Ads conversion — server-side mi, client-side mi?** — Şu an GA4 özel event yok. Google Ads conversion API için `gtag('event', 'conversion', ...)` yeterli mi, yoksa server-side Conversion API (GCLID + hit backend) mi gerekiyor?

3. **UTM şablon yapısı formatı?** — Örnek: `utm_source=google / utm_medium=cpc / utm_campaign=trafik-kazasi-brand`. Bu formatı Mehmet Bey belirleyecek mi, yoksa mimar önerisi mi?

4. **Landing page → /basvuru UTM köprüsü** — Şu an `/trafik-kazasi-tazminat?utm_source=google` → `/basvuru` tıklandığında UTM kaybolur. Çözüm: landing page'deki CTA butonuna UTM parametresini URL'e eklemek (client-side). Onay var mı?

5. **A/B test motoru** — Kendi yazılımı mı (feature flag + variant logic), harici servis mi (PostHog, GrowthBook — npm install gerektirir → Madde 18.3 KIRMIZI nokta)?

6. **AIUsageLog dataSent maskeleme** — Ham snippet loglanıyor (G-A7 bulgusu). Bu FAZ 4-A kapsamına giriyor mu, yoksa ayrı KVKK kesiti mi?

---

## SONRAKİ ADIM

1. Mimar oturumu (Opus 4.7) bu raporu okuyacak
2. Eksik nokta sorularına Mehmet Bey cevap verecek
3. FAZ 4-A atom kesit mektubu yazılacak (TUR #26)

---

— Claude Code, FAZ 4-A Mini KEŞİF sonu
— Sıfır kod değişikliği (Madde 21.2 ✓)
— Sıfır commit (Madde 21.2 ✓)
— API key / müvekkil verisi maskelendi (Madde 21.7 ✓)
