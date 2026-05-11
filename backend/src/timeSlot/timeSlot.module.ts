import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FranjaHoraria } from './entities/franja-horaria.entity';
import { DistribucionDia } from '../schedule/entities/distribucion-dia.entity';
import { TimeSlotService } from './timeSlot.service';
import { TimeSlotController } from './timeSlot.controller';

@Module({
  imports: [
    // 👇 Registramos AMBAS entidades para que los Repositorios funcionen en el Servicio
    TypeOrmModule.forFeature([FranjaHoraria, DistribucionDia]),
  ],
  controllers: [TimeSlotController],
  providers: [TimeSlotService],
  exports: [TimeSlotService], // Exportar si lo usas en otros módulos
})
export class TimeSlotModule {}