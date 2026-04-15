"use strict";

const Anthropic = require("@anthropic-ai/sdk");
const { calculateCompensationEngine } = require("./compensation.engine");
const analysisConfig = require("../config/analysis.config");

const MODEL = "claude-sonnet-4-6";

function isMockMode() {
  return analysisConfig.analysisMode === "mock";
}

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY environment variable is required");
  return new Anthropic.default({ apiKey });
}

/**
 * Belge metnini analiz ederek türünü ve temel bulgularını tespit eder.
 * @param {string} text - OCR veya ham belge metni
 * @returns {Promise<{type: string, subType: string, confidence: number, summary: string, keyFindings: string[]}>}
 */
async function interpretResponse(text) {
  if (!text || text.trim().length < 10) {
    return { type: null, subType: null, confidence: 0, summary: "", keyFindings: [] };
  }

  if (isMockMode()) {
    return {
      type: "OTHER",
      subType: "diğer",
      confidence: 0.5,
      summary: "[MOCK] Belge analizi tamamlandı.",
      keyFindings: ["[MOCK] Örnek bulgu"]
    };
  }

  const client = getClient();

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `Sen Türkiye hukuk sistemi uzmanı bir yapay zekasın. Verilen belge metnini analiz edip türünü tespit et.

Yalnızca geçerli JSON formatında yanıt ver (başka metin ekleme):
{
  "type": "<ACCIDENT_REPORT | HOSPITAL_REPORT | IDENTITY | INSURANCE | SGK_REPORT | OTHER>",
  "subType": "<trafik_kazası | iş_kazası | maluliyet_raporu | veraset | diğer>",
  "confidence": 0.0-1.0,
  "summary": "Türkçe kısa özet, 1-2 cümle",
  "keyFindings": ["bulgu1", "bulgu2"]
}`,
    messages: [
      {
        role: "user",
        content: `Şu belgeyi analiz et:\n\n${text.slice(0, 6000)}`
      }
    ]
  });

  const raw = (message.content[0]?.text || "").trim();

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { type: "OTHER", subType: "diğer", confidence: 0.3, summary: raw, keyFindings: [] };
  } catch {
    return { type: "OTHER", subType: "diğer", confidence: 0.3, summary: raw, keyFindings: [] };
  }
}

/**
 * Lead bilgilerine göre belirtilen türde profesyonel dilekçe üretir.
 * @param {object} lead - Prisma Lead modeli
 * @param {string} type - Dilekçe türü
 * @param {Array} [documents] - Lead'e ait belgeler (parsedText içeren)
 * @returns {Promise<string>} Üretilen dilekçe metni
 */
