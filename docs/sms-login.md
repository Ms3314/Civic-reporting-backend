# SMS Phone Login

This document explains how SMS-based OTP authentication works in the application.

## Overview

The application uses Twilio Verify API for secure OTP-based phone authentication. This provides:
- Automatic OTP generation and delivery
- Built-in rate limiting and fraud protection
- OTP expiration handling
- No need to store OTPs in your database

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | `your-auth-token` |
| `TWILIO_VERIFY_SERVICE_SID` | Verify Service SID | `VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `JWT_SECRET` | Secret for signing JWT tokens | `your-secret-key` |
| `JWT_EXPIRES_IN` | Token expiration time | `12h` (default) |

## Finding Twilio Credentials

### 1. Account SID & Auth Token

1. Go to https://console.twilio.com
2. On the Dashboard homepage, find the **Account Info** card (top-left)
3. Copy the **Account SID** (starts with `AC`)
4. Click "Show" to reveal and copy the **Auth Token**

### 2. Verify Service SID

1. In the Twilio Console, go to the left sidebar
2. Click **Verify** → **Services**
3. If you don't have a service:
   - Click **"Create new Verify Service"**
   - Enter a friendly name (e.g., "Hack App OTP")
   - Configure settings as needed
4. Copy the **Service SID** (starts with `VA`)

## Authentication Flow

### 1. Request OTP

```http
POST /api/v1/user/request-otp
Content-Type: application/json

{
  "phone": "+1234567890"
}
```

**What happens:**
1. Server validates phone number format (E.164)
2. Twilio Verify API sends OTP via SMS
3. Twilio handles OTP generation and storage
4. Returns success with verification SID

**Phone Number Format (E.164):**
- Must start with `+`
- Followed by country code
- Then the phone number
- Examples: `+1234567890` (US), `+919876543210` (India)

### 2. Verify OTP

```http
POST /api/v1/user/verify-otp
Content-Type: application/json

{
  "phone": "+1234567890",
  "otp": "123456"
}
```

**What happens:**
1. Server sends verification check to Twilio
2. Twilio validates the OTP
3. If valid:
   - User is auto-registered if new
   - JWT token is generated
   - User info and token returned
4. If invalid: Error returned

## JWT Token

After successful verification, a JWT token is returned:

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

**Token Payload:**
```json
{
  "sub": "user-id",
  "number": "+1234567890",
  "role": "user",
  "iat": 1234567890,
  "exp": 1234611090
}
```

Use this token in the `Authorization` header for protected routes:
```
Authorization: Bearer <token>
```

## Auto-Registration

When a user verifies OTP for the first time:
- A new user record is automatically created
- The phone number becomes their unique identifier
- No separate registration step needed

## Security Features

### Twilio Verify Provides:
- **OTP Generation**: Secure random codes
- **Delivery**: SMS delivery with retry logic
- **Expiration**: OTPs expire after 10 minutes
- **Single Use**: Each OTP can only be used once
- **Rate Limiting**: Built-in protection against abuse
- **Fraud Detection**: Suspicious activity monitoring

### Application Security:
- **E.164 Validation**: Strict phone number format
- **JWT Tokens**: Secure, stateless authentication
- **Token Expiration**: Configurable expiry (default 12h)
- **Role-based Access**: User vs Admin roles

## Error Handling

### Common Errors

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| 60200 | 400 | Invalid phone number format |
| 20404 | 400 | OTP not found (expired or invalid) |
| - | 401 | Invalid or expired OTP |
| - | 500 | SMS service not configured |

### Error Responses

**Invalid Phone Format:**
```json
{
  "message": "Invalid phone number format. Please use E.164 format: +[country code][number]",
  "example": "+1234567890",
  "format": "Must start with + followed by country code and number"
}
```

**Invalid OTP:**
```json
{
  "message": "Invalid or expired OTP."
}
```

**OTP Expired:**
```json
{
  "message": "OTP not found. Request a new one."
}
```

## Testing Without Twilio

For local development without Twilio:

1. You can temporarily modify the code to bypass Twilio
2. Or use Twilio's test credentials (limited functionality)
3. Or set up a Twilio trial account (free SMS credits)

## Twilio Pricing

- **Verify API**: ~$0.05 per verification
- Trial accounts get free credits
- See https://www.twilio.com/verify/pricing

## Code Reference

The authentication logic is in:
- `controller/userController.js` - OTP request/verify handlers
- `middleware/auth.js` - JWT verification middleware
- `lib/prisma.js` - Database client

## Troubleshooting

### "SMS service not configured"
- Check that all Twilio environment variables are set
- Verify the values are correct (no typos)

### "Invalid phone number format"
- Ensure phone starts with `+`
- Include country code (e.g., `+1` for US)
- No spaces or special characters

### "Invalid parameter" (60200)
- Usually means wrong credentials
- Verify TWILIO_ACCOUNT_SID is the Account SID, not Verify Service SID
- Check TWILIO_AUTH_TOKEN is correct

### OTP Not Received
- Check phone number is correct
- Verify Twilio account is active
- Check Twilio console for delivery logs
- May be carrier filtering (especially with trial accounts)
