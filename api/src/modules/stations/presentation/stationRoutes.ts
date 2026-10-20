import { Router } from 'express';
import { StationController } from './StationController';

export function createStationRouter(controller: StationController): Router {
  const router = Router();
  router.get('/', (request, response, next) => void controller.list(request, response).catch(next));
  return router;
}
