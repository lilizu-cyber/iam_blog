module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src/backend', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/backend/**/*.js',
    '!src/backend/server.js',
    '!src/backend/migrations/**',
    '!src/backend/**/*.config.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  moduleNameMapper: {
    '^isomorphic-dompurify$': '<rootDir>/tests/helpers/mocks/dompurify.js',
  },
};

