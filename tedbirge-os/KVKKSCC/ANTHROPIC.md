# Anthropic — KVKK Yurt Dışı Aktarım

## Sağlayıcı Kimliği

- **Yasal isim:** Anthropic, PBC
- **Adres:** 548 Market St PMB 90375, San Francisco, CA 94104, ABD
- **Web:** https://www.anthropic.com
- **DPA:** https://www.anthropic.com/legal/commercial-terms
- **Trust Center:** https://trust.anthropic.com

## Veri Kategorisi

Tedbirge'in Anthropic'e (Claude API) aktardığı kişisel veriler:

- **Lead özeti:** Müvekkil adı (anonimleştirilmiş), kaza özeti
- **Belge OCR çıktıları:** Tutanak, eksper raporu metin içeriği
- **Muhatap analizi prompt:** Kaza türü, taraflar, sigorta poliçesi detayları
- **Dilekçe taslağı girdileri:** Hukuki süreç bilgileri

**ÖNEMLİ:** Anthropic API çağrıları **eğitim amacıyla saklanmaz** (Anthropic Commercial Terms — "we will not train on your data").

## Aktarım Amacı

- AI muhatap analizi (`muhatapAI.service.js`)
- Dilekçe taslağı üretme (`ai.service.js`)
- Belge sınıflandırma (`classifier.service.js`)
- Karar destek (`decision.service.js`)

## Yer

- API endpoint: `api.anthropic.com` (US-West / Oregon, Ashburn-VA, multi-region)
- Veri **transit'te şifreli** (TLS), **at-rest TTL** 30 gün (loglar — abuse detection için)

## KVKK m.9 Uygunluk

- **Çerçeve:** AB-ABD Veri Gizlilik Çerçevesi (DPF) — Anthropic katılımcı (https://www.dataprivacyframework.gov participant list)
- **DPA:** Anthropic Commercial Terms + Acceptable Use Policy
- **SCC referansı:** Anthropic Commercial Terms section 6 (Data Protection Addendum) — DPF bazlı standart hükümler
- **İmza:** API key oluşturma tarihiyle otomatik kabul

## Tedbirge İç Kontroller

- API key Render env `ANTHROPIC_API_KEY` (production) — git'te yok
- Belge OCR öncesi PII redaction değerlendirilmesi (gelecek tur — şu an raw)
- AI Usage Log (`AIUsageLog` tablosu) — her çağrı kaydı

## Risk Değerlendirmesi

- **Orta:** Hassas veri (sağlık, dava içeriği) aktarımı var
- **Mitigasyon:** Güven skoru < 0.7 ise insan onayı zorunlu (`muhatapAI.service.js` policy)
- **Yıllık gözden geçirme:** 14 Nisan 2027

— Tedbirge LegalTech, 30 Nisan 2026 (TUR #52)
