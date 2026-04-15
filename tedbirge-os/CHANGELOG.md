# CHANGELOG

## 2026-04-15 — os:update (20260415T092423)
- CURRENT_STATE.md otomatik güncellendi (npm run os:update)
- Sistem durumu, tarih ve risk alanları yenilendi

## 2026-04-10
- TEDBIRGE OS klasör yapısı kuruldu
- MASTER_OS oluşturuldu
- CURRENT_STATE oluşturuldu
- TASK_QUEUE oluşturuldu
- DECISION_LOG oluşturuldu
- OPERATING_LOOP oluşturuldu
- ARCHITECTURE_MAP oluşturuldu
- REVENUE_MODEL oluşturuldu
- LEGAL_GUARD oluşturuldu
- TECH_DECISIONS oluşturuldu
- TEST_PROTOCOL oluşturuldu
- USAGE_PROTOCOL oluşturuldu
- Backup engine eklendi
- Snapshot disiplini eklendi

## 20260410-085431
- TEDBIRGE OS proje beynine patch governance kuralı işlendi.
- Kor patch yasaklandı.
- Dosya içeriği doğrulanmadan değişiklik yapılmaması anayasa kuralına bağlandı.
- Mümkün olan her iş için tek split / tek parça komut standardı eklendi.

## 20260410-094505
- ACTIVE görev olan "Belge motoru kalite düzeltmesi" tamamlandı.
- src/services/document-template.service.js içinde principal_name ve case_summary veri hazırlama mantığı güçlendirildi.
- Vefat, yaralanma ve araç dosyaları için belgeye giden veri kalitesi iyileştirildi.
- Sözleşme template metni güçlendirildi.
- Belge çıktıları boş/generic hissinden çıkarılarak daha ürün benzeri hale getirildi.
- Küçük 3.A blok kırığı düzeltildi.

## 20260415 — Büyük Oturum (Birinci - Yedinci Oturum)
- Sözleşme AI entegrasyonu: claude-sonnet-4-6, ANALYSIS_MODE=real
- Türkçe karakter mojibake düzeltmeleri (document-template.service.js, tüm template dosyaları)
- Sözleşme frontend sayfası yeniden yazıldı (aç/kapat toggle, ayrı state)
- Kullanıcı yönetimi: /api/auth/register → ADMIN only, GET /api/auth/users
- dashboard/kullanicilar/page.tsx oluşturuldu
- PDF endpoint: GET /api/contracts/:id/pdf (pdfkit, Windows Arial font)
- PATCH /api/contracts/:id sözleşme düzenleme
- Müvekkil self-servis portalı: /musteri rotası, zamanaşımı badge
- UYAP mock entegrasyonu: uyapDosyaNo, uyapMahkeme, duruşma tarihi
- SGK mock servisi: maluliyet oranı, günlük kazanç, sigortalılık bilgisi
- SMS: Netgsm API mock (sms.service.js)
- E-posta: Nodemailer SMTP mock (email.service.js)
- WhatsApp: Meta Graph API v19.0 mock (whatsapp.service.js)
- Public ana sayfa: hero, nasıl çalışır, özellikler, yorumlar
- Tazminat hesaplama: 3 adımlı form, PMF tablosu, kusur slider
- Haberler sayfası: 9 mock haber, kategori filtresi
- Panel hukuki haberler: Yargıtay, SGK, mevzuat sekmeleri
- AI Chat Widget: public sayfalarda sağ alt köşe
- Referanslar sayfası: 6 anonim yorum, basında biz
- Zamanaşımı cron job: node-cron, her gün 08:00
- Analytics: avukat performans tablosu
- Renk sistemi: #1E1E8E (lacivert) + #5CB85C (yeşil) — logo renkleri
- Logo entegrasyonu: logo.png + icon.png
- AppLayout routing: CUSTOMER → /musteri yönlendirme
- basvuru-sorgula public sayfası: telefon/kod ile sorgulama
- Dashboard zamanaşımı widget (criticalLeads)

## 20260415 — TEDBIRGE OS Senkronizasyonu
- Tüm OS dosyaları 2026-04-15 tarihi ve mevcut sistem durumuna göre güncellendi
- Mojibake Türkçe karakter sorunları tüm OS dosyalarında düzeltildi
- CURRENT_STATE: tarih, AI durumu, DB durumu güncellendi
- TASK_QUEUE: tamamlananlar DONE'a taşındı, yeni aktif görev belirlendi
- DECISION_LOG: SQLite→PostgreSQL, Claude entegrasyonu, deploy planı notları eklendi
- TECH_DECISIONS: mevcut stack güncellendi (PostgreSQL, claude-sonnet-4-6, deploy planı)
- ARCHITECTURE_MAP: mevcut faz=3 olarak güncellendi
- Gereksiz backup klasörleri ve dosyalar silindi

## 20260415 — Seviye 1 Hafıza Sistemi
- scripts/auto-update.js oluşturuldu (CURRENT_STATE ve CHANGELOG otomatik güncelleme)
- package.json'a "os:update" script eklendi
- OPERATING_LOOP.md güncellendi (oturum sonu npm run os:update notu)
- CLAUDE.md güncellendi (oturum sonu os:update talimatı)
