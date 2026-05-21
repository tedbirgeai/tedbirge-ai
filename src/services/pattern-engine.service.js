// TUR #132.4 — Tedbirge AI Cekirdek (TAC) Pattern Engine
// Madde 24.14 R1 KALIN — AI Bagimsizlik (Tedbirge mulkiyeti, $0 maliyet, KVKK uyumlu)
// Madde 30.92 — Master Data Disiplini (tedbirge-os/data/patterns/ v1)
//
// Mevcut Opus 4.7 cagirisi ai-analyzer.service.js'de korunur (Madde 4.6 hibrit):
// - LexScan + ai-analyzer pattern-engine kullanir (lokal, ucretsiz)
// - Diger 11 servis (ai/contract/muhatapAI/bilirkisi/ocr/...) Anthropic'ten devam eder

"use strict";

const fs = require("fs");
const path = require("path");
const prisma = require("../config/db");

let pdfParse;
try {
  pdfParse = require("pdf-parse");
} catch (err) {
  console.warn("[pattern-engine] pdf-parse paketi yok, PDF parsing devre disi");
}

const PATTERNS_DIR = path.resolve(__dirname, "../../tedbirge-os/data/patterns");

let accidentPatterns = { patterns: {} };
let injuryPatterns = { patterns: {} };
let insurancePolicyPatterns = { patterns: {} };
let icd10Patterns = { patterns: {}, common_codes: {} };

function loadPatterns() {
  try {
    accidentPatterns = JSON.parse(
      fs.readFileSync(path.join(PATTERNS_DIR, "accident-type-patterns-v1.json"), "utf-8")
    );
    injuryPatterns = JSON.parse(
      fs.readFileSync(path.join(PATTERNS_DIR, "injury-disability-patterns-v1.json"), "utf-8")
    );
    insurancePolicyPatterns = JSON.parse(
      fs.readFileSync(path.join(PATTERNS_DIR, "insurance-policy-patterns-v1.json"), "utf-8")
    );
    icd10Patterns = JSON.parse(
      fs.readFileSync(path.join(PATTERNS_DIR, "medical-icd10-patterns-v1.json"), "utf-8")
    );
    console.log("[pattern-engine] 4 pattern dosyasi yuklendi (v1-2026)");
  } catch (err) {
    console.error("[pattern-engine] Pattern yukleme hatasi:", err.message);
  }
}

loadPatterns();

// Turkce buyuk/kucuk harf duyarsiz normalize
function normalize(text) {
  return String(text || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/i̇/g, "i")
    .replace(/I/g, "i");
}

// Belgeden metin cikar (PDF buffer/url + text fallback)
async function extractText(doc) {
  if (!doc) return null;

  // Eger 'buffer' verilmisse direkt parse
  if (doc.buffer && pdfParse && (doc.mimeType === "application/pdf" || doc.mimeType?.includes("pdf"))) {
    try {
      const data = await pdfParse(doc.buffer);
      return data.text;
    } catch (err) {
      console.error(`[pattern-engine] PDF parse hatasi: ${err.message}`);
      return null;
    }
  }

  // Eger text verilmisse direkt don
  if (doc.text) return String(doc.text);

  // URL'den indir (Supabase signed URL)
  const url = doc.supabaseUrl || doc.url;
  if (!url) return null;

  try {
    const fetchFn = typeof fetch === "function" ? fetch : require("node-fetch");
    const res = await fetchFn(url);

    if (doc.mimeType === "application/pdf" && pdfParse) {
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const data = await pdfParse(buffer);
      return data.text;
    }

    if (doc.mimeType?.startsWith("text/")) {
      return await res.text();
    }

    return null;
  } catch (err) {
    console.error(`[pattern-engine] extractText hata docId=${doc.id}: ${err.message}`);
    return null;
  }
}

