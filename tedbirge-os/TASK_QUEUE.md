# TASK_QUEUE

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

## ACTIVE
1. Sosyal medya entegrasyonu / domain / deploy hazırlığı

## TODO
1. Avukat bilgisi maskeleme — assignments[].lawyer temsilciye sızıyor, GÜVENLİK AÇIĞI
2. TÜRKAN DİNÇ bolge='Konya' güncellemesi (dün yarım kaldı)
3. Müvekkil SMS onay akışı — Contract.musteriOnayladi/onayKodu DB'de hazır, endpoint ve SMS linki yok
4. Admin manuel avukat atama UI
5. Wizard UX iyileştirme: "Devam Et disabled" sebep tooltip'i
6. Supabase'de sözleşme hash+version+IP alanları doğrulaması (bugün yapılamadı)
7. İl/bölge listesi kararı (81 il mi, 7 bölge mi, ilçe mi? — karar verilmeden kodlanmayacak)
8. Avukat panelinde "Hakediş tetikle" butonu (Lead.hakEdisStatus HAK_EDILDI işaretleme)
9. Hakediş hesaplama servisi (KDV formülü için mali müşavir onayından sonra)
10. Admin şeffaflık paneli (hangi müvekkil hangi temsilciden geldi takibi, masraf/hakediş şeffaf)
11. Geçmişte kaydolmuş temsilcilerin v1.0 sözleşmesini yeniden onaylama mekanizması (eski %5 kayıtları için)
12. Mail altyapısı (domain Spaceship'te — büyük resim netleşene kadar ertelendi, DECISION_LOG 18 Nis kararı geçerli)
13. Kaza Rekonstrüksiyon: /analyze idempotency guard — status EVIDENCE_READY dışında çağrılırsa 409 Conflict dönsün; force=true query param ile override edilsin. (2026-04-18)
14. WhatsApp gerçek API — WHATSAPP_TOKEN + WHATSAPP_PHONE_ID env gir
15. SMTP şifre — SMTP_PASS ile Gmail App Password gir
16. Deploy — Vercel (panel) + Railway (backend) kurulumu
17. KVKK onay akışı — public-lead formuna rıza checkbox + Lead modeline kvkkConsentAt
18. SGK gerçek API — mock'u SGK e-Bildirge ile değiştir
19. UYAP gerçek API — mock'u UYAP API ile değiştir
20. Avukat eşleşme mantığı — lead scoring + otomatik atama
21. Google My Business entegrasyonu — yorum yönetimi
22. E-imza entegrasyonu (KEP / BTK onaylı)
23. Müvekkil mobil uygulaması
24. E-posta altyapısı ve tutarlılık (2026-04-18 sonrası):
    a) Mail sunucusu kur (Cloudflare Routing veya Zoho free plan)
    b) bilgi@tedbirge.ai çalışır hale getir
    c) Kod tabanındaki 6 adres referansını env-based yap
    d) Tüm adresler bilgi@'ya yönlendirilsin (kvkk@ muhtemelen ayrı kalmalı)
    e) Broşürlerdeki bilgi@tedbirge.ai gerçekten çalışsın

