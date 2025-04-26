import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';
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

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  employeeNumber: string;

  @ApiProperty({ example: '0771792254' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ example: 'password' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ enum: Role, example: Role.ADMIN })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @ApiProperty({ example: '2025-04-27' })
  @IsDateString()
  @IsNotEmpty()
  contractStartDate: string;
}
