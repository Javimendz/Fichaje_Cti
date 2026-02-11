import { Module } from '@nestjs/common';
import { WorkdayController } from './workday.controller';
import { Type } from 'class-transformer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workday } from './entities/workday.entity';
import { WorkdayService } from './workday.service';
import { User } from 'auth/entities/user.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Workday, User])],
  controllers: [WorkdayController],
  providers:  [WorkdayService],
  exports: [WorkdayService],
})
export class WorkdayModule {}
