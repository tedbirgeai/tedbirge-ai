// src/routes/muhatapAI.routes.js
// W1-M3.5 — /api/leads/:id/muhatap-ai ve /api/leads/:id/muhatap-ai/onay
// Mount: routes/index.js → router.use("/leads", muhatapAIRoutes)

const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { oneriAl, oneriOnayla } = require("../controllers/muhatapAI.controller");

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.post("/:id/muhatap-ai", roleMiddleware("ADMIN", "SALES", "LAWYER", "REPRESENTATIVE"), oneriAl);
router.post("/:id/muhatap-ai/onay", roleMiddleware("ADMIN", "SALES", "LAWYER", "REPRESENTATIVE"), oneriOnayla);

module.exports = router;
