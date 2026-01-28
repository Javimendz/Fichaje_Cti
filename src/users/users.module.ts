import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { AllowedPhonesModule } from 'allowed-phones/allowed-phones.module';
import { Empresa } from 'empresa/entities/empresa.entity';
import { EmpresasModule } from 'empresa/empresas.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AllowedPhonesModule, EmpresasModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService,TypeOrmModule],
})
export class UsersModule {}