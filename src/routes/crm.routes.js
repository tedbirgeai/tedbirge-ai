const express = require("express");
const controller = require("../controllers/crm.controller");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

const router = express.Router();

router.get("/dashboard", auth, role("ADMIN", "SALES", "REPRESENTATIVE"), controller.getDashboard);

module.exports = router;
