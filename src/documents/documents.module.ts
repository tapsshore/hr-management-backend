import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { Employee } from '../employees/entities/employee.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Module({
  imports: [TypeOrmModule.forFeature([Document, Employee]), ConfigModule],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    {
      provide: 'MINIO_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Minio.Client({
          endPoint: configService.get('MINIO_ENDPOINT'),
          port: +configService.get('MINIO_PORT'),
          useSSL: false, // Set to true if using HTTPS
          accessKey: configService.get('MINIO_ACCESS_KEY'),
          secretKey: configService.get('MINIO_SECRET_KEY'),
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class DocumentsModule {}
