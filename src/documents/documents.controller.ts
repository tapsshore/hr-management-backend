import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, Res, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  create(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.create(createDocumentDto, file);
  }

  @Get()
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  findAll() {
    return this.documentsService.findAll();
  }

  @Get('employee/:employeeId')
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER, Role.EMPLOYEE)
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.documentsService.findByEmployee(+employeeId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER, Role.EMPLOYEE)
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(+id);
  }

  @Get(':id/download')
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER, Role.EMPLOYEE)
  async download(@Param('id') id: string, @Res() res: Response) {
    const url = await this.documentsService.getFileUrl(+id);
    res.redirect(url);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  update(@Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto) {
    return this.documentsService.update(+id, updateDocumentDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.HR)
  remove(@Param('id') id: string) {
    return this.documentsService.remove(+id);
  }
}