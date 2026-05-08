/**
 * Phone OTP Controller
 * Handles HTTP logic for phone-based OTP
 */

import { Context } from 'hono';
import { generateOTP, storeOTP, verifyOTP, canResend, updateResendLimits } from '../services/otp.service.js';
import { sendSMS } from '../services/sms.service.js';

export const phoneController = {
  /**
   * Sends OTP to phone
   */
  send: async (c: Context) => {
    try {
      const { phone } = await c.req.json();
      console.log(`[Phone Controller] Received send request for: ${phone}`);
      
      const check = await canResend('phone', phone);
      if (!check.allowed) {
        console.warn(`[Phone Controller] Resend denied for ${phone}: ${check.error}`);
        return c.json({ success: false, error: check.error }, 429);
      }

      const otp = generateOTP();
      // OTP logging removed for security
      
      await storeOTP('phone', phone, otp);
      await updateResendLimits('phone', phone);
      
      console.log(`[Phone Controller] Attempting to send SMS to ${phone}...`);
      await sendSMS(phone, otp);
      console.log(`[Phone Controller] SMS sent successfully to ${phone}`);

      return c.json({
        success: true,
        message: 'OTP sent',
        expiresIn: 120
      });
    } catch (error: any) {
      console.error('Phone send error:', error);
      return c.json({
        success: false,
        error: 'SEND_FAILED',
        message: error.message
      }, 500);
    }
  },

  /**
   * Verifies OTP for phone
   */
  verify: async (c: Context) => {
    try {
      const { phone, otp } = await c.req.json();
      console.log(`[Phone Controller] Received verify request for ${phone}`);
      
      const result = await verifyOTP('phone', phone, otp);

      if (result.success) {
        console.log(`[Phone Controller] Verification successful for ${phone}`);
        return c.json({
          success: true,
          token: result.token
        });
      } else {
        console.warn(`[Phone Controller] Verification failed for ${phone}: ${result.error}`);
        const status = result.error === 'OTP_EXPIRED' ? 410 : 400;
        return c.json({
          success: false,
          error: result.error,
          message: result.error === 'OTP_EXPIRED' ? 'OTP has expired' : 'Invalid OTP'
        }, status);
      }
    } catch (error) {
      console.error('Phone verify error:', error);
      return c.json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Something went wrong'
      }, 500);
    }
  },

  /**
   * Resends OTP to phone
   */
  resend: async (c: Context) => {
    try {
      const { phone } = await c.req.json();
      
      const check = await canResend('phone', phone);
      if (!check.allowed) {
        return c.json({ success: false, error: check.error }, 429);
      }

      const otp = generateOTP();
      await storeOTP('phone', phone, otp);
      await updateResendLimits('phone', phone);
      
      await sendSMS(phone, otp);

      return c.json({
        success: true,
        message: 'OTP resent'
      });
    } catch (error: any) {
      console.error('Phone resend error:', error);
      return c.json({
        success: false,
        error: 'SEND_FAILED',
        message: error.message
      }, 500);
    }
  }
};
