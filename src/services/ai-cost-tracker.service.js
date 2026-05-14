// TUR #132 M1 — AI Maliyet Takibi (Madde 24.14 Sifir Maliyet Disiplini)
//
// Anthropic API token kullanim + maliyet log'lanir, aylik $100 limit asilirsa
// ADMIN_FEED bildirim (Madde 24.11 + 30.75 audit zinciri).
// Pricing tablosu Madde 30.78 (Framework Version) ile guncel tutulur.

"use strict";

const prisma = require("../config/db");

// Anthropic pricing — Mayis 2026 oran tablosu (per million tokens)
// Resmi: https://www.anthropic.com/pricing  (model adi degisirse Madde 30.78 yeni atom)
const PRICING = {
  "claude-opus-4-7": {
    input: 15 / 1_000_000,
    output: 75 / 1_000_000,
  },
  "claude-opus-4-20250514": {
    input: 15 / 1_000_000,
    output: 75 / 1_000_000,
  },
  "claude-sonnet-4-6": {
    input: 3 / 1_000_000,
    output: 15 / 1_000_000,
  },
};

const MONTHLY_BUDGET_USD = 100;
const CRITICAL_THRESHOLD_USD = 200;

async function logAiCost({ documentId, leadId, modelVersion, promptTokens, completionTokens }) {
  const pricing = PRICING[modelVersion];
  if (!pricing) {
    console.warn(`[ai-cost] Bilinmeyen model fiyati: ${modelVersion} — log'a 0 USD yazildi`);
  }

  const costUsd = pricing
    ? promptTokens * pricing.input + completionTokens * pricing.output
    : 0;

  await prisma.activityLog
    .create({
      data: {
        leadId: leadId || null,
        action: "AI_API_CALL_COST",
        detail: `documentId:${documentId || "n/a"} model:${modelVersion} prompt:${promptTokens} completion:${completionTokens} usd:${costUsd.toFixed(4)}`,
      },
    })
    .catch((err) => console.warn("[ai-cost] activityLog yazilamadi:", err.message));

  // Aylik toplam hesapla
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  try {
    const monthLogs = await prisma.activityLog.findMany({
      where: {
        action: "AI_API_CALL_COST",
        createdAt: { gte: monthStart },
      },
      select: { detail: true },
    });

    const monthlyTotal = monthLogs.reduce((sum, log) => {
      const m = (log.detail || "").match(/usd:([\d.]+)/);
      return sum + (m ? parseFloat(m[1]) : 0);
    }, 0);

    // Madde 24.14 limit kontrolu — $100 WARNING, $200 CRITICAL
    if (monthlyTotal > MONTHLY_BUDGET_USD) {
      try {
        // ADMIN_FEED RealtimeEvent (kanit-bazli, mevcut Madde 24.11 emsali)
        await prisma.realtimeEvent.create({
          data: {
            channel: "ADMIN_FEED",
            eventType: "AI_COST_LIMIT",
            payload: {
              monthlyTotal: monthlyTotal.toFixed(2),
              budget: MONTHLY_BUDGET_USD,
              critical: monthlyTotal > CRITICAL_THRESHOLD_USD,
              severity: monthlyTotal > CRITICAL_THRESHOLD_USD ? "CRITICAL" : "WARNING",
              message: `Bu ay AI API maliyeti: $${monthlyTotal.toFixed(2)} (butce: $${MONTHLY_BUDGET_USD})`,
            },
          },
        });
      } catch (err) {
        console.warn("[ai-cost] RealtimeEvent ADMIN_FEED yazilamadi:", err.message);
      }
    }

    return { costUsd, monthlyTotal };
  } catch (err) {
    console.warn("[ai-cost] aylik toplam hesaplanamadi:", err.message);
    return { costUsd, monthlyTotal: null };
  }
}

module.exports = { logAiCost, PRICING, MONTHLY_BUDGET_USD };
