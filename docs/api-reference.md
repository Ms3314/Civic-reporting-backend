# API Reference

Complete API reference for the Hack Backend civic issue reporting system.

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Token Roles

- **user**: Regular mobile app users (citizens)
- **admin**: Dashboard administrators

---

## User Authentication Endpoints

### Request OTP

Sends an OTP to the user's phone number via Twilio Verify.

```http
POST /user/request-otp
```

**Request Body:**
```json
{
  "phone": "+1234567890"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number in E.164 format (+[country][number]) |

**Success Response (200):**
```json
{
  "message": "OTP sent successfully. Please check your phone.",
  "sid": "VExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

**Error Responses:**
- `400`: Invalid phone number format
- `500`: SMS service not configured

---

### Verify OTP

Verifies the OTP and returns a JWT token. Auto-registers new users.

```http
POST /user/verify-otp
```

**Request Body:**
```json
{
  "phone": "+1234567890",
  "otp": "123456"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number used for OTP request |
| otp | string | Yes | 6-digit OTP code |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful. OTP verified.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "number": "+1234567890",
    "role": "user"
  }
}
```

**Error Responses:**
- `400`: Phone and OTP required / OTP not found
- `401`: Invalid or expired OTP
- `500`: Server error

---

## Admin Authentication

### Admin Login

Authenticates admin with email and password.

```http
POST /admin/login
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Admin logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**Error Responses:**
- `401`: Admin not found / Invalid password
- `500`: Server error

---

## Category Endpoints

### Get All Categories

Returns all available issue categories.

```http
GET /user/categories
GET /admin/categories
```

**Authentication:** Not required

**Success Response (200):**
```json
{
  "message": "Categories retrieved successfully",
  "categories": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Water",
      "description": "Water supply, leaks, water quality issues",
      "createdAt": "2024-01-20T00:00:00.000Z",
      "updatedAt": "2024-01-20T00:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Road",
      "description": "Road conditions, potholes, street lights",
      "createdAt": "2024-01-20T00:00:00.000Z",
      "updatedAt": "2024-01-20T00:00:00.000Z"
    }
  ],
  "count": 14
}
```

---

### Get Category by ID

```http
GET /user/categories/:id
GET /admin/categories/:id
```

**Authentication:** Not required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (UUID) | Category ID |

**Success Response (200):**
```json
{
  "message": "Category retrieved successfully",
  "category": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Water",
    "description": "Water supply, leaks, water quality issues",
    "createdAt": "2024-01-20T00:00:00.000Z",
    "updatedAt": "2024-01-20T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `404`: Category not found

---

## Issue Endpoints (User)

### Create Issue

Creates a new civic issue report.

```http
POST /user/issues
```

**Authentication:** Required (User)

**Request Body:**
```json
{
  "title": "Large pothole on Main Street",
  "description": "Dangerous pothole near the intersection causing accidents",
  "categoryId": "550e8400-e29b-41d4-a716-446655440000",
  "importanceRating": 4,
  "image": "https://example.com/image.jpg"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Issue title |
| description | string | Yes | Detailed description |
| categoryId | string (UUID) | Yes | Category ID |
| importanceRating | integer (0-5) | No | User's importance rating (default: 0) |
| image | string (URL) | No | Image URL |

**Success Response (201):**
```json
{
  "message": "Issue created successfully",
  "issue": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Large pothole on Main Street",
    "description": "Dangerous pothole near the intersection",
    "image": "https://example.com/image.jpg",
    "importanceRating": 4,
    "status": 0,
    "categoryId": "...",
    "userId": "...",
    "createdAt": "2024-01-20T00:00:00.000Z",
    "updatedAt": "2024-01-20T00:00:00.000Z",
    "category": { ... },
    "user": { ... },
    "comments": [],
    "reposts": [],
    "repostCount": 0,
    "priority": 4
  }
}
```

**Error Responses:**
- `400`: Missing required fields / Invalid category
- `500`: Server error

---

### Get All Issues

Returns all issues (for the feed).

```http
GET /user/issues
```

**Authentication:** Required (User)

**Success Response (200):**
```json
{
  "message": "Issues retrieved successfully",
  "issues": [ ... ],
  "count": 10
}
```

---

### Get My Issues

Returns issues created by the authenticated user.

```http
GET /user/issues/my-issues
```

**Authentication:** Required (User)

**Success Response (200):**
```json
{
  "message": "Your issues retrieved successfully",
  "issues": [ ... ],
  "count": 5
}
```

---

### Get Issue by ID

```http
GET /user/issues/:id
```

**Authentication:** Required (User)

**Success Response (200):**
```json
{
  "message": "Issue retrieved successfully",
  "issue": { ... }
}
```

**Error Responses:**
- `404`: Issue not found

---

## Issue Endpoints (Admin)

### Get All Issues

Returns all issues for admin dashboard.

```http
GET /admin/issues
```

**Authentication:** Required (Admin)

**Success Response (200):**
```json
{
  "message": "Issues retrieved successfully",
  "issues": [ ... ],
  "count": 100
}
```

---

### Get Issue by ID

```http
GET /admin/issues/:id
```

**Authentication:** Required (Admin)

---

### Update Issue Status

Updates the status of an issue.

```http
PUT /admin/issues/:id/status
```

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "status": 2
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | integer (0-5) | Yes | New status value |

**Status Values:**
| Value | Meaning |
|-------|---------|
| 0 | Pending |
| 1 | Acknowledged |
| 2 | In Progress |
| 3 | Under Review |
| 4 | Near Completion |
| 5 | Resolved |

**Success Response (200):**
```json
{
  "message": "Issue status updated successfully",
  "issue": { ... }
}
```

**Error Responses:**
- `400`: Invalid status value
- `404`: Issue not found

---

## Comment Endpoints (User)

### Create Comment

Adds a comment to an issue.

```http
POST /user/issues/:issueId/comments
```

**Authentication:** Required (User)

**Request Body:**
```json
{
  "content": "This is affecting many residents in our area"
}
```

**Success Response (201):**
```json
{
  "message": "Comment created successfully",
  "comment": {
    "id": "...",
    "content": "This is affecting many residents in our area",
    "issueId": "...",
    "adminId": null,
    "userId": "...",
    "createdAt": "...",
    "updatedAt": "...",
    "user": { ... }
  }
}
```

---

### Get Comments

Returns all comments for an issue.

```http
GET /user/issues/:issueId/comments
```

**Authentication:** Required (User)

**Success Response (200):**
```json
{
  "message": "Comments retrieved successfully",
  "comments": [
    {
      "id": "...",
      "content": "Comment text",
      "issueId": "...",
      "adminId": null,
      "userId": "...",
      "createdAt": "...",
      "updatedAt": "...",
      "admin": null,
      "user": { "id": "...", "number": "+1234567890" }
    }
  ],
  "count": 5
}
```

---

### Update Comment

Updates user's own comment.

```http
PUT /user/comments/:commentId
```

**Authentication:** Required (User)

**Request Body:**
```json
{
  "content": "Updated comment text"
}
```

**Error Responses:**
- `403`: Not authorized (not comment owner)
- `404`: Comment not found

---

### Delete Comment

Deletes user's own comment.

```http
DELETE /user/comments/:commentId
```

**Authentication:** Required (User)

**Success Response (200):**
```json
{
  "message": "Comment deleted successfully"
}
```

---

## Comment Endpoints (Admin)

Admins have the same comment endpoints but can modify any comment:

- `POST /admin/issues/:issueId/comments` - Create comment
- `GET /admin/issues/:issueId/comments` - Get comments
- `PUT /admin/comments/:commentId` - Update any comment
- `DELETE /admin/comments/:commentId` - Delete any comment

---

## Repost Endpoints

### Repost an Issue

Reposts/shares an issue (increases visibility).

```http
POST /user/issues/:issueId/repost
```

**Authentication:** Required (User)

**Note:** Users cannot repost their own issues.

**Success Response (201):**
```json
{
  "message": "Issue reposted successfully",
  "repost": {
    "id": "...",
    "issueId": "...",
    "userId": "...",
    "createdAt": "..."
  }
}
```

**Error Responses:**
- `400`: Cannot repost own issue / Already reposted
- `404`: Issue not found

---

### Check Repost Status

Checks if the user has reposted an issue.

```http
GET /user/issues/:issueId/repost
```

**Authentication:** Required (User)

**Success Response (200):**
```json
{
  "hasReposted": true,
  "repost": {
    "id": "...",
    "issueId": "...",
    "userId": "...",
    "createdAt": "..."
  }
}
```

---

### Remove Repost

Removes user's repost from an issue.

```http
DELETE /user/issues/:issueId/repost
```

**Authentication:** Required (User)

**Success Response (200):**
```json
{
  "message": "Repost removed successfully"
}
```

**Error Responses:**
- `404`: Repost not found

---

## Error Response Format

All error responses follow this format:

```json
{
  "message": "Error description"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production.

---

## Swagger Documentation

Interactive API documentation is available at:
```
http://localhost:3000/api-docs
```

OpenAPI JSON spec:
```
http://localhost:3000/api-docs.json
```
