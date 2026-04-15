function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function lower(value) {
  return normalizeText(value).toLocaleLowerCase("tr-TR");
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function roundMoney(num) {
  return Math.round(Number(num || 0));
}

function findFirstNumber(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const value = Number(String(match[1]).replace(/\./g, "").replace(/,/g, "."));
      if (!Number.isNaN(value)) return value;
    }
  }
  return null;
}

function detectDocumentType(text) {
  if (/(trafik|kaza tespit|araç hasar|değer kaybı|sürücü|plaka|karayolları)/i.test(text)) {
    return "TRAFFIC_ACCIDENT";
  }
  if (/(iş kazası|sgk|meslek hastalığı|iş göremezlik|işyeri|işveren)/i.test(text)) {
    return "WORK_ACCIDENT";
  }
  if (/(epikriz|hastane|sağlık kurulu|adli tıp|maluliyet|özür oran)/i.test(text)) {
    return "MEDICAL_REPORT";
  }
  return "OTHER";
}

function detectCaseType(text) {
  const t = lower(text);

  const death = /(vefat|ölüm|destekten yoksun|muris|merhum)/i.test(t);
  const injury = /(yaralan|maluliyet|iş göremez|tedavi|ameliyat|epikriz)/i.test(t);
  const vehicle = /(araç hasar|değer kaybı|pert|onarım|ekspertiz)/i.test(t);

  if (death && vehicle) return "DEATH_AND_VEHICLE";
  if (death) return "DEATH";
  if (injury && vehicle) return "INJURY_AND_VEHICLE";
  if (injury) return "INJURY";
  if (vehicle) return "VEHICLE_DAMAGE";
  return "UNKNOWN";
}

function extractAge(text, lead) {
  const fromLead = Number(lead?.age);
  if (!Number.isNaN(fromLead) && fromLead > 0) return fromLead;

  const patterns = [
    /(\d{2})\s*yaş(?:ında)?/i,
    /yaşı\s*[:\-]?\s*(\d{2})/i,
    /doğum\s*tarihi.*?(\d{4})/i
  ];

  const year = new Date().getFullYear();
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const raw = Number(match[1]);
      if (pattern.source.includes("\\d{4}")) {
        const age = year - raw;
        if (age >= 0 && age <= 100) return age;
      } else if (raw >= 0 && raw <= 100) {
        return raw;
      }
    }
  }

  return 35;
}

function extractGender(text, lead) {
  const value = String(lead?.gender || "").toLowerCase();
  if (value) return value;

  if (/(erkek)/i.test(text)) return "male";
  if (/(kadın)/i.test(text)) return "female";
  return "unknown";
}

function extractMonthlyIncome(text, lead) {
  const leadIncome = Number(lead?.monthlyIncome || lead?.income);
  if (!Number.isNaN(leadIncome) && leadIncome > 0) return leadIncome;

  const patterns = [
    /aylık\s*(?:net\s*)?gelir(?:i)?\s*[:\-]?\s*([\d\.\,]+)/i,
    /maaş(?:ı)?\s*[:\-]?\s*([\d\.\,]+)/i,
    /ücret(?:i)?\s*[:\-]?\s*([\d\.\,]+)/i,
    /([\d\.\,]+)\s*tl\s*(?:aylık|maaş|gelir)/i
  ];

  const income = findFirstNumber(text, patterns);
  if (income && income > 0) return income;

  return 22104;
}

function extractMaluliyetRate(text) {
  const patterns = [
    /maluliyet\s*oran(?:ı|i)\s*[:\-]?\s*%?\s*(\d{1,2}(?:[\.\,]\d+)?)/i,
    /özür\s*oran(?:ı|i)\s*[:\-]?\s*%?\s*(\d{1,2}(?:[\.\,]\d+)?)/i,
    /iş\s*göremezlik\s*oran(?:ı|i)\s*[:\-]?\s*%?\s*(\d{1,2}(?:[\.\,]\d+)?)/i,
    /%\s*(\d{1,2}(?:[\.\,]\d+)?)\s*(?:maluliyet|özür|iş göremezlik)/i
  ];

  const value = findFirstNumber(text, patterns);
  if (value === null) {
    return {
      rate: null,
      source: "not_found",
      confidence: 0.2
    };
  }

  return {
    rate: clamp(value / 100, 0, 1),
    source: "document_text",
    confidence: 0.8
  };
}

