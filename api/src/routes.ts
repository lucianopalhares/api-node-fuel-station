import type { Express } from 'express';
import { Router } from 'express';

import { createCityRouter } from './modules/cities/presentation/cityRoutes';
import { createExportRouter } from './modules/exports/presentation/exportRoutes';
import { createImportResultRouter } from './modules/import-results/presentation/importResultRoutes';
import { createImportRouter } from './modules/imports/presentation/importRoutes';
import { createResponsibleRouter } from './modules/responsibles/presentation/responsibleRoutes';
import { createStationExportRouter } from './modules/station-exports/presentation/stationExportRoutes';
import { createStationRouter } from './modules/stations/presentation/stationRoutes';
import type { AppDependencies } from './infrastructure/dependencies';

export function registerRoutes(app: Express, dependencies: AppDependencies): void {
  app.use('/imports', createImportRouter(dependencies.importController));
  app.use('/cities', createCityRouter(dependencies.cityController));
  app.use('/responsibles', createResponsibleRouter(dependencies.responsibleController));

  const stationRouter = Router();
  stationRouter.use(createStationRouter(dependencies.stationController));
  stationRouter.use(createStationExportRouter(dependencies.stationExportController));
  app.use('/stations', stationRouter);

  app.use('/import-results', createImportResultRouter(dependencies.importResultController));
  app.use(createExportRouter(dependencies.exportController));
}
