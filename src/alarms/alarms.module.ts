import { forwardRef, Module } from '@nestjs/common';
import { AlarmsService } from './alarms.service';
import { AlarmController } from './alarms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alarm } from './entities/alarm.entity';
import { User } from 'users/entities/user.entity';
import { AlarmCronService } from './alarms.crone.service';
import { ScheduleModule } from '@nestjs/schedule';
import { Workday } from 'workday/entities/workday.entity';
import { WorkdayModule } from 'workday/workday.module';
import { AlarmsGateway } from './gateway/alarms.gateway';
import { Ausencia } from 'absence/entities/ausencia.entity';

@Module({
imports: [
    TypeOrmModule.forFeature([Alarm, User, Workday,Ausencia]),
    ScheduleModule.forRoot(),
    forwardRef(() => WorkdayModule), 
  ],
  controllers: [AlarmController],
  providers: [AlarmsService, AlarmCronService,AlarmsGateway],
  exports: [AlarmsService,AlarmsGateway],
})
export class AlarmsModule {}
