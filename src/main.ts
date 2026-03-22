import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true,
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    })
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('LuckyColor Admin Serve API')
    .setDescription(
      'LuckyColor 多租户后台服务接口文档。当前统一前缀为 /api，后续如需增量升级，可在现有模块基础上扩展版本路由。'
    )
    .setVersion('1.0.0')
    .addServer('/api', '当前 API 基准前缀')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true
    }
  });

  const port = Number(process.env.PORT || 3001);
  await app.listen(port);
  Logger.log(`Server running at http://127.0.0.1:${port}/api`, 'Bootstrap');
  Logger.log(`Swagger docs at http://127.0.0.1:${port}/docs`, 'Bootstrap');
}

void bootstrap();
