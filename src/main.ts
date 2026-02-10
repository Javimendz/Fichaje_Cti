import 'dotenv/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  process.env.TZ = 'Europe/Madrid';
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // 1. Usa la importación de arriba (sin volver a declarar con require)
  app.use(cookieParser());

  // 2. CORS: Ajusta el puerto al que realmente usa tu Frontend
  app.enableCors({
    origin: 'http://localhost:3562', // 👈 ¡PON AQUÍ EL PUERTO DE TU FRONTEND!
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 3. El Backend suele correr en el 3000
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Backend corriendo en: http://localhost:${process.env.PORT ?? 3000}/api`);
}
bootstrap();