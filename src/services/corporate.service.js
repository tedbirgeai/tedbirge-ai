// TUR #100.9 P8 — Kurumsal Üretim Servisi (Madde 34) — Sıfır Maliyet (Madde 24.14)
// TUR #112 — Premium Kartvizit (Madde 30.65): UTF-8 + font embed + 5 format + on/arka + reklam editor
// Server-side SVG template (vanilla) + qrcode + pdfkit (PDF) + opsiyonel sharp (PNG)

"use strict";

const fs = require("fs");
const path = require("path");
const { loadBrand } = require("../routes/brand.routes");

// Opsiyonel paketler
let sharp = null;
try { sharp = require("sharp"); } catch (e) { /* SVG-only mode */ }

let qrcode = null;
try { qrcode = require("qrcode"); } catch (e) { /* SVG fallback QR */ }

let PDFDocument = null;
try { PDFDocument = require("pdfkit"); } catch (e) { /* PDF YOK */ }

// ─── Font Pipeline (TUR #112 HOTFIX — Madde 30.65) ───────────────────
// Variable font (full Latin Extended-A glyph coverage — Turkce destegi)
// Eski jsdelivr latin-400 subset Turkce karakter ihlali (S/G/I) icin VF'ye gecildi.
const FONTS_DIR = path.join(__dirname, "..", "..", "tedbirge-os", "assets", "fonts");
const FONT_FILES = {
  interRegular: "InterTight-VF.ttf",
  interMedium: "InterTight-VF.ttf",
  interBold: "InterTight-VF.ttf",
  crimsonRegular: "CrimsonPro-VF.ttf",
  crimsonSemiBold: "CrimsonPro-VF.ttf",
  crimsonBold: "CrimsonPro-VF.ttf",
  monoRegular: "JetBrainsMono-VF.ttf",
};

const fontBase64Cache = {};
function getFontBase64(key) {
  if (fontBase64Cache[key] !== undefined) return fontBase64Cache[key];
  const fname = FONT_FILES[key];
  if (!fname) return null;
  try {
    const buf = fs.readFileSync(path.join(FONTS_DIR, fname));
    fontBase64Cache[key] = buf.toString("base64");
    return fontBase64Cache[key];
  } catch (_) {
    fontBase64Cache[key] = null;
    return null;
  }
}

function getFontPath(key) {
  const fname = FONT_FILES[key];
  if (!fname) return null;
  const p = path.join(FONTS_DIR, fname);
  return fs.existsSync(p) ? p : null;
}

function svgFontFaceBlock() {
  // SVG offline render icin variable TTF base64 embed (Madde 30.65 HOTFIX)
  // 3 aile - her biri tek @font-face wght 100-900 range (variable font format)
  const fonts = [
    { family: "Inter Tight", key: "interRegular" },     // VF: weight 100-900
    { family: "Crimson Pro", key: "crimsonRegular" },   // VF: weight 200-900
    { family: "JetBrains Mono", key: "monoRegular" },   // VF: weight 100-800
  ];
  const rules = [];
  for (const f of fonts) {
    const b64 = getFontBase64(f.key);
    if (!b64) continue;
    rules.push(`@font-face { font-family: '${f.family}'; font-weight: 100 900; font-style: normal; src: url(data:font/ttf;base64,${b64}) format('truetype-variations'), url(data:font/ttf;base64,${b64}) format('truetype'); }`);
  }
  if (!rules.length) return "";
  return `<defs><style type="text/css">${rules.join("\n")}</style></defs>`;
}

// ─── Helpers ─────────────────────────────────────────────────────────
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
    ADMIN: "Yonetici",
    LAWYER: "Avukat",
    REPRESENTATIVE: "Temsilci",
    CUSTOMER: "Muvekkil",
    SALES: "Satis Temsilcisi",
  };
  return titles[role] || "";
}

function wrapText(text, charsPerLine, maxLines) {
  if (!text) return [];
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length <= charsPerLine) {
      current = (current + " " + w).trim();
    } else {
      if (current) lines.push(current);
      current = w;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines.slice(0, maxLines);
}

