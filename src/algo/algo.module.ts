import { Module } from '@nestjs/common';
import { AlgoService } from './algo.service';
import { AlgoController } from './algo.controller';

@Module({
  controllers: [AlgoController],
  providers: [AlgoService],
})
export class AlgoModule {}
