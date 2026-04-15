const prisma = require("../config/db");

async function getDashboardStats() {
  const [totalLeads, newLeads, analyzedLeads, wonLeads, lostLeads, activeLawyers] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.lead.count({ where: { status: "ANALYZED" } }),
    prisma.lead.count({ where: { status: "WON" } }),
    prisma.lead.count({ where: { status: "LOST" } }),
    prisma.user.count({ where: { role: "LAWYER", isActive: true } })
  ]);

  return {
    totalLeads,
    newLeads,
    analyzedLeads,
    wonLeads,
    lostLeads,
    activeLawyers
  };
}

module.exports = { getDashboardStats };
