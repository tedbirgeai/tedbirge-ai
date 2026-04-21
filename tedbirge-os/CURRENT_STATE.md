# CURRENT_STATE

Tarih: 2026-04-16
Son Güncelleme: 16.04.2026 19:05:02

## Sistem Durumu
- Backend: Çalışıyor (localhost:5000)
- Panel: Çalışıyor (localhost:3000)
- OCR: Aktif (polling loop, 10s interval)
- AI: Aktif — claude-sonnet-4-6, ANALYSIS_MODE=real
- PDF: Çalışıyor (pdfkit, Türkçe karakter desteği)
- DB: PostgreSQL — Supabase

## Ürün Durumu
- Teknik: Güçlü
- Ürün: Gelişiyor
- Güven: Yüksek

## Aktif Odak
- Sosyal medya entegrasyonu ve deploy hazırlığı

### Son Degisiklik (2026-04-18 aksam — Kaza Rekonstruksiyon MVP)
- 4 yeni endpoint: POST /leads/:id/accident-cases, POST /accident-cases/:id/evidences, POST /accident-cases/:id/analyze, GET /accident-cases/:id/report
- 2 yeni tablo: AccidentCase, Evidence
- 1 yeni servis: kazaRekonstruksiyon.service
- Akis: DRAFT -> EVIDENCE_READY -> ANALYZING -> COMPLETED

## Risk
- WhatsApp: gerçek API credentials eksik (WHATSAPP_TOKEN)
- SMTP: şifre girilmemiş (SMTP_PASS)
- SMS NetGSM: AKTİF — 2026-04-19 testinde gerçek SMS geldi. Önceki raporlarda "boş" yazıyordu, YANLIŞ bilgiydi, düzeltildi.

## Aktif Görev
- Temsilci altyapısı (sözleşme v1.0 bitti, panel ve admin akışı devam ediyor)

### Son Değişiklik (2026-04-19 gece — Temsilci sözleşmesi v1.0)
- Yeni public endpoint: GET /api/contracts/temsilci/current (SHA-256 hash)
- Yeni template: src/templates/contracts/temsilci-contract.template.js (13 madde)
- DB şeması: User (sozlesme* 3 alan) + Lead (masraf/KDV/hakediş 6 alan)
- primOrani default 5 → 50
- Frontend: sözleşme dinamik fetch, %50 bilgi kartı, hash+version body'de

## Backup Durumu
- Backup engine: Aktif
- Snapshot disiplini: Zorunlu

## PATCH_POLICY_STATUS
- Kor patch yasak.
- Tüm değişiklikler doğrulanmış dosya içeriğine dayanır.
- Mümkün olan her durumda tek split / tek parça komut verilir.

---

═══════════════════════════════════════════════════════════════
  20 NISAN 2026 — GECE OTURUMU (18:30–23:00)
═══════════════════════════════════════════════════════════════

KRITIK KESIF: Canli sistem 3 haftadir aslinda calismiyordu.
Supabase projesi (dlkctvyjbuulmkgpqcvm) 7 gun hareketsizlik
sonrasi otomatik duraklatilip silinmis. Render'daki DATABASE_URL
olu bir DB'yi gosteriyordu. Tum "ilk lead" tanilari aslinda
LOKAL DB'de, canli DB bombosdu.

Ramazan Duran ve Muzaffer TUMSA gercek avukatlar sisteme
girmeye calistilar, giremediler. "Failed to fetch" hatasi
hep CORS degil, backend DB baglantisizligindan geliyordu.

BUGUN YAPILANLAR (kronolojik):

1. TANI: Render env DATABASE_URL'de eski Supabase projesi
   (dlkctvyjbuulmkgpqcvm) referansi, aktif proje ise
   iikpmzomblocdrxeisxh (ayni hesap, farkli proje, bos).

