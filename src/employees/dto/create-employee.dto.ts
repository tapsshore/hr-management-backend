import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum, IsArray, IsDate, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '../../common/enums/role.enum';
import { ContractType } from '../../common/enums/contract-type.enum';

export class CreateEmployeeDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

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