/**
 * Davacı/mağdur kusur oranını tahmin eder (0–1).
 * Trafik: KTK m.51 — müterafik kusur oranında tazminat indirilir.
 * İş kazası: TBK m.52 — işçi (mağdur) kusur oranı ayrı değerlendirilir;
 *            işveren kusuru ise tazminat tabanını etkiler (ek çıktı).
 *
 * Dönen nesne:
 *   rate           → davacı/mağdur kusur oranı (tazminattan düşülür)
 *   employerFault  → işveren kusur oranı (iş kazasında; sadece bilgi amaçlı)
 *   source, confidence
 */
function estimateFaultRate(text, documentType) {
  const t = lower(text);
  const isWorkAccident = documentType === "WORK_ACCIDENT";

  // ── Kusursuzluk ifadeleri ───────────────────────────────────────────────────
  if (/(kusursuz|kusur yok|tam kusursuz|kusurum yok)/i.test(t)) {
    return {
      rate: 0,
      employerFault: isWorkAccident ? 1.0 : null,
      source: "document_text",
      confidence: 0.85
    };
  }

  // ── Karşı taraf tam kusurlu → davacı kusursuz ──────────────────────────────
  if (/(karşı taraf.*%?\s*100.*kusur|%?\s*100.*kusurlu|tam kusurlu karşı)/i.test(t)) {
    return {
      rate: 0,
      employerFault: isWorkAccident ? 1.0 : null,
      source: "document_text",
      confidence: 0.85
    };
  }

  // ── "asli kusur" = davacı taraf tam kusurlu ────────────────────────────────
  if (/(asli kusur|%?\s*100\s*kusur(?!lu karşı))/i.test(t)) {
    return {
      rate: 1.0,
      employerFault: isWorkAccident ? 0.0 : null,
      source: "document_text",
      confidence: 0.85
    };
  }

  // ── İş kazası: işveren kusuru ile işçi kusuru ayrı ayrı aranır ────────────
  if (isWorkAccident) {
    const workerFaultPat = [
      /işçi\s*kusur(?:u)?\s*[:\-]?\s*%?\s*(\d{1,3})/i,
      /işçinin\s*kusur\s*oran(?:ı|i)\s*[:\-]?\s*%?\s*(\d{1,3})/i,
      /mağdur\s*kusur(?:u)?\s*[:\-]?\s*%?\s*(\d{1,3})/i,
    ];
    const employerFaultPat = [
      /işveren\s*kusur(?:u)?\s*[:\-]?\s*%?\s*(\d{1,3})/i,
      /işverenin\s*kusur\s*oran(?:ı|i)\s*[:\-]?\s*%?\s*(\d{1,3})/i,
    ];

    const workerFaultVal   = findFirstNumber(text, workerFaultPat);
    const employerFaultVal = findFirstNumber(text, employerFaultPat);

    if (workerFaultVal !== null) {
      const wRate = clamp(workerFaultVal / 100, 0, 1);
      const eRate = employerFaultVal !== null
        ? clamp(employerFaultVal / 100, 0, 1)
        : clamp(1 - wRate, 0, 1);
      return {
        rate: wRate,
        employerFault: eRate,
        source: "document_text",
        confidence: 0.8
      };
    }

    if (employerFaultVal !== null) {
      const eRate = clamp(employerFaultVal / 100, 0, 1);
      return {
        rate: clamp(1 - eRate, 0, 1),
        employerFault: eRate,
        source: "document_text",
        confidence: 0.75
      };
    }

    // İş kazasında varsayılan: işçi %10 kusurlu, işveren %90 kusurlu
    return {
      rate: 0.10,
      employerFault: 0.90,
      source: "default_estimate_work",
      confidence: 0.30
    };
  }

  // ── Trafik kazası: genel kusur oranı aranır ────────────────────────────────
  const trafficPatterns = [
    /kusur\s*oran(?:ı|i)\s*[:\-]?\s*%?\s*(\d{1,3})/i,
    /%(\d{1,3})\s*kusur/i,
    /(\d{1,3})\s*%\s*kusur/i,
  ];

  const value = findFirstNumber(text, trafficPatterns);
  if (value !== null) {
    return {
      rate: clamp(value / 100, 0, 1),
      employerFault: null,
      source: "document_text",
      confidence: 0.8
    };
  }

  // Trafik kazasında varsayılan: paylaşımlı kusur %25
  return {
    rate: 0.25,
    employerFault: null,
    source: "default_estimate_traffic",
    confidence: 0.35
  };
}

