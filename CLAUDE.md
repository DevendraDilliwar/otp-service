# otp-service — CLAUDE.md

> This file is the single source of truth for Claude when building this project.
> Read this fully before writing any code.

---

## Project Overview

**Name:** otp-service  
**Goal:** A self-hosted, open-source OTP verification system for both Phone (SMS) and Email — built from scratch using Node.js.  
**GitHub:** Will be open-sourced. Keep code clean, well-commented, and beginner-friendly.  
**Model:** Claude Sonnet (Antigravity IDE)

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Runtime | Node.js (v18+) | Fast, widely used |
| Framework | Hono | Modern, fast, TypeScript-first |
| OTP Cache | Redis | TTL-based auto-expiry |
| Database | Neon (PostgreSQL) | Serverless Postgres |
| ORM | Drizzle | Type-safe, lightweight ORM |
| SMS Gateway | Fast2SMS | Cheapest India SMS (₹0.25/OTP) |
| Email | Resend | Free 3000 emails/month |
| Language | TypeScript | Type safety |
| Config | dotenv | Environment variables |
| Validation | zod | Input validation |

---

Build EXACTLY this structure — do not deviate:

```
backend/
├── src/
│   ├── config/
│   │   └── index.ts          # All env vars loaded here
│   ├── db/
│   │   ├── index.ts          # Drizzle client initialization
│   │   ├── schema.ts         # Drizzle schema definitions
│   │   └── redis.ts          # Redis connection + helpers
│   ├── controllers/
│   │   ├── phone.controller.ts # logic for /api/phone/*
│   │   └── email.controller.ts # logic for /api/email/*
│   ├── services/
│   │   ├── otp.service.ts    # Core OTP logic
│   │   ├── sms.service.ts    # Fast2SMS API call
│   │   └── email.service.ts  # Resend API call
│   ├── routes/
│   │   ├── phone.routes.ts   # /api/phone/* routes
│   │   └── email.routes.ts   # /api/email/* routes
│   ├── middleware/
│   │   ├── rateLimiter.ts    # Rate limiting
│   │   └── validator.ts      # Zod input validation
│   └── index.ts              # Hono app entry point
├── drizzle/                  # Generated migrations
├── drizzle.config.ts         # Drizzle configuration
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
└── CLAUDE.md
```

---

## API Endpoints

Build these 6 endpoints — nothing more, nothing less:

### Phone OTP
```
POST /api/phone/send
Body: { "phone": "9876543210" }
Response: { "success": true, "message": "OTP sent", "expiresIn": 120 }

POST /api/phone/verify
Body: { "phone": "9876543210", "otp": "482910" }
Response: { "success": true, "token": "sess_xxxx" }

POST /api/phone/resend
Body: { "phone": "9876543210" }
Response: { "success": true, "message": "OTP resent" }
```

### Email OTP
```
POST /api/email/send
Body: { "email": "user@example.com" }
Response: { "success": true, "message": "OTP sent", "expiresIn": 120 }

POST /api/email/verify
Body: { "email": "user@example.com", "otp": "482910" }
Response: { "success": true, "token": "sess_xxxx" }

POST /api/email/resend
Body: { "email": "user@example.com" }
Response: { "success": true, "message": "OTP resent" }
```

---

## Core OTP Logic — otp.service.js

This is the brain of the project. Build it with these rules:

### OTP Generation
```js
// ALWAYS use crypto — never Math.random() (not secure)
import { randomInt } from 'crypto'
const otp = randomInt(100000, 999999).toString()
```

### Redis Key Structure
```
otp:phone:9876543210  →  { otp: "482910", attempts: 0, createdAt: timestamp }
otp:email:user@x.com  →  { otp: "291034", attempts: 0, createdAt: timestamp }
otp:resend:phone:9876543210  →  "1"   (cooldown key, TTL 60s)
```

### Rules to implement
- OTP expires in **120 seconds** (Redis TTL)
- Max **3 wrong attempts** → invalidate OTP
- Resend cooldown: **60 seconds** between resends
- Max **3 resends per hour** per phone/email
- On success → delete OTP from Redis, generate session token, log to Postgres

### Session Token
```js
import { randomBytes } from 'crypto'
const token = 'sess_' + randomBytes(32).toString('hex')
// Store in Postgres with phone/email + timestamp
```

---

## Environment Variables

Create `.env.example` with these — Claude must never hardcode secrets:

```env
# Server
PORT=3000
NODE_ENV=development

# Redis
REDIS_URL=redis://localhost:6379

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/otpservice

# Fast2SMS (Phone OTP)
FAST2SMS_API_KEY=your_fast2sms_api_key_here

# Resend (Email OTP)
RESEND_API_KEY=re_your_resend_api_key_here
FROM_EMAIL=otp@yourdomain.com

# Security
JWT_SECRET=your_random_secret_here
```

---

## Fast2SMS Integration — sms.service.js

