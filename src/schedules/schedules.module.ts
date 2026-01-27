// src/schedules/schedules.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// Importar el servicio y controlador del módulo
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
// Importar las entidades necesarias
import { Horario } from './entities/schedules.entity';
import { DistribucionDia } from './entities/distribucion-dia.entity';
import { FranjaHoraria } from 'franja-horaria/entities/franja-horaria.entity';
// Importar el módulo AuthModule para la autenticación
import { AuthModule } from 'auth/auth.module';
import { AllowedUserModule } from 'allowed-user/allowed-user.module';
/**
 * SchedulesModule
 * Módulo encargado de la gestión de horarios en el sistema.
 * Importa las entidades necesarias para la gestión de horarios,
 * así como el módulo de autenticación para proteger las rutas.
 * Proporciona el SchedulesService para la lógica de negocio
 * y el SchedulesController para manejar las solicitudes HTTP relacionadas con los horarios.
 * @see SchedulesService para la lógica de gestión de horarios.
 * @see SchedulesController para los endpoints de horarios.
 * @module 'schedules' define la ruta base para este módulo.
 * 
 */
@Module({
  controllers: [SchedulesController], // <- Controller incluido
  providers: [SchedulesService], // <- Servicio incluido
  imports: [ 
    AuthModule,
    // Importar las entidades de TypeORM necesarias
    TypeOrmModule.forFeature([Horario, DistribucionDia, FranjaHoraria]),  // Entidades para gestión de horarios
    AllowedUserModule,  // Importar AllowedUserModule para gestión de usuarios permitidos
  ],
  exports: [SchedulesService], // Exportar el servicio para usarlo en otros módulos
})
export class SchedulesModule {}