function detectDamageItems(text, caseType) {
  const t = lower(text);

  return {
    treatmentExpenses: /(tedavi|ameliyat|ilaç|hastane|muayene|fatura)/i.test(t),
    temporaryWorkIncapacity: /(geçici iş göremez|istirahat|rapor süresi)/i.test(t),
    permanentWorkIncapacity: /(sürekli iş göremez|kalıcı maluliyet|maluliyet)/i.test(t) || /INJURY/.test(caseType),
    caregiverExpenses: /(bakıcı|refakatçi|sürekli bakım)/i.test(t),
    deathCompensation: /DEATH/.test(caseType),
    funeralExpenses: /(cenaze|defin|mezar)/i.test(t),
    vehicleDamage: /(araç hasar|onarım|servis|ekspertiz|pert)/i.test(t),
    vehicleValueLoss: /(değer kaybı)/i.test(t),
    moralDamages: /(manevi tazminat|elem|ızdırap)/i.test(t) || true
  };
}

function estimateMissingDocuments(text, documentType, caseType, damageItems) {
  const t = lower(text);
  const missing = [];

  if (documentType === "TRAFFIC_ACCIDENT" && !/(kaza tespit|trafik kaza|tutanak)/i.test(t)) {
    missing.push("Kaza tespit tutanağı");
  }

  if ((caseType === "INJURY" || caseType === "INJURY_AND_VEHICLE") && !/(epikriz|sağlık kurulu|adli tıp|maluliyet)/i.test(t)) {
    missing.push("Sağlık kurulu / maluliyet raporu");
  }

  if (/DEATH/.test(caseType) && !/(veraset|mirasçılık|ölüm belgesi)/i.test(t)) {
    missing.push("Veraset ilamı / ölüm belgesi");
  }

  if (damageItems.vehicleDamage && !/(ekspertiz|onarım fatur|servis fatur)/i.test(t)) {
    missing.push("Ekspertiz / onarım faturaları");
  }

  if (!/(kusur|bilirkişi|inceleme raporu)/i.test(t)) {
    missing.push("Kusur / bilirkişi raporu");
  }

  return missing;
}

function splitPeriods(age) {
  return {
    activeYears: Math.max(0, 60 - age),
    passiveYears: Math.max(0, 72 - Math.max(age, 60))
  };
}

function discountFactor(year, rate) {
  return 1 / Math.pow(1 + rate, year);
}

function calculateActuarialCore(age, monthlyIncome, maluliyetRate, config) {
  const yearlyIncome = monthlyIncome * 12;
  const { activeYears, passiveYears } = splitPeriods(age);

  let activeLoss = 0;
  for (let i = 1; i <= activeYears; i++) {
    activeLoss += yearlyIncome * maluliyetRate * discountFactor(i, config.discountRate);
  }

  let passiveLoss = 0;
  for (let i = 1; i <= passiveYears; i++) {
    passiveLoss += yearlyIncome * config.passiveIncomeRatio * maluliyetRate * discountFactor(i, config.discountRate);
  }

  return {
    activeYears,
    passiveYears,
    yearlyIncome: roundMoney(yearlyIncome),
    activeLoss: roundMoney(activeLoss),
    passiveLoss: roundMoney(passiveLoss),
    totalLoss: roundMoney(activeLoss + passiveLoss)
  };
}

