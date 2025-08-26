import dotenv from 'dotenv';
import { WebhookConfig } from '../types/webhook';

// loading environment variables
dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  webhook: {
    secret: process.env.WEBHOOK_SECRET || 'default_secret_change_in_production',
    timestampTolerance: parseInt(process.env.WEBHOOK_TIMESTAMP_TOLERANCE || '300000'), // 5 minutes in ms
    trustedIps: process.env.TRUSTED_IPS?.split(',') || []
  } as WebhookConfig,

  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  },

  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || []
  }
};

// validate required configuration
export function validateConfig(): void {
  const requiredEnvVars = ['WEBHOOK_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  if (config.webhook.secret === 'default_secret_change_in_production') {
    console.warn('WARNING: Using default webhook secret. Change WEBHOOK_SECRET in production!');
  }

  if (config.webhook.trustedIps.length === 0) {
    console.warn('WARNING: No trusted IPs configured. Add TRUSTED_IPS for production security.');
  }
}
