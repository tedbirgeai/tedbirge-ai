# TEDBİRGE.AI — PROGRAMLAMA DİLLERİ & STACK ANALİZİ

**Tarih:** 22 Nisan 2026
**Hazırlayan:** Mimar (Claude Opus 4.7)
**Kaynak:** Claude Code tarafından çıkarılan `TECH_STACK_ENVANTER.md` + mimari değerlendirme

---

## 1. ŞU AN NE KULLANIYORUZ

### Backend (`tedbirge-ai` repo)

| Kategori | Teknoloji | Yorum |
|---|---|---|
| Dil | **JavaScript (ES6+)** | TypeScript yok |
| Runtime | Node.js ≥20 | ✅ Modern |
| Framework | Express 4.x | ✅ Endüstri standardı |
| ORM | Prisma 6 | ✅ Modern, Python SQLAlchemy muadili |
| DB | PostgreSQL (Supabase) | ✅ Kurumsal seviye |
| Auth | JWT + bcrypt | ✅ Standart |
| 2FA | speakeasy (TOTP) | ✅ Endüstri standardı |
| AI | @anthropic-ai/sdk ^0.89.0 | ✅ Tek SDK, odaklı |
| Validation | ??? | ⚠️ Muhtemelen elle (zod/joi yok) |
| Logger | morgan + console.log | 🔴 Yetersiz |
| Error tracking | **YOK** | 🔴 Kritik eksik |
| Test framework | Jest kurulu, 0 test dosyası | 🟡 Orta |
| Rate limiting | express-rate-limit | ✅ Var |

### Frontend / Panel (`tedbirge-panel` repo)

| Kategori | Teknoloji | Yorum |
|---|---|---|
| Dil | **TypeScript** | ✅ Tip güvenliği |
| Framework | Next.js 16.2 (App Router) | ✅ En yeni sürüm |
| UI | React 19 | ✅ En yeni |
| Styling | Tailwind CSS 4 | ✅ En yeni |
| Animasyon | Framer Motion | ✅ |
| Form | Vanilla useState | 🟡 react-hook-form eksik |
| State | Context/useState | 🟢 Yeterli |
| Error tracking | **YOK** | 🔴 Kritik eksik |

### Altyapı

| Alan | Durum |
|---|---|
| Frontend hosting | Vercel |
| Backend hosting | Render |
| DB hosting | Supabase (PostgreSQL) |
| CI/CD | Dependabot aktif, test workflow'u YOK |
| Monitoring | UptimeRobot (kısmen aktif) |
| Monorepo | YOK — 2 ayrı GitHub repo |

---

## 2. KATEGORİLERE GÖRE EKSİK ANALİZİ

### 🔴 Kritik Eksikler (HEMEN, bu hafta)

**1. Error Tracking — Sentry**

- **Neden:** Şu an canlıda 3 avukat var, hata alınca bizim haberimiz olmuyor. Kullanıcı "niye çalışmıyor" diye terk eder.
- **Ne yapılacak:** `@sentry/node` (backend) + `@sentry/nextjs` (panel) kurulumu
- **Süre:** 2 saat
- **Maliyet:** Free tier aylık 5K hata yeter (bizim için fazlasıyla)

**2. Logger — Winston veya Pino**

- **Neden:** Render log'ları ephemeral (24 saat sonra siliniyor). Audit izi için yetersiz. KVKK denetiminde "şu tarihte bu kullanıcı şuraya tıkladı" cevabı veremeyiz.
- **Ne yapılacak:** Winston + structured logging (JSON format)
- **Süre:** 1.5 saat
- **Bonus:** Log retention için Better Stack veya Axiom ücretsiz tier

**3. Test Coverage — Minimum Jest Tests**

- **Neden:** 0 test = her deploy kumar. Dün 2 kez sistemi kırmanın sebebi bu.
- **İlk hedef:** Auth endpoint'leri + health endpoint + KVKK flow (5-10 test)
- **Süre:** 2 saat (altyapı + ilk testler)

**4. GitHub Actions CI**

- **Neden:** Push öncesi test çalışmıyor, lint çalışmıyor, build kontrol edilmiyor. Dependabot var ama "PR açıldığında test çalıştır" yok.
- **Ne yapılacak:** `.github/workflows/ci.yml` — test + lint + build on PR
- **Süre:** 1 saat

---

### 🟡 Orta Vadeli Eksikler (bu ay)

**5. Form Validation — zod + react-hook-form**

- **Neden:** KVKK checkbox gibi hassas alanlarda elle validasyon = bug riski
- **Süre:** 3-4 saat (mevcut formları refactor)

**6. API Input Validation — zod (backend)**

- **Neden:** Şu an body fields elle kontrol ediliyor muhtemelen. zod ile schema-first validation hem daha güvenli hem kodu kısaltır.
- **Süre:** 2-3 saat

**7. Request ID tracking**

- **Neden:** Bir isteğin tüm logları nasıl eşleşecek? X-Request-ID header + structured logging ile.
- **Süre:** 1 saat (Winston ile beraber yapılabilir)

**8. API documentation — OpenAPI/Swagger**

- **Neden:** 23 route grubu, kimse hatırlamıyor hangisinde ne var. Yeni dev (veya yarın Claude Code) için dokümantasyon şart.
- **Süre:** 4-5 saat

---

### 🟢 Nice-to-Have (bu çeyrek)

**9. TypeScript migration (backend)**

