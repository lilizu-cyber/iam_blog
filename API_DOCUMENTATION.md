# API Documentation

The IAM Cybersecurity Blog API is fully documented using OpenAPI 3.0 (Swagger).

## Accessing the Documentation

### Swagger UI (Interactive)
- **Development**: `http://localhost:3000/api-docs` or `http://localhost:3001/api-docs`
- **Production**: `https://your-domain.com/api-docs` (if `ENABLE_API_DOCS=true`)

### OpenAPI JSON Specification
- **Development**: `http://localhost:3000/api-docs.json`
- **Production**: `https://your-domain.com/api-docs.json`

## Features

- ✅ **Interactive API Explorer**: Test endpoints directly from the browser
- ✅ **Request/Response Examples**: See example payloads for all endpoints
- ✅ **Authentication Testing**: Test authenticated endpoints with cookie auth
- ✅ **Schema Validation**: View detailed request/response schemas
- ✅ **Error Documentation**: All error responses are documented

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Check authentication status

### Blog Posts
- `GET /api/blog/posts` - Get published blog posts (paginated)
- `GET /api/blog/posts/:postId` - Get post by ID
- `GET /api/blog/posts/slug/:slug` - Get post by slug
- `POST /api/blog/posts` - Create new post (Admin)
- `PUT /api/blog/posts/:postId` - Update post (Admin)
- `DELETE /api/blog/posts/:postId` - Delete post (Admin)
- `POST /api/blog/posts/:postId/publish` - Publish post (Admin)
- `POST /api/blog/posts/:postId/unpublish` - Unpublish post (Admin)
- `GET /api/blog/iam` - Get IAM-related posts
- `GET /api/blog/security` - Get security-related posts
- `GET /api/blog/search` - Search posts
- `GET /api/blog/popular` - Get popular posts

### Contact
- `POST /api/contact/send` - Submit contact form
- `GET /api/contact/messages` - Get all messages (Admin)
- `GET /api/contact/messages/:id` - Get message by ID (Admin)
- `PATCH /api/contact/messages/:id` - Update message (Admin)
- `DELETE /api/contact/messages/:id` - Delete message (Admin)

### Newsletter
- `POST /api/newsletter/subscribe` - Subscribe to newsletter
- `POST /api/newsletter/unsubscribe` - Unsubscribe from newsletter
- `GET /api/newsletter/subscribers` - Get subscribers (Admin)

### File Uploads
- `POST /api/upload/files` - Upload file (Admin)
- `DELETE /api/upload/files/:filename` - Delete file (Admin)
- `GET /api/upload/files/:type/:filename` - Get file

## Authentication

The API uses **cookie-based JWT authentication**:

1. **Login**: Send credentials to `/api/auth/login`
   - Credentials are sent in request body
   - JWT token is returned in HTTP-only cookie named `adminToken`
   - Cookie is automatically sent with subsequent requests

2. **Authenticated Requests**: Include the cookie automatically
   - Browser automatically sends cookie with requests
   - For API clients, include `Cookie: adminToken=<token>` header

3. **Logout**: Call `/api/auth/logout` to clear the cookie

## Rate Limiting

- **Login**: 5 attempts per 15 minutes per IP
- **General API**: 100 requests per 15 minutes per IP
- **Read Operations**: 200 requests per 15 minutes per IP
- **Write Operations**: 20 requests per 15 minutes per IP

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "requestId": "uuid-request-id"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error
- `503` - Service Unavailable

## Using Swagger UI

1. **Navigate to `/api-docs`** in your browser
2. **Try endpoints**: Click "Try it out" on any endpoint
3. **Fill parameters**: Enter required parameters and request body
4. **Execute**: Click "Execute" to send the request
5. **View response**: See the response, status code, and headers

### Testing Authentication

1. Use the `/api/auth/login` endpoint to authenticate
2. The cookie will be automatically stored by your browser
3. Try authenticated endpoints - they will use the stored cookie
4. Use `/api/auth/logout` to clear the cookie

## OpenAPI Specification

The full OpenAPI 3.0 specification is available at `/api-docs.json`. You can:

- Import into Postman, Insomnia, or other API clients
- Generate client SDKs using tools like `openapi-generator`
- Use for API contract testing
- Share with frontend developers

## Examples

### Create Blog Post (Authenticated)

```bash
curl -X POST http://localhost:3000/api/blog/posts \
  -H "Content-Type: application/json" \
  -H "Cookie: adminToken=your-jwt-token" \
  -d '{
    "title": "Understanding IAM Best Practices",
    "content": "# Introduction\n\nIAM is crucial...",
    "excerpt": "Learn about IAM best practices",
    "categoryId": "iam",
    "tags": ["iam", "security"]
  }'
```

### Get Published Posts

```bash
curl http://localhost:3000/api/blog/posts?page=1&limit=10&sortBy=publishedAt&sortOrder=desc
```

### Submit Contact Form

```bash
curl -X POST http://localhost:3000/api/contact/send \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Question about IAM",
    "message": "I have a question..."
  }'
```

## Production

By default, API documentation is **disabled in production** for security. To enable:

```bash
ENABLE_API_DOCS=true npm start
```

Or set in your `.env` file:
```
ENABLE_API_DOCS=true
```

## Maintenance

To update API documentation:

1. Edit the relevant `.docs.js` file in `src/backend/api/routes/`
2. Follow OpenAPI 3.0 specification format
3. Use `@swagger` JSDoc comments
4. Restart the server to see changes

## Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [Swagger JSDoc](https://github.com/Surnet/swagger-jsdoc)

