import 'dotenv/config';

import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  /**
   * Global timezone setting
   * 
   * Configura la zona horaria globalmente para la aplicación.
   * setGlobalPrefix('api') establece un prefijo global para todas las rutas de la API.
   * enableCors configura las políticas de CORS para permitir solicitudes desde el frontend.
   * useGlobalPipes aplica tuberías de validación globalmente para validar y transformar las solicitudes entrantes.
   * Estas configuraciones aseguran que la aplicación maneje correctamente las solicitudes y respuestas
   * de acuerdo con las necesidades del proyecto.
   * app.listen inicia el servidor en el puerto especificado en las variables de entorno o en el puerto 3000 por defecto.
   * @see https://docs.nestjs.com/techniques/security#global-prefix
   * 
   */
  process.env.TZ = 'Europe/Madrid';
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api')
  app.use(cookieParser())
   app.enableCors({
    origin: 'http://localhost:3001', // frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  // Configuración del interceptor global
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
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