function estimateDeathSupportCompensation(monthlyIncome, config) {
  const yearlyIncome = monthlyIncome * 12;
  const supportYears = 15;
  let total = 0;

  for (let i = 1; i <= supportYears; i++) {
    total += yearlyIncome * config.supportShare * discountFactor(i, config.discountRate);
  }

  return roundMoney(total);
}

function estimateTreatmentExpenses(text) {
  const value = findFirstNumber(text, [
    /tedavi\s*gider(?:i|leri)?\s*[:\-]?\s*([\d\.\,]+)/i,
    /hastane\s*masraf(?:ı|lari)?\s*[:\-]?\s*([\d\.\,]+)/i,
    /fatura\s*toplam(?:ı)?\s*[:\-]?\s*([\d\.\,]+)/i
  ]);

  return roundMoney(value || 0);
}

function estimateVehicleDamage(text) {
  const value = findFirstNumber(text, [
    /araç\s*hasar(?:ı)?\s*[:\-]?\s*([\d\.\,]+)/i,
    /onarım\s*bedel(?:i)?\s*[:\-]?\s*([\d\.\,]+)/i,
    /ekspertiz\s*bedel(?:i)?\s*[:\-]?\s*([\d\.\,]+)/i
  ]);

  return roundMoney(value || 0);
}

function estimateVehicleValueLoss(text) {
  const value = findFirstNumber(text, [
    /değer\s*kayb(?:ı)?\s*[:\-]?\s*([\d\.\,]+)/i
  ]);

  return roundMoney(value || 0);
}

function estimateMoralDamages(caseType, maluliyetRate, faultRate) {
  let base = 75000;

  if (/DEATH/.test(caseType)) base = 250000;
  else if (/INJURY/.test(caseType)) base = 120000;

  const severityMultiplier = 1 + (maluliyetRate || 0);
  const faultMultiplier = 1 + (1 - faultRate) * 0.3;

  return {
    suggested: roundMoney(base * severityMultiplier * faultMultiplier),
    note: "Manevi tazminat kalemi mahkeme takdirine tabidir; bu değer yalnızca sistem önerisidir."
  };
}

function buildRiskAnalysis(missingDocuments, faultConfidence, maluliyetConfidence) {
  let score = 0.8;
  score -= Math.min(0.4, missingDocuments.length * 0.08);
  score -= (1 - faultConfidence) * 0.1;
  score -= (1 - maluliyetConfidence) * 0.1;

  const normalized = clamp(score, 0.15, 0.95);

  let level = "HIGH";
  if (normalized < 0.75) level = "MEDIUM";
  if (normalized < 0.5) level = "LOW";

  return {
    fileStrengthScore: Number(normalized.toFixed(2)),
    fileStrengthLevel: level
  };
}

function buildProfessionalSummary(result) {
  const parts = [];

  parts.push(`Belge türü: ${result.documentType}`);
  parts.push(`Dosya tipi: ${result.caseType}`);
  const victimFaultPct = Math.round((result.faultAssessment.estimatedFaultRate || 0) * 100);
  if (result.faultAssessment.employerFaultRate !== null && result.faultAssessment.employerFaultRate !== undefined) {
    const employerFaultPct = Math.round(result.faultAssessment.employerFaultRate * 100);
    parts.push(`İşçi (mağdur) kusur oranı: %${victimFaultPct} / İşveren kusur oranı: %${employerFaultPct}`);
  } else {
    parts.push(`Tahmini mağdur kusur oranı: %${victimFaultPct}`);
  }
  parts.push(
    result.maluliyetEstimate.rate === null
      ? "Maluliyet oranı belge içinde net tespit edilemedi."
      : `Tahmini maluliyet oranı: %${Math.round(result.maluliyetEstimate.rate * 100)}`
  );
  parts.push(`Brüt hesaplanan maddi zarar: ${result.compensation.grossMaterialCompensation} TL`);
  parts.push(`Kusur sonrası net maddi zarar: ${result.compensation.netMaterialCompensation} TL`);
  parts.push(`Önerilen manevi tazminat: ${result.compensation.moralDamages.suggested} TL`);

  if (result.missingDocuments.length) {
    parts.push(`Eksik kritik belgeler: ${result.missingDocuments.join(", ")}`);
  }

  return parts.join(" ");
}

