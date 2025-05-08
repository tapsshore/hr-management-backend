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
import { PerformanceReviewsService } from './performance-reviews.service';
import { CreatePerformanceReviewDto } from './dto/create-performance-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReviewStatus } from './entities/performance-review.entity';

@ApiTags('performance-reviews')
@ApiBearerAuth()
@Controller('performance-reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PerformanceReviewsController {
  constructor(
    private readonly performanceReviewsService: PerformanceReviewsService,
  ) {}

  @ApiOperation({ summary: 'Create a new performance review' })
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.MANAGER)
  @Post()
  create(@Body() createReviewDto: CreatePerformanceReviewDto, @Request() req) {
    return this.performanceReviewsService.create(
      createReviewDto,
      req.user.employeeNumber,
    );
  }

  @ApiOperation({ summary: 'Get all performance reviews' })
  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req,
  ) {
    return this.performanceReviewsService.findAll(req.user, page, limit);
  }

  @ApiOperation({ summary: 'Get a performance review by ID' })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.performanceReviewsService.findOne(id, req.user);
  }

  @ApiOperation({ summary: 'Update performance review status' })
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ReviewStatus,
    @Request() req,
  ) {
    return this.performanceReviewsService.updateStatus(id, status, req.user);
  }

  @ApiOperation({ summary: 'Add employee comments to a review' })
  @Roles(Role.EMPLOYEE)
  @Patch(':id/comments')
  addEmployeeComments(
    @Param('id') id: string,
    @Body('comments') comments: string,
    @Request() req,
  ) {
    return this.performanceReviewsService.addEmployeeComments(id, comments, req.user);
  }

  @ApiOperation({ summary: 'Get all reviews for a specific employee' })
  @Get('employee/:employeeId')
  getEmployeeReviews(
    @Param('employeeId') employeeId: string,
    @Request() req,
  ) {
    return this.performanceReviewsService.getEmployeeReviews(employeeId, req.user);
  }
} 