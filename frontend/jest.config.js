export default {
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@?testing-library)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/tests/'],
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testEnvironment: 'jsdom',
};
