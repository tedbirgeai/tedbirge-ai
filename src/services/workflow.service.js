const { classifyLead } = require("./classifier.service");
const { decideNextAction } = require("./decisionEngine.service");
const { interpretResponse, generatePetition } = require("./ai.service");

async function runWorkflow(lead) {
  const cls = classifyLead(lead.analysis || {});
  lead.branch = cls.branch;
  lead.entity = cls.entity;

  if (lead.lastResponseText) {
    const res = await interpretResponse(lead.lastResponseText);
    lead.lastResponseType = res.type;
  }

  const decision = decideNextAction({
    branch: lead.branch,
    responseType: lead.lastResponseType
  });

  lead.nextAction = decision.action;

  if (decision.action === "apply") {
    lead.applicationText = await generatePetition({ type: "başvuru" });
  }

  if (decision.action === "appeal") {
    lead.appealText = await generatePetition({ type: "itiraz" });
  }

  return lead;
}

module.exports = { runWorkflow };
