const fs = require("fs");
const path = require("path");
const { analyzeExtractedText } = require("../services/analyzer.service");

async function testAnalyze(req, res) {
  try {
    // text doğrudan body'den gelebilir ya da filePath üzerinden okunur
    let text = req.body?.text || "";

    if (!text && req.body?.filePath) {
      const filePath = req.body.filePath;
      if (!fs.existsSync(filePath)) {
        return res.status(400).json({
          success: false,
          message: "Dosya bulunamadi: " + filePath
        });
      }
      text = fs.readFileSync(filePath, "utf8");
    }

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Analiz icin 'text' veya 'filePath' zorunludur."
      });
    }

    const result = await analyzeExtractedText({
      text,
      lead: req.body?.lead || null
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Analysis test failed",
      error: error.message
    });
  }
}

module.exports = {
  testAnalyze,
};
