/**
 * Email OTP Routes
 * Defines endpoints for email-based OTP
 */

import { Hono } from 'hono';
import { emailController } from '../controllers/email.controller.js';
import { validate, emailSchema, otpSchema } from '../middleware/validator.js';
import { sendLimiter, verifyLimiter } from '../middleware/rateLimiter.js';

const emailRoutes = new Hono();

// Merge for verify
const emailVerifySchema = emailSchema.merge(otpSchema);

emailRoutes.post('/send', sendLimiter, validate(emailSchema), emailController.send);
emailRoutes.post('/verify', verifyLimiter, validate(emailVerifySchema), emailController.verify);
emailRoutes.post('/resend', sendLimiter, validate(emailSchema), emailController.resend);

export default emailRoutes;
