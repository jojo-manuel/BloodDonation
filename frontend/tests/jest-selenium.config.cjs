// jest-selenium.config.cjs - CommonJS format for Jest configuration
const config = {
  preset: null,
  testEnvironment: 'node',
  rootDir: '../',
  testMatch: [
    '**/tests/**/*.test.js',
    '!**/tests/playwright/**'
  ],
  testTimeout: 30000,
  setupFilesAfterEnv: [],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/firebase.js'
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': 'identity-obj-proxy'
  },
  transform: {}
};

module.exports = config;

