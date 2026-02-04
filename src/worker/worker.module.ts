import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { WorkerController } from './worker.controller';
import { Type } from 'class-transformer';
import { AllowedUser } from './entities/allowed-user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([AllowedUser]), AuthModule],
  controllers: [WorkerController],
  providers: [WorkerService],
  exports: [WorkerService],
})
export class WorkerModule {}
