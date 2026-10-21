import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import { AppError } from '../../shared/errors/AppError';

export class S3ObjectStorage {
  private readonly client: S3Client;

  constructor(private readonly bucket: string) {
    this.client = new S3Client({
      endpoint: process.env.STORAGE_ENDPOINT,
      region: process.env.STORAGE_REGION ?? 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY ?? 'minioadmin',
        secretAccessKey: process.env.STORAGE_SECRET_KEY ?? 'minioadmin',
      },
    });
  }

  async put(key: string, body: Readable, contentType: string): Promise<void> {
    try {
      await this.ensureBucket();
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }));
    } catch {
      throw new AppError(502, 'STORAGE_WRITE_ERROR', 'Não foi possível armazenar o arquivo no storage.');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
    } catch {
      throw new AppError(502, 'STORAGE_DELETE_ERROR', 'Não foi possível remover o arquivo parcial do storage.');
    }
  }

  private async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  async get(key: string): Promise<Readable> {
    try {
      const result = await this.client.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));

      if (!result.Body || !(result.Body instanceof Readable)) {
        throw new AppError(502, 'STORAGE_READ_ERROR', 'O storage não retornou um stream para o arquivo importado.');
      }

      return result.Body;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(502, 'STORAGE_READ_ERROR', 'Não foi possível ler o arquivo no storage.');
    }
  }
}
