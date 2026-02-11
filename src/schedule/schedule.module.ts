// src/schedules/schedules.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// Importar el servicio y controlador del módulo
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
// Importar las entidades necesarias
import { Horario } from './entities/schedules.entity';
import { DistribucionDia } from './entities/distribucion-dia.entity';
import { FranjaHoraria } from 'timeSlot/entities/franja-horaria.entity';
// Importar el módulo AuthModule para la autenticación
import { AuthModule } from 'auth/auth.module';
import { WorkerModule } from 'worker/worker.module';
/**
 * SchedulesModule
 * Módulo encargado de la gestión de horarios en el sistema.
 * Importa las entidades necesarias para la gestión de horarios,
 * así como el módulo de autenticación para proteger las rutas.
 * Proporciona el SchedulesService para la lógica de negocio
 * y el SchedulesController para manejar las solicitudes HTTP relacionadas con los horarios.
 * @see ScheduleService para la lógica de gestión de horarios.
 * @see ScheduleController para los endpoints de horarios.
 * @module 'schedules' define la ruta base para este módulo.
 * 
 */
@Module({
  controllers: [ScheduleController], // <- Controller incluido
  providers: [ScheduleService], // <- Servicio incluido
  imports: [ 
    AuthModule,
    // Importar las entidades de TypeORM necesarias
    TypeOrmModule.forFeature([Horario, DistribucionDia, FranjaHoraria]),  // Entidades para gestión de horarios
    WorkerModule,  // Importar AllowedUserModule para gestión de usuarios permitidos
  ],
  exports: [ScheduleService], // Exportar el servicio para usarlo en otros módulos
})
export class ScheduleModule {}