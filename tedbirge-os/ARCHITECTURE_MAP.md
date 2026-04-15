# ARCHITECTURE MAP

## CORE
- Lead — Merkezi varlık (leadCode, LeadStatus, AI alanları)
- Document — Yüklenen belgeler (UPLOADED→PARSED→ANALYZED)
- AI — Claude claude-sonnet-4-6 (analiz, sözleşme, dilekçe)
- Contract — SERVICE_AGREEMENT + POWER_OF_ATTORNEY

## USER LAYER
- Mağdur (CUSTOMER) — self-servis portal, başvuru sorgulama
- Avukat (LAWYER) — lead görüntüleme, belge erişimi
- Operasyon (SALES) — lead yönetimi, atama
- Admin (ADMIN) — kullanıcı yönetimi, tüm erişim

## EXTENDED (Mock/Hazır)
- UYAP — Mock dava sorgulama (uyapDosyaNo, uyapMahkeme)
- SGK — Mock maluliyet ve gelir verisi
- WhatsApp — Meta Graph API mock
- SMS — Netgsm mock
- E-posta — Nodemailer SMTP mock

## PLATFORM LOGIC
- mağdur → veri (public form)
- sistem → AI analiz (compensation engine + Claude)
- avukat → para (başarı komisyonu)

## MEVCUt FAZ: Faz 3 — Sosyal Medya ve Deploy Hazırlığı

### Tamamlanan Fazlar
#### Faz 1 — Stabil MVP ✅
belge yükle → OCR → AI analiz → sözleşme → avukat atama

#### Faz 2 — Belge Kalitesi ve Operasyon ✅
- Türkçe karakter düzeltmeleri
- Sözleşme AI entegrasyonu (claude-sonnet-4-6)
- PDF üretimi
- Avukat + müvekkil bildirimleri
- Dashboard analytics

#### Faz 3 — Sosyal Medya ve Deploy (AKTİF)
- Public ana sayfa + tazminat hesaplama
- Referanslar sayfası
- AI Chat Widget
- Domain: tedbirge.ai
- Deploy: Vercel + Railway

### Gelecek Fazlar
#### Faz 4 — Gerçek Entegrasyonlar
- WhatsApp / SMS gerçek API
- SMTP gerçek
- UYAP gerçek API
- SGK gerçek API
- KVKK onay akışı

#### Faz 5 — SaaS ve Mobil
- Avukat eşleşme motoru
- Avukat abonelik modeli
- React Native mobil uygulama
- E-imza KEP entegrasyonu
