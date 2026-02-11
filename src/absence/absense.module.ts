import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ausencia } from './entities/ausencia.entity';
import { AbsenceService } from './absence.service';
import { AbsenceController } from './absence.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Ausencia])],
  controllers:  [AbsenceController],
  providers: [AbsenceService],
  exports: [AbsenceService,TypeOrmModule],
})
export class AbsenceModule {}
