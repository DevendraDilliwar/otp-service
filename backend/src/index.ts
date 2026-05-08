/**
 * Main Application Entry Point
 * Sets up Hono app, middleware, and routes
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { swaggerUI } from '@hono/swagger-ui';
import { config } from './config/index.js';
import { connectRedis } from './db/redis.js';
import { initDb } from './db/index.js';
import phoneRoutes from './routes/phone.routes.js';
import emailRoutes from './routes/email.routes.js';

const app = new Hono();

// Global Middleware
app.use('*', logger());
app.use('*', secureHeaders()); // Adds X-Frame-Options, X-Content-Type-Options, etc.

// Strict CORS: Only allow your frontend
app.use('/api/*', cors({
  origin: config.nodeEnv === 'production' ? ['https://your-domain.com'] : ['http://localhost:3001', 'http://localhost:3000'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
}));

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', environment: config.nodeEnv });
});

// Swagger Documentation
app.get('/docs', swaggerUI({ url: '/api-spec' }));

app.get('/api-spec', (c) => {
  return c.json({
    openapi: '3.0.0',
    info: {
      title: 'OTP Service API',
      version: '1.0.0',
      description: 'API for sending and verifying OTPs via Phone and Email',
    },
    paths: {
      '/api/phone/send': {
        post: {
          summary: 'Send Phone OTP',
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object', properties: { phone: { type: 'string' } }, required: ['phone'] }
              }
            }
          },
          responses: { 200: { description: 'OTP Sent' } }
        }
      },
      '/api/phone/verify': {
        post: {
          summary: 'Verify Phone OTP',
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object', properties: { phone: { type: 'string' }, otp: { type: 'string' } }, required: ['phone', 'otp'] }
              }
            }
          },
          responses: { 200: { description: 'Verification Success' } }
        }
      },
      '/api/email/send': {
        post: {
          summary: 'Send Email OTP',
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object', properties: { email: { type: 'string' } }, required: ['email'] }
              }
            }
          },
          responses: { 200: { description: 'OTP Sent' } }
        }
      },
      '/api/email/verify': {
        post: {
          summary: 'Verify Email OTP',
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object', properties: { email: { type: 'string' }, otp: { type: 'string' } }, required: ['email', 'otp'] }
              }
            }
          },
          responses: { 200: { description: 'Verification Success' } }
        }
      }
    }
  });
});

// Routes
app.route('/api/phone', phoneRoutes);
app.route('/api/email', emailRoutes);

// Error Handling
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'NOT_FOUND',
    message: 'The requested resource was not found'
  }, 404);
});

app.onError((err, c) => {
  console.error('Unhandled Error:', err);
  return c.json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred'
  }, 500);
});

/**
 * Starts the server
 */
async function startServer() {
  try {
    // Initialize Databases
    await connectRedis();
    
    try {
      await initDb();
    } catch (dbErr) {
      console.warn('Database initialization failed. Ensure DB is running and DATABASE_URL is correct.');
      if (config.nodeEnv === 'production') throw dbErr;
    }

    console.log(`OTP Service running on port ${config.port} in ${config.nodeEnv} mode`);
    
    serve({
      fetch: app.fetch,
      port: config.port
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
