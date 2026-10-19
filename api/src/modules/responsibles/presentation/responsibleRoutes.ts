import { Router } from 'express';
import { ResponsibleController } from './ResponsibleController';

export function createResponsibleRouter(controller: ResponsibleController): Router {
  const router = Router();
  router.get('/', (request, response, next) => void controller.list(request, response).catch(next));
  router.get('/:cpf', (request, response, next) => void controller.getByCpf(request, response).catch(next));
  return router;
}
