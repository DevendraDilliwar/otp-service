/**
 * Redis Connection Module
 * Handles connection to Redis and provides utility functions for OTP storage
 */

import { createClient } from 'redis';
import { config } from '../config/index.js';

const client = createClient({
  url: config.redisUrl
});

client.on('error', (err) => console.error('Redis Client Error', err));

/**
 * Initializes Redis connection
 */
export async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
    console.log('Connected to Redis');
  }
}

export default client;
