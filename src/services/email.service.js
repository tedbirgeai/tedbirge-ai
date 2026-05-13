/**
 * E-Posta Servisi — Nodemailer + Gmail SMTP
 *
 * Gerekli .env değişkenleri:
 *   SMTP_HOST   — SMTP sunucusu (örn. smtp.gmail.com)
 *   SMTP_PORT   — Port (587 = STARTTLS, 465 = SSL, 25 = plain)
 *   SMTP_USER   — Gönderici e-posta adresi
 *   SMTP_PASS   — Şifre veya Gmail Uygulama Şifresi
 *
 * Opsiyonel:
 *   SMTP_FROM   — "Ad Soyad <eposta>" formatında gönderici (varsayılan: SMTP_USER)
 *   SMTP_REPLY_TO — Reply-To adresi
 *
 * Gmail kurulumu:
 *   1. Google Account → Security → 2-Step Verification → etkinleştir
 *   2. Google Account → Security → App Passwords → "Mail" seç → şifreyi kopyala
 *   3. SMTP_PASS='xxxx xxxx xxxx xxxx'  (16 haneli, boşluklu yazılabilir)
 *
 * Değişkenler eksikse mock moda düşer.
 */

const nodemailer = require("nodemailer");
const { generateUnsubscribeToken } = require("../routes/unsubscribe.routes");

// ─── Transporter ──────────────────────────────────────────────────────────────

let _transporter = null;
let _verified = false;

function buildTransporter() {
  const port   = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = port === 465;

  const config = {
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Gmail + 587 için STARTTLS zorunlu
    ...(secure === false && {
      tls: { ciphers: "SSLv3", rejectUnauthorized: false },
      requireTLS: true,
    }),
    // Bağlantı havuzu — yoğun kullanımda yeniden bağlanma maliyetini azaltır
    pool:             true,
    maxConnections:   3,
    maxMessages:      50,
    rateDelta:        1000,
    rateLimit:        5,
    connectionTimeout: 10000,
    greetingTimeout:   8000,
    socketTimeout:     10000,
  };

  return nodemailer.createTransport(config);
}

function getTransporter() {
  if (!_transporter) {
    _transporter = buildTransporter();
  }
  return _transporter;
}

function isMockMode() {
  return !process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS;
}

/**
 * SMTP bağlantısını test eder. Sunucu başlarken çağrılır.
 * Hata olursa uyarı verir ama sunucuyu durdurmaz.
 */
async function verifyConnection() {
  if (isMockMode()) {
    console.log("[EMAIL] Mock mod — SMTP bağlantısı test edilmedi.");
    return false;
  }
  try {
    await getTransporter().verify();
    console.log("[EMAIL] ✓ SMTP bağlantısı başarılı");
    _verified = true;
    return true;
  } catch (err) {
    console.error("[EMAIL] SMTP bağlantı hatası:", err.message);
    console.error("[EMAIL] E-posta gönderimi devre dışı kalacak. SMTP ayarlarını kontrol edin.");
    return false;
  }
}

const FROM = () => process.env.SMTP_FROM
  || `"Tedbirge" <${process.env.SMTP_USER || "noreply@tedbirge.ai"}>`;

const REPLY_TO = () => process.env.SMTP_REPLY_TO || process.env.SMTP_USER || null;

// ─── İYS opt-out footer ──────────────────────────────────────────────────────

function buildUnsubscribeFooter({ leadId, email }) {
  try {
    const token = generateUnsubscribeToken({ leadId, email, channel: "email" });
    const base = process.env.PUBLIC_BASE_URL || "https://www.tedbirge.ai";
    const url = `${base}/api/unsubscribe?token=${encodeURIComponent(token)}`;
    return `<p style="font-size:11px;color:#94a3b8;margin-top:12px;text-align:center;">Bu iletiyi almak istemiyorsaniz <a href="${url}" style="color:#94a3b8;">buradan abonelikten cikabilirsiniz</a>. Tedbirge LegalTech.</p>`;
  } catch {
    return "";
  }
}

// ─── HTML Şablon ──────────────────────────────────────────────────────────────

