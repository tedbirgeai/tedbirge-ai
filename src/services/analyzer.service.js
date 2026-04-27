const Anthropic = require("@anthropic-ai/sdk");
const aiModule = require("./ai.service");
const { calculateCompensationEngine } = require("./compensation.engine");
const analysisConfig = require("../config/analysis.config");
const prisma = require("../config/db");

const QUALIFY_MODEL = "claude-sonnet-4-6";

function makeFallback(text, extra) {
  const cleanText = String(text || "").trim();
  const shortText = cleanText.length > 600 ? cleanText.slice(0, 600) + "..." : cleanText;

  return {
    aiSummary: cleanText
      ? "AI analiz gecici olarak kullanilamadi. OCR metni kaydedildi; manuel kontrol onerilir."
      : "Analiz icin yeterli metin bulunamadi.",
    qualificationScore: null,
    qualificationReason: cleanText
      ? "AI servis fallback modunda"
      : "Metin yok veya yetersiz",
    summary: cleanText
      ? "AI analiz gecici olarak kullanilamadi. OCR metni kaydedildi; manuel kontrol onerilir."
      : "Analiz icin yeterli metin bulunamadi.",
    score: null,
    raw: cleanText ? shortText : null,
    metadata: Object.assign({ fallback: true }, extra || {})
  };
}

function normalizeResult(result, text) {
  if (!result) return makeFallback(text, { reason: "empty_result" });

  if (typeof result === "string") {
    return {
      aiSummary: result,
      qualificationScore: null,
      qualificationReason: "String sonuc normalize edildi",
      summary: result,
      score: null,
      raw: result,
      metadata: { normalizedFrom: "string" }
    };
  }

  return {
    aiSummary:
      result.aiSummary ||
      result.summary ||
      result.analysis ||
      result.text ||
      "Analiz tamamlandi.",
    qualificationScore:
      result.qualificationScore ??
      result.score ??
      null,
    qualificationReason:
      result.qualificationReason ||
      result.reason ||
      null,
    summary:
      result.summary ||
      result.aiSummary ||
      result.analysis ||
      result.text ||
      "Analiz tamamlandi.",
    score:
      result.score ??
      result.qualificationScore ??
      null,
    raw:
      result.raw ??
      result,
    metadata: Object.assign({}, result.metadata || {})
  };
}

async function analyzeExtractedText(input) {
  const text =
    typeof input === "string"
      ? input
      : String(input?.text || input?.parsedText || "").trim();

  const lead =
    typeof input === "object"
      ? input.lead || null
      : null;

  if (!text) {
    return makeFallback(text, { reason: "empty_text" });
  }

  if (analysisConfig.analysisMode === "mock") {
    return {
      aiSummary: "[MOCK] Analiz tamamlandı. Gerçek sonuç için ANALYSIS_MODE=real ayarlayın.",
      qualificationScore: 50,
      qualificationReason: "mock_mode",
      summary: "[MOCK] Analiz tamamlandı.",
      score: 50,
      raw: text.slice(0, 200),
      metadata: { mock: true, mode: "mock" }
    };
  }

  const analyzeFn =
    aiModule.analyzeDocument ||
    aiModule.default ||
    aiModule.analyzeText ||
    aiModule.runAnalysis ||
    aiModule.analyze;

  if (typeof analyzeFn !== "function") {
    return makeFallback(text, { reason: "missing_function", module: "./ai.service.backup" });
  }

  try {
    const result = await analyzeFn(text, lead);

    let compensation = null;

    try {
      compensation = calculateCompensationEngine({
        lead,
        text
      });
    } catch (e) {
      console.error("[COMP_ENGINE_FAIL]", e);
    }

    const normalized = normalizeResult(result, text);

    if (compensation) {
      normalized.metadata = Object.assign({}, normalized.metadata, {
        compensation
      });
    }

    return normalized;
  } catch (error) {
    console.error("[ANALYZE_EXTRACTED_TEXT_ERROR]", error);
    return makeFallback(text, { reason: "analyze_throw", module: "./ai.service.backup" });
  }
}

// ─── Lead nitelendirme skoru (0-100) ─────────────────────────────────────────

async function calculateQualificationScore(leadId) {
  if (!leadId) return;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return; // mock ortamda sessizce cik

  let lead;
  try {
    lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, accidentSummary: true, accidentType: true, injurySeverity: true }
    });
  } catch (err) {
    console.error("[QUALIFY] Lead cekilemedi:", err.message);
    return;
  }

  if (!lead || !lead.accidentSummary || lead.accidentSummary.trim().length < 20) return;

  const prompt = `Asagidaki trafik veya is kazasi basvurusunu degerlendir ve 0-100 araliginda nitelendirme skoru ver.
Kaza turu: ${lead.accidentType || "belirtilmemis"}
Yaralanma siddet: ${lead.injurySeverity || "belirtilmemis"}
Ozet: ${lead.accidentSummary.slice(0, 800)}

Sadece JSON don: {"score": <0-100 tam sayi>, "reason": "<en fazla 1 cumle Turkce>"}`;

  try {
    const client = new Anthropic.default({ apiKey });
    const message = await client.messages.create({
      model: QUALIFY_MODEL,
      max_tokens: 100,
      system: "Sen Turk tazminat hukuku uzmanis. Basvuruyu degerlendir ve JSON don.",
      messages: [{ role: "user", content: prompt }]
    });

    const raw = (message.content[0]?.text || "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return;

    const parsed = JSON.parse(match[0]);
    const score = Number(parsed.score);
    if (!Number.isFinite(score) || score < 0 || score > 100) return;

    await prisma.lead.update({
      where: { id: leadId },
      data: { qualificationScore: Math.round(score) }
    });

    console.log(`[QUALIFY] Lead ${leadId} skoru: ${Math.round(score)} — ${parsed.reason || ""}`);
  } catch (err) {
    console.error("[QUALIFY] Skor hesaplanamadi:", err.message);
  }
}

module.exports = { analyzeExtractedText, calculateQualificationScore };