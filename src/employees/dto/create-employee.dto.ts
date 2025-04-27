import {
  IsString,
  IsEmail,
  Matches,
  IsEnum,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/enums/role.enum';
import { ContractType } from '../../common/enums/contract-type.enum';

export class CreateEmployeeDto {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @Matches(/^[A-Za-z0-9]+$/)
  employeeNumber: string;

  @ApiProperty()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/)
  phoneNumber: string;

  @ApiProperty()
  @IsEnum(Role)
  role: Role;

  @ApiProperty()
  @IsDateString()
  contractStartDate: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  contractEndDate?: Date;

  @ApiProperty()
  @IsEnum(ContractType)
  contractType: ContractType;

  @ApiProperty()
  @IsString()
  location: string;

  @ApiProperty()
  @IsString()
  position: string;

  @ApiProperty()
  @IsString()
  password: string;
}
