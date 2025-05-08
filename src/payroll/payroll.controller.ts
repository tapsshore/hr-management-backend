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
  @ApiOperation({ summary: 'Create a new payroll record' })
  create(@Body() createPayrollDto: CreatePayrollDto) {
    return this.payrollService.create(createPayrollDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payroll records' })
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
  @ApiOperation({ summary: 'Get a payroll record by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.payrollService.findOne(id, req.user);
  }

  @Post(':id/status')
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER)
  @ApiOperation({ summary: 'Update payroll status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: PayrollStatus,
    @Request() req,
  ) {
    return this.payrollService.updateStatus(id, status, req.user);
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get employee payroll records' })
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
  @ApiOperation({ summary: 'Get payroll statistics' })
  getPayrollStats(
    @Query('month') month: number,
    @Query('year') year: number,
    @Request() req,
  ) {
    return this.payrollService.getPayrollStats(month, year, req.user);
  }
}