function wrapHtml(title, body, opts = {}) {
  const { preheader = "" } = opts;
  return `<!DOCTYPE html>
<html lang="tr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>${title}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#f0f4f8;font-family:Arial,'Helvetica Neue',sans-serif;color:#1e293b;-webkit-text-size-adjust:100%}
    .wrapper{max-width:600px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 24px rgba(30,30,142,.08)}
    .header{background:#1E1E8E;padding:28px 32px}
    .header-brand{font-size:22px;font-weight:700;color:#fff;letter-spacing:-.3px}
    .header-sub{color:#bfcfff;font-size:13px;margin-top:4px}
    .body{padding:32px}
    .body h2{color:#1E1E8E;font-size:18px;margin-bottom:16px}
    .body p{line-height:1.7;color:#475569;font-size:14px;margin-bottom:12px}
    .info-box{background:#f8faff;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin:20px 0}
    .info-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f1f5f9;font-size:13px}
    .info-row:last-child{border-bottom:none}
    .info-label{color:#64748b}
    .info-value{font-weight:600;color:#1e293b;text-align:right;max-width:60%}
    .badge{display:inline-block;background:#dcfce7;color:#166534;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600}
    .badge-warn{background:#fef9c3;color:#854d0e}
    .badge-danger{background:#fee2e2;color:#b91c1c}
    .cta{display:inline-block;background:#1E1E8E;color:#fff!important;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;margin:16px 0}
    .cta:hover{background:#18187a}
    .warn-box{background:#fef9c3;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:8px;padding:14px 18px;margin:20px 0}
    .warn-box p{color:#854d0e;font-size:13px;line-height:1.6}
    .danger-box{background:#fee2e2;border:1px solid #fca5a5;border-left:4px solid #ef4444;border-radius:8px;padding:14px 18px;margin:20px 0}
    .danger-box p{color:#991b1b;font-size:13px;line-height:1.6}
    .footer{background:#f8faff;border-top:1px solid #e2e8f0;padding:20px 32px;font-size:11px;color:#94a3b8;text-align:center;line-height:1.6}
    @media(max-width:600px){.wrapper{margin:0;border-radius:0}.body{padding:20px}.header{padding:20px}.info-row{flex-direction:column;gap:2px}.info-value{text-align:left;max-width:100%}}
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>` : ""}
  <div class="wrapper">
    <div class="header">
      <div class="header-brand">Tedbirge</div>
      <div class="header-sub">Hukuki Süreç Yönetim Platformu</div>
    </div>
    <div class="body">
      ${body}
    </div>
    <div class="footer">
      Bu e-posta Tedbirge sistemi tarafından otomatik gönderilmiştir.<br/>
      Sorular için: <a href="mailto:destek@tedbirge.ai" style="color:#1E1E8E">destek@tedbirge.ai</a> &nbsp;|&nbsp;
      <a href="https://tedbirge.ai/kvkk-aydinlatma" style="color:#94a3b8">KVKK Aydınlatma</a>
      ${opts.unsubscribeFooter || ""}
    </div>
  </div>
</body>
</html>`;
}

// ─── Gönderme çekirdeği ───────────────────────────────────────────────────────

async function sendEmail({ to, subject, html, replyTo }) {
  if (!to) return;

  if (isMockMode()) {
    console.log(`[EMAIL MOCK] → ${to} | ${subject}`);
    return { success: true, mock: true };
  }

  try {
    const info = await getTransporter().sendMail({
      from:    FROM(),
      to,
      subject,
      html,
      ...(replyTo && { replyTo }),
      ...(REPLY_TO() && !replyTo && { replyTo: REPLY_TO() }),
      headers: { "X-Tedbirge-App": "1" },
    });
    console.log(`[EMAIL] Gönderildi → ${to} | messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    // Transporter havuzunu sıfırla (bağlantı kopmalarında yeniden dene)
    console.error(`[EMAIL ERROR] → ${to}: ${err.message}`);
    if (err.code === "ECONNRESET" || err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
      console.warn("[EMAIL] Bağlantı hatası — transporter sıfırlanıyor");
      _transporter = null;
      _verified    = false;
    }
    return { success: false, error: err.message };
  }
}

// ─── E-posta şablonları ───────────────────────────────────────────────────────

