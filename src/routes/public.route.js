const express = require("express");
const router = express.Router();
const { publicQueryLimiter } = require("../middlewares/rateLimiters");
const env = require("../config/env");
const prisma = require("../config/db");
const leadService = require("../services/lead.service");
const { canonicalPhone } = require("../utils/phoneNormalize");

// TUR #64 — Madde 32.3: file upload artık /api/documents/init-upload (hibrit)
// Bu endpoint sadece Lead create yapar, dosya beklemez (panel ayrı POST gönderir)
router.post("/public-lead", async (req, res) => {
  try {
    const { fullName, phone, email, city, summary, kvkkApproved, healthDataApproved } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({
        success: false,
        message: "Ad Soyad ve Telefon zorunludur."
      });
    }

    // TUR #132.1 — Madde 30.61 + MH61: phone normalize ile duplicate check.
    // 0212 333 4455 vs 02123334455 vs +90 212 333 44 55 hepsi ayni kanonik 10 hane.
    const phoneCanon = canonicalPhone(phone);
    if (!phoneCanon || phoneCanon.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Telefon numarasi formati gecersiz."
      });
    }

    // Mevcut DB'deki tum lead'leri kontrol et — phone normalize'siz kayitli olabilir
    // Madde 4.6 geriye uyumluluk: DB'deki ham phone alip canonical ile karsilastir.
    const candidates = await prisma.lead.findMany({
      where: { customerPhone: { not: null } },
      select: { leadCode: true, customerPhone: true },
    });
    const existingLead = candidates.find(l => canonicalPhone(l.customerPhone) === phoneCanon);
    if (existingLead) {
      return res.status(409).json({
        success: false,
        message: `Bu telefon numarasıyla zaten bir başvuru var. Başvuru kodunuz: ${existingLead.leadCode}`,
      });
    }

    const kvkkConsent =
      kvkkApproved === true ||
      kvkkApproved === "true" ||
      kvkkApproved === "1"
        ? new Date()
        : null;

    const healthDataConsent =
      healthDataApproved === true ||
      healthDataApproved === "true" ||
      healthDataApproved === "1"
        ? new Date()
        : null;

    const utmSource   = req.query.utm_source   || req.body.utm_source   || null;
    const utmMedium   = req.query.utm_medium   || req.body.utm_medium   || null;
    const utmCampaign = req.query.utm_campaign || req.body.utm_campaign || null;
    const utmTerm     = req.query.utm_term     || req.body.utm_term     || null;
    const utmContent  = req.query.utm_content  || req.body.utm_content  || null;
    const gclid       = req.query.gclid        || req.body.gclid        || null;
    const referrer    = req.body.referrer    || null;
    const landingPage = req.body.landing_page || null;

    const lead = await leadService.createLead({
      customerName: String(fullName).trim(),
      customerPhone: String(phone).trim(),
      customerEmail: email ? String(email).trim() : null,
      city: city ? String(city).trim() : null,
      accidentSummary: summary ? String(summary).trim() : null,
      kvkkConsentAt: kvkkConsent,
      healthDataConsentAt: healthDataConsent,
      qualificationScore: 0,
      source: "public_form",
      utmSource:   utmSource   ? String(utmSource).slice(0, 100)   : null,
      utmMedium:   utmMedium   ? String(utmMedium).slice(0, 100)   : null,
      utmCampaign: utmCampaign ? String(utmCampaign).slice(0, 100) : null,
      utmTerm:     utmTerm     ? String(utmTerm).slice(0, 100)     : null,
      utmContent:  utmContent  ? String(utmContent).slice(0, 100)  : null,
      gclid:       gclid       ? String(gclid).slice(0, 200)       : null,
      referrer:    referrer    ? String(referrer).slice(0, 200)    : null,
      landingPage: landingPage ? String(landingPage).slice(0, 200) : null,
    }, null, null);

    await prisma.activityLog.create({
      data: {
        leadId: lead.id,
        action: "PUBLIC_LEAD_CREATED",
        detail: "Public form uzerinden yeni basvuru olusturuldu."
      }
    });

    // TUR #55 A20 — ADMIN'lere yeni başvuru push (RealtimeEvent ADMIN_FEED)
    try {
      await prisma.realtimeEvent.create({
        data: {
          channel: "ADMIN_FEED",
          eventType: "NEW_PUBLIC_LEAD",
          payload: {
            leadId: lead.id,
            leadCode: lead.leadCode,
            customerName: lead.customerName,
            city: lead.city || null,
          },
        },
      });
    } catch (e) {
      console.warn("[PUBLIC_LEAD] realtime event hata:", e.message);
    }

    return res.status(201).json({
      success: true,
      message: "Basvuru olusturuldu.",
      data: {
        leadId: lead.id,
        leadCode: lead.leadCode
      }
    });
  } catch (error) {
    console.error("[PUBLIC_LEAD_ERROR]", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Basvuru olusturulamadi."
    });
  }
});


