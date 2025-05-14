import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @ApiOperation({
    summary: 'Upload a new document',
    description:
      'Uploads a new document to the system and associates it with an employee. This operation is restricted to administrators, HR managers, and HR officers. The document metadata is provided in the request body, and the actual file is uploaded as multipart/form-data. The user information is extracted from the JWT token to track who uploaded the document.',
  })
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER)
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return this.documentsService.create(createDocumentDto, file, req.user);
  }

  @ApiOperation({
    summary: 'Get all documents for an employee',
    description:
      'Retrieves a paginated list of documents associated with a specific employee identified by their employee number. Regular employees can only access their own documents, while HR staff and managers can access documents for employees they manage. Results can be paginated using page and limit query parameters. The user information is extracted from the JWT token to determine access permissions.',
  })
  @Get()
  findAll(
    @Query('employeeNumber') employeeNumber: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req,
  ) {
    return this.documentsService.findAll(employeeNumber, req.user, page, limit);
  }

  @ApiOperation({
    summary: 'Get a document by ID',
    description:
      'Retrieves detailed information about a specific document identified by its ID. This includes metadata about the document and access to the file itself. Regular employees can only access their own documents, while HR staff and managers can access documents for employees they manage. The user information is extracted from the JWT token to determine access permissions.',
  })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.documentsService.findOne(id, req.user);
  }

  @ApiOperation({
    summary: 'Update a document',
    description:
      'Updates information for a specific document identified by its ID. This operation is restricted to administrators, HR managers, and HR officers. The update data is provided in the request body, and a new file can be uploaded as multipart/form-data to replace the existing one. The user information is extracted from the JWT token to track who made the changes and to determine access permissions.',
  })
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER)
  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return this.documentsService.update(id, updateDocumentDto, file, req.user);
  }

  @ApiOperation({
    summary: 'Delete a document',
    description:
      'Removes a document from the system. This operation is restricted to administrators only. The document is identified by its ID. This will delete both the metadata and the actual file from storage. The user information is extracted from the JWT token to track who performed the deletion and to determine access permissions.',
  })
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.documentsService.remove(id, req.user);
  }
}
