/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: [
    "**/__tests__/**/*.test.js",
    "**/?(*.)+(spec|test).js",
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/src/routes/test.js",
    "/tedbirge-panel/",
  ],
  transform: {},
};
