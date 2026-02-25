import { Module } from '@nestjs/common';
import { AlarmsService } from './alarms.service';
import { AlarmController } from './alarms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alarm } from './entities/alarm.entity';
import { User } from 'users/entities/user.entity';
import { Attendance } from 'attendance/entities/attendance.entity';
import { AlarmCronService } from './alarms.crone.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
imports: [
    
    TypeOrmModule.forFeature([Alarm, User, Attendance]),
    
    ScheduleModule.forRoot(), 
  ],
  controllers: [AlarmController],
  providers: [
    AlarmsService,     // servicio de lógica de alarmas
    AlarmCronService   // servicio que contiene los @Cron
  ],
  exports: [AlarmsService],
})
export class AlarmsModule {}
