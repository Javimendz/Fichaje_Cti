// src/seeds/seeds.module.ts
import { Module } from '@nestjs/common';
import { SeedsService } from './seed.service';
import { SeedsController } from './seed.controller';
import { UsersModule } from '../users/users.module';
import { AllowedPhonesModule } from '../allowed-phones/allowed-phones.module';

@Module({
  imports: [UsersModule, AllowedPhonesModule],
  controllers: [SeedsController], // <- Controller incluido
  providers: [SeedsService],
})
export class SeedModule {}

