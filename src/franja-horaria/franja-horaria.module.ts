import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FranjaHoraria } from './entities/franja-horaria.entity';
import { DistribucionDia } from 'schedule/entities/distribucion-dia.entity';
import { FranjaHorariaService } from './franja-horaria.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FranjaHoraria, DistribucionDia])
  ],
  providers: [FranjaHorariaService],
  exports: [FranjaHorariaService], // Para que SeedsService lo vea
})
export class FranjaHorariaModule {}