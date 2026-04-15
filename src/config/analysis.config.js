require("dotenv").config();

const config = {
  analysisMode: process.env.ANALYSIS_MODE || "mock", // mock | hybrid | real
  ocrProvider: process.env.OCR_PROVIDER || "mock",   // mock | ocr_space
  aiProvider: process.env.AI_PROVIDER || "mock",     // mock | openai
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  ocrSpaceApiKey: process.env.OCR_SPACE_API_KEY || "",
};

module.exports = config;
