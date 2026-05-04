# TUR #73 MEKTUBU — Auditor Wakeup + Manuel Trigger + UI Tetikle Butonu

**CEO onay:** Madde 17.5 + 18.3 + 30.25 4'lü zincir yenileme
**CEO emir formu:** "uçtan uca otonom tek komutla bana bir şey sormasın yapılsın"
**Pattern:** Aktif (Madde 30.25)
**KIRMIZI:** 0 · **Schema:** 0 · **npm:** 0
**Anayasa Madde 30.26:** 5 OS dosya tek commit zorunlu

---

## Atomlar

**Z1 — Tanı:**
Mevcut `/api/agents-health` JSON kontrolü. Auditor `lastRunAt` durumu, `lastEvent.severity`, `moduleCounts` değerleri.

**Z2 — Endpoint Sayım:**
`/api/agents-health` mevcut yeterli mi kontrol. Gerekirse genişletme.

**Z3 — Auditor Wakeup + HEARTBEAT Severity + Manuel Trigger:**
- Auditor canlı tutma (Render free tier wake-up sorunu için)
- HEARTBEAT AgentEvent severity ayarı
- Manuel trigger endpoint (`POST /api/os/agents/auditor/tick` mevcut, ADMIN auth)

**Z4 — UI "Auditor Tetikle" Butonu:**
`/dashboard/sistem-durumu` sayfasında ADMIN için "Auditor Tetikle" butonu — manual tick endpoint'ini çağırır, anında refresh.

**Z5 — Production Smoke 4 Kanıt:**
1. `/api/agents-health` → Auditor.lastRunAt < 5 dk
2. `eventCounts.last1h > 16` (16 modül × en az 1 tick)
3. `moduleCounts` her modülde > 0
4. UI sistem-durumu sayfası "Son aktivite" + "Olay/saat" canlı

**Z6 — 5 OS Dosya Senkron + 3 Commit Push:**
- Commit 1: Backend (Auditor + manual trigger)
- Commit 2: Panel (UI Tetikle butonu)
- Commit 3: 5 OS senkron (CLAUDE + DEVIR + IS_PLANI + OTONOM_RAPOR + MIMARI_KARARLAR)

---

## Kapanış

Mehmet Bey'e: **"✅ TUR #73 KAPALI"** + atom sayısı + production smoke 4 kanıt + sıradaki 2FA aktivasyon.

— TUR #73 Mektup
