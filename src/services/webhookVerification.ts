import crypto from 'crypto';
import { YaYaWebhookPayload, WebhookVerificationResult, WebhookConfig } from '../types/webhook';
import logger from '../utils/logger';

/**
 * Verify that the webhook request is from YaYa Wallet
 * Implements signature verification and replay attack prevention
 */
export function verifyWebhook(
  payload: YaYaWebhookPayload,
  signature: string,
  clientIp: string,
  config: WebhookConfig
): WebhookVerificationResult {
  try {
    if (!isTrustedIp(clientIp, config)) {
      logger.warn(`Untrusted IP address: ${clientIp}`);
      return {
        isValid: false,
        error: 'Untrusted IP address'
      };
    }

    const expectedSignature = generateSignature(payload, config.secret);
    if (signature !== expectedSignature) {
      logger.warn('Invalid signature received', {
        received: signature,
        expected: expectedSignature
      });
      return {
        isValid: false,
        error: 'Invalid signature'
      };
    }

    const timestampVerification = verifyTimestamp(payload.timestamp, config.timestampTolerance);
    if (!timestampVerification.isValid) {
      logger.warn('Timestamp verification failed', {
        received: payload.timestamp,
        tolerance: config.timestampTolerance
      });
      return {
        isValid: false,
        error: timestampVerification.error
      };
    }

    logger.info('Webhook verification successful', {
      transactionId: payload.id,
      amount: payload.amount,
      currency: payload.currency
    });

    return {
      isValid: true,
      timestamp: payload.timestamp
    };

  } catch (error) {
    logger.error('Webhook verification error', { error });
    return {
      isValid: false,
      error: 'Verification failed'
    };
  }
}

function generateSignature(payload: YaYaWebhookPayload, secret: string): string {
  const signedPayload = createSignedPayload(payload);

  return crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
}

function createSignedPayload(payload: YaYaWebhookPayload): string {
  return [
    payload.id,
    payload.amount.toString(),
    payload.currency,
    payload.created_at_time.toString(),
    payload.timestamp.toString(),
    payload.cause,
    payload.full_name,
    payload.account_name,
    payload.invoice_url
  ].join('');
}

function verifyTimestamp(receivedTimestamp: number, tolerance: number): { isValid: boolean; error?: string } {
  const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds
  const timeDifference = Math.abs(currentTime - receivedTimestamp);

  if (timeDifference > tolerance / 1000) {
    return {
      isValid: false,
      error: `Timestamp too old. Difference: ${timeDifference}s, Tolerance: ${tolerance / 1000}s`
    };
  }

  return { isValid: true };
}

function isTrustedIp(clientIp: string, config: WebhookConfig): boolean {
  // For development/testing, allow localhost
  if (process.env.NODE_ENV === 'development' && clientIp === '::1') {
    return true;
  }

  return config.trustedIps.includes(clientIp);
}
