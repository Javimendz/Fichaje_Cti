import { Module } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { LeavesController } from './leaves.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Leave } from './entities/leaf.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Leave]), 
  ],
  providers: [LeavesService],
  controllers: [LeavesController],
  exports: [TypeOrmModule, LeavesService],
})
export class LeavesModule {}
