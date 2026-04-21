# TASK_QUEUE

═══════════════════════════════════════════════════════════════
  AKTIF MASTER PLAN
═══════════════════════════════════════════════════════════════

TUM YAPILACAK ISLERIN KAPSAMLI LISTESI:
→ docs/MASTER_YAPILACAKLAR.md

Bu dosya iki fizibilite raporunu (AUTOMATION_PLAN_v1 + 
HUKUKCU_CRM_FIZIBILITE_v2) ve 21 Nisan'daki tum tespitleri 
birlestiren tek referans.

═══════════════════════════════════════════════════════════════
  22 NISAN 2026 — YENI OTURUM ILK IS: ACIL 4 MADDE
═══════════════════════════════════════════════════════════════

SIRAYLA YAPILACAK:

[ ] 1. Backend /api/health endpoint ekle (15 dk)
      - src/routes/health.routes.js olustur
      - GET /api/health → status + timestamp
      - GET /api/health/db → Prisma SELECT 1
      - src/routes/index.js'e mount
      - Detay: MASTER_YAPILACAKLAR.md bolum 1.1

[ ] 2. UptimeRobot backend monitor guncelle (5 dk)
      - URL: /api/health'a cevir
      - Unpause et
      - Detay: MASTER_YAPILACAKLAR.md bolum 1.2

[ ] 3. KVKK healthDataApproved DB kaydi (45 dk)
      - Prisma schema: Lead modeline healthDataApprovedAt
      - Migration + controller guncelle
      - Detay: MASTER_YAPILACAKLAR.md bolum 1.3

[ ] 4. /kvkk sayfasi ile modal icerigi senkron (20 dk)
      - Iki yerde farkli aydinlatma metni var, tekilletmek lazim
      - Detay: MASTER_YAPILACAKLAR.md bolum 1.4

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
    - HUKUKCU_CRM_FIZIBILITE_v2 yazildi
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