function buildUserAddressLine(user, brand) {
  // TUR #116 + #117 — Adres oncelik 5 seviye (Madde 30.71 + 30.73)
  // country yabanci (Almanya vb.) ise sonuna eklenir, "Türkiye" gizlenir (implicit)
  // 1. user.address (+ district + city) — tam adres
  // 2. user.city (+ district) — sehir ve ilce
  // 3. user.bolge — geriye uyumluluk (Madde 4.6 TUR #115 emsali)
  // 4. brand.address.fullAddress — kurumsal fallback
  const country = user.country && user.country.trim();
  const foreignCountry = country && country !== "Türkiye";
  let line = "";
  if (user.address) {
    const parts = [user.address];
    if (user.district) parts.push(user.district);
    if (user.city) parts.push(user.city);
    line = parts.join(", ");
  } else if (user.city) {
    line = user.district ? `${user.district}, ${user.city}` : user.city;
  } else if (user.bolge) {
    line = user.bolge;
  } else {
    line = brand.address.fullAddress;
  }
  return foreignCountry ? `${line}, ${country}` : line;
}

// TUR #117 — Turk telefon standart format helper (Madde 30.74 Standart Format Disiplini)
// "5454903395" -> "0 545 490 33 95"
// "05454903395" -> "0 545 490 33 95"
// "905454903395" -> "+90 545 490 33 95"
// "+905454903395" -> "+90 545 490 33 95"
function formatTurkishPhone(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) {
    return `0 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return `0 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
  }
  if (digits.length === 12 && digits.startsWith("90")) {
    return `+90 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
  }
  return String(phone).trim();
}

function generateVCard(user, brand) {
  const name = user.fullName || user.adSoyad || user.name || "";
  const tel = user.phone || user.telefon || brand.contact.callCenter;
  // TUR #116 — vCard ADR yapilandirilmis (street;district;city;postal;country)
  // Backward compat: tek satir address line ek olarak X-FULL-ADDRESS
  const adrStruct = `ADR:;;${user.address || ""};${user.city || ""};${user.district || ""};${user.postalCode || ""};Turkiye`;
  const addressLine = buildUserAddressLine(user, brand);
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${name}`,
    `TEL;TYPE=CELL:${tel}`,
    `EMAIL:${user.email}`,
    `URL:${brand.website.primary}`,
    // RFC 6350: ADR yapilandirilmis 7 alanli (pobox;ext;street;locality;region;code;country)
    user.address || user.city ? adrStruct : `ADR:;;${addressLine}`,
    `ORG:${brand.displayName}`,
    user.role === "LAWYER" ? "TITLE:Tedbirge.ai Uye Avukati" : "",
    "END:VCARD",
  ].filter(Boolean).join("\n");
}

async function generateQRInner(text, size) {
  if (qrcode) {
    try {
      const qrSvg = await qrcode.toString(text, { type: "svg", width: size, margin: 0, errorCorrectionLevel: "M" });
      return qrSvg
        .replace(/<\?xml.*?\?>/, "")
        .replace(/<svg[^>]*>/, "")
        .replace(/<\/svg>/, "");
    } catch (_) {}
  }
  return `<rect width="${size}" height="${size}" fill="#f1f5f9"/><text x="${size/2}" y="${size/2+4}" text-anchor="middle" font-size="10">QR</text>`;
}

// ─── ATOM 3: Premium On Yuz SVG ──────────────────────────────────────
/**
 * Premium kartvizit on yuz (Madde 30.65)
 * 850x550 viewBox (85mm x 55mm @ 10x)
 * Sol panel: #1e1e8e lacivert + Tedbirge logo + tedbirator label
 * Sag panel: beyaz + isim/iletisim/QR
 * LAWYER: sadece isim + Baro Sicil + iletisim + m.55 footer (Madde 25.3)
 */
