import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PerformanceReview,
  ReviewStatus,
} from './entities/performance-review.entity';
import { CreatePerformanceReviewDto } from './dto/create-performance-review.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class PerformanceReviewsService {
  constructor(
    @InjectRepository(PerformanceReview)
    private performanceReviewRepository: Repository<PerformanceReview>,
  ) {}

  async create(
    createReviewDto: CreatePerformanceReviewDto,
    reviewerId: string,
  ): Promise<PerformanceReview> {
    const review = this.performanceReviewRepository.create({
      ...createReviewDto,
      reviewerId,
      status: ReviewStatus.DRAFT,
    });

    return this.performanceReviewRepository.save(review);
  }

  async findAll(
    user: any,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: PerformanceReview[]; total: number }> {
    const queryBuilder = this.performanceReviewRepository.createQueryBuilder('review');

    if (user.role === Role.EMPLOYEE) {
      queryBuilder.where('review.employeeId = :employeeId', {
        employeeId: user.employeeNumber,
      });
    } else if (user.role === Role.MANAGER) {
      queryBuilder.where('review.reviewerId = :reviewerId', {
        reviewerId: user.employeeNumber,
      });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('review.reviewDate', 'DESC')
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string, user: any): Promise<PerformanceReview> {
    const review = await this.performanceReviewRepository.findOne({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Performance review not found');
    }

    if (
      user.role === Role.EMPLOYEE &&
      review.employeeId !== user.employeeNumber
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (
      user.role === Role.MANAGER &&
      review.reviewerId !== user.employeeNumber
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return review;
  }

  async updateStatus(
    id: string,
    status: ReviewStatus,
    user: any,
  ): Promise<PerformanceReview> {
    const review = await this.findOne(id, user);

    if (user.role === Role.EMPLOYEE && status !== ReviewStatus.COMPLETED) {
      throw new ForbiddenException('Employees can only mark reviews as completed');
    }

    if (user.role === Role.MANAGER && review.reviewerId !== user.employeeNumber) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    review.status = status;
    return this.performanceReviewRepository.save(review);
  }

  async addEmployeeComments(
    id: string,
    comments: string,
    user: any,
  ): Promise<PerformanceReview> {
    const review = await this.findOne(id, user);

    if (user.role !== Role.EMPLOYEE || review.employeeId !== user.employeeNumber) {
      throw new ForbiddenException('Only the employee can add their comments');
    }

    if (review.status !== ReviewStatus.IN_PROGRESS) {
      throw new BadRequestException('Review is not in progress');
    }

    review.employeeComments = comments;
    return this.performanceReviewRepository.save(review);
  }

  async getEmployeeReviews(
    employeeId: string,
    user: any,
  ): Promise<PerformanceReview[]> {
    if (
      user.role === Role.EMPLOYEE &&
      user.employeeNumber !== employeeId
    ) {
      throw new ForbiddenException('You can only view your own reviews');
    }

    return this.performanceReviewRepository.find({
      where: { employeeId },
      order: { reviewDate: 'DESC' },
    });
  }
} 