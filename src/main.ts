import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  // Global pipes for validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Global filters for error handling
  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable CORS
  app.enableCors();

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('HR Management API')
    .setDescription('API for managing employees and documents')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // Export swagger json to file
  // This will create a swagger.json file in the project root directory
  const swaggerJsonPath = path.resolve(process.cwd(), 'swagger.json');
  fs.writeFileSync(swaggerJsonPath, JSON.stringify(document, null, 2));
  logger.log(`Swagger JSON exported to: ${swaggerJsonPath}`);

  // Add endpoint to serve swagger json
  // The Swagger JSON can be accessed at: http://localhost:3000/api-json
  app.use('/api-json', (req, res) => {
    res.json(document);
  });

  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
