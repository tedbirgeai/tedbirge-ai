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

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Çok fazla giriş denemesi. 15 dakika bekleyin." },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
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

app.get("/health", (req, res) => {
  res.json({ success: true, message: "Tedbirge AI API calisiyor" });
});

app.use("/api/auth/login", loginLimiter);
app.use("/api/", apiLimiter);
app.use("/api/analysis", analysisRoutes);
app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;


