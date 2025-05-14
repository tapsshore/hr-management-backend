import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { PayrollStatus } from './entities/payroll.entity';

@ApiTags('payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post()
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER)
  @ApiOperation({ 
    summary: 'Create a new payroll record',
    description: 'Creates a new payroll record in the system. This operation is restricted to administrators, HR managers, and HR officers. The payroll data including employee information, salary details, deductions, allowances, and payment period are provided in the request body. This endpoint is used for processing monthly payrolls or one-time payments.'
  })
  create(@Body() createPayrollDto: CreatePayrollDto) {
    return this.payrollService.create(createPayrollDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all payroll records',
    description: 'Retrieves a paginated list of payroll records. Regular employees will only see their own payroll records, while HR staff and managers can see payroll records for employees they manage. Results can be filtered by month and year, and paginated using page and limit query parameters. The user information is extracted from the JWT token to determine access permissions.'
  })
  findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.payrollService.findAll(req.user, page, limit, month, year);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get a payroll record by ID',
    description: 'Retrieves detailed information about a specific payroll record identified by its ID. This includes salary details, deductions, allowances, payment status, and other relevant information. Regular employees can only access their own payroll records, while HR staff and managers can access payroll records for employees they manage. The user information is extracted from the JWT token to determine access permissions.'
  })
  findOne(@Param('id') id: string, @Request() req) {
    return this.payrollService.findOne(id, req.user);
  }

  @Post(':id/status')
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER)
  @ApiOperation({ 
    summary: 'Update payroll status',
    description: 'Updates the status of a payroll record (e.g., pending, approved, paid, rejected). This operation is restricted to administrators, HR managers, and HR officers. The payroll record is identified by its ID, and the new status is provided in the request body. The user information is extracted from the JWT token to track who performed the status update and to determine access permissions.'
  })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: PayrollStatus,
    @Request() req,
  ) {
    return this.payrollService.updateStatus(id, status, req.user);
  }

  @Get('employee/:employeeId')
  @ApiOperation({ 
    summary: 'Get employee payroll records',
    description: 'Retrieves payroll records for a specific employee identified by their ID. Results can be filtered by date range using startMonth, startYear, endMonth, and endYear query parameters. Regular employees can only access their own payroll records, while HR staff and managers can access payroll records for employees they manage. The user information is extracted from the JWT token to determine access permissions.'
  })
  getEmployeePayroll(
    @Param('employeeId') employeeId: string,
    @Query('startMonth') startMonth: number,
    @Query('startYear') startYear: number,
    @Query('endMonth') endMonth: number,
    @Query('endYear') endYear: number,
    @Request() req,
  ) {
    return this.payrollService.getEmployeePayroll(
      employeeId,
      startMonth,
      startYear,
      endMonth,
      endYear,
      req.user,
    );
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER)
  @ApiOperation({ 
    summary: 'Get payroll statistics',
    description: 'Retrieves aggregated payroll statistics for the organization. This includes metrics like total payroll amount, average salary, salary distribution by department, tax deductions, and other payroll-related KPIs. Results can be filtered by month and year using query parameters. This operation is restricted to administrators, HR managers, and HR officers. The user information is extracted from the JWT token to determine access permissions.'
  })
  getPayrollStats(
    @Query('month') month: number,
    @Query('year') year: number,
    @Request() req,
  ) {
    return this.payrollService.getPayrollStats(month, year, req.user);
  }
}
