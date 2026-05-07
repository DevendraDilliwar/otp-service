/**
 * Validation Middleware
 * Uses Zod to validate request bodies for Hono
 */

import { Context, Next } from 'hono';
import { z } from 'zod';

export const phoneSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Must be 10-digit Indian number')
});

export const emailSchema = z.object({
  email: z.string().email('Invalid email address')
});

export const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits')
});

/**
 * Validates request body against a schema
 */
export const validate = (schema: z.ZodObject<any>) => async (c: Context, next: Next) => {
  try {
    const body = await c.req.json();
    schema.parse(body);
    await next();
  } catch (error: any) {
    return c.json({
      success: false,
      error: 'INVALID_INPUT',
      message: error.errors?.[0]?.message || 'Invalid input'
    }, 400);
  }
};
