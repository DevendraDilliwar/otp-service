/**
 * Phone OTP Routes
 * Defines endpoints for phone-based OTP
 */

import { Hono } from 'hono';
import { phoneController } from '../controllers/phone.controller.js';
import { validate, phoneSchema, otpSchema } from '../middleware/validator.js';
import { sendLimiter, verifyLimiter } from '../middleware/rateLimiter.js';

const phoneRoutes = new Hono();

// Merge for verify
const phoneVerifySchema = phoneSchema.merge(otpSchema);

phoneRoutes.post('/send', sendLimiter, validate(phoneSchema), phoneController.send);
phoneRoutes.post('/verify', verifyLimiter, validate(phoneVerifySchema), phoneController.verify);
phoneRoutes.post('/resend', sendLimiter, validate(phoneSchema), phoneController.resend);

export default phoneRoutes;
