const fs = require("fs");
const path = require("path");

function extractBasicText(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) return "";

    const ext = path.extname(filePath).toLowerCase();

    // basic fallback only
    if (ext === ".txt" || ext === ".md" || ext === ".json" || ext === ".csv") {
      return fs.readFileSync(filePath, "utf8").slice(0, 20000);
    }

    // for pdf/image/docx etc, real OCR provider should handle it
    return "";
  } catch (err) {
    return "";
  }
}

module.exports = {
  extractBasicText,
};
