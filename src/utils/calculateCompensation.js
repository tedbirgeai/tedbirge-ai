const { calculateCompensationEngine } = require("../services/compensation.engine");

function calculateCompensation(input = {}) {
  const result = calculateCompensationEngine({ text: "", lead: input });
  return {
    netEstimate: result.compensation.netMaterialCompensation || 0,
    ...result.compensation
  };
}

module.exports = { calculateCompensation };
