import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Servicios y Controladores
import { SolicitudesService } from './request.service';
import { RequestController } from './request.controller';

// Entidades
import { Request } from './entities/request.entity';
import { RevisionRequest } from './entities/revision-request.entity';
// Corregido: Ruta relativa correcta (ajusta según tu carpeta real)
import { Ausencia } from '../absence/entities/ausencia.entity'; 

// Importa el AuthModule para los Guards
import { AuthModule } from '../auth/auth.module';

/**
 * SolicitudesModule
 * Módulo encargado de la gestión de solicitudes de los usuarios.
 * Importa las entidades necesarias para la gestión de solicitudes,
 * así como el módulo de autenticación para proteger las rutas.
 * Proporciona el SolicitudesService para la lógica de negocio
 * y el SolicitudesController para manejar las solicitudes HTTP relacionadas con las solicitudes de los usuarios.
 * @see SolicitudesService para la lógica de gestión de solicitudes.
 * @see RequestController para los endpoints de solicitudes.
 * 
 */
@Module({
  imports: [
    // Registramos las 3 entidades para que el Repositorio pueda inyectarlas
    TypeOrmModule.forFeature([
      Request, 
      RevisionRequest, 
      Ausencia
    ]),
    AuthModule, // Importar AuthModule para autenticación
  ],
  controllers: [RequestController],
  providers: [SolicitudesService],
  // Exportamos el servicio por si otros módulos (como Fichajes) 
  // necesitan verificar si un usuario tiene una ausencia activa
  exports: [SolicitudesService],
})
export class RequestModule {}