async function generateKartvizitSVG(user) {
  const brand = loadBrand();
  const isLawyer = user.role === "LAWYER";
  const name = user.fullName || user.adSoyad || user.name || "";
  const tel = user.phone || user.telefon || brand.contact.callCenter;
  const tedbirator = brand.secondary?.tedbirator;
  const fontFace = svgFontFaceBlock();
  const primary = brand.brand.primaryColor || "#1e1e8e";
  const tedbiratorColor = tedbirator?.color || "#5cb85c";

  const vcard = generateVCard(user, brand);
  const qrInner = await generateQRInner(vcard, 100);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 550" width="850" height="550">
  ${fontFace}
  <!-- Sol panel: Tedbirge marka — TUR #112 mikro hotfix #2: spacing yayildi -->
  <rect x="0" y="0" width="360" height="550" fill="${primary}"/>
  <text x="180" y="230" text-anchor="middle" fill="white" font-family="'Inter Tight', Inter, system-ui, sans-serif" font-weight="700" font-size="40">${escapeXml(brand.displayName)}</text>
  ${tedbirator ? `<text x="180" y="285" text-anchor="middle" fill="${tedbiratorColor}" font-family="'Crimson Pro', Georgia, serif" font-weight="400" font-style="italic" font-size="20">${escapeXml(tedbirator.name)}</text>` : ""}
  <line x1="80" y1="312" x2="280" y2="312" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>
  <text x="180" y="350" text-anchor="middle" fill="rgba(255,255,255,0.78)" font-family="'Inter Tight', Inter, system-ui, sans-serif" font-size="13">${escapeXml(brand.shortTagline)}</text>

  <!-- Sag panel: kullanici -->
  <rect x="360" y="0" width="490" height="550" fill="white"/>

  <!-- Isim -->
  <text x="400" y="155" fill="${primary}" font-family="'Crimson Pro', Georgia, serif" font-weight="700" font-size="32">${escapeXml(name)}</text>

  <!-- Rol -->
  ${isLawyer
    ? `<text x="400" y="185" fill="#6b7280" font-family="'Inter Tight', Inter, system-ui, sans-serif" font-weight="600" font-size="13">Tedbirge.ai Uye Avukati</text>
       <text x="400" y="208" fill="#9ca3af" font-family="'Inter Tight', Inter, system-ui, sans-serif" font-size="11">Baro Sicil: ${escapeXml(user.baroSicilNo || "—")}</text>`
    : `<text x="400" y="185" fill="#6b7280" font-family="'Inter Tight', Inter, system-ui, sans-serif" font-weight="600" font-size="13">${escapeXml(getRoleTitle(user.role))}</text>`
  }

  <!-- Hairline ayirici -->
  <line x1="400" y1="232" x2="700" y2="232" stroke="#e7e7ef" stroke-width="1"/>

  <!-- Iletisim — TUR #117: Lucide vector ikon (PDF uyumlu) + telefon Turk standart format (Madde 30.74) -->
  <g transform="translate(400, 263)" stroke="#1e1e8e" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" transform="scale(0.55)"/>
  </g>
  <text x="425" y="275" fill="#111827" font-family="'JetBrains Mono', ui-monospace, SFMono-Regular, monospace" font-size="14">${escapeXml(formatTurkishPhone(tel))}</text>

  <g transform="translate(400, 290)" stroke="#1e1e8e" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <rect x="1" y="2.2" width="12" height="9" rx="1.1"/>
    <polyline points="13,3.3 7,8 1,3.3"/>
  </g>
  <text x="425" y="302" fill="#111827" font-family="'JetBrains Mono', ui-monospace, SFMono-Regular, monospace" font-size="14">${escapeXml(user.email || "")}</text>

  <g transform="translate(400, 317)" stroke="#1e1e8e" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="7" cy="7" r="6"/>
    <line x1="1" y1="7" x2="13" y2="7"/>
    <path d="M7 1 a8 8 0 0 1 2.5 6 a8 8 0 0 1 -2.5 6 a8 8 0 0 1 -2.5 -6 a8 8 0 0 1 2.5 -6 z"/>
  </g>
  <text x="425" y="329" fill="#111827" font-family="'JetBrains Mono', ui-monospace, SFMono-Regular, monospace" font-size="14">${escapeXml(brand.website.shortLink)}</text>

  <!-- Adres — TUR #116: address+district+city -> city -> bolge -> brand oncelik (Madde 30.71) -->
  <text x="400" y="380" fill="#6b7280" font-family="'Inter Tight', Inter, system-ui, sans-serif" font-size="11">${escapeXml(buildUserAddressLine(user, brand))}</text>

  <!-- QR vCard (sag alt, cerceveli) -->
  <g transform="translate(720, 380)">
    <rect x="-6" y="-6" width="112" height="112" fill="white" stroke="#e7e7ef" stroke-width="1"/>
    ${qrInner}
  </g>
  <text x="770" y="512" text-anchor="middle" fill="#9ca3af" font-family="'Inter Tight', Inter, system-ui, sans-serif" font-size="9">vCard — Telefona Kaydet</text>

  <!-- LAWYER m.55 disclaimer (Madde 25.3) -->
  ${isLawyer ? `<text x="400" y="535" fill="#cbd5e1" font-family="'Inter Tight', Inter, system-ui, sans-serif" font-style="italic" font-size="9">Avukatlik K. m.55 ve TBB Reklam Yasagi'na uygundur.</text>` : ""}
</svg>`;
}

// ─── ATOM 4: Premium Arka Yuz SVG ────────────────────────────────────
/**
 * Premium arka yuz (Madde 30.65)
 * Full bleed lacivert + 2 diyagonal yesil aksent + buyuk logo + slogan + reklam metni
 * LAWYER icin endpoint 403 doner (corporate.routes.js)
 * adContent: temsilcinin reklam metni (max 200 char)
 */
async function generateKartvizitBackSVG(user, adContent) {
  const brand = loadBrand();
  const fontFace = svgFontFaceBlock();
  const primary = brand.brand.primaryColor || "#1e1e8e";
  const accent = brand.secondary?.tedbirator?.color || brand.brand.accentColor || "#5cb85c";
  const slogan = brand.marketing?.defaultBackTagline || "Hak ettiginiz tazminat icin on degerlendirme";
  const customAd = (typeof adContent === "string" && adContent.trim())
    ? adContent.trim().slice(0, 200)
    : "";
  // TUR #118.1 hotfix — Reklam metni QR kod cakismasi: 60 char/3 satir -> 45 char/3 satir + sol hizali
  const adLines = customAd ? wrapText(customAd, 45, 3) : [];

  // QR — kullaniciya ozel basvuru linki
  const repCode = (user.id || "").toString().slice(0, 8);
  const refUrl = `${brand.website.primary}/baslat?ref=${encodeURIComponent(repCode)}`;
  const qrInner = await generateQRInner(refUrl, 100);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 550" width="850" height="550">
  ${fontFace}
  <!-- Full bleed lacivert -->
  <rect x="0" y="0" width="850" height="550" fill="${primary}"/>

  <!-- Diyagonal yesil aksent cubuklar -->
  <g opacity="0.9">
    <polygon points="0,0 80,0 0,80" fill="${accent}"/>
    <polygon points="850,550 770,550 850,470" fill="${accent}"/>
  </g>

  <!-- Merkez buyuk logo + slogan — TUR #112 mikro hotfix #2: spacing yayildi -->
  <text x="425" y="220" text-anchor="middle" fill="white" font-family="'Inter Tight', Inter, system-ui, sans-serif" font-weight="700" font-size="64">${escapeXml(brand.displayName)}</text>
  <text x="425" y="290" text-anchor="middle" fill="white" font-family="'Crimson Pro', Georgia, serif" font-weight="400" font-style="italic" font-size="22">${escapeXml(slogan)}</text>

  <!-- Reklam metni (varsa) — TUR #118.1: sol hizali, QR (x=700+) ile cakismaz, dikey biraz yukari -->
  ${adLines.map((line, i) => `<text x="50" y="${340 + i * 22}" text-anchor="start" fill="rgba(255,255,255,0.92)" font-family="'Inter Tight', Inter, system-ui, sans-serif" font-size="13">${escapeXml(line)}</text>`).join("\n  ")}

  <!-- QR sag alt (basvuru linki) -->
  <g transform="translate(700, 410)">
    <rect x="-6" y="-6" width="112" height="112" fill="white" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
    ${qrInner}
  </g>
  <text x="750" y="540" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-family="'Inter Tight', Inter, system-ui, sans-serif" font-size="10">QR ile basvuru</text>

  <!-- Alt: web -->
  <text x="40" y="525" fill="white" font-family="'Inter Tight', Inter, system-ui, sans-serif" font-weight="700" font-size="14">${escapeXml(brand.website.primary.replace(/^https?:\/\//, ""))}</text>
</svg>`;
}

