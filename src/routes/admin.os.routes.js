const express = require("express");
const controller = require("../controllers/admin.os.controller");
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

const router = express.Router();

router.get("/status",        auth, role("ADMIN"), controller.getStatus);
router.get("/boot-records",  auth, role("ADMIN"), controller.getBootRecords);
router.get("/events",        auth, role("ADMIN"), controller.getEvents);

module.exports = router;
