const { renderMasterAttorneyContract } = require("../templates/contracts/master-attorney-contract.template");
const { renderMasterNotaryPoa } = require("../templates/poa/master-notary-poa.template");
const { renderEDevletInfo } = require("../templates/info/e-devlet-info.template");
const decisionService = require("./decision.service");

function clean(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return clean(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function detectCaseType(rawCaseType, lead = {}) {
  const text = [
    rawCaseType,
    lead.accidentSummary,
    lead.injurySeverity,
    lead.city,
    lead.customerName
  ].filter(Boolean).join(" ").toLowerCase();

  if (/vefat|ölüm|destekten yoksun|miras/.test(text)) return "vefat";
  if (/yaralanma|yarali|malul|epikriz|hastane|sakat|is goremez/.test(text)) return "yaralanma";
  if (/değer kaybı|araç değer kaybı|hasar|eksper|servis|ruhsat|araç/.test(text)) return "araç";
  return "yaralanma";
}

function getCaseLabels(caseType) {
  if (caseType === "vefat") {
    return {
      case_type: "vefat",
      case_type_label: "Vefatlı Trafik Kazası",
      case_category: "vefatla sonuclanan trafik kazasi / benzeri olay",
      caseSpecificContractBlock: "Bu dosya, ölüm nedeniyle destekten yoksun kalma tazminati, defin gideri, manevi tazminat ve ilgili sigorta / sorumluluk taleplerine ilişkindir.\n\nHak sahipliği değerlendirmesi, mirasçılık belgesi, destek iliskisi, yas/gelir verisi ve aktueryal hesap unsurlari dikkate alinarak yurutulecektir.",
      special_authority_summary: "Veraset ilami, nufus kayitlari, destek durumunu gosteren belgeler, defin ve ölüm evraki, sigorta ve tazminat islemlerine iliskin tum basvuru ve takipleri yurutmeye yetkilidir."
    };
  }

  if (caseType === "araç") {
    return {
      case_type: "araç",
      case_type_label: "Araç Hasarı / Değer Kaybı Dosyası",
      case_category: "araç hasari / değer kaybı nedeniyle dogmus veya dogacak talepler",
      caseSpecificContractBlock: "Bu dosya, araçta meydana gelen maddi hasar, onarim, rayic deger etkisi, ticari kazanc kaybi ve araç değer kaybı taleplerine ilişkindir.\n\nAvukat; eksper raporu, kaza tespit tutanagi, servis/fatura kayitlari, tramer/hasar gecmisi ve kusur orani dogrultusunda gerekli basvuru ve takip islemlerini yurutur.",
      special_authority_summary: "Arac hasari, ekspertiz, servis kayitlari, parca/fatura evraki, tramer ve sigorta dosyasi kayitlarini talep etmeye; değer kaybı ve hasar basvurularini yapmaya ve takip etmeye yetkilidir."
    };
  }

  return {
    case_type: "yaralanma",
    case_type_label: "Yaralanmalı Trafik Kazası",
    case_category: "bedensel zarar, is göremezlik ve baglantili tazminat talepleri",
    caseSpecificContractBlock: "Bu dosya, trafik kazasi / benzeri olay nedeniyle meydana gelen bedensel zarar, gecici veya surekli is göremezlik, tedavi gideri, bakıcı gideri, ekonomik gelecegin sarsilmasi ve manevi tazminat taleplerine ilişkindir.\n\nAvukat; sağlık evrakı, epikriz, maluliyet / engellilik raporu, aktuerya hesabi, kusur durumu ve sigorta teminat kapsami dahil olmak uzere gerekli hukuki ve teknik sureci yurutucektir.",
    special_authority_summary: "Sağlık kuruluşları, SGK, adli makamlar, sigorta sirketleri ve ilgili tum kurumlar nezdinde sağlık verileri, raporlar, epikrizler, is göremezlik ve maluliyet belgeleri ile dosya kapsaminda gerekli tum kayitlari talep etmeye ve almaya yetkilidir."
  };
}

function normalizeProcessType(value) {
  const raw = clean(value, "noter").toLowerCase();
  if (raw === "e-devlet" || raw === "edevlet") return "edevlet";
  return "noter";
}
function resolvePrincipalName(caseType, lead, salesNote) {
  const customerName = clean(lead.customerName || lead.fullName || lead.name, "Muvekkil");
  const signerType = clean(salesNote.signerType, "musteri").toLowerCase();
  const heirList = clean(salesNote.heirList, "");

  const vehicleOwnerName = clean(
    salesNote.vehicleOwnerName ||
    lead.vehicleOwnerName ||
    lead.ownerName ||
    salesNote.ruhsatSahibiName,
    ""
  );

  const operatorName = clean(
    salesNote.vehicleOperatorName ||
    lead.vehicleOperatorName ||
    lead.operatorName ||
    salesNote.isletenName,
    ""
  );

  if (caseType === "vefat") {
    if (heirList) {
      return `${customerName} / Hak Sahipleri: ${heirList}`;
    }
    return customerName;
  }

  if (caseType === "araç") {
    if (signerType === "isleten" && operatorName) return operatorName;

    if (
      (signerType === "ruhsat-sahibi" ||
        signerType === "ruhsat_sahibi" ||
        signerType === "araç-sahibi" ||
        signerType === "araç_sahibi") &&
      vehicleOwnerName
    ) {
      return vehicleOwnerName;
    }

    if (vehicleOwnerName) return vehicleOwnerName;
    if (operatorName) return operatorName;
    return customerName;
  }

  return customerName;
}

function buildCaseSummary(caseType, lead, salesNote, caseMeta) {
  let summary = clean(lead.accidentSummary, "");

  if (!summary) {
    summary = `${caseMeta.case_type_label} kapsaminda belge uretim taslagi.`;
  }

  if (caseType === "vefat") {
    const heirList = clean(salesNote.heirList, "");
    if (heirList) {
      summary += ` Hak sahipleri / mirasçılar: ${heirList}.`;
    } else {
      summary += " Kontrol Notu: Hak sahipliği ve mirasçı listesi netleştirilmelidir.";
    }
  }

  if (caseType === "yaralanma") {
    const injuredName = clean(
      salesNote.injuredPersonName ||
      lead.injuredPersonName ||
      lead.customerName,
      ""
    );

    if (injuredName) {
      summary += ` Yaralı kişi: ${injuredName}.`;
    }
  }

  if (caseType === "araç") {
    const vehicleOwnerType = clean(salesNote.vehicleOwnerType, "");
    const vehicleOwnerName = clean(
      salesNote.vehicleOwnerName ||
      lead.vehicleOwnerName ||
      lead.ownerName ||
      salesNote.ruhsatSahibiName,
      ""
    );
    const operatorName = clean(
      salesNote.vehicleOperatorName ||
      lead.vehicleOperatorName ||
      lead.operatorName ||
      salesNote.isletenName,
      ""
    );

    if (vehicleOwnerType) {
      summary += ` Arac sahibi tipi: ${vehicleOwnerType}.`;
    }

    if (vehicleOwnerName) {
      summary += ` Ruhsat sahibi: ${vehicleOwnerName}.`;
    }

    if (operatorName) {
      summary += ` Isleten: ${operatorName}.`;
    }
  }

  return summary.trim();
}

function buildStructuredDocumentData({ lead, salesNote, lawyer }) {
  lead = lead || {};
  salesNote = salesNote || {};
  lawyer = lawyer || {};

  const decision = decisionService.decide({ ...lead, ...salesNote });
  const caseType = decision.caseType || detectCaseType(salesNote.caseType, lead);
  const caseMeta = getCaseLabels(caseType);
  const processType = normalizeProcessType(salesNote.processType);

  let successFeeRate = Number(salesNote.successFeeRate);
  if (!Number.isFinite(successFeeRate) || successFeeRate <= 0) {
    if (caseType === "vefat") successFeeRate = 15;
    else if (caseType === "araç") successFeeRate = 20;
    else successFeeRate = 20;
  }

  if (successFeeRate > 25) {
    throw new Error("Belge uretimi durduruldu: başarıya bağlı ücret oranı %25 üstünde olamaz.");
  }

  const signerType = clean(salesNote.signerType, "musteri").toLowerCase();
  let principalName = resolvePrincipalName(caseType, lead, salesNote);

  let caseSummary = buildCaseSummary(caseType, lead, salesNote, caseMeta);

  const counterparty = clean(salesNote.counterpartyOrInsurer || salesNote.insurer || salesNote.counterparty, "-");
  const policyNo = clean(salesNote.policyOrClaimNo || salesNote.policyNo || salesNote.claimNo || salesNote.fileNo, "-");

  const fixedFeeAmount = clean(salesNote.fixedFeeAmount, "0");
  const opposingFeeRule = clean(salesNote.opposingFeeRule, "Avukata aittir / mahsup edilir.");
  const netOrGrossRule = clean(salesNote.netOrGrossRule, "net tutar uzerinden yapilir.");
  const expenseBearer = clean(salesNote.expenseBearer, "Muvekkil");
  const paymentMethod = clean(salesNote.paymentMethod, "Banka havalesi / EFT");
  const paymentDays = clean(salesNote.paymentDays, "3");
  const jurisdictionCity = clean(salesNote.jurisdictionCity || lead.city, "Konya");
  const tahsilVeIbraPolicy = clean(salesNote.tahsilVeIbraPolicy, "Yalnızca müvekkilin bilgisi ve gerekli özel yetki kapsamında.");

  if (caseType === "yaralanma" && !clean(salesNote.healthChecklist)) {
    caseSummary += " [Kontrol Notu: Saglik verisi / rapor checklist'i tamamlanmalidir.]";
  }

  if (caseType === "araç" && !clean(salesNote.vehicleOwnerType)) {
    caseSummary += " [Kontrol Notu: Ruhsat sahibi / isleten ayrimi netleştirilmelidir.]";
  }

  const contractDate =
    clean(salesNote.contractDate) ||
    formatDate(lead.createdAt) ||
    formatDate(new Date());

  return {
    contract_date: contractDate,
    client_name: principalName,
    client_identity_no: clean(lead.identityNo || salesNote.clientIdentityNo || salesNote.identityNo),
    client_address: clean(lead.address || salesNote.clientAddress || salesNote.address),
    client_phone: clean(lead.customerPhone || salesNote.clientPhone || salesNote.phone),
    client_email: clean(lead.customerEmail || salesNote.clientEmail || salesNote.email),

    principal_name: principalName,
    principal_identity_no: clean(lead.identityNo || salesNote.clientIdentityNo || salesNote.identityNo),
    principal_address: clean(lead.address || salesNote.clientAddress || salesNote.address),

    lawyer_name: clean(lawyer.name || lawyer.fullName || lawyer.email, "Atanacak Avukat"),
    lawyer_email: clean(lawyer.email || lawyer.mail),
    lawyer_phone: clean(lawyer.phone || lawyer.phoneNumber || lawyer.mobilePhone || lawyer.mobile),
    lawyer_address: clean(lawyer.address || lawyer.officeAddress || lawyer.contactAddress),
    bar_name: clean(lawyer.barName || lawyer.bar || lawyer.barAssociation || lawyer.cityBar),
    bar_number: clean(lawyer.barNumber || lawyer.barNo || lawyer.registrationNumber || lawyer.barRegistrationNo || lawyer.sicilNo),

    case_type: caseMeta.case_type,
    case_type_label: caseMeta.case_type_label,
    case_category: caseMeta.case_category,
    accident_date: formatDate(lead.accidentDate),
    counterparty_or_insurer: counterparty,
    policy_or_claim_no: policyNo,
    case_summary: caseSummary,

    fixed_fee_amount: fixedFeeAmount,
    success_fee_rate: String(successFeeRate),
    opposing_fee_rule: opposingFeeRule,
    net_or_gross_rule: netOrGrossRule,
    expense_bearer: expenseBearer,
    payment_method: paymentMethod,
    payment_days: paymentDays,
    jurisdiction_city: jurisdictionCity,

    special_authority_summary: caseMeta.special_authority_summary,
    tahsil_ve_ibra_policy: tahsilVeIbraPolicy,
    caseSpecificContractBlock: caseMeta.caseSpecificContractBlock,
    process_type: processType
  };
}

function buildDocumentDraftTexts({ lead, salesNote, lawyer }) {
  const data = buildStructuredDocumentData({ lead, salesNote, lawyer });
  const contractText = renderMasterAttorneyContract(data);
  const powerOfAttorneyText = renderMasterNotaryPoa(data);
  const eDevletInfoText = renderEDevletInfo(data);

  return {
    data,
    contractText,
    powerOfAttorneyText,
    eDevletInfoText
  };
}

module.exports = {
  buildStructuredDocumentData,
  buildDocumentDraftTexts
};




