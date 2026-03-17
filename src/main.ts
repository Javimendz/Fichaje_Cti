import 'dotenv/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  process.env.TZ = 'Europe/Madrid';
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  const corsOrigin = process.env.CORS_ORIGIN?.replace(/['"]/g, '').trim() || 'http://cworker1.cticontrol.com:3567';

  // 3. Configurar CORS para el puerto 3567
  // Configuración de CORS para permitir solicitudes desde el frontend en http://localhost:3567. Se especifican los métodos HTTP permitidos, los encabezados que se pueden enviar, y se habilitan las credenciales (cookies) para permitir la autenticación basada en cookies entre el frontend y el backend.
  app.enableCors({
  origin:  corsOrigin,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type, Authorization', 
  credentials: true,
});

// 4. Configurar interceptores globales
// El ClassSerializerInterceptor se utiliza para transformar las entidades de la base de datos en objetos JSON que se envían en las respuestas HTTP. Esto permite controlar qué propiedades de las entidades se incluyen en las respuestas, utilizando decoradores como @Expose() y @Exclude() en las entidades. Al configurar este interceptor globalmente, se asegura que todas las respuestas que devuelven entidades sean automáticamente transformadas según las reglas definidas en las clases de entidad, lo que mejora la seguridad y la claridad de los datos enviados al cliente.
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  
  // 5. Configurar validación global
  // El ValidationPipe se configura globalmente para validar todas las solicitudes entrantes. La opción whitelist elimina cualquier propiedad que no esté definida en los DTOs, mientras que forbidNonWhitelisted lanza una excepción si se envían propiedades no permitidas. La opción transform convierte automáticamente los tipos de datos según lo definido en los DTOs, lo que facilita el manejo de los datos en los controladores y servicios.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 6. Iniciar el servidor
  // El puerto se toma de la variable de entorno PORT, o se usa 3000 por defecto si no está definida. Esto permite flexibilidad para configurar el puerto en diferentes entornos (desarrollo, producción, etc.) sin tener que cambiar el código.
  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  
  console.log('--- CONFIGURACIÓN INICIADA ---');
  console.log(` Servidor corriendo en puerto: ${port}`);
  console.log(` CORS habilitado para: ${corsOrigin}`);
}
bootstrap();