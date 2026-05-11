import { forwardRef, Module } from '@nestjs/common';
import { WorkdayController } from './workday.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workday } from './entities/workday.entity';
import { WorkdayService } from './workday.service';
import { User } from '../users/entities/user.entity';
import { Ausencia } from '../absence/entities/ausencia.entity';

import { AlarmsModule } from '../alarms/alarms.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { AbsenceModule } from '../absence/absense.module';
// REVISA ESTA LÍNEA: Asegúrate de que el archivo se llame absence.module y no absense

@Module({
  imports: [
    // 1. Entidades registradas
    TypeOrmModule.forFeature([Workday, User, Ausencia]), 
    
    // 2. Protegemos TODOS los módulos externos con forwardRef por si hay dependencias circulares
    forwardRef(() => ScheduleModule), 
    forwardRef(() => AlarmsModule), 
    forwardRef(() => AbsenceModule), // <--- Añadido forwardRef aquí
  ],
  controllers: [WorkdayController],
  providers:  [WorkdayService],
  exports: [WorkdayService],
})
export class WorkdayModule {}