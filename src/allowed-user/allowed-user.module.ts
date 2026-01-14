import { Module } from '@nestjs/common';
import { AllowedUserService } from './allowed-user.service';
import { AllowedUserController } from './allowed-user.controller';

@Module({
  controllers: [AllowedUserController],
  providers: [AllowedUserService],
})
export class AllowedUserModule {}
