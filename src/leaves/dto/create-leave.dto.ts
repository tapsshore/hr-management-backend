import { IsEnum, IsDateString, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeaveType } from '../entities/leave.entity';

export class CreateLeaveDto {
  @ApiProperty({ enum: LeaveType })
  @IsEnum(LeaveType)
  @IsNotEmpty()
  type: LeaveType;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  endDate: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;
} 