# Authentication

This document explains the authentication system used in the Hack Backend.

## Overview

The application uses **JWT (JSON Web Tokens)** for authentication with two different flows:

1. **Users (Citizens)**: SMS OTP-based authentication via Twilio Verify
2. **Admins**: Email/password-based authentication

## JWT Tokens

### Token Structure

All JWT tokens contain:

```json
{
  "sub": "user-or-admin-id",
  "role": "user" | "admin",
  "iat": 1234567890,
  "exp": 1234611090
}
```

**User tokens** also include:
```json
{
  "number": "+1234567890"
}
```

**Admin tokens** also include:
```json
{
  "email": "admin@example.com"
}
```

### Using Tokens

Include the token in the `Authorization` header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Token Expiration

- Default: 12 hours
- Configurable via `JWT_EXPIRES_IN` environment variable
- Valid formats: `1h`, `12h`, `7d`, `30d`

## User Authentication (SMS OTP)

### Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │     │   API   │     │ Twilio  │     │   DB    │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ POST /request-otp             │               │
     │──────────────>│               │               │
     │               │ Send OTP      │               │
     │               │──────────────>│               │
     │               │    OK         │               │
     │   OTP Sent    │<──────────────│               │
     │<──────────────│               │               │
     │               │               │               │
     │ POST /verify-otp              │               │
     │──────────────>│               │               │
     │               │ Verify OTP    │               │
     │               │──────────────>│               │
     │               │   Approved    │               │
     │               │<──────────────│               │
     │               │               │  Find/Create  │
     │               │               │     User      │
     │               │──────────────────────────────>│
     │               │               │     User      │
     │   JWT Token   │<──────────────────────────────│
     │<──────────────│               │               │
     │               │               │               │
```

### Endpoints

#### Request OTP
```http
POST /api/v1/user/request-otp
Content-Type: application/json

{
  "phone": "+1234567890"
}
```

**Response (200):**
```json
{
  "message": "OTP sent successfully. Please check your phone.",
  "sid": "VExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

#### Verify OTP
```http
POST /api/v1/user/verify-otp
Content-Type: application/json

{
  "phone": "+1234567890",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful. OTP verified.",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "number": "+1234567890",
    "role": "user"
  }
}
```

### Auto-Registration

New users are automatically registered when they verify OTP for the first time:
- No separate signup endpoint
- Phone number becomes unique identifier
- User record created in database

## Admin Authentication (Email/Password)

### Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  Admin  │     │   API   │     │   DB    │
└────┬────┘     └────┬────┘     └────┬────┘
     │               │               │
     │ POST /login   │               │
     │──────────────>│               │
     │               │  Find Admin   │
     │               │──────────────>│
     │               │    Admin      │
     │               │<──────────────│
     │               │               │
     │               │ Verify Password
     │               │               │
     │   JWT Token   │               │
     │<──────────────│               │
     │               │               │
```

### Endpoint

```http
POST /api/v1/admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Admin logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "admin": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Default Admin Accounts

Seeded admin accounts (password: `random`):
- `ghmc-disasterresponseforce(drf)@gmail.com`
- `ghmc-health&sanitationdept.@gmail.com`
- `ghmc-solidwastemanagement(swm)dept.@gmail.com`
- ... and more (see `prisma/seed.js`)

## Protected Routes

### Middleware

The `authenticate` middleware validates JWT tokens:

```javascript
// middleware/auth.js
import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
```

### Role Checks

Additional middleware for role-based access:

```javascript
export const requireUser = (req, res, next) => {
  if (req.user.role !== "user") {
    return res.status(403).json({ message: "User access required" });
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};
```

### Using in Routes

```javascript
// User-only route
router.post("/issues", authenticate, requireUser, IssueController.createIssue);

// Admin-only route
router.put("/issues/:id/status", authenticate, requireAdmin, AdminController.updateIssueStatus);
```

## Error Responses

### 401 Unauthorized

```json
{
  "message": "Authentication required"
}
```
or
```json
{
  "message": "Invalid or expired token"
}
```

### 403 Forbidden

```json
{
  "message": "User access required"
}
```
or
```json
{
  "message": "Admin access required"
}
```

## Security Considerations

### Current Implementation

1. **JWT Signing**: Uses HS256 algorithm with secret key
2. **Token Expiration**: Configurable, default 12 hours
3. **Twilio Verify**: Handles OTP security (rate limiting, fraud detection)
4. **Phone Validation**: E.164 format required

### Production Recommendations

1. **Password Hashing**: Hash admin passwords (currently plain text)
   ```javascript
   import bcrypt from "bcrypt";
   const hashedPassword = await bcrypt.hash(password, 10);
   ```

2. **HTTPS Only**: Always use HTTPS in production

3. **Refresh Tokens**: Implement refresh token rotation

4. **Rate Limiting**: Add rate limiting to auth endpoints
   ```javascript
   import rateLimit from "express-rate-limit";
   const authLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 5 // 5 attempts
   });
   ```

5. **Token Blacklisting**: Implement logout with token blacklist

6. **Secure Headers**: Add security headers
   ```javascript
   import helmet from "helmet";
   app.use(helmet());
   ```

## Code Reference

- **User Controller**: `controller/userController.js`
- **Admin Controller**: `controller/adminController.js`
- **Auth Middleware**: `middleware/auth.js`
