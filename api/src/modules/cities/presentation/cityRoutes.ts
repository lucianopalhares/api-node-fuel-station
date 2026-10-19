// endpoints de cidade.

import { Router } from 'express';
import { CityController } from './CityController';

export function createCityRouter(controller: CityController): Router {
  const router = Router();
  router.get('/', (request, response, next) => void controller.list(request, response).catch(next));
  router.get('/:ibgeCode', (request, response, next) => void controller.getByIbgeCode(request, response).catch(next));
  return router;
}
