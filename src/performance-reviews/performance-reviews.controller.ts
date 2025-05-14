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

  @ApiOperation({ 
    summary: 'Create a new performance review',
    description: 'Creates a new performance review for an employee. This operation is restricted to administrators, HR managers, and direct managers. The review details including employee being reviewed, evaluation criteria, ratings, and feedback are provided in the request body. The reviewer information is extracted from the JWT token to track who created the review.'
  })
  @Roles(Role.ADMIN, Role.HR_MANAGER, Role.MANAGER)
  @Post()
  create(@Body() createReviewDto: CreatePerformanceReviewDto, @Request() req) {
    return this.performanceReviewsService.create(
      createReviewDto,
      req.user.employeeNumber,
    );
  }

  @ApiOperation({ 
    summary: 'Get all performance reviews',
    description: 'Retrieves a paginated list of performance reviews. Regular employees will only see reviews where they are the subject or the reviewer, while HR staff and managers can see reviews for employees they manage. Results can be paginated using page and limit query parameters. The user information is extracted from the JWT token to determine access permissions.'
  })
  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req,
  ) {
    return this.performanceReviewsService.findAll(req.user, page, limit);
  }

  @ApiOperation({ 
    summary: 'Get a performance review by ID',
    description: 'Retrieves detailed information about a specific performance review identified by its ID. This includes ratings, feedback, comments, and status. Regular employees can only access reviews where they are the subject or the reviewer, while HR staff and managers can access reviews for employees they manage. The user information is extracted from the JWT token to determine access permissions.'
  })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.performanceReviewsService.findOne(id, req.user);
  }

  @ApiOperation({ 
    summary: 'Update performance review status',
    description: 'Updates the status of a performance review (e.g., draft, in-progress, completed, acknowledged). The review is identified by its ID, and the new status is provided in the request body. The user information is extracted from the JWT token to determine access permissions and track who performed the status update. Different roles may have different permissions for updating status depending on the current status of the review.'
  })
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ReviewStatus,
    @Request() req,
  ) {
    return this.performanceReviewsService.updateStatus(id, status, req.user);
  }

  @ApiOperation({ 
    summary: 'Add employee comments to a review',
    description: 'Allows an employee to add their comments or feedback to a performance review where they are the subject. This operation is restricted to employees with the EMPLOYEE role. The review is identified by its ID, and the comments are provided in the request body. The user information is extracted from the JWT token to verify that the employee is the subject of the review and to track who added the comments.'
  })
  @Roles(Role.EMPLOYEE)
  @Patch(':id/comments')
  addEmployeeComments(
    @Param('id') id: string,
    @Body('comments') comments: string,
    @Request() req,
  ) {
    return this.performanceReviewsService.addEmployeeComments(
      id,
      comments,
      req.user,
    );
  }

  @ApiOperation({ 
    summary: 'Get all reviews for a specific employee',
    description: 'Retrieves all performance reviews for a specific employee identified by their ID. Regular employees can only access their own reviews, while HR staff and managers can access reviews for employees they manage. The user information is extracted from the JWT token to determine access permissions. This endpoint is useful for viewing an employee\'s performance history over time.'
  })
  @Get('employee/:employeeId')
  getEmployeeReviews(@Param('employeeId') employeeId: string, @Request() req) {
    return this.performanceReviewsService.getEmployeeReviews(
      employeeId,
      req.user,
    );
  }
}
