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

module.exports = { getUyapStatus, saveUyapData };
