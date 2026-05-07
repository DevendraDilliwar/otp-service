/**
 * Configuration module
 * Loads environment variables and exports them as a single object
 */

import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  databaseUrl: process.env.DATABASE_URL as string,
  fast2sms: {
    apiKey: process.env.FAST2SMS_API_KEY as string
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY as string,
    fromEmail: process.env.FROM_EMAIL || 'otp@yourdomain.com'
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'supersecret'
  }
};
