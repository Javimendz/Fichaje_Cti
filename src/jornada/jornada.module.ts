import { Module } from '@nestjs/common';
import { JornadaController } from './jornada.controller';
import { Type } from 'class-transformer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Jornada } from './entities/jornada.entity';
import { JornadasService } from './jornada.service';
@Module({
  imports: [TypeOrmModule.forFeature([Jornada])],
  controllers: [JornadaController],
  providers:  [JornadasService],
  exports: [JornadasService],
})
export class JornadaModule {}
