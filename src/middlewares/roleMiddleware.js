module.exports = function roleMiddleware(...roles) {
  return function roleCheck(req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Bu islem icin yetkiniz yok" });
    }
    next();
  };
};