async function generatePetition(lead, type, documents = []) {
  if (isMockMode()) {
    return `[MOCK DİLEKÇE - ${type || "GENEL"}]\n\nMüvekkil: ${lead?.customerName || "Belirtilmemiş"}\nBu dilekçe MOCK modunda üretilmiştir. Gerçek analiz için ANALYSIS_MODE=real olarak ayarlayın.`;
  }

  const client = getClient();

  const petitionTypeMap = {
    DEMAND_LETTER:         "Sigorta şirketine ihtarname / tazminat talep yazısı",
    COURT_PETITION:        "Asliye Hukuk Mahkemesine dava dilekçesi",
    INSURANCE_CLAIM:       "Sigorta tazminat başvuru dilekçesi",
    INJURY_CLAIM:          "Bedensel zarar (maluliyet) tazminat talebi dilekçesi",
    DEATH_CLAIM:           "Destekten yoksun kalma tazminat dilekçesi",
    VEHICLE_CLAIM:         "Araç hasar / değer kaybı tazminat talebi",
    INSURANCE_OBJECTION:   "Sigorta şirketi ret kararına itiraz dilekçesi",
    CIVIL_COURT:           "Asliye Hukuk Mahkemesine maddi-manevi tazminat dava dilekçesi",
    LABOR_COURT:           "İş Mahkemesine iş kazası tazminat dava dilekçesi",
    SGK_OBJECTION:         "SGK rücu talebine itiraz dilekçesi",
    SIGORTA_IHTARNAME:     "Sigorta şirketine resmi ihtarname",
    SIGORTA_ITIRAZ:        "Sigorta şirketi ret kararına itiraz dilekçesi",
    ASLIYE_HUKUK:          "Asliye Hukuk Mahkemesine dava dilekçesi (HMK m.119)",
    IS_MAHKEMESI:          "İş Mahkemesine iş kazası tazminat dava dilekçesi",
    BILIRKISI_ITIRAZ:      "Bilirkişi raporuna itiraz dilekçesi",
  };

  const petitionLabel = petitionTypeMap[type] || type;

  // Belge metinlerini birleştir (max 8000 karakter)
  const docTexts = documents
    .filter((d) => d.parsedText && d.parsedText.trim().length > 10)
    .map((d, i) => `--- Belge ${i + 1} (${d.type || "OTHER"}) ---\n${d.parsedText.slice(0, 2000)}`)
    .join("\n\n");

  // Belgelerden çıkarılan bilgiler
  const extractedFromDocs = docTexts
    ? `\n\nBELGELERDEN ÇIKARILAN BİLGİLER:\n${docTexts.slice(0, 8000)}`
    : "";

  const leadContext = [
    `Müvekkil adı      : ${lead.customerName || "Belirtilmemiş"}`,
    `Telefon           : ${lead.customerPhone || "-"}`,
    `E-posta           : ${lead.customerEmail || "-"}`,
    `Kaza tarihi       : ${lead.accidentDate ? new Date(lead.accidentDate).toLocaleDateString("tr-TR") : "Belirtilmemiş"}`,
    `Kaza yeri         : ${lead.city || "Belirtilmemiş"}`,
    `Kaza türü         : ${lead.accidentType || "Belirtilmemiş"}`,
    `Yaralanma şiddeti : ${lead.injurySeverity || "Belirtilmemiş"}`,
    `Kaza özeti        : ${lead.accidentSummary || "Belirtilmemiş"}`,
    `Yaş               : ${lead.age ?? "Belirtilmemiş"}`,
    `Aylık net gelir   : ${lead.monthlyIncome != null ? `${lead.monthlyIncome} TL` : "Belirtilmemiş"}`,
    `Maluliyet oranı   : ${lead.maluliyetRate != null ? `%${(lead.maluliyetRate * 100).toFixed(0)}` : "Belirtilmemiş"}`,
    `Kusur oranı       : ${lead.faultRate != null ? `%${(lead.faultRate * 100).toFixed(0)}` : "Belirtilmemiş"}`,
    `Tahmini tazminat  : ${lead.estimatedCompensation != null ? `${lead.estimatedCompensation} TL` : "Belirsiz"}`,
    `Satış notu        : ${lead.salesNote || "-"}`,
  ].join("\n");

  // Dilekçe türüne göre özel prompt
  let typeSpecificPrompt = "";

  if (type === "SIGORTA_IHTARNAME" || type === "DEMAND_LETTER") {
    const sigortaSirketi = _extractFromDocs(docTexts, /sigorta\s+şirket[i\s:]+([A-ZÇĞİÖŞÜa-zçğışöüa-z\s]+)/i) || "[SİGORTA ŞİRKETİ]";
    const policeNo = _extractFromDocs(docTexts, /poli[çc]e\s*no[:.]\s*([A-Z0-9\-]+)/i) || "[POLİÇE NO]";
    typeSpecificPrompt = `
Sigorta şirketine resmi ihtarname yaz. Format:
- İhtarname başlığı, tarih, sigorta şirketine hitap
- Kaza özeti (tarih, yer, plaka varsa)
- Talep tutarı ve yasal dayanak (KTK m.85, BK m.49)
- Ödeme süresi: 30 gün
- Banka/hesap bilgisi alanı
- Avukat imzası alanı
Sigorta: ${sigortaSirketi}, Poliçe: ${policeNo}`;
  } else if (type === "SIGORTA_ITIRAZ" || type === "INSURANCE_OBJECTION") {
    typeSpecificPrompt = `
Sigorta şirketinin ret yazısını esas alarak itiraz dilekçesi yaz.
KTK, TBK ve güncel Yargıtay içtihatlarını kullanarak her ret gerekçeye ayrı itiraz paragrafı yaz.
2026 ZMSS limitleri: Ölüm 1.540.000 TL, Sakatlık 924.000 TL.`;
  } else if (type === "ASLIYE_HUKUK" || type === "CIVIL_COURT" || type === "COURT_PETITION") {
    typeSpecificPrompt = `
HMK m.119 gerekliliklerine göre tam dava dilekçesi yaz:
- Mahkeme, Davacı (müvekkil), Davalı (sigorta/karşı taraf)
- Dava değeri: tahmini tazminat
- Maddi vakıalar (kaza özeti)
- Hukuki sebepler: KTK m.85, BK m.49, m.51, m.56
- Deliller: belgeler listesi
- İstem: Maddi tazminat + Manevi tazminat ayrı ayrı`;
  } else if (type === "IS_MAHKEMESI" || type === "LABOR_COURT") {
    typeSpecificPrompt = `
İş Mahkemesine iş kazası tazminat dava dilekçesi yaz.
Hukuki dayanak: İSK m.77, BK m.332, SGK 5510.
Maluliyet oranı, SGK bildirimi, işveren ihmalini vurgula.
SGK 2026 prime esas kazanç tavanı: 270.300 TL/ay.`;
  } else if (type === "BILIRKISI_ITIRAZ") {
    typeSpecificPrompt = `
Bilirkişi raporuna itiraz dilekçesi yaz.
İtiraz edilecek noktalar: hesaplama hataları, eksik değerlemeler, yanlış PMF çarpanı.
Müvekkil lehine alternatif hesaplama öner.`;
  }

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    system: `Sen Türk hukuku alanında uzman, trafik kazası ve iş kazası tazminat davalarına odaklanan deneyimli bir hukuk bürosu asistanısın.
Türk hukuku (Borçlar Kanunu, KTK, TTK, SGK mevzuatı) standartlarına uygun, profesyonel ve resmi dilekçeler hazırlarsın.
Dilekçe yapısı: Başlık → Tarih → İlgili Makam → Taraflar → Açıklama bölümü → Hukuki dayanak maddeleri → Talep → Saygılar
Gerçek madde numaralarını kullan (BK m.49, KTK m.85 gibi). Eksik bilgi varsa "[...bilgi...]" şeklinde yer tutucu bırak.

Güncel 2026 hukuki limitleri ve referansları:
- ZMSS (Zorunlu Mali Sorumluluk Sigortası) ölüm tazminat limiti: 1.540.000 TL
- ZMSS sakatlık tazminat limiti: 924.000 TL
- SGK 2026 prime esas kazanç tavanı: 270.300 TL/ay
- Trafik kazası zamanaşımı: 2 yıl (TBK m.72 / KTK m.109)
- İş kazası zamanaşımı: 10 yıl (BK m.146)
- İşveren sorumluluğu: İSK m.77, BK m.332
- Sigorta itiraz süresi: poliçe red tebliğinden 2 yıl
- Yargıtay 17. HD: trafik kazalarında tam kusur tespiti gerekir
- Yargıtay 21. HD: iş kazasında SGK rücu alacağı TBK m.49 kapsamında`,
    messages: [
      {
        role: "user",
        content: `Aşağıdaki müvekkil bilgileri için "${petitionLabel}" hazırla:\n\n${leadContext}${extractedFromDocs}${typeSpecificPrompt ? `\n\nÖZEL TALİMATLAR:\n${typeSpecificPrompt}` : ""}`
      }
    ]
  });

  return message.content[0]?.text || "";
}

