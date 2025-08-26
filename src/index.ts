import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { config, validateConfig } from './config';
import {
  rateLimiter,
  corsOptions,
  securityHeaders,
  compressionMiddleware,
  requestLogger,
  errorHandler,
  notFoundHandler
} from './middleware/security';
import { createWebhookRoutes } from './routes/webhookRoutes';
import logger from './utils/logger';

function setupMiddleware(app: express.Application): void {
  // Security middleware
  app.use(securityHeaders);
  app.use(cors(corsOptions));
  app.use(compressionMiddleware);
  app.use(rateLimiter);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }));
  app.use(requestLogger);

  // Trust only loopback proxy for accurate IP addresses (safer for rate limiting)
  app.set('trust proxy', 'loopback');
}

function setupRoutes(app: express.Application): void {
  const webhookRoutes = createWebhookRoutes(config.webhook);
  app.use('/api/v1', webhookRoutes);

  app.get('/', (req, res) => {
    res.json({
      message: 'YaYa Wallet Webhook Service',
      version: process.env.npm_package_version || '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString()
    });
  });
}

function setupErrorHandling(app: express.Application): void {
  app.use(notFoundHandler);

  app.use(errorHandler);
}

function createApp(): express.Application {
  const app = express();

  setupMiddleware(app);
  setupRoutes(app);
  setupErrorHandling(app);

  return app;
}

/**
 * Start the server
 */
function startServer(): void {
  try {
    // Validate configuration
    validateConfig();

    const app = createApp();
    const port = config.server.port;

    app.listen(port, () => {
      logger.info(`🚀 YaYa Wallet Webhook Service started`, {
        port,
        environment: config.server.nodeEnv,
        timestamp: new Date().toISOString()
      });

      if (config.server.nodeEnv === 'development') {
        console.log(`\nDevelopment Information:`);
        console.log(`   Server: http://localhost:${port}`);
        console.log(`   Health: http://localhost:${port}/api/v1/health`);
        console.log(`   Test: http://localhost:${port}/api/v1/test`);
        console.log(`   Webhook: http://localhost:${port}/api/v1/webhook`);
        console.log(`\n🔧 Environment: ${config.server.nodeEnv}`);
        console.log(`Log Level: ${config.logging.level}`);
        console.log(`\nRemember to:`);
        console.log(`   - Set WEBHOOK_SECRET in production`);
        console.log(`   - Configure TRUSTED_IPS with YaYa Wallet IPs`);
        console.log(`   - Use HTTPS in production`);
        console.log(`\n`);
      }
    });

  } catch (error) {
    logger.error('Failed to start application', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Start the application
startServer();

export default createApp;
