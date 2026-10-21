import { Router } from 'express';
import { ExportController } from './ExportController';

export function createExportRouter(controller: ExportController): Router {
  const router = Router();
  router.get('/imports/:importId/export', (request, response, next) =>
    void controller.download(request, response).catch(next),
  );
  router.get('/imports/:importId/errors/export', (request, response, next) =>
    void controller.download(request, response, 'invalid').catch(next),
  );
  return router;
}
