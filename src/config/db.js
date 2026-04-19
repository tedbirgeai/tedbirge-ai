const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  log: ["warn", "error"],
  omit: {
    user: {
      passwordHash: true,
      resetToken: true,
      resetTokenExpires: true,
      twoFactorSecret: true,
    },
  },
});
module.exports = prisma;
