function classifyLead(analysis) {
  let branch = "traffic";
  let entity = "insurance_company";
  let claimTypes = [];

  const text = (analysis?.summary || "").toLowerCase();

  if (text.includes("sigortasız") || text.includes("kaçan")) {
    entity = "guvence_hesabi";
  }

  if (text.includes("yabancı")) {
    entity = "tmtb";
  }

  if (text.includes("tarsim") || text.includes("tarım")) {
    branch = "tarsim";
    entity = "tarsim_pool";
  }

  if (text.includes("hayat")) {
    branch = "life";
  }

  if (text.includes("nakliyat")) {
    branch = "cargo";
  }

  if (text.includes("yaralanma")) claimTypes.push("injury");
  if (text.includes("vefat")) claimTypes.push("death");
  if (text.includes("değer kaybı")) claimTypes.push("value_loss");
  if (text.includes("hasar")) claimTypes.push("damage");

  return { branch, entity, claimTypes };
}

module.exports = { classifyLead };
