// TUR #84 T2 — Kullanıcı CRUD route'lar (Madde 30.37)
// Mount: src/routes/index.js → router.use("/users", usersRoutes) → /api/users

const express = require("express");
const controller = require("../controllers/users.controller");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

const router = express.Router();

// Tüm endpoint'ler ADMIN guard altında
router.get("/",                auth, role("ADMIN"), controller.listUsers);
// TUR #92 Q5 — 2FA adoption widget endpoint (Madde 30.32 R1)
router.get("/two-factor-adoption", auth, role("ADMIN"), controller.twoFactorAdoption);
router.post("/:id/send-2fa-reminder", auth, role("ADMIN"), controller.send2faReminder);
// TUR #93 W4 — Avukat Workload widget endpoint (Madde 30.53)
router.get("/lawyer-workload", auth, role("ADMIN"), controller.lawyerWorkload);
// TUR #95 H5 — Mimar Sağlık Skoru widget endpoint (Madde 14.4)
router.get("/architect-health", auth, role("ADMIN"), controller.architectHealth);
router.patch("/:id",           auth, role("ADMIN"), controller.updateUser);
router.patch("/:id/password",  auth, role("ADMIN"), controller.resetUserPasswordByAdmin);
router.patch("/:id/status",    auth, role("ADMIN"), controller.updateUserStatus);
router.patch("/:id/archive",   auth, role("ADMIN"), controller.archiveUser);
router.delete("/:id",          auth, role("ADMIN"), controller.softDeleteUser);

module.exports = router;
