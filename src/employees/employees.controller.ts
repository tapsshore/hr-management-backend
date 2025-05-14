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
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('employees')
@ApiBearerAuth()
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @ApiOperation({
    summary: 'Create a new employee',
    description:
      'Creates a new employee record in the system. Requires admin, HR manager, or HR officer role. The employee data is provided in the request body, and the creator information is extracted from the JWT token.',
  })
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER)
  @Post()
  create(@Body() createEmployeeDto: CreateEmployeeDto, @Request() req) {
    return this.employeesService.create(createEmployeeDto, req.user);
  }

  @ApiOperation({
    summary: 'Get all employees',
    description:
      'Retrieves a paginated list of all employees. Requires admin, HR manager, or HR officer role. Results can be paginated using page and limit query parameters. The user information is extracted from the JWT token to determine access permissions.',
  })
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER)
  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req,
  ) {
    return this.employeesService.findAll(req.user, page, limit);
  }

  @ApiOperation({
    summary: 'Get an employee by employeeNumber',
    description:
      'Retrieves detailed information about a specific employee identified by their employee number. The user information is extracted from the JWT token to determine access permissions. Users can only access their own information or information of employees they have permission to view based on their role.',
  })
  @Get(':employeeNumber')
  findOne(@Param('employeeNumber') employeeNumber: string, @Request() req) {
    return this.employeesService.findOne(employeeNumber, req.user);
  }

  @ApiOperation({
    summary: 'Update an employee',
    description:
      'Updates information for a specific employee identified by their employee number. Requires admin, HR manager, or HR officer role. The update data is provided in the request body, and the user information is extracted from the JWT token to determine access permissions and track who made the changes.',
  })
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER)
  @Patch(':employeeNumber')
  update(
    @Param('employeeNumber') employeeNumber: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @Request() req,
  ) {
    return this.employeesService.update(
      employeeNumber,
      updateEmployeeDto,
      req.user,
    );
  }

  @ApiOperation({
    summary: 'Delete an employee',
    description:
      'Removes an employee record from the system. This operation is restricted to administrators only. The employee is identified by their employee number. The user information is extracted from the JWT token to track who performed the deletion. This operation may be soft delete depending on the implementation.',
  })
  @Roles(Role.ADMIN)
  @Delete(':employeeNumber')
  remove(@Param('employeeNumber') employeeNumber: string, @Request() req) {
    return this.employeesService.remove(employeeNumber, req.user);
  }
}
