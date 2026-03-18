import { Module } from '@nestjs/common';
import { CodigoAccesoService } from './codigo-acceso.service';
import { CodigoAccesoController } from './codigo-acceso.controller';

@Module({
  controllers: [CodigoAccesoController],
  providers: [CodigoAccesoService],
})
export class CodigoAccesoModule {}
