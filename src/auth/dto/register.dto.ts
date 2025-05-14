import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsDateString,
  MinLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';
import { ContractType } from '../../common/enums/contract-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Tapiwanashe' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Shoshore' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'tapiwanasheshoshore@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'EMP123456' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9]+$/, { message: 'Employee number must contain only alphanumeric characters' })
  employeeNumber: string;

  @ApiProperty({ example: '+263771792254' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Phone number must be in E.164 format' })
  phoneNumber: string;

  @ApiProperty({ 
    example: 'StrongP@ss123', 
    description: 'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character' 
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
    message: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @ApiProperty({ enum: Role, example: Role.EMPLOYEE, required: false, description: 'Role will default to EMPLOYEE if not specified. First user will automatically be ADMIN.' })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiProperty({ example: '2025-04-27' })
  @IsDateString()
  @IsNotEmpty()
  contractStartDate: string;

  @ApiProperty({ example: '2030-04-27', required: false })
  @IsDateString()
  @IsOptional()
  contractEndDate?: string;

  @ApiProperty({ enum: ContractType, example: ContractType.PERMANENT, required: false })
  @IsEnum(ContractType)
  @IsOptional()
  contractType?: ContractType;

  @ApiProperty({ example: 'Harare, Zimbabwe', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: 'Software Engineer', required: false })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440000', 
    required: false,
    description: 'UUID of the department. Must be a valid UUID.'
  })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, {
    message: 'departmentId must be a valid UUID',
  })
  departmentId?: string;
}
