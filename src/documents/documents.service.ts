import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { Employee } from '../employees/entities/employee.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Role } from '../common/enums/role.enum';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import * as Minio from 'minio';
import { WinstonLoggerService } from '../common/logger/logger.service';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @Inject('MINIO_CLIENT')
    private minioClient: Minio.Client,
    private configService: ConfigService,
    @Inject('APP_LOGGER')
    private logger: WinstonLoggerService,
  ) {}

  async create(
    createDocumentDto: CreateDocumentDto,
    file: Express.Multer.File,
    user: any,
  ): Promise<Document> {
    this.logger.log(
      `Creating document for employee ${createDocumentDto.employeeNumber}`,
    );
    if (![Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER].includes(user.role)) {
      this.logger.error(
        `User ${user.employeeNumber} has insufficient permissions`,
      );
      throw new ForbiddenException('Insufficient permissions');
    }

    const employee = await this.employeeRepository.findOne({
      where: { employeeNumber: createDocumentDto.employeeNumber },
    });
    if (!employee) {
      this.logger.error(
        `Employee not found: ${createDocumentDto.employeeNumber}`,
      );
      throw new NotFoundException('Employee not found');
    }

    if (!file) {
      this.logger.error('No file provided');
      throw new BadRequestException('File is required');
    }

    const allowedTypes = ['.pdf', '.docx', '.png', '.jpeg'];
    if (!allowedTypes.includes(extname(file.originalname).toLowerCase())) {
      this.logger.error(`Invalid file type: ${file.originalname}`);
      throw new BadRequestException('Invalid file type');
    }

    if (file.size > 10 * 1024 * 1024) {
      this.logger.error(`File size exceeds 10MB: ${file.originalname}`);
      throw new BadRequestException('File size exceeds 10MB');
    }

    const filePath = `documents/${Date.now()}-${file.originalname}`;
    try {
      await this.minioClient.putObject(
        this.configService.get('MINIO_BUCKET'),
        filePath,
        file.buffer,
        {
          'Content-Type': file.mimetype,
        },
      );
      this.logger.log(`File uploaded to MinIO: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to upload file to MinIO: ${error.message}`);
      throw new BadRequestException('Failed to upload file');
    }

    const document = this.documentRepository.create({
      ...createDocumentDto,
      fileName: file.originalname,
      filePath,
      uploadedBy: user.employeeNumber,
    });

    try {
      const savedDocument = await this.documentRepository.save(document);
      this.logger.log(`Document created successfully: ${savedDocument.id}`);
      return savedDocument;
    } catch (error) {
      this.logger.error(`Failed to save document: ${error.message}`);
      throw new BadRequestException('Failed to save document');
    }
  }

  async findAll(
    employeeNumber: string,
    user: any,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Document[]; total: number }> {
    this.logger.log(
      `Fetching documents for employee ${employeeNumber}, page ${page}, limit ${limit}`,
    );
    if (user.role === Role.EMPLOYEE && user.employeeNumber !== employeeNumber) {
      this.logger.error(
        `User ${user.employeeNumber} has insufficient permissions to view documents`,
      );
      throw new ForbiddenException('Insufficient permissions');
    }

    try {
      const [data, total] = await this.documentRepository.findAndCount({
        where: { employeeNumber, status: 'Active' },
        skip: (page - 1) * limit,
        take: limit,
      });
      this.logger.log(
        `Found ${total} documents for employee ${employeeNumber}`,
      );
      return { data, total };
    } catch (error) {
      this.logger.error(`Failed to fetch documents: ${error.message}`);
      throw new BadRequestException('Failed to fetch documents');
    }
  }

  async findOne(
    id: string,
    user: any,
  ): Promise<{ document: Document; url: string }> {
    this.logger.log(`Fetching document with ID ${id}`);
    const document = await this.documentRepository.findOne({
      where: { id, status: 'Active' },
    });
    if (!document) {
      this.logger.error(`Document not found: ${id}`);
      throw new NotFoundException('Document not found');
    }

    if (
      user.role === Role.EMPLOYEE &&
      user.employeeNumber !== document.employeeNumber
    ) {
      this.logger.error(
        `User ${user.employeeNumber} has insufficient permissions to view document ${id}`,
      );
      throw new ForbiddenException('Insufficient permissions');
    }

    try {
      const url = await this.minioClient.presignedGetObject(
        this.configService.get('MINIO_BUCKET'),
        document.filePath,
        3600, // 1 hour expiry
      );
      this.logger.log(`Generated presigned URL for document ${id}`);
      return { document, url };
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL: ${error.message}`);
      throw new BadRequestException('Failed to generate presigned URL');
    }
  }

  async update(
    id: string,
    updateDocumentDto: UpdateDocumentDto,
    file: Express.Multer.File,
    user: any,
  ): Promise<Document> {
    this.logger.log(`Updating document with ID ${id}`);
    if (![Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER].includes(user.role)) {
      this.logger.error(
        `User ${user.employeeNumber} has insufficient permissions`,
      );
      throw new ForbiddenException('Insufficient permissions');
    }

    const document = await this.documentRepository.findOne({
      where: { id, status: 'Active' },
    });
    if (!document) {
      this.logger.error(`Document not found: ${id}`);
      throw new NotFoundException('Document not found');
    }

    if (file) {
      const allowedTypes = ['.pdf', '.docx', '.png', '.jpeg'];
      if (!allowedTypes.includes(extname(file.originalname).toLowerCase())) {
        this.logger.error(`Invalid file type: ${file.originalname}`);
        throw new BadRequestException('Invalid file type');
      }

      if (file.size > 10 * 1024 * 1024) {
        this.logger.error(`File size exceeds 10MB: ${file.originalname}`);
        throw new BadRequestException('File size exceeds 10MB');
      }

      const filePath = `documents/${Date.now()}-${file.originalname}`;
      try {
        await this.minioClient.putObject(
          this.configService.get('MINIO_BUCKET'),
          filePath,
          file.buffer,
          {
            'Content-Type': file.mimetype,
          },
        );
        this.logger.log(`File uploaded to MinIO: ${filePath}`);
        updateDocumentDto.fileName = file.originalname;
        updateDocumentDto.filePath = filePath;
      } catch (error) {
        this.logger.error(`Failed to upload file to MinIO: ${error.message}`);
        throw new BadRequestException('Failed to upload file');
      }
    }

    Object.assign(document, updateDocumentDto);
    try {
      const updatedDocument = await this.documentRepository.save(document);
      this.logger.log(`Document updated successfully: ${id}`);
      return updatedDocument;
    } catch (error) {
      this.logger.error(`Failed to update document: ${error.message}`);
      throw new BadRequestException('Failed to update document');
    }
  }

  async remove(id: string, user: any): Promise<void> {
    this.logger.log(`Deleting document with ID ${id}`);
    if (user.role !== Role.ADMIN) {
      this.logger.error(
        `User ${user.employeeNumber} has insufficient permissions`,
      );
      throw new ForbiddenException('Insufficient permissions');
    }

    const document = await this.documentRepository.findOne({
      where: { id, status: 'Active' },
    });
    if (!document) {
      this.logger.error(`Document not found: ${id}`);
      throw new NotFoundException('Document not found');
    }

    try {
      await this.minioClient.removeObject(
        this.configService.get('MINIO_BUCKET'),
        document.filePath,
      );
      this.logger.log(`File deleted from MinIO: ${document.filePath}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from MinIO: ${error.message}`);
      throw new BadRequestException('Failed to delete file');
    }

    document.status = 'Archived';
    try {
      await this.documentRepository.save(document);
      this.logger.log(`Document archived successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to archive document: ${error.message}`);
      throw new BadRequestException('Failed to archive document');
    }
  }
}