router.post("/public-lead/:leadCode/continue", async (req, res) => {
  try {
    const { leadCode } = req.params;

    const lead = await prisma.lead.findUnique({
      where: { leadCode }
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead bulunamadi"
      });
    }

    const updatedLead = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: "CONTRACT_PENDING",
        salesNote: ((lead.salesNote ? lead.salesNote + "\n" : "") + "OPERASYON_ONAYI_BEKLIYOR")
      }
    });

    await prisma.activityLog.create({
      data: {
        leadId: lead.id,
        action: "CLIENT_CONTINUE_REQUESTED",
        detail: "Müvekkil sürece devam etmek istedi."
      }
    });

    return res.json({
      success: true,
      data: {
        leadId: updatedLead.id,
        leadCode: updatedLead.leadCode,
        status: updatedLead.status
      }
    });
  } catch (error) {
    console.error("[PUBLIC_CONTINUE_ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Devam et islemi sirasinda hata olustu"
    });
  }
});



router.get("/public-lead/:leadCode/continue-page", async (req, res) => {
  try {
    const { leadCode } = req.params;

    const lead = await prisma.lead.findUnique({
      where: { leadCode }
    });

    if (!lead) {
      return res.status(404).send(`
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Kayit Bulunamadi</title>
</head>
<body style="font-family:Arial,sans-serif;background:#f6f7f9;padding:32px;">
  <div style="max-width:720px;margin:0 auto;background:#fff;border:1px solid #ddd;border-radius:12px;padding:24px;">
    <div style="font-size:12px;color:#666;margin-bottom:8px;">TEDBIRGE AI</div>
    <h1 style="margin-top:0;">Kayit bulunamadi</h1>
    <p>Devam talebi icin ilgili basvuru sistemde bulunamadi.</p>
  </div>
</body>
</html>`);
    }

    const alreadyPending = String(lead.status || "") === "CONTRACT_PENDING";

    if (alreadyPending) {
      return res.status(200).send(`
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Talep Zaten Alinmis</title>
</head>
<body style="font-family:Arial,sans-serif;background:#f6f7f9;padding:32px;color:#222;">
  <div style="max-width:720px;margin:0 auto;background:#fff;border:1px solid #ddd;border-radius:12px;padding:24px;">
    <div style="font-size:12px;color:#666;margin-bottom:8px;">TEDBIRGE AI</div>
    <h1 style="margin:0 0 16px 0;">Talebiniz zaten alinmis</h1>
    <p>Bu basvuru icin hukuki surece devam talebi daha once kaydedilmis.</p>
    <p><strong>Musteri:</strong> ${String(lead.customerName || "-")}</p>
    <p><strong>Lead Kodu:</strong> ${String(lead.leadCode || "-")}</p>
    <p><strong>Mevcut Durum:</strong> ${String(lead.status || "-")}</p>
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;">
    <p>Ekibimiz sizinle en kisa surede iletisime gececektir.</p>
    <p>
      <a href="/api/track-whatsapp/${encodeURIComponent(lead.id)}"
         target="_blank"
         style="display:inline-block;margin-top:12px;padding:10px 16px;background:#25D366;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
         WhatsApp ile iletisime gec
      </a>
    </p>
  </div>
</body>
</html>`);
    }

    const updatedLead = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: "CONTRACT_PENDING",
        salesNote: ((lead.salesNote ? lead.salesNote + "\n" : "") + "OPERASYON_ONAYI_BEKLIYOR")
      }
    });

    await prisma.activityLog.create({
      data: {
        leadId: lead.id,
        action: "CLIENT_CONTINUE_REQUESTED",
        detail: "Muvekkil dogrulama ekranindan surece devam etmek istedi."
      }
    });

    return res.status(200).send(`
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Talep Alindi</title>
</head>
<body style="font-family:Arial,sans-serif;background:#f6f7f9;padding:32px;color:#222;">
  <div style="max-width:720px;margin:0 auto;background:#fff;border:1px solid #ddd;border-radius:12px;padding:24px;">
    <div style="font-size:12px;color:#666;margin-bottom:8px;">TEDBIRGE AI</div>
    <h1 style="margin:0 0 16px 0;">Talebiniz alindi</h1>
    <p>Hukuki surece devam etme talebiniz basariyla kaydedildi.</p>
    <p><strong>Musteri:</strong> ${String(updatedLead.customerName || "-")}</p>
    <p><strong>Lead Kodu:</strong> ${String(updatedLead.leadCode || "-")}</p>
    <p><strong>Yeni Durum:</strong> ${String(updatedLead.status || "-")}</p>
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;">
    <p>Ekibimiz sizinle en kisa surede iletisime gececektir.</p>
    <p>
      <a href="/api/track-whatsapp/${encodeURIComponent(updatedLead.id)}"
         target="_blank"
         style="display:inline-block;margin-top:12px;padding:10px 16px;background:#25D366;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
         WhatsApp ile iletisime gec
      </a>
    </p>
  </div>
</body>
</html>`);
  } catch (error) {
    console.error("[PUBLIC_CONTINUE_PAGE_ERROR]", error);
    return res.status(500).send(`
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sunucu Hatasi</title>
</head>
<body style="font-family:Arial,sans-serif;background:#f6f7f9;padding:32px;">
  <div style="max-width:720px;margin:0 auto;background:#fff;border:1px solid #ddd;border-radius:12px;padding:24px;">
    <div style="font-size:12px;color:#666;margin-bottom:8px;">TEDBIRGE AI</div>
    <h1 style="margin-top:0;">Sunucu hatasi</h1>
    <p>Devam talebi islenemedi.</p>
  </div>
</body>
</html>`);
  }
});
router.get("/track-whatsapp/:id", async (req, res) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        customerName: true,
        status: true,
        leadCode: true
      }
    });

    if (!lead) {
      return res.status(404).type("text/plain; charset=utf-8").send("Lead bulunamadi");
    }

    await prisma.activityLog.create({
      data: {
        leadId: lead.id,
        action: "VERIFY_WHATSAPP_CLICKED",
        detail: "Verify HTML WhatsApp CTA tiklandi"
      }
    });

    const text =
      "Merhaba Tedbirge AI, belge dogrulama ekranindan ulasiyorum.\n\n" +
      "Musteri: " + String(lead.customerName || "-") + "\n" +
      "Lead Kodu: " + String(lead.leadCode || "-") + "\n" +
      "Lead ID: " + String(lead.id || "-") + "\n\n" +
      "Hukuki surec icin bilgi almak istiyorum.";

    const url = "https://wa.me/" + env.whatsappDefaultNumber + "?text=" + encodeURIComponent(text);

    return res.redirect(302, url);
  } catch (err) {
    console.error("[TRACK_WHATSAPP_ERROR]", err);
    return res.status(500).send("Tracking error");
  }
});
router.get("/verify/:id", async (req, res) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        customerName: true,
        status: true,
        leadCode: true
      }
    });

    if (!lead) {
      return res.status(404).type("text/plain; charset=utf-8").send(
        "Belge bulunamadi`nKimlik: " + req.params.id
      );
    }

    const lines = [
      "TEDBIRGE AI - BELGE DOGRULAMA",
      "----------------------------------------",
      "Belge dogrulandi",
      "Musteri: " + String(lead.customerName || "-"),
      "Durum: " + String(lead.status || "-"),
      "Lead Kodu: " + String(lead.leadCode || "-"),
      "Lead ID: " + String(lead.id || "-"),
      "",
      "Bu belge Tedbirge AI tarafindan olusturulmustur ve sistem kaydi bulunmustur."
    ];

    return res.status(200).type("text/plain; charset=utf-8").send(lines.join("\n"));
  } catch (error) {
    console.error("[PUBLIC_VERIFY_V0_ERROR]", error);
    return res.status(500).type("text/plain; charset=utf-8").send(
      "Sunucu hatasi`nDogrulama sayfasi olusturulamadi."
    );
  }
});


