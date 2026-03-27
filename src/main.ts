import 'reflect-metadata';
import { HttpStatus, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfigService } from './shared/config/app-config.service';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig = app.get(AppConfigService);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true,
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
    })
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  if (appConfig.swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('LuckyColor Admin Serve API')
      .setDescription(
        'LuckyColor multi-tenant admin service API docs. All endpoints are exposed under the /api prefix.'
      )
      .setVersion('1.0.0')
      .addServer('/api', 'Current API base path')
      .addBearerAuth()
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, {
      deepScanRoutes: true
    });

    SwaggerModule.setup('docs', app, swaggerDocument, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha'
      }
    });
  }

  const port = appConfig.port;
  await app.listen(port);
  Logger.log(`Server running at http://127.0.0.1:${port}/api`, 'Bootstrap');
  if (appConfig.swaggerEnabled) {
    Logger.log(`Swagger docs at http://127.0.0.1:${port}/docs`, 'Bootstrap');
  }
}

void bootstrap();
