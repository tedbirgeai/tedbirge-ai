const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");
const { serviceAgreementTemplate, powerOfAttorneyTemplate } = require("../utils/textTemplates");
const analysisConfig = require("../config/analysis.config");
const { sendContractCreatedSms } = require("./sms.service");
const { sendContractCreatedEmail } = require("./email.service");

const MODEL = "claude-sonnet-4-6";

function isMockMode() {
  return analysisConfig.analysisMode === "mock";
}

function getClient() {
  const Anthropic = require("@anthropic-ai/sdk");
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY gereklidir");
  return new Anthropic.default({ apiKey });
}

function formatDate(d) {
  if (!d) return "[TARİH]";
  try { return new Date(d).toLocaleDateString("tr-TR"); } catch { return "[TARİH]"; }
}

function pct(v) {
  if (v == null) return "[ORAN]";
  return `%${Math.round(Number(v) * 100)}`;
}

function money(v) {
  if (v == null) return "[TUTAR]";
  return Number(v).toLocaleString("tr-TR");
}

// ─── Mock templates (from textTemplates.js) ───────────────────────────────────
function mockContent(type, lead) {
  if (type === "POWER_OF_ATTORNEY") return powerOfAttorneyTemplate(lead);
  return serviceAgreementTemplate(lead);
}

// ─── Claude prompts ───────────────────────────────────────────────────────────
function buildPoaPrompt(lead) {
  const isWork = String(lead.accidentType || "").toUpperCase().includes("IS");
  const today  = formatDate(new Date());

  const specificClauses = isWork
    ? `Kaza türü: İŞ KAZASI
İş kazasına özel maddeler:
- SGK 5510 sayılı Kanun kapsamında rücu hakkı
- İşveren sorumluluğu ve haksız eylem maddeleri
- İş mahkemesinde takip yetkisi
- BBSK (Beden Bütünlüğü Sürekli Kaybı) hesabı yetkisi
- SGK bildirimi ve itiraz süreçleri`
    : `Kaza türü: TRAFİK KAZASI
Trafik kazasına özel maddeler:
- ZMSS (Zorunlu Mali Sorumluluk Sigortası) müzakere yetkisi
- Kasko sigorta başvurusu yetkisi
- Karşı taraf sigortası ile müzakere yetkisi
- KTK (Karayolları Trafik Kanunu) m.85 kapsamında sorumluluk takibi
- Sigorta tahkim başvurusu yetkisi`;

  return `Sen Türk hukuk uzmanısın. Aşağıdaki bilgilere göre resmi ve hukuki geçerliliği olan vekâletname metni yaz.

MÜVEKKİL BİLGİLERİ:
Ad Soyad          : ${lead.customerName || "[MÜVEKKİL ADI SOYADI]"}
T.C. Kimlik No    : [TC KİMLİK NO]
Adres             : ${lead.city || "[ADRES]"}
Telefon           : ${lead.customerPhone || "[TELEFON]"}
E-posta           : ${lead.customerEmail || "[E-POSTA]"}

DOSYA BİLGİLERİ:
Kaza Tarihi       : ${formatDate(lead.accidentDate)}
Tahmini Tazminat  : ${money(lead.estimatedCompensation)} TL
Maluliyet Oranı   : ${pct(lead.maluliyetRate)}
Kusur Oranı       : ${pct(lead.faultRate)}

${specificClauses}

Ortak yetkiler (her iki türde de ekle):
- Dava açma, savunma, itiraz, temyiz, istinaf yetkileri
- Uzlaşma ve sulh yetkisi (özel yetki gerektiren hususlar ayrıca belirtilecek)
- İcra takibi başlatma ve sonlandırma yetkisi
- Bilirkişi, aktüer ve uzman atanması talep yetkisi
- Tahsilat yapma yetkisi

ÜCRET:
- Başarı primi: tahsil edilen net tazminatın %20'si (KDV dahil)
- Ön inceleme ücretsiz
- Yargılama giderleri müvekkile ait

ZORUNLU EKLEMELER:
- KVKK 6698 sayılı Kanun uyumlu veri işleme maddesi ekle
- İmza tarihi: ${today}
- İmza yeri: ${lead.city || "[ŞEHİR]"}

Resmi hukuki Türkçe kullan. ğ ş ı ö ü ç karakterlerini doğru yaz.
Metni tam ve eksiksiz oluştur. Boş bırakılacak alanları [KÖŞELI PARANTEZ] içinde göster.`;
}

