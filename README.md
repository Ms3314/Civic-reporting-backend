# Hack Backend API

A civic issue reporting and management system backend API built with Express.js, Prisma, and PostgreSQL.

## Features

- **User Authentication**: SMS-based OTP authentication via Twilio
- **Admin Authentication**: Email/password based authentication
- **Issue Management**: Create, view, and manage civic issues
- **Category System**: Organize issues by categories (Water, Road, Waste, etc.)
- **Comment System**: Users and Admins can comment on issues
- **Repost System**: Users can repost/share issues (except their own)
- **Priority Calculation**: Automatic priority scoring based on user ratings and repost counts
- **API Documentation**: Swagger/OpenAPI documentation available at `/api-docs`

## Tech Stack

- Node.js 20+
- Express.js 5
- Prisma ORM 6.x
- PostgreSQL 15+
- JWT Authentication
- Twilio Verify API (for SMS OTP)
- Swagger/OpenAPI

## Quick Start

### Prerequisites

- Node.js 20 or higher
- Docker Desktop (for local PostgreSQL)
- Twilio account (for SMS OTP functionality)

### 1. Clone and Install

```bash
git clone <repository-url>
cd hack-backend
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Local Database

```bash
# Make sure local PostgreSQL is stopped first
brew services stop postgresql@15  # If using Homebrew PostgreSQL

# Start Docker PostgreSQL
docker-compose up postgres -d
```

### 4. Setup Database

```bash
npx prisma generate
npx prisma db push
npm run seed  # Seed categories and admins
```

### 5. Run the Server

```bash
npm run dev
```

Server will be available at:
- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api-docs

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | Secret for JWT token signing | ✅ |
| `JWT_EXPIRES_IN` | Token expiration (default: 12h) | ❌ |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | ✅ |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | ✅ |
| `TWILIO_VERIFY_SERVICE_SID` | Twilio Verify Service SID | ✅ |
| `PORT` | Server port (default: 3000) | ❌ |

### Where to Find Twilio Credentials

1. **TWILIO_ACCOUNT_SID** & **TWILIO_AUTH_TOKEN**: 
   - Go to https://console.twilio.com → Dashboard → Account Info

2. **TWILIO_VERIFY_SERVICE_SID**:
   - Go to https://console.twilio.com → Verify → Services
   - Create a new service if needed
   - Copy the Service SID (starts with `VA`)

## API Documentation

### Base URLs

- User API: `/api/v1/user`
- Admin API: `/api/v1/admin`

### Authentication

All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## API Endpoints

### 🔐 Authentication

#### Request OTP (User)
```http
POST /api/v1/user/request-otp
Content-Type: application/json

{
  "phone": "+1234567890"
}
```
**Response**: `200 OK`
```json
{
  "message": "OTP sent successfully. Please check your phone.",
  "sid": "VExxxxx"
}
```

#### Verify OTP (User)
```http
POST /api/v1/user/verify-otp
Content-Type: application/json

{
  "phone": "+1234567890",
  "otp": "123456"
}
```
**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Login successful. OTP verified.",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "number": "+1234567890",
    "role": "user"
  }
}
```

