# KVKKSCC — Yurt Dışı Aktarım Standart Sözleşme Maddeleri Kayıt

**Madde 24.10 + KVKK m.9 disiplini.**

Tedbirge.ai 4 yurt dışı sağlayıcıya kişisel veri aktarır. Her sağlayıcı için bu klasörde Standart Sözleşme Maddeleri (SCC) referansları + KVKK uygunluk değerlendirmesi tutulur.

## 4 Sağlayıcı

1. **Supabase** (ABD) — Veritabanı + Storage. `SUPABASE.md`
2. **Anthropic** (ABD) — AI analizi (Claude). `ANTHROPIC.md`
3. **Meta WhatsApp** (ABD/EU) — WhatsApp Business API mesajlaşma. `META_WHATSAPP.md`
4. **Google Gmail** (ABD) — E-posta gönderim + Google Analytics. `GMAIL.md`

## DB Eşleşmesi

`KVKKSCC` tablosunda her sağlayıcı için 1 satır mevcuttur (TUR #52 seed). UI: `/dashboard/kvkk-talepler` ve `/kvkk-aydinlatma` üzerinden referans.

## Yasal Çerçeve

- **KVKK m.9** — Yurt dışına aktarım yeterli korumanın bulunduğu ülke veya açık rıza/SCC ile mümkün.
- **KVKK Kurulu Karar 2020/559** — SCC ve BCR (Bağlayıcı Şirket Kuralları) kabulü.
- **GDPR Art. 46** — SCC standart hükümler (AB karşılığı, Tedbirge ABD aktarımları için referans değil ama uyumlu prensip).
- **AB-ABD Veri Gizlilik Çerçevesi** (Data Privacy Framework, 2023) — Supabase/Anthropic/Meta/Google katılımcı.

## Süreç

- Her yeni 3. taraf entegrasyonu öncesi → bu klasöre yeni dosya
- DB'ye kayıt eklenir (KVKKSCC.create)
- KVKK aydınlatma metnine listede gösterilir
- Yıllık gözden geçirme (gecerliMi alanı)

— Tedbirge LegalTech, 30 Nisan 2026
