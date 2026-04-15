const aiModule = require("./ai.service");
const { calculateCompensationEngine } = require("./compensation.engine");
const analysisConfig = require("../config/analysis.config");

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

module.exports = { analyzeExtractedText };