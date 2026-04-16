/**
 * payment.service.js
 * PayTR iFrame API entegrasyonu
 * Docs: https://dev.paytr.com/iframe-api
 * ENV: PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY, PAYTR_MERCHANT_SALT
 */

const crypto = require("crypto");
const https = require("https");
const querystring = require("querystring");

const MERCHANT_ID   = process.env.PAYTR_MERCHANT_ID   || "";
const MERCHANT_KEY  = process.env.PAYTR_MERCHANT_KEY  || "";
const MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT || "";
const MOCK_MODE     = !MERCHANT_ID || !MERCHANT_KEY || !MERCHANT_SALT;

// ─── Yardımcı: HMAC-SHA256 token ────────────────────────────────────────────

function generateToken(fields) {
  const data = Object.values(fields).join("") + MERCHANT_SALT;
  return crypto.createHmac("sha256", MERCHANT_KEY).update(data).digest("base64");
}

// ─── iFrame token oluştur ────────────────────────────────────────────────────

/**
 * PayTR iFrame için ödeme tokenı oluşturur.
 * @param {object} opts
 * @param {string} opts.merchantOid  — Benzersiz sipariş kodu (örn. leadCode)
 * @param {number} opts.paymentAmount — Kuruş cinsinden (örn. 100 TL = 10000)
 * @param {string} opts.email
 * @param {string} opts.userIp
 * @param {string} opts.userName
 * @param {string} opts.userAddress
 * @param {string} opts.userPhone
 * @param {Array}  opts.basketItems  — [["Ürün adı", "fiyat kuruş", "adet"]]
 * @returns {Promise<{ iframeToken: string, iframeUrl: string }>}
 */
async function createPayment(opts) {
  if (MOCK_MODE) {
    console.log("[PAYTR_MOCK] createPayment:", opts.merchantOid, opts.paymentAmount);
    return {
      iframeToken: "MOCK_TOKEN_" + Date.now(),
      iframeUrl: "https://www.paytr.com/odeme/guvenli/MOCK_TOKEN",
      mock: true,
    };
  }

  const {
    merchantOid, paymentAmount, email, userIp,
    userName, userAddress, userPhone, basketItems,
  } = opts;

  const userBasket = Buffer.from(JSON.stringify(basketItems)).toString("base64");
  const noInstallment = "0";
  const maxInstallment = "0";
  const currency = "TL";
  const testMode = process.env.NODE_ENV === "production" ? "0" : "1";
  const okUrl   = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/payments/callback`;
  const failUrl = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/payments/callback`;

  const hashStr = `${MERCHANT_ID}${userIp}${merchantOid}${email}${paymentAmount}${userBasket}${noInstallment}${maxInstallment}${currency}${testMode}`;
  const paytrToken = generateToken({ hashStr });

  const postData = querystring.stringify({
    merchant_id:       MERCHANT_ID,
    user_ip:           userIp,
    merchant_oid:      merchantOid,
    email:             email,
    payment_amount:    paymentAmount,
    paytr_token:       paytrToken,
    user_basket:       userBasket,
    debug_on:          "1",
    no_installment:    noInstallment,
    max_installment:   maxInstallment,
    user_name:         userName,
    user_address:      userAddress,
    user_phone:        userPhone,
    merchant_ok_url:   okUrl,
    merchant_fail_url: failUrl,
    timeout_limit:     "30",
    currency:          currency,
    test_mode:         testMode,
    lang:              "tr",
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "www.paytr.com",
      path: "/odeme/api",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.status !== "success") {
            return reject(new Error("PayTR hatası: " + parsed.reason));
          }
          resolve({
            iframeToken: parsed.token,
            iframeUrl: `https://www.paytr.com/odeme/guvenli/${parsed.token}`,
          });
        } catch {
          reject(new Error("PayTR yanıtı parse edilemedi: " + data));
        }
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

// ─── Callback doğrulama ───────────────────────────────────────────────────────

/**
 * PayTR callback POST verisini doğrular.
 * @param {object} body  — req.body (urlencoded)
 * @returns {{ valid: boolean, merchantOid: string, status: string, totalAmount: string }}
 */
function verifyCallback(body) {
  if (MOCK_MODE) {
    return { valid: true, merchantOid: body.merchant_oid, status: body.status || "success", totalAmount: body.total_amount || "0" };
  }

  const { merchant_oid, status, total_amount, hash } = body;
  const hashStr = `${merchant_oid}${MERCHANT_SALT}${status}${total_amount}`;
  const expected = crypto.createHmac("sha256", MERCHANT_KEY).update(hashStr).digest("base64");

  return {
    valid: expected === hash,
    merchantOid: merchant_oid,
    status,
    totalAmount: total_amount,
  };
}

// ─── İptal / iade ─────────────────────────────────────────────────────────────

/**
 * PayTR üzerinden iade başlatır.
 * @param {string} merchantOid
 * @param {number} returnAmount  — Kuruş cinsinden
 * @returns {Promise<object>}
 */
async function refundPayment(merchantOid, returnAmount) {
  if (MOCK_MODE) {
    console.log("[PAYTR_MOCK] refundPayment:", merchantOid, returnAmount);
    return { status: "success", mock: true };
  }

  const hashStr = `${MERCHANT_ID}${merchantOid}${returnAmount}`;
  const paytrToken = generateToken({ hashStr });

  const postData = querystring.stringify({
    merchant_id:     MERCHANT_ID,
    merchant_oid:    merchantOid,
    return_amount:   returnAmount,
    paytr_token:     paytrToken,
    reference_no:    "",
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "www.paytr.com",
      path: "/odeme/iade",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => { data += c; });
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch { reject(new Error("PayTR iade yanıtı parse edilemedi: " + data)); }
      });
    });
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

module.exports = { createPayment, verifyCallback, refundPayment, isMockMode: () => MOCK_MODE };
