import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FranjaHoraria } from './entities/franja-horaria.entity';
import { DistribucionDia } from 'schedule/entities/distribucion-dia.entity';
import { TimeSlotService } from './timeSlot.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FranjaHoraria, DistribucionDia])
  ],
  providers: [TimeSlotService],
  exports: [TimeSlotService], // Para que SeedsService lo vea
})
export class TimeSlotModule {}