const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");

/**
 * UYAP (Ulusal Yargı Ağı Bilişim Sistemi) entegrasyonu — MOCK
 *
 * Gerçek API henüz kamuya açık olmadığından bu servis mock veri döner.
 * Gerçek entegrasyon hazır olduğunda bu fonksiyonlar Adalet Bakanlığı
 * UYAP WebService çağrılarıyla değiştirilebilir.
 */

const MOCK_MAHKEMELER = [
  "İstanbul Anadolu 1. Asliye Hukuk Mahkemesi",
  "İstanbul Anadolu 3. İş Mahkemesi",
  "Ankara 2. Asliye Hukuk Mahkemesi",
  "İzmir 1. İş Mahkemesi",
  "Bursa 4. Asliye Hukuk Mahkemesi",
  "Antalya 2. Asliye Hukuk Mahkemesi",
];

const MOCK_DURUMLAR = [
  "Tensip zaptı düzenlendi",
  "Tensip zaptı tebliğe çıkarıldı",
  "Cevap dilekçesi bekleniyor",
  "Bilirkişi atandı",
  "Bilirkişi raporu hazırlandı",
  "Duruşma günü bekleniyor",
  "Uzlaşma görüşmesi devam ediyor",
];

function deterministicIndex(str, arrayLen) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash % arrayLen;
}

function generateMockUyapData(lead) {
  const seed = lead.id;
  const mahkeme = MOCK_MAHKEMELER[deterministicIndex(seed + "m", MOCK_MAHKEMELER.length)];
  const durum   = MOCK_DURUMLAR[deterministicIndex(seed + "d", MOCK_DURUMLAR.length)];

  // Dosya numarası formatı: YYYY/12345 E. (Esas)
  const year = lead.createdAt
    ? new Date(lead.createdAt).getFullYear()
    : new Date().getFullYear();
  const esasNo = deterministicIndex(seed + "e", 99999);
  const dosyaNo = `${year}/${String(esasNo).padStart(5, "0")} E.`;

  // Duruşma tarihi: oluşturma tarihinden ~90-180 gün sonrası
  const offset = 90 + deterministicIndex(seed + "t", 90);
  const baseDate = lead.createdAt ? new Date(lead.createdAt) : new Date();
  const durusmaDate = new Date(baseDate);
  durusmaDate.setDate(durusmaDate.getDate() + offset);

  return {
    dosyaNo,
    mahkeme,
    durum,
    durusmaTarihi: durusmaDate.toISOString(),
    sonKarar: null, // Henüz karar yok
    kaynak: "UYAP Mock (Gerçek API entegre edilmedi)",
    sonGuncelleme: new Date().toISOString(),
  };
}

async function getUyapStatus(leadId) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      leadCode: true,
      customerName: true,
      accidentType: true,
      status: true,
      createdAt: true,
      uyapDosyaNo: true,
      uyapMahkeme: true,
      uyapDurum: true,
      uyapSonGuncelleme: true,
    },
  });

  if (!lead) throw new ApiError(404, "Lead bulunamadı");

  // Eğer gerçek UYAP verisi DB'ye kaydedilmişse onu döndür
  if (lead.uyapDosyaNo) {
    return {
      dosyaNo: lead.uyapDosyaNo,
      mahkeme: lead.uyapMahkeme,
      durum: lead.uyapDurum,
      sonGuncelleme: lead.uyapSonGuncelleme,
      kaynak: "Kayıtlı UYAP verisi",
      durusmaTarihi: null,
      sonKarar: null,
    };
  }

  // Mock veri oluştur
  const mockData = generateMockUyapData(lead);
  return mockData;
}

async function saveUyapData(leadId, { dosyaNo, mahkeme, durum }) {
  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      uyapDosyaNo: dosyaNo,
      uyapMahkeme: mahkeme,
      uyapDurum: durum,
      uyapSonGuncelleme: new Date(),
    },
  });

  await prisma.activityLog.create({
    data: {
      leadId,
      action: "UYAP_UPDATED",
      detail: `UYAP dosya no: ${dosyaNo} — ${mahkeme}`,
    },
  });

  return lead;
}

