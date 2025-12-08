// Test setup file
require('dotenv').config({ path: '.env.test' });

// Mock logger to avoid console spam during tests
jest.mock('../src/backend/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  log: jest.fn()
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only-min-32-chars';
process.env.POSTGRESQL_URI = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/iam_blog_test';
process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';

// Increase timeout for database operations
jest.setTimeout(10000);


