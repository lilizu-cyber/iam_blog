/**
 * Common mocks for testing
 */

// Mock Event Store
const mockEventStore = {
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true),
  appendToStream: jest.fn().mockResolvedValue({}),
  readStream: jest.fn().mockResolvedValue([]),
  getStreamRevision: jest.fn().mockResolvedValue(0),
  isConnected: true
};

// Mock Read Model Store
const mockReadModelStore = {
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true),
  create: jest.fn().mockResolvedValue({ id: 'test-id' }),
  findById: jest.fn().mockResolvedValue(null),
  findOne: jest.fn().mockResolvedValue(null),
  find: jest.fn().mockResolvedValue([]),
  count: jest.fn().mockResolvedValue(0),
  updateById: jest.fn().mockResolvedValue({}),
  deleteById: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  getModel: jest.fn().mockReturnValue({})
};

// Mock Command Bus
const mockCommandBus = {
  execute: jest.fn().mockResolvedValue({ success: true })
};

// Mock Query Bus
const mockQueryBus = {
  execute: jest.fn().mockResolvedValue({ data: [] })
};

// Mock Event Bus
const mockEventBus = {
  publish: jest.fn().mockResolvedValue(true),
  subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() })
};

// Mock Redis Client
const mockRedisClient = {
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true),
  isReady: true,
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0)
};

// Mock User
const mockUser = {
  id: 'user-123',
  userId: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  role: 'admin',
  isActive: true
};

// Mock Request
const createMockRequest = (overrides = {}) => ({
  method: 'GET',
  path: '/api/test',
  url: '/api/test',
  query: {},
  body: {},
  params: {},
  headers: {},
  ip: '127.0.0.1',
  get: jest.fn(),
  ...overrides
});

// Mock Response
const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    headersSent: false
  };
  return res;
};

// Mock Next function
const mockNext = jest.fn();

module.exports = {
  mockEventStore,
  mockReadModelStore,
  mockCommandBus,
  mockQueryBus,
  mockEventBus,
  mockRedisClient,
  mockUser,
  createMockRequest,
  createMockResponse,
  mockNext
};