async function sendApplicationReceivedEmail(lead) {
  if (!lead?.customerEmail) return;
  const html = wrapHtml(
    "Başvurunuz Alındı",
    `<h2>Başvurunuz Alındı</h2>
    <p>Sayın <strong>${lead.customerName || "Değerli Müvekkil"}</strong>,</p>
    <p>Tedbirge platformuna yaptığınız başvuru sistemimize alındı. Dosyanız uzman ekibimiz tarafından incelenecek ve en kısa sürede sizinle iletişime geçilecektir.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Başvuru Numarası</span><span class="info-value">${lead.leadCode || "—"}</span></div>
      <div class="info-row"><span class="info-label">Ad Soyad</span><span class="info-value">${lead.customerName || "—"}</span></div>
      <div class="info-row"><span class="info-label">Şehir</span><span class="info-value">${lead.city || "—"}</span></div>
      <div class="info-row"><span class="info-label">Durum</span><span class="info-value"><span class="badge">Başvuru Alındı</span></span></div>
    </div>
    <p>Başvurunuzu dilediğiniz zaman takip edebilirsiniz:</p>
    <a class="cta" href="https://tedbirge.ai/basvuru-sorgula">Başvurumu Takip Et</a>
    <p style="font-size:12px;color:#94a3b8;margin-top:24px">
      Bu platform yalnızca ön değerlendirme amacıyla çalışır. Kesin hukuki tavsiye için avukatınıza başvurunuz.
    </p>`,
    { preheader: `Başvuru No: ${lead.leadCode} — Tedbirge`, unsubscribeFooter: buildUnsubscribeFooter({ leadId: lead.id, email: lead.customerEmail }) }
  );
  return sendEmail({
    to: lead.customerEmail,
    subject: `✅ Başvurunuz Alındı — Dosya No: ${lead.leadCode}`,
    html,
  });
}

async function sendLawyerAssignedEmail(lead, lawyer) {
  const tasks = [];

  if (lead?.customerEmail) {
    const html = wrapHtml(
      "Avukatınız Atandı",
      `<h2>Avukatınız Atandı</h2>
      <p>Sayın <strong>${lead.customerName || "Değerli Müvekkil"}</strong>,</p>
      <p>Dosyanız deneyimli avukat ortaklarımızdan birine atanmıştır. Avukatınız en kısa sürede sizinle iletişime geçecektir.</p>
      <div class="info-box">
        <div class="info-row"><span class="info-label">Dosya No</span><span class="info-value">${lead.leadCode || "—"}</span></div>
        <div class="info-row"><span class="info-label">Atanan Avukat</span><span class="info-value">Av. ${lawyer?.fullName || "—"}</span></div>
        <div class="info-row"><span class="info-label">Durum</span><span class="info-value"><span class="badge">Avukat Atandı</span></span></div>
      </div>
      <a class="cta" href="https://tedbirge.ai/basvuru-sorgula">Dosyamı Görüntüle</a>`,
      { preheader: `Avukatınız atandı — ${lead.leadCode}` }
    );
    tasks.push(sendEmail({
      to: lead.customerEmail,
      subject: `👨‍⚖️ Avukatınız Atandı — Dosya No: ${lead.leadCode}`,
      html,
    }));
  }

  if (lawyer?.email) {
    const html = wrapHtml(
      "Yeni Dava Atandı",
      `<h2>Yeni Dava Atandı</h2>
      <p>Sayın <strong>Av. ${lawyer.fullName || ""}</strong>,</p>
      <p>Aşağıdaki dosya size atanmıştır. Lütfen müvekkil ile en kısa sürede iletişime geçiniz.</p>
      <div class="info-box">
        <div class="info-row"><span class="info-label">Dosya No</span><span class="info-value">${lead.leadCode || "—"}</span></div>
        <div class="info-row"><span class="info-label">Müvekkil</span><span class="info-value">${lead.customerName || "—"}</span></div>
        <div class="info-row"><span class="info-label">Telefon</span><span class="info-value">${lead.customerPhone || "—"}</span></div>
        <div class="info-row"><span class="info-label">E-posta</span><span class="info-value">${lead.customerEmail || "—"}</span></div>
        <div class="info-row"><span class="info-label">Şehir</span><span class="info-value">${lead.city || "—"}</span></div>
        <div class="info-row"><span class="info-label">Kaza Türü</span><span class="info-value">${lead.accidentType || "—"}</span></div>
      </div>`,
      { preheader: `Yeni dosya: ${lead.customerName} — ${lead.leadCode}` }
    );
    tasks.push(sendEmail({
      to:      lawyer.email,
      subject: `📁 Yeni Dava: ${lead.customerName} (${lead.leadCode})`,
      html,
      replyTo: lead.customerEmail || undefined,
    }));
  }

  return Promise.allSettled(tasks);
}

