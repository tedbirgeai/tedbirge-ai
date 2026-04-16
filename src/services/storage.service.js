/**
 * storage.service.js
 * Supabase Storage üzerinden upload/download.
 * SUPABASE_STORAGE_BUCKET env yoksa lokal uploads/ fallback kullanılır.
 */

const fs = require("fs");
const path = require("path");

const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

function getSupabaseClient() {
  const { createClient } = require("@supabase/supabase-js");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("SUPABASE_URL ve SUPABASE_SERVICE_KEY env değerleri eksik.");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

/**
 * Dosya buffer'ını Supabase Storage'a yükler.
 * @param {Buffer} buffer
 * @param {string} filename  — Supabase'de saklanacak dosya adı (path dahil)
 * @param {string} mimetype
 * @returns {Promise<string>} — storage path
 */
async function uploadFile(buffer, filename, mimetype) {
  if (!SUPABASE_BUCKET) {
    // Lokal fallback: buffer'ı uploads/ klasörüne yaz
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const localPath = path.join(uploadDir, path.basename(filename));
    fs.writeFileSync(localPath, buffer);
    return localPath;
  }

  const supabase = getSupabaseClient();
  const storagePath = `uploads/${filename}`;
  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(storagePath, buffer, { contentType: mimetype, upsert: false });

  if (error) throw new Error("Supabase Storage yükleme hatası: " + error.message);
  return data.path;
}

/**
 * Supabase Storage'dan dosya indirir (Buffer döner).
 * Lokal modda: dosyayı diskten okur.
 * @param {string} storagePath  — DB'de saklanan path değeri
 * @returns {Promise<{ buffer: Buffer, contentType: string }>}
 */
async function downloadFile(storagePath) {
  if (!SUPABASE_BUCKET) {
    // Lokal fallback
    const absPath = path.isAbsolute(storagePath)
      ? storagePath
      : path.join(process.cwd(), storagePath);
    if (!fs.existsSync(absPath)) throw new Error("Dosya bulunamadı: " + absPath);
    const buffer = fs.readFileSync(absPath);
    const ext = path.extname(absPath).toLowerCase();
    const contentType = ext === ".pdf" ? "application/pdf"
      : ext === ".png" ? "image/png"
      : "image/jpeg";
    return { buffer, contentType };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .download(storagePath);

  if (error) throw new Error("Supabase Storage indirme hatası: " + error.message);
  const buffer = Buffer.from(await data.arrayBuffer());
  return { buffer, contentType: data.type || "application/octet-stream" };
}

/**
 * Supabase Storage'dan public URL döner (bucket public olmalı).
 * @param {string} storagePath
 * @returns {string}
 */
function getPublicUrl(storagePath) {
  if (!SUPABASE_BUCKET || !SUPABASE_URL) return storagePath;
  const supabase = getSupabaseClient();
  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Dosyayı siler (Supabase veya lokal).
 * @param {string} storagePath
 */
async function deleteFile(storagePath) {
  if (!SUPABASE_BUCKET) {
    const absPath = path.isAbsolute(storagePath)
      ? storagePath
      : path.join(process.cwd(), storagePath);
    if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
    return;
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.storage.from(SUPABASE_BUCKET).remove([storagePath]);
  if (error) throw new Error("Supabase Storage silme hatası: " + error.message);
}

module.exports = { uploadFile, downloadFile, getPublicUrl, deleteFile, isSupabaseMode: () => Boolean(SUPABASE_BUCKET) };
