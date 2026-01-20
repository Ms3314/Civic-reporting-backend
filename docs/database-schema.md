# Database Schema

This document describes the database schema for the Hack Backend application.

## Overview

The application uses PostgreSQL with Prisma ORM. The schema is defined in `prisma/schema.prisma`.

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │    Issue    │       │   Category  │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │──────<│ userId (FK) │       │ id (PK)     │
│ number      │       │ id (PK)     │>──────│ name        │
│ createdAt   │       │ title       │       │ description │
│ updatedAt   │       │ description │       │ createdAt   │
└─────────────┘       │ image       │       │ updatedAt   │
      │               │ importance  │       └─────────────┘
      │               │ status      │
      │               │ categoryId  │
      │               │ createdAt   │
      │               │ updatedAt   │
      │               └─────────────┘
      │                     │
      │                     │
      v                     v
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Repost    │       │   Comment   │       │    Admin    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ issueId (FK)│       │ content     │       │ email       │
│ userId (FK) │       │ issueId (FK)│       │ password    │
│ createdAt   │       │ adminId (FK)│──────<│ createdAt   │
└─────────────┘       │ userId (FK) │       │ updatedAt   │
                      │ createdAt   │       └─────────────┘
                      │ updatedAt   │
                      └─────────────┘
```

## Models

### User

Mobile app users (citizens) who can report issues.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (UUID) | PK, auto-generated | Unique identifier |
| number | String | Unique | Phone number (E.164 format) |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto-updated | Last update timestamp |

**Relations:**
- `issues`: One-to-many with Issue
- `reposts`: One-to-many with Repost
- `comments`: One-to-many with Comment

**Prisma Schema:**
```prisma
model User {
  id        String   @id @default(uuid())
  number    String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  issues    Issue[]
  reposts   Repost[]
  comments  Comment[]
}
```

---

### Admin

Dashboard administrators who manage issues.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (UUID) | PK, auto-generated | Unique identifier |
| email | String | Unique | Admin email address |
| password | String | Required | Plain text password (should be hashed in production) |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto-updated | Last update timestamp |

**Relations:**
- `comments`: One-to-many with Comment

**Prisma Schema:**
```prisma
model Admin {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  comments  Comment[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

### Issue

Civic issues reported by users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (UUID) | PK, auto-generated | Unique identifier |
| title | String | Required | Issue title |
| description | String | Required | Detailed description |
| image | String | Optional | Image URL |
| importanceRating | Int | Default: 0 | User-set importance (0-5) |
| status | Int | Default: 0 | Admin-set status (0-5) |
| categoryId | String (UUID) | FK → Category | Category reference |
| userId | String (UUID) | FK → User | Reporter reference |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto-updated | Last update timestamp |

**Status Values:**
| Value | Meaning |
|-------|---------|
| 0 | Pending |
| 1 | Acknowledged |
| 2 | In Progress |
| 3 | Under Review |
| 4 | Near Completion |
| 5 | Resolved |

**Relations:**
- `category`: Many-to-one with Category
- `user`: Many-to-one with User
- `comments`: One-to-many with Comment
- `reposts`: One-to-many with Repost

**Prisma Schema:**
```prisma
model Issue {
  id               String   @id @default(uuid())
  title            String
  description      String
  image            String?
  importanceRating Int      @default(0)
  status           Int      @default(0)
  categoryId       String
  category         Category @relation(fields: [categoryId], references: [id])
  userId           String
  user             User     @relation(fields: [userId], references: [id])
  comments         Comment[]
  reposts          Repost[]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

---

### Category

Categories for organizing issues.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (UUID) | PK, auto-generated | Unique identifier |
| name | String | Unique, Required | Category name |
| description | String | Optional | Category description |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto-updated | Last update timestamp |

**Default Categories:**
- Water - Water supply, leaks, water quality issues
- Road - Road conditions, potholes, street lights
- Waste - Garbage collection, waste management

**Relations:**
- `issues`: One-to-many with Issue

**Prisma Schema:**
```prisma
model Category {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  issues      Issue[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

### Comment

Comments on issues by users or admins.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (UUID) | PK, auto-generated | Unique identifier |
| content | String | Required | Comment text |
| issueId | String (UUID) | FK → Issue | Issue reference |
| adminId | String (UUID) | FK → Admin, Optional | Admin author (if admin comment) |
| userId | String (UUID) | FK → User, Optional | User author (if user comment) |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto-updated | Last update timestamp |

**Notes:**
- Either `adminId` OR `userId` should be set, not both
- Cascade delete: Comments are deleted when the parent Issue is deleted

**Indexes:**
- `issueId` - For faster comment retrieval

**Prisma Schema:**
```prisma
model Comment {
  id        String   @id @default(uuid())
  content   String
  issueId   String
  issue     Issue    @relation(fields: [issueId], references: [id], onDelete: Cascade)
  adminId   String?
  admin     Admin?   @relation(fields: [adminId], references: [id])
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([issueId])
}
```

---

### Repost

Tracks when users repost/share issues.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (UUID) | PK, auto-generated | Unique identifier |
| issueId | String (UUID) | FK → Issue | Issue being reposted |
| userId | String (UUID) | FK → User | User who reposted |
| createdAt | DateTime | Default: now() | Creation timestamp |

**Constraints:**
- Unique constraint on `[issueId, userId]` - Prevents duplicate reposts
- Cascade delete: Reposts are deleted when the parent Issue or User is deleted

**Business Rules:**
- Users cannot repost their own issues
- Each user can only repost an issue once

**Indexes:**
- `issueId` - For counting reposts per issue
- `userId` - For finding user's reposts

**Prisma Schema:**
```prisma
model Repost {
  id        String   @id @default(uuid())
  issueId   String
  issue     Issue    @relation(fields: [issueId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([issueId, userId])
  @@index([issueId])
  @@index([userId])
}
```

---

### PhoneOtp

Stores OTP verification records (legacy - now using Twilio Verify).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (UUID) | PK, auto-generated | Unique identifier |
| phone | String | Required | Phone number |
| code | String | Required | OTP code |
| expiresAt | DateTime | Required | Expiration time |
| consumed | Boolean | Default: false | Whether OTP was used |
| createdAt | DateTime | Default: now() | Creation timestamp |

**Note:** This model is kept for backward compatibility but is not actively used when Twilio Verify is configured.

**Prisma Schema:**
```prisma
model PhoneOtp {
  id        String   @id @default(uuid())
  phone     String
  code      String
  expiresAt DateTime
  consumed  Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([phone, consumed])
}
```

---

## Migrations

Migrations are stored in `prisma/migrations/`.

### Running Migrations

```bash
# Development - create and apply migrations
npx prisma migrate dev

# Production - apply pending migrations
npx prisma migrate deploy

# Reset database (WARNING: destroys data)
npx prisma migrate reset
```

### Seeding

Seed data is defined in `prisma/seed.js`:

```bash
npm run seed
# or
npx prisma db seed
```

This creates:
- 3 basic categories (Water, Road, Waste)
- 11 department-specific categories
- 11 admin accounts (one per department)

---

## Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Push schema changes (no migration)
npx prisma db push

# Open Prisma Studio (GUI)
npx prisma studio

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```
