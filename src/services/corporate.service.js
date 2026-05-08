// TUR #100.9 P8 — Kurumsal Üretim Servisi (Madde 34) — Sıfır Maliyet (Madde 24.14)
// Server-side SVG template (vanilla) + qrcode + opsiyonel sharp (PNG)

"use strict";

const { loadBrand } = require("../routes/brand.routes");

// Opsiyonel paketler (P0 keşif: sharp YOK, qrcode VAR, pdfkit VAR)
let sharp = null;
try { sharp = require("sharp"); } catch (e) { /* SVG-only mode */ }

let qrcode = null;
try { qrcode = require("qrcode"); } catch (e) { /* SVG fallback QR */ }

function escapeXml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getRoleTitle(role) {
  const titles = {
    ADMIN: "Yönetici",
    LAWYER: "Avukat",
    REPRESENTATIVE: "Temsilci",
    CUSTOMER: "Müvekkil",
    SALES: "Satış Temsilcisi",
  };
  return titles[role] || "";
}

function generateVCard(user, brand) {
  const name = user.fullName || user.adSoyad || user.name || "";
  const tel = user.phone || user.telefon || brand.contact.callCenter;
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${name}`,
    `TEL;TYPE=CELL:${tel}`,
    `EMAIL:${user.email}`,
    `URL:${brand.website.primary}`,
    `ADR:;;${brand.address.fullAddress}`,
    `ORG:${brand.displayName}`,
    user.role === "LAWYER" ? "TITLE:Tedbirge.ai Üye Avukatı" : "",
    "END:VCARD",
  ].filter(Boolean).join("\n");
}

/**
 * Kartvizit SVG (1050×600 px standart kartvizit)
 * Madde 25.3: LAWYER için sadece iletişim, uzmanlık YASAK
 */
async function generateKartvizitSVG(user) {
  const brand = loadBrand();
  const isLawyer = user.role === "LAWYER";
  const name = user.fullName || user.adSoyad || user.name || "";
  const tel = user.phone || user.telefon || brand.contact.callCenter;

  // QR kod (vCard formatında)
  let qrInner = "";
  if (qrcode) {
    try {
      const vcard = generateVCard(user, brand);
      const qrSvg = await qrcode.toString(vcard, { type: "svg", width: 120, margin: 0, errorCorrectionLevel: "M" });
      qrInner = qrSvg
        .replace(/<\?xml.*?\?>/, "")
        .replace(/<svg[^>]*>/, "")
        .replace(/<\/svg>/, "");
    } catch (_) {
      qrInner = `<rect x="0" y="0" width="120" height="120" fill="#f1f5f9"/><text x="60" y="65" text-anchor="middle" font-size="10">QR</text>`;
    }
  } else {
    qrInner = `<rect x="0" y="0" width="120" height="120" fill="#f1f5f9"/><text x="60" y="65" text-anchor="middle" font-size="10">QR</text>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1050 600" width="1050" height="600">
  <rect x="0" y="0" width="350" height="600" fill="${brand.brand.primaryColor}"/>
  <text x="175" y="280" text-anchor="middle" fill="white" font-family="${brand.brand.fontFamily}" font-size="48" font-weight="700">${escapeXml(brand.displayName)}</text>
  <text x="175" y="320" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="${brand.brand.fontFamily}" font-size="14">${escapeXml(brand.shortTagline)}</text>

  <rect x="350" y="0" width="700" height="600" fill="white"/>

  <text x="400" y="140" fill="${brand.brand.darkColor}" font-family="${brand.brand.fontFamily}" font-size="42" font-weight="700">${escapeXml(name)}</text>
  ${isLawyer
    ? `<text x="400" y="180" fill="#64748b" font-family="${brand.brand.fontFamily}" font-size="18">Tedbirge.ai Üye Avukatı</text>
       <text x="400" y="205" fill="#94a3b8" font-family="${brand.brand.fontFamily}" font-size="14">Baro Sicil: ${escapeXml(user.baroSicilNo || "—")}</text>`
    : `<text x="400" y="180" fill="#64748b" font-family="${brand.brand.fontFamily}" font-size="18">${escapeXml(getRoleTitle(user.role))}</text>`
  }

  <text x="400" y="290" fill="${brand.brand.darkColor}" font-family="${brand.brand.fontFamily}" font-size="16">📞 ${escapeXml(tel)}</text>
  <text x="400" y="320" fill="${brand.brand.darkColor}" font-family="${brand.brand.fontFamily}" font-size="16">✉️ ${escapeXml(user.email || "")}</text>
  <text x="400" y="350" fill="${brand.brand.darkColor}" font-family="${brand.brand.fontFamily}" font-size="16">🌐 ${escapeXml(brand.website.shortLink)}</text>

  <text x="400" y="410" fill="#64748b" font-family="${brand.brand.fontFamily}" font-size="13">${escapeXml(brand.address.fullAddress)}</text>

  <g transform="translate(870, 410)">
    ${qrInner}
  </g>
  <text x="930" y="555" text-anchor="middle" fill="#94a3b8" font-family="${brand.brand.fontFamily}" font-size="10">vCard</text>

  ${isLawyer ? `<text x="400" y="570" fill="#cbd5e1" font-family="${brand.brand.fontFamily}" font-size="9">Avukatlık K. m.55 ve TBB Reklam Yasağı'na uygundur.</text>` : ""}
</svg>`;
}

/**
 * Broşür SVG (A5 1240×1748 @ 150dpi) — sadece Tedbirge.ai marka
 */
async function generateBrosurSVG() {
  const brand = loadBrand();
  const valueProps = (brand.marketing.valueProps || []).slice(0, 4);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1240 1748" width="1240" height="1748">
  <rect x="0" y="0" width="1240" height="1748" fill="white"/>

  <rect x="0" y="0" width="1240" height="400" fill="${brand.brand.primaryColor}"/>
  <text x="620" y="180" text-anchor="middle" fill="white" font-family="${brand.brand.fontFamily}" font-size="80" font-weight="700">${escapeXml(brand.displayName)}</text>
  <text x="620" y="240" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="${brand.brand.fontFamily}" font-size="32">${escapeXml(brand.tagline)}</text>
  <text x="620" y="310" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="${brand.brand.fontFamily}" font-size="22">${escapeXml(brand.shortTagline)}</text>

  <text x="620" y="500" text-anchor="middle" fill="${brand.brand.darkColor}" font-family="${brand.brand.fontFamily}" font-size="36" font-weight="600">Neden ${escapeXml(brand.displayName)}?</text>
  ${valueProps.map((vp, i) => `
    <text x="80" y="${600 + i * 60}" fill="${brand.brand.darkColor}" font-family="${brand.brand.fontFamily}" font-size="22">✓ ${escapeXml(vp)}</text>
  `).join("")}

  <rect x="120" y="900" width="1000" height="120" rx="12" fill="${brand.brand.accentColor}"/>
  <text x="620" y="970" text-anchor="middle" fill="white" font-family="${brand.brand.fontFamily}" font-size="36" font-weight="600">${escapeXml(brand.marketing.ctaPrimary)}</text>
  <text x="620" y="1000" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="${brand.brand.fontFamily}" font-size="20">${escapeXml(brand.website.shortLink)}</text>

  <text x="620" y="1200" text-anchor="middle" fill="${brand.brand.darkColor}" font-family="${brand.brand.fontFamily}" font-size="28" font-weight="600">Bize Ulaşın</text>
  <text x="620" y="1260" text-anchor="middle" fill="${brand.brand.darkColor}" font-family="${brand.brand.fontFamily}" font-size="22">📞 ${escapeXml(brand.contact.callCenter)}</text>
  <text x="620" y="1300" text-anchor="middle" fill="${brand.brand.darkColor}" font-family="${brand.brand.fontFamily}" font-size="22">✉️ ${escapeXml(brand.contact.emails.general)}</text>

  <text x="620" y="1400" text-anchor="middle" fill="#64748b" font-family="${brand.brand.fontFamily}" font-size="18">📍 ${escapeXml(brand.address.fullAddress)}</text>

  <rect x="0" y="1648" width="1240" height="100" fill="${brand.brand.darkColor}"/>
  <text x="620" y="1700" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="${brand.brand.fontFamily}" font-size="14">${escapeXml(brand.compliance.kvkk)} · ${escapeXml(brand.compliance.iso27001)}</text>
  <text x="620" y="1725" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-family="${brand.brand.fontFamily}" font-size="12">© ${new Date().getFullYear()} ${escapeXml(brand.legalName)}</text>
</svg>`;
}

