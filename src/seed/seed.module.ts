// src/seeds/seeds.module.ts
import { Module } from '@nestjs/common';
import { SeedsService } from './seed.service';
import { SeedsController } from './seed.controller';
import { UserModule } from '../users/user.module';
import { AllowedPhonesModule } from '../allowed-phones/allowed-phones.module';
import { EmpresaService } from 'empresa/empresa.service';
import { EmpresaModule } from 'empresa/empresa.module';
import { AuthModule } from 'auth/auth.module';
/**
 * SeedModule
 * Módulo encargado de la inicialización de datos básicos en el sistema.
 * Importa los módulos necesarios para la gestión de usuarios,
 * teléfonos permitidos y empresas.
 * Proporciona el SeedsService para ejecutar el seed
 * y el SeedsController para exponer un endpoint que permita
 * disparar la inicialización de datos.
 * @see SeedsService para la lógica de inicialización de datos.
 * @see SeedsController para el endpoint de inicialización.
 * 
 */
@Module({
  imports: [UserModule, AllowedPhonesModule, EmpresaModule, AuthModule], 
  controllers: [SeedsController], // <- Controller incluido
  providers: [SeedsService, EmpresaService],
  exports: [SeedsService],
})
export class SeedModule {}

