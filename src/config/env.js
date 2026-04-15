const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

/**
 * Prisma connection pool:
 *   DATABASE_URL should include ?connection_limit=20&pool_timeout=30
 *   e.g. postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=30
 *   This helper appends it automatically if not already present.
 */
function buildDatabaseUrl() {
  const raw = process.env.DATABASE_URL || "";
  if (!raw) return raw;
  if (raw.includes("connection_limit")) return raw;
  const sep = raw.includes("?") ? "&" : "?";
  return `${raw}${sep}connection_limit=20&pool_timeout=30`;
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  appUrl: process.env.APP_URL || "http://localhost:5000",
  jwtSecret: (() => {
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");
    return process.env.JWT_SECRET;
  })(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  uploadDir: process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"),
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 20),
  whatsappDefaultNumber: process.env.WHATSAPP_DEFAULT_NUMBER || "905555555555",
  whatsappToken: process.env.WHATSAPP_TOKEN || "",
  whatsappPhoneId: process.env.WHATSAPP_PHONE_ID || "",
  whatsappApiVersion: process.env.WHATSAPP_API_VERSION || "v19.0",
  whatsappAppSecret: process.env.WHATSAPP_APP_SECRET || "",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  databaseUrl: buildDatabaseUrl(),
};
