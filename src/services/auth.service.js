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
    sozlesmeVersiyonu, sozlesmeMetniHash, sozlesmeKabulIp,
    // TUR #72.7 — KVKK + Platform Agreement kanit alanlari
    kvkkAcceptedAt, kvkkVersion,
    platformAgreementAcceptedAt, platformAgreementVersion,
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
      ...(sozlesmeVersiyonu && { sozlesmeVersiyonu }),
      ...(sozlesmeMetniHash && { sozlesmeMetniHash }),
      ...(sozlesmeKabulIp   && { sozlesmeKabulIp }),
      // TUR #72.7 — KVKK + Platform Agreement kayit
      ...(kvkkAcceptedAt && { kvkkAcceptedAt }),
      ...(kvkkVersion && { kvkkVersion }),
      ...(platformAgreementAcceptedAt && { platformAgreementAcceptedAt }),
      ...(platformAgreementVersion && { platformAgreementVersion }),
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

  return { user, token };
}

// TUR #72.10 X3 — Rol Türkçe ad helper (frontend hata mesajları için)
function getRoleDisplayName(role) {
  return {
    ADMIN: "Yönetici",
    LAWYER: "Hukukçu",
    REPRESENTATIVE: "Temsilci",
    CUSTOMER: "Müvekkil",
    SALES: "Satış",
  }[role] ?? role;
}

// TUR #72.10 X3 — Sekme rol → User.role beklenen mapping
function expectedRoleForTab(requestedRole) {
  if (!requestedRole) return null;
  const map = {
    yonetici: ["ADMIN", "SALES"],
    hukukcu: ["LAWYER"],
    temsilci: ["REPRESENTATIVE"],
    musteri: ["CUSTOMER"],
    ADMIN: ["ADMIN"],
    LAWYER: ["LAWYER"],
    REPRESENTATIVE: ["REPRESENTATIVE"],
    CUSTOMER: ["CUSTOMER"],
    SALES: ["SALES"],
  };
  return map[requestedRole] || map[requestedRole.toLowerCase()] || null;
}

async function login(email, password, requestedRole) {
  const user = await prisma.user.findUnique({ where: { email }, omit: { passwordHash: false } });
  if (!user) throw new ApiError(401, "Gecersiz kullanici bilgileri");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, "Gecersiz kullanici bilgileri");

  // TUR #72.10 X3 — Rol mismatch kontrolü (KVKK m.12 + güvenlik)
  if (requestedRole) {
    const allowedRoles = expectedRoleForTab(requestedRole);
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      const userRoleTr = getRoleDisplayName(user.role);
      const err = new ApiError(
        403,
        `Yetkisiz işlem: bu hesap '${userRoleTr}' rolüne ait. Lütfen '${userRoleTr}' sekmesinden giriş yapın.`,
      );
      err.correctRole = user.role;
      throw err;
    }
  }

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