## DONE
- Temsilci dashboard + wizard (2026-04-19 öğleden sonra)
- Kullanıcılar tablosu UI durum bug düzeltmesi (2026-04-19 sabah)
- NetGSM SMS onay bildirimi (2026-04-19 sabah)
- Karar destek servisi (3 stub + 1 gerçek fonksiyon)
- Temsilci sözleşmesi v1.0 backend + frontend entegrasyonu (2026-04-19)
- DB şeması: User (sozlesme* 3 alan) + Lead (masraf/KDV/hakediş 6 alan) (2026-04-19)
- Yeni public endpoint: GET /api/contracts/temsilci/current (2026-04-19)
- Komisyon default 5 -> 50 (sözleşmeye uyum) (2026-04-19)
- Sözleşme hash + version + IP DB kaydı (2026-04-19)
- Belge motoru kalite düzeltmesi (2026-04-10)
- Vekalet template düzeltme (2026-04-10)
- Sözleşme AI entegrasyonu — claude-sonnet-4-6 (2026-04-15)
- Türkçe karakter mojibake düzeltmeleri (2026-04-15)
- Kullanıcı yönetimi — ADMIN only kayıt (2026-04-15)
- PDF endpoint — pdfkit (2026-04-15)
- Müvekkil self-servis portalı (2026-04-15)
- UYAP mock entegrasyonu (2026-04-15)
- SMS Netgsm mock + e-posta Nodemailer mock (2026-04-15)
- WhatsApp Business API mock (2026-04-15)
- Public ana sayfa + tazminat hesaplama + haberler (2026-04-15)
- AI Chat Widget (2026-04-15)
- Renk sistemi: #1E1E8E / #5CB85C (2026-04-15)
- Logo entegrasyonu (2026-04-15)
- Zamanaşımı cron job — node-cron (2026-04-15)
- Sosyal kanıt sayfası (referanslar) (2026-04-15)
- Avukat performans analytics (2026-04-15)
- SGK mock servisi (2026-04-15)
- Gereksiz backup klasörleri temizlendi (2026-04-15)
- TEDBIRGE OS senkronize edildi (2026-04-15)

## COMMIT BEKLEYEN BİRİKMİŞ İŞLER (2026-04-20 itibarıyla)

Aşağıdaki gruplar kodda tamamlandı ancak henüz commit edilmedi.
Her grup bağımsız bir commit olarak atılmalı.

### 1. 2FA + Kullanıcı Kabul Akışı
Dosyalar: src/controllers/auth.controller.js, src/services/auth.service.js, prisma/schema.prisma
Test edildi mi: Kısmi (login akışı test edildi, 2FA QR kodu tarayıcıda doğrulanmadı)
Commit mesajı: `feat: add TOTP 2FA and terms acceptance flow for LAWYER role`

### 2. Sözleşme Modülü
Dosyalar: src/controllers/contract.controller.js, src/routes/contract.routes.js, src/templates/contracts/temsilci-contract.template.js
Test edildi mi: Evet (sözleşme generate + PDF endpoint çalışıyor)
Commit mesajı: `feat: contract generation with AI mode and PDF download`

### 3. Kaza Rekonstrüksiyon
Dosyalar: src/controllers/accidentCase.controller.js, src/routes/accidentCase.routes.js, src/services/kazaRekonstruksiyon.service.js
Test edildi mi: Hayır (panel UI bağlantısı test edilmedi, 401/500 bloğu açık)
Commit mesajı: `feat: accident reconstruction service and routes (WIP)`

### 4. Karar Destek Motoru
Dosyalar: src/services/decision-support.service.js, src/routes/decision-support.routes.js, src/routes/index.js (mount)
Test edildi mi: Evet (5/5 curl testi PASS — 2026-04-19)
Commit mesajı: `feat: decision support engine (zamanaşımı, TC doğrulama, il-avukat uyumu)`

### 5. SMS Onay Bildirimi
Dosyalar: src/controllers/onay.controller.js, src/services/sms.service.js
Test edildi mi: Evet (gerçek NetGSM SMS gönderildi — 2026-04-19)
Commit mesajı: `feat: send NetGSM SMS on temsilci approval`

### 6. Docker Hazırlığı
Dosyalar: .dockerignore, Dockerfile
Test edildi mi: Hayır (build denenmedi)
Commit mesajı: `chore: add Dockerfile and .dockerignore for production deploy`

### 7. Lead / Route Çeşitli Güncellemeler
Dosyalar: src/controllers/lead.controller.js, src/routes/lead.routes.js
Test edildi mi: Kısmi
Commit mesajı: `feat: lead controller additions (GDPR delete, UYAP, SGK, emsal, kaza raporu)`

### 8. Config / Meta
Dosyalar: .gitignore, CLAUDE.md, package.json, package-lock.json, tedbirge-os/CURRENT_STATE.md
Test edildi mi: N/A
Commit mesajı: `chore: update gitignore, deps, and project metadata`
