/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Admin login
 *     tags: [Authentication]
 *     description: Authenticate admin user and receive JWT token in HTTP-only cookie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             username: "admin"
 *             password: "your-password"
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: JWT token in HTTP-only cookie named 'adminToken'
 *             schema:
 *               type: string
 *               example: adminToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Path=/; SameSite=Strict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Invalid username or password"
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Too many login attempts, please try again later"
 *
 * /api/auth/logout:
 *   post:
 *     summary: Logout
 *     tags: [Authentication]
 *     description: Clear authentication cookie
 *     responses:
 *       200:
 *         description: Logout successful
 *         headers:
 *           Set-Cookie:
 *             description: Clears adminToken cookie
 *             schema:
 *               type: string
 *               example: adminToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 *
 * /api/auth/me:
 *   get:
 *     summary: Check authentication status
 *     tags: [Authentication]
 *     description: Returns current user information if authenticated
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Authentication status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthStatus'
 *             examples:
 *               authenticated:
 *                 summary: User is authenticated
 *                 value:
 *                   success: true
 *                   isAuthenticated: true
 *                   data:
 *                     id: "user-123"
 *                     username: "admin"
 *                     email: "admin@example.com"
 *                     role: "admin"
 *               notAuthenticated:
 *                 summary: User is not authenticated
 *                 value:
 *                   success: false
 *                   isAuthenticated: false
 *                   message: "Not authenticated"
 */

