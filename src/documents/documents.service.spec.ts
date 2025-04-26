import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Document } from './entities/document.entity';
import { Employee } from '../employees/entities/employee.entity';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as Minio from 'minio';
import { WinstonLoggerService } from '../common/logger/logger.service';
import { DocumentType } from '../common/enums/document-type.enum'; // Import DocumentType enum

describe('DocumentsService', () => {
  let service: DocumentsService;
  let documentRepository: Repository<Document>;
  let employeeRepository: Repository<Employee>;
  let minioClient: Minio.Client;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getRepositoryToken(Document),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Employee),
          useClass: Repository,
        },
        {
          provide: 'MINIO_CLIENT',
          useValue: {
            putObject: jest.fn(),
            presignedGetObject: jest.fn().mockResolvedValue('http://mock-url'),
            removeObject: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('hr-documents'),
          },
        },
        {
          provide: 'APP_LOGGER',
          useClass: WinstonLoggerService,
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    documentRepository = module.get<Repository<Document>>(
      getRepositoryToken(Document),
    );
    employeeRepository = module.get<Repository<Employee>>(
      getRepositoryToken(Employee),
    );
    minioClient = module.get('MINIO_CLIENT');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a document', async () => {
    const createDocumentDto = {
      employeeNumber: 'EMP001',
      documentType: DocumentType.CONTRACT, // Use DocumentType enum
    };
    const file: Express.Multer.File = {
      originalname: 'test.pdf',
      buffer: Buffer.from('test'),
      mimetype: 'application/pdf',
      size: 1000,
      fieldname: 'file',
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
      encoding: '',
    };
    const user = { role: 'ADMIN', employeeNumber: 'ADMIN001' };

    jest.spyOn(employeeRepository, 'findOne').mockResolvedValue({} as Employee);
    jest.spyOn(documentRepository, 'create').mockReturnValue({} as Document);
    jest.spyOn(documentRepository, 'save').mockResolvedValue({} as Document);

    await service.create(createDocumentDto, file, user);
    expect(minioClient.putObject).toHaveBeenCalled();
  });
});