#### Admin Login
```http
POST /api/v1/admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password"
}
```
**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Admin logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "admin": {
    "id": "uuid",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

---

### 📁 Categories (Public)

#### Get All Categories
```http
GET /api/v1/user/categories
```
**Response**: `200 OK`
```json
{
  "message": "Categories retrieved successfully",
  "categories": [
    {
      "id": "uuid",
      "name": "Water",
      "description": "Water supply, leaks, water quality issues",
      "createdAt": "2024-01-20T00:00:00.000Z",
      "updatedAt": "2024-01-20T00:00:00.000Z"
    }
  ],
  "count": 14
}
```

#### Get Category by ID
```http
GET /api/v1/user/categories/:id
```

---

### 📝 Issues (User - Protected)

#### Create Issue
```http
POST /api/v1/user/issues
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Large pothole on main road",
  "description": "There is a dangerous pothole near the intersection",
  "categoryId": "uuid",
  "importanceRating": 4,
  "image": "https://example.com/image.jpg"  // optional
}
```
**Response**: `201 Created`
```json
{
  "message": "Issue created successfully",
  "issue": {
    "id": "uuid",
    "title": "Large pothole on main road",
    "description": "There is a dangerous pothole near the intersection",
    "image": null,
    "importanceRating": 4,
    "status": 0,
    "categoryId": "uuid",
    "userId": "uuid",
    "createdAt": "2024-01-20T00:00:00.000Z",
    "updatedAt": "2024-01-20T00:00:00.000Z",
    "category": { ... },
    "user": { ... }
  }
}
```

#### Get All Issues
```http
GET /api/v1/user/issues
Authorization: Bearer <token>
```

#### Get My Issues
```http
GET /api/v1/user/issues/my-issues
Authorization: Bearer <token>
```

#### Get Issue by ID
```http
GET /api/v1/user/issues/:id
Authorization: Bearer <token>
```

---

### 📝 Issues (Admin - Protected)

#### Get All Issues
```http
GET /api/v1/admin/issues
Authorization: Bearer <token>
```

#### Get Issue by ID
```http
GET /api/v1/admin/issues/:id
Authorization: Bearer <token>
```

#### Update Issue Status
```http
PUT /api/v1/admin/issues/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": 2
}
```
**Status Values**: 0 (Pending) → 5 (Resolved)

---

### 💬 Comments (User - Protected)

#### Create Comment
```http
POST /api/v1/user/issues/:issueId/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "This is affecting many residents"
}
```

#### Get Comments
```http
GET /api/v1/user/issues/:issueId/comments
Authorization: Bearer <token>
```

#### Update Comment (Own only)
```http
PUT /api/v1/user/comments/:commentId
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Updated comment"
}
```

#### Delete Comment (Own only)
```http
DELETE /api/v1/user/comments/:commentId
Authorization: Bearer <token>
```

---

### 💬 Comments (Admin - Protected)

#### Create Comment
```http
POST /api/v1/admin/issues/:issueId/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "We are working on this issue"
}
```

#### Update/Delete Comments
Same as user endpoints but admin can modify any comment.

---

### 🔄 Reposts (User - Protected)

#### Repost an Issue
```http
POST /api/v1/user/issues/:issueId/repost
Authorization: Bearer <token>
```
**Note**: Users cannot repost their own issues.

#### Check Repost Status
```http
GET /api/v1/user/issues/:issueId/repost
Authorization: Bearer <token>
```
**Response**: `200 OK`
```json
{
  "hasReposted": true,
  "repost": {
    "id": "uuid",
    "issueId": "uuid",
    "userId": "uuid",
    "createdAt": "2024-01-20T00:00:00.000Z"
  }
}
```

#### Remove Repost
```http
DELETE /api/v1/user/issues/:issueId/repost
Authorization: Bearer <token>
```

---

## Database Schema

### Models

| Model | Description |
|-------|-------------|
| `User` | Mobile app users (citizens) |
| `Admin` | Dashboard administrators |
| `Issue` | Reported civic issues |
| `Category` | Issue categories |
| `Comment` | Comments on issues |
| `Repost` | Issue reposts by users |
| `PhoneOtp` | OTP verification records |

### Issue Status Values

| Value | Meaning |
|-------|---------|
| 0 | Pending |
| 1 | Acknowledged |
| 2 | In Progress |
| 3 | Under Review |
| 4 | Near Completion |
| 5 | Resolved |

### Importance Rating

Users can rate issues from **0-5** based on urgency.

---

## Docker Setup

### Using Docker Compose (Recommended)

```bash
# Start PostgreSQL only
docker-compose up postgres -d

# Start both PostgreSQL and API
docker-compose up -d
```

### Important: Local PostgreSQL Conflict

If you have Homebrew PostgreSQL installed, it may conflict with Docker. Stop it first:

```bash
brew services stop postgresql@15
```

### Database Connection

Local Docker PostgreSQL:
```
postgresql://postgres:postgres@localhost:5432/hack_db
```

---

## Development

### Useful Commands

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Run migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio

# Seed database
npm run seed

# Start development server
npm run dev
```

### Project Structure

```
hack-backend/
├── controller/          # Route handlers
│   ├── adminController.js
│   ├── categoryController.js
│   ├── commentController.js
│   ├── issueController.js
│   ├── repostController.js
│   └── userController.js
├── docs/                # Documentation
├── lib/
│   └── prisma.js        # Prisma client instance
├── middleware/
│   └── auth.js          # Authentication middleware
├── prisma/
│   ├── migrations/      # Database migrations
│   ├── schema.prisma    # Database schema
│   └── seed.js          # Database seeder
├── routes/
│   ├── admin.js         # Admin routes
│   └── user.js          # User routes
├── utils/
│   └── priority.js      # Priority calculation
├── index.js             # App entry point
└── docker-compose.yml   # Docker configuration
```

---

## Testing

### Test with cURL

```bash
# Get categories
curl http://localhost:3000/api/v1/user/categories

# Admin login
curl -X POST http://localhost:3000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ghmc-disasterresponseforce(drf)@gmail.com","password":"random"}'

# Create issue (with token)
curl -X POST http://localhost:3000/api/v1/user/issues \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test issue","categoryId":"<category-id>","importanceRating":3}'
```

---

## Emulator Access

- **Android Emulator**: http://10.0.2.2:3000
- **iOS Simulator**: http://localhost:3000
- **Physical Device**: http://<your-local-ip>:3000

---

## License

ISC