- **Neden:** Panel TS, backend JS — tutarsızlık. Büyüdükçe bug.
- **Süre:** 2-3 hafta (büyük iş)
- **Karar:** 10+ avukat olduğunda başla

**10. Monorepo — Turborepo veya Nx**

- **Neden:** 2 repo'yu tek yerden yönetmek, ortak paketler (tipler, constants) paylaşmak
- **Süre:** 1 gün
- **Karar:** Shared types ihtiyacı büyürse

**11. Redis — Caching + rate limiting**

- **Neden:** 10+ avukat olunca DB sorguları yavaşlar
- **Süre:** 2-3 gün
- **Karar:** Performance gerçekten sorun olunca

**12. Background jobs — BullMQ**

- **Neden:** E-posta gönderimi, WhatsApp mesajları, dilekçe oluşturma async işler gerektirecek
- **Süre:** 2-3 gün
- **Karar:** İlk bir async iş gelince

---

## 3. ÖZEL TESPİTLER

### TypeScript Ayrımı

**Panel TS, Backend JS.** Bu tutarsızlık çok yaygın bir problem. Çözüm üç yoldan biri:

**Seçenek A:** Backend'i de TS'e çevir (2-3 hafta, büyük refactor)
**Seçenek B:** JSDoc ile Backend'e tip yaz (1 hafta, daha hafif)
**Seçenek C:** Olduğu gibi bırak, yeni dosyaları TS yaz (organic migration)

**Benim önerim: C.** Yeni kod TS olsun, eski kod zamanla dönsün. 6 ay içinde %80 TS'ye ulaşırız.

### Frontend State Management

Şu an sadece `useState` ve muhtemelen Context. **36 sayfa için yeterli**. Redux/Zustand kurmak overkill. Bu bir eksik DEĞİL, bilinçli bir tercih olarak kalmalı.

### AI Entegrasyonu — Sadece Anthropic

Bilinçli ve sağlam tercih. OpenAI eklemek gereksiz. İleride karşılaştırma gerekirse abstract katman yazılır (LLM interface) ama **şimdi değil**.

---

## 4. ÖNCELİKLENDİRİLMİŞ ROADMAP

### Bu Hafta (ACİL-SONRASI paketi)

```
1. Sentry entegrasyonu (backend + panel)        — 2 saat
2. Winston logger + log structure                — 1.5 saat
3. GitHub Actions CI (test + lint + build)      — 1 saat
4. İlk Jest testleri (health + auth + KVKK)     — 2 saat
5. Render build script'ine prisma migrate deploy — 30 dk
──────────────────────────────────────────────────
TOPLAM: ~7 saat, 1-2 günde biter
```

### Bu Ay

```
6. zod validation (API input)                    — 2-3 saat
7. react-hook-form (panel formları)              — 3-4 saat
8. Request ID tracking                           — 1 saat
9. OpenAPI/Swagger dokümantasyon                 — 4-5 saat
10. Migration drift temizleme                    — 2 saat
──────────────────────────────────────────────────
TOPLAM: ~15 saat, 2-3 günde biter
```

### Bu Çeyrek

```
11. TypeScript migration (organic)              — sürekli
12. Monorepo veya paket paylaşımı               — 1 gün
13. E-posta altyapısı (Resend/SES)              — 1 gün
14. Background jobs (BullMQ) — ihtiyaç olursa   — 2-3 gün
```

---

## 5. TUZAKLAR (Yapmayacağımız şeyler)

❌ **Tüm backend'i durup TS'e çevirmek** (3 hafta kaybederiz, müşteri gitmez)
❌ **Microservice mimariye geçmek** (Tek backend yeter 10K kullanıcıya)
❌ **GraphQL'e geçmek** (REST yeter, öğrenme + refactor maliyeti yüksek)
❌ **Kubernetes, Docker Swarm** (Render PaaS yetiyor)
❌ **Kendi auth sistemi yerine Auth0/Clerk** (Zaten JWT + 2FA var, çalışıyor)
❌ **Monorepo'ya şimdi geçmek** (2 repo ile devam, gerçekten sıkıntı olunca dönüşürüz)

---

## 6. KARAR NOTLARI

### Karar #1: Sentry **bu hafta şart**.

Neden: Canlıda 3 aktif kullanıcı, hata gözleminden yoksun kalamayız.

### Karar #2: Backend TS migration **2026 3. çeyrek**.

Neden: Şu an daha acil işler var. 10+ avukat olunca plan yap.

### Karar #3: Form library'e **bu ay** geçiş.

Neden: KVKK validation hatası = hukuki risk. react-hook-form + zod ile iki taraflı (client + server) doğrulama.

### Karar #4: Monorepo **geçmeyeceğiz** şimdilik.

Neden: 2 repo iş görüyor. Maliyeti, faydasından yüksek.

---

## 7. SONUÇ

Stack modern, güçlü, Türkiye pazarında en az 2-3 yıl yeterli. Asıl sorun "ne kullanıyoruz" değil, **"neyi göremiyor, neyi denetleyemiyor, neyi test edemiyoruz"**. Sentry + Winston + CI + Test + zod — bu 5 eksiklik kapanırsa, sistem **kurumsal seviyede** olur.

Bu 5 eksik **1-2 haftalık iş**. 1.3 + 1.4 bittikten sonra **Bölüm 1.5 (ACİL-SONRASI) olarak TASK_QUEUE'ya giriyor.**

---

*Mimar — 22 Nisan 2026*
*tedbirge-os/docs/PROGRAMLAMA_DILLERI_ANALIZ.md olarak saklanacak*
