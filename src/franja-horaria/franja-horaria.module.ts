import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FranjaHoraria } from './entities/franja-horaria.entity';
import { DistribucionDia } from 'schedules/entities/distribucion-dia.entity';
import { FranjasHorariasService } from './franja-horaria.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FranjaHoraria, DistribucionDia])
  ],
  providers: [FranjasHorariasService],
  exports: [FranjasHorariasService], // Para que SeedsService lo vea
})
export class FranjasHorariasModule {}