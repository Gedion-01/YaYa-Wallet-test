import { YaYaWebhookPayload, WebhookProcessingResult } from '../types/webhook';
import logger from '../utils/logger';

// Process the verified webhook payload just as we would in our business logic
export async function processWebhook(payload: YaYaWebhookPayload): Promise<WebhookProcessingResult> {
  try {
    logger.info('Processing webhook', {
      transactionId: payload.id,
      amount: payload.amount,
      currency: payload.currency,
      accountName: payload.account_name
    });

    await simulateProcessing();
    await updateTransactionStatus(payload);
    await sendCustomerNotification(payload);
    await updateAccountingSystem(payload);

    const result: WebhookProcessingResult = {
      success: true,
      message: 'Webhook processed successfully',
      transactionId: payload.id,
      processedAt: new Date()
    };

    logger.info('Webhook processing completed', result);
    return result;

  } catch (error) {
    logger.error('Webhook processing failed', {
      error,
      transactionId: payload.id
    });

    return {
      success: false,
      message: 'Webhook processing failed',
      transactionId: payload.id,
      processedAt: new Date()
    };
  }
}

async function updateTransactionStatus(payload: YaYaWebhookPayload): Promise<void> {
  logger.info('Transaction status updated', { transactionId: payload.id });
}

async function sendCustomerNotification(payload: YaYaWebhookPayload): Promise<void> {
  logger.info('Customer notification sent', {
    customer: payload.full_name,
    amount: payload.amount
  });
}

async function updateAccountingSystem(payload: YaYaWebhookPayload): Promise<void> {
  logger.info('Accounting system updated', {
    transactionId: payload.id,
    amount: payload.amount
  });
}

async function simulateProcessing(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100));
}
