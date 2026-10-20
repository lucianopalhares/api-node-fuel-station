// manter as rotas de consulta separadas das rotas de upload.

import { Router } from 'express';
import { ImportResultController } from './ImportResultController';

export function createImportResultRouter(controller: ImportResultController): Router {
  const router = Router();
  router.get('/', (request, response, next) => void controller.list(request, response).catch(next));
  router.get('/:importId', (request, response, next) => void controller.detail(request, response).catch(next));
  return router;
}
