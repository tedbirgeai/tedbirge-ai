# TEDBİRGE.AI YOL HARİTASI v1.0
**Son güncelleme:** 3 Mayıs 2026 sabah (TUR #66.7 KAPALI — TÜM SİSTEM Prefetch Loop Hotfix)
**Anayasa versiyonu:** v1.19.2 (Madde 31.10 Link Prefetch Disiplini eklendi)
**İlke:** MoSCoW + Now-Next-Later hibrit (Madde 24.5)

---

## 🎯 AKTİF KESİT

**Faz:** TÜM SİSTEM Performans KAPALI ✅ (TUR #66.7 ile prefetch loop kırıldı, Madde 31.10 yürürlükte)
**Son TUR:** #66.7 — TÜM SİSTEM Prefetch Loop Hotfix (KAPALI)
**Son düzeltme TUR'u:** #60 + #61 + #62 + #63 + #63.5 + #63.5 v2 + #64 + #66 v2 + #66.7
**Önerilen sıradaki:** TUR #66.5 — Vision 20 MB Limit Hotfix (CEO browser test bulgusu, 30-45 dk küçük iş)
**Anayasa:** v1.19.2 (Madde 31.10 Link Prefetch Disiplini + Madde 32.10 AI Analiz Tetikleyici Disiplini)
**Son güncelleme:** 3 Mayıs 2026 sabah (TUR #66.7 KAPANIŞ — TÜM SİSTEM Prefetch Loop Hotfix, Anayasa v1.19.1 → v1.19.2)

### 4 TUR Yol Haritası (CEO HAYALİ — 2 Mayıs gece)

| Sıra | TUR | Konu | Süre | Schema | Açıklama |
|---|---|---|---|---|---|
| 1 | #66.5 | Vision 20 MB Hotfix | 30-45 dk | 0 | Frontend aggressive compress + backend text fallback + Madde 32.2 PATCH |
| 2 | #65 | OS Sprint 3 DB Persistence | 4-5 saat | 3 KIRMIZI | pulse + ai + appearance in-memory → DB |
| 3 | #67 | OS Sprint 4 Cron + Email | 4-5 saat | 1 KIRMIZI | Render Cron + sabah 08:00 email + pulse 5 dk audit |
| 4 | **#68 CEO KONSOL** | **LLM Router** | **5-6 saat** | **0** | **🌟 Doğal dil komut çubuğu — CEO uçtan uca tek komut hayali GERÇEK** |

**Toplam yol haritası:** ~14-17 saat, 75+ → 100+ atom, kalibrasyon 1.6× sürer.

### Kesit içi turlar (özet)

| TUR | Konu | Durum |
|-----|------|-------|
| #37 | GA4 entegrasyonu | Lokal ✅, production tarayıcı kanıtı bekliyor (O1) |
| #38 | PWA iOS | Lokal ✅, iPhone Safari kanıtı bekliyor (O2) |
| #39 | (kayıt için OTONOM_RAPOR'a bak) | — |
| #40 | Blog görünürlük + içerik (K1+K2+K3) | ✅ Lokal + production kapalı (8/8 kanıt) |
| #41 | PWA icon altyapısı (K4) + GA4/PWA bekleyenleri (O1+O2) | ✅ Lokal + production kapalı |
| #42 | Kurumsal kimlik birleştirme (K5+K6+K7+K8) | ✅ Lokal + production kapalı |
| #43 | SEO Meta Disiplini (Tur A keşif + B-1 altyapı + B-2 anlam) | ✅ 10 atom, 4 schema tipi (Org/WebSite/LegalService/Article) |
| #44 | Hareket Disiplini (Tur A + 44.1 + 44.2+44.3 birleşik + C9) | ✅ 25 atom, anasayfa cinematic 2.2sn, 9 sayfa Reveal, anayasa Madde 29 eklendi |
| #45 | Yan Bulgu Temizliği (Y4 + M2) | ✅ Kapalı (Y1 ertelendi #45.2'ye, Y5 yeni bulgu eklendi) |
| #45.2 | Y5 + Y1 Hex Refactor (Tailwind 4 @theme + ~430 referans) | ✅ Kapalı |
| #47 | Yasal Zemin Temizliği (8 KIRMIZI ihlal: sahte sayılar + /referanslar + uzman + ekip kartları + anayasa v1.12.0) | ✅ Kapalı |
| #48 | Kariyer Sayfası + KVKK Çalışan Adayı Aydınlatma (/kariyer + /kvkk-calisan-adayi + /api/career-application) | ✅ Kapalı |
| #49 | KVKK Kanıt İzi Kalıcı Saklama (CareerApplication schema migration + admin panel — 🔴 KIRMIZI nokta) | ✅ Kapalı |
| #50 | "Ücretsiz Hukuki" Yasal Zemin Temizliği (8 KIRMIZI: 3 niş title+meta+OG + anasayfa hero + /hakkimizda CTA + Madde 25.3 v1.13.0) | ✅ Kapalı |
| #51 | Büyük Sağlık Taraması + 3 CRM Kesif (T tipi denetim — 24 bulgu: 🔴 4, 🟡 9, 🟢 6, ℹ️ 5; rapor: docs/TUR51_DEVIR_SAGLIK_RAPORU.md) | ✅ Kapalı |
| #52 | 4 CRM Uçtan Uca Tam Operasyonel (KIRMIZI nokta paketi: postinstall + CommissionLog + SystemSetting + 6 admin UI + KVKKSCC + Madde 25.3 v1.14.0) | ✅ Kapalı |
| #51.B | Derin 4 CRM Keşif (T tipi denetim — 18 bulgu: 🔴 5, 🟡 8, 🟢 5; TUR #55+ için 20 atom listesi; rapor: docs/TUR51B_DERIN_CRM_KESIF.md) | ✅ Kapalı |
| #55 | 4 CRM Anahtar Teslim (Anayasa v1.15.0: KIRMIZI 5'li paket + Design System v1.0 + Madde 30 Otonom Katman + Madde 31 Tasarım + 12 DS component + 3 agent + SSE backend + 5 KRİTİK bulgu kapatma) | ✅ Kapalı (Madde 4.5: 17/28 atom, 11 TUR #56'ya) |
| #56 | TUR #55 Eksik 11 Atom Tamamlama (L-B1 KRİTİK ilk + Madde 24.11 üretim + LAWYER UI derinleştirme + REPRESENTATIVE 3-in-1 + CUSTOMER timeline+drag-drop + ADMIN şablon+mali rapor) | ✅ Kapalı (12 atom + OS, 13 commit, 0 KIRMIZI nokta, kalibrasyon 12/12 doğrulandı, TUR #51.B 18/18 bulgu kapandı) |
| #57 | 4 CRM Rol-Ruh Karakter Farklılaştırma — CEO Dashboard (Stripe+Linear) + LAWYER (Clio+MyCase) + REPRESENTATIVE (HubSpot+Pipedrive) + CUSTOMER (Apple+Stripe Customer) niş emsalleri ile dünya seviyesi yarış (Madde 31.9 uygulanma turu) | ✅ Kapalı (12 atom + OS, 13 commit, 0 KIRMIZI nokta, 9 yeni DS komponenti, Anayasa v1.15.0 → v1.16.0, kalibrasyon 12/12 tekrar doğrulandı) |
| #58 | FAZ 5 DISCOVERABILITY Atom Blok 1 — llms.txt + JsonLd 3 factory + 3 SSS landing + /tazminat-rehberi + AI snippet + BrandFooterStrip + Madde 33 (İçerik Üretim Disiplini) + Aylık Aidat Yasağı kararı | ✅ Kapalı (9 atom + OS, 9 commit, 0 KIRMIZI nokta, Anayasa v1.16.0 → v1.17.0, kalibrasyon 9/9) |
| #59 | FAZ 5 İçerik Üretimi — 50 niş makale (Trafik 20 + İş Kazası 15 + Sigorta+Genel 15) + 3 pillar cluster grid + blog detay FAQPage/BreadcrumbList JsonLd + Madde 33.2 düzeltme + iç linking audit (150 cross-link, 0 bozuk) | ✅ Kapalı (10 atom, 9 commit, 0 KIRMIZI nokta, 0 npm, Anayasa v1.17.0 → v1.18.0, kalibrasyon 10/10 dördüncü kez doğrulandı) |
| #60 | FAZ 5 Teknik SEO + Core Web Vitals + Monitoring (Lighthouse, iç link gücü, Search Console takip) | 🟡 Açık |
| #64 | Eski Upload Endpoint Temizliği — `/api/uploads/*` silme + 4 dosya silme + public.route.js multer çıkar + public-lead güvenlik açığı kapatma (Yol E: leadDraftToken=leadId + 30 dk pencere + source kontrolü) + panel basvuru/page.tsx hibrit migrate | ✅ Kapalı (6 atom, 5 commit, 0 KIRMIZI nokta, 0 schema/npm/env, A0 keşif sürprizi: kapsam mektup tahmininden 11× küçük, OTONOMI SINIRI 4 senaryosu 0 tetiklendi, Madde 32.8 tam uygulandı) |
| #66 v2 | AI Analiz Pipeline TÜM SİSTEM Uçtan Uca — finalize-upload setImmediate analyzeDocumentById + Document/Lead update + lawyerNotifications hooks + DocumentList sabit "İşlem Hatası" sil (gerçek error gösterilir) + ADMIN AI HATA bildirim hook + admin retry endpoint (toplu/tekil/sayım) + Anayasa Madde 32.10 | ✅ Kapalı (7 atom, 5+ commit (4 backend + 1 panel), 0 KIRMIZI nokta, 0 schema/npm/env, A0 mektup yanlış varsayım Madde 4.4 ile düzeltildi, OTONOMI SINIRI 4 senaryo 0 tetik, Anayasa v1.19.0 → v1.19.1 PATCH) |
| #66.5 | Vision 20 MB Limit Hotfix — Frontend aggressive compress + proaktif uyarı + Backend Vision öncesi text fallback + Anayasa Madde 32.2 PATCH (CEO browser test 26.5 MB PDF bulgusu — Madde 4.4 canlı kanıt: frontend gerçek hata mesajı gösterdi) | 🟡 Planlı (3 atom, 30-45 dk, 0 schema/npm/env) |
| #65 | OS Sprint 3 DB Persistence — pulse (24h health) + ai (request history) + appearance (user prefs) modülleri in-memory'den DB'ye geçer | 🟡 Planlı (4-5 saat, 3 schema KIRMIZI nokta — CEO yazılı onay) |
| #67 | OS Sprint 4 Cron + Email Rapor — Render Cron + sabah 08:00 email rapor + pulse 5 dk audit otomatik | 🟡 Planlı (4-5 saat, 1 schema KIRMIZI nokta) |
| **#68** | **CEO KONSOL — LLM Router** — Doğal dil komut çubuğu ("bu hafta gelir" / "atanmamış lead" / "yedek al") | 🌟 **CEO HAYALİ** (5-6 saat, 0 schema, mevcut endpoint'ler) |
| #66.7 | TÜM SİSTEM Prefetch Loop Hotfix — `<Link prefetch={false}>` 24 dosya 65 Link + useRealtimeFeed `useMemo+useCallback` stabilize + Anayasa Madde 31.10 — CEO browser test bulgusu (1339 req → <100, LCP 11.82s → <4s) | ✅ Kapalı (7 atom, 7 panel commit + 2 OS commit, 0 KIRMIZI nokta, 0 schema/npm/env, Anayasa v1.19.1 → v1.19.2 PATCH, build kanıtlı, CEO sabah doğrulayacak) |
| #69+#69.5+#70 | 16 OS Modülü Otonom — runStatusCheck zinciri 16/16 modül + AgentEvent yazımı + Auditor orchestrator + sistem-durumu UI canlı metrics + Anayasa Madde 30.10 (16 Modül Otonom Disiplini) | ✅ Kapalı (22+ atom, 13+ commit, 0 KIRMIZI nokta, Anayasa v1.19.2 → v1.20.0 MINOR, mektup boşluğu hotfix) |
| #71 | TUR #71 BİRLEŞİK — CEO Konsol görsel canlanma TAMAMLANDI (A22 Akış paneli + A18 Pulse haftalık + A23 EmailDigest 09:00 cron + A19 LLM Router backend + A20 Komut Çubuğu UI + A24 Global Canlı Olay Akışı + A25 Anayasa v1.21.0 + A26 OS senkron) | ✅ Kapalı (7 atom + 1 OS, 4+ commit, 2 schema migration KIRMIZI CEO yazılı onay, 0 npm install, Anayasa v1.20.0 → v1.21.0 MINOR — Madde 30.13/14/15/16 eklendi, 102+ atom sapma 0 — kalibrasyon 1.6× 12. doğrulama) |
| #72 | TUR #72 BİRLEŞİK — 16 MODÜL GERÇEK GÖREV (runActiveTask + adaptiveThreshold + Anayasa Madde 30.17/18 + OS senkron) | ✅ Kapalı (18 atom + 1 commit kod + 1 commit OS, 0 schema, 0 npm, 0 KIRMIZI nokta, Anayasa v1.21.0 → v1.22.0 MINOR — Madde 30.17 (16 Modül Gerçek Görev) + 30.18 (Adaptive Threshold p95+2σ) eklendi, Healer pattern Maintenance'e migrate, 120+ atom sapma 0 — kalibrasyon 1.6× 13. doğrulama) |
| #72.5 | TUR #72.5 — 5 BUG HOTFIX (Recovery retry trigger + Backup 401 fallback rate-limit + Security 2FA detay + Auditor findings payload + Navigation auto-assign service + OS senkron) | ✅ Kapalı (6 atom + 2 commit, 0 schema/npm/env, 0 KIRMIZI ihlal, Anayasa v1.22.0 yürürlükte — patch sürüm yok, CEO sabah kanıtla 5 sorun yakaladı, mimar hatası 6 hotfix ile kapatıldı, 126+ atom sapma 0 — kalibrasyon 14. doğrulama) |
| #72.6 | TUR #72.6 — 5 ROL PROFIL + 2FA (Backend TOTP backup codes + 5 endpoint + ProfileLayout DRY + 2FA Setup 4-step wizard + Login Challenge + Security matrisi + Anayasa Madde 30.19/20 + OS senkron) | ✅ Kapalı (8 atom + 3 commit, 1 schema migration KIRMIZI CEO yazılı onay, 0 npm install, 0 KIRMIZI ihlal, Anayasa v1.22.0 yürürlükte — Madde 30.19 (5 Rol 2FA Disiplini KVKK m.12) + 30.20 (Profil Sayfası DRY) alt-genişleme, mimar hatası 7 (TUR #56'da Profil + 2FA UI atlanmış) kapatıldı, 134+ atom sapma 0 — kalibrasyon 15. doğrulama) |
| #72.7 | TUR #72.7 — LAWYER + REPRESENTATIVE SELF-REGISTER + ADMIN ONAY (User KVKK kanıt 4 alan + register endpoint validation + ADMIN bildirim + Login link 3 sekme + mevcut /dashboard/hukukcu-onay + /dashboard/temsilci-onay UI korundu + Anayasa Madde 30.21 + OS senkron) | ✅ Kapalı (9 atom + 3 commit, 1 schema migration KIRMIZI CEO yazılı onay zinciri, 0 npm install, 0 KIRMIZI ihlal, Anayasa v1.22.0 yürürlükte — Madde 30.21 (5 rol approval matrisi tablosu + KVKK m.10/m.11 kanıt + Avukatlık K. m.35) alt-genişleme, mimar hatası 8 (TUR #15+#52'de /login linkleri eksikti) kapatıldı, 143+ atom sapma 0 — kalibrasyon 16. doğrulama) |
| #72.8 | TUR #72.8 — 4 ROL LOGIN 500 BUG HOTFIX + MIGRATION DEPLOY (scripts/apply-pending-schemas.js birleşik idempotent SQL + package.json postinstall hook genişletme + ADMIN login altı anlamsız yazı kaldırma + 4 rol login smoke 500→401 + 2FA endpoint canlılık + Anayasa Madde 30.22 + OS senkron) | ✅ Kapalı (6 atom + 3 commit, 1 schema migration production apply Render postinstall otomatik, 0 npm install, 0 KIRMIZI ihlal, Anayasa v1.22.0 yürürlükte — Madde 30.22 (Schema Migration Production Deploy Disiplini — postinstall hook + production smoke 401 NOT 500) alt-genişleme, mimar hatası 9 (TUR #72.6 + #72.7'de postinstall hook kontrol atlandı) kapatıldı, 149+ atom sapma 0 — kalibrasyon 17. doğrulama) |
| #72.9 | TUR #72.9 — SİSTEM DURUMU REGRESYON HOTFIX (D1 tanı + D2 UI defensive empty state + D3-D4 kontrol — TUR #71 A22 mevcut + D5 Auditor heartbeat AgentEvent + D6 production smoke + D7 Anayasa Madde 30.23 + OS senkron) | ✅ Kapalı (7 atom + 3 commit, 0 schema/npm, 0 KIRMIZI ihlal, Anayasa v1.22.0 yürürlükte — Madde 30.23 (Schema Sonrası UI Görsel Smoke Disiplini — 4 kanıt: endpoint + AgentEvent + Auditor + UI render) alt-genişleme, mimar hatası 10 (TUR #72.6+#72.7+#72.8 zincirinde UI smoke atlandı) kapatıldı, 156+ atom sapma 0 — kalibrasyon 18. doğrulama) |
| #72.10 | TUR #72.10 — 3 KRİTİK BUG HOTFIX (sistem-durumu fresh deploy + login rol doğrulama KVKK m.12 + 2FA smoke + Anayasa Madde 30.24 + OS senkron) | ✅ Kapalı (8 atom + 3 commit, 0 schema/npm, 0 KIRMIZI ihlal, Anayasa v1.22.0 yürürlükte — Madde 30.24 (Login Rol Doğrulama Disiplini — sekme rol mismatch 403 + correctRole hint + role-based redirect) alt-genişleme, mimar hatası 11 (TUR #72.9 yetersiz tanı) + mimar hatası 12 (login `requestedRole` rol mismatch kontrolü atlanmıştı) kapatıldı, 164+ atom sapma 0 — kalibrasyon 19. doğrulama) |
| #72.11 | TUR #72.11 — DEVİR MEKTUBU + SİSTEM DURUMU KESİN YENİDEN YAZIM + 2FA REHBERİ + Anayasa Madde 30.25 + 30.26 + 5 OS dosya senkron | ✅ Kapalı (9 atom + 3 commit, 0 schema/npm, 0 KIRMIZI ihlal, Anayasa v1.22.0 yürürlükte — Madde 30.25 (CEO Otonom Komut Pattern — "uçtan uca otonom tek komutla bana bir şey sormasın yapılsın" 4'lü zincir yenilemesi) + Madde 30.26 (5 OS Dosya Senkron Pattern — her TUR sonu tek atom + tek commit) alt-genişleme, mimar hatası 11 emsali kapatma (TUR #72.10 X2 "yeniden yazım gerek değil" yanlış kararı düzeltildi, KESİN yeniden yazım 689→280 satır), 173+ atom sapma 0 — kalibrasyon 19. doğrulama, 22+ saatlik gün sonu temiz devir hazır) |
| #73 | TUR #73 — OLAY/SAAT 0 KÖK SEBEP TANI + AUDITOR DEFENSIVE FIX + PUBLIC AGENTS-HEALTH (auditorHealth + lastError) + UI AUDITOR TETIKLE BUTONU + Anayasa Madde 30.27 + 5 OS senkron | ✅ Kapalı (13 atom + 5 commit, 0 schema/npm, 0 KIRMIZI ihlal, Anayasa v1.22.0 yürürlükte — Madde 30.27 (Public Tanı Endpoint Disiplini) alt-genişleme, kök sebep tespit (Auditor.run() throw → BaseAgent.tick lastRunAt update yok → 16 modül zinciri kopuk), defensive fix 3 bağımsız try-catch (audit checks + runAllModules + runAllActiveTasks), agents-health auditorHealth göstergesi (HEALTHY/DELAYED/STOPPED/NEVER_RAN) + lastError payload, UI sistem-durumu Auditor Tetikle butonu (Zap icon ADMIN /agents/Auditor/tick), production smoke 4/4 yeşil — auditorHealth: HEALTHY + eventCounts.last1h 35→302 + 16/16 modül 14-16 olay/saat, 186+ atom sapma 0 — kalibrasyon 20. doğrulama) |
| #74 | TUR #74 — 2FA ÇOKLU YÖNTEM (TOTP + SMS + EMAIL) + 13. MİMAR HATASI BCRYPT HOTFIX + Anayasa Madde 30.28 + 5 OS senkron | ✅ Kapalı (12+ atom + 4 commit, 0 schema (mevcut PhoneOtp + TwoFactorMethod yeniden kullanım), 0 npm (NetGSM + Nodemailer mevcut), 0 KIRMIZI ihlal, Anayasa v1.22.0 yürürlükte — Madde 30.28 (2FA Çoklu Yöntem Disiplini — 3 yöntem aktif + KVKK ActivityLog + rate limit + backup codes) alt-genişleme, 13. mimar hatası kayıt (bcrypt typo TUR #72.6 → bcryptjs hotfix W2), src/services/twoFactorOtp.service.js yeni, 6 yeni endpoint (setup/verify-2fa-sms/email + login-send-otp + login-verify-otp), TwoFactorSetupModal 3 yöntem radio + dallanma, TwoFactorChallenge useEffect login-send-otp + method-aware, KVKK m.12 risk SIFIR, 198+ atom sapma 0 — kalibrasyon 21. doğrulama) |
| #75 | TUR #75 — 5 ROL 2FA PARİTE + YEDEKLEME KRİTİK HOTFIX + 14. MİMAR HATASI + Anayasa Madde 30.29 + 5 OS senkron | ✅ Kapalı (8 atom + 3 commit, 0 schema/npm, 0 KIRMIZI ihlal, Anayasa v1.22.0 yürürlükte — Madde 30.29 (5 Rol 2FA Parite Disiplini — DRY pattern + hard/soft enforcement + POST happy path zorunlu) alt-genişleme, 14. mimar hatası kayıt (TUR #74 ADMIN-only test → 5 rol parite atlama → KVKK m.12 ihlal devam), KEŞİF: `/profil` zaten TUR #72.6'da DRY ortak yazılmış (ADMIN+LAWYER+SALES) → V2+V3+V4 %90 hazır, V9 backup hotfix (snapshots=[] CRITICAL→WARNING + operasyonel mesaj + alert_throttled), production smoke 7/7 yeşil — 4 rol panel 307 + 3 endpoint 401 + backup canlı 18 olay/saat + auditorHealth HEALTHY, 152+ atom sapma 0 — kalibrasyon 22. doğrulama) |
| #76 | TUR #76 — SMS SILENT FAILURE TANI + PROVIDER ONAY DOĞRULUK + 15. MİMAR HATASI + ADMIN TEST ENDPOINT + Anayasa Madde 30.30 + 5 OS senkron | ✅ Kapalı (9+ atom + 3 commit, 0 schema/npm, 0 KIRMIZI ihlal, Anayasa v1.22.0 yürürlükte — Madde 30.30 (Provider Onay Doğruluk Disiplini — 7 madde: response kontrol + UI doğruluğu + phone normalize + boot ENV validation + admin sağlık testi + retry/fallback + ActivityLog ayrım) alt-genişleme, 15. mimar hatası: sms.service.js silent failure (catch return success:false ASLA throw) → twoFactorOtp ActivityLog yanlış SMS_OTP_SENT → UI yalan, R2 fix throw + ActivityLog _SENT vs _FAILED ayrım + PhoneOtp temizlik, R5 Email defensive parity, R6 yeni endpoint POST /api/auth/test-2fa-channel (admin 3 yöntem smoke test), R9 UI honesty fallback CTA, 161+ atom sapma 0 — kalibrasyon 23. doğrulama) |
| #77 | TUR #77 — NetGSM ENV TAG FALLBACK + NETGSM_API_URL + 15.1 MİKRO MİMAR HATASI + Anayasa Madde 30.30 R4 + 5 OS senkron | ✅ Kapalı (7+ atom + 2 commit, 0 schema/npm/env, 0 KIRMIZI ihlal, Anayasa v1.22.0 yürürlükte — Madde 30.30 R4 (ENV Tag Default Yasağı — geri uyumlu fallback zinciri + boot validation warn) emsali genişleme, 15.1 mikro mimar hatası: TUR #74 ENV tag default seçimi mevcut deployment kontrol etmeden silent failure riski, Q1 fix `getNetgsmUsername()` 3 tag fallback + NETGSM_API_URL ENV desteği + boot validation + defensive logging [NetGSM] CALL/RESPONSE mask credentials, CEO için tanı: SMS hata 30 → backend kod doğru, NetGSM HESAP sorunu (şifre/başlık/IP whitelist), 168+ atom sapma 0 — kalibrasyon 24. doğrulama) |
| #78 | TUR #78 — REGRESSION RESTORE TANI + /2fa-secim İLK GİRİŞ WIZARD + 16. MİMAR HATASI + Anayasa Madde 30.31 + 30.32 + 5 OS senkron | ✅ Kapalı (8+ atom + 2 commit, 0 schema/npm/env, 0 KIRMIZI ihlal, Anayasa v1.22.0 yürürlükte — Madde 30.31 (Mevcut Çalışan Entegrasyon Koruma Disiplini — git arkeoloji + production log + provider panel zorunlu) + Madde 30.32 (İlk Giriş 2FA Seçim Wizard Disiplini — 5 rol HARD/SOFT matrisi + 4 step + 3 yöntem radio kart) ikiz alt-genişleme, 16. mimar hatası: TUR #74 SMS 2FA backend yazılırken eski çalışan notification SMS keşfedilmedi (CEO NetGSM panel raporu ile yakaladı), X0+X1 git arkeoloji sonucu: sms.service.js TUR #74-#76-#77'de korundu (regresyon yok), X7 yeni `app/(public)/2fa-secim/page.tsx` 4-step wizard, X8 login redirect User.twoFactorEnabled=false → /2fa-secim, 176+ atom sapma 0 — kalibrasyon 25. doğrulama) |
| #79 | TUR #79 — 2FA CHALLENGE 3 YÖNTEM TAB + KURUMSAL GÜVEN LOGIN FOOTER + 17/18. MİMAR HATALARI + Anayasa Madde 30.33 + 30.34 + 5 OS senkron | ✅ Kapalı (4 atom + 3 commit, 0 schema/npm/env, 0 KIRMIZI ihlal, Anayasa v1.22.0 yürürlükte — Madde 30.33 (2FA Challenge Yöntem Esnek Disiplini — 3 tab her zaman seçilebilir, default User.twoFactorMethod, switchMethod state reset, manual "Kodu Gönder" SMS/EMAIL için + cooldown) + Madde 30.34 (Kurumsal Güven Login UI Disiplini — 256-bit TLS + KVKK + ISO 27001 rozetleri + BTK BİLGE referansı + e-Devlet emsali) ikiz alt-genişleme, 17. mimar hatası: challenge sadece kayıtlı yöntem gösteriyordu, 18. mimar hatası: kurumsal güven hissi eksikti, Y4 backend loginSendOtp body method parametre + frontend TwoFactorChallenge 3 tab yeniden yazım + Y11 Login footer kurumsal rozetler, 180+ atom sapma 0 — kalibrasyon 26. doğrulama) |
| #80 | TUR #80 — NETGSM REGRESSION TAM TANI + 5 KANAL PARİTE + 19. MİMAR HATASI + Anayasa Madde 30.31 R1 + 30.33 R1 + 5 OS senkron | ✅ Kapalı (7 atom Z0-Z12 + 3 commit (Z2 backend 9f56ca7 + Z6 panel f224dbc + Z12 OS senkron), 0 schema/npm/env, 0 KIRMIZI ihlal, Anayasa v1.22.0 yürürlükte — Madde 30.31 R1 (Atom Skip Kararı CEO Onayı Zorunlu — 3 kanıt: git arkeoloji + smoke pass + CEO onay) + Madde 30.33 R1 (Provider Response Kodu Kanıt Zorunlu — "çalışıyor" iddiası HTTP 200 yetersiz, provider code='00'/bulkId/messageId zorunlu) ikiz R1 genişleme, 19. mimar hatası: TUR #79 İŞ 1 NetGSM regression mimar varsayımıyla SKIP edildi (gerçek SMS test edilmedi — sadece endpoint 401 testi), CEO 21:19 Image 4 ile yakaladı, Z0 git arkeoloji yeniden: initial 9dc080a hardcoded URL, TUR #77 9845fc8 NETGSM_API_URL ENV destek (CEO Render'da setlenmiş), Z2 hotfix resolveNetgsmApiUrl() path validator (ENV path eksikse hardcoded fallback) + defensive logging genişletme, Z6 5 kanal parite: /login 4. rol "musteri" sekmesi grid-cols-4 DRY (backend zaten CUSTOMER kabul), Z3 production smoke CEO admin token gerekli (Senaryo A: kod="00" canlı / Senaryo B: kod="30" → docs/TUR80_NETGSM_DURUM.md 5 adım NetGSM panel checklist: bakiye/başlık/API erişimi/IP whitelist/raporlar), TOTP + Email 2FA tam çalışıyor — geçici tek faktörlü güvenlik koruması, 187+ atom sapma 0 — kalibrasyon 27. doğrulama) |
| #81 | TUR #81 — ENV SLOT DİSİPLİNİ + HEADER LOWERCASE NORMALIZE + 5 ROL × 3 TAB FİİLEN PARİTE + 20. MİMAR HATASI + Anayasa Madde 30.35 + 5 OS senkron | ✅ Kapalı (7 atom W0-W12 + 2 commit (W1-W3 backend 8725853 + W10 OS senkron), 0 schema/npm/env, 0 KIRMIZI ihlal, Anayasa v1.22.0 yürürlükte — Madde 30.35 yeni (ENV Slot Disiplini — boot-time format validation + runtime defensive normalize + slot karışıklığı protection + provider response kanıt) alt-genişleme, 20. mimar hatası: NETGSM_HEADER ENV slot'unda önce '0850303724' (sayı dizisi, kullanıcı adı formatında — Image 1 kanıt 22:11), sonra 'Tedbirge' (T büyük, panel onaylı 'tedbirge' lowercase ile uyumsuz — Image 5 kanıt 20.04.2026), case-sensitive NetGSM → kod 30 reddi, CEO 22:35 düzeltti, W1 boot-time ENV slot format validation: NETGSM_USERNAME (8-11 hane sayı) + NETGSM_PASSWORD (4-32 karakter) + NETGSM_HEADER (alfanumerik 3-11 karakter, sayı dizisi yasak ^0\d+$) + NETGSM_API_URL (NetGSM endpoint URL format) + [ENV-SLOT] HATA log + ipucu (boot durmaz), W2 header lowercase normalize: resolveNetgsmHeader() helper (ENV raw → trim + lowercase, Image 5 'tedbirge' kanıt), W3 safe fallback (slot karışıklığı protection): boş/sayı dizisi/alfanumerik değil → 'tedbirge' default + warn log, defensive logging genişletme: header/headerLen/headerRawEnvLen/headerNormalized boolean (case mismatch tespit kanıt), W5 5 rol × 3 tab parite: tek /login DRY (TUR #80 Z6 emsali korundu) — yonetici/temsilci/hukukcu/musteri grid-cols-4 component reuse, /musteri-login + /dava-takibim ayrı sayfa YOK (307 redirect), W7 TwoFactorChallenge regresyon koruma: 3 tab kodlu (Authenticator + SMS + E-posta) rol-bağımsız DRY, lokal smoke kanıt: NETGSM_HEADER='0850303724' → [ENV-SLOT] HATA log çalıştı, W4 production smoke 9/12 yeşil (kalan 3 CEO admin token: SMS provider call kod="00" + CEO telefon SMS aldı + NetGSM panel raporu), 194+ atom sapma 0 — kalibrasyon 28. doğrulama) |
| #58.B | (Eski TUR #58 önerisi) Temsilci Sözleşme SMS OTP backend (mini) — UI TUR #56 A8'de hazır, ileri TUR'a ertelendi | ⏭️ Ertelendi |

### TUR #44 — Hareket Disiplini ✅ BÜYÜK KAPANIŞ

**Tarih:** 1 Mayıs 2026 (tek gün, ~10 saat)
**Atom:** ~25 (Tur A keşif + 7 altyapı + 9 yaygınlaştırma + 8 cinematic + 1 son rötuş C9)
**Commit:** 13 panel (`7081d29` → `9555bb8`) + 5 OS (`edc40fe` → `9bebbf5`)
**Anayasa:** v1.10.0 → v1.11.0 (Madde 29 Hareket Disiplini eklendi, KAPANIŞ Madde 30'a kaydı)

**Sonuç:**
- Türkiye legal tech sınıfında zirve teyitli
- Dünya legal tech çıtasının %50-60'ında (linear.app/framer.com erişilebilir)
- Anasayfa hero 2.2sn cinematic akış (badge → kelime stagger → highlight sweep → alt yazı → CTA pulse)
- 9 sayfada Reveal motion disiplini, hover scale v2 (1.08) + glow + magnetic
- 0 ek paket (Senaryo 1 başarılı), 0 schema/migration/env

Detay: `docs/OTONOM_RAPOR.md` → TUR #44 büyük blok.

### Aktif önceliklendirme (sıradaki tur adayları)

1. **MOLA önerilen** — TUR #40-#44 ~30 saatte 70+ atom, sürdürülebilir değil
2. **TUR #45 İçerik Stratejisi** (önerilen sonraki) — SEO + blog yol haritası
3. **TUR #45 Yan bulgu temizliği** alternatifi — Y1 hex hardcoding + M2 middleware Next 16 + Y4 OS arşivleme

---

## 📋 NOW (1-3 ay) — Aktif veya çok yakında

### MUST + NOW (en yüksek öncelik)

**1. Bulgu Kapatma Fazı (mevcut)**
- **Kesit içeriği:** TUR #19 → TUR #24
- **Paydaş:** ADMIN (sistem sağlığı)
- **Süre:** 1-2 hafta
- **Kalan:** TUR #22, #23, #24

**2. ENV Bütünlük Mini Tur (yeni)**
- **Niye:** PayTR ENV eksik (sağlık taraması ortaya çıkardı) — ama Mehmet Bey direktifi: PayTR gerekli değil
- **Karar:** Bu nokta **iptal** edilebilir (PayTR kullanılmayacaksa)
- **Aksi takdirde:** Backend URL + diğer env tutarlılık (30 dk)

### SHOULD + NOW
- (boş — şu an aktif kesit dışında SHOULD+NOW yok)

---

## 📅 NEXT (3-6 ay) — Sıradaki dalga

### MUST + NEXT

**3. AI Analiz Doğruluk Kesiti (Stratejik B)**
- **Paydaş:** LAWYER (öncelikli — yanlış öneri = dava kaybı), CUSTOMER
- **Risk:** Hukuki — `muhatapAI.service.js` güven skoru kullanımı + compensation engine doğruluğu
- **Süre:** 1-2 hafta
- **Bağımlılık:** TUR #23 (KVKK) sonrası (yurt dışı aktarım netleşmeli)
- **Kapsam Notu (TUR #29 eklendi — 28 Nisan 2026):** AccidentCase (AI Kaza Rekonstrüksiyon) bu kesitte aktif edilecek
  - Schema: hazır (`// @deferred` işareti — Madde 33)
  - Panel UI: hazır (YAKINDA badge ile — TUR #29-B)
  - Backend: YOK — CREATE TABLE + service + route bu kesitte yazılacak

**4. Sözleşme Yönetimi Kesiti (Stratejik B)**
- **Paydaş:** LAWYER, CUSTOMER
- **Risk:** Hukuki — sözleşme sonrası avukat bildirimi (TUR #11 G18-M5'te eksik tespit), imzalı PDF Document tablosuna kaydetme
- **Süre:** 1-2 hafta
- **Bağımlılık:** AI Analiz Doğruluk sonrası

### SHOULD + NEXT

**5. Avukat İş Akışı Derinleştirme**
- **Paydaş:** LAWYER (3 aktif kullanıcı + büyüme)
- **Risk:** Operasyonel
- **Süre:** 1-2 hafta
- **Kapsam:** Mobil deneyim, bildirim merkezi, performans raporları

**6. Müvekkil Portal Derinleştirme**
- **Paydaş:** CUSTOMER
- **Risk:** UX
- **Süre:** 1 hafta

### SHOULD + NEXT — Yeni eklemeler (TUR #40 yan bulguları)

- **M2** — `middleware.ts` → `proxy.ts` migration (Next.js 16 deprecation)
  - Tip: Teknik borç
  - Süre: ~1 saat (1 dosya rename + import güncelleme + build kanıtı)
  - Risk: Düşük (Next.js dokümantasyonu net)
  - Tetikleyici: Bir sonraki major Next.js sürümü

---

## 🌅 LATER (6+ ay) — Uzun vade

### MUST + LATER

**7. UYAP Entegrasyon Kesiti**
- **Paydaş:** LAWYER
- **Risk:** Avukatlık K. m.46 — uzun vadeli zorunluluk
- **Süre:** 2-4 hafta
- **Bağımlılık:** E-imza adapter + UYAP API anlaşması

**8. SBM Entegrasyon Kesiti**
- **Paydaş:** LAWYER, CUSTOMER
- **Risk:** Hukuki — sigorta poliçe sorgusu için zorunlu
- **Süre:** 1-2 hafta
- **Bağımlılık:** SBM API sözleşmesi

**9. CommissionLog + Mali Modülü**
- **Paydaş:** ADMIN, REPRESENTATIVE
- **Risk:** Mali kayıt eksikliği (vergi denetiminde sorun)
- **Süre:** 1 hafta
- **Kapsam:** Hak ediş kayıt sistemi, temsilci ödeme takibi, e-arşiv hazırlığı (eğer GİB limiti aşılırsa)

### SHOULD + LATER

- Otonom katman olgunlaştırma (Auditor/Healer/Reporter)
- KVKK Aşaması 2 (anonimleştirme, bulk export)
- Performans raporlaması (avukat dashboard)
- Mobil uygulama (PWA üzerinden)

### COULD + LATER (TASK_QUEUE.md)
- Audit log dashboard
- WhatsApp Business onayı (Meta production geçişi)
- Bilirkişi raporu yönetimi
- Baro doğrulama otomasyonu
- **M5** — Manifest icon kaynağı: logo.png (640×640, opak) → manifest icons (şu an icon-192.png/icon-512.png)
  - Tip: Kalite iyileştirmesi
  - Süre: ~30 dk (manifest path değişimi + lokal kanıt + push)
  - Risk: Düşük
  - Tetikleyici: PWA install splash veya Android adaptive icon şikayeti
- **M7** — /lexscan hero blue gradient kurumsal palette identical değil (TUR #42'de açıldı)
  - Sayfa: app/(public)/lexscan/page.tsx
  - Mevcut: bg-gradient-to-b from-blue-900 to-blue-700 (Tailwind native)
  - Olması gereken: kurumsal #1E1E8E veya benzer
  - Süre: ~10 dk
  - Risk: Düşük

---

## 🏛️ WON'T (bu çeyrek yok)

- Multi-language UI (Türkiye odaklı)
- VPS taşıma (3-6 ay sonra konuşulacak — MIMARI_KARARLAR 26 Nisan)
- PayTR Marketplace (IBAN üzerinden manuel — Mehmet Bey direktifi)
- Dış API satışı (henüz iç ürün)
- E-fatura entegrasyonu (Mehmet Bey'in vergi danışmanı kararına bağlı)

---

## 📊 PAYDAŞ BAZLI ETKİ TABLOSU

| Kesit | ADMIN | LAWYER | REPRESENTATIVE | CUSTOMER |
|---|---|---|---|---|
| Bulgu Kapatma | 🔴 | 🟡 | 🟡 | 🟡 |
| AI Analiz Doğruluk | 🟢 | 🔴 | 🟢 | 🔴 |
| Sözleşme Yönetimi | 🟡 | 🔴 | 🟢 | 🔴 |
| Avukat Akışı | 🟢 | 🔴 | 🟢 | 🟡 |
| Müvekkil Portal | 🟢 | 🟡 | 🟢 | 🔴 |
| UYAP Entegrasyon | 🟢 | 🔴 | 🟢 | 🟢 |
| SBM Entegrasyon | 🟢 | 🔴 | 🟢 | 🟡 |
| CommissionLog | 🔴 | 🟡 | 🔴 | 🟢 |

🔴 = doğrudan etkilenir, 🟡 = orta etkilenir, 🟢 = düşük/yok

---

## 🌐 DIŞ MUHATAP ETKİ TABLOSU (Madde 24.10 KVKK Disiplini)

| Sağlayıcı | Yurt | KVKK m.9 | SCC Durumu | İlgili Kesit |
|---|---|---|---|---|
| Supabase | ABD | EVET | Eksik (in-memory) | TUR #23 |
| Anthropic | ABD | EVET | Eksik (in-memory) | TUR #23 + AI Analiz |
| Meta WhatsApp | ABD/EU | EVET | Eksik (in-memory) | TUR #23 |
| Gmail | ABD | EVET | Eksik (in-memory) | TUR #23 |
| NetGSM | TR | HAYIR | Gerekmez | — |
| Render | ABD | Veri yok* | — | — |
| Vercel | ABD | Veri yok* | — | — |
| Türk Patent | TR | HAYIR | Gerekmez | — |

*Veri yok = sadece compute (DB onlarda değil)

---

## ⏱️ KAPASİTE NOTU

- **Mehmet Bey:** Tedbirge sahibi (girişimci, ürün sahibi)
- **Haftalık ortalama:** Değişken (saha programı yoğunluğuna bağlı)
- **Tipik tur süresi:** 1-3 saat
- **Tipik kesit süresi:** 5-15 saat (5-10 tur)
- **Sürdürülebilir hız:** Haftada 1-2 kesit veya 5-10 tur

---

## 🔗 BAĞIMLILIKLAR

```
Bulgu Kapatma Fazı (mevcut)
    ↓ (TUR #23 KVKK uyumu önce kapanmalı)
AI Analiz Doğruluk Kesiti
    ↓
Sözleşme Yönetimi Kesiti
    ↓
Avukat İş Akışı Derinleştirme + Müvekkil Portal
    ↓ (paralel olabilir)
UYAP + SBM Entegrasyonları
    ↓
CommissionLog + Mali Modülü (LATER)
```

### SHOULD + LATER — Yeni eklemeler (TUR #40 yan bulguları)

- **M3** — İki Footer pattern'i birleştirme (anasayfa inline + global root)
  - Tip: Mimari karar
  - Süre: 1 mimar tartışma turu + 1 uygulama turu
  - Risk: Orta (UX değişikliği, Mehmet Bey karar verir)
  - Bağımlılık: Yok, bağımsız ele alınabilir

---

## 🔄 GÜNCELLEME TARİHÇESİ

- **2026-04-30 (TUR #45.2)** — Y5 (Tailwind 4 @theme bloğu) + Y1 (~430 hex referans dönüşümü: 240 Tailwind arbitrary + 181 inline + 6 globals.css) kapatıldı. Açık 🔴 KRİTİK 0, açık 🟡 PLANLI 0.
- **2026-04-30** — TUR #45 sonrası: Y4 (OS arşivleme) + M2 (middleware → proxy.ts) kapatıldı. Y1 erteleme TUR #45.2'ye, Y5 yeni eklendi (Tailwind 4 @theme directive eksik — Y1'in ön şartı).
- **2026-05-01 (gece geç)** — TUR #44 BÜYÜK KAPANIŞ sonrası: aktif kesit son TUR #42 → #44, anayasa v1.10.0 → v1.11.0 (Madde 29 Hareket Disiplini), TUR #43 + #44 satırları ve TUR #44 detay bloğu eklendi, Y1/Y2/Y3/Y4 yan bulgular DEVIR'e geçti.
- **2026-04-30 (gece yarısı)** — TUR #42 sonrası: aktif kesit son TUR #41 → #42, M7 (/lexscan blue gradient) COULD+LATER'a eklendi.
- **2026-04-29 (öğleden sonra)** — TUR #41 sonrası: aktif kesit son TUR #40 → #41, M5 (manifest logo.png) COULD+LATER'a eklendi.
- **2026-04-29** — TUR #40 sonrası senkronizasyon: aktif kesit FAZ 4-B v1.10.0'a güncellendi (önceden TUR #24 v1.4.0). M2, M3 yan bulguları eklendi.
- v1.0 — 27 Nisan 2026 (sabah) — başlangıç sürümü (Madde 24 ile birlikte)

---

## 📊 Paydaş Etki Özeti — TUR #55 sonu (1 Mayıs 2026)

| Paydaş | ✅ Tam Operasyonel | 🟡 Kısmen | ⏭️ Eksik (TUR #56) |
|---|---|---|---|
| **LAWYER** | TahsilatPanel + Lead detay (mevcut) + assignment bildirimi | lawyerNotifications fonksiyonu yazılı, **trigger zinciri yok** (L-B1) | İhtarname/Dava/Duruşma/Bilirkişi UI sub-routes + AI onay modal (Madde 24.11) + Lead detay 8 tab Notion+Linear |
| **REPRESENTATIVE** | Yetki daraltma (53→39) + Profil/IBAN/vergi + Performans dashboard + Hakediş listesi | Dashboard mevcut çalışıyor | Dashboard yeniden Notion+Linear ilhamlı + Hakediş Stripe Invoice + Sözleşme SMS OTP imza UI |
| **CUSTOMER** | KVKK haklarım (6 hak + 30 gün countdown) | /musteri ana sayfa mevcut çalışıyor (1074 satır) | Timeline 8 aşama + AI sade özet + Belge upload drag-drop + Tahsilat görünümü |
| **ADMIN** | 3 Otonom Agent (Auditor+Healer+Reporter) + Public lead ADMIN_FEED + CommissionLog auto-trigger + sistem-durumu/agent-feed + 6 admin UI (TUR #52'den) | Mali rapor mevcut (367 satır + 4 chart) | Bildirim şablon UI (SystemSetting) + Mali rapor derinleştirme (komisyon trend + Top 5 LAWYER + KVKK ortalama) |

**Özet:** 4 CRM altyapı %100 hazır (schema + endpoint + service + 12 DS component). UI derinleştirme TUR #56'da. Yeni KIRMIZI nokta beklenmiyor (TUR #56 zero-schema).

---

## 📊 Paydaş Etki Özeti — TUR #56 sonu (TUR #57 öncesi)

| Paydaş | Fonksiyonel | Görsel Karakter (TUR #57'de uygulanacak) | Niş Emsal Hedef |
|---|---|---|---|
| **LAWYER** | ✅ Tam (8 tab + dava + ihtarname + duruşma + bilirkişi + tahsilat + AI onay + bildirim) | 🟡 Genel design system kullanıyor — case-centric karakter eksik | MyCase + Clio |
| **REPRESENTATIVE** | ✅ Tam (Dashboard + Profil/IBAN + Performans + Hakediş + Sözleşme UI) | 🟡 Genel — pipeline + gamification eksik | HubSpot Sales + Pipedrive |
| **CUSTOMER** | ✅ Tam (Timeline + AI sade + KVKK haklarım + belge upload + tahsilat) | 🟡 Genel — duygu hitabı + minimum bilgi karakteri eksik | Stripe Customer Portal + Apple Mail |
| **CEO/ADMIN** | ✅ Tam (Stripe seviye dashboard + 3 agent + canlı feed + bildirim şablon + mali rapor) | 🟡 Genel — komuta köprüsü ruhu (yoğun + anomali alarm) tam değil | Stripe Dashboard + Linear Insights |

**Özet (TUR #56 sonu):** 4 CRM **fonksiyonel olarak** tam operasyonel. **Karakter olarak** rol-ruh farklılaşması yok — TUR #57'de uygulanacak (Anayasa Madde 31.9 tohumu).

---

— Tedbirge Yol Haritası
— Madde 24 (İş Planı Disiplini) yürürlükte
— Son söz: Mehmet Dinç (Madde 17.5 + 24.9)
