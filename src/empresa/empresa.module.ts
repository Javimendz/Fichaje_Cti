import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresaService } from './empresa.service';
import { EmpresaController } from './empresa.controller';
import { Empresa } from './entities/empresa.entity';

import { AuthModule } from 'auth/auth.module';
import { User } from 'auth/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Empresa, User]), AuthModule],
  controllers: [EmpresaController],
  providers: [EmpresaService],
  exports: [EmpresaService, TypeOrmModule],
})
export class EmpresaModule {}