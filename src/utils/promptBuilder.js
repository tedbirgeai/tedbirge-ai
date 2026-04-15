function buildDocumentAnalysisPrompt({ lead, documentText }) {
  return `
Sen bir trafik kazası tazminat uzmanı hukuk asistanısın.

Görev:
Aşağıdaki belgeyi analiz et ve SADECE JSON döndür.

Kurallar:
- Açıklama yazma
- JSON dışı hiçbir şey yazma
- Eksik bilgi varsa null yaz
- Tahmin etme, belgeye dayan

Müşteri:
Ad Soyad: ${lead.customerName}
Telefon: ${lead.customerPhone}
Şehir: ${lead.city || "Bilinmiyor"}
Kaza Özeti: ${lead.accidentSummary || "Yok"}

Belge:
${documentText}

Çıktı formatı:

{
  "documentType": "string (tutanak | hastane | epikriz | fatura | bilirkişi | diğer)",
  "injurySummary": "string",
  "hospitalInfo": "string",
  "compensationStrengths": ["string"],
  "missingDocuments": ["string"],
  "risks": ["string"],
  "aiSummary": "string (2-3 cümle)",
  "qualificationScore": number (0-100)
}
`;
}

module.exports = { buildDocumentAnalysisPrompt };
