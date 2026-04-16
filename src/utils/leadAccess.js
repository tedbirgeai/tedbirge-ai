"use strict";

/**
 * Merkezi lead erişim kontrolü.
 *
 * Roller:
 *   ADMIN / SALES       → tüm lead'lere tam erişim
 *   LAWYER              → yalnızca Assignment tablosunda ACTIVE kaydı olan lead'ler
 *   REPRESENTATIVE      → yalnızca createdById === user.id olan lead'ler
 *   CUSTOMER            → yalnızca ownerId === user.id olan lead'ler
 */

const prisma = require("../config/db");
const ApiError = require("./ApiError");

const FULL_ACCESS_ROLES = ["ADMIN", "SALES"];

/**
 * Verilen kullanıcının bu lead'e erişim yetkisi olup olmadığını doğrular.
 * Erişim yoksa ApiError(403) fırlatır.
 *
 * @param {object} user  — req.user (id, role zorunlu)
 * @param {object} lead  — prisma lead nesnesi; assignments[] include edilmişse yeniden sorgulanmaz
 */
async function assertLeadAccess(user, lead) {
  if (!user) throw new ApiError(401, "Kimlik doğrulama gerekli");
  if (!lead) throw new ApiError(404, "Lead bulunamadı");

  const { role, id: userId } = user;

  // ADMIN ve SALES her şeye erişebilir
  if (FULL_ACCESS_ROLES.includes(role)) return;

  if (role === "LAWYER") {
    // Lead nesnesinde assignments[] varsa kullan; yoksa DB'ye sor
    const assignments = lead.assignments
      ? lead.assignments
      : await prisma.assignment.findMany({
          where: { leadId: lead.id, lawyerId: userId, status: "ACTIVE" },
        });

    const isAssigned = assignments.some(
      (a) => a.lawyerId === userId && a.status === "ACTIVE"
    );
    if (!isAssigned) throw new ApiError(403, "Bu dosyaya erişim yetkiniz yok");
    return;
  }

  if (role === "REPRESENTATIVE") {
    if (lead.createdById !== userId) {
      throw new ApiError(403, "Bu dosyaya erişim yetkiniz yok");
    }
    return;
  }

  if (role === "CUSTOMER") {
    if (lead.ownerId !== userId) {
      throw new ApiError(403, "Bu dosyaya erişim yetkiniz yok");
    }
    return;
  }

  // Bilinmeyen rol — eriş
  throw new ApiError(403, "Bu dosyaya erişim yetkiniz yok");
}

/**
 * Prisma `where` clause'una eklenmek üzere rol bazlı filtre döner.
 * `listLeads` gibi toplu sorgularda kullanılır.
 *
 * @param {object} user — req.user
 * @returns {object}    — Prisma where fragment
 */
function leadWhereByRole(user) {
  if (!user) return { id: "__NOACCESS__" };

  const { role, id: userId } = user;

  if (FULL_ACCESS_ROLES.includes(role)) return {};

  if (role === "LAWYER") {
    return {
      assignments: { some: { lawyerId: userId, status: "ACTIVE" } },
    };
  }

  if (role === "REPRESENTATIVE") {
    return { createdById: userId };
  }

  if (role === "CUSTOMER") {
    return { ownerId: userId };
  }

  // Bilinmeyen rol — hiçbir lead döndürme
  return { id: "__NOACCESS__" };
}

module.exports = { assertLeadAccess, leadWhereByRole };
