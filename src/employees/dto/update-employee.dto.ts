import { IsEmail, IsString, IsOptional, IsEnum, IsArray, IsDate, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '../../common/enums/role.enum';
import { ContractType } from '../../common/enums/contract-type.enum';

export class UpdateEmployeeDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsArray()
  @IsEnum(Role, { each: true })
  @IsOptional()
  roles?: Role[];

  @IsString()
  @IsOptional()
  position?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsEnum(ContractType)
  @IsOptional()
  contractType?: ContractType;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}