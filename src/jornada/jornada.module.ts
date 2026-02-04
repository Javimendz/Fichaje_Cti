import { Module } from '@nestjs/common';
import { JornadaController } from './jornada.controller';
import { Type } from 'class-transformer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Jornada } from './entities/jornada.entity';
import { JornadaService } from './jornada.service';
import { User } from 'auth/entities/user.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Jornada, User])],
  controllers: [JornadaController],
  providers:  [JornadaService],
  exports: [JornadaService],
})
export class JornadaModule {}
