import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ApiResponseInterceptor } from './common/api-response.interceptor';
import { GlobalHttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ApiResponseInterceptor());
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('SPX Dispatch Service API (Domain 2)')
    .setDescription('Điều phối vận đơn, gán tài xế & tác nghiệp Shipper (Port 8083)')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const port = Number(process.env.PORT || 8083);
  await app.listen(port);
  console.log(`Dispatch Service running on port ${port}`);
}
bootstrap();
