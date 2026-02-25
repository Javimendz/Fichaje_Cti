import { forwardRef, Module } from '@nestjs/common';
import { AlarmsService } from './alarms.service';
import { AlarmController } from './alarms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alarm } from './entities/alarm.entity';
import { User } from 'users/entities/user.entity';
import { AlarmCronService } from './alarms.crone.service';
import { ScheduleModule } from '@nestjs/schedule';
import { Leave } from 'leaves/entities/leaf.entity';
import { Workday } from 'workday/entities/workday.entity';
import { WorkdayModule } from 'workday/workday.module';
import { AlarmsGateway } from './gateway/alarms.gateway';

@Module({
imports: [
    TypeOrmModule.forFeature([Alarm, User, Workday, Leave]),
    ScheduleModule.forRoot(),
    forwardRef(() => WorkdayModule), 
  ],
  controllers: [AlarmController],
  providers: [AlarmsService, AlarmCronService,AlarmsGateway],
  exports: [AlarmsService,AlarmsGateway],
})
export class AlarmsModule {}
