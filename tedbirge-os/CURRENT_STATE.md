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