function buildServiceAgreementPrompt(lead) {
  const isWork = String(lead.accidentType || "").toUpperCase().includes("IS");
  const today  = formatDate(new Date());

  const process = isWork
    ? `İŞ KAZASI SÜRECİ:
1. SGK bildirimi ve itiraz süreci
2. İşverene karşı hukuki ihtar
3. İş mahkemesinde dava açılması
4. Gerekirse Yargıtay temyiz aşaması`
    : `TRAFİK KAZASI SÜRECİ:
1. Sigorta şirketi başvurusu ve müzakere
2. Uzlaşmazlık halinde sigorta tahkimi
3. Uzlaşmazlık devam ederse asliye hukuk davası
4. Gerekirse istinaf / Yargıtay temyiz`;

  const minComp = lead.estimatedCompensation ? Math.round(lead.estimatedCompensation * 0.75) : null;
  const maxComp = lead.estimatedCompensation ? Math.round(lead.estimatedCompensation * 1.25) : null;
  const compRange = (minComp && maxComp)
    ? `${money(minComp)} – ${money(maxComp)} TL`
    : "[TAZMİNAT ARALIĞI]";

  return `Sen Türk hukuk uzmanısın. Aşağıdaki bilgilere göre profesyonel avukatlık hizmet sözleşmesi yaz.

MÜVEKKİL:
Ad Soyad          : ${lead.customerName || "[MÜVEKKİL ADI SOYADI]"}
Kaza Türü         : ${lead.accidentType || "[KAZA TÜRÜ]"}
Tazminat Aralığı  : ${compRange}

SÖZLEŞMEYE EKLENECEK MADDELER:

1. İŞ TANIMI VE KAPSAM:
${process}

2. TAHMİNİ SÜRE:
- Anlaşmalı çözüm: 3–6 ay
- Dava sürecinde: 1–3 yıl

3. ÜCRET YAPISI:
- Ön inceleme ve değerlendirme: ücretsiz
- Başarı primi: tahsil edilen net tazminatın %20'si (KDV dahil)
- Yargılama giderleri (harç, bilirkişi vb.): müvekkile ait
- Avans: gerektiğinde talep edilebilir

4. AYLIK RAPORLAMA:
Avukat, her ay müvekkile yazılı veya dijital ilerleme raporu sunar.

5. FESİH KOŞULLARI:
- 30 gün önceden yazılı bildirimle feshedilebilir
- Hakklı nedenle fesihte birikmiş ücret saklıdır
- Müvekkilin bilgisi dışında sulh yapması halinde avukat ücret hakkını korur

6. UYUŞMAZLIK:
${lead.city || "[ŞEHİR]"} Mahkemeleri ve İcra Daireleri yetkilidir.

7. KVKK maddesi: KVKK 6698 sayılı Kanun uyumlu veri işleme ve gizlilik hükümleri ekle.

İmza tarihi: ${today}, Yer: ${lead.city || "[ŞEHİR]"}

Resmi hukuki Türkçe kullan. ğ ş ı ö ü ç karakterlerini doğru yaz.
Metni tam ve eksiksiz oluştur. Boş bırakılacak alanları [KÖŞELI PARANTEZ] içinde göster.`;
}

// ─── Main generateContract function ───────────────────────────────────────────
async function generateContract({ leadId, type, createdById }) {
  if (!["SERVICE_AGREEMENT", "POWER_OF_ATTORNEY"].includes(type)) {
    throw new ApiError(400, "Geçersiz sözleşme tipi. SERVICE_AGREEMENT veya POWER_OF_ATTORNEY olmalı.");
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new ApiError(404, "Lead bulunamadı");

  // TUR #56 A2 — Madde 24.11: AI analiz onayi BEKLIYOR ise sozlesme uretimi kilitli
  if (lead.aiAnalizOnay === "BEKLIYOR") {
    throw new ApiError(409, "AI analiz onayi bekleniyor (Madde 24.11). Once AI onerisini onaylayin/reddedin.");
  }

  const titleMap = {
    SERVICE_AGREEMENT: `Hizmet Sözleşmesi — ${lead.customerName}`,
    POWER_OF_ATTORNEY: `Vekâletname Taslağı — ${lead.customerName}`,
  };

  let content = "";

  if (isMockMode()) {
    content = mockContent(type, lead);
  } else {
    const client = getClient();
    const prompt = type === "POWER_OF_ATTORNEY"
      ? buildPoaPrompt(lead)
      : buildServiceAgreementPrompt(lead);

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 3000,
      system: `Sen Türk hukuku alanında uzman bir yapay zekasın. Trafik ve iş kazası tazminat davalarına odaklanan profesyonel hukuki belgeler hazırlarsın. Tüm çıktı Türkçe olmalı, ğ ş ı ö ü ç gibi Türkçe karakterleri doğru kullan.`,
      messages: [{ role: "user", content: prompt }]
    });

    content = message.content[0]?.text || "";

    if (!content.trim()) {
      // Claude API boş döndürdüyse mock'a düş
      content = mockContent(type, lead);
    }
  }

  const contract = await prisma.contract.create({
    data: {
      leadId,
      createdById,
      type,
      title: titleMap[type],
      content,
      status: "DRAFT"
    }
  });

  await prisma.activityLog.create({
    data: {
      leadId,
      action: "CONTRACT_GENERATED",
      detail: `${type} oluşturuldu — ${isMockMode() ? "şablon" : "Claude AI"}`
    }
  });

  // SMS + e-posta bildirimi — hata olursa sessizce geç
  sendContractCreatedSms(lead, type).catch((err) =>
    console.error("[SMS] Sözleşme SMS gönderilemedi:", err.message)
  );
  sendContractCreatedEmail(lead, type).catch((err) =>
    console.error("[EMAIL] Sözleşme e-postası gönderilemedi:", err.message)
  );

  return contract;
}

module.exports = { generateContract };
