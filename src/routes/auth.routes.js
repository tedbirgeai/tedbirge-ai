const express = require("express");
const controller = require("../controllers/auth.controller");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

const router = express.Router();

router.post("/register", auth, role("ADMIN"), controller.register);
router.post("/register/hukukcu", controller.registerHukukcu);
router.post("/register/temsilci", controller.registerTemsilci);
router.post("/register/send-otp", controller.sendRegistrationOtp);
router.post("/create-customer", auth, role("ADMIN", "SALES", "REPRESENTATIVE"), controller.createCustomer);
router.post("/login", controller.login);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);

router.post("/accept-terms", auth, controller.acceptTerms);
router.get("/users", auth, role("ADMIN"), controller.listUsers);
router.get("/lawyers", auth, role("ADMIN", "SALES", "REPRESENTATIVE"), controller.listLawyers);

// 2FA
router.post("/setup-2fa",    auth, controller.setup2fa);
router.post("/verify-2fa",   auth, controller.verify2fa);
router.post("/disable-2fa",  auth, controller.disable2fa);
router.post("/login-2fa",    controller.loginVerify2fa);

module.exports = router;



