const request = require('supertest');
const express = require('express');
const authRoutes = require('../../../src/backend/api/routes/authRoutes');
const { mockReadModelStore } = require('../../helpers/mocks');

// Mock rate limiter
jest.mock('../../../src/backend/middleware/rateLimiter', () => ({
  authLimiter: (req, res, next) => next(),
  generalLimiter: (req, res, next) => next()
}));

describe('Auth Routes', () => {
  let app;
  let readModelStore;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    readModelStore = { ...mockReadModelStore };
    
    app.use('/api/auth', authRoutes(readModelStore));
    
    // Reset mocks
    jest.clearAllMocks();
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
      const mockUserModel = {
        findOne: jest.fn().mockResolvedValue(null)
      };
      readModelStore.getModel = jest.fn().mockReturnValue(mockUserModel);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'invalid',
          password: 'wrong'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
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


