import { forwardRef, Module } from '@nestjs/common';
import { AlarmsService } from './alarms.service';
import { AlarmController } from './alarms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alarm } from './entities/alarm.entity';
import { User } from '../users/entities/user.entity';
import { AlarmCronService } from './alarms.crone.service';
import { ScheduleModule as CronModule } from '@nestjs/schedule';
import { Workday } from '../workday/entities/workday.entity';
import { WorkdayModule } from '../workday/workday.module';
import { AlarmsGateway } from './gateway/alarms.gateway';
import { Ausencia } from '../absence/entities/ausencia.entity';
import { ScheduleModule as UserScheduleModule } from '../schedule/schedule.module';
// AlarmsModule
// Módulo para manejar operaciones relacionadas con alarmas
//
// Importaciones:
// - TypeOrmModule: Para acceder a la entidad Alarm y User.
// - ScheduleModule: Para programar tareas cron.
// - forwardRef: Para resolver dependencias circulares.
// - WorkdayModule: Para acceder a la entidad Workday.
//
// Controladores:
// - AlarmController: Para manejar operaciones relacionadas con alarmas.
//
// Proveedores:
// - AlarmsService: Para manejar lógica de negocio relacionada con alarmas.
// - AlarmCronService: Para programar tareas cron relacionadas con alarmas.
// - AlarmsGateway: Para manejar conexiones WebSocket relacionadas con alarmas.
//
// Exportaciones:
// - AlarmsService: Para ser utilizado en otros módulos.
// - AlarmsGateway: Para ser utilizado en otros módulos.
@Module({
imports: [
    TypeOrmModule.forFeature([Alarm, User, Workday,Ausencia]), 
    CronModule.forRoot(), // 👈 3. Usamos el alias para los @Cron
    
    UserScheduleModule,
   
    forwardRef(() => WorkdayModule), 
  ],
  controllers: [AlarmController],
  providers: [AlarmsService, AlarmCronService,AlarmsGateway],
  exports: [AlarmsService,AlarmsGateway],
})
export class AlarmsModule {}
