function clean(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function collectText(input = {}) {
  return Object.values(input).filter(Boolean).join(" ").toLowerCase();
}

function detectCaseType(input = {}) {
  const text = collectText(input);

  if (/vefat|olum|ölüm|miras|veraset|destekten yoksun/.test(text)) return "vefat";
  if (/deger kaybi|değer kaybı|arac|araç|hasar|eksper|tramer|ruhsat/.test(text)) return "arac";
  return "yaralanma";
}

function detectSignerType(caseType, input = {}) {
  const explicit = clean(input.signerType).toLowerCase();
  if (explicit) return explicit;

  if (caseType === "vefat") return "mirasci";
  if (caseType === "arac") return "arac_sahibi";
  return "yarali";
}

function detectProcessType(input = {}) {
  const raw = clean(input.processType || input.documentType, "noter").toLowerCase();
  if (raw === "e-devlet" || raw === "edevlet") return "edevlet";
  return "noter";
}

function decide(input = {}) {
  const caseType = detectCaseType(input);
  const signerType = detectSignerType(caseType, input);
  const processType = detectProcessType(input);

  return {
    caseType,
    signerType,
    processType,
    documentType: processType
  };
}

module.exports = {
  decide,
  detectCaseType,
  detectSignerType,
  detectProcessType
};
