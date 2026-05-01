# 🛡️ TEDBIRGE.AI — DEVİR RAPORU AKTİF

**Son güncelleme:** 1 Mayıs 2026 (gece — TUR #62 KAPALI, TUR #60+#61 dahil)
**Anayasa:** v1.18.0 (33 madde)
**Aktif kesit:** Sağlık Taraması KAPALI ✅
**Son TUR:** #62 — Kapsamlı sağlık taraması (T tipi, 0 değişiklik)
**Son düzeltme TUR'u:** #60 (anasayfa kriz) + #61 (Instagram URL env)

---

## 🔴 AÇIK KRİTİK: 1 adet

1. **B4.7 — Backend Body Limit ↔ Upload Sınır Çelişkisi** (TUR #62 raporu)
   - `src/app.js:41`: `express.json({ limit: "5mb" })` (JSON body 5 MB)
   - `src/controllers/upload.controller.js:47`: `if (fileSize > 50 * 1024 * 1024)` (50 MB ret)
   - Sonuç: 5+ MB dosya yükleme reddediliyor; CEO'nun "20 MB hata" deneyimi büyük olasılıkla bu sınırın varyasyonu
   - Çözüm: TUR #63 — Yol A (Direkt Supabase upload) + Yol B (Browser sıkıştırma)

---

## 🟡 PLANLI: 6 adet

1. **TUR #63 — 20 MB Upload Limit Kaldırma + KRİTİK çözüm** (öncelik 🔴)
   - Kapsam: B4.7 KRİTİK + B4.6 Yol A+B uygulama
   - Süre: 3-4 atom (~4 saat)
   - Kapsam dahili: anasayfa JsonLd ≥2 hedefi (B8.3)

2. **Render Cold Start Çözümü** (B5.3 Yol B — UptimeRobot)
   - 14 dk aralıklı /health ping kurulumu (CEO manuel)
   - Süre: 5 dk

3. **Search Console Sitemap Submit** (B8.5)
   - 72 URL (sitemap zaten yayında)
   - Süre: 5 dk (CEO manuel)

4. **2 @deferred Schema İncelemesi** (B3.3 — Madde 28)
   - Hangi modeller? Üç koşul (badge + yorum + IS_PLANI) tamam mı?

5. **4 Yakında Etiketi Kararı** (B2.6 — Madde 28)
   - dashboard/hukukcu, leads/[id], musteri, blog — hangileri canlıya?

6. **TUR #65+ — FAZ 6 Public AI Chat Widget**
   - Trafik 2-3 ay sonra başlayınca

---

## 📋 MEHMET BEY MANUEL İŞLER (5 dk toplam)

1. **Google Search Console** → Sitemap submit (72 URL)
2. **Bing Webmaster** → Sitemap submit
3. **UptimeRobot kurulumu** → 14 dk aralıklı `https://tedbirge-ai.onrender.com/health` ping
4. **Vercel Dashboard** → Son 5 deploy "Ready" yeşil mi?
5. **Render Dashboard** → Build log "Migration applied" var mı?
6. **Supabase Dashboard** → User tablosu rol dağılımı (`SELECT role, COUNT(*) FROM "User" GROUP BY role`)

---

## ✅ TUR #62 KAPANIŞ — Kapsamlı Sağlık Taraması

**Süre:** ~30 dk otonom (mektup öngörüsü 4-6 saatti — daha hızlı bitti)
**Tip:** T tipi (0 kod değişikliği)
**Çıktı:** `docs/TUR62_KAPSAMLI_SAGLIK_RAPORU.md` (~860 satır)
**Bulgular:** 1 KRİTİK + 3 ORTA + 7 İYİ + 6 CEO MANUEL

**Genel Sağlık: 8.25/10**

### TUR #60 + TUR #61 (aynı gün, kriz çözümü)
- TUR #60: Anasayfa beyaz kriz → SectionReveal soft state + featured 3 (commit 2691169)
- TUR #61: Footer Instagram URL kurumsal hesap (Vercel deploy 3EgBeZ9UN)

**Pattern:** TUR #56+57+58+59+60 = 53/53 atom sapma 0 — kalibrasyon faktörü 1.6× **beşinci kez** kalıcı pattern (TUR #62 T tipi olduğu için sapma sayımına dahil değil; commit içermez).

---

## 🎯 SIRADAKİ ÖNERİLEN İŞ

**TUR #63 — Belge/Storage 20 MB Limit Kaldırma** (KRİTİK, B4.7'ye dayalı)

**Mimari öneri:**
- Yol A (Direkt Supabase upload, frontend → Supabase Storage SDK) — 1-2 atom
- Yol B (Browser PDF/resim sıkıştırma) — 2-3 atom (npm onayı şart)
- Kombinasyon = %80-90 vakada 50 MB limiti zorlanmaz

**Mehmet Bey karar verir** (Madde 17.5):
- TUR #63 hemen mi açılsın?
- npm paketi onayı (`pdf-lib`, `browser-image-compression` veya benzeri) verilecek mi?
- Search Console + UptimeRobot manuel işleri TUR #63'ten önce mi sonra mı?

---

**— Tedbirge.ai mimarı**
**TUR #62 KAPANDI · 1 Mayıs 2026 (gece)**
**Anayasa v1.18.0 yürürlükte**
**TUR #60+#61+#62 üçü birden bu turda mühürlendi**