// Kaza turu tespit
function detectAccidentType(text) {
  const norm = normalize(text);
  const scores = { TRAFFIC: 0, WORK: 0, OTHER: 0 };

  for (const [type, config] of Object.entries(accidentPatterns.patterns || {})) {
    for (const kw of config.keywords || []) {
      if (norm.includes(normalize(kw))) {
        scores[type] = (scores[type] || 0) + (config.weight || 1);
      }
    }
    for (const rgx of config.regex || []) {
      try {
        if (new RegExp(rgx, "gi").test(text)) {
          scores[type] = (scores[type] || 0) + (config.weight || 1) * 2;
        }
      } catch (_) {}
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const best = sorted[0];
  if (!best || best[1] === 0) return { value: null, confidence: 0 };

  const total = (scores.TRAFFIC || 0) + (scores.WORK || 0) + (scores.OTHER || 0);
  const confidence = Math.min(1, best[1] / Math.max(total, 1));

  return { value: best[0], confidence };
}

// Maluliyet orani
function detectMaluliyet(text) {
  const cfg = injuryPatterns.patterns?.maluliyet;
  if (!cfg) return { value: null, confidence: 0 };

  for (const rgx of cfg.regex || []) {
    try {
      const match = new RegExp(rgx, "gi").exec(text);
      if (match && match[1]) {
        const val = parseFloat(match[1].replace(",", "."));
        if (val > 0 && val <= 100) {
          return { value: val, confidence: 0.9 };
        }
      }
    } catch (_) {}
  }
  return { value: null, confidence: 0 };
}

// Yaralanma var mi
function detectInjury(text) {
  const norm = normalize(text);
  const cfg = injuryPatterns.patterns?.yaralanma_var;
  if (!cfg) return { value: false, confidence: 0.5 };

  for (const kw of cfg.keywords || []) {
    if (norm.includes(normalize(kw))) {
      return { value: true, confidence: 0.85 };
    }
  }
  return { value: false, confidence: 0.5 };
}

// Vefat var mi
function detectVefat(text) {
  const norm = normalize(text);
  const cfg = injuryPatterns.patterns?.vefat;
  if (!cfg) return { value: false, confidence: 0.5 };

  for (const kw of cfg.keywords || []) {
    if (norm.includes(normalize(kw))) {
      return { value: true, confidence: 0.9 };
    }
  }
  return { value: false, confidence: 0.5 };
}

// Police no
function detectPoliceNo(text) {
  const cfg = insurancePolicyPatterns.patterns?.police_no;
  if (!cfg) return { value: null, confidence: 0 };

  for (const rgx of cfg.regex || []) {
    try {
      const match = new RegExp(rgx, "gi").exec(text);
      if (match && match[1]) {
        return { value: match[1].trim(), confidence: 0.85 };
      }
    } catch (_) {}
  }
  return { value: null, confidence: 0 };
}

// Kaza tarihi
function detectKazaTarihi(text) {
  const cfg = insurancePolicyPatterns.patterns?.tarih;
  if (!cfg) return { value: null, confidence: 0 };

  for (const rgx of cfg.regex || []) {
    try {
      const match = new RegExp(rgx, "gi").exec(text);
      if (match) {
        const dateStr = match[1] || match[0];
        let isoDate;
        if (dateStr.includes(".")) {
          const [d, m, y] = dateStr.split(".");
          isoDate = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        } else if (dateStr.includes("/")) {
          const [d, m, y] = dateStr.split("/");
          isoDate = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        } else {
          isoDate = dateStr;
        }
        const dt = new Date(isoDate);
        if (!isNaN(dt.getTime()) && dt.getFullYear() >= 2010 && dt.getFullYear() <= 2030) {
          return { value: isoDate, confidence: 0.85 };
        }
      }
    } catch (_) {}
  }
  return { value: null, confidence: 0 };
}

// Sigorta sirketi (master data lookup)
async function detectInsuranceCompany(text) {
  const norm = normalize(text);

  let companies = [];
  try {
    companies = await prisma.insuranceCompany.findMany({
      where: { active: true },
      select: { id: true, name: true, shortName: true, policyPrefix: true },
    });
  } catch (err) {
    console.warn(`[pattern-engine] InsuranceCompany lookup hatasi: ${err.message}`);
    return { id: null, name: null, confidence: 0 };
  }

  for (const c of companies) {
    const candidates = [c.name, c.shortName].filter(Boolean).map(normalize);
    for (const cand of candidates) {
      if (cand && cand.length >= 3 && norm.includes(cand)) {
        return { id: c.id, name: c.name, confidence: 0.9 };
      }
    }
    const prefixes = Array.isArray(c.policyPrefix) ? c.policyPrefix : [];
    for (const prefix of prefixes) {
      if (prefix && text.includes(prefix)) {
        return { id: c.id, name: c.name, confidence: 0.7 };
      }
    }
  }
  return { id: null, name: null, confidence: 0 };
}

// ICD-10 tespit (baglam dogrulamali)
function detectICD10(text) {
  const cfg = icd10Patterns.patterns?.icd10_kod;
  if (!cfg) return { value: null, confidence: 0 };

  for (const rgx of cfg.regex || []) {
    try {
      const re = new RegExp(rgx, "g");
      const match = re.exec(text);
      if (match && match[1]) {
        const start = Math.max(0, match.index - 50);
        const end = Math.min(text.length, match.index + 50);
        const context = text.slice(start, end);
        const hasContext = (cfg.validationKeywords || []).some((kw) =>
          normalize(context).includes(normalize(kw))
        );
        return { value: match[1], confidence: hasContext ? 0.85 : 0.6 };
      }
    } catch (_) {}
  }
  return { value: null, confidence: 0 };
}

// Belge tipi (basit heuristik)
function detectDocumentType(text) {
  const norm = normalize(text);
  if (norm.includes("epikriz") || norm.includes("hasta cikis")) {
    return { value: "epikriz", confidence: 0.85 };
  }
  if (norm.includes("kaza tutanak") || norm.includes("kaza tespit")) {
    return { value: "kaza-tutanagi", confidence: 0.85 };
  }
  if (norm.includes("police") || norm.includes("zorunlu mali")) {
    return { value: "police", confidence: 0.8 };
  }
  if (norm.includes("sgk") && (norm.includes("rapor") || norm.includes("bildirim"))) {
    return { value: "sgk-raporu", confidence: 0.8 };
  }
  if (norm.includes("vekaletname")) {
    return { value: "vekaletname", confidence: 0.9 };
  }
  if (norm.includes("kimlik")) {
    return { value: "kimlik", confidence: 0.7 };
  }
  if (norm.includes("fatura")) {
    return { value: "tedavi-faturasi", confidence: 0.7 };
  }
  return { value: "diger", confidence: 0.4 };
}

// Ana analiz fonksiyonu — mevcut Anthropic 14 alan ciktisina UYUMLU sema
async function analyzeText(text) {
  if (!text || text.length < 20) {
    return {
      raw: {
        documentType: null,
        documentTypeConfidence: 0,
        extractedData: {},
        warnings: ["text_too_short"],
        overallConfidence: 0,
      },
      modelVersion: "tedbirge-pattern-engine-v1",
      promptTokens: 0,
      completionTokens: 0,
    };
  }

  const docType = detectDocumentType(text);
  const accidentType = detectAccidentType(text);
  const maluliyet = detectMaluliyet(text);
  const injury = detectInjury(text);
  const vefat = detectVefat(text);
  const policeNo = detectPoliceNo(text);
  const kazaTarihi = detectKazaTarihi(text);
  const sigorta = await detectInsuranceCompany(text);
  const icdCode = detectICD10(text);

  const extractedData = {
    kazaTarihi: kazaTarihi.value,
    kazaTarihiConfidence: kazaTarihi.confidence,
    kazaTuru: accidentType.value,
    kazaTuruConfidence: accidentType.confidence,
    kazaYeri: null,
    sigortaSirketi: sigorta.name,
    sigortaSirketiConfidence: sigorta.confidence,
    policeNo: policeNo.value,
    policeNoConfidence: policeNo.confidence,
    yaralanmaVar: injury.value,
    icdCode: icdCode.value,
    icdCodeConfidence: icdCode.confidence,
    maluliyetOrani: maluliyet.value,
    maluliyetOraniConfidence: maluliyet.confidence,
    kusurOrani: null,
    kusurOraniConfidence: 0,
    vefatVar: vefat.value,
    aracDegerKaybi: null,
  };

  // Ortalama confidence (sifir olmayan alanlar)
  const confidences = [
    accidentType.confidence,
    maluliyet.confidence,
    injury.confidence,
    policeNo.confidence,
    kazaTarihi.confidence,
    sigorta.confidence,
    icdCode.confidence,
  ].filter((c) => c > 0);

  const overallConfidence =
    confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;

  const warnings = [];
  if (overallConfidence < 0.7) warnings.push("low_overall_confidence");
  if (confidences.length < 2) warnings.push("few_fields_extracted");

  return {
    raw: {
      documentType: docType.value,
      documentTypeConfidence: docType.confidence,
      extractedData,
      warnings,
      overallConfidence,
    },
    modelVersion: "tedbirge-pattern-engine-v1",
    promptTokens: 0,
    completionTokens: 0,
    textLength: text.length,
    extractedFieldsCount: confidences.length,
  };
}

module.exports = {
  loadPatterns,
  extractText,
  analyzeText,
  detectAccidentType,
  detectMaluliyet,
  detectInjury,
  detectVefat,
  detectPoliceNo,
  detectKazaTarihi,
  detectInsuranceCompany,
  detectICD10,
  detectDocumentType,
};
