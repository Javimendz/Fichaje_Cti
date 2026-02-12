import 'dotenv/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
// 1. CAMBIO CRÍTICO: Importación compatible con TS/Node para cookie-parser
import cookieParser from 'cookie-parser';

async function bootstrap() {
  process.env.TZ = 'Europe/Madrid';
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // 2. Ejecutar el middleware antes que cualquier otra cosa
  //app.use(cookieParser());

  // 3. Configurar CORS para el puerto 3567
  app.enableCors({
  origin: 'http://localhost:3567',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type, Authorization', 
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

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  console.log('--- CONFIGURACIÓN INICIADA ---');
  console.log(` Servidor en: http://localhost:${port}/api`);
  console.log(` CORS permitido para: http://localhost:3567`);
}
bootstrap();