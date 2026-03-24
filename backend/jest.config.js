module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/app.js",
    "!src/**/*.model.js",
    "!src/config/**",
  ],
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 19,
      lines: 30,
      statements: 30,
    },
  },
  setupFiles: ["<rootDir>/tests/setup.js"],
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
};