```js
// Fast2SMS API call — exactly like this
export async function sendSMS(phone, otp) {
  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      'authorization': process.env.FAST2SMS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      route: 'otp',
      variables_values: otp,
      flash: 0,
      numbers: phone
    })
  })
  const data = await response.json()
  if (!data.return) throw new Error('SMS failed: ' + data.message)
  return data
}
```

---

## Resend Integration — email.service.js

```js
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(email, otp) {
  await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to: email,
    subject: 'Your OTP Code',
    html: `
      <h2>Your OTP is: <strong>${otp}</strong></h2>
      <p>Valid for 2 minutes. Do not share with anyone.</p>
    `
  })
}
```

---

## PostgreSQL Schema

Create this schema on startup — in `db/postgres.js`:

```sql
CREATE TABLE IF NOT EXISTS otp_logs (
  id SERIAL PRIMARY KEY,
  type VARCHAR(10) NOT NULL,        -- 'phone' or 'email'
  identifier VARCHAR(255) NOT NULL, -- phone number or email
  action VARCHAR(20) NOT NULL,      -- 'sent', 'verified', 'failed', 'expired'
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(10) NOT NULL,
  identifier VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);
```

---

## Error Handling

All API responses must follow this format — no exceptions:

```js
// Success
{ "success": true, "message": "...", "data": {} }

// Error
{ "success": false, "error": "OTP_EXPIRED", "message": "OTP has expired. Please request a new one." }
```

Error codes to use:
- `INVALID_INPUT` — bad phone/email format
- `OTP_EXPIRED` — TTL exceeded
- `OTP_INVALID` — wrong code entered
- `MAX_ATTEMPTS` — 3 wrong attempts
- `RESEND_COOLDOWN` — resend before 60s
- `RATE_LIMITED` — too many requests
- `SEND_FAILED` — gateway error

---

## Validation Rules

Use Zod for all input validation:

```js
// Phone: Indian 10-digit number
const phoneSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Must be 10-digit Indian number')
})

// Email: standard format
const emailSchema = z.object({
  email: z.string().email('Invalid email address')
})

// OTP: 6-digit numeric
const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits')
})
```

---

## Rate Limiting — middleware/rateLimiter.js

Use `express-rate-limit` package:

```js
// Global: max 100 requests per 15 min per IP
// Send OTP: max 3 per hour per phone/email
// Verify OTP: max 10 per hour per phone/email
```

---

## README.md Requirements

Write a clean README with:
1. What this project does (1 paragraph)
2. Prerequisites (Node 18+, Redis, Postgres, Fast2SMS account, Resend account)
3. Installation steps (clone → npm install → setup .env → npm start)
4. API documentation (all 6 endpoints with curl examples)
5. Cost breakdown (₹0.25/OTP Fast2SMS, free email Resend)
6. Contributing guide
7. License (MIT)

---

## Code Style Rules

Claude must follow these while writing code:

- Use **ES Modules** (`import/export`) — not CommonJS (`require`)
- Use **async/await** — never callbacks
- Every function must have a **JSDoc comment**
- Every file must have a **top comment** explaining what it does
- No `console.log` in production — use a simple logger
- All secrets from `process.env` — never hardcoded
- Keep functions **small** — max 30 lines per function
- Handle all **try/catch** — never let unhandled promise rejections crash

---

## Build Order

Claude must build in this exact order:

1. `package.json` — dependencies first
2. `.env.example` — environment template
3. `src/config/index.js` — load all env vars
4. `src/db/redis.js` — Redis connection
5. `src/db/postgres.js` — Postgres connection + schema
6. `src/services/otp.service.js` — core logic
7. `src/services/sms.service.js` — Fast2SMS
8. `src/services/email.service.js` — Resend
9. `src/middleware/validator.js` — Zod validation
10. `src/middleware/rateLimiter.js` — rate limiting
11. `src/routes/phone.routes.js` — phone endpoints
12. `src/routes/email.routes.js` — email endpoints
13. `src/app.js` — wire everything together
14. `README.md` — documentation

---

## Dependencies to install

```json
{
  "dependencies": {
    "hono": "^4.0.0",
    "@hono/node-server": "^1.8.0",
    "redis": "^4.6.10",
    "drizzle-orm": "^0.30.0",
    "@neondatabase/serverless": "^0.9.0",
    "resend": "^2.0.0",
    "zod": "^3.22.4",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.11.0",
    "tsx": "^4.7.0",
    "drizzle-kit": "^0.20.14"
  }
}
```

---

## What NOT to build

- No frontend UI (this is a backend API only)
- No JWT auth middleware (just return session token, keep it simple)
- No Docker setup (keep it simple for now)
- No TypeScript (plain JS, beginner friendly)
- No test files (add later)

---

## Open Source Checklist

Before pushing to GitHub:
- [ ] `.gitignore` includes `.env`, `node_modules/`
- [ ] `.env.example` has all variables (no real values)
- [ ] README.md is complete
- [ ] MIT License file added
- [ ] Code is commented
- [ ] No API keys in code

---

*This CLAUDE.md was written for the otp-service open source project.*
*SMS: Fast2SMS (India) | Email: Resend | Stack: Node.js + Redis + PostgreSQL*