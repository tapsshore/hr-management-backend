import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ 
    summary: 'Get hello message', 
    description: 'Returns a welcome message from the application. This endpoint serves as a health check to verify the API is running properly.'
  })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
