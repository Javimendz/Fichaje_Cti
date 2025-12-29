import { Module } from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { CheckinsController } from './checkins.controller';

@Module({
  controllers: [CheckinsController],
  providers: [CheckinsService],
})
export class CheckinsModule {}
