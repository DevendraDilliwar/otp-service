/**
 * Email Service
 * Handles integration with Resend email gateway
 */

import { Resend } from 'resend';
import { config } from '../config/index.js';

const resend = config.resend.apiKey ? new Resend(config.resend.apiKey) : null;

/**
 * Sends OTP via Email using Resend
 */
export async function sendEmail(email: string, otp: string) {
  if (config.nodeEnv === 'development' && !resend) {
    console.log(`[DEV] Email to ${email}: Your OTP is ${otp}`);
    return;
  }

  if (!resend) {
    throw new Error('Resend API key is missing');
  }

  await resend.emails.send({
    from: config.resend.fromEmail,
    to: email,
    subject: 'Your OTP Code',
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #333;">Verification Code</h2>
        <p>Your OTP is: <strong style="font-size: 24px; color: #007bff;">${otp}</strong></p>
        <p>Valid for 2 minutes. Do not share with anyone.</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #999;">If you didn't request this, please ignore this email.</p>
      </div>
    `
  });
}
