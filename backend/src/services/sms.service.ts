/**
 * SMS Service
 * Handles integration with Fast2SMS gateway
 */

import { config } from '../config/index.js';

/**
 * Sends OTP via SMS using Fast2SMS
 */
export async function sendSMS(phone: string, otp: string) {
  if (config.nodeEnv === 'development' && !config.fast2sms.apiKey) {
    console.log(`[DEV] SMS to ${phone}: Your OTP is ${otp}`);
    return { return: true, message: 'OTP sent in development mode' };
  }

  const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      'authorization': config.fast2sms.apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      route: 'otp',
      variables_values: otp,
      flash: 0,
      numbers: phone
    })
  });

  const data = (await response.json()) as any;
  if (!data.return) {
    throw new Error('SMS failed: ' + (data.message || 'Unknown error'));
  }
  
  return data;
}
