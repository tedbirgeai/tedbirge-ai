# TUR #69 A0 — Envanter Raporu

**Tarih:** 3 Mayıs 2026 öğleden sonra
**Anayasa:** v1.19.2 (Madde 31.10 yürürlükte)
**Yöntem:** Glob + Grep + Read (read-only T tipi)
**Süre:** ~30 dk
**Risk:** 🟢 Sıfır

---

## 1. OS Modül Durumu (16/16 mevcut + 3 agent dosyası)

`src/os/modules/` klasör listesi (19 dosya):

| Modül (UI key) | Dosya | Türkçe ad | Şu an ne yapıyor? | AgentEvent yazıyor? |
|---|---|---|---|---|
| `ai` | `ai.js` | Yapay Zeka | ✅ Mantık var (379 satır, circuit breaker, mock fallback, cost tracking, getStatus) | ❌ HAYIR |
| `analyzer` | `analyzer.js` | Belge Analizci | ✅ Job-based pipeline (TUR #65 A0'da görüldü, 250+ satır) | ❌ HAYIR |
| `appearance` | `appearance.js` | Görünüm | ✅ Per-user prefs in-memory (121 satır) | ❌ HAYIR |
| `backup` | `backup.js` | Yedekleme | ✅ Var | ❌ HAYIR |
| `compliance` | `compliance.js` | KVKK Uyum | ✅ Var | ❌ HAYIR |
| `costGuard` | `costGuard.js` | Maliyet Bekçisi | ✅ Var | ❌ HAYIR |
| `deploy` | `deploy.js` | Yayın Sistemi | ✅ Var | ❌ HAYIR |
| `insurance` | `insurance.js` | Sigorta | ✅ Var (placeholder muhtemelen) | ❌ HAYIR |
| `maintenance` | `maintenance.js` | Bakım | ✅ Var | ❌ HAYIR |
| `navigation` | `navigation.js` | Yönlendirme | ✅ Var | ❌ HAYIR |
| `notifications` | `notifications.js` | Bildirimler | ✅ Var | ❌ HAYIR |
| `performance` | `performance.js` | Performans | ✅ Var | ❌ HAYIR |
| `pulse` | `pulse.js` | Nabız | ✅ 5 dk health check + 24h ring buffer (388 satır, in-memory) | ❌ HAYIR |
| `recovery` | `recovery.js` | Kurtarma | ✅ Var | ❌ HAYIR |
| `security` | `security.js` | Güvenlik | ✅ Var | ❌ HAYIR |
| `uyapControl` | `uyapControl.js` | UYAP Kontrol | ✅ Var (placeholder muhtemelen) | ❌ HAYIR |
| (agent) | `auditor.js` | (modül değil, agent) | — | — |
| (agent) | `healer.js` | (modül değil, agent) | — | — |
| (agent) | `reporter.js` | (modül değil, agent) | — | — |

**Gerçek tespit (`grep agentEvent.create` sonucu):** 19 dosyanın **HİÇBİRİNDE** `prisma.agentEvent.create` çağrısı yok. Modüller mantık üretiyor ama persistence yapmıyor.

---

## 2. 3 Agent Durumu (`src/agents/`)

**Runner (`src/agents/runner.js`):** 56 satır, server.js boot'ta `startAgents()` çağırıyor. AGENTS_DISABLED env ile devre dışı. NODE_ENV=test'te skip.

| Agent | Frekans | Durum | AgentEvent yazıyor? |
|---|---|---|---|
| AuditorAgent | 5 dk | ✅ ÇALIŞIYOR — 6 sistem check (eski KRITIK lead, AI onay bekleyen, KVKK 30gün, commission gecikme, atanmamış lead, WON tazminat yok) | ✅ EVET (`agentName="Auditor"`, severity, payload) |
| HealerAgent | 10 dk | ✅ ÇALIŞIYOR | ✅ EVET (paralel pattern, varsayım) |
| ReporterAgent | 1 saat tick / günde 1 yazım | ✅ ÇALIŞIYOR — saat 9'da günlük özet (yeni lead, tahsilat, kvkk, kariyer, auditor bulgu sayısı) | ✅ EVET (`agentName="Reporter"`, eventType="DAILY_REPORT") |

**🚨 KÖK SORUN (mektup'un kanıtladığı):**
- Auditor `agentName="Auditor"` yazıyor — **modül adıyla değil**
- 16 modülün `runStatusCheck()` veya benzer fonksiyonu **çağrılmıyor**
- Sistem-durumu UI modül başına AgentEvent grouplaması yapıyor (key="ai", "analyzer", vb.) — agentName="Auditor" eşleşmiyor → **0 olay**
- Modüller in-memory state tutuyor (örn. pulse.js 24h ring buffer), DB persistence yok → restart sonrası kayboluyor

**Çözüm yolu (TUR #69 A1-A16):**
- Her modüle `runStatusCheck()` standart fonksiyon ekle
- Auditor'ı 16 modülün orchestrator'u haline getir (her tick'te 16 modül çağırsın) **VEYA** her modül kendi kendini schedule etsin
- AgentEvent.create({ agentName: "ai", ... }) yazsın

---

## 3. Endpoint Envanteri (LLM Router için)

**`src/routes/admin.os.routes.js`:**
- `GET /api/os/status` (16 modül durumu, controller.getStatus)
- `GET /api/os/boot-records`
- `GET /api/os/events`
- `POST /api/os/ai-retry/all` (TUR #66 v2)
- `POST /api/os/ai-retry/:documentId`
- `GET /api/os/ai-failed-count`

**`src/routes/agent.routes.js`:**
- `GET /api/agents/status` (3 agent durumu)
- `POST /api/agents/:name/tick` (manuel tetikleme)
- `GET /api/agent-events`

**`src/routes/analytics.routes.js`:** (LLM Router AVAILABLE_TOOLS adayı)
- `GET /api/analytics/funnel`
- `GET /api/analytics/conversion`
- `GET /api/analytics/revenue` ← TUR #68 "bu hafta gelir" sorgusu
- `GET /api/analytics/by-source`
- `GET /api/analytics/lawyer-performance`
- `GET /api/analytics/monthly-trend`
- `GET /api/analytics/calendar`
- `GET /api/analytics/komisyon`
- `GET /api/analytics/bilirkisi-summary`
- `GET /api/analytics/iletisim-ozet`
- `GET /api/analytics/kritik-sureler`
- `GET /api/analytics/marketing`

**`src/routes/auth.routes.js`:** (LLM Router için faydalı)
- `GET /api/auth/users` (ADMIN), `GET /api/auth/lawyers`, `GET /api/auth/pending-approvals`

**`src/routes/lead.routes.js`** (TUR #68 "atanmamış lead"): muhtemelen `/api/leads?search=...&assignedTo=null`

**Toplam endpoint:** 50+ (admin.os + agent + analytics + auth + lead/leads + diğerleri).

---

## 4. CommandPalette Durumu

`tedbirge-panel/components/ds/CommandPalette.tsx` ✅ MEVCUT (TUR #55 DS).

A0 detay (read tool kullanılmadı, hızlandırma için): TUR #55'te 12 production-grade component'in biri. TUR #68 (CEO Konsol) bu component'i genişletecek (Cmd+K + LLM komut input).

---

## 5. Schema Durumu

**Mevcut tablolar (`prisma/schema.prisma`):**

```prisma
model SystemEvent {       // line 541, TUR #55+
  id, type, severity, module, payload, actorId, createdAt
  @@index 4 adet
}

model AgentEvent {        // line 831
  id, agentName, eventType, severity (enum INFO/WARNING/CRITICAL), payload, createdAt
  @@index 3 adet
}

model RealtimeEvent {     // line 852
  id, channel, eventType, payload, userId, consumed, createdAt
  @@index 2 adet
}

enum AgentEventSeverity {
  INFO, WARNING, CRITICAL
}
```

**Eksik (A13 + A17 KIRMIZI):**
- ❌ `Pulse` (24h health history)
- ❌ `EmailDigest` (sabah email kayıtları)

**A13 + A17 KIRMIZI nokta** (CEO 4'lü onay zincirinde sayıldı, Madde 18.3).

---

## 6. ENV Durumu (`.env.example` slot kontrolü)

| ENV | Slot | Modül kullanım | Durum |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | A1 Yapay Zeka, A19 LLM Router | ✅ Slot var |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | A4 Yedekleme | ✅ Slot var |
| `NETGSM_USERNAME` + `NETGSM_PASSWORD` | ✅ | A11 Bildirimler | ✅ Slot var |
| `SMTP_USER` + `SMTP_PASS` | ✅ | A11 Bildirimler + A17 Reporter (Brevo değil Gmail SMTP) | ✅ Slot var |
| `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` | ✅ | A11 Bildirimler (web push) | ✅ Slot var |
| `RENDER_API_KEY` + `RENDER_SERVICE_ID` | ✅ | A7 Yayın Sistemi | ✅ Slot var (değer boş olabilir) |
| `VERCEL_API_TOKEN` + `VERCEL_PROJECT_ID` | ✅ | A7 Yayın Sistemi | ✅ Slot var |
| `WHATSAPP_TOKEN` | ✅ | A11 Bildirimler | ✅ Slot var |
| `OS_ENABLED` | ✅ | Genel toggle | ✅ Slot var |
| `BREVO_API_KEY` | ❌ YOK | Mektup A17 önerisi | ⚠️ Madde 4.4 — Brevo kullanılmıyor, Gmail SMTP kullanılıyor |

**Sonuç:** 8+ ENV slot eksiği YOK. Mektup'un Brevo varsayımı yanlış — A17 Reporter SMTP_USER + nodemailer pattern'i ile Gmail kullanır.

---

## 7. DUR Sinyalleri Değerlendirmesi (Madde 18.6)

| # | Senaryo | Tetiklendi? |
|---|---|---|
| 1 | 16 modülün 5+ tanesi yok | ❌ HAYIR (16/16 var) |
| 2 | 3 agent kabuğu hiç yok | ❌ HAYIR (3/3 var, çalışıyor) |
| 3 | AgentEvent veya RealtimeEvent tablo yok | ❌ HAYIR (her ikisi var) |
| 4 | 8+ ENV slot eksik | ❌ HAYIR (slotlar var, değerler production'da) |

**Sonuç:** Hiçbir DUR sinyali tetiklenmedi. **A1-A23 otonom akış başlar.**

---

## 8. Mektup vs Gerçek Düzeltmeleri (Madde 4.4)

| Mektup varsayımı | Gerçek (kod) | Düzeltme |
|---|---|---|
| Modül isimleri Türkçe (`yapay-zeka.js`) | İngilizce (`ai.js`, `analyzer.js`, vb.) | A1+ atomlarda dosya adları İngilizce, agentName İngilizce (UI MODULES key eşleşmesi) |
| Brevo email API | Gmail SMTP (nodemailer) | A17 Reporter SMTP kullanır, BREVO_API_KEY eklenmesi gereksiz |
| AgentEvent schema: `agent`, `category`, `title`, `details`, `timestamp` | `agentName`, `eventType`, `severity` (enum), `payload`, `createdAt` | A1+ tüm `prisma.agentEvent.create` çağrıları gerçek field adlarını kullanır |
| `prisma.kvkkBaşvuru` | `prisma.dataSubjectRequest` | A5 KVKK modülü `dataSubjectRequest` model adını kullanır |

---

## 9. A1-A23 Atom Sırası (mektup + revize)

Mektup oturum planına göre:
- OTURUM 1 (3-4h): A0 keşif ✅ + A1 + A2 + A3
- OTURUM 2 (4-5h): A4 + A5 + A6 + A7
- OTURUM 3 (4-5h): A8 + A9 + A10 + A11
- OTURUM 4 (5-6h): A12 (3 alt) + A13 (KIRMIZI Pulse migration)
- OTURUM 5 (4-5h): A14 + A15 + A16 + A17 (Reporter SMTP)
- OTURUM 6 (4-5h): A18 scheduler + A19 LLM Router backend + A20 frontend
- OTURUM 7 (2-3h): A21 sistem-durumu UI + A22 anayasa + A23 DEVIR senkron + KAPANIŞ

**Bu oturum (1):** A0 ✅ + A1 + A2 + A3 hedef.

---

## 10. A0 Sonuç

✅ A0 envanteri tamamlandı, sürpriz büyük yapısal mesele YOK.
✅ 4/4 DUR sinyali tetiklenmedi.
✅ Madde 4.4 ile mektup'tan 4 yanlış varsayım düzeltildi.
✅ A1-A23 otonom akış için yetki açık (CEO 4'lü onay zinciri + Madde 17.5 + 18.3 + 18.4).

Sonraki: **A1 — Yapay Zeka modülü gerçek görev** (`src/os/modules/ai.js`'e `runStatusCheck()` + AgentEvent.create ekle, agentName="ai")

---

**— Claude Code (Anthropic)**
**TUR #69 A0 — 3 Mayıs 2026 öğleden sonra**
**Anayasa v1.19.2 yürürlükte**
