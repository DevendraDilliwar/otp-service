/**
 * Drizzle Schema Definitions
 */

import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

export const otpLogs = pgTable('otp_logs', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 10 }).notNull(), // 'phone' or 'email'
  identifier: varchar('identifier', { length: 255 }).notNull(),
  action: varchar('action', { length: 20 }).notNull(), // 'sent', 'verified', 'failed', 'expired'
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  token: varchar('token', { length: 255 }).unique().notNull(),
  type: varchar('type', { length: 10 }).notNull(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).defaultNow(),
});
