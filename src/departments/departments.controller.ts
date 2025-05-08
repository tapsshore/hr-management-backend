import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('departments')
@ApiBearerAuth()
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @ApiOperation({ summary: 'Create a new department' })
  @Roles(Role.ADMIN, Role.HR_MANAGER)
  @Post()
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @ApiOperation({ summary: 'Get all departments' })
  @Get()
  findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.departmentsService.findAll(page, limit);
  }

  @ApiOperation({ summary: 'Get department hierarchy' })
  @Get('hierarchy')
  getHierarchy() {
    return this.departmentsService.getDepartmentHierarchy();
  }

  @ApiOperation({ summary: 'Get a department by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @ApiOperation({ summary: 'Get department employees' })
  @Get(':id/employees')
  getDepartmentEmployees(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.departmentsService.getDepartmentEmployees(id, page, limit);
  }

  @ApiOperation({ summary: 'Get department statistics' })
  @Get(':id/stats')
  getDepartmentStats(@Param('id') id: string) {
    return this.departmentsService.getDepartmentStats(id);
  }

  @ApiOperation({ summary: 'Update a department' })
  @Roles(Role.ADMIN, Role.HR_MANAGER)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: Partial<CreateDepartmentDto>,
  ) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @ApiOperation({ summary: 'Delete a department' })
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
