SMS Phone Login
================

Environment variables
---------------------
- `DATABASE_URL`: Prisma connection string.
- `JWT_SECRET`: secret used to sign login tokens (`JWT_EXPIRES_IN` optional).
- `PHONE_LOGIN_OTP_TTL_MS`: optional override for OTP lifetime in ms (default 300000).
- `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`: credentials for sending SMS.
- Either `TWILIO_MESSAGING_SERVICE_SID` or `TWILIO_PHONE_NUMBER`: determines the sender.
- `ALLOWED_ORIGINS`: comma-separated list for CORS (leave empty to allow all in dev).

Workflow
--------
1. `POST /api/v1/user/auth/login/request-otp`
   - Body: `{ "phone": "<E.164 phone>" }`
   - Generates a 6-digit OTP, stores a hashed copy in `PhoneOtp`, and sends it over SMS.
2. `POST /api/v1/user/auth/login/verify-otp`
   - Body: `{ "phone": "<E.164 phone>", "otp": "123456" }`
   - Validates the OTP, marks it as consumed, and if the user exists returns a signed JWT plus basic user info.

Notes
-----
- OTPs expire after the configured TTL and can be used only once.
- Users must exist ahead of time; extend the flow to auto-register if needed.
- Run `npx prisma migrate dev` after updating the schema to create the `PhoneOtp` table.

