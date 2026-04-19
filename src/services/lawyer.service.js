const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");

async function listLawyers() {
  return prisma.user.findMany({
    where: { role: "LAWYER", isActive: true },
    orderBy: { fullName: "asc" }
  });
}

async function createLawyer({ fullName, email, password, phone }) {
  if (!fullName || !email || !password) {
    throw new ApiError(400, "fullName, email ve password zorunludur");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "Bu e-posta zaten kayitli");

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { fullName, email, phone: phone || null, passwordHash, role: "LAWYER" }
  });

  return user;
}

module.exports = { listLawyers, createLawyer };