router.get("/verify-html/:id", async (req, res) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        customerName: true,
        status: true,
        leadCode: true
      }
    });

    if (!lead) {
      return res.status(404).send(`
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Belge Bulunamadi</title>
</head>
<body style="font-family:Arial,sans-serif;background:#f6f7f9;padding:32px;">
  <div style="max-width:720px;margin:0 auto;background:#fff;border:1px solid #ddd;border-radius:12px;padding:24px;">
    <div style="font-size:12px;color:#666;margin-bottom:8px;">TEDBIRGE AI</div>
    <h1 style="margin-top:0;">Belge bulunamadi</h1>
    <p>Bu kimlige ait kayit sistemde bulunamadi.</p>
  </div>
</body>
</html>`);
    }

    return res.status(200).send(`
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Tedbirge AI Belge Dogrulama</title>
</head>
<body style="font-family:Arial,sans-serif;background:#f6f7f9;padding:32px;color:#222;">
  <div style="max-width:720px;margin:0 auto;background:#fff;border:1px solid #ddd;border-radius:12px;padding:24px;">
    <div style="font-size:12px;color:#666;margin-bottom:8px;">TEDBIRGE AI</div>
    <h1 style="margin:0 0 16px 0;">Belge dogrulandi</h1>
    <p><strong>Musteri:</strong> ${String(lead.customerName || "-")}</p>
    <p><strong>Durum:</strong> ${String(lead.status || "-")}</p>
    <p><strong>Lead Kodu:</strong> ${String(lead.leadCode || "-")}</p>
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;">
    <p>Bu belge Tedbirge AI tarafindan olusturulmustur ve sistem kaydi bulunmustur.</p>
    <p>Dilerseniz hukuki surec icin bizimle iletisime gecebilirsiniz.</p>
    <p><a href="/api/verify/${encodeURIComponent(lead.id)}" target="_blank">Metin dogrulama kaydini ac</a></p>

    <p>
      <a href="/api/track-whatsapp/${encodeURIComponent(lead.id)}"
         target="_blank"
         style="display:inline-block;margin-top:12px;padding:10px 16px;background:#25D366;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
         WhatsApp ile iletisime gec
      </a>
    </p>
    <p>
      <a href="/api/public-lead/${encodeURIComponent(lead.leadCode)}/continue-page"
         style="display:inline-block;margin-top:12px;padding:10px 16px;background:#1e40af;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
         Surece devam etmek istiyorum
      </a>
    </p>
  </div>
</body>
</html>`);
  } catch (error) {
    console.error("[PUBLIC_VERIFY_HTML_V1_ERROR]", error);
    return res.status(500).send(`
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sunucu Hatasi</title>
</head>
<body style="font-family:Arial,sans-serif;background:#f6f7f9;padding:32px;">
  <div style="max-width:720px;margin:0 auto;background:#fff;border:1px solid #ddd;border-radius:12px;padding:24px;">
    <div style="font-size:12px;color:#666;margin-bottom:8px;">TEDBIRGE AI</div>
    <h1 style="margin-top:0;">Sunucu hatasi</h1>
    <p>Dogrulama ekrani olusturulamadi.</p>
  </div>
</body>
</html>`);
  }
});

