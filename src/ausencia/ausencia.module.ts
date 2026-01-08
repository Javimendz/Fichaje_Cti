import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ausencia } from './entities/ausencia.entity';
import { AusenciasService } from './ausencia.service';
import { AusenciaController } from './ausencia.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Ausencia])],
  controllers:  [AusenciaController],
  providers: [AusenciasService],
  exports: [AusenciasService],
})
export class AusenciasModule {}
