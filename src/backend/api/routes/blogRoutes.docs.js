/**
 * @swagger
 * /api/blog/posts:
 *   get:
 *     summary: Get published blog posts
 *     tags: [Blog Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Number of posts per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [publishedAt, title, viewCount, popularityScore]
 *           default: publishedAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of published blog posts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlogPostList'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 *   post:
 *     summary: Create a new blog post (Admin only)
 *     tags: [Blog Posts]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBlogPostRequest'
 *           example:
 *             title: "Understanding IAM Best Practices"
 *             content: "# Introduction\n\nIAM is crucial for security..."
 *             excerpt: "Learn about IAM best practices"
 *             categoryId: "iam"
 *             tags: ["iam", "security"]
 *     responses:
 *       201:
 *         description: Blog post created successfully
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
 *                   example: "Blog post created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     postId:
 *                       type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /api/blog/posts/{postId}:
 *   get:
 *     summary: Get a blog post by ID
 *     tags: [Blog Posts]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post ID
 *     responses:
 *       200:
 *         description: Blog post details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BlogPost'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 *   put:
 *     summary: Update a blog post (Admin only)
 *     tags: [Blog Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Blog post updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 *
 *   delete:
 *     summary: Delete a blog post (Admin only)
 *     tags: [Blog Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Blog post deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 *
 * /api/blog/posts/{postId}/publish:
 *   post:
 *     summary: Publish a blog post (Admin only)
 *     tags: [Blog Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Blog post published successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 *
 * /api/blog/posts/slug/{slug}:
 *   get:
 *     summary: Get a blog post by slug
 *     tags: [Blog Posts]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post slug
 *     responses:
 *       200:
 *         description: Blog post details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BlogPost'
 *       404:
 *         description: Post not found
 *
 * /api/blog/iam:
 *   get:
 *     summary: Get IAM-related blog posts
 *     tags: [Blog Posts]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of posts to return
 *     responses:
 *       200:
 *         description: List of IAM-related posts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlogPostList'
 *
 * /api/blog/security:
 *   get:
 *     summary: Get security-related blog posts
 *     tags: [Blog Posts]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *     responses:
 *       200:
 *         description: List of security-related posts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlogPostList'
 *
 * /api/blog/search:
 *   get:
 *     summary: Search blog posts
 *     tags: [Blog Posts]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlogPostList'
 */


