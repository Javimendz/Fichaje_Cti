import { Module } from '@nestjs/common';
import { AllowedUserService } from './allowed-user.service';
import { AllowedUserController } from './allowed-user.controller';
import { Type } from 'class-transformer';
import { AllowedUser } from './entities/allowed-user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([AllowedUser]), AuthModule],
  controllers: [AllowedUserController],
  providers: [AllowedUserService],
  exports: [AllowedUserService],
})
export class AllowedUserModule {}