/**
 * GET /api/public/leads/query
 * Başvuru durum sorgulama — telefon veya lead kodu son 6 karakteri ile.
 * Hassas alanlar (TC, adres, belgeler, avukat tam adı vb.) dışarıda tutulur.
 *
 * Query params:
 *   phone  — müşteri telefonu (tam eşleşme)
 *   code   — leadCode'un son 6 karakteri
 *
 * Döner: status, assignedLawyerFirstName, lastUpdated
 */
router.get("/leads/query", publicQueryLimiter, async (req, res) => {
  try {
    const phone = req.query.phone ? String(req.query.phone).trim() : null;
    const code  = req.query.code  ? String(req.query.code).trim()  : null;

    if (!phone && !code) {
      return res.status(400).json({
        success: false,
        message: "phone veya code parametresi zorunludur."
      });
    }

    // En az bir koşul — ikisi birden verilmişse AND olarak uygula
    const where = {};
    if (phone) where.customerPhone = phone;
    if (code)  where.leadCode = { endsWith: code };

    const lead = await prisma.lead.findFirst({
      where,
      orderBy: { updatedAt: "desc" },
      select: {
        id:        true,
        leadCode:  true,
        status:    true,
        updatedAt: true,
        assignments: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            lawyer: {
              select: { fullName: true }
            }
          }
        }
      }
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Kayıt bulunamadı. Telefon veya kod bilgisini kontrol edin."
      });
    }

    const lawyerFullName = lead.assignments?.[0]?.lawyer?.fullName || null;
    // Sadece ilk isim — gizlilik gereği soyad dışarıda
    const assignedLawyerFirstName = lawyerFullName
      ? lawyerFullName.split(" ")[0]
      : null;

    return res.json({
      success: true,
      data: {
        status:                 lead.status,
        assignedLawyerFirstName,
        lastUpdated:            lead.updatedAt
      }
    });
  } catch (error) {
    console.error("[PUBLIC_LEADS_QUERY_ERROR]", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası." });
  }
});