2. YENI SUPABASE BAGLANTISI:
   - Eski proje silindi (Supabase free tier 90 gun kurali).
   - Aktif proje: iikpmzomblocdrxeisxh.supabase.co
   - Bolge: Sydney AWS ap-southeast-2 (IPv6-only direct,
     IPv4 icin Session Pooler kullaniliyor).
   - Connection: aws-1-ap-southeast-2.pooler.supabase.com:5432
   - User: postgres.iikpmzomblocdrxeisxh
   - DB sifresi iki kez sifirlandi. Bu sefer sifre
     pgpass.tmp dosyasi ile guvenli transfer edildi.

3. RENDER GUNCELLEMELER:
   - DATABASE_URL → yeni pooler URL (sifre guvenli).
   - CORS_ORIGIN → http://localhost:3000 (yetersiz)
     YENI: https://www.tedbirge.ai,https://tedbirge.ai,
           https://tedbirge-panel.vercel.app,http://localhost:3000
   - Redeploy otomatik, 2 kez oldu.

4. PRISMA DB PUSH (CANLI):
   - 17 tablo olusturuldu canli DB'de (User, Lead, PhoneOtp,
     Document, ActivityLog, Contract, Petition, Assignment,
     Durusma, Bilirkisi, Masraf, DavaSurec, IhtarnameTakip,
     ChatSession, ChatMessage, VerificationToken,
     PushSubscription).
   - Komut: npx prisma db push --skip-generate
   - Migration history tam degil, db push kullanildi
     (prisma/migrations/ son 20260415, sonrasi db push).

5. ADMIN SEED (CANLI):
   - Lokaldeki ADMIN hesabi canliya tasindi, hash aynen.
   - E-posta: admin@tedbirge.ai
   - Sifre: Tedbirge2026! (ayni hash, lokal=canli)
   - ID: ec158ea2-c22c-42eb-9ea7-f1de6515bdaf
   - Rol: ADMIN, isActive: true

6. TEST: curl ile /api/auth/login → success:true, JWT token
   dondu. Tarayici "Failed to fetch" aliyordu → CORS sorunu
   → CORS_ORIGIN guncellendi → admin paneli canlida acildi.

7. IKI KULLANICI SADECE LOKALDE (canliya tasinmadi):
   - Ramazan Duran (LAWYER, ONAYLANDI, lokal sifre TedbirgeGecici2026!)
   - Muzaffer TUMSA (LAWYER, ONAYLANDI, lokal sifre 654321)

═══════════════════════════════════════════════════════════════
  21 NISAN 2026 — ACIL ISLER (oncelik sirasiyla)
═══════════════════════════════════════════════════════════════

1. RAMAZAN VE MUZAFFER CANLIYA EKLEME (en acil)
   Iki avukat da sahada bekliyor.
   Yontem: Admin panel → Kullanicilar → Avukat Ekle.
   Ya da lokaldeki gibi JSON export + canli import script.
   Muzaffer: muzaffertumsa@hotmail.com / 654321
   Ramazan: ramazanduran111@gmail.com / TedbirgeGecici2026!
   Her ikisini de "Hukukcu Onay" sayfasindan ONAYLA.
   Kendi tarayicinda test et → sonra avukatlara bildir.

2. CORS WHITELIST GENISLETME (KUCUK)
   Gerekirse tedbirge-ai.onrender.com da whitelist'e ekle
   (backend kendi kendine istek atarsa diye).

3. GOREV.MD DOSYASI BUYUK (76.6k char, performansi etkiliyor)
   gorev.md → kisa anayasa (degismez kurallar)
   CURRENT_STATE.md → anlik durum
   CHANGELOG.md → oturum gecmisi
   Bolmek lazim, bugunku Claude Code uyarisi.

4. SUPABASE FREE TIER OTOMATIK DURAKLATMA
   7 gun hareketsizlik → duraklatilir
   90 gun duraklali → arsiv, veri kaybi
   Cozum: GitHub Actions cron job heartbeat ping
   Ya da: Supabase Pro tier upgrade
   Acil degil ama yarin karar verilmeli.

