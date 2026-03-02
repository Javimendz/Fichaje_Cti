import { Module } from '@nestjs/common';
import { ActividadService } from './activity.service';
import { ActividadController } from './activity.controller';
import { Activity } from './entities/activity.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 *  Módulo para la gestión de actividades (puestos de trabajo)
 * 
 * Este módulo proporciona las funcionalidades necesarias para la gestión de actividades,
 * como la creación, actualización, desactivación y consulta de puestos de trabajo. 
 */
@Module({
  imports: [TypeOrmModule.forFeature([Activity])], // Importamos la entidad Activity para que esté disponible en el módulo
  controllers: [ActividadController], // Controlador para manejar las solicitudes relacionadas con las actividades
  providers: [ActividadService],
  exports: [ActividadService],
})
export class ActivityModule {}