// ─── Brosur SVG (mevcut — TUR #100.9 korunur) ────────────────────────
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
  ${valueProps.map((vp, i) => `<text x="80" y="${600 + i * 60}" fill="${brand.brand.darkColor}" font-family="${brand.brand.fontFamily}" font-size="22">- ${escapeXml(vp)}</text>`).join("")}
  <rect x="120" y="900" width="1000" height="120" rx="12" fill="${brand.brand.accentColor}"/>
  <text x="620" y="970" text-anchor="middle" fill="white" font-family="${brand.brand.fontFamily}" font-size="36" font-weight="600">${escapeXml(brand.marketing.ctaPrimary)}</text>
  <text x="620" y="1000" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="${brand.brand.fontFamily}" font-size="20">${escapeXml(brand.website.shortLink)}</text>
  <text x="620" y="1200" text-anchor="middle" fill="${brand.brand.darkColor}" font-family="${brand.brand.fontFamily}" font-size="28" font-weight="600">Bize Ulasin</text>
  <text x="620" y="1260" text-anchor="middle" fill="${brand.brand.darkColor}" font-family="${brand.brand.fontFamily}" font-size="22">${escapeXml(brand.contact.callCenter)}</text>
  <text x="620" y="1300" text-anchor="middle" fill="${brand.brand.darkColor}" font-family="${brand.brand.fontFamily}" font-size="22">${escapeXml(brand.contact.emails.general)}</text>
  <text x="620" y="1400" text-anchor="middle" fill="#64748b" font-family="${brand.brand.fontFamily}" font-size="18">${escapeXml(brand.address.fullAddress)}</text>
  <rect x="0" y="1648" width="1240" height="100" fill="${brand.brand.darkColor}"/>
  <text x="620" y="1700" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="${brand.brand.fontFamily}" font-size="14">${escapeXml(brand.compliance.kvkk)} - ${escapeXml(brand.compliance.iso27001)}</text>
  <text x="620" y="1725" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-family="${brand.brand.fontFamily}" font-size="12">(c) ${new Date().getFullYear()} ${escapeXml(brand.legalName)}</text>
