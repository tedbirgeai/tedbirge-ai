const express = require("express");
const analysisRoutes = require('./routes/analysis.routes');
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const routes = require("./routes");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// Render / reverse proxy arkasında gerçek IP için
app.set("trust proxy", 1);

// TUR #83 U7 — Rate limit denge: CEO test rahatça + brute force koruma
// Eski: 15 dk windowMs + 5 max (CEO test bloke kaldı, /login 429)
// Yeni: 5 dk windowMs + 10 max + skipSuccessful (başarılı login sayılmaz)
// Brute force pratik imkansız (5 dk'da 10 yanlış deneme zorlu) + CEO test rahat
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true, // başarılı login limit'e dahil değil
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Çok fazla giriş denemesi. 5 dakika bekleyin." },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
      : true, // allow all origins when CORS_ORIGIN not set
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    optionsSuccessStatus: 204,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads-static", express.static("uploads"));

// TUR #100.8 P4 — Sürüm Tek-Kaynak (Madde 22.8) — auth-free version endpoint + /health entegrasyon
const versionRoutes = require("./routes/version.routes");
app.use("/api/version", versionRoutes);

app.get("/health", (req, res) => {
  let version = null;
  try {
    version = versionRoutes.loadVersion();
  } catch (_) {
    // version okunmazsa health bozulmasın
  }
  res.json({
    success: true,
    message: "Tedbirge AI API calisiyor",
    timestamp: new Date().toISOString(),
    version,
  });
});

app.use("/api/auth/login", loginLimiter);
app.use("/api/", apiLimiter);
app.use("/api/analysis", analysisRoutes);
app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;


