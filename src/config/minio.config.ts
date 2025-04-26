import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

export const getMinioConfig = (configService: ConfigService): Client => {
  return new Client({
    endPoint: configService.get<string>('MINIO_ENDPOINT', 'localhost'),
    port: configService.get<number>('MINIO_PORT', 9000),
    useSSL: configService.get<boolean>('MINIO_USE_SSL', false),
    accessKey: configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
    secretKey: configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
  });
};

export const MINIO_BUCKET_NAME = 'hr-documents';