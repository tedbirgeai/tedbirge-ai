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
  const tr = { ğ:"g", Ğ:"G", ş:"s", Ş:"S", ç:"c", Ç:"C", ö:"o", Ö:"O", ü:"u", Ü:"U", ı:"i", İ:"I" };
  return String(input || "")
    .replace(/[ğĞşŞçÇöÖüÜıİ]/g, (c) => tr[c] || c)
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
];

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Sadece PDF ve görsel dosyalar kabul edilir (PDF, JPEG, PNG)."));
  }
  cb(null, true);
};

const upload = multer({
  storage: SUPABASE_BUCKET ? memoryStorage : localStorage,
  limits: { fileSize: env.maxFileSizeMb * 1024 * 1024 },
  fileFilter,
});

// ─── Supabase post-upload middleware ─────────────────────────────────────────
// upload.single() veya upload.array() sonrası bu middleware'i zincirle.
// Supabase modu aktifse req.file.path'i Supabase URL'siyle günceller.

async function supabaseUploadMiddleware(req, res, next) {
  if (!SUPABASE_BUCKET || !req.file) return next();
  try {
    const ext = path.extname(req.file.originalname) || "";
    const rawBase = path.basename(req.file.originalname, ext);
    const safeBase = toAsciiSafeFilename(rawBase) || "file";
    const filename = `${Date.now()}-${safeBase}${ext.toLowerCase()}`;
    const storagePath = await uploadToSupabase(
      req.file.buffer,
      filename,
      req.file.mimetype
    );
    req.file.filename = filename;
    req.file.path = storagePath;
    req.file.storageProvider = "supabase";
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = upload;
module.exports.supabaseUploadMiddleware = supabaseUploadMiddleware;
module.exports.isSupabaseMode = () => Boolean(SUPABASE_BUCKET);
