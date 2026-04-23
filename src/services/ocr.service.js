const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execFile } = require("child_process");
const util = require("util");

const execFileAsync = util.promisify(execFile);

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function resolveInputPath(input) {
  if (typeof input === "string") return input;

  if (input && typeof input === "object") {
    return input.path;
  }

  throw new Error("OCR input path bulunamadi");
}

function toAsciiSafeFilename(filePath) {
  const ext = path.extname(filePath || "").toLowerCase();
  const base = path.basename(filePath || "file", ext);

  const safeBase = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0131/g, "i")
    .replace(/\u0130/g, "I")
    .replace(/\u011f/g, "g")
    .replace(/\u011e/g, "G")
    .replace(/\u00fc/g, "u")
    .replace(/\u00dc/g, "U")
    .replace(/\u015f/g, "s")
    .replace(/\u015e/g, "S")
    .replace(/\u00f6/g, "o")
    .replace(/\u00d6/g, "O")
    .replace(/\u00e7/g, "c")
    .replace(/\u00c7/g, "C")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "") || "file";

  return `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${safeBase}${ext}`;
}

function copyToTemp(filePath) {
  const tempDir = path.join(os.tmpdir(), "tedbirge-ocr");
  ensureDir(tempDir);

  const safeName = toAsciiSafeFilename(filePath);
  const tempPath = path.join(tempDir, safeName);

  fs.copyFileSync(filePath, tempPath);
  return tempPath;
}

function listPagePngs(tempDir, outputPrefix) {
  return fs
    .readdirSync(tempDir)
    .filter((name) => name.startsWith(outputPrefix + "-") && name.toLowerCase().endsWith(".png"))
    .sort((a, b) => {
      const aMatch = a.match(/-(\d+)\.png$/i);
      const bMatch = b.match(/-(\d+)\.png$/i);

      const aNum = aMatch ? Number(aMatch[1]) : 0;
      const bNum = bMatch ? Number(bMatch[1]) : 0;

      return aNum - bNum;
    })
    .map((name) => path.join(tempDir, name));
}

async function convertPdfToPng(pdfPath) {
  const pages = await convertPdfToPngPages(pdfPath);

  if (!pages.length) {
    throw new Error("PDF PNG'ye cevrilemedi");
  }

  return pages[0];
}

async function convertPdfToPngPages(pdfPath) {
  console.log("[OCR] convertPdfToPngPages:start", pdfPath);
  const pdftoppm = process.env.PDFTOPPM_PATH || "pdftoppm";
  const tempDir = path.join(os.tmpdir(), "tedbirge-ocr");
  ensureDir(tempDir);

  const outputPrefix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const dpi = process.env.OCR_DPI || "300";

  await execFileAsync(pdftoppm, [
    "-r", String(dpi),
    "-png",
    pdfPath,
    path.join(tempDir, outputPrefix)
  ]);

  const pages = listPagePngs(tempDir, outputPrefix);
console.log("[OCR] convertPdfToPngPages:done", pages.length);

  if (!pages.length) {
    throw new Error("PDF sayfalari PNG'ye cevrilemedi");
  }

  return pages;
}

async function runTesseract(imagePath) {
  console.log("[OCR] runTesseract:start", imagePath);
  const tesseract = process.env.TESSERACT_PATH;

  if (!tesseract) {
    throw new Error("TESSERACT_PATH tanimli degil");
  }

  const tempDir = path.join(os.tmpdir(), "tedbirge-ocr");
  ensureDir(tempDir);

  const outputBase = path.join(
    tempDir,
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
  const safeInputPath = copyToTemp(path.resolve(imagePath));
  await execFileAsync(tesseract, [
    safeInputPath,
    outputBase,
    "--psm", process.env.OCR_PSM || "6"
  ]);

  const txtPath = outputBase + ".txt";
console.log("[OCR] runTesseract:done", txtPath);

  if (!fs.existsSync(txtPath)) {
    throw new Error("OCR output yok");
  }

  return fs.readFileSync(txtPath, "utf8");
}

async function runOcrOnPdf(pdfPath) {
  const pages = await convertPdfToPngPages(pdfPath);
  const pageTexts = [];

  for (let i = 0; i < pages.length; i += 1) {
    const pagePath = pages[i];

    try {
      const pageText = await runTesseract(pagePath);
      const cleaned = typeof pageText === "string" ? pageText.trim() : "";

      pageTexts.push(`--- SAYFA ${i + 1} ---\n${cleaned}`);
    } catch (error) {
      pageTexts.push(`--- SAYFA ${i + 1} ---\n[OCR HATASI: ${error.message}]`);
    }
  }

  return pageTexts.join("\n\n").trim();
}

async function runOcr(input) {
  console.log("[OCR] runOcr:start");
  const originalPath = resolveInputPath(input);
  const tempPath = copyToTemp(originalPath);
console.log("[OCR] runOcr:tempPath", tempPath);

  const ext = path.extname(tempPath).toLowerCase();

  if (ext === ".pdf") {
    return await runOcrOnPdf(tempPath);
  }

  return await runTesseract(tempPath);
}

async function extractTextWithOcr(input) {
  const text = await runOcr(input);
  return { text };
}

/**
 * Claude Vision ile belgeden metin cikarma.
 * PDF ve image (JPG/PNG/WEBP) destekler.
 * Binary gerektirmez — Render'da calisir.
 */
async function extractTextWithVision(buffer, mimeType) {
  const Anthropic = require("@anthropic-ai/sdk");

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Vision icin ANTHROPIC_API_KEY gerekli");
  }

  const client = new Anthropic.default({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const base64 = buffer.toString("base64");

  const sourceType = mimeType === "application/pdf" ? "document" : "image";
  const contentBlock = sourceType === "document"
    ? {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64 }
      }
    : {
        type: "image",
        source: { type: "base64", media_type: mimeType, data: base64 }
      };

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{
      role: "user",
      content: [
        contentBlock,
        {
          type: "text",
          text: "Sen bir Turk hukuk uzmanisin. Yuklenmis belgeyi SATIR SATIR oku ve TAM METNI cikar.\n\nKURALLAR:\n- Belgede gorunen TUM metni dahil et (baslik, altyazi, dipnot, damga, imza satiri)\n- Tablolari | ile ayirarak koru\n- Sayi, tarih, isim, TC kimlik, plaka gibi detaylari DEGISTIRMEDEN aktar\n- El yazisi varsa [El yazisi: ...] ile isaretle\n- Okunamayan kisimlari [Okunmuyor] ile isaretle\n- Kendi yorumunu EKLEME — sadece belgede yazan\n- Ciktiyi markdown formatinda ver\n\nSadece belge metnini dondur. Baslangicta veya sonunda aciklama yazma."
        }
      ]
    }]
  });

  const textBlocks = response.content
    .filter(block => block.type === "text")
    .map(block => block.text);

  return textBlocks.join("\n").trim();
}

module.exports = {
  runOcr,
  extractTextWithOcr,
  extractTextWithVision,
  performOcr: runOcr,
  extractTextFromImageOrPdf: extractTextWithOcr,
  ocrFile: runOcr,
  convertPdfToPng,
  convertPdfToPngPages
};










