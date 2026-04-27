const express = require("express");
const crypto = require("crypto");
const prisma = require("../config/db");
const router = express.Router();

const SECRET = process.env.UNSUBSCRIBE_SECRET || "change-me-in-production";

function verifyToken(token) {
  try {
    const [payload, signature] = token.split(".");
    const expected = crypto
      .createHmac("sha256", SECRET)
      .update(payload)
      .digest("hex");
    if (signature !== expected) return null;
    return JSON.parse(Buffer.from(payload, "base64").toString());
  } catch {
    return null;
  }
}

router.get("/unsubscribe", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send("Gecersiz baglanti.");

  const data = verifyToken(token);
  if (!data) return res.status(400).send("Baglanti dogrulanamadi.");

  try {
    await prisma.activityLog.create({
      data: {
        action: "MARKETING_UNSUBSCRIBE",
        leadId: data.leadId || null,
        detail: JSON.stringify({
          channel: data.channel,
          email: data.email || null,
          phone: data.phone || null,
          unsubscribedAt: new Date().toISOString(),
        }),
      },
    });
  } catch (err) {
    console.error("[unsubscribe] ActivityLog FAILED:", err.message);
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head><meta charset="utf-8"><title>Abonelikten Ciktiniz</title></head>
    <body style="font-family:sans-serif;max-width:600px;margin:80px auto;text-align:center;">
      <h1>Abonelikten ciktiniz</h1>
      <p>Tedbirge pazarlama iletilerini artik almayacaksiniz.</p>
      <p><a href="https://www.tedbirge.ai">Anasayfaya don</a></p>
    </body>
    </html>
  `);
});

function generateUnsubscribeToken({ leadId, email, phone, channel }) {
  const payload = Buffer.from(
    JSON.stringify({ leadId, email, phone, channel })
  ).toString("base64");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}

module.exports = { router, generateUnsubscribeToken };
