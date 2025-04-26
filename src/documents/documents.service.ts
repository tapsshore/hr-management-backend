import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { Document } from './entities/document.entity';
import { Employee } from '../employees/entities/employee.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { MINIO_BUCKET_NAME } from '../config/minio.config';

@Injectable()
export class DocumentsService {
  private minioClient: Client;
  private readonly bucketName: string = MINIO_BUCKET_NAME;

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private configService: ConfigService,
  ) {
    this.minioClient = new Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: this.configService.get<number>('MINIO_PORT', 9000),
      useSSL: this.configService.get<boolean>('MINIO_USE_SSL', false),
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
    });

    // Ensure bucket exists
    this.initBucket();
  }

  private async initBucket() {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
      }
    } catch (error) {
      console.error('Error initializing MinIO bucket:', error);
    }
  }

  async create(createDocumentDto: CreateDocumentDto, file: Express.Multer.File): Promise<Document> {
    const { employeeId } = createDocumentDto;
    
    const employee = await this.employeeRepository.findOne({ where: { id: employeeId } });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const fileKey = `${Date.now()}-${file.originalname}`;
    
    // Upload file to MinIO
    await this.minioClient.putObject(
      this.bucketName,
      fileKey,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype }
    );

    const document = this.documentRepository.create({
      ...createDocumentDto,
      fileKey,
      fileSize: file.size,
      mimeType: file.mimetype,
      employee,
    });

    return this.documentRepository.save(document);
  }

  async findAll(): Promise<Document[]> {
    return this.documentRepository.find({ relations: ['employee'] });
  }

  async findByEmployee(employeeId: number): Promise<Document[]> {
    const employee = await this.employeeRepository.findOne({ where: { id: employeeId } });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    return this.documentRepository.find({ 
      where: { employeeId },
      relations: ['employee']
    });
  }

  async findOne(id: number): Promise<Document> {
    const document = await this.documentRepository.findOne({ 
      where: { id },
      relations: ['employee']
    });
    
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    
    return document;
  }

  async update(id: number, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    const document = await this.findOne(id);
    
    Object.assign(document, updateDocumentDto);
    return this.documentRepository.save(document);
  }

  async remove(id: number): Promise<void> {
    const document = await this.findOne(id);
    
    // Delete file from MinIO
    try {
      await this.minioClient.removeObject(this.bucketName, document.fileKey);
    } catch (error) {
      console.error('Error removing file from MinIO:', error);
    }
    
    await this.documentRepository.remove(document);
  }

  async getFileUrl(id: number): Promise<string> {
    const document = await this.findOne(id);
    
    // Generate presigned URL for file download
    const url = await this.minioClient.presignedGetObject(
      this.bucketName, 
      document.fileKey,
      60 * 60 // URL expires in 1 hour
    );
    
    return url;
  }
}