// ─────────────────────────────────────────────────────────────────────────────
// TUR #104 — UYAP Manuel Veri Adapter (Madde 39)
//
// KIRMIZI ÇİZGİ — Madde 25 + Madde 39:
// ❌ UYAP'a yetkisiz API isteği YASAK (TCK m.243)
// ❌ UYAP web sayfası scraping YASAK (TCK m.243)
// ❌ Avukat e-imza yapay simülasyon YASAK
// ✅ Manuel veri girişi (avukat doldurur)
// ✅ UYAP web link açma (yeni sekmede, kullanıcı tıklar)
// ─────────────────────────────────────────────────────────────────────────────

const UYAP_VATANDAS_URL = "https://vatandas.uyap.gov.tr";
const UYAP_AVUKAT_URL = "https://avukat.uyap.gov.tr";

function validateEsasNo(esasNo) {
  if (!esasNo) return { valid: false, reason: "BOS", hint: "Esas no zorunlu" };
  const trimmed = String(esasNo).trim();
  if (!/^\d{4}\/\d+$/.test(trimmed)) {
    return { valid: false, reason: "FORMAT", hint: "Format: 2026/123 (yıl/sıra)" };
  }
  const [yearStr] = trimmed.split("/");
  const year = parseInt(yearStr, 10);
  const currentYear = new Date().getFullYear();
  if (year < 2000 || year > currentYear + 1) {
    return { valid: false, reason: "YIL_GECERSIZ", hint: `Yıl 2000-${currentYear + 1}` };
  }
  return { valid: true, normalized: trimmed };
}

function buildVatandasUrl() { return UYAP_VATANDAS_URL; }
function buildAvukatUrl() { return UYAP_AVUKAT_URL; }

function getDosyaTurleri() {
  return [
    { value: "HUKUK", label: "Hukuk" },
    { value: "CEZA", label: "Ceza" },
    { value: "ICRA", label: "İcra" },
    { value: "IDARE", label: "İdare" },
    { value: "VERGI", label: "Vergi" },
    { value: "ARABULUCULUK", label: "Arabuluculuk" },
  ];
}

function getDosyaDurumlari() {
  return [
    { value: "DERDEST", label: "Derdest (Görülmekte)" },
    { value: "KARARLI", label: "Kararlı" },
    { value: "KESINLESTI", label: "Kesinleşti" },
    { value: "KAPALI", label: "Kapalı" },
    { value: "ISTIRDAT", label: "İstirdat" },
    { value: "FERAGAT", label: "Feragat" },
  ];
}

function getDurusmaTurleri() {
  return [
    { value: "ON_INCELEME", label: "Ön İnceleme" },
    { value: "TAHKIKAT", label: "Tahkikat" },
    { value: "KESIF", label: "Keşif" },
    { value: "BILIRKISI", label: "Bilirkişi" },
    { value: "SONUC", label: "Sonuç" },
    { value: "KARAR", label: "Karar" },
    { value: "ISTINAF", label: "İstinaf" },
    { value: "TEMYIZ", label: "Temyiz" },
  ];
}

async function fetchDosyaFromAPI(_esasNo, _eImzaToken) {
  throw new Error(
    "UYAP_API_NOT_AVAILABLE_LEGAL_PROCESS_PENDING — Madde 39 + TCK m.243 koruma"
  );
}

module.exports = {
  getUyapStatus,
  saveUyapData,
  // TUR #104 — manuel adapter helper'ları
  validateEsasNo,
  buildVatandasUrl,
  buildAvukatUrl,
  getDosyaTurleri,
  getDosyaDurumlari,
  getDurusmaTurleri,
  fetchDosyaFromAPI,
  UYAP_VATANDAS_URL,
  UYAP_AVUKAT_URL,
};
