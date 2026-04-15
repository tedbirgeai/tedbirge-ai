# DECISION_LOG

## 2026-04-10

### Karar
SQLite → PostgreSQL geçişi ertelendi (o tarihte)

### Sebep
- Sistem o zaman stabil
- Erken migration yüksek riskli
- Öncelik ürünleşme, mimari göç değil

---

### Karar
Öncelik belge kalitesi

### Sebep
- Ürün güven üretmiyor
- Çalışan sistemin önündeki en büyük kalite sorunu buydu

---

### Karar
Tek görev, tek odak

### Sebep
- Aynı anda çok iş sistemi dağıtıyor
- OS disiplinini korumak gerekiyor

---

### Karar
Backup zorunlu

### Sebep
- Geri dönüş noktası olmadan geliştirme yüksek riskli
- Sistem sürekliliği için snapshot gerekir

## 2026-04-10 — PATCH GOVERNANCE DECISION

### Karar
TEDBIRGE OS kapsamında bundan sonra kor patch uygulanmayacak.

### Bağlayıcı Kurallar
- Hedef dosya görülmeden patch yok
- Mevcut içerik doğrulanmadan overwrite yok
- Mümkünse tek split / tek parça komut
- En küçük güvenli değişiklik
- Refactor yok, varsayım yok

### Gerekçe
Geçmiş yanlış overwrite / kor patch riski sistem sürekliliğini bozabileceğinden, bundan sonraki tüm uygulamalar doğrulanmış dosya içeriğine dayalı ve kontrollü olacak.

## 2026-04-15 — VERITABANI KARARI

### Karar
SQLite kaldırıldı, PostgreSQL (Supabase) aktif.

### Sebep
- Proje üretim ortamına hazırlanıyor
- Supabase managed PostgreSQL seçildi
- DATABASE_URL .env'de Supabase bağlantı adresi olarak güncellendi
- Prisma connection pool parametreleri eklendi (connection_limit=20)

## 2026-04-15 — AI ENTEGRASYONU KARARI

### Karar
Claude entegrasyonu tamamlandı. Model: claude-sonnet-4-6

### Sebep
- ANALYSIS_MODE=real ile sözleşme ve belge üretimi Claude API üzerinden yapılıyor
- Eski model adı (claude-sonnet-4-20250514) güncellendi
- Mock mod korundu (ANALYSIS_MODE=mock ile şablon kullanımı)

## 2026-04-15 — DEPLOY PLANI KARARI

### Karar
Deploy: Vercel (panel) + Railway (backend)

### Sebep
- Vercel Next.js için native destek
- Railway Node.js + PostgreSQL için uygun
- Supabase DB her iki ortamla uyumlu

## 2026-04-15 — AKTIF GOREV KAPANISI

### Kapanan Görev
Belge motoru kalite düzeltmesi + Vekalet template düzeltme

### Sonraki ACTIVE
Sosyal medya entegrasyonu / domain / deploy hazırlığı
