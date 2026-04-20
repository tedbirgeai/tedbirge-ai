const rateLimit = require("express-rate-limit");

// Login ve OTP istekleri icin siki limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dk
  max: 20,                   // IP basina 20 istek
  message: { success: false, message: "Cok fazla deneme. 15 dakika sonra tekrar deneyin." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Kayit istekleri icin orta limit
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 10,                   // IP basina 10 kayit
  message: { success: false, message: "Cok fazla kayit denemesi. 1 saat sonra tekrar deneyin." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Sifre sifirlama ve email verify icin limit
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 5,
  message: { success: false, message: "Cok fazla sifre sifirlama istegi. 1 saat sonra tekrar deneyin." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, registerLimiter, passwordResetLimiter };
