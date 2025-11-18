# Hack Backend API

A civic issue reporting and management system backend API built with Express.js, Prisma, and PostgreSQL.

## Features

- **User Authentication**: SMS-based OTP authentication via Twilio
- **Admin Authentication**: Email/password based authentication
- **Issue Management**: Create, view, and manage civic issues
- **Category System**: Organize issues by categories (Water, Road, Waste, etc.)
- **Comment System**: Admins can comment on issues
- **Repost System**: Users can repost/share issues
- **Priority Calculation**: Automatic priority scoring based on user ratings and repost counts
- **API Documentation**: Swagger/OpenAPI documentation available at `/api-docs`

## Tech Stack

- Node.js 20
- Express.js 5
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Twilio (for SMS OTP)
- Swagger/OpenAPI

## Prerequisites

- Node.js 20 or higher
- PostgreSQL 15 or higher
- Twilio account (for SMS OTP functionality)

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Seed the database (optional):
```bash
npm run seed
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
node index.js
```

## Docker Setup

### Using Docker Compose (Recommended for Development)

1. Copy `.env.example` to `.env` and configure your environment variables
2. Run:
```bash
docker-compose up
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 3000

### Using Dockerfile

1. Build the image:
```bash
docker build -t hack-backend .
```

2. Run the container:
```bash
docker run -p 3000:3000 --env-file .env hack-backend
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI JSON**: http://localhost:3000/api-docs.json

## API Endpoints

### Authentication
- `POST /api/v1/user/request-otp` - Request OTP for user login
- `POST /api/v1/user/verify-otp` - Verify OTP and get JWT token
- `POST /api/v1/admin/login` - Admin login

### Categories (Public)
- `GET /api/v1/user/categories` - Get all categories
- `GET /api/v1/user/categories/:id` - Get category by ID

### User Issues (Protected)
- `POST /api/v1/user/issues` - Create a new issue
- `GET /api/v1/user/issues` - Get user's issues
- `GET /api/v1/user/issues/:id` - Get issue by ID

### Admin Issues (Protected)
- `GET /api/v1/admin/issues` - Get all issues
- `GET /api/v1/admin/issues/:id` - Get issue by ID
- `PUT /api/v1/admin/issues/:id/status` - Update issue status

### Comments (Protected)
- `GET /api/v1/user/issues/:issueId/comments` - Get comments (users)
- `POST /api/v1/admin/issues/:issueId/comments` - Create comment (admin)
- `PUT /api/v1/admin/comments/:commentId` - Update comment (admin)
- `DELETE /api/v1/admin/comments/:commentId` - Delete comment (admin)

### Reposts (Protected)
- `POST /api/v1/user/issues/:issueId/repost` - Repost an issue
- `DELETE /api/v1/user/issues/:issueId/repost` - Remove repost
- `GET /api/v1/user/issues/:issueId/repost` - Check repost status

## Categories

The system includes the following default categories:
- **Water**: Water supply, leaks, water quality issues
- **Road**: Road conditions, potholes, street lights, traffic issues
- **Waste**: Garbage collection, waste management, sanitation

Additional department categories are also seeded (see `prisma/seed.js`).

## Environment Variables

See `.env.example` for all required environment variables.

## Database Migrations

Run migrations:
```bash
npx prisma migrate dev
```

Deploy migrations (production):
```bash
npx prisma migrate deploy
```

## License

ISC

