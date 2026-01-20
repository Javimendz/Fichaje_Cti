import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmpresasService } from './empresas.service';
import { EmpresasController } from './empresas.controller';
import { Empresa } from './entities/empresa.entity';
import { User } from 'auth/entities/user.entity';
import { AuthModule } from 'auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Empresa, User]), AuthModule],
  controllers: [EmpresasController],
  providers: [EmpresasService],
  exports: [EmpresasService, TypeOrmModule],
})
export class EmpresasModule {}