# DEVAM ICIN OKU — Tedbirge.ai

## 1. ZORUNLU KURAL (bu dosyayı okuyan yeni Claude oturumuna)

Önceki AI oturumları dosya uydurma, sahte komut verme, yanlış dosya yolu kullanma gibi hatalar yaptı. Kural: bir dosyanın var olduğunu, bir kodun çalıştığını, bir alanın dolu olduğunu iddia etmeden önce fiziksel olarak diskten doğrula. "Show don't tell" — her iddiayı cat, grep, curl ile kanıtla.

## 2. TEKNİK YAPI

- Backend: Node.js/Express, port 5000, nodemon ile dev
- Panel: Next.js 16.2.2 (Turbopack), port 3000, ayrı repo (tedbirge-panel/)
- DB: Supabase PostgreSQL + Prisma, db push stratejisi (migration file'ları yok)
- AI: Claude Sonnet 4.6
- SMS: NetGSM (AKTİF — 2026-04-19 testinde çalıştığı doğrulandı)
- Mail: Mock mod (SMTP_PASS boş, kararı DECISION_LOG 18 Nis'e bakılsın)
- Çalıştığı platform: Windows 10, PowerShell
- Mehmet'in terminal preferansı: PowerShell komutları (Remove-Item -Recurse -Force), cmd komutları değil (rmdir /s /q)

## 3. EN SON KALDIĞIMIZ YER — 2026-04-20 akşam

Bitenler (bugün — 2026-04-20):
- REPRESENTATIVE rol PII maskeleme: sanitizeLawyerForRepresentative() helper (commit: 3100a6a)
  → lead.assignments[].lawyer → { id, fullName } only — email/phone/baroSicilNo gizli
- Prisma global omit: passwordHash, resetToken, resetTokenExpires, twoFactorSecret (commit: 8681608)
  → src/config/db.js'e PrismaClient constructor'a global omit eklendi
  → auth.service.js login() + 3 adet 2FA handler'a omit:false override eklendi
- Mimari iskelet: tedbirge-os/architecture/ altında VISION, ACTORS, INTEGRATION_PLAN dosyaları (commit: 66387fd)

Yarın nereden devam edilecek:
TÜRKAN DİNÇ kaydında bolge='Konya' güncellemesi (5. öncelik listesindeki 3. madde).
Admin paneli → Kullanıcılar → TÜRKAN DİNÇ → bolge alanını Konya olarak güncelle.
DB'de direkt: `UPDATE "User" SET "bolge" = 'Konya' WHERE email = 'turkandinc1@gmail.com'`

## 3b. PROD GÜVENLİK NOTU

Prisma log (src/config/db.js): Şu an ["warn","error"] — güvenli.
"query" seviyesi AÇILMAMALI: SQL sorgularında passwordHash dahil tüm
parametreler plaintext loglanır. Debug gerekirse sadece local/dev ortamında,
kısa süreliğine aç, prod'a kesinlikle taşıma.

## 3c. 2FA OVERRIDE DOĞRULAMASI — TAMAMLANDI (2026-04-20)

verify2fa, disable2fa, loginVerify2fa runtime'da doğrulandı.
Setup → verify → login challenge → login-verify → disable akışı
uçtan uca test edildi, tüm adımlar başarılı.

Test özeti (test19nisan@tedbirge.test, REPRESENTATIVE rolü):
- setup-2fa   → 200 OK, secret döndü
- verify-2fa  → 200 OK, 2FA etkinleştirildi
- login       → 200 OK, requires2fa:true, tempToken döndü
- login-2fa   → 200 OK, final JWT token döndü
- disable-2fa → 200 OK, 2FA devre dışı bırakıldı

## 4. BİLİNEN KIRIK / EKSİK NOKTALAR

Acil:
- UI BUG: Kullanıcılar yönetimi tablosunda temsilci "Durum: Aktif" görünüyor, halbuki temsilciOnayDurumu=BEKLEMEDE. isActive ile temsilciOnayDurumu alanları karışmış.

Orta:
- Parse error bug'ı (önceki oturumdan, DEVAM eden): AI yanıtı markdown fence içinde gelince regex kesiyor, PDF'te analiz bölümleri boş çıkıyor. Kaza Rekonstrüksiyon MVP'ye özel.
- Kaza Rekonstrüksiyon panel UI: "Yeni Vaka Aç" 401/500 (2026-04-18 bloğu hâlâ açık)
- Cross-platform font sorunu (Arial Linux'ta yok)

Uzun vade:
- Claude Vision entegrasyonu, OCR bağlantısı, fizik motoru (Kaza Rekonstrüksiyon için)

## 5. YARINKİ ÖNCELİK SIRASI

1. ~~Avukat bilgisi maskeleme~~ — TAMAMLANDI (2026-04-20, commit 3100a6a)
2. ~~passwordHash global omit~~ — TAMAMLANDI (2026-04-20, commit 8681608)
3. ~~TÜRKAN DİNÇ bolge='Konya' güncellemesi~~ — TAMAMLANDI (commit: 00adf56)
4. Müvekkil SMS onay akışı
5. Admin manuel avukat atama UI
6. Wizard UX: "Devam Et disabled" sebep tooltip'i

## 6. İŞLETİM KURALLARI (Mehmet'in açıkça koyduğu)

- Yamalı bohça yapma, tek platform tercih et
- "Yarın yapalım" sözü verme, iş sarkmasın
- Show don't tell, her iddiayı diskten doğrula
- Emoji kullanma (Windows terminalde render bozuk), SVG kullan
- Türkçe iletişim, kısa yanıtlar, küçük adımlar
- Her önemli adım sonunda CHANGELOG güncelle
- Bir dosyada büyük değişiklik yapmadan önce cat ile göster, sonra diff, sonra onay

## 7. KULLANICI PROFİLİ

Mehmet DİNÇ — avukat, 23 yıl deneyim, trafik kazası tazminat danışmanlığı.
Konya Meram, Baro kaydı: Konya.
E-posta: turkandinc1@gmail.com
Telefon: 05XX XXX XX XX
Arka plan: Markalize (tedbirge.com hâlâ onlarda) sürecinden kurtulma, tedbirge.ai kendi kontrolünde.

## 8. CANLI ORTAM

- https://tedbirge.ai → Vercel panel, SSL aktif
- https://tedbirge-ai.onrender.com/api → Render backend (veya Railway — yeni bilgiye göre güncellensin)
- Login çalışıyor, panel backend'e bağlı
- Footer iletişim bloğu, 5 mail + cep + çağrı merkezi + Konya adresi — canlıda
- Broşürler temsilcilerin elinde

## 9. MİMARİ ÇALIŞMASI

Mimari çalışması tedbirge-os/architecture/ altında — VISION, ACTORS,
INTEGRATION_PLAN iskeletleri kuruldu, ortak oturumda doldurulacak.

---
Son güncelleme: 2026-04-20 akşam — Claude Sonnet 4.6 + Mehmet DİNÇ kapatma seansı
