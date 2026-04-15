const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const env = require("../config/env");

module.exports = async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const tokenFromHeader = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const token = tokenFromHeader || req.query?.token || null;

    if (!token) {
      return res.status(401).json({ success: false, message: "Yetkisiz erisim" });
    }

    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "Gecersiz kullanici" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Token dogrulanamadi" });
  }
};

