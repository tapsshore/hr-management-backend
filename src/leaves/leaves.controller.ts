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
import { LeavesService } from './leaves.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LeaveStatus } from './entities/leave.entity';

@ApiTags('leaves')
@ApiBearerAuth()
@Controller('leaves')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @ApiOperation({
    summary: 'Create a new leave request',
    description:
      'Submits a new leave request for the authenticated employee. The leave details such as start date, end date, type of leave, and reason are provided in the request body. The employee number is extracted from the JWT token. The leave request is initially created with a pending status and requires approval from HR or management.',
  })
  @Post()
  create(@Body() createLeaveDto: CreateLeaveDto, @Request() req) {
    return this.leavesService.create(createLeaveDto, req.user.employeeNumber);
  }

  @ApiOperation({
    summary: 'Get all leave requests',
    description:
      'Retrieves a paginated list of leave requests. Regular employees will only see their own leave requests, while HR staff and managers can see leave requests for employees they manage. Results can be paginated using page and limit query parameters. The user information is extracted from the JWT token to determine access permissions.',
  })
  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req,
  ) {
    return this.leavesService.findAll(req.user, page, limit);
  }

  @ApiOperation({
    summary: 'Get a leave request by ID',
    description:
      'Retrieves detailed information about a specific leave request identified by its ID. Regular employees can only access their own leave requests, while HR staff and managers can access leave requests for employees they manage. The user information is extracted from the JWT token to determine access permissions.',
  })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.leavesService.findOne(id, req.user);
  }

  @ApiOperation({
    summary: 'Update leave request status',
    description:
      'Updates the status of a leave request (approve, reject, etc.). This operation is restricted to administrators, HR managers, and HR officers. The leave request is identified by its ID. If rejecting a leave request, a reason can be provided. The user information is extracted from the JWT token to track who performed the status update and to determine access permissions.',
  })
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: LeaveStatus,
    @Body('rejectionReason') rejectionReason: string,
    @Request() req,
  ) {
    return this.leavesService.updateStatus(
      id,
      status,
      req.user,
      rejectionReason,
    );
  }

  @ApiOperation({
    summary: 'Cancel a leave request',
    description:
      'Cancels a previously submitted leave request. The leave request is identified by its ID. Employees can only cancel their own leave requests, while administrators and HR staff can cancel any leave request. The user information is extracted from the JWT token to determine access permissions and track who performed the cancellation.',
  })
  @Patch(':id/cancel')
  cancelLeave(@Param('id') id: string, @Request() req) {
    return this.leavesService.cancelLeave(id, req.user);
  }
}
