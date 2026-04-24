const express = require('express');
const { authenticate } = require('../middlewares/auth');
const router = express.Router();
const prisma = require('../config/db');

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'ADMIN yetkisi gerekli' });
  }
  next();
}

const MODULES = [
  'pulse', 'backup', 'recovery', 'costGuard', 'compliance',
  'security', 'maintenance', 'ai', 'analyzer', 'notifications',
  'performance', 'deploy', 'uyapControl', 'insurance', 'navigation', 'appearance'
];

router.get('/status', authenticate, requireAdmin, async (req, res) => {
  const status = {};
  for (const name of MODULES) {
    try {
      const mod = require('../os/modules/' + name);
      status[name] = typeof mod.getStatus === 'function' ? mod.getStatus() : { error: 'getStatus not found' };
    } catch (err) {
      status[name] = { error: err.message };
    }
  }
  res.json({ success: true, modules: status, timestamp: new Date().toISOString() });
});

router.get('/boot-records', authenticate, requireAdmin, async (req, res) => {
  try {
    const records = await prisma.bootRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/events', authenticate, requireAdmin, async (req, res) => {
  try {
    const events = await prisma.systemEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
