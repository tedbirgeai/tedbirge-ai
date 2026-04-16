const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

async function register(data) {
  const {
    fullName, email, password, role = "CUSTOMER", phone,
    baroSicilNo, uzmanlik, hukukcuKomisyon,
    primOrani, bolge,
  } = data;

  if (!fullName || !email || !password) {
    throw new ApiError(400, "fullName, email ve password zorunludur");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, "Bu e-posta zaten kayitli");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      phone: phone || null,
      passwordHash,
      role,
      ...(baroSicilNo   && { baroSicilNo }),
      ...(uzmanlik      && { uzmanlik }),
      ...(hukukcuKomisyon != null && { hukukcuKomisyon: Number(hukukcuKomisyon) }),
      ...(primOrani     != null && { primOrani: Number(primOrani) }),
      ...(bolge         && { bolge }),
      // Onay durumları — kayıt anında BEKLEMEDE
      ...(role === "LAWYER"         && { baroOnayDurumu: "BEKLEMEDE" }),
      ...(role === "REPRESENTATIVE" && { temsilciOnayDurumu: "BEKLEMEDE" }),
    }
  });

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  const { passwordHash: _pw, ...safeUser } = user;
  return { user: safeUser, token };
}

async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(401, "Gecersiz kullanici bilgileri");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, "Gecersiz kullanici bilgileri");

  // Onay durumu kontrolleri
  if (user.role === "LAWYER") {
    if (user.baroOnayDurumu === "BEKLEMEDE") {
      throw new ApiError(403, "Hesabınız henüz yönetici onayını bekliyor. Lütfen onay için bekleyin.");
    }
    if (user.baroOnayDurumu === "REDDEDILDI") {
      throw new ApiError(403, "Hesabınız reddedildi. Lütfen yönetici ile iletişime geçin.");
    }
  }

  if (user.role === "REPRESENTATIVE") {
    if (user.temsilciOnayDurumu === "BEKLEMEDE") {
      throw new ApiError(403, "Hesabınız henüz yönetici onayını bekliyor. Lütfen onay için bekleyin.");
    }
    if (user.temsilciOnayDurumu === "REDDEDILDI") {
      throw new ApiError(403, "Hesabınız reddedildi. Lütfen yönetici ile iletişime geçin.");
    }
  }

  // Her başarılı girişte sonGirisTarihi güncelle
  await prisma.user.update({
    where: { id: user.id },
    data: { sonGirisTarihi: new Date() },
  }).catch(() => {});

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  const { passwordHash: _pw, ...safeUser } = user;
  return { user: safeUser, token };
}

module.exports = { register, login };
