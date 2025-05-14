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

  @ApiOperation({
    summary: 'Create a new department',
    description:
      'Creates a new department in the organization structure. This operation is restricted to administrators and HR managers. The department data including name, description, parent department (if any), and other details are provided in the request body.',
  })
  @Roles(Role.ADMIN, Role.HR_MANAGER)
  @Post()
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @ApiOperation({
    summary: 'Get all departments',
    description:
      'Retrieves a paginated list of all departments in the organization. Results can be paginated using page and limit query parameters. This endpoint is accessible to all authenticated users regardless of their role.',
  })
  @Get()
  findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.departmentsService.findAll(page, limit);
  }

  @ApiOperation({
    summary: 'Get department hierarchy',
    description:
      'Retrieves the complete hierarchical structure of departments in the organization. This includes parent-child relationships between departments, allowing for visualization of the organizational chart. This endpoint is accessible to all authenticated users regardless of their role.',
  })
  @Get('hierarchy')
  getHierarchy() {
    return this.departmentsService.getDepartmentHierarchy();
  }

  @ApiOperation({
    summary: 'Get a department by ID',
    description:
      'Retrieves detailed information about a specific department identified by its ID. This includes the department name, description, manager, parent department (if any), and other relevant details. This endpoint is accessible to all authenticated users regardless of their role.',
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @ApiOperation({
    summary: 'Get department employees',
    description:
      'Retrieves a paginated list of employees belonging to a specific department identified by its ID. Results can be paginated using page and limit query parameters. This endpoint is accessible to all authenticated users, but regular employees may only see limited information about their colleagues depending on their role and permissions.',
  })
  @Get(':id/employees')
  getDepartmentEmployees(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.departmentsService.getDepartmentEmployees(id, page, limit);
  }

  @ApiOperation({
    summary: 'Get department statistics',
    description:
      "Retrieves statistical information about a specific department identified by its ID. This includes metrics such as employee count, average tenure, gender distribution, attendance rates, leave utilization, and other relevant KPIs. This endpoint is accessible to all authenticated users, but the level of detail may vary based on the user's role.",
  })
  @Get(':id/stats')
  getDepartmentStats(@Param('id') id: string) {
    return this.departmentsService.getDepartmentStats(id);
  }

  @ApiOperation({
    summary: 'Update a department',
    description:
      'Updates information for a specific department identified by its ID. This operation is restricted to administrators and HR managers. The update data is provided in the request body and may include changes to the department name, description, manager, parent department, or other attributes.',
  })
  @Roles(Role.ADMIN, Role.HR_MANAGER)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: Partial<CreateDepartmentDto>,
  ) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @ApiOperation({
    summary: 'Delete a department',
    description:
      'Removes a department from the organization structure. This operation is restricted to administrators only. The department is identified by its ID. This operation may fail if the department has employees assigned to it or if it has child departments. In such cases, employees and child departments must be reassigned before deletion.',
  })
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
