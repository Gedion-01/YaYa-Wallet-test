export interface YaYaWebhookPayload {
  id: string;
  amount: number;
  currency: string;
  created_at_time: number;
  timestamp: number;
  cause: string;
  full_name: string;
  account_name: string;
  invoice_url: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  error?: string;
  timestamp?: number;
}

export interface WebhookProcessingResult {
  success: boolean;
  message: string;
  transactionId?: string;
  processedAt: Date;
}

export interface WebhookConfig {
  secret: string;
  timestampTolerance: number;
  trustedIps: string[];
}
