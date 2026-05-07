/**
 * Email OTP Controller
 * Handles HTTP logic for email-based OTP
 */

import { Context } from 'hono';
import { generateOTP, storeOTP, verifyOTP, canResend, updateResendLimits } from '../services/otp.service.js';
import { sendEmail } from '../services/email.service.js';

export const emailController = {
  /**
   * Sends OTP to email
   */
  send: async (c: Context) => {
    try {
      const { email } = await c.req.json();
      console.log(`[Email Controller] Received send request for: ${email}`);
      
      const check = await canResend('email', email);
      if (!check.allowed) {
        console.warn(`[Email Controller] Resend denied for ${email}: ${check.error}`);
        return c.json({ success: false, error: check.error }, 429);
      }

      const otp = generateOTP();
      // OTP logging removed for security
      
      await storeOTP('email', email, otp);
      await updateResendLimits('email', email);
      
      console.log(`[Email Controller] Attempting to send Email to ${email}...`);
      await sendEmail(email, otp);
      console.log(`[Email Controller] Email sent successfully to ${email}`);

      return c.json({
        success: true,
        message: 'OTP sent',
        expiresIn: 120
      });
    } catch (error: any) {
      console.error('Email send error:', error);
      return c.json({
        success: false,
        error: 'SEND_FAILED',
        message: error.message
      }, 500);
    }
  },

  /**
   * Verifies OTP for email
   */
  verify: async (c: Context) => {
    try {
      const { email, otp } = await c.req.json();
      console.log(`[Email Controller] Received verify request for ${email} with OTP: ${otp}`);
      
      const result = await verifyOTP('email', email, otp);

      if (result.success) {
        console.log(`[Email Controller] Verification successful for ${email}`);
        return c.json({
          success: true,
          token: result.token
        });
      } else {
        console.warn(`[Email Controller] Verification failed for ${email}: ${result.error}`);
        const status = result.error === 'OTP_EXPIRED' ? 410 : 400;
        return c.json({
          success: false,
          error: result.error,
          message: result.error === 'OTP_EXPIRED' ? 'OTP has expired' : 'Invalid OTP'
        }, status);
      }
    } catch (error) {
      console.error('Email verify error:', error);
      return c.json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Something went wrong'
      }, 500);
    }
  },

  /**
   * Resends OTP to email
   */
  resend: async (c: Context) => {
    try {
      const { email } = await c.req.json();
      
      const check = await canResend('email', email);
      if (!check.allowed) {
        return c.json({ success: false, error: check.error }, 429);
      }

      const otp = generateOTP();
      await storeOTP('email', email, otp);
      await updateResendLimits('email', email);
      
      await sendEmail(email, otp);

      return c.json({
        success: true,
        message: 'OTP resent'
      });
    } catch (error: any) {
      console.error('Email resend error:', error);
      return c.json({
        success: false,
        error: 'SEND_FAILED',
        message: error.message
      }, 500);
    }
  }
};
