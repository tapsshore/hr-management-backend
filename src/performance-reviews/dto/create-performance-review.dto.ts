import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Rating } from '../entities/performance-review.entity';

export class CreatePerformanceReviewDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reviewPeriod: string;

  @ApiProperty({ enum: Rating, required: false })
  @IsOptional()
  @IsEnum(Rating)
  overallRating?: Rating;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  strengths: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  areasForImprovement: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  goals: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  reviewDate: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  nextReviewDate?: Date;
}
