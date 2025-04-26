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

  @ApiOperation({ summary: 'Create a new employee' })
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER)
  @Post()
  create(@Body() createEmployeeDto: CreateEmployeeDto, @Request() req) {
    return this.employeesService.create(createEmployeeDto, req.user);
  }

  @ApiOperation({ summary: 'Get all employees' })
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER)
  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req,
  ) {
    return this.employeesService.findAll(req.user, page, limit);
  }

  @ApiOperation({ summary: 'Get an employee by employeeNumber' })
  @Get(':employeeNumber')
  findOne(@Param('employeeNumber') employeeNumber: string, @Request() req) {
    return this.employeesService.findOne(employeeNumber, req.user);
  }

  @ApiOperation({ summary: 'Update an employee' })
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

  @ApiOperation({ summary: 'Delete an employee' })
  @Roles(Role.ADMIN)
  @Delete(':employeeNumber')
  remove(@Param('employeeNumber') employeeNumber: string, @Request() req) {
    return this.employeesService.remove(employeeNumber, req.user);
  }
}