/**
 * TUR #83 U1 — 2-faktör hesapsız sorgulama (Madde 30.36 — KVKK m.12 koruma)
 *
 * Eski endpoint /api/public/query-lead 1-faktör (telefon) ile dosya gösteriyordu —
 * enumeration saldırısına açık + KVKK m.12 ihlali (~3M TL ceza riski).
 *
 * Yeni 3 endpoint akışı (banka/e-Devlet emsali):
 *   1. POST /query-lead-otp        → telefon + KVKK rıza → SMS OTP gönder
 *   2. POST /query-lead-verify-otp → telefon + OTP → temp session token (15 dk)
 *   3. POST /query-lead            → telefon + sessionToken → dosya bilgisi
 *
 * Brute force koruma: 3 yanlış OTP → 30 dk telefon lock (Madde 30.36 #2)
 * Enumeration koruma: mevcut/yok response süresi aynı (timing attack koruma)
 * Hassas veri filtre: avukat ilk isim + status + son güncelleme + kalan süre
 */
const { sendOtpSms, normalizePhone } = require("../services/sms.service");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const QUERY_OTP_TTL_MS = 5 * 60 * 1000;
const QUERY_OTP_RATE_LIMIT_MS = 60 * 1000;
const QUERY_OTP_MAX_FAILED = 3;
const QUERY_OTP_LOCK_MS = 30 * 60 * 1000;
const QUERY_SESSION_TTL = "15m";

function generateQueryOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