function calculateCompensationEngine(input) {
  const lead = input?.lead || {};
  const text = normalizeText(input?.text || input?.documentText || "");
  const config = {
    discountRate: 0.10,
    passiveIncomeRatio: 0.30,
    supportShare: 0.70,
    currency: "TRY"
  };

  const documentType = detectDocumentType(text);
  const caseType = detectCaseType(text);
  const age = extractAge(text, lead);
  const gender = extractGender(text, lead);
  const monthlyIncome = extractMonthlyIncome(text, lead);
  const maluliyetEstimate = extractMaluliyetRate(text);
  const fault = estimateFaultRate(text, documentType);
  const damageItems = detectDamageItems(text, caseType);
  const actuarial = calculateActuarialCore(age, monthlyIncome, maluliyetEstimate.rate || 0.10, config);
  const treatmentExpenses = estimateTreatmentExpenses(text);
  const vehicleDamage = estimateVehicleDamage(text);
  const vehicleValueLoss = estimateVehicleValueLoss(text);
  const deathSupportCompensation = /DEATH/.test(caseType)
    ? estimateDeathSupportCompensation(monthlyIncome, config)
    : 0;

  const grossMaterialCompensation =
    actuarial.totalLoss +
    treatmentExpenses +
    vehicleDamage +
    vehicleValueLoss +
    deathSupportCompensation;

  const netMaterialCompensation = roundMoney(grossMaterialCompensation * (1 - fault.rate));
  const moralDamages = estimateMoralDamages(caseType, maluliyetEstimate.rate || 0.10, fault.rate);
  const missingDocuments = estimateMissingDocuments(text, documentType, caseType, damageItems);
  const risk = buildRiskAnalysis(missingDocuments, fault.confidence, maluliyetEstimate.confidence);

  const result = {
    version: "v10-isolated",
    documentType,
    caseType,
    extractedEntities: {
      age,
      gender,
      monthlyIncome,
      currency: config.currency
    },
    faultAssessment: {
      estimatedFaultRate: fault.rate,
      employerFaultRate: fault.employerFault,
      source: fault.source,
      confidence: fault.confidence
    },
    maluliyetEstimate,
    damageItems,
    actuarial,
    compensation: {
      grossMaterialCompensation: roundMoney(grossMaterialCompensation),
      netMaterialCompensation,
      treatmentExpenses,
      vehicleDamage,
      vehicleValueLoss,
      deathSupportCompensation,
      moralDamages,
      estimatedCompensationRange: {
        min: roundMoney(netMaterialCompensation * 0.85),
        max: roundMoney(netMaterialCompensation * 1.20)
      },
      currency: config.currency
    },
    missingDocuments,
    legalRisk: risk,
    professionalSummary: "",
    metadata: {
      isolated: true,
      engineVersion: "v10-isolated",
      discountRate: config.discountRate,
      passiveIncomeRatio: config.passiveIncomeRatio,
      supportShare: config.supportShare
    }
  };

  result.professionalSummary = buildProfessionalSummary(result);
  return result;
}

function safeTest() {
  return {
    status: "engine-ready",
    version: "v10-isolated"
  };
}

module.exports = {
  safeTest,
  calculateCompensationEngine
};
