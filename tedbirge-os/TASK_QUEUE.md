# TASK_QUEUE

═══════════════════════════════════════════════════════════════
  AKTIF MASTER PLAN
═══════════════════════════════════════════════════════════════

TUM YAPILACAK ISLERIN KAPSAMLI LISTESI:
→ docs/MASTER_YAPILACAKLAR.md

Bu dosya iki fizibilite raporunu (AUTOMATION_PLAN_v1 + 
HUKUKCU_OPERASYON_FIZIBILITE_v4) ve 21 Nisan'daki tum tespitleri 
birlestiren tek referans.

═══════════════════════════════════════════════════════════════
  22 NISAN 2026 — YENI OTURUM ILK IS: ACIL 4 MADDE
═══════════════════════════════════════════════════════════════

SIRAYLA YAPILACAK:

[✓] 1. Backend /api/health endpoint ekle (49b2e53 - health endpoint canlı)
      - src/routes/health.routes.js olustur
      - GET /api/health → status + timestamp
      - GET /api/health/db → Prisma SELECT 1
      - src/routes/index.js'e mount
      - Detay: MASTER_YAPILACAKLAR.md bolum 1.1

[✓] 2. UptimeRobot backend monitor guncelle (UptimeRobot aktif, 5dk interval)
      - URL: /api/health'a cevir
      - Unpause et
      - Detay: MASTER_YAPILACAKLAR.md bolum 1.2

[✓] 3. KVKK healthDataApproved DB kaydi (83bc975 - healthDataConsentAt canlı, L-20260421-OMC1HW testi geçti)
      - Prisma schema: Lead modeline healthDataApprovedAt
      - Migration + controller guncelle
      - Detay: MASTER_YAPILACAKLAR.md bolum 1.3

[✓] 4. /kvkk sayfasi ile modal icerigi senkron (22 Nisan 2026 sabah oturumunda tamamlandi)
      - Supabase, Vercel, Render, Anthropic veri isleyicileri eklendi
      - Yurt disi aktarim bilgisi + KVKK m.6/3 notu eklendi

## 1.5 ACİL-SONRASI PAKET (Bu hafta, ~9 saat)

- [ ] Sentry entegrasyonu (backend + panel, 2 saat)
- [ ] Winston structured logging (backend, 1.5 saat)
- [ ] GitHub Actions CI — test + lint + build (1 saat)
- [ ] Jest ilk testler — auth + health + KVKK flow (2 saat)
- [✓] Render build script'ine "prisma migrate deploy" ekle — render.yaml eklendi (46f3c70)
- [ ] Migration history drift temizleme (2 saat)

## 1.6 TECH DEBT — Sabah İlk İşler

- [ ] .env düzelt — Render'dan aktif DATABASE_URL kopyala (10 dk)
- [ ] prisma migrate resolve aktif DB'de tekrar çalıştır (5 dk)
- [ ] prisma generate çalıştır (2 dk)
- [ ] Canlı test kayıtlarını sil — DELETE FROM "Lead" WHERE "customerName" LIKE 'Test Mimar HD%' (2 dk)
- [ ] TECH_STACK_ENVANTER.md ve PROGRAMLAMA_DILLERI_ANALIZ.md için ayrı commit (5 dk)
- [ ] PANEL_TANI_2.txt muammasını çöz (ne dosyası? sil/taşı/ignore) (5 dk)
- [ ] CLAUDE.md temizliği — 76k → 40k altına (/memory komutu, 15 dk)

═══════════════════════════════════════════════════════════════
  22 NISAN 2026 — OGLEDEN SONRA: UX BUGLARI (2-3 saat)
═══════════════════════════════════════════════════════════════

