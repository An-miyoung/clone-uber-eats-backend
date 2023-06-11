import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  // localhost:3000 에서 보내는 내용을 localhost:4000 이 받을수 있도록
  app.enableCors();
  await app.listen(4000);
}
bootstrap();
