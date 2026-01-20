# Setup Guide

Complete guide to setting up the Hack Backend for local development.

## Prerequisites

- **Node.js 20+**: https://nodejs.org/
- **Docker Desktop**: https://www.docker.com/products/docker-desktop/
- **Twilio Account**: https://www.twilio.com/try-twilio (for SMS OTP)

## Quick Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd hack-backend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env with your configuration

# 4. Start PostgreSQL (Docker)
docker-compose up postgres -d

# 5. Setup database
npx prisma generate
npx prisma db push
npm run seed

# 6. Start server
npm run dev
```

## Detailed Setup

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- Express.js - Web framework
- Prisma - Database ORM
- JWT - Authentication tokens
- Twilio - SMS OTP
- And other dependencies

### Step 2: Environment Configuration

Create `.env` from the example:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database (Docker PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hack_db?schema=public"

# JWT Configuration
JWT_SECRET="your-secret-key-change-this"
JWT_EXPIRES_IN="12h"

# Twilio (from console.twilio.com)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_VERIFY_SERVICE_SID="VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Optional
PORT=3000
NODE_ENV=development
```

### Step 3: Database Setup

#### Option A: Docker PostgreSQL (Recommended)

```bash
# Make sure no local PostgreSQL is running
brew services stop postgresql@15  # If using Homebrew

# Start Docker PostgreSQL
docker-compose up postgres -d

# Verify it's running
docker ps | grep postgres
```

#### Option B: Local PostgreSQL

If you prefer local PostgreSQL:

```bash
# Install with Homebrew (macOS)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb hack_db
```

Update `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://localhost:5432/hack_db?schema=public"
```

### Step 4: Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with initial data
npm run seed
```

This creates:
- All database tables
- 14 categories (Water, Road, Waste, departments)
- 11 admin accounts

### Step 5: Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
node index.js
```

Server starts at:
- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api-docs

## Verify Setup

### Check Database

```bash
# Open Prisma Studio
npx prisma studio
```

Or via Docker:
```bash
docker exec hack-backend-db psql -U postgres -d hack_db -c "SELECT COUNT(*) FROM \"Category\";"
```

### Test API

```bash
# Get categories
curl http://localhost:3000/api/v1/user/categories

# Should return categories with count: 14
```

### Test Admin Login

```bash
curl -X POST http://localhost:3000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ghmc-disasterresponseforce(drf)@gmail.com","password":"random"}'
```

## Common Issues

### Port 5432 Already in Use

**Problem**: Local PostgreSQL conflicts with Docker.

**Solution**:
```bash
# Stop local PostgreSQL
brew services stop postgresql@15

# Or find and kill the process
lsof -i :5432
kill -9 <PID>
```

### Prisma Client Not Generated

**Problem**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
npx prisma generate
```

### Database Connection Failed

**Problem**: `User was denied access on the database`

**Solution**:
1. Ensure Docker container is running:
   ```bash
   docker ps | grep postgres
   ```
2. Check DATABASE_URL in `.env`
3. Restart Docker container:
   ```bash
   docker-compose down
   docker-compose up postgres -d
   ```

### Twilio Not Configured

**Problem**: `SMS service not configured`

**Solution**: Add Twilio credentials to `.env`:
```env
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-token"
TWILIO_VERIFY_SERVICE_SID="VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## Development Tools

### Prisma Studio

Visual database browser:
```bash
npx prisma studio
```
Opens at http://localhost:5555

### Swagger UI

API documentation:
- http://localhost:3000/api-docs

### Docker Commands

```bash
# Start database
docker-compose up postgres -d

# Stop database
docker-compose down

# View logs
docker logs hack-backend-db

# Reset database (WARNING: destroys data)
docker-compose down -v
docker-compose up postgres -d
npx prisma db push
npm run seed
```

### Useful npm Scripts

```bash
npm run dev      # Start with nodemon (auto-reload)
npm run seed     # Seed database
npm start        # Production start
```

## Mobile App Testing

### Android Emulator
```
http://10.0.2.2:3000
```

### iOS Simulator
```
http://localhost:3000
```

### Physical Device
```
http://<your-local-ip>:3000
```

Find your IP:
```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I
```

## Next Steps

1. Read the [API Reference](./api-reference.md)
2. Understand the [Database Schema](./database-schema.md)
3. Configure [SMS Login](./sms-login.md)
4. Review [Authentication](./authentication.md)
