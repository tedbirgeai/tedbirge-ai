// src/services/muhatapAI.service.js
// W1-M3.5 — Claude API ile 13 muhatap tipinden en uygun olanı öner

const Anthropic = require("@anthropic-ai/sdk");

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1024;

function isMockMode() {
  return !process.env.ANTHROPIC_API_KEY || process.env.AI_MOCK === "true";
}

function getClient() {
  return new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const MUHATAP_TANIMLARI = `
MUHATAP TİPLERİ VE TANIMLARI:

1. TRAFIK_SIGORTASI — Kazaya karışan karşı aracın zorunlu trafik (KTK) sigortacısı. Maddi hasar + bedeni zarar üçüncü şahıs taleplerinin birincil muhatabı.
2. KASKO — Müvekkilin kendi aracına yaptırdığı ihtiyari kasko sigortacısı. Müvekkil kusurluysa veya karşı taraf kaçtıysa devreye girer.
3. FERDI_KAZA_KOLTUK — Koltuk ferdi kaza sigortası (yolcu veya sürücü). Ölüm/sakatlık tazminatları, teminat limitli.
4. TMTB — Türkiye Motorlu Taşıt Bürosu. Yabancı plakalı aracın kaza yapması hâlinde muhatap (green card sistemi).
5. GUVENCE_HESABI — Zorunlu sigortası olmayan, kaçan veya çalınmış araç kazalarında devreye giren kamu fonu.
6. ISVEREN — İş kazasında işverenin kusur sorumluluğu. SGK hak edişi dışındaki maddi/manevi tazminat.
7. SGK — İş kazası veya trafik kazasında tedavi giderleri, geçici/sürekli iş göremezlik, ölüm aylığı (rücu hakkı dahil).
8. HASTANE — Tedavi hatası, hekim kusuru, kamu/özel hastane sorumluluğu (ayrı dava konusu).
9. TARSIM — Tarım sigortası. Traktör/iş makinesi tarım kazalarında devreye girebilir.
10. DASK — Zorunlu deprem sigortası. Kaza değil, bina hasarı için. Trafik kazasında genelde muhatap DEĞİL.
11. SORUMLU_UCUNCU_KISI — Kaza sorumlusu gerçek kişi (sigortası yoksa veya limit aşımı varsa doğrudan dava).
12. KAMU_KURUMU — Karayolları Genel Müdürlüğü, Belediye vb. (yol bakım eksikliği, trafik işareti hatası).
13. DIGER — Yukarıdakilerin hiçbirine uymayan özel durum.
`;

const GECERLI_TIPLER = [
  "TRAFIK_SIGORTASI", "KASKO", "FERDI_KAZA_KOLTUK", "TMTB", "GUVENCE_HESABI",
  "ISVEREN", "SGK", "HASTANE", "TARSIM", "DASK",
  "SORUMLU_UCUNCU_KISI", "KAMU_KURUMU", "DIGER",
];

/**
 * Lead'in kaza bilgilerine göre 13 muhatap tipinden en uygununu öner.
 * @param {object} lead
 * @returns {Promise<{muhatapTipi: string, muhatapAdi: string|null, guvenSkoru: number, gerekce: string}>}
 */
async function muhatapOner(lead) {
  if (isMockMode()) {
    return {
      muhatapTipi: "TRAFIK_SIGORTASI",
      muhatapAdi: null,
      guvenSkoru: 0.85,
      gerekce: "[MOCK] Trafik kazası standart akışı — karşı araç trafik sigortası birincil muhatap.",
    };
  }

  const leadOzeti = JSON.stringify(
    {
      kazaTipi: lead.kazaTipi || null,
      accidentDate: lead.accidentDate || null,
      accidentLocation: lead.accidentLocation || null,
      kazaAciklamasi: lead.kazaAciklamasi || lead.aciklama || null,
      yaralanmaTuru: lead.yaralanmaTuru || null,
      vefatDurumu: lead.vefatDurumu || null,
      aracPlaka: lead.aracPlaka || null,
      karsiAracPlaka: lead.karsiAracPlaka || null,
      karsiTarafKusurOrani: lead.karsiTarafKusurOrani || null,
      isKazasi: lead.isKazasi || false,
      isveren: lead.isveren || null,
      hasar: lead.hasar || null,
    },
    null,
    2
  );

  const prompt = `Sen bir Türk trafik/iş kazası hukuku uzmanısın. Aşağıdaki lead (dosya) bilgilerine bakarak, hukukçunun ilk olarak hangi muhataba (sigorta/kurum/kişi) başvurması gerektiğini seç.

${MUHATAP_TANIMLARI}

LEAD BİLGİLERİ:
${leadOzeti}

GÖREV: Yukarıdaki 13 tipten SADECE BİRİNİ seç. Seçimini 2-4 cümlelik somut gerekçeyle açıkla. Güven skorunu 0-1 arası ver (eksik bilgi varsa düşür).

Yanıtı SADECE şu JSON formatında ver, başka metin yazma:
{
  "muhatapTipi": "TRAFIK_SIGORTASI",
  "muhatapAdi": null,
  "guvenSkoru": 0.9,
  "gerekce": "Kaza tarihi ve karşı araç plakası mevcut. Karşı taraf kusurlu görünüyor. Maddi hasar + yaralanma için birincil muhatap karşı aracın zorunlu trafik sigortacısıdır."
}

muhatapAdi alanı: Sigorta şirketinin adı biliniyorsa yaz (örn "Anadolu Sigorta"). Bilinmiyorsa null bırak.`;

  const client = getClient();
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
  });

  const rawText = message.content[0]?.text || "";
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI response JSON parse failed: " + rawText.slice(0, 200));
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (!GECERLI_TIPLER.includes(parsed.muhatapTipi)) {
    throw new Error("AI invalid muhatapTipi: " + parsed.muhatapTipi);
  }

  const guven = Number(parsed.guvenSkoru);
  if (isNaN(guven) || guven < 0 || guven > 1) {
    throw new Error("AI invalid guvenSkoru: " + parsed.guvenSkoru);
  }

  return {
    muhatapTipi: parsed.muhatapTipi,
    muhatapAdi: parsed.muhatapAdi || null,
    guvenSkoru: guven,
    gerekce: String(parsed.gerekce || "").slice(0, 1000),
  };
}

module.exports = { muhatapOner };
