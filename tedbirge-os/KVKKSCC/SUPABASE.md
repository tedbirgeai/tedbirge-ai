# Supabase — KVKK Yurt Dışı Aktarım

## Sağlayıcı Kimliği

- **Yasal isim:** Supabase Inc.
- **Adres:** 970 Toa Payoh North #07-04 Singapore 318992 (HQ) / ABD operasyon
- **Web:** https://supabase.com
- **DPA:** https://supabase.com/legal/dpa
- **Trust Center:** https://supabase.com/security

## Veri Kategorisi

Tedbirge'in Supabase'e aktardığı kişisel veriler:

- **Müvekkil verileri:** Ad, soyad, telefon, e-posta, TC (opsiyonel), adres, sağlık verisi (sigorta dosyası), banka IBAN
- **Avukat verileri:** Ad, baro sicil, e-posta, telefon
- **Belge dosyaları:** Yüklenen tutanak, eksper raporu, sağlık raporu, vekalet
- **Audit izi:** ActivityLog, ChatMessage

## Aktarım Amacı

- PostgreSQL veritabanı barındırma
- S3-uyumlu obje storage (belge dosyaları)
- Row-level security ile çok kiracılı izolasyon

## Yer (Region)

- **Tedbirge production:** `iikpmzomblocdrxeisxh.supabase.co` (US-East / Virginia)
- **Tedbirge dev:** `dlkctvyjbuulmkgpqcvm.supabase.co`

## KVKK m.9 Uygunluk

- **Çerçeve:** AB-ABD Veri Gizlilik Çerçevesi (Data Privacy Framework, 2023) — Supabase EU-US DPF sertifikalı.
- **DPA:** Standart Veri İşleme Sözleşmesi (Supabase DPA — https://supabase.com/legal/dpa) Tedbirge hesap açılışında otomatik kabul.
- **SCC referansı:** Supabase DPA Annex II (Module 2 — Controller to Processor SCC).
- **İmza:** Hesap açılış tarihiyle otomatik kabul — 14 Nisan 2026 (Tedbirge production veritabanı oluşturma tarihi).

## Tedbirge İç Kontroller

- Veriler **şifreli** transfer edilir (TLS 1.3)
- At-rest encryption (AES-256, Supabase varsayılan)
- Row Level Security (RLS) tüm hassas tablolarda aktif
- API key rotation politikası (60 gün)

## Risk Değerlendirmesi

- **Düşük:** Supabase olgun, GDPR uyumlu, HIPAA-ready
- **Yıllık gözden geçirme:** 14 Nisan 2027 (gecerliMi flag kontrol)

— Tedbirge LegalTech, 30 Nisan 2026 (TUR #52)
