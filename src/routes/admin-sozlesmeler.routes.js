// TUR #114 — Admin Sozlesme Gorunurluk (Emine CELIK saha bulgusu)
// Madde 30.68 + 25.3 KVKK m.10 audit gorulebilirlik

"use strict";

const express = require("express");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const prisma = require("../config/db");

const router = express.Router();

// GET /api/admin/sozlesmeler
// Query: ?role=REPRESENTATIVE&page=1&limit=20&search=Emine&from=2026-05-01&to=2026-05-31
router.get(
  "/admin/sozlesmeler",
  auth,
  role("ADMIN"),
  asyncHandler(async (req, res) => {
    const roleFilter = req.query.role ? String(req.query.role).toUpperCase() : null;
    const search = req.query.search ? String(req.query.search).trim() : null;
    const fromDate = req.query.from ? new Date(String(req.query.from)) : null;
    const toDate = req.query.to ? new Date(String(req.query.to)) : null;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    // Imzalanmis sozlesmeler: platformAgreementAcceptedAt veya sozlesmeKabulTarihi dolu
    const where = {
      OR: [
        { platformAgreementAcceptedAt: { not: null } },
        { sozlesmeKabulTarihi: { not: null } },
      ],
    };
    if (roleFilter) where.role = roleFilter;
    if (search) {
      where.AND = (where.AND || []).concat({
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ],
      });
    }
    if (fromDate || toDate) {
      const dateRange = {};
      if (fromDate && !isNaN(fromDate.getTime())) dateRange.gte = fromDate;
      if (toDate && !isNaN(toDate.getTime())) dateRange.lte = toDate;
      if (Object.keys(dateRange).length) {
        where.AND = (where.AND || []).concat({
          OR: [
            { platformAgreementAcceptedAt: dateRange },
            { sozlesmeKabulTarihi: dateRange },
          ],
        });
      }
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          platformAgreementAcceptedAt: true,
          platformAgreementVersion: true,
          kvkkAcceptedAt: true,
          kvkkVersion: true,
          sozlesmeKabulTarihi: true,
          sozlesmeKabulIp: true,
          sozlesmeVersiyonu: true,
          createdAt: true,
        },
        orderBy: [
          { platformAgreementAcceptedAt: "desc" },
          { sozlesmeKabulTarihi: "desc" },
        ],
        skip: offset,
        take: limit,
      }),
    ]);

    // KVKK m.10 audit (sorgu izi)
    try {
      await prisma.activityLog.create({
        data: {
          action: "ADMIN_CONTRACTS_LIST_VIEW",
          detail: `adminId:${req.user.id} role:${roleFilter || "ALL"} count:${users.length} total:${total}`,
        },
      });
    } catch (_) {}

    res.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone ? `${u.phone.slice(0, 4)}***${u.phone.slice(-2)}` : null,
        phoneFull: u.phone, // ADMIN gormeli (audit yetkilisi)
        role: u.role,
        signedAt: u.platformAgreementAcceptedAt || u.sozlesmeKabulTarihi,
        version: u.platformAgreementVersion || u.sozlesmeVersiyonu,
        kvkkAcceptedAt: u.kvkkAcceptedAt,
        kvkkVersion: u.kvkkVersion,
        sozlesmeKabulIp: u.sozlesmeKabulIp,
        createdAt: u.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// GET /api/admin/sozlesmeler/:userId — detay (sozlesme audit zinciri)
router.get(
  "/admin/sozlesmeler/:userId",
  auth,
  role("ADMIN"),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        platformAgreementAcceptedAt: true,
        platformAgreementVersion: true,
        kvkkAcceptedAt: true,
        kvkkVersion: true,
        sozlesmeKabulTarihi: true,
        sozlesmeKabulIp: true,
        sozlesmeVersiyonu: true,
        sozlesmeMetniHash: true,
        createdAt: true,
      },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: "Kullanici bulunamadi" });
    }

    // Audit log zinciri (KVKK m.10)
    const auditLogs = await prisma.activityLog.findMany({
      where: {
        detail: { contains: `userId:${userId}` },
        action: { in: ["REPRESENTATIVE_CONTRACT_OTP_SENT", "REPRESENTATIVE_CONTRACT_SIGNED"] },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => []);

    try {
      await prisma.activityLog.create({
        data: {
          action: "ADMIN_CONTRACT_DETAIL_VIEW",
          detail: `adminId:${req.user.id} targetUserId:${userId}`,
        },
      });
    } catch (_) {}

    res.json({
      success: true,
      data: {
        user,
        auditLogs,
      },
    });
  })
);

module.exports = router;
