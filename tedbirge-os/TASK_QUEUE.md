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
2. WhatsApp gerçek API — WHATSAPP_TOKEN + WHATSAPP_PHONE_ID env gir
3. SMTP şifre — SMTP_PASS ile Gmail App Password gir
4. Deploy — Vercel (panel) + Railway (backend) kurulumu
5. KVKK onay akışı — public-lead formuna rıza checkbox + Lead modeline kvkkConsentAt
6. SGK gerçek API — mock'u SGK e-Bildirge ile değiştir
7. UYAP gerçek API — mock'u UYAP API ile değiştir
8. Avukat eşleşme mantığı — lead scoring + otomatik atama
9. Google My Business entegrasyonu — yorum yönetimi
10. E-imza entegrasyonu (KEP / BTK onaylı)
11. Müvekkil mobil uygulaması

## DONE
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
