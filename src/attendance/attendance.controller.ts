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

  @ApiOperation({ summary: 'Create a new attendance record' })
  @Post()
  create(@Body() createAttendanceDto: CreateAttendanceDto, @Request() req) {
    return this.attendanceService.create(createAttendanceDto, req.user.employeeNumber);
  }

  @ApiOperation({ summary: 'Get all attendance records' })
  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
    @Request() req,
  ) {
    return this.attendanceService.findAll(req.user, page, limit, startDate, endDate);
  }

  @ApiOperation({ summary: 'Get an attendance record by ID' })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.attendanceService.findOne(id, req.user);
  }

  @ApiOperation({ summary: 'Approve an attendance record' })
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER)
  @Patch(':id/approve')
  approveAttendance(@Param('id') id: string, @Request() req) {
    return this.attendanceService.approveAttendance(id, req.user);
  }

  @ApiOperation({ summary: 'Get employee attendance records' })
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

  @ApiOperation({ summary: 'Get attendance statistics' })
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER)
  @Get('stats')
  getAttendanceStats(
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
    @Request() req,
  ) {
    return this.attendanceService.getAttendanceStats(startDate, endDate, req.user);
  }
} 