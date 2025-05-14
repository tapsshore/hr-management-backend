import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/enums/role.enum';

export class AssignRoleDto {
  @ApiProperty({
    description: 'The role to assign to the employee',
    enum: Role,
    example: Role.HR_MANAGER,
  })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}