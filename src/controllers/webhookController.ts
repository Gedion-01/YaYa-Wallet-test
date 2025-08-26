import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { YaYaWebhookPayload } from '../types/webhook';
import { verifyWebhook } from '../services/webhookVerification';
import { processWebhook } from '../services/webhookProcessor';
import logger from '../utils/logger';

export const validationRules = [
  body('id').isUUID().withMessage('Invalid transaction ID format'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('currency').isString().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  body('created_at_time').isNumeric().withMessage('Created at time must be a number'),
  body('timestamp').isNumeric().withMessage('Timestamp must be a number'),
  body('cause').isString().notEmpty().withMessage('Cause is required'),
  body('full_name').isString().notEmpty().withMessage('Full name is required'),
  body('account_name').isString().notEmpty().withMessage('Account name is required'),
  body('invoice_url').isURL().withMessage('Invalid invoice URL format')
];

export async function handleWebhook(
  req: Request,
  res: Response,
  webhookConfig: any
): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Webhook validation failed', {
        errors: errors.array(),
        body: req.body
      });
      res.status(400).json({
        error: 'Invalid request body',
        details: errors.array()
      });
      return;
    }

    const payload = req.body as YaYaWebhookPayload;
    const signature = req.headers['yaya-signature'] as string;
    const clientIp = req.ip || req.connection.remoteAddress || '';

    const verificationResult = verifyWebhook(
      payload,
      signature,
      clientIp,
      webhookConfig
    );

    if (!verificationResult.isValid) {
      logger.warn('Webhook verification failed', {
        error: verificationResult.error,
        transactionId: payload.id,
        clientIp
      });
      res.status(401).json({
        error: 'Webhook verification failed',
        message: verificationResult.error
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Webhook received successfully',
      transactionId: payload.id
    });

    // Lets process the webhook asynchronously (after response is sent)
    // because YaYa Wallet expects a quick response
    setImmediate(async () => {
      try {
        const processingResult = await processWebhook(payload);

        if (!processingResult.success) {
          logger.error('Webhook processing failed', {
            transactionId: payload.id,
            error: processingResult.message
          });
        }
      } catch (error) {
        logger.error('Async webhook processing error', {
          transactionId: payload.id,
          error
        });
      }
    });

  } catch (error) {
    logger.error('Webhook handler error', { error });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process webhook'
    });
  }
}

export function healthCheck(req: Request, res: Response): void {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'yaya-webhook',
    version: process.env.npm_package_version || '1.0.0'
  });
}

export function testWebhook(req: Request, res: Response): void {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  res.status(200).json({
    message: 'Test endpoint available',
    instructions: 'Use this endpoint to test webhook functionality in development'
  });
}
