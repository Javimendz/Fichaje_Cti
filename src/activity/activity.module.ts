import { Module } from '@nestjs/common';
import { ActividadService } from './activity.service';
import { ActividadController } from './activity.controller';
import { Activity } from './entities/activity.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Activity])],
  controllers: [ActividadController],
  providers: [ActividadService],
  exports: [ActividadService],
})
export class ActivityModule {}