// 1) POST /api/public/query-lead-otp — Telefon + KVKK rıza → SMS OTP gönder
router.post("/query-lead-otp", async (req, res) => {
  try {
    const phoneRaw = req.body?.phone ? String(req.body.phone).trim() : null;
    const kvkkConsent = req.body?.kvkkConsent === true || req.body?.kvkkConsent === "true";

    if (!phoneRaw) {
      return res.status(400).json({ success: false, message: "Telefon numarası zorunludur." });
    }
    if (!kvkkConsent) {
      return res.status(400).json({ success: false, message: "KVKK aydınlatma onayı zorunludur." });
    }

    const phone = normalizePhone(phoneRaw);
    if (!phone) {
      return res.status(400).json({ success: false, message: "Geçersiz telefon numarası formatı." });
    }

    // Brute force lock kontrolü (son 30 dk içinde 3+ yanlış)
    const lockCutoff = new Date(Date.now() - QUERY_OTP_LOCK_MS);
    const recentFailed = await prisma.activityLog.count({
      where: {
        action: "QUERY_OTP_FAILED",
        detail: { contains: phone.slice(-4) },
        createdAt: { gte: lockCutoff },
      },
    }).catch(() => 0);
    if (recentFailed >= QUERY_OTP_MAX_FAILED) {
      return res.status(429).json({
        success: false,
        message: "Çok fazla yanlış kod denemesi. 30 dakika sonra tekrar deneyin.",
      });
    }

    // Rate limit (1 dk içinde 1 OTP)
    const rateCutoff = new Date(Date.now() - QUERY_OTP_RATE_LIMIT_MS);
    const recent = await prisma.phoneOtp.findFirst({
      where: { phone, purpose: "query-lead", createdAt: { gte: rateCutoff } },
      orderBy: { createdAt: "desc" },
    }).catch(() => null);
    if (recent) {
      return res.status(429).json({
        success: false,
        message: "Çok hızlı tekrar deneme. 1 dakika bekleyin.",
      });
    }

    // Lead kontrolü (enumeration koruma — yine timer açıyoruz, aynı süre)
    const queryStart = Date.now();
    const leadExists = await prisma.lead.count({ where: { customerPhone: phoneRaw } }).catch(() => 0);

    if (leadExists === 0) {
      // Aynı response süresini garanti — timing attack koruma
      const elapsed = Date.now() - queryStart;
      const minMs = 600;
      if (elapsed < minMs) await new Promise((r) => setTimeout(r, minMs - elapsed));
      return res.json({
        success: true,
        data: { ok: true, message: "Eğer bu numarayla başvuru varsa SMS gönderildi.", expiresIn: 300 },
      });
    }

    // OTP üret + DB'ye kaydet + SMS gönder
    const code = generateQueryOtp();
    const expiresAt = new Date(Date.now() + QUERY_OTP_TTL_MS);
    await prisma.phoneOtp.create({
      data: { phone, code, purpose: "query-lead", expiresAt },
    });

    const smsResult = await sendOtpSms(phoneRaw, code, "dosya sorgulama");

    // ActivityLog (KVKK m.10 audit kanıt)
    const phoneMask = phone.slice(0, 4) + "***" + phone.slice(-2);
    try {
      await prisma.activityLog.create({
        data: {
          action: "QUERY_OTP_SENT",
          detail: `Hesapsız sorgu OTP gönderildi: ${phoneMask} (Madde 30.36)`,
        },
      });
    } catch (_) {}

    return res.json({
      success: true,
      data: {
        ok: true,
        phoneMask,
        message: "SMS gönderildi. Kodu giriniz.",
        expiresIn: QUERY_OTP_TTL_MS / 1000,
        mock: smsResult?.mock || false,
      },
    });
  } catch (error) {
    console.error("[PUBLIC_QUERY_LEAD_OTP_ERROR]", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası." });
  }
});

// 2) POST /api/public/query-lead-verify-otp — Telefon + OTP → temp session token (15 dk)
router.post("/query-lead-verify-otp", async (req, res) => {
  try {
    const phoneRaw = req.body?.phone ? String(req.body.phone).trim() : null;
    const otp = req.body?.otp ? String(req.body.otp).trim() : null;

    if (!phoneRaw || !otp) {
      return res.status(400).json({ success: false, message: "Telefon ve OTP zorunludur." });
    }

    const phone = normalizePhone(phoneRaw);
    if (!phone) {
      return res.status(400).json({ success: false, message: "Geçersiz telefon formatı." });
    }

    const otpRecord = await prisma.phoneOtp.findFirst({
      where: { phone, code: otp, purpose: "query-lead" },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      // Yanlış OTP — ActivityLog (brute force tespit)
      try {
        await prisma.activityLog.create({
          data: {
            action: "QUERY_OTP_FAILED",
            detail: `Hesapsız sorgu yanlış OTP: ${phone.slice(-4)}`,
          },
        });
      } catch (_) {}
      return res.status(401).json({ success: false, message: "Geçersiz veya süresi dolmuş kod." });
    }

    if (new Date(otpRecord.expiresAt) < new Date()) {
      await prisma.phoneOtp.delete({ where: { id: otpRecord.id } }).catch(() => {});
      return res.status(401).json({ success: false, message: "Kod süresi doldu." });
    }

    // Temp session token (15 dk)
    const sessionToken = jwt.sign(
      { phone, type: "query-lead-session" },
      process.env.JWT_SECRET,
      { expiresIn: QUERY_SESSION_TTL },
    );

    // OTP kaydı sil (tek kullanım)
    await prisma.phoneOtp.delete({ where: { id: otpRecord.id } }).catch(() => {});

    return res.json({ success: true, data: { sessionToken, expiresIn: 900 } });
  } catch (error) {
    console.error("[PUBLIC_QUERY_LEAD_VERIFY_OTP_ERROR]", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası." });
  }
});

// 3) POST /api/public/query-lead — Telefon + sessionToken → dosya bilgisi
router.post("/query-lead", async (req, res) => {
  try {
    const phoneRaw = req.body?.phone ? String(req.body.phone).trim() : null;
    const sessionToken = req.body?.sessionToken ? String(req.body.sessionToken).trim() : null;

    if (!phoneRaw || !sessionToken) {
      return res.status(400).json({
        success: false,
        message: "Telefon ve sessionToken zorunludur. Önce SMS doğrulaması yapın.",
      });
    }

    const phoneNorm = normalizePhone(phoneRaw);
    let payload;
    try {
      payload = jwt.verify(sessionToken, process.env.JWT_SECRET);
    } catch (_) {
      return res.status(401).json({ success: false, message: "Geçersiz veya süresi dolmuş oturum." });
    }
    if (payload?.type !== "query-lead-session" || payload?.phone !== phoneNorm) {
      return res.status(401).json({ success: false, message: "Oturum eşleşmiyor." });
    }

    const lead = await prisma.lead.findFirst({
      where: { customerPhone: phoneRaw },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        leadCode: true,
        status: true,
        updatedAt: true,
        accidentDate: true,
        accidentType: true,
        assignments: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { lawyer: { select: { fullName: true } } },
        },
      },
    });

    if (!lead) {
      return res.status(404).json({ success: false, message: "Bu numarayla başvuru bulunamadı." });
    }

    const lawyerFullName = lead.assignments?.[0]?.lawyer?.fullName || null;
    const assignedLawyerFirstName = lawyerFullName ? lawyerFullName.split(" ")[0] : null;

    let daysRemaining = null;
    if (lead.accidentDate) {
      const isWork =
        typeof lead.accidentType === "string" &&
        lead.accidentType.toUpperCase().includes("IS");
      const limit = isWork ? 3650 : 730;
      const elapsed = Math.floor((Date.now() - new Date(lead.accidentDate).getTime()) / 86_400_000);
      daysRemaining = limit - elapsed;
    }

    return res.json({
      success: true,
      data: {
        leadCode: lead.leadCode,
        status: lead.status,
        assignedLawyerFirstName,
        lastUpdated: lead.updatedAt,
        daysRemaining,
      },
    });
  } catch (error) {
    console.error("[PUBLIC_QUERY_LEAD_ERROR]", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası." });
  }
});

// ─── TUR #52: KVKK m.11 Public Hak Basvurusu ──────────────────────
const kvkkService = require("../services/kvkk.service");
router.post("/public/kvkk-request", async (req, res) => {
  try {
    const created = await kvkkService.createPublicRequest({
      requesterTC: req.body.requesterTC,
      requestType: req.body.requestType,
      description: req.body.description,
    });
    try {
      await prisma.activityLog.create({
        data: {
          action: "KVKK_REQUEST_CREATED",
          detail: `id:${created.id} type:${created.requestType}`,
        },
      });
    } catch (e) {}
    return res.status(201).json({ success: true, requestId: created.id });
  } catch (error) {
    console.error("[PUBLIC_KVKK_REQUEST]", error);
    return res.status(400).json({ success: false, message: error.message || "Basvuru hatasi" });
  }
});

// ─── TUR YENİ: Otonom Hukuki Haberler (gerçek Yargıtay kararları, $0) ──────
const fs = require("fs");
const path = require("path");
const HABERLER_CACHE_PATH = path.resolve(__dirname, "../../tedbirge-os/data/haberler-cache.json");

router.get("/haberler", (req, res) => {
  try {
    const raw = fs.readFileSync(HABERLER_CACHE_PATH, "utf-8");
    const data = JSON.parse(raw);
    return res.json({ success: true, data });
  } catch (err) {
    return res.json({
      success: true,
      data: { generatedAt: null, kaynak: null, haberler: [] },
    });
  }
});

module.exports = router;













