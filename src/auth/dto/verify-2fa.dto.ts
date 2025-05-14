import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Verify2faDto {
  @ApiProperty({
    description: 'The verification code from the authenticator app',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  twoFactorCode: string;

  @ApiProperty({
    description:
      'The temporary token received after successful password authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  tempToken: string;
}
