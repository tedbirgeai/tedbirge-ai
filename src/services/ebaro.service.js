"use strict";

/**
 * TUR #103 — e-baro Doğrulama Adapter (Madde 38)
 *
 * Mevcut: MANUEL doğrulama (ADMIN panel + e-baro.org.tr web link)
 * Gelecek: Resmi TBB API entegrasyonu (TUR #110+ adayı)
 *
 * Madde 25 — Yasal Risk Yönetimi
 * Madde 14.3 — TBB sayfası kapanırsa manuel link sabit kalır
 */

const prisma = require("../config/db");

const EBARO_BASE_URL = "https://www.e-baro.org.tr";

/**
 * e-baro.org.tr avukat sorgu URL'i (manuel doğrulama için yeni sekmede açılır).
 * Format değişikliği olursa bu fonksiyon güncellenir; UI dokunulmaz.
 */
function buildLookupUrl(baroSicilNo, baroId = null) {
  if (!baroSicilNo) return EBARO_BASE_URL;
  const params = new URLSearchParams({ sicilNo: String(baroSicilNo) });
  if (baroId) params.set("baroId", String(baroId));
  return `${EBARO_BASE_URL}/avukat-sorgu?${params.toString()}`;
}

function validateSicilFormat(sicilNo) {
  if (!sicilNo) return { valid: false, reason: "BOS", hint: "Baro sicil no zorunlu" };
  const trimmed = String(sicilNo).trim();
  if (!/^\d{1,6}$/.test(trimmed)) {
    return { valid: false, reason: "FORMAT", hint: "1-6 haneli sayı (örn: 12345)" };
  }
  return { valid: true, normalized: trimmed };
}

/**
 * ADMIN manuel doğrulama — kim ne zaman doğruladı log altyapısı (KVKK m.10)
 */
async function manualVerify(userId, adminId, notes = "") {
  if (!userId || !adminId) {
    throw new Error("userId ve adminId zorunlu");
  }
  return await prisma.user.update({
    where: { id: userId },
    data: {
      ebaroVerifiedAt: new Date(),
      ebaroVerifiedBy: adminId,
      ebaroVerifyMethod: "MANUAL",
      ebaroVerifyNotes: notes || null,
      // Eğer baroOnayDurumu hala BEKLEMEDE ise ONAYLANDI'ya geç
      ...(notes !== "REVOKE" && { baroOnayDurumu: "ONAYLANDI" }),
    },
    select: {
      id: true,
      ebaroVerifiedAt: true,
      ebaroVerifiedBy: true,
      ebaroVerifyMethod: true,
      ebaroVerifyNotes: true,
      baroOnayDurumu: true,
    },
  });
}

async function revokeVerification(userId, adminId, reason) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      ebaroVerifiedAt: null,
      ebaroVerifiedBy: null,
      ebaroVerifyMethod: null,
      ebaroVerifyNotes: `İPTAL (${adminId}): ${reason || "Belirtilmemiş"}`,
    },
  });
}

/**
 * Gelecek API entegrasyonu placeholder (TUR #110+ — TBB resmi API onayı sonrası).
 */
async function apiVerify(_baroSicilNo, _baroId) {
  throw new Error("EBARO_API_NOT_AVAILABLE — TBB resmi API onayı bekleniyor (Madde 38)");
}

module.exports = {
  buildLookupUrl,
  validateSicilFormat,
  manualVerify,
  revokeVerification,
  apiVerify,
};
