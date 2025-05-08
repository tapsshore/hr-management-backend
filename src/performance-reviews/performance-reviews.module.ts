import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceReviewsService } from './performance-reviews.service';
import { PerformanceReviewsController } from './performance-reviews.controller';
import { PerformanceReview } from './entities/performance-review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PerformanceReview])],
  controllers: [PerformanceReviewsController],
  providers: [PerformanceReviewsService],
  exports: [PerformanceReviewsService],
})
export class PerformanceReviewsModule {} 