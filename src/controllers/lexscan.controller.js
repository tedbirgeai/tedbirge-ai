/**
 * LexScan AI Asistan — Herkese açık chat endpoint'i
 * Model: claude-sonnet-4-6
 *
 * Akış: kaza türü → yaralanma detayı → tazminat tahmini → başvuruya yönlendir
 */

const asyncHandler = require("../utils/asyncHandler");
const Anthropic = require("@anthropic-ai/sdk");

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 600;

const SYSTEM_PROMPT = `Sen Tedbirge AI'ın hukuk asistanı LexScan'sın. Türk tazminat hukukunda uzman, ikna edici ve yönlendiricisin.

GÖREVİN:
- Kullanıcının kaza türünü, yaralanma detaylarını ve hukuki durumunu anla
- Tahmini tazminat aralığı ver (gerçekçi, yasal dayanaklı)
- Her mesajın sonunda başvuruya yönlendir

HUKUKI ÇERÇEVE (kullan):
- Trafik kazası: KTK m.85, BK m.49, Zamanaşımı 2 yıl (KTK m.109)
- İş kazası: SGK 5510, TBK m.417, Zamanaşımı 10 yıl (BK m.146)
- Maluliyet hesabı: AMA kılavuzu + PMF yaşam tablosu
- 2026 ZMSS: Ölüm 1.540.000 TL, Sakatlık 924.000 TL
- Başarı primi: %20 (kazanılmadan ödeme yok)

İLETİŞİM TARZI:
- Türkçe, sade, net
- Empati göster ama profesyonel kal
- Somut rakamlar ver (aralık olarak: X - Y TL)
- Zamanaşımı varsa MUTLAKA uyar
- Her yanıtı max 150 kelime tut
- Yanıtın sonuna CTA ekle: "👉 Ücretsiz değerlendirme için: tedbirge.ai/basvuru"

YASAK:
- "Avukat değilim" gibi sorumluluk reddi yazma (zaten ön değerlendirme platformu olduğu açık)
- Kesin garanti verme
- Rakip hukuk bürolarını önerme

BASVURU YONLENDIRME:
Kullanici durumunu yeterince anlattiysa, yanita su JSON blogu ekle (sadece 1 kez, en sona):
<<<TEDBIRGE_PREFILL>>>
{"summary": "<kullanicinin anlattigi kaza ozetini Turkce yaz, max 300 karakter>", "accidentType": "<TRAFIK_KAZASI | IS_KAZASI | DIGER>"}
<<<TEDBIRGE_PREFILL_END>>>
Bu blok panel tarafindan okunur ve basvuru formunu otomatik doldurur. Kullaniciya gosterilmez.`;

exports.chat = asyncHandler(async (req, res) => {
  const { messages, sessionId } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ success: false, message: "Mesaj listesi boş olamaz." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Mock mod — API key yoksa örnek yanıt döner
    return res.json({
      success: true,
      data: {
        role: "assistant",
        content: mockResponse(messages[messages.length - 1]?.content || ""),
      },
    });
  }

  const client = new Anthropic.default({ apiKey });

  // Mesaj geçmişini Anthropic formatına çevir
  const anthropicMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-10) // Son 10 mesaj (context limiti)
    .map((m) => ({
      role: m.role,
      content: String(m.content).slice(0, 2000),
    }));

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: anthropicMessages,
  });

  const replyText = response.content?.[0]?.text || "Yanıt alınamadı.";

  res.json({
    success: true,
    data: { role: "assistant", content: replyText },
  });
});

// ─── Mock yanıtlar (API key yokken) ──────────────────────────────────────────

function mockResponse(userMsg) {
  const lower = userMsg.toLowerCase();

  if (lower.includes("trafik") || lower.includes("kaza")) {
    return "Trafik kazası tazminatı için KTK m.85 kapsamında değerlendirme yapıyoruz. Yaralanma derecesi ve kusur oranına göre 50.000–500.000 TL aralığında tazminat alabilirsiniz. Zamanaşımı 2 yıldır, beklemeden başvurun.\n\n👉 Ücretsiz değerlendirme için: tedbirge.ai/basvuru";
  }
  if (lower.includes("iş kazası") || lower.includes("meslek")) {
    return "İş kazası davalarında SGK 5510 ve TBK m.417 kapsamında işveren sorumluluğu doğar. Maluliyet oranı ve günlük kazancınıza göre 200.000–2.000.000 TL tazminat mümkündür. Zamanaşımı 10 yıldır.\n\n👉 Ücretsiz değerlendirme için: tedbirge.ai/basvuru";
  }
  if (lower.includes("zamanaşımı")) {
    return "Trafik kazasında 2 yıl (KTK m.109), iş kazasında 10 yıldır. Süreniz dolmak üzereyse ACELE edin — hakkınız kaybolabilir!\n\n👉 Hemen başvuru: tedbirge.ai/basvuru";
  }
  if (lower.includes("belge") || lower.includes("ne lazım")) {
    return "Başvuru için: kaza tutanağı, hastane/doktor raporu, sigorta poliçesi ve kimlik belgesi yeterlidir. Belgeler eksik olsa da başvurabilirsiniz, avukatımız sizi yönlendirir.\n\n👉 Ücretsiz değerlendirme: tedbirge.ai/basvuru";
  }

  return "Merhaba! Size trafik veya iş kazası tazminatı konusunda yardımcı olabilirim. Kazanızın türünü ve yaralanma durumunuzu anlatırsanız tahmini tazminat hesaplayabilirim.\n\n👉 Hemen başvurmak için: tedbirge.ai/basvuru";
}
