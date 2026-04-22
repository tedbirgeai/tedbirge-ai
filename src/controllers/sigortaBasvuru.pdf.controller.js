const PDFDocument = require("pdfkit");
const fs = require("fs");
const service = require("../services/sigortaBasvuru.service");

const FONT_ARIAL = "C:/Windows/Fonts/arial.ttf";
const FONT_ARIAL_BOLD = "C:/Windows/Fonts/arialbd.ttf";

async function generatePdf(req, res, next) {
  try {
    const { id } = req.params;
    const basvuru = await service.getBasvuru(id);
    if (!basvuru) {
      return res.status(404).json({ success: false, error: "Başvuru bulunamadı" });
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    const hasFont = fs.existsSync(FONT_ARIAL);
    if (hasFont) {
      doc.registerFont("TR", FONT_ARIAL);
      doc.registerFont("TR-Bold", FONT_ARIAL_BOLD);
      doc.font("TR");
    }

    const bold = () => (hasFont ? doc.font("TR-Bold") : doc.font("Helvetica-Bold"));
    const regular = () => (hasFont ? doc.font("TR") : doc.font("Helvetica"));

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="sigorta-basvuru-${basvuru.lead?.leadCode || id}.pdf"`
    );
    doc.pipe(res);

    // Başlık
    bold().fontSize(16).text("SİGORTA BAŞVURU DİLEKÇESİ", { align: "center" });
    doc.moveDown(1.5);

    // Muhatap
    bold().fontSize(11).text("MUHATAP:");
    regular().text(basvuru.muhatapAdi || "-");
    if (basvuru.muhatapAdres) doc.text(basvuru.muhatapAdres);
    if (basvuru.muhatapKepAdres) doc.text(`KEP: ${basvuru.muhatapKepAdres}`);
    if (basvuru.muhatapEmail) doc.text(`E-posta: ${basvuru.muhatapEmail}`);
    doc.moveDown(1);

    // Konu
    bold().text("KONU:");
    regular().text(
      `${basvuru.lead?.customerName || "Müvekkil"} adına meydana gelen kaza nedeniyle tazminat başvurusu.`
    );
    doc.moveDown(1);

    // Açıklama
    bold().text("AÇIKLAMA:");
    regular().text(basvuru.talepAciklama || "-", { align: "justify" });
    doc.moveDown(1);

    // Talep Tutarı
    if (basvuru.talepTutari) {
      bold().text("TALEP TUTARI:");
      regular().text(
        `${Number(basvuru.talepTutari).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`
      );
      doc.moveDown(1);
    }

    // Kapanış
    regular().text(
      "Başvurumuzun değerlendirilerek en kısa sürede tarafımıza dönüş yapılmasını saygılarımla arz ederim.",
      { align: "justify" }
    );
    doc.moveDown(2);

    // Tarih
    regular().text(new Date().toLocaleDateString("tr-TR"), { align: "right" });

    // Footer
    doc
      .fontSize(8)
      .fillColor("gray")
      .text(
        `Tedbirge.ai — Başvuru No: ${id}`,
        50,
        doc.page.height - 40,
        { align: "center", width: doc.page.width - 100 }
      );

    doc.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { generatePdf };
