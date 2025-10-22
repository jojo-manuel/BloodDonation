module.exports = {
  preset: null,
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  setupFilesAfterEnv: [],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/firebase.js'
  ],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-react'] }]
  }
};
