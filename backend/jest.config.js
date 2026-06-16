module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
  ],
  // Target: 75% line/statement/function coverage (the brief's goal).
  // Branch coverage is held a touch lower since defensive branches are common.
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  clearMocks: true,
  // First in-memory MongoDB run downloads a mongod binary — allow headroom.
  testTimeout: 60000,
};
