import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Servicios y Controladores
import { SolicitudesService } from './solicitud.service';
import { SolicitudesController } from './solicitud.controller';

// Entidades
import { Solicitud } from './entities/solicitud.entity';
import { RevisionSolicitud } from './entities/revision-solicitud.entity';
// Corregido: Ruta relativa correcta (ajusta según tu carpeta real)
import { Ausencia } from '../ausencia/entities/ausencia.entity'; 

// Importa el AuthModule para los Guards
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    // Registramos las 3 entidades para que el Repositorio pueda inyectarlas
    TypeOrmModule.forFeature([
      Solicitud, 
      RevisionSolicitud, 
      Ausencia
    ]),
    // Necesario para que el @GetUser() y los Guards funcionen
    AuthModule, 
  ],
  controllers: [SolicitudesController],
  providers: [SolicitudesService],
  // Exportamos el servicio por si otros módulos (como Fichajes) 
  // necesitan verificar si un usuario tiene una ausencia activa
  exports: [SolicitudesService],
})
export class SolicitudesModule {}