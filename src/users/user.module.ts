import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { AllowedPhonesModule } from 'allowed-phones/allowed-phones.module';
import { Empresa } from 'empresa/entities/empresa.entity';
import { EmpresaModule } from 'empresa/empresa.module';
import { UserController } from './user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AllowedPhonesModule, EmpresaModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService,TypeOrmModule],
})
export class UserModule {}