</svg>`;
}

// ─── Reklam Gorseli (mevcut — TUR #100.9 korunur) ────────────────────
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

// ─── Email imzasi (mevcut korunur) ───────────────────────────────────
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
        ${isLawyer ? `Tedbirge.ai Uye Avukati${user.baroSicilNo ? " - Baro Sicil: " + escapeHtml(user.baroSicilNo) : ""}` : escapeHtml(getRoleTitle(user.role))}
      </span>
    </td>
    <td style="padding-left: 20px; font-size: 13px; color: #64748b;">
      ${escapeHtml(tel)}<br>
      <a href="mailto:${escapeHtml(user.email || "")}" style="color: ${brand.brand.primaryColor}; text-decoration: none;">${escapeHtml(user.email || "")}</a><br>
      <a href="${brand.website.primary}" style="color: ${brand.brand.primaryColor}; text-decoration: none;">${escapeHtml(brand.website.shortLink)}</a>
    </td>
  </tr>
  ${isLawyer ? `<tr><td colspan="2" style="padding-top: 12px; font-size: 10px; color: #cbd5e1;">${escapeHtml(brand.compliance.tbbReklamYasagi)}</td></tr>` : ""}
</table>`;
}

// ─── ATOM 6: Matbaa PDF (font embed + bleed + trim marks) ────────────
/**
 * Matbaa baski PDF (Madde 30.65)
 * 92mm x 62mm (85+3.5mm bleed her kenardan)
 * 2 sayfa: on yuz + arka yuz
 * Font embed: pdfkit registerFont (Inter Tight + Crimson Pro + JetBrains Mono)
 * Trim marks: 4 kose, lineWidth 0.25, L-sekli
 */
async function generateKartvizitMatbaaPDF(user, adContent) {
  if (!PDFDocument) {
    const err = new Error("PDF üretimi için pdfkit gerekli.");
    err.statusCode = 503; err.code = "PDF_UNAVAILABLE"; throw err;
  }
  const brand = loadBrand();
  const print = brand.print || { cardSizeMM: { w: 85, h: 55 }, bleedMM: 3.5, trimMarks: true };
  const tedbirator = brand.secondary?.tedbirator;
  const isLawyer = user.role === "LAWYER";
  const name = user.fullName || user.adSoyad || user.name || "";
  const tel = user.phone || user.telefon || brand.contact.callCenter;

  const mm = (v) => v * 2.834645669;
  const cardW = mm(print.cardSizeMM.w);
  const cardH = mm(print.cardSizeMM.h);
  const bleed = mm(print.bleedMM);
  const fullW = cardW + bleed * 2;
  const fullH = cardH + bleed * 2;

  const primary = brand.brand.primaryColor || "#1e1e8e";
  const tedbiratorColor = tedbirator?.color || "#5cb85c";
  const dark = brand.brand.darkColor || "#0A1628";

  const doc = new PDFDocument({ size: [fullW, fullH], margin: 0, autoFirstPage: true, compress: true });
  registerPdfFonts(doc);

  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  // === ON YUZ ===
  drawCardFront(doc, { bleed, cardW, cardH, primary, tedbiratorColor, tedbirator, brand, user, name, tel, isLawyer, dark });
  if (print.trimMarks) drawTrimMarks(doc, bleed, fullW, fullH);

  // === ARKA YUZ ===
  doc.addPage({ size: [fullW, fullH], margin: 0 });
  await drawCardBack(doc, { bleed, cardW, cardH, primary, tedbiratorColor, brand, user, adContent });
  if (print.trimMarks) drawTrimMarks(doc, bleed, fullW, fullH);

  doc.end();
  return done;
}

// ─── ATOM 7: Dijital Paylasim PDF (email/WhatsApp uyumlu) ────────────
/**
 * Dijital paylasim PDF (Madde 30.65)
 * 85x55mm (LAWYER: 85x55 tek sayfa on yuz) veya 170x55mm (on + arka yan yana)
 * Bleed YOK, trim marks YOK, compress aktif (<500KB hedef)
 * LAWYER: sadece on yuz (Madde 25.3 — arka reklam YASAK)
 */
async function generateKartvizitDigitalPDF(user, adContent) {
  if (!PDFDocument) {
    const err = new Error("PDF üretimi için pdfkit gerekli.");
    err.statusCode = 503; err.code = "PDF_UNAVAILABLE"; throw err;
  }
  const brand = loadBrand();
  const tedbirator = brand.secondary?.tedbirator;
  const isLawyer = user.role === "LAWYER";
  const name = user.fullName || user.adSoyad || user.name || "";
  const tel = user.phone || user.telefon || brand.contact.callCenter;

  const mm = (v) => v * 2.834645669;
  const cardW = mm(85);
  const cardH = mm(55);
  const fullW = isLawyer ? cardW : cardW * 2;
  const fullH = cardH;

  const primary = brand.brand.primaryColor || "#1e1e8e";
  const tedbiratorColor = tedbirator?.color || "#5cb85c";
  const dark = brand.brand.darkColor || "#0A1628";

  const doc = new PDFDocument({ size: [fullW, fullH], margin: 0, autoFirstPage: true, compress: true });
  registerPdfFonts(doc);

  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  // ON YUZ (sol)
  drawCardFront(doc, { bleed: 0, cardW, cardH, primary, tedbiratorColor, tedbirator, brand, user, name, tel, isLawyer, dark });

  // ARKA YUZ (sag, LAWYER hariç)
  if (!isLawyer) {
    doc.save();
    doc.translate(cardW, 0);
    await drawCardBack(doc, { bleed: 0, cardW, cardH, primary, tedbiratorColor, brand, user, adContent });
    doc.restore();
  }

  doc.end();
  return done;
}

function registerPdfFonts(doc) {
  // pdfkit registerFont (HOTFIX) — variable font dosyalari, 7 alias aynı dosyayı paylaşır
  // Bold/Regular ayrımı görsel pdfkit'te variable axis desteklemediği için Regular default render olur
  // Türkçe karakter coverage 17/17 doğrulandı — visual ayrım > Türkçe karakter trade-off Madde 30.65
  const map = {
    "Inter-Regular": "interRegular",
    "Inter-Medium": "interMedium",
    "Inter-Bold": "interBold",
    "Crimson-Regular": "crimsonRegular",
    "Crimson-SemiBold": "crimsonSemiBold",
    "Crimson-Bold": "crimsonBold",
    "Mono": "monoRegular",
  };
  for (const [alias, key] of Object.entries(map)) {
    const p = getFontPath(key);
    if (p) {
      try { doc.registerFont(alias, p); } catch (_) {}
    }
  }
}