[ ] 5. FOTOGRAF 4 muammasi teshis (Mehmet Bey'den URL al)
[ ] 6. "Basvuru Sorgula" navbar butonu direkt yonlendirme
[ ] 7. Vercel eski NEXT_PUBLIC_API_URL sil
[ ] 8. Gorsel kimlik tutarsizligi karari (Mehmet Bey ile)

═══════════════════════════════════════════════════════════════
  BU HAFTA (22-27 NISAN)
═══════════════════════════════════════════════════════════════

[ ] 9. GitHub Actions - npm audit cron
[ ] 10. Supabase heartbeat cron
[ ] 11. Staging ortami karari
[ ] 12. 3 avukatla birebir gorusme (8 soru)
[ ] 13. 2FA zorunlu (LAWYER + ADMIN)
[ ] 14. Audit log genisletme
[ ] 15. Global arama kutusu
[ ] 16. Mobil hukukçu deneyim testi
[ ] 17. Duruşma .ics export

═══════════════════════════════════════════════════════════════
  BU AY (NISAN-MAYIS)
═══════════════════════════════════════════════════════════════

[ ] 18. LexScan akillandirma (confidence + eskalasyon)
[ ] 19. Hukukcu kendi performans dashboard
[ ] 20. Dashboard onboarding tour
[ ] 21. Hizli islemler (quick actions)
[ ] 22. Kritik uyari sistemi genisletme
[ ] 23. Muvekkil uctan uca akis testi
[ ] 24. Muvekkil belge yukleme guvenlik
[ ] 25. Muvekkil mesajlasma iyilestirme
[ ] 26. Push bildirim muvekkil icin

═══════════════════════════════════════════════════════════════
  BU CEYREK (MAYIS-HAZIRAN)
═══════════════════════════════════════════════════════════════

[ ] 27. UYAP entegrasyonu (ayri v4 raporu)
[ ] 28. SBM entegrasyonu
[ ] 29. Malpraktis dava turu
[ ] 30. Kaza Rekreasyon UI iyilestirme
[ ] 31. Dilekce sablon kutuphanesi
[ ] 32. Tebligat/posta takibi modulu
[ ] 33. PWA offline-first
[ ] 34. E-imza entegrasyonu
[ ] 35. Gelismis analitik

═══════════════════════════════════════════════════════════════
  🎯 HUKUKÇU PANEL OTONOM AJAN DÖNÜŞÜMÜ (v4 Fizibilite)
═══════════════════════════════════════════════════════════════

Kaynak: tedbirge-os/docs/HUKUKCU_OPERASYON_FIZIBILITE_v4.md
Vizyon: Tedbirge → Türkiye'nin Otonom Hukuk Ajanı (12 aylık plan)

### Bu hafta (Sprint 1) — 18 saat
- [✓] W1-M1: Hukukçu Dashboard — CANLI (8dc027a + 2189c2f)
- [✓] W1-M2: Lead Timeline Sekmesi — CANLI (4dccc8e + 5ac00d6 + e32911f hotfix)
- [✓] W1-M3: Muhatap Enum + Şablonlar — CANLI (4d32b0f backend + 90bd2ba panel)
- [ ] W1-M3.5: AI Muhatap Analizi — BEKLİYOR (4-6 saat, Perşembe önerilir)
- [ ] W1-M4: Süre Motoru Temeli — BEKLİYOR (3-4 saat, kritik)
- [ ] W1-M5: Sigorta Başvuru Wizard — BEKLİYOR (2 saat)

### Bu ay (Sprint 2-4) — Detay v4 Bölüm 6
- [ ] Sprint 2: Süre motoru + wizard tamamlama
- [ ] Sprint 3: pgvector + agent altyapı
- [ ] Sprint 4: Ajan 1 + Ajan 7 aktif

### 3 ayda — 8 Ajan Aktif
- [ ] Ajan 1: Dosya Alım Ajanı
- [ ] Ajan 2: Emsal Karar Ajanı (Yargıtay RAG)
- [ ] Ajan 3: Dilekçe Yazıcı
- [ ] Ajan 4: Sigorta Başvuru (KEP)
- [ ] Ajan 5: Süre/Tebligat Ajanı
- [ ] Ajan 6: Karşı Taraf Analizci
- [ ] Ajan 7: Müvekkil İletişim
- [ ] Ajan 8: Finansal Ajan

═══════════════════════════════════════════════════════════════
  STRATEJİK ÖNCELİK — MOBİL UYGULAMA ENTEGRASYONU
═══════════════════════════════════════════════════════════════

**MEHMET BEY'İN DİREKT TALEBİ (22 Nisan 2026, 01:40):**
> "Artık dijital çağda yaşıyoruz. Bizim güçlü mıknatıslarımız mobil uygulamalardır."

Mobil uygulama entegrasyonu Tedbirge.ai'nin **stratejik büyüme kaldıracıdır**.
Avukatlar adliyede hareket halinde, müvekkiller telefonlarından her zaman
erişim bekliyor. Mobil olmadan büyüme tavan yapar.

### AŞAMALI UYGULAMA PLANI

- [ ] **AŞAMA 1 — PWA DÖNÜŞÜMÜ (30 gün içinde, 3 gün iş)**
    - Mevcut Next.js paneli mobil uygulama gibi davranacak
    - Yeni dil/framework gerekmez, mevcut TypeScript/React yeterli
    - service-worker.js + manifest.json
    - "Ana ekrana ekle" özelliği (iOS + Android)
    - Offline belge cache (adliye koridorunda çalışma)
    - Push notification altyapısı
    - SONUÇ: Avukat telefonunda "Tedbirge" ikonu, uygulama gibi açılır
    - REFERANS: MASTER_YAPILACAKLAR Bölüm 13.1

- [ ] **AŞAMA 2 — REACT NATIVE UYGULAMASI (90 gün hedefi)**
    - App Store + Google Play'de gerçek uygulama
    - React Native (Expo ile başla, bare'e geç gerekirse)
    - Backend API aynen kullanılır — yeni backend yok
    - iOS + Android tek kod tabanı
    - Panel kodunun %50'si ortak paylaşılır (API, business logic)
    - Tahmini: 6-8 hafta iş
    - Ön koşul: 10+ aktif avukat (şu an 3, hedef 30 gün içinde)
    - MEHMET BEY SEÇİMİ: React Native vs Flutter vs Native (sabah karar)

- [ ] **AŞAMA 3 — MOBİL ÖZEL ÖZELLİKLER (150+ gün)**
    - Kamera entegrasyonu (belge tarama, OCR)
    - Biyometrik giriş (FaceID, parmak izi)
    - Konum bazlı özellikler (hangi adliyedesiniz?)
    - E-imza mobil entegrasyonu
    - Tebligat push notification

### FİZİBİLİTE RAPORU — v7 MOBİL STRATEJİ

Yazılacak: Mayıs başı
Kapsam:
- PWA vs React Native vs Flutter vs Native karşılaştırması
- Maliyet analizi (dev süresi, App Store fees, altyapı)
- UYAP mobil entegrasyonu (v4 raporu ile birlikte değerlendirilecek)
- Müvekkil portalı mobil özel tasarım
- Timeline: 30/90/180 gün planlaması

### TEKNİK NOTLAR (Mimar Notu)

**NE KULLANILACAK (kesin):**
- PWA: Mevcut Next.js (dil eklemeyeceğiz)
- Native app: React Native (mevcut React bilgimizle %80 uyumlu)

**NE KULLANILMAYACAK (kesin):**
- ❌ C++ — Tedbirge.ai bir oyun motoru değil, gereksiz
- ❌ Oracle — PostgreSQL yeterli, Oracle yıllık $50K+ lisans
- ❌ Java backend — Node.js çalışıyor, 3 ay kaybı olur
- ❌ Kubernetes — 10K kullanıcıya kadar gereksiz

**NEDEN BU KARAR:**
Dil çeşitliliği güç değil, yüktür. Her yeni dil = yeni bug kaynağı,
yeni dependency, yeni ekip öğrenme süresi. Tedbirge.ai'yi güçlü kılan
AVUKATLARA DEĞER KATAN ÖZELLİKLER (dilekçe süresi, UYAP, hukuki AI),
stack sayısı değil.

═══════════════════════════════════════════════════════════════
  HUKUKI (MEHMET BEY + AVUKATLAR)
═══════════════════════════════════════════════════════════════

[ ] 36. VERBIS kayit durumu
[ ] 37. KVKK metni hukuki onay
[ ] 38. Veri isleyen sozlesmeleri (Supabase, Vercel, Render, Anthropic)
[ ] 39. Veri ihlali bildirim proseduru
[ ] 40. Sorumluluk cercevesi (tazminat tahmin yanlisi)

═══════════════════════════════════════════════════════════════
  GELECEK RAPORLAR
═══════════════════════════════════════════════════════════════

[ ] 41. v3 Muvekkil Girisi Fizibilitesi
[ ] 42. v4 UYAP Entegrasyonu Raporu
[ ] 43. v5 Otomasyon + LexScan Akillandirma
[ ] 44. v6 Guvenlik + KVKK Bosluk Kapatma

═══════════════════════════════════════════════════════════════
  TAMAMLANANLAR — 22 NISAN 2026 SABAH (05:00-09:00)
═══════════════════════════════════════════════════════════════

[x] KVKK modal senkron (Supabase/Vercel/Render/Anthropic eklendi)
[x] Test lead temizleme scripti (scripts/cleanup-test-leads.js)
[x] W1-M1 Hukukçu Dashboard — cilalanmış, canlı (8dc027a + 2189c2f)
[x] Arkaplan gradient temizliği — 6 panel sayfası (ea79870)
[x] W1-M2 Lead Timeline — 10 tablodan birleşik, canlı (4dccc8e + 5ac00d6)
[x] Regresyon fix: timeline duplicate events (e32911f)
[x] Regresyon fix: dashboard response key .leads → .data (e0c2cba)
[x] Regresyon fix: CORS/API URL config mismatch — same-origin proxy (43b96ba)
[x] Regresyon fix: analytics pool exhaustion — groupBy (067396c)
[x] W1-M3 Muhatap Enum + Şablonlar — 13 enum, 3 aktif, canlı (4d32b0f + 90bd2ba)
[x] KASIM lead backfill — Supabase SQL Editor ile manuel
[x] render.yaml eklendi — prisma migrate deploy kalıcı (46f3c70)
[x] vercel.json Railway → Render URL (5a20c57)

Detay: tedbirge-os/docs/OTURUM_22_04_2026_SABAH.md

═══════════════════════════════════════════════════════════════
  TAMAMLANANLAR — 21 NISAN 2026
═══════════════════════════════════════════════════════════════

[x] Gece oturumu 2 (02:00-05:10): Backend deploy, reset-password page
[x] Sabah oturumu (05:10-08:00):
    - Vercel Suspense fix (26ed40c)
    - Middleware public path fix (eb8221b)
    - LexScan env var fix (801d4d7)
    - UptimeRobot panel monitor
    - Dependabot config
    - AUTOMATION_AND_IMPROVEMENT_PLAN_v1 yazildi
[x] Ogleden sonra + aksam (15:00-23:00):
    - Avukat bilgisi sizintisi (b774a11)
    - Kalan lawyer:true sizintilari (b47553d)
    - Middleware public path kritik fix (99bda25)
    - Basvuru success ekrani duzelt (fe2e8ae)
    - Basvuru sorgula endpoint prefix (205d51c)
    - KVKK modal + saglik acik riza (3824da4)
    - KVKK iframe → inline icerik (e82c0eb)
    - HUKUKCU_CRM_FIZIBILITE_v2 yazildi (geçersiz — v4 yerine geçti)
    - Canli muvekkil testi basarili
    - MASTER_YAPILACAKLAR master plani yazildi

═══════════════════════════════════════════════════════════════

## OS KURALLARI
- Sadece ACTIVE görev yürütülür
- TASK_QUEUE dışına çıkılamaz
- Görev kapanışı için zorunlu:
  - CHANGELOG
  - CURRENT_STATE
  - TASK_QUEUE güncellemesi
- Refactor yasak
- Çoklu değişiklik yasak
- Backup alınmadan EXECUTE yok
- Stabil sonuç sonrası snapshot zorunlu

═══════════════════════════════════════════════════════════════
