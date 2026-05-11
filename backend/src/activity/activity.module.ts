import { Module } from '@nestjs/common';
import { ActividadService } from './activity.service';
import { ActividadController } from './activity.controller';
import { Activity } from './entities/activity.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';

/**
 *  Módulo para la gestión de actividades (puestos de trabajo)
 * 
 * Este módulo proporciona las funcionalidades necesarias para la gestión de actividades,
 * como la creación, actualización, desactivación y consulta de puestos de trabajo. 
 */
@Module({
  imports: [TypeOrmModule.forFeature([Activity, User])], // Importamos la entidad Activity para que esté disponible en el módulo
  controllers: [ActividadController], // Controlador para manejar las solicitudes relacionadas con las actividades
  providers: [ActividadService], // Servicio para manejar la lógica de negocio relacionada con las actividades
  exports: [ActividadService], // Exportamos el servicio para que pueda ser utilizado en otros módulos
})
export class ActivityModule {}