function drawCardFront(doc, ctx) {
  // TUR #112 MIKRO HOTFIX — Variable font metrics nedeniyle satir araliklari yayildi
  // 8/15/18.5/23/27/30/33/40 -> 8/16/20/25/30/34/38/43 mm (toplam +30% spacing)
  const { bleed, cardW, cardH, primary, tedbiratorColor, tedbirator, brand, user, name, tel, isLawyer, dark } = ctx;
  const mm = (v) => v * 2.834645669;
  const leftW = cardW * (360 / 850); // 360/850 oran

  // Sol panel
  doc.rect(0, 0, leftW + bleed, bleed * 2 + cardH).fill(primary);

  // TUR #112 mikro hotfix #2 — sol panel Tedbirge.ai alti spacing yayildi
  // -9/-3/+3/+6 -> -13/-4/+5/+11 (toplam 23mm range, +12pt Tedbirge->tedbirator, +18pt tedbirator->slogan)
  doc.fillColor("white");
  trySetFont(doc, "Inter-Bold", "Helvetica-Bold").fontSize(16);
  doc.text(brand.displayName, bleed, bleed + cardH / 2 - mm(13), { width: leftW, align: "center", lineBreak: false });

  if (tedbirator) {
    doc.fillColor(tedbiratorColor);
    trySetFont(doc, "Crimson-Regular", "Times-Italic").fontSize(9);
    doc.text(tedbirator.name, bleed, bleed + cardH / 2 - mm(4), { width: leftW, align: "center", lineBreak: false });
  }

  // Hairline
  doc.strokeColor("rgba(255,255,255,0.18)").lineWidth(0.3);
  doc.moveTo(bleed + leftW * 0.22, bleed + cardH / 2 + mm(5)).lineTo(bleed + leftW * 0.78, bleed + cardH / 2 + mm(5)).stroke();

  doc.fillColor("white");
  trySetFont(doc, "Inter-Regular", "Helvetica").fontSize(6);
  doc.text(brand.shortTagline || "", bleed, bleed + cardH / 2 + mm(11), { width: leftW, align: "center", lineBreak: false });

  // Sag panel: beyaz (bleed alaninda sag) — kart beyaz arkaplani
  doc.rect(leftW + bleed, 0, cardW - leftW + bleed, bleed * 2 + cardH).fill("white");

  const rx = bleed + leftW + mm(4);

  // Isim
  doc.fillColor(primary);
  trySetFont(doc, "Crimson-Bold", "Times-Bold").fontSize(15);
  doc.text(name, rx, bleed + mm(8), { width: cardW - leftW - mm(8), lineBreak: false });

  // Rol (8 -> 16, +1mm)
  doc.fillColor("#6b7280");
  trySetFont(doc, "Inter-Medium", "Helvetica-Bold").fontSize(7);
  if (isLawyer) {
    doc.text("Tedbirge.ai Uye Avukati", rx, bleed + mm(16), { lineBreak: false });
    doc.fillColor("#9ca3af").fontSize(6);
    doc.text(`Baro Sicil: ${user.baroSicilNo || "—"}`, rx, bleed + mm(20), { lineBreak: false });
  } else {
    doc.text(getRoleTitle(user.role), rx, bleed + mm(16), { lineBreak: false });
  }

  // Hairline (23 -> 25, +2mm)
  doc.strokeColor("#e7e7ef").lineWidth(0.3);
  doc.moveTo(rx, bleed + mm(25)).lineTo(bleed + cardW - mm(4), bleed + mm(25)).stroke();

  // Iletisim (mono) — TUR #117: telefon Turk standart format (Madde 30.74)
  // PDF emoji desteklemez, ikon SVG'de. Burada formatlı telefon yeterli matbaa baski icin.
  doc.fillColor("#111827");
  trySetFont(doc, "Mono", "Courier").fontSize(7);
  doc.text(formatTurkishPhone(tel), rx, bleed + mm(30), { lineBreak: false });
  doc.text(user.email || "", rx, bleed + mm(34), { lineBreak: false });
  doc.text(brand.website.shortLink, rx, bleed + mm(38), { lineBreak: false });

  // Adres (40 -> 43, +3mm) — TUR #116: 4-level oncelik (Madde 30.71)
  doc.fillColor("#6b7280");
  trySetFont(doc, "Inter-Regular", "Helvetica").fontSize(5);
  const cardAddress = buildUserAddressLine(user, brand) || "";
  doc.text(cardAddress, rx, bleed + mm(43), { width: mm(40), lineBreak: true });

  // LAWYER disclaimer (cardH - 4 -> cardH - 2.5, daha alta kaydirildi)
  if (isLawyer) {
    doc.fillColor("#cbd5e1").fontSize(4);
    doc.text("Avukatlik K. m.55 ve TBB Reklam Yasagi'na uygundur.", rx, bleed + cardH - mm(2.5), { lineBreak: false });
  }
}

