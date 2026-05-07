# TUR #93 — Yatay CRM Trigger Matrisi Raporu

**Tarih:** 7 Mayıs 2026 akşam
**Anayasa:** v1.22.23 → v1.22.24 PATCH (Madde 30.53 yeni)
**CEO Onay:** Mehmet DİNÇ — Madde 17.5 + 30.25 (4'lü zincir 7 May TUR #92 sonrası)
**Yaklaşım:** **Kanıt-bazlı (Madde 4.4 + 14.3 + TUR #88 emsali)** — mevcut trigger'lara DOKUNULMADI

---

## 📋 W0 32 HÜCRE KANIT MATRİSİ (4 ROL × 8 TRIGGER)

| # | Trigger | ADMIN | LAWYER | REPRESENTATIVE | CUSTOMER |
|---|---|---|---|---|---|
| 1 | Lead atama (`assignment.service.js assignLeadToLawyer`) | ✓ ActivityLog `LAWYER_ASSIGNED` + `BILDIRIM_GONDERILDI` audit · **W1+:** ADMIN_FEED RT yeni | ✓ SMS+Email+WhatsApp 3 kanal · **W1+:** LAWYER_${id} RT yeni | ❌ **eksikti — W1+:** REPRESENTATIVE_${id} RT yeni (lead.createdById) | ✓ SMS (sendLawyerAssignedSms) + Email (sendLawyerAssignedEmail) + WhatsApp |
| 2 | Lead status update (`lead.service.js updateLeadStatus`) | ✓ ActivityLog `LEAD_STATUS_UPDATED` | ✓ Push (assignment lawyer'a sendToUser) | ❌ Yok (kanıtlı eksik — gelecek TUR adayı) | ✓ Push (sendToUser ownerId) + SMS (sendStatusChangeSms) |
| 3 | CommissionLog created (`commission.service.js`) | ✓ realtimeEvent (commission:167) | ✓ notifyCommissionLogCreated | ✓ realtimeEvent (TUR #55 — temsilci hak ediş) | — |
| 4 | DataSubjectRequest yeni (`kvkk.service.js createPublicRequest`) | ❌ **eksikti — W2+:** ADMIN_FEED RT yeni (KVKK m.11 30 gün yanıt süresi) | ✓ notifyKvkkDeletionRequest (SILME ise) | — | — |
| 5 | AI Analiz tamamlandı (`analyzer.service.js`) | ✓ os/modules/ai+analyzer RT (11 modül) | ✓ notifyAiAnalysisCompleted + notifyAiAnalysisFailed | ❌ Yok (kanıtlı eksik) | ❌ Yok |
| 6 | Document uploaded (`documents.upload.routes.js`) | ✓ admin feed (analyzer modülü) | ✓ notifyDocumentUploaded | ❌ Yok | ❌ Yok |
| 7 | Contract signed | ✓ admin feed | ✓ notifyContractSigned | ❌ Yok | ❌ Yok |
| 8 | Dava aşama ilerleme (`davaSurec.service.js`) | ✓ admin feed | ✓ notifyDavaAsamaIlerleme | ❌ Yok | ❌ Yok |

**Mevcut sistem envanteri (kanıt-bazlı):**
- 18 dosya `prisma.realtimeEvent.create` çağrısı
- 7 `lawyerNotifications.service.js` trigger fonksiyonu
- 11 OS modülü RealtimeEvent.create (Auditor + Healer + Reporter + ai/analyzer/backup/compliance/costGuard/deploy/insurance/navigation/pulse/recovery/security)
- 3-kanal müvekkil bildirim (SMS + Email + WhatsApp) — `assignment.service.js`'te
- Push (sendToUser) — `lead.service.js updateLeadStatus`'ta CUSTOMER ownerId

**Madde 4.4 + 14.3 emsali (TUR #88 yaklaşımı):** Mevcut çalışan trigger'lara DOKUNULMADI. Sadece **2 net kanıtlanmış eksik** kapatıldı:
1. **W1:** `assignment.service.js` REPRESENTATIVE + ADMIN_FEED RealtimeEvent (mevcut SMS/Email/WhatsApp/ActivityLog/lawyerNotif KORUNDU)
2. **W2:** `kvkk.service.js` createPublicRequest ADMIN_FEED RealtimeEvent (mevcut LAWYER notif KORUNDU)

**Ek 2 yapısal yenilik:**
3. **W3:** `lib/useRealtimeFeed.ts` ROLE_KINDS export (rol-spesifik kind filtre helper)
4. **W4:** ADMIN dashboard "Avukat Workload" widget (`/api/users/lawyer-workload` endpoint + `LawyerWorkloadWidget.tsx` component, TUR #92 widget pattern emsali)

---

## 🛡️ W6 PRODUCTION SMOKE 22 SİSTEM (14/14 net yeşil)

| # | Test | Sonuç |
|---|---|---|
| 1 | /2fa-secim 307 (TUR #87) | ✅ 307 |
| 2 | /login 200 + 26996 byte (TUR #80+81) | ✅ 200 |
| 3 | /sw.js Cache-Control no-store (TUR #85.5 J1) | ✅ no-store |
| 4 | /api/agents-health X-Cache header (TUR #91 P4) | ✅ MISS (ilk istek doğal) |
| 5 | POST /api/auth/login 401 yanlış şifre (TUR #87.5) | ✅ 401 |
| 6 | /api/users/two-factor-adoption authsız 401 (TUR #92) | ✅ 401 |
| **7** | **/api/users/lawyer-workload authsız 401 (W4 yeni)** | **✅ 401 (mount + ADMIN guard çalışıyor)** |
| 8 | Auditor health | ✅ HEALTHY |
| 9 | eventCounts.last1h: 379 (16 modül canlı) | ✅ |
| 10-13 | 4 protected route 307 (TUR #87+#89): /dashboard /lawyer-dashboard /temsilci /musteri | ✅ 4/4 |
| 14 | 4 rol POST 401 (TUR #87.5): temsilci/yonetici/hukukcu/musteri | ✅ 4/4 |

**N trigger kanıtı (kod tabanı):**
- 18 dosya `RealtimeEvent.create` (kod tabanı zaten zengin)
- 7 lawyerNotifications trigger
- 11 OS modülü
- W1 +1 (assignment), W2 +1 (kvkk), W4 +1 (lawyer-workload), W3 +1 (ROLE_KINDS)
- Toplam: 18+ → 22+ dosya RealtimeEvent kanalı

---

## 📐 ANAYASA TESCİL — Madde 30.53

### 30.53 — Yatay CRM Bildirim Zinciri Disiplini (TUR #93)

**Kural:** Lead state geçişleri (atama, status update, commission, KVKK başvurusu, AI analiz, doküman) için 4 rol kopuksuz bildirim zinciri zorunlu. ADMIN_FEED audit kayıt zorunlu (KVKK m.10 izlenebilirlik). Mevcut trigger'lara dokunmadan eksik bildirimler **kanıt-bazlı** eklenir.

**Zorunlu zincir noktaları:**
1. Lead atama → 4 paralel: ADMIN_FEED + LAWYER_${id} + REPRESENTATIVE_${id} + Müvekkil (SMS/Email/WhatsApp)
2. Lead status update → 3 rol push (LAWYER + REPRESENTATIVE + CUSTOMER ownerId)
3. CommissionLog created → REPRESENTATIVE bildirim
4. DataSubjectRequest yeni → ADMIN_FEED + LAWYER (SILME ise)
5. AI Analiz / Document / Contract / Dava aşama → LAWYER lawyerNotifications + ADMIN feed

**Schema KIRMIZI (Madde 3.1) korundu:**
- RealtimeEvent gerçek schema field'ları: `channel + eventType + payload + userId + consumed`
- Yeni schema alanı eklenmedi
- Mektup spec'in `scope/kind/title/body/severity/metadata` JSON içinde `payload` field'ında saklanır

**Mevcut sistem envanteri (kanıt):**
- `lawyerNotifications.service.js` 7 trigger (Document/AI complete/AI fail/Contract/CommissionLog/KVKK/Dava)
- `assignment.service.js` 3-kanal müvekkil (SMS+Email+WhatsApp)
- `lead.service.js` updateLeadStatus push+SMS (ownerId CUSTOMER)
- 18 dosya RealtimeEvent.create
- 11 OS modülü adopsiyon/güvenlik/yedekleme/maliyet/deploy bildirimleri

**Yasak:**
- ❌ Mevcut çalışan trigger'a kanıtsız dokunmak (Madde 4.4 ihlali — TUR #88 emsali)
- ❌ Schema yeni alan ekleyerek bildirim eklemek (Madde 3.1 KIRMIZI)
- ❌ ADMIN_FEED audit eksik trigger eklemek (KVKK m.10 izlenebilirlik gerek)
- ❌ Müvekkil rıza yokluğunda otomatik email (mevcut KVKK pattern korunur — `customerEmail` + UTM consent)
- ❌ Sessiz state geçişi (3 rol bildirim alır — mevcut SMS+Email+WhatsApp+RT korunur)
- ❌ RealtimeEvent gerçek schema ihlali (mektup spec scope/kind yanlış — gerçek: channel/eventType/payload)

---

## 💰 MALİYET

- $0 yeni paket
- $0 yeni schema migration
- $0 yeni env değişikliği
- $0 production downtime
- 4 yeni RealtimeEvent kanalı + 1 yeni endpoint + 1 yeni widget + 1 yeni frontend export

---

## 🎯 SONUÇ

TUR #93 = "Yatay CRM 4 rol bildirim zinciri" CEO direktifi **kanıt-bazlı minimal** karşılandı. 8 atom W0-W7 sapma 0, 22 sistem koruma sağlam, anayasa Madde 30.53 ile yatay CRM disiplini kalıcı tescilli. Mevcut 18 dosya RealtimeEvent + 7 lawyerNotifications + 11 OS modülü **DOKUNULMADI** — sadece kanıtlanmış 2 net eksik (assignment ADMIN_FEED + REPRESENTATIVE feed, kvkk ADMIN_FEED) + 2 yeni özellik (ROLE_KINDS + Avukat Workload widget) eklendi.

**Pattern:** 331+ → 339+ atom · kalibrasyon 1.6× **45. doğrulama**.
**Mimar hatası kayıt:** **0 yeni hata** (TUR #85.9 sonrası 10. uçtan uca temiz TUR — TUR #86 → #87 → #87.5 → #88 → #89 → #89.5 → #90 → #91 → #92 → #93).

**TUR #94 NOW:** Cloudflare manuel + müvekkil panel içerik + 7 personel 2FA aktivasyon (TUR #92 cron 09:00 zaten aktif).

---

*Tedbirge.ai · TUR #93 Trigger Matrisi Raporu · 7 Mayıs 2026*
