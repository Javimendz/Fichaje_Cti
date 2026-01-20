import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';

import { Horario } from './entities/horario.entity';
import { DistribucionDia } from './entities/distribucion-dia.entity';
import { FranjaHoraria } from 'franja-horaria/entities/franja-horaria.entity';

import { AuthModule } from 'auth/auth.module';
import { AllowedUserModule } from 'allowed-user/allowed-user.module';

@Module({
  controllers: [SchedulesController],
  providers: [SchedulesService],
  imports: [ 
    AuthModule,
    // 1. Aquí solo van ENTIDADES
    TypeOrmModule.forFeature([Horario, DistribucionDia, FranjaHoraria]),
    // 2. El MÓDULO va aquí afuera, en la raíz de imports
    AllowedUserModule, 
  ],
  // 3. Solo exportas lo que este módulo crea (SchedulesService)
  exports: [SchedulesService],
})
export class SchedulesModule {}