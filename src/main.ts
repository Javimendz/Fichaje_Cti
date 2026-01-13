import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  process.env.TZ = 'Europe/Madrid';
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api')
   app.enableCors({
    origin: 'http://localhost:3000', // frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.useGlobalPipes(  
     new ValidationPipe({ 
     whitelist: true, 
     forbidNonWhitelisted: true, 
     transform: true,
  }) 
);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();