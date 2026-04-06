import { forwardRef, Module } from '@nestjs/common';
import { WorkdayController } from './workday.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workday } from './entities/workday.entity';
import { WorkdayService } from './workday.service';
import { User } from 'auth/entities/user.entity';
import { AlarmsModule } from 'alarms/alarms.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { AbsenceModule } from 'absence/absense.module';
import { Ausencia } from 'absence/entities/ausencia.entity';


// El módulo de Workday se encarga de gestionar las jornadas laborales dentro del sistema. Incluye la entidad Workday, el servicio WorkdayService que contiene la lógica de negocio, y el controlador WorkdayController que maneja las solicitudes HTTP relacionadas con las jornadas laborales. Además, importa la entidad User para gestionar las relaciones entre jornadas laborales y usuarios. El módulo exporta el WorkdayService para que pueda ser utilizado en otros módulos del sistema.
/**
 * * * WorkdayModule
 * * Gestiona las jornadas laborales dentro del sistema. Incluye la entidad Workday, el servicio WorkdayService que contiene la lógica de negocio, y el controlador WorkdayController que maneja las solicitudes HTTP relacionadas con las jornadas laborales. Además, importa la entidad User para gestionar las relaciones entre jornadas laborales y usuarios. El módulo exporta el WorkdayService para que pueda ser utilizado en otros módulos del sistema.
 * 
 * */
@Module({
 imports: [
    // 1. Agregamos Ausencia aquí para que el repositorio esté disponible en WorkdayService
    TypeOrmModule.forFeature([Workday, User, Ausencia]), 
    
    // 2. Usamos forwardRef si ScheduleModule también importa WorkdayModule
    forwardRef(() => ScheduleModule), 
    
    // 3. AlarmsModule y AbsenceModule proporcionan los servicios necesarios para las auditorías
    forwardRef(() => AlarmsModule), 
    AbsenceModule,
  ],
  controllers: [WorkdayController],
  providers:  [WorkdayService],
  exports: [WorkdayService],
})
export class WorkdayModule {}
