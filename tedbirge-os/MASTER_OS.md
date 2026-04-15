# 🧠 TEDBIRGE OS – MASTER_OS.md

## 1. PROJE TANIMI
Tedbirge.ai; trafik kazası ve benzeri tazminat odaklı hukuki süreçlerde başvuru toplama, belge işleme, AI destekli ön analiz, belge üretimi, hukukçu yönlendirmesi ve süreç takibi yapan çok taraflı bir teknoloji platformudur.

## 2. ANA PROBLEM TANIMI
- Mağdur ne yapacağını bilmiyor
- Belgeler dağınık ve eksik
- Avukata hazırlıksız gidiliyor
- Avukat hazır ve nitelikli dosyaya geç ulaşıyor
- Ön değerlendirme manuel ve maliyetli

## 3. HEDEF KULLANICILAR
### Birincil
- Trafik kazası mağdurları
- Yaralanma / vefat / araç hasarı dosyaları

### kincil
- Avukatlar
- Hukuk büroları
- Operasyon ekipleri

### Üçüncül
- Gelecekte sigorta, aktüerya, entegrasyon ve çözüm ortakları

## 4. ANA DEER ÖNERS
### Mağdur için
- Ne yapacağını netleştirir
- Belgeleri toplar ve düzenler
- Süreci hızlandırır

### Avukat için
- Hazır ve analiz edilmiş müvekkil
- Operasyon yükü azalır
- Dönüşüm ihtimali yüksek dosya sunar

## 5. YAKIN HEDEF
Çalışan, güvenilir, tek akışı sağlam bir MVP kurmak.

## 6. NHA HEDEF
Türkiye’de lead-to-case sürecini yöneten en güçlü platform olmak.

## 7. ÜRÜN VZYONU
- Lead engine
- Document engine
- AI analysis engine
- Contract engine
- Lawyer matching engine
- Case tracking system
- Lawyer SaaS platform
- Mobil uygulama

## 8. ALTIN AKIŞ
başvuru → belge yükleme → AI analiz → operasyon kararı → belge üretimi → avukat eşleşmesi → aktif takip

## 9. PLATFORM PRENSB
Tedbirge.ai çok taraflı bir platformdur ancak aşamalı genişleme ile büyür.

## 10. SEKTÖR AKTÖR HARTASI
### Para getiren
- avukatlar

### Trafik getiren
- mağdurlar
- yönlendirme kanalları

### Sistem aktörleri
- sigorta şirketleri
- SBM
- kamu kurumları
- aktüerler

## 11. SSTEM SINIRLARI
- Hukuki mütalaa yerine geçmez
- Kesin tazminat vaadi vermez
- Resmi vekalet yerine geçmez
- nsan kontrolü olmadan bağlayıcı sonuç üretmez

## 12. HUKUK KORUMA LKELER
- Platform teknoloji sağlayıcısıdır
- AI çıktıları ön değerlendirmedir
- Nihai hukuki kontrol uzman onayına tabidir
- KVKK ve açık rıza zorunludur

## 13. DOKUNULMAZ ALANLAR
- Çalışan endpoint kırılmaz
- Stabil backend akışı gereksiz yere bozulmaz
- Aynı anda backend ve panel çekirdeğine müdahale edilmez
- Refactor yapılmaz

## 14. TEKNOLOJ PRENSPLER
- Çalışan sistem korunur
- Gereksiz teknoloji değişimi yapılmaz
- Yeni teknoloji yalnızca açık fayda ve düşük risk varsa değerlendirilir

## 15. KARAR ALMA HYERARŞS
1. Hukuki güvenlik
2. Sistem stabilitesi
3. Gelir etkisi
4. Kullanıcı deneyimi
5. Geliştirici kolaylığı

## 16. GELŞTRME PROTOKOLÜ
backup → snapshot → teşhis → tek patch → test → changelog → devam

## 17. BÜYÜME FAZLARI
- Faz 1: Stabil MVP
- Faz 2: Belge kalitesi ve operasyon
- Faz 3: Avukat eşleşme ve gelir
- Faz 4: Aktif takip
- Faz 5: SaaS ve mobil

## 18. GELR MODEL LKELER
- Lead satışı
- Avukat abonelik
- Başarı komisyonu

## 19. BAŞARI METRKLER
- Başvuru → analiz dönüşüm oranı
- Analiz → avukat eşleşme oranı
- Belge tamamlama oranı
- Lead kalite skoru
- Sistem hata sıklığı

## 20. REVZYON KURALI
Bu dosya sistemin anayasasıdır. Keyfi değiştirilmez. Büyük kararlarla birlikte güncellenir.

## 21. ŞLETM DSPLN
- OS okunmadan görev başlatılamaz
- TASK_QUEUE dışına çıkılamaz
- ACTIVE görev bitmeden yeni görev alınamaz
- CHANGELOG yazılmadan görev tamamlanmış sayılmaz
- CURRENT_STATE güncellenmeden ilerleme olmaz
- Refactor yasaktır
- Aynı anda birden fazla sistem değiştirilemez

## 22. BACKUP KURALI
- Kritik değişiklik öncesi backup zorunludur
- Backup alınmadan patch uygulanamaz
- Görev sonrasında stabil ise snapshot alınır

## PATCH_GOVERNANCE_RULE

Zorunlu kural:

- Kor patch YASAK.
- Her degisiklik, hedef dosyanin guncel icerigi gorulup dogrulanmadan uygulanamaz.
- Degisiklikler varsayimla degil, dogrulanmis mevcut dosya yapisina gore yapilir.
- Mumkun olan her durumda uygulama tek split / tek parca komut olarak verilir.
- Birden fazla dosyaya mudahale gerekiyorsa once baglanti akisi dogrulanir, sonra en kucuk guvenli uygulama secilir.
- Overwrite ancak mevcut dosya icerigi gorulmus, yedegi alinmis ve baska guvenli alternatif olmadigi netlesmis ise yapilabilir.

Bu kural TEDBIRGE OS anayasal calisma kuralidir.
