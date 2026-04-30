# Meta WhatsApp — KVKK Yurt Dışı Aktarım

## Sağlayıcı Kimliği

- **Yasal isim:** Meta Platforms Ireland Limited (EU müvekkili) / Meta Platforms, Inc. (ABD)
- **Adres:** Merrion Road, Dublin 4, D04 X2K5, İrlanda (EU) / 1601 Willow Road, Menlo Park, CA 94025 (ABD)
- **Web:** https://business.whatsapp.com
- **DPA:** https://www.facebook.com/legal/terms/dataprocessingterms
- **Trust Center:** https://privacycenter.meta.com

## Veri Kategorisi

Tedbirge'in WhatsApp Business API üzerinden ilettiği veriler:

- **Müvekkil telefon numarası**
- **Mesaj içeriği:** Bildirim metinleri (yeni başvuru, avukat atama, duruşma uyarısı, dava aşaması)
- **Şablon parametreleri:** Müvekkil adı, lead kodu, tarih

## Aktarım Amacı

- WhatsApp Business API üzerinden müvekkil/avukat bildirim
- 3 onaylı şablon: `WA_TEMPLATE_YENI_BASVURU`, `WA_TEMPLATE_AVUKAT_ATAMA`, vb.

## Yer

- WhatsApp Business API endpoint: `graph.facebook.com` (Multi-region — EU + ABD)
- Mesaj end-to-end şifreli (Signal Protocol)

## KVKK m.9 Uygunluk

- **Çerçeve:** AB-ABD Veri Gizlilik Çerçevesi (DPF) — Meta katılımcı
- **DPA:** Facebook Data Processing Terms (https://www.facebook.com/legal/terms/dataprocessingterms)
- **SCC referansı:** Meta Business Tools Terms + standart EU SCC modülleri
- **İmza:** WhatsApp Business hesap açılış tarihi ile otomatik kabul

## Tedbirge İç Kontroller

- WhatsApp Business API token Render env `WHATSAPP_TOKEN`
- Sadece **müvekkilin opt-in verdiği** numaralara bildirim gönderilir (KVKK m.5/2-c sözleşme + m.5/2-f meşru menfaat)
- İYS (e-Ticaret K.) entegrasyonu: müvekkil opt-out hakkı (her bildirimde bilgilendirme)

## Risk Değerlendirmesi

- **Düşük-orta:** Sadece bildirim metinleri (transactional), pazarlama değil
- **Mitigasyon:** Şablon onaylı, içerik hukuki değil ürün-temelli
- **Yıllık gözden geçirme:** 14 Nisan 2027

— Tedbirge LegalTech, 30 Nisan 2026 (TUR #52)