async function sendContractCreatedEmail(lead, contractType) {
  if (!lead?.customerEmail) return;
  const typeLabel = contractType === "POWER_OF_ATTORNEY" ? "Vekâletnameniz" : "Avukatlık Sözleşmeniz";
  const html = wrapHtml(
    `${typeLabel} Hazırlandı`,
    `<h2>${typeLabel} Hazırlandı</h2>
    <p>Sayın <strong>${lead.customerName || "Değerli Müvekkil"}</strong>,</p>
    <p>${typeLabel} hazırlanmıştır. Belgeyi incelemek ve onaylamak için müvekkil panelinize giriş yapabilirsiniz.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Dosya No</span><span class="info-value">${lead.leadCode || "—"}</span></div>
      <div class="info-row"><span class="info-label">Belge Türü</span><span class="info-value">${typeLabel}</span></div>
      <div class="info-row"><span class="info-label">Durum</span><span class="info-value"><span class="badge badge-warn">Onay Bekleniyor</span></span></div>
    </div>
    <div class="warn-box">
      <p>Bu belge taslak niteliğindedir. İmzalamadan önce avukatınız tarafından incelenmesi gerekmektedir.</p>
    </div>
    <a class="cta" href="https://tedbirge.ai/basvuru-sorgula">Belgeyi İncele ve Onayla</a>`,
    { preheader: `${typeLabel} hazır — onayınız bekleniyor` }
  );
  return sendEmail({
    to: lead.customerEmail,
    subject: `✍️ ${typeLabel} Hazırlandı — Dosya No: ${lead.leadCode}`,
    html,
  });
}

async function sendStatuteLimitWarningEmail(lead, lawyer, daysRemaining) {
  if (!lawyer?.email) return;
  const name    = lead.customerName || "Müvekkil";
  const urgency = daysRemaining <= 7;
  const html = wrapHtml(
    "Zamanaşımı Uyarısı",
    `<h2>${urgency ? "🚨 Acil " : "⚠️ "}Zamanaşımı Uyarısı</h2>
    <p>Sayın <strong>Av. ${lawyer.fullName || ""}</strong>,</p>
    <p>Aşağıdaki dosyanın zamanaşımı süresi <strong style="color:${urgency ? "#b91c1c" : "#854d0e"}">${daysRemaining} gün</strong> içinde dolacaktır.</p>
    <div class="${urgency ? "danger-box" : "warn-box"}">
      <p>${urgency ? "ACİL: " : ""}Lütfen gerekli hukuki adımları atın. Zamanaşımı dolduktan sonra dava hakkı ortadan kalkabilir.</p>
    </div>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Müvekkil</span><span class="info-value">${name}</span></div>
      <div class="info-row"><span class="info-label">Dosya No</span><span class="info-value">${lead.leadCode || "—"}</span></div>
      <div class="info-row"><span class="info-label">Kaza Türü</span><span class="info-value">${lead.accidentType || "—"}</span></div>
      <div class="info-row"><span class="info-label">Kaza Tarihi</span><span class="info-value">${lead.accidentDate ? new Date(lead.accidentDate).toLocaleDateString("tr-TR") : "—"}</span></div>
      <div class="info-row"><span class="info-label">Kalan Süre</span><span class="info-value" style="color:${urgency ? "#b91c1c" : "#854d0e"};font-weight:800">${daysRemaining} gün</span></div>
    </div>`,
    { preheader: `⚠ ${daysRemaining} gün kaldı — ${name} (${lead.leadCode})` }
  );
  return sendEmail({
    to: lawyer.email,
    subject: `${urgency ? "🚨 ACİL" : "⚠️ UYARI"}: Zamanaşımı ${daysRemaining} Gün — ${name}`,
    html,
  });
}

