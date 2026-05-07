/**
 * Simple Redis-based Rate Limiter for Hono
 */

import { Context, Next } from 'hono';
import redis from '../db/redis.js';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix: string;
}

/**
 * Creates a rate limiter middleware
 */
export const rateLimit = (options: RateLimitOptions) => async (c: Context, next: Next) => {
  const forwardedFor = c.req.header('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
  const key = `ratelimit:${options.keyPrefix}:${ip}`;

  try {
    const current = await redis.get(key);
    const count = current ? parseInt(current) : 0;

    if (count >= options.max) {
      return c.json({
        success: false,
        error: 'RATE_LIMITED',
        message: 'Too many requests, please try again later.'
      }, 429);
    }

    if (!current) {
      await redis.set(key, '1', { PX: options.windowMs });
    } else {
      await redis.incr(key);
    }

    await next();
  } catch (error) {
    console.error('Rate limit error:', error);
    // On redis error, allow request but log it
    await next();
  }
};

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyPrefix: 'global'
});

export const sendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyPrefix: 'send'
});

export const verifyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyPrefix: 'verify'
});
