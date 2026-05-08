/**
 * Core OTP Service
 * Handles generation, storage in Redis, and verification of OTPs
 */

import { randomInt } from 'crypto';
import { SignJWT } from 'jose';
import { config } from '../config/index.js';
import redis from '../db/redis.js';
import { db } from '../db/index.js';
import { otpLogs, sessions } from '../db/schema.js';

const OTP_EXPIRY = 120; // 120 seconds
const RESEND_COOLDOWN = 60; // 60 seconds
const MAX_ATTEMPTS = 3;
const MAX_RESENDS_PER_HOUR = 3;

export type OTPType = 'phone' | 'email';
export type OTPAction = 'sent' | 'verified' | 'failed' | 'expired';

/**
 * Generates a 6-digit OTP
 */
export function generateOTP(): string {
  return randomInt(100000, 999999).toString();
}

/**
 * Generates a session JWT token
 */
export async function generateSessionToken(type: OTPType, identifier: string): Promise<string> {
  const secret = new TextEncoder().encode(config.security.jwtSecret);
  
  return await new SignJWT({ 
    identifier, 
    type,
    authorized: true 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Token valid for 7 days
    .sign(secret);
}

/**
 * Stores OTP in Redis with expiry
 */
export async function storeOTP(type: OTPType, identifier: string, otp: string) {
  const key = `otp:${type}:${identifier}`;
  const data = JSON.stringify({
    otp,
    attempts: 0,
    createdAt: Date.now()
  });
  
  await redis.set(key, data, {
    EX: OTP_EXPIRY
  });

  console.log(`[OTP Service] Stored OTP in Redis for ${identifier}. TTL: ${OTP_EXPIRY}s`);

  await logOTPAction(type, identifier, 'sent');
}

/**
 * Verifies OTP and handles session creation
 */
export async function verifyOTP(type: OTPType, identifier: string, otp: string) {
  const key = `otp:${type}:${identifier}`;
  const storedData = await redis.get(key);

  if (!storedData) {
    return { success: false, error: 'OTP_EXPIRED' };
  }

  const { otp: storedOtp, attempts } = JSON.parse(storedData);

  if (storedOtp === otp) {
    await redis.del(key);
    const token = await generateSessionToken(type, identifier);
    
    // Store session in Postgres using Drizzle
    await db.insert(sessions).values({
      token,
      type,
      identifier,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    await logOTPAction(type, identifier, 'verified');
    return { success: true, token };
  } else {
    const newAttempts = attempts + 1;
    if (newAttempts >= MAX_ATTEMPTS) {
      await redis.del(key);
      await logOTPAction(type, identifier, 'failed');
      return { success: false, error: 'MAX_ATTEMPTS' };
    }

    await redis.set(key, JSON.stringify({ otp: storedOtp, attempts: newAttempts, createdAt: Date.now() }), {
      KEEPTTL: true
    });

    return { success: false, error: 'OTP_INVALID' };
  }
}

/**
 * Checks if resend is allowed
 */
export async function canResend(type: OTPType, identifier: string) {
  const cooldownKey = `otp:resend:${type}:${identifier}`;
  const hourlyKey = `otp:limit:${type}:${identifier}`;

  const hasCooldown = await redis.get(cooldownKey);
  if (hasCooldown) {
    return { allowed: false, error: 'RESEND_COOLDOWN' };
  }

  const resendCount = await redis.get(hourlyKey) || '0';
  if (parseInt(resendCount) >= MAX_RESENDS_PER_HOUR) {
    return { allowed: false, error: 'RATE_LIMITED' };
  }

  return { allowed: true };
}

/**
 * Updates resend limits in Redis
 */
export async function updateResendLimits(type: OTPType, identifier: string) {
  const cooldownKey = `otp:resend:${type}:${identifier}`;
  const hourlyKey = `otp:limit:${type}:${identifier}`;

  await redis.set(cooldownKey, '1', { EX: RESEND_COOLDOWN });

  const count = await redis.incr(hourlyKey);
  if (count === 1) {
    await redis.expire(hourlyKey, 3600); // 1 hour
  }
}

/**
 * Logs OTP action to PostgreSQL using Drizzle
 */
export async function logOTPAction(type: OTPType, identifier: string, action: OTPAction, ip?: string) {
  try {
    console.log(`[OTP Service] Logging action '${action}' for ${identifier} to Postgres...`);
    await db.insert(otpLogs).values({
      type,
      identifier,
      action,
      ipAddress: ip
    });
    console.log(`[OTP Service] Successfully logged action to Postgres.`);
  } catch (err) {
    console.error('Failed to log OTP action:', err);
  }
}
