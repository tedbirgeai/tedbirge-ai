const express = require("express");
const router = express.Router();
const env = require("../config/env");
const prisma = require("../config/db");
const upload = require("../middlewares/uploadMiddleware");
const { supabaseUploadMiddleware } = require("../middlewares/uploadMiddleware");
const leadService = require("../services/lead.service");

router.post("/public-lead", upload.single("file"), supabaseUploadMiddleware, async (req, res) => {
  try {
    const { fullName, phone, email, city, summary, kvkkApproved, healthDataApproved } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({
        success: false,
        message: "Ad Soyad ve Telefon zorunludur."
      });
    }

    const existingLead = await prisma.lead.findFirst({
      where: { customerPhone: String(phone).trim() },
      select: { leadCode: true },
    });
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
    }, null, null);

    let document = null;

    if (req.file) {
      document = await prisma.document.create({
        data: {
          leadId: lead.id,
          uploadedById: null,
          type: "OTHER",
          status: "UPLOADED",
          originalName: req.file.originalname,
          storedName: req.file.filename || req.file.originalname,
          mimeType: req.file.mimetype || "application/octet-stream",
          sizeBytes: Number(req.file.size || 0),
          path: req.file.path || req.file.filename || req.file.originalname
        }
      });

      await prisma.activityLog.create({
        data: {
          leadId: lead.id,
          action: "PUBLIC_DOCUMENT_UPLOADED",
          detail: `Public form uzerinden belge yuklendi: ${req.file.originalname}`
        }
      });
    }

    await prisma.activityLog.create({
      data: {
        leadId: lead.id,
        action: "PUBLIC_LEAD_CREATED",
        detail: "Public form uzerinden yeni basvuru olusturuldu."
      }
    });

    return res.status(201).json({
      success: true,
      message: "Basvuru olusturuldu.",
      data: {
        leadId: lead.id,
        leadCode: lead.leadCode,
        documentId: document ? document.id : null
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
router.get("/leads/query", async (req, res) => {
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
 * POST /api/public/query-lead
 * Başvuru durum sorgulama — JSON body ile (telefon ve/veya başvuru kodu).
 * Hassas alanlar döndürülmez.
 *
 * Body: { phone?: string, code?: string }
 * Döner: status, assignedLawyerFirstName, lastUpdated, daysRemaining
 */
router.post("/query-lead", async (req, res) => {
  try {
    const phone = req.body?.phone ? String(req.body.phone).trim() : null;
    const code  = req.body?.code  ? String(req.body.code).trim()  : null;

    if (!phone && !code) {
      return res.status(400).json({
        success: false,
        message: "phone veya code alanı zorunludur."
      });
    }

    const where = {};
    if (phone) where.customerPhone = phone;
    if (code)  where.leadCode = { endsWith: code };

    const lead = await prisma.lead.findFirst({
      where,
      orderBy: { updatedAt: "desc" },
      select: {
        id:           true,
        leadCode:     true,
        status:       true,
        updatedAt:    true,
        accidentDate: true,
        accidentType: true,
        assignments: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            lawyer: { select: { fullName: true } }
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
    const assignedLawyerFirstName = lawyerFullName
      ? lawyerFullName.split(" ")[0]
      : null;

    // Zamanaşımı hesabı
    let daysRemaining = null;
    if (lead.accidentDate) {
      const isWork =
        typeof lead.accidentType === "string" &&
        lead.accidentType.toUpperCase().includes("IS");
      const limit = isWork ? 3650 : 730;
      const elapsed = Math.floor(
        (Date.now() - new Date(lead.accidentDate).getTime()) / 86_400_000
      );
      daysRemaining = limit - elapsed;
    }

    return res.json({
      success: true,
      data: {
        status:                 lead.status,
        assignedLawyerFirstName,
        lastUpdated:            lead.updatedAt,
        daysRemaining
      }
    });
  } catch (error) {
    console.error("[PUBLIC_QUERY_LEAD_ERROR]", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası." });
  }
});

module.exports = router;













