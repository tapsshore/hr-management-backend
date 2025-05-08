import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER)
  @ApiOperation({ summary: 'Get overall dashboard statistics' })
  getDashboardStats(@Request() req) {
    return this.dashboardService.getDashboardStats(req.user);
  }

  @Get('department/:id')
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.HR_OFFICER)
  @ApiOperation({ summary: 'Get department-specific dashboard statistics' })
  getDepartmentDashboard(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.dashboardService.getDepartmentDashboard(id, req.user);
  }
} 