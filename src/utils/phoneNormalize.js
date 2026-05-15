// TUR #132.1 — Telefon Normalize (Madde 30.61 Tek Kaynak + 30.74 Standart Format)
//
// MH61 emsali: public.route.js duplicate check phone normalize'siz idi.
// Bu helper tek kaynak — backend Lead create, duplicate check, AI merge hepsi ayni mantik.

"use strict";

/**
 * Tum non-digit karakterleri temizler. Bos veya null donerse "" doner.
 * 0212 333 4455 → 02123334455
 * +90 532 123 45 67 → 905321234567
 */
function cleanPhone(phone) {
  if (!phone) return "";
  return String(phone).replace(/\D/g, "");
}

/**
 * Tum yaygin format ihtimallerini tek kanonik 10 hane sona indirir.
 * "0532...10 hane", "+90...", "90...", "532..." → "532..." (10 hane).
 * Iki numaranin AYNI olup olmadigini karsilastirmak icin kullanilir.
 */
function canonicalPhone(phone) {
  const digits = cleanPhone(phone);
  if (!digits) return "";

  // Leading 0 (Turkiye) veya 90 (E.164) at — kanonik 10 hane
  if (digits.length === 12 && digits.startsWith("90")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  if (digits.length === 10) return digits;

  // Standart disi — oldugu gibi don
  return digits;
}

module.exports = { cleanPhone, canonicalPhone };
