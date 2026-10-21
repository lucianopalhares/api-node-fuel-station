import { Router } from 'express';
import { StationExportController } from './StationExportController';

export function createStationExportRouter(controller: StationExportController): Router {
  const router = Router();
  router.get('/export', (request, response, next) =>
    void controller.download(request, response).catch(next),
  );
  return router;
}
