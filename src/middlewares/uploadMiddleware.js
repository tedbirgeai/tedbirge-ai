const fs = require("fs");
const path = require("path");
const multer = require("multer");
const env = require("../config/env");

// ─── Supabase Storage ─────────────────────────────────────────────────────────
// SUPABASE_STORAGE_BUCKET env varsa dosyayı Supabase'e yükle,
// yoksa local uploads/ klasörünü kullan (development).

const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "";

async function uploadToSupabase(fileBuffer, filename, mimetype) {
  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(`uploads/${filename}`, fileBuffer, {
      contentType: mimetype,
      upsert: false,
    });
  if (error) throw new Error("Supabase Storage yükleme hatası: " + error.message);
  return data.path;
}

// ─── Local storage (development) ─────────────────────────────────────────────

if (!SUPABASE_BUCKET) {
  if (!fs.existsSync(env.uploadDir)) {
    fs.mkdirSync(env.uploadDir, { recursive: true });
  }
}

function toAsciiSafeFilename(input) {
  // Multer HTTP multipart'tan dosya adını latin1 okur, browser UTF-8 gönderir → normalize
  let name = String(input || "");
  try { name = Buffer.from(name, "latin1").toString("utf8"); } catch (_) {}
  const tr = {
    "\u00E7": "c", "\u00C7": "C",
    "\u011F": "g", "\u011E": "G",
    "\u0131": "i", "\u0130": "I",
    "\u00F6": "o", "\u00D6": "O",
    "\u015F": "s", "\u015E": "S",
    "\u00FC": "u", "\u00DC": "U",
  };
  return name
    .replace(/[\u00E7\u00C7\u011F\u011E\u0131\u0130\u00F6\u00D6\u015F\u015E\u00FC\u00DC]/g, (c) => tr[c] || c)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

// ─── Multer storage seçimi ────────────────────────────────────────────────────

const localStorage = multer.diskStorage({
  destination: function destination(req, file, cb) {
    cb(null, env.uploadDir);
  },
  filename: function filename(req, file, cb) {
    const ext = path.extname(file.originalname) || "";
    const rawBase = path.basename(file.originalname, ext);
    const safeBase = toAsciiSafeFilename(rawBase) || "file";
    const normalizedExt = ext ? ext.toLowerCase() : "";
    cb(null, `${Date.now()}-${safeBase}${normalizedExt}`);
  },
});

// Supabase modunda: önce memory'e al, sonra middleware sonrası yükle
const memoryStorage = multer.memoryStorage();

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error(`Desteklenmeyen dosya tipi: ${file.mimetype}. PDF, JPG, PNG, WEBP, DOC, DOCX, XLS, XLSX kabul edilir.`));
  }
  cb(null, true);
};

const upload = multer({
  storage: SUPABASE_BUCKET ? memoryStorage : localStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
  fileFilter,
});

// ─── Supabase post-upload middleware ─────────────────────────────────────────
// upload.single() veya upload.array() sonrası bu middleware'i zincirle.
// Supabase modu aktifse req.file.path'i Supabase URL'siyle günceller.

async function supabaseUploadMiddleware(req, res, next) {
  if (!SUPABASE_BUCKET) return next();
  try {
    // array modu (upload.array)
    const files = req.files && req.files.length > 0 ? req.files : (req.file ? [req.file] : []);
    if (files.length === 0) return next();
    for (const f of files) {
      const ext = path.extname(f.originalname) || "";
      const rawBase = path.basename(f.originalname, ext);
      const safeBase = toAsciiSafeFilename(rawBase) || "file";
      const filename = `${Date.now()}-${safeBase}${ext.toLowerCase()}`;
      const storagePath = await uploadToSupabase(f.buffer, filename, f.mimetype);
      f.filename = filename;
      f.path = storagePath;
      f.storageProvider = "supabase";
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = upload;
module.exports.supabaseUploadMiddleware = supabaseUploadMiddleware;
module.exports.isSupabaseMode = () => Boolean(SUPABASE_BUCKET);