5. SIFRE GUVENLIGI
   Bu oturumda bir sifre (7IdAz1dWWiIzNxic) chat'e sizdi.
   O sifre zaten sifirlandi, sorun yok. Ama ileride
   sifreler MUTLAKA pgpass.tmp dosyasi yontemi ile
   geciscirilecek, chat'e yazilmayacak.

═══════════════════════════════════════════════════════════════
  21 NISAN 2026 — GECE OTURUMU (00:00–02:00) — TAMAMLANDI
═══════════════════════════════════════════════════════════════

Yapilanlar:
- Fizibilite raporu + 9 eksik tespit
- authMiddleware JWT payload bug fix (userId tutarli hale geldi)
- Admin onay endpoint'leri: /auth/pending-approvals, /approve/:id, /reject/:id
- Admin manuel kullanici ekleme: /auth/admin-create-user
- Email dogrulama akisi: /auth/send-email-verification, /verify-email
- Muvekkil web kayit: /auth/register/customer (OTP + email verify)
- Rate limiting: login, register, forgot-password endpoint'lerine
- Test altyapisi onarim: jest.config.js + npm test script (142/142 PASS)
- GitHub PAT sizintisi tespit + eski token iptal + yeni token kurulum
- 9 commit master'a merge + push (commit df0dc81)
- Render deploy otomatik tamamlandi, yeni endpoint'ler canli

