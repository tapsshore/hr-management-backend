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

  @ApiOperation({ summary: 'Create a new leave request' })
  @Post()
  create(@Body() createLeaveDto: CreateLeaveDto, @Request() req) {
    return this.leavesService.create(createLeaveDto, req.user.employeeNumber);
  }

  @ApiOperation({ summary: 'Get all leave requests' })
  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req,
  ) {
    return this.leavesService.findAll(req.user, page, limit);
  }

  @ApiOperation({ summary: 'Get a leave request by ID' })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.leavesService.findOne(id, req.user);
  }

  @ApiOperation({ summary: 'Update leave request status' })
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

  @ApiOperation({ summary: 'Cancel a leave request' })
  @Patch(':id/cancel')
  cancelLeave(@Param('id') id: string, @Request() req) {
    return this.leavesService.cancelLeave(id, req.user);
  }
}