// Yardımcı: belge metninden regex ile değer çıkar
function _extractFromDocs(text, regex) {
  if (!text) return null;
  const m = text.match(regex);
  return m ? m[1].trim() : null;
}

/**
 * OCR metnini compensation engine ile birleştirerek kapsamlı hukuki analiz üretir.
 * @param {string} text - Belgeden çıkarılan ham metin
 * @param {object} [lead={}] - İsteğe bağlı lead verisi (yaş, gelir, kusur oranı)
 * @returns {Promise<object>} Compensation engine sonuçları + Claude'un hukuki analizi
 */
async function analyzeDocument(text, lead = {}) {
  if (!text || text.trim().length < 20) {
    return {
      error: "Analiz için yeterli metin bulunamadı",
      compensationResult: null,
      aiAnalysis: null
    };
  }

  // 1. Deterministic compensation engine (senkron) — her modda çalışır
  const engineResult = calculateCompensationEngine({ text, lead });

  if (isMockMode()) {
    return {
      ...engineResult,
      aiAnalysis: "[MOCK] Hukuki değerlendirme: Bu sonuç MOCK modunda üretilmiştir. Gerçek analiz için ANALYSIS_MODE=real olarak ayarlayın.",
      compensationResult: JSON.stringify(engineResult.compensation)
    };
  }

  // 2. Claude ile zenginleştirilmiş hukuki değerlendirme
  const client = getClient();

  const engineSummary = [
    `Dosya tipi             : ${engineResult.caseType}`,
    `Belge türü             : ${engineResult.documentType}`,
    `Yaş                    : ${engineResult.extractedEntities.age}`,
    `Aylık gelir            : ${engineResult.extractedEntities.monthlyIncome} TL`,
    `Tahmini kusur          : %${Math.round((engineResult.faultAssessment.estimatedFaultRate || 0) * 100)} (güven: ${engineResult.faultAssessment.confidence})`,
    `Maluliyet              : ${engineResult.maluliyetEstimate.rate != null ? `%${Math.round(engineResult.maluliyetEstimate.rate * 100)}` : "tespit edilemedi"} (güven: ${engineResult.maluliyetEstimate.confidence})`,
    `Brüt maddi zarar       : ${engineResult.compensation.grossMaterialCompensation} TL`,
    `Net maddi zarar        : ${engineResult.compensation.netMaterialCompensation} TL`,
    `Tedavi giderleri       : ${engineResult.compensation.treatmentExpenses} TL`,
    `Araç hasarı            : ${engineResult.compensation.vehicleDamage} TL`,
    `Manevi tazminat önerisi: ${engineResult.compensation.moralDamages.suggested} TL`,
    `Tazminat aralığı       : ${engineResult.compensation.estimatedCompensationRange.min} – ${engineResult.compensation.estimatedCompensationRange.max} TL`,
    `Eksik belgeler         : ${engineResult.missingDocuments.length ? engineResult.missingDocuments.join(", ") : "tespit edilmedi"}`,
    `Dosya güç skoru        : ${engineResult.legalRisk.fileStrengthScore} (${engineResult.legalRisk.fileStrengthLevel})`,
  ].join("\n");

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `Sen Türk hukuku ve tazminat davalarında (BK, KTK, SGK) uzman bir yapay zekasın.
Sana bir belge metni ve otomatik ön analiz sonuçları verilecek.
Görevin: ön analizi değerlendir, hesaplamadaki zayıf/eksik noktaları belirt ve müvekkil lehine hukuki strateji öner.
Yanıtını maddeler halinde, Türkçe ve profesyonel bir hukuk diliyle yaz.`,
    messages: [
      {
        role: "user",
        content: `Belge metni (ilk 4000 karakter):\n${text.slice(0, 4000)}\n\n---\nOtomatik analiz sonuçları:\n${engineSummary}\n\nBu dosyayı hukuki açıdan değerlendir ve dava stratejisi öner.`
      }
    ]
  });

  const aiAnalysis = message.content[0]?.text || "";

  return {
    ...engineResult,
    aiAnalysis,
    compensationResult: JSON.stringify(engineResult.compensation)
  };
}

module.exports = { interpretResponse, generatePetition, analyzeDocument };
