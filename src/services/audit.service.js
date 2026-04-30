// TUR #52 — ActivityLog UI servisi (audit log filtreleme)

const prisma = require("../config/db");

async function listLogs({ action, leadId, dateFrom, dateTo, limit = 100, offset = 0 } = {}) {
  const where = {};
  if (action) where.action = { contains: String(action) };
  if (leadId) where.leadId = leadId;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(parseInt(limit) || 100, 200),
      skip: Math.max(parseInt(offset) || 0, 0),
      include: { Lead: { select: { id: true, leadCode: true, customerName: true } } },
    }),
    prisma.activityLog.count({ where }),
  ]);
  return { logs, total };
}

async function getActionTypes() {
  const result = await prisma.activityLog.groupBy({
    by: ["action"],
    _count: true,
    orderBy: { _count: { action: "desc" } },
    take: 50,
  });
  return result.map((r) => ({ action: r.action, count: r._count }));
}

module.exports = {
  listLogs,
  getActionTypes,
};
