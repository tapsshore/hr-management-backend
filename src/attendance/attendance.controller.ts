import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Request,
  Patch,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('attendance')
@ApiBearerAuth()
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @ApiOperation({ 
    summary: 'Create a new attendance record', 
    description: 'Records a new attendance entry for the authenticated employee. The attendance details such as check-in time, check-out time, and any notes are provided in the request body. The employee number is extracted from the JWT token. The attendance record may require approval depending on company policy.'
  })
  @Post()
  create(@Body() createAttendanceDto: CreateAttendanceDto, @Request() req) {
    return this.attendanceService.create(
      createAttendanceDto,
      req.user.employeeNumber,
    );
  }

  @ApiOperation({ 
    summary: 'Get all attendance records', 
    description: 'Retrieves a paginated list of attendance records. Regular employees will only see their own attendance records, while HR staff and managers can see attendance records for employees they manage. Results can be filtered by date range using startDate and endDate query parameters, and paginated using page and limit parameters. The user information is extracted from the JWT token to determine access permissions.'
  })
  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
    @Request() req,
  ) {
    return this.attendanceService.findAll(
      req.user,
      page,
      limit,
      startDate,
      endDate,
    );
  }

  @ApiOperation({ 
    summary: 'Get an attendance record by ID', 
    description: 'Retrieves detailed information about a specific attendance record identified by its ID. Regular employees can only access their own attendance records, while HR staff and managers can access attendance records for employees they manage. The user information is extracted from the JWT token to determine access permissions.'
  })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.attendanceService.findOne(id, req.user);
  }

  @ApiOperation({ 
    summary: 'Approve an attendance record', 
    description: 'Approves a pending attendance record. This operation is restricted to administrators, HR managers, and HR officers. The attendance record is identified by its ID. Approval may be required for attendance records that were submitted manually or outside of normal working hours. The user information is extracted from the JWT token to track who performed the approval and to determine access permissions.'
  })
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER)
  @Patch(':id/approve')
  approveAttendance(@Param('id') id: string, @Request() req) {
    return this.attendanceService.approveAttendance(id, req.user);
  }

  @ApiOperation({ 
    summary: 'Get employee attendance records', 
    description: 'Retrieves attendance records for a specific employee identified by their ID. Results can be filtered by date range using startDate and endDate query parameters. Regular employees can only access their own attendance records, while HR staff and managers can access attendance records for employees they manage. The user information is extracted from the JWT token to determine access permissions.'
  })
  @Get('employee/:employeeId')
  getEmployeeAttendance(
    @Param('employeeId') employeeId: string,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
    @Request() req,
  ) {
    return this.attendanceService.getEmployeeAttendance(
      employeeId,
      startDate,
      endDate,
      req.user,
    );
  }

  @ApiOperation({ 
    summary: 'Get attendance statistics', 
    description: 'Retrieves aggregated attendance statistics for the organization. This includes metrics like attendance rates, average working hours, late arrivals, early departures, and other attendance-related KPIs. Results can be filtered by date range using startDate and endDate query parameters. This operation is restricted to administrators, HR managers, and HR officers. The user information is extracted from the JWT token to determine access permissions.'
  })
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER)
  @Get('stats')
  getAttendanceStats(
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
    @Request() req,
  ) {
    return this.attendanceService.getAttendanceStats(
      startDate,
      endDate,
      req.user,
    );
  }
}
