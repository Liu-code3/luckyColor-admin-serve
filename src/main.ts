import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true,
    credentials: true
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true
  }));
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = Number(process.env.PORT || 3001);
  await app.listen(port);
  Logger.log(`Server running at http://127.0.0.1:${port}/api`, 'Bootstrap');
}

void bootstrap();
