import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/enums/role.enum';

export class CreateInvitationDto {
  @ApiProperty({
    description: 'Email address of the person to invite',
    example: 'employee@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    enum: Role,
    description: 'Role to assign to the invited user (defaults to EMPLOYEE if not specified)',
    example: Role.EMPLOYEE,
    required: false
  })
  @IsEnum(Role)
  @IsOptional()
  role: Role = Role.EMPLOYEE;
}
