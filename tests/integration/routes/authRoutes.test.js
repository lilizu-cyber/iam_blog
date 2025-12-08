const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('../../../src/backend/api/routes/authRoutes');
const { mockReadModelStore } = require('../../helpers/mocks');

// Mock rate limiter
jest.mock('../../../src/backend/middleware/rateLimiter', () => ({
  authLimiter: (req, res, next) => next(),
  generalLimiter: (req, res, next) => next(),
  strictLimiter: (req, res, next) => next()
}));

// Mock User model
const mockUserModel = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
  sync: jest.fn()
};

jest.mock('../../../src/backend/models/User', () => mockUserModel);

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    
    app.use('/api/auth', authRoutes());
    
    // Reset mocks
    jest.clearAllMocks();
    mockUserModel.findOne.mockReset();
    mockUserModel.findByPk.mockReset();
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if credentials are missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for invalid credentials', async () => {
      // Mock User model to return null (user not found)
      mockUserModel.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'invalid',
          password: 'wrong'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: {
          username: 'invalid',
          isActive: true
        }
      });
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 200 with isAuthenticated false if no token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.isAuthenticated).toBe(false);
    });

    it('should return 200 with isAuthenticated false for invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'adminToken=invalid-token');

      expect(response.status).toBe(200);
      expect(response.body.isAuthenticated).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear authentication cookies', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Check that cookies are cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
    });
  });
});



