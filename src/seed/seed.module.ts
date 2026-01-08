// src/seeds/seeds.module.ts
import { Module } from '@nestjs/common';
import { SeedsService } from './seed.service';
import { SeedsController } from './seed.controller';
import { UsersModule } from '../users/users.module';
import { AllowedPhonesModule } from '../allowed-phones/allowed-phones.module';
import { EmpresasService } from 'empresas/empresas.service';
import { EmpresasModule } from 'empresas/empresas.module';

@Module({
  imports: [UsersModule, AllowedPhonesModule, EmpresasModule], 
  controllers: [SeedsController], // <- Controller incluido
  providers: [SeedsService, EmpresasService],
  exports: [SeedsService],
})
export class SeedModule {}

