# Google Gmail (Workspace) — KVKK Yurt Dışı Aktarım

## Sağlayıcı Kimliği

- **Yasal isim:** Google Ireland Limited (EU) / Google LLC (ABD)
- **Adres:** Gordon House, Barrow Street, Dublin 4, İrlanda (EU) / 1600 Amphitheatre Parkway, Mountain View, CA 94043 (ABD)
- **Web:** https://workspace.google.com
- **DPA:** https://workspace.google.com/terms/dpa_terms.html
- **Trust Center:** https://workspace.google.com/intl/tr/security/

## Veri Kategorisi

Tedbirge'in Gmail/Google üzerinden işlediği veriler:

- **E-posta gönderim:** Müvekkil/avukat e-posta + ad soyad
- **E-posta içeriği:** İşlemsel bildirimler (yeni başvuru, avukat atama, KVKK cevabı, kariyer bildirimi)
- **Google Analytics 4** (cookie consent ile aktif): IP, user-agent, sayfa görüntüleme

## Aktarım Amacı

- Transactional e-posta gönderim (`email.service.js` — nodemailer + SMTP via Gmail)
- Web sitesi analytics (cookie consent gerekli — KVKK m.5/2-a)
- Google Search Console (SEO indeksleme)

## Yer

- SMTP endpoint: `smtp.gmail.com` (Multi-region)
- Analytics endpoint: `analytics.google.com` (Multi-region)
- Gmail veri merkezleri: Multi-region (ABD + EU + Asya)

## KVKK m.9 Uygunluk

- **Çerçeve:** AB-ABD Veri Gizlilik Çerçevesi (DPF) — Google katılımcı
- **DPA:** Google Workspace DPA (https://workspace.google.com/terms/dpa_terms.html)
- **SCC referansı:** Google Workspace DPA Section 10 (International Data Transfers)
- **İmza:** Google Workspace hesap açılış tarihi ile otomatik kabul

## Tedbirge İç Kontroller

- SMTP_USER + SMTP_PASS Render env (production) — git'te yok
- Gmail App Password kullanılıyor (2FA aktif)
- GA4 sadece **cookie consent** verildiyse tetiklenir (CookieConsent component)
- IP anonymization GA4 yapılandırmasında aktif

## Risk Değerlendirmesi

- **Düşük:** İşlemsel e-posta + analytics opt-in
- **Mitigasyon:** Cookie consent reddi → GA4 tetiklenmez
- **Yıllık gözden geçirme:** 14 Nisan 2027

— Tedbirge LegalTech, 30 Nisan 2026 (TUR #52)