/**
 * Reklam görseli (3 boyut) — sosyal medya
 * Madde 25.3 — sadece Tedbirge marka, avukat ismi YOK
 */
async function generateReklamGorseliSVG(format = "square", text = null) {
  const brand = loadBrand();
  const dimensions = {
    square: { w: 1080, h: 1080 },
    portrait: { w: 1080, h: 1350 },
    landscape: { w: 1200, h: 628 },
  };
  const { w, h } = dimensions[format] || dimensions.square;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${brand.brand.primaryColor}"/>
      <stop offset="100%" stop-color="${brand.brand.primaryColorHover}"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${w}" height="${h}" fill="url(#bg)"/>

  <text x="${w / 2}" y="${h * 0.4}" text-anchor="middle" fill="white" font-family="${brand.brand.fontFamily}" font-size="${w * 0.08}" font-weight="700">${escapeXml(brand.displayName)}</text>
  <text x="${w / 2}" y="${h * 0.5}" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="${brand.brand.fontFamily}" font-size="${w * 0.035}">${escapeXml(text || brand.shortTagline)}</text>

  <rect x="${w * 0.2}" y="${h * 0.65}" width="${w * 0.6}" height="${h * 0.1}" rx="8" fill="${brand.brand.accentColor}"/>
  <text x="${w / 2}" y="${h * 0.71}" text-anchor="middle" fill="white" font-family="${brand.brand.fontFamily}" font-size="${w * 0.04}" font-weight="600">${escapeXml(brand.marketing.ctaPrimary)}</text>

  <text x="${w / 2}" y="${h * 0.92}" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="${brand.brand.fontFamily}" font-size="${w * 0.025}">${escapeXml(brand.website.shortLink)}</text>
</svg>`;
}

/**
 * Email HTML imzası
 */
async function generateEmailImzasi(user) {
  const brand = loadBrand();
  const isLawyer = user.role === "LAWYER";
  const name = user.fullName || user.adSoyad || user.name || "";
  const tel = user.phone || user.telefon || brand.contact.callCenter;

  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: ${brand.brand.fontFamily}; color: ${brand.brand.darkColor}; font-size: 14px;">
  <tr>
    <td style="padding-right: 20px; border-right: 3px solid ${brand.brand.primaryColor};">
      <strong style="font-size: 18px; color: ${brand.brand.primaryColor};">${escapeHtml(name)}</strong><br>
      <span style="color: #64748b; font-size: 13px;">
        ${isLawyer ? `Tedbirge.ai Üye Avukatı${user.baroSicilNo ? " · Baro Sicil: " + escapeHtml(user.baroSicilNo) : ""}` : escapeHtml(getRoleTitle(user.role))}
      </span>
    </td>
    <td style="padding-left: 20px; font-size: 13px; color: #64748b;">
      📞 ${escapeHtml(tel)}<br>
      ✉️ <a href="mailto:${escapeHtml(user.email || "")}" style="color: ${brand.brand.primaryColor}; text-decoration: none;">${escapeHtml(user.email || "")}</a><br>
      🌐 <a href="${brand.website.primary}" style="color: ${brand.brand.primaryColor}; text-decoration: none;">${escapeHtml(brand.website.shortLink)}</a>
    </td>
  </tr>
  ${isLawyer ? `<tr><td colspan="2" style="padding-top: 12px; font-size: 10px; color: #cbd5e1;">${escapeHtml(brand.compliance.tbbReklamYasagi)}</td></tr>` : ""}
</table>`;
}

/**
 * SVG → PNG (sharp varsa)
 */
async function svgToPng(svgString) {
  if (!sharp) {
    const err = new Error("PNG dönüşümü için sharp paketi gerekli (Madde 24.14 — opsiyonel). SVG indirmeyi tercih edin.");
    err.statusCode = 503;
    err.code = "PNG_UNAVAILABLE";
    throw err;
  }
  return await sharp(Buffer.from(svgString)).png().toBuffer();
}

module.exports = {
  generateKartvizitSVG,
  generateBrosurSVG,
  generateReklamGorseliSVG,
  generateEmailImzasi,
  generateVCard,
  svgToPng,
  hasPng: !!sharp,
  hasQR: !!qrcode,
};