async function drawCardBack(doc, ctx) {
  const { bleed, cardW, cardH, primary, tedbiratorColor, brand, user, adContent } = ctx;
  const mm = (v) => v * 2.834645669;

  // Full bleed lacivert
  doc.rect(0, 0, bleed * 2 + cardW, bleed * 2 + cardH).fill(primary);

  // Diyagonal aksent kose
  doc.save().fillColor(tedbiratorColor).opacity(0.9);
  doc.moveTo(0, 0).lineTo(mm(10), 0).lineTo(0, mm(10)).closePath().fill();
  doc.moveTo(bleed * 2 + cardW, bleed * 2 + cardH).lineTo(bleed * 2 + cardW - mm(10), bleed * 2 + cardH).lineTo(bleed * 2 + cardW, bleed * 2 + cardH - mm(10)).closePath().fill();
  doc.restore().opacity(1);

  // TUR #112 mikro hotfix #2 — Tedbirge.ai alti spacing yayildi
  // logo -10/-3/+4 -> -14/+3/+10 (Tedbirge -> slogan +20pt fark)
  doc.fillColor("white");
  trySetFont(doc, "Inter-Bold", "Helvetica-Bold").fontSize(22);
  doc.text(brand.displayName, bleed, bleed + cardH / 2 - mm(14), { width: cardW, align: "center", lineBreak: false });

  // Slogan (lineGap eklendi VF metrics icin)
  trySetFont(doc, "Crimson-Regular", "Times-Italic").fontSize(8);
  const slogan = brand.marketing?.defaultBackTagline || brand.shortTagline || "";
  doc.text(slogan, bleed, bleed + cardH / 2 + mm(3), { width: cardW, align: "center", lineBreak: true, lineGap: 1 });

  // TUR #118.1 hotfix — Reklam metni QR kod cakismasi (CEO PDF kanit)
  // QR sag alt 15×15mm + 3mm padding. Metin genisligi: QR soluna kadar.
  // Yeni layout: width = cardW - qrZone(15+3+3) - leftMargin(6) = cardW - 27mm
  // Dikey: cardH/2 + mm(8) (2mm yukari, QR ile 4mm dikey bosluk)
  const qrZoneW = mm(21); // 15mm QR + 3mm padding + 3mm bosluk metin tarafinda
  if (typeof adContent === "string" && adContent.trim()) {
    trySetFont(doc, "Inter-Regular", "Helvetica").fontSize(6);
    doc.text(adContent.trim().slice(0, 200), bleed + mm(6), bleed + cardH / 2 + mm(8), {
      width: cardW - mm(6) - qrZoneW,
      align: "left",
      lineBreak: true,
      lineGap: 1.5,
      ellipsis: true,
    });
  }

  // QR kod (varsa qrcode paketi)
  if (qrcode) {
    try {
      const repCode = (user.id || "").toString().slice(0, 8);
      const refUrl = `${brand.website.primary}/baslat?ref=${encodeURIComponent(repCode)}`;
      const qrPng = await qrcode.toBuffer(refUrl, { type: "png", width: 200, margin: 0, errorCorrectionLevel: "M" });
      const qrSize = mm(15);
      doc.rect(bleed + cardW - qrSize - mm(3), bleed + cardH - qrSize - mm(3), qrSize, qrSize).fill("white");
      doc.image(qrPng, bleed + cardW - qrSize - mm(3), bleed + cardH - qrSize - mm(3), { width: qrSize, height: qrSize });
    } catch (_) {}
  }

  // Web URL alt sol
  doc.fillColor("white");
  trySetFont(doc, "Inter-Bold", "Helvetica-Bold").fontSize(6);
  doc.text(brand.website.primary.replace(/^https?:\/\//, ""), bleed + mm(3), bleed + cardH - mm(4), { lineBreak: false });
}

function trySetFont(doc, primary, fallback) {
  try { return doc.font(primary); } catch (_) {
    try { return doc.font(fallback); } catch (e) { return doc; }
  }
}

function drawTrimMarks(doc, bleed, fullW, fullH) {
  doc.strokeColor("#000000").lineWidth(0.25);
  const len = 6;
  const gap = 2;
  doc.moveTo(bleed - gap, 0).lineTo(bleed - gap, len).stroke();
  doc.moveTo(0, bleed - gap).lineTo(len, bleed - gap).stroke();
  doc.moveTo(fullW - bleed + gap, 0).lineTo(fullW - bleed + gap, len).stroke();
  doc.moveTo(fullW - len, bleed - gap).lineTo(fullW, bleed - gap).stroke();
  doc.moveTo(bleed - gap, fullH - len).lineTo(bleed - gap, fullH).stroke();
  doc.moveTo(0, fullH - bleed + gap).lineTo(len, fullH - bleed + gap).stroke();
  doc.moveTo(fullW - bleed + gap, fullH - len).lineTo(fullW - bleed + gap, fullH).stroke();
  doc.moveTo(fullW - len, fullH - bleed + gap).lineTo(fullW, fullH - bleed + gap).stroke();
}

// ─── SVG -> PNG (sharp varsa) — TUR #112: frontend canvas conversion ─
async function svgToPng(svgString) {
  if (!sharp) {
    const err = new Error("Sunucu-tarafi PNG dönüşümü için sharp gerekli. Frontend canvas conversion kullanin.");
    err.statusCode = 503; err.code = "PNG_UNAVAILABLE"; throw err;
  }
  return await sharp(Buffer.from(svgString)).png().toBuffer();
}

module.exports = {
  generateKartvizitSVG,
  generateKartvizitBackSVG,
  generateKartvizitMatbaaPDF,
  generateKartvizitDigitalPDF,
  generateBrosurSVG,
  generateReklamGorseliSVG,
  generateEmailImzasi,
  generateVCard,
  svgToPng,
  // TUR #117 — smoke icin export (Madde 30.74)
  formatTurkishPhone,
  buildUserAddressLine,
  hasPng: !!sharp,
  hasQR: !!qrcode,
  hasPDF: !!PDFDocument,
};
