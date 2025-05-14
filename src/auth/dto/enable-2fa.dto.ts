import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Enable2faDto {
  @ApiProperty({
    description: 'The verification code from the authenticator app',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  twoFactorCode: string;
}