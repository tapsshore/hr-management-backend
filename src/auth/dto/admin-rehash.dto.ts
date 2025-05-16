import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminRehashDto {
  @ApiProperty({ description: 'Admin secret key to authorize this operation' })
  @IsString()
  @IsNotEmpty()
  adminSecret: string;
}