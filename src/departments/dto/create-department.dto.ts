import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  headId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  parentDepartmentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  budget?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location?: string;
} 