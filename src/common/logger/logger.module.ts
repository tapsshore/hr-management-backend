import { Module, Global } from '@nestjs/common';
import { WinstonLoggerService } from './logger.service';

@Global()
@Module({
  providers: [
    {
      provide: 'APP_LOGGER',
      useClass: WinstonLoggerService,
    },
  ],
  exports: ['APP_LOGGER'],
})
export class LoggerModule {}
