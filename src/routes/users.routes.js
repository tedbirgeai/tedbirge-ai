// TUR #84 T2 — Kullanıcı CRUD route'lar (Madde 30.37)
// Mount: src/routes/index.js → router.use("/users", usersRoutes) → /api/users

const express = require("express");
const controller = require("../controllers/users.controller");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

const router = express.Router();

// Tüm endpoint'ler ADMIN guard altında
router.get("/",                auth, role("ADMIN"), controller.listUsers);
router.patch("/:id",           auth, role("ADMIN"), controller.updateUser);
router.patch("/:id/password",  auth, role("ADMIN"), controller.resetUserPasswordByAdmin);
router.patch("/:id/status",    auth, role("ADMIN"), controller.updateUserStatus);
router.patch("/:id/archive",   auth, role("ADMIN"), controller.archiveUser);
router.delete("/:id",          auth, role("ADMIN"), controller.softDeleteUser);

module.exports = router;