Canli durumu (21 Nisan 02:00):
- Admin: admin@tedbirge.ai (aktif)
- Avukatlar: Ramazan DURAN + Muzaffer TUMSA (onayli, aktif, panel'de gorunuyor)
- Hukukcu Onay sayfasi: canliya bagli, bekleyen yok
- Temsilci Onay sayfasi: canliya bagli, bekleyen yok

Aciklar (sonraki paket icin):
- 2FA zorunlulugu (ADMIN + LAWYER) — su an opsiyonel
- Audit log genisletme (login/logout/2fa events)
- SMS ile sifre sifirlama
- Session yonetimi / aktif cihazlar listesi
- Panel repo'nun GitHub token guncellemesi (yeni token ile)
- Supabase free tier heartbeat cron (7 gun hareketsizlik koruma)

Git:
- master: df0dc81 (merge: auth tamamlama paketi)
- origin/master: df0dc81 (senkronize)
- auth-tamamlama-2026-04-21: silinebilir (merge edildi)

═══════════════════════════════════════════════════════════════
  MEVCUT REPO / CANLI DURUMU (20 Nisan gece 23:00)
═══════════════════════════════════════════════════════════════

Ana repo:    temiz, son commit caseData feat (78f7e2a)
Panel repo:  3 uncommitted dosya (dunden kalma)
Test:        142 PASS (lokal)
Motor:       compensation.engine.v2.js - hic dokunulmadi

CANLI:
  Domain:     www.tedbirge.ai (Render)
  Backend:    tedbirge-ai.onrender.com (Render Free tier, uyku modu var)
  DB:         iikpmzomblocdrxeisxh.supabase.co (Sydney, Supabase Free)
  Admin:      admin@tedbirge.ai / Tedbirge2026! (canlida aktif)
  Kullanici:  Sadece 1 (admin). Ramazan + Muzaffer lokalde,
              canliya tasinacak.

LOKAL:
  Admin:      admin@tedbirge.ai / Tedbirge2026! (ayni sifre)
  Ramazan:    ramazanduran111@gmail.com / TedbirgeGecici2026!
  Muzaffer:   muzaffertumsa@hotmail.com / 654321

═══════════════════════════════════════════════════════════════
  21 NISAN 2026 — GECE OTURUMU 2 (02:00–05:10) — DEVAM EDILECEK
═══════════════════════════════════════════════════════════════

Oturum 1 devamiydi. Backend tamamen canliya alindi, panel
reset-password sayfasi eklendi ama Vercel build FAIL.

YAPILANLAR (bu oturum):
- Render deploy sorunu tani: prisma generate eksik
- Fix: Procfile'a prisma generate eklendi (commit 02ec4e0)
- Fix: package.json postinstall hook eklendi (commit 24a0764)
- Render deploy basarili, backend canli
- Render env'e PANEL_URL=https://www.tedbirge.ai eklendi
- SMTP test edildi: tedbirge34@gmail.com test hesabi, mail geldi, link canli URL
- Link tiklaninca /reset-password sayfasi 404 (eksik)
- Panel repo'da yeni GitHub token kuruldu
- Panel'de app/(public)/reset-password/page.tsx olusturuldu (commit cfda987)
- Panel push edildi (10 birikmis commit + 2 yeni)
- Vercel deploy BASARISIZ (cfda987 icin Hata)
- tedbirge-ai.onrender.com'da Chrome "Tehlikeli site" uyarisi — yanlis pozitif, www.tedbirge.ai temiz

BACKEND DURUMU (tam calisiyor):
- www.tedbirge.ai: Calisiyor
- tedbirge-ai.onrender.com: Canli (commit 24a0764)
- Admin giris: Calisiyor
- Avukat listesi: Ramazan DURAN + Muzaffer TUMSA gorunuyor
- Sifre sifirlama mail gonderimi: Calisiyor
- Mail linki: Canli URL (www.tedbirge.ai/reset-password?token=...)

PANEL DURUMU (1 FAIL):
- Ana sayfa, login, dashboard, avukat yonetimi: Calisiyor
- /reset-password sayfasi: Kod yazildi ama Vercel build HATA
- Build hata muhtemel sebep: Next.js 16'da useSearchParams
  Suspense boundary icinde olmali. Sayfa bunu eksik.

SONRAKI OTURUM ILK IS (onemlilik sirasi):

1. Vercel build hatasini coz (10 dk)
   - Vercel dashboard → tedbirge-panel → en son deploy (cfda987)
   - Build log'una bak, hata mesajini kopyala, mimara ilet
   - Muhtemel fix: Suspense ile sarmala

2. Reset-password uctan uca test (5 dk)

3. Ramazan + Muzaffer'e bildirim (5 dk)

4. Supabase 7 gun heartbeat cron (30 dk, hafta sonu)

5. 2FA zorunluluk admin + lawyer icin (1 saat)

GIT DURUMU (21 Nisan 05:10):
- Backend master: 326cfb9 → sonrasi Procfile + postinstall fixleri
  origin/master: senkronize
- Panel master: cfda987 (reset-password + pending ui updates)
  origin/master: senkronize
- Uncommitted: yok

═══════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════
  21 NISAN 2026 — SABAH OTURUMU (05:10–08:00) — TAMAMLANDI
═══════════════════════════════════════════════════════════════

YAPILANLAR:
- Vercel build hatasi (Suspense boundary) duzeldi — commit 26ed40c
- Middleware public path listesine forgot-password + reset-password 
  eklendi — commit eb8221b
- Reset-password uctan uca test edildi: mail → link → yeni sifre → 
  giris → KVKK → dashboard CALISIYOR
- LexScan env var key uyumsuzlugu tespit edildi:
  AiChatWidget.tsx NEXT_PUBLIC_API_URL okuyordu ama Vercel'de 
  NEXT_PUBLIC_API_BASE_URL tanimliydi
- AiChatWidget.tsx standardize edildi — commit 801d4d7
- LexScan canlida dogrulandi: cevap veriyor
- tedbirge-os/docs/ olusturuldu, AUTOMATION_AND_IMPROVEMENT_PLAN_v1.md 
  + diger Downloads dosyalari tasindi
- Otomasyon katmani baslatildi:
  - Dependabot kuruldu (.github/dependabot.yml) — 27 Nisan Pazartesi 
    ilk PR'lar acilacak
  - UptimeRobot kuruldu, panel monitor aktif (www.tedbirge.ai)
    5 dakikada bir ping, mail: tedbirge42@gmail.com
  - Backend monitor (onrender.com) UptimeRobot UI bug'i nedeniyle 
    eklenemedi, sabah denenecek

V2 FIZIBILITE ICIN OKUNAN DOSYALAR (degisiklik yapilmadi):
- dashboard/page.tsx (932 satir, dual dashboard)
- leads/page.tsx (697 satir, kanban + tablo)
- leads/[id]/page.tsx (3-kolon, 5 sekme)
- auth.routes.js (2FA endpoint'leri mevcut)
- musteri.routes.js (5 endpoint)
- lexscan.routes.js + controller (mock mod fallback var)
- middlewares/ (7 dosya, rate limiter + RBAC + auth aktif)

KRITIK NOTLAR:
- Vercel eski env var NEXT_PUBLIC_API_URL hala duruyor, silinmeli
- LexScan mock mod fallback'i test edilmeli (key silinirse ne olur?)
- Musteri portal endpoint'leri dar, belge yukleme/odeme kontrol edilmeli
- 2FA altyapisi hazir ama zorunlu degil

═══════════════════════════════════════════════════════════════
  21 NISAN 2026 — OGLEDEN SONRA + AKSAM OTURUMU (15:00–22:30)
  TAMAMLANDI — CANLI KULLANICI GERI BILDIRIMI ODAKLI GUN
═══════════════════════════════════════════════════════════════

CANLI DURUM (21 Nisan 22:30):
- Ramazan DURAN: sisteme girdi, begendi, kullaniyor
- Zeliha ERSOY: kayitli, aktif kullanim bilinmiyor
- Muzaffer TUMSA: girecek ("bilgisayar basina gecince")
- UYAP entegrasyonu talebi geldi (Ramazan Abi)

BUGUN YAPILAN GUVENLIK + BUG FIXLERI (6 commit):

1. Avukat bilgisi sizintisi (sabah) — commit b774a11
   - assignment.service.js + petition.controller.js
   - passwordHash + 2FA secret cevaplardan temizlendi

2. Kalan lawyer:true sizintilari (3 dosya) — commit b47553d
   - lead.service.js (2 yer), durusma.service.js, deadlineChecker.job.js
   - musteri.controller.js isActive bugfix (dogru: status ACTIVE)

3. Middleware public path eksik — commit 99bda25
   - KRITIK: ziyaretciler /basvuru, /basvuru-sorgula, /tazminat-hesapla
     sayfalarina giremiyordu, hepsi /login'e yonlendiriliyordu
   - 11 public path eklendi (basvuru, kvkk, haberler, hakkimizda vs.)

4. Basvuru success ekrani yanlis yonlendirme — commit fe2e8ae
   - "Panele Git" butonu /leads'e gidiyordu (admin-only, misafir icin yanlis)
   - Duzeltme: "Basvurumu Takip Et" → /basvuru-sorgula

5. Basvuru sorgula endpoint uyumsuzlugu — commit 205d51c
   - Frontend /api/public/query-lead cagiriyordu
   - Backend /api/query-lead dinliyordu (publicRoutes root'a mount)
   - Duzeltme: frontend path /query-lead olarak standardize

6. KVKK UI iyilestirmesi — commit 3824da4
   - KVKK linki yerine modal ac butonu (iframe icinde gosterim)
   - Saglik verisi icin ikinci checkbox eklendi (amber renkli, acik riza)
   - Form icinde FormData'ya healthDataApproved eklendi
   - UYARI: Backend henuz healthDataApproved alanini KAYDETMIYOR,
     sadece gormezden geliyor. DB'ye kaydetme yarinki is.

RAPORLAR YAZILDI:
- docs/HUKUKCU_CRM_FIZIBILITE_v2.md (10 bolum, 4 oncelik seviyesi)
  * Mevcut durum (guclu yanlar + eksikler)
  * Avukatlarin tipik is akisi (varsayim)
  * 8 soruluk anket avukatlara sorulmasi icin hazir
  * Bu hafta / bu ay / bu ceyrek yol haritasi
  * UYAP icin 3 seviyeli yaklasim tasarimi (detay v4 raporunda)

OTOMASYON KATMANI KURULDU:
- Dependabot: .github/dependabot.yml (27 Nisan Pazartesi ilk PR'lar)
- UptimeRobot: www.tedbirge.ai paneli monitor aktif
  * backend monitor (onrender.com) PAUSE durumunda
    - Sebep: kok URL 404 donuyor (beklenen), health endpoint eksik
    - Yarinki is: /api/health endpoint ekle, monitor URL guncelle, unpause

CANLI MUVEKKIL TESTI YAPILDI (Mehmet Bey, gizli sekme):
- Basvuru: halis ak, 05541652542, konya, kaza geçirdim, PDF yuklendi
- leadCode: L-20260421-5297BU uretildi ✓
- Success ekrani dogru gorundu ✓
- "Basvurumu Takip Et" → /basvuru-sorgula dogru yonlendirdi ✓
- Sorgulama ilk denemede 404 (yukarida 5. fix ile cozuldu)
- Tekrar sorgulama: "Basvuru Alindi + 21 Nisan 2026" dondu ✓

═══════════════════════════════════════════════════════════════
YARIN (22 NISAN) BASLANACAK KRITIK ACIK ISLER:
═══════════════════════════════════════════════════════════════

A) ACIL (1-2 saat):
1. Backend /api/health endpoint ekle + UptimeRobot backend monitor unpause
2. Vercel eski NEXT_PUBLIC_API_URL env var sil
3. KVKK healthDataApproved alanini DB'ye kaydet (backend + schema migration)

B) UX BUGLARI (1-2 saat):
4. FOTOGRAF 4 MUAMMASI — "Tedbirge — sigorta ve surec teknolojisi"
   baslikli ikinci tasarim var. Mehmet Bey bulamadi ama ekran goruntusu var.
   Hangi route oldugu teshis edilmeli, buluntuya gore karar.
5. "Basvuru Sorgula" butonu giris sayfasina yonlendiriyor (navbar linki)
   - Direkt /basvuru-sorgula'ya gitmesi lazim, araya login sokmamali
6. Gorsel kimlik tutarsizligi — iki farkli tasarim dili birlestirmeli
   (buyuk is, tasarim karari gerek, acele degil)

C) AVUKAT GERI BILDIRIMLERI:
7. Ramazan DURAN + Zeliha ERSOY + Muzaffer TUMSA ile birebir gorusme
   - 8 soruluk anket: docs/HUKUKCU_CRM_FIZIBILITE_v2.md bolum 3
   - UYAP entegrasyonu tam olarak ne istiyorlar (3 seviyeden hangisi)

D) GELECEK RAPORLAR (sirayla):
8. v3 Muvekkil Girisi Fizibilitesi
9. v4 UYAP Entegrasyonu Raporu (Ramazan Abi talebi, onceliklendirilmis)
10. v5 Otomasyon + LexScan Akillandirma (Mehmet Bey icin eskalasyon)
11. v6 Guvenlik + KVKK Bosluk Kapatma (VERBIS kayit, acik riza akisi)

E) URUN IYILESTIRME TALEPLERI (Mehmet Bey'den):
12. SBM entegrasyonu (Sigorta Bilgi Merkezi)
13. Malpraktis (tibbi kotu uygulama) dava turu eklenmeli
14. Kaza Rekreasyon keşfedilebilirlik sorunu (UI'da bulunamiyor)

F) HUKUKI ISLER (Mehmet Bey + avukatlar):
15. VERBIS kayit durumu netlestir
16. KVKK aydinlatma metni /kvkk sayfasi avukat onayi
17. Veri isleyen sozlesmeleri (Supabase, Vercel, Render, Anthropic)

═══════════════════════════════════════════════════════════════
IMZA: 21 Nisan 2026, 22:30
Toplam bugun: 6 commit, 1 yeni rapor, 2 otomasyon araci kuruldu,
             1 canli muvekkil testi basarili, 4 UX bug tespit (3 cozuldu)
═══════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════