// ─── TUR #49: Kariyer basvurusu bildirimi ─────────────────────
async function sendCareerApplicationNotification(application) {
  const adminEmail = process.env.ADMIN_EMAIL
    || process.env.KARIYER_EMAIL
    || process.env.SMTP_USER
    || "kariyer@tedbirge.ai";

  const subject = `Yeni Kariyer Basvurusu: ${application.position}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1E1E8E;">Yeni Kariyer Başvurusu</h2>
      <p>Tedbirge.ai kariyer formu üzerinden yeni bir başvuru aldınız.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; width: 30%;"><strong>Ad Soyad:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${application.fullName}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>E-posta:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${application.email}">${application.email}</a></td></tr>
        ${application.phone ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Telefon:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${application.phone}</td></tr>` : ""}
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Pozisyon:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${application.position}</td></tr>
        ${application.cvLink ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>CV:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="${application.cvLink}" target="_blank">${application.cvLink}</a></td></tr>` : ""}
        ${application.message ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; vertical-align: top;"><strong>Mesaj:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee; white-space: pre-wrap;">${application.message}</td></tr>` : ""}
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>CV Havuzu:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${application.cvHavuzuOnay ? "Evet (6 ay)" : "Hayır"}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Tarih:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(application.createdAt).toLocaleString("tr-TR")}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee; font-family: monospace; font-size: 11px;">${application.id}</td></tr>
      </table>
      <div style="background: #f8faff; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 12px; color: #475569;">
          <strong>KVKK Kanıt İzi:</strong><br>
          Aydınlatma: ${new Date(application.aydinlatmaOnayTimestamp).toLocaleString("tr-TR")}<br>
          Açık Rıza: ${new Date(application.acikRizaOnayTimestamp).toLocaleString("tr-TR")}<br>
          IP: ${application.ipAddress || "kayıtsız"}
        </p>
      </div>
      <p style="color: #64748b; font-size: 13px;">
        Admin panel: <a href="https://tedbirge.ai/dashboard/career-applications" style="color: #1E1E8E;">Kariyer Başvuruları</a>
      </p>
    </div>
  `;

  return sendEmail({ to: adminEmail, subject, html });
}

// ─── TUR #121 M4 — OTP Email + Info Email (Madde 30.80 Cift Kanal Dogrulama) ──
// Email/Phone degisim akisinda yeni kanaldan OTP + eski kanala bilgilendirme.
// Mock mod: SMTP yoksa console.log (TUR #113 SMS emsali).

async function sendOtpEmail(to, code, purpose = "dogrulama") {
  const subject = `Tedbirge ${purpose} kodunuz: ${code}`;
  const html = wrapHtml(
    "Doğrulama Kodu",
    `
    <p style="font-size: 16px; color: #0A1628;">
      Tedbirge.ai üzerinde <strong>${purpose}</strong> işlemi için doğrulama kodunuz:
    </p>
    <div style="background: #F1F5F9; padding: 24px; text-align: center; margin: 24px 0; border-radius: 12px;">
      <span style="font-size: 36px; font-weight: 700; letter-spacing: 0.2em; color: #1E1E8E; font-family: monospace;">${code}</span>
    </div>
    <p style="color: #64748b; font-size: 14px;">
      Bu kod <strong>10 dakika</strong> geçerlidir. Kodu kimseyle paylaşmayın.
    </p>
    <p style="color: #DC2626; font-size: 13px; margin-top: 24px;">
      ⚠️ Eğer bu işlemi siz başlatmadıysanız, derhal hesabınızı kontrol edin ve şifrenizi değiştirin.
    </p>
    `
  );
  return sendEmail({ to, subject, html });
}

async function sendEmailChangedInfo(oldEmail, newEmail, revertTokenUrl) {
  // KVKK m.11 — eski email'e bilgilendirme + 24h revert linki
  const subject = "Tedbirge.ai — E-posta adresiniz değiştirildi";
  const html = wrapHtml(
    "E-posta Değişikliği Bildirimi",
    `
    <p style="font-size: 16px; color: #0A1628;">
      Tedbirge.ai hesabınızın e-posta adresi <strong>${newEmail}</strong> olarak değiştirildi.
    </p>
    <p style="color: #64748b; font-size: 14px;">
      Eğer bu değişikliği <strong>siz yapmadıysanız</strong>, aşağıdaki bağlantı ile 24 saat içinde geri alabilirsiniz:
    </p>
    <div style="margin: 24px 0; text-align: center;">
      <a href="${revertTokenUrl}" style="background: #DC2626; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block;">Değişikliği Geri Al</a>
    </div>
    <p style="color: #64748b; font-size: 13px;">
      KVKK m.11 (Veri Sahibinin Hakları) — Bu bildirim verilerinizin değişimini sizin onaylamanız için zorunludur.
    </p>
    `
  );
  return sendEmail({ to: oldEmail, subject, html });
}

module.exports = {
  sendEmail,
  verifyConnection,
  sendApplicationReceivedEmail,
  sendLawyerAssignedEmail,
  sendContractCreatedEmail,
  sendStatuteLimitWarningEmail,
  sendCareerApplicationNotification,
  // TUR #121 M4 — Email OTP + KVKK m.11 cift kanal
  sendOtpEmail,
  sendEmailChangedInfo,
};
