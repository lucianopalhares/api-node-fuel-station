import { Request, Response, Router } from 'express';
import Busboy from 'busboy';
import { ValidationError } from '../../shared/errors/ValidationError';
import type { Readable } from 'node:stream';

type ImportHandler = {
  execute(input: {
    filename: string;
    contentType: string;
    stream: Readable;
  }): Promise<unknown>;
};

  export function createImportRouter(
    importHandler: ImportHandler,
    maxFileSizeBytes: number,
  ): Router {
  const router = Router();

  router.post('/', (request: Request, response: Response, next) => {
    const contentType = request.headers['content-type'];
    if (!contentType?.startsWith('multipart/form-data')) {
      next(new ValidationError(
        'INVALID_CONTENT_TYPE',
        'Envie o arquivo como multipart/form-data no campo file.',
      ));
      return;
    }

    const busboy = Busboy({
      headers: request.headers,
      limits: {
        fileSize: maxFileSizeBytes,
        files: 1,
      },
    });
    let importPromise: Promise<unknown> | undefined;
    let fileFound = false;

    busboy.on('error', next);

    busboy.on('file', (field, file, info) => {
      if (field !== 'file' || fileFound) {
        file.resume();
        return;
      }
      fileFound = true;
      const filename = info.filename;
      if (filename === undefined) {
        file.resume();
        importPromise = Promise.reject(new ValidationError(
          'FILE_NAME_REQUIRED',
          'O arquivo enviado precisa ter um nome.',
          { field: 'file' },
        ));
        return;
      }

      importPromise = importHandler.execute({
        filename,
        contentType: info.mimeType,
        stream: file,
      });
    });

    busboy.on('finish', async () => {
      try {
        if (!importPromise) {
          throw new ValidationError('FILE_REQUIRED', 'O campo file é obrigatório.');
        }
        response.status(202).json({ data: await importPromise });
      } catch (error) {
        next(error);
      }
    });

    request.pipe(busboy);
  });

  return router;
}
