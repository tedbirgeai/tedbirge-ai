function decideNextAction({ branch, responseType }) {
  if (!responseType) return { action: "apply", reason: "ilk_basvuru" };

  if (responseType === "missing_docs")
    return { action: "complete_docs", reason: "eksik" };

  if (responseType === "paid")
    return { action: "close", reason: "odeme" };

  if (responseType === "rejected") {
    if (branch === "traffic") return { action: "appeal" };
    if (branch === "life") return { action: "lawsuit" };
    return { action: "appeal" };
  }

  if (responseType === "low_payment")
    return { action: "tahkim" };

  return { action: "manual_review" };
}

module.exports = { decideNextAction };
