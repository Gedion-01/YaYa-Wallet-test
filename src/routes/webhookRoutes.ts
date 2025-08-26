import { Router } from 'express';
import { handleWebhook, healthCheck, testWebhook, validationRules } from '../controllers/webhookController';

export function createWebhookRoutes(webhookConfig: any): Router {
  const router = Router();

  router.post('/webhook',
    validationRules,
    (req: any, res: any) => handleWebhook(req, res, webhookConfig)
  );

  router.get('/health', healthCheck);

  router.get('/test', testWebhook);

  